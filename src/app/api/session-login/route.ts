import { NextRequest, NextResponse } from "next/server";
import { signSession, timingSafeEqual } from "@/lib/sessionToken";

const DEMO_COOKIE = "oliwan-demo-session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8h

// Plain form POST target (not a server action) so this is a standard,
// directly-testable HTTP endpoint — no RSC action-encoding involved.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/");

  const expectedUser = process.env.CRM_USERNAME;
  const expectedPass = process.env.CRM_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  const loginUrl = new URL("/login", request.url);
  if (callbackUrl && callbackUrl !== "/") loginUrl.searchParams.set("callbackUrl", callbackUrl);

  if (!expectedUser || !expectedPass || !secret) {
    loginUrl.searchParams.set("error", "config");
    return NextResponse.redirect(loginUrl, 303);
  }

  const ok = timingSafeEqual(username, expectedUser) && timingSafeEqual(password, expectedPass);
  if (!ok) {
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, 303);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const value = await signSession(secret, expiresAt);

  const target = new URL(callbackUrl || "/", request.url);
  const res = NextResponse.redirect(target, 303);
  res.cookies.set(DEMO_COOKIE, value, {
    maxAge: SESSION_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
