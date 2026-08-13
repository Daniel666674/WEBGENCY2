export interface AllowedEmailRow {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
  invitedByUserId: string | null;
  invitedByName: string | null;
  registeredUser: { id: string; email: string | null; name: string; image: string | null; lastLoginAt: string | null } | null;
}

export type UserStatus = "activo" | "invitado" | "pendiente";

/** "Pendiente" — invited, never completed a Google sign-in (no `users` row
 *  yet). "Invitado" — signed in once (the adapter created their row) but no
 *  `lastLoginAt` stamped yet, which only happens for accounts that existed
 *  before that tracking shipped. "Activo" — has a real last-sign-in stamp. */
export function statusOf(row: AllowedEmailRow): UserStatus {
  if (!row.registeredUser) return "pendiente";
  if (row.registeredUser.lastLoginAt) return "activo";
  return "invitado";
}

export const STATUS_LABELS: Record<UserStatus, string> = {
  activo: "Activo",
  invitado: "Invitado",
  pendiente: "Pendiente",
};
