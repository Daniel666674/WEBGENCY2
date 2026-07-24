import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { arsenalItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = await db.select().from(arsenalItems).where(eq(arsenalItems.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, category, status, icon, description, url, tags, useCases, costCents, details, notes } = body as Record<string, string | number | null>;

  const row = await db
    .update(arsenalItems)
    .set({
      name: name ? String(name).trim() : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      icon: icon !== undefined ? String(icon) : undefined,
      description: description !== undefined ? (description ? String(description) : null) : undefined,
      url: url !== undefined ? (url ? String(url) : null) : undefined,
      tags: tags !== undefined ? String(tags) : undefined,
      useCases: useCases !== undefined ? String(useCases) : undefined,
      costCents: costCents !== undefined ? (costCents ? Number(costCents) : null) : undefined,
      details: details !== undefined ? (details ? String(details) : null) : undefined,
      notes: notes !== undefined ? (notes ? String(notes) : null) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(arsenalItems.id, id))
    .returning()
    .get();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(arsenalItems).where(eq(arsenalItems.id, id)).run();
  return NextResponse.json({ ok: true });
}
