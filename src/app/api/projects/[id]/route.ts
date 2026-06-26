import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, contacts, projectMilestones, projectDeliverables } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const row = db
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
      .leftJoin(contacts, eq(projects.clientId, contacts.id))
      .where(eq(projects.id, id))
      .get();

    if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const milestones = db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id))
      .orderBy(projectMilestones.order)
      .all();

    const milestoneIds = milestones.map((m) => m.id);
    const deliverables = milestoneIds.length
      ? db
          .select()
          .from(projectDeliverables)
          .where(
            milestoneIds.length === 1
              ? eq(projectDeliverables.milestoneId, milestoneIds[0])
              : undefined as never
          )
          .all()
      : [];

    // Build milestones with nested deliverables
    const milestonesWithDeliverables = milestones.map((m) => ({
      ...m,
      deliverables: deliverables.filter((d) => d.milestoneId === m.id),
    }));

    if (milestoneIds.length > 1) {
      // Re-fetch all deliverables using raw SQL for multiple milestone IDs
      const allDeliverables = db
        .select()
        .from(projectDeliverables)
        .all()
        .filter((d) => milestoneIds.includes(d.milestoneId));

      milestonesWithDeliverables.forEach((m) => {
        m.deliverables = allDeliverables.filter((d) => d.milestoneId === m.id);
      });
    }

    return NextResponse.json({ ...row, milestones: milestonesWithDeliverables });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, status, budgetCents, startDate, deadline, mockupUrl, notes, clientId } = body;

    db.update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(budgetCents !== undefined && { budgetCents }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(mockupUrl !== undefined && { mockupUrl }),
        ...(notes !== undefined && { notes }),
        ...(clientId !== undefined && { clientId }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .run();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    db.delete(projects).where(eq(projects.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
