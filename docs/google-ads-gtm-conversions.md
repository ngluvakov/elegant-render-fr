# Google Ads and GTM conversion runbook

This runbook covers the international Elegant Render site. Analytics values should be aligned to the buyer-facing charged amount and the EUR accounting model.

## Principles

- GTM is the container for GA4 and Ads tags.
- GA4 property currency is EUR.
- Purchase events may include charged currency details where the platform displays and charges a supported local currency.
- Server-side order state is the source of truth for successful purchases.
- Do not publish tags until the launch gate is complete.

## Recommended events

| Event | Trigger | Required parameters |
| --- | --- | --- |
| `view_item_list` | Services or pricing list viewed. | service category, visible currency. |
| `select_item` | A service is added to the estimate. | item ID, item name, quantity, display amount. |
| `begin_checkout` | Checkout opens with a valid estimate. | estimate ID, value, currency. |
| `add_payment_info` | PayPal step becomes available. | provider, value, currency. |
| `purchase` | Payment is captured or completed by verified webhook. | order ID, value, currency, items, provider. |
| `refund` | Refund is confirmed. | order ID, amount, currency, provider. |
| `generate_lead` | Contact form or project inquiry submitted. | form name, service interest. |

## GTM setup

1. Create a new web container for elegantrender.com.
2. Keep the public GTM flag disabled until production launch.
3. Add consent mode defaults before analytics tags fire.
4. Add GA4 configuration through GTM, not a direct hardcoded GA script.
5. Add Google Ads conversion tags only after the Ads account and conversion actions are confirmed.
6. Use preview mode on localhost and staging before publish.

## Purchase validation

A purchase event is valid only when:

- The order exists in the database.
- Payment provider is PayPal.
- Capture or webhook state confirms payment.
- The amount and currency match the order charge snapshot.
- The event ID is stable enough to deduplicate repeated browser or webhook paths.

## Launch checklist

- [ ] GTM container ID is set in production env.
- [ ] GTM public flag is still disabled before the final launch flip.
- [ ] GA4 receives page views in debug mode.
- [ ] `begin_checkout` fires once per checkout start.
- [ ] `purchase` fires once per paid order.
- [ ] Ads conversion action receives the same purchase value as GA4.
- [ ] Consent mode shows the expected granted or denied state.
- [ ] No tags reference the Serbian domain.

## Debugging

Use browser preview, server logs, and the order record together. If browser and server disagree, trust the server order state and fix the event emission path.