import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

function parseRow(row: typeof demoPages.$inferSelect) {
  let config = {};
  try { config = JSON.parse(row.config || "{}"); } catch { config = {}; }
  return { ...row, config };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(parseRow(row));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updateData.title = body.title;
  if (body.template !== undefined) updateData.template = body.template;
  if (body.published !== undefined) updateData.published = !!body.published;
  if (body.config !== undefined) updateData.config = JSON.stringify(body.config);

  const result = await db
    .update(demoPages)
    .set(updateData)
    .where(eq(demoPages.id, id))
    .returning()
    .get();

  if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await persistNow();
  await logAudit(request, "update", "demo", id, { title: result.title });
  return NextResponse.json(parseRow(result));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  await db.delete(demoPages).where(eq(demoPages.id, id)).run();
  await persistNow();
  await logAudit(req, "delete", "demo", id, { title: existing?.title });
  return NextResponse.json({ success: true });
}
