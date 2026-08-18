import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { automationRuns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { getAutomationsConfig } from "@/lib/automations";
import { loadAutomationInput } from "@/lib/automationData";
import { applyAutomations, planAutomations } from "@/lib/automationEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The last 30 things the engine actually did. */
export async function GET() {
  const denied = await requireApi("settings_automatizaciones");
  if (denied) return denied;

  const runs = await db
    .select()
    .from(automationRuns)
    .orderBy(desc(automationRuns.createdAt))
    .limit(30)
    .all();

  return NextResponse.json({ runs }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Runs the engine on demand.
 *
 * Defaults to a dry run: the caller has to ask for a real one explicitly.
 * A rule that creates onboarding projects is not something to trigger by
 * accidentally clicking the wrong button.
 */
export async function POST(request: NextRequest) {
  const denied = await requireApi("settings_automatizaciones", { ownerOnly: true });
  if (denied) return denied;

  let body: { dryRun?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // No body — dry run, per the default below.
  }
  const dryRun = body.dryRun !== false;

  const config = await getAutomationsConfig();
  if (!config.masterEnabled && !dryRun) {
    return NextResponse.json({ error: "Las automatizaciones están apagadas" }, { status: 400 });
  }

  const input = await loadAutomationInput();
  const plan = planAutomations(input, config);
  const result = await applyAutomations(plan, { dryRun, now: input.now });

  if (!dryRun && result.applied.length > 0) {
    await logAudit(request, "automations_manual_run", "automations", "manual", {
      applied: result.applied.length,
      skipped: result.skipped.length,
    });
  }

  return NextResponse.json({
    dryRun,
    planned: plan.length,
    applied: result.applied.map(summarize),
    skipped: result.skipped.map(summarize),
    alerts: result.alerts,
  });
}

function summarize(a: { ruleId: string; label: string; entity: { type: string; id: string; name: string } }) {
  return { ruleId: a.ruleId, label: a.label, entity: a.entity };
}
