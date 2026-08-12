/**
 * Renders a live page in a real browser before importing it.
 *
 * The importer reads a file as it sits in the repo, which is the wrong picture
 * for any site that builds itself at runtime. Stike's `index.html` ships
 * `<div id="home-cats"></div>` — the categories, the products, the header and
 * the footer only exist once the browser has run the page's JavaScript. No
 * parsing heuristic can recover content that is not in the input.
 *
 * So this runs the page: launch Chromium, wait for the scripts to settle, and
 * hand back the DOM as the visitor sees it. It also collects the stylesheets
 * the page actually applied (the palette lives there, not in the HTML) and the
 * same-origin links it found, so a multi-page import can offer the rest of the
 * site without the user typing every URL.
 *
 * Nothing from the page is trusted. The rendered HTML goes through the same
 * importer and the same `validateDemoConfig()` as a hand-typed one; running a
 * page is a way to *see* it, not a reason to believe it.
 */

import type { Browser } from "puppeteer-core";

export interface RenderedPage {
  url: string;
  html: string;
  /** Stylesheet text the page applied, for palette detection. */
  css: string[];
  /** Same-origin page URLs found in the rendered DOM. */
  links: string[];
  title: string;
}

/** Long enough for a slow site, short enough to stay inside maxDuration. */
const NAV_TIMEOUT = 20_000;
const SETTLE_MS = 1_200;

export class RenderError extends Error {}

/**
 * Chromium comes from a different place in each environment: a real binary
 * ships with the dev container, while a serverless function has to unpack
 * @sparticuz/chromium at cold start.
 */
async function launch(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  const local = process.env.CHROMIUM_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;

  if (local) {
    return puppeteer.launch({
      executablePath: local,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      headless: true,
    });
  }

  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

function sameOrigin(href: string, origin: string): boolean {
  try {
    return new URL(href).origin === origin;
  } catch {
    return false;
  }
}

export async function renderPages(urls: string[], max = 12): Promise<RenderedPage[]> {
  const targets = urls.slice(0, max);
  if (targets.length === 0) return [];

  let browser: Browser | null = null;
  try {
    browser = await launch();
  } catch (e) {
    throw new RenderError(
      `No pudimos abrir el navegador para renderizar la página. ${e instanceof Error ? e.message : ""}`.trim()
    );
  }

  const out: RenderedPage[] = [];
  try {
    for (const url of targets) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1440, height: 1200 });
        page.setDefaultNavigationTimeout(NAV_TIMEOUT);
        // A hostile or broken page must not be able to hold the function open
        // with a dialog nobody can answer.
        page.on("dialog", (d) => void d.dismiss().catch(() => {}));

        await page.goto(url, { waitUntil: "networkidle2", timeout: NAV_TIMEOUT });
        // networkidle2 fires before a deferred script has painted its markup;
        // this extra beat is what makes a JS-rendered grid actually present.
        await new Promise((r) => setTimeout(r, SETTLE_MS));

        const result = await page.evaluate(() => {
          // Same-document stylesheets, read from the CSSOM so a bundled or
          // injected sheet is captured the same as a linked one.
          const sheets: string[] = [];
          for (const sheet of Array.from(document.styleSheets)) {
            try {
              const text = Array.from(sheet.cssRules)
                .map((r) => r.cssText)
                .join("\n");
              if (text) sheets.push(text);
            } catch {
              // Cross-origin sheet (a font CDN) — unreadable by design, and
              // never where a site keeps its own palette.
            }
          }
          const hrefs = Array.from(document.querySelectorAll("a[href]"))
            .map((a) => (a as HTMLAnchorElement).href)
            .filter(Boolean);

          // outerHTML serialises attributes exactly as authored — a browser
          // does NOT rewrite `src="assets/img/hero.jpg"` to an absolute URL
          // just because it resolved it internally. Left alone, every
          // relative asset in the captured markup would 404 the moment it's
          // served from a different origin (the CRM's own domain). The IDL
          // property (`img.src`, as opposed to `img.getAttribute('src')`)
          // *is* the resolved absolute form, so writing that back as the
          // attribute is what makes the captured HTML portable.
          const resolveAttr = (el: Element, attr: string, prop: string) => {
            const raw = el.getAttribute(attr);
            if (!raw) return;
            const resolved = (el as unknown as Record<string, string>)[prop];
            if (resolved) el.setAttribute(attr, resolved);
          };
          document.querySelectorAll("img[src],video[poster],script[src]").forEach((el) => {
            resolveAttr(el, "src", "src");
            resolveAttr(el, "poster", "poster");
          });
          document.querySelectorAll("source[src]").forEach((el) => resolveAttr(el, "src", "src"));
          document.querySelectorAll("link[href]").forEach((el) => resolveAttr(el, "href", "href"));
          // srcset has no matching IDL property to lean on — each candidate
          // URL is resolved by hand against the document's own base.
          document.querySelectorAll("[srcset]").forEach((el) => {
            const raw = el.getAttribute("srcset");
            if (!raw) return;
            const rewritten = raw
              .split(",")
              .map((part) => {
                const [url, descriptor] = part.trim().split(/\s+/, 2);
                try {
                  return [new URL(url, location.href).href, descriptor].filter(Boolean).join(" ");
                } catch {
                  return part.trim();
                }
              })
              .join(", ");
            el.setAttribute("srcset", rewritten);
          });
          // `<a href>` gets the same treatment, except fragment-only anchors
          // ("#contacto") — resolving those to an absolute URL would still
          // technically work (the browser would jump on the *original*
          // site), but leaving them bare is what lets same-page navigation
          // keep working inside the demo without any rewriting at all.
          document.querySelectorAll("a[href]").forEach((el) => {
            const raw = el.getAttribute("href");
            if (!raw || raw.startsWith("#")) return;
            resolveAttr(el, "href", "href");
          });
          // A `style="background-image:url(assets/x.jpg)"` attribute isn't
          // touched by any of the above — it's CSS text, not a URL-typed
          // attribute — so relative url() references inside it are resolved
          // by hand with the same regex the renderer already trusts CSS
          // text to tolerate.
          document.querySelectorAll("[style*='url(']").forEach((el) => {
            const style = el.getAttribute("style");
            if (!style) return;
            const rewritten = style.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, url) => {
              try {
                return `url(${q}${new URL(url, location.href).href}${q})`;
              } catch {
                return m;
              }
            });
            el.setAttribute("style", rewritten);
          });

          // Scripts have already run by this point (that is the entire
          // reason to render the page at all) — stripping them now means
          // the captured markup can never re-execute anything, and it never
          // needs to: whatever a script was going to build is already sitting
          // in the DOM being serialised.
          document.querySelectorAll("script, noscript, base").forEach((el) => el.remove());

          return {
            html: document.documentElement.outerHTML,
            css: sheets.slice(0, 8),
            hrefs,
            title: document.title,
          };
        });

        const origin = new URL(url).origin;
        // Query strings are almost always the same page faceted a dozen ways
        // — a store's ?cat=repuestos&sub=Marcos — not a distinct page worth
        // offering. Stripped before dedup, so ten filter variants of one
        // listing collapse into the one URL that matters.
        const links = [
          ...new Set(
            result.hrefs
              .filter((h) => sameOrigin(h, origin))
              .map((h) => h.split(/[?#]/)[0])
              .filter((h) => h && !/\.(?:pdf|zip|jpg|jpeg|png|svg|webp|gif|mp4|css|js|json|xml|txt)$/i.test(h))
          ),
        ];

        out.push({ url, html: result.html, css: result.css, links, title: result.title });
      } catch (e) {
        throw new RenderError(
          `No pudimos cargar ${url}. ${e instanceof Error ? e.message : ""}`.trim()
        );
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  return out;
}

/** Rejects anything that is not a public http(s) page. */
export function validateTargetUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new RenderError("Esa no es una URL válida.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new RenderError("La URL tiene que empezar con http:// o https://");
  }
  // A server that can open any URL is a server that can be pointed at the
  // cloud provider's metadata endpoint or at something on the private network.
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "[::1]";
  if (blocked && process.env.ALLOW_LOCAL_RENDER !== "true") {
    throw new RenderError("No podemos renderizar direcciones internas.");
  }
  return url.href;
}
