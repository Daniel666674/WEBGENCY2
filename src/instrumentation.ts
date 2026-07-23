// Runs once when the server boots, before any request is handled — the only
// safe async window to make sure the Turso schema exists before src/db's
// queries start running against it. No-op in the normal case (a Turso
// database already populated by scripts/migrate-to-turso.ts); only does
// real work against a genuinely fresh, empty database.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSchema } = await import("@/db");
    await ensureSchema();
  }
}
