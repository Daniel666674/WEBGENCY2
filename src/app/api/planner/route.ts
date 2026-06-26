import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, projectMilestones, projectTasks, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProjects = db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        deadline: projects.deadline,
      })
      .from(projects)
      .all();

    const allMilestones = db
      .select({
        id: projectMilestones.id,
        projectId: projectMilestones.projectId,
        title: projectMilestones.title,
        dueDate: projectMilestones.dueDate,
        completedAt: projectMilestones.completedAt,
      })
      .from(projectMilestones)
      .all();

    const allTasks = db
      .select({
        id: projectTasks.id,
        projectId: projectTasks.projectId,
        type: projectTasks.type,
        description: projectTasks.description,
        status: projectTasks.status,
        dueDate: projectTasks.dueDate,
        assignedUserId: projectTasks.assignedUserId,
        assignedUserColor: users.color,
        assignedUserName: users.name,
      })
      .from(projectTasks)
      .leftJoin(users, eq(projectTasks.assignedUserId, users.id))
      .orderBy(desc(projectTasks.createdAt))
      .all();

    return NextResponse.json({ projects: allProjects, milestones: allMilestones, tasks: allTasks });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
