import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, activities, pipelineStages, projectTasks, projects, proposals } from "@/db/schema";
import { eq, asc, isNull, and, ne, isNotNull } from "drizzle-orm";
import { formatCurrency } from "@/lib/constants";
import { sendMail, getDigestEmail } from "@/lib/mailer";

// Excluded from the cookie middleware so the daily cron can reach it.
// Guard: a browser session (demo cookie) or the cron shared secret.
function authorized(request: NextRequest): boolean {
  if (request.cookies.has("oliwan-demo-session")) return true;
  const sessionCookies = ["authjs.session-token", "__Secure-authjs.session-token"];
  if (sessionCookies.some((c) => request.cookies.has(c))) return true;
  const cronSecret = process.env.CRON_SECRET;
  return !!cronSecret && request.headers.get("x-cron-secret") === cronSecret;
}

function buildDigest() {
  const now = new Date();
  const nowSec = Math.floor(now.getTime() / 1000);

  const allContacts = db.select().from(contacts).all();
  const allDeals = db.select().from(deals).all();
  const stages = db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all();

  const pendingActivities = db
    .select({
      description: activities.description,
      scheduledAt: activities.scheduledAt,
      contactName: contacts.name,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .where(isNull(activities.completedAt))
    .all();

  const overdue = pendingActivities.filter(
    (a) => a.scheduledAt && (typeof a.scheduledAt === "number" ? a.scheduledAt : Math.floor(a.scheduledAt.getTime() / 1000)) < nowSec
  );

  // Tareas y solicitudes pendientes (proyectos)
  const pendingProjectItems = db
    .select({
      type: projectTasks.type,
      description: projectTasks.description,
      status: projectTasks.status,
      dueDate: projectTasks.dueDate,
      projectName: projects.name,
    })
    .from(projectTasks)
    .leftJoin(projects, eq(projectTasks.projectId, projects.id))
    .where(ne(projectTasks.status, "done"))
    .all();

  const pendingTareas = pendingProjectItems.filter((t) => t.type === "task");
  const pendingSolicitudes = pendingProjectItems.filter((t) => t.type === "solicitud");

  // Ofertas: mis propuestas valen 30 dias (proposals.validUntil)
  const datedProposals = db
    .select({
      planName: proposals.planName,
      oneTimeFee: proposals.oneTimeFee,
      validUntil: proposals.validUntil,
      contactName: contacts.name,
      contactCompany: contacts.company,
    })
    .from(proposals)
    .leftJoin(contacts, eq(proposals.contactId, contacts.id))
    .where(isNotNull(proposals.validUntil))
    .all();

  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const expiredProposals = datedProposals.filter((p) => p.validUntil && p.validUntil.getTime() < now.getTime());
  const expiringProposals = datedProposals.filter(
    (p) => p.validUntil && p.validUntil.getTime() >= now.getTime() && p.validUntil.getTime() - now.getTime() <= FIVE_DAYS_MS
  );

  const hotLeads = allContacts.filter((c) => c.temperature === "hot");
  const activeDeals = allDeals.filter((d) => {
    const stage = stages.find((s) => s.id === d.stageId);
    return stage && !stage.isWon && !stage.isLost;
  });
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  const fmtDate = (d: Date) => d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const proposalLabel = (p: (typeof datedProposals)[number]) =>
    `${p.contactCompany || p.contactName || "Cliente"} — ${p.planName} (${formatCurrency(p.oneTimeFee)})`;

  const section = (title: string, color: string, bg: string, border: string, items: string[]) =>
    items.length === 0
      ? ""
      : `
        <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: ${color}; font-size: 15px; margin: 0 0 8px;">${title} (${items.length})</h2>
          <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px;">
            ${items.map((i) => `<li style="margin-bottom: 2px;">${i}</li>`).join("")}
          </ul>
        </div>`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 4px;">OLIWAN</h1>
      <p style="color: #64748b; margin-top: 0;">Resumen diario — ${now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

      ${section("Ofertas expiradas", "#dc2626", "#fef2f2", "#fecaca",
        expiredProposals.map((p) => `${proposalLabel(p)} — venció el ${fmtDate(p.validUntil!)}`))}

      ${section("Ofertas por vencer (≤5 días)", "#d97706", "#fffbeb", "#fde68a",
        expiringProposals.map((p) => `${proposalLabel(p)} — vence el ${fmtDate(p.validUntil!)}`))}

      ${section("Seguimientos vencidos", "#dc2626", "#fef2f2", "#fecaca",
        overdue.map((a) => `${a.description} — ${a.contactName || "Sin contacto"}`))}

      ${section("Tareas pendientes", "#0f766e", "#f0fdfa", "#99f6e4",
        pendingTareas.map((t) => `${t.description}${t.projectName ? ` — ${t.projectName}` : ""}${t.dueDate ? ` (vence ${fmtDate(t.dueDate)})` : ""}`))}

      ${section("Solicitudes de clientes pendientes", "#7c3aed", "#f5f3ff", "#ddd6fe",
        pendingSolicitudes.map((t) => `${t.description}${t.projectName ? ` — ${t.projectName}` : ""}${t.dueDate ? ` (vence ${fmtDate(t.dueDate)})` : ""}`))}

      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${allContacts.length}</div>
          <div style="font-size: 12px; color: #64748b;">Contactos</div>
        </div>
        <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${activeDeals.length}</div>
          <div style="font-size: 12px; color: #64748b;">Deals activos</div>
        </div>
        <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${formatCurrency(pipelineValue)}</div>
          <div style="font-size: 12px; color: #64748b;">En pipeline</div>
        </div>
      </div>

      ${hotLeads.length > 0 ? `
        <h3 style="color: #1e293b; font-size: 14px;">Leads calientes (${hotLeads.length})</h3>
        <ul style="color: #334155; font-size: 14px; padding-left: 20px;">
          ${hotLeads.map((c) => `<li>${c.name}${c.company ? ` — ${c.company}` : ""}</li>`).join("")}
        </ul>
      ` : ""}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        OLIWAN — Tu CRM local con IA
      </p>
    </div>
  `;

  const urgentCount = expiredProposals.length + overdue.length;
  const subject =
    urgentCount > 0
      ? `CRM Digest: ${expiredProposals.length > 0 ? `${expiredProposals.length} ofertas expiradas` : `${overdue.length} seguimientos vencidos`}`
      : `CRM Digest: ${pendingTareas.length + pendingSolicitudes.length} pendientes · ${activeDeals.length} deals activos`;

  return {
    html,
    subject,
    summary: {
      expiredProposals: expiredProposals.length,
      expiringProposals: expiringProposals.length,
      overdue: overdue.length,
      pendingTareas: pendingTareas.length,
      pendingSolicitudes: pendingSolicitudes.length,
      hotLeads: hotLeads.length,
      activeDeals: activeDeals.length,
      pipelineValue,
    },
  };
}

// Vista previa del digest en el navegador, sin enviar nada
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { html } = buildDigest();
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { html, subject, summary } = buildDigest();
  const result = await sendMail(subject, html);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, instructions: result.instructions },
      { status: result.instructions ? 400 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    provider: result.provider,
    sentTo: getDigestEmail(),
    summary,
  });
}
