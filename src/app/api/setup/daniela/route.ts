import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

const TOKEN_KEY = "daniela_invite_token";
const EXPIRES_KEY = "daniela_invite_expires";
const USERNAME_KEY = "daniela_db_username";
const PASSWORD_KEY = "daniela_db_password_hash";

export async function POST(request: NextRequest) {
  let body: {
    token: string;
    username: string;
    password: string;
    name: string;
    color: string;
    avatar: string;
    image?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { token, username, password, name, color, avatar, image } = body;

  if (!token || !username?.trim() || !password || !name?.trim()) {
    return NextResponse.json({ error: "Campos incompletos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  // Validate token
  const [tokenRow, expiresRow] = await Promise.all([
    db.select().from(crmSettings).where(eq(crmSettings.key, TOKEN_KEY)).get(),
    db.select().from(crmSettings).where(eq(crmSettings.key, EXPIRES_KEY)).get(),
  ]);

  if (!tokenRow || tokenRow.value !== token) {
    return NextResponse.json({ error: "Token invalido" }, { status: 403 });
  }
  if (expiresRow && Number(expiresRow.value) < Date.now()) {
    return NextResponse.json({ error: "Token expirado — pide un nuevo link a Daniel" }, { status: 403 });
  }

  const passwordHash = await hashPassword(password);

  // Save credentials + update user profile atomically
  const daniela = await db.select().from(users).where(eq(users.isHers, true)).get();

  await Promise.all([
    db
      .insert(crmSettings)
      .values({ key: USERNAME_KEY, value: username.trim().toLowerCase() })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value: username.trim().toLowerCase() } }),
    db
      .insert(crmSettings)
      .values({ key: PASSWORD_KEY, value: passwordHash })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value: passwordHash } }),
    // Burn the invite token — single use
    db.delete(crmSettings).where(eq(crmSettings.key, TOKEN_KEY)),
    db.delete(crmSettings).where(eq(crmSettings.key, EXPIRES_KEY)),
    // Update Daniela's display profile
    ...(daniela
      ? [
          db
            .update(users)
            .set({
              name: name.trim(),
              color,
              avatar: avatar?.trim() || name.trim()[0],
              ...(image !== undefined ? { image } : {}),
            })
            .where(eq(users.id, daniela.id)),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
