import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens, authenticators } from "@/db/schema";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
          // Sensitive scopes for Gmail send/read + GA4 read, requested up front
          // so the same login covers email + analytics integrations later.
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
      // Only the 2 authorized accounts may ever create a session.
      if (allowedEmails.length === 0) return true; // allowlist not configured yet — see ALLOWED_EMAILS
      return allowedEmails.includes((user.email ?? "").toLowerCase());
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as typeof session.user & { role?: string; id?: string }).role = (
          user as typeof user & { role?: string }
        ).role;
        (session.user as typeof session.user & { id?: string }).id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
