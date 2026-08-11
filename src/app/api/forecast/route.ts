import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals, contacts, pipelineStages, activities, crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

const GOAL_KEY = "monthly_revenue_goal";
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : d ? Number(d) : null);

export async function GET() {
  const denied = await requireApi("forecast");
  if (denied) return denied;

  const stages = await db.select().from(pipelineStages).all();
  const wonLostIds = new Set(stages.filter((s) => s.isWon || s.isLost).map((s) => s.id));
  const stageById = new Map(stages.map((s) => [s.id, s]));

  const allDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      contactId: deals.contactId,
      expectedClose: deals.expectedClose,
      probability: deals.probability,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactName: contacts.name,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .all();

  const openDeals = allDeals.filter((d) => !wonLostIds.has(d.stageId));
  const wonDeals = allDeals.filter((d) => stageById.get(d.stageId)?.isWon);

  const pipelineTotal = openDeals.reduce((s, d) => s + d.value, 0);
  const forecast = openDeals.reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);
  const winRate = allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0;

  // Historical reconstruction (real, from each deal's createdAt) — same honest
  // accrual technique used for MRR history: a deal counts toward a month's
  // pipeline once it existed, evaluated against deals still open today.
  const now = new Date();
  const pipelineHistory: Array<{ month: string; pipeline: number; forecast: number; winRate: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const dealsByThen = openDeals.filter((d) => (toMs(d.createdAt) ?? 0) <= monthEnd.getTime());
    const allByThen = allDeals.filter((d) => (toMs(d.createdAt) ?? 0) <= monthEnd.getTime());
    const wonByThen = allByThen.filter((d) => stageById.get(d.stageId)?.isWon);
    pipelineHistory.push({
      month: MONTH_LABELS[monthEnd.getMonth()],
      pipeline: dealsByThen.reduce((s, d) => s + d.value, 0),
      forecast: dealsByThen.reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0),
      winRate: allByThen.length > 0 ? Math.round((wonByThen.length / allByThen.length) * 100) : 0,
    });
  }

  // Trends: this month's new deals vs last month's
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const pctChange = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0);
  const sumIn = (from: number, to: number, weighted: boolean) =>
    allDeals
      .filter((d) => (toMs(d.createdAt) ?? 0) >= from && (toMs(d.createdAt) ?? 0) < to)
      .reduce((s, d) => s + (weighted ? Math.round((d.value * d.probability) / 100) : d.value), 0);
  const forecastTrend = pctChange(sumIn(monthStart, Infinity, true), sumIn(prevMonthStart, monthStart, true));
  const pipelineTrend = pctChange(sumIn(monthStart, Infinity, false), sumIn(prevMonthStart, monthStart, false));
  const wonThisMonth = wonDeals.filter((d) => (toMs(d.updatedAt) ?? 0) >= monthStart).length;
  const totalThisMonth = allDeals.filter((d) => (toMs(d.createdAt) ?? 0) >= monthStart).length;
  const wonLastMonth = wonDeals.filter((d) => (toMs(d.updatedAt) ?? 0) >= prevMonthStart && (toMs(d.updatedAt) ?? 0) < monthStart).length;
  const totalLastMonth = allDeals.filter((d) => (toMs(d.createdAt) ?? 0) >= prevMonthStart && (toMs(d.createdAt) ?? 0) < monthStart).length;
  const winRateThisMonth = totalThisMonth > 0 ? Math.round((wonThisMonth / totalThisMonth) * 100) : 0;
  const winRateLastMonth = totalLastMonth > 0 ? Math.round((wonLastMonth / totalLastMonth) * 100) : 0;
  const winRateTrend = winRateThisMonth - winRateLastMonth;

  // Probability distribution (real, from each open deal)
  const high = openDeals.filter((d) => d.probability >= 70);
  const medium = openDeals.filter((d) => d.probability >= 40 && d.probability < 70);
  const low = openDeals.filter((d) => d.probability < 40);
  const probabilityDistribution = {
    high: { value: high.reduce((s, d) => s + d.value, 0), count: high.length },
    medium: { value: medium.reduce((s, d) => s + d.value, 0), count: medium.length },
    low: { value: low.reduce((s, d) => s + d.value, 0), count: low.length },
  };

  // Funnel: Pipeline total -> Calificado (past first stage) -> Forecast ponderado -> Ingreso esperado próx. 90 días
  const firstStageId = stages.sort((a, b) => a.order - b.order)[0]?.id;
  const qualified = openDeals.filter((d) => d.stageId !== firstStageId);
  const in90Days = now.getTime() + 90 * 86400000;
  const expected90 = openDeals
    .filter((d) => {
      const ec = toMs(d.expectedClose);
      return ec !== null && ec <= in90Days && ec >= now.getTime();
    })
    .reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);

  const funnel = {
    pipelineTotal,
    qualified: qualified.reduce((s, d) => s + d.value, 0),
    forecast,
    expected90,
  };

  // Insights (rule-based on real data, no fabrication)
  const allActivities = await db.select().from(activities).all();
  const twelveDaysAgo = now.getTime() - 12 * 86400000;
  const staleDeals = openDeals.filter((d) => {
    const lastActivity = allActivities
      .filter((a) => a.dealId === d.id)
      .reduce((max, a) => Math.max(max, toMs(a.createdAt) ?? 0), 0);
    const reference = Math.max(lastActivity, toMs(d.createdAt) ?? 0);
    return reference < twelveDaysAgo;
  });

  const topOpen = [...openDeals].sort((a, b) => b.value - a.value)[0];
  const soonestClosing = openDeals
    .filter((d) => toMs(d.expectedClose) !== null && (toMs(d.expectedClose) as number) >= now.getTime())
    .sort((a, b) => (toMs(a.expectedClose) as number) - (toMs(b.expectedClose) as number))[0];

  const insights = [];
  if (topOpen) {
    insights.push({
      type: "top-deal",
      icon: "flame",
      title: `Si ${topOpen.title} cierra`,
      subtitle: "tu forecast aumentaría",
      delta: topOpen.value,
      dealId: topOpen.id,
    });
  }
  if (staleDeals.length > 0) {
    insights.push({
      type: "stale",
      icon: "warning",
      title: `${staleDeals.length} deal${staleDeals.length > 1 ? "s están" : " está"} estancado${staleDeals.length > 1 ? "s" : ""}`,
      subtitle: "Sin actividad en los últimos 12 días",
      delta: null,
      dealId: null,
    });
  }
  if (soonestClosing) {
    const days = Math.ceil(((toMs(soonestClosing.expectedClose) as number) - now.getTime()) / 86400000);
    insights.push({
      type: "closing-soon",
      icon: "bulb",
      title: `${soonestClosing.title} cierra en ${days} día${days !== 1 ? "s" : ""}`,
      subtitle: "Prepara el cierre",
      delta: null,
      dealId: soonestClosing.id,
    });
  }

  // Top opportunities (real, sorted by value — no fabricated owner field)
  const topOpportunities = [...openDeals]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((d) => {
      const nextActivity = allActivities
        .filter((a) => a.dealId === d.id && !a.completedAt && toMs(a.scheduledAt) !== null && (toMs(a.scheduledAt) as number) >= now.getTime())
        .sort((a, b) => (toMs(a.scheduledAt) as number) - (toMs(b.scheduledAt) as number))[0];
      return {
        id: d.id,
        title: d.title,
        contactName: d.contactName,
        value: d.value,
        probability: d.probability,
        expectedClose: d.expectedClose,
        nextActivityType: nextActivity?.type ?? null,
      };
    });

  // Forecast by month (próximos 6 meses) — real, from open deals' expectedClose
  const forecastByMonth: Array<{ month: string; value: number }> = [];
  for (let i = 0; i < 6; i++) {
    const mStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0, 23, 59, 59);
    const value = openDeals
      .filter((d) => {
        const ec = toMs(d.expectedClose);
        return ec !== null && ec >= mStart.getTime() && ec <= mEnd.getTime();
      })
      .reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);
    forecastByMonth.push({ month: MONTH_LABELS[mStart.getMonth()], value });
  }

  // Forecast confidence — a transparent composite of real signals (0-100)
  const dealsWithRecentActivity = openDeals.filter((d) => {
    const lastActivity = allActivities
      .filter((a) => a.dealId === d.id)
      .reduce((max, a) => Math.max(max, toMs(a.createdAt) ?? 0), 0);
    return lastActivity >= now.getTime() - 14 * 86400000;
  }).length;
  const activityScore = openDeals.length > 0 ? (dealsWithRecentActivity / openDeals.length) * 100 : 0;
  const winRateScore = winRate;
  const avgDealAgeDays =
    openDeals.length > 0
      ? openDeals.reduce((s, d) => s + (now.getTime() - (toMs(d.createdAt) ?? now.getTime())) / 86400000, 0) / openDeals.length
      : 0;
  const freshnessScore = Math.max(0, 100 - avgDealAgeDays);
  const confidence = Math.round((activityScore + winRateScore + freshnessScore) / 3);

  // Monthly goal (real, user-set — never a fabricated number)
  const goalRow = await db.select().from(crmSettings).where(eq(crmSettings.key, GOAL_KEY)).get();
  const monthlyGoal = goalRow ? Number(goalRow.value) : null;

  return NextResponse.json({
    forecast,
    pipelineTotal,
    winRate,
    forecastTrend,
    pipelineTrend,
    winRateTrend,
    pipelineHistory,
    probabilityDistribution,
    funnel,
    insights,
    topOpportunities,
    forecastByMonth,
    confidence,
    monthlyGoal,
  });
}

export async function PUT(request: NextRequest) {
  const denied = await requireApi("forecast");
  if (denied) return denied;

  let body: { monthlyGoal?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (typeof body.monthlyGoal !== "number" || body.monthlyGoal < 0) {
    return NextResponse.json({ error: "monthlyGoal invalido" }, { status: 400 });
  }
  await db
    .insert(crmSettings)
    .values({ key: GOAL_KEY, value: String(body.monthlyGoal) })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value: String(body.monthlyGoal) } });
  return NextResponse.json({ ok: true });
}
