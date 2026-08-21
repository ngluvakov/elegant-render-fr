/**
 * check-public-vat.ts — Public-callable VIES VAT lookup for the
 * checkout `company_foreign` flow. Wraps lib/vies with rate limiting
 * and a slim result shape so the client component doesn't pull in
 * the full ViesResult type.
 *
 * Pure read — does NOT persist anything. Admin still verifies on the
 * order detail page before issuing a 0%-VAT export invoice (#102);
 * the client-side check is just a UX nicety so customers don't
 * submit a typo and bounce back later.
 */
"use server";

import { verifyVatViaVies, isViesCountry } from "@/lib/vies";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";

export type PublicVatCheckResult =
  | { status: "valid"; verifiedName: string | null }
  | { status: "invalid" }
  | { status: "unsupported_country" }
  | { status: "error"; message: string }
  | { status: "rate_limited"; message: string };

export async function checkPublicVat(input: {
  countryCode: string;
  vatNumber: string;
}): Promise<PublicVatCheckResult> {
  const country = String(input.countryCode ?? "").trim();
  const number = String(input.vatNumber ?? "").trim();

  if (!country || !number) {
    return { status: "error", message: "Le code pays et le numéro de TVA sont requis." };
  }

  if (!isViesCountry(country)) {
    return { status: "unsupported_country" };
  }

  const identifier = await getServerActionIdentifier();
  const rate = await checkRateLimit("viesPublic", identifier);
  if (!rate.ok) {
    return {
      status: "rate_limited",
      message: rateLimitMessage(rate.retryAfterSeconds),
    };
  }

  const result = await verifyVatViaVies(country, number);

  switch (result.status) {
    case "valid":
      return { status: "valid", verifiedName: result.name };
    case "invalid":
      return { status: "invalid" };
    case "unsupported_country":
      return { status: "unsupported_country" };
    case "error":
      return { status: "error", message: result.reason };
  }
}
