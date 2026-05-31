# Google Tag Manager Checklist

Google Tag Manager is the primary Google analytics integration for Elegant
Render:

- GTM Container ID: `GTM-5X2MCQ87`
- GA4 Measurement ID inside GTM: `G-5090C2WQVB`

The container loads only when both conditions are true:

- `NEXT_PUBLIC_GTM_ENABLED=true`
- visitor accepted analytics or marketing consent in the cookie banner

## Before Enabling

- Confirm the Web container `GTM-5X2MCQ87` is published.
- Confirm GA4 is configured inside the container with `G-5090C2WQVB`.
- Add `GOOGLE_TAG_MANAGER_DASHBOARD_URL` so admins can open it from
  `/portal/admin/analitika`.
- Keep the legal pages and cookie banner listing Google Tag Manager as an
  analytics/marketing tag manager controlled by Consent Mode.
- Keep the direct GA4 tag disabled with `NEXT_PUBLIC_GA4_ENABLED=false` unless
  GA4 is removed from GTM.

## Launch Switch

Set these in Vercel Production environment:

```env
NEXT_PUBLIC_GTM_ENABLED=true
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-5X2MCQ87
NEXT_PUBLIC_GA4_ENABLED=false
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5090C2WQVB
GOOGLE_TAG_MANAGER_DASHBOARD_URL=https://tagmanager.google.com/
```

Redeploy production after changing env vars.

## GTM Container Notes

- The site pushes `virtual_page_view` into `dataLayer` after analytics consent
  and on App Router navigation.
- Event fields: `page_path`, `page_location`, `page_title`.
- Ads consent stays denied by default and is granted only after marketing
  consent: `ad_storage`, `ad_user_data`, and `ad_personalization`.
- Google Ads conversion events are pushed as `er_begin_checkout`,
  `er_generate_lead`, and `er_purchase`; Ads tags in GTM should listen only to
  the relevant custom events and consent state.
- The standard GTM `noscript` iframe is intentionally omitted because the site
  stores consent in `localStorage`; a server-rendered iframe could not respect
  that choice.

## Verification

- Open the live site in a fresh browser profile.
- Before accepting cookies, confirm no `gtm.js` request is sent.
- Accept analytics consent and confirm Tag Assistant sees the GTM container.
- Navigate between a few public routes and confirm `virtual_page_view` events
  appear in Tag Assistant / Preview mode.
- In a fresh profile, accept marketing consent and confirm Ads conversion
  custom events can reach the container without granting analytics storage.
- Reject or withdraw analytics consent and confirm a fresh page load sends no
  GTM network request unless marketing consent remains granted.
