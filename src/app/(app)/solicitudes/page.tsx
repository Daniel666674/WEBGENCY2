"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, Calendar, Circle, MessageSquare, X, ExternalLink, Folder, Save } from "lucide-react";
import { toast } from "sonner";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";

interface Solicitud {
  id: string;
  projectId: string;
  projectName: string | null;
  description: string;
  status: string;
  dueDate: number | null;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",   badgeColor: "bg-amber-500/15 text-amber-500" },
  in_progress: { label: "En revisión", badgeColor: "bg-blue-500/15 text-blue-500" },
  done:        { label: "Resuelta",    badgeColor: "bg-green-500/15 text-green-500" },
};

type StatusFilter = "all" | "pending" | "in_progress" | "done";

const FILTER_TABS: { key: StatusFilter; label: string; countColor: string }[] = [
  { key: "all",         label: "Todas",       countColor: "bg-amber-500/20 text-amber-500" },
  { key: "pending",     label: "Pendientes",  countColor: "bg-amber-500/20 text-amber-500" },
  { key: "in_progress", label: "En revisión", countColor: "bg-blue-500/20 text-blue-500" },
  { key: "done",        label: "Resueltas",   countColor: "bg-green-500/20 text-green-500" },
];

export default function SolicitudesPage() {
  const [items, setItems] = useState<Solicitud[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [adding, setAdding] = useState(false);

  const [formProject, setFormProject] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDue, setFormDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [solRes, projRes] = await Promise.all([
      fetch("/api/project-tasks?type=solicitud"),
      fetch("/api/projects"),
      new Promise((r) => setTimeout(r, 1200)),
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
          projectId: formProject || null,
          type: "solicitud",
          description: formDesc.trim(),
          dueDate: formDue || null,
        }),
      });
      setFormDesc(""); setFormDue(""); setFormProject("");
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

  const countFor = (key: StatusFilter) =>
    key === "all" ? items.length : items.filter((s) => s.status === key).length;

  const filtered = items.filter((s) =>
    statusFilter === "all" ? true : s.status === statusFilter
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2.5 mt-0.5">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Solicitudes</h1>
            <p className="text-sm text-muted-foreground">Gestiona todas las solicitudes y cambios de tus clientes</p>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nueva solicitud
        </button>
      </div>

      {/* Create form */}
      {adding && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          {/* Form header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/15 p-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">Crear nueva solicitud</span>
            </div>
            <button
              onClick={() => { setAdding(false); setFormDesc(""); setFormDue(""); setFormProject(""); }}
              className="flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1 hover:bg-muted transition-colors cursor-pointer"
            >
              Cerrar <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Proyecto */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Proyecto</label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={formProject}
                onChange={(e) => setFormProject(e.target.value)}
                className="w-full text-sm border rounded-xl pl-9 pr-4 py-2.5 bg-background appearance-none cursor-pointer"
              >
                <option value="">Sin proyecto (General)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción de la solicitud</label>
            <textarea
              autoFocus
              rows={4}
              placeholder="Describe la solicitud o cambio pedido por el cliente..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full text-sm border rounded-xl px-4 py-3 bg-background resize-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Fecha de vencimiento (opcional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
                placeholder="Seleccionar fecha"
                className="w-full text-sm border rounded-xl px-4 py-2.5 bg-background"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={add}
              disabled={saving || !formDesc.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar solicitud"}
            </button>
            <button
              onClick={() => { setAdding(false); setFormDesc(""); setFormDue(""); setFormProject(""); }}
              className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="grid grid-cols-4">
          {FILTER_TABS.map((tab, i) => {
            const count = countFor(tab.key);
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 text-xs font-medium transition-colors cursor-pointer relative",
                  i > 0 && "border-l",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center", tab.countColor)}>
                  {count}
                </span>
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading && <DogSpinnerPage label="Cargando solicitudes..." />}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 flex flex-col items-center gap-4 text-center">
          {/* Visual decoration */}
          <div className="relative">
            <div className="text-5xl">💬</div>
            <span className="absolute -top-2 -left-4 text-muted-foreground/40 text-lg">+</span>
            <span className="absolute -top-1 right-0 text-muted-foreground/40 text-sm">○</span>
            <span className="absolute bottom-0 -left-6 text-muted-foreground/40 text-sm">↺</span>
            <span className="absolute bottom-1 -right-4 text-muted-foreground/40 text-lg">×</span>
            <span className="absolute top-3 -right-6 text-muted-foreground/40 text-sm">○</span>
            <span className="absolute top-4 left-1 text-muted-foreground/40 text-xs">↺</span>
          </div>
          <div>
            <p className="font-bold text-base">Aún no tienes solicitudes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando crees tu primera solicitud,<br />aparecerá aquí.
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Crea tu primera solicitud
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((sol) => (
            <SolicitudCard
              key={sol.id}
              item={sol}
              onCycle={cycleStatus}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SolicitudCard({
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
  const isInProgress = item.status === "in_progress";
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isOverdue = dueDate && !isDone && dueDate < new Date();

  return (
    <div className={cn(
      "rounded-2xl border bg-card p-4 space-y-3 transition-opacity",
      isDone && "opacity-60"
    )}>
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={() => onCycle(item)}
          title="Cambiar estado"
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer",
            isDone
              ? "bg-primary border-primary"
              : isInProgress
              ? "border-blue-400"
              : "border-muted-foreground hover:border-primary"
          )}
        >
          {isDone && <Check className="h-2.5 w-2.5 text-white" />}
          {isInProgress && <Circle className="h-2 w-2 fill-blue-400 text-blue-400" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm leading-snug", isDone && "line-through text-muted-foreground")}>
            {item.description}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", cfg.badgeColor)}>
              {cfg.label}
            </span>
            {dueDate && (
              <span className={cn("text-xs flex items-center gap-0.5", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                <Calendar className="h-3 w-3" />
                {dueDate.toLocaleDateString("es-CO", { month: "short", day: "numeric" })}
                {isOverdue && " · vencida"}
              </span>
            )}
            {item.projectName && (
              <a
                href={`/projects/${item.projectId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />{item.projectName}
              </a>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(item.id)}
          className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
