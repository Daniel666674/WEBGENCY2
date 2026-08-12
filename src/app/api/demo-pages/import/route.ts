import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages } from "@/db/schema";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { importHtmlPages, type SourceFile } from "@/lib/demo/import";
import { uniqueSlug } from "@/lib/demo/slug";
import { validateDemoConfig } from "@/lib/demo/validate";
import type { SectionType } from "@/lib/demo/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** A page bigger than this is a bundled app, not a landing page. */
const MAX_HTML = 2_000_000;
/** Matches the config schema's cap on `pages`. */
const MAX_FILES = 12;

/**
 * Turns an uploaded HTML page into an editable demo.
 *
 * Defaults to a dry run, same as /api/automations/run: the caller has to ask
 * for the demo to actually be created. That is what lets the dialog show the
 * user exactly which sections were detected — and let them drop the ones that
 * were read wrong — before anything is written.
 *
 * The imported config is validated with `validateDemoConfig()`, the same gate
 * every other save goes through. The importer itself has no security
 * responsibilities: it can emit a `javascript:` href it found in the source
 * and the validator will drop it, exactly as it would for a hand-typed one.
 */
export async function POST(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  let body: {
    /** Single page. Kept for the plain file upload. */
    html?: string;
    /** Multi-page: a whole site's worth of files, home resolved from paths. */
    files?: { path?: string; html?: string; baseUrl?: string }[];
    sourceUrl?: string;
    title?: string;
    contactId?: string;
    template?: string;
    dryRun?: boolean;
    /** Section ids to leave out — the review step's unchecked boxes. */
    exclude?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  // Normalize both entry shapes into one list, so everything below is the
  // same code path whether one file arrived or eight.
  const files: SourceFile[] = Array.isArray(body.files) && body.files.length > 0
    ? body.files
        .filter((f): f is { path: string; html: string; baseUrl?: string } => !!f?.html?.trim())
        .map((f) => ({ path: (f.path || "index.html").trim(), html: f.html, baseUrl: f.baseUrl }))
    : typeof body.html === "string" && body.html.trim()
      ? [{ path: "index.html", html: body.html, baseUrl: body.sourceUrl }]
      : [];

  if (files.length === 0) {
    return NextResponse.json({ error: "No recibimos ningún HTML" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Elegiste ${files.length} páginas y el máximo es ${MAX_FILES}.` },
      { status: 400 }
    );
  }
  const tooBig = files.find((f) => f.html.length > MAX_HTML);
  if (tooBig) {
    return NextResponse.json(
      { error: `"${tooBig.path}" pesa ${Math.round(tooBig.html.length / 1024)} KB. El máximo por página es 2 MB.` },
      { status: 413 }
    );
  }

  const multi = files.length > 1;
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

  const title = (body.title || validated.config.brand.name || "Demo importado").slice(0, 120);
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(title, id);
  const now = new Date();

  const result = await db
    .insert(demoPages)
    .values({
      id,
      contactId: body.contactId || null,
      title,
      slug,
      template: validated.config.template,
      config: JSON.stringify(validated.config),
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
    pages: validated.config.pages?.length ?? 1,
    sections: totalSections,
    sourceUrl: body.sourceUrl ?? null,
  });

  return NextResponse.json({ ...result, report: summary }, { status: 201 });
}
