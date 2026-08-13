"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MonitorSmartphone, Plus, Loader2, FileUp, Search, LayoutGrid, List, Eye, Send, FileEdit as DraftIcon } from "lucide-react";
import { ImportDialog } from "@/components/demos/ImportDialog";
import { DemoGridCard } from "@/components/demos/DemoGridCard";
import { DemoListView } from "@/components/demos/DemoListView";
import { StatTile } from "@/components/shared/StatTile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DemoRow } from "@/components/demos/types";

type Tab = "todos" | "publicados" | "borradores";
type Sort = "recientes" | "nombre" | "vistas";
type View = "grid" | "list";
const PAGE_SIZE = 9;

export default function DemosPage() {
  const router = useRouter();
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("todos");
  const [sort, setSort] = useState<Sort>("recientes");
  const [view, setView] = useState<View>("grid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/demo-pages").then((r) => r.json());
      setDemos(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/demo-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nuevo demo", template: "editorial" }),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/demos/${created.id}?new=1`);
      } else {
        setCreating(false);
      }
    } catch {
      setCreating(false);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`¿Eliminar el demo "${title}"? Esta acción no se puede deshacer.`)) return;
    setDemos((d) => d.filter((x) => x.id !== id));
    await fetch(`/api/demo-pages/${id}`, { method: "DELETE" });
  }

  async function duplicate(id: string) {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/demo-pages/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        const created = await res.json();
        router.push(`/demos/${created.id}`);
      }
    } finally {
      setDuplicatingId(null);
    }
  }

  const publishedCount = demos.filter((d) => d.published).length;
  const draftCount = demos.length - publishedCount;
  const totalViews = demos.reduce((n, d) => n + (d.views ?? 0), 0);

  const byTab = useMemo(() => {
    if (tab === "publicados") return demos.filter((d) => d.published);
    if (tab === "borradores") return demos.filter((d) => !d.published);
    return demos;
  }, [demos, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? byTab.filter((d) => d.title.toLowerCase().includes(q) || (d.contactName ?? "").toLowerCase().includes(q))
      : byTab;
    const sorted = [...base];
    if (sort === "nombre") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "vistas") sorted.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    else sorted.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
    return sorted;
  }, [byTab, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeTab(next: Tab) { setTab(next); setPage(1); }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}
          >
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Demos</h1>
            <p className="text-xs text-muted-foreground">Sitios de demostración para tus prospectos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImporting(true)}
            className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
          >
            <FileUp className="h-4 w-4" /> Importar HTML
          </button>
          <button
            onClick={create}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 cursor-pointer"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Nuevo demo
          </button>
        </div>
      </div>

      <ImportDialog open={importing} onClose={() => setImporting(false)} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={MonitorSmartphone} label="Total demos" value={demos.length} color="purple" highlight />
        <StatTile icon={Send} label="Publicados" value={publishedCount} color="green" />
        <StatTile icon={DraftIcon} label="Borradores" value={draftCount} color="muted" />
        <StatTile icon={Eye} label="Vistas totales" value={totalViews} color="blue" />
      </div>

      {/* Mis demos */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {([
              ["todos", "Todos", demos.length],
              ["publicados", "Publicados", publishedCount],
              ["borradores", "Borradores", draftCount],
            ] as [Tab, string, number][]).map(([id, label, count]) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  tab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar en mis demos..."
                className="w-48 rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm"
              />
            </div>
            <Select value={sort} onValueChange={(v) => v && setSort(v as Sort)}>
              <SelectTrigger size="sm" className="cursor-pointer">
                <SelectValue>
                  {() => ({ recientes: "Más recientes", nombre: "Nombre", vistas: "Más vistas" }[sort])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recientes">Más recientes</SelectItem>
                <SelectItem value="nombre">Nombre</SelectItem>
                <SelectItem value="vistas">Más vistas</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`rounded-md p-1.5 cursor-pointer ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                title="Vista en grilla"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 cursor-pointer ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                title="Vista en lista"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
            <MonitorSmartphone className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">{demos.length === 0 ? "Aún no hay demos" : "Nada con estos filtros"}</p>
            <p className="text-sm text-muted-foreground">
              {demos.length === 0 ? "Crea un sitio de demostración para mostrarle a un prospecto." : "Probá con otra búsqueda o pestaña."}
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((d) => (
              <DemoGridCard
                key={d.id}
                demo={d}
                duplicating={duplicatingId === d.id}
                onDuplicate={() => duplicate(d.id)}
                onDelete={() => remove(d.id, d.title)}
              />
            ))}
          </div>
        ) : (
          <DemoListView demos={paged} duplicatingId={duplicatingId} onDuplicate={duplicate} onDelete={remove} />
        )}

        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} demos</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-7 w-7 rounded text-xs font-medium cursor-pointer ${n === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
