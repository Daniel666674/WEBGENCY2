import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { proposals, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const row = db.select().from(proposals).where(eq(proposals.shareToken, token)).get();
    if (!row) return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });

    const contact = db.select().from(contacts).where(eq(contacts.id, row.contactId)).get();

    // Mark as viewed on first access
    if (!row.viewedAt) {
      db.update(proposals).set({ viewedAt: new Date() }).where(eq(proposals.id, row.id)).run();
    }

    return NextResponse.json({
      id: row.id,
      planName: row.planName,
      oneTimeFee: row.oneTimeFee,
      monthlyFee: row.monthlyFee,
      features: JSON.parse(row.features || "[]"),
      addOns: JSON.parse(row.addOns || "[]"),
      automations: JSON.parse(row.automations || "[]"),
      deliverables: JSON.parse(row.deliverables || "[]"),
      notes: row.notes,
      pricingMeta: JSON.parse(row.pricingMeta || "{}"),
      validUntil: row.validUntil,
      createdAt: row.createdAt,
      viewedAt: row.viewedAt,
      contact: contact
        ? { name: contact.name, company: contact.company, email: contact.email }
        : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
