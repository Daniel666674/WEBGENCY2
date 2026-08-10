import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { allowedEmails, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ALL_PERMISSIONS, PERMISSION_KEYS } from "@/lib/permissions";

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
  if (!Array.isArray(input)) return [];
  return input.filter((v): v is string => typeof v === "string" && PERMISSION_KEYS.includes(v));
}

// PUT — update role/permissions. Writes both allowed_emails (governs future
// sign-ins) and the matching users row (takes effect on the user's very
// next request, since auth.ts re-reads `users` fresh every session check —
// no re-login required).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const { id } = await params;
  const entry = await db.select().from(allowedEmails).where(eq(allowedEmails.id, id)).get();
  if (!entry) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let body: { role?: string; permissions?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const role = body.role === "owner" ? "owner" : "member";
  const permissions = role === "owner" ? ALL_PERMISSIONS : sanitizePermissions(body.permissions);
  const permissionsJson = JSON.stringify(permissions);

  await db
    .update(allowedEmails)
    .set({ role, permissions: permissionsJson })
    .where(eq(allowedEmails.id, id))
    .run();

  await db
    .update(users)
    .set({ role, permissions: permissionsJson })
    .where(eq(users.email, entry.email))
    .run();

  return NextResponse.json({ ...entry, role, permissions });
}

// DELETE — revoke access entirely. Also strips the matching users row down
// to no access immediately, so an already-signed-in session can't keep
// using the CRM until it happens to expire.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const { id } = await params;
  const entry = await db.select().from(allowedEmails).where(eq(allowedEmails.id, id)).get();
  if (!entry) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (entry.email === gate.sessionUser!.email?.toLowerCase()) {
    return NextResponse.json({ error: "No podes revocar tu propio acceso" }, { status: 400 });
  }

  await db.delete(allowedEmails).where(eq(allowedEmails.id, id)).run();
  await db.update(users).set({ role: "member", permissions: "[]" }).where(eq(users.email, entry.email)).run();

  return NextResponse.json({ ok: true });
}
