import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentAutomationConfig,
  savePaymentAutomationConfig,
  type PaymentAutomationConfig,
} from "@/lib/paymentAutomation";

const SECRET_FIELDS: (keyof PaymentAutomationConfig)[] = ["gatewayWebhookSecret", "whatsappToken"];

function mask(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return "•".repeat(Math.max(value.length - 4, 4)) + value.slice(-4);
}

function isMasked(value: string): boolean {
  return value.startsWith("•");
}

export async function GET() {
  const config = getPaymentAutomationConfig();
  const masked = { ...config };
  for (const field of SECRET_FIELDS) {
    masked[field] = mask(config[field] as string) as never;
  }
  return NextResponse.json(masked);
}

export async function PUT(request: NextRequest) {
  let body: Partial<PaymentAutomationConfig>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const current = getPaymentAutomationConfig();
  const next: PaymentAutomationConfig = { ...current, ...body };

  // A masked placeholder coming back unchanged means "keep the stored secret"
  for (const field of SECRET_FIELDS) {
    const incoming = body[field];
    if (incoming !== undefined && isMasked(incoming as string)) {
      next[field] = current[field] as never;
    }
  }

  savePaymentAutomationConfig(next);
  return NextResponse.json({ ok: true });
}
