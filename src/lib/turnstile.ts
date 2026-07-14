/**
 * turnstile.ts — Cloudflare Turnstile server-side verification.
 *
 * Bot protection for the public project-inquiry form. Turnstile is
 * privacy-friendly and doesn't show a visible "I am not a robot" puzzle in
 * 95% of cases. The widget produces a token on the client; this helper
 * exchanges it for a verdict against Cloudflare.
 *
 * If `TURNSTILE_SECRET_KEY` is unset (local dev, preview) the helper
 * returns ok=true so the flow doesn't block — the form stays usable and
 * the honeypot + heuristic layers still run. Production must set the
 * secret in Vercel (Production + Preview) for this layer to activate.
 *
 * Used by: server/actions/project-inquiry (submitProjectInquiry).
 */

import { isTurnstileTestingSecretKey } from "@/lib/turnstile-keys";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerifyResult = {
  ok: boolean;
  errorCodes: string[];
};

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Dev / preview short-circuit — no secret configured.
    return { ok: true, errorCodes: [] };
  }
  if (
    process.env.NODE_ENV === "production" &&
    isTurnstileTestingSecretKey(secret)
  ) {
    return { ok: false, errorCodes: ["test-secret-in-production"] };
  }
  if (!token) {
    return { ok: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    return { ok: false, errorCodes: [`http-${res.status}`] };
  }

  const data = (await res.json()) as {
    success: boolean;
    "error-codes"?: string[];
  };

  return {
    ok: Boolean(data.success),
    errorCodes: data["error-codes"] ?? [],
  };
}
