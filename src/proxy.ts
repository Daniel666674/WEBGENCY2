import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/sessionToken";

// Real auth is gated behind AUTH_ENABLED so the app keeps working exactly
// as today until Google OAuth credentials exist and this is flipped on.
// Once enabled, this only checks for the session cookie (edge-safe) —
// full session/DB verification happens server-side via auth() in layout.tsx.
//
// Until then, a signed session cookie gates the app instead — see
// src/lib/sessionToken.ts for why it's signed rather than a bare presence
// check (a bare check is trivially bypassable with a hand-crafted request,
// no browser or password involved).
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];
const DEMO_COOKIE = "oliwan-demo-session";

export async function proxy(request: NextRequest) {
  const authEnabled = process.env.AUTH_ENABLED === "true";

  let hasSession: boolean;
  if (authEnabled) {
    hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
  } else {
    const secret = process.env.SESSION_SECRET;
    hasSession = !!secret && (await verifySession(secret, request.cookies.get(DEMO_COOKIE)?.value));
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/webhook|api/webhooks|api/p/|api/payments/webhook|api/payments/check-standing|api/digest|api/session-login|api/daniela-invite|api/setup/daniela|login|join|p/|_next/static|_next/image|favicon.ico|logo.png|icon-192.png|icon-512.png|apple-touch-icon.png|manifest.json|spinner-1.png|spinner-2.png).*)",
  ],
};
