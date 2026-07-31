import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

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
      // Credentials mode: read the active user name from the cookie set by UserContext
      userName = request.cookies.get("oliwan-active-name")?.value ?? null;
    }

    await db.insert(auditLogs).values({
      userId:       userId ?? null,
      action,
      resourceType,
      resourceId,
      meta: meta ? JSON.stringify({ ...meta, _actorName: userName }) : JSON.stringify({ _actorName: userName }),
    }).run();
  } catch {
    // Never let audit failures break the actual request
  }
}
