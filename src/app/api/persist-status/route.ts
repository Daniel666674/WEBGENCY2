import { NextResponse } from "next/server";
import { checkpointDb } from "@/db";
import {
  isBlobPersistEnabled,
  getBlobStatus,
  getTmpDbStatus,
  uploadDbToBlob,
} from "@/lib/dbPersist";

// Diagnostics for the Vercel Blob persistence layer. Cookie-protected by the
// middleware (not in its exclusion list), so only a logged-in session can
// see it.
//
// GET  → full picture: env flags, /tmp DB file state, blob state (from the
//        Blob API, so it reflects the latest upload, not the CDN cache).
// POST → force an upload right now and return the actual result/error —
//        turns "it doesn't save" into the exact failing step.

export async function GET() {
  const enabled = isBlobPersistEnabled();
  return NextResponse.json({
    isVercel: !!process.env.VERCEL,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    persistEnabled: enabled,
    tmpDb: getTmpDbStatus(),
    blob: enabled ? await getBlobStatus() : { exists: false, error: "persist disabled" },
    hint: enabled
      ? "POST a esta misma URL para forzar una subida y ver el resultado real"
      : "Falta BLOB_READ_WRITE_TOKEN o no estamos en Vercel — conecta un Blob store en Vercel Dashboard > Storage y redeploya",
  });
}

export async function POST() {
  const result = await uploadDbToBlob(checkpointDb);
  const blob = result.ok && !result.skipped ? await getBlobStatus() : undefined;
  return NextResponse.json({ upload: result, blobAfterUpload: blob }, { status: result.ok ? 200 : 500 });
}
