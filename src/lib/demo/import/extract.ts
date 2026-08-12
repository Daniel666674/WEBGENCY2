/**
 * Block + classification → a filled-in `Section`.
 *
 * Field limits here are truncations, not guesses: the zod schema in
 * validate.ts *rejects* over-length strings rather than trimming them, so an
 * imported page with a 700-character heading would fail the whole save. Every
 * value is cut to the schema's limit before it leaves this file.
 *
 * Inline formatting survives. The source's bold, italics and links are kept
 * (see `inlineHtml`) because flattening a page to plain text throws away
 * emphasis the author chose deliberately, and `sanitizeRich` already accepts
 * exactly that subset.
 */

import { HTMLElement, NodeType } from "node-html-parser";
import type { Section, SectionItem, MediaRef } from "../types";
import { newId } from "../types";
import type { Block, ImgRef } from "./parse";
import type { Classification } from "./classify";

/** Mirrors the caps in validate.ts's sectionSchema. */
const LIMIT = {
  eyebrow: 200,
  heading: 500,
  subheading: 2_000,
  body: 20_000,
  ctaText: 200,
  itemTitle: 500,
  itemBody: 5_000,
  price: 100,
  author: 200,
  role: 200,
  alt: 300,
  items: 60,
} as const;

const INLINE_KEEP = new Set(["strong", "b", "em", "i", "u", "a", "br"]);
const BLOCK_LEVEL = new Set(["p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "section"]);

const cut = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Serializes an element keeping only the inline tags `sanitizeRich` allows.
 *
 * Anything else contributes its text but not its markup, so a
 * `<div class="x"><strong>Hola</strong></div>` becomes `<strong>Hola</strong>`
 * rather than escaped div soup shown literally on the page.
 */
function inlineHtml(el: HTMLElement): string {
  let out = "";

  const walk = (node: HTMLElement | { nodeType: number; text: string }) => {
    if (node.nodeType === NodeType.TEXT_NODE) {
      out += node.text.replace(/\s+/g, " ");
      return;
    }
    if (node.nodeType !== NodeType.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tag = element.tagName?.toLowerCase() ?? "";

    if (tag === "br") {
      out += "<br/>";
      return;
    }
    if (INLINE_KEEP.has(tag)) {
      const href = tag === "a" ? element.getAttribute("href") : null;
      const open = tag === "a" ? (href ? `<a href="${href}">` : "") : `<${tag}>`;
      const close = tag === "a" ? (href ? "</a>" : "") : `</${tag}>`;
      out += open;
      for (const c of element.childNodes) walk(c as HTMLElement);
      out += close;
      return;
    }

    for (const c of element.childNodes) walk(c as HTMLElement);
    if (BLOCK_LEVEL.has(tag)) out += " ";
  };

  for (const c of el.childNodes) walk(c as HTMLElement);
  return out.replace(/[^\S\n]+/g, " ").trim();
}

function mediaOf(img: ImgRef | undefined, kind: "image" | "video" = "image"): MediaRef | undefined {
  if (!img?.src) return undefined;
  return { url: img.src, alt: cut(img.alt, LIMIT.alt) || undefined, kind };
}

/** The image most likely to be the section's subject, not an icon. */
function heroImage(block: Block): ImgRef | undefined {
  if (block.bgImage) return { src: block.bgImage, alt: "" };
  return block.images.find((i) => i.src && !/icon|logo|sprite/i.test(i.src)) ?? block.images[0];
}

function firstButton(block: Block): { text: string; url: string } | undefined {
  const b = block.buttons[0] ?? block.links.find((l) => l.text.length > 0 && l.text.length < 40);
  return b ? { text: cut(b.text, LIMIT.ctaText), url: b.href } : undefined;
}

/** Splits a card into title / body / price / role the way a reader would. */
function itemFrom(el: HTMLElement): SectionItem {
  const headingEl = el.querySelector("h1,h2,h3,h4,h5,h6");
  const strongEl = !headingEl ? el.querySelector("strong,b,dt") : null;
  const titleEl = headingEl ?? strongEl;
  const title = titleEl ? clean(titleEl.text) : "";

  const img = el.querySelector("img");
  const priceMatch = /(?:\$|€|COP|USD|MXN)\s?[\d.,]{2,}(?:\s?\/\s?\w+)?/i.exec(el.text);

  // Body is everything except the title, so the title never appears twice.
  const bodyParts = el
    .querySelectorAll("p,li,blockquote,dd,span")
    .filter((p) => clean(p.text) && clean(p.text) !== title)
    .map((p) => inlineHtml(p))
    .filter(Boolean);
  const body = bodyParts.length > 0 ? bodyParts.join("\n") : clean(el.text) === title ? "" : inlineHtml(el);

  const roleMatch =
    /\b(?:ceo|cto|coo|cmo|founder|cofounder|fundador[ae]?s?|director[ae]?s?|gerente|manager|lead|jefe|jefa|socio[as]?|dise[ñn]ador[ae]?s?|desarrollador[ae]?s?|estratega|consultor[ae]?s?|arquitect[oa]s?|fot[óo]graf[oa]s?)\b[^.\n]{0,40}/i.exec(
      el.text
    );

  return {
    title: title ? cut(title, LIMIT.itemTitle) : undefined,
    body: body ? cut(body, LIMIT.itemBody) : undefined,
    media: mediaOf(img ? { src: img.getAttribute("src") ?? "", alt: img.getAttribute("alt") ?? "" } : undefined),
    price: priceMatch ? cut(priceMatch[0], LIMIT.price) : undefined,
    role: roleMatch ? cut(clean(roleMatch[0]), LIMIT.role) : undefined,
  };
}

/** Items for gallery/logos, where each entry is an image and maybe a caption. */
function imageItems(block: Block): SectionItem[] {
  return block.images
    .filter((i) => i.src)
    .slice(0, LIMIT.items)
    .map((i) => ({ title: i.alt ? cut(i.alt, LIMIT.itemTitle) : undefined, media: mediaOf(i) }));
}

export function extractSection(block: Block, c: Classification): Section {
  const base: Section = {
    id: newId(),
    type: c.type,
    variant: c.variant,
    enabled: true,
  };

  const headings = block.headings;
  const mainHeading = headings.find((h) => h.level <= 2) ?? headings[0];
  const heading = mainHeading ? cut(mainHeading.text, LIMIT.heading) : "";

  // Paragraphs that belong to the section itself rather than to its cards.
  const ownParagraphs = block.el
    .querySelectorAll("p")
    .filter((p) => !block.repeated.some((r) => r !== p && r.querySelectorAll("p").includes(p)))
    .map((p) => inlineHtml(p))
    .filter(Boolean);

  const lede = ownParagraphs[0] ?? "";
  const cta = firstButton(block);

  switch (c.type) {
    case "hero": {
      const eyebrowCandidate = headings.length > 1 && mainHeading !== headings[0] ? headings[0].text : "";
      return {
        ...base,
        eyebrow: eyebrowCandidate ? cut(eyebrowCandidate, LIMIT.eyebrow) : undefined,
        heading: heading || cut(block.text.slice(0, 120), LIMIT.heading),
        subheading: lede ? cut(lede, LIMIT.subheading) : undefined,
        ctaText: cta?.text,
        ctaUrl: cta?.url,
        media: mediaOf(heroImage(block)),
        style: block.bgImage ? { overlay: 45 } : undefined,
      };
    }

    case "video":
      return {
        ...base,
        heading: heading || undefined,
        subheading: lede ? cut(lede, LIMIT.subheading) : undefined,
        media: block.embeds[0] ? { url: block.embeds[0], kind: "video" } : undefined,
      };

    case "gallery":
    case "logos":
      return {
        ...base,
        heading: heading || undefined,
        subheading: lede ? cut(lede, LIMIT.subheading) : undefined,
        items: block.repeated.length >= 2 ? block.repeated.slice(0, LIMIT.items).map(itemFrom) : imageItems(block),
      };

    case "features":
    case "menu":
    case "team":
    case "faq":
    case "testimonials":
    case "stats":
      return {
        ...base,
        heading: heading || undefined,
        subheading: lede ? cut(lede, LIMIT.subheading) : undefined,
        items: block.repeated.slice(0, LIMIT.items).map(itemFrom),
        ctaText: cta?.text,
        ctaUrl: cta?.url,
      };

    case "cta":
    case "banner":
      return {
        ...base,
        heading: heading || cut(clean(block.text).slice(0, 120), LIMIT.heading),
        body: lede ? cut(lede, LIMIT.body) : undefined,
        ctaText: cta?.text,
        ctaUrl: cta?.url,
      };

    case "contact":
      return {
        ...base,
        heading: heading || undefined,
        body: cut(ownParagraphs.join("\n") || inlineHtml(block.el), LIMIT.body) || undefined,
        ctaText: cta?.text,
        ctaUrl: cta?.url,
      };

    case "about":
      return {
        ...base,
        heading: heading || undefined,
        body: cut(ownParagraphs.join("\n") || inlineHtml(block.el), LIMIT.body) || undefined,
        media: mediaOf(heroImage(block)),
        ctaText: cta?.text,
        ctaUrl: cta?.url,
      };

    default: {
      // columns — the catch-all. Keep the heading if there was one, and put
      // every remaining paragraph in as items so nothing is lost.
      const paragraphs = ownParagraphs.length > 0 ? ownParagraphs : [inlineHtml(block.el)];
      return {
        ...base,
        heading: heading || undefined,
        items: paragraphs
          .filter(Boolean)
          .slice(0, LIMIT.items)
          .map((body) => ({ body: cut(body, LIMIT.itemBody) })),
      };
    }
  }
}
