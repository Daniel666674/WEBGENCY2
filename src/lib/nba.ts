import type { InferSelectModel } from "drizzle-orm";
import type { contacts, deals, activities, proposals, projects, projectTasks, pipelineStages } from "@/db/schema";

type Contact = InferSelectModel<typeof contacts>;
type Deal = InferSelectModel<typeof deals>;
type Activity = InferSelectModel<typeof activities>;
type Proposal = InferSelectModel<typeof proposals>;
type Project = InferSelectModel<typeof projects>;
type ProjectTask = InferSelectModel<typeof projectTasks>;
type Stage = InferSelectModel<typeof pipelineStages>;

/**
 * Next Best Action engine.
 *
 * The CRM already surfaces *state* — overdue counts, pipeline totals, a list
 * of follow-ups. What it never answered is "what should I do right now?".
 * This ranks every open thread in the business into one ordered list, so the
 * morning starts with a decision instead of a dashboard.
 *
 * Design rules that keep the list trustworthy:
 *  - Every action names a concrete next step and the reason it surfaced.
 *    "Llamar a X — la propuesta lleva 4 días vista sin respuesta", not
 *    "Revisar oportunidad".
 *  - Urgency decays and money amplifies, so a $8M deal going cold outranks a
 *    $200k one that went cold on the same day.
 *  - Each rule fires once per entity. Ten reasons to call the same person
 *    collapse into the strongest one — a list you can finish is worth more
 *    than a list that is technically complete.
 */

export type NbaKind =
  | "lead_cold"
  | "lead_hot_untouched"
  | "no_next_step"
  | "deal_stale"
  | "deal_closing"
  | "proposal_unopened"
  | "proposal_viewed"
  | "proposal_expiring"
  | "won_no_project"
  | "payment_due"
  | "payment_overdue"
  | "client_silent"
  | "task_overdue"
  | "milestone_overdue"
  | "demo_unsent"
  | "activity_overdue";

export interface NextBestAction {
  id: string;
  kind: NbaKind;
  /** 0-100. Drives ordering and the colour of the urgency dot. */
  score: number;
  /** The imperative: what to actually do. */
  title: string;
  /** Why this surfaced now. Always concrete, never generic. */
  reason: string;
  /** Where acting on it happens. */
  href: string;
  entity: { type: "contact" | "deal" | "proposal" | "project" | "task"; id: string; name: string };
  /** Money at stake in cents, when the action has a value attached. */
  valueCents?: number;
  /** Suggested opening line, for the actions where wording is the hard part. */
  script?: string;
}

const DAY = 86_400_000;

function daysSince(d: Date | number | null | undefined): number | null {
  if (!d) return null;
  const t = d instanceof Date ? d.getTime() : Number(d);
  if (!t || Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / DAY);
}

function daysUntil(d: Date | number | null | undefined): number | null {
  const s = daysSince(d);
  return s === null ? null : -s;
}

/**
 * Money weighting. A deal worth 10x more is not 10x more urgent — attention
 * does not scale linearly — so this is a gentle log-ish bump capped at +20.
 */
function valueBoost(cents?: number | null): number {
  if (!cents || cents <= 0) return 0;
  const millions = cents / 100_000_000; // cents -> millions of pesos
  return Math.min(20, Math.round(Math.log10(1 + millions) * 14));
}

function clamp(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)));
}

export interface NbaInput {
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  proposals: Proposal[];
  projects: Project[];
  tasks: ProjectTask[];
  stages: Stage[];
  demos?: { id: string; title: string; contactId: string | null; published: boolean; publishedAt: Date | number | null }[];
}

export function computeNextBestActions(input: NbaInput): NextBestAction[] {
  const { contacts, deals, activities, proposals, projects, tasks, stages, demos = [] } = input;
  const out: NextBestAction[] = [];

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const stageById = new Map(stages.map((s) => [s.id, s]));

  // Last touch per contact, counting only work that actually happened.
  const lastTouch = new Map<string, number>();
  // Whether a future step is already on the calendar for this contact.
  const hasFutureStep = new Set<string>();
  const now = Date.now();

  for (const a of activities) {
    const done = a.completedAt ? new Date(a.completedAt).getTime() : null;
    const created = a.createdAt ? new Date(a.createdAt).getTime() : null;
    const at = done ?? created;
    if (at && (!lastTouch.has(a.contactId) || at > lastTouch.get(a.contactId)!)) {
      lastTouch.set(a.contactId, at);
    }
    const sched = a.scheduledAt ? new Date(a.scheduledAt).getTime() : null;
    if (sched && sched > now && !a.completedAt) hasFutureStep.add(a.contactId);
  }

  // One action per entity: rules push here and the strongest survives.
  const best = new Map<string, NextBestAction>();
  const push = (a: NextBestAction) => {
    const k = `${a.entity.type}:${a.entity.id}`;
    const prev = best.get(k);
    if (!prev || a.score > prev.score) best.set(k, a);
  };

  // ── Overdue scheduled activities ────────────────────────
  // Something you already committed to and let slip. Highest trust cost.
  for (const a of activities) {
    if (a.completedAt || !a.scheduledAt) continue;
    const late = daysSince(a.scheduledAt);
    if (late === null || late < 0) continue;
    const c = contactById.get(a.contactId);
    if (!c) continue;
    push({
      id: `activity-${a.id}`,
      kind: "activity_overdue",
      score: clamp(72 + late * 3),
      title: `${a.type === "call" ? "Llamar" : a.type === "meeting" ? "Reunirte con" : "Contactar a"} ${c.name}`,
      reason: late === 0
        ? `Tenías esto agendado para hoy: "${a.description}".`
        : `Lo agendaste para hace ${late} ${late === 1 ? "día" : "días"} y sigue sin completarse: "${a.description}".`,
      href: `/contacts/${c.id}`,
      entity: { type: "contact", id: c.id, name: c.name },
    });
  }

  // ── Proposals ───────────────────────────────────────────
  for (const p of proposals) {
    const c = contactById.get(p.contactId);
    if (!c) continue;
    const sent = daysSince(p.createdAt);
    const value = (p.oneTimeFee ?? 0) + (p.monthlyFee ?? 0) * 3;

    if (p.validUntil) {
      const left = daysUntil(p.validUntil);
      if (left !== null && left >= 0 && left <= 5) {
        push({
          id: `prop-exp-${p.id}`,
          kind: "proposal_expiring",
          score: clamp(88 - left * 4 + valueBoost(value)),
          title: `Cerrar con ${c.name} antes de que venza la propuesta`,
          reason: left === 0
            ? "La propuesta vence hoy. Es la razón más honesta que vas a tener para llamar."
            : `La propuesta vence en ${left} ${left === 1 ? "día" : "días"}.`,
          href: `/proposals`,
          entity: { type: "proposal", id: p.id, name: c.name },
          valueCents: value,
          script: `Hola ${c.name.split(" ")[0]}, te escribo porque la propuesta que te pasé vence ${left === 0 ? "hoy" : `en ${left} días`}. ¿La alcanzaste a ver? Si hay algo que ajustar, lo vemos y te la extiendo.`,
        });
        continue;
      }
    }

    if (p.viewedAt) {
      const seen = daysSince(p.viewedAt);
      if (seen !== null && seen >= 1 && seen <= 30) {
        push({
          id: `prop-seen-${p.id}`,
          kind: "proposal_viewed",
          score: clamp(80 - Math.abs(seen - 2) * 3 + valueBoost(value)),
          title: `Llamar a ${c.name} — abrió la propuesta`,
          reason: `La vio hace ${seen} ${seen === 1 ? "día" : "días"} y no respondió. El interés está; falta la conversación.`,
          href: `/proposals`,
          entity: { type: "proposal", id: p.id, name: c.name },
          valueCents: value,
          script: `Hola ${c.name.split(" ")[0]}, vi que abriste la propuesta. ¿Qué te pareció? Te llamo 5 minutos para resolver dudas y te dejo tranquilo.`,
        });
      }
    } else if (sent !== null && sent >= 2 && sent <= 30) {
      push({
        id: `prop-unopened-${p.id}`,
        kind: "proposal_unopened",
        score: clamp(60 + sent * 2 + valueBoost(value)),
        title: `Reenviar la propuesta a ${c.name}`,
        reason: `Se envió hace ${sent} días y todavía no la abre. Puede haber caído en spam o quedado enterrada.`,
        href: `/proposals`,
        entity: { type: "proposal", id: p.id, name: c.name },
        valueCents: value,
        script: `Hola ${c.name.split(" ")[0]}, te reenvío la propuesta por si no llegó. ¿Te queda mejor que te la resuma por WhatsApp?`,
      });
    }
  }

  // ── Deals ───────────────────────────────────────────────
  for (const d of deals) {
    const c = contactById.get(d.contactId);
    if (!c) continue;
    const stage = stageById.get(d.stageId);
    if (stage?.isWon || stage?.isLost) continue;

    const close = daysUntil(d.expectedClose);
    if (close !== null && close <= 7 && close >= -30) {
      push({
        id: `deal-close-${d.id}`,
        kind: "deal_closing",
        score: clamp((close < 0 ? 86 + Math.min(10, -close) : 78 - close * 2) + valueBoost(d.value)),
        title: close < 0 ? `Actualizar "${d.title}" — pasó la fecha de cierre` : `Empujar el cierre de "${d.title}"`,
        reason: close < 0
          ? `La fecha estimada de cierre fue hace ${-close} días y el deal sigue en "${stage?.name ?? "el pipeline"}". O se cierra o se mueve.`
          : `Cierre estimado en ${close} ${close === 1 ? "día" : "días"}, etapa actual "${stage?.name ?? "—"}".`,
        href: `/pipeline`,
        entity: { type: "deal", id: d.id, name: d.title },
        valueCents: d.value,
      });
      continue;
    }

    const idle = daysSince(d.updatedAt);
    if (idle !== null && idle >= 10) {
      push({
        id: `deal-stale-${d.id}`,
        kind: "deal_stale",
        score: clamp(45 + Math.min(30, idle) + valueBoost(d.value)),
        title: `Mover "${d.title}" o descartarlo`,
        reason: `Lleva ${idle} días sin cambios en "${stage?.name ?? "el pipeline"}". Un deal parado infla el forecast y no paga nada.`,
        href: `/pipeline`,
        entity: { type: "deal", id: d.id, name: d.title },
        valueCents: d.value,
      });
    }
  }

  // ── Won deals with nothing to deliver ───────────────────
  const clientIdsWithProject = new Set(projects.map((p) => p.clientId).filter(Boolean));
  for (const d of deals) {
    const stage = stageById.get(d.stageId);
    if (!stage?.isWon) continue;
    if (clientIdsWithProject.has(d.contactId)) continue;
    const c = contactById.get(d.contactId);
    if (!c) continue;
    push({
      id: `won-${d.id}`,
      kind: "won_no_project",
      score: clamp(84 + valueBoost(d.value)),
      title: `Abrir el proyecto de ${c.name}`,
      reason: `"${d.title}" está ganado pero no tiene proyecto. El arranque es donde se pierde la confianza que costó ganar.`,
      href: `/projects`,
      entity: { type: "deal", id: d.id, name: d.title },
      valueCents: d.value,
    });
  }

  // ── Contacts: cold, hot-untouched, no next step, churn ──
  for (const c of contacts) {
    const touched = lastTouch.get(c.id);
    const idle = touched ? Math.floor((now - touched) / DAY) : daysSince(c.createdAt);

    if (c.clientStatus === "active_client") {
      // Payment first — it is the only one with a hard date.
      const due = daysUntil(c.nextPaymentDate);
      if (due !== null && due < 0 && (c.monthlyPayment ?? 0) > 0) {
        push({
          id: `pay-late-${c.id}`,
          kind: "payment_overdue",
          score: clamp(90 + Math.min(10, -due)),
          title: `Cobrar a ${c.name}`,
          reason: `El pago venció hace ${-due} ${-due === 1 ? "día" : "días"}. Cuanto más se estira, más incómodo se vuelve pedirlo.`,
          href: `/clients`,
          entity: { type: "contact", id: c.id, name: c.name },
          valueCents: c.monthlyPayment ?? undefined,
          script: `Hola ${c.name.split(" ")[0]}, ¿todo bien? Te escribo por la mensualidad de este mes, que quedó pendiente. ¿Te paso los datos de nuevo?`,
        });
        continue;
      }
      if (due !== null && due >= 0 && due <= 3 && (c.monthlyPayment ?? 0) > 0) {
        push({
          id: `pay-due-${c.id}`,
          kind: "payment_due",
          score: clamp(64 - due * 4),
          title: `Recordar el pago a ${c.name}`,
          reason: due === 0 ? "El pago vence hoy." : `El pago vence en ${due} ${due === 1 ? "día" : "días"}. Avisar antes evita tener que reclamar después.`,
          href: `/clients`,
          entity: { type: "contact", id: c.id, name: c.name },
          valueCents: c.monthlyPayment ?? undefined,
        });
        continue;
      }
      if (idle !== null && idle >= 30) {
        push({
          id: `silent-${c.id}`,
          kind: "client_silent",
          score: clamp(50 + Math.min(25, idle - 30)),
          title: `Hacer seguimiento a ${c.name}`,
          reason: `Cliente activo sin contacto hace ${idle} días. El silencio es la primera señal de que se van.`,
          href: `/contacts/${c.id}`,
          entity: { type: "contact", id: c.id, name: c.name },
          script: `Hola ${c.name.split(" ")[0]}, ¿cómo vienen las cosas? Quería ver cómo te está funcionando lo que armamos y si hay algo en lo que te podamos dar una mano.`,
        });
      }
      continue;
    }

    // Prospects
    if (c.temperature === "hot" && idle !== null && idle >= 2) {
      push({
        id: `hot-${c.id}`,
        kind: "lead_hot_untouched",
        score: clamp(82 + Math.min(14, idle * 2)),
        title: `Llamar a ${c.name} hoy`,
        reason: `Lead caliente (score ${c.score}) sin contacto hace ${idle} ${idle === 1 ? "día" : "días"}. El interés se enfría rápido.`,
        href: `/contacts/${c.id}`,
        entity: { type: "contact", id: c.id, name: c.name },
      });
      continue;
    }

    if (!hasFutureStep.has(c.id) && c.temperature !== "cold" && idle !== null && idle >= 3) {
      push({
        id: `nostep-${c.id}`,
        kind: "no_next_step",
        score: clamp(56 + Math.min(20, idle)),
        title: `Agendar el próximo paso con ${c.name}`,
        reason: `No hay ninguna actividad futura agendada y el último contacto fue hace ${idle} días. Sin próximo paso, el lead se pierde solo.`,
        href: `/contacts/${c.id}`,
        entity: { type: "contact", id: c.id, name: c.name },
      });
      continue;
    }

    if (idle !== null && idle >= 21 && c.temperature !== "cold") {
      push({
        id: `cold-${c.id}`,
        kind: "lead_cold",
        score: clamp(38 + Math.min(20, idle - 21)),
        title: `Reactivar o archivar a ${c.name}`,
        reason: `${idle} días sin movimiento. O merece un último intento, o marcarlo frío para dejar de contarlo en el pipeline.`,
        href: `/contacts/${c.id}`,
        entity: { type: "contact", id: c.id, name: c.name },
      });
    }
  }

  // ── Delivery: overdue tasks ─────────────────────────────
  for (const t of tasks) {
    if (t.completedAt || t.status === "done" || !t.dueDate) continue;
    const late = daysSince(t.dueDate);
    if (late === null || late < 0) continue;
    push({
      id: `task-${t.id}`,
      kind: "task_overdue",
      score: clamp((t.priority === "alta" ? 74 : t.priority === "baja" ? 42 : 58) + Math.min(18, late * 2)),
      title: t.title || t.description.slice(0, 60),
      reason: `Vencida hace ${late} ${late === 1 ? "día" : "días"}${t.priority === "alta" ? ", marcada como prioridad alta" : ""}.`,
      href: t.type === "solicitud" ? "/solicitudes" : "/tareas",
      entity: { type: "task", id: t.id, name: t.title || t.description.slice(0, 40) },
    });
  }

  // ── Demos built but never sent ──────────────────────────
  for (const dm of demos) {
    if (!dm.published || !dm.contactId) continue;
    const age = daysSince(dm.publishedAt);
    if (age === null || age < 2 || age > 45) continue;
    const c = contactById.get(dm.contactId);
    if (!c) continue;
    const touched = lastTouch.get(c.id);
    // Only nag when nothing happened with that contact after publishing.
    if (touched && dm.publishedAt && touched > new Date(dm.publishedAt).getTime()) continue;
    push({
      id: `demo-${dm.id}`,
      kind: "demo_unsent",
      score: clamp(66 + Math.min(16, age)),
      title: `Mandarle el demo a ${c.name}`,
      reason: `"${dm.title}" está publicado hace ${age} días y no hubo ninguna actividad con ${c.name} desde entonces.`,
      href: `/demos`,
      entity: { type: "contact", id: c.id, name: c.name },
      script: `Hola ${c.name.split(" ")[0]}, te armé una muestra de cómo se vería tu sitio. Te paso el link para que lo veas: `,
    });
  }

  out.push(...best.values());
  return out.sort((a, b) => b.score - a.score);
}

/** Coarse bucket used for colour and grouping in the UI. */
export function urgencyOf(score: number): "critical" | "high" | "normal" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  return "normal";
}
