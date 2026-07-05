import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getPaymentAutomationConfig,
  isGatewayConfigured,
  verifyGatewaySignature,
  parseGatewayPayload,
  sendWhatsAppToNotifyNumbers,
} from "@/lib/paymentAutomation";
import { formatCurrency } from "@/lib/constants";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const config = getPaymentAutomationConfig();

  if (!isGatewayConfigured(config)) {
    return NextResponse.json(
      { error: "Pasarela de pagos no configurada — ve a Settings > Automatizaciones" },
      { status: 501 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const signature = verifyGatewaySignature(config.gatewayProvider, payload, config.gatewayWebhookSecret);
  if (!signature.verified) {
    return NextResponse.json({ error: `Firma no valida: ${signature.reason}` }, { status: 401 });
  }

  const event = parseGatewayPayload(config.gatewayProvider, payload);
  if (!event) {
    return NextResponse.json({ error: "No se pudo interpretar el payload de la pasarela" }, { status: 400 });
  }

  if (event.status !== "approved") {
    return NextResponse.json({ ok: true, ignored: true, status: event.status });
  }

  const contact = db.select().from(contacts).where(eq(contacts.lastPaymentRef, event.reference)).get();
  if (!contact) {
    return NextResponse.json(
      { error: `Ningun contacto tiene last_payment_ref = ${event.reference}` },
      { status: 404 }
    );
  }

  db.insert(payments)
    .values({
      clientId: contact.id,
      amountCents: event.amountCents,
      paidAt: event.paidAt,
      note: `Pago automatico via ${config.gatewayProvider} (ref ${event.reference})`,
      createdAt: new Date(),
    })
    .run();

  const dueDate = contact.nextPaymentDate;
  const onTime = dueDate ? event.paidAt.getTime() <= dueDate.getTime() - FORTY_EIGHT_HOURS_MS : null;
  const nextPaymentDate = dueDate ? new Date(dueDate.getTime() + ONE_MONTH_MS) : new Date(event.paidAt.getTime() + ONE_MONTH_MS);

  db.update(contacts)
    .set({
      nextPaymentDate,
      automationsSuspended: onTime === false ? contact.automationsSuspended : 0,
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, contact.id))
    .run();

  const clientLabel = contact.company || contact.name;
  const amountLabel = formatCurrency(event.amountCents);
  const messageParams =
    onTime === false
      ? [clientLabel, amountLabel, "PAGO TARDIO — automatizaciones siguen suspendidas"]
      : [clientLabel, amountLabel, "a tiempo"];

  const whatsapp = await sendWhatsAppToNotifyNumbers(config, messageParams);

  return NextResponse.json({
    ok: true,
    contactId: contact.id,
    onTime,
    nextPaymentDate,
    whatsapp,
  });
}
