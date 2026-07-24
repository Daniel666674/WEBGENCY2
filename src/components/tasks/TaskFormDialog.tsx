"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/context/UserContext";
import type { BoardColumn, TaskPriority, TaskProject } from "./types";
import { STATUS_LABELS } from "./types";

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    projectId: string;
    assignedUserId: string;
    dueDate: string;
    priority: TaskPriority;
    status: Exclude<BoardColumn, "overdue">;
  }) => Promise<void>;
  projects: TaskProject[];
  users: AppUser[];
  defaultStatus: Exclude<BoardColumn, "overdue">;
  defaultAssigneeId?: string;
}

export function TaskFormDialog({ open, onClose, onCreate, projects, users, defaultStatus, defaultAssigneeId }: TaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedUserId, setAssignedUserId] = useState(defaultAssigneeId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [status, setStatus] = useState<Exclude<BoardColumn, "overdue">>(defaultStatus);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus);
      setAssignedUserId(defaultAssigneeId ?? "");
    }
  }, [open, defaultStatus, defaultAssigneeId]);

  const reset = () => {
    setTitle(""); setDescription(""); setProjectId(""); setDueDate(""); setPriority("media");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), description: description.trim(), projectId, assignedUserId, dueDate, priority, status });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <input
            autoFocus
            placeholder="Título de la tarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
          />
          <textarea
            rows={2}
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="text-sm border rounded-lg px-2.5 py-2 bg-background cursor-pointer">
              <option value="">Sin proyecto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as Exclude<BoardColumn, "overdue">)} className="text-sm border rounded-lg px-2.5 py-2 bg-background cursor-pointer">
              {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm border rounded-lg px-2.5 py-2 bg-background" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="text-sm border rounded-lg px-2.5 py-2 bg-background cursor-pointer">
              <option value="alta">Prioridad alta</option>
              <option value="media">Prioridad media</option>
              <option value="baja">Prioridad baja</option>
            </select>
          </div>

          {users.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0">Asignar a:</span>
              <div className="flex gap-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAssignedUserId(u.id === assignedUserId ? "" : u.id)}
                    className={cn(
                      "h-7 w-7 rounded-full text-xs font-bold text-white transition-all cursor-pointer",
                      assignedUserId === u.id ? "ring-2 ring-offset-1 ring-primary scale-110" : "opacity-50 hover:opacity-80"
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

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="cursor-pointer">
              {saving ? "Guardando..." : "Crear tarea"}
            </Button>
            <Button variant="ghost" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
