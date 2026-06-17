/**
 * posthog.ts — Server-side PostHog client + capture helper.
 *
 * Used from server actions to emit events that fire too late to be
 * captured client-side (payment_completed after online card capture,
 * order_created after the DB insert, vr_inquiry_converted from the
 * admin convert action, etc.).
 *
 * Serverless caveat: posthog-node defaults to batch sends with a
 * background flush interval that won't fire in a Vercel function
 * before the response returns. We disable batching (flushAt=1,
 * flushInterval=0) so each capture sends synchronously. Slight perf
 * cost — fine at our event volume.
 *
 * Identifier convention:
 *  - `user:<userId>` for authenticated users (matches Sentry tags)
 *  - `anon:<anonDistinctId>` when only the cookie is known (rare on
 *    server; client-side capture is preferred for those)
 *
 * Events are no-ops when NEXT_PUBLIC_POSTHOG_KEY is missing — local
 * dev convenience.
 */
import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  if (_client) return _client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  _client = new PostHog(key, {
    host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return _client;
}

export type CaptureArgs = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

// Fires a single event and waits for it to flush before returning.
// Safe to call from server actions even when the response is short-
// lived (Vercel function freezes after return).
export async function captureServerEvent(args: CaptureArgs): Promise<void> {
  const client = getClient();
  if (!client) return;
  client.capture({
    distinctId: args.distinctId,
    event: args.event,
    properties: args.properties,
  });
  // flush() resolves once the HTTP request to PostHog completes;
  // shutdown() additionally drains queued state. We call flush per
  // event for at-most-once-per-call delivery.
  try {
    await client.flush();
  } catch {
    // Ignore — PostHog ingestion failures shouldn't block the user's
    // server action. Sentry catches the underlying error if any.
  }
}

// Server-side identify, used when a guest checkout creates a User and
// we know the email/name we want to attach to the distinctId. Most
// identify calls happen client-side via PostHogIdentifyBridge — this
// is for the post-checkout case where we want the User record in
// PostHog to exist before any subsequent pageview.
export async function identifyServerUser(args: {
  distinctId: string;
  traits?: Record<string, unknown>;
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  client.identify({
    distinctId: args.distinctId,
    properties: args.traits,
  });
  try {
    await client.flush();
  } catch {
    // see captureServerEvent
  }
}
