import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { allowedEmails, users } from "@/db/schema";
import { auth } from "@/auth";
import { ALL_PERMISSIONS, DEFAULT_NEW_USER_PERMISSIONS, PERMISSION_KEYS, parsePermissions } from "@/lib/permissions";
import { cleanEmail, canonicalEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

// Only the owner manages who's allowed in and what they can see — this is
// deliberately stricter than the generic "config" nav permission, since
// granting someone the Config tab shouldn't also let them add or remove
// other users.
async function requireOwner() {
  if (process.env.AUTH_ENABLED !== "true") {
    return { error: NextResponse.json({ error: "Requiere AUTH_ENABLED" }, { status: 400 }) };
  }
  const session = await auth();
  const sessionUser = session?.user as
    | (NonNullable<typeof session>["user"] & { id?: string; role?: string })
    | undefined;
  if (!sessionUser?.id) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  if (sessionUser.role !== "owner") {
    return { error: NextResponse.json({ error: "Solo el owner puede gestionar usuarios" }, { status: 403 }) };
  }
  return { sessionUser };
}

function sanitizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return DEFAULT_NEW_USER_PERMISSIONS;
  const valid = input.filter((v): v is string => typeof v === "string" && PERMISSION_KEYS.includes(v));
  return valid.length ? valid : DEFAULT_NEW_USER_PERMISSIONS;
}

export async function GET() {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const rows = await db.select().from(allowedEmails).all();
  const registered = await db
    .select({ id: users.id, email: users.email, name: users.name, image: users.image, lastLoginAt: users.lastLoginAt })
    .from(users)
    .all();

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      permissions: parsePermissions(r.permissions),
      registeredUser: registered.find((u) => (u.email ?? "").toLowerCase() === r.email) ?? null,
      invitedByName: registered.find((u) => u.id === r.invitedByUserId)?.name ?? null,
    }))
  );
}

export async function POST(request: NextRequest) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  let body: { email?: string; role?: string; permissions?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const email = cleanEmail(body.email);
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  const role = body.role === "owner" ? "owner" : "member";
  const permissions = role === "owner" ? ALL_PERMISSIONS : sanitizePermissions(body.permissions);

  // Compare canonically so juan.perez@gmail.com and juanperez@gmail.com — the
  // same mailbox — can't become two rows with conflicting permissions.
  const key = canonicalEmail(email);
  const existing = (await db.select().from(allowedEmails).all()).find((r) => canonicalEmail(r.email) === key);
  if (existing) {
    return NextResponse.json(
      { error: existing.email === email ? "Ese email ya tiene acceso" : `Ese buzón ya tiene acceso como ${existing.email}` },
      { status: 409 }
    );
  }

  const created = await db
    .insert(allowedEmails)
    .values({
      email,
      role,
      permissions: JSON.stringify(permissions),
      invitedByUserId: gate.sessionUser!.id,
    })
    .returning()
    .get();

  await logAudit(request, "invite", "allowed_email", created.id, { email, role, permissions });

  return NextResponse.json({ ...created, permissions });
}
