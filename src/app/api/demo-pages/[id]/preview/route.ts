import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderDemo } from "@/lib/demo/render";
import { validateDemoConfig } from "@/lib/demo/validate";
import { requireApi } from "@/lib/apiAuth";
import type { DemoConfig } from "@/lib/demo/types";

const FALLBACK = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#18181b;color:#71717a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><p style="opacity:.6">Vista previa no disponible</p></body></html>`;

function respond(html: string) {
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const { id } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!row) return respond(FALLBACK);

  let config: unknown;
  try {
    config = JSON.parse(row.config || "{}");
  } catch {
    return respond(FALLBACK);
  }

  // Try validated config first (safest).
  const result = validateDemoConfig(config);
  if (result.ok) {
    try {
      return respond(renderDemo(result.config));
    } catch { /* fall through */ }
  }

  // Validation failed — try rendering raw config directly.
  try {
    return respond(renderDemo(config as unknown as DemoConfig));
  } catch { /* fall through */ }

  // Last resort for verbatim imports: try rendering the first verbatim
  // page directly if the default page key didn't match.
  const verb = (config as unknown as DemoConfig).verbatim;
  if (verb) {
    const firstKey = Object.keys(verb)[0];
    if (firstKey !== undefined) {
      try {
        return respond(renderDemo(config as unknown as DemoConfig, { page: firstKey }));
      } catch { /* fall through */ }
    }
  }

  return respond(FALLBACK);
}
