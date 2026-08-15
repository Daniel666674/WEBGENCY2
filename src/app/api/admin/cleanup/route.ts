import { NextResponse } from "next/server";
import { db, rawClient } from "@/db";
import { projectTasks, users, accounts, sessions } from "@/db/schema";
import { eq, notInArray } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

export async function POST() {
  const denied = await requireApi();
  if (denied) return denied;

  // Double-check the caller is an owner.
  const { auth } = await import("@/auth");
  const session = await auth();
  const su = session?.user as { id?: string; role?: string } | undefined;
  if (su?.role !== "owner") {
    return NextResponse.json({ error: "Solo owners" }, { status: 403 });
  }

  const results: string[] = [];

  // 1. Delete ALL project tasks.
  const deletedTasks = await db.delete(projectTasks).returning({ id: projectTasks.id }).all();
  results.push(`Deleted ${deletedTasks.length} tasks`);

  // 2. Find canonical users: those linked by the accounts table.
  const accountLinks = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .all();
  const linkedIds = new Set(accountLinks.map((a) => a.userId));

  // 3. Get all users.
  const allUsers = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .all();

  // 4. Deduplicate by email — keep account-linked row.
  const canonical = new Map<string, typeof allUsers[0]>();
  const toDelete: string[] = [];

  for (const u of allUsers) {
    const key = (u.email ?? u.id).toLowerCase();
    const existing = canonical.get(key);
    if (!existing) {
      canonical.set(key, u);
    } else {
      // Keep the one linked by accounts.
      if (linkedIds.has(u.id) && !linkedIds.has(existing.id)) {
        toDelete.push(existing.id);
        canonical.set(key, u);
      } else {
        toDelete.push(u.id);
      }
    }
  }

  // 5. Delete duplicate users' sessions first (FK constraint), then the users.
  if (toDelete.length > 0) {
    for (const uid of toDelete) {
      await db.delete(sessions).where(eq(sessions.userId, uid)).run();
      // Repoint any remaining FK refs just in case.
      const email = allUsers.find((u) => u.id === uid)?.email;
      const canonicalUser = email ? canonical.get(email.toLowerCase()) : null;
      if (canonicalUser) {
        try {
          await rawClient.execute({
            sql: "UPDATE audit_logs SET user_id = ? WHERE user_id = ?",
            args: [canonicalUser.id, uid],
          });
          await rawClient.execute({
            sql: "UPDATE nba_dismissals SET user_id = ? WHERE user_id = ?",
            args: [canonicalUser.id, uid],
          });
        } catch { /* tables may not exist */ }
      }
      await db.delete(users).where(eq(users.id, uid)).run();
    }
    results.push(`Deleted ${toDelete.length} duplicate user rows`);
  }

  // 6. Add unique index if not already present.
  try {
    await rawClient.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    results.push("Unique index on users.email ensured");
  } catch { /* already exists */ }

  // 7. Report remaining users.
  const remaining = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .all();

  return NextResponse.json({
    results,
    users: remaining,
    userCount: remaining.length,
  });
}
