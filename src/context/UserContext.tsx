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
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  users: [],
  activeUser: null,
  switchUser: () => {},
  loading: true,
});

const STORAGE_KEY = "oliwan_active_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: AppUser[]) => {
        setUsers(data);
        const savedId = localStorage.getItem(STORAGE_KEY);
        const found = data.find((u) => u.id === savedId) ?? data[0] ?? null;
        setActiveUser(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const switchUser = useCallback(
    (id: string) => {
      const user = users.find((u) => u.id === id);
      if (!user) return;
      localStorage.setItem(STORAGE_KEY, id);
      setActiveUser(user);
    },
    [users]
  );

  return (
    <UserContext.Provider value={{ users, activeUser, switchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
