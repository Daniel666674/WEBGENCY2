import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const clear = { path: "/", expires: new Date(0), maxAge: 0 };
  cookieStore.set("oliwan-demo-session", "", { ...clear, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  cookieStore.set("authjs.session-token", "", { ...clear, httpOnly: true, sameSite: "lax" });
  // The __Secure- prefix (what Auth.js actually names this cookie once the
  // site is on HTTPS, which login itself requires) is only settable —
  // clearing included — with the Secure attribute on the Set-Cookie header.
  // `cookieStore.delete(name)` doesn't add it, so the browser rejected the
  // clear outright and the session just kept working: this was the whole bug.
  cookieStore.set("__Secure-authjs.session-token", "", { ...clear, httpOnly: true, sameSite: "lax", secure: true });
  return NextResponse.json({ ok: true });
}
