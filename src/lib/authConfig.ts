/**
 * Preflight check for the Google-OAuth environment.
 *
 * Auth.js validates its own config internally, but when something is
 * missing it renders a generic "Server error / There is a problem with the
 * server configuration. Check the server logs for more information." page —
 * which is a dead end for anyone who can't tail the deploy's logs from their
 * phone. This module reproduces the same checks up front so the login screen
 * can say *which* variable is missing instead.
 *
 * Server-only: it reads process.env and must never be imported from a
 * client component.
 */

export type AuthConfigProblem = {
  /** Env var at fault — shown verbatim so it can be copy-pasted into the deploy's settings. */
  key: string;
  /** Human-readable, actionable description (Spanish, matching the rest of the UI). */
  message: string;
};

function isBlank(key: string): boolean {
  return !(process.env[key] ?? "").trim();
}

/**
 * Returns every reason Google sign-in cannot work right now. Empty array
 * means the environment is complete. Always empty when AUTH_ENABLED is off,
 * since the app is then on the legacy credentials flow and none of these
 * variables apply.
 */
export function authConfigProblems(): AuthConfigProblem[] {
  if (process.env.AUTH_ENABLED !== "true") return [];

  const problems: AuthConfigProblem[] = [];

  // Auth.js refuses to start without a secret — this is the single most
  // common cause of the generic "Server error" page, because it's easy to
  // set GOOGLE_CLIENT_ID/SECRET in a deploy and forget this one.
  if (isBlank("AUTH_SECRET") && isBlank("NEXTAUTH_SECRET")) {
    problems.push({
      key: "AUTH_SECRET",
      message: "Falta AUTH_SECRET. Generalo con `npx auth secret` y agregalo a las variables de entorno del servidor.",
    });
  }

  if (isBlank("GOOGLE_CLIENT_ID")) {
    problems.push({
      key: "GOOGLE_CLIENT_ID",
      message: "Falta GOOGLE_CLIENT_ID (Google Cloud Console > Credentials > OAuth client ID).",
    });
  }

  if (isBlank("GOOGLE_CLIENT_SECRET")) {
    problems.push({
      key: "GOOGLE_CLIENT_SECRET",
      message: "Falta GOOGLE_CLIENT_SECRET (el mismo OAuth client de Google Cloud Console).",
    });
  }

  // The allowlist, the users table and the session store all live in Turso —
  // without it every sign-in throws mid-flow and surfaces as the same
  // opaque server error.
  if (isBlank("TURSO_DATABASE_URL")) {
    problems.push({
      key: "TURSO_DATABASE_URL",
      message: "Falta TURSO_DATABASE_URL. Sin base de datos no hay sesiones ni lista de acceso.",
    });
  }

  return problems;
}

/** Auth.js `error=` query values, mapped to something a human can act on. */
const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "El servidor no tiene bien configurado el inicio de sesion con Google. Revisa las variables de entorno (AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).",
  AccessDenied:
    "Esa cuenta de Google no esta autorizada. Pedile al owner que te invite desde Configuracion > Usuarios, usando exactamente ese email.",
  Verification: "El enlace de acceso expiro o ya fue usado. Intenta iniciar sesion de nuevo.",
  OAuthSignin: "No se pudo iniciar el flujo de Google. Revisa GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
  OAuthCallback:
    "Google rechazo la respuesta. Normalmente es el redirect URI: debe ser exactamente <tu-dominio>/api/auth/callback/google.",
  OAuthAccountNotLinked: "Ese email ya existe en el CRM asociado a otro metodo de acceso.",
  Callback: "Fallo el paso final del inicio de sesion. Reintenta; si sigue, revisa los logs del servidor.",
  db: "No se pudo consultar la base de datos durante el inicio de sesion. Revisa TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.",
  // Legacy credentials-mode codes, kept so the old flow keeps working.
  "1": "Usuario o contrasena incorrectos",
  config: "Falta CRM_USERNAME / CRM_PASSWORD / SESSION_SECRET en el servidor",
};

export function describeAuthError(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? "No se pudo iniciar sesion. Intenta de nuevo.";
}
