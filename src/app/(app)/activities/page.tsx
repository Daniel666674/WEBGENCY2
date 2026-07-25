"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  Users,
  FileText,
  Clock,
  AlertCircle,
  Activity,
  Plus,
  Filter,
  ExternalLink,
  Lightbulb,
  Bell,
} from "lucide-react";
import { formatRelativeDate, formatDate } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/constants";
import type { ActivityType } from "@/types";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  follow_up: Clock,
};

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  contactName: string | null;
  contactId: string;
  dealId: string | null;
  scheduledAt: number | Date | null;
  completedAt: number | Date | null;
  createdAt: number | Date;
}

interface FollowUps {
  overdue: ActivityItem[];
  today: ActivityItem[];
  upcoming: ActivityItem[];
  unscheduled: ActivityItem[];
}

const FILTERS = ["Todas", "Pendientes", "Completadas", "Vencidas"] as const;
type FilterTab = (typeof FILTERS)[number];

const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : d ? Number(d) : null);

function activityStatus(a: ActivityItem, now: number): "completada" | "vencida" | "pendiente" {
  if (a.completedAt) return "completada";
  const sched = toMs(a.scheduledAt);
  if (sched !== null && sched < now) return "vencida";
  return "pendiente";
}

export default function ActivitiesPage() {
  const [allActivities, setActivities] = useState<ActivityItem[]>([]);
  const [followUps, setFollowUps] = useState<FollowUps | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("Todas");
  const [visibleCount, setVisibleCount] = useState(6);

  const loadData = async () => {
    try {
      const [actsRes, fupsRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/followups"),
      ]);
      if (!actsRes.ok || !fupsRes.ok) throw new Error("Error al cargar");
      setActivities(await actsRes.json());
      setFollowUps(await fupsRes.json());
    } catch {
      toast.error("Error al cargar las actividades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;

  const last30Days = useMemo(
    () => allActivities.filter((a) => toMs(a.createdAt)! >= thirtyDaysAgo),
    [allActivities, thirtyDaysAgo]
  );
  const completadas30 = last30Days.filter((a) => activityStatus(a, now) === "completada").length;
  const vencidas30 = last30Days.filter((a) => activityStatus(a, now) === "vencida").length;
  const pendientes30 = last30Days.filter((a) => activityStatus(a, now) === "pendiente").length;
  const total30 = completadas30 + vencidas30 + pendientes30;

  const filteredActivities = useMemo(() => {
    const withStatus = allActivities.map((a) => ({ ...a, status: activityStatus(a, now) }));
    if (filter === "Todas") return withStatus;
    if (filter === "Pendientes") return withStatus.filter((a) => a.status === "pendiente");
    if (filter === "Completadas") return withStatus.filter((a) => a.status === "completada");
    return withStatus.filter((a) => a.status === "vencida");
  }, [allActivities, filter, now]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
        </div>
        <DogSpinnerPage label="Cargando actividades..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">
            Historial de interacciones y seguimientos pendientes
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Registrar
        </Button>
      </div>

      <ActivityForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          loadData();
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={followUps && followUps.overdue.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Vencidos {followUps ? `(${followUps.overdue.length})` : ""}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Actividades que requieren tu atención</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {!followUps || followUps.overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin actividades vencidas</p>
            ) : (
              <>
                {followUps.overdue.slice(0, 3).map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-destructive/5 border-l-2 border-destructive text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{f.description}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {f.contactName} &middot; {formatDate(f.scheduledAt)}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-[10px] shrink-0">Vencido</Badge>
                  </div>
                ))}
                <button
                  onClick={() => setFilter("Vencidas")}
                  className="text-xs text-destructive font-medium hover:underline flex items-center gap-1"
                >
                  Ver todas las vencidas →
                </button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Resumen
            </CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 shrink-0 relative">
                {total30 === 0 ? (
                  <div className="w-full h-full rounded-full border-8 border-muted flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Sin datos</span>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Completadas", value: completadas30, color: "#22c55e" },
                            { name: "Pendientes", value: pendientes30, color: "#f59e0b" },
                            { name: "Vencidas", value: vencidas30, color: "#ef4444" },
                          ]}
                          dataKey="value"
                          innerRadius={45}
                          outerRadius={62}
                          paddingAngle={2}
                        >
                          {[
                            { color: "#22c55e" },
                            { color: "#f59e0b" },
                            { color: "#ef4444" },
                          ].map((c, i) => (
                            <Cell key={i} fill={c.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold">{total30}</span>
                      <span className="text-[10px] text-muted-foreground">Actividades</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />Completadas</span>
                  <span className="font-semibold">{completadas30}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Pendientes</span>
                  <span className="font-semibold">{pendientes30}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Vencidas</span>
                  <span className="font-semibold">{vencidas30}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </CardHeader>
        <CardContent>
          <h3 className="text-sm font-semibold mb-3">Todas las Actividades</h3>
          {filteredActivities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No hay actividades"
              description="Las actividades aparecen cuando registras llamadas, emails, reuniones o notas."
            />
          ) : (
            <>
              <div className="space-y-3">
                {filteredActivities.slice(0, visibleCount).map((activity) => {
                  const Icon = typeIcons[activity.type] || FileText;
                  const config = ACTIVITY_TYPE_CONFIG[activity.type as ActivityType];
                  const statusBadge =
                    activity.status === "vencida"
                      ? { label: "Vencida", className: "bg-red-100 text-red-700" }
                      : activity.status === "completada"
                      ? { label: "Completada", className: "bg-green-100 text-green-700" }
                      : { label: "Pendiente", className: "bg-amber-100 text-amber-700" };

                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="rounded-full bg-muted p-2 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`text-[10px] ${statusBadge.className}`}>{statusBadge.label}</Badge>
                          <span className="text-xs text-muted-foreground">{activity.contactName}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {config?.label || activity.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeDate(activity.createdAt)}
                        </p>
                      </div>
                      {activity.dealId && (
                        <Link
                          href={`/deals/${activity.dealId}`}
                          className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
                        >
                          Ver deal <ExternalLink className="h-3 w-3 ml-1.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
              {visibleCount < filteredActivities.length && (
                <button
                  onClick={() => setVisibleCount((c) => c + 6)}
                  className="w-full mt-4 text-sm text-primary font-medium hover:underline text-center"
                >
                  Cargar más actividades
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg border bg-amber-500/5 border-amber-500/20 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-amber-700">Consejo:</span> Mantén tus actividades al día para no perder ninguna oportunidad.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Bell className="h-4 w-4 mr-2" />
          Gestionar recordatorios
        </Button>
      </div>
    </div>
  );
}
