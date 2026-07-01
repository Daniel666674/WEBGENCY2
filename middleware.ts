import { NextResponse, type NextRequest } from "next/server";

// Auth is gated behind AUTH_ENABLED so the app keeps working exactly as
// today until Google OAuth credentials exist and this is flipped on.
// Once enabled, this only checks for the session cookie (edge-safe) —
// full session/DB verification happens server-side via auth() in layout.tsx.
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(request: NextRequest) {
  if (process.env.AUTH_ENABLED !== "true") {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/webhook|api/webhooks|login|p/|_next/static|_next/image|favicon.ico|logo.png|icon-192.png|icon-512.png|apple-touch-icon.png|manifest.json|spinner-1.png|spinner-2.png).*)",
  ],
};
