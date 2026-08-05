import { z } from "zod";
import type { SectionType, DemoConfig, ElementKey } from "./types";

// ─────────────────────────────────────────────────────────────
// Safety primitives
//
// Demo pages are served publicly at /demo/[slug] as raw HTML, so every
// value that reaches an href, src, inline style, or <style> block is an
// injection surface. The renderer's esc() only handles & < > " — which is
// NOT enough for URLs (href="javascript:…" survives escaping untouched)
// nor for CSS contexts (no HTML metacharacters needed to break out).
// These helpers close those gaps at the write boundary; the renderer
// applies them again at emit time as defense in depth.
// ─────────────────────────────────────────────────────────────

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const CSS_COLOR_FN = /^(?:rgb|rgba|hsl|hsla)\([0-9.,%\s/-]+\)$/;
const NAMED_COLOR = /^[a-zA-Z]{3,20}$/;

/** Only lets through values that cannot break out of an inline style. */
export function safeColor(v: unknown, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  if (!s) return fallback;
  if (HEX_COLOR.test(s) || CSS_COLOR_FN.test(s) || NAMED_COLOR.test(s)) return s;
  return fallback;
}

const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/i;
const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * Blocks javascript:, vbscript:, and data:text/html URIs while allowing
 * ordinary links, anchors, relative paths, and base64 raster images.
 * SVG data URIs are deliberately excluded — they can carry scripts.
 */
export function safeUrl(v: unknown, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  if (!s) return fallback;
  if (s.startsWith("#") || s.startsWith("/")) return s;
  if (SAFE_DATA_IMAGE.test(s)) return s;
  if (HAS_SCHEME.test(s)) {
    try {
      return SAFE_SCHEMES.has(new URL(s).protocol) ? s : fallback;
    } catch {
      return fallback;
    }
  }
  // No scheme at all — a bare relative path like "productos.html".
  return s;
}

/**
 * customCss is injected verbatim into a <style> block. Without this a demo
 * could close the block and open a <script>, or @import remote CSS.
 */
export function safeCss(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/<\/\s*style/gi, "")
    .replace(/<!--|-->/g, "")
    .replace(/@import/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behaviou?r\s*:/gi, "")
    .slice(0, 20_000);
}

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const SECTION_TYPES = [
  "hero", "features", "gallery", "video", "about", "testimonials", "menu",
  "faq", "stats", "team", "logos", "banner", "divider", "columns", "cta", "contact",
] as const;

// Compile-time drift guard: adding a SectionType in types.ts without adding
// it here becomes a build error rather than a silently rejected save.
type _MissingSectionType = Exclude<SectionType, (typeof SECTION_TYPES)[number]>;
const _sectionTypesComplete: _MissingSectionType extends never ? true : never = true;
void _sectionTypesComplete;

const text = (max: number) => z.string().max(max);
const urlField = z.string().max(4000).transform((v) => safeUrl(v));
const colorField = z.string().max(64).transform((v) => safeColor(v));

const mediaRefSchema = z.object({
  url: urlField,
  alt: text(300).optional(),
  kind: z.enum(["image", "video"]).catch("image"),
});

const sectionItemSchema = z.object({
  title: text(500).optional(),
  body: text(5_000).optional(),
  media: mediaRefSchema.optional(),
  price: text(100).optional(),
  author: text(200).optional(),
  role: text(200).optional(),
});

const sectionStyleSchema = z.object({
  bg: colorField.optional(),
  width: z.enum(["narrow", "normal", "wide", "full"]).optional(),
  pad: z.enum(["compact", "normal", "spacious"]).optional(),
  align: z.enum(["left", "center"]).optional(),
  overlay: z.number().min(0).max(100).optional(),
});

const ELEMENT_KEYS = [
  "eyebrow", "heading", "subheading", "body", "cta", "media",
  "items.title", "items.body", "items.price",
] as const;

type _MissingElementKey = Exclude<ElementKey, (typeof ELEMENT_KEYS)[number]>;
const _elementKeysComplete: _MissingElementKey extends never ? true : never = true;
void _elementKeysComplete;

// Numeric ranges are clamped rather than rejected: a slider that overshoots
// should snap to a sane value, not fail the whole save.
const px = (min: number, max: number) => z.number().min(min).max(max).catch(min);

const elementStyleSchema = z.object({
  fontFamily: z.enum(["heading", "body"]).optional(),
  fontSize: px(8, 400).optional(),
  fontWeight: z.string().max(10).optional(),
  lineHeight: z.number().min(0.5).max(4).catch(1.2).optional(),
  letterSpacing: z.number().min(-0.5).max(2).catch(0).optional(),
  color: colorField.optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  textTransform: z.enum(["none", "uppercase"]).optional(),
  marginTop: px(-200, 400).optional(),
  marginBottom: px(-200, 400).optional(),
  bg: colorField.optional(),
  radius: px(0, 200).optional(),
  hideDesktop: z.boolean().optional(),
  hideTablet: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(SECTION_TYPES),
  variant: z.string().max(40),
  enabled: z.boolean(),
  elements: z.partialRecord(z.enum(ELEMENT_KEYS), elementStyleSchema).optional(),
  eyebrow: text(200).optional(),
  heading: text(500).optional(),
  subheading: text(2_000).optional(),
  body: text(20_000).optional(),
  ctaText: text(200).optional(),
  ctaUrl: urlField.optional(),
  media: mediaRefSchema.optional(),
  items: z.array(sectionItemSchema).max(60).optional(),
  style: sectionStyleSchema.optional(),
});

// Nav links nest one level (a link may carry a submenu, but submenus don't
// nest further) — modelled explicitly so the schema stays non-recursive.
const navLeafSchema = z.object({
  id: z.string().min(1).max(64),
  label: text(120),
  url: urlField,
});

const navLinkSchema = navLeafSchema.extend({
  children: z.array(navLeafSchema).max(20).optional(),
});

const navSchema = z.object({
  showLogo: z.boolean().catch(true),
  sticky: z.boolean().catch(true),
  size: z.enum(["compact", "normal", "large"]).catch("normal"),
  layout: z.enum(["left", "center"]).catch("left"),
  links: z.array(navLinkSchema).max(30),
  ctaText: text(120).optional(),
  ctaUrl: urlField.optional(),
  mobileStyle: z.enum(["drawer", "dropdown"]).catch("drawer"),
});

const footerSchema = z.object({
  variant: z.enum(["simple", "columns"]).catch("columns"),
  size: z.enum(["compact", "normal", "spacious"]).catch("normal"),
  showLogo: z.boolean().catch(true),
  tagline: text(500).optional(),
  columns: z.array(z.object({
    id: z.string().min(1).max(64),
    title: text(120),
    links: z.array(navLeafSchema).max(30),
  })).max(6),
  showContact: z.boolean().catch(true),
  showSocial: z.boolean().catch(true),
  copyrightExtra: text(300).optional(),
});

const brandSchema = z.object({
  name: text(200),
  logo: mediaRefSchema.optional(),
  accent: colorField,
  ink: colorField,
  paper: colorField,
  phone: text(60).optional(),
  email: text(200).optional(),
  address: text(300).optional(),
  whatsapp: text(60).optional(),
  instagram: text(120).optional(),
  buttonShape: z.enum(["pill", "rounded", "sharp"]).optional(),
  buttonFill: z.enum(["solid", "outline"]).optional(),
});

export const demoConfigSchema = z.object({
  template: z.string().max(40),
  fontPair: z.string().max(40),
  brand: brandSchema,
  sections: z.array(sectionSchema).max(80),
  customCss: z.string().max(25_000).transform(safeCss).optional(),
  nav: navSchema.optional(),
  footer: footerSchema.optional(),
});

/** Roughly 1 MB of JSON — generous for text, tight enough that nobody
 *  smuggles base64 images into the row instead of using Blob storage. */
export const MAX_CONFIG_BYTES = 1_000_000;

export type ValidationResult =
  | { ok: true; config: DemoConfig; bytes: number }
  | { ok: false; error: string };

/**
 * Parses and normalizes an untrusted config from the client. Structural
 * problems are rejected outright (a client bug should surface loudly rather
 * than silently drop the user's sections); unsafe scalars are scrubbed to a
 * safe value in place so one bad color never costs someone their work.
 */
export function validateDemoConfig(raw: unknown): ValidationResult {
  const parsed = demoConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") || "config";
    return { ok: false, error: `Configuración inválida en "${path}": ${first?.message ?? "formato incorrecto"}` };
  }

  const serialized = JSON.stringify(parsed.data);
  const bytes = Buffer.byteLength(serialized, "utf8");
  if (bytes > MAX_CONFIG_BYTES) {
    return {
      ok: false,
      error: `El demo pesa ${(bytes / 1024 / 1024).toFixed(1)} MB y el máximo es 1 MB. Sube las imágenes con el botón "Subir" en vez de pegarlas directamente.`,
    };
  }

  return { ok: true, config: parsed.data as DemoConfig, bytes };
}
