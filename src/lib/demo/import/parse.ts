/**
 * HTML → structural blocks.
 *
 * Step one of the importer. This does no interpretation: it strips what can
 * never survive (scripts, styles as markup), finds the nav and footer, cuts
 * the body into the biggest units that look like page sections, and measures
 * each one. Deciding what a block *is* happens in classify.ts, using the
 * measurements taken here.
 *
 * The measurements are shape-based, never class-name-based. A page written by
 * Claude Code, a Tailwind div-soup export and a hand-written 2004 layout all
 * describe a three-card feature row differently in their markup, but all three
 * produce the same shape: a parent with three structurally similar children,
 * each holding a heading and a paragraph.
 */

import { parse, HTMLElement, NodeType } from "node-html-parser";

export interface ImgRef {
  src: string;
  alt: string;
}

export interface LinkRef {
  href: string;
  text: string;
}

/** Everything classify.ts and extract.ts need, measured once. */
export interface Block {
  el: HTMLElement;
  /** Position in the document. 0 is the first block — the hero candidate. */
  index: number;
  tag: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  images: ImgRef[];
  links: LinkRef[];
  /** Links/buttons that read as calls to action, not navigation. */
  buttons: LinkRef[];
  embeds: string[];
  /** Structurally similar sibling elements — the signal behind most rules. */
  repeated: HTMLElement[];
  /** All visible text, collapsed. */
  text: string;
  /** A background image declared inline, which markup hides from `images`. */
  bgImage: string;
}

export interface SourceDoc {
  title: string;
  meta: Record<string, string>;
  nav: HTMLElement | null;
  footer: HTMLElement | null;
  blocks: Block[];
  /** CSS custom properties found on :root — the best colour signal there is. */
  cssVars: Record<string, string>;
  /** Google Fonts families referenced by the document. */
  fonts: string[];
  /** Relative URLs could not be resolved (no base given). */
  unresolvedUrls: boolean;
}

const BLOCK_TAGS = new Set(["section", "header", "article", "div", "main", "aside"]);
const DROP_TAGS = new Set(["script", "noscript", "style", "template", "svg", "canvas", "iframe"]);
const BUTTON_HINT = /\b(btn|button|cta|action)\b/i;

/** Collapses whitespace the way a browser would before showing text. */
function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

const TEXT_BLOCK = new Set([
  "p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6",
  "tr", "td", "th", "section", "article", "header", "footer", "dt", "dd", "blockquote",
]);

/**
 * Text as a reader would see it, with block boundaries as spaces.
 *
 * `.text` concatenates raw, so `<p>12</p><p>años</p>` comes back as "12años"
 * — which silently breaks every rule that counts words or tests the first
 * token. Every measurement in the importer goes through this instead.
 */
export function visibleText(el: HTMLElement): string {
  let out = "";
  const walk = (node: HTMLElement) => {
    if (node.nodeType === NodeType.TEXT_NODE) {
      out += node.text;
      return;
    }
    if (node.nodeType !== NodeType.ELEMENT_NODE) return;
    const tag = node.tagName?.toLowerCase() ?? "";
    if (TEXT_BLOCK.has(tag)) out += " ";
    for (const c of node.childNodes) walk(c as HTMLElement);
    if (TEXT_BLOCK.has(tag)) out += " ";
  };
  walk(el);
  return clean(out);
}

/**
 * Resolves a URL found in the source against the page it came from.
 *
 * Without a base (a file upload has none) relative paths are returned
 * unchanged and flagged, rather than silently dropped — a broken image the
 * user can see and fix beats an image that quietly vanished.
 */
export function resolveUrl(raw: string | undefined, base?: string): { url: string; unresolved: boolean } {
  const s = (raw ?? "").trim();
  if (!s) return { url: "", unresolved: false };
  if (/^(?:https?:|data:|mailto:|tel:|#)/i.test(s)) return { url: s, unresolved: false };
  if (!base) return { url: s, unresolved: true };
  try {
    return { url: new URL(s, base).href, unresolved: false };
  } catch {
    return { url: s, unresolved: true };
  }
}

/**
 * A fingerprint of an element's structure, ignoring its content.
 *
 * Two feature cards differ in every word and image but share this signature,
 * which is what lets a repeated group be detected without knowing anything
 * about the site's CSS conventions.
 */
function signature(el: HTMLElement): string {
  const tags = el.querySelectorAll("*").map((c) => c.tagName?.toLowerCase()).filter(Boolean);
  const counts = new Map<string, number>();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  // Bucketed counts: three cards where one has an extra <br> still match.
  return [...counts.entries()]
    .sort()
    .map(([t, n]) => `${t}${n > 3 ? "+" : n}`)
    .join(",");
}

function hasContent(el: HTMLElement): boolean {
  return visibleText(el).length > 2 || el.querySelectorAll("img,video,iframe").length > 0;
}

/**
 * Finds the largest set of structurally similar siblings inside a block.
 *
 * Searched breadth-first from the block down, and the first level that yields
 * a group wins — so a grid of cards is found as the cards, not as the
 * paragraphs nested three levels inside them.
 */
function findRepeated(block: HTMLElement): HTMLElement[] {
  const queue: HTMLElement[] = [block];
  let best: HTMLElement[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const children = node.childNodes.filter(
      (c): c is HTMLElement => c.nodeType === NodeType.ELEMENT_NODE && hasContent(c as HTMLElement)
    );

    if (children.length >= 2) {
      const groups = new Map<string, HTMLElement[]>();
      for (const c of children) {
        const key = `${c.tagName?.toLowerCase()}|${signature(c)}`;
        groups.set(key, [...(groups.get(key) ?? []), c]);
      }
      for (const group of groups.values()) {
        if (group.length >= 2 && group.length > best.length) best = group;
      }
      if (best.length >= 2) return best;
    }

    for (const c of children) queue.push(c);
  }

  return best;
}

function measure(el: HTMLElement, index: number, base: string | undefined, doc: { unresolved: boolean }): Block {
  const resolve = (raw: string | undefined) => {
    const r = resolveUrl(raw, base);
    if (r.unresolved) doc.unresolved = true;
    return r.url;
  };

  const headings = el
    .querySelectorAll("h1,h2,h3,h4,h5,h6")
    .map((h) => ({ level: Number(h.tagName[1]), text: visibleText(h) }))
    .filter((h) => h.text);

  const paragraphs = el
    .querySelectorAll("p,li,blockquote,dd,dt")
    .map((p) => visibleText(p))
    .filter((t) => t.length > 1);

  const images: ImgRef[] = el.querySelectorAll("img").map((img) => ({
    src: resolve(img.getAttribute("src") ?? img.getAttribute("data-src")),
    alt: clean(img.getAttribute("alt") ?? ""),
  }));

  const anchors = el.querySelectorAll("a");
  const links: LinkRef[] = anchors
    .map((a) => ({ href: resolve(a.getAttribute("href")), text: visibleText(a) }))
    .filter((l) => l.text || l.href);

  // A call to action is a link that looks like a button, or the only link in a
  // block that otherwise reads as prose.
  const buttons: LinkRef[] = anchors
    .filter((a) => {
      const cls = a.getAttribute("class") ?? "";
      const role = a.getAttribute("role") ?? "";
      return BUTTON_HINT.test(cls) || role === "button";
    })
    .map((a) => ({ href: resolve(a.getAttribute("href")), text: visibleText(a) }))
    .filter((b) => b.text);

  const embeds = [...el.querySelectorAll("iframe"), ...el.querySelectorAll("video")]
    .map((f) => resolve(f.getAttribute("src") ?? f.querySelector("source")?.getAttribute("src")))
    .filter(Boolean);

  const styleAttr = el.getAttribute("style") ?? "";
  const bgMatch = /background(?:-image)?\s*:[^;]*url\((['"]?)([^'")]+)\1\)/i.exec(styleAttr);

  return {
    el,
    index,
    tag: el.tagName?.toLowerCase() ?? "div",
    headings,
    paragraphs,
    images,
    links,
    buttons,
    embeds,
    repeated: findRepeated(el),
    text: visibleText(el),
    bgImage: bgMatch ? resolve(bgMatch[2]) : "",
  };
}

/**
 * Descends through wrapper elements that hold exactly one child.
 *
 * Almost every generated page nests the real content a few layers deep
 * (`<body><div id="root"><div class="container">…`). Without this, the whole
 * page reads as a single block.
 */
function unwrap(el: HTMLElement): HTMLElement {
  let cur = el;
  for (let depth = 0; depth < 6; depth++) {
    const children = cur.childNodes.filter(
      (c): c is HTMLElement => c.nodeType === NodeType.ELEMENT_NODE && hasContent(c as HTMLElement)
    );
    if (children.length !== 1 || !BLOCK_TAGS.has(children[0].tagName?.toLowerCase() ?? "")) break;
    cur = children[0];
  }
  return cur;
}

/** How much of a block's text is link labels — the giveaway for a nav strip. */
function linkTextRatio(el: HTMLElement): number {
  const total = visibleText(el).length;
  if (total === 0) return 0;
  const inLinks = el.querySelectorAll("a").reduce((n, a) => n + visibleText(a).length, 0);
  return inLinks / total;
}

function isNavLike(el: HTMLElement): boolean {
  const links = el.querySelectorAll("a").length;
  return (
    links >= 2 &&
    links <= 12 &&
    el.querySelectorAll("h1,h2,h3").length === 0 &&
    visibleText(el).length < 220 &&
    linkTextRatio(el) > 0.6
  );
}

function isFooterLike(el: HTMLElement): boolean {
  const text = visibleText(el);
  if (text.length > 600) return false;
  if (/©|&copy;|todos los derechos|all rights reserved/i.test(text)) return true;
  return el.querySelectorAll("a").length >= 2 && el.querySelectorAll("h1,h2").length === 0 && linkTextRatio(el) > 0.5;
}

/**
 * Last resort for documents with no sectioning elements at all: cut at every
 * top-level heading, so at minimum the page arrives as one editable block per
 * topic instead of one giant wall.
 */
function splitByHeadings(container: HTMLElement): HTMLElement[] {
  const children = container.childNodes.filter(
    (c): c is HTMLElement => c.nodeType === NodeType.ELEMENT_NODE
  );
  const groups: HTMLElement[] = [];
  let current: HTMLElement | null = null;

  for (const child of children) {
    const tag = child.tagName?.toLowerCase() ?? "";
    if (/^h[12]$/.test(tag) || !current) {
      current = new HTMLElement("section", {}, "", null, [0, 0]);
      groups.push(current);
    }
    current.appendChild(child.clone() as HTMLElement);
  }

  return groups.filter(hasContent);
}

export function parseSource(html: string, baseUrl?: string): SourceDoc {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: true } });

  const meta: Record<string, string> = {};
  for (const m of root.querySelectorAll("meta")) {
    const key = m.getAttribute("property") ?? m.getAttribute("name");
    const content = m.getAttribute("content");
    if (key && content) meta[key.toLowerCase()] = content;
  }

  // Colours live in :root custom properties far more reliably than anywhere
  // else, and they survive even when the rest of the CSS is unreachable.
  const cssVars: Record<string, string> = {};
  for (const style of root.querySelectorAll("style")) {
    for (const [, name, value] of style.text.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)) {
      cssVars[name.toLowerCase()] = value.trim();
    }
  }

  const fonts: string[] = [];
  for (const link of root.querySelectorAll('link[href*="fonts.googleapis"]')) {
    for (const [, family] of (link.getAttribute("href") ?? "").matchAll(/family=([^&:]+)/g)) {
      fonts.push(decodeURIComponent(family.replace(/\+/g, " ")));
    }
  }

  let nav = root.querySelector("nav") ?? root.querySelector("header nav");
  const footers = root.querySelectorAll("footer");
  let footer: HTMLElement | null = footers.length > 0 ? footers[footers.length - 1] : null;

  // Remove everything that cannot become a section before segmenting, so a
  // `<script>` never counts as a block or contributes to a signature.
  for (const el of root.querySelectorAll([...DROP_TAGS].join(","))) {
    // Embeds are measured before removal — a video section needs its src.
    if (el.tagName?.toLowerCase() === "iframe") continue;
    el.remove();
  }
  nav?.remove();
  footer?.remove();

  const body = root.querySelector("main") ?? root.querySelector("body") ?? root;
  const container = unwrap(body);

  let candidates = container.childNodes.filter(
    (c): c is HTMLElement =>
      c.nodeType === NodeType.ELEMENT_NODE &&
      BLOCK_TAGS.has((c as HTMLElement).tagName?.toLowerCase() ?? "") &&
      hasContent(c as HTMLElement)
  );

  if (candidates.length < 2) {
    const semantic = container.querySelectorAll("section,article").filter(hasContent);
    candidates = semantic.length >= 2 ? semantic : splitByHeadings(container);
  }
  if (candidates.length === 0 && hasContent(container)) candidates = [container];

  // Pages built out of plain <div>s have no <nav> or <footer> to find, so the
  // header bar and the copyright strip arrive as ordinary blocks — which then
  // classify as junk sections and, worse, steal position 0 from the real hero.
  // Recognised by shape: a strip whose text is almost entirely link labels.
  if (!nav && candidates.length > 1 && isNavLike(candidates[0])) {
    nav = candidates[0];
    candidates = candidates.slice(1);
  }
  if (!footer && candidates.length > 1 && isFooterLike(candidates[candidates.length - 1])) {
    footer = candidates[candidates.length - 1];
    candidates = candidates.slice(0, -1);
  }

  const state = { unresolved: false };
  const blocks = candidates.map((el, i) => measure(el, i, baseUrl, state));

  return {
    title: clean(root.querySelector("title")?.text ?? ""),
    meta,
    nav: nav ?? null,
    footer: footer ?? null,
    blocks,
    cssVars,
    fonts,
    unresolvedUrls: state.unresolved,
  };
}
