// Persistence for the Vercel demo. On Vercel the SQLite file lives in /tmp,
// which is wiped on every cold start — so anything saved through the demo
// (leads, clients, proposals, notes, projects, links) silently disappeared.
//
// Fix: mirror the DB file to Vercel Blob. At cold start (instrumentation.ts)
// the latest copy is downloaded into /tmp before the app opens it; after any
// write, the file is re-uploaded. Gated on BLOB_READ_WRITE_TOKEN — locally
// (no VERCEL env) nothing changes at all.
//
// Known trade-off, fine for a 2-user demo: if two serverless instances write
// at the same moment, last upload wins.

import fs from "fs";
import path from "path";

const BLOB_PATHNAME = "oliwan/crm.db";
const TMP_DB = "/tmp/crm.db";

export function isBlobPersistEnabled(): boolean {
  return !!process.env.VERCEL && !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** Called from instrumentation.ts before the app starts serving. */
export async function restoreDbFromBlob(): Promise<void> {
  if (!isBlobPersistEnabled()) return;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob) {
      console.log("[dbPersist] no blob copy yet — seeding from the bundled DB on first write");
      return;
    }
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) throw new Error(`blob fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(TMP_DB), { recursive: true });
    fs.writeFileSync(TMP_DB, buf);
    // Stale WAL/SHM from a previous instance would shadow the restored file
    for (const suffix of ["-wal", "-shm"]) {
      try { fs.rmSync(TMP_DB + suffix); } catch {}
    }
    console.log(`[dbPersist] restored ${buf.length} bytes from Blob (${blob.uploadedAt})`);
  } catch (e) {
    console.error("[dbPersist] restore failed — continuing with bundled DB:", e);
  }
}

let uploadPending = false;

/**
 * Called (fire-and-forget) after a mutating statement runs. Deduped so a
 * burst of writes in one request produces a single upload.
 */
export async function uploadDbToBlob(checkpoint: () => void): Promise<void> {
  if (!isBlobPersistEnabled() || uploadPending) return;
  uploadPending = true;
  try {
    checkpoint(); // flush WAL so the main file is complete
    const { put } = await import("@vercel/blob");
    const buf = fs.readFileSync(TMP_DB);
    await put(BLOB_PATHNAME, buf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/octet-stream",
    });
    console.log(`[dbPersist] uploaded ${buf.length} bytes to Blob`);
  } catch (e) {
    console.error("[dbPersist] upload failed:", e);
  } finally {
    uploadPending = false;
  }
}
