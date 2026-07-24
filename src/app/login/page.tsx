import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LoginScreen } from "@/components/login/LoginScreen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const authEnabled = process.env.AUTH_ENABLED === "true";

  if (authEnabled) {
    const session = await auth();
    if (session) redirect(callbackUrl || "/");
  }
  // Credentials mode's own "already logged in" check happens via proxy.ts —
  // if this page is reachable, the signed cookie is missing or expired.
  // The form below posts to /api/session-login (a plain route, not a
  // server action) — standard HTTP semantics, works with or without JS,
  // and is directly testable with curl.

  async function enterWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl || "/" });
  }

  return (
    <LoginScreen
      authEnabled={authEnabled}
      callbackUrl={callbackUrl || "/"}
      error={error}
      onGoogle={enterWithGoogle}
    />
  );
}
