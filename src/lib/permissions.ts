/**
 * Page-level permission model.
 *
 * Permissions used to be one key per top-level Sidebar section, which meant
 * granting someone "Cuentas" handed them Clientes, Proyectos, Tareas,
 * Solicitudes and Entregables all at once. The unit is now the individual
 * page, and sections exist only to group them in the UI.
 *
 * Stored values from the old model (bare section keys like "cuentas") are
 * still understood — parsePermissions() expands them into the pages they
 * used to imply, so nobody loses access on deploy.
 *
 * Kept free of client-UI imports so the server side — auth.ts, /api/me, API
 * route guards — can use the same keys.
 */

export const NAV_SECTION_KEYS = ["principal", "revenue", "cuentas", "negocios", "arsenal", "config"] as const;
export type NavSectionKey = (typeof NAV_SECTION_KEYS)[number];

export interface PermissionPage {
  key: string;
  label: string;
  /** Route this page lives at — also used to gate direct navigation. */
  href: string;
}

export interface PermissionSection {
  key: NavSectionKey;
  label: string;
  pages: PermissionPage[];
}

/** Mirrors `navSections` in src/components/layout/Sidebar.tsx. */
export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    key: "principal",
    label: "Principal",
    pages: [
      { key: "onboarding", label: "Inicio (Onboarding)", href: "/onboarding" },
      { key: "dashboard", label: "Vista General", href: "/" },
      { key: "pipeline", label: "Pipeline", href: "/pipeline" },
      { key: "contacts", label: "Contactos", href: "/contacts" },
      { key: "deals", label: "Deals", href: "/deals" },
      { key: "activities", label: "Actividades", href: "/activities" },
    ],
  },
  {
    key: "revenue",
    label: "Revenue",
    pages: [
      { key: "revenue", label: "Revenue (Ingresos)", href: "/revenue" },
      { key: "forecast", label: "Forecast (Proyecciones)", href: "/forecast" },
    ],
  },
  {
    key: "cuentas",
    label: "Cuentas",
    pages: [
      { key: "clients", label: "Clientes Activos", href: "/clients" },
      { key: "projects", label: "Proyectos", href: "/projects" },
      { key: "tareas", label: "Tareas", href: "/tareas" },
      { key: "solicitudes", label: "Solicitudes", href: "/solicitudes" },
      { key: "deliverables", label: "Entregables", href: "/deliverables" },
    ],
  },
  {
    key: "negocios",
    label: "Negocios",
    pages: [
      { key: "proposals", label: "Propuestas", href: "/proposals" },
      { key: "demos", label: "Demos", href: "/demos" },
      { key: "calculator", label: "Calculadora", href: "/calculator" },
    ],
  },
  {
    key: "arsenal",
    label: "Arsenal",
    pages: [{ key: "arsenal", label: "Arsenal", href: "/arsenal" }],
  },
  {
    key: "config",
    label: "Config",
    pages: [
      { key: "settings", label: "Configuración", href: "/settings" },
      { key: "audit", label: "Auditoría", href: "/audit" },
    ],
  },
];

export const ALL_PAGES: PermissionPage[] = PERMISSION_SECTIONS.flatMap((s) => s.pages);
export const PERMISSION_KEYS: string[] = ALL_PAGES.map((p) => p.key);
export type PermissionKey = string;

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  ALL_PAGES.map((p) => [p.key, p.label])
);

/** Which section a page belongs to — drives the grouped checkbox UI. */
export const SECTION_OF_PAGE: Record<string, NavSectionKey> = Object.fromEntries(
  PERMISSION_SECTIONS.flatMap((s) => s.pages.map((p) => [p.key, s.key]))
);

/** Legacy section key -> the pages it used to grant, all at once. */
const LEGACY_SECTION_EXPANSION: Record<string, string[]> = Object.fromEntries(
  PERMISSION_SECTIONS.map((s) => [s.key, s.pages.map((p) => p.key)])
);

export const ALL_PERMISSIONS: string[] = [...PERMISSION_KEYS];

/** A brand-new member starts minimal — the owner grants pages deliberately
 *  rather than a new teammate landing with the whole CRM open by default. */
export const DEFAULT_NEW_USER_PERMISSIONS: string[] = ["dashboard"];

/**
 * Normalizes stored permissions into a flat list of page keys, expanding any
 * legacy section key it finds. Unknown values are dropped.
 */
export function parsePermissions(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  const out = new Set<string>();
  for (const value of parsed) {
    if (typeof value !== "string") continue;
    if (LEGACY_SECTION_EXPANSION[value]) {
      // Old-model entry: grant every page that section used to cover.
      for (const page of LEGACY_SECTION_EXPANSION[value]) out.add(page);
    } else if (PERMISSION_KEYS.includes(value)) {
      out.add(value);
    }
  }
  return [...out];
}

/** The owner always has every permission — it is never stored or checked
 *  for them, so a bug in the permissions list can never lock the owner out. */
export function hasPermission(
  user: { role?: string | null; permissions?: string | string[] | null } | null | undefined,
  key: PermissionKey
): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  return parsePermissions(user.permissions).includes(key);
}

/** True when the user can reach at least one page in the section — used to
 *  decide whether the section header shows in the Sidebar at all. */
export function hasSectionPermission(
  user: { role?: string | null; permissions?: string | string[] | null } | null | undefined,
  section: NavSectionKey
): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  const perms = parsePermissions(user.permissions);
  return (LEGACY_SECTION_EXPANSION[section] ?? []).some((page) => perms.includes(page));
}

// Longest href first so /settings/perfil resolves to "settings" rather than
// being shadowed by a shorter prefix, and "/" only ever matches exactly.
const PATH_MATCHERS = ALL_PAGES.filter((p) => p.href !== "/").sort((a, b) => b.href.length - a.href.length);

/**
 * The permission key guarding a given route, or null when the route isn't
 * permission-gated (login, public demo pages, etc.).
 */
export function permissionForPath(pathname: string): PermissionKey | null {
  if (pathname === "/") return "dashboard";
  const match = PATH_MATCHERS.find((p) => pathname === p.href || pathname.startsWith(`${p.href}/`));
  return match?.key ?? null;
}

// --- Back-compat shims for callers still thinking in whole sections ---

export const NAV_SECTION_LABELS: Record<NavSectionKey, string> = Object.fromEntries(
  PERMISSION_SECTIONS.map((s) => [s.key, s.label])
) as Record<NavSectionKey, string>;
