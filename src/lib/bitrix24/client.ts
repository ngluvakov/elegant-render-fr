/**
 * client.ts — Bitrix24 REST API client via inbound webhook.
 *
 * Exports bitrixCall() — a rate-limited (2 req/s), auto-retrying fetch
 * wrapper that logs every call to BitrixSyncLog for auditability.
 *
 * Errors are typed so callers can react without string-matching a raw message:
 *  - BitrixApiError         — Bitrix replied with an `error` payload; preserves
 *                             `code` (error) and `description` (error_description).
 *  - BitrixEmptyResultError — the transport succeeded but `result` was
 *                             null/undefined (e.g. crm.deal.get on a Deal that
 *                             no longer exists in Bitrix).
 * bitrixCall never returns an empty result silently cast as T — it throws — so
 * callers can no longer read fields off `undefined` (the STAGE_ID reconcile
 * crash). Use isBitrixNotFound(err) to treat a missing entity as handled.
 *
 * Used by: all server/bitrix/sync-* modules, inbound, reconcile
 */

// Rate limited to 2 req/sec, with retry and sync logging

import { prisma } from "@/lib/db";

const WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL!;

/**
 * Bitrix responded with an `error` field (e.g. NOT_FOUND, QUERY_LIMIT_EXCEEDED,
 * invalid credentials). Both the machine `code` and the human `description` are
 * preserved for logging and classification.
 */
export class BitrixApiError extends Error {
  readonly method: string;
  readonly code: string;
  readonly description: string;

  constructor(method: string, code: string, description: string) {
    super(
      `Bitrix24 ${method} failed: ${code || "error"}${description ? ` — ${description}` : ""}`,
    );
    this.name = "BitrixApiError";
    this.method = method;
    this.code = code;
    this.description = description;
  }
}

/**
 * The HTTP call succeeded but Bitrix returned no payload (`result` null or
 * undefined). For crm.deal.get this means the Deal is gone on the Bitrix side.
 */
export class BitrixEmptyResultError extends Error {
  readonly method: string;

  constructor(method: string) {
    super(`Bitrix24 ${method} returned an empty result`);
    this.name = "BitrixEmptyResultError";
    this.method = method;
  }
}

/**
 * True when `err` means the requested entity does not (or no longer) exists in
 * Bitrix — either an empty result or an explicit NOT_FOUND error. Used by the
 * crm.deal.get callers (inbound, reconcile) to treat a missing Deal as a
 * handled outcome instead of a crash. Do NOT use it to auto-delete our link to
 * the Deal: an empty response can be transient (see reconcile.ts / docs).
 */
export function isBitrixNotFound(err: unknown): boolean {
  if (err instanceof BitrixEmptyResultError) return true;
  if (err instanceof BitrixApiError) {
    const code = err.code.toUpperCase();
    const description = err.description.toUpperCase();
    return code.includes("NOT_FOUND") || description.includes("NOT FOUND");
  }
  return false;
}

let lastCallTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 500) {
    await new Promise((r) => setTimeout(r, 500 - elapsed));
  }
  lastCallTime = Date.now();
}

export async function bitrixCall<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
  meta?: { entityType: string; entityId: string; direction: "outbound" | "inbound" },
): Promise<T> {
  await rateLimit();

  const url = `${WEBHOOK_URL}${method}`;

  let response: Response;
  let retries = 0;

  while (true) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (response.status === 429 || response.status === 503) {
      retries++;
      if (retries > 3) break;
      await new Promise((r) => setTimeout(r, 1000 * retries));
      continue;
    }

    break;
  }

  const body = await response.json();

  // A 2xx transport can still carry no payload (Bitrix returns `result: null`
  // for a crm.deal.get on a deleted Deal). `false`, `0`, `""` and `[]` are
  // legitimate results and are intentionally NOT treated as empty.
  const emptyResult =
    !body.error && (body.result === null || body.result === undefined);

  // Log to BitrixSyncLog
  if (meta) {
    await prisma.bitrixSyncLog
      .create({
        data: {
          entityType: meta.entityType,
          entityId: meta.entityId,
          direction: meta.direction,
          method,
          bitrixId: body.result?.toString() ?? null,
          success: !body.error && !emptyResult,
          error: body.error
            ? JSON.stringify(body.error)
            : emptyResult
              ? "Empty result"
              : null,
        },
      })
      .catch(() => {}); // Don't fail on log errors
  }

  if (body.error) {
    throw new BitrixApiError(
      method,
      typeof body.error === "string" ? body.error : JSON.stringify(body.error),
      typeof body.error_description === "string" ? body.error_description : "",
    );
  }

  // Never hand back an empty result cast as T — the caller would read fields off
  // undefined and crash (the STAGE_ID reconcile TypeError). Fail loudly instead.
  if (emptyResult) {
    throw new BitrixEmptyResultError(method);
  }

  return body.result as T;
}
