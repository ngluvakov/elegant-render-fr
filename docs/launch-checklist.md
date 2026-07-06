# Elegant Render launch checklist

This checklist is for the international launch of elegantrender.com.

## Pre-launch ownership

- [ ] Track A payment, currency, checkout, invoice, analytics, and CRM changes are merged.
- [ ] Track B portal, auth, configurator, chat, and email translation is merged after the relevant sync points.
- [ ] Track C public marketing redesign and navigation updates are merged.
- [ ] Track D legal, docs, llms, and blog translation is merged.
- [ ] Main passes `npx tsc --noEmit`.
- [ ] Main passes `npm run lint`.
- [ ] Main passes the agreed test suite.

## Environment

- [ ] Production `AUTH_SECRET` is set.
- [ ] Production database URLs are set.
- [ ] Supabase storage bucket for order files exists and is private.
- [ ] Resend domain is verified.
- [ ] PayPal live credentials are set but live mode is not flipped until the payment gate.
- [ ] Redis, Sentry, PostHog, CRM, and cron secrets are set.
- [ ] `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` are `https://elegantrender.com`.

## Domain and email

- [ ] `elegantrender.com` and `www.elegantrender.com` are attached to the Vercel project.
- [ ] DNS is stable.
- [ ] `info@elegantrender.com` receives mail.
- [ ] Sender address is configured as Elegant Render.
- [ ] SPF, DKIM, and DMARC records pass.

## Legal

- [ ] Imprint names White Rook DOO as seller.
- [ ] EU representative is appointed and the placeholder is replaced.
- [ ] Terms, privacy, cookies, refunds, withdrawal, complaints, delivery, and certificates pages are live.
- [ ] Footer legal links point to the new legal routes.
- [ ] Sitemap includes the legal routes.
- [ ] Stale links to privacy or refunds anchors inside terms are removed.

## Payment gate

- [ ] PayPal sandbox checkout is green end to end.
- [ ] PayPal live webhook is configured with the correct events.
- [ ] Webhook signature verification is green.
- [ ] A low-value live order succeeds.
- [ ] A live refund returns to the original funding source.
- [ ] The portal shows the paid order.
- [ ] Confirmation email contains the correct order, amount, and currency.
- [ ] Invoice or receipt output uses EUR accounting rules.

## CRM and operations

- [ ] English CRM pipeline exists.
- [ ] New paid order creates the expected deal.
- [ ] Status changes sync both ways without loops.
- [ ] File and comment events are visible to operations.
- [ ] Reconciliation cron is protected by secret and logs healthy status.

## SEO and analytics

- [ ] Sitemap submitted in Search Console.
- [ ] Bing property is connected or imported.
- [ ] Canonicals use elegantrender.com.
- [ ] OpenGraph image is present.
- [ ] GTM container is published only after the final verification.
- [ ] GA4 purchase values are verified with EUR reporting.
- [ ] Consent mode is checked in tag preview.

## Visual QA

- [ ] Home page matches the design handoff.
- [ ] Pricing and checkout are readable on mobile.
- [ ] Service cards do not overflow.
- [ ] Legal pages are readable and have consistent typography.
- [ ] Portal order detail works on small screens.
- [ ] No old local-language strings are visible in primary flows.

## Launch flip

- [ ] Set PayPal mode to live.
- [ ] Enable GTM public flag.
- [ ] Submit sitemap.
- [ ] Run one live purchase and refund check.
- [ ] Watch production logs for at least one hour.
- [ ] Record launch status in `docs/platform-decisions.md`.