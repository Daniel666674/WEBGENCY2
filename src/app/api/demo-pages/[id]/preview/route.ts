import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderDemo } from "@/lib/demo/render";
import { validateDemoConfig } from "@/lib/demo/validate";
import { requireApi } from "@/lib/apiAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const { id } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  let config;
  try {
    config = JSON.parse(row.publishedConfig || row.config || "{}");
  } catch {
    config = {};
  }

  const result = validateDemoConfig(config);
  if (!result.ok) {
    return new NextResponse("Invalid config", { status: 500 });
  }
  const html = renderDemo(result.config, { mode: "publish" });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
