"use client";

import { useUser } from "@/context/UserContext";

/**
 * Greets whoever is actually signed in.
 *
 * The dashboard is a server component, but the identity lives in
 * UserContext — which resolves from the Google session when AUTH_ENABLED is
 * on, and from the selected profile in credentials mode. Doing this client
 * side means one component works for both without threading auth through
 * the page.
 */
export function GreetingHeading() {
  const { activeUser, loading } = useUser();

  // First name only — "¡Bienvenido de vuelta, Jamer!" reads better than the
  // full legal name Google hands back.
  const firstName = activeUser?.name?.trim().split(/\s+/)[0] ?? "";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {loading || !firstName ? "¡Bienvenido de vuelta! 👋" : `¡Bienvenido de vuelta, ${firstName}! 👋`}
      </h1>
      <p className="text-muted-foreground text-sm mt-0.5">
        Aquí tienes el resumen de tu pipeline y actividad comercial.
      </p>
    </div>
  );
}
