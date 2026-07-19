import * as Sentry from "@sentry/nextjs";

export type PlutosConfig = {
  apiUrl: string;
  apiKey: string;
  /** Cutoff: only invoices issued at/after this instant are eligible. */
  from: Date;
};

export type PlutosConfigResult =
  | { ok: true; config: PlutosConfig }
  | { ok: false; reason: "disabled" | "invalid_config" };

let warned = false;
function warnOnce(message: string): void {
  if (warned) return;
  warned = true;
  Sentry.captureMessage(`[plutos] ${message}`, {
    level: "warning",
    tags: { area: "plutos", stage: "config" },
  });
}

/**
 * Resolve the Plutos integration config from the environment.
 *
 * Disabled unless `PLUTOS_SYNC_ENABLED=true`. When enabled, `PLUTOS_SYNC_FROM`
 * must be a valid ISO timestamp and the URL/key must be present — otherwise we
 * return `invalid_config` and disable ONLY the integration. Missing or bad
 * config never throws: it must not break app startup or payment handling, so
 * callers treat both non-ok results as "do nothing".
 */
export function resolvePlutosConfig(): PlutosConfigResult {
  if (process.env.PLUTOS_SYNC_ENABLED !== "true") {
    return { ok: false, reason: "disabled" };
  }

  // Strip trailing slashes so endpoint joins never produce a double slash
  // (e.g. `https://host//api/v1/...`, which 404s on a strict server).
  const apiUrl = (process.env.PLUTOS_API_URL?.trim() ?? "").replace(/\/+$/, "");
  const apiKey = process.env.PLUTOS_API_KEY?.trim() ?? "";
  const fromRaw = process.env.PLUTOS_SYNC_FROM?.trim() ?? "";

  if (!apiUrl || !isHttpUrl(apiUrl) || !apiKey || !fromRaw) {
    warnOnce(
      "enabled but PLUTOS_API_URL / PLUTOS_API_KEY / PLUTOS_SYNC_FROM is missing or invalid",
    );
    return { ok: false, reason: "invalid_config" };
  }

  const from = new Date(fromRaw);
  if (Number.isNaN(from.getTime())) {
    warnOnce(`PLUTOS_SYNC_FROM is not a valid ISO timestamp: ${fromRaw}`);
    return { ok: false, reason: "invalid_config" };
  }

  return { ok: true, config: { apiUrl, apiKey, from } };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Cutoff gate. Only invoices issued at/after `from` are eligible; there is no
 * automatic backfill of documents issued before the integration went live.
 */
export function isPlutosEligible(issuedAt: Date | null, from: Date): boolean {
  return issuedAt != null && issuedAt.getTime() >= from.getTime();
}
