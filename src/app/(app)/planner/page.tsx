"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { toast } from "sonner";

interface PlannerProject {
  id: string;
  name: string;
  status: string;
  deadline: number | null;
}

interface PlannerMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: number | null;
  completedAt: number | null;
}

interface PlannerTask {
  id: string;
  projectId: string;
  type: string;
  description: string;
  status: string;
  dueDate: number | null;
  assignedUserColor: string | null;
  assignedUserName: string | null;
}

interface CalendarItem {
  id: string;
  label: string;
  sublabel: string;
  kind: "deadline" | "milestone" | "task" | "solicitud";
  done: boolean;
  color?: string | null;
}

type DayMap = Record<string, CalendarItem[]>;

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const KIND_STYLE = {
  deadline:  { dot: "bg-destructive",  chip: "bg-destructive/15 text-destructive",   label: "Deadline" },
  milestone: { dot: "bg-primary",      chip: "bg-primary/15 text-primary",           label: "Milestone" },
  task:      { dot: "bg-slate-400",    chip: "bg-muted text-muted-foreground",        label: "Tarea" },
  solicitud: { dot: "bg-amber-400",    chip: "bg-amber-100 text-amber-700",           label: "Solicitud" },
};

type FilterKind = "all" | "deadline" | "milestone" | "task" | "solicitud";

function dayKey(ts: number | Date) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function addToMap(map: DayMap, ts: number | null | undefined, item: CalendarItem) {
  if (!ts) return;
  const k = dayKey(ts);
  map[k] ??= [];
  map[k].push(item);
}

export default function PlannerPage() {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [projects, setProjects] = useState<PlannerProject[]>([]);
  const [milestones, setMilestones] = useState<PlannerMilestone[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");

  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState<"task" | "solicitud">("task");
  const [addProject, setAddProject] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    Promise.all([fetch("/api/planner").then((r) => r.json()), new Promise((r) => setTimeout(r, 1800))])
      .then(([d]) => {
        setProjects(d.projects ?? []);
        setMilestones(d.milestones ?? []);
        setTasks(d.tasks ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);

  async function quickAdd() {
    if (!addDesc.trim() || !selected) return;
    setSaving(true);
    try {
      const [yr, mo, dy] = selected.split("-").map(Number);
      const dueDate = new Date(yr, mo, dy).toISOString().split("T")[0];
      await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: addProject, type: addType, description: addDesc.trim(), dueDate }),
      });
      toast.success(addType === "task" ? "Tarea creada" : "Solicitud creada");
      setAddDesc("");
      setAdding(false);
      setLoading(true);
      reload();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const year = current.getFullYear();
  const month = current.getMonth();

  // Build day map
  const map: DayMap = {};

  for (const p of projects) {
    if (p.deadline) {
      addToMap(map, p.deadline, {
        id: `dl-${p.id}`,
        label: p.name,
        sublabel: "Deadline del proyecto",
        kind: "deadline",
        done: p.status === "launched",
      });
    }
  }

  for (const m of milestones) {
    if (m.dueDate) {
      addToMap(map, m.dueDate, {
        id: `ms-${m.id}`,
        label: m.title,
        sublabel: projectMap[m.projectId] ?? "Proyecto",
        kind: "milestone",
        done: !!m.completedAt,
      });
    }
  }

  for (const t of tasks) {
    if (t.dueDate) {
      addToMap(map, t.dueDate, {
        id: `tk-${t.id}`,
        label: t.description,
        sublabel: projectMap[t.projectId] ?? "Proyecto",
        kind: t.type === "solicitud" ? "solicitud" : "task",
        done: t.status === "done",
        color: t.assignedUserColor,
      });
    }
  }

  // Grid
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = current.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const selectedItems = selected
    ? (map[selected] ?? []).filter((i) => filter === "all" || i.kind === filter)
    : [];

  const selectedDate = selected
    ? new Date(year, month, Number(selected.split("-")[2]))
    : null;

  // Count items in current month for the filter badges
  const monthCounts: Record<FilterKind, number> = { all: 0, deadline: 0, milestone: 0, task: 0, solicitud: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${year}-${month}-${d}`;
    for (const item of map[k] ?? []) {
      monthCounts[item.kind]++;
      monthCounts.all++;
    }
  }

  function prevMonth() { setCurrent(new Date(year, month - 1, 1)); setSelected(null); }
  function nextMonth() { setCurrent(new Date(year, month + 1, 1)); setSelected(null); }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vista compartida de proyectos, milestones, tareas y solicitudes
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "deadline", "milestone", "task", "solicitud"] as FilterKind[]).map((k) => {
          const style = k === "all" ? null : KIND_STYLE[k];
          const count = monthCounts[k];
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filter === k
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {style && <span className={cn("w-2 h-2 rounded-full", style.dot)} />}
              {k === "all" ? "Todo" : style!.label}
              {count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  filter === k ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando planner..." />
      ) : (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 border rounded-xl overflow-hidden gap-px bg-border">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="bg-muted/20 min-h-[90px]" />;
              const k = `${year}-${month}-${day}`;
              const allItems = map[k] ?? [];
              const visible = filter === "all" ? allItems : allItems.filter((x) => x.kind === filter);
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;
              const isSel = selected === k;

              return (
                <div
                  key={i}
                  onClick={() => setSelected(isSel ? null : k)}
                  className={cn(
                    "bg-card min-h-[90px] p-1.5 cursor-pointer hover:bg-muted/20 transition-colors select-none",
                    isSel && "ring-2 ring-inset ring-primary bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1 mx-auto",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {visible.slice(0, 3).map((item) => {
                      const s = KIND_STYLE[item.kind];
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "text-[10px] px-1 py-0.5 rounded truncate font-medium leading-tight",
                            s.chip,
                            item.done && "opacity-40 line-through"
                          )}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                    {visible.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{visible.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day detail */}
          {selected && selectedDate && (
            <div className="border rounded-xl p-4 space-y-3 bg-card">
              {/* Day header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground capitalize">
                  {selectedDate.toLocaleDateString("es-CO", {
                    weekday: "long", month: "long", day: "numeric",
                  })}
                </p>
                <button
                  onClick={() => { setAdding(!adding); setAddDesc(""); }}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
                >
                  {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {adding ? "Cancelar" : "Agregar"}
                </button>
              </div>

              {/* Quick-add form */}
              {adding && (
                <div className="border border-dashed rounded-lg p-3 space-y-2.5 bg-muted/30">
                  <div className="flex gap-1">
                    {(["task", "solicitud"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setAddType(t)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-md font-medium transition-colors",
                          addType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t === "task" ? "Tarea" : "Solicitud"}
                      </button>
                    ))}
                  </div>
                  <select
                    value={addProject}
                    onChange={(e) => setAddProject(e.target.value)}
                    className="w-full text-xs border rounded-lg px-2.5 py-1.5 bg-background"
                  >
                    <option value="">Sin proyecto (General)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    autoFocus
                    placeholder={addType === "task" ? "Describe la tarea..." : "Describe la solicitud..."}
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && quickAdd()}
                    className="w-full text-xs border rounded-lg px-2.5 py-1.5 bg-background"
                  />
                  <button
                    onClick={quickAdd}
                    disabled={saving || !addDesc.trim()}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              )}

              {/* Events */}
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => {
                  const s = KIND_STYLE[item.kind];
                  return (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", s.dot)} />
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium", item.done && "line-through text-muted-foreground")}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.label} · {item.sublabel}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sin eventos {filter !== "all" ? `de tipo "${KIND_STYLE[filter as Exclude<FilterKind, "all">].label}"` : ""} este día.
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {(Object.entries(KIND_STYLE) as [keyof typeof KIND_STYLE, typeof KIND_STYLE[keyof typeof KIND_STYLE]][]).map(([k, s]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                {s.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
