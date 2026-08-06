import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { allowedEmails, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ALL_PERMISSIONS, DEFAULT_NEW_USER_PERMISSIONS, NAV_SECTION_KEYS } from "@/lib/permissions";

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
  const valid = input.filter((v): v is string => NAV_SECTION_KEYS.includes(v));
  return valid.length ? valid : DEFAULT_NEW_USER_PERMISSIONS;
}

export async function GET() {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const rows = await db.select().from(allowedEmails).all();
  const registered = await db
    .select({ id: users.id, email: users.email, name: users.name, image: users.image })
    .from(users)
    .all();

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      permissions: JSON.parse(r.permissions || "[]"),
      registeredUser: registered.find((u) => (u.email ?? "").toLowerCase() === r.email) ?? null,
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

  const email = (body.email ?? "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  const role = body.role === "owner" ? "owner" : "member";
  const permissions = role === "owner" ? ALL_PERMISSIONS : sanitizePermissions(body.permissions);

  const existing = await db.select().from(allowedEmails).where(eq(allowedEmails.email, email)).get();
  if (existing) {
    return NextResponse.json({ error: "Ese email ya tiene acceso" }, { status: 409 });
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

  return NextResponse.json({ ...created, permissions });
}
