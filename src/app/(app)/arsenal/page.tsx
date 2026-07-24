"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/shared/StatTile";
import { ArsenalCard } from "@/components/arsenal/ArsenalCard";
import { ArsenalForm } from "@/components/arsenal/ArsenalForm";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { CATEGORIES, type ArsenalItem } from "@/lib/arsenalConfig";
import { cn } from "@/lib/utils";

const ALL_TABS = ["Todo", ...CATEGORIES] as const;

export default function ArsenalPage() {
  const [items, setItems] = useState<ArsenalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("Todo");
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/arsenal")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  function seedArsenal() {
    setSeeding(true);
    fetch("/api/arsenal/seed", { method: "POST" })
      .then((r) => r.json())
      .then(() => { setSeeding(false); load(); })
      .catch(() => setSeeding(false));
  }

  const filtered = items.filter((item) => {
    const matchesTab = tab === "Todo" || item.category === tab;
    const lq = q.toLowerCase();
    const matchesQ =
      !q ||
      item.name.toLowerCase().includes(lq) ||
      (item.description ?? "").toLowerCase().includes(lq) ||
      (item.tags ?? "").toLowerCase().includes(lq);
    return matchesTab && matchesQ;
  });

  const activeCount = items.filter((i) => i.status === "active").length;
  const autoCount = items.filter((i) => i.category === "Automation").length;
  const totalCost = items.reduce((sum, i) => sum + (i.costCents ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arsenal</h1>
          <p className="text-muted-foreground text-sm">Stacks, backends, herramientas y flujos de automatización</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={seedArsenal}
            disabled={seeding}
            className="cursor-pointer"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {seeding ? "Poblando..." : "Poblar stack"}
          </Button>
          <Button onClick={() => setShowForm(true)} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" /> Nuevo item
          </Button>
        </div>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando arsenal..." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile icon={Layers} label="Total items" value={items.length} color="primary" highlight />
            <StatTile icon={Layers} label="Activos" value={activeCount} color="green" />
            <StatTile icon={Layers} label="Automatizaciones" value={autoCount} color="purple" />
            <StatTile
              icon={Layers}
              label="Costo mensual"
              value={totalCost > 0 ? `$${(totalCost / 100).toFixed(0)}` : "$0"}
              color="amber"
            />
          </div>

          {/* Search + category tabs */}
          <div className="space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, descripción, tags..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border",
                    tab === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {t}
                  {t !== "Todo" && (
                    <span className="ml-1.5 opacity-60">
                      {items.filter((i) => i.category === t).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm space-y-4">
              {items.length === 0 ? "El Arsenal está vacío. Usá \"Poblar stack\" para cargar los items base." : "Sin resultados para ese filtro"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <ArsenalCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      <ArsenalForm open={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
    </div>
  );
}
