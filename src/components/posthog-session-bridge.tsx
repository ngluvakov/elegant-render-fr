/**
 * PostHogSessionBridge — client-side variant of PostHogIdentifyBridge
 * for the marketing layout. Reads the session through useSession()
 * (SessionProvider already fetches it client-side), so the server layout
 * does NOT have to call auth() — reading cookies in the layout forced the
 * whole (marketing) tree into per-request dynamic rendering.
 */
"use client";

import { useSession } from "next-auth/react";
import { PostHogIdentifyBridge } from "@/components/posthog-identify-bridge";

export function PostHogSessionBridge() {
  const { data: session } = useSession();
  return (
    <PostHogIdentifyBridge
      userId={session?.user?.id ?? null}
      traits={{
        email: session?.user?.email ?? undefined,
        name: session?.user?.name ?? undefined,
      }}
    />
  );
}
