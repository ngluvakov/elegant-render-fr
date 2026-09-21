/**
 * client.ts — Signed webhook client for the Iris CRM ("Prodaja" in
 * Iris, the internal White Rook chat). Replaces Bitrix24 as the CRM;
 * during the transition both receive every event (dual send), Bitrix
 * is switched off once Iris has proven itself.
 *
 * Off unless IRIS_URL and IRIS_WEBHOOK_SECRET are set — then every
 * call is a no-op, so previews and local dev never need Iris.
 *
 * Contract (Iris: docs/crm-most.md): POST {IRIS_URL}/api/crm/dogadjaj,
 * headers x-iris-vreme (unix seconds) + x-iris-potpis (HMAC-SHA256 hex
 * over `${time}.${body}`), body `{ id, brend, vrsta, ... }`. Iris
 * dedupes on `id`, so ids are deterministic per entity+event.
 */
import { createHmac } from "node:crypto";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";

/** Which brand this platform is in Iris. */
export const IRIS_BRAND = "fr";

export type IrisResult = { ok: boolean; javljeno?: boolean; ponovljeno?: boolean };

export class IrisError extends Error {
  constructor(
    public readonly status: number,
    public readonly greska: string,
  ) {
    super(`Iris ${status}: ${greska}`);
  }
}

export function irisEnabled() {
  return Boolean(process.env.IRIS_URL && process.env.IRIS_WEBHOOK_SECRET);
}

/**
 * Posts one signed event. Returns null when Iris is not configured;
 * throws IrisError on a non-2xx answer (status + Iris' short reason).
 */
export async function irisEvent(id: string, event: Record<string, unknown>): Promise<IrisResult | null> {
  const url = process.env.IRIS_URL;
  const secret = process.env.IRIS_WEBHOOK_SECRET;
  if (!url || !secret) return null;

  const body = JSON.stringify({ id, brend: IRIS_BRAND, ...event });
  const time = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret).update(`${time}.${body}`).digest("hex");

  const res = await fetch(`${url.replace(/\/$/, "")}/api/crm/dogadjaj`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-iris-vreme": time, "x-iris-potpis": signature },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  if (!res.ok) {
    let greska = text.slice(0, 200);
    try {
      greska = (JSON.parse(text) as { greska?: string }).greska ?? greska;
    } catch {
      /* not JSON — keep the raw snippet */
    }
    throw new IrisError(res.status, greska);
  }
  return JSON.parse(text) as IrisResult;
}

/**
 * Run an Iris sync after the response is sent, with errors going to
 * Sentry instead of the caller. `after()` keeps the function alive on
 * Vercel; outside a request scope (scripts, tests) it runs inline.
 */
export function irisAfter(flow: string, extra: Record<string, unknown>, fn: () => Promise<unknown>) {
  if (!irisEnabled()) return;
  const run = () =>
    fn().catch((err) => {
      Sentry.captureException(err, { tags: { area: "iris", flow }, extra });
    });
  try {
    after(run);
  } catch {
    void run();
  }
}
