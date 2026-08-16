import { NextResponse } from "next/server";
import { db, rawClient } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

async function purgeOrphanedUsers() {
  try {
    const { rows: done } = await rawClient.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
      args: ["2026-users-nuke-orphans"],
    });
    if (done.length > 0) return;

    // Keep ONLY users that have an accounts link (real Auth.js sign-ins).
    // Everything else is orphaned legacy data or duplicates with NULL emails.
    const { rowsAffected } = await rawClient.execute(
      "DELETE FROM users WHERE id NOT IN (SELECT DISTINCT userId FROM accounts)"
    );

    try {
      await rawClient.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    } catch {}

    await rawClient.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: ["2026-users-nuke-orphans", Date.now()],
    });

    if (rowsAffected) {
      console.log(`[/api/users] deleted ${rowsAffected} orphaned user rows`);
    }
  } catch (err) {
    console.error("[/api/users] purge failed:", err);
  }
}

export async function GET() {
  const denied = await requireApi();
  if (denied) return denied;

  try {
    await purgeOrphanedUsers();

    const rows = await db.select().from(users).orderBy(asc(users.createdAt));
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
