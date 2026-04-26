/**
 * PostHogIdentifyBridge — connects the auth session to PostHog's
 * identity model. Mount it inside any layout that has user context;
 * pass `userId` (and optional traits) and the bridge will:
 *
 *   - on first appearance of userId: posthog.identify(userId, traits)
 *     so subsequent events attach to that Person
 *   - if userId disappears (logout): posthog.reset() so the next
 *     events don't continue to attach to the prior user
 *
 * It's deliberately prop-driven, not session-hook-driven, so it works
 * in both layouts that wrap with NextAuth's SessionProvider (marketing)
 * AND layouts that don't (portal — auth is server-resolved). The
 * server layout reads `await auth()` and passes userId down.
 */
"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";

type Props = {
  userId: string | null;
  traits?: {
    email?: string;
    name?: string;
    isAdmin?: boolean;
  };
};

export function PostHogIdentifyBridge({ userId, traits }: Props) {
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // PostHog client init lives in instrumentation-client.ts. If env
    // is missing the SDK is a stub and these calls no-op.
    if (typeof window === "undefined") return;

    if (userId && userId !== lastIdRef.current) {
      posthog.identify(userId, traits);
      lastIdRef.current = userId;
      return;
    }
    if (!userId && lastIdRef.current !== null) {
      posthog.reset();
      lastIdRef.current = null;
    }
  }, [userId, traits]);

  return null;
}
