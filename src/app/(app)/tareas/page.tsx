"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { ClipboardList, Plus, Clock, Loader, CheckCircle2, AlertTriangle, LayoutGrid, List, Search, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { StatTile } from "@/components/shared/StatTile";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { MiniCalendar } from "@/components/tasks/MiniCalendar";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { columnFor, isOverdue, type BoardColumn, type Task, type TaskPriority, type TaskProject } from "@/components/tasks/types";

type View = "kanban" | "list";

export default function TareasPage() {
  const { users, activeUser } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("kanban");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaultStatus, setFormDefaultStatus] = useState<Exclude<BoardColumn, "overdue">>("pending");

  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  // Background refetch — no loading gate, so it never unmounts the board or
  // resets scroll/selection. Used after every mutation (create/patch/delete).
  async function refresh() {
    const [tasksRes, projectsRes] = await Promise.all([
      fetch("/api/project-tasks?type=task"),
      fetch("/api/projects"),
    ]);
    setTasks(await tasksRes.json());
    setProjects(await projectsRes.json());
  }

  useEffect(() => {
    (async () => {
      await Promise.all([refresh(), new Promise((r) => setTimeout(r, 800))]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (search && !((t.title || t.description).toLowerCase().includes(search.toLowerCase()))) return false;
    if (assigneeFilter !== "all" && t.assignedUserId !== assigneeFilter) return false;
    if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (dayFilter !== null) {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (dayStart !== dayFilter) return false;
    }
    return true;
  }), [tasks, search, assigneeFilter, projectFilter, priorityFilter, dayFilter]);

  const markedDays = useMemo(() => {
    const set = new Set<number>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const d = new Date(t.dueDate);
      set.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    }
    return set;
  }, [tasks]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const hasFilters = !!search || assigneeFilter !== "all" || projectFilter !== "all" || priorityFilter !== "all" || dayFilter !== null;

  const clearFilters = () => { setSearch(""); setAssigneeFilter("all"); setProjectFilter("all"); setPriorityFilter("all"); setDayFilter(null); };

  async function patchTask(id: string, patch: Record<string, unknown>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } as Task : t)));
    try {
      const res = await fetch(`/api/project-tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, actorName: activeUser?.name }),
      });
      if (!res.ok) throw new Error();
      refresh();
    } catch {
      toast.error("Error al actualizar la tarea");
      refresh();
    }
  }

  async function handleToggleDone(task: Task) {
    await patchTask(task.id, { done: task.status !== "done" });
  }

  async function handleComment(id: string, comment: string) {
    await patchTask(id, { comment });
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta tarea?")) return;
    await fetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    setTasks((t) => t.filter((x) => x.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
    toast.success("Tarea eliminada");
  }

  async function handleCreate(data: {
    title: string; description: string; projectId: string; assignedUserId: string;
    dueDate: string; priority: TaskPriority; status: Exclude<BoardColumn, "overdue">;
  }) {
    try {
      await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "task",
          title: data.title,
          description: data.description || data.title,
          projectId: data.projectId || undefined,
          assignedUserId: data.assignedUserId || null,
          dueDate: data.dueDate || null,
          priority: data.priority,
          status: data.status,
          actorName: activeUser?.name,
        }),
      });
      toast.success("Tarea creada");
      refresh();
    } catch {
      toast.error("Error al crear la tarea");
    }
  }

  const openForm = (status: Exclude<BoardColumn, "overdue">) => {
    setFormDefaultStatus(status);
    setFormOpen(true);
  };

  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(isOverdue).length;

  if (loading) return <DogSpinnerPage label="Cargando tareas..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Tareas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organiza, asigna y da seguimiento a las tareas del equipo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openForm("pending")}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Nueva tarea <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button onClick={() => setView("kanban")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer", view === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button onClick={() => setView("list")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer", view === "list" ? "bg-muted text-foreground" : "text-muted-foreground")}>
              <List className="h-3.5 w-3.5" /> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatTile icon={ClipboardList} label="Tareas totales" value={total} color="purple" highlight />
        <StatTile icon={Clock} label="Pendientes" value={pending} color="amber" subtext={total ? `${Math.round((pending / total) * 100)}% del total` : undefined} />
        <StatTile icon={Loader} label="En progreso" value={inProgress} color="blue" subtext={total ? `${Math.round((inProgress / total) * 100)}% del total` : undefined} />
        <StatTile icon={CheckCircle2} label="Completadas" value={done} color="green" subtext={total ? `${Math.round((done / total) * 100)}% del total` : undefined} />
        <StatTile icon={AlertTriangle} label="Vencidas" value={overdue} color="red" subtext={total ? `${Math.round((overdue / total) * 100)}% del total` : undefined} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="text-sm border rounded-lg pl-8 pr-3 py-1.5 bg-background w-48"
          />
        </div>
        <Select value={assigneeFilter} onValueChange={(v) => v && setAssigneeFilter(v)}>
          <SelectTrigger size="sm" className="cursor-pointer"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Asignado a: Todos</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={(v) => v && setProjectFilter(v)}>
          <SelectTrigger size="sm" className="cursor-pointer"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Proyecto: Todos</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger size="sm" className="cursor-pointer"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridad: Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
            <X className="h-3 w-3" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Board + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="min-w-0">
          {view === "kanban" ? (
            <TaskBoard
              tasks={filtered}
              selectedTaskId={selectedTaskId}
              onSelect={(t) => setSelectedTaskId(t.id)}
              onToggleDone={handleToggleDone}
              onAdd={openForm}
              onStatusChange={(id, status) => patchTask(id, { status })}
            />
          ) : (
            <TaskList tasks={filtered} onSelect={(t) => setSelectedTaskId(t.id)} onToggleDone={handleToggleDone} selectedTaskId={selectedTaskId} />
          )}
        </div>

        <div className="space-y-4">
          <MiniCalendar markedDays={markedDays} selectedDay={dayFilter} onSelectDay={setDayFilter} />
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              users={users}
              projects={projects}
              onUpdate={patchTask}
              onDelete={handleDelete}
              onComment={handleComment}
              onClose={() => setSelectedTaskId(null)}
            />
          )}
        </div>
      </div>

      <TaskFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        projects={projects}
        users={users}
        defaultStatus={formDefaultStatus}
        defaultAssigneeId={activeUser?.id}
      />
    </div>
  );
}

function TaskList({ tasks, onSelect, onToggleDone, selectedTaskId }: {
  tasks: Task[]; onSelect: (t: Task) => void; onToggleDone: (t: Task) => void; selectedTaskId: string | null;
}) {
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = columnFor(t);
    (acc[key] ??= []).push(t);
    return acc;
  }, {});
  const order: BoardColumn[] = ["overdue", "pending", "in_progress", "in_review", "done"];
  const labels: Record<BoardColumn, string> = { overdue: "Vencidas", pending: "Pendientes", in_progress: "En progreso", in_review: "En revisión", done: "Completadas" };

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">Sin tareas con estos filtros.</p>;
  }

  return (
    <div className="space-y-5">
      {order.filter((k) => grouped[k]?.length).map((key) => (
        <div key={key} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">{labels[key]} ({grouped[key].length})</h2>
          {grouped[key].map((task) => (
            <button
              key={task.id}
              onClick={() => onSelect(task)}
              className={cn(
                "w-full flex items-center gap-3 p-3 border rounded-lg text-left transition-colors cursor-pointer",
                selectedTaskId === task.id ? "ring-2 ring-primary" : "hover:bg-muted/30"
              )}
            >
              <span
                onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
                className={cn("h-4 w-4 rounded-full border-2 shrink-0", task.status === "done" ? "bg-primary border-primary" : "border-muted-foreground/40")}
              />
              <span className={cn("flex-1 text-sm truncate", task.status === "done" && "line-through text-muted-foreground")}>
                {task.title || task.description}
              </span>
              {task.assignedUserName && (
                <span className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: task.assignedUserColor ?? "#64748b" }}>
                  {task.assignedUserAvatar ?? task.assignedUserName[0]}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
