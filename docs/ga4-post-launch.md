# GA4 Checklist

Google Analytics 4 is configured inside the Google Tag Manager container for
Elegant Render:

- GA4 Measurement ID: `G-5090C2WQVB`
- GTM Container ID: `GTM-5X2MCQ87`

Because GA4 is already configured inside GTM, the direct GA4 tag should stay
disabled to avoid duplicate pageviews:

```env
NEXT_PUBLIC_GA4_ENABLED=false
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5090C2WQVB
```

## Before Enabling

- Confirm the GA4 tag in GTM uses `G-5090C2WQVB`.
- Add `GOOGLE_ANALYTICS_DASHBOARD_URL` so admins can open it from
  `/portal/admin/analitika`.
- Confirm the cookie banner, cookie policy, and privacy policy list Google
  Analytics 4 under analytics consent.
- Keep `NEXT_PUBLIC_GA4_ENABLED=false` while GA4 fires from GTM.

## Production Env

Set these in Vercel Production environment:

```env
NEXT_PUBLIC_GA4_ENABLED=false
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5090C2WQVB
GOOGLE_ANALYTICS_DASHBOARD_URL=https://analytics.google.com/analytics/web/
```

Redeploy production after changing env vars.

## Verification

- Open the live site in a fresh browser profile.
- Accept analytics consent.
- Confirm GTM Preview sees the container and GA4 Realtime shows the visit.
- Navigate between a few public routes and confirm page views change through
  the GTM `virtual_page_view` flow.
- Reject/withdraw analytics consent and confirm no new GTM/GA4 network requests
  are sent on a fresh page load.
- Link GA4 with Google Search Console after the final domain is verified.

## Legal Note

The cookie banner, cookie policy, and privacy policy list Google Analytics 4 as
an analytics processor. Keep GA4 behind the analytics consent toggle.
