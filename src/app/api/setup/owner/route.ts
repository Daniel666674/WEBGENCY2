import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/password";
import { verifySession } from "@/lib/sessionToken";
import { timingSafeEqual } from "@/lib/sessionToken";
import { getAccounts } from "@/lib/accounts";

const USERNAME_KEY = "owner_db_username";
const PASSWORD_KEY = "owner_db_password_hash";

// POST — change the owner's login credentials.
// Requires either:
//   a) valid session cookie (owner is logged in), or
//   b) the current env-var password (bootstrap case where no session exists yet)
export async function POST(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const cookie = request.cookies.get("oliwan-demo-session")?.value;
  const hasSession = !!secret && (await verifySession(secret, cookie));

  let body: {
    currentPassword: string;
    newUsername: string;
    newPassword: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { currentPassword, newUsername, newPassword } = body;

  if (!newUsername?.trim() || !newPassword || !currentPassword) {
    return NextResponse.json({ error: "Campos incompletos" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  // Verify current password against env vars OR existing DB hash
  let currentPasswordOk = false;

  // Check env var first
  const accounts = getAccounts();
  const ownerAcct = accounts.find((a) => a.key === "owner");
  if (ownerAcct) {
    currentPasswordOk = timingSafeEqual(currentPassword, ownerAcct.password);
  }

  if (!currentPasswordOk) {
    // Check DB-stored hash (in case owner already changed credentials)
    const dbHash = await db
      .select()
      .from(crmSettings)
      .where(eq(crmSettings.key, PASSWORD_KEY))
      .get();
    if (dbHash?.value) {
      currentPasswordOk = await verifyPassword(currentPassword, dbHash.value);
    }
  }

  // Must have a valid session OR have provided the correct current password
  if (!hasSession && !currentPasswordOk) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!currentPasswordOk) {
    return NextResponse.json(
      { error: "Contraseña actual incorrecta" },
      { status: 403 }
    );
  }

  const newHash = await hashPassword(newPassword);

  await Promise.all([
    db
      .insert(crmSettings)
      .values({ key: USERNAME_KEY, value: newUsername.trim().toLowerCase() })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value: newUsername.trim().toLowerCase() } }),
    db
      .insert(crmSettings)
      .values({ key: PASSWORD_KEY, value: newHash })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value: newHash } }),
  ]);

  return NextResponse.json({ ok: true });
}
