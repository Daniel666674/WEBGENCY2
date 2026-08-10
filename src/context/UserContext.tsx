"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { parsePermissions } from "@/lib/permissions";

export interface AppUser {
  id: string;
  name: string;
  color: string;
  isHers: boolean;
  avatar: string | null;
  image: string | null;
  role: string;
  permissions: string[];
}

interface UserContextValue {
  users: AppUser[];
  activeUser: AppUser | null;
  /** True when Google OAuth is on — the only mode with a real permission
   *  model. Credentials mode has no per-user gating to enforce. */
  authEnabled: boolean;
  switchUser: (id: string) => void;
  refetchUsers: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  users: [],
  activeUser: null,
  authEnabled: false,
  switchUser: () => {},
  refetchUsers: async () => {},
  loading: true,
});

const STORAGE_KEY = "oliwan_active_user";
const LOGIN_AS_COOKIE = "oliwan-login-as";

// One-shot hint set by the login route: "his" → the owner, "hers" → Daniela.
// Read once to pre-select who logged in, then cleared so later manual switches
// (persisted in localStorage) win.
function readLoginAsHint(): "his" | "hers" | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)oliwan-login-as=(his|hers)/);
  return m ? (m[1] as "his" | "hers") : null;
}

function clearLoginAsHint() {
  if (typeof document !== "undefined") {
    document.cookie = `${LOGIN_AS_COOKIE}=; path=/; max-age=0`;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // If Google Auth is enabled, identity comes from the server session.
    const meRes = await fetch("/api/me").then((r) => r.json()).catch(() => ({ authEnabled: false }));
    setAuthEnabled(!!meRes.authEnabled);
    if (meRes.authEnabled && meRes.user) {
      const u = meRes.user as AppUser & { email?: string };
      const appUser: AppUser = {
        id: u.id,
        name: u.name,
        color: u.color ?? "#6b7280",
        isHers: u.isHers ?? false,
        avatar: u.avatar ?? null,
        image: u.image ?? null,
        role: u.role ?? "member",
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
      };
      setUsers([appUser]);
      setActiveUser(appUser);
      // Set cookie for audit logging in API routes
      document.cookie = `oliwan-active-name=${encodeURIComponent(appUser.name)}; path=/; SameSite=Lax`;
      return [appUser];
    }

    // Credentials-mode rows come straight from the DB — `permissions` is
    // still the raw JSON string column there, unlike /api/me which already
    // parses it.
    const raw: (AppUser & { permissions: unknown })[] = await fetch("/api/users").then((r) => r.json());
    const data: AppUser[] = raw.map((u) => ({
      ...u,
      role: u.role ?? "member",
      permissions: typeof u.permissions === "string" ? parsePermissions(u.permissions) : [],
    }));
    setUsers(data);
    setActiveUser((current) => {
      // A fresh login hint (whoever just signed in) takes priority once, then
      // is cleared so it doesn't override manual switches on later loads.
      const hint = readLoginAsHint();
      if (hint) {
        clearLoginAsHint();
        const wantHers = hint === "hers";
        const byLogin = data.find((u) => u.isHers === wantHers);
        if (byLogin) {
          localStorage.setItem(STORAGE_KEY, byLogin.id);
          return byLogin;
        }
      }
      const savedId = current?.id ?? localStorage.getItem(STORAGE_KEY);
      return data.find((u) => u.id === savedId) ?? data[0] ?? null;
    });
    return data;
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const switchUser = useCallback(
    (id: string) => {
      const user = users.find((u) => u.id === id);
      if (!user) return;
      localStorage.setItem(STORAGE_KEY, id);
      setActiveUser(user);
    },
    [users]
  );

  const refetchUsers = useCallback(async () => {
    await load();
  }, [load]);

  return (
    <UserContext.Provider value={{ users, activeUser, authEnabled, switchUser, refetchUsers, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
