import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderDemo } from "@/lib/demo/render";
import { validateDemoConfig } from "@/lib/demo/validate";
import { requireApi } from "@/lib/apiAuth";
import type { DemoConfig } from "@/lib/demo/types";

const FALLBACK = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#18181b;color:#71717a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><p>Vista previa no disponible</p></body></html>`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const { id } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!row) {
    return new NextResponse(FALLBACK, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  let config: unknown;
  try {
    config = JSON.parse(row.publishedConfig || row.config || "{}");
  } catch {
    return new NextResponse(FALLBACK, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  let html: string;
  try {
    const result = validateDemoConfig(config);
    if (result.ok) {
      html = renderDemo(result.config, { mode: "publish" });
    } else {
      html = renderDemo(config as DemoConfig, { mode: "publish" });
    }
  } catch {
    try {
      html = renderDemo(config as DemoConfig, { mode: "publish" });
    } catch {
      html = FALLBACK;
    }
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
