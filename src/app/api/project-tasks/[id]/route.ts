import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { projectTasks } from "@/db/schema";
import { eq } from "drizzle-orm";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Completada",
};
const PRIORITY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, description, status, assignedUserId, dueDate, reminderAt, priority, done, comment, actorName } = body;

    const existing = await db.select({ activityLog: projectTasks.activityLog })
      .from(projectTasks).where(eq(projectTasks.id, id)).get();
    const log: { action: string; actorName: string | null; at: string; detail?: string }[] =
      existing ? JSON.parse(existing.activityLog || "[]") : [];

    const stamp = (action: string, detail?: string) =>
      log.push({ action, actorName: actorName ?? null, at: new Date().toISOString(), detail });

    if (status !== undefined) stamp("status", STATUS_LABELS[status] ?? status);
    if (priority !== undefined) stamp("priority", PRIORITY_LABELS[priority] ?? priority);
    if (dueDate !== undefined) stamp("due_date");
    if (assignedUserId !== undefined) stamp("assignee");
    if (comment) stamp("comment", comment);
    if (done === true) stamp("status", "Completada");
    if (done === false) stamp("status", "Pendiente");

    await db.update(projectTasks)
      .set({
        ...(title !== undefined && { title: title || null }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedUserId !== undefined && { assignedUserId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(reminderAt !== undefined && { reminderAt: reminderAt ? new Date(reminderAt) : null }),
        ...(done === true && { status: "done", completedAt: new Date() }),
        ...(done === false && { status: "pending", completedAt: null }),
        activityLog: JSON.stringify(log),
      })
      .where(eq(projectTasks.id, id))
      .run();

    await persistNow();
    return NextResponse.json({ ok: true, activityLog: log });
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
    await db.delete(projectTasks).where(eq(projectTasks.id, id)).run();
    await persistNow();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
