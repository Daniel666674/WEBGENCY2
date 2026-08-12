/**
 * Who gets told what, and through which channel.
 *
 * Before this, "notifications" meant one browser toggle for overdue
 * follow-ups that only worked while a tab was open, and a digest hardcoded
 * to whatever single address sat in DIGEST_EMAIL. Two people running an
 * agency need both of them addressed, and need to be able to change that
 * without a redeploy.
 */

import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_KEY = "notification_config";

export interface NotificationConfig {
  /** Master switch for the scheduled morning email. */
  digestEnabled: boolean;
  /** Extra recipients. Empty → falls back to DIGEST_EMAIL / GMAIL_USER. */
  digestRecipients: string[];
  /** Append what the automation engine did overnight to the digest. */
  includeAutomationSummary: boolean;
  /** Skip the digest on Saturday and Sunday. */
  skipWeekends: boolean;
  /** Allow the automation engine's WhatsApp alerts (overdue payments). */
  whatsappAlerts: boolean;
  /** Email as soon as a lead arrives through /api/webhook. */
  notifyOnNewLead: boolean;
}

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  digestEnabled: true,
  digestRecipients: [],
  includeAutomationSummary: true,
  skipWeekends: false,
  whatsappAlerts: true,
  notifyOnNewLead: false,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeNotificationConfig(raw: unknown): NotificationConfig {
  const p = (raw ?? {}) as Partial<NotificationConfig>;
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

  const recipients = Array.isArray(p.digestRecipients)
    ? [...new Set(p.digestRecipients.map((r) => String(r).trim().toLowerCase()).filter((r) => EMAIL.test(r)))].slice(0, 10)
    : [];

  return {
    digestEnabled: bool(p.digestEnabled, true),
    digestRecipients: recipients,
    includeAutomationSummary: bool(p.includeAutomationSummary, true),
    skipWeekends: bool(p.skipWeekends, false),
    whatsappAlerts: bool(p.whatsappAlerts, true),
    notifyOnNewLead: bool(p.notifyOnNewLead, false),
  };
}

export async function getNotificationConfig(): Promise<NotificationConfig> {
  const row = await db.select().from(crmSettings).where(eq(crmSettings.key, SETTINGS_KEY)).get();
  if (!row) return DEFAULT_NOTIFICATION_CONFIG;
  try {
    return normalizeNotificationConfig(JSON.parse(row.value));
  } catch {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

export async function saveNotificationConfig(config: unknown): Promise<NotificationConfig> {
  const normalized = normalizeNotificationConfig(config);
  const value = JSON.stringify(normalized);
  await db
    .insert(crmSettings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
    .run();
  return normalized;
}
