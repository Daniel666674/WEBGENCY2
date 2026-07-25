"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";

const STATUS_DOT_COLORS = ["var(--primary)", "#f59e0b", "#22c55e", "#ef4444"];

interface ActiveClient {
  id: string;
  name: string;
  company: string | null;
  monthlyPayment: number | null;
  signedDate: number | Date | null;
  nextPaymentDate: number | Date | null;
  clientStatus: string;
}

interface UpcomingPayment {
  id: string;
  name: string;
  company: string | null;
  monthlyPayment: number | null;
  nextPaymentDate: number | Date | null;
}

interface StatusCounts {
  prospect: number;
  proposal_sent: number;
  active_client: number;
  churned: number;
}

interface RevenueData {
  mrr: number;
  arr: number;
  pipelineValue: number;
  weightedPipeline: number;
  activeClientsCount: number;
  activeClients: ActiveClient[];
  upcomingPayments: UpcomingPayment[];
  statusCounts: StatusCounts;
  mrrHistory: Array<{ month: string; mrr: number; arr: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

const STATUS_CONFIG: Record<
  keyof StatusCounts,
  { label: string; dotColor: string }
> = {
  prospect: { label: "Prospectos", dotColor: "bg-gray-400" },
  proposal_sent: { label: "Propuesta enviada", dotColor: "bg-amber-500" },
  active_client: { label: "Clientes activos", dotColor: "bg-green-500" },
  churned: { label: "Perdidos", dotColor: "bg-red-500" },
};

export default function RevenuePage() {
  const router = useRouter();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/revenue")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
          <p className="text-muted-foreground">
            Ingresos recurrentes y proyecciones
          </p>
        </div>

        {/* KPI skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Table + status skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>

        {/* Upcoming payments skeleton */}
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      title: "MRR",
      value: formatCurrency(data.mrr),
      icon: DollarSign,
      description: "Ingreso mensual recurrente",
      color: "primary" as const,
      highlight: true,
    },
    {
      title: "ARR",
      value: formatCurrency(data.arr),
      icon: TrendingUp,
      description: "Ingreso anual recurrente",
      color: "green" as const,
    },
    {
      title: "Pipeline (Ponderado)",
      value: formatCurrency(data.weightedPipeline),
      icon: TrendingUp,
      description: `Total pipeline: ${formatCurrency(data.pipelineValue)}`,
      color: "purple" as const,
    },
    {
      title: "Clientes Activos",
      value: String(data.activeClientsCount),
      icon: Users,
      description: "Clientes con pagos activos",
      color: "amber" as const,
    },
  ];

  const totalContacts = Object.values(data.statusCounts).reduce(
    (sum, n) => sum + n,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">
          Ingresos recurrentes y proyecciones
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StatTile
            key={kpi.title}
            icon={kpi.icon}
            label={kpi.title}
            value={kpi.value}
            subtext={kpi.description}
            color={kpi.color}
            highlight={kpi.highlight}
          />
        ))}
      </div>

      {/* Recurring revenue + status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ingresos recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.mrrHistory.every((m) => m.mrr === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sin historial de ingresos aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.mrrHistory} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="mrrFillRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="arrFillRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                  />
                  <Area type="monotone" dataKey="arr" name="ARR" stroke="#22c55e" fill="url(#arrFillRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="var(--primary)" fill="url(#mrrFillRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de estado de leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={(Object.keys(STATUS_CONFIG) as Array<keyof StatusCounts>).map((s) => ({
                    name: STATUS_CONFIG[s].label,
                    value: data.statusCounts[s],
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {(Object.keys(STATUS_CONFIG) as Array<keyof StatusCounts>).map((s, i) => (
                    <Cell key={s} fill={STATUS_DOT_COLORS[i % STATUS_DOT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2 text-center">
              <p className="text-2xl font-bold">{totalContacts}</p>
              <p className="text-xs text-muted-foreground">Total contactos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Clients Table + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Clients — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Clientes Activos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.activeClients.length === 0 ? (
              <EmptyState icon={Users} title="Sin clientes activos" description="Todavia no hay clientes activos." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Pago Mensual</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Fecha Firma
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Proximo Pago
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.activeClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/contacts/${client.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {client.name}
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>{client.company || "-"}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {client.monthlyPayment
                            ? formatCurrency(client.monthlyPayment)
                            : "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(client.signedDate)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(client.nextPaymentDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen financiero — 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "MRR actual", value: formatCurrency(data.mrr), color: "text-primary" },
                { label: "ARR actual", value: formatCurrency(data.arr), color: "text-green-600" },
                { label: "Pipeline total", value: formatCurrency(data.pipelineValue), color: "" },
                { label: "Pipeline ponderado", value: formatCurrency(data.weightedPipeline), color: "" },
                {
                  label: "Conversión pipeline",
                  value: `${data.pipelineValue > 0 ? Math.round((data.weightedPipeline / data.pipelineValue) * 100) : 0}%`,
                  color: "text-amber-600",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" disabled>
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver reporte financiero
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              Object.keys(STATUS_CONFIG) as Array<keyof StatusCounts>
            ).map((status) => {
              const config = STATUS_CONFIG[status];
              const count = data.statusCounts[status];
              const pct = totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0;

              return (
                <div key={status} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`} />
                    <span className="text-sm">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Proximos Pagos (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pagos programados en los proximos 30 dias.
            </p>
          ) : (
            <div className="space-y-3">
              {data.upcomingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{payment.name}</span>
                    {payment.company && (
                      <span className="text-xs text-muted-foreground">
                        {payment.company}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-primary">
                      {payment.monthlyPayment
                        ? formatCurrency(payment.monthlyPayment)
                        : "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(payment.nextPaymentDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
