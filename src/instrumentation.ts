// Runs once when the server boots, before any request is handled — the only
// safe async window to pull the persisted DB copy down from Vercel Blob
// before src/db/index.ts opens the file. No-op locally and without a token.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { restoreDbFromBlob } = await import("@/lib/dbPersist");
    await restoreDbFromBlob();
  }
}
