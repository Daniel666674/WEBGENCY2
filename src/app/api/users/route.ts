import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireApi();
  if (denied) return denied;

  try {
    const rows = await db.select().from(users).orderBy(asc(users.createdAt));

    // Deduplicate by email: keep the row that has an accounts link (the one
    // Auth.js actually signs into). Duplicates exist because the raw DDL
    // lacked a UNIQUE constraint on email.
    const accountUserIds = new Set(
      (await db.select({ userId: accounts.userId }).from(accounts)).map((r) => r.userId)
    );

    const seen = new Map<string, (typeof rows)[0]>();
    for (const row of rows) {
      const key = (row.email ?? row.id).toLowerCase();
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, row);
      } else {
        // Prefer the row linked by accounts (the canonical auth row).
        if (!accountUserIds.has(existing.id) && accountUserIds.has(row.id)) {
          seen.set(key, row);
        }
      }
    }

    return NextResponse.json([...seen.values()]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
