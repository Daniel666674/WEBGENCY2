/**
 * Importing a whole site instead of one page.
 *
 * A real site in a repo is `index.html`, `armar.html`, three blog posts and a
 * subfolder — and the pages link to each other. Importing them one at a time
 * gives you five unrelated demos whose menus all point at dead `.html` files,
 * which is not a site.
 *
 * The demo model already handles multi-page: `DemoConfig.pages`, the builder's
 * page tabs and the `/demo/[slug]/[[...page]]` route all exist. The only
 * missing piece was producing that shape from a set of files, and rewriting
 * the links between them so the menu actually navigates.
 *
 * Link rewriting is the part that makes it a site rather than a pile:
 * `href="armar.html"` becomes a reference to the imported page, resolved
 * against the file's own folder so `../index.html` from a subdirectory lands
 * on the home page.
 */

import type { DemoConfig, DemoPage, NavLink, Section } from "../types";
import { newId } from "../types";
import { slugify } from "../slug";
import { importHtml, type ImportedSection, type ImportOptions } from "./index";

export interface SourceFile {
  /** Repo-relative path. Decides the slug and resolves relative links. */
  path: string;
  html: string;
  /** Base URL for the page's own images. */
  baseUrl?: string;
  /** This page's linked stylesheets, already fetched. */
  css?: string[];
}

export interface PageReport {
  id: string;
  slug: string;
  title: string;
  path: string;
  isHome: boolean;
  sections: ImportedSection[];
  warnings: string[];
}

export interface MultiPageOutcome {
  config: DemoConfig;
  report: {
    pages: PageReport[];
    warnings: string[];
    brand: { name: string; accent: string; detectedColors: boolean };
    images: number;
    /** Cross-page links rewritten to point at imported pages. */
    linksRewired: number;
  };
}

/** Max pages the config schema accepts. */
const MAX_PAGES = 12;

const isIndex = (path: string) => /(?:^|\/)index\.html?$/i.test(path);

/**
 * Normalizes a file's `path` to something slug-worthy.
 *
 * A repo import already gives a clean repo-relative path ("armar.html"). A
 * live-URL import does not — the only path-like thing available is the
 * page's own URL — so this collapses `https://site.com/nosotros.html?x=1` to
 * `nosotros.html` the same way a repo file would arrive, rather than letting
 * the whole URL flatten into a slug like "https-site-com-nosotros-html".
 */
function normalizePath(path: string): string {
  try {
    const url = new URL(path);
    const pathname = decodeURIComponent(url.pathname).replace(/^\//, "");
    return pathname && !pathname.endsWith("/") ? pathname : "index.html";
  } catch {
    return path;
  }
}

/** Folder the file lives in, with a trailing slash ("" at the repo root). */
function dirOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i + 1);
}

/** Longest shared prefix of the pages' base URLs — the repo's raw root. */
function commonRoot(files: SourceFile[]): string {
  const bases = files.map((f) => f.baseUrl).filter((b): b is string => !!b);
  if (bases.length === 0) return "";
  let prefix = bases[0];
  for (const b of bases.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < b.length && prefix[i] === b[i]) i++;
    prefix = prefix.slice(0, i);
  }
  // Cut back to a path boundary so a partial folder name never matches.
  return prefix.slice(0, prefix.lastIndexOf("/") + 1);
}

/**
 * Resolves an href against the file that contains it, into a repo-relative
 * path comparable with the other files' paths.
 *
 * Handles the absolute form too, and that is not an edge case: single-page
 * import already resolved every relative URL against the file's raw
 * GitHub base, so by the time links get here `armar.html` has become
 * `https://raw.githubusercontent.com/.../armar.html`. Without stripping that
 * root back off, every internal link would look external and the demo's
 * buttons would send the client to a raw file on GitHub.
 *
 * Returns "" for anything that is not a link to another imported page — a
 * bare anchor, a genuinely external URL, a mailto:. Those are left untouched.
 */
function resolveLocal(href: string, fromPath: string, rawRoot: string): string {
  const raw = href.trim();
  if (!raw || raw.startsWith("#")) return "";

  let pathish = raw;
  let fromRepoRoot = false;
  if (rawRoot && raw.startsWith(rawRoot)) {
    pathish = raw.slice(rawRoot.length);
    fromRepoRoot = true;
  } else if (/^(?:[a-z][a-z0-9+.-]*:)/i.test(raw)) {
    return "";
  }

  const [pathPart] = pathish.split(/[?#]/);
  if (!/\.html?$/i.test(pathPart)) return "";

  const segments =
    fromRepoRoot || pathPart.startsWith("/")
      ? pathPart.replace(/^\//, "").split("/")
      : (dirOf(fromPath) + pathPart).split("/");

  const out: string[] = [];
  for (const s of segments) {
    if (!s || s === ".") continue;
    if (s === "..") out.pop();
    else out.push(s);
  }
  return out.join("/");
}

/** The `#anchor` part of an href, so rewriting a link keeps its target. */
function anchorOf(href: string): string {
  const i = href.indexOf("#");
  return i === -1 ? "" : href.slice(i);
}

/**
 * Slug for a page, derived from its path.
 *
 * `index.html` at the root is the home page and gets "". Everything else is
 * flattened, since page slugs are a single path segment:
 * `bmx-builder/index.html` → "bmx-builder", `docs/guia.html` → "docs-guia".
 */
function slugFor(path: string, homePath: string): string {
  if (path === homePath) return "";
  const withoutExt = path.replace(/\.html?$/i, "");
  const parts = withoutExt.split("/").filter(Boolean);
  // A folder's index.html is named by its folder, not by the word "index".
  if (parts.length > 1 && /^index$/i.test(parts[parts.length - 1])) parts.pop();
  return slugify(parts.join("-")).slice(0, 60) || "pagina";
}

/** "blog-arma-tu-bmx.html" with no <title> still deserves a readable name. */
function titleFor(path: string, docTitle: string, isHome: boolean): string {
  // A home page's <title> is almost always the brand ("BMX Store | Bicicletas
  // en Bogotá"), which names the site, not the page. In the builder's page
  // tabs that reads as a company name where a page name belongs.
  if (isHome) return "Inicio";

  const fromDoc = docTitle.split(/[|—–·]/)[0].trim();
  if (fromDoc && fromDoc.length <= 60) return fromDoc;

  const base = path.replace(/\.html?$/i, "").split("/").filter(Boolean).pop() ?? "Página";
  const words = base.replace(/[-_]+/g, " ").trim();
  return (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 120) || "Página";
}

export function importHtmlPages(rawFiles: SourceFile[], opts: ImportOptions = {}): MultiPageOutcome {
  if (rawFiles.length === 0) throw new Error("No hay archivos para importar");

  const files = rawFiles.map((f) => ({ ...f, path: normalizePath(f.path) }));
  const selected = files.slice(0, MAX_PAGES);

  // The home page is the root index.html when there is one — otherwise the
  // shallowest file, which is nearly always the entry point.
  const home =
    selected.find((f) => isIndex(f.path) && !f.path.includes("/")) ??
    selected.find((f) => isIndex(f.path)) ??
    [...selected].sort((a, b) => a.path.split("/").length - b.path.split("/").length)[0];

  // Home first: `pages[0]` is the home page everywhere else in the codebase.
  const ordered = [home, ...selected.filter((f) => f !== home)];

  const imported = ordered.map((file) => {
    const outcome = importHtml(file.html, { ...opts, baseUrl: file.baseUrl, css: file.css, title: undefined });
    return { file, ...outcome };
  });

  const homeImport = imported[0];

  // Brand, template and typography come from the home page. Letting each page
  // contribute would produce a demo whose colours change as you click around.
  const config: DemoConfig = {
    ...homeImport.config,
    brand: { ...homeImport.config.brand, name: opts.title || homeImport.config.brand.name },
  };

  const pages: DemoPage[] = imported.map(({ file, config: pageConfig, report }) => ({
    id: newId(),
    slug: slugFor(file.path, home.path),
    title: titleFor(file.path, report.docTitle, file === home),
    sections: pageConfig.sections,
  }));

  // Two files can flatten to the same slug ("a/guia.html" and "b/guia.html"),
  // and the schema rejects duplicates outright — so disambiguate here rather
  // than failing the whole import.
  const seen = new Set<string>();
  for (const page of pages) {
    let slug = page.slug;
    for (let n = 2; seen.has(slug); n++) slug = `${page.slug}-${n}`.slice(0, 60);
    page.slug = slug;
    seen.add(slug);
  }

  const rawRoot = commonRoot(ordered);
  const byPath = new Map(ordered.map((f, i) => [f.path, pages[i]]));
  let linksRewired = 0;

  /**
   * Points a nav/footer link at an imported page instead of a dead .html.
   *
   * A link carrying an anchor ("index.html#contacto") keeps using `url`
   * rather than `page`: `page` wins at render time and emits a bare "./",
   * which would silently drop the very thing the link was pointing at.
   */
  const rewireNavLink = (link: NavLink, fromPath: string): NavLink => {
    const target = byPath.get(resolveLocal(link.url, fromPath, rawRoot));
    if (!target) return link;
    linksRewired++;
    const anchor = anchorOf(link.url);
    return anchor
      ? { ...link, url: hrefFor(target) + anchor, page: undefined }
      : { ...link, page: target.id, url: link.url };
  };

  const rewireLinks = (links: NavLink[], fromPath: string): NavLink[] =>
    links.map((l) => ({
      ...rewireNavLink(l, fromPath),
      children: l.children?.map((c) => rewireNavLink(c, fromPath)),
    }));

  if (config.nav) {
    config.nav = { ...config.nav, links: rewireLinks(config.nav.links, home.path) };
    const ctaTarget = config.nav.ctaUrl ? byPath.get(resolveLocal(config.nav.ctaUrl, home.path, rawRoot)) : undefined;
    if (ctaTarget) {
      config.nav.ctaUrl = hrefFor(ctaTarget) + anchorOf(config.nav.ctaUrl ?? "");
      linksRewired++;
    }
  }
  if (config.footer) {
    config.footer = {
      ...config.footer,
      columns: config.footer.columns.map((c) => ({ ...c, links: rewireLinks(c.links, home.path) })),
    };
  }

  // Section buttons are plain URLs, not NavLinks, so they get a relative href
  // the public route resolves — the same form render.ts emits for page links.
  for (const [i, page] of pages.entries()) {
    const fromPath = ordered[i].path;
    page.sections = page.sections.map((s): Section => {
      if (!s.ctaUrl) return s;
      const target = byPath.get(resolveLocal(s.ctaUrl, fromPath, rawRoot));
      if (!target) return s;
      linksRewired++;
      return { ...s, ctaUrl: hrefFor(target) + anchorOf(s.ctaUrl) };
    });
  }

  config.pages = pages;
  // `sections` stays mirrored to the home page — every caller that predates
  // multi-page reads that flat list and must keep working.
  config.sections = pages[0].sections;

  const warnings: string[] = [];
  if (files.length > MAX_PAGES) {
    warnings.push(`Elegiste ${files.length} archivos y el máximo es ${MAX_PAGES}. Importamos los primeros ${MAX_PAGES}.`);
  }
  if (linksRewired === 0 && pages.length > 1) {
    warnings.push(
      "No encontramos enlaces entre las páginas del original, así que el menú quedó con los enlaces tal cual venían. Podés apuntarlos a cada página desde el editor de menú."
    );
  }
  // Per-page warnings, deduped with the numbers blanked out: the same warning
  // carries a different count on each page ("arma 9 bloques", "arma 8
  // bloques"), so comparing the text as-is lets five near-identical lines
  // through. Five warnings that say one thing is how a review step stops
  // being read at all.
  const seenWarnings = new Set<string>();
  for (const { report } of imported) {
    for (const w of report.warnings) {
      const key = w.replace(/\d+/g, "#").slice(0, 60);
      if (seenWarnings.has(key)) continue;
      seenWarnings.add(key);
      warnings.push(w);
    }
  }

  const mountedPages = imported.filter(({ report }) => report.scriptMounts >= 2).length;
  if (mountedPages > 1) {
    warnings.push(
      `Esto pasa en ${mountedPages} de las ${pages.length} páginas: el sitio original arma buena parte del contenido con JavaScript, y eso no viaja en el archivo.`
    );
  }

  return {
    config,
    report: {
      pages: pages.map((page, i) => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        path: ordered[i].path,
        isHome: i === 0,
        sections: imported[i].report.sections,
        warnings: imported[i].report.warnings,
      })),
      warnings,
      brand: homeImport.report.brand,
      images: imported.reduce((n, x) => n + x.report.images, 0),
      linksRewired,
    },
  };
}

/** Relative href for a page, matching what render.ts emits for page links. */
function hrefFor(page: DemoPage): string {
  return page.slug ? `./${page.slug}` : "./";
}
