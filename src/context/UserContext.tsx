"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AppUser {
  id: string;
  name: string;
  color: string;
  isHers: boolean;
  avatar: string | null;
}

interface UserContextValue {
  users: AppUser[];
  activeUser: AppUser | null;
  switchUser: (id: string) => void;
  refetchUsers: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  users: [],
  activeUser: null,
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data: AppUser[] = await fetch("/api/users").then((r) => r.json());
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
    <UserContext.Provider value={{ users, activeUser, switchUser, refetchUsers, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
