import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { authConfigProblems } from "@/lib/authConfig";
import { verifySession } from "@/lib/sessionToken";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * Self-diagnostic for Google sign-in — owner-only.
 *
 * Reports whether env vars are set, DB tables exist, and the allowlist is
 * populated. Gated behind authentication so infrastructure details aren't
 * publicly reachable.
 */

const REQUIRED_TABLES = ["users", "accounts", "sessions", "verificationTokens", "allowed_emails"];

export async function GET(request: NextRequest) {
  if (process.env.AUTH_ENABLED === "true") {
    const session = await auth();
    const user = session?.user as
      | (NonNullable<typeof session>["user"] & { role?: string })
      | undefined;
    if (user?.role !== "owner") {
      return NextResponse.json({ error: "Solo el owner puede ver esto" }, { status: 403 });
    }
  } else {
    const secret = process.env.SESSION_SECRET ?? "";
    const cookie = request.cookies.get("oliwan-demo-session")?.value;
    if (!secret || !(await verifySession(secret, cookie))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }
  const isSet = (key: string) => Boolean((process.env[key] ?? "").trim());

  const env = {
    AUTH_ENABLED: process.env.AUTH_ENABLED === "true",
    AUTH_SECRET: isSet("AUTH_SECRET") || isSet("NEXTAUTH_SECRET"),
    GOOGLE_CLIENT_ID: isSet("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: isSet("GOOGLE_CLIENT_SECRET"),
    TURSO_DATABASE_URL: isSet("TURSO_DATABASE_URL"),
    TURSO_AUTH_TOKEN: isSet("TURSO_AUTH_TOKEN"),
    OWNER_EMAIL: isSet("OWNER_EMAIL"),
  };

  // The URI Google must have on its allowlist, derived from the host actually
  // serving this request — a mismatch here is the other classic failure.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const expectedRedirectUri = host ? `${proto}://${host}/api/auth/callback/google` : null;

  // Vercel exposes which deployment target this is. AUTH_ENABLED scoped to
  // "Production and Preview" while the credentials are Production-only is a
  // real trap: preview URLs turn auth on with nothing behind it.
  const vercelEnv = process.env.VERCEL_ENV ?? null;

  const db: Record<string, unknown> = { reachable: false };

  if (env.TURSO_DATABASE_URL) {
    try {
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      const { rows: tableRows } = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      );
      const tables = tableRows.map((r) => String(r.name));
      db.reachable = true;
      db.missingTables = REQUIRED_TABLES.filter((t) => !tables.includes(t));

      // A NOT NULL column with no default that Auth.js's adapter doesn't
      // populate makes createUser throw — which surfaces as the same generic
      // "Server error" page, but only ever for people signing in for the
      // first time.
      const { rows: cols } = await client.execute("PRAGMA table_info(users)");
      db.usersColumns = cols.map((c) => String(c.name));
      db.usersBlockingColumns = cols
        .filter((c) => Number(c.notnull) === 1 && c.dflt_value === null && String(c.name) !== "id")
        .map((c) => String(c.name))
        .filter((name) => !["name", "created_at"].includes(name));
      db.hasPermissionsColumn = cols.some((c) => String(c.name) === "permissions");

      const { rows: countRows } = await client.execute("SELECT COUNT(*) AS n FROM allowed_emails");
      const allowlistCount = Number(countRows[0]?.n ?? 0);
      db.allowlistCount = allowlistCount;

      // With an empty allowlist, only OWNER_EMAIL can bootstrap in.
      const ownerEmail = (process.env.OWNER_EMAIL ?? "").toLowerCase().trim();
      if (ownerEmail) {
        const { rows } = await client.execute({
          sql: "SELECT role FROM allowed_emails WHERE email = ?",
          args: [ownerEmail],
        });
        db.ownerEmailOnAllowlist = rows.length > 0;
        db.ownerEmailRole = rows[0]?.role ?? null;
      }
    } catch (err) {
      db.error = err instanceof Error ? err.message : String(err);
    }
  }

  const problems = authConfigProblems().map((p) => p.message);

  if (db.reachable && Array.isArray(db.missingTables) && db.missingTables.length > 0) {
    problems.push(
      `Faltan tablas en la base de datos: ${(db.missingTables as string[]).join(", ")}. Reinicia el servidor para que corra ensureSchema().`
    );
  }
  if (env.TURSO_DATABASE_URL && !db.reachable) {
    problems.push(`No se pudo conectar a Turso: ${db.error ?? "error desconocido"}`);
  }
  if (Array.isArray(db.usersBlockingColumns) && (db.usersBlockingColumns as string[]).length > 0) {
    problems.push(
      `La tabla users tiene columnas NOT NULL sin default que Auth.js no completa (${(db.usersBlockingColumns as string[]).join(", ")}) — el alta de un usuario nuevo va a fallar.`
    );
  }

  return NextResponse.json(
    {
      ok: problems.length === 0,
      vercelEnv,
      expectedRedirectUri,
      env,
      db,
      problems,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
