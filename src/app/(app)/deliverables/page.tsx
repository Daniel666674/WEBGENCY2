"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle2, Circle, ChevronRight, Folder } from "lucide-react";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";
import { formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Proposal {
  id: string;
  contactId: string;
  contactName: string | null;
  planName: string;
  deliverables: string[];
  createdAt: string | number;
}

type Filter = "todas" | "pendientes" | "en_progreso" | "completados";

// Proposal-level status derived from deliverable completion
function getStatus(done: number, total: number): "pendientes" | "en_progreso" | "completados" {
  if (done === 0) return "pendientes";
  if (done === total) return "completados";
  return "en_progreso";
}

const STATUS_LABEL: Record<string, string> = {
  pendientes: "Pendiente",
  en_progreso: "En progreso",
  completados: "Completado",
};

const STATUS_COLOR: Record<string, string> = {
  pendientes: "text-amber-600 bg-amber-500/10",
  en_progreso: "text-blue-600 bg-blue-500/10",
  completados: "text-green-600 bg-green-500/10",
};

// Icon color per plan name (cycles through a few)
const PLAN_COLORS = ["text-amber-500 bg-amber-500/15", "text-blue-500 bg-blue-500/15", "text-purple-500 bg-purple-500/15", "text-green-500 bg-green-500/15"];
function planColor(idx: number) { return PLAN_COLORS[idx % PLAN_COLORS.length]; }

const LS_KEY = "entregables_done";

function loadDone(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function saveDone(d: Record<string, boolean>) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}

export default function DeliverablesPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Filter>("todas");

  useEffect(() => {
    setDone(loadDone());
    fetch("/api/proposals")
      .then((r) => r.json())
      .then((data: Proposal[]) => {
        setProposals(data.filter((p) => p.deliverables.length > 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleDone = useCallback((proposalId: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${proposalId}:${idx}`;
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveDone(next);
      return next;
    });
  }, []);

  const doneCount = (p: Proposal) =>
    p.deliverables.filter((_, i) => done[`${p.id}:${i}`]).length;

  const allDeliverables = proposals.reduce((s, p) => s + p.deliverables.length, 0);
  const allDone = proposals.reduce((s, p) => s + doneCount(p), 0);

  const filtered = proposals.filter((p) => {
    if (filter === "todas") return true;
    return getStatus(doneCount(p), p.deliverables.length) === filter;
  });

  const counts: Record<Filter, number> = {
    todas: proposals.length,
    pendientes: proposals.filter((p) => getStatus(doneCount(p), p.deliverables.length) === "pendientes").length,
    en_progreso: proposals.filter((p) => getStatus(doneCount(p), p.deliverables.length) === "en_progreso").length,
    completados: proposals.filter((p) => getStatus(doneCount(p), p.deliverables.length) === "completados").length,
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: "todas", label: `Todas (${counts.todas})` },
    { key: "pendientes", label: "Pendientes" },
    { key: "en_progreso", label: "En progreso" },
    { key: "completados", label: "Completados" },
  ];

  if (loading) return <DogSpinnerPage label="Cargando entregables..." />;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-500/15 p-2.5 mt-0.5">
          <Package className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entregables</h1>
          <p className="text-sm text-muted-foreground">Seguimiento de deliverables por propuesta</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={Package}
          label="Total Entregables"
          value={allDeliverables}
          subtext={`En ${proposals.length} propuestas`}
          color="amber"
          highlight
        />
        <StatTile
          icon={Clock}
          label="Propuestas con Entregables"
          value={proposals.length}
          subtext="Con entregables asignados"
          color="blue"
        />
      </div>

      {/* Section header + filter tabs */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Entregables recientes
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
                filter === t.key
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin entregables"
          description="Agrega deliverables a las propuestas desde el detalle de un contacto."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p, idx) => {
            const dc = doneCount(p);
            const status = getStatus(dc, p.deliverables.length);
            return (
              <div
                key={p.id}
                className="rounded-2xl border bg-card overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => router.push(`/contacts/${p.contactId}`)}
                >
                  <div className={cn("rounded-xl p-2.5 shrink-0 mt-0.5", planColor(idx))}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">
                        {p.planName}
                        {p.contactName && (
                          <span className="font-normal text-muted-foreground"> · {p.contactName}</span>
                        )}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt)}
                      </span>
                    </div>
                    <span className={cn("inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1", STATUS_COLOR[status])}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>

                {/* Deliverable list */}
                <div className="px-4 pb-2 space-y-2">
                  {p.deliverables.map((d, i) => {
                    const isDone = !!done[`${p.id}:${i}`];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 group cursor-pointer"
                        onClick={(e) => toggleDone(p.id, i, e)}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className={cn("text-sm leading-snug flex-1", isDone && "line-through text-muted-foreground")}>
                          {d}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>

                {/* Card footer */}
                <div
                  className="flex items-center justify-between px-4 py-3 mt-1 border-t cursor-pointer"
                  onClick={() => router.push(`/contacts/${p.contactId}`)}
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Folder className="h-3.5 w-3.5" />
                    <span>{p.contactName || "Sin cliente"}</span>
                  </div>
                  <span className={cn("text-xs font-medium", dc === p.deliverables.length ? "text-green-500" : "text-muted-foreground")}>
                    {dc}/{p.deliverables.length} completados
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
