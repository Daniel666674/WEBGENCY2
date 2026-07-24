"use client";

import { useState, useCallback } from "react";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { columnFor, type BoardColumn, type Task } from "./types";

const COLUMNS: { id: BoardColumn; name: string; color: string; droppable?: boolean }[] = [
  { id: "pending", name: "Pendientes", color: "var(--primary)" },
  { id: "in_progress", name: "En progreso", color: "#2563eb" },
  { id: "in_review", name: "En revisión", color: "#8b5cf6" },
  { id: "done", name: "Completadas", color: "#16a34a" },
  { id: "overdue", name: "Vencidas", color: "#dc2626", droppable: false },
];

interface TaskBoardProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onAdd: (status: Exclude<BoardColumn, "overdue">) => void;
  onStatusChange: (taskId: string, status: Exclude<BoardColumn, "overdue">) => void;
}

export function TaskBoard({ tasks, selectedTaskId, onSelect, onToggleDone, onAdd, onStatusChange }: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragTasks, setDragTasks] = useState<Task[] | null>(null);

  const displayTasks = dragTasks ?? tasks;
  const byColumn = (col: BoardColumn) => displayTasks.filter((t) => columnFor(t) === col);
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const resolveColumn = useCallback((overId: string, source: Task[]): BoardColumn | null => {
    const asColumn = COLUMNS.find((c) => c.id === overId);
    if (asColumn) return asColumn.id;
    const overTask = source.find((t) => t.id === overId);
    return overTask ? columnFor(overTask) : null;
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragTasks(tasks);
    setActiveId(event.active.id as string);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;

    setDragTasks((prev) => {
      const source = prev ?? tasks;
      const overColumn = resolveColumn(over.id as string, source);
      if (!overColumn || overColumn === "overdue") return prev;
      const task = source.find((t) => t.id === activeId);
      if (!task || columnFor(task) === overColumn) return prev;
      return source.map((t) => (t.id === activeId ? { ...t, status: overColumn as Task["status"] } : t));
    });
  }, [tasks, resolveColumn]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragTasks(null);
    if (!over) return;

    const activeId = active.id as string;
    const overColumn = resolveColumn(over.id as string, tasks);
    if (!overColumn || overColumn === "overdue") return;

    const original = tasks.find((t) => t.id === activeId);
    if (original && columnFor(original) !== overColumn) {
      onStatusChange(activeId, overColumn as Exclude<BoardColumn, "overdue">);
    }
  }, [tasks, resolveColumn, onStatusChange]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {COLUMNS.map((col) => (
          <div key={col.id} className="snap-start">
            <TaskColumn
              id={col.id}
              name={col.name}
              color={col.color}
              tasks={byColumn(col.id)}
              droppable={col.droppable !== false}
              selectedTaskId={selectedTaskId}
              onSelect={onSelect}
              onToggleDone={onToggleDone}
              onAdd={onAdd}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} onClick={() => {}} onToggleDone={() => {}} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
