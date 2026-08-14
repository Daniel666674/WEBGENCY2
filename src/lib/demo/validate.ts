import { z } from "zod";
import type { SectionType, DemoConfig, ElementKey } from "./types";
import { MAX_VERBATIM_CSS, MAX_VERBATIM_HTML, stripDangerousHtml } from "./verbatim";

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

/**
 * Inline editing lets the user produce HTML (bold, italic, links) that ends
 * up on a public page, so it needs a real allowlist — not a blocklist.
 *
 * The strategy is escape-then-restore: everything is escaped first, then a
 * fixed set of known-good patterns is selectively un-escaped. A tag can only
 * survive by exactly matching one of those patterns, so anything the browser
 * or a paste invents (style=, onclick=, <script>, <img>) is inert by
 * construction rather than by us having thought to forbid it.
 *
 * Idempotent: applied on write and again at render time.
 */
const RICH_TAGS = ["strong", "b", "em", "i", "u"] as const;

export function sanitizeRich(v: unknown): string {
  if (typeof v !== "string") return "";

  // Ampersands that already begin an entity are left alone — this runs on
  // write and again at render, and a naive escape would turn "&" into
  // "&amp;amp;" on the second pass and render it literally.
  let s = v
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,9}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  for (const t of RICH_TAGS) {
    s = s.replace(new RegExp(`&lt;${t}&gt;`, "gi"), `<${t}>`);
    s = s.replace(new RegExp(`&lt;/${t}&gt;`, "gi"), `</${t}>`);
  }
  s = s.replace(/&lt;br\s*\/?&gt;/gi, "<br/>");

  // Anchors keep only href, and only if the URL passes the scheme allowlist.
  // The capture excludes & so no entity can smuggle a quote into the attribute.
  s = s.replace(/&lt;a href=&quot;([^&]*)&quot;&gt;/gi, (_m, url: string) => {
    const safe = safeUrl(url);
    return safe ? `<a href="${safe.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">` : "";
  });
  s = s.replace(/&lt;\/a&gt;/gi, "</a>");

  return s.slice(0, 20_000);
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
  title: text(500).transform(sanitizeRich).optional(),
  body: text(5_000).transform(sanitizeRich).optional(),
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
  offsetX: px(-2000, 2000).optional(),
  offsetY: px(-2000, 2000).optional(),
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
  // Deliberately NOT passed through sanitizeRich or rendered anywhere — this
  // never reaches HTML, so it isn't a public-page injection surface. Length
  // capped like everything else, plain text only.
  notes: text(2_000).optional(),
  eyebrow: text(200).optional(),
  heading: text(500).transform(sanitizeRich).optional(),
  subheading: text(2_000).transform(sanitizeRich).optional(),
  body: text(20_000).transform(sanitizeRich).optional(),
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
  page: z.string().max(64).optional(),
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
  density: z.enum(["compact", "normal", "spacious"]).optional(),
  imageStyle: z.enum(["normal", "grayscale", "duotone", "soft"]).optional(),
});

// Lowercase-alnum-hyphen only, matching the segment the public route reads
// straight off the URL — "" (home) is the sole exception.
const pageSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const canvasElementSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(["text", "image", "button", "logo"]),
  x: z.number().min(-2000).max(10000),
  y: z.number().min(-2000).max(50000),
  width: z.number().min(10).max(5000),
  height: z.number().min(10).max(5000),
  text: text(5_000).transform(sanitizeRich).optional(),
  media: mediaRefSchema.optional(),
  url: urlField.optional(),
  style: elementStyleSchema.optional(),
  zIndex: z.number().min(0).max(10000).optional(),
});

const demoPageSchema = z.object({
  id: z.string().min(1).max(64),
  slug: z.string().max(60).refine((v) => v === "" || pageSlugPattern.test(v), "Usa solo minúsculas, números y guiones"),
  title: text(120),
  sections: z.array(sectionSchema).max(80),
  canvasElements: z.array(canvasElementSchema).max(100).optional(),
});

// The real allowlist pass (sanitize-html) runs once, at the write
// boundaries that actually accept untrusted content — see
// verbatimSanitize.ts's file comment for why that's a separate, server-only
// module rather than living in this schema. What runs here on every parse,
// write or read, is the fast regex backstop: cheap enough to afford on a
// public page view, and real insurance against a future write path that
// forgets to call the real sanitizer, without pulling a DOM-based sanitizer
// into whatever bundle this schema ends up in (render.ts, which needs
// validateDemoConfig's neighbours, is imported by the client-side builder).
const verbatimPageSchema = z.object({
  html: z.string().max(MAX_VERBATIM_HTML).transform(stripDangerousHtml),
  css: z.string().max(MAX_VERBATIM_CSS),
});

export const demoConfigSchema = z.object({
  template: z.string().max(40),
  fontPair: z.string().max(40),
  brand: brandSchema,
  sections: z.array(sectionSchema).max(80),
  pages: z.array(demoPageSchema).max(12).optional(),
  customCss: z.string().max(25_000).transform(safeCss).optional(),
  nav: navSchema.optional(),
  footer: footerSchema.optional(),
  verbatim: z.record(z.string().max(60), verbatimPageSchema).optional(),
}).superRefine((cfg, ctx) => {
  if (cfg.pages) {
    const slugs = new Set<string>();
    for (const p of cfg.pages) {
      if (slugs.has(p.slug)) {
        ctx.addIssue({ code: "custom", path: ["pages"], message: `Slug de página repetido: "${p.slug || "(inicio)"}"` });
      }
      slugs.add(p.slug);
    }
  }
  if (cfg.verbatim && Object.keys(cfg.verbatim).length > 12) {
    ctx.addIssue({ code: "custom", path: ["verbatim"], message: "Máximo 12 páginas en diseño original." });
  }
});

/** Generous for a section-only demo; a "diseño original" import with several
 *  pages of real HTML+CSS needs real room — each page is capped on its own
 *  (500KB html + 300KB css) but a handful of them together add up fast. */
export const MAX_CONFIG_BYTES = 5_000_000;

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
