# Payments exploration report

## Summary

The international payment model uses PayPal and EUR accounting. The previous local card-provider flow is out of scope for elegantrender.com. The final payment implementation belongs to Track A.

## Requirements

- Create PayPal orders server-side.
- Capture PayPal orders server-side.
- Verify PayPal webhooks.
- Deduplicate webhook events.
- Reconcile pending or interrupted payments.
- Store charged amount and currency.
- Keep EUR invoice accounting.
- Support refunds to the original PayPal funding source.
- Move source-file upload after payment.

## Buyer flow

1. Build estimate.
2. Enter buyer details.
3. Accept terms and digital-content/service start acknowledgement where required.
4. Pay with PayPal.
5. Upload source files on success or in the portal.
6. Receive confirmation email.

## Edge cases

- Buyer cancels PayPal approval.
- Capture is pending.
- Webhook arrives before browser return.
- Browser return arrives before webhook.
- Provider amount differs from order snapshot.
- Refund is initiated from the provider dashboard.
- Reconciliation finds stale pending state.

## Verification

- Unit tests for amount conversion and minor units.
- Sandbox checkout happy path.
- Pending capture path.
- Webhook completion path.
- Refund path.
- Reconciliation path.
- Email rendering with payment references.
- CRM deal value and stage sync.