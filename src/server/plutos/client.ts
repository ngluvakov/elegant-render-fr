import { z } from "zod";
import type { PlutosConfig } from "./config";
import type { PlutosInvoicePayload } from "./payload";

/**
 * client.ts — Thin HTTP client for the Plutos ingest API.
 *
 * Contract (see docs/integracija/Sajt_Plutos_integracija_handoff.md on the
 * Plutos side): server-to-server JSON, `X-Plutos-Api-Key` header, 8s timeout.
 * Every response is Zod-validated; `plutos_invoice_id` is normalized to a
 * string; a `number` that differs from the local invoice number is an error.
 *
 * Errors never carry the API key or the outgoing buyer payload — only the
 * endpoint path, HTTP status, and Plutos's own (translated) error text.
 */

const TIMEOUT_MS = 8_000;

const RemoteInvoiceSchema = z.object({
  plutos_invoice_id: z.union([z.string(), z.number()]).transform(String),
  number: z.string(),
  status: z.string(),
  sef_status: z.string().nullish(),
  sef_id: z.string().nullish(),
});

export type PlutosRemoteInvoice = {
  invoiceId: string;
  number: string;
  status: string;
  sefStatus: string | null;
  sefId: string | null;
};

export type PlutosClientErrorReason =
  | `http_${number}`
  | "timeout"
  | "network"
  | "invalid_json"
  | "invalid_schema"
  | "number_mismatch";

export class PlutosClientError extends Error {
  readonly reason: PlutosClientErrorReason;
  readonly status?: number;
  constructor(
    reason: PlutosClientErrorReason,
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "PlutosClientError";
    this.reason = reason;
    this.status = status;
  }
}

function normalize(parsed: z.infer<typeof RemoteInvoiceSchema>): PlutosRemoteInvoice {
  return {
    invoiceId: parsed.plutos_invoice_id,
    number: parsed.number,
    status: parsed.status,
    sefStatus: parsed.sef_status ?? null,
    sefId: parsed.sef_id ?? null,
  };
}

async function request(
  url: string,
  init: RequestInit,
): Promise<PlutosRemoteInvoice> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new PlutosClientError("timeout", `Plutos request timed out after ${TIMEOUT_MS}ms`);
    }
    throw new PlutosClientError(
      "network",
      `Plutos request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    // Provider error bodies are untrusted — a 422 may echo buyer fields — so we
    // never read, store, or log the raw body. Only the status leaves the client.
    throw new PlutosClientError(
      `http_${res.status}`,
      `Plutos returned HTTP ${res.status}`,
      res.status,
    );
  }

  const bodyText = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new PlutosClientError("invalid_json", "Plutos returned a non-JSON body");
  }

  const parsed = RemoteInvoiceSchema.safeParse(json);
  if (!parsed.success) {
    throw new PlutosClientError(
      "invalid_schema",
      `Plutos response failed validation: ${parsed.error.issues
        .map((i) => i.path.join("."))
        .join(", ")}`,
    );
  }

  return normalize(parsed.data);
}

/**
 * POST an invoice to Plutos. Idempotent on the Plutos side by `order_id`, so a
 * retried POST returns the same document. Rejects a response whose `number`
 * differs from the immutable local invoice number.
 */
export async function postPlutosInvoice(
  config: PlutosConfig,
  payload: PlutosInvoicePayload,
): Promise<PlutosRemoteInvoice> {
  const result = await request(`${config.apiUrl}/api/v1/invoices/ingest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Plutos-Api-Key": config.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (result.number !== payload.invoice_number) {
    throw new PlutosClientError(
      "number_mismatch",
      `Plutos number ${result.number} != local ${payload.invoice_number}`,
    );
  }

  return result;
}

/**
 * GET the current status of a previously ingested invoice, keyed by the same
 * `order_id`. Used to refresh the SEF/document status in the admin.
 */
export async function getPlutosInvoiceStatus(
  config: PlutosConfig,
  orderId: string,
): Promise<PlutosRemoteInvoice> {
  return request(
    `${config.apiUrl}/api/v1/invoices/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: { "X-Plutos-Api-Key": config.apiKey },
    },
  );
}
