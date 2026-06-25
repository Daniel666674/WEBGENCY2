import { db } from "@/db";
import { contacts, deals, activities, pipelineStages } from "@/db/schema";
import { eq, asc, desc, and, isNotNull } from "drizzle-orm";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { MockupFunnel } from "@/components/dashboard/MockupFunnel";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { HotLeadsTable } from "@/components/dashboard/HotLeadsTable";
import { AgendaToday } from "@/components/dashboard/AgendaToday";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { NotificationBanner } from "@/components/dashboard/NotificationBanner";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const allContacts = db.select().from(contacts).all();
  const allDeals = db.select().from(deals).all();
  const stages = db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all();

  // Deal segmentation
  const activeDeals = allDeals.filter((d) => {
    const s = stages.find((s) => s.id === d.stageId);
    return s && !s.isWon && !s.isLost;
  });
  const wonDeals = allDeals.filter((d) => stages.find((s) => s.id === d.stageId)?.isWon);

  // Client status segmentation
  const activeClients = allContacts.filter((c) => c.clientStatus === "active_client");
  const proposalSent = allContacts.filter((c) => c.clientStatus === "proposal_sent");
  const withMockup = allContacts.filter((c) => c.mockupUrl && c.clientStatus !== "active_client");

  // Revenue
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);
  const arr = mrr * 12;
  const pipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const conversionRate =
    allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0;

  // Hot leads: score >= 50 OR temperature = hot, not yet active clients
  const hotLeads = allContacts.filter(
    (c) => (c.score >= 50 || c.temperature === "hot") && c.clientStatus !== "active_client"
  );

  // Upcoming payments (next 45 days)
  const now = new Date();
  const in45 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const upcomingPayments = activeClients
    .filter((c) => c.nextPaymentDate && c.monthlyPayment)
    .map((c) => {
      const date = c.nextPaymentDate instanceof Date
        ? c.nextPaymentDate
        : new Date((c.nextPaymentDate as unknown) as number);
      const daysUntil = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: c.id,
        name: c.name,
        company: c.company,
        monthlyPayment: c.monthlyPayment!,
        nextPaymentDate: date.getTime(),
        daysUntil,
      };
    })
    .filter((p) => p.daysUntil <= 45)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  const totalThisMonth = activeClients
    .filter((c) => {
      if (!c.nextPaymentDate) return false;
      const d = c.nextPaymentDate instanceof Date ? c.nextPaymentDate : new Date(c.nextPaymentDate as number);
      return d >= startOfMonth && d <= endOfMonth;
    })
    .reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);

  // Pipeline chart data
  const pipelineData = stages
    .filter((s) => !s.isLost)
    .map((stage) => ({
      name: stage.name,
      count: allDeals.filter((d) => d.stageId === stage.id).length,
      value: allDeals.filter((d) => d.stageId === stage.id).reduce((sum, d) => sum + d.value, 0),
      color: stage.color,
    }));

  // Recent activities
  const recentActivities = db
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
    .limit(8)
    .all();

  const today = new Date();
  const dateStr = today.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isFirstRun = allContacts.length === 0 && allDeals.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{dateStr}</p>
      </div>

      {isFirstRun && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold mb-2">Bienvenido a OLIWAN</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tu Revenue Engine está listo. Comienza agregando leads y sus mockups.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-card border">
              <p className="font-medium">1. Personaliza</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ejecuta <code className="bg-muted px-1 rounded">/setup</code>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <p className="font-medium">2. Agrega leads</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ve a Contactos o usa <code className="bg-muted px-1 rounded">/add-lead</code>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <p className="font-medium">3. Sube mockups</p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega la URL del mockup en cada contacto
              </p>
            </div>
          </div>
        </div>
      )}

      <NotificationBanner />

      {/* Row 1: KPIs */}
      <DashboardKPIs
        mrr={mrr}
        arr={arr}
        pipeline={pipeline}
        mockupsActive={withMockup.length}
        hotLeads={hotLeads.length}
        activeClients={activeClients.length}
        conversionRate={conversionRate}
        overdueFollowups={0}
      />

      {/* Row 2: Mockup Funnel + Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MockupFunnel
            totalLeads={allContacts.length}
            withMockup={withMockup.length + activeClients.filter((c) => c.mockupUrl).length}
            proposalSent={proposalSent.length}
            activeClients={activeClients.length}
          />
        </div>
        <div>
          <UpcomingPayments
            payments={upcomingPayments}
            totalThisMonth={totalThisMonth}
          />
        </div>
      </div>

      {/* Row 3: Hot Leads Table */}
      <HotLeadsTable
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

      {/* Row 4: Agenda + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AgendaToday />
        </div>
        <div>
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
      </div>

      {/* Row 5: Pipeline chart */}
      <PipelineChart data={pipelineData} />
    </div>
  );
}
