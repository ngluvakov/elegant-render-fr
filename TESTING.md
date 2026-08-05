# Elegant Render launch QA runbook

Use this checklist before merging release branches, before the sandbox freeze, and again before launch. The target product is the English elegantrender.com platform with EUR accounting, local display prices, PayPal checkout, English routes, and post-payment file upload.

## 1. Environment readiness

- [ ] `npm install` has completed and `npx prisma generate` runs without errors.
- [ ] `npx tsc --noEmit` is green on the branch under test.
- [ ] `npm run lint` is green on the branch under test.
- [ ] Required local env values are present for auth, Supabase, Resend, PayPal sandbox, Redis, PostHog, Sentry, Bitrix24, and cron secrets.
- [ ] `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` point to the tested host.
- [ ] PayPal is in sandbox mode until the launch gate.

## 2. Marketing and SEO smoke

- [ ] `/` loads the international homepage with the White Rook design system.
- [ ] `/services`, `/pricing`, `/portfolio`, `/about`, `/contact`, `/faq`, and service detail pages load without console errors.
- [ ] Header, footer, legal links, and mobile navigation use English labels.
- [ ] Pricing copy shows EUR as the invoice currency and local display prices where enabled.
- [ ] Legal pages under `/legal/*` load and do not reference old Serbian routes.
- [ ] `sitemap.xml`, `robots.txt`, canonical URLs, and OpenGraph metadata use elegantrender.com routes.
- [ ] GA4 and GTM stay disabled locally unless explicitly testing analytics.

## 3. Authentication

- [ ] `/login` accepts a valid email and password and redirects to `/portal`.
- [ ] Invalid credentials show a clear English error.
- [ ] `/register` creates a user with name, email, and password.
- [ ] Registration sends a verification email from the configured Elegant Render sender.
- [ ] Google OAuth redirects back to `/portal` on success.
- [ ] `/forgot-password` sends a reset email.
- [ ] `/reset-password?token=...` accepts a new password and the new password works.
- [ ] `/portal` and nested portal routes redirect unauthenticated visitors to `/login`.
- [ ] Sign out returns the user to the public site.

## 4. Pricing configurator

- [ ] `/pricing` loads the configurator without hydration errors.
- [ ] Category tabs and service selection use English labels.
- [ ] Adding a service updates the estimate summary and total.
- [ ] Included quantities start at the included minimum and extra quantities price correctly.
- [ ] Animation duration controls update the estimate in real time.
- [ ] The checkout CTA preserves the selected estimate and opens `/checkout`.
- [ ] No machine-readable IDs, slugs, or enum values are changed by translation work.

## 5. Checkout and PayPal sandbox

- [ ] Guest checkout starts with the details step and captures name, email, country, and optional company details.
- [ ] Logged-in checkout skips redundant account fields where expected.
- [ ] Required legal checkboxes are visible and block payment until accepted.
- [ ] Step 2 shows the same amount and currency that the buyer saw in the estimate.
- [ ] PayPal buttons render with the sandbox client ID.
- [ ] Sandbox approval creates a PayPal order, captures it, and lands on the success page.
- [ ] The order is saved with payment provider `paypal`, the charged currency, and the capture reference.
- [ ] The success screen invites the buyer to upload source files after payment.
- [ ] Direct access to `/checkout` without an estimate redirects back to `/pricing` or shows the expected empty state.
- [ ] A declined or cancelled PayPal attempt lands on the failure path with a plain English recovery message.

## 6. Post-payment upload

- [ ] The success screen and portal order page both expose source-file upload after payment.
- [ ] Drag and drop accepts allowed file types and rejects oversized files with an English message.
- [ ] Upload progress is visible.
- [ ] Uploaded files appear in the order file list with name and size.
- [ ] Removing an uploaded file works where the UI offers removal.
- [ ] Source-file reminder emails are scheduled only when files are still missing.

## 7. Client portal

- [ ] `/portal` dashboard cards and empty states are in English.
- [ ] `/portal/orders` lists only the signed-in user's orders.
- [ ] Search and status filters work on the orders list.
- [ ] Order detail shows status, line items, files, comments, deliverables, and payment state.
- [ ] Client comments post with the client label and appear without a full reload.
- [ ] Revision request and revision upload flows work on eligible orders.
- [ ] Profile updates save name, phone, and password changes.
- [ ] Mobile portal navigation collapses into a drawer and all order detail panels stack cleanly.

## 8. Admin and operations

- [ ] Admin users see admin navigation; client users do not.
- [ ] Admin dashboard totals and order filters load.
- [ ] Admin order detail shows buyer data, status controls, files, comments, and deliverables.
- [ ] Valid status transitions update the order and the tracker.
- [ ] Team comments are visible to the client in the portal.
- [ ] Deliverable upload creates signed download links.
- [ ] Bitrix24 outbound sync creates or updates the matching deal in the English pipeline.
- [ ] Bitrix24 inbound stage changes update the portal without creating a sync loop.
- [ ] Cron reconciliation endpoints require the configured secret.

## 9. Email notifications

- [ ] Verification, password reset, guest access, payment confirmation, source-file reminder, comment, revision, deliverable, refund, and admin notification emails render in English.
- [ ] Email amounts match the charged currency and EUR accounting rules.
- [ ] Invoice/proforma issue and due dates match across PDFs and email at a UTC-midnight boundary when interpreted in `Europe/Belgrade`.
- [ ] All links use English routes on the tested host.
- [ ] Sender identity uses the configured elegantrender.com mailbox.

## 10. Plutos accounting sync

- [ ] With `PLUTOS_SYNC_ENABLED=false`, a paid order still issues and emails its invoice without creating a Plutos outbox event.
- [ ] With the mock enabled, a newly issued order invoice is queued once and reaches `Synced`.
- [ ] A paid additional charge queues a separate document ID and displays its own invoice and Plutos state.
- [ ] Repeated payment callbacks and invoice retries do not create duplicate Plutos events.
- [ ] Invoices earlier than `PLUTOS_SYNC_FROM` are not queued automatically.
- [ ] A mock 401, 422, timeout, and 5xx response leave the local invoice intact and surface a sanitized admin error.
- [ ] `Retry sync` reuses the failed outbox event; `Refresh status` updates the stored remote status.
- [ ] The Plutos API key and complete buyer payload never appear in browser responses, admin errors, logs, or Sentry metadata.
- [ ] Existing PayPal, PDF, email, and Bitrix behavior is unchanged when Plutos is unavailable.

## 11. Legal and consumer-rights routes

- [ ] `/legal`, `/legal/imprint`, `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/withdrawal`, `/legal/refunds`, `/legal/complaints`, `/legal/delivery`, and `/legal/certificates` return 200 and render English metadata and visible copy.
- [ ] Footer Privacy policy opens `/legal/privacy`, Terms of service opens `/legal/terms`, and Refunds policy opens `/legal/refunds`; no `#privatnost`, `#uslovi`, `#povracaj`, or `/legal/privatnost` path appears.
- [ ] Cookie settings can be reopened from the cookie policy and optional categories remain off until chosen.
- [ ] The cookie inventory matches production scripts, cookies, localStorage, and sessionStorage after sign-in, chat, checkout, PayPal, analytics consent, marketing consent, and replay consent are each tested separately.
- [ ] `/legal/withdrawal#online-withdrawal` supports entry, review, edit, and an explicit `Confirm withdrawal` step on desktop and mobile.
- [ ] A valid withdrawal submission creates a server timestamp and reference, reaches the operations mailbox, records `consumer.withdrawal_notice_received`, and sends the consumer a durable-medium confirmation with matching content.
- [ ] Invalid fields, the honeypot, rate limiting, a missing Resend key, an operations-email failure, and a customer-confirmation failure each produce the documented safe outcome without falsely reporting an unrecorded notice.
- [ ] The withdrawal function does not automatically change order status or issue a refund.
- [ ] Account data export points to `/legal/privacy`.

## 12. Error handling

- [ ] Unknown public routes render the English 404 state.
- [ ] Invalid checkout data returns field-level English errors.
- [ ] Payment errors do not complete the order.
- [ ] Unknown order IDs in the portal return a protected 404 or redirect.
- [ ] Oversized files and unsupported formats return English errors.
- [ ] API failures are logged without leaking secrets to the browser.

## 13. Launch gate

- [ ] PayPal live webhook is configured and signature verification is green.
- [ ] A low-value live purchase and refund have been tested end to end.
- [ ] Resend domain records are verified and `info@elegantrender.com` receives mail.
- [ ] Search Console and Bing properties are verified.
- [ ] GTM consent mode and GA4 purchase events are validated with EUR values.
- [ ] Sitemap is submitted after the production deploy.
- [ ] The appointed EU representative is named on the privacy policy and imprint, or counsel has documented why the GDPR Article 27 exception applies.
- [ ] UK representative requirements are separately assessed and any required representative is named.
- [ ] Checkout stores the exact versioned withdrawal request/consent/acknowledgement and includes it in the durable-medium order confirmation.
- [ ] Target-market counsel approves the privacy, consumer-rights, and checkout classification; the operational retention and processor-transfer checklists are signed off.
