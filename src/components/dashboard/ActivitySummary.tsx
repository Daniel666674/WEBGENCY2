"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface DayPoint {
  day: string;
  leads: number;
  propuestas: number;
  reuniones: number;
  negociaciones: number;
}

interface ActivitySummaryProps {
  data: DayPoint[];
  totals: { leads: number; propuestas: number; reuniones: number; negociaciones: number };
}

const SERIES: Array<{ key: keyof ActivitySummaryProps["totals"]; label: string; color: string }> = [
  { key: "leads", label: "Leads creados", color: "var(--primary)" },
  { key: "propuestas", label: "Propuestas enviadas", color: "#f59e0b" },
  { key: "reuniones", label: "Reuniones", color: "#22c55e" },
  { key: "negociaciones", label: "Negociaciones", color: "#3b82f6" },
];

export function ActivitySummary({ data, totals }: ActivitySummaryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Resumen de Actividad
        </CardTitle>
        <span className="text-xs text-muted-foreground border rounded-md px-2 py-1">
          Últimos 7 días
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                />
                {SERIES.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    fill={`url(#fill-${s.key})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-row flex-wrap lg:flex-col gap-3 lg:gap-4 lg:w-48 shrink-0 lg:justify-center">
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground flex-1">{s.label}</span>
                <span className="font-semibold">{totals[s.key]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
