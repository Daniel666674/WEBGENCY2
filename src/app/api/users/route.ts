import { NextResponse } from "next/server";
import { db, rawClient } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

async function purgeOrphanedUsers() {
  try {
    await rawClient.execute(
      "DELETE FROM users WHERE id NOT IN (SELECT DISTINCT userId FROM accounts)"
    );
    try {
      await rawClient.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    } catch {}
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
