import { NextRequest, NextResponse } from "next/server";
import { signSession, timingSafeEqual } from "@/lib/sessionToken";
import { getAccounts, LOGIN_AS_COOKIE, type Account } from "@/lib/accounts";

const DEMO_COOKIE = "oliwan-demo-session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8h

// Plain form POST target (not a server action) so this is a standard,
// directly-testable HTTP endpoint — no RSC action-encoding involved.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/");

  const secret = process.env.SESSION_SECRET;
  const accounts = getAccounts();

  const loginUrl = new URL("/login", request.url);
  if (callbackUrl && callbackUrl !== "/") loginUrl.searchParams.set("callbackUrl", callbackUrl);

  if (accounts.length === 0 || !secret) {
    loginUrl.searchParams.set("error", "config");
    return NextResponse.redirect(loginUrl, 303);
  }

  // Check every account (no early return) so the response time doesn't reveal
  // which usernames exist.
  let matched: Account | null = null;
  for (const acct of accounts) {
    const ok = timingSafeEqual(username, acct.username) && timingSafeEqual(password, acct.password);
    if (ok) matched = acct;
  }
  if (!matched) {
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
  // Non-sensitive UI hint: which app user to pre-select in the switcher. This
  // controls only theme/task-assignment defaults (both co-founders have equal
  // access), so it doesn't need to be signed like the session cookie above.
  res.cookies.set(LOGIN_AS_COOKIE, matched.isHers ? "hers" : "his", {
    maxAge: SESSION_MAX_AGE,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
