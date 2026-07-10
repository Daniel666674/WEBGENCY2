// Persistence for the Vercel demo. On Vercel the SQLite file lives in /tmp,
// which is wiped on every cold start — so anything saved through the demo
// (leads, clients, proposals, notes, projects, links) silently disappeared.
//
// Fix: mirror the DB file to Vercel Blob. At cold start (instrumentation.ts)
// the latest copy is downloaded into /tmp before the app opens it; after any
// write, the file is re-uploaded. Gated on BLOB_READ_WRITE_TOKEN — locally
// (no VERCEL env) nothing changes at all.
//
// Two hard-won correctness rules encoded here:
//
// 1. CDN CACHE: public blob URLs are edge-cached for ONE MONTH by default
//    and the SDK refuses values under 1 minute. Overwriting the blob does
//    NOT invalidate that cache — a plain fetch of blob.url returns the
//    month-old first version forever, which looks exactly like "changes
//    don't save". So uploads pin cacheControlMaxAge to the 60s minimum AND
//    restores cache-bust with a per-version query param (the blob's etag,
//    which comes from the list() API, not the CDN).
//
// 2. TIMEOUTS: restore runs inside instrumentation's register(), which
//    Next awaits before serving the first request of a cold start. Without
//    a timeout, a slow/unreachable blob API hangs every cold start
//    indefinitely (reproduced in a sandbox). Every network call here
//    carries an AbortSignal deadline; on timeout the app continues with
//    the bundled DB instead of hanging.
//
// Known demo-scale trade-off: concurrent writes from two instances resolve
// last-writer-wins.

import fs from "fs";
import path from "path";

const BLOB_PATHNAME = "oliwan/crm.db";
const TMP_DB = "/tmp/crm.db";
const RESTORE_TIMEOUT_MS = 8_000;
const UPLOAD_TIMEOUT_MS = 15_000;

// The @vercel/blob SDK's own abortSignal proved unreliable under a
// blackholed network (its internal retry loop keeps going), so every SDK
// call is additionally raced against a hard deadline at this layer — the
// app's code path always resumes on time even if the SDK never returns.
function withDeadline<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms deadline`)), ms).unref?.()
    ),
  ]);
}

export function isBlobPersistEnabled(): boolean {
  return !!process.env.VERCEL && !!process.env.BLOB_READ_WRITE_TOKEN;
}

export interface BlobStatus {
  exists: boolean;
  size?: number;
  uploadedAt?: string;
  etag?: string;
  url?: string;
  error?: string;
}

/** Metadata comes from the Blob API (fresh), not the CDN (cached). */
export async function getBlobStatus(): Promise<BlobStatus> {
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await withDeadline(
      list({
        prefix: BLOB_PATHNAME,
        limit: 1,
        abortSignal: AbortSignal.timeout(RESTORE_TIMEOUT_MS),
      }),
      RESTORE_TIMEOUT_MS,
      "blob list"
    );
    const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob) return { exists: false };
    return {
      exists: true,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      etag: blob.etag,
      url: blob.url,
    };
  } catch (e) {
    return { exists: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Called from instrumentation.ts before the app starts serving. */
export async function restoreDbFromBlob(): Promise<void> {
  if (!isBlobPersistEnabled()) return;
  const t0 = Date.now();
  try {
    const status = await getBlobStatus();
    if (status.error) throw new Error(`list: ${status.error}`);
    if (!status.exists || !status.url) {
      console.log("[dbPersist] no blob copy yet — seeding from the bundled DB on first write");
      return;
    }
    // Cache-bust with the etag: a unique query string per version forces the
    // CDN to fetch the latest bytes instead of serving its month-old cache.
    const freshUrl = `${status.url}?v=${encodeURIComponent(status.etag ?? Date.now().toString())}`;
    const res = await withDeadline(
      fetch(freshUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(RESTORE_TIMEOUT_MS),
      }),
      RESTORE_TIMEOUT_MS,
      "blob download"
    );
    if (!res.ok) throw new Error(`blob fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(TMP_DB), { recursive: true });
    fs.writeFileSync(TMP_DB, buf);
    // Stale WAL/SHM from a previous instance would shadow the restored file
    for (const suffix of ["-wal", "-shm"]) {
      try { fs.rmSync(TMP_DB + suffix); } catch {}
    }
    console.log(
      `[dbPersist] restored ${buf.length} bytes from Blob (uploaded ${status.uploadedAt}, etag ${status.etag}) in ${Date.now() - t0}ms`
    );
  } catch (e) {
    console.error(`[dbPersist] restore failed after ${Date.now() - t0}ms — continuing with bundled DB:`, e);
  }
}

let uploadPending = false;

export interface UploadResult {
  ok: boolean;
  size?: number;
  durationMs?: number;
  skipped?: string;
  error?: string;
}

/**
 * Called via next/server's after() once a mutating statement runs. Deduped
 * so a burst of writes in one request produces a single upload.
 */
export async function uploadDbToBlob(checkpoint: () => void): Promise<UploadResult> {
  if (!isBlobPersistEnabled()) return { ok: false, skipped: "persist disabled (no VERCEL or no token)" };
  if (uploadPending) return { ok: true, skipped: "upload already in flight" };
  uploadPending = true;
  const t0 = Date.now();
  try {
    checkpoint(); // flush WAL so the main file is complete
    const { put } = await import("@vercel/blob");
    const buf = fs.readFileSync(TMP_DB);
    await withDeadline(
      put(BLOB_PATHNAME, buf, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/octet-stream",
        cacheControlMaxAge: 60, // SDK minimum — restore cache-busts anyway
        abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      }),
      UPLOAD_TIMEOUT_MS,
      "blob upload"
    );
    const durationMs = Date.now() - t0;
    console.log(`[dbPersist] uploaded ${buf.length} bytes to Blob in ${durationMs}ms`);
    return { ok: true, size: buf.length, durationMs };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[dbPersist] upload failed after ${Date.now() - t0}ms:`, error);
    return { ok: false, durationMs: Date.now() - t0, error };
  } finally {
    uploadPending = false;
  }
}

/** Local-file side of the diagnostics picture. */
export function getTmpDbStatus(): { exists: boolean; size?: number; modifiedAt?: string } {
  try {
    const st = fs.statSync(TMP_DB);
    return { exists: true, size: st.size, modifiedAt: st.mtime.toISOString() };
  } catch {
    return { exists: false };
  }
}
