"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, Calendar, Circle } from "lucide-react";
import { toast } from "sonner";

interface TaskUser {
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserColor: string | null;
  assignedUserAvatar: string | null;
}

interface ProjectTask extends TaskUser {
  id: string;
  projectId: string;
  type: string;
  description: string;
  status: string;
  dueDate: Date | number | null;
  completedAt: Date | number | null;
  createdAt: Date | number;
}

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",   color: "text-muted-foreground", dot: "bg-muted-foreground" },
  in_progress: { label: "En progreso", color: "text-amber-600",        dot: "bg-amber-400" },
  done:        { label: "Listo",       color: "text-primary",          dot: "bg-primary" },
};

interface Props {
  projectId: string;
  taskType: "task" | "solicitud";
}

export function ProjectTaskList({ projectId, taskType }: Props) {
  const { users, activeUser } = useUser();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState<string>("");
  const [newDue, setNewDue] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/project-tasks?projectId=${projectId}&type=${taskType}`);
    setTasks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Pre-select active user for tasks
    if (taskType === "task" && activeUser) setNewAssignee(activeUser.id);
  }, [projectId, taskType, activeUser?.id]);

  async function addTask() {
    if (!newDesc.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: taskType,
          description: newDesc.trim(),
          assignedUserId: taskType === "task" ? (newAssignee || null) : null,
          dueDate: newDue || null,
        }),
      });
      setNewDesc(""); setNewDue("");
      toast.success(taskType === "task" ? "Tarea creada" : "Solicitud agregada");
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(task: ProjectTask) {
    const order: ProjectTask["status"][] = ["pending", "in_progress", "done"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    await fetch(`/api/project-tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, done: next === "done" }),
    });
    load();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    setTasks((t) => t.filter((x) => x.id !== id));
  }

  const pending = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      {/* Add form */}
      {adding ? (
        <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">
            {taskType === "task" ? "Nueva tarea" : "Nueva solicitud del cliente"}
          </p>
          <textarea
            autoFocus
            rows={2}
            placeholder={
              taskType === "task"
                ? "Describe la tarea..."
                : "Describe la solicitud o cambio pedido por el cliente..."
            }
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
          />
          <div className="flex gap-3 flex-wrap">
            {taskType === "task" && users.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Asignar a:</span>
                <div className="flex gap-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setNewAssignee(u.id === newAssignee ? "" : u.id)}
                      className={cn(
                        "w-7 h-7 rounded-full text-xs font-bold text-white transition-all",
                        newAssignee === u.id
                          ? "ring-2 ring-offset-1 ring-primary scale-110"
                          : "opacity-50 hover:opacity-80"
                      )}
                      style={{ backgroundColor: u.color }}
                      title={u.name}
                    >
                      {u.avatar ?? u.name[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 inline mr-0.5" />Vence:
              </span>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="text-xs border rounded px-2 py-0.5 bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTask}
              disabled={saving || !newDesc.trim()}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewDesc(""); }}
              className="px-4 py-1.5 text-sm text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed rounded-xl px-4 py-2.5 w-full transition-colors"
        >
          <Plus className="h-4 w-4" />
          {taskType === "task" ? "Agregar tarea" : "Agregar solicitud del cliente"}
        </button>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Pending + in_progress */}
      {!loading && pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onCycle={cycleStatus}
              onDelete={deleteTask}
              showAssignee={taskType === "task"}
            />
          ))}
        </div>
      )}

      {!loading && pending.length === 0 && done.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {taskType === "task"
            ? "Sin tareas. Agrega la primera."
            : "Sin solicitudes registradas."}
        </p>
      )}

      {/* Done section */}
      {!loading && done.length > 0 && (
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground list-none flex items-center gap-1.5 py-1">
            <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
            Completadas ({done.length})
          </summary>
          <div className="mt-2 space-y-2">
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onCycle={cycleStatus}
                onDelete={deleteTask}
                showAssignee={taskType === "task"}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onCycle,
  onDelete,
  showAssignee,
}: {
  task: ProjectTask;
  onCycle: (t: ProjectTask) => void;
  onDelete: (id: string) => void;
  showAssignee: boolean;
}) {
  const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const isDone = task.status === "done";
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && !isDone && dueDate < new Date();

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border rounded-lg transition-colors",
        isDone ? "bg-muted/20 opacity-60" : "bg-card hover:bg-muted/20"
      )}
    >
      {/* Status cycle button */}
      <button
        onClick={() => onCycle(task)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
          isDone
            ? "bg-primary border-primary"
            : task.status === "in_progress"
            ? "border-amber-400 bg-amber-50"
            : "border-muted-foreground hover:border-primary"
        )}
        title="Cambiar estado"
      >
        {isDone && <Check className="h-2.5 w-2.5 text-white" />}
        {task.status === "in_progress" && <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isDone && "line-through text-muted-foreground")}>
          {task.description}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          {dueDate && (
            <span className={cn("text-xs flex items-center gap-0.5", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" />
              {dueDate.toLocaleDateString("es-CO", { month: "short", day: "numeric" })}
              {isOverdue && " · vencida"}
            </span>
          )}
          {showAssignee && task.assignedUserName && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: task.assignedUserColor ?? "#64748b" }}
            >
              {task.assignedUserAvatar ?? task.assignedUserName[0]}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
