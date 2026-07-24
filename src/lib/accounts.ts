// Login accounts for the CRM. Two trusted co-founders, each with their own
// username/password so the login screen (and any audit trail) reflects who
// actually signed in — and so the app can auto-select the right person in the
// user switcher (theme, task assignment) after login.
//
// Credentials live in env vars, never in code:
//   - Owner (Daniel):   CRM_USERNAME   / CRM_PASSWORD     (also gates config)
//   - Daniela:          CRM_USERNAME_2 / CRM_PASSWORD_2
//
// If the second pair isn't set, only the owner account exists — fully
// backward compatible with the previous single-login setup.

export interface Account {
  /** Stable key, not shown to users. */
  key: "owner" | "daniela";
  username: string;
  password: string;
  /** Maps to the app user (users.is_hers) so login can pre-select them. */
  isHers: boolean;
}

export function getAccounts(): Account[] {
  const accounts: Account[] = [];

  const u1 = process.env.CRM_USERNAME;
  const p1 = process.env.CRM_PASSWORD;
  if (u1 && p1) accounts.push({ key: "owner", username: u1, password: p1, isHers: false });

  const u2 = process.env.CRM_USERNAME_2;
  const p2 = process.env.CRM_PASSWORD_2;
  if (u2 && p2) accounts.push({ key: "daniela", username: u2, password: p2, isHers: true });

  return accounts;
}

/** Client-readable cookie set on login so the UI can pre-select the app user. */
export const LOGIN_AS_COOKIE = "oliwan-login-as";
