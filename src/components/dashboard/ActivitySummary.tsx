"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface DayPoint {
  day: string;
  actividades: number;
  leads: number;
}

export function ActivitySummary({ data }: { data: DayPoint[] }) {
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
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="actividadesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
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
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="actividades"
              name="Actividades"
              stroke="var(--primary)"
              fill="url(#actividadesFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads nuevos"
              stroke="#f59e0b"
              fill="url(#leadsFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
