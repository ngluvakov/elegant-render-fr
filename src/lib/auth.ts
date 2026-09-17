/**
 * auth.ts — Auth.js v5 configuration with Credentials + Google providers.
 *
 * Exports { handlers, auth, signIn, signOut } used across all protected
 * routes, server actions, and the [...nextauth] API route.
 *
 * Used by: server/actions/auth, sign-out, profile, comment, rework, admin,
 *          portal layouts, order pages, api/auth/[...nextauth]
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { recordAuditLog } from "./audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
    newUser: "/portal",
    error: "/connexion",
  },
  providers: [
    Google({
      // Auto-link a Google sign-in to an existing User row when the
      // Google email matches. Without this, a customer who first
      // signed up with email/password (or was created passwordless
      // via inquiry/VR conversion) hits OAuthAccountNotLinked when
      // they later try Google. Google's email verification is
      // authoritative — they confirm ownership before issuing the
      // id_token — so linking by email is safe in this context.
      // The "dangerous" name in the option is for providers that
      // don't verify email; Google does.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "magic-link",
      name: "MagicLink",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const token = credentials.token as string;

        const vt = await prisma.verificationToken.findUnique({
          where: { token },
        });
        if (!vt || vt.expires < new Date()) return null;

        const user = await prisma.user.findUnique({
          where: { email: vt.identifier },
        });
        if (!user) return null;

        // Single-use: consume the token now.
        await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: vt.identifier,
              token: vt.token,
            },
          },
        });

        // Mark email as verified — clicking the link from the inbox proves
        // ownership of the email address.
        if (!user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // Forensic logging of authentication lifecycle. ISO 27001 A.8.15.
  // Events fire and forget — recordAuditLog catches its own errors so
  // an audit hiccup never breaks sign-in. Most useful entry here is
  // linkAccount: today's "Google sub attached to test.admin instead
  // of ngluvakov" incident left no DB trace until we noticed by
  // accident; with this in place a similar regression would surface
  // in /portal/admin/revisions immediately.
  events: {
    signIn: async ({ user, account, isNewUser }) => {
      if (!user.id) return;
      await recordAuditLog({
        action: "auth.sign_in",
        entityType: "User",
        entityId: user.id,
        actor: { id: user.id, email: user.email ?? null },
        metadata: {
          provider: account?.provider ?? "unknown",
          isNewUser: Boolean(isNewUser),
        },
      });
    },
    signOut: async (params) => {
      // Auth.js v5 calls signOut with either a session (db strategy) or
      // a token (jwt strategy). We use jwt — pull userId from token.
      const userId =
        "token" in params && params.token?.id
          ? String(params.token.id)
          : "session" in params && params.session?.userId
            ? params.session.userId
            : null;
      if (!userId) return;
      await recordAuditLog({
        action: "auth.sign_out",
        entityType: "User",
        entityId: userId,
        actor: { id: userId, email: null },
      });
    },
    createUser: async ({ user }) => {
      if (!user.id) return;
      await recordAuditLog({
        action: "auth.user_created",
        entityType: "User",
        entityId: user.id,
        actor: { id: user.id, email: user.email ?? null },
        metadata: {
          email: user.email ?? null,
          name: user.name ?? null,
        },
      });
    },
    linkAccount: async ({ user, account, profile }) => {
      if (!user.id) return;
      await recordAuditLog({
        action: "auth.account_linked",
        entityType: "User",
        entityId: user.id,
        actor: { id: user.id, email: user.email ?? null },
        metadata: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          // profile.email is what the OAuth provider returned for this
          // account — surfacing it makes the "linked to wrong user"
          // class of incident immediately visible (you'd see e.g.
          // userEmail=test.admin but profileEmail=ngluvakov@gmail.com).
          profileEmail: profile?.email ?? null,
          userEmail: user.email ?? null,
        },
      });
    },
    updateUser: async ({ user }) => {
      if (!user.id) return;
      await recordAuditLog({
        action: "auth.user_updated",
        entityType: "User",
        entityId: user.id,
        actor: { id: user.id, email: user.email ?? null },
      });
    },
  },
});
