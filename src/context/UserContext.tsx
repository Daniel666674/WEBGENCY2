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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data: AppUser[] = await fetch("/api/users").then((r) => r.json());
    setUsers(data);
    setActiveUser((current) => {
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
