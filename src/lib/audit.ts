import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

function extractIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

function extractUserAgent(request: NextRequest): string | null {
  const ua = request.headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}

/**
 * Build a compact diff of changed fields between `before` and `after`.
 * Only includes fields present in `fields`; skips unchanged values.
 * Returns `{ field: { from, to } }` or null when nothing changed.
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> | null {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  let any = false;
  for (const f of fields) {
    const bv = before[f];
    const av = after[f];
    const bs = typeof bv === "object" ? JSON.stringify(bv) : String(bv ?? "");
    const as = typeof av === "object" ? JSON.stringify(av) : String(av ?? "");
    if (bs !== as) {
      changes[f] = { from: bv ?? null, to: av ?? null };
      any = true;
    }
  }
  return any ? changes : null;
}

export async function logAudit(
  request: NextRequest,
  action: string,
  resourceType: string,
  resourceId: string,
  meta?: Record<string, unknown>
) {
  try {
    const authEnabled = process.env.AUTH_ENABLED === "true";
    let userId: string | null = null;
    let userName: string | null = null;

    if (authEnabled) {
      const session = await auth();
      const su = session?.user as ({ id?: string; name?: string | null } | undefined);
      userId   = su?.id   ?? null;
      userName = su?.name ?? null;
    } else {
      userName = request.cookies.get("oliwan-active-name")?.value ?? null;
    }

    await db.insert(auditLogs).values({
      userId:       userId ?? null,
      action,
      resourceType,
      resourceId,
      meta: meta ? JSON.stringify({ ...meta, _actorName: userName }) : JSON.stringify({ _actorName: userName }),
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    }).run();
  } catch {
    // Never let audit failures break the actual request
  }
}
