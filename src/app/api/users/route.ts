import { NextResponse } from "next/server";
import { db, rawClient } from "@/db";
import { users, accounts } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

async function purgeduplicates() {
  try {
    const { rows: done } = await rawClient.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
      args: ["2026-users-purge-duplicates-api"],
    });
    if (done.length > 0) return;

    const { rows: acctRows } = await rawClient.execute("SELECT DISTINCT userId FROM accounts");
    const linkedIds = new Set(acctRows.map((r) => r.userId as string));

    const { rows: allUsers } = await rawClient.execute(
      "SELECT id, email FROM users WHERE email IS NOT NULL ORDER BY created_at ASC"
    );

    const canonical = new Map<string, string>();
    const dupeIds: string[] = [];

    for (const u of allUsers) {
      const key = (u.email as string).toLowerCase();
      const existing = canonical.get(key);
      if (!existing) {
        canonical.set(key, u.id as string);
      } else if (linkedIds.has(u.id as string) && !linkedIds.has(existing)) {
        dupeIds.push(existing);
        canonical.set(key, u.id as string);
      } else {
        dupeIds.push(u.id as string);
      }
    }

    const FK_TABLES: [string, string][] = [
      ["sessions", "userId"],
      ["accounts", "userId"],
      ["activities", "assigned_user_id"],
      ["project_tasks", "assigned_user_id"],
      ["project_tasks", "created_by_user_id"],
      ["audit_logs", "user_id"],
      ["nba_dismissals", "user_id"],
      ["allowed_emails", "invited_by_user_id"],
      ["project_deliverables", "approved_by_user_id"],
      ["authenticators", "userId"],
    ];

    for (const dupId of dupeIds) {
      const email = allUsers.find((u) => u.id === dupId)?.email as string;
      const canonId = canonical.get(email.toLowerCase())!;
      for (const [table, col] of FK_TABLES) {
        try {
          await rawClient.execute({ sql: `UPDATE ${table} SET ${col} = ? WHERE ${col} = ?`, args: [canonId, dupId] });
        } catch {}
      }
      try {
        await rawClient.execute({
          sql: "UPDATE project_tasks SET assigned_user_ids = REPLACE(assigned_user_ids, ?, ?) WHERE assigned_user_ids LIKE '%' || ? || '%'",
          args: [dupId, canonId, dupId],
        });
      } catch {}
      await rawClient.execute({ sql: "DELETE FROM users WHERE id = ?", args: [dupId] });
    }

    try {
      await rawClient.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    } catch {}

    await rawClient.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: ["2026-users-purge-duplicates-api", Date.now()],
    });

    if (dupeIds.length > 0) {
      console.log(`[/api/users] purged ${dupeIds.length} duplicate user rows`);
    }
  } catch (err) {
    console.error("[/api/users] purge failed:", err);
  }
}

export async function GET() {
  const denied = await requireApi();
  if (denied) return denied;

  try {
    await purgeduplicates();

    const rows = await db.select().from(users).orderBy(asc(users.createdAt));
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
