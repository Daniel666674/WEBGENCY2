"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import {
  deriveThemeVars,
  isNight,
  DEFAULT_CONFIG,
  type ThemeConfig,
} from "@/lib/theme";

let cachedConfig: ThemeConfig | null = null;

export function ThemeEngine() {
  const { activeUser } = useUser();
  const configRef = useRef<ThemeConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    async function loadAndApply() {
      if (!cachedConfig) {
        try {
          const res = await fetch("/api/theme");
          cachedConfig = await res.json();
        } catch {
          cachedConfig = DEFAULT_CONFIG;
        }
      }
      configRef.current = cachedConfig!;
      applyTheme(configRef.current, activeUser?.isHers ?? false);
    }
    loadAndApply();
  }, [activeUser?.isHers]);

  useEffect(() => {
    function tick() {
      applyTheme(configRef.current, activeUser?.isHers ?? false);
    }

    async function onThemeUpdated() {
      try {
        const res = await fetch("/api/theme");
        cachedConfig = await res.json();
        configRef.current = cachedConfig!;
      } catch {}
      tick();
    }

    tick();
    const id = setInterval(tick, 60_000);
    window.addEventListener("theme-updated", onThemeUpdated);
    return () => {
      clearInterval(id);
      window.removeEventListener("theme-updated", onThemeUpdated);
    };
  }, [activeUser?.isHers]);

  return null;
}

function applyTheme(config: ThemeConfig, isHers: boolean) {
  const hour = new Date().getHours();
  const night = isNight(hour, config.switchHour);
  const colors = night ? { ...config.night } : { ...config.day };

  if (isHers && night) {
    colors.primary = config.herNightPrimary;
    // Derive sidebar tint from her primary
    colors.sidebar = darkenHex(config.herNightPrimary, 0.45);
  }

  const vars = deriveThemeVars(colors);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

export function reloadThemeConfig() {
  cachedConfig = null;
}
