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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/prijava",
    newUser: "/portal",
    error: "/prijava",
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
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
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
});
