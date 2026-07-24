"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointer2, Eye, Percent, MapPin, Users, Activity, Globe } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface GscSummary { clicks: number; impressions: number; ctr: number; avgPosition: number }
interface Ga4Summary { sessions: number; users: number; conversions: number }

export interface AnalyticsData {
  connected: true;
  days: number;
  summary: { gsc: GscSummary | null; ga4: Ga4Summary | null };
  timeseries: {
    dates: string[];
    gscClicks: number[];
    gscImpressions: number[];
    gscCtr: number[];
    gscPosition: number[];
  } | null;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> | null;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }> | null;
  countries: Array<{ country: string; clicks: number }> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <ComposedChart data={pts} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace("#", "")})`} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── KPI Tile ───────────────────────────────────────────────────────────────────
function KpiTile({
  label,
  value,
  icon: Icon,
  color,
  sparkData,
  fmt,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  sparkData?: number[];
  fmt?: (n: number) => string;
}) {
  const display = fmt ? fmt(value) : fmtNum(value);
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color }}>{display}</p>
          </div>
          <div className="rounded-md p-1.5 mt-0.5" style={{ backgroundColor: `${color}18` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="mt-2 -mx-1">
            <MiniSparkline data={sparkData} color={color} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Row table with bars ────────────────────────────────────────────────────────
function MetricTable({
  title,
  rows,
  labelKey,
  maxClicks,
}: {
  title: string;
  rows: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>;
  labelKey: string;
  maxClicks: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-foreground max-w-[55%]" title={row.label}>{row.label}</span>
              <span className="font-semibold text-primary shrink-0">{row.clicks}</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${maxClicks > 0 ? (row.clicks / maxClicks) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{fmtNum(row.impressions)} impr.</span>
              <span>{row.ctr.toFixed(1)}% CTR</span>
              <span>Pos. {row.position.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const TEAL = "#0d9a8a";
const PURPLE = "#8b5cf6";
const GREEN = "#16a34a";

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { summary, timeseries, topQueries, topPages, countries } = data;

  const chartData = timeseries
    ? timeseries.dates.map((d, i) => ({
        date: fmtDate(d),
        Clics: timeseries.gscClicks[i],
        Impresiones: timeseries.gscImpressions[i],
      }))
    : [];

  const maxQueryClicks = Math.max(1, ...(topQueries?.map((q) => q.clicks) ?? [0]));
  const maxPageClicks = Math.max(1, ...(topPages?.map((p) => p.clicks) ?? [0]));
  const maxCountryClicks = Math.max(1, ...(countries?.map((c) => c.clicks) ?? [0]));

  return (
    <div className="space-y-4">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summary.gsc && (
          <>
            <KpiTile label="Clics totales" value={summary.gsc.clicks} icon={MousePointer2} color={TEAL} sparkData={timeseries?.gscClicks} />
            <KpiTile label="Impresiones" value={summary.gsc.impressions} icon={Eye} color={PURPLE} sparkData={timeseries?.gscImpressions} />
            <KpiTile label="CTR promedio" value={summary.gsc.ctr} icon={Percent} color="#ea580c" sparkData={timeseries?.gscCtr} fmt={(n) => `${n.toFixed(2)}%`} />
            <KpiTile label="Posición prom." value={summary.gsc.avgPosition} icon={MapPin} color="#64748b" sparkData={timeseries?.gscPosition} fmt={(n) => n.toFixed(1)} />
          </>
        )}
      </div>

      {summary.ga4 && (
        <div className="grid grid-cols-3 gap-3">
          <KpiTile label="Sesiones GA4" value={summary.ga4.sessions} icon={Activity} color={GREEN} />
          <KpiTile label="Usuarios activos" value={summary.ga4.users} icon={Users} color={GREEN} />
          <KpiTile label="Conversiones" value={summary.ga4.conversions} icon={Activity} color={GREEN} />
        </div>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-4">
              Tendencia SEO
              <span className="flex items-center gap-3 font-normal text-xs ml-auto">
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded inline-block" style={{ backgroundColor: TEAL }} /> Clics</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded inline-block" style={{ backgroundColor: PURPLE }} /> Impresiones</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradClics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradImpr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={28} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="right" type="monotone" dataKey="Impresiones" stroke={PURPLE} strokeWidth={2} fill="url(#gradImpr)" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="Clics" stroke={TEAL} strokeWidth={2.5} dot={false} fill="url(#gradClics)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top queries + pages */}
      {(topQueries?.length || topPages?.length) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topQueries && topQueries.length > 0 && (
            <MetricTable
              title="Top Consultas"
              rows={topQueries.map((q) => ({ label: q.query, ...q }))}
              labelKey="query"
              maxClicks={maxQueryClicks}
            />
          )}
          {topPages && topPages.length > 0 && (
            <MetricTable
              title="Top Páginas"
              rows={topPages.map((p) => ({
                label: p.page.replace(/^https?:\/\/[^/]+/, ""),
                ...p,
              }))}
              labelKey="page"
              maxClicks={maxPageClicks}
            />
          )}
        </div>
      )}

      {/* Countries */}
      {countries && countries.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" /> Países
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
              {countries.map((c, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="uppercase font-mono text-foreground">{c.country}</span>
                    <span className="font-semibold text-primary">{c.clicks}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(c.clicks / maxCountryClicks) * 100}%`, backgroundColor: TEAL }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
