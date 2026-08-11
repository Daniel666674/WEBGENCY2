import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { contacts, deals, activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { parseContactJsonFields, applyContactJsonFields } from "@/lib/contactJsonFields";
import { requireApi } from "@/lib/apiAuth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireApi("contacts");
  if (denied) return denied;

  const { id } = await params;

  const contact = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .get();

  if (!contact) {
    return NextResponse.json(
      { error: "Contacto no encontrado" },
      { status: 404 }
    );
  }

  const contactDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.contactId, id))
    .all();

  const contactActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.contactId, id))
    .all();

  return NextResponse.json({
    ...parseContactJsonFields(contact),
    deals: contactDeals,
    activities: contactActivities,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireApi("contacts");
  if (denied) return denied;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Contacto no encontrado" },
      { status: 404 }
    );
  }

  // Only allow updating specific fields
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.company !== undefined) updateData.company = body.company;
  if (body.source !== undefined) updateData.source = body.source;
  if (body.temperature !== undefined) updateData.temperature = body.temperature;
  if (body.score !== undefined) updateData.score = Math.max(0, Math.min(100, body.score));
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.mockupUrl !== undefined) updateData.mockupUrl = body.mockupUrl || null;
  if (body.siteUrl !== undefined) updateData.siteUrl = body.siteUrl || null;
  if (body.signedDate !== undefined) updateData.signedDate = body.signedDate ? new Date(body.signedDate) : null;
  if (body.monthlyPayment !== undefined) updateData.monthlyPayment = body.monthlyPayment || null;
  if (body.clientStatus !== undefined) updateData.clientStatus = body.clientStatus;
  if (body.nextPaymentDate !== undefined) updateData.nextPaymentDate = body.nextPaymentDate ? new Date(body.nextPaymentDate) : null;
  applyContactJsonFields(body, updateData);

  const result = await db
    .update(contacts)
    .set(updateData)
    .where(eq(contacts.id, id))
    .returning()
    .get();

  await persistNow();
  await logAudit(request, "update", "contact", id, { name: result.name });
  return NextResponse.json(parseContactJsonFields(result));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireApi("contacts");
  if (denied) return denied;

  const { id } = await params;

  const existing = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Contacto no encontrado" },
      { status: 404 }
    );
  }

  await db.delete(contacts).where(eq(contacts.id, id)).run();
  await persistNow();
  await logAudit(_request, "delete", "contact", id, { name: existing.name });
  return NextResponse.json({ success: true });
}
