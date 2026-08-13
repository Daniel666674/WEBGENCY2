import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const denied = await requireApi("audit");
  if (denied) return denied;


  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Number(limitParam) || 100, 500);
  // Settings > Usuarios uses this to show one person's activity — everything
  // else uses the unfiltered feed.
  const userId = searchParams.get("userId");

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      meta: auditLogs.meta,
      createdAt: auditLogs.createdAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      userColor: users.color,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(userId ? eq(auditLogs.userId, userId) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .all();

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      meta: r.meta ? (() => { try { return JSON.parse(r.meta!); } catch { return {}; } })() : {},
    }))
  );
}
