import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, rawClient } from "@/db";
import { users, accounts, sessions, verificationTokens, authenticators, allowedEmails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { authConfigProblems } from "@/lib/authConfig";
import { canonicalEmail, cleanEmail } from "@/lib/email";

// OWNER_EMAIL bootstraps the very first owner when the DB allowlist is
// still empty (fresh install, or a deploy that hasn't run ensureSchema's
// legacy-env backfill yet) — without this, a brand-new database has no
// allowlist rows at all and nobody could ever sign in. Once any row exists
// in allowed_emails, this fallback is dead code; every real invite after
// that goes through Settings > Usuarios instead of an env var.
const bootstrapOwnerEmail = cleanEmail(process.env.OWNER_EMAIL);

// Surface a broken environment in the server logs at boot rather than only
// as an opaque error page at the moment someone tries to sign in.
if (process.env.AUTH_ENABLED === "true") {
  for (const problem of authConfigProblems()) {
    console.error(`[auth] configuracion incompleta: ${problem.message}`);
  }
}

/**
 * Resolves what a given email is entitled to, self-bootstrapping the first
 * owner when the allowlist has never been populated. Returns null when the
 * email isn't allowed in at all.
 */
async function resolveAllowlistEntry(email: string) {
  const entry = await db.select().from(allowedEmails).where(eq(allowedEmails.email, email)).get();
  if (entry) return entry;

  // Exact match failed. Before rejecting, compare canonical forms across the
  // whole list — with an all-Gmail team, "juan.perez@" invited against
  // "juanperez@" reported by Google is the same person, and a plain string
  // comparison would lock them out of their own account. The list is a
  // handful of rows, so scanning it costs nothing.
  const key = canonicalEmail(email);
  if (key) {
    const all = await db.select().from(allowedEmails).all();
    const match = all.find((r) => canonicalEmail(r.email) === key);
    if (match) return match;
  }

  // Self-bootstrap: nobody has ever been allowlisted yet, and this is the
  // designated owner email — create their row instead of rejecting them, or
  // the very first login would have nobody able to grant it.
  if (!bootstrapOwnerEmail || canonicalEmail(email) !== canonicalEmail(bootstrapOwnerEmail)) return null;
  const totalAllowed = await db.select({ id: allowedEmails.id }).from(allowedEmails).limit(1).all();
  if (totalAllowed.length > 0) return null;

  return await db
    .insert(allowedEmails)
    .values({ email, role: "owner", permissions: JSON.stringify(ALL_PERMISSIONS) })
    .returning()
    .get();
}

/**
 * Copies role/permissions from the allowlist onto the `users` row, which is
 * what the app actually reads. Returns the effective values.
 *
 * This has to key off the *database* user id, not the id Auth.js hands the
 * `signIn` callback — for an OAuth provider that one is the Google `sub`
 * from the profile, so an update keyed on it silently matches zero rows and
 * every invited user ends up stuck with the column defaults.
 */
async function syncUserFromAllowlist(userId: string, email: string) {
  const entry = await resolveAllowlistEntry(email);

  // No allowlist row means access was revoked (or never granted). Strip the
  // stored role/permissions so an already-open session stops working too,
  // instead of coasting on what it had at sign-in.
  const role = entry?.role ?? "member";
  const permissions = entry?.permissions ?? "[]";

  const current = await db.select().from(users).where(eq(users.id, userId)).get();
  if (current && (current.role !== role || current.permissions !== permissions)) {
    await db.update(users).set({ role, permissions }).where(eq(users.id, userId)).run();
  }

  return { role, permissions };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Only the basic sign-in scopes. Gmail and Analytics scopes used to be
      // requested here, but nothing in the app ever consumed those tokens
      // (mailer.ts sends over SMTP, googleAnalytics.ts uses a service
      // account) — and gmail.readonly is a *restricted* scope, so asking for
      // it forces every account through Google's verification review and
      // blocks sign-in outright once the OAuth app is published.
      authorization: { params: { scope: "openid email profile" } },
      // The `users` table predates Auth.js here and has `name NOT NULL`, so
      // a Google account with no display name would fail the adapter's
      // INSERT and surface as a generic server error. Guarantee a value.
      profile(profile) {
        const email: string = profile.email ?? "";
        return {
          id: profile.sub,
          name: profile.name || email.split("@")[0] || "Usuario",
          email,
          image: profile.picture ?? null,
        };
      },
    }),
  ],
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      const email = cleanEmail(user.email);
      if (!email) return false;

      try {
        // Authorization decision only. Writing role/permissions happens once
        // the adapter has created the row and a real database id exists —
        // see the `createUser` event and the `session` callback below.
        const entry = await resolveAllowlistEntry(email);
        return entry ? true : false;
      } catch (err) {
        // A database outage must not read as "this person isn't allowed in",
        // and it must not bubble up as Auth.js's opaque Configuration page.
        console.error("[auth] fallo la consulta de la lista de acceso:", err);
        return "/login?error=db";
      }
    },
    async session({ session, user }) {
      if (!session.user || !user) return session;

      const su = session.user as typeof session.user & { id: string; role: string; permissions: string };
      su.id = user.id;

      try {
        // Re-resolve on every session check rather than trusting whatever
        // was true at sign-in, so the owner granting or revoking a tab takes
        // effect on the user's next request without a re-login.
        const { role, permissions } = await syncUserFromAllowlist(user.id, cleanEmail(user.email));
        su.role = role;
        su.permissions = permissions;
      } catch (err) {
        // Never throw from here: an exception in the session callback takes
        // down every authenticated request, not just this one. Fall back to
        // the least-privilege values.
        console.error("[auth] no se pudo refrescar permisos de la sesion:", err);
        su.role = "member";
        su.permissions = "[]";
      }

      return session;
    },
  },
  events: {
    // Fires right after the adapter inserts a brand-new user, which is the
    // first moment a real database id exists for them. Without this, an
    // invited teammate's first session would run on the column defaults
    // (role "member", no permissions) until the next session refresh.
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      try {
        await syncUserFromAllowlist(user.id, cleanEmail(user.email));
      } catch (err) {
        console.error("[auth] no se pudo aplicar permisos al usuario nuevo:", err);
      }
    },
    // Fires once per real sign-in (unlike the `session` callback above, which
    // re-runs on every session check) — the right moment to stamp "último
    // acceso" for Settings > Usuarios.
    async signIn({ user }) {
      if (!user.id) return;
      try {
        await rawClient.execute({
          sql: "UPDATE users SET last_login_at = ? WHERE id = ?",
          args: [Date.now(), user.id],
        });
      } catch (err) {
        console.error("[auth] no se pudo actualizar el ultimo acceso:", err);
      }
    },
  },
  pages: {
    signIn: "/login",
    // Route Auth.js's own failures to our login screen too, so they arrive
    // as /login?error=<tipo> with a readable explanation instead of the
    // built-in "Server error — check the server logs" dead end.
    error: "/login",
  },
});
