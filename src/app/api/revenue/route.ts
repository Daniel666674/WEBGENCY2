import { NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, pipelineStages } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";

export async function GET() {
  // Active clients — contacts with client_status = 'active_client'
  const activeClients = db
    .select()
    .from(contacts)
    .where(eq(contacts.clientStatus, "active_client"))
    .all();

  const mrr = activeClients.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);
  const arr = mrr * 12;

  // Pipeline value — deals not in won/lost stages
  const stages = db.select().from(pipelineStages).all();
  const wonLostIds = stages.filter((s) => s.isWon || s.isLost).map((s) => s.id);

  const allDeals = db.select().from(deals).all();
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
  const allContacts = db.select().from(contacts).all();
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

  return NextResponse.json({
    mrr,
    arr,
    pipelineValue,
    weightedPipeline,
    activeClientsCount: activeClients.length,
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
