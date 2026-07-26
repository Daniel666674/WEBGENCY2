"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { PROJECT_STATUS_CONFIG } from "@/lib/projectStatus";
import { Plus, List, Rocket, Pencil, Code2, Zap, PauseCircle, TrendingUp, DollarSign, CalendarDays, Eye, Folder, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  status: string;
  budgetCents: number;
  createdAt?: string | number | null;
  deadline?: number | null;
  clientName?: string | null;
  clientId?: string | null;
  milestonesTotal: number;
  milestonesCompleted: number;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  discovery: Rocket,
  design: Pencil,
  dev: Code2,
  launched: Zap,
  paused: PauseCircle,
};

const STATUS_TILE_COLORS: Record<string, { icon: string; bg: string; bar: string }> = {
  discovery: { icon: "text-purple-500", bg: "bg-purple-500/10", bar: "bg-purple-500" },
  design:    { icon: "text-purple-400", bg: "bg-purple-400/10", bar: "bg-purple-400" },
  dev:       { icon: "text-blue-500",   bg: "bg-blue-500/10",   bar: "bg-blue-500" },
  launched:  { icon: "text-green-500",  bg: "bg-green-500/10",  bar: "bg-green-500" },
  paused:    { icon: "text-amber-500",  bg: "bg-amber-500/10",  bar: "bg-amber-500" },
};

const STATUSES = ["discovery", "design", "dev", "launched", "paused"] as const;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "name">("recent");

  async function load() {
    setLoading(true);
    const [res] = await Promise.all([fetch("/api/projects"), new Promise((r) => setTimeout(r, 1200))]);
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

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const ta = Number(a.createdAt ?? 0);
      const tb = Number(b.createdAt ?? 0);
      return sort === "recent" ? tb - ta : ta - tb;
    });

  if (loading) return <DogSpinnerPage label="Cargando proyectos..." />;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-500/15 p-2.5 mt-0.5">
            <Folder className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-sm text-muted-foreground">
              {activeProjects.length} activos · {formatCurrency(totalBudget)} en pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {}}
            className="p-2 rounded-lg border hover:bg-muted transition-colors"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer"
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
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50 cursor-pointer"
            >
              Crear
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-1.5 text-sm text-muted-foreground cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Status tiles row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STATUSES.filter((s) => s !== "paused").map((status) => {
          const cfg = PROJECT_STATUS_CONFIG[status];
          const tc = STATUS_TILE_COLORS[status];
          const Icon = STATUS_ICONS[status];
          const count = projects.filter((p) => p.status === status).length;
          return (
            <div key={status} className="rounded-2xl border bg-card p-4 flex items-center gap-3 overflow-hidden relative">
              <div className={cn("rounded-xl p-2.5 shrink-0", tc.bg)}>
                <Icon className={cn("h-5 w-5", tc.icon)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
                <p className="text-2xl font-bold leading-tight">{count}</p>
                <p className="text-xs text-muted-foreground">{count === 1 ? "Activo" : "Activos"}</p>
              </div>
              {/* bottom color accent bar */}
              <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", tc.bar)} />
            </div>
          );
        })}
      </div>

      {/* Section header + search + sort */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Todos los proyectos
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-background"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="border rounded-lg px-3 py-2 text-sm bg-background cursor-pointer"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="name">Nombre</option>
          </select>
        </div>
      </div>

      {/* Project cards */}
      <div className="space-y-3">
        {filtered.map((p) => (
          <ProjectListCard key={p.id} project={p} />
        ))}

        {/* CTA card */}
        <button
          onClick={() => setShowNew(true)}
          className="w-full rounded-2xl border-2 border-dashed border-border p-8 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="rounded-full bg-purple-500/15 p-3">
            <Plus className="h-6 w-6 text-purple-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-purple-500">Crear nuevo proyecto</p>
            <p className="text-xs text-muted-foreground mt-1">Organiza y gestiona tus proyectos de manera eficiente.</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function ProjectListCard({ project: p }: { project: Project }) {
  const router = useRouter();
  const cfg = PROJECT_STATUS_CONFIG[p.status] ?? PROJECT_STATUS_CONFIG.discovery;
  const Icon = STATUS_ICONS[p.status] ?? Folder;
  const tc = STATUS_TILE_COLORS[p.status] ?? STATUS_TILE_COLORS.discovery;
  const isActive = p.status !== "launched" && p.status !== "paused";

  const createdAt = p.createdAt
    ? formatDate(typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt)
    : "—";

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Card top */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn("rounded-xl p-3 shrink-0", tc.bg)}>
          <Icon className={cn("h-5 w-5", tc.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight">{p.name}</p>
          <span
            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.label}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t mx-4" />

      {/* Info row */}
      <div className="grid grid-cols-3 gap-0 px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="rounded-full bg-muted p-1">
              <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Estado</span>
          </div>
          <p className={cn("text-sm font-semibold pl-0.5", isActive ? "text-green-500" : "text-muted-foreground")}>
            {isActive ? "Activo" : cfg.label}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="rounded-full bg-muted p-1">
              <DollarSign className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Valor del proyecto</span>
          </div>
          <p className="text-sm font-semibold pl-0.5">{formatCurrency(p.budgetCents)}</p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="rounded-full bg-muted p-1">
              <CalendarDays className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Creado</span>
          </div>
          <p className="text-sm font-semibold pl-0.5">{createdAt}</p>
        </div>
      </div>

      {/* Ver detalles */}
      <button
        onClick={() => router.push(`/projects/${p.id}`)}
        className="w-full border-t py-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <Eye className="h-4 w-4" />
        Ver detalles
      </button>
    </div>
  );
}
