/**
 * PostHogSessionBridge — klijentska varijanta PostHogIdentifyBridge-a
 * za marketing layout. Čita sesiju kroz useSession() (SessionProvider
 * je već fetch-uje klijentski), pa server layout NE mora da zove
 * auth() — čitanje kolačića u layoutu je celo (marketing) stablo
 * teralo u per-request dynamic rendering.
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
