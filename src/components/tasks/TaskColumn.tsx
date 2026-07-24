"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import type { BoardColumn, Task } from "./types";

interface TaskColumnProps {
  id: BoardColumn;
  name: string;
  color: string;
  tasks: Task[];
  droppable?: boolean;
  selectedTaskId?: string | null;
  onSelect: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onAdd: (status: Exclude<BoardColumn, "overdue">) => void;
}

export function TaskColumn({ id, name, color, tasks, droppable = true, selectedTaskId, onSelect, onToggleDone, onAdd }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-w-[260px] w-[260px] shrink-0 rounded-lg bg-muted/30 transition-all"
      style={isOver ? { boxShadow: `0 0 0 2px ${color}, 0 8px 24px ${color}33`, backgroundColor: `${color}0d` } : undefined}
    >
      <div className="p-3 border-t-2 rounded-t-lg" style={{ borderTopColor: color }}>
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide flex-1 truncate">{name}</h3>
          <span className="text-xs font-medium rounded-full h-5 min-w-5 px-1 flex items-center justify-center" style={{ color, backgroundColor: `${color}1f` }}>
            {tasks.length}
          </span>
          <button onClick={() => onAdd(id === "overdue" ? "pending" : id)} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("flex-1 p-2 space-y-2 min-h-[80px]", tasks.length === 0 && "flex items-center justify-center")}>
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin tareas</p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onSelect}
                onToggleDone={onToggleDone}
                isSelected={selectedTaskId === task.id}
              />
            ))
          )}
        </div>
      </SortableContext>

      <button
        onClick={() => onAdd(id === "overdue" ? "pending" : id)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground p-2.5 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" /> Nueva tarea
      </button>
    </div>
  );
}
