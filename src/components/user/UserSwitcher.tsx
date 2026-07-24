"use client";

import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

export function UserSwitcher() {
  const { users, activeUser, switchUser, loading } = useUser();

  if (loading || users.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 bg-muted/60 rounded-full p-1">
      {users.map((user) => {
        const isActive = activeUser?.id === user.id;
        return (
          <button
            key={user.id}
            onClick={() => switchUser(user.id)}
            title={user.name}
            className={cn(
              "relative flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 cursor-pointer select-none",
              isActive
                ? "h-8 w-8 text-white shadow-sm scale-105"
                : "h-7 w-7 text-white/80 opacity-60 hover:opacity-90 hover:scale-105"
            )}
            style={{ backgroundColor: user.color }}
          >
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.avatar || user.name[0]
            )}
            {/* Active ring */}
            {isActive && (
              <span className="absolute inset-0 rounded-full ring-2 ring-white/40 ring-offset-1" />
            )}
            {/* Glitter indicator for her */}
            {user.isHers && isActive && (
              <span className="absolute -top-0.5 -right-0.5 text-[8px] leading-none">✨</span>
            )}
          </button>
        );
      })}
      {activeUser && (
        <span className="text-xs font-medium text-foreground/70 pr-2 pl-1">
          {activeUser.name}
        </span>
      )}
    </div>
  );
}
