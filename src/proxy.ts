import { NextResponse, type NextRequest } from "next/server";

// Real auth is gated behind AUTH_ENABLED so the app keeps working exactly
// as today until Google OAuth credentials exist and this is flipped on.
// Once enabled, this only checks for the session cookie (edge-safe) —
// full session/DB verification happens server-side via auth() in layout.tsx.
//
// Until then, a lightweight "demo session" cookie gates the app instead —
// this simulates the real login flow (see the login page) without needing
// real credentials, so the experience of landing on login first is real today.
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];
const DEMO_COOKIE = "oliwan-demo-session";

export function proxy(request: NextRequest) {
  const authEnabled = process.env.AUTH_ENABLED === "true";
  const hasSession = authEnabled
    ? SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name))
    : request.cookies.has(DEMO_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/webhook|api/webhooks|api/p/|api/payments/webhook|api/payments/check-standing|login|p/|_next/static|_next/image|favicon.ico|logo.png|icon-192.png|icon-512.png|apple-touch-icon.png|manifest.json|spinner-1.png|spinner-2.png).*)",
  ],
};
