# Legal compliance handoff

Status: Codex Track D/B implementation completed on `codex/legal-compliance-pages` on 2026-08-05. The owner later directed the footer, sitemap, and data-export route corrections to be included in the same production release; the remaining Track A/C items below are still handoff work.

This handoff is an implementation checklist, not a representation that one set of pages makes the business compliant in every country. The notices cover the current platform at a global baseline, with GDPR/UK/Serbian transparency and conditional US-state rights. Operational appointments, contracts, retention execution, and country-specific consumer rules still require owner and legal review.

## Implemented in the Codex-owned paths

- Added `/legal` as an English legal centre.
- Rebuilt `/legal/privacy` around the GDPR/UK transparency checklist: controller, sources, activity-level data and purposes, legal bases, recipients, retention, required-data consequences, transfers, security, rights, regional notices, children, and automated processing.
- Reconciled `/legal/cookies` with the code that actually runs:
  - Auth.js v5 names (`authjs.*`, including secure prefixes), not stale `next-auth.*` names.
  - Removed the nonexistent `er-country` entry.
  - Removed planned LinkedIn and first-party attribution technologies from the active inventory and explicitly says LinkedIn is not currently active.
  - Added current checkout/chat storage, Vercel measurement, Cloudflare Turnstile, PayPal, PostHog, GA4/GTM, Sentry, and consent categories.
- Corrected withdrawal language so service contracts and immediately supplied digital content are not conflated.
- Added the online withdrawal function required by Article 11a of Directive 2011/83/EU as amended by Directive (EU) 2023/2673:
  - first step collects the identifying details;
  - second step displays the unambiguous statement and requires `Confirm withdrawal`;
  - the server supplies the receipt time and reference;
  - the operations mailbox receives the complete statement;
  - the audit log keeps an accountable receipt record;
  - the consumer receives a durable-medium email acknowledgement;
  - failure to deliver the operations copy returns an error and directs the consumer to email immediately.
- Aligned terms, refunds, complaints, and delivery notices with mandatory consumer remedies and the closed EU ODR platform.
- Added every legal page to `llms.txt` and `llms-full.txt` output.

## Track C: footer and sitemap changes applied

The footer routes and omitted sitemap entries below were applied on 2026-08-05 under the owner's direct instruction to complete the production release. Representative information remains pending an actual appointment.

### 1. `NAV_LEGAL` replacement applied in `src/lib/content/site.ts`

Former broken entries:

```ts
{ href: "/legal/terms#privatnost", label: "Privacy policy" },
{ href: "/legal/terms#uslovi", label: "Terms of service" },
{ href: "/legal/terms#povracaj", label: "Refunds" },
```

Applied English, standalone destinations:

```ts
export const NAV_LEGAL: NavItem[] = [
  { href: "/legal", label: "Legal information" },
  { href: "/legal/imprint", label: "Imprint" },
  { href: "/legal/terms", label: "Terms of service" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/cookies", label: "Cookie policy" },
  { href: "/legal/withdrawal#online-withdrawal", label: "Withdraw from a contract" },
  { href: "/legal/refunds", label: "Refunds policy" },
  { href: "/legal/complaints", label: "Complaints procedure" },
  { href: "/legal/delivery", label: "Digital delivery" },
  { href: "/legal/certificates", label: "Certificates and standards" },
];
```

The withdrawal function must remain easy to find and continuously available while an eligible withdrawal period is open. A footer link is the minimum persistent discovery mechanism; do not hide it only inside terms.

### 2. Omitted legal routes added to `src/app/sitemap.ts`

The sitemap now includes `/legal`, `/legal/privacy`, `/legal/refunds`, and `/legal/withdrawal` with the same yearly cadence as the other legal routes.

### 3. Populate representative information after appointment

`IMPRINT.euRepresentative` is still `null`. Do not invent a representative. Once the owner has a written appointment, populate the name, postal address, and email in `src/lib/content/site.ts`; the privacy and imprint pages already render it conditionally.

Track C should also add a `ukRepresentative` field and conditional rendering only if the UK representative assessment concludes that appointment is required.

## Track A: platform-core corrections required

### 1. Data-export note fixed

`src/app/api/account/export/route.ts` formerly said:

```text
Privacy policy (/legal/privatnost)
```

The note now uses `/legal/privacy`. The remaining Track A work begins below.

### 2. Correct and version checkout withdrawal evidence

The current checkbox says the consumer loses the right “once delivery begins”. That is not a safe statement for a service contract. For a service, loss normally follows full performance after the required express request/consent and acknowledgement; for qualifying digital content, loss can follow the start of supply after the separate Article 16(m) conditions and durable-medium confirmation.

Track A should:

- classify each checkout line/order as service, digital content, or a mixed contract with counsel;
- display separate, unselected consent/acknowledgement wording appropriate to that classification;
- store the exact consent version and text, timestamp, order, and user—not only `withdrawalWaivedAt`;
- include the accepted wording and timestamp in the order confirmation sent on a durable medium;
- update the server rejection message in `src/server/actions/order.ts`, which currently says production starting immediately “waives” the right;
- verify that withdrawal remains possible before full service performance when mandatory law says so.

### 3. Give the withdrawal function its own abuse limit and operations workflow

The Codex implementation temporarily uses the existing `projectInquiry` rate-limit bucket because `src/lib/rate-limit.ts` is outside the legal track. Add a dedicated, non-aggressive `withdrawalNotice` bucket. A rate limit must not make a legitimate, on-time withdrawal impracticable.

The form records an audit event and sends operations/customer emails but deliberately does not change order status or issue a refund. Add an admin queue or saved withdrawal entity if email/audit-log handling is not sufficient for the operating team. Preserve the original notice, receipt time, acknowledgement outcome, review, legal result, and refund reference.

## Owner and legal-review blockers

- Assess and, unless a documented Article 27 exception applies, appoint an EU representative before continuing to target individuals in the EEA. The regular EU-facing service and monitoring activity makes it unsafe to assume the occasional/low-risk exception without advice.
- Separately assess the UK representative obligation.
- Confirm processor/controller roles, DPAs, transfer mechanisms, and regional hosting for Vercel, database/storage, Resend, PayPal, Bitrix24, Plutos, OpenAI, Google Gemini, Cloudmersive, PostHog, Google tags, Sentry, Upstash, and Cloudflare.
- Approve and operationalise exact retention/deletion schedules for inquiries, bespoke project files, CRM data, telemetry, audit logs, and backups. The current code enforces 30 days for AI Studio files and 30 days for draft estimates, but several other records use criteria rather than automated deletion.
- Assess European Accessibility Act coverage and any microenterprise exemption before publishing an accessibility claim or statement. No unsupported accessibility-compliance claim was added.
- Have Serbian and target-market consumer/privacy counsel approve the final texts and checkout classification. “Worldwide compliant” cannot be established by page copy alone.

## Primary official references checked

- GDPR text, especially Articles 12-14 and 27: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng/
- European Commission GDPR scope guidance: https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/application-regulation/who-does-data-protection-law-apply_en
- European Commission international-transfer guidance: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations/what-rules-apply-if-my-organisation-transfers-data-outside-eu_en
- EDPB territorial-scope and representative guidance: https://www.edpb.europa.eu/documents/guideline/guidelines-32018-on-the-territorial-scope-of-the-gdpr-article-3-version-adopted_en
- UK ICO privacy-information checklist: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/checklists/
- Consumer Rights Directive 2011/83/EU: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011L0083
- Directive (EU) 2023/2673, including Article 11a and the 19 June 2026 application date: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023L2673
- Directive (EU) 2019/770 on digital content and digital services: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0770
- Regulation (EU) 2024/3228 closing the ODR platform: https://eur-lex.europa.eu/eli/reg/2024/3228
- California Attorney General CCPA overview and thresholds: https://oag.ca.gov/privacy/ccpa
