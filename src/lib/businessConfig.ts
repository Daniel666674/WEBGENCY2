/**
 * Your own company's profile.
 *
 * The CRM knew everything about its contacts and nothing about the business
 * running it — the agency name was hardcoded in the digest email, the
 * currency was assumed, and Settings > Negocio was a read-only dump of a
 * static JSON file nobody could edit from the app. This moves that profile
 * into the database where it belongs, so changing it is a form submit rather
 * than a redeploy.
 */

import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_KEY = "business_profile";

export interface BusinessProfile {
  name: string;
  legalName: string;
  industry: string;
  /** "services" | "products" | "saas" | "agency" | "other" — free text. */
  type: string;
  teamSize: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  currency: string;
  timezone: string;
  language: "es" | "en";
  /** Shown at the top of the daily digest and any client-facing document. */
  tagline: string;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  name: "OLIWAN",
  legalName: "",
  industry: "marketing",
  type: "agency",
  teamSize: "2",
  taxId: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  currency: "COP",
  timezone: "America/Bogota",
  language: "es",
  tagline: "",
};

const STRING_KEYS = Object.keys(DEFAULT_BUSINESS_PROFILE) as (keyof BusinessProfile)[];

export function normalizeBusinessProfile(raw: unknown): BusinessProfile {
  const parsed = (raw ?? {}) as Partial<Record<keyof BusinessProfile, unknown>>;
  const out = { ...DEFAULT_BUSINESS_PROFILE };
  for (const key of STRING_KEYS) {
    const value = parsed[key];
    if (typeof value === "string" && value.trim()) {
      (out as Record<string, string>)[key] = value.trim().slice(0, 200);
    }
  }
  out.language = parsed.language === "en" ? "en" : "es";
  // An empty name would leave the digest email with a blank header.
  if (!out.name) out.name = DEFAULT_BUSINESS_PROFILE.name;
  return out;
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const row = await db.select().from(crmSettings).where(eq(crmSettings.key, SETTINGS_KEY)).get();
  if (!row) return DEFAULT_BUSINESS_PROFILE;
  try {
    return normalizeBusinessProfile(JSON.parse(row.value));
  } catch {
    return DEFAULT_BUSINESS_PROFILE;
  }
}

export async function saveBusinessProfile(profile: unknown): Promise<BusinessProfile> {
  const normalized = normalizeBusinessProfile(profile);
  const value = JSON.stringify(normalized);
  await db
    .insert(crmSettings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
    .run();
  return normalized;
}
