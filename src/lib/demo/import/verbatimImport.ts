/**
 * Assembles a "diseño original" demo: the source pages' own HTML and CSS,
 * kept as-is instead of decomposed into `Section`s.
 *
 * Structurally this mirrors `multipage.ts` closely on purpose — same home
 * detection, same slug/title derivation, same internal-link rewiring — and
 * reuses those exact helpers rather than re-deriving them, so a repo that
 * imports cleanly in section mode imports into the same page structure here.
 * What's different is what happens to each page's *content*: section mode
 * runs it through `classifyBlock`/`extractSection`; this runs it through
 * `sanitizeVerbatimHtml` and stores the result untouched.
 *
 * Two kinds of source arrive here, and they need different treatment before
 * that sanitize pass:
 *
 *  - **Rendered** (the "Desde una URL" tab, via headless.ts): a real browser
 *    already ran the page's scripts, resolved every relative URL to
 *    absolute, and stripped `<script>` tags. Nothing left to do but sanitize.
 *  - **Not rendered** (GitHub, a plain file upload): raw file text, exactly
 *    as it sits in the repo — relative `src="assets/hero.jpg"` and all.
 *    `resolveServerSide()` is the Node-side equivalent of what headless.ts
 *    does inside a live browser: same script-stripping, same
 *    relative-to-absolute rewrite, using the same `resolveUrl()` the
 *    section-mode importer already trusts.
 */

import { parse as parseHtml } from "node-html-parser";
import type { DemoConfig, DemoPage } from "../types";
import { newId } from "../types";
import { getTemplate } from "../templates";
import { sanitizeVerbatimCss, sanitizeVerbatimHtml } from "../verbatimSanitize";
import { resolveUrl } from "./parse";
import {
  anchorOf,
  commonRoot,
  hrefFor,
  isIndex,
  MAX_PAGES,
  normalizePath,
  resolveLocal,
  slugFor,
  titleFor,
} from "./multipage";

export interface VerbatimSourceFile {
  /** Repo path (GitHub), file name (upload), or page URL (headless render). */
  path: string;
  html: string;
  /** Resolves relative URLs for non-rendered sources. Absent for a plain
   *  file upload with nothing to resolve against. */
  baseUrl?: string;
  /** This page's stylesheet text — captured by headless.ts, or fetched
   *  alongside a GitHub file, or dropped in by hand with the upload. */
  css?: string[];
  /** True when `html` already went through a real browser: URLs are
   *  absolute and scripts are gone. Anything else still needs both. */
  rendered?: boolean;
}

export interface VerbatimPageReport {
  id: string;
  slug: string;
  title: string;
  path: string;
  isHome: boolean;
  /** Combined size of this page's stored html+css, for the review step. */
  bytes: number;
}

export interface VerbatimOutcome {
  config: DemoConfig;
  report: {
    pages: VerbatimPageReport[];
    warnings: string[];
    linksRewired: number;
  };
}

export interface VerbatimImportOptions {
  title?: string;
}

const TITLE_TAG = /<title[^>]*>([\s\S]*?)<\/title>/i;

function titleFromHtml(html: string): string {
  const m = TITLE_TAG.exec(html);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

/** "Acme — Diseño web", "Acme | Home" and "Acme: Tienda BMX" all mean the
 *  brand is "Acme". */
function brandNameFromTitle(title: string): string {
  return title.split(/[|—–·:-]/)[0].trim();
}

/**
 * Node-side equivalent of the in-browser pass in headless.ts: strips
 * `<script>`/`<noscript>`/`<base>` and resolves every relative src/href/
 * srcset/poster/inline-style-url against `baseUrl`.
 */
function resolveServerSide(html: string, baseUrl: string | undefined): string {
  const root = parseHtml(html, { comment: false });
  root.querySelectorAll("script, noscript, base").forEach((el) => el.remove());

  const resolve = (raw: string | undefined | null) => resolveUrl(raw ?? undefined, baseUrl).url;

  for (const el of root.querySelectorAll("img,video,source,link")) {
    const src = el.getAttribute("src");
    if (src) el.setAttribute("src", resolve(src));
    const poster = el.getAttribute("poster");
    if (poster) el.setAttribute("poster", resolve(poster));
    const href = el.getAttribute("href");
    if (href) el.setAttribute("href", resolve(href));
    const srcset = el.getAttribute("srcset");
    if (srcset) {
      el.setAttribute(
        "srcset",
        srcset
          .split(",")
          .map((part) => {
            const [url, descriptor] = part.trim().split(/\s+/, 2);
            return [resolve(url), descriptor].filter(Boolean).join(" ");
          })
          .join(", ")
      );
    }
  }

  // Fragment-only anchors ("#contacto") are left alone on purpose — same-page
  // navigation should keep working without becoming a round trip through an
  // absolute URL back to the original site.
  for (const el of root.querySelectorAll("a[href]")) {
    const href = el.getAttribute("href") ?? "";
    if (!href || href.startsWith("#")) continue;
    el.setAttribute("href", resolve(href));
  }

  for (const el of root.querySelectorAll("[style*='url(']")) {
    const style = el.getAttribute("style") ?? "";
    el.setAttribute(
      "style",
      style.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q: string, url: string) => `url(${q}${resolve(url)}${q})`)
    );
  }

  return root.toString();
}

export function importVerbatim(rawFiles: VerbatimSourceFile[], opts: VerbatimImportOptions = {}): VerbatimOutcome {
  if (rawFiles.length === 0) throw new Error("No hay archivos para importar");

  const files = rawFiles.map((f) => ({ ...f, path: normalizePath(f.path) })).slice(0, MAX_PAGES);

  const home =
    files.find((f) => isIndex(f.path) && !f.path.includes("/")) ??
    files.find((f) => isIndex(f.path)) ??
    [...files].sort((a, b) => a.path.split("/").length - b.path.split("/").length)[0];

  const ordered = [home, ...files.filter((f) => f !== home)];

  const resolved = ordered.map((f) => ({
    ...f,
    html: f.rendered ? f.html : resolveServerSide(f.html, f.baseUrl),
  }));

  // `resolved` spreads each file into a new object, so identity comparison
  // against `home` would never match here even though `ordered[0]` — which
  // `resolved` preserves the order of — always *is* home by construction.
  const pages: DemoPage[] = resolved.map((f, i) => ({
    id: newId(),
    slug: slugFor(f.path, home.path),
    title: titleFor(f.path, titleFromHtml(f.html), i === 0),
    sections: [],
  }));

  // Two files can flatten to the same slug — disambiguate rather than fail
  // the whole import, same as the section-mode importer.
  const seen = new Set<string>();
  for (const page of pages) {
    let slug = page.slug;
    for (let n = 2; seen.has(slug); n++) slug = `${page.slug}-${n}`.slice(0, 60);
    page.slug = slug;
    seen.add(slug);
  }

  // Internal nav links: an href that resolves to one of the OTHER imported
  // pages gets rewritten to the demo's own page path, so clicking "Armar tu
  // BMX" inside the imported nav stays inside the demo instead of leaving
  // for the original live site. Anything that doesn't match a known page —
  // social links, external CDNs, mailto: — is left exactly as resolved.
  const rawRoot = commonRoot(resolved);
  const byPath = new Map(resolved.map((f, i) => [f.path, pages[i]]));
  let linksRewired = 0;

  const verbatim: Record<string, { html: string; css: string }> = {};
  // A page whose markup *references* a stylesheet but whose captured `css`
  // came back empty means the fetch failed somewhere upstream (a private
  // repo, a network hiccup, a stylesheet path our own resolution got wrong)
  // — not that the page is genuinely unstyled. In verbatim mode that
  // difference matters enormously: there is no template palette to fall
  // back to, so a lost stylesheet is a lost page, and it needs to say so
  // rather than ship silently blank.
  let missingCssPages = 0;
  for (const [i, f] of resolved.entries()) {
    const page = pages[i];
    const root = parseHtml(f.html, { comment: false });
    const referencesStylesheet = root.querySelectorAll("link").some((l) =>
      /stylesheet/i.test(l.getAttribute("rel") ?? "")
    );

    for (const a of root.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") ?? "";
      const target = byPath.get(resolveLocal(href, f.path, rawRoot));
      if (!target || target === page) continue;
      a.setAttribute("href", hrefFor(target) + anchorOf(href));
      linksRewired++;
    }

    const css = sanitizeVerbatimCss((f.css ?? []).join("\n"));
    if (referencesStylesheet && !css.trim()) missingCssPages++;

    verbatim[page.slug] = {
      html: sanitizeVerbatimHtml(root.toString()),
      css,
    };
  }

  const template = getTemplate("editorial");
  const defaults = template.defaults();
  const brandName = opts.title || brandNameFromTitle(titleFromHtml(resolved[0].html)) || "Demo importado";

  const config: DemoConfig = {
    ...defaults,
    brand: { ...defaults.brand, name: brandName.slice(0, 120) },
    pages,
    sections: [],
    verbatim,
  };

  const warnings: string[] = [];
  if (rawFiles.length > MAX_PAGES) {
    warnings.push(
      `Elegiste ${rawFiles.length} páginas y el máximo es ${MAX_PAGES}. Importamos las primeras ${MAX_PAGES}.`
    );
  }
  const unresolvable = resolved.filter((f) => !f.rendered && !f.baseUrl).length;
  if (unresolvable > 0) {
    warnings.push(
      "Algunas páginas no tienen una URL de origen conocida — sus imágenes con rutas relativas pueden no cargar. Volvé a subirlas desde el builder si hace falta."
    );
  }
  if (missingCssPages > 0) {
    warnings.push(
      `${missingCssPages} ${missingCssPages === 1 ? "página referencia una hoja de estilos que no pudimos traer" : "páginas referencian hojas de estilos que no pudimos traer"} — van a importar sin ese CSS. Si subiste los archivos a mano, sumá también el .css; si vinieron de GitHub, revisá el aviso de arriba sobre qué archivo falló.`
    );
  }

  return {
    config,
    report: {
      pages: pages.map((p, i) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        path: ordered[i].path,
        isHome: i === 0,
        bytes: verbatim[p.slug].html.length + verbatim[p.slug].css.length,
      })),
      warnings,
      linksRewired,
    },
  };
}
