/**
 * vies.ts — Thin client over the EU VIES (VAT Information Exchange
 * System) REST API. Used to verify a company_foreign customer's VAT
 * ID before issuing an export invoice with a 0% VAT (čl. 24 ZPDV).
 *
 * Endpoint: GET /vies/rest-api/ms/{country}/vat/{vatNumber}
 * Docs:    https://ec.europa.eu/taxation_customs/vies/
 *
 * VIES is rate-limited and known to be flaky during member-state
 * downtime (e.g. SOAP backend offline). We treat any non-2xx or any
 * exception as an `error` result, distinct from a clean `invalid`,
 * so the UI can tell "VIES says NO" apart from "VIES is down".
 */

const VIES_BASE_URL = "https://ec.europa.eu/taxation_customs/vies/rest-api";
const VIES_TIMEOUT_MS = 8000;

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT",
  "NL", "PL", "PT", "RO", "SE", "SI", "SK",
  // VIES still resolves XI (Northern Ireland under the Windsor
  // Framework) and EL (Greece's VIES code, distinct from ISO GR).
  "XI", "EL",
]);

export type ViesResult =
  | {
      status: "valid";
      countryCode: string;
      vatNumber: string;
      name: string | null;
      address: string | null;
      requestId: string | null;
      checkedAt: Date;
    }
  | {
      status: "invalid";
      countryCode: string;
      vatNumber: string;
      requestId: string | null;
      checkedAt: Date;
    }
  | {
      status: "error";
      countryCode: string;
      vatNumber: string;
      reason: string;
      checkedAt: Date;
    }
  | {
      status: "unsupported_country";
      countryCode: string;
      vatNumber: string;
      checkedAt: Date;
    };

export function normalizeVatNumber(input: string): string {
  // VIES accepts only [A-Z0-9], no spaces, dashes, or country prefix
  // duplicated in the body. Strip everything else and uppercase.
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Greece uses ISO `GR` everywhere except VIES, where it's `EL`. The
 * checkout dropdown stores ISO codes, so we translate at the boundary.
 * VIES treats `XI` (Northern Ireland) as its own member state under
 * the Windsor Framework — passed through unchanged.
 */
export function toViesCountryCode(isoCountryCode: string): string {
  const upper = isoCountryCode.toUpperCase();
  if (upper === "GR") return "EL";
  return upper;
}

export function isViesCountry(isoCountryCode: string): boolean {
  return EU_COUNTRY_CODES.has(toViesCountryCode(isoCountryCode));
}

export async function verifyVatViaVies(
  isoCountryCode: string,
  vatNumber: string,
): Promise<ViesResult> {
  const country = toViesCountryCode(isoCountryCode);
  const number = normalizeVatNumber(vatNumber);
  const checkedAt = new Date();

  if (!EU_COUNTRY_CODES.has(country)) {
    return {
      status: "unsupported_country",
      countryCode: country,
      vatNumber: number,
      checkedAt,
    };
  }

  const url = `${VIES_BASE_URL}/ms/${country}/vat/${number}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    VIES_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      // Don't reuse stale POPs — VIES result freshness matters for
      // tax compliance disputes.
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "error",
        countryCode: country,
        vatNumber: number,
        reason: `HTTP ${response.status}`,
        checkedAt,
      };
    }

    const data = (await response.json()) as {
      isValid?: boolean;
      valid?: boolean;
      name?: string | null;
      address?: string | null;
      requestId?: string | null;
      userError?: string | null;
    };

    // VIES quirk: when the member state SOAP backend is offline, the
    // REST shim returns 200 OK with `userError: "MS_UNAVAILABLE"` and
    // `isValid: false` — that's not a real "invalid", it's an outage.
    if (
      data.userError &&
      data.userError !== "VALID" &&
      data.userError !== "INVALID_INPUT"
    ) {
      return {
        status: "error",
        countryCode: country,
        vatNumber: number,
        reason: `VIES: ${data.userError}`,
        checkedAt,
      };
    }

    const valid = Boolean(data.isValid ?? data.valid);
    if (valid) {
      return {
        status: "valid",
        countryCode: country,
        vatNumber: number,
        name: data.name?.trim() || null,
        address: data.address?.trim() || null,
        requestId: data.requestId ?? null,
        checkedAt,
      };
    }

    return {
      status: "invalid",
      countryCode: country,
      vatNumber: number,
      requestId: data.requestId ?? null,
      checkedAt,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      status: "error",
      countryCode: country,
      vatNumber: number,
      reason: err instanceof Error ? err.message : "fetch failed",
      checkedAt,
    };
  }
}
