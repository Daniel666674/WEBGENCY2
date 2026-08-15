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
  assignedUserIds: string;
  createdByUserId: string | null;
  activityLog: string;
}

function isAssignee(row: TaskRow, userId: string): boolean {
  const ids: string[] = JSON.parse(row.assignedUserIds || "[]");
  return ids.includes(userId) || row.assignedUserId === userId;
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
      assignedUserIds: projectTasks.assignedUserIds,
      createdByUserId: projectTasks.createdByUserId,
      activityLog: projectTasks.activityLog,
    })
    .from(projectTasks)
    .where(eq(projectTasks.id, taskId))
    .get();

  if (!row) return { allowed: false, task: undefined };

  if (!userId || role === "owner") return { allowed: true, task: row };

  const assigned = isAssignee(row, userId);
  const isCreator = row.createdByUserId === userId;

  if (mode === "edit") return { allowed: assigned || isCreator, task: row };
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
    const { title, description, status, assignedUserId, assignedUserIds, dueDate, reminderAt, priority, done, comment } = body;

    const log: { action: string; actorName: string | null; at: string; detail?: string }[] =
      JSON.parse(task.activityLog || "[]");

    const actorName = user?.name ?? null;
    const stamp = (action: string, detail?: string) =>
      log.push({ action, actorName, at: new Date().toISOString(), detail });

    if (status !== undefined) stamp("status", STATUS_LABELS[status] ?? status);
    if (priority !== undefined) stamp("priority", PRIORITY_LABELS[priority] ?? priority);
    if (dueDate !== undefined) stamp("due_date");
    if (assignedUserId !== undefined || assignedUserIds !== undefined) stamp("assignee");
    if (comment) stamp("comment", comment);
    if (done === true) stamp("status", "Completada");
    if (done === false) stamp("status", "Pendiente");

    // Build the assignee update — multi takes precedence over single.
    const assigneeUpdate: Record<string, unknown> = {};
    if (assignedUserIds !== undefined) {
      const ids: string[] = Array.isArray(assignedUserIds) ? assignedUserIds : [];
      assigneeUpdate.assignedUserIds = JSON.stringify(ids);
      assigneeUpdate.assignedUserId = ids[0] || null;
    } else if (assignedUserId !== undefined) {
      assigneeUpdate.assignedUserId = assignedUserId || null;
      assigneeUpdate.assignedUserIds = assignedUserId
        ? JSON.stringify([assignedUserId])
        : "[]";
    }

    await db.update(projectTasks)
      .set({
        ...(title !== undefined && { title: title || null }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...assigneeUpdate,
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
