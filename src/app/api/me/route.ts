import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Returns the currently authenticated user's profile.
// When AUTH_ENABLED=true this is the real Google session user.
// Used by UserContext to know who is logged in without localStorage guessing.
export async function GET() {
  const authEnabled = process.env.AUTH_ENABLED === "true";
  if (!authEnabled) {
    return NextResponse.json({ authEnabled: false });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ authEnabled: true, user: null }, { status: 401 });
  }

  const sessionUser = session.user as typeof session.user & { id?: string; role?: string; isHers?: boolean };
  if (!sessionUser.id) {
    return NextResponse.json({ authEnabled: true, user: null }, { status: 401 });
  }

  // Pull full row from DB to get color, avatar, isHers, role
  const dbUser = await db.select().from(users).where(eq(users.id, sessionUser.id)).get();

  return NextResponse.json({
    authEnabled: true,
    user: dbUser
      ? {
          id:     dbUser.id,
          name:   dbUser.name ?? sessionUser.name ?? "Usuario",
          email:  dbUser.email ?? sessionUser.email ?? "",
          image:  dbUser.image ?? sessionUser.image ?? null,
          color:  dbUser.color ?? "#6b7280",
          avatar: dbUser.avatar ?? null,
          isHers: dbUser.isHers ?? false,
          role:   dbUser.role ?? "member",
        }
      : null,
  });
}
