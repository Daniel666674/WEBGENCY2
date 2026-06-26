import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectMilestones } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, dueDate, completedAt, completed } = body;

    db.update(projectMilestones)
      .set({
        ...(title !== undefined && { title }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(completed === true && { completedAt: new Date() }),
        ...(completed === false && { completedAt: null }),
        ...(completedAt !== undefined && {
          completedAt: completedAt ? new Date(completedAt) : null,
        }),
      })
      .where(eq(projectMilestones.id, id))
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
    db.delete(projectMilestones).where(eq(projectMilestones.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
