/**
 * The real sanitizer for "diseño original" demo content — server-only.
 *
 * Kept out of `verbatim.ts` on purpose. `render.ts` imports from `verbatim.ts`
 * (for `buildVerbatimDocument`), and `render.ts` is imported directly by the
 * client-side `DemoBuilder.tsx` for its live preview iframe — which makes
 * anything `verbatim.ts` imports part of the browser bundle. `sanitize-html`
 * is a Node-oriented package with a real dependency tree; it has no reason to
 * ship to a browser, and this file is what keeps it from doing so by
 * accident. Only server code — the import route and the demo save route —
 * ever imports this module.
 *
 * A scraped page might contain literally anything, including exactly the
 * payloads a public page must never re-serve. This is the one place that
 * HTML crosses from "arbitrary" to "safe to serve publicly": a real
 * allowlist pass, not the string-replace helpers in validate.ts, which are
 * sized for short scalar values, not a full document.
 *
 * Called from two places, and both matter:
 *  - The import route, for content coming from a scrape (headless render,
 *    GitHub file, uploaded file).
 *  - `PUT /api/demo-pages/[id]`, because "demos" is shared workspace granted
 *    to every signed-in teammate — that route accepts a raw `config` from
 *    the client and must not trust that `verbatim.html` already went through
 *    the importer. Skipping that second call would mean a request that
 *    bypasses the importer and posts to the save endpoint directly reaches
 *    the database, and every future visitor, completely unfiltered.
 */

import sanitizeHtml from "sanitize-html";
import { MAX_VERBATIM_CSS, MAX_VERBATIM_HTML } from "./verbatim";

const ALLOWED_TAGS = [
  "html", "head", "body", "title", "meta", "link",
  "div", "span", "section", "article", "aside", "main", "nav", "header", "footer",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
  "ul", "ol", "li", "dl", "dt", "dd",
  "a", "strong", "b", "em", "i", "u", "s", "small", "mark", "sub", "sup", "abbr", "time", "q", "cite", "code", "pre",
  "img", "picture", "source", "figure", "figcaption", "video", "audio",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption",
  "button", "label", "select", "option", "textarea", "input", "form", "fieldset", "legend",
  "svg", "path", "circle", "rect", "line", "polygon", "polyline", "g", "defs", "use", "clippath", "lineargradient", "radialgradient", "stop",
];

// class/id/style everywhere: the whole point is preserving the original
// presentation, and the CSS the page ships targets exactly those hooks.
// `on*` handlers are excluded by omission — sanitize-html drops any
// attribute not explicitly allowlisted, so there is no event-handler
// blocklist to keep up to date; a new `onpointerrawupdate` is unsafe by
// construction, not because someone remembered to add it to a list.
const GLOBAL_ATTRS = ["class", "id", "style", "title", "lang", "dir", "role", "tabindex", "aria-*", "data-*"];

const VERBATIM_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    "*": GLOBAL_ATTRS,
    a: ["href", "target", "rel"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
    source: ["srcset", "src", "sizes", "media", "type"],
    video: ["src", "poster", "controls", "autoplay", "muted", "loop", "playsinline", "preload", "width", "height"],
    audio: ["src", "controls", "autoplay", "muted", "loop", "preload"],
    link: ["rel", "href", "as", "type", "crossorigin"],
    meta: ["name", "property", "content", "charset"],
    // A form can stay for its visual shape, but never for behaviour: no
    // `action`/`method`, so submitting it (there is no JS left to intercept
    // the event) can only reload the current page, not send data anywhere.
    form: ["class", "id", "style"],
    input: ["type", "placeholder", "value", "disabled", "checked", "readonly", "min", "max", "step"],
    button: ["type", "disabled"],
    select: ["disabled"],
    option: ["value", "selected"],
    time: ["datetime"],
    svg: ["viewbox", "width", "height", "xmlns", "fill", "stroke"],
    path: ["d", "fill", "stroke", "stroke-width"],
    circle: ["cx", "cy", "r", "fill", "stroke"],
    rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke"],
    use: ["href"],
  },
  // http(s) for real links/media, data: for inlined small images/fonts the
  // page may have embedded, mailto:/tel: for contact links. Nothing else —
  // in particular no javascript:, no vbscript:.
  allowedSchemes: ["http", "https", "data", "mailto", "tel"],
  allowedSchemesByTag: { a: ["http", "https", "mailto", "tel"] },
  allowProtocolRelative: true,
  // script/style/iframe/object/embed/base/template are absent from
  // allowedTags, so sanitize-html's default discard behaviour removes them
  // (and, for script/style, their text content too — the dangerous part).
  disallowedTagsMode: "discard",
};

/**
 * The one pass every scraped page goes through before it can be stored.
 *
 * `<script>` is already gone by the time this runs for a headless-rendered
 * page (headless.ts strips it in-browser, before serialising), but this is
 * the boundary that actually enforces it — file-upload and GitHub sources
 * never touch a browser, so for them this is the only thing standing
 * between "text a stranger wrote" and the database.
 */
export function sanitizeVerbatimHtml(html: string): string {
  const trimmed = typeof html === "string" ? html : "";
  return sanitizeHtml(trimmed, VERBATIM_SANITIZE_OPTIONS).slice(0, MAX_VERBATIM_HTML);
}

/**
 * CSS gets a lighter pass than HTML: `<style>` content can't execute
 * anything by itself, so the risks are narrower — smuggling markup out of
 * the style block, or pulling in an arbitrary remote sheet via `@import`.
 * Reuses the same strips as `safeCss` in validate.ts but with a cap sized
 * for a real stylesheet (a template's `customCss` is a few hand-written
 * rules; an imported site's CSS is however big the site's CSS actually is).
 */
export function sanitizeVerbatimCss(css: string): string {
  if (typeof css !== "string") return "";
  return css
    .replace(/<\/\s*style/gi, "")
    .replace(/<!--|-->/g, "")
    .replace(/@import/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behaviou?r\s*:/gi, "")
    .slice(0, MAX_VERBATIM_CSS);
}
