import Link from "next/link";
import { db } from "@/db";
import { contacts, deals, activities, pipelineStages, proposals } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { FunnelHorizontal } from "@/components/dashboard/FunnelHorizontal";
import { HotLeadCards } from "@/components/dashboard/HotLeadCards";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { AgendaToday } from "@/components/dashboard/AgendaToday";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { ClientLifetimeValue } from "@/components/dashboard/ClientLifetimeValue";
import { NotificationBanner } from "@/components/dashboard/NotificationBanner";
import { GreetingHeading } from "@/components/dashboard/GreetingHeading";
import { NextBestActions } from "@/components/dashboard/NextBestActions";
import { StatTile } from "@/components/shared/StatTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import { Flame, DollarSign, Users, FileText, UserCheck, Gauge, Calendar as CalendarIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allContacts = await db.select().from(contacts).all();
  const allDeals = await db.select().from(deals).all();
  const stages = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all();

  // Deal segments
  const wonDeals = allDeals.filter((d) => stages.find((s) => s.id === d.stageId)?.isWon);

  // Contact segments
  const activeClients = allContacts.filter((c) => c.clientStatus === "active_client");
  const proposalSent = allContacts.filter((c) => c.clientStatus === "proposal_sent");
  const withMockup = allContacts.filter((c) => c.mockupUrl);
  const mockupsUnsent = allContacts.filter(
    (c) => c.mockupUrl && c.clientStatus === "prospect"
  ).length;

  // Revenue
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);
  const arr = mrr * 12;
  const conversionRate =
    allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0;

  // Hot leads: score ≥ 50 or temperature hot, not active clients
  const hotLeads = allContacts
    .filter((c) => (c.score >= 50 || c.temperature === "hot") && c.clientStatus !== "active_client")
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  // Upcoming payments (next 45 days)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const upcomingPayments = activeClients
    .filter((c) => c.nextPaymentDate && c.monthlyPayment)
    .map((c) => {
      const date =
        c.nextPaymentDate instanceof Date
          ? c.nextPaymentDate
          : new Date((c.nextPaymentDate as unknown) as number);
      return {
        id: c.id,
        name: c.name,
        company: c.company,
        monthlyPayment: c.monthlyPayment!,
        nextPaymentDate: date.getTime(),
        daysUntil: Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    })
    .filter((p) => p.daysUntil <= 45)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  const totalThisMonth = activeClients
    .filter((c) => {
      if (!c.nextPaymentDate) return false;
      const d =
        c.nextPaymentDate instanceof Date
          ? c.nextPaymentDate
          : new Date((c.nextPaymentDate as unknown) as number);
      return d >= startOfMonth && d <= endOfMonth;
    })
    .reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);

  // Month-over-month trends (real createdAt-based counts, no fabricated data)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : Number(d));

  const pctChange = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

  const dayStartOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const todayStart = dayStartOf(now);
  const weekAgoStart = todayStart - 6 * 86400000;
  const twoWeeksAgoStart = todayStart - 13 * 86400000;

  const contactsToday = allContacts.filter((c) => toMs(c.createdAt) >= todayStart).length;
  const contactsThisMonth = allContacts.filter((c) => toMs(c.createdAt) >= monthStart).length;
  const contactsLastMonth = allContacts.filter(
    (c) => toMs(c.createdAt) >= prevMonthStart && toMs(c.createdAt) < monthStart
  ).length;
  const proposalsThisWeek = proposalSent.filter((c) => toMs(c.createdAt) >= weekAgoStart).length;
  const proposalsLastWeek = proposalSent.filter(
    (c) => toMs(c.createdAt) >= twoWeeksAgoStart && toMs(c.createdAt) < weekAgoStart
  ).length;
  const clientsToday = activeClients.filter((c) => toMs(c.createdAt) >= todayStart).length;
  const avgScore =
    allContacts.length > 0
      ? Math.round(allContacts.reduce((sum, c) => sum + c.score, 0) / allContacts.length)
      : 0;
  // Score trend: avg score of contacts already on file before this month vs. everyone now
  const olderContacts = allContacts.filter((c) => toMs(c.createdAt) < monthStart);
  const avgScoreOlder =
    olderContacts.length > 0
      ? olderContacts.reduce((sum, c) => sum + c.score, 0) / olderContacts.length
      : avgScore;

  const leadsMonthTrend = pctChange(contactsThisMonth, contactsLastMonth);
  const proposalsWeekTrend = proposalsThisWeek - proposalsLastWeek;
  const scoreTrend = pctChange(avgScore, Math.round(avgScoreOlder));

  // Resumen de Actividad: real counts per day for the last 7 days
  const allActivitiesForTrend = await db
    .select({ id: activities.id, type: activities.type, createdAt: activities.createdAt })
    .from(activities)
    .all();
  const allProposalsForTrend = await db
    .select({ id: proposals.id, createdAt: proposals.createdAt, oneTimeFee: proposals.oneTimeFee, monthlyFee: proposals.monthlyFee })
    .from(proposals)
    .all();
  const negotiationStageIds = new Set(
    stages.filter((s) => s.name.toLowerCase().startsWith("negociaci")).map((s) => s.id)
  );

  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const activityTrendData = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + 86400000;
    const inDay = (t: number) => t >= dayStart.getTime() && t < dayEnd;
    return {
      day: dayLabels[dayStart.getDay()],
      leads: allContacts.filter((c) => inDay(toMs(c.createdAt))).length,
      propuestas: allProposalsForTrend.filter((p) => inDay(toMs(p.createdAt))).length,
      reuniones: allActivitiesForTrend.filter((a) => a.type === "meeting" && inDay(toMs(a.createdAt))).length,
      negociaciones: allDeals.filter(
        (d) => negotiationStageIds.has(d.stageId) && inDay(toMs(d.createdAt))
      ).length,
    };
  });
  const activityTotals = activityTrendData.reduce(
    (acc, d) => ({
      leads: acc.leads + d.leads,
      propuestas: acc.propuestas + d.propuestas,
      reuniones: acc.reuniones + d.reuniones,
      negociaciones: acc.negociaciones + d.negociaciones,
    }),
    { leads: 0, propuestas: 0, reuniones: 0, negociaciones: 0 }
  );

  // Client lifetime value: real average setup + monthly fee from actual proposals
  const proposalsWithFees = allProposalsForTrend.filter((p) => p.oneTimeFee > 0 || p.monthlyFee > 0);
  const avgSetupFee =
    proposalsWithFees.length > 0
      ? Math.round(proposalsWithFees.reduce((sum, p) => sum + p.oneTimeFee, 0) / proposalsWithFees.length)
      : 0;
  const avgMonthlyFee =
    proposalsWithFees.length > 0
      ? Math.round(proposalsWithFees.reduce((sum, p) => sum + p.monthlyFee, 0) / proposalsWithFees.length)
      : 0;

  // Pipeline chart
  const pipelineData = stages
    .filter((s) => !s.isLost)
    .map((stage) => ({
      name: stage.name,
      count: allDeals.filter((d) => d.stageId === stage.id).length,
      value: allDeals
        .filter((d) => d.stageId === stage.id)
        .reduce((sum, d) => sum + d.value, 0),
      color: stage.color ?? "#64748b",
    }));

  // Recent activity
  const recentActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      contactName: contacts.name,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .orderBy(desc(activities.createdAt))
    .limit(6)
    .all();

  const bogota: Intl.DateTimeFormatOptions = { timeZone: "America/Bogota" };
  const dateStr = now
    .toLocaleDateString("es-CO", { ...bogota, day: "numeric", month: "short", year: "numeric" })
    .replace(".", "");
  const timeStr = now.toLocaleTimeString("es-CO", { ...bogota, hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────── */}
      <GreetingHeading />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <NotificationBanner />
        <span className="ml-auto flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 text-muted-foreground">
          <CalendarIcon className="h-3.5 w-3.5" />
          {dateStr} &middot; {timeStr} (BOG)
        </span>
      </div>

      {/* ── Next best actions ─────────────────────────── */}
      <NextBestActions limit={6} />

      {/* ── Row 1: Stat tiles ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile
          icon={DollarSign}
          label="MRR Actual"
          value={formatCurrency(mrr)}
          subtext={`ARR ${formatCurrency(arr)}`}
          color="primary"
        />
        <StatTile
          icon={Users}
          label="Leads"
          value={allContacts.length}
          subtext={contactsToday > 0 ? `${contactsToday} nuevos hoy` : `${leadsMonthTrend >= 0 ? "↑" : "↓"}${Math.abs(leadsMonthTrend)}% vs mes anterior`}
          color="blue"
        />
        <StatTile
          icon={FileText}
          label="Propuestas"
          value={proposalSent.length}
          subtext={`${proposalsWeekTrend >= 0 ? "↑" : "↓"}${Math.abs(proposalsWeekTrend)} vs semana anterior`}
          color="amber"
        />
        <StatTile
          icon={UserCheck}
          label="Clientes Activos"
          value={activeClients.length}
          subtext={clientsToday > 0 ? `${clientsToday} nuevo hoy` : `${conversionRate}% tasa de cierre`}
          color="green"
        />
        <StatTile
          icon={Gauge}
          label="Score Promedio"
          value={`${avgScore} /100`}
          subtext={`${scoreTrend >= 0 ? "↑" : "↓"}${Math.abs(scoreTrend)}% vs mes anterior`}
          color="purple"
        />
      </div>

      {/* ── Row 2: Funnel + Pipeline chart ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelHorizontal
          totalLeads={allContacts.length}
          withMockup={withMockup.length}
          proposalSent={proposalSent.length}
          activeClients={activeClients.length}
          mockupsUnsent={mockupsUnsent}
        />
        <PipelineChart data={pipelineData} />
      </div>

      {/* ── Row: Valor del cliente a 3 años ───────────── */}
      {avgSetupFee + avgMonthlyFee > 0 && (
        <ClientLifetimeValue avgSetupFee={avgSetupFee} avgMonthlyFee={avgMonthlyFee} months={36} />
      )}

      {/* ── Row 3: Leads · Agenda · Cobros · Actividad ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Leads Calientes ({hotLeads.length})
            </CardTitle>
            <Link href="/contacts" className="text-xs text-primary hover:underline shrink-0">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            <HotLeadCards
              leads={hotLeads.map((c) => ({
                id: c.id,
                name: c.name,
                company: c.company,
                source: c.source,
                temperature: c.temperature,
                score: c.score,
                mockupUrl: c.mockupUrl,
                siteUrl: c.siteUrl,
                clientStatus: c.clientStatus,
              }))}
            />
          </CardContent>
        </Card>
        <AgendaToday />
        <UpcomingPayments payments={upcomingPayments} totalThisMonth={totalThisMonth} />
        <RecentActivity
          activities={
            recentActivities as Array<{
              id: string;
              type: string;
              description: string;
              contactName: string | null;
              createdAt: number | Date;
            }>
          }
        />
      </div>

      {/* ── Row: Resumen de Actividad (7 días) ────────── */}
      <ActivitySummary data={activityTrendData} totals={activityTotals} />
    </div>
  );
}
