export type TaskStatus = "pending" | "in_progress" | "in_review" | "done";
export type TaskPriority = "alta" | "media" | "baja";

export interface ActivityEntry {
  action: string;
  actorName: string | null;
  at: string;
  detail?: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string | null;
  title: string | null;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: number | null;
  reminderAt: number | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserColor: string | null;
  assignedUserAvatar: string | null;
  activityLog: ActivityEntry[];
  createdAt: number;
}

export interface TaskProject {
  id: string;
  name: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Completada",
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  alta: { label: "Alta", color: "#dc2626", bg: "#dc262620" },
  media: { label: "Media", color: "#d97706", bg: "#d9770620" },
  baja: { label: "Baja", color: "#64748b", bg: "#64748b20" },
};

export function isOverdue(task: Task): boolean {
  // dueDate arrives from the API as an ISO string (Date -> JSON), not a raw
  // number, even though the type says number — route through `new Date()`
  // (which accepts both) rather than comparing the raw value.
  return !!task.dueDate && task.status !== "done" && new Date(task.dueDate).getTime() < Date.now();
}

// Which visual column a task belongs to. Overdue is a derived state (not a
// real status) that takes priority over the task's actual status so it
// surfaces in its own lane instead of getting lost in "Pendientes".
export type BoardColumn = TaskStatus | "overdue";

export function columnFor(task: Task): BoardColumn {
  if (isOverdue(task)) return "overdue";
  return task.status;
}
