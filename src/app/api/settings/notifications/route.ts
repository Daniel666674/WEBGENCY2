import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { getDigestEmail } from "@/lib/mailer";
import { getNotificationConfig, saveNotificationConfig } from "@/lib/notificationConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireApi("settings");
  if (denied) return denied;

  const config = await getNotificationConfig();
  return NextResponse.json(
    {
      config,
      // What the digest falls back to when no recipient is set here, so the
      // UI can say "va a X" instead of leaving it a mystery.
      envFallback: getDigestEmail() ?? null,
      providerConfigured: !!(process.env.GMAIL_APP_PASSWORD || process.env.RESEND_API_KEY),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: NextRequest) {
  const denied = await requireApi("settings", { ownerOnly: true });
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const saved = await saveNotificationConfig(body);
  await logAudit(request, "notification_config_update", "settings", "notification_config", {
    digestEnabled: saved.digestEnabled,
    recipients: saved.digestRecipients.length,
  });

  return NextResponse.json({ config: saved });
}
