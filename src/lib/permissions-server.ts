import { auth } from "@/auth";
import { hasPermission, type NavSectionKey } from "@/lib/permissions";

/**
 * Server-side guard for API routes gated behind a nav-section permission.
 * Returns null when the request may proceed, or a ready-to-return
 * NextResponse-shaped error object when it must be rejected.
 *
 * When AUTH_ENABLED=false (legacy credentials mode, no per-user permission
 * model), this is a no-op — that mode has no concept of restricted tabs.
 */
export async function requireNavPermission(
  key: NavSectionKey
): Promise<{ status: number; error: string } | null> {
  if (process.env.AUTH_ENABLED !== "true") return null;

  const session = await auth();
  const sessionUser = session?.user as
    | (NonNullable<typeof session>["user"] & { id?: string; role?: string; permissions?: string })
    | undefined;

  if (!sessionUser?.id) return { status: 401, error: "No autorizado" };
  if (!hasPermission(sessionUser, key)) {
    return { status: 403, error: "No tenes permiso para acceder a esta sección" };
  }
  return null;
}
