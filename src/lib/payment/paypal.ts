/**
 * paypal.ts — PayPal REST API v2 client (sandbox + live).
 *
 * Exports createPayPalOrder() and capturePayPalOrder() for the checkout
 * payment flow. Handles OAuth2 token acquisition internally.
 *
 * Used by: server/actions/payment
 */

// PayPal REST API v2 client

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
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(amountEur: number): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: amountEur.toFixed(2),
          },
          description: "Elegant Render — Arhitektonska vizuelizacija",
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.id as string;
}

export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<{ capturedAmount: number; status: string }> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const capturedAmount = capture ? parseFloat(capture.amount.value) : 0;

  return {
    capturedAmount: Math.round(capturedAmount),
    status: data.status,
  };
}
