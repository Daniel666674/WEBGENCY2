// Unified email sender for the digest. Two free providers, first configured
// one wins:
//
//   1. Gmail — GMAIL_USER + GMAIL_APP_PASSWORD (Google Account > Security >
//      2-Step Verification > App passwords). No Google Cloud Console needed.
//   2. Resend — RESEND_API_KEY (resend.com, free tier).
//
// Nothing configured → returns instructions instead of failing silently,
// same pattern as the WhatsApp/payment-automation config.

export interface MailResult {
  ok: boolean;
  provider?: "gmail" | "resend";
  error?: string;
  instructions?: string[];
}

export function getDigestEmail(): string | undefined {
  return process.env.DIGEST_EMAIL || process.env.GMAIL_USER || undefined;
}

export async function sendMail(subject: string, html: string): Promise<MailResult> {
  const to = getDigestEmail();
  if (!to) {
    return {
      ok: false,
      error: "Falta DIGEST_EMAIL (o GMAIL_USER) en .env.local",
      instructions: setupInstructions(),
    };
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({
        from: `OLIWAN <${gmailUser}>`,
        to,
        subject,
        html,
      });
      return { ok: true, provider: "gmail" };
    } catch (e) {
      return { ok: false, provider: "gmail", error: e instanceof Error ? e.message : String(e) };
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: process.env.DIGEST_FROM || "OLIWAN <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) return { ok: false, provider: "resend", error: await res.text() };
      return { ok: true, provider: "resend" };
    } catch (e) {
      return { ok: false, provider: "resend", error: e instanceof Error ? e.message : String(e) };
    }
  }

  return { ok: false, error: "Ningun proveedor de email configurado", instructions: setupInstructions() };
}

function setupInstructions(): string[] {
  return [
    "Opcion A — Gmail (gratis, 5 min, sin Google Cloud Console):",
    "  1. Google Account > Seguridad > Verificacion en 2 pasos (activala si no)",
    "  2. Busca 'App passwords' y genera una para 'Correo'",
    "  3. En .env.local:  GMAIL_USER=tu@gmail.com  GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx",
    "Opcion B — Resend (gratis):",
    "  1. Registrate en https://resend.com y crea un API key",
    "  2. En .env.local:  RESEND_API_KEY=re_...  DIGEST_EMAIL=tu@email.com",
    "Luego reinicia el servidor.",
  ];
}
