import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, contacts, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  try {
    let query = db
      .select({
        id: payments.id,
        clientId: payments.clientId,
        projectId: payments.projectId,
        amountCents: payments.amountCents,
        paidAt: payments.paidAt,
        note: payments.note,
        createdAt: payments.createdAt,
        clientName: contacts.name,
        projectName: projects.name,
      })
      .from(payments)
      .leftJoin(contacts, eq(payments.clientId, contacts.id))
      .leftJoin(projects, eq(payments.projectId, projects.id));

    if (clientId) {
      query = query.where(eq(payments.clientId, clientId)) as typeof query;
    }

    const rows = await query.orderBy(desc(payments.createdAt)).all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, projectId, amountCents, paidAt, note } = await request.json();
    if (!clientId || !amountCents) {
      return NextResponse.json({ error: "clientId y amountCents requeridos" }, { status: 400 });
    }

    const result = await db
      .insert(payments)
      .values({
        clientId,
        projectId: projectId || null,
        amountCents,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        note: note || null,
        createdAt: new Date(),
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
