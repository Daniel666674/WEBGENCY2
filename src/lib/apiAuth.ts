import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

/**
 * The real authentication boundary for API routes.
 *
 * proxy.ts only checks that a session *cookie is present* — it runs before
 * the database is reachable and cannot tell a valid session token from a
 * string someone typed. That check exists to redirect signed-out browsers to
 * /login, not to authorize anything. Every route that reads or writes real
 * data has to call this, which verifies the session against the database via
 * auth() and then checks the caller's permissions.
 *
 * Returns null when the request may proceed, or the response to return.
 */
export async function requireApi(
  permission?: PermissionKey,
  opts: { ownerOnly?: boolean } = {}
): Promise<NextResponse | null> {
  // Legacy credentials mode has no per-user identity or permission model;
  // proxy.ts gates it with a signed cookie instead.
  if (process.env.AUTH_ENABLED !== "true") return null;

  const session = await auth();
  const user = session?.user as
    | (NonNullable<typeof session>["user"] & { id?: string; role?: string; permissions?: string })
    | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // The owner is the superadmin: never gated, on any route, ever. Keeping
  // this as the first check means no permission bug can lock them out of
  // their own CRM.
  if (user.role === "owner") return null;

  if (opts.ownerOnly) {
    return NextResponse.json({ error: "Solo el owner puede hacer esto" }, { status: 403 });
  }

  if (permission && !hasPermission(user, permission)) {
    return NextResponse.json({ error: "No tenés permiso para esta sección" }, { status: 403 });
  }

  return null;
}

/** The signed-in user, or null. For routes that need the identity itself. */
export async function currentApiUser() {
  if (process.env.AUTH_ENABLED !== "true") return null;
  const session = await auth();
  return (session?.user as (NonNullable<typeof session>["user"] & { id?: string; role?: string }) | undefined) ?? null;
}
