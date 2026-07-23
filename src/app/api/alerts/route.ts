import { NextResponse } from "next/server";
import { db } from "@/db";
import { projectTasks, projectMilestones } from "@/db/schema";
import { lt, isNotNull, isNull, ne, eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();

    const overdueTasks = (
      await db
        .select({ id: projectTasks.id })
        .from(projectTasks)
        .where(
          and(
            isNotNull(projectTasks.dueDate),
            lt(projectTasks.dueDate, now),
            ne(projectTasks.status, "done"),
            eq(projectTasks.type, "task")
          )
        )
        .all()
    ).length;

    const overdueSolicitudes = (
      await db
        .select({ id: projectTasks.id })
        .from(projectTasks)
        .where(
          and(
            isNotNull(projectTasks.dueDate),
            lt(projectTasks.dueDate, now),
            ne(projectTasks.status, "done"),
            eq(projectTasks.type, "solicitud")
          )
        )
        .all()
    ).length;

    const overdueMilestones = (
      await db
        .select({ id: projectMilestones.id })
        .from(projectMilestones)
        .where(
          and(
            isNotNull(projectMilestones.dueDate),
            lt(projectMilestones.dueDate, now),
            isNull(projectMilestones.completedAt)
          )
        )
        .all()
    ).length;

    return NextResponse.json({
      overdueTasks,
      overdueSolicitudes,
      overdueMilestones,
      total: overdueTasks + overdueSolicitudes + overdueMilestones,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
