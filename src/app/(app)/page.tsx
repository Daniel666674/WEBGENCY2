import { db } from "@/db";
import { contacts, deals, activities, pipelineStages, projects, projectMilestones } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { MRRHero } from "@/components/dashboard/MRRHero";
import { FunnelHorizontal } from "@/components/dashboard/FunnelHorizontal";
import { HotLeadCards } from "@/components/dashboard/HotLeadCards";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { AgendaToday } from "@/components/dashboard/AgendaToday";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { NotificationBanner } from "@/components/dashboard/NotificationBanner";
import { ActiveProjects } from "@/components/dashboard/ActiveProjects";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allContacts = await db.select().from(contacts).all();
  const allDeals = await db.select().from(deals).all();
  const stages = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all();

  // Deal segments
  const activeDeals = allDeals.filter((d) => {
    const s = stages.find((s) => s.id === d.stageId);
    return s && !s.isWon && !s.isLost;
  });
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
  const pipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
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

  // Active projects (not launched, not paused)
  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      deadline: projects.deadline,
      clientId: projects.clientId,
      clientName: contacts.name,
    })
    .from(projects)
    .leftJoin(contacts, eq(projects.clientId, contacts.id))
    .all();

  const allMilestones = await db.select({ id: projectMilestones.id, projectId: projectMilestones.projectId, completedAt: projectMilestones.completedAt }).from(projectMilestones).all();

  const activeProjects = allProjects
    .filter((p) => p.status !== "launched" && p.status !== "paused")
    .map((p) => {
      const ms = allMilestones.filter((m) => m.projectId === p.id);
      return {
        ...p,
        deadline: p.deadline ? (p.deadline as unknown as Date).getTime?.() ?? Number(p.deadline) : null,
        milestonesTotal: ms.length,
        milestonesCompleted: ms.filter((m) => m.completedAt !== null).length,
      };
    })
    .slice(0, 6);

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

  const dateStr = now.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue Engine</h1>
        <p className="text-muted-foreground capitalize text-sm mt-0.5">{dateStr}</p>
      </div>

      <NotificationBanner />

      {/* ── Row 1: MRR Hero (left) + Funnel (right) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <MRRHero
          mrr={mrr}
          arr={arr}
          activeClients={activeClients.length}
          conversionRate={conversionRate}
          overdueFollowups={0}
        />
        <FunnelHorizontal
          totalLeads={allContacts.length}
          withMockup={withMockup.length}
          proposalSent={proposalSent.length}
          activeClients={activeClients.length}
          mockupsUnsent={mockupsUnsent}
        />
      </div>

      {/* ── Row 2: Hot Lead Cards (horizontal scroll) ─ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Leads Calientes ({hotLeads.length})
          </h2>
        </div>
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
      </div>

      {/* ── Row 3: Agenda · Payments · Projects · Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AgendaToday />
        <UpcomingPayments payments={upcomingPayments} totalThisMonth={totalThisMonth} />
        <ActiveProjects projects={activeProjects} />
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

      {/* ── Row 4: Pipeline chart ─────────────────────── */}
      <PipelineChart data={pipelineData} />
    </div>
  );
}
