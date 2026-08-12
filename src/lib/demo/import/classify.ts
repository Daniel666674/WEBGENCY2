/**
 * Block → SectionType.
 *
 * Rules are ordered by how distinctive their evidence is, and the first match
 * wins. A block holding a YouTube embed is a video section no matter what else
 * it contains; a block with three similar cards each carrying a price is a
 * pricing table before it is a generic feature grid.
 *
 * Two properties matter more than accuracy here:
 *
 *  - **Nothing is ever dropped.** The last rule catches everything and returns
 *    `columns` (free text), so an unrecognised block arrives as editable text
 *    rather than disappearing. A missed classification costs the user one
 *    dropdown change; a dropped block costs them content they may not notice
 *    is gone.
 *  - **Confidence is reported honestly.** The review step shows it, so a
 *    low-confidence guess reads as a guess instead of ambushing the user after
 *    they have already published.
 */

import type { SectionType } from "../types";
import { visibleText, type Block } from "./parse";

export type Confidence = "high" | "medium" | "low";

export interface Classification {
  type: SectionType;
  variant: string;
  confidence: Confidence;
  /** Shown in the review step: why this block was read this way. */
  evidence: string;
}

const VIDEO_HOST = /(?:youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm)/i;
const PRICE = /(?:\$|€|COP|USD|MXN)\s?[\d.,]{2,}|[\d.,]{2,}\s?(?:\/\s?mes|al mes|monthly|\/mo)/i;
const QUESTION = /\?\s*$/;
// Endings matter: "Directora creativa" must match, and a \b right after
// "director" refuses it.
const ROLE_HINT =
  /\b(ceo|cto|coo|cmo|founder|cofounder|fundador[ae]?s?|director[ae]?s?|gerente|manager|lead|jefe|jefa|socio[as]?|designer|dise[ñn]ador[ae]?s?|developer|desarrollador[ae]?s?|estratega|consultor[ae]?s?|arquitect[oa]s?|fot[óo]graf[oa]s?)\b/i;
const QUOTE_HINT = /^[“"'«]|[”"'»]$/;
const CONTACT_HINT = /\b(tel[ée]fono|whatsapp|correo|email|direcci[óo]n|address|cont[áa]ctanos|escr[íi]benos)\b/i;
const STAT_VALUE = /^[+\-]?[\d.,]{1,6}\s*(?:%|k|m|\+|mil|millones)?$/i;
/** Phone numbers open with a plus and digits exactly like a stat does. */
const PHONE_LIKE = /^\+?\d[\d\s().-]{6,}$/;
// The bullet/star separators a scrolling announcement bar is built from.
// `|` was in this set too, but a pipe is ordinary text — a footer line like
// "Inicio | Nosotros | Contacto" or a breadcrumb has no heading, is short,
// and has two or more of them, matching this rule's other conditions and
// misclassifying plain nav text as a promo banner. ✦/•/· don't have that
// problem: nothing writes them as an actual word separator.
const MARQUEE_SEP = /[✦•·]/g;

/** Words that mean "we made this up from very little". */
function shortLabel(text: string): boolean {
  return text.length > 0 && text.length <= 40;
}

export function classifyBlock(block: Block, isFirst: boolean, heroClaimed = false): Classification {
  const { headings, paragraphs, images, repeated, embeds, text, bgImage } = block;
  const h1 = headings.find((h) => h.level === 1);
  const words = text.split(/\s+/).filter(Boolean).length;

  // ── Announcement strip ──────────────────────────────────
  // A rendered page often has one of these ahead of the hero — a scrolling
  // "free shipping ✦ 3 payments ✦ ..." bar. It has no heading and reads as a
  // wall of bullet-separated fragments; classified before the hero check so
  // it never steals block 0 from the real headline.
  if (
    headings.length === 0 &&
    words <= 40 &&
    (text.match(MARQUEE_SEP) ?? []).length >= 2 &&
    images.length <= 1
  ) {
    return { type: "banner", variant: "solid", confidence: "medium", evidence: "Franja de anuncios en movimiento" };
  }

  // ── Hero: the first block that actually carries a title ─
  // Not necessarily block 0 — a rendered page can inject an announcement bar,
  // a cookie notice or a promo strip ahead of the real hero. Scanning ahead a
  // few blocks for the first h1 is what keeps that from bumping the headline,
  // its lede and its buttons into a random middle section. `heroClaimed`
  // guards that lookahead so it only ever picks one: without it, an "about"
  // or "stats" block at index 1 or 2 that happens to reuse <h1> for styling
  // (common in scraped markup) qualified on its own and produced a second
  // hero stacked under the first.
  const isHero = isFirst || (!heroClaimed && block.index <= 2 && !!h1);

  // ── Video: the embed is unambiguous ────────────────────
  // Unless this is the hero with a background video: then the embed is the
  // hero's backdrop, not a video section, and treating it as one drops the
  // headline, the lede and the buttons sitting on top of it.
  if (!(isHero && h1) && embeds.some((e) => VIDEO_HOST.test(e))) {
    return {
      type: "video",
      variant: headings.length > 0 ? "framed" : "full",
      confidence: "high",
      evidence: "Contiene un video incrustado",
    };
  }

  if (isHero && (h1 || headings.length > 0) && words < 160) {
    // A full-bleed video or background image both render as "cover"; the
    // poster frame stands in for the video, which render.ts cannot play.
    const backdrop = bgImage || block.posterImage;
    const variant = backdrop ? "cover" : images.length > 0 ? "split" : "stack";
    return {
      type: "hero",
      variant,
      confidence: h1 ? "high" : "medium",
      evidence: h1 ? "Primer bloque con el título principal" : "Primer bloque de la página",
    };
  }

  // ── Contact: tel:/mailto: outrank everything ───────────
  // Checked before the repeated-group rules on purpose. A contact block is
  // usually a short list of similar links, which reads to those rules as a
  // card grid — and a phone number's leading "+57" reads as a statistic.
  const directContact = block.links.some((l) => /^(?:tel:|mailto:)/i.test(l.href));
  if (directContact) {
    return {
      type: "contact",
      variant: block.embeds.some((e) => /maps/i.test(e)) ? "split" : block.buttons.length > 1 ? "inline" : "card",
      confidence: "high",
      evidence: "Teléfono o correo de contacto",
    };
  }

  // ── Repeated-group rules ───────────────────────────────
  if (repeated.length >= 2) {
    const cards = repeated.map((r) => {
      const h = r.querySelector("h1,h2,h3,h4,h5,h6");
      return {
        el: r,
        text: visibleText(r),
        heading: h ? visibleText(h) : "",
        images: r.querySelectorAll("img").length,
        links: r.querySelectorAll("a").length,
      };
    });
    const n = cards.length;
    const withHeading = cards.filter((c) => c.heading).length;
    const withImage = cards.filter((c) => c.images > 0).length;

    // Pricing: money in most of the cards.
    if (cards.filter((c) => PRICE.test(c.text)).length >= Math.ceil(n / 2)) {
      return {
        type: "menu",
        variant: withImage >= n / 2 ? "cards" : n <= 4 ? "tiers" : "list",
        confidence: "high",
        evidence: `${n} elementos con precio`,
      };
    }

    // Stats: a big number plus a short label, repeated.
    const statLike = cards.filter(
      (c) => !PHONE_LIKE.test(c.text) && STAT_VALUE.test(c.text.split(/\s+/)[0] ?? "")
    ).length;
    if (cards.every((c) => c.text.split(/\s+/).length <= 6) && statLike >= Math.ceil(n / 2)) {
      return {
        type: "stats",
        variant: n <= 4 ? "row" : "cards",
        confidence: "high",
        evidence: `${n} cifras destacadas`,
      };
    }

    // Team: a person's name with a role underneath.
    if (withImage >= Math.ceil(n / 2) && cards.filter((c) => ROLE_HINT.test(c.text)).length >= Math.ceil(n / 2)) {
      return {
        type: "team",
        variant: withHeading === n && cards.some((c) => c.text.length > 90) ? "rows" : "grid",
        confidence: "high",
        evidence: `${n} perfiles con cargo`,
      };
    }

    // Testimonials: quoted text, optionally attributed.
    const quoted = cards.filter(
      (c) => QUOTE_HINT.test(c.text) || c.el.querySelector("blockquote")
    ).length;
    if (quoted >= Math.ceil(n / 2)) {
      return {
        type: "testimonials",
        variant: n === 1 ? "single" : "cards",
        confidence: "high",
        evidence: `${n} testimonios`,
      };
    }

    // FAQ: question-shaped headings, or native <details>.
    const questions = cards.filter((c) => QUESTION.test(c.heading) || QUESTION.test(c.text.slice(0, 120))).length;
    if (questions >= Math.ceil(n / 2) || repeated.every((r) => r.tagName?.toLowerCase() === "details")) {
      return {
        type: "faq",
        variant: n > 5 ? "twocol" : "list",
        confidence: "high",
        evidence: `${n} preguntas`,
      };
    }

    // Logo strip: images with essentially no text.
    if (withImage === n && text.length < n * 12) {
      return {
        type: "logos",
        variant: n > 6 ? "grid" : "row",
        confidence: "medium",
        evidence: `${n} logos sin texto`,
      };
    }

    // Gallery: images with at most a caption each.
    if (withImage >= Math.ceil(n * 0.8) && withHeading < n / 2 && words < n * 25) {
      return {
        type: "gallery",
        variant: n === 4 ? "grid2" : n > 6 ? "masonry" : "carousel",
        confidence: "medium",
        evidence: `${n} imágenes sin mucho texto`,
      };
    }

    // Features: the general "repeated cards with a title and a description".
    if (withHeading >= Math.ceil(n / 2)) {
      const variant =
        withImage >= Math.ceil(n / 2) && n <= 4 ? "rows" : n % 4 === 0 ? "grid4" : "grid3";
      return {
        type: "features",
        variant,
        confidence: "high",
        evidence: `${n} elementos con título y texto`,
      };
    }
  }

  // ── Single-block rules ─────────────────────────────────
  if (images.length >= 3 && words < images.length * 25) {
    return {
      type: "gallery",
      variant: images.length > 6 ? "masonry" : "grid2",
      confidence: "medium",
      evidence: `${images.length} imágenes`,
    };
  }

  // Contact by wording alone — the tel:/mailto: case already returned above.
  if (CONTACT_HINT.test(text) && words < 80) {
    return {
      type: "contact",
      variant: block.embeds.some((e) => /maps/i.test(e)) ? "split" : block.buttons.length > 1 ? "inline" : "card",
      confidence: "medium",
      evidence: "Menciona datos de contacto",
    };
  }

  // A short block whose whole point is one button.
  if (block.buttons.length >= 1 && words < 60 && headings.length <= 1) {
    return {
      type: "cta",
      variant: images.length > 0 || bgImage ? "band" : "boxed",
      confidence: "medium",
      evidence: "Bloque corto con un botón",
    };
  }

  // Prose with a supporting image reads as an "about" section. The threshold
  // is low on purpose: a two-sentence "quiénes somos" is still an about.
  if (headings.length >= 1 && words >= 25) {
    return {
      type: "about",
      variant: images.length > 0 ? "split" : "centered",
      confidence: "medium",
      evidence: images.length > 0 ? "Texto largo con imagen" : "Bloque de texto con título",
    };
  }

  // A one-line block with no heading is a banner far more often than anything
  // else — but say so with low confidence.
  if (words > 0 && words <= 20 && headings.length === 0 && shortLabel(text.slice(0, 60))) {
    return {
      type: "banner",
      variant: bgImage ? "image" : "solid",
      confidence: "low",
      evidence: "Franja de una línea",
    };
  }

  // ── Catch-all ──────────────────────────────────────────
  // Deliberately last and deliberately unconditional. Free text keeps the
  // content, keeps it editable, and keeps it in the right position.
  return {
    type: "columns",
    variant: paragraphs.length >= 4 ? "two" : "single",
    confidence: "low",
    evidence: "No reconocimos la forma de este bloque",
  };
}
