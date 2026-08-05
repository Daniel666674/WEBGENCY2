import type { DemoConfig, Section } from "./types";
import { SECTION_LABELS } from "./types";
import { getTemplate } from "./templates";

export type AdviceLevel = "error" | "warning" | "tip";

export interface Advice {
  id: string;
  level: AdviceLevel;
  title: string;
  detail: string;
  /** Section this points at, so the builder can jump straight there. */
  sectionId?: string;
}

// ─────────────────────────────────────────────────────────────
// Contrast (WCAG 2.1 relative luminance)
// ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "#000000").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Copy the templates ship with. If it's still on the page, the demo isn't
// ready to show a client.
const PLACEHOLDERS = [
  "Describe aquí", "Servicio uno", "Servicio dos", "Servicio tres",
  "Cuenta aquí la historia", "Escribe aquí", "Nombre Apellido",
  "Cliente satisfecho", "Tu Negocio", "Nuevo Demo",
  "Cargo o especialidad", "Título del bloque",
];

const NEEDS_IMAGE = new Set(["cover", "split", "offset"]);

function hasPlaceholder(s: Section): boolean {
  const haystack = [
    s.heading, s.subheading, s.body, s.eyebrow,
    ...(s.items ?? []).flatMap((i) => [i.title, i.body, i.author, i.role]),
  ].filter(Boolean).join(" ");
  return PLACEHOLDERS.some((p) => haystack.includes(p));
}

/** Sections that carry no content once enabled just render as dead space. */
function isEmpty(s: Section): boolean {
  const itemDriven = ["gallery", "logos", "team", "faq", "stats", "menu", "testimonials", "columns", "features"];
  if (itemDriven.includes(s.type)) {
    const items = s.items ?? [];
    if (items.length === 0) return true;
    if (s.type === "gallery" || s.type === "logos") return items.every((i) => !i.media?.url);
    return items.every((i) => !i.title && !i.body);
  }
  if (s.type === "video") return !s.media?.url;
  if (s.type === "divider") return false;
  return !s.heading && !s.body && !s.subheading;
}

/**
 * Audits a demo and returns prioritized, actionable advice. Deliberately
 * opinionated: it is aimed at someone who is not a designer and needs to
 * know what to fix next, not a list of everything that could theoretically
 * be improved.
 */
export function analyzeDemo(cfg: DemoConfig): Advice[] {
  const out: Advice[] = [];
  const b = cfg.brand;
  const enabled = cfg.sections.filter((s) => s.enabled);
  const hero = cfg.sections.find((s) => s.type === "hero" && s.enabled);

  // ── Blockers ────────────────────────────────────────────
  if (!b.name?.trim()) {
    out.push({
      id: "brand-name",
      level: "error",
      title: "Falta el nombre del negocio",
      detail: "Aparece en el menú, el pie de página y la pestaña del navegador. Agrégalo en la pestaña Marca.",
    });
  }

  const inkContrast = contrastRatio(b.ink || "#111827", b.paper || "#ffffff");
  if (inkContrast < 4.5) {
    out.push({
      id: "contrast-text",
      level: "error",
      title: "El texto casi no se lee sobre el fondo",
      detail: `El contraste es ${inkContrast.toFixed(1)}:1 y el mínimo recomendado es 4.5:1. Oscurece el color de texto o aclara el fondo en la pestaña Marca.`,
    });
  }

  const accentContrast = contrastRatio(b.accent || "#6366f1", b.paper || "#ffffff");
  if (accentContrast < 3) {
    out.push({
      id: "contrast-accent",
      level: "warning",
      title: "El color principal se pierde contra el fondo",
      detail: `Contraste de ${accentContrast.toFixed(1)}:1. Las etiquetas y enlaces que usan este color van a costar de leer — elige un tono más oscuro o más saturado.`,
    });
  }

  const hasContact = !!(b.phone || b.email || b.whatsapp);
  if (!hasContact) {
    out.push({
      id: "no-contact",
      level: "error",
      title: "No hay forma de contactarte",
      detail: "Sin teléfono, correo ni WhatsApp, la sección de contacto queda vacía y el demo no puede convertir. Complétalo en Marca.",
    });
  }

  // ── Content quality ─────────────────────────────────────
  const withPlaceholders = enabled.filter(hasPlaceholder);
  for (const s of withPlaceholders.slice(0, 4)) {
    out.push({
      id: `placeholder-${s.id}`,
      level: "warning",
      title: `"${SECTION_LABELS[s.type]}" todavía tiene texto de ejemplo`,
      detail: "Quedó contenido de la plantilla sin reemplazar. Un cliente lo va a notar de inmediato.",
      sectionId: s.id,
    });
  }

  for (const s of enabled.filter(isEmpty).slice(0, 4)) {
    out.push({
      id: `empty-${s.id}`,
      level: "warning",
      title: `"${SECTION_LABELS[s.type]}" está visible pero vacía`,
      detail: "Se va a ver como un hueco en la página. Agrégale contenido u ocúltala con el ojo en la estructura.",
      sectionId: s.id,
    });
  }

  if (hero) {
    const words = (hero.heading || "").trim().split(/\s+/).filter(Boolean).length;
    if (hero.heading && words > 12) {
      out.push({
        id: "hero-long",
        level: "warning",
        title: "El título principal es muy largo",
        detail: `Tiene ${words} palabras. Los titulares que funcionan rondan las 6–10: di qué haces y para quién, el resto va en la frase de apoyo.`,
        sectionId: hero.id,
      });
    }
    if (!hero.ctaText?.trim()) {
      out.push({
        id: "hero-cta",
        level: "warning",
        title: "La portada no tiene botón",
        detail: "Es el punto de mayor atención de la página. Sin un botón claro, el visitante no sabe qué hacer después.",
        sectionId: hero.id,
      });
    }
    if (NEEDS_IMAGE.has(hero.variant) && !hero.media?.url) {
      out.push({
        id: "hero-image",
        level: "warning",
        title: "Falta la imagen de portada",
        detail: `El diseño elegido reserva espacio para una imagen y ahora se ve un bloque vacío. Sube una foto o cambia a "Centrado, sin imagen".`,
        sectionId: hero.id,
      });
    }
  }

  // ── Structure ───────────────────────────────────────────
  if (enabled.length < 4) {
    out.push({
      id: "too-few",
      level: "tip",
      title: "La página es muy corta",
      detail: "Con menos de 4 secciones cuesta generar confianza. Considera agregar Nosotros, Testimonios o Preguntas frecuentes.",
    });
  }
  if (enabled.length > 12) {
    out.push({
      id: "too-many",
      level: "tip",
      title: "Hay muchas secciones activas",
      detail: `${enabled.length} secciones es mucho para un demo. Las páginas que convierten suelen tener entre 6 y 9 — oculta las que menos aporten.`,
    });
  }

  const hasProof = enabled.some((s) => ["testimonials", "logos", "stats"].includes(s.type) && !isEmpty(s));
  if (!hasProof) {
    out.push({
      id: "no-proof",
      level: "tip",
      title: "Falta prueba social",
      detail: "Testimonios, logos de clientes o cifras destacadas son lo que más mueve la aguja cuando alguien no te conoce.",
    });
  }

  if (!enabled.some((s) => s.type === "contact")) {
    out.push({
      id: "no-contact-section",
      level: "warning",
      title: "No hay sección de contacto visible",
      detail: "Los botones apuntan a #contacto, pero esa sección está oculta. Actívala para que los enlaces lleguen a algún lado.",
    });
  }

  // ── Polish ──────────────────────────────────────────────
  if (!b.logo?.url) {
    out.push({
      id: "no-logo",
      level: "tip",
      title: "Sin logo",
      detail: "Se usa el nombre en texto, que funciona bien. Si el cliente tiene logo, súbelo en Marca para que se vea más real.",
    });
  }

  const imagesWithoutAlt = cfg.sections
    .filter((s) => s.enabled)
    .flatMap((s) => [s.media, ...(s.items ?? []).map((i) => i.media)])
    .filter((m) => m?.url && !m.alt?.trim()).length;
  if (imagesWithoutAlt > 0) {
    out.push({
      id: "no-alt",
      level: "tip",
      title: `${imagesWithoutAlt} ${imagesWithoutAlt === 1 ? "imagen sin" : "imágenes sin"} descripción`,
      detail: "El texto alternativo ayuda en buscadores y para quien navega con lector de pantalla. Se edita al subir la imagen.",
    });
  }

  const navLinks = cfg.nav?.links?.length ?? 0;
  if (navLinks > 7) {
    out.push({
      id: "nav-crowded",
      level: "tip",
      title: "El menú tiene demasiados enlaces",
      detail: `${navLinks} enlaces obligan a elegir. Deja 4 o 5 y agrupa el resto en submenús.`,
    });
  }

  const order: Record<AdviceLevel, number> = { error: 0, warning: 1, tip: 2 };
  return out.sort((a, b2) => order[a.level] - order[b2.level]);
}

/** Static, template-specific guidance shown alongside the audit. */
export function templateTips(cfg: DemoConfig): string[] {
  return getTemplate(cfg.template).tips;
}
