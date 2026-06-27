"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, Calendar, Circle, ClipboardList, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";

interface Task {
  id: string;
  projectId: string;
  projectName: string | null;
  description: string;
  status: string;
  dueDate: number | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserColor: string | null;
  assignedUserAvatar: string | null;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",   color: "text-muted-foreground", dot: "bg-muted-foreground" },
  in_progress: { label: "En progreso", color: "text-amber-600",        dot: "bg-amber-400" },
  done:        { label: "Listo",       color: "text-primary",          dot: "bg-primary" },
};

type StatusFilter = "all" | "pending" | "in_progress" | "done";

export default function TareasPage() {
  const { users, activeUser } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [adding, setAdding] = useState(true);

  // Form state
  const [formProject, setFormProject] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDue, setFormDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [tasksRes, projectsRes] = await Promise.all([
      fetch("/api/project-tasks?type=task"),
      fetch("/api/projects"),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    setTasks(await tasksRes.json());
    const proj = await projectsRes.json();
    setProjects(proj);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (activeUser) setFormAssignee(activeUser.id);
  }, [activeUser?.id]);

  async function addTask() {
    if (!formProject || !formDesc.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProject,
          type: "task",
          description: formDesc.trim(),
          assignedUserId: formAssignee || null,
          dueDate: formDue || null,
        }),
      });
      setFormDesc(""); setFormDue("");
      setAdding(false);
      toast.success("Tarea creada");
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(task: Task) {
    const order = ["pending", "in_progress", "done"];
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

  // Filter
  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (assigneeFilter !== "all" && t.assignedUserId !== assigneeFilter) return false;
    return true;
  });

  // Group by project
  const grouped = filtered.reduce<Record<string, { name: string; tasks: Task[] }>>(
    (acc, task) => {
      const key = task.projectId;
      if (!acc[key]) acc[key] = { name: task.projectName ?? "Sin proyecto", tasks: [] };
      acc[key].tasks.push(task);
      return acc;
    },
    {}
  );

  const totalPending = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Tareas
          </h1>
          {totalPending > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPending} pendiente{totalPending !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nueva tarea
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Nueva tarea</p>
            <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <select
            value={formProject}
            onChange={(e) => setFormProject(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
          >
            <option value="">Selecciona un proyecto...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <textarea
            autoFocus
            rows={2}
            placeholder="Describe la tarea..."
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
          />

          <div className="flex gap-4 flex-wrap items-center">
            {users.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Asignar a:</span>
                <div className="flex gap-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setFormAssignee(u.id === formAssignee ? "" : u.id)}
                      className={cn(
                        "w-7 h-7 rounded-full text-xs font-bold text-white transition-all",
                        formAssignee === u.id
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
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
                className="text-xs border rounded px-2 py-0.5 bg-background"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addTask}
              disabled={saving || !formDesc.trim() || !formProject}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => { setAdding(false); setFormDesc(""); }}
              className="px-4 py-1.5 text-sm text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {(["all", "pending", "in_progress", "done"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "text-xs px-3 py-1 rounded-md font-medium transition-colors",
                statusFilter === s
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "Todas" : s === "pending" ? "Pendientes" : s === "in_progress" ? "En progreso" : "Listas"}
            </button>
          ))}
        </div>

        {users.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAssigneeFilter("all")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium",
                assigneeFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Todos
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setAssigneeFilter(u.id === assigneeFilter ? "all" : u.id)}
                className={cn(
                  "w-7 h-7 rounded-full text-xs font-bold text-white transition-all",
                  assigneeFilter === u.id
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
        )}
      </div>

      {/* Content */}
      {loading && <DogSpinnerPage label="Cargando tareas..." />}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {tasks.length === 0 ? "Sin tareas todavía. Crea la primera." : "Sin tareas con estos filtros."}
          </p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([projectId, group]) => (
        <div key={projectId} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
            {group.name}
          </h2>
          {group.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onCycle={cycleStatus}
              onDelete={deleteTask}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function TaskRow({
  task,
  onCycle,
  onDelete,
}: {
  task: Task;
  onCycle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const isDone = task.status === "done";
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && !isDone && dueDate < new Date();

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 border rounded-lg transition-colors",
      isDone ? "bg-muted/20 opacity-60" : "bg-card hover:bg-muted/20"
    )}>
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
          {task.assignedUserName && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: task.assignedUserColor ?? "#64748b" }}
            >
              {task.assignedUserAvatar ?? task.assignedUserName[0]}
            </span>
          )}
          <a
            href={`/projects/${task.projectId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />{task.projectName ?? "Proyecto"}
          </a>
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
