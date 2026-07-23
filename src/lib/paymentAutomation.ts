// Backend for the payment-confirmation WhatsApp automation described in the
// plan: a gateway webhook confirms a payment, the CRM checks it against the
// 48h-before-due rule, and notifies Daniel + Daniela on WhatsApp either way.
// Credentials live in crm_settings (key/value), editable from
// Settings > Automatizaciones — not .env, so they can be set from the UI the
// moment real accounts exist without a redeploy.

import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SETTINGS_KEY = "payment_automation_config";

export type GatewayProvider = "" | "bold" | "wompi" | "payu";

export interface PaymentAutomationConfig {
  gatewayProvider: GatewayProvider;
  gatewayWebhookSecret: string;
  whatsappToken: string;
  whatsappPhoneNumberId: string;
  whatsappNotifyNumbers: string; // comma-separated, E.164
  whatsappTemplateName: string;
}

export const DEFAULT_PAYMENT_AUTOMATION_CONFIG: PaymentAutomationConfig = {
  gatewayProvider: "",
  gatewayWebhookSecret: "",
  whatsappToken: "",
  whatsappPhoneNumberId: "",
  whatsappNotifyNumbers: "",
  whatsappTemplateName: "payment_confirmation",
};

export async function getPaymentAutomationConfig(): Promise<PaymentAutomationConfig> {
  const row = await db.select().from(crmSettings).where(eq(crmSettings.key, SETTINGS_KEY)).get();
  if (!row) return DEFAULT_PAYMENT_AUTOMATION_CONFIG;
  try {
    return { ...DEFAULT_PAYMENT_AUTOMATION_CONFIG, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_PAYMENT_AUTOMATION_CONFIG;
  }
}

export async function savePaymentAutomationConfig(config: PaymentAutomationConfig) {
  const value = JSON.stringify(config);
  await db.insert(crmSettings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
    .run();
}

export function isWhatsAppConfigured(c: PaymentAutomationConfig): boolean {
  return !!(c.whatsappToken && c.whatsappPhoneNumberId && c.whatsappNotifyNumbers);
}

export function isGatewayConfigured(c: PaymentAutomationConfig): boolean {
  return !!(c.gatewayProvider && c.gatewayWebhookSecret);
}

export function getNotifyNumbers(c: PaymentAutomationConfig): string[] {
  return c.whatsappNotifyNumbers.split(",").map((n) => n.trim()).filter(Boolean);
}

// ─── WhatsApp sending (Meta Cloud API) ──────────────────────────────────────
// Proactive messages outside a 24h customer-initiated window require a
// pre-approved template (Meta Business Manager) — free-form text will fail.

export interface WhatsAppSendResult {
  ok: boolean;
  to: string;
  error?: string;
}

export async function sendWhatsAppTemplate(
  config: PaymentAutomationConfig,
  to: string,
  bodyParams: string[]
): Promise<WhatsAppSendResult> {
  if (!config.whatsappToken || !config.whatsappPhoneNumberId) {
    return { ok: false, to, error: "WhatsApp no configurado (falta token o phone number id)" };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: config.whatsappTemplateName || "payment_confirmation",
            language: { code: "es" },
            components: [
              { type: "body", parameters: bodyParams.map((p) => ({ type: "text", text: p })) },
            ],
          },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, to, error: `Meta API ${res.status}: ${errText}` };
    }
    return { ok: true, to };
  } catch (e) {
    return { ok: false, to, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendWhatsAppToNotifyNumbers(
  config: PaymentAutomationConfig,
  bodyParams: string[]
): Promise<WhatsAppSendResult[]> {
  const numbers = getNotifyNumbers(config);
  if (numbers.length === 0) {
    return [{ ok: false, to: "", error: "No hay numeros configurados en whatsappNotifyNumbers" }];
  }
  return Promise.all(numbers.map((n) => sendWhatsAppTemplate(config, n, bodyParams)));
}

// ─── Gateway webhook: signature verification + payload parsing ─────────────
// Wompi's checksum scheme is implemented for real (public, stable spec).
// Bold/PayU intentionally fail closed until their exact webhook shape is
// confirmed — rejecting an unverifiable webhook is the safe default; a
// forged "payment received" event should never be able to silently restore
// a client's automations.

export interface SignatureResult {
  verified: boolean;
  reason?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function verifyWompiSignature(payload: any, secret: string): SignatureResult {
  const signature = payload?.signature;
  const timestamp = payload?.timestamp;
  if (!signature?.checksum || !Array.isArray(signature?.properties) || !timestamp) {
    return { verified: false, reason: "Payload de Wompi incompleto" };
  }
  const concatenated = signature.properties
    .map((propPath: string) => {
      let value: unknown = payload;
      for (const part of propPath.split(".")) {
        value = (value as Record<string, unknown> | undefined)?.[part];
      }
      return value;
    })
    .join("");
  const computed = crypto
    .createHash("sha256")
    .update(`${concatenated}${timestamp}${secret}`)
    .digest("hex");
  const verified = computed === signature.checksum;
  return { verified, reason: verified ? undefined : "Checksum no coincide" };
}

export function verifyGatewaySignature(
  provider: GatewayProvider,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  secret: string
): SignatureResult {
  switch (provider) {
    case "wompi":
      return verifyWompiSignature(payload, secret);
    case "bold":
    case "payu":
      return {
        verified: false,
        reason: `Verificacion de firma para ${provider} aun no implementada — confirmar el formato real del webhook antes de activar en produccion`,
      };
    default:
      return { verified: false, reason: "Proveedor de pasarela no configurado" };
  }
}

export interface ParsedPaymentEvent {
  reference: string;
  amountCents: number;
  status: "approved" | "declined" | "pending";
  paidAt: Date;
}

export function parseGatewayPayload(
  provider: GatewayProvider,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): ParsedPaymentEvent | null {
  if (provider === "wompi") {
    const tx = payload?.data?.transaction;
    if (!tx?.reference) return null;
    return {
      reference: tx.reference,
      amountCents: tx.amount_in_cents ?? 0,
      status: tx.status === "APPROVED" ? "approved" : tx.status === "DECLINED" ? "declined" : "pending",
      paidAt: tx.finalized_at ? new Date(tx.finalized_at) : new Date(),
    };
  }
  return null; // Bold/PayU: shape not confirmed yet
}
