import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "@/lib/sessionToken";

const TOKEN_KEY = "daniela_invite_token";
const EXPIRES_KEY = "daniela_invite_expires";
const SETUP_DONE_KEY = "daniela_db_username";

// GET ?token=<uuid> — public; validate token and return Daniela's current profile
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const [tokenRow, expiresRow] = await Promise.all([
    db.select().from(crmSettings).where(eq(crmSettings.key, TOKEN_KEY)).get(),
    db.select().from(crmSettings).where(eq(crmSettings.key, EXPIRES_KEY)).get(),
  ]);

  if (!tokenRow || tokenRow.value !== token) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 403 });
  }
  if (expiresRow && Number(expiresRow.value) < Date.now()) {
    return NextResponse.json({ error: "Token expirado" }, { status: 403 });
  }

  const daniela = await db.select().from(users).where(eq(users.isHers, true)).get();

  return NextResponse.json({
    valid: true,
    user: daniela
      ? { id: daniela.id, name: daniela.name, color: daniela.color, avatar: daniela.avatar }
      : null,
  });
}

// POST — protected: generate a new invite token (verifies session manually since
// this endpoint is excluded from proxy to allow public GET).
export async function POST(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const cookie = request.cookies.get("oliwan-demo-session")?.value;
  const authed = !!secret && (await verifySession(secret, cookie));
  if (!authed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Check if Daniela has already completed setup
  const done = await db.select().from(crmSettings).where(eq(crmSettings.key, SETUP_DONE_KEY)).get();
  const alreadySetup = !!done?.value;

  const token = crypto.randomUUID();
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24h

  await Promise.all([
    db
      .insert(crmSettings)
      .values({ key: TOKEN_KEY, value: token })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value: token } }),
    db
      .insert(crmSettings)
      .values({ key: EXPIRES_KEY, value: String(expires) })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value: String(expires) } }),
  ]);

  const base = process.env.CRM_BASE_URL ?? new URL(request.url).origin;
  return NextResponse.json({ token, url: `${base}/join?token=${token}`, alreadySetup });
}

// DELETE — protected: revoke the current invite token
export async function DELETE(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const cookie = request.cookies.get("oliwan-demo-session")?.value;
  const authed = !!secret && (await verifySession(secret, cookie));
  if (!authed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await Promise.all([
    db.delete(crmSettings).where(eq(crmSettings.key, TOKEN_KEY)),
    db.delete(crmSettings).where(eq(crmSettings.key, EXPIRES_KEY)),
  ]);

  return NextResponse.json({ ok: true });
}
