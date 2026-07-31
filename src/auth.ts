import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens, authenticators } from "@/db/schema";
import { eq } from "drizzle-orm";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// The owner's email gets role=owner and isHers=false.
// Everyone else in ALLOWED_EMAILS gets role=member and isHers=true.
// Override with OWNER_EMAIL / HER_EMAIL if the split-by-position doesn't fit.
const ownerEmail = (process.env.OWNER_EMAIL ?? allowedEmails[0] ?? "").toLowerCase();
const herEmail   = (process.env.HER_EMAIL   ?? allowedEmails[1] ?? "").toLowerCase();

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
      // Block anyone not in the allowlist.
      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) return false;

      // Assign role + isHers based on which email this is.
      // DrizzleAdapter has already upserted the user row by this point.
      if (user.id) {
        const isOwner = email === ownerEmail;
        const isHers  = email === herEmail;
        await db
          .update(users)
          .set({
            role:   isOwner ? "owner" : "member",
            isHers: isHers,
          })
          .where(eq(users.id, user.id))
          .run();
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        const u = user as typeof user & { role?: string; isHers?: boolean };
        (session.user as typeof session.user & { id: string; role: string; isHers: boolean }).id     = user.id;
        (session.user as typeof session.user & { id: string; role: string; isHers: boolean }).role   = u.role ?? "member";
        (session.user as typeof session.user & { id: string; role: string; isHers: boolean }).isHers = u.isHers ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
