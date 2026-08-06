/**
 * Nav-section-level permission keys. One key per top-level Sidebar section
 * (src/components/layout/Sidebar.tsx `navSections`) — the granularity the
 * owner asked for: toggle whole tabs on/off per person, not per page.
 *
 * Kept here (not in Sidebar.tsx) so the server side — auth.ts, /api/me, API
 * route guards — can reference the same keys without importing client UI.
 */
export const NAV_SECTION_KEYS = ["principal", "revenue", "cuentas", "negocios", "arsenal", "config"] as const;
export type NavSectionKey = (typeof NAV_SECTION_KEYS)[number];

export const NAV_SECTION_LABELS: Record<NavSectionKey, string> = {
  principal: "Principal (Dashboard, Pipeline, Contactos, Deals, Actividades)",
  revenue: "Revenue (Ingresos, Proyecciones)",
  cuentas: "Cuentas (Clientes, Proyectos, Tareas, Solicitudes, Entregables)",
  negocios: "Negocios (Propuestas, Demos, Calculadora)",
  arsenal: "Arsenal",
  config: "Configuración y Auditoría",
};

export const ALL_PERMISSIONS: NavSectionKey[] = [...NAV_SECTION_KEYS];

/** A brand-new member starts minimal — the owner grants access deliberately
 *  rather than a new teammate landing with the full CRM open by default. */
export const DEFAULT_NEW_USER_PERMISSIONS: NavSectionKey[] = ["principal"];

export function parsePermissions(raw: string | null | undefined): NavSectionKey[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is NavSectionKey => NAV_SECTION_KEYS.includes(v));
  } catch {
    return [];
  }
}

/** The owner always has every permission — it is never stored or checked
 *  for them, so a bug in the permissions list can never lock the owner out. */
export function hasPermission(
  user: { role?: string | null; permissions?: string | string[] | null } | null | undefined,
  key: NavSectionKey
): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : parsePermissions(user.permissions);
  return perms.includes(key);
}
