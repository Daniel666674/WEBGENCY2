import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMilestones, projectDeliverables } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const milestones = db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id))
      .orderBy(projectMilestones.order)
      .all();

    const all = db.select().from(projectDeliverables).all();
    const milestoneIds = new Set(milestones.map((m) => m.id));
    const deliverables = all.filter((d) => milestoneIds.has(d.milestoneId));

    return NextResponse.json(
      milestones.map((m) => ({
        ...m,
        deliverables: deliverables.filter((d) => d.milestoneId === m.id),
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const { title, dueDate, order } = await req.json();
    if (!title) return NextResponse.json({ error: "Titulo requerido" }, { status: 400 });

    const existing = db
      .select({ order: projectMilestones.order })
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .all();
    const nextOrder = order ?? (existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 1);

    const result = db
      .insert(projectMilestones)
      .values({
        projectId,
        title,
        order: nextOrder,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: new Date(),
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
