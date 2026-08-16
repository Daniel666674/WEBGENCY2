import { NextRequest, NextResponse } from "next/server";
import { db, persistNow, rawClient } from "@/db";
import { projectTasks, users, projects } from "@/db/schema";
import { eq, desc, or, sql } from "drizzle-orm";
import { requireApi, currentApiUser } from "@/lib/apiAuth";

async function purgeAllTasks() {
  try {
    const { rows: done } = await rawClient.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
      args: ["2026-purge-all-tasks-api"],
    });
    if (done.length > 0) return;

    const { rowsAffected } = await rawClient.execute("DELETE FROM project_tasks");
    await rawClient.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: ["2026-purge-all-tasks-api", Date.now()],
    });
    if (rowsAffected) console.log(`[/api/project-tasks] purged ${rowsAffected} tasks`);
  } catch (err) {
    console.error("[/api/project-tasks] purge failed:", err);
  }
}

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

interface UserInfo { id: string; name: string; color: string; avatar: string | null }

async function resolveUsers(ids: string[]): Promise<Record<string, UserInfo>> {
  if (!ids.length) return {};
  const rows = await db
    .select({ id: users.id, name: users.name, color: users.color, avatar: users.avatar })
    .from(users)
    .where(sql`${users.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
    .all();
  const map: Record<string, UserInfo> = {};
  for (const r of rows) map[r.id] = r;
  return map;
}

export async function GET(request: NextRequest) {
  const denied = await requireApi("tareas");
  if (denied) return denied;

  await purgeAllTasks();

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
        assignedUserIds: projectTasks.assignedUserIds,
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
          sql`${projectTasks.assignedUserIds} LIKE '%' || ${user.id!} || '%'`,
          eq(projectTasks.createdByUserId, user.id!),
        )
      ) as typeof query;
    }

    const rows = await query.orderBy(desc(projectTasks.createdAt)).all();

    // Collect all user IDs we need to resolve (assignees + creators).
    const allUserIds = new Set<string>();
    for (const r of rows) {
      if (r.createdByUserId) allUserIds.add(r.createdByUserId);
      const ids: string[] = JSON.parse(r.assignedUserIds || "[]");
      for (const id of ids) allUserIds.add(id);
    }
    const userMap = await resolveUsers([...allUserIds]);

    const parsed = rows.map((r) => {
      const ids: string[] = JSON.parse(r.assignedUserIds || "[]");
      const assignees = ids
        .map((id) => userMap[id])
        .filter(Boolean) as UserInfo[];

      return {
        ...r,
        assignedUserIds: ids,
        assignees,
        activityLog: JSON.parse(r.activityLog || "[]"),
        createdByUserName: r.createdByUserId ? userMap[r.createdByUserId]?.name ?? null : null,
      };
    });
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
    const { projectId, type, title, description, assignedUserId, assignedUserIds, dueDate, reminderAt, status, priority } =
      await request.json();

    if (!description) {
      return NextResponse.json({ error: "description requerida" }, { status: 400 });
    }

    // Support both single and multi-assignee. Multi takes precedence.
    const ids: string[] = Array.isArray(assignedUserIds) && assignedUserIds.length
      ? assignedUserIds
      : assignedUserId ? [assignedUserId] : [];
    const primaryAssignee = ids[0] || null;

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
        assignedUserId: primaryAssignee,
        assignedUserIds: JSON.stringify(ids),
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
