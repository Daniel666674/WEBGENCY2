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
