/**
 * rate-limit.ts — Per-endpoint sliding-window rate limiters backed by
 * Upstash Redis. Used to protect public write endpoints from spam:
 *
 *   - VR inquiry submit  (5 / hour per IP)
 *   - Checkout createOrder (10 / hour per identifier)
 *   - File upload presigned-URL (60 / hour per identifier)
 *   - Chat / OpenAI proxy (30 / hour per IP)
 *
 * Identifier prefers `user:<id>` when the caller is authenticated and
 * falls back to `ip:<address>` for anonymous traffic. This avoids one
 * customer on a shared office IP getting locked out by another.
 *
 * If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are missing
 * (typical in local dev without Redis), the helpers no-op and let
 * everything through. Production must set both — Vercel env Production
 * + Preview environments.
 *
 * Used by: server/actions/vr-inquiry, server/actions/order,
 *          api/checkout/upload-url, api/chat
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const hasEnv =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Sliding-window algorithm: smoother than fixed-window because requests
// at the boundary of a window don't all "expire" at once. Slightly more
// expensive (one Redis op vs zero) but fine at our scale.
function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix,
  });
}

export const rateLimiters = {
  vrInquiry: makeLimiter(5, "1 h", "rl:vr-inquiry"),
  checkout: makeLimiter(10, "1 h", "rl:checkout"),
  uploadUrl: makeLimiter(60, "1 h", "rl:upload-url"),
  chat: makeLimiter(30, "1 h", "rl:chat"),
} as const;

export type RateLimiterKey = keyof typeof rateLimiters;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; limit: number };

// ─── Identifier helpers ──────────────────────────────────

// For server actions — pulls IP from Next 16's headers() and prefers
// userId when authenticated.
export async function getServerActionIdentifier(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) return `user:${session.user.id}`;
  const h = await headers();
  return `ip:${pickClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"))}`;
}

// For route handlers — pulls IP from the Request object directly.
// Skips auth lookup; route handlers that want auth-aware keying can
// call getServerActionIdentifier() instead.
export function getRequestIdentifier(request: Request): string {
  return `ip:${pickClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  )}`;
}

function pickClientIp(xff: string | null, xRealIp: string | null): string {
  if (xff) return xff.split(",")[0].trim();
  if (xRealIp) return xRealIp.trim();
  return "anonymous";
}

// ─── Limit check ─────────────────────────────────────────

export async function checkRateLimit(
  key: RateLimiterKey,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = rateLimiters[key];
  if (!limiter) return { ok: true }; // env not configured — no-op
  const result = await limiter.limit(identifier);
  if (result.success) return { ok: true };
  const resetMs = result.reset - Date.now();
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
    limit: result.limit,
  };
}

// ─── Friendly error message ──────────────────────────────

export function rateLimitMessage(
  retryAfterSeconds: number,
): string {
  if (retryAfterSeconds < 60) {
    return `Previše zahteva u kratkom periodu. Pokušajte za ${retryAfterSeconds} sekundi.`;
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes < 60) {
    return `Previše zahteva. Pokušajte za ${minutes} minut${minutes === 1 ? "" : minutes < 5 ? "a" : "a"}.`;
  }
  const hours = Math.ceil(minutes / 60);
  return `Previše zahteva. Pokušajte za ${hours} sat${hours === 1 ? "" : "a"}.`;
}
