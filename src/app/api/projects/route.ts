import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, contacts, projectMilestones, projectDeliverables } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  try {
    let query = db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        name: projects.name,
        status: projects.status,
        budgetCents: projects.budgetCents,
        startDate: projects.startDate,
        deadline: projects.deadline,
        mockupUrl: projects.mockupUrl,
        notes: projects.notes,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: contacts.name,
        clientCompany: contacts.company,
      })
      .from(projects)
      .leftJoin(contacts, eq(projects.clientId, contacts.id));

    if (clientId) {
      query = query.where(eq(projects.clientId, clientId)) as typeof query;
    }
    if (status) {
      query = query.where(eq(projects.status, status)) as typeof query;
    }

    const rows = query.orderBy(desc(projects.updatedAt)).all();

    // Attach milestone counts
    const enriched = rows.map((r) => {
      const milestones = db
        .select({ id: projectMilestones.id, completedAt: projectMilestones.completedAt })
        .from(projectMilestones)
        .where(eq(projectMilestones.projectId, r.id))
        .all();
      return {
        ...r,
        milestonesTotal: milestones.length,
        milestonesCompleted: milestones.filter((m) => m.completedAt !== null).length,
      };
    });

    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, name, status, budgetCents, startDate, deadline, mockupUrl, notes } = body;

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const now = new Date();
    const result = db
      .insert(projects)
      .values({
        clientId: clientId || null,
        name,
        status: status ?? "discovery",
        budgetCents: budgetCents ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        mockupUrl: mockupUrl || null,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
