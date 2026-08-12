/**
 * Orchestrates the import: HTML in, a `DemoConfig` the builder can open out.
 *
 * The output is an ordinary config — the same shape the templates produce. It
 * goes through `validateDemoConfig()` like every other save, and `render.ts`
 * has no idea it came from an import. That is the whole reason this approach
 * costs almost nothing architecturally: no new path to the public page, no new
 * sanitization boundary, no changes to the renderer.
 *
 * What the source page cannot bring with it is its own CSS. The demo is
 * re-rendered with the CRM's template and brand, which is the trade accepted
 * when the goal is "Daniela can edit this", not "this is byte-identical".
 */

import type { HTMLElement } from "node-html-parser";
import type {
  Brand,
  DemoConfig,
  FooterConfig,
  NavConfig,
  NavLink,
  Section,
  SectionType,
} from "../types";
import { defaultFooter, defaultNav, newId } from "../types";
import { FONT_PAIRS } from "../fonts";
import { getTemplate } from "../templates";
import { safeColor } from "../validate";
import { parseSource, type SourceDoc } from "./parse";
import { classifyBlock, type Confidence } from "./classify";
import { extractSection } from "./extract";

export interface ImportedSection {
  section: Section;
  type: SectionType;
  variant: string;
  confidence: Confidence;
  evidence: string;
  /** Rough size of what was found, for the review step. */
  itemCount: number;
}

export interface ImportReport {
  sections: ImportedSection[];
  warnings: string[];
  brand: { name: string; accent: string; detectedColors: boolean };
  images: number;
  /** Blocks the parser saw but that held nothing worth importing. */
  emptyBlocks: number;
  /** Containers a script fills at runtime, empty in the file we parsed. */
  scriptMounts: number;
  /** Linked stylesheets, so the caller can fetch them and import again. */
  styleHrefs: string[];
  /** The source's raw <title>. Names the page in a multi-page import. */
  docTitle: string;
}

export interface ImportOutcome {
  config: DemoConfig;
  report: ImportReport;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

/**
 * Picks colours from the source, preferring CSS custom properties.
 *
 * `--accent` / `--primary` on :root is where a generated page almost always
 * puts its brand colour, and it survives even when the rest of the stylesheet
 * is unreachable. Everything falls back to the template's own palette rather
 * than to a guess.
 */
function detectBrand(doc: SourceDoc, fallback: Brand): { brand: Brand; detected: boolean } {
  const v = doc.cssVars;
  const pick = (...names: string[]): string => {
    for (const n of names) {
      const raw = v[n];
      if (!raw) continue;
      const safe = safeColor(raw.trim());
      if (safe) return safe;
    }
    return "";
  };

  const accent = pick("accent", "primary", "brand", "color-primary", "accent-color", "main-color");
  const ink = pick("ink", "text", "foreground", "color-text", "body-color");
  const paper = pick("paper", "background", "bg", "surface", "color-bg");
  const themeColor = safeColor(doc.meta["theme-color"] ?? "");

  const logoEl = doc.nav?.querySelector("img") ?? null;
  const logoSrc = logoEl?.getAttribute("src") ?? "";

  const name = clean(
    doc.meta["og:site_name"] ||
      doc.meta["application-name"] ||
      // "Acme — Diseño web" and "Acme | Home" both mean the brand is "Acme".
      doc.title.split(/[|—–·-]/)[0] ||
      doc.title
  );

  return {
    brand: {
      ...fallback,
      name: cut(name, 120) || fallback.name,
      accent: accent || themeColor || fallback.accent,
      ink: ink || fallback.ink,
      paper: paper || fallback.paper,
      logo: logoSrc ? { url: logoSrc, alt: clean(logoEl?.getAttribute("alt") ?? ""), kind: "image" } : fallback.logo,
      phone: extractContact(doc, /^tel:/i) || fallback.phone,
      email: extractContact(doc, /^mailto:/i) || fallback.email,
      whatsapp: extractContact(doc, /wa\.me|api\.whatsapp/i) || fallback.whatsapp,
      instagram: extractContact(doc, /instagram\.com/i) || fallback.instagram,
    },
    detected: !!(accent || ink || paper || themeColor),
  };
}

/** Scans the whole document (nav and footer included) for a contact link. */
function extractContact(doc: SourceDoc, pattern: RegExp): string {
  const pools: (HTMLElement | null)[] = [doc.nav, doc.footer];
  for (const block of doc.blocks) pools.push(block.el);

  for (const pool of pools) {
    if (!pool) continue;
    for (const a of pool.querySelectorAll("a")) {
      const href = a.getAttribute("href") ?? "";
      if (!pattern.test(href)) continue;
      return href.replace(/^(?:tel:|mailto:)/i, "").trim();
    }
  }
  return "";
}

/** Maps a Google Fonts family in the source to the closest pair we ship. */
function matchFontPair(fonts: string[], fallback: string): string {
  const wanted = fonts.map((f) => f.toLowerCase());
  for (const pair of FONT_PAIRS) {
    const heading = pair.heading.toLowerCase();
    if (wanted.some((w) => heading.includes(w))) return pair.id;
  }
  return fallback;
}

function navFrom(el: HTMLElement | null): NavConfig | undefined {
  if (!el) return undefined;
  const links: NavLink[] = el
    .querySelectorAll("a")
    .map((a) => ({ id: newId(), label: cut(clean(a.text), 120), url: (a.getAttribute("href") ?? "").trim() }))
    .filter((l) => l.label && !/^(?:tel:|mailto:)/i.test(l.url))
    .slice(0, 12);

  if (links.length === 0) return undefined;

  // The last nav link is a call to action often enough that promoting it is
  // right more often than wrong — and it is one click to undo.
  const last = links[links.length - 1];
  const isCta = links.length > 2 && /\b(contact|contáct|cotiz|empez|agend|demo|comprar|reserv)/i.test(last.label);

  return {
    ...defaultNav(),
    links: isCta ? links.slice(0, -1) : links,
    ctaText: isCta ? last.label : "",
    ctaUrl: isCta ? last.url : "",
  };
}

function footerFrom(el: HTMLElement | null): FooterConfig | undefined {
  if (!el) return undefined;

  const columns = el
    .querySelectorAll("ul,nav")
    .map((group) => {
      const links: NavLink[] = group
        .querySelectorAll("a")
        .map((a) => ({ id: newId(), label: cut(clean(a.text), 120), url: (a.getAttribute("href") ?? "").trim() }))
        .filter((l) => l.label)
        .slice(0, 10);
      // A heading may sit outside the list, as its previous sibling.
      const heading = group.parentNode?.querySelector("h1,h2,h3,h4,h5,h6");
      return { id: newId(), title: cut(clean(heading?.text ?? "Enlaces"), 120), links };
    })
    .filter((c) => c.links.length > 0)
    .slice(0, 4);

  const tagline = clean(el.querySelector("p")?.text ?? "");

  return {
    ...defaultFooter(),
    variant: columns.length > 1 ? "columns" : "simple",
    columns: columns.length > 0 ? columns : defaultFooter().columns,
    tagline: cut(tagline, 300),
  };
}

export interface ImportOptions {
  /** Resolves relative URLs. A file upload has none; a GitHub import does. */
  baseUrl?: string;
  /** Contents of the page's linked stylesheets, fetched by the caller. */
  css?: string[];
  /** Overrides the template guessed from the source. */
  template?: string;
  /** Overrides the brand name taken from <title>. */
  title?: string;
}

export function importHtml(html: string, opts: ImportOptions = {}): ImportOutcome {
  const doc = parseSource(html, opts.baseUrl, opts.css ?? []);
  const template = getTemplate(opts.template ?? "editorial");
  const defaults = template.defaults();

  const { brand, detected } = detectBrand(doc, defaults.brand);
  if (opts.title) brand.name = cut(opts.title, 120);

  const warnings: string[] = [];
  const imported: ImportedSection[] = [];
  let emptyBlocks = 0;

  for (const block of doc.blocks) {
    // A block that survived parsing but carries neither words nor media has
    // nothing to become. Counted, not warned about individually.
    if (!block.text && block.images.length === 0 && block.embeds.length === 0) {
      emptyBlocks++;
      continue;
    }

    const classification = classifyBlock(block, block.index === 0);
    const section = extractSection(block, classification);

    imported.push({
      section,
      type: classification.type,
      variant: classification.variant,
      confidence: classification.confidence,
      evidence: classification.evidence,
      itemCount: section.items?.length ?? 0,
    });
  }

  if (imported.length === 0) {
    warnings.push("No encontramos contenido importable en este archivo.");
  }
  if (doc.unresolvedUrls) {
    warnings.push(
      "Algunas imágenes usan rutas relativas y no se pueden resolver sin la URL del sitio. Vas a tener que volver a subirlas desde el builder."
    );
  }
  if (doc.scriptMounts >= 2) {
    warnings.push(
      `Esta página arma ${doc.scriptMounts} bloques con JavaScript (productos, menús, listados). Esos contenedores están vacíos en el archivo, así que llegan como secciones con título y sin contenido — hay que llenarlas en el builder.`
    );
  }
  const lowConfidence = imported.filter((s) => s.confidence === "low").length;
  if (lowConfidence > 0) {
    warnings.push(
      `${lowConfidence} ${lowConfidence === 1 ? "bloque entró" : "bloques entraron"} como texto libre porque no reconocimos su forma. El contenido está completo; podés cambiar el tipo de sección en el builder.`
    );
  }
  if (!detected) {
    warnings.push(
      doc.styleHrefs.length > 0 && (opts.css ?? []).length === 0
        ? "Los colores del original están en una hoja de estilos aparte que no pudimos leer — se aplicaron los de la plantilla. Importá desde GitHub para que la traigamos."
        : "No encontramos los colores del original — se aplicaron los de la plantilla."
    );
  }

  const sections = imported.map((s) => s.section);
  const nav = navFrom(doc.nav);
  const footer = footerFrom(doc.footer);

  const config: DemoConfig = {
    template: template.id,
    fontPair: matchFontPair(doc.fonts, template.defaultFontPair),
    brand,
    sections,
    customCss: "",
    nav: nav ?? defaults.nav,
    footer: footer ?? defaults.footer,
  };

  return {
    config,
    report: {
      sections: imported,
      warnings,
      brand: { name: brand.name, accent: brand.accent, detectedColors: detected },
      images: doc.blocks.reduce((n, b) => n + b.images.length, 0),
      emptyBlocks,
      scriptMounts: doc.scriptMounts,
      styleHrefs: doc.styleHrefs,
      docTitle: doc.title,
    },
  };
}

export { importHtmlPages, type SourceFile, type MultiPageOutcome, type PageReport } from "./multipage";
export {
  importVerbatim,
  type VerbatimSourceFile,
  type VerbatimOutcome,
  type VerbatimPageReport,
} from "./verbatimImport";
