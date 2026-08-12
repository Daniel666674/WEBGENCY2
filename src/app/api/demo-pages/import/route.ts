import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages } from "@/db/schema";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { importHtmlPages, importVerbatim, type SourceFile, type VerbatimSourceFile } from "@/lib/demo/import";
import { uniqueSlug } from "@/lib/demo/slug";
import { validateDemoConfig } from "@/lib/demo/validate";
import type { SectionType } from "@/lib/demo/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** A page bigger than this is a bundled app, not a landing page. */
const MAX_HTML = 2_000_000;
/** Matches the config schema's cap on `pages`. */
const MAX_FILES = 12;
/** One stylesheet, matching MAX_VERBATIM_CSS — the real sanitizer's own cap. */
const MAX_CSS_FILE = 300_000;
/**
 * `MAX_HTML` bounds one field on one file; nothing bounded the request as a
 * whole. Twelve files each carrying six stylesheets just under their own
 * per-file caps sums to well over 100MB before anything downstream — the
 * classifier, the headless render, `validateDemoConfig()` — ever gets a
 * chance to reject it. This is the fail-fast check, before any of that work
 * starts.
 */
const MAX_TOTAL_BYTES = 20_000_000;

interface RawFile {
  path?: string;
  html?: string;
  baseUrl?: string;
  css?: string[];
  rendered?: boolean;
}

/**
 * Turns uploaded/fetched HTML into a demo — two different ways.
 *
 * `mode: "sections"` (the default) runs the pages through the classifier and
 * produces editable `Section`s, at the cost of the original's CSS. `mode:
 * "verbatim"` keeps the original HTML and CSS untouched instead, at the cost
 * of visual/text editing — see `src/lib/demo/verbatim.ts` for why those are
 * genuinely incompatible rather than a missing feature.
 *
 * Both share the dry-run pattern from /api/automations/run: the caller has
 * to ask for the demo to actually be created, which is what lets the dialog
 * show a review step — sections to exclude in one mode, whole pages in the
 * other — before anything is written.
 *
 * The imported config is validated with `validateDemoConfig()`, the same
 * gate every other save goes through, for both modes. Neither importer has
 * security responsibilities of its own: `sections` mode can emit a
 * `javascript:` href the validator will drop exactly as it would for a
 * hand-typed one, and `verbatim` mode's real sanitizing already happened
 * inside `importVerbatim()` — the schema's own verbatim check is the fast
 * regex backstop, not the real filter. See verbatimSanitize.ts.
 */
export async function POST(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  let body: {
    /** Single page. Kept for the plain file upload. */
    html?: string;
    /** Multi-page: a whole site's worth of files, home resolved from paths. */
    files?: RawFile[];
    sourceUrl?: string;
    title?: string;
    contactId?: string;
    template?: string;
    mode?: "sections" | "verbatim";
    dryRun?: boolean;
    /** Excluded ids — Section ids in "sections" mode, page ids in "verbatim". */
    exclude?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const mode = body.mode === "verbatim" ? "verbatim" : "sections";

  // Normalize both entry shapes into one list, so everything below is the
  // same code path whether one file arrived or eight.
  const rawFiles: RawFile[] =
    Array.isArray(body.files) && body.files.length > 0
      ? body.files.filter((f): f is RawFile => !!f?.html?.trim())
      : typeof body.html === "string" && body.html.trim()
        ? [{ path: "index.html", html: body.html, baseUrl: body.sourceUrl }]
        : [];

  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "No recibimos ningún HTML" }, { status: 400 });
  }
  if (rawFiles.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Elegiste ${rawFiles.length} páginas y el máximo es ${MAX_FILES}.` },
      { status: 400 }
    );
  }
  const tooBig = rawFiles.find((f) => (f.html?.length ?? 0) > MAX_HTML);
  if (tooBig) {
    return NextResponse.json(
      { error: `"${tooBig.path}" pesa ${Math.round((tooBig.html?.length ?? 0) / 1024)} KB. El máximo por página es 2 MB.` },
      { status: 413 }
    );
  }
  const tooBigCss = rawFiles.find((f) => (f.css ?? []).some((c) => typeof c === "string" && c.length > MAX_CSS_FILE));
  if (tooBigCss) {
    return NextResponse.json(
      { error: `Una hoja de estilos de "${tooBigCss.path}" pesa más de ${Math.round(MAX_CSS_FILE / 1024)} KB.` },
      { status: 413 }
    );
  }
  const totalBytes = rawFiles.reduce(
    (n, f) => n + (f.html?.length ?? 0) + (f.css ?? []).reduce((m, c) => m + (typeof c === "string" ? c.length : 0), 0),
    0
  );
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { error: `Lo que estás importando pesa ${Math.round(totalBytes / 1024 / 1024)} MB en total. El máximo combinado es ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB.` },
      { status: 413 }
    );
  }

  const multi = rawFiles.length > 1;

  if (mode === "verbatim") {
    const files: VerbatimSourceFile[] = rawFiles.map((f) => ({
      path: (f.path || "index.html").trim(),
      html: f.html!,
      baseUrl: f.baseUrl,
      css: Array.isArray(f.css) ? f.css.filter((c) => typeof c === "string").slice(0, 6) : undefined,
      rendered: !!f.rendered,
    }));

    let outcome;
    try {
      outcome = importVerbatim(files, { title: body.title });
    } catch {
      return NextResponse.json({ error: "No pudimos leer este HTML. ¿Es un archivo de página web?" }, { status: 422 });
    }

    const { report } = outcome;
    let { config } = outcome;

    // Excluding a page in verbatim mode drops it entirely — there is no
    // sub-page unit to exclude, unlike a section.
    const exclude = new Set(Array.isArray(body.exclude) ? body.exclude : []);
    if (exclude.size > 0) {
      const pages = (config.pages ?? []).filter((p) => !exclude.has(p.id));
      const verbatim = Object.fromEntries(
        Object.entries(config.verbatim ?? {}).filter(([slug]) => pages.some((p) => p.slug === slug))
      );
      config = { ...config, pages, verbatim, sections: pages[0]?.sections ?? [] };
    }

    const validated = validateDemoConfig(config);
    if (!validated.ok) {
      return NextResponse.json(
        { error: "El contenido importado no pasó la validación.", detail: validated.error },
        { status: 422 }
      );
    }

    const summary = {
      mode: "verbatim" as const,
      multiPage: multi,
      pages: report.pages
        .filter((p) => !exclude.has(p.id))
        .map((p) => ({ id: p.id, slug: p.slug, title: p.title, path: p.path, isHome: p.isHome, bytes: p.bytes })),
      warnings: report.warnings,
      linksRewired: report.linksRewired,
    };

    if (body.dryRun !== false) {
      return NextResponse.json({ dryRun: true, report: summary }, { headers: { "Cache-Control": "no-store" } });
    }

    if ((validated.config.pages ?? []).length === 0) {
      return NextResponse.json({ error: "No quedó ninguna página para importar." }, { status: 400 });
    }

    return await createDemo(request, validated.config, {
      title: body.title,
      contactId: body.contactId,
      sourceUrl: body.sourceUrl,
      summary,
      pages: validated.config.pages?.length ?? 1,
      sections: 0,
    });
  }

  const files: SourceFile[] = rawFiles.map((f) => ({
    path: (f.path || "index.html").trim(),
    html: f.html!,
    baseUrl: f.baseUrl,
    css: Array.isArray(f.css) ? f.css.filter((c) => typeof c === "string").slice(0, 4) : undefined,
  }));

  let outcome;
  try {
    outcome = importHtmlPages(files, { template: body.template, title: body.title });
  } catch {
    return NextResponse.json({ error: "No pudimos leer este HTML. ¿Es un archivo de página web?" }, { status: 422 });
  }

  const { report } = outcome;
  let { config } = outcome;

  // Drop what the user unchecked in the review step. Sections are excluded by
  // id across every page, and `sections` stays mirrored to the home page.
  const exclude = new Set(Array.isArray(body.exclude) ? body.exclude : []);
  if (exclude.size > 0) {
    const pages = (config.pages ?? []).map((p) => ({
      ...p,
      sections: p.sections.filter((s) => !exclude.has(s.id)),
    }));
    config = { ...config, pages, sections: pages[0]?.sections ?? [] };
  }

  // A single-page import keeps the flat shape it always had: no `pages` key,
  // so nothing downstream has to special-case a one-entry array.
  if (!multi) config = { ...config, pages: undefined };

  const validated = validateDemoConfig(config);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "El contenido importado no pasó la validación.", detail: validated.error },
      { status: 422 }
    );
  }

  const summary = {
    mode: "sections" as const,
    multiPage: multi,
    pages: report.pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      path: p.path,
      isHome: p.isHome,
      sections: p.sections
        .filter((s) => !exclude.has(s.section.id))
        .map((s) => ({
          id: s.section.id,
          type: s.type as SectionType,
          variant: s.variant,
          confidence: s.confidence,
          evidence: s.evidence,
          itemCount: s.itemCount,
          heading: s.section.heading ?? s.section.eyebrow ?? "",
        })),
    })),
    warnings: report.warnings,
    brand: report.brand,
    images: report.images,
    linksRewired: report.linksRewired,
  };

  if (body.dryRun !== false) {
    return NextResponse.json({ dryRun: true, report: summary }, { headers: { "Cache-Control": "no-store" } });
  }

  const totalSections = (validated.config.pages ?? [{ sections: validated.config.sections }]).reduce(
    (n, p) => n + p.sections.length,
    0
  );
  if (totalSections === 0) {
    return NextResponse.json({ error: "No quedó ninguna sección para importar." }, { status: 400 });
  }

  return await createDemo(request, validated.config, {
    title: body.title,
    contactId: body.contactId,
    sourceUrl: body.sourceUrl,
    summary,
    pages: validated.config.pages?.length ?? 1,
    sections: totalSections,
  });
}

async function createDemo(
  request: NextRequest,
  config: import("@/lib/demo/types").DemoConfig,
  opts: {
    title?: string;
    contactId?: string;
    sourceUrl?: string;
    summary: unknown;
    pages: number;
    sections: number;
  }
) {
  const title = (opts.title || config.brand.name || "Demo importado").slice(0, 120);
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(title, id);
  const now = new Date();

  const result = await db
    .insert(demoPages)
    .values({
      id,
      contactId: opts.contactId || null,
      title,
      slug,
      template: config.template,
      config: JSON.stringify(config),
      published: false,
      version: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  await persistNow();
  await logAudit(request, "import", "demo", result.id, {
    title,
    pages: opts.pages,
    sections: opts.sections,
    sourceUrl: opts.sourceUrl ?? null,
  });

  return NextResponse.json({ ...result, report: opts.summary }, { status: 201 });
}
