import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoAssets } from "@/db/schema";
import { desc } from "drizzle-orm";
import { safeUrl } from "@/lib/demo/validate";
import { requireApi } from "@/lib/apiAuth";

// Reusable across every demo — this CRM is single-tenant, so there's no
// per-account scoping needed. Newest first, capped generously.
export async function GET() {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const rows = await db.select().from(demoAssets).orderBy(desc(demoAssets.createdAt)).limit(200).all();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const url = safeUrl(body.url);
  if (!url) return NextResponse.json({ error: "URL invalida" }, { status: 400 });

  const kind = body.kind === "video" ? "video" : "image";
  const alt = typeof body.alt === "string" ? body.alt.slice(0, 300) : null;

  const result = await db
    .insert(demoAssets)
    .values({ url, alt, kind, createdAt: new Date() })
    .returning()
    .get();

  await persistNow();
  return NextResponse.json(result, { status: 201 });
}
