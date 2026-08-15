import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { projectTasks, users, projects } from "@/db/schema";
import { eq, desc, or, sql } from "drizzle-orm";
import { requireApi, currentApiUser } from "@/lib/apiAuth";

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
  const denied = await requireApi("tareas");
  if (denied) return denied;

  const user = await currentApiUser();

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
        title: projectTasks.title,
        description: projectTasks.description,
        assignedUserId: projectTasks.assignedUserId,
        createdByUserId: projectTasks.createdByUserId,
        status: projectTasks.status,
        priority: projectTasks.priority,
        dueDate: projectTasks.dueDate,
        reminderAt: projectTasks.reminderAt,
        completedAt: projectTasks.completedAt,
        activityLog: projectTasks.activityLog,
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

    // Non-owner users only see tasks they created or are assigned to.
    if (user && user.role !== "owner") {
      query = query.where(
        or(
          eq(projectTasks.assignedUserId, user.id!),
          eq(projectTasks.createdByUserId, user.id!),
        )
      ) as typeof query;
    }

    const rows = await query.orderBy(desc(projectTasks.createdAt)).all();

    // Resolve creator names in a single pass.
    const creatorIds = [...new Set(rows.map((r) => r.createdByUserId).filter(Boolean))] as string[];
    const creatorMap: Record<string, string> = {};
    if (creatorIds.length) {
      const creators = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(creatorIds.map(id => sql`${id}`), sql`, `)})`)
        .all();
      for (const c of creators) creatorMap[c.id] = c.name;
    }

    const parsed = rows.map((r) => ({
      ...r,
      activityLog: JSON.parse(r.activityLog || "[]"),
      createdByUserName: r.createdByUserId ? creatorMap[r.createdByUserId] ?? null : null,
    }));
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireApi("tareas");
  if (denied) return denied;

  const user = await currentApiUser();

  try {
    const { projectId, type, title, description, assignedUserId, dueDate, reminderAt, status, priority } =
      await request.json();

    if (!description) {
      return NextResponse.json({ error: "description requerida" }, { status: 400 });
    }

    const actorName = user?.name ?? null;
    const resolvedProjectId = projectId || (await getOrCreateGeneralProject());
    const activityLog = [
      { action: "created", actorName, at: new Date().toISOString() },
    ];

    const result = await db
      .insert(projectTasks)
      .values({
        projectId: resolvedProjectId,
        type: type ?? "task",
        title: title || null,
        description,
        assignedUserId: assignedUserId || null,
        createdByUserId: user?.id ?? null,
        status: status ?? "pending",
        priority: priority ?? "media",
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        activityLog: JSON.stringify(activityLog),
        createdAt: new Date(),
      })
      .returning()
      .get();

    await persistNow();
    return NextResponse.json({ ...result, activityLog }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
