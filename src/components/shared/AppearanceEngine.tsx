"use client";

import { useEffect, useRef, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import {
  DEFAULT_APPEARANCE,
  deriveAppearanceVars,
  resolveEffectiveMode,
  type UserAppearance,
} from "@/lib/appearance";

let cachedAppearance: UserAppearance | null = null;

export function AppearanceEngine() {
  const { activeUser } = useUser();
  const configRef = useRef<UserAppearance>(DEFAULT_APPEARANCE);
  const mediaRef = useRef<MediaQueryList | null>(null);

  const apply = useCallback(() => {
    const config = configRef.current;
    const systemPrefersDark = mediaRef.current?.matches ?? false;
    const mode = resolveEffectiveMode(config, systemPrefersDark);
    const vars = deriveAppearanceVars(config, mode);
    const root = document.documentElement;

    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }

    root.setAttribute("data-theme-mode", mode);
    root.classList.toggle("dark", mode === "dark");

    if (!config.motion.animationsEnabled) {
      root.style.setProperty("--transition-base", "0ms");
      root.style.setProperty("--transition-slow", "0ms");
    }
  }, []);

  useEffect(() => {
    async function loadAndApply() {
      if (!cachedAppearance) {
        try {
          const res = await fetch("/api/user-appearance");
          if (res.ok) {
            cachedAppearance = await res.json();
          }
        } catch {
          // Fall back to old theme endpoint for backward compat
          try {
            const res = await fetch("/api/theme");
            if (res.ok) {
              // Old theme loaded — use defaults from new system
              cachedAppearance = DEFAULT_APPEARANCE;
            }
          } catch {
            cachedAppearance = DEFAULT_APPEARANCE;
          }
        }
        if (!cachedAppearance) cachedAppearance = DEFAULT_APPEARANCE;
      }
      configRef.current = cachedAppearance;
      apply();
    }
    loadAndApply();
  }, [activeUser?.id, apply]);

  useEffect(() => {
    mediaRef.current = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply();
    mediaRef.current.addEventListener("change", handler);

    async function onAppearanceUpdated() {
      try {
        const res = await fetch("/api/user-appearance");
        if (res.ok) {
          cachedAppearance = await res.json();
          configRef.current = cachedAppearance!;
        }
      } catch { /* keep current */ }
      apply();
    }

    apply();
    const id = setInterval(apply, 60_000);
    window.addEventListener("appearance-updated", onAppearanceUpdated);
    window.addEventListener("theme-updated", onAppearanceUpdated);

    return () => {
      clearInterval(id);
      mediaRef.current?.removeEventListener("change", handler);
      window.removeEventListener("appearance-updated", onAppearanceUpdated);
      window.removeEventListener("theme-updated", onAppearanceUpdated);
    };
  }, [apply]);

  return null;
}

export function reloadAppearance() {
  cachedAppearance = null;
}
