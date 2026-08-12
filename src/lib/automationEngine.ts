/**
 * The automation engine: plan, then apply.
 *
 * Planning is a pure function of the data — no writes, no side effects — so
 * the same code path powers both the real run and the "simulacro" preview in
 * Settings. Nobody should have to trust a rule that fires blind at 7am; you
 * can see exactly what it would create before you let it run.
 *
 * Applying is deliberately conservative:
 *  - Every action carries a stable dedupe key. An action whose key was
 *    already written inside the rule's cooldown is skipped, so running the
 *    job twice in a morning is a no-op rather than a duplicate follow-up.
 *  - Notification rules never write records; they hand text back to the
 *    caller (the cron) to deliver.
 *  - Nothing is destructive. The engine creates work and lowers a lead's
 *    temperature; it never deletes, never closes a deal, never emails a
 *    client directly.
 */

import type { InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import {
  activities as activitiesTable,
  automationRuns,
  contacts as contactsTable,
  deals as dealsTable,
  pipelineStages as pipelineStagesTable,
  projects as projectsTable,
  projectTasks as projectTasksTable,
  proposals as proposalsTable,
} from "@/db/schema";
import { eq, gt } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/constants";
import { cooldownFor, type AutomationRuleId, type AutomationsConfig } from "@/lib/automations";

type Contact = InferSelectModel<typeof contactsTable>;
type Deal = InferSelectModel<typeof dealsTable>;
type Activity = InferSelectModel<typeof activitiesTable>;
type Proposal = InferSelectModel<typeof proposalsTable>;
type Project = InferSelectModel<typeof projectsTable>;
type ProjectTask = InferSelectModel<typeof projectTasksTable>;
type Stage = InferSelectModel<typeof pipelineStagesTable>;
type DemoLite = { id: string; title: string; contactId: string | null; published: boolean; publishedAt: Date | null };

export type AutomationEffect =
  | {
      type: "activity";
      contactId: string;
      dealId: string | null;
      description: string;
      scheduledAt: Date;
      assignedUserId: string | null;
    }
  | {
      type: "onboarding";
      contactId: string;
      projectName: string;
      budgetCents: number;
      checklist: string[];
      assignedUserId: string | null;
    }
  | { type: "temperature"; contactId: string; from: string; to: string }
  | { type: "alert"; channel: "email" | "whatsapp" | "both"; text: string; amountCents?: number };

export interface AutomationAction {
  ruleId: AutomationRuleId;
  /** Stable per (rule, entity). Cooldown decides whether it may fire again. */
  key: string;
  /** One line describing what will happen. Shown in the preview and the log. */
  label: string;
  entity: { type: string; id: string; name: string };
  effect: AutomationEffect;
}

export interface AutomationInput {
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  proposals: Proposal[];
  projects: Project[];
  tasks: ProjectTask[];
  stages: Stage[];
  demos: DemoLite[];
  now?: Date;
}

const DAY = 86_400_000;
const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / DAY);

/** Plans every action the enabled rules would take. Pure — writes nothing. */
export function planAutomations(input: AutomationInput, config: AutomationsConfig): AutomationAction[] {
  const now = input.now ?? new Date();
  const out: AutomationAction[] = [];
  const { rules } = config;

  const contactById = new Map(input.contacts.map((c) => [c.id, c]));
  const wonStageIds = new Set(input.stages.filter((s) => s.isWon).map((s) => s.id));
  const assignee = (id: AutomationRuleId) => rules[id].assignTo ?? config.defaultAssigneeId;

  // Last time anybody touched a contact — the signal almost every rule needs.
  const lastTouch = new Map<string, number>();
  for (const a of input.activities) {
    const at = (a.completedAt ?? a.createdAt)?.getTime() ?? 0;
    if (at > (lastTouch.get(a.contactId) ?? 0)) lastTouch.set(a.contactId, at);
  }
  const touchedSince = (contactId: string, since: Date) => (lastTouch.get(contactId) ?? 0) > since.getTime();

  const push = (
    ruleId: AutomationRuleId,
    key: string,
    label: string,
    entity: AutomationAction["entity"],
    effect: AutomationEffect
  ) => out.push({ ruleId, key, label, entity, effect });

  const followUp = (contactId: string, dealId: string | null, description: string, ruleId: AutomationRuleId) =>
    ({
      type: "activity" as const,
      contactId,
      dealId,
      description,
      scheduledAt: now,
      assignedUserId: assignee(ruleId),
    });

  // ── Propuestas ───────────────────────────────────────────
  for (const p of input.proposals) {
    const contact = contactById.get(p.contactId);
    if (!contact) continue;
    const name = contact.name;

    if (rules.proposal_followup.enabled && !p.viewedAt) {
      const age = daysBetween(now, p.createdAt);
      if (age >= rules.proposal_followup.days && !touchedSince(p.contactId, p.createdAt)) {
        push(
          "proposal_followup",
          `proposal_followup:${p.id}`,
          `Seguimiento a ${name} — propuesta ${p.planName} sin abrir hace ${age} días`,
          { type: "proposal", id: p.id, name },
          followUp(
            p.contactId,
            null,
            `Confirmar que ${name} recibió la propuesta "${p.planName}" (enviada hace ${age} días, todavía sin abrir).`,
            "proposal_followup"
          )
        );
      }
    }

    if (rules.proposal_viewed_followup.enabled && p.viewedAt) {
      const age = daysBetween(now, p.viewedAt);
      if (age >= rules.proposal_viewed_followup.days && !touchedSince(p.contactId, p.viewedAt)) {
        push(
          "proposal_viewed_followup",
          `proposal_viewed:${p.id}`,
          `Llamar a ${name} — vio la propuesta hace ${age} días y no respondió`,
          { type: "proposal", id: p.id, name },
          followUp(
            p.contactId,
            null,
            `Llamar a ${name}: abrió la propuesta "${p.planName}" hace ${age} días y no respondió. Preguntar qué le faltó por resolver.`,
            "proposal_viewed_followup"
          )
        );
      }
    }

    if (rules.proposal_expiring.enabled && p.validUntil) {
      const left = daysBetween(p.validUntil, now);
      if (left >= 0 && left <= rules.proposal_expiring.days) {
        push(
          "proposal_expiring",
          `proposal_expiring:${p.id}`,
          `Propuesta de ${name} vence ${formatDate(p.validUntil)}`,
          { type: "proposal", id: p.id, name },
          followUp(
            p.contactId,
            null,
            `La propuesta "${p.planName}" de ${name} vence el ${formatDate(p.validUntil)}. Cerrarla o extender la vigencia.`,
            "proposal_expiring"
          )
        );
      }
    }
  }

  // ── Demos ────────────────────────────────────────────────
  if (rules.demo_followup.enabled) {
    for (const d of input.demos) {
      if (!d.published || !d.contactId || !d.publishedAt) continue;
      const contact = contactById.get(d.contactId);
      if (!contact) continue;
      const age = daysBetween(now, d.publishedAt);
      if (age < rules.demo_followup.days || touchedSince(d.contactId, d.publishedAt)) continue;
      push(
        "demo_followup",
        `demo_followup:${d.id}`,
        `Seguimiento a ${contact.name} — demo "${d.title}" publicada hace ${age} días`,
        { type: "demo", id: d.id, name: contact.name },
        followUp(
          d.contactId,
          null,
          `Confirmar con ${contact.name} que vio la demo "${d.title}" (publicada hace ${age} días) y recoger feedback.`,
          "demo_followup"
        )
      );
    }
  }

  // ── Onboarding al ganar ──────────────────────────────────
  if (rules.won_onboarding.enabled && config.onboardingChecklist.length > 0) {
    const clientsWithProject = new Set(input.projects.map((p) => p.clientId).filter(Boolean) as string[]);
    for (const deal of input.deals) {
      if (!wonStageIds.has(deal.stageId)) continue;
      if (clientsWithProject.has(deal.contactId)) continue;
      const contact = contactById.get(deal.contactId);
      if (!contact) continue;
      if (daysBetween(now, deal.updatedAt) < rules.won_onboarding.days) continue;

      const label = contact.company || contact.name;
      push(
        "won_onboarding",
        `won_onboarding:${deal.contactId}`,
        `Abrir onboarding de ${label} (${config.onboardingChecklist.length} tareas) — deal ganado ${formatCurrency(deal.value)}`,
        { type: "deal", id: deal.id, name: label },
        {
          type: "onboarding",
          contactId: deal.contactId,
          projectName: `Onboarding — ${label}`,
          budgetCents: deal.value,
          checklist: config.onboardingChecklist,
          assignedUserId: assignee("won_onboarding"),
        }
      );
    }
  }

  // ── Higiene del pipeline ─────────────────────────────────
  for (const c of input.contacts) {
    const idle = daysBetween(now, new Date(lastTouch.get(c.id) ?? c.createdAt.getTime()));

    if (
      rules.cool_down.enabled &&
      c.clientStatus !== "active_client" &&
      c.temperature !== "cold" &&
      idle >= rules.cool_down.days
    ) {
      const to = c.temperature === "hot" ? "warm" : "cold";
      push(
        "cool_down",
        `cool_down:${c.id}:${c.temperature}`,
        `Enfriar a ${c.name} (${c.temperature} → ${to}) — ${idle} días sin actividad`,
        { type: "contact", id: c.id, name: c.name },
        { type: "temperature", contactId: c.id, from: c.temperature, to }
      );
    }

    if (rules.client_checkin.enabled && c.clientStatus === "active_client" && idle >= rules.client_checkin.days) {
      push(
        "client_checkin",
        `client_checkin:${c.id}`,
        `Check-in con ${c.name} — ${idle} días sin contacto`,
        { type: "contact", id: c.id, name: c.name },
        followUp(
          c.id,
          null,
          `Check-in con ${c.name}: cliente activo sin contacto hace ${idle} días. Preguntar cómo va y si necesita algo.`,
          "client_checkin"
        )
      );
    }

    if (rules.payment_overdue_alert.enabled && c.nextPaymentDate && !c.automationsSuspended) {
      const late = daysBetween(now, c.nextPaymentDate);
      if (late > 0) {
        push(
          "payment_overdue_alert",
          `payment_overdue:${c.id}:${c.nextPaymentDate.getTime()}`,
          `Pago vencido: ${c.name} — ${late} días de retraso`,
          { type: "contact", id: c.id, name: c.name },
          {
            type: "alert",
            channel: "both",
            text: `${c.name}: pago vencido hace ${late} ${late === 1 ? "día" : "días"}${
              c.monthlyPayment ? ` (${formatCurrency(c.monthlyPayment)})` : ""
            }`,
            amountCents: c.monthlyPayment ?? 0,
          }
        );
      }
    }
  }

  // ── Tareas vencidas ──────────────────────────────────────
  if (rules.task_overdue_alert.enabled) {
    for (const t of input.tasks) {
      if (t.status === "done" || t.completedAt || !t.dueDate) continue;
      const late = daysBetween(now, t.dueDate);
      if (late < rules.task_overdue_alert.days) continue;
      const title = t.title || t.description.slice(0, 60);
      push(
        "task_overdue_alert",
        `task_overdue:${t.id}`,
        `Tarea vencida hace ${late} días: ${title}`,
        { type: "task", id: t.id, name: title },
        { type: "alert", channel: "email", text: `${title} — vencida hace ${late} ${late === 1 ? "día" : "días"}` }
      );
    }
  }

  return out;
}

export interface ApplyResult {
  applied: AutomationAction[];
  skipped: AutomationAction[];
  alerts: { channel: "email" | "whatsapp" | "both"; text: string; amountCents?: number }[];
}

/**
 * Executes a plan, skipping anything already done inside its cooldown.
 *
 * `dryRun` still performs the cooldown filtering, so the preview shows what a
 * real run would do right now — not what a run would do against a database
 * that had never been touched.
 */
export async function applyAutomations(
  plan: AutomationAction[],
  opts: { dryRun?: boolean; now?: Date } = {}
): Promise<ApplyResult> {
  const now = opts.now ?? new Date();
  const applied: AutomationAction[] = [];
  const skipped: AutomationAction[] = [];
  const alerts: ApplyResult["alerts"] = [];
  if (plan.length === 0) return { applied, skipped, alerts };

  // One query for every key in the plan, then filter per-rule cooldown in
  // memory — cheaper and simpler than a query per action.
  const keys = [...new Set(plan.map((a) => a.key))];
  const oldestCooldown = Math.max(...plan.map((a) => cooldownFor(a.ruleId)));
  const recent = await db
    .select({ dedupeKey: automationRuns.dedupeKey, ruleId: automationRuns.ruleId, createdAt: automationRuns.createdAt })
    .from(automationRuns)
    .where(gt(automationRuns.createdAt, new Date(now.getTime() - oldestCooldown * DAY)))
    .all();

  const lastRun = new Map<string, number>();
  for (const r of recent) {
    if (!keys.includes(r.dedupeKey)) continue;
    const at = r.createdAt.getTime();
    if (at > (lastRun.get(r.dedupeKey) ?? 0)) lastRun.set(r.dedupeKey, at);
  }

  for (const action of plan) {
    const last = lastRun.get(action.key);
    if (last && now.getTime() - last < cooldownFor(action.ruleId) * DAY) {
      skipped.push(action);
      continue;
    }

    if (action.effect.type === "alert") {
      alerts.push({
        channel: action.effect.channel,
        text: action.effect.text,
        amountCents: action.effect.amountCents,
      });
    }

    if (!opts.dryRun) {
      try {
        await executeEffect(action.effect, now);
      } catch {
        // A single failing action must not abort the whole run — the rest of
        // the morning's work is still worth doing.
        skipped.push(action);
        continue;
      }
      await db
        .insert(automationRuns)
        .values({
          ruleId: action.ruleId,
          dedupeKey: action.key,
          entityType: action.entity.type,
          entityId: action.entity.id,
          summary: action.label,
        })
        .run();
      // Keeps a plan containing two actions with the same key from applying
      // twice in a single run.
      lastRun.set(action.key, now.getTime());
    }

    applied.push(action);
  }

  return { applied, skipped, alerts };
}

async function executeEffect(effect: AutomationEffect, now: Date): Promise<void> {
  switch (effect.type) {
    case "activity":
      await db
        .insert(activitiesTable)
        .values({
          type: "follow_up",
          description: effect.description,
          contactId: effect.contactId,
          dealId: effect.dealId,
          scheduledAt: effect.scheduledAt,
          assignedUserId: effect.assignedUserId,
        })
        .run();
      return;

    case "temperature":
      await db
        .update(contactsTable)
        .set({ temperature: effect.to, updatedAt: now })
        .where(eq(contactsTable.id, effect.contactId))
        .run();
      return;

    case "onboarding": {
      const project = await db
        .insert(projectsTable)
        .values({
          clientId: effect.contactId,
          name: effect.projectName,
          status: "discovery",
          budgetCents: effect.budgetCents,
          startDate: now,
          notes: "Proyecto creado automáticamente al ganar el deal.",
        })
        .returning()
        .get();

      // Staggered due dates: a checklist where everything is due today is a
      // checklist nobody sequences.
      for (const [i, description] of effect.checklist.entries()) {
        await db
          .insert(projectTasksTable)
          .values({
            projectId: project.id,
            type: "task",
            title: description.slice(0, 80),
            description,
            assignedUserId: effect.assignedUserId,
            status: "pending",
            priority: i < 2 ? "alta" : "media",
            dueDate: new Date(now.getTime() + (i + 1) * 2 * DAY),
          })
          .run();
      }
      return;
    }

    case "alert":
      // Delivered by the caller (cron) — the engine does not send.
      return;
  }
}
