import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { arsenalItems } from "@/db/schema";
import { desc, like, or, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";

  let rows = await db
    .select()
    .from(arsenalItems)
    .orderBy(desc(arsenalItems.updatedAt))
    .all();

  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(lq) ||
        (r.description ?? "").toLowerCase().includes(lq) ||
        (r.tags ?? "[]").toLowerCase().includes(lq)
    );
  }
  if (category && category !== "all") {
    rows = rows.filter((r) => r.category === category);
  }

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, category, status, icon, description, url, tags, useCases, costCents, details, notes } = body as Record<string, string | number | null>;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const now = new Date();
  const row = await db
    .insert(arsenalItems)
    .values({
      name: String(name).trim(),
      category: String(category ?? "Tool"),
      status: String(status ?? "active"),
      icon: String(icon ?? "🔧"),
      description: description ? String(description) : null,
      url: url ? String(url) : null,
      tags: typeof tags === "string" ? tags : "[]",
      useCases: typeof useCases === "string" ? useCases : "[]",
      costCents: costCents ? Number(costCents) : null,
      details: details ? String(details) : null,
      notes: notes ? String(notes) : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return NextResponse.json(row, { status: 201 });
}
