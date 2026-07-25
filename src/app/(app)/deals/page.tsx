"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { Plus, Briefcase, Download, DollarSign, Percent, Trophy, Search, Filter, Kanban as KanbanIcon, List } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DealForm } from "@/components/deals/DealForm";
import type { PipelineColumn } from "@/types";

interface DealRow {
  id: string;
  title: string;
  value: number;
  probability: number;
  contactId: string | null;
  contactName: string | null;
  contactTemperature: string | null;
  stageId: string;
  stageName: string | null;
  stageColor: string | null;
  stageIsWon: boolean | null;
  stageIsLost: boolean | null;
  expectedClose: number | Date | null;
  createdAt: number | Date;
  updatedAt: number | Date;
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    Promise.all([fetch("/api/deals").then((r) => r.json()), new Promise((r) => setTimeout(r, 1800))])
      .then(([data]) => {
        setDeals(data);
        setLoading(false);
      });
  }, [showForm]);

  const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : Number(d));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const dealsThisMonth = deals.filter((d) => toMs(d.createdAt) >= monthStart).length;
  const dealsLastMonth = deals.filter((d) => toMs(d.createdAt) >= prevMonthStart && toMs(d.createdAt) < monthStart).length;
  const wonThisMonth = deals.filter((d) => d.stageIsWon && toMs(d.updatedAt ?? d.createdAt) >= monthStart).length;
  const wonLastMonth = deals.filter(
    (d) => d.stageIsWon && toMs(d.updatedAt ?? d.createdAt) >= prevMonthStart && toMs(d.updatedAt ?? d.createdAt) < monthStart
  ).length;

  const pctChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0);

  const filteredDeals = useMemo(
    () =>
      deals.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          (d.contactName || "").toLowerCase().includes(search.toLowerCase())
      ),
    [deals, search]
  );

  const columns: PipelineColumn[] = useMemo(() => {
    const stageMap = new Map<string, { id: string; name: string; color: string; deals: DealRow[] }>();
    for (const d of filteredDeals) {
      if (!d.stageId) continue;
      if (!stageMap.has(d.stageId)) {
        stageMap.set(d.stageId, { id: d.stageId, name: d.stageName || "—", color: d.stageColor || "#64748b", deals: [] });
      }
      stageMap.get(d.stageId)!.deals.push(d);
    }
    return Array.from(stageMap.values())
      .filter((c) => !deals.find((d) => d.stageId === c.id)?.stageIsLost)
      .map((c) => ({ ...c, deals: c.deals as unknown as PipelineColumn["deals"] })) as PipelineColumn[];
  }, [filteredDeals, deals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Oportunidades de venta activas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/api/export?type=deals")}
            className="cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowForm(true)} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Deal
          </Button>
        </div>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando deals..." />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No hay deals"
          description="Crea tu primer deal para comenzar a gestionar tu pipeline."
          actionLabel="Crear deal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              icon={Briefcase}
              label="Total Deals"
              value={deals.length}
              subtext={`${dealsThisMonth >= dealsLastMonth ? "↑" : "↓"}${Math.abs(pctChange(dealsThisMonth, dealsLastMonth))}% vs mes anterior`}
              color="primary"
              highlight
            />
            <StatTile
              icon={DollarSign}
              label="Valor en Pipeline"
              value={formatCurrency(deals.reduce((s, d) => s + d.value, 0))}
              subtext="Suma de deals activos"
              color="green"
            />
            <StatTile
              icon={Percent}
              label="Probabilidad Promedio"
              value={deals.length > 0 ? `${Math.round(deals.reduce((s, d) => s + d.probability, 0) / deals.length)}%` : "—"}
              subtext="Ponderado por etapa"
              color="amber"
            />
            <StatTile
              icon={Trophy}
              label="Deals Ganados (este mes)"
              value={wonThisMonth}
              subtext={`${wonThisMonth >= wonLastMonth ? "↑" : "↓"}${Math.abs(pctChange(wonThisMonth, wonLastMonth))}% vs mes anterior`}
              color="purple"
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <div className="flex rounded-lg border p-0.5">
                  <Button
                    variant={view === "kanban" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("kanban")}
                    className="h-8"
                  >
                    <KanbanIcon className="h-4 w-4 mr-1.5" />
                    Kanban
                  </Button>
                  <Button
                    variant={view === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("list")}
                    className="h-8"
                  >
                    <List className="h-4 w-4 mr-1.5" />
                    Lista
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {view === "kanban" ? (
            <KanbanBoard initialColumns={columns} />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="hidden md:table-cell">Probabilidad</TableHead>
                    <TableHead className="hidden lg:table-cell">Cierre est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow
                      key={deal.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell>{deal.contactName || "-"}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(deal.value)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: deal.stageColor || undefined,
                            color: deal.stageColor || undefined,
                          }}
                        >
                          {deal.stageName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {deal.probability}%
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(deal.expectedClose)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground px-3 py-2">
                Mostrando {filteredDeals.length} de {deals.length} deal{deals.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </>
      )}

      <DealForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
