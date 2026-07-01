"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";

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
    },
    {
      title: "ARR",
      value: formatCurrency(data.arr),
      icon: TrendingUp,
      description: "Ingreso anual recurrente",
    },
    {
      title: "Pipeline (Ponderado)",
      value: formatCurrency(data.weightedPipeline),
      icon: TrendingUp,
      description: `Total pipeline: ${formatCurrency(data.pipelineValue)}`,
    },
    {
      title: "Clientes Activos",
      value: String(data.activeClientsCount),
      icon: Users,
      description: "Clientes con pagos activos",
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
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
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
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                No hay clientes activos todavia.
              </div>
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

        {/* Status Breakdown — 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(
                Object.keys(STATUS_CONFIG) as Array<keyof StatusCounts>
              ).map((status) => {
                const config = STATUS_CONFIG[status];
                const count = data.statusCounts[status];
                const pct =
                  totalContacts > 0
                    ? Math.round((count / totalContacts) * 100)
                    : 0;

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`}
                      />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total contactos</span>
                  <span>{totalContacts}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
