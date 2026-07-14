import type {
  InfraData,
  SeoData,
  SecurityData,
  DecisionLogEntry,
  AccountHealth,
  InventoryHealth,
} from "@/types";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface RawContactJsonFields {
  infraData: string | null;
  seoData: string | null;
  securityData: string | null;
  decisionLog: string;
  accountHealth: string | null;
  inventoryHealth: string | null;
}

/** Turns the raw JSON-TEXT columns from a contacts row into typed objects. */
export function parseContactJsonFields<T extends RawContactJsonFields>(row: T) {
  return {
    ...row,
    infraData: safeParse<InfraData | null>(row.infraData, null),
    seoData: safeParse<SeoData | null>(row.seoData, null),
    securityData: safeParse<SecurityData | null>(row.securityData, null),
    decisionLog: safeParse<DecisionLogEntry[]>(row.decisionLog, []),
    accountHealth: safeParse<AccountHealth | null>(row.accountHealth, null),
    inventoryHealth: safeParse<InventoryHealth | null>(row.inventoryHealth, null),
  };
}

/** Mutates updateData in place with any of the new fields present in body. */
export function applyContactJsonFields(
  body: Record<string, unknown>,
  updateData: Record<string, unknown>
) {
  if (body.infraData !== undefined) {
    updateData.infraData = body.infraData ? JSON.stringify(body.infraData) : null;
  }
  if (body.seoData !== undefined) {
    updateData.seoData = body.seoData ? JSON.stringify(body.seoData) : null;
  }
  if (body.securityData !== undefined) {
    updateData.securityData = body.securityData ? JSON.stringify(body.securityData) : null;
  }
  if (body.decisionLog !== undefined) {
    updateData.decisionLog = JSON.stringify(body.decisionLog ?? []);
  }
  if (body.accountHealth !== undefined) {
    updateData.accountHealth = body.accountHealth ? JSON.stringify(body.accountHealth) : null;
  }
  if (body.inventoryHealth !== undefined) {
    updateData.inventoryHealth = body.inventoryHealth ? JSON.stringify(body.inventoryHealth) : null;
  }
  if (body.salesDataNotes !== undefined) {
    updateData.salesDataNotes = body.salesDataNotes || null;
  }
  if (body.funnelTracking !== undefined) {
    updateData.funnelTracking = body.funnelTracking || null;
  }
}
