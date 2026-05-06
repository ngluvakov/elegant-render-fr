# GA4 Post-Launch Checklist

Google Analytics 4 is prepared in code, but intentionally disabled until the
public domain is live. The tag loads only when both conditions are true:

- `NEXT_PUBLIC_GA4_ENABLED=true`
- visitor accepted analytics consent in the cookie banner

## Before Enabling

- Create a GA4 property and Web Data Stream for the final production domain.
- Copy the Measurement ID into `NEXT_PUBLIC_GA4_MEASUREMENT_ID`.
- Add `GOOGLE_ANALYTICS_DASHBOARD_URL` so admins can open it from
  `/portal/admin/analitika`.
- Keep `NEXT_PUBLIC_GA4_ENABLED=false` during pre-launch testing.

## Launch Switch

Set these in Vercel Production environment:

```env
NEXT_PUBLIC_GA4_ENABLED=true
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_ANALYTICS_DASHBOARD_URL=https://analytics.google.com/analytics/web/
```

Redeploy production after changing env vars.

## Verification

- Open the live site in a fresh browser profile.
- Accept analytics consent.
- Confirm GA4 Realtime shows the visit.
- Navigate between a few public routes and confirm page views change.
- Reject/withdraw analytics consent and confirm no new GA4 network requests are
  sent on a fresh page load.
- Link GA4 with Google Search Console after the final domain is verified.

## Legal Note

Before enabling GA4 in production, update the cookie and privacy pages to list
Google Analytics 4 as an active analytics processor. Do this in the same release
as the env switch, not before, so the legal text matches actual behavior.
