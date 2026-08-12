import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, activities, proposals, projects, projectTasks, pipelineStages, demoPages, nbaDismissals } from "@/db/schema";
import { gt } from "drizzle-orm";
import { computeNextBestActions, urgencyOf, type NextBestAction } from "@/lib/nba";
import { sendMail, getDigestEmail } from "@/lib/mailer";
import { formatCurrency } from "@/lib/constants";
import { getAutomationsConfig } from "@/lib/automations";
import { loadAutomationInput } from "@/lib/automationData";
import { applyAutomations, planAutomations } from "@/lib/automationEngine";
import { getBusinessProfile } from "@/lib/businessConfig";
import { getNotificationConfig } from "@/lib/notificationConfig";
import {
  getPaymentAutomationConfig,
  isWhatsAppConfigured,
  sendWhatsAppToNotifyNumbers,
} from "@/lib/paymentAutomation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The daily heartbeat.
 *
 * Everything the CRM knows was previously passive: the NBA list, overdue
 * follow-ups and payment dates only existed once somebody opened the app.
 * This is the one scheduled job that pushes instead of waiting — it runs the
 * same NBA engine the dashboard uses and delivers the top of the list by
 * email, plus a WhatsApp ping when money is actually late.
 *
 * Scheduled from vercel.json. Vercel signs cron requests with
 * `Authorization: Bearer $CRON_SECRET`; `x-cron-secret` is accepted too so
 * the job can be triggered by hand or from another scheduler.
 */
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed: with no secret configured, nobody can trigger this.
  if (!secret) return false;
  if (request.headers.get("x-cron-secret") === secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function actionRow(a: NextBestAction): string {
  const color = urgencyOf(a.score) === "critical" ? "#dc2626" : urgencyOf(a.score) === "high" ? "#d97706" : "#6b7280";
  const value = a.valueCents ? ` &middot; <strong>${formatCurrency(a.valueCents)}</strong>` : "";
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;vertical-align:top;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;"></span>
      <strong style="font-size:14px;color:#111827;">${a.title}</strong>${value}
      <div style="margin:4px 0 0 16px;font-size:13px;color:#6b7280;line-height:1.5;">${a.reason}</div>
    </td>
  </tr>`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── Automations run first ─────────────────────────────
  // Deliberately before the NBA snapshot below: a follow-up the engine
  // creates this morning should show up in this morning's digest, not
  // tomorrow's.
  const [automationsConfig, notifications, business] = await Promise.all([
    getAutomationsConfig(),
    getNotificationConfig(),
    getBusinessProfile(),
  ]);
  let automation = { applied: [] as { label: string }[], alerts: [] as { channel: string; text: string }[] };
  if (automationsConfig.masterEnabled) {
    const input = await loadAutomationInput();
    const plan = planAutomations(input, automationsConfig);
    const res = await applyAutomations(plan, { now: input.now });
    automation = { applied: res.applied.map((a) => ({ label: a.label })), alerts: res.alerts };
  }

  const [allContacts, allDeals, allActivities, allProposals, allProjects, allTasks, stages, demos, dismissed] =
    await Promise.all([
      db.select().from(contacts).all(),
      db.select().from(deals).all(),
      db.select().from(activities).all(),
      db.select().from(proposals).all(),
      db.select().from(projects).all(),
      db.select().from(projectTasks).all(),
      db.select().from(pipelineStages).all(),
      db
        .select({
          id: demoPages.id,
          title: demoPages.title,
          contactId: demoPages.contactId,
          published: demoPages.published,
          publishedAt: demoPages.publishedAt,
        })
        .from(demoPages)
        .all(),
      db
        .select({ actionId: nbaDismissals.actionId })
        .from(nbaDismissals)
        .where(gt(nbaDismissals.hiddenUntil, new Date()))
        .all(),
    ]);

  const hidden = new Set(dismissed.map((d) => d.actionId));
  const actions = computeNextBestActions({
    contacts: allContacts,
    deals: allDeals,
    activities: allActivities,
    proposals: allProposals,
    projects: allProjects,
    tasks: allTasks,
    stages,
    demos: demos.map((d) => ({ ...d, published: !!d.published })),
  }).filter((a) => !hidden.has(a.id));

  const result: Record<string, unknown> = {
    actions: actions.length,
    automationsApplied: automation.applied.length,
  };

  // ── Email: the top of the list ────────────────────────
  const top = actions.slice(0, 10);
  const weekend = [0, 6].includes(new Date().getUTCDay());
  const hasRecipient = notifications.digestRecipients.length > 0 || !!getDigestEmail();
  const worthSending = top.length > 0 || automation.applied.length > 0;

  if (!notifications.digestEnabled) {
    result.email = "digest apagado";
  } else if (notifications.skipWeekends && weekend) {
    result.email = "fin de semana";
  } else if (!worthSending) {
    result.email = "sin acciones";
  } else if (!hasRecipient) {
    result.email = "sin destinatario configurado";
  } else {
    const critical = actions.filter((a) => urgencyOf(a.score) === "critical").length;
    const today = new Date().toLocaleDateString("es-CO", {
      timeZone: business.timezone || "America/Bogota",
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0d9a8a;font-weight:600;">${business.name}</p>
      <h1 style="margin:0 0 4px;font-size:22px;color:#111827;">Qué hacer hoy</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-transform:capitalize;">${today}</p>
      ${critical > 0 ? `<p style="margin:0 0 16px;padding:10px 12px;background:#fef2f2;border-left:3px solid #dc2626;font-size:13px;color:#991b1b;">${critical} ${critical === 1 ? "acción no puede esperar" : "acciones no pueden esperar"}.</p>` : ""}
      <table style="width:100%;border-collapse:collapse;">${top.map(actionRow).join("")}</table>
      ${actions.length > top.length ? `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Y ${actions.length - top.length} más en el CRM.</p>` : ""}
      ${notifications.includeAutomationSummary ? automationRows(automation.applied) : ""}
    </div>`;

    const mail = await sendMail(
      `Qué hacer hoy · ${top.length} acciones`,
      html,
      notifications.digestRecipients
    );
    result.email = mail.ok ? "enviado" : `falló: ${mail.error ?? "sin proveedor"}`;
  }

  // ── WhatsApp: only when money is actually late ────────
  // Sourced from the automation engine rather than the NBA list so the
  // cooldown applies: an overdue payment pings once, then stays quiet for a
  // couple of days instead of buzzing every morning until it clears.
  const overdue = notifications.whatsappAlerts
    ? automation.alerts.filter((a) => a.channel === "both" || a.channel === "whatsapp")
    : [];
  if (overdue.length > 0) {
    const cfg = await getPaymentAutomationConfig();
    if (isWhatsAppConfigured(cfg)) {
      const total = automationsConfig.masterEnabled
        ? allContacts
            .filter((c) => c.nextPaymentDate && c.nextPaymentDate < new Date() && !c.automationsSuspended)
            .reduce((sum, c) => sum + (c.monthlyPayment ?? 0), 0)
        : 0;
      await sendWhatsAppToNotifyNumbers(cfg, [
        `${overdue.length} ${overdue.length === 1 ? "pago vencido" : "pagos vencidos"}`,
        formatCurrency(total),
        overdue.map((a) => a.text).join(" · ").slice(0, 200),
      ]);
      result.whatsapp = `${overdue.length} avisados`;
    } else {
      result.whatsapp = "no configurado";
    }
  }

  return NextResponse.json({ ok: true, ...result });
}

/** What the engine did on its own, so the morning email is never a surprise. */
function automationRows(applied: { label: string }[]): string {
  if (applied.length === 0) return "";
  return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;font-weight:600;">
      El CRM hizo esto por ustedes
    </p>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:1.7;">
      ${applied.slice(0, 12).map((a) => `<li>${a.label}</li>`).join("")}
    </ul>
    ${applied.length > 12 ? `<p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Y ${applied.length - 12} más.</p>` : ""}
  </div>`;
}
