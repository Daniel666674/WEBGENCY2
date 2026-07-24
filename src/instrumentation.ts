// Runs once when the server boots, before any request is handled — the only
// safe async window to make sure the Turso schema exists before src/db's
// queries start running against it. No-op in the normal case (a Turso
// database already populated by scripts/migrate-to-turso.ts); only does
// real work against a genuinely fresh, empty database.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSchema } = await import("@/db");
    try {
      await ensureSchema();
    } catch (err) {
      // Never let a schema-bootstrap failure crash the whole server boot —
      // that would take down every route on every request hitting this
      // instance. Log it clearly (Vercel Runtime Logs) and let the app
      // start; any request that actually touches the DB will then fail on
      // its own with a normal per-request error instead of a global outage.
      console.error("ensureSchema() failed during boot:", err);
    }
  }
}
