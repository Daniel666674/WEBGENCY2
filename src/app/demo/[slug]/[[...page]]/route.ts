import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { renderDemo } from "@/lib/demo/render";
import { validateDemoConfig } from "@/lib/demo/validate";

function shell(title: string, heading: string, message: string, status: number) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#0f172a;color:#94a3b8;"><div style="text-align:center;padding:24px;"><p style="font-size:3rem;margin:0 0 12px;">${heading}</p><p style="margin:0;">${message}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// Public demo page — served as raw HTML so the client sees a real website,
// not the CRM shell. Returned regardless of CRM auth; the slug is the secret.
//
// [[...page]] is an optional catch-all: /demo/mydemo (no segments) is the
// home page, /demo/mydemo/about is the "about" page for multi-page demos.
// Single-page demos (the overwhelming majority) never populate `page` at
// all, so this route replaces the old single-segment one without changing
// behavior for them.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; page?: string[] }> }
) {
  const { slug, page } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.slug, slug)).get();

  if (!row || !row.published) {
    return shell("No disponible", "404", "Este demo no está disponible.", 404);
  }

  // Fire-and-forget: a real visit to a published demo, never a builder
  // preview (which reads render.ts directly, not this route) or a draft.
  // Atomic increment (not read-modify-write) so concurrent visits don't
  // lose a count to each other.
  void db.update(demoPages).set({ views: sql`${demoPages.views} + 1` }).where(eq(demoPages.id, row.id)).run().catch(() => {});

  // Serve the snapshot taken at publish time, so edits in progress never
  // leak to a client mid-review. Rows published before the draft/published
  // split have their snapshot backfilled at boot, but fall back anyway.
  const source = row.publishedConfig ?? row.config;

  let raw: unknown;
  try {
    raw = JSON.parse(source || "{}");
  } catch {
    return shell("No disponible", "500", "Este demo no se pudo cargar.", 500);
  }

  // Re-validated on read as well as on write: rows predating validation (or
  // touched by a migration) could still carry unsafe values, and this page
  // is served publicly.
  const result = validateDemoConfig(raw);
  if (!result.ok) {
    return shell("No disponible", "500", "Este demo no se pudo cargar.", 500);
  }

  // A page segment on a single-page demo (stale link, typo) has nothing to
  // resolve to — 404 rather than silently re-serving the home page.
  const pageSlug = page?.[0];
  if (pageSlug && !result.config.pages?.some((p) => p.slug === pageSlug)) {
    return shell("No disponible", "404", "Esta página no existe.", 404);
  }

  let html: string;
  try {
    html = renderDemo(result.config, { page: pageSlug });
  } catch {
    return shell("No disponible", "500", "Este demo no se pudo cargar.", 500);
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
