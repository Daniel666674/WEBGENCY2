import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { proposals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = db.select().from(proposals).where(eq(proposals.id, id)).get();
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({
    ...row,
    features: JSON.parse(row.features || "[]"),
    addOns: JSON.parse(row.addOns || "[]"),
    automations: JSON.parse(row.automations || "[]"),
    deliverables: JSON.parse(row.deliverables || "[]"),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { planName, oneTimeFee, monthlyFee, features, addOns, automations, deliverables, notes } = body;

  try {
    const result = db
      .update(proposals)
      .set({
        planName: planName ?? undefined,
        oneTimeFee: oneTimeFee ?? undefined,
        monthlyFee: monthlyFee ?? undefined,
        features: features !== undefined ? JSON.stringify(features) : undefined,
        addOns: addOns !== undefined ? JSON.stringify(addOns) : undefined,
        automations: automations !== undefined ? JSON.stringify(automations) : undefined,
        deliverables: deliverables !== undefined ? JSON.stringify(deliverables) : undefined,
        notes: notes ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning()
      .get();

    if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await persistNow();
    return NextResponse.json({
      ...result,
      features: JSON.parse(result.features || "[]"),
      addOns: JSON.parse(result.addOns || "[]"),
      automations: JSON.parse(result.automations || "[]"),
      deliverables: JSON.parse(result.deliverables || "[]"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(proposals).where(eq(proposals.id, id)).run();
  await persistNow();
  return NextResponse.json({ success: true });
}
