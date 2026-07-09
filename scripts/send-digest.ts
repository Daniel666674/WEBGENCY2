#!/usr/bin/env npx tsx

/**
 * Triggers POST /api/digest on a running CRM instance — sends the daily
 * email digest (ofertas expiradas/por vencer, tareas y solicitudes
 * pendientes, seguimientos vencidos, leads calientes, pipeline).
 *
 * Schedule it once a day via cron or a systemd timer on the machine that
 * runs `npm run local` — e.g. every day at 7:00:
 *
 *   crontab -e
 *   0 7 * * * cd /path/to/WEBGENCY2 && CRON_SECRET=... npx tsx scripts/send-digest.ts >> /var/log/oliwan-digest.log 2>&1
 *
 * Requires the same CRON_SECRET as the running server (.env.local), plus a
 * configured email provider (GMAIL_USER + GMAIL_APP_PASSWORD, or
 * RESEND_API_KEY) and DIGEST_EMAIL. Set CRM_BASE_URL if the CRM isn't on
 * localhost:3000.
 */

const baseUrl = process.env.CRM_BASE_URL || "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET;

async function main() {
  if (!cronSecret) {
    console.error(`[${new Date().toISOString()}] CRON_SECRET not set — refusing to call digest`);
    process.exit(1);
  }
  const res = await fetch(`${baseUrl}/api/digest`, {
    method: "POST",
    headers: { "x-cron-secret": cronSecret },
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`[${new Date().toISOString()}] digest failed:`, body);
    process.exit(1);
  }
  console.log(`[${new Date().toISOString()}] digest sent via ${body.provider} to ${body.sentTo}:`, body.summary);
}

main().catch((e) => {
  console.error(`[${new Date().toISOString()}] digest errored:`, e);
  process.exit(1);
});

export {};
