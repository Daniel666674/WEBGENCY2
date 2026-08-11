import { NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, pipelineStages, proposals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export async function GET() {
  const denied = await requireApi("revenue");
  if (denied) return denied;

  // Active clients — contacts with client_status = 'active_client'
  const activeClients = await db
    .select()
    .from(contacts)
    .where(eq(contacts.clientStatus, "active_client"))
    .all();

  const mrr = activeClients.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);
  const arr = mrr * 12;

  // Pipeline value — deals not in won/lost stages
  const stages = await db.select().from(pipelineStages).all();
  const wonLostIds = stages.filter((s) => s.isWon || s.isLost).map((s) => s.id);

  const allDeals = await db.select().from(deals).all();
  const activeDeals = allDeals.filter((d) => !wonLostIds.includes(d.stageId));
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipeline = activeDeals.reduce(
    (sum, d) => sum + Math.round((d.value * d.probability) / 100),
    0
  );

  // Upcoming payments (next 30 days)
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400 * 1000);

  const upcomingPayments = activeClients
    .filter((c) => {
      if (!c.nextPaymentDate) return false;
      const d = c.nextPaymentDate instanceof Date ? c.nextPaymentDate : new Date((c.nextPaymentDate as number) * 1000);
      return d >= now && d <= in30;
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      monthlyPayment: c.monthlyPayment,
      nextPaymentDate: c.nextPaymentDate,
    }))
    .sort((a, b) => {
        const da = a.nextPaymentDate instanceof Date ? a.nextPaymentDate.getTime() : ((a.nextPaymentDate as unknown as number) ?? 0) * 1000;
      const db2 = b.nextPaymentDate instanceof Date ? b.nextPaymentDate.getTime() : ((b.nextPaymentDate as unknown as number) ?? 0) * 1000;
      return da - db2;
    });

  // Client breakdown by status
  const allContacts = await db.select().from(contacts).all();
  const statusCounts = {
    prospect: 0,
    proposal_sent: 0,
    active_client: 0,
    churned: 0,
  };
  for (const c of allContacts) {
    const s = (c.clientStatus || "prospect") as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  }

  // MRR history: reconstructed from real signedDate + monthlyPayment of each
  // active client (no invented figures — a client counts toward a month's MRR
  // once they've signed, same as real accrual accounting)
  const mrrHistory: Array<{ month: string; mrr: number; arr: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthMrr = activeClients.reduce((sum, c) => {
      if (!c.signedDate) return sum;
      const signed = c.signedDate instanceof Date ? c.signedDate : new Date((c.signedDate as unknown as number) * 1000);
      return signed <= monthEnd ? sum + (c.monthlyPayment || 0) : sum;
    }, 0);
    mrrHistory.push({
      month: MONTH_LABELS[monthEnd.getMonth()],
      mrr: monthMrr,
      arr: monthMrr * 12,
    });
  }

  // Plan distribution — real plan names from each active client's latest proposal
  const allProposals = await db.select().from(proposals).all();
  const planCounts: Record<string, number> = {};
  for (const client of activeClients) {
    const clientProposals = allProposals
      .filter((p) => p.contactId === client.id)
      .sort((a, b) => {
        const at = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt);
        const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt);
        return bt - at;
      });
    const plan = clientProposals[0]?.planName || "Sin plan";
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  }
  const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }));

  return NextResponse.json({
    mrr,
    arr,
    pipelineValue,
    weightedPipeline,
    activeClientsCount: activeClients.length,
    mrrHistory,
    planDistribution,
    activeClients: activeClients.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      monthlyPayment: c.monthlyPayment,
      signedDate: c.signedDate,
      nextPaymentDate: c.nextPaymentDate,
      clientStatus: c.clientStatus,
    })),
    upcomingPayments,
    statusCounts,
  });
}
