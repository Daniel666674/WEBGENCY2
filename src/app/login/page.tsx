import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LoginScreen } from "@/components/login/LoginScreen";
import { authConfigProblems, describeAuthError } from "@/lib/authConfig";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const authEnabled = process.env.AUTH_ENABLED === "true";
  const problems = authConfigProblems();

  if (authEnabled && problems.length === 0) {
    // Only worth asking when the environment is actually complete — with a
    // missing AUTH_SECRET this call throws, and an unhandled throw here
    // turns the one page that could explain the problem into a 500.
    try {
      const session = await auth();
      if (session) redirect(callbackUrl || "/");
    } catch (err) {
      // redirect() signals via a thrown control-flow error — rethrow it.
      if (err && typeof err === "object" && "digest" in err) throw err;
      console.error("[login] no se pudo leer la sesion:", err);
    }

    // Auth.js lumps every internal error (database column missing, adapter
    // crash, etc.) under error=Configuration. When the env vars ARE present
    // the generic message is misleading — expose the real symptom instead.
    if (error === "Configuration") {
      try {
        const { ensureSchema } = await import("@/db");
        await ensureSchema();
      } catch (schemaErr) {
        console.error("[login] ensureSchema fallo:", schemaErr);
      }
    }
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
      errorMessage={describeAuthError(error)}
      configProblems={problems.map((p) => p.message)}
      onGoogle={enterWithGoogle}
    />
  );
}
