"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronRight, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

interface Deliverable {
  id: string;
  description: string;
  fileUrl?: string | null;
  approvedAt?: Date | number | null;
  approvedByUserId?: string | null;
}

interface Milestone {
  id: string;
  title: string;
  order: number;
  dueDate?: Date | number | null;
  completedAt?: Date | number | null;
  deliverables: Deliverable[];
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onRefresh: () => void;
}

export function MilestoneTimeline({ milestones, onRefresh }: MilestoneTimelineProps) {
  const { activeUser } = useUser();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(milestones.map((m) => m.id)));
  const [newDeliverable, setNewDeliverable] = useState<Record<string, string>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function toggleMilestone(m: Milestone) {
    await fetch(`/api/milestones/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !m.completedAt }),
    });
    onRefresh();
  }

  async function deleteMilestone(id: string) {
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function approveDeliverable(d: Deliverable) {
    await fetch(`/api/deliverables/${d.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved: !d.approvedAt,
        approvedByUserId: activeUser?.id,
      }),
    });
    onRefresh();
  }

  async function deleteDeliverable(id: string) {
    await fetch(`/api/deliverables/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function addDeliverable(milestoneId: string) {
    const desc = newDeliverable[milestoneId]?.trim();
    if (!desc) return;
    await fetch(`/api/milestones/${milestoneId}/deliverables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc }),
    });
    setNewDeliverable((prev) => ({ ...prev, [milestoneId]: "" }));
    onRefresh();
    toast.success("Entregable agregado");
  }

  if (milestones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Sin milestones aun. Agrega el primero.
      </p>
    );
  }

  return (
    <div className="relative space-y-3">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border" />

      {milestones.map((m, idx) => {
        const isOpen = expanded.has(m.id);
        const isDone = !!m.completedAt;
        const dueDate = m.dueDate ? new Date(m.dueDate) : null;
        const isOverdue = dueDate && !isDone && dueDate < new Date();
        const approvedCount = m.deliverables.filter((d) => d.approvedAt).length;

        return (
          <div key={m.id} className="relative pl-9">
            {/* Circle node */}
            <button
              onClick={() => toggleMilestone(m)}
              className={cn(
                "absolute left-0 top-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10",
                isDone
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border hover:border-primary"
              )}
              title={isDone ? "Marcar incompleto" : "Marcar completo"}
            >
              {isDone && <Check className="h-3.5 w-3.5" />}
            </button>

            <div className="border rounded-lg overflow-hidden">
              {/* Milestone header */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none",
                  isDone ? "bg-muted/40" : "bg-card"
                )}
                onClick={() => toggleExpand(m.id)}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn("text-sm font-medium flex-1", isDone && "line-through text-muted-foreground")}>
                  {m.title}
                </span>
                {m.deliverables.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {approvedCount}/{m.deliverables.length}
                  </span>
                )}
                {dueDate && (
                  <span className={cn("text-xs", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                    {dueDate.toLocaleDateString("es-CO", { month: "short", day: "numeric" })}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}
                  className="text-muted-foreground hover:text-destructive p-0.5 rounded ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Deliverables list */}
              {isOpen && (
                <div className="border-t divide-y divide-border">
                  {m.deliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <button
                        onClick={() => approveDeliverable(d)}
                        className={cn(
                          "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all",
                          d.approvedAt
                            ? "bg-primary border-primary"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {d.approvedAt && <Check className="h-2.5 w-2.5 text-white" />}
                      </button>
                      <span className={cn("flex-1", d.approvedAt && "line-through text-muted-foreground")}>
                        {d.description}
                      </span>
                      {d.fileUrl && (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteDeliverable(d.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add deliverable */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-4 h-4 shrink-0" />
                    <input
                      type="text"
                      placeholder="+ Agregar entregable..."
                      value={newDeliverable[m.id] ?? ""}
                      onChange={(e) => setNewDeliverable((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addDeliverable(m.id)}
                      className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={() => addDeliverable(m.id)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
