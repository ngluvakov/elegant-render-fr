import type { BuyerType } from "@/generated/prisma/client";

/** Which local entity a Plutos document mirrors. */
export type PlutosTarget = "order" | "charge";

/** Result contract shared with the admin panel's action props. */
export type PlutosActionResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Outbox event payload. Intentionally free of money and PII: the handler
 * reloads the invoice + buyer from the database, so nothing sensitive ever
 * lands in the outbox row.
 */
export type PlutosOutboxPayload = {
  target: PlutosTarget;
  targetId: string;
};

/**
 * Snapshot the admin order detail passes to <AdminPlutosSyncPanel>. Kept in
 * sync with the panel's local type (Track B may import this one directly).
 */
export type PlutosSyncSnapshot = {
  invoiceId: string | null;
  number: string | null;
  status: string | null;
  sefStatus: string | null;
  queueStatus: "pending" | "running" | "succeeded" | "failed" | null;
  lastAttemptAt: string | null;
  syncedAt: string | null;
  lastError: string | null;
};

/** Plutos buyer categories. `.com` only ever emits the two foreign ones. */
export type PlutosBuyerType =
  | "individual"
  | "individual_foreign"
  | "company_rs"
  | "company_foreign";

/**
 * Map the site's local buyer type to Plutos. Every `.com` sale is an export
 * to a foreign recipient (see `isExportInvoice`), so an `individual` buyer is
 * a foreign consumer — not a domestic B2C one — hence `individual_foreign`.
 * A `business` buyer is a foreign company → `company_foreign`.
 */
export function plutosBuyerType(local: BuyerType): PlutosBuyerType {
  return local === "business" ? "company_foreign" : "individual_foreign";
}
