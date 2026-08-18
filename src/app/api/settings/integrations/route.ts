import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsProperties } from "@/db/schema";
import { requireApi } from "@/lib/apiAuth";
import { getGithubStatus } from "@/lib/github";
import { getPaymentAutomationConfig, isGatewayConfigured, isWhatsAppConfigured } from "@/lib/paymentAutomation";

export const dynamic = "force-dynamic";

/**
 * Live connection status for every integration.
 *
 * The Integraciones page used to be four static cards permanently stamped
 * "Próximamente" — it said the same thing whether nothing was connected or
 * everything was. This reports what is actually configured right now, so the
 * page answers "is WhatsApp working?" instead of decorating the question.
 *
 * Only booleans and counts leave here. Tokens and secrets never do.
 */
export async function GET() {
  const denied = await requireApi("settings_integraciones");
  if (denied) return denied;

  const payment = await getPaymentAutomationConfig();
  const github = await getGithubStatus();
  const analytics = await db
    .select({ ga4: analyticsProperties.ga4PropertyId, gsc: analyticsProperties.gscSiteUrl })
    .from(analyticsProperties)
    .all();

  return NextResponse.json(
    {
      google: {
        connected: process.env.AUTH_ENABLED === "true" && !!process.env.AUTH_GOOGLE_ID,
        detail: "Login con Google para el equipo.",
      },
      email: {
        connected: !!(process.env.GMAIL_APP_PASSWORD || process.env.RESEND_API_KEY),
        detail: process.env.GMAIL_APP_PASSWORD ? "Gmail" : process.env.RESEND_API_KEY ? "Resend" : "Sin proveedor",
      },
      whatsapp: {
        connected: isWhatsAppConfigured(payment),
        detail: isWhatsAppConfigured(payment) ? "Meta Cloud API" : "Falta token o número",
      },
      payments: {
        connected: isGatewayConfigured(payment),
        detail: payment.gatewayProvider ? payment.gatewayProvider : "Sin pasarela",
      },
      ga4: {
        connected: analytics.some((a) => a.ga4),
        detail: `${analytics.filter((a) => a.ga4).length} sitio(s) con GA4`,
      },
      gsc: {
        connected: analytics.some((a) => a.gsc),
        detail: `${analytics.filter((a) => a.gsc).length} sitio(s) con Search Console`,
      },
      anthropic: {
        connected: !!process.env.ANTHROPIC_API_KEY,
        detail: "Clasificación de leads con IA en la web.",
      },
      cron: {
        connected: !!process.env.CRON_SECRET,
        detail: "Automatizaciones y resumen diario programados.",
      },
      github: {
        connected: github.configured,
        detail: github.configured ? `Token ${github.hint}` : "Sin token",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
