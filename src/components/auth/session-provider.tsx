/**
 * SessionProvider — Thin wrapper around NextAuth's SessionProvider.
 *
 * Used on: marketing layout (wraps all public pages for session access).
 */
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
