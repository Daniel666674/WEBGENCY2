import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { projectTasks, users, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function getOrCreateGeneralProject(): Promise<string> {
  const existing = await db.select({ id: projects.id }).from(projects)
    .where(eq(projects.name, "General")).get();
  if (existing) return existing.id;
  const created = await db.insert(projects).values({
    name: "General",
    status: "discovery",
    budgetCents: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning({ id: projects.id }).get();
  return created.id;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");

  try {
    let query = db
      .select({
        id: projectTasks.id,
        projectId: projectTasks.projectId,
        projectName: projects.name,
        type: projectTasks.type,
        description: projectTasks.description,
        assignedUserId: projectTasks.assignedUserId,
        status: projectTasks.status,
        dueDate: projectTasks.dueDate,
        completedAt: projectTasks.completedAt,
        createdAt: projectTasks.createdAt,
        assignedUserName: users.name,
        assignedUserColor: users.color,
        assignedUserAvatar: users.avatar,
      })
      .from(projectTasks)
      .leftJoin(users, eq(projectTasks.assignedUserId, users.id))
      .leftJoin(projects, eq(projectTasks.projectId, projects.id));

    if (projectId) {
      query = query.where(eq(projectTasks.projectId, projectId)) as typeof query;
    }
    if (type) {
      query = query.where(eq(projectTasks.type, type)) as typeof query;
    }

    const rows = await query.orderBy(desc(projectTasks.createdAt)).all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, type, description, assignedUserId, dueDate, status } =
      await request.json();

    if (!description) {
      return NextResponse.json({ error: "description requerida" }, { status: 400 });
    }

    const resolvedProjectId = projectId || (await getOrCreateGeneralProject());

    const result = await db
      .insert(projectTasks)
      .values({
        projectId: resolvedProjectId,
        type: type ?? "task",
        description,
        assignedUserId: assignedUserId || null,
        status: status ?? "pending",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: new Date(),
      })
      .returning()
      .get();

    await persistNow();
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
