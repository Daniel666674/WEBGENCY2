"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { ProjectCard, PROJECT_STATUS_CONFIG } from "@/components/projects/ProjectCard";
import { Plus, LayoutGrid, List, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";

interface Project {
  id: string;
  name: string;
  status: string;
  budgetCents: number;
  deadline?: number | null;
  clientName?: string | null;
  clientId?: string | null;
  milestonesTotal: number;
  milestonesCompleted: number;
}

const STATUSES = ["discovery", "design", "dev", "launched", "paused"] as const;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [res] = await Promise.all([fetch("/api/projects"), new Promise((r) => setTimeout(r, 700))]);
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createProject() {
    if (!newName.trim()) { toast.error("Nombre requerido"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), status: "discovery" }),
      });
      const p = await res.json();
      toast.success("Proyecto creado");
      setNewName(""); setShowNew(false);
      router.push(`/projects/${p.id}`);
    } catch {
      toast.error("Error al crear");
    } finally {
      setSaving(false);
    }
  }

  const activeProjects = projects.filter((p) => p.status !== "launched" && p.status !== "paused");
  const totalBudget = projects.reduce((s, p) => s + p.budgetCents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            Proyectos
          </h1>
          <p className="text-muted-foreground text-sm">
            {activeProjects.length} activos · {formatCurrency(totalBudget)} en pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "kanban" ? "list" : "kanban")}
            className="p-2 rounded-lg border hover:bg-muted transition-colors"
            title="Cambiar vista"
          >
            {view === "kanban" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Nuevo proyecto
          </button>
        </div>
      </div>

      {/* Quick create */}
      {showNew && (
        <div className="border rounded-xl p-4 bg-card space-y-3">
          <p className="text-sm font-medium">Nuevo proyecto</p>
          <input
            type="text"
            autoFocus
            placeholder="Nombre del proyecto..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProject()}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
          />
          <div className="flex gap-2">
            <button
              onClick={createProject}
              disabled={saving}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
            >
              Crear
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-1.5 text-sm text-muted-foreground">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <DogSpinnerPage label="Cargando proyectos..." />
      ) : view === "kanban" ? (
        <KanbanView projects={projects} onRefresh={load} />
      ) : (
        <ListView projects={projects} onRefresh={load} />
      )}
    </div>
  );
}

function KanbanView({ projects, onRefresh }: { projects: Project[]; onRefresh: () => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.filter((s) => s !== "paused").map((status) => {
        const cfg = PROJECT_STATUS_CONFIG[status];
        const cols = projects.filter((p) => p.status === status);
        return (
          <div key={status} className="shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </span>
              <span className="text-xs text-muted-foreground">{cols.length}</span>
            </div>
            <div className="space-y-3">
              {cols.map((p) => (
                <ProjectCard key={p.id} {...p} />
              ))}
              {cols.length === 0 && (
                <div className="border border-dashed rounded-xl p-4 text-center text-xs text-muted-foreground">
                  Sin proyectos
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* Paused column */}
      {projects.filter((p) => p.status === "paused").length > 0 && (
        <div className="shrink-0 w-72">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#ea580c", backgroundColor: "#ffedd5" }}>
              Pausado
            </span>
          </div>
          <div className="space-y-3">
            {projects.filter((p) => p.status === "paused").map((p) => (
              <ProjectCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ projects, onRefresh }: { projects: Project[]; onRefresh: () => void }) {
  const router = useRouter();
  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Proyecto</th>
            <th className="text-left px-4 py-3 font-medium">Cliente</th>
            <th className="text-left px-4 py-3 font-medium">Estado</th>
            <th className="text-right px-4 py-3 font-medium">Presupuesto</th>
            <th className="text-left px-4 py-3 font-medium">Progreso</th>
            <th className="text-left px-4 py-3 font-medium">Deadline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((p) => {
            const cfg = PROJECT_STATUS_CONFIG[p.status] ?? PROJECT_STATUS_CONFIG.discovery;
            const progress = p.milestonesTotal > 0
              ? Math.round((p.milestonesCompleted / p.milestonesTotal) * 100)
              : 0;
            const dl = p.deadline ? new Date(p.deadline) : null;
            return (
              <tr
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.clientName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.budgetCents)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {dl ? dl.toLocaleDateString("es-CO", { month: "short", day: "numeric" }) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Sin proyectos</div>
      )}
    </div>
  );
}
