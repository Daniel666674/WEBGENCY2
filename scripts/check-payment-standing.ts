#!/usr/bin/env npx tsx

/**
 * Hits POST /api/payments/check-standing on a running CRM instance.
 * This is the piece that enforces the 48h-before-due rule for clients who
 * simply never pay — the gateway webhook only fires when a payment actually
 * lands, so this is the only thing that catches "nobody paid at all."
 *
 * Run this on a schedule (hourly is reasonable) via cron or a systemd timer
 * on whatever machine runs `npm run local`:
 *
 *   crontab -e
 *   0 * * * * cd /path/to/WEBGENCY2 && CRON_SECRET=... npx tsx scripts/check-payment-standing.ts >> /var/log/oliwan-standing.log 2>&1
 *
 * Requires the same CRON_SECRET as the running server (.env.local) — the
 * route rejects everything without it. Set CRM_BASE_URL too if the CRM
 * isn't on localhost:3000.
 */

const baseUrl = process.env.CRM_BASE_URL || "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET;

async function main() {
  if (!cronSecret) {
    console.error(`[${new Date().toISOString()}] CRON_SECRET not set — refusing to call check-standing`);
    process.exit(1);
  }
  const res = await fetch(`${baseUrl}/api/payments/check-standing`, {
    method: "POST",
    headers: { "x-cron-secret": cronSecret },
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`[${new Date().toISOString()}] check-standing failed:`, body);
    process.exit(1);
  }
  console.log(`[${new Date().toISOString()}] checked ${body.checked} contacts, newly suspended:`, body.newlySuspended);
}

main().catch((e) => {
  console.error(`[${new Date().toISOString()}] check-standing errored:`, e);
  process.exit(1);
});
