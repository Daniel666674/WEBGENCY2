"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, Calendar, Circle, MessageSquare, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { StatTile } from "@/components/shared/StatTile";

interface Solicitud {
  id: string;
  projectId: string;
  projectName: string | null;
  description: string;
  status: string;
  dueDate: number | null;
  assignedUserName?: string | null;
  assignedUserColor?: string | null;
  assignedUserAvatar?: string | null;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",   color: "text-muted-foreground" },
  in_progress: { label: "En revisión", color: "text-amber-600" },
  done:        { label: "Resuelta",    color: "text-primary" },
};

type StatusFilter = "all" | "pending" | "in_progress" | "done";

export default function SolicitudesPage() {
  const [items, setItems] = useState<Solicitud[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [adding, setAdding] = useState(true);

  const [formProject, setFormProject] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDue, setFormDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [solRes, projRes] = await Promise.all([
      fetch("/api/project-tasks?type=solicitud"),
      fetch("/api/projects"),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    setItems(await solRes.json());
    setProjects(await projRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!formDesc.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProject,
          type: "solicitud",
          description: formDesc.trim(),
          dueDate: formDue || null,
        }),
      });
      setFormDesc(""); setFormDue("");
      setAdding(false);
      toast.success("Solicitud agregada");
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(item: Solicitud) {
    const order = ["pending", "in_progress", "done"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    await fetch(`/api/project-tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, done: next === "done" }),
    });
    load();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    setItems((s) => s.filter((x) => x.id !== id));
  }

  const filtered = items.filter((s) =>
    statusFilter === "all" ? true : s.status === statusFilter
  );

  const grouped = filtered.reduce<Record<string, { name: string; items: Solicitud[] }>>(
    (acc, sol) => {
      const key = sol.projectId;
      if (!acc[key]) acc[key] = { name: sol.projectName ?? "Sin proyecto", items: [] };
      acc[key].items.push(sol);
      return acc;
    },
    {}
  );

  const totalOpen = items.filter((s) => s.status !== "done").length;
  const totalInReview = items.filter((s) => s.status === "in_progress").length;
  const totalResolved = items.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Solicitudes
          </h1>
          {totalOpen > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalOpen} abierta{totalOpen !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nueva solicitud
        </button>
      </div>

      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={MessageSquare} label="Total" value={items.length} color="primary" highlight />
          <StatTile icon={Circle} label="En revision" value={totalInReview} color="amber" />
          <StatTile icon={Check} label="Resueltas" value={totalResolved} color="green" />
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Nueva solicitud del cliente</p>
            <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <select
            value={formProject}
            onChange={(e) => setFormProject(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
          >
            <option value="">Sin proyecto (General)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <textarea
            autoFocus
            rows={2}
            placeholder="Describe la solicitud o cambio pedido por el cliente..."
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
          />

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

          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={saving || !formDesc.trim()}
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

      {/* Status filter */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
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
            {s === "all" ? "Todas" : s === "pending" ? "Pendientes" : s === "in_progress" ? "En revisión" : "Resueltas"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <DogSpinnerPage label="Cargando solicitudes..." />}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {items.length === 0 ? "Sin solicitudes todavía." : "Sin solicitudes con este filtro."}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setAdding(true)}
              className="mt-3 text-sm text-primary underline underline-offset-2"
            >
              Crea la primera solicitud
            </button>
          )}
        </div>
      )}

      {!loading && Object.entries(grouped).map(([projectId, group]) => (
        <div key={projectId} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
            {group.name}
          </h2>
          {group.items.map((sol) => (
            <SolicitudRow
              key={sol.id}
              item={sol}
              onCycle={cycleStatus}
              onDelete={deleteItem}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SolicitudRow({
  item,
  onCycle,
  onDelete,
}: {
  item: Solicitud;
  onCycle: (s: Solicitud) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const isDone = item.status === "done";
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isOverdue = dueDate && !isDone && dueDate < new Date();

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 border rounded-lg transition-colors",
      isDone ? "bg-muted/20 opacity-60" : "bg-card hover:bg-muted/20"
    )}>
      <button
        onClick={() => onCycle(item)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
          isDone
            ? "bg-primary border-primary"
            : item.status === "in_progress"
            ? "border-amber-400 bg-amber-50"
            : "border-muted-foreground hover:border-primary"
        )}
        title="Cambiar estado"
      >
        {isDone && <Check className="h-2.5 w-2.5 text-white" />}
        {item.status === "in_progress" && <Circle className="h-2 w-2 fill-amber-400 text-amber-400" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isDone && "line-through text-muted-foreground")}>
          {item.description}
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
          <a
            href={`/projects/${item.projectId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />{item.projectName ?? "Proyecto"}
          </a>
        </div>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
