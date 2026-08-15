import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { projectTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApi, currentApiUser } from "@/lib/apiAuth";

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

interface TaskRow {
  assignedUserId: string | null;
  createdByUserId: string | null;
  activityLog: string;
}

async function canAccess(
  userId: string | undefined,
  role: string | undefined,
  taskId: string,
  mode: "edit" | "delete",
): Promise<{ allowed: boolean; task: TaskRow | undefined }> {
  const row = await db
    .select({
      assignedUserId: projectTasks.assignedUserId,
      createdByUserId: projectTasks.createdByUserId,
      activityLog: projectTasks.activityLog,
    })
    .from(projectTasks)
    .where(eq(projectTasks.id, taskId))
    .get();

  if (!row) return { allowed: false, task: undefined };

  // Legacy (no auth) or owner — always allowed.
  if (!userId || role === "owner") return { allowed: true, task: row };

  const isAssignee = row.assignedUserId === userId;
  const isCreator = row.createdByUserId === userId;

  if (mode === "edit") return { allowed: isAssignee || isCreator, task: row };
  // Delete: only creator or owner (already handled above).
  return { allowed: isCreator, task: row };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireApi("tareas");
  if (denied) return denied;

  const user = await currentApiUser();
  const { id } = await params;

  try {
    const { allowed, task } = await canAccess(user?.id, user?.role, id, "edit");
    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: "Solo podés editar tareas asignadas a vos o que hayas creado" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, status, assignedUserId, dueDate, reminderAt, priority, done, comment } = body;

    const log: { action: string; actorName: string | null; at: string; detail?: string }[] =
      JSON.parse(task.activityLog || "[]");

    const actorName = user?.name ?? null;
    const stamp = (action: string, detail?: string) =>
      log.push({ action, actorName, at: new Date().toISOString(), detail });

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
  const denied = await requireApi("tareas");
  if (denied) return denied;

  const user = await currentApiUser();
  const { id } = await params;

  try {
    const { allowed, task } = await canAccess(user?.id, user?.role, id, "delete");
    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: "Solo podés eliminar tareas que hayas creado" }, { status: 403 });
    }

    await db.delete(projectTasks).where(eq(projectTasks.id, id)).run();
    await persistNow();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
