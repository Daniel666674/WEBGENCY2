import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const denied = await requireApi("audit");
  if (denied) return denied;


  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Number(limitParam) || 100, 500);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");
  const resourceType = searchParams.get("resourceType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [];
  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (action) conditions.push(eq(auditLogs.action, action));
  if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType));
  if (from) conditions.push(gte(auditLogs.createdAt, new Date(from)));
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.createdAt, toDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        meta: auditLogs.meta,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        userColor: users.color,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)
      .all(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(where)
      .get(),
  ]);

  return NextResponse.json({
    entries: rows.map((r) => ({
      ...r,
      meta: r.meta ? (() => { try { return JSON.parse(r.meta!); } catch { return {}; } })() : {},
    })),
    total: countResult?.count ?? rows.length,
    limit,
    offset,
  });
}
