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
import { MousePointer2, Eye, Percent, MapPin, Users, Activity, Globe, TrendingDown, Clock, UserCheck } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface GscSummary { clicks: number; impressions: number; ctr: number; avgPosition: number }
interface Ga4Summary { sessions: number; users: number; conversions: number; bounceRate: number; avgSessionDuration: number; newUsers: number }

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
  ga4Channels: Array<{ channel: string; sessions: number }> | null;
  ga4Devices: Array<{ device: string; sessions: number }> | null;
  ga4Timeseries: { dates: string[]; sessions: number[]; users: number[] } | null;
  ga4TopPages: Array<{ page: string; sessions: number; users: number }> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  const p = d.split("-");
  return `${p[2]}/${p[1]}`;
}
function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v) => ({ v }));
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

function KpiTile({ label, value, icon: Icon, color, sparkData, fmt }: {
  label: string; value: number; icon: React.ElementType; color: string; sparkData?: number[]; fmt?: (n: number) => string;
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
          <div className="mt-2 -mx-1"><MiniSparkline data={sparkData} color={color} /></div>
        )}
      </CardContent>
    </Card>
  );
}

function HorizontalBars({ title, rows, color, valueSuffix = "" }: {
  title: string; rows: { label: string; value: number }[]; color: string; valueSuffix?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-foreground max-w-[60%]" title={row.label}>{row.label}</span>
              <span className="font-semibold shrink-0" style={{ color }}>{fmtNum(row.value)}{valueSuffix}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MetricTable({ title, rows, maxClicks }: {
  title: string; rows: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>; maxClicks: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-foreground max-w-[55%]" title={row.label}>{row.label}</span>
              <span className="font-semibold text-primary shrink-0">{row.clicks}</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${maxClicks > 0 ? (row.clicks / maxClicks) * 100 : 0}%` }} />
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

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value.toLocaleString()}</p>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const TEAL = "#0d9a8a";
const PURPLE = "#8b5cf6";
const GREEN = "#16a34a";
const BLUE = "#2563eb";
const AMBER = "#ea580c";

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { summary, timeseries, topQueries, topPages, countries, ga4Channels, ga4Devices, ga4Timeseries, ga4TopPages } = data;

  const gscChartData = timeseries
    ? timeseries.dates.map((d, i) => ({ date: fmtDate(d), Clics: timeseries.gscClicks[i], Impresiones: timeseries.gscImpressions[i] }))
    : [];

  const ga4ChartData = ga4Timeseries
    ? ga4Timeseries.dates.map((d, i) => ({ date: fmtDate(d), Sesiones: ga4Timeseries.sessions[i], Usuarios: ga4Timeseries.users[i] }))
    : [];

  const maxQueryClicks = Math.max(1, ...(topQueries?.map((q) => q.clicks) ?? [0]));
  const maxPageClicks = Math.max(1, ...(topPages?.map((p) => p.clicks) ?? [0]));
  const maxCountryClicks = Math.max(1, ...(countries?.map((c) => c.clicks) ?? [0]));

  const totalDeviceSessions = (ga4Devices ?? []).reduce((s, d) => s + d.sessions, 0) || 1;

  return (
    <div className="space-y-4">
      {/* GSC KPI tiles */}
      {summary.gsc && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiTile label="Clics (GSC)" value={summary.gsc.clicks} icon={MousePointer2} color={TEAL} sparkData={timeseries?.gscClicks} />
          <KpiTile label="Impresiones" value={summary.gsc.impressions} icon={Eye} color={PURPLE} sparkData={timeseries?.gscImpressions} />
          <KpiTile label="CTR promedio" value={summary.gsc.ctr} icon={Percent} color={AMBER} sparkData={timeseries?.gscCtr} fmt={(n) => `${n.toFixed(2)}%`} />
          <KpiTile label="Posición prom." value={summary.gsc.avgPosition} icon={MapPin} color="#64748b" sparkData={timeseries?.gscPosition} fmt={(n) => n.toFixed(1)} />
        </div>
      )}

      {/* GA4 core KPIs */}
      {summary.ga4 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <KpiTile label="Sesiones GA4" value={summary.ga4.sessions} icon={Activity} color={GREEN} sparkData={ga4Timeseries?.sessions} />
            <KpiTile label="Usuarios activos" value={summary.ga4.users} icon={Users} color={GREEN} />
            <KpiTile label="Conversiones" value={summary.ga4.conversions} icon={Activity} color={GREEN} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiTile label="Tasa de rebote" value={summary.ga4.bounceRate} icon={TrendingDown} color={AMBER} fmt={(n) => `${n.toFixed(1)}%`} />
            <KpiTile label="Duración media" value={summary.ga4.avgSessionDuration} icon={Clock} color={BLUE} fmt={fmtDuration} />
            <KpiTile label="Usuarios nuevos" value={summary.ga4.newUsers} icon={UserCheck} color={PURPLE} />
          </div>
        </>
      )}

      {/* GSC Trend chart */}
      {gscChartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-4">
              Tendencia SEO (Search Console)
              <span className="flex items-center gap-3 font-normal text-xs ml-auto">
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded inline-block" style={{ backgroundColor: TEAL }} /> Clics</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded inline-block" style={{ backgroundColor: PURPLE }} /> Impr.</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={gscChartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradClics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} /><stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradImpr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} /><stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={28} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="right" type="monotone" dataKey="Impresiones" stroke={PURPLE} strokeWidth={2} fill="url(#gradImpr)" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="Clics" stroke={TEAL} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* GA4 Timeseries */}
      {ga4ChartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-4">
              Sesiones diarias (GA4)
              <span className="flex items-center gap-3 font-normal text-xs ml-auto">
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded inline-block" style={{ backgroundColor: GREEN }} /> Sesiones</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 rounded inline-block" style={{ backgroundColor: BLUE }} /> Usuarios</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={ga4ChartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Sesiones" stroke={GREEN} strokeWidth={2} fill={`${GREEN}22`} dot={false} />
                <Line type="monotone" dataKey="Usuarios" stroke={BLUE} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Channels + Devices */}
      {(ga4Channels?.length || ga4Devices?.length) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ga4Channels && ga4Channels.length > 0 && (
            <HorizontalBars
              title="Canales de tráfico (GA4)"
              rows={ga4Channels.map((c) => ({ label: c.channel, value: c.sessions }))}
              color={BLUE}
            />
          )}
          {ga4Devices && ga4Devices.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold">Dispositivos (GA4)</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5">
                {ga4Devices.map((d, i) => {
                  const pct = Math.round((d.sessions / totalDeviceSessions) * 100);
                  const color = i === 0 ? BLUE : i === 1 ? TEAL : PURPLE;
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-foreground">{d.device}</span>
                        <span className="font-semibold shrink-0" style={{ color }}>{pct}% <span className="font-normal text-muted-foreground">({fmtNum(d.sessions)})</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top queries + GSC pages */}
      {(topQueries?.length || topPages?.length) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topQueries && topQueries.length > 0 && (
            <MetricTable title="Top Consultas (GSC)" rows={topQueries.map((q) => ({ label: q.query, ...q }))} maxClicks={maxQueryClicks} />
          )}
          {topPages && topPages.length > 0 && (
            <MetricTable
              title="Top Páginas (GSC — clics)"
              rows={topPages.map((p) => ({ label: p.page.replace(/^https?:\/\/[^/]+/, ""), ...p }))}
              maxClicks={maxPageClicks}
            />
          )}
        </div>
      )}

      {/* GA4 top pages */}
      {ga4TopPages && ga4TopPages.length > 0 && (
        <HorizontalBars
          title="Top Páginas por sesiones (GA4)"
          rows={ga4TopPages.map((p) => ({ label: p.page, value: p.sessions }))}
          color={GREEN}
          valueSuffix=" ses."
        />
      )}

      {/* Countries */}
      {countries && countries.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" /> Países (GSC)
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
                    <div className="h-full rounded-full transition-all" style={{ width: `${(c.clicks / maxCountryClicks) * 100}%`, backgroundColor: TEAL }} />
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
