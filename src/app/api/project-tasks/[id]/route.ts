import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectTasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { description, status, assignedUserId, dueDate, done } = body;

    db.update(projectTasks)
      .set({
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(assignedUserId !== undefined && { assignedUserId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(done === true && { status: "done", completedAt: new Date() }),
        ...(done === false && { status: "pending", completedAt: null }),
      })
      .where(eq(projectTasks.id, id))
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
    db.delete(projectTasks).where(eq(projectTasks.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
