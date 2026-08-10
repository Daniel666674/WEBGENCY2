import { NextResponse } from "next/server";
import {
  getPaymentAutomationConfig,
  isWhatsAppConfigured,
  sendWhatsAppToNotifyNumbers,
} from "@/lib/paymentAutomation";
import { requireNavPermission } from "@/lib/permissions-server";

export async function POST() {
  const denied = await requireNavPermission("settings");
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const config = await getPaymentAutomationConfig();

  if (!isWhatsAppConfigured(config)) {
    return NextResponse.json(
      { error: "Faltan datos: token, phone number id o numeros de destino" },
      { status: 400 }
    );
  }

  const results = await sendWhatsAppToNotifyNumbers(config, [
    "Prueba",
    "$0",
    "mensaje de prueba desde Settings > Automatizaciones",
  ]);

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 502 });
}
