import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderDemo } from "@/lib/demo/render";
import type { DemoConfig } from "@/lib/demo/types";

// Public demo page — served as raw HTML so the client sees a real website,
// not the CRM shell. Returned regardless of CRM auth; the slug is the secret.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.slug, slug)).get();

  if (!row || !row.published) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>No disponible</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#0f172a;color:#94a3b8;"><div style="text-align:center;padding:24px;"><p style="font-size:3rem;margin:0 0 12px;">404</p><p style="margin:0;">Este demo no está disponible.</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let config: DemoConfig;
  try {
    config = JSON.parse(row.config || "{}");
  } catch {
    return new NextResponse("Demo inválido", { status: 500 });
  }

  return new NextResponse(renderDemo(config), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
