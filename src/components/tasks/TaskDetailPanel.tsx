"use client";

import { useState } from "react";
import { X, Trash2, Send, Plus, CheckCircle2, Flag, Calendar, UserCog, MessageSquare, FolderKanban, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_LABELS, type Task, type TaskStatus, type TaskProject } from "./types";
import type { AppUser } from "@/context/UserContext";

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  status: CheckCircle2,
  priority: Flag,
  due_date: Calendar,
  assignee: UserCog,
  comment: MessageSquare,
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

interface TaskDetailPanelProps {
  task: Task;
  users: AppUser[];
  projects: TaskProject[];
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onComment: (id: string, comment: string) => void;
  onClose?: () => void;
}

export function TaskDetailPanel({ task, users, projects, onUpdate, onDelete, onComment, onClose }: TaskDetailPanelProps) {
  const [comment, setComment] = useState("");
  const priority = PRIORITY_CONFIG[task.priority];

  const submitComment = () => {
    if (!comment.trim()) return;
    onComment(task.id, comment.trim());
    setComment("");
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug">{task.title || task.description}</p>
          <span
            className="inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: priority.bg, color: priority.color }}
          >
            {priority.label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive cursor-pointer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 text-sm border-b">
        <select
          value={task.status}
          onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
          className="w-full text-xs font-medium border rounded-lg px-2.5 py-1.5 bg-background cursor-pointer"
        >
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <Row icon={FolderKanban}>
          <select
            value={task.projectId}
            onChange={(e) => onUpdate(task.id, { projectId: e.target.value })}
            className="text-xs bg-transparent cursor-pointer w-full"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Row>

        <Row icon={UserCog}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => onUpdate(task.id, { assignedUserId: task.assignedUserId === u.id ? "" : u.id })}
                className={cn(
                  "h-6 w-6 rounded-full text-[10px] font-bold text-white shrink-0 transition-all",
                  task.assignedUserId === u.id ? "ring-2 ring-offset-1 ring-primary" : "opacity-40 hover:opacity-80"
                )}
                style={{ backgroundColor: u.color }}
                title={u.name}
              >
                {u.avatar ?? u.name[0]}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={Calendar}>
          <input
            type="date"
            value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
            onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
            className="text-xs bg-transparent cursor-pointer w-full"
          />
        </Row>

        <Row icon={Bell}>
          <input
            type="datetime-local"
            value={task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : ""}
            onChange={(e) => onUpdate(task.id, { reminderAt: e.target.value || null })}
            className="text-xs bg-transparent cursor-pointer w-full"
          />
        </Row>
      </div>

      {task.description && task.title && (
        <div className="p-4 border-b">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Descripción</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{task.description}</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">Actividad reciente</p>
        </div>
        <div className="space-y-2.5 max-h-52 overflow-y-auto">
          {task.activityLog.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin actividad todavía.</p>
          ) : (
            [...task.activityLog].reverse().map((entry, i) => {
              const Icon = ACTION_ICONS[entry.action] ?? Plus;
              return (
                <div key={i} className="flex gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug">
                      {actionLabel(entry.action, entry.detail)}
                      {entry.actorName && <span className="text-muted-foreground"> · {entry.actorName}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatWhen(entry.at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Escribe un comentario..."
            className="flex-1 text-xs border rounded-lg px-3 py-2 bg-background"
          />
          <button
            onClick={submitComment}
            disabled={!comment.trim()}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function actionLabel(action: string, detail?: string): string {
  switch (action) {
    case "created": return "Se creó la tarea";
    case "status": return `Cambió el estado a ${detail}`;
    case "priority": return `Cambió la prioridad a ${detail}`;
    case "due_date": return "Actualizó la fecha de vencimiento";
    case "assignee": return "Cambió el responsable";
    case "comment": return detail ?? "Comentó";
    default: return action;
  }
}

function Row({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
