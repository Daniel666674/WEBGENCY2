import { NextResponse } from "next/server";
import { db, rawClient } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

async function purgeOrphanedUsers() {
  try {
    const { rows: before } = await rawClient.execute("SELECT COUNT(*) as cnt FROM users");
    console.log(`[/api/users] users before purge: ${before[0]?.cnt}`);

    const { rowsAffected } = await rawClient.execute(
      "DELETE FROM users WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE accounts.userId = users.id)"
    );

    if (rowsAffected) {
      console.log(`[/api/users] deleted ${rowsAffected} orphaned users`);
    }

    const { rows: after } = await rawClient.execute("SELECT COUNT(*) as cnt FROM users");
    console.log(`[/api/users] users after purge: ${after[0]?.cnt}`);
  } catch (err) {
    console.error("[/api/users] purge FAILED:", err);
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
