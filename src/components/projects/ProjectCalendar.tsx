"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarItem {
  id: string;
  label: string;
  type: "task" | "solicitud" | "milestone" | "deadline";
  status?: string;
  done?: boolean;
  assignedUserColor?: string | null;
}

type DayMap = Record<string, CalendarItem[]>;

interface MilestoneRow {
  id: string;
  title: string;
  dueDate?: number | null;
  completedAt?: number | null;
}

interface Props {
  projectId: string;
  deadline?: number | null;
  milestones: MilestoneRow[];
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function addToMap(map: DayMap, raw: number | Date | null | undefined, item: CalendarItem) {
  if (!raw) return;
  map[dayKey(new Date(raw))] ??= [];
  map[dayKey(new Date(raw))].push(item);
}

export function ProjectCalendar({ projectId, deadline, milestones }: Props) {
  const today = new Date();
  const [current, setCurrent] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [tasks, setTasks] = useState<
    { id: string; type: string; description: string; dueDate: number | null; status: string; assignedUserColor?: string | null }[]
  >([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/project-tasks?projectId=${projectId}`)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => {});
  }, [projectId]);

  const year = current.getFullYear();
  const month = current.getMonth();

  // Build day map
  const map: DayMap = {};

  for (const m of milestones) {
    addToMap(map, m.dueDate, {
      id: m.id,
      label: m.title,
      type: "milestone",
      done: !!m.completedAt,
    });
  }

  for (const t of tasks) {
    if (t.dueDate) {
      addToMap(map, t.dueDate, {
        id: t.id,
        label: t.description,
        type: t.type as "task" | "solicitud",
        status: t.status,
        done: t.status === "done",
        assignedUserColor: t.assignedUserColor,
      });
    }
  }

  if (deadline) {
    addToMap(map, deadline, {
      id: "project-deadline",
      label: "Deadline del proyecto",
      type: "deadline",
      done: false,
    });
  }

  // Grid cells
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = current.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });

  const selectedItems = selected ? (map[selected] ?? []) : [];
  const selectedDate = selected
    ? new Date(year, month, Number(selected.split("-")[2]))
    : null;

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelected(null); }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <button
          onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelected(null); }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
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
          if (!day) return <div key={i} className="bg-muted/20 min-h-[80px]" />;
          const key = `${year}-${month}-${day}`;
          const items = map[key] ?? [];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          const isSelected = selected === key;

          return (
            <div
              key={i}
              onClick={() => setSelected(isSelected ? null : key)}
              className={cn(
                "bg-card min-h-[80px] p-1.5 cursor-pointer hover:bg-muted/20 transition-colors select-none",
                isSelected && "ring-2 ring-inset ring-primary bg-primary/5"
              )}
            >
              <div
                className={cn(
                  "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1 mx-auto",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {day}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "text-[10px] px-1 py-0.5 rounded truncate leading-tight font-medium",
                      item.type === "deadline"
                        ? "bg-destructive/15 text-destructive"
                        : item.type === "milestone"
                        ? "bg-primary/15 text-primary"
                        : item.type === "solicitud"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground",
                      item.done && "opacity-40 line-through"
                    )}
                  >
                    {item.label}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{items.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && selectedDate && selectedItems.length > 0 && (
        <div className="border rounded-xl p-4 space-y-3 bg-card">
          <p className="text-xs font-semibold text-muted-foreground capitalize">
            {selectedDate.toLocaleDateString("es-CO", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          {selectedItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  item.type === "deadline"
                    ? "bg-destructive"
                    : item.type === "milestone"
                    ? "bg-primary"
                    : item.type === "solicitud"
                    ? "bg-amber-400"
                    : "bg-muted-foreground"
                )}
              />
              <div className="min-w-0">
                <p className={cn("text-sm", item.done && "line-through text-muted-foreground")}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.type === "milestone"
                    ? "Milestone"
                    : item.type === "deadline"
                    ? "Deadline del proyecto"
                    : item.type === "solicitud"
                    ? "Solicitud del cliente"
                    : "Tarea"}
                  {item.status && item.type !== "milestone" && item.type !== "deadline" && (
                    <span>
                      {" · "}
                      {item.status === "pending"
                        ? "pendiente"
                        : item.status === "in_progress"
                        ? "en progreso"
                        : "listo"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" /> Milestone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" /> Tarea
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" /> Solicitud
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-destructive shrink-0" /> Deadline
        </span>
      </div>
    </div>
  );
}
