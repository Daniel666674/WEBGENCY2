"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import {
  TrendingUp,
  Target,
  Layers,
  Flame,
  AlertTriangle,
  Lightbulb,
  Users,
  FileText,
  Sparkles,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface TopOpportunity {
  id: string;
  title: string;
  contactName: string | null;
  value: number;
  probability: number;
  expectedClose: number | Date | null;
  nextActivityType: string | null;
}

interface Insight {
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  delta: number | null;
  dealId: string | null;
}

interface ForecastData {
  forecast: number;
  pipelineTotal: number;
  winRate: number;
  forecastTrend: number;
  pipelineTrend: number;
  winRateTrend: number;
  pipelineHistory: Array<{ month: string; pipeline: number; forecast: number; winRate: number }>;
  probabilityDistribution: {
    high: { value: number; count: number };
    medium: { value: number; count: number };
    low: { value: number; count: number };
  };
  funnel: { pipelineTotal: number; qualified: number; forecast: number; expected90: number };
  insights: Insight[];
  topOpportunities: TopOpportunity[];
  forecastByMonth: Array<{ month: string; value: number }>;
  confidence: number;
  monthlyGoal: number | null;
}

const NEXT_ACTIVITY_LABELS: Record<string, string> = {
  call: "Llamada",
  email: "Email",
  meeting: "Reunión",
  note: "Nota",
  follow_up: "Seguimiento",
};

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const load = () => {
    fetch("/api/forecast")
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const saveGoal = async () => {
    const value = Math.round(Number(goalInput) * 100);
    if (!value || value <= 0) return;
    setSavingGoal(true);
    await fetch("/api/forecast", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyGoal: value }),
    });
    setSavingGoal(false);
    load();
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forecast</h1>
          <p className="text-muted-foreground">Proyección de ingresos basada en el pipeline</p>
        </div>
        <DogSpinnerPage label="Cargando forecast..." />
      </div>
    );
  }

  const goalProgress = data.monthlyGoal ? Math.min(Math.round((data.forecast / data.monthlyGoal) * 100), 100) : 0;
  const remaining = data.monthlyGoal ? Math.max(data.monthlyGoal - data.forecast, 0) : 0;

  const probTotal = data.probabilityDistribution.high.value + data.probabilityDistribution.medium.value + data.probabilityDistribution.low.value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forecast</h1>
        <p className="text-muted-foreground">Proyección de ingresos basada en el pipeline</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Forecast", value: formatCurrency(data.forecast), trend: data.forecastTrend, icon: TrendingUp, color: "#7c3aed", history: data.pipelineHistory.map((h) => h.forecast) },
          { label: "Pipeline Total", value: formatCurrency(data.pipelineTotal), trend: data.pipelineTrend, icon: Layers, color: "#3b82f6", history: data.pipelineHistory.map((h) => h.pipeline) },
          { label: "Win Rate (Prob.)", value: `${data.winRate}%`, trend: data.winRateTrend, icon: Target, color: "#f59e0b", history: data.pipelineHistory.map((h) => h.winRate) },
        ].map((tile) => (
          <Card key={tile.label}>
            <CardContent className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg p-1.5" style={{ backgroundColor: `${tile.color}1a` }}>
                  <tile.icon className="h-3.5 w-3.5" style={{ color: tile.color }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tile.label}</span>
              </div>
              <p className="text-2xl font-bold">{tile.value}</p>
              <p className={`text-xs mt-1 ${tile.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {tile.trend >= 0 ? "↑" : "↓"}{Math.abs(tile.trend)}% vs el mes pasado
              </p>
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={tile.history.map((v, i) => ({ v, i }))}>
                  <Line type="monotone" dataKey="v" stroke={tile.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta Mensual</span>
            {data.monthlyGoal && (
              <span className="text-2xl font-bold text-green-600">{goalProgress}%</span>
            )}
          </div>
          {data.monthlyGoal ? (
            <>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(data.forecast)} / {formatCurrency(data.monthlyGoal)}
                </span>
                <span className="text-muted-foreground">
                  {remaining > 0 ? `Necesitas ${formatCurrency(remaining)}` : "¡Meta alcanzada!"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Define tu meta mensual (ej: 5000000)"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="max-w-xs"
              />
              <Button size="sm" onClick={saveGoal} disabled={savingGoal}>
                Guardar meta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por Probabilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Alta", sub: "≥ 70%", data: data.probabilityDistribution.high, color: "bg-green-500", text: "text-green-600" },
              { label: "Media", sub: "40% - 69%", data: data.probabilityDistribution.medium, color: "bg-amber-500", text: "text-amber-600" },
              { label: "Baja", sub: "< 40%", data: data.probabilityDistribution.low, color: "bg-red-500", text: "text-red-600" },
            ].map((row) => {
              const pct = probTotal > 0 ? Math.round((row.data.value / probTotal) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-medium ${row.text}`}>
                      {row.label} <span className="text-muted-foreground font-normal">{row.sub}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(row.data.value)}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(probTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Funnel de Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Users, label: "Pipeline Total", sub: "Todo el pipeline", value: data.funnel.pipelineTotal, chip: "bg-purple-500/10", iconColor: "text-purple-600" },
              { icon: Target, label: "Calificado", sub: "Deals fuera de la primera etapa", value: data.funnel.qualified, chip: "bg-blue-500/10", iconColor: "text-blue-600" },
              { icon: FileText, label: "Forecast (Ponderado)", sub: "Ajustado por probabilidad", value: data.funnel.forecast, chip: "bg-amber-500/10", iconColor: "text-amber-600" },
              { icon: DollarSign, label: "Ingreso Esperado", sub: "Cierres en los próximos 90 días", value: data.funnel.expected90, chip: "bg-green-500/10", iconColor: "text-green-600" },
            ].map((step, i, arr) => (
              <div key={step.label}>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                  <div className={`rounded-lg p-2 ${step.chip}`}>
                    <step.icon className={`h-4 w-4 ${step.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.sub}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{formatCurrency(step.value)}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {data.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.insights.map((insight, i) => {
              const Icon = insight.type === "top-deal" ? Flame : insight.type === "stale" ? AlertTriangle : Lightbulb;
              const color = insight.type === "top-deal" ? "text-red-500" : insight.type === "stale" ? "text-amber-500" : "text-blue-500";
              return (
                <div key={i} className="flex items-center justify-between gap-2 p-3 rounded-lg border">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                    </div>
                  </div>
                  {insight.delta !== null ? (
                    <span className="text-sm font-semibold text-green-600 shrink-0">+{formatCurrency(insight.delta)}</span>
                  ) : insight.dealId ? (
                    <Link
                      href={`/deals/${insight.dealId}`}
                      className={buttonVariants({ variant: "ghost", size: "sm", className: "shrink-0" })}
                    >
                      Ver deal →
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {data.topOpportunities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {data.topOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/deals/${opp.id}`}
                  className="shrink-0 w-64 rounded-xl border p-4 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{opp.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{opp.contactName}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${opp.probability >= 70 ? "bg-green-100 text-green-700" : opp.probability >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {opp.probability}%
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary">{formatCurrency(opp.value)}</p>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${opp.probability >= 70 ? "bg-green-500" : opp.probability >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${opp.probability}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                    <p>Cierre esperado: {formatDate(opp.expectedClose)}</p>
                    {opp.nextActivityType && (
                      <p>Siguiente actividad: {NEXT_ACTIVITY_LABELS[opp.nextActivityType] || opp.nextActivityType}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Forecast por mes (próximos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.forecastByMonth} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.forecastByMonth.map((_, i) => (
                    <Cell key={i} fill="var(--primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Confianza del Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: data.confidence }, { value: 100 - data.confidence }]}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={54}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="var(--muted)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">{data.confidence}%</span>
                </div>
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium mb-2">
                  {data.confidence >= 70 ? "Alta" : data.confidence >= 40 ? "Media" : "Baja"}
                </p>
                <p className="text-xs text-muted-foreground mb-2">Basado en:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✓ Actividad reciente de los deals</li>
                  <li>✓ Historial de cierres (win rate)</li>
                  <li>✓ Antigüedad de los deals abiertos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
