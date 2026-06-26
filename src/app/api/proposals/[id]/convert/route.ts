import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { proposals, contacts, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const proposal = db.select().from(proposals).where(eq(proposals.id, id)).get();
    if (!proposal) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const contact = db.select().from(contacts).where(eq(contacts.id, proposal.contactId)).get();
    const clientLabel = contact?.company || contact?.name || "Cliente";

    const project = db
      .insert(projects)
      .values({
        clientId: proposal.contactId,
        name: `${clientLabel} — ${proposal.planName}`,
        status: "discovery",
        budgetCents: proposal.oneTimeFee,
        notes: proposal.notes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .get();

    return NextResponse.json({ projectId: project.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
