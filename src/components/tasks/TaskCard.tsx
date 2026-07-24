"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar";
import { PRIORITY_CONFIG, isOverdue, type Task } from "./types";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  isOverlay?: boolean;
  isSelected?: boolean;
}

export function TaskCard({ task, onClick, onToggleDone, isOverlay = false, isSelected = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const isDone = task.status === "done";
  const overdue = isOverdue(task);
  const priority = PRIORITY_CONFIG[task.priority];
  const title = task.title || task.description;
  const showDescription = !!task.title && task.description !== task.title;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all space-y-2.5",
        isOverlay ? "shadow-2xl rotate-2 scale-105 cursor-grabbing" : "hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            isDone ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {isDone && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium leading-tight", isDone && "line-through text-muted-foreground")}>
            {title}
          </p>
          {showDescription && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>

      {task.projectName && (
        <span
          className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${getAvatarColor(task.projectName)}20`, color: getAvatarColor(task.projectName) }}
        >
          {task.projectName}
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignedUserName && (
            <span
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: task.assignedUserColor ?? "#64748b" }}
              title={task.assignedUserName}
            >
              {task.assignedUserAvatar ?? task.assignedUserName[0]}
            </span>
          )}
          {task.dueDate && (
            <span className={cn("text-[11px] flex items-center gap-1", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
      </div>
    </Card>
  );
}
