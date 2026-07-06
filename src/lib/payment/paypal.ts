/**
 * paypal.ts — PayPal REST API v2 client (sandbox + live).
 *
 * Hardened successor of the pre-fork client (recoverable at b4d0740^):
 * parameterized presentment currency with zero-decimal handling,
 * PayPal-Request-Id idempotency headers, full capture snapshots
 * (capture id is required for refunds), order lookup for the
 * reconciler, refunds, and API-based webhook signature verification.
 *
 * Env: PAYPAL_MODE ("live" | anything-else = sandbox), PAYPAL_CLIENT_ID,
 * PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID (webhook verification only).
 *
 * Used by: server/actions/payment, server/actions/charge-payment,
 * app/api/paypal/webhook, server/finance/reconcile-paypal.
 */

import { CURRENCY_RULES, type ChargeCurrency } from "@/lib/currency/config";

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

/** Format a minor-unit amount the way PayPal's API expects for the
 * currency: two decimals for cent currencies ("189.00"), a plain
 * integer string for zero-decimal ones ("68000"). */
export function formatPayPalAmount(amountMinor: number, currency: ChargeCurrency): string {
  const rule = CURRENCY_RULES[currency];
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error(`Invalid PayPal amount: ${amountMinor} ${currency}`);
  }
  return rule.minorUnits === 0
    ? String(amountMinor)
    : (amountMinor / 100).toFixed(2);
}

function parsePayPalAmountToMinor(value: string, currencyCode: string): number {
  const rule = CURRENCY_RULES[currencyCode as ChargeCurrency];
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) throw new Error(`Unparseable PayPal amount: ${value}`);
  return rule && rule.minorUnits === 0 ? Math.round(parsed) : Math.round(parsed * 100);
}

export type CreatePayPalOrderInput = {
  /** Amount in the currency's minor units (JPY/HUF/TWD: whole units). */
  amountMinor: number;
  currency: ChargeCurrency;
  /** Our order/charge number — shows up in the merchant dashboard. */
  referenceId: string;
  /** Our internal DB id — echoed back in webhooks as custom_id. */
  customId: string;
  description: string;
  /** Stable idempotency key: PayPal dedupes creates that reuse it. */
  requestId: string;
};

export async function createPayPalOrderMinor(input: CreatePayPalOrderInput): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.requestId,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.customId,
          description: input.description.slice(0, 127),
          amount: {
            currency_code: input.currency,
            value: formatPayPalAmount(input.amountMinor, input.currency),
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "Elegant Render",
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.id as string;
}

export type PayPalCaptureResult = {
  /** Order-level status: COMPLETED | ... */
  status: string;
  /** Capture id — REQUIRED for refunds; null when no capture came back. */
  captureId: string | null;
  /** Capture-level status: COMPLETED | PENDING (eCheck) | DECLINED | ... */
  captureStatus: string | null;
  amountMinor: number | null;
  currencyCode: string | null;
  payerEmail: string | null;
  payerCountryCode: string | null;
  raw: unknown;
};

function extractCapture(data: {
  status?: string;
  payer?: { email_address?: string; address?: { country_code?: string } };
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: { value: string; currency_code: string } }> };
  }>;
}): PayPalCaptureResult {
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status ?? "UNKNOWN",
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amountMinor: capture?.amount
      ? parsePayPalAmountToMinor(capture.amount.value, capture.amount.currency_code)
      : null,
    currencyCode: capture?.amount?.currency_code ?? null,
    payerEmail: data.payer?.email_address ?? null,
    payerCountryCode: data.payer?.address?.country_code ?? null,
    raw: data,
  };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Captures are idempotent per order id via Request-Id: a retried
      // capture after a network cut returns the original result instead
      // of DUPLICATE_INVOICE_ID-style failures.
      "PayPal-Request-Id": `capture:${paypalOrderId}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // ORDER_ALREADY_CAPTURED means a parallel capture (webhook race /
    // double click) won — fetch the order and return its capture so the
    // caller can settle idempotently instead of failing the buyer.
    const issue = (data as { details?: Array<{ issue?: string }> })?.details?.[0]?.issue;
    if (issue === "ORDER_ALREADY_CAPTURED") {
      return getPayPalOrder(paypalOrderId);
    }
    throw new Error(`PayPal capture failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return extractCapture(data);
}

/** GET the order — used by the reconciler and the already-captured path. */
export async function getPayPalOrder(paypalOrderId: string): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal get order failed: ${res.status} ${body}`);
  }

  return extractCapture(await res.json());
}

export type PayPalRefundResult = {
  refundId: string | null;
  status: string;
  raw: unknown;
};

/** Full refund when amountMinor is omitted; partial otherwise. */
export async function refundPayPalCapture(
  captureId: string,
  amountMinor?: number,
  currency?: ChargeCurrency,
): Promise<PayPalRefundResult> {
  const token = await getAccessToken();

  const body =
    amountMinor != null && currency
      ? JSON.stringify({
          amount: {
            value: formatPayPalAmount(amountMinor, currency),
            currency_code: currency,
          },
        })
      : "{}";

  const res = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `refund:${captureId}`,
    },
    body,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`PayPal refund failed: ${res.status} ${JSON.stringify(data)}`);
  }
  const parsed = data as { id?: string; status?: string };
  return { refundId: parsed.id ?? null, status: parsed.status ?? "UNKNOWN", raw: data };
}

/**
 * Verify a webhook delivery via PayPal's verification API. Fail-closed:
 * missing PAYPAL_WEBHOOK_ID or any non-SUCCESS verdict returns false.
 * (API-based verification instead of local cert math — one less crypto
 * path to maintain; PayPal recommends it for server integrations.)
 */
export async function verifyPayPalWebhookSignature(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
    cache: "no-store",
  });

  if (!res.ok) return false;
  const data = await res.json().catch(() => null);
  return (data as { verification_status?: string } | null)?.verification_status === "SUCCESS";
}
