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
import {
  MousePointer2, Eye, Percent, MapPin, Users, Activity,
  Globe, TrendingDown, Clock, UserCheck, BarChart2, Monitor,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface GscSummary { clicks: number; impressions: number; ctr: number; avgPosition: number }
interface Ga4Summary {
  sessions: number; users: number; conversions: number;
  bounceRate: number; avgSessionDuration: number; newUsers: number; pageViews: number;
}

export interface AnalyticsData {
  connected: true;
  days: number;
  summary: { gsc: GscSummary | null; ga4: Ga4Summary | null };
  timeseries: { dates: string[]; gscClicks: number[]; gscImpressions: number[]; gscCtr: number[]; gscPosition: number[] } | null;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> | null;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }> | null;
  countries: Array<{ country: string; clicks: number }> | null;
  ga4Channels: Array<{ channel: string; sessions: number }> | null;
  ga4Devices: Array<{ device: string; sessions: number }> | null;
  ga4Timeseries: { dates: string[]; sessions: number[]; users: number[] } | null;
  ga4TopPages: Array<{ page: string; sessions: number; users: number }> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => { const p = d.split("-"); return `${p[2]}/${p[1]}`; };
const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const fmtDuration = (s: number) => { const m = Math.floor(s / 60); return m > 0 ? `${m}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`; };

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Conectado
          </span>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Mini sparkline ─────────────────────────────────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <ComposedChart data={data.map((v) => ({ v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sk${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sk${color.replace("#", "")})`} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── KPI tile ───────────────────────────────────────────────────────────────────
function KpiTile({ label, value, icon: Icon, color, sparkData, fmt }: {
  label: string; value: number; icon: React.ElementType; color: string; sparkData?: number[]; fmt?: (n: number) => string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color }}>{fmt ? fmt(value) : fmtNum(value)}</p>
          </div>
          <div className="rounded-md p-1.5 mt-0.5" style={{ backgroundColor: `${color}18` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        </div>
        {sparkData && sparkData.length > 1 && <div className="mt-2 -mx-1"><MiniSparkline data={sparkData} color={color} /></div>}
      </CardContent>
    </Card>
  );
}

// ── Horizontal bars ────────────────────────────────────────────────────────────
function HorizBars({ title, subtitle, rows, color }: {
  title: string; subtitle?: string; rows: { label: string; value: number }[]; color: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-foreground max-w-[65%]" title={row.label}>{row.label}</span>
              <span className="font-semibold shrink-0" style={{ color }}>{fmtNum(row.value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── GSC metric table ───────────────────────────────────────────────────────────
function GscTable({ title, rows, maxClicks }: {
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
              <div className="h-full rounded-full bg-primary" style={{ width: `${maxClicks > 0 ? (row.clicks / maxClicks) * 100 : 0}%` }} />
            </div>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
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

// ── Query detail table ─────────────────────────────────────────────────────────
function QueryDetailTable({ rows }: { rows: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold">Detalle por consulta</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-1.5 font-medium text-muted-foreground">Consulta</th>
              <th className="text-right pb-1.5 font-medium text-muted-foreground">Clics</th>
              <th className="text-right pb-1.5 font-medium text-muted-foreground">Impr.</th>
              <th className="text-right pb-1.5 font-medium text-muted-foreground">CTR</th>
              <th className="text-right pb-1.5 font-medium text-muted-foreground">Pos.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.slice(0, 8).map((r, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="py-1.5 truncate max-w-[140px]" title={r.query}>{r.query}</td>
                <td className="py-1.5 text-right font-semibold text-primary">{r.clicks}</td>
                <td className="py-1.5 text-right text-muted-foreground">{r.impressions}</td>
                <td className="py-1.5 text-right text-muted-foreground">{r.ctr.toFixed(1)}%</td>
                <td className="py-1.5 text-right text-amber-500 font-medium">{r.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value.toLocaleString()}</p>)}
    </div>
  );
}

// ── Colors ─────────────────────────────────────────────────────────────────────
const TEAL = "#0d9a8a", PURPLE = "#8b5cf6", GREEN = "#16a34a", BLUE = "#2563eb", AMBER = "#ea580c";

// ── Main ───────────────────────────────────────────────────────────────────────
export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { summary, timeseries, topQueries, topPages, countries, ga4Channels, ga4Devices, ga4Timeseries, ga4TopPages } = data;

  const gscChart = timeseries
    ? timeseries.dates.map((d, i) => ({ date: fmtDate(d), Clics: timeseries.gscClicks[i], Impresiones: timeseries.gscImpressions[i] }))
    : [];

  const ga4Chart = ga4Timeseries
    ? ga4Timeseries.dates.map((d, i) => ({ date: fmtDate(d), Sesiones: ga4Timeseries.sessions[i], Usuarios: ga4Timeseries.users[i] }))
    : [];

  const totalDevSessions = (ga4Devices ?? []).reduce((s, d) => s + d.sessions, 0) || 1;
  const totalChannelSessions = (ga4Channels ?? []).reduce((s, c) => s + c.sessions, 0);
  const maxQClicks = Math.max(1, ...(topQueries?.map((q) => q.clicks) ?? [0]));
  const maxPClicks = Math.max(1, ...(topPages?.map((p) => p.clicks) ?? [0]));
  const maxCClicks = Math.max(1, ...(countries?.map((c) => c.clicks) ?? [0]));

  return (
    <div className="space-y-8">

      {/* ─── GA4 Section ──────────────────────────────────────────────── */}
      {summary.ga4 && (
        <section className="space-y-4">
          <SectionHeader title="Google Analytics 4" />

          {/* KPI row — core */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <KpiTile label="Sesiones" value={summary.ga4.sessions} icon={Activity} color={GREEN} sparkData={ga4Timeseries?.sessions} />
            <KpiTile label="Usuarios activos" value={summary.ga4.users} icon={Users} color={GREEN} />
            <KpiTile label="Usuarios nuevos" value={summary.ga4.newUsers} icon={UserCheck} color={BLUE} />
            <KpiTile label="Páginas vistas" value={summary.ga4.pageViews} icon={Eye} color={PURPLE} />
            <KpiTile label="Bounce Rate" value={summary.ga4.bounceRate} icon={TrendingDown} color={AMBER} fmt={(n) => `${n.toFixed(1)}%`} />
            <KpiTile label="Duración media" value={summary.ga4.avgSessionDuration} icon={Clock} color={TEAL} fmt={fmtDuration} />
          </div>

          {/* GA4 timeseries */}
          {ga4Chart.length > 1 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-4">
                  Tendencia de Tráfico
                  <span className="text-xs font-normal text-muted-foreground ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded inline-block" style={{ backgroundColor: GREEN }} /> Sesiones</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 inline-block border-b-2 border-dashed" style={{ borderColor: BLUE }} /> Usuarios</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={ga4Chart} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
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

          {/* Top pages + Channels */}
          {(ga4TopPages?.length || ga4Channels?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ga4TopPages && ga4TopPages.length > 0 && (
                <HorizBars title="Top Páginas" rows={ga4TopPages.map((p) => ({ label: p.page, value: p.sessions }))} color={GREEN} />
              )}
              {ga4Channels && ga4Channels.length > 0 && (
                <HorizBars
                  title="Fuentes de Tráfico"
                  subtitle={`Total ${fmtNum(totalChannelSessions)} sesiones`}
                  rows={ga4Channels.map((c) => ({ label: c.channel, value: c.sessions }))}
                  color={BLUE}
                />
              )}
            </div>
          )}

          {/* Devices */}
          {ga4Devices && ga4Devices.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" /> Dispositivos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5">
                {ga4Devices.map((d, i) => {
                  const pct = Math.round((d.sessions / totalDevSessions) * 100);
                  const color = i === 0 ? BLUE : i === 1 ? TEAL : PURPLE;
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-foreground">{d.device}</span>
                        <span className="font-semibold shrink-0 tabular-nums" style={{ color }}>
                          {fmtNum(d.sessions)} <span className="font-normal text-muted-foreground">· {pct}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Section divider */}
      {summary.ga4 && summary.gsc && <div className="border-t border-border" />}

      {/* ─── GSC Section ──────────────────────────────────────────────── */}
      {summary.gsc && (
        <section className="space-y-4">
          <SectionHeader title="Google Search Console" subtitle="Consultas, impresiones, posición promedio" />

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiTile label="Clics totales" value={summary.gsc.clicks} icon={MousePointer2} color={TEAL} sparkData={timeseries?.gscClicks} />
            <KpiTile label="Impresiones" value={summary.gsc.impressions} icon={Eye} color={PURPLE} sparkData={timeseries?.gscImpressions} />
            <KpiTile label="CTR promedio" value={summary.gsc.ctr} icon={Percent} color={AMBER} sparkData={timeseries?.gscCtr} fmt={(n) => `${n.toFixed(2)}%`} />
            <KpiTile label="Posición prom." value={summary.gsc.avgPosition} icon={MapPin} color="#64748b" sparkData={timeseries?.gscPosition} fmt={(n) => n.toFixed(1)} />
          </div>

          {/* GSC trend chart */}
          {gscChart.length > 1 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-4">
                  Tendencia SEO
                  <span className="text-xs font-normal text-muted-foreground ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded inline-block" style={{ backgroundColor: TEAL }} /> Clics</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded inline-block" style={{ backgroundColor: PURPLE }} /> Impresiones</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={gscChart} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gClics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} /><stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gImpr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} /><stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={28} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area yAxisId="right" type="monotone" dataKey="Impresiones" stroke={PURPLE} strokeWidth={2} fill="url(#gImpr)" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="Clics" stroke={TEAL} strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top queries + Top pages */}
          {(topQueries?.length || topPages?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topQueries && topQueries.length > 0 && (
                <GscTable title="Top Consultas" rows={topQueries.map((q) => ({ label: q.query, ...q }))} maxClicks={maxQClicks} />
              )}
              {topPages && topPages.length > 0 && (
                <GscTable
                  title="Top Páginas"
                  rows={topPages.map((p) => ({ label: p.page.replace(/^https?:\/\/[^/]+/, ""), ...p }))}
                  maxClicks={maxPClicks}
                />
              )}
            </div>
          )}

          {/* Countries + Query detail */}
          {(countries?.length || topQueries?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {countries && countries.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" /> Países
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {countries.map((c, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="uppercase font-mono text-foreground">{c.country}</span>
                          <span className="font-semibold text-primary">{c.clicks}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(c.clicks / maxCClicks) * 100}%`, backgroundColor: TEAL }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {topQueries && topQueries.length > 0 && <QueryDetailTable rows={topQueries} />}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
