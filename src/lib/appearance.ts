/**
 * Per-user appearance configuration — enterprise-grade theming.
 *
 * Every user gets their own appearance record keyed by user ID. The system
 * falls back to the org-wide default (stored in `crm_settings.theme_config`)
 * when a user has no personal override, and to the compiled defaults below
 * when neither exists.
 *
 * The schema covers every visual axis the UI screenshot exposes:
 *   - Theme mode (light/dark/system) with preset selection
 *   - Primary accent with amplitude slider
 *   - Full semantic color tokens (backgrounds, text, borders, states, accents)
 *   - Typography (font families, scale, weights)
 *   - Density and spacing
 *   - Form (border radii, shadow depth)
 *   - Motion (animation toggle, transition speeds)
 *   - Scheduled auto-switching (day/night with timezone)
 *   - Custom user-created theme presets
 */

// ---------------------------------------------------------------------------
// Color token sets
// ---------------------------------------------------------------------------

export interface BackgroundTokens {
  primary: string;
  surface: string;
  elevated: string;
}

export interface TextTokens {
  primary: string;
  secondary: string;
  disabled: string;
}

export interface BorderTokens {
  default: string;
  subtle: string;
  strong: string;
}

export interface StateTokens {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface AccentTokens {
  primary: string;
  hover: string;
  soft: string;
}

export interface ColorTokens {
  backgrounds: BackgroundTokens;
  text: TextTokens;
  borders: BorderTokens;
  states: StateTokens;
  accents: AccentTokens;
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  /** Base font size in px (14-18). Everything else scales from this. */
  baseFontSize: number;
  /** Type scale ratio (1.125 minor third, 1.2 major third, 1.25 major third, 1.333 perfect fourth) */
  scaleRatio: number;
  /** Default heading weight */
  headingWeight: number;
  /** Default body weight */
  bodyWeight: number;
  /** Line height for body text (1.4-1.8) */
  bodyLineHeight: number;
  /** Line height for headings (1.1-1.4) */
  headingLineHeight: number;
  /** Letter spacing for headings in em (-0.02 to 0.05) */
  headingLetterSpacing: number;
}

// ---------------------------------------------------------------------------
// Density & Spacing
// ---------------------------------------------------------------------------

export type DensityLevel = "compact" | "comfortable" | "spacious";

export interface DensityConfig {
  level: DensityLevel;
  /** Base spacing unit in px (4, 6, 8) — everything multiplies from this */
  baseUnit: number;
  /** Content max-width in px (960-1440) */
  contentMaxWidth: number;
  /** Sidebar width in px (220-320) */
  sidebarWidth: number;
}

// ---------------------------------------------------------------------------
// Form (borders, shadows)
// ---------------------------------------------------------------------------

export type RadiusPreset = "none" | "small" | "medium" | "large" | "full";
export type ShadowDepth = "none" | "subtle" | "medium" | "elevated";

export interface FormConfig {
  /** Border radius preset */
  radius: RadiusPreset;
  /** Custom radius in px when radius is not a preset override */
  customRadiusPx?: number;
  /** Shadow depth for cards and overlays */
  shadowDepth: ShadowDepth;
  /** Border width in px (0, 1, 2) */
  borderWidth: number;
  /** Whether to use dividers between sections */
  useDividers: boolean;
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export interface MotionConfig {
  /** Master toggle — off respects prefers-reduced-motion unconditionally */
  animationsEnabled: boolean;
  /** Transition duration multiplier (0.5 = snappy, 1 = default, 1.5 = relaxed) */
  transitionSpeed: number;
  /** Whether page transitions are enabled */
  pageTransitions: boolean;
  /** Whether hover micro-interactions are enabled */
  hoverEffects: boolean;
  /** Whether loading skeletons animate */
  skeletonAnimation: boolean;
}

// ---------------------------------------------------------------------------
// Auto-scheduling
// ---------------------------------------------------------------------------

export interface ScheduleConfig {
  enabled: boolean;
  /** Theme to apply during daytime */
  dayTheme: "light" | "dark";
  /** Theme to apply during nighttime */
  nightTheme: "light" | "dark";
  /** Day start hour (0-23) in local time */
  dayStartHour: number;
  /** Night start hour (0-23) in local time */
  nightStartHour: number;
  /** IANA timezone (e.g. "America/Bogota") */
  timezone: string;
}

// ---------------------------------------------------------------------------
// Theme mode & presets
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark" | "system";

export interface CustomPreset {
  id: string;
  name: string;
  createdAt: number;
  config: Omit<UserAppearance, "customPresets" | "activePresetId">;
}

// ---------------------------------------------------------------------------
// Top-level user appearance config
// ---------------------------------------------------------------------------

export interface UserAppearance {
  themeMode: ThemeMode;
  activePresetId: string | null;
  accentColor: string;
  /** 0-100, controls how vibrant the accent bleeds into the UI */
  accentAmplitude: number;
  colorTokens: {
    light: ColorTokens;
    dark: ColorTokens;
  };
  typography: TypographyConfig;
  density: DensityConfig;
  form: FormConfig;
  motion: MotionConfig;
  schedule: ScheduleConfig;
  /** Sidebar background for light mode */
  sidebarColor: string;
  /** Sidebar background for dark mode */
  sidebarColorDark: string;
  customPresets: CustomPreset[];
}

// ---------------------------------------------------------------------------
// Built-in presets
// ---------------------------------------------------------------------------

export const DEFAULT_LIGHT_TOKENS: ColorTokens = {
  backgrounds: { primary: "#0B0B0F", surface: "#121217", elevated: "#1B1B1F" },
  text: { primary: "#E7E7EA", secondary: "#A1A1AA", disabled: "#72727A" },
  borders: { default: "#27272A", subtle: "#1E1E24", strong: "#3B3B45" },
  states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
  accents: { primary: "#8B5CF6", hover: "#A78BFA", soft: "#2C1E57" },
};

export const DEFAULT_DARK_TOKENS: ColorTokens = {
  backgrounds: { primary: "#0B0B0F", surface: "#121217", elevated: "#1B1B1F" },
  text: { primary: "#E7E7EA", secondary: "#A1A1AA", disabled: "#72727A" },
  borders: { default: "#27272A", subtle: "#1E1E24", strong: "#3B3B45" },
  states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
  accents: { primary: "#8B5CF6", hover: "#A78BFA", soft: "#2C1E57" },
};

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  headingFont: "Inter",
  bodyFont: "Inter",
  monoFont: "JetBrains Mono",
  baseFontSize: 14,
  scaleRatio: 1.2,
  headingWeight: 600,
  bodyWeight: 400,
  bodyLineHeight: 1.6,
  headingLineHeight: 1.2,
  headingLetterSpacing: -0.01,
};

export const DEFAULT_DENSITY: DensityConfig = {
  level: "comfortable",
  baseUnit: 6,
  contentMaxWidth: 1280,
  sidebarWidth: 260,
};

export const DEFAULT_FORM: FormConfig = {
  radius: "medium",
  shadowDepth: "subtle",
  borderWidth: 1,
  useDividers: true,
};

export const DEFAULT_MOTION: MotionConfig = {
  animationsEnabled: true,
  transitionSpeed: 1,
  pageTransitions: true,
  hoverEffects: true,
  skeletonAnimation: true,
};

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: true,
  dayTheme: "light",
  nightTheme: "dark",
  dayStartHour: 7,
  nightStartHour: 18,
  timezone: "America/Bogota",
};

export const DEFAULT_APPEARANCE: UserAppearance = {
  themeMode: "dark",
  activePresetId: "oliwan",
  accentColor: "#8B5CF6",
  accentAmplitude: 70,
  colorTokens: {
    light: DEFAULT_LIGHT_TOKENS,
    dark: DEFAULT_DARK_TOKENS,
  },
  typography: DEFAULT_TYPOGRAPHY,
  density: DEFAULT_DENSITY,
  form: DEFAULT_FORM,
  motion: DEFAULT_MOTION,
  schedule: DEFAULT_SCHEDULE,
  sidebarColor: "#1a3a35",
  sidebarColorDark: "#0a0a0a",
  customPresets: [],
};

// Built-in presets — match the screenshot
export interface BuiltinPreset {
  id: string;
  name: string;
  swatch: string;
  overrides: Partial<UserAppearance>;
}

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: "oliwan",
    name: "OLIVAN Original",
    swatch: "#0d9a8a",
    overrides: {
      accentColor: "#0d9a8a",
      sidebarColor: "#1a3a35",
      sidebarColorDark: "#0a0a0a",
      colorTokens: {
        light: {
          backgrounds: { primary: "#faf7ef", surface: "#ffffff", elevated: "#ffffff" },
          text: { primary: "#1a1a2e", secondary: "#6b7280", disabled: "#9ca3af" },
          borders: { default: "#e0dbd0", subtle: "#ede9df", strong: "#c8c3b5" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#0d9a8a", hover: "#0fb9a6", soft: "#e6f7f5" },
        },
        dark: {
          backgrounds: { primary: "#0a0a0a", surface: "#161616", elevated: "#1f1f1f" },
          text: { primary: "#e8e8e8", secondary: "#a0a0a0", disabled: "#666666" },
          borders: { default: "#2a2a2a", subtle: "#1f1f1f", strong: "#3a3a3a" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#0d9a8a", hover: "#0fb9a6", soft: "#0a2a26" },
        },
      },
    },
  },
  {
    id: "midnight",
    name: "Medianoche",
    swatch: "#6366f1",
    overrides: {
      themeMode: "dark",
      accentColor: "#6366f1",
      sidebarColor: "#050505",
      sidebarColorDark: "#050505",
      colorTokens: {
        light: {
          backgrounds: { primary: "#0f0f0f", surface: "#1a1a1a", elevated: "#222222" },
          text: { primary: "#e8e8e8", secondary: "#a0a0a0", disabled: "#666666" },
          borders: { default: "#2a2a2a", subtle: "#1f1f1f", strong: "#3a3a3a" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#6366f1", hover: "#818cf8", soft: "#1e1b4b" },
        },
        dark: {
          backgrounds: { primary: "#0f0f0f", surface: "#1a1a1a", elevated: "#222222" },
          text: { primary: "#e8e8e8", secondary: "#a0a0a0", disabled: "#666666" },
          borders: { default: "#2a2a2a", subtle: "#1f1f1f", strong: "#3a3a3a" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#6366f1", hover: "#818cf8", soft: "#1e1b4b" },
        },
      },
    },
  },
  {
    id: "purpura",
    name: "Purpura",
    swatch: "#7c3aed",
    overrides: {
      accentColor: "#7c3aed",
      sidebarColor: "#2d1b69",
      sidebarColorDark: "#1a0e3d",
      colorTokens: {
        light: {
          backgrounds: { primary: "#faf8ff", surface: "#ffffff", elevated: "#ffffff" },
          text: { primary: "#1a1a2e", secondary: "#6b7280", disabled: "#9ca3af" },
          borders: { default: "#ddd6fe", subtle: "#ede9fe", strong: "#c4b5fd" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#7c3aed", hover: "#8b5cf6", soft: "#ede9fe" },
        },
        dark: {
          backgrounds: { primary: "#0a0a0f", surface: "#14121f", elevated: "#1c1930" },
          text: { primary: "#e8e8f0", secondary: "#a0a0b0", disabled: "#666680" },
          borders: { default: "#2a2840", subtle: "#1f1d30", strong: "#3a3855" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#8b5cf6", hover: "#a78bfa", soft: "#2d1b69" },
        },
      },
    },
  },
  {
    id: "azul",
    name: "Azul Corporativo",
    swatch: "#2563eb",
    overrides: {
      accentColor: "#2563eb",
      sidebarColor: "#1e3a5f",
      sidebarColorDark: "#0f1d30",
      colorTokens: {
        light: {
          backgrounds: { primary: "#f8faff", surface: "#ffffff", elevated: "#ffffff" },
          text: { primary: "#1e293b", secondary: "#64748b", disabled: "#94a3b8" },
          borders: { default: "#d1daf7", subtle: "#e8f0fe", strong: "#b4c5e8" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#2563eb" },
          accents: { primary: "#2563eb", hover: "#3b82f6", soft: "#eff6ff" },
        },
        dark: {
          backgrounds: { primary: "#0a0f1a", surface: "#111827", elevated: "#1e293b" },
          text: { primary: "#e2e8f0", secondary: "#94a3b8", disabled: "#64748b" },
          borders: { default: "#1e3a5f", subtle: "#1a2744", strong: "#2d4a7a" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#3b82f6", hover: "#60a5fa", soft: "#1e3a5f" },
        },
      },
    },
  },
  {
    id: "arena",
    name: "Arena",
    swatch: "#b45309",
    overrides: {
      accentColor: "#b45309",
      sidebarColor: "#2c1a0e",
      sidebarColorDark: "#160d07",
      colorTokens: {
        light: {
          backgrounds: { primary: "#fdf6ed", surface: "#fffbf5", elevated: "#fffbf5" },
          text: { primary: "#3b2f1e", secondary: "#78716c", disabled: "#a8a29e" },
          borders: { default: "#e8d5b5", subtle: "#f5e6d0", strong: "#d4b888" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#b45309", hover: "#d97706", soft: "#fff7ed" },
        },
        dark: {
          backgrounds: { primary: "#0f0a05", surface: "#1a1208", elevated: "#231a0c" },
          text: { primary: "#e8dcc8", secondary: "#a89880", disabled: "#786848" },
          borders: { default: "#2c1a0e", subtle: "#1f1208", strong: "#3d2815" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#d97706", hover: "#f59e0b", soft: "#2c1a0e" },
        },
      },
    },
  },
  {
    id: "slate",
    name: "Slate Minimal",
    swatch: "#475569",
    overrides: {
      accentColor: "#475569",
      sidebarColor: "#0f172a",
      sidebarColorDark: "#020617",
      colorTokens: {
        light: {
          backgrounds: { primary: "#f8fafc", surface: "#ffffff", elevated: "#ffffff" },
          text: { primary: "#0f172a", secondary: "#64748b", disabled: "#94a3b8" },
          borders: { default: "#e2e8f0", subtle: "#f1f5f9", strong: "#cbd5e1" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#475569", hover: "#64748b", soft: "#f1f5f9" },
        },
        dark: {
          backgrounds: { primary: "#020617", surface: "#0f172a", elevated: "#1e293b" },
          text: { primary: "#e2e8f0", secondary: "#94a3b8", disabled: "#64748b" },
          borders: { default: "#1e293b", subtle: "#0f172a", strong: "#334155" },
          states: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
          accents: { primary: "#64748b", hover: "#94a3b8", soft: "#1e293b" },
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

/** Deep-merge an overrides object onto the default appearance config. */
export function applyPresetOverrides(
  base: UserAppearance,
  overrides: Partial<UserAppearance>
): UserAppearance {
  return {
    ...base,
    ...overrides,
    colorTokens: overrides.colorTokens
      ? {
          light: mergeTokens(base.colorTokens.light, overrides.colorTokens.light),
          dark: mergeTokens(base.colorTokens.dark, overrides.colorTokens.dark),
        }
      : base.colorTokens,
    typography: { ...base.typography, ...overrides.typography },
    density: { ...base.density, ...overrides.density },
    form: { ...base.form, ...overrides.form },
    motion: { ...base.motion, ...overrides.motion },
    schedule: { ...base.schedule, ...overrides.schedule },
    customPresets: base.customPresets,
  };
}

function mergeTokens(base: ColorTokens, partial?: Partial<ColorTokens>): ColorTokens {
  if (!partial) return base;
  return {
    backgrounds: { ...base.backgrounds, ...partial.backgrounds },
    text: { ...base.text, ...partial.text },
    borders: { ...base.borders, ...partial.borders },
    states: { ...base.states, ...partial.states },
    accents: { ...base.accents, ...partial.accents },
  };
}

// ---------------------------------------------------------------------------
// CSS variable derivation
// ---------------------------------------------------------------------------

const RADIUS_MAP: Record<RadiusPreset, string> = {
  none: "0px",
  small: "4px",
  medium: "8px",
  large: "12px",
  full: "9999px",
};

const SHADOW_MAP: Record<ShadowDepth, string> = {
  none: "none",
  subtle: "0 1px 2px rgba(0,0,0,0.06)",
  medium: "0 2px 8px rgba(0,0,0,0.1)",
  elevated: "0 4px 16px rgba(0,0,0,0.15)",
};

export function deriveAppearanceVars(
  appearance: UserAppearance,
  mode: "light" | "dark"
): Record<string, string> {
  const tokens = mode === "dark" ? appearance.colorTokens.dark : appearance.colorTokens.light;
  const sidebar = mode === "dark" ? appearance.sidebarColorDark : appearance.sidebarColor;

  const radius = appearance.form.customRadiusPx != null
    ? `${appearance.form.customRadiusPx}px`
    : RADIUS_MAP[appearance.form.radius];

  return {
    // Backgrounds
    "--background": tokens.backgrounds.primary,
    "--surface": tokens.backgrounds.surface,
    "--card": tokens.backgrounds.surface,
    "--popover": tokens.backgrounds.elevated,
    "--elevated": tokens.backgrounds.elevated,
    "--muted": tokens.backgrounds.elevated,

    // Text
    "--foreground": tokens.text.primary,
    "--card-foreground": tokens.text.primary,
    "--popover-foreground": tokens.text.primary,
    "--muted-foreground": tokens.text.secondary,
    "--text-disabled": tokens.text.disabled,

    // Borders
    "--border": tokens.borders.default,
    "--border-subtle": tokens.borders.subtle,
    "--border-strong": tokens.borders.strong,
    "--input": tokens.borders.default,

    // States
    "--success": tokens.states.success,
    "--warning": tokens.states.warning,
    "--destructive": tokens.states.error,
    "--info": tokens.states.info,

    // Accents
    "--primary": tokens.accents.primary,
    "--primary-foreground": "#ffffff",
    "--accent": tokens.accents.soft,
    "--accent-foreground": tokens.accents.primary,
    "--ring": tokens.accents.primary,
    "--accent-hover": tokens.accents.hover,

    // Secondary (derived from muted)
    "--secondary": tokens.backgrounds.elevated,
    "--secondary-foreground": tokens.text.primary,

    // Sidebar
    "--sidebar": sidebar,
    "--sidebar-foreground": "#f0faf9",
    "--sidebar-primary": tokens.accents.primary,
    "--sidebar-primary-foreground": "#ffffff",
    "--sidebar-accent": sidebar,
    "--sidebar-accent-foreground": "#f0faf9",
    "--sidebar-border": sidebar,
    "--sidebar-ring": tokens.accents.primary,

    // Charts
    "--chart-1": tokens.accents.primary,
    "--chart-2": tokens.states.info,
    "--chart-3": tokens.states.success,
    "--chart-4": tokens.states.warning,
    "--chart-5": tokens.states.error,

    // Form
    "--radius": radius,
    "--shadow": SHADOW_MAP[appearance.form.shadowDepth],
    "--border-width": `${appearance.form.borderWidth}px`,

    // Typography
    "--font-heading": `"${appearance.typography.headingFont}", system-ui, sans-serif`,
    "--font-body": `"${appearance.typography.bodyFont}", system-ui, sans-serif`,
    "--font-mono": `"${appearance.typography.monoFont}", ui-monospace, monospace`,
    "--font-size-base": `${appearance.typography.baseFontSize}px`,
    "--font-scale": `${appearance.typography.scaleRatio}`,
    "--heading-weight": `${appearance.typography.headingWeight}`,
    "--body-weight": `${appearance.typography.bodyWeight}`,
    "--body-line-height": `${appearance.typography.bodyLineHeight}`,
    "--heading-line-height": `${appearance.typography.headingLineHeight}`,
    "--heading-letter-spacing": `${appearance.typography.headingLetterSpacing}em`,

    // Density
    "--spacing-unit": `${appearance.density.baseUnit}px`,
    "--content-max-width": `${appearance.density.contentMaxWidth}px`,
    "--sidebar-width": `${appearance.density.sidebarWidth}px`,

    // Motion
    "--transition-speed": `${appearance.motion.transitionSpeed}`,
    "--transition-base": `${Math.round(150 * appearance.motion.transitionSpeed)}ms`,
    "--transition-slow": `${Math.round(300 * appearance.motion.transitionSpeed)}ms`,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function validateAppearance(raw: unknown): {
  ok: boolean;
  errors: string[];
  config?: UserAppearance;
} {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: ["El cuerpo debe ser un objeto JSON"] };
  }

  const cfg = raw as Record<string, unknown>;

  // Theme mode
  const validModes = ["light", "dark", "system"];
  if (cfg.themeMode !== undefined && !validModes.includes(cfg.themeMode as string)) {
    errors.push(`themeMode debe ser ${validModes.join("/")}`);
  }

  // Accent color
  if (cfg.accentColor !== undefined && !HEX_RE.test(cfg.accentColor as string)) {
    errors.push("accentColor debe ser hex #RRGGBB");
  }

  // Amplitude
  if (cfg.accentAmplitude !== undefined) {
    const amp = Number(cfg.accentAmplitude);
    if (!Number.isFinite(amp) || amp < 0 || amp > 100) {
      errors.push("accentAmplitude debe estar entre 0 y 100");
    }
  }

  // Color tokens: validate every hex
  if (cfg.colorTokens && typeof cfg.colorTokens === "object") {
    const ct = cfg.colorTokens as Record<string, unknown>;
    for (const mode of ["light", "dark"] as const) {
      const modeTokens = ct[mode];
      if (!modeTokens || typeof modeTokens !== "object") continue;
      const groups = modeTokens as Record<string, Record<string, string>>;
      for (const [group, tokens] of Object.entries(groups)) {
        if (typeof tokens !== "object") continue;
        for (const [key, val] of Object.entries(tokens)) {
          if (typeof val === "string" && !HEX_RE.test(val)) {
            errors.push(`colorTokens.${mode}.${group}.${key}: "${val}" no es hex valido`);
          }
        }
      }
    }
  }

  // Typography bounds
  if (cfg.typography && typeof cfg.typography === "object") {
    const t = cfg.typography as Record<string, unknown>;
    if (t.baseFontSize !== undefined) {
      const s = Number(t.baseFontSize);
      if (!Number.isFinite(s) || s < 10 || s > 24) errors.push("baseFontSize: 10-24");
    }
    if (t.scaleRatio !== undefined) {
      const r = Number(t.scaleRatio);
      if (!Number.isFinite(r) || r < 1.05 || r > 1.5) errors.push("scaleRatio: 1.05-1.5");
    }
    if (t.headingWeight !== undefined) {
      const w = Number(t.headingWeight);
      if (![100, 200, 300, 400, 500, 600, 700, 800, 900].includes(w)) errors.push("headingWeight: 100-900 (step 100)");
    }
    if (t.bodyWeight !== undefined) {
      const w = Number(t.bodyWeight);
      if (![100, 200, 300, 400, 500, 600, 700, 800, 900].includes(w)) errors.push("bodyWeight: 100-900 (step 100)");
    }
  }

  // Density bounds
  if (cfg.density && typeof cfg.density === "object") {
    const d = cfg.density as Record<string, unknown>;
    if (d.baseUnit !== undefined) {
      const u = Number(d.baseUnit);
      if (!Number.isFinite(u) || u < 2 || u > 12) errors.push("baseUnit: 2-12");
    }
    if (d.contentMaxWidth !== undefined) {
      const w = Number(d.contentMaxWidth);
      if (!Number.isFinite(w) || w < 800 || w > 1920) errors.push("contentMaxWidth: 800-1920");
    }
    if (d.sidebarWidth !== undefined) {
      const w = Number(d.sidebarWidth);
      if (!Number.isFinite(w) || w < 180 || w > 400) errors.push("sidebarWidth: 180-400");
    }
  }

  // Motion bounds
  if (cfg.motion && typeof cfg.motion === "object") {
    const m = cfg.motion as Record<string, unknown>;
    if (m.transitionSpeed !== undefined) {
      const s = Number(m.transitionSpeed);
      if (!Number.isFinite(s) || s < 0 || s > 3) errors.push("transitionSpeed: 0-3");
    }
  }

  // Custom presets cap
  if (cfg.customPresets && Array.isArray(cfg.customPresets)) {
    if (cfg.customPresets.length > 20) errors.push("Maximo 20 presets personalizados");
  }

  // Size cap — the whole JSON shouldn't exceed 64KB
  const jsonSize = JSON.stringify(cfg).length;
  if (jsonSize > 65_536) errors.push("La configuracion excede 64KB");

  if (errors.length > 0) return { ok: false, errors };

  // Deep merge onto defaults to fill missing fields
  const result: UserAppearance = {
    ...DEFAULT_APPEARANCE,
    ...(cfg as Partial<UserAppearance>),
    colorTokens: cfg.colorTokens
      ? {
          light: mergeTokens(DEFAULT_APPEARANCE.colorTokens.light, (cfg.colorTokens as Record<string, ColorTokens>).light),
          dark: mergeTokens(DEFAULT_APPEARANCE.colorTokens.dark, (cfg.colorTokens as Record<string, ColorTokens>).dark),
        }
      : DEFAULT_APPEARANCE.colorTokens,
    typography: { ...DEFAULT_APPEARANCE.typography, ...(cfg.typography as Partial<TypographyConfig> | undefined) },
    density: { ...DEFAULT_APPEARANCE.density, ...(cfg.density as Partial<DensityConfig> | undefined) },
    form: { ...DEFAULT_APPEARANCE.form, ...(cfg.form as Partial<FormConfig> | undefined) },
    motion: { ...DEFAULT_APPEARANCE.motion, ...(cfg.motion as Partial<MotionConfig> | undefined) },
    schedule: { ...DEFAULT_APPEARANCE.schedule, ...(cfg.schedule as Partial<ScheduleConfig> | undefined) },
    customPresets: Array.isArray(cfg.customPresets) ? cfg.customPresets.slice(0, 20) as CustomPreset[] : [],
  };

  return { ok: true, errors: [], config: result };
}

// ---------------------------------------------------------------------------
// Resolve the active theme mode (respecting schedule + system preference)
// ---------------------------------------------------------------------------

export function resolveEffectiveMode(
  appearance: UserAppearance,
  systemPrefersDark?: boolean
): "light" | "dark" {
  if (appearance.schedule.enabled) {
    const now = new Date();
    const hour = now.getHours();
    const { dayStartHour, nightStartHour, dayTheme, nightTheme } = appearance.schedule;
    const isDay = nightStartHour > dayStartHour
      ? hour >= dayStartHour && hour < nightStartHour
      : hour >= dayStartHour || hour < nightStartHour;
    return isDay ? dayTheme : nightTheme;
  }

  if (appearance.themeMode === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return appearance.themeMode;
}
