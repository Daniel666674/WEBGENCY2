import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens, authenticators, allowedEmails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ALL_PERMISSIONS, DEFAULT_NEW_USER_PERMISSIONS } from "@/lib/permissions";

// OWNER_EMAIL bootstraps the very first owner when the DB allowlist is
// still empty (fresh install, or a deploy that hasn't run ensureSchema's
// legacy-env backfill yet) — without this, a brand-new database has no
// allowlist rows at all and nobody could ever sign in. Once any row exists
// in allowed_emails, this fallback is dead code; every real invite after
// that goes through Settings > Usuarios instead of an env var.
const bootstrapOwnerEmail = (process.env.OWNER_EMAIL ?? "").toLowerCase().trim();

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
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/analytics.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      const email = (user.email ?? "").toLowerCase();
      if (!email || !user.id) return false;

      let entry = await db.select().from(allowedEmails).where(eq(allowedEmails.email, email)).get();

      // Self-bootstrap: nobody has ever been allowlisted yet, and this is
      // the designated owner email — create their row instead of rejecting
      // them, or the very first login would have nobody able to grant it.
      if (!entry) {
        const totalAllowed = await db.select({ id: allowedEmails.id }).from(allowedEmails).limit(1).all();
        if (totalAllowed.length === 0 && bootstrapOwnerEmail && email === bootstrapOwnerEmail) {
          entry = await db
            .insert(allowedEmails)
            .values({ email, role: "owner", permissions: JSON.stringify(ALL_PERMISSIONS) })
            .returning()
            .get();
        }
      }

      // Not on the allowlist at all — reject. Every real invite after
      // bootstrap happens from Settings > Usuarios, which writes here.
      if (!entry) return false;

      await db
        .update(users)
        .set({ role: entry.role, permissions: entry.permissions })
        .where(eq(users.id, user.id))
        .run();

      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        // Permissions can change after the session already exists (the
        // owner revokes a tab, say), so re-read from `users` on every
        // session check rather than trusting whatever was true at sign-in.
        const fresh = await db.select().from(users).where(eq(users.id, user.id)).get();
        const su = session.user as typeof session.user & { id: string; role: string; permissions: string };
        su.id = user.id;
        su.role = fresh?.role ?? "member";
        su.permissions = fresh?.permissions ?? JSON.stringify(DEFAULT_NEW_USER_PERMISSIONS);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
