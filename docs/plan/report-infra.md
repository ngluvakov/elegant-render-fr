# Infrastructure exploration report

## Summary

The international fork keeps the same Next.js, Prisma, Supabase, Auth.js, Resend, CRM, analytics, and deployment foundations while changing domain, environment, payment provider, and launch gates.

## Required services

| Service | Purpose |
| --- | --- |
| Vercel | Hosting, deployment, env management, domain routing. |
| Supabase | Database and private order-file storage. |
| PayPal | Checkout, capture, webhook, refund. |
| Resend | Transactional email. |
| Auth provider | Email/password and Google sign-in. |
| Redis | Rate limits and lightweight operational state. |
| Sentry | Error monitoring. |
| PostHog | Product analytics. |
| GTM and GA4 | Marketing analytics and conversion tracking. |
| Bitrix24 | Sales and operations pipeline. |

## Environment rules

- Keep production secrets out of git.
- Keep sandbox and live payment credentials clearly separated.
- Use `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` for host-sensitive links.
- Keep GTM disabled until launch verification.
- Protect cron endpoints with secrets.

## Launch dependencies

- Domain attached and DNS stable.
- Mail sender verified and receiving mailbox active.
- Database migrated.
- PayPal live webhook verified.
- CRM pipeline and outbound webhook configured.
- Search Console and Bing verified.
- Monitoring receives production errors.

## Verification

```powershell
npx tsc --noEmit
npm run lint
npx prisma generate
npx prisma migrate status
```

Then verify the deployed app through auth, checkout, upload, CRM, email, and refund flows.