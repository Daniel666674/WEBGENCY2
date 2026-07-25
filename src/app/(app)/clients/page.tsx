"use client";

import { useState, useEffect, useMemo } from "react";
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
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/constants";
import { UserCheck, DollarSign, Calendar, Download, Filter, Search, Phone, Mail, Users, FileText, Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";

interface Client {
  id: string;
  name: string;
  company: string | null;
  monthlyPayment: number | null;
  signedDate: number | Date | null;
  nextPaymentDate: number | Date | null;
  clientStatus: string;
}

interface RevenueData {
  mrr: number;
  arr: number;
  activeClients: Client[];
  mrrHistory: Array<{ month: string; mrr: number; arr: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  contactId: string | null;
  contactName: string | null;
  createdAt: number | Date;
}

const PLAN_COLORS = ["var(--primary)", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  follow_up: Clock,
};

export default function ClientsPage() {
  const router = useRouter();
  const [data, setData] = useState<RevenueData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/revenue").then((r) => r.json()),
      fetch("/api/activities").then((r) => r.json()).catch(() => []),
      new Promise((r) => setTimeout(r, 1200)),
    ])
      .then(([revenueData, activitiesData]) => {
        setData(revenueData);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const clients = useMemo(() => data?.activeClients || [], [data]);
  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.company || "").toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  const clientIds = useMemo(() => new Set(clients.map((c) => c.id)), [clients]);
  const recentClientActivities = activities
    .filter((a) => a.contactId && clientIds.has(a.contactId))
    .slice(0, 5);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : Number(d));
  const clientsThisMonth = clients.filter((c) => c.signedDate && toMs(c.signedDate) >= monthStart).length;

  const mrr = data?.mrr ?? 0;
  const arr = data?.arr ?? 0;
  const planTotal = (data?.planDistribution || []).reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes Activos</h1>
          <p className="text-muted-foreground">Gestión de cuentas y pagos recurrentes</p>
        </div>
        <span className="flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(now.getTime())}
        </span>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando clientes..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile
              icon={UserCheck}
              label="Clientes Activos"
              value={clients.length}
              subtext={clientsThisMonth > 0 ? `+${clientsThisMonth} este mes` : "Sin nuevos este mes"}
              color="green"
            />
            <StatTile icon={DollarSign} label="MRR" value={formatCurrency(mrr)} subtext="Ingreso mensual recurrente" color="primary" highlight />
            <StatTile icon={Calendar} label="ARR" value={formatCurrency(arr)} subtext="Ingreso anual recurrente" color="purple" />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes activos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open("/api/export?type=contacts")}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="Sin clientes activos"
                  description='Cambia el status de un contacto a "Cliente activo" para verlo aquí.'
                />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Pago Mensual</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha Firma</TableHead>
                        <TableHead className="hidden md:table-cell">Próximo Pago</TableHead>
                        <TableHead className="hidden lg:table-cell">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow
                          key={client.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/contacts/${client.id}`)}
                        >
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.company || "—"}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            {client.monthlyPayment ? formatCurrency(client.monthlyPayment) : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {client.signedDate ? formatDate(client.signedDate) : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {client.nextPaymentDate ? formatDate(client.nextPaymentDate) : "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge className="bg-green-100 text-green-700 border-green-200">Activo</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground px-3 py-2">
                    Mostrando {filteredClients.length} de {clients.length} cliente
                    {clients.length !== 1 ? "s" : ""} activo{clients.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Ingresos recurrentes</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.mrrHistory || []).every((m) => m.mrr === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    Sin historial de ingresos aún.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data?.mrrHistory} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                      />
                      <Area type="monotone" dataKey="mrr" name="MRR" stroke="var(--primary)" fill="url(#mrrFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución por plan</CardTitle>
              </CardHeader>
              <CardContent>
                {planTotal === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Sin planes asignados aún.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={data?.planDistribution}
                          dataKey="count"
                          nameKey="plan"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {(data?.planDistribution || []).map((_, i) => (
                            <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {(data?.planDistribution || []).map((p, i) => (
                        <div key={p.plan} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                            />
                            <span>{p.plan}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {p.count} ({Math.round((p.count / planTotal) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Actividad reciente</CardTitle>
              </CardHeader>
              <CardContent>
                {recentClientActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No hay actividad reciente</p>
                ) : (
                  <div className="space-y-4">
                    {recentClientActivities.map((a) => {
                      const Icon = typeIcons[a.type] || FileText;
                      return (
                        <div key={a.id} className="flex items-start gap-3">
                          <div className="rounded-full bg-muted p-2 shrink-0">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{a.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.contactName} &middot; {formatRelativeDate(a.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximos pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.filter((c) => c.nextPaymentDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No hay cobros programados</p>
                ) : (
                  <div className="space-y-2">
                    {clients
                      .filter((c) => c.nextPaymentDate)
                      .sort((a, b) => toMs(a.nextPaymentDate) - toMs(b.nextPaymentDate))
                      .slice(0, 5)
                      .map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded-lg border">
                          <span className="truncate">{c.name}</span>
                          <span className="font-semibold text-primary shrink-0 ml-2">
                            {formatCurrency(c.monthlyPayment || 0)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
