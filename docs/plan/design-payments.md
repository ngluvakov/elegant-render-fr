# Payments and currency design

## Goal

Use PayPal for international checkout while keeping EUR as the accounting and invoice currency. The buyer may see and pay in a supported local display currency when the platform enables that behavior.

## Ownership

This design belongs to Track A. Codex may read it but must not edit payment, currency, billing, checkout, API, server action, schema, analytics, or invoice implementation paths.

## PayPal flow

1. Buyer builds an estimate.
2. Checkout captures buyer details and required legal acknowledgements.
3. Server creates the order and freezes the amount snapshot.
4. PayPal order is created server-side.
5. Buyer approves in PayPal.
6. Server captures the PayPal order.
7. Webhook and reconciliation paths confirm or repair final state.
8. Source-file upload happens after payment.

## Data rules

Store enough information to reconcile payment and accounting:

- Provider.
- PayPal order ID.
- PayPal capture ID.
- Capture status.
- Charged amount in minor units.
- Charged currency.
- EUR base amount.
- FX snapshot and timestamp where applicable.
- Raw provider response for audit.

## Webhook rules

- Verify PayPal webhook signatures.
- Deduplicate events.
- Treat server-confirmed state as authoritative.
- Handle completed, denied, pending, and refunded states.
- Do not complete an order from a browser-only success signal.

## Refund rules

- Refund through PayPal to the original funding source.
- Store refund state and amount.
- Sync dashboard-initiated refunds through webhook handling.
- Keep legal refund wording aligned with Track D.

## Invoice rules

- Invoices are issued in EUR.
- Payment receipt details may show the charged currency and PayPal capture reference.
- Buyer type and country drive invoice formatting.
- Tax language must be confirmed by the owner or advisor before launch.

## Analytics rules

- Purchase events fire only after confirmed payment.
- Event IDs should dedupe browser and webhook paths.
- Analytics values must match the server order snapshot.
- CRM comments can include charged currency details when different from the EUR accounting amount.

## Verification

- Unit tests for currency conversion and rounding.
- PayPal sandbox happy path.
- Pending payment path.
- Webhook completion path.
- Reconciliation recovery path.
- Refund path.
- Amount mismatch fail-closed path.
- Post-payment upload path.