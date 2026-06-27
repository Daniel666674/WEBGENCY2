import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { proposals, contacts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");

  let rows;
  if (contactId) {
    rows = db
      .select({ p: proposals, contactName: contacts.name, contactCompany: contacts.company })
      .from(proposals)
      .leftJoin(contacts, eq(proposals.contactId, contacts.id))
      .where(eq(proposals.contactId, contactId))
      .orderBy(desc(proposals.createdAt))
      .all();
  } else {
    rows = db
      .select({ p: proposals, contactName: contacts.name, contactCompany: contacts.company })
      .from(proposals)
      .leftJoin(contacts, eq(proposals.contactId, contacts.id))
      .orderBy(desc(proposals.createdAt))
      .all();
  }

  const parsed = rows.map(({ p, contactName, contactCompany }) => ({
    ...p,
    contactName: contactCompany || contactName || null,
    features: JSON.parse(p.features || "[]"),
    addOns: JSON.parse(p.addOns || "[]"),
    automations: JSON.parse(p.automations || "[]"),
    deliverables: JSON.parse(p.deliverables || "[]"),
  }));

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { contactId, planName, oneTimeFee, monthlyFee, features, addOns, automations, deliverables, notes } = body;

  if (!contactId) {
    return NextResponse.json({ error: "contactId requerido" }, { status: 400 });
  }

  try {
    const now = new Date();
    const result = db
      .insert(proposals)
      .values({
        contactId,
        planName: planName || "Custom",
        oneTimeFee: oneTimeFee || 0,
        monthlyFee: monthlyFee || 0,
        features: JSON.stringify(features || []),
        addOns: JSON.stringify(addOns || []),
        automations: JSON.stringify(automations || []),
        deliverables: JSON.stringify(deliverables || []),
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return NextResponse.json({
      ...result,
      features: JSON.parse(result.features || "[]"),
      addOns: JSON.parse(result.addOns || "[]"),
      automations: JSON.parse(result.automations || "[]"),
      deliverables: JSON.parse(result.deliverables || "[]"),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
