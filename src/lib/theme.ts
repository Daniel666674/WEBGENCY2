export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  sidebar: string;
  card: string;
  muted: string;
  border: string;
}

export interface DarkOverride {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
}

export interface ThemeConfig {
  switchHour: number; // 0-23, hour to switch to night theme
  day: ThemeColors;
  night: ThemeColors;
  herNightPrimary: string; // Her purple override for night
  danielDark: DarkOverride; // Daniel's dark-mode override (background/card/etc only — primary/sidebar stay as configured)
}

export const DEFAULT_DAY: ThemeColors = {
  background: "#faf7ef",
  foreground: "#1a1a2e",
  primary: "#0d9a8a",
  sidebar: "#1a3a35",
  card: "#ffffff",
  muted: "#ede9df",
  border: "#e0dbd0",
};

export const DEFAULT_NIGHT: ThemeColors = {
  background: "#fefcf3",
  foreground: "#1a1a2e",
  primary: "#7c3aed",
  sidebar: "#2d1b69",
  card: "#fffef8",
  muted: "#f0ece0",
  border: "#e8e2d0",
};

export const DEFAULT_DANIEL_DARK: DarkOverride = {
  background: "#0a0a0a",
  foreground: "#e8e8e8",
  card: "#161616",
  muted: "#1f1f1f",
  border: "#2a2a2a",
};

export const DEFAULT_CONFIG: ThemeConfig = {
  switchHour: 18,
  day: DEFAULT_DAY,
  night: DEFAULT_NIGHT,
  herNightPrimary: "#a855f7",
  danielDark: DEFAULT_DANIEL_DARK,
};

export const HER_PURPLE_PRESETS = [
  { label: "Lavanda", value: "#a855f7" },
  { label: "Violeta", value: "#7c3aed" },
  { label: "Fucsia", value: "#c026d3" },
  { label: "Malva", value: "#9333ea" },
];

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  swatch: string; // primary color for preview chip
  config: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "oliwan",
    name: "OLIWAN Original",
    description: "Verde teal + sidebar oscuro. El look clásico.",
    swatch: "#0d9a8a",
    config: DEFAULT_CONFIG,
  },
  {
    id: "midnight",
    name: "Medianoche",
    description: "Todo oscuro — estilo terminal.",
    swatch: "#0d9a8a",
    config: {
      switchHour: 0,
      day: {
        background: "#0f0f0f",
        foreground: "#e8e8e8",
        primary: "#0d9a8a",
        sidebar: "#050505",
        card: "#1a1a1a",
        muted: "#1f1f1f",
        border: "#2a2a2a",
      },
      night: {
        background: "#0f0f0f",
        foreground: "#e8e8e8",
        primary: "#0d9a8a",
        sidebar: "#050505",
        card: "#1a1a1a",
        muted: "#1f1f1f",
        border: "#2a2a2a",
      },
      herNightPrimary: "#a855f7",
      danielDark: DEFAULT_DANIEL_DARK,
    },
  },
  {
    id: "purpura",
    name: "Purpura",
    description: "Sidebar violeta, perfecto para Daniela.",
    swatch: "#7c3aed",
    config: {
      switchHour: 18,
      day: {
        background: "#faf8ff",
        foreground: "#1a1a2e",
        primary: "#7c3aed",
        sidebar: "#2d1b69",
        card: "#ffffff",
        muted: "#ede9fe",
        border: "#ddd6fe",
      },
      night: {
        background: "#faf8ff",
        foreground: "#1a1a2e",
        primary: "#a855f7",
        sidebar: "#1e0052",
        card: "#fefcff",
        muted: "#f0eaff",
        border: "#e8dcff",
      },
      herNightPrimary: "#c026d3",
      danielDark: DEFAULT_DANIEL_DARK,
    },
  },
  {
    id: "azul",
    name: "Azul Corporativo",
    description: "Azul confiable para reuniones de cliente.",
    swatch: "#2563eb",
    config: {
      switchHour: 18,
      day: {
        background: "#f8faff",
        foreground: "#1e293b",
        primary: "#2563eb",
        sidebar: "#1e3a5f",
        card: "#ffffff",
        muted: "#e8f0fe",
        border: "#d1daf7",
      },
      night: {
        background: "#f0f4ff",
        foreground: "#1e293b",
        primary: "#4f46e5",
        sidebar: "#1e1b4b",
        card: "#f8f9ff",
        muted: "#e0e7ff",
        border: "#c7d2fe",
      },
      herNightPrimary: "#a855f7",
      danielDark: DEFAULT_DANIEL_DARK,
    },
  },
  {
    id: "arena",
    name: "Arena",
    description: "Tonos cálidos y naturales. Fácil en los ojos.",
    swatch: "#b45309",
    config: {
      switchHour: 18,
      day: {
        background: "#fdf6ed",
        foreground: "#3b2f1e",
        primary: "#b45309",
        sidebar: "#2c1a0e",
        card: "#fffbf5",
        muted: "#f5e6d0",
        border: "#e8d5b5",
      },
      night: {
        background: "#fdf6ed",
        foreground: "#3b2f1e",
        primary: "#d97706",
        sidebar: "#1c0f05",
        card: "#fffdf8",
        muted: "#f7edda",
        border: "#eed8b2",
      },
      herNightPrimary: "#a855f7",
      danielDark: DEFAULT_DANIEL_DARK,
    },
  },
  {
    id: "slate",
    name: "Slate Minimal",
    description: "Gris neutro. Sin distracciones.",
    swatch: "#475569",
    config: {
      switchHour: 18,
      day: {
        background: "#f8fafc",
        foreground: "#0f172a",
        primary: "#475569",
        sidebar: "#0f172a",
        card: "#ffffff",
        muted: "#f1f5f9",
        border: "#e2e8f0",
      },
      night: {
        background: "#f8fafc",
        foreground: "#0f172a",
        primary: "#64748b",
        sidebar: "#020617",
        card: "#ffffff",
        muted: "#f1f5f9",
        border: "#e2e8f0",
      },
      herNightPrimary: "#a855f7",
      danielDark: DEFAULT_DANIEL_DARK,
    },
  },
];

export function isNight(hour: number, switchHour: number): boolean {
  return hour >= switchHour || hour < 6;
}

export function deriveThemeVars(colors: ThemeColors): Record<string, string> {
  const r = (hex: string, opacity: number) => hexToRgba(hex, opacity);
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--card": colors.card,
    "--card-foreground": colors.foreground,
    "--popover": colors.card,
    "--popover-foreground": colors.foreground,
    "--primary": colors.primary,
    "--primary-foreground": "#ffffff",
    "--secondary": lighten(colors.muted, 0.3),
    "--secondary-foreground": colors.foreground,
    "--muted": colors.muted,
    "--muted-foreground": "#6b7280",
    "--accent": lighten(colors.primary, 0.88),
    "--accent-foreground": darken(colors.primary, 0.15),
    "--destructive": "#dc2626",
    "--border": colors.border,
    "--input": colors.border,
    "--ring": colors.primary,
    "--chart-1": colors.primary,
    "--sidebar": colors.sidebar,
    "--sidebar-foreground": "#f0faf9",
    "--sidebar-primary": colors.primary,
    "--sidebar-primary-foreground": "#ffffff",
    "--sidebar-accent": darken(colors.sidebar, -0.05),
    "--sidebar-accent-foreground": "#f0faf9",
    "--sidebar-border": darken(colors.sidebar, -0.05),
    "--sidebar-ring": colors.primary,
  };
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return rgbToHex(mix(r), mix(g), mix(b));
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return rgbToHex(mix(r), mix(g), mix(b));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToRgba(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}
