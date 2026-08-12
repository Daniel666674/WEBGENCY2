import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";
import { RenderError, renderPages, validateTargetUrl } from "@/lib/demo/import/headless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Chromium's cold start plus a page load needs the whole budget.
export const maxDuration = 60;

/**
 * Renders live pages in a headless browser and returns their DOM.
 *
 * Separate from the import route because it is the expensive half: launching
 * Chromium costs seconds, so the dialog does it once and then re-analyses the
 * same rendered HTML locally as the user toggles sections, instead of paying
 * for a render on every keystroke.
 *
 * `discover: true` renders one page and reports the same-origin links it
 * found, so the user picks the rest of the site from a list rather than
 * typing URLs.
 */
export async function POST(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  let body: { url?: string; urls?: string[]; discover?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const raw = Array.isArray(body.urls) && body.urls.length > 0 ? body.urls : [body.url ?? ""];

  let targets: string[];
  try {
    targets = [...new Set(raw.filter(Boolean).map(validateTargetUrl))].slice(0, 12);
  } catch (e) {
    return NextResponse.json({ error: e instanceof RenderError ? e.message : "URL invalida" }, { status: 400 });
  }
  if (targets.length === 0) {
    return NextResponse.json({ error: "Falta la URL" }, { status: 400 });
  }

  try {
    const pages = await renderPages(targets);

    if (body.discover) {
      const first = pages[0];
      return NextResponse.json({
        pages: pages.map(strip),
        // The page's own URL is already imported; offering it again would let
        // the user pick the same page twice and get a duplicate slug.
        discovered: (first?.links ?? []).filter((l) => l !== first.url).slice(0, 40),
      });
    }

    return NextResponse.json({ pages: pages.map(strip) });
  } catch (e) {
    if (e instanceof RenderError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    return NextResponse.json({ error: "No pudimos renderizar esa página." }, { status: 502 });
  }
}

/** Links stay server-side except in discovery — they are noise to the client. */
function strip(p: { url: string; html: string; css: string[]; title: string }) {
  return { url: p.url, html: p.html, css: p.css, title: p.title };
}
