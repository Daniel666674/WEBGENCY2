import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { isNotNull, and, eq } from "drizzle-orm";
import { getPaymentAutomationConfig, sendWhatsAppToNotifyNumbers } from "@/lib/paymentAutomation";
import { formatCurrency } from "@/lib/constants";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

// Hit hourly by scripts/check-payment-standing.ts via cron/systemd timer.
// This is the only place that catches "nobody paid at all" — the webhook
// only fires when a payment actually lands, so a client who simply never
// pays would otherwise stay marked as fine forever.
//
// This route is excluded from the cookie-based auth middleware (a cron job
// has no browser session), so it's gated by its own shared secret instead —
// unset CRON_SECRET means this endpoint refuses everything, not "open to
// anyone who finds the URL."
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado o no coincide" }, { status: 401 });
  }

  const config = getPaymentAutomationConfig();
  const now = Date.now();

  const candidates = db
    .select()
    .from(contacts)
    .where(and(isNotNull(contacts.monthlyPayment), isNotNull(contacts.nextPaymentDate)))
    .all();

  const newlySuspended: { id: string; name: string }[] = [];

  for (const contact of candidates) {
    if (contact.automationsSuspended) continue;
    if (!contact.nextPaymentDate) continue;

    const cutoff = contact.nextPaymentDate.getTime() - FORTY_EIGHT_HOURS_MS;
    if (now < cutoff) continue;

    db.update(contacts)
      .set({ automationsSuspended: 1, updatedAt: new Date() })
      .where(eq(contacts.id, contact.id))
      .run();

    newlySuspended.push({ id: contact.id, name: contact.company || contact.name });

    await sendWhatsAppToNotifyNumbers(config, [
      contact.company || contact.name,
      formatCurrency(contact.monthlyPayment ?? 0),
      "no ha pagado con 48h de anticipacion — automatizaciones suspendidas",
    ]);
  }

  return NextResponse.json({ checked: candidates.length, newlySuspended });
}
