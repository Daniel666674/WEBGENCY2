"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { hasPermission, permissionForPath } from "@/lib/permissions";

/**
 * Blocks pages the current user has no permission for.
 *
 * The Sidebar already hides links the user can't use, but hiding a link is
 * not a barrier — typing the URL, following a bookmark or hitting Back would
 * otherwise render the page anyway. This is the navigation-level backstop.
 *
 * It is *not* the security boundary: it runs in the browser, so the real
 * enforcement stays server-side in the API routes (requireNavPermission).
 * What this prevents is a teammate wandering into a screen that then fails
 * with a wall of 403s.
 */
export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeUser, authEnabled, loading } = useUser();

  // Credentials mode has no per-user permission model at all, and there is
  // nothing to check until we know who the user is.
  if (!authEnabled || loading || !activeUser) return <>{children}</>;

  const required = permissionForPath(pathname);
  if (!required || hasPermission(activeUser, required)) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold">No tenés acceso a esta sección</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pedile al owner que te habilite esta página desde Configuración &gt; Usuarios.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted cursor-pointer"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
