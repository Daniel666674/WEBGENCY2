import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, activities, proposals, projects, projectTasks, pipelineStages, demoPages, nbaDismissals } from "@/db/schema";
import { gt } from "drizzle-orm";
import { computeNextBestActions, urgencyOf, type NextBestAction } from "@/lib/nba";
import { sendMail, getDigestEmail } from "@/lib/mailer";
import { formatCurrency } from "@/lib/constants";
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

  const result: Record<string, unknown> = { actions: actions.length };

  // ── Email: the top of the list ────────────────────────
  const top = actions.slice(0, 10);
  if (top.length > 0 && getDigestEmail()) {
    const critical = actions.filter((a) => urgencyOf(a.score) === "critical").length;
    const today = new Date().toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0d9a8a;font-weight:600;">OLIWAN</p>
      <h1 style="margin:0 0 4px;font-size:22px;color:#111827;">Qué hacer hoy</h1>
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-transform:capitalize;">${today}</p>
      ${critical > 0 ? `<p style="margin:0 0 16px;padding:10px 12px;background:#fef2f2;border-left:3px solid #dc2626;font-size:13px;color:#991b1b;">${critical} ${critical === 1 ? "acción no puede esperar" : "acciones no pueden esperar"}.</p>` : ""}
      <table style="width:100%;border-collapse:collapse;">${top.map(actionRow).join("")}</table>
      ${actions.length > top.length ? `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Y ${actions.length - top.length} más en el CRM.</p>` : ""}
    </div>`;

    const mail = await sendMail(`Qué hacer hoy · ${top.length} acciones`, html);
    result.email = mail.ok ? "enviado" : `falló: ${mail.error ?? "sin proveedor"}`;
  } else {
    result.email = top.length === 0 ? "sin acciones" : "sin DIGEST_EMAIL configurado";
  }

  // ── WhatsApp: only when money is actually late ────────
  const overdue = actions.filter((a) => a.kind === "payment_overdue");
  if (overdue.length > 0) {
    const cfg = await getPaymentAutomationConfig();
    if (isWhatsAppConfigured(cfg)) {
      const total = overdue.reduce((sum, a) => sum + (a.valueCents ?? 0), 0);
      await sendWhatsAppToNotifyNumbers(cfg, [
        `${overdue.length} ${overdue.length === 1 ? "pago vencido" : "pagos vencidos"}`,
        formatCurrency(total),
        overdue.map((a) => a.entity.name).join(", ").slice(0, 200),
      ]);
      result.whatsapp = `${overdue.length} avisados`;
    } else {
      result.whatsapp = "no configurado";
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
