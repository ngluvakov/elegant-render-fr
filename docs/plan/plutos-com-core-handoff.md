# Track A handoff — Plutos integration for elegantrender.com

**Owner:** Track A (Claude Code)

**Consumer:** Track B admin UI
**Scope:** `elegantrender.com` only. Do not change the `.rs` repository.

## Safety contract

- The integration is disabled unless `PLUTOS_SYNC_ENABLED=true`.
- PayPal capture, invoice numbering, PDF generation, invoice email, and
  Bitrix sync remain authoritative and must not wait for Plutos.
- A Plutos enqueue failure is reported to Sentry but never changes a
  successful local invoice result.
- Only invoices with `invoiceIssuedAt >= PLUTOS_SYNC_FROM` are eligible.
- No historical backfill runs automatically.

## Schema and configuration

Add the following nullable fields to both `Order` and `OrderCharge`:

```prisma
plutosInvoiceId    String?
plutosNumber       String?
plutosStatus       String?
plutosSefStatus    String?
plutosLastAttemptAt DateTime?
plutosSyncedAt     DateTime?
plutosLastError    String?   @db.Text
```

Add `plutos_invoice_requested` to `OutboxEventType`. Add these environment
variables to `.env.example`:

```dotenv
PLUTOS_SYNC_ENABLED=false
PLUTOS_SYNC_FROM=
PLUTOS_API_URL=
PLUTOS_API_KEY=
```

Runtime code must parse `PLUTOS_SYNC_FROM` as a valid ISO timestamp whenever
sync is enabled. Missing or invalid Plutos configuration disables only the
integration; it must not fail application startup or payment handling.

## Internal interfaces

Place the implementation under Track A-owned paths, for example
`src/server/plutos/**`.

```ts
type PlutosTarget = "order" | "charge";

type PlutosOutboxPayload = {
  target: PlutosTarget;
  targetId: string;
};

type PlutosActionResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function requestPlutosSync(
  target: PlutosTarget,
  targetId: string,
): Promise<PlutosActionResult>;

export async function refreshPlutosStatus(
  target: PlutosTarget,
  targetId: string,
): Promise<PlutosActionResult>;
```

Both exported actions require `FINANCE_MANAGE`, audit the request, and
revalidate `/portal/admin/orders/<orderId>`. `requestPlutosSync` creates the
event when absent, returns success for pending/running events, and resets a
failed matching event to `pending` with attempts `0`. It must never create a
second event with another idempotency key.

Local outbox keys:

```text
plutos_invoice_requested:elegantrender.com:order:<orderId>
plutos_invoice_requested:elegantrender.com:charge:<chargeId>
```

Plutos `order_id` values:

```text
elegantrender.com:order:<orderId>
elegantrender.com:charge:<chargeId>
```

## Payload rules

- `source`: `elegantrender.com`
- `currency`: `EUR`
- `exchange_rate`: `null`
- `send_to_sef`: `false`
- Local `individual` maps to Plutos `individual_foreign`.
- Local `business` maps to Plutos `company_foreign`.
- Use the local invoice issue date for `issue_date`, `supply_date`, and
  `due_date`.
- Use the same `buildInvoiceLineItem` calculation as the existing PDF.
  Primary order lines use `totalCents` with quantity `1`; charge lines use
  `amountCents` and their stored quantity.
- Serialize monetary values as two-decimal strings, quantities as decimal
  strings, and `discount_percent` as `"0"`.
- Derive `vat_rate` from the existing invoice snapshot/billing rule
  (`invoiceVatRateForBuyer`) instead of hardcoding it. Current export invoices
  resolve to `"0.00"`, while the existing property edge case remains
  compatible with its stored VAT rate.
- Send the English stored label as both `description_sr` and
  `description_en` until the Plutos contract supports an English-only source.
- Before POST, recompute the payload total and require exact equality with
  the local EUR invoice total to one cent.
- For PayPal, send `paypalCaptureId ?? paymentId`. Omit the informational
  `payment` object for `card_mock`.

The client uses an eight-second timeout and
`X-Plutos-Api-Key: <PLUTOS_API_KEY>`. Validate POST and GET responses with
Zod. Normalize `plutos_invoice_id` to a string. A response whose `number`
differs from the immutable local `invoiceNumber` is an error. Never include
the API key or the full buyer payload in errors or logs.

On every attempt, update `plutosLastAttemptAt`. On success, update the
external IDs/status fields, clear `plutosLastError`, and set
`plutosSyncedAt`. On failure, store a sanitized error and rethrow so the
existing outbox retry policy applies.

## Producers and reconciliation

After `issueInvoice` and `issueChargeInvoice` have successfully stored their
existing invoice fields, best-effort enqueue the Plutos event when the
feature flag and cutoff allow it. Apply the same ensure-enqueued behavior to
the already-issued idempotent return path.

Extend invoice reconciliation with a bounded Plutos pass (maximum 10
documents per run):

- issued at or after `PLUTOS_SYNC_FROM`;
- `plutosSyncedAt` is null;
- no pending/running/succeeded matching Plutos event exists.

Scan both `Order` and `OrderCharge`. This pass repairs a missed enqueue but
does not resend historical documents before the cutoff.

Register the outbox handler in `src/lib/outbox.ts`. The handler reloads all
invoice and buyer data from the database; the event payload never carries
money or personal data.

## Track A review result

Commit `9750f43` closed the integration-review findings before rollout:

- the client error test now narrows to `PlutosClientError`, keeping standalone
  `tsc --noEmit` green;
- reconciliation repairs missed enqueue only and excludes attempted rows in
  the database query, so terminal failures remain manual retries and cannot
  starve the bounded scan window;
- provider response bodies are treated as untrusted and reduced to a safe HTTP
  status summary; failed status refreshes persist their attempt time and
  sanitized error;
- the configured API base URL is normalized without trailing slashes.

The feature flag remains off by default. Enabling it still requires the
controlled mock/preview checks in this handoff.

## Acceptance tests

- Payload unit tests cover individual/business orders, charges, composite
  document IDs, decimal formatting, exact totals, and rejected mismatches.
- Client tests mock `fetch` for 200, idempotent repeated 200, 401, 422, 429,
  5xx, timeout, invalid JSON, invalid schema, and number mismatch.
- Producer/reconciliation tests prove disabled mode is a no-op, cutoff is
  enforced, duplicate events are not created, and failed events are reused.
- Existing payment, invoice, email, and Bitrix behavior remains unchanged
  with the flag off.
- `npx prisma generate`, `npx tsc --noEmit`, `npx vitest run`, and
  `npx next build` pass before Track B consumes the new fields/actions.
