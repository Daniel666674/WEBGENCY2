import { db } from "@/db";
import { pipelineStages, deals, contacts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { StatTile } from "@/components/shared/StatTile";
import { formatCurrency } from "@/lib/constants";
import { Layers, DollarSign, PieChart, TrendingUp } from "lucide-react";
import type { PipelineColumn } from "@/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const stages = await db
    .select()
    .from(pipelineStages)
    .orderBy(asc(pipelineStages.order))
    .all();

  const allDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      contactId: deals.contactId,
      expectedClose: deals.expectedClose,
      probability: deals.probability,
      notes: deals.notes,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactName: contacts.name,
      contactTemperature: contacts.temperature,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .all();

  const columns: PipelineColumn[] = stages.map((stage) => ({
    ...stage,
    deals: allDeals
      .filter((d) => d.stageId === stage.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        stageId: d.stageId,
        contactId: d.contactId,
        expectedClose: d.expectedClose,
        probability: d.probability,
        notes: d.notes,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        contactName: d.contactName,
        contactTemperature: d.contactTemperature,
      })) as PipelineColumn["deals"],
  }));

  // Real trends: month-over-month, using each deal's createdAt
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : Number(d));
  const pctChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0);

  const wonLostIds = new Set(stages.filter((s) => s.isWon || s.isLost).map((s) => s.id));
  const openDeals = allDeals.filter((d) => !wonLostIds.has(d.stageId));
  const wonDeals = allDeals.filter((d) => stages.find((s) => s.id === d.stageId)?.isWon);

  const valorTotal = openDeals.reduce((s, d) => s + d.value, 0);
  const valorPonderado = openDeals.reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);
  const tasaConversion = allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0;

  const dealsThisMonth = allDeals.filter((d) => toMs(d.createdAt) >= monthStart).length;
  const dealsLastMonth = allDeals.filter((d) => toMs(d.createdAt) >= prevMonthStart && toMs(d.createdAt) < monthStart).length;

  const valorThisMonth = allDeals.filter((d) => toMs(d.createdAt) >= monthStart).reduce((s, d) => s + d.value, 0);
  const valorLastMonth = allDeals
    .filter((d) => toMs(d.createdAt) >= prevMonthStart && toMs(d.createdAt) < monthStart)
    .reduce((s, d) => s + d.value, 0);

  const ponderadoThisMonth = allDeals
    .filter((d) => toMs(d.createdAt) >= monthStart)
    .reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);
  const ponderadoLastMonth = allDeals
    .filter((d) => toMs(d.createdAt) >= prevMonthStart && toMs(d.createdAt) < monthStart)
    .reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);

  const wonThisMonth = allDeals.filter((d) => stages.find((s) => s.id === d.stageId)?.isWon && toMs(d.updatedAt) >= monthStart).length;
  const totalThisMonth = allDeals.filter((d) => toMs(d.createdAt) >= monthStart).length;
  const wonLastMonth = allDeals.filter(
    (d) => stages.find((s) => s.id === d.stageId)?.isWon && toMs(d.updatedAt) >= prevMonthStart && toMs(d.updatedAt) < monthStart
  ).length;
  const totalLastMonth = dealsLastMonth;
  const tasaThisMonth = totalThisMonth > 0 ? Math.round((wonThisMonth / totalThisMonth) * 100) : 0;
  const tasaLastMonth = totalLastMonth > 0 ? Math.round((wonLastMonth / totalLastMonth) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">
            Arrastra y suelta deals entre etapas para actualizar su estado.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
          <StatTile
            icon={Layers}
            label="Deals totales"
            value={allDeals.length}
            subtext={`${dealsThisMonth >= dealsLastMonth ? "↑" : "↓"}${Math.abs(pctChange(dealsThisMonth, dealsLastMonth))}% vs mes anterior`}
            color="purple"
          />
          <StatTile
            icon={DollarSign}
            label="Valor total"
            value={formatCurrency(valorTotal)}
            subtext={`${valorThisMonth >= valorLastMonth ? "↑" : "↓"}${Math.abs(pctChange(valorThisMonth, valorLastMonth))}% vs mes anterior`}
            color="green"
          />
          <StatTile
            icon={PieChart}
            label="Valor ponderado"
            value={formatCurrency(valorPonderado)}
            subtext={`${ponderadoThisMonth >= ponderadoLastMonth ? "↑" : "↓"}${Math.abs(pctChange(ponderadoThisMonth, ponderadoLastMonth))}% vs mes anterior`}
            color="blue"
          />
          <StatTile
            icon={TrendingUp}
            label="Tasa de conversión"
            value={`${tasaConversion}%`}
            subtext={`${tasaThisMonth >= tasaLastMonth ? "↑" : "↓"}${Math.abs(tasaThisMonth - tasaLastMonth)}% vs mes anterior`}
            color="amber"
          />
        </div>
      </div>

      <PipelineView columns={columns} />
    </div>
  );
}
