/**
 * Configuration for the automation engine.
 *
 * The CRM already had a Next Best Action list, but NBA only *tells* you what
 * to do — every one of those actions still needed a human to open the app,
 * read the list, and act. These rules close that loop: they run server-side
 * on the daily cron and actually write the follow-up, open the onboarding
 * project, or cool a lead down.
 *
 * Config lives in crm_settings (key/value) rather than .env so it can be
 * tuned from Settings > Automatizaciones without a redeploy — same pattern
 * as the payment automation credentials.
 */

import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_KEY = "automations_config";

export type AutomationRuleId =
  | "proposal_followup"
  | "proposal_viewed_followup"
  | "proposal_expiring"
  | "demo_followup"
  | "won_onboarding"
  | "cool_down"
  | "client_checkin"
  | "task_overdue_alert"
  | "payment_overdue_alert";

export interface AutomationRule {
  enabled: boolean;
  /** Threshold in days. Meaning is per-rule; see RULE_META.daysLabel. */
  days: number;
  /** User the created work lands on. null → the global default assignee. */
  assignTo: string | null;
}

export interface AutomationsConfig {
  rules: Record<AutomationRuleId, AutomationRule>;
  /** Fallback owner for anything a rule creates without its own assignee. */
  defaultAssigneeId: string | null;
  /** Tasks created when a won deal has no project yet. */
  onboardingChecklist: string[];
  /** Master switch — off means the daily cron plans but never applies. */
  masterEnabled: boolean;
}

export interface RuleMeta {
  id: AutomationRuleId;
  title: string;
  /** What it watches for and what it does about it. Shown in the UI. */
  description: string;
  daysLabel: string;
  /** How long before the same rule may fire again for the same entity. */
  cooldownDays: number;
  /** Rules that only notify never create records — flagged in the UI. */
  notifyOnly?: boolean;
  /** Hide the days input for rules where the threshold is meaningless. */
  noThreshold?: boolean;
}

/**
 * Cooldowns are what keep a daily job from becoming a nag. A rule that fires
 * for a contact today stays quiet for `cooldownDays` even if the underlying
 * condition is still true tomorrow — which it usually is, since nobody clears
 * a follow-up the same hour it appears.
 */
export const RULE_META: RuleMeta[] = [
  {
    id: "proposal_followup",
    title: "Propuesta sin abrir",
    description:
      "Si enviaste una propuesta y el cliente no la abrió, crea un seguimiento para confirmar que le llegó.",
    daysLabel: "días sin abrirla",
    cooldownDays: 5,
  },
  {
    id: "proposal_viewed_followup",
    title: "Propuesta vista sin respuesta",
    description:
      "La abrió pero no contestó. Es el momento más caliente para llamar — crea el seguimiento con el guion listo.",
    daysLabel: "días desde que la vio",
    cooldownDays: 4,
  },
  {
    id: "proposal_expiring",
    title: "Propuesta por vencer",
    description:
      "Avisa antes de que la oferta expire, para cerrarla o extenderla a tiempo en vez de dejarla morir sola.",
    daysLabel: "días antes de vencer",
    cooldownDays: 7,
  },
  {
    id: "demo_followup",
    title: "Demo publicada sin respuesta",
    description:
      "Publicaste la demo y el contacto no dio señales. Crea el seguimiento para confirmar que la vio.",
    daysLabel: "días desde publicarla",
    cooldownDays: 5,
  },
  {
    id: "won_onboarding",
    title: "Onboarding automático al ganar",
    description:
      "Cuando un deal llega a una etapa ganada y el cliente todavía no tiene proyecto, crea el proyecto y toda la checklist de onboarding asignada.",
    daysLabel: "días de gracia tras ganar",
    cooldownDays: 30,
  },
  {
    id: "cool_down",
    title: "Enfriar leads abandonados",
    description:
      "Baja la temperatura de un lead sin actividad (caliente → tibio → frío) para que el pipeline refleje la realidad y no el optimismo.",
    daysLabel: "días sin actividad",
    cooldownDays: 7,
  },
  {
    id: "client_checkin",
    title: "Check-in con clientes activos",
    description:
      "Un cliente que paga y del que nadie sabe nada hace semanas es un cliente que se va a ir. Crea el check-in.",
    daysLabel: "días sin contacto",
    cooldownDays: 14,
  },
  {
    id: "task_overdue_alert",
    title: "Aviso de tareas vencidas",
    description: "Resume por email las tareas que pasaron su fecha límite y siguen abiertas.",
    daysLabel: "días de retraso",
    cooldownDays: 3,
    notifyOnly: true,
  },
  {
    id: "payment_overdue_alert",
    title: "Aviso de pagos vencidos",
    description: "Avisa por WhatsApp y email cuando la fecha de pago de un cliente ya pasó.",
    daysLabel: "—",
    cooldownDays: 2,
    notifyOnly: true,
    noThreshold: true,
  },
];

export const DEFAULT_ONBOARDING_CHECKLIST = [
  "Enviar correo de bienvenida y agendar la reunión de arranque",
  "Recolectar accesos: dominio, hosting, redes y analítica",
  "Recibir logo, fotos, textos y material de marca",
  "Crear el brief y confirmar el alcance con el cliente",
  "Configurar cobro recurrente y fecha de pago",
  "Agendar la primera entrega y avisar la fecha al cliente",
];

const DEFAULT_RULES: Record<AutomationRuleId, AutomationRule> = {
  proposal_followup: { enabled: true, days: 3, assignTo: null },
  proposal_viewed_followup: { enabled: true, days: 2, assignTo: null },
  proposal_expiring: { enabled: true, days: 3, assignTo: null },
  demo_followup: { enabled: true, days: 2, assignTo: null },
  won_onboarding: { enabled: true, days: 0, assignTo: null },
  cool_down: { enabled: true, days: 14, assignTo: null },
  client_checkin: { enabled: true, days: 30, assignTo: null },
  task_overdue_alert: { enabled: true, days: 1, assignTo: null },
  payment_overdue_alert: { enabled: true, days: 0, assignTo: null },
};

export const DEFAULT_AUTOMATIONS_CONFIG: AutomationsConfig = {
  rules: DEFAULT_RULES,
  defaultAssigneeId: null,
  onboardingChecklist: DEFAULT_ONBOARDING_CHECKLIST,
  masterEnabled: true,
};

/** Merges stored config over the defaults so a new rule ships enabled, not missing. */
export function normalizeConfig(raw: unknown): AutomationsConfig {
  const parsed = (raw ?? {}) as Partial<AutomationsConfig>;
  const rules = {} as Record<AutomationRuleId, AutomationRule>;
  for (const meta of RULE_META) {
    const stored = parsed.rules?.[meta.id];
    const fallback = DEFAULT_RULES[meta.id];
    rules[meta.id] = {
      enabled: typeof stored?.enabled === "boolean" ? stored.enabled : fallback.enabled,
      days: Number.isFinite(stored?.days) ? Math.max(0, Math.floor(stored!.days)) : fallback.days,
      assignTo: stored?.assignTo ?? null,
    };
  }
  const checklist = Array.isArray(parsed.onboardingChecklist)
    ? parsed.onboardingChecklist.map((s) => String(s).trim()).filter(Boolean)
    : DEFAULT_ONBOARDING_CHECKLIST;

  return {
    rules,
    defaultAssigneeId: parsed.defaultAssigneeId ?? null,
    onboardingChecklist: checklist,
    masterEnabled: typeof parsed.masterEnabled === "boolean" ? parsed.masterEnabled : true,
  };
}

export async function getAutomationsConfig(): Promise<AutomationsConfig> {
  const row = await db.select().from(crmSettings).where(eq(crmSettings.key, SETTINGS_KEY)).get();
  if (!row) return DEFAULT_AUTOMATIONS_CONFIG;
  try {
    return normalizeConfig(JSON.parse(row.value));
  } catch {
    return DEFAULT_AUTOMATIONS_CONFIG;
  }
}

export async function saveAutomationsConfig(config: AutomationsConfig): Promise<AutomationsConfig> {
  const normalized = normalizeConfig(config);
  const value = JSON.stringify(normalized);
  await db
    .insert(crmSettings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
    .run();
  return normalized;
}

export function cooldownFor(ruleId: AutomationRuleId): number {
  return RULE_META.find((r) => r.id === ruleId)?.cooldownDays ?? 7;
}
