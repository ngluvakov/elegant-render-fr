import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Cookie policy",
  description: `Cookies and similar technologies used by ${SITE.name}, including necessary storage, analytics, marketing measurement, payment tools, and session replay.`,
  path: "/legal/cookies",
});

type CookieEntry = {
  name: string;
  storage: string;
  provider: string;
  purpose: string;
  retention: string;
};

const NECESSARY_AND_FUNCTIONAL: CookieEntry[] = [
  {
    name: "authjs.session-token / __Secure-authjs.session-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Keeps an authenticated account signed in and protects portal routes.",
    retention: "Until logout or session expiry; normally up to 30 days",
  },
  {
    name: "authjs.csrf-token / __Host-authjs.csrf-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Protects authentication requests against cross-site request forgery.",
    retention: "Browser session or authentication-flow expiry",
  },
  {
    name: "authjs.callback-url / __Secure-authjs.callback-url",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Returns you to the intended page after authentication.",
    retention: "Browser session or authentication-flow expiry",
  },
  {
    name: "er-consent",
    storage: "localStorage",
    provider: "Elegant Render",
    purpose: "Stores the categories you accepted or refused and the decision time.",
    retention: "Until you change the choice or clear browser storage",
  },
  {
    name: "er-checkout-quote and er-checkout-withdrawal-waived-at",
    storage: "sessionStorage",
    provider: "Elegant Render",
    purpose: "Carries the selected estimate and withdrawal choice into checkout.",
    retention: "Browser-tab session; cleared after checkout where possible",
  },
  {
    name: "er-chat-* and er-chat-proposal",
    storage: "sessionStorage + localStorage",
    provider: "Elegant Render",
    purpose: "Keeps chat state, a pseudonymous chat session ID, and a proposed estimate while you navigate the site.",
    retention: "Messages and UI state: browser-tab session; session ID: until browser storage is cleared",
  },
  {
    name: "Turnstile security data (names may vary)",
    storage: "Cookie + script request",
    provider: "Cloudflare",
    purpose: "Checks public forms for automated abuse when Turnstile is enabled.",
    retention: "Controlled by Cloudflare and limited to the security purpose",
  },
  {
    name: "PayPal SDK and checkout cookies",
    storage: "Cookie + script request",
    provider: "PayPal",
    purpose: "Provides payment controls, fraud prevention, approval, and payment-status handling after you open PayPal checkout.",
    retention: "Controlled by PayPal; varies by cookie, account, and funding source",
  },
];

const ANALYTICS: CookieEntry[] = [
  {
    name: "Vercel Web Analytics and Speed Insights",
    storage: "Measurement request; designed to operate without a cross-site advertising profile",
    provider: "Vercel",
    purpose: "Measures aggregate page usage and real-user performance.",
    retention: "Under the Vercel project configuration and provider retention rules",
  },
  {
    name: "ph_* and provider-generated identifiers",
    storage: "Cookie + localStorage",
    provider: "PostHog",
    purpose: "Measures product usage, journeys, and conversion funnels after analytics consent.",
    retention: "Up to 12 months unless deleted sooner or the provider configuration changes",
  },
  {
    name: "_ga and _ga_*",
    storage: "Cookie",
    provider: "Google Analytics 4",
    purpose: "Distinguishes visits and measures traffic and page usage after analytics consent.",
    retention: "Up to 24 months unless deleted sooner or the tag configuration changes",
  },
  {
    name: "Sentry error and performance context",
    storage: "Script request + browser session storage where used",
    provider: "Sentry (Functional Software, Inc.)",
    purpose: "Diagnoses browser errors and performance problems after analytics consent. Server-side security and error logs can also be processed independently of browser consent where necessary.",
    retention: "According to the Sentry project configuration and incident needs",
  },
];

const MARKETING: CookieEntry[] = [
  {
    name: "Google Tag Manager",
    storage: "Script + dataLayer",
    provider: "Google",
    purpose: "Loads only the tags permitted by your analytics and marketing choices. Tag Manager does not itself create an advertising profile, but tags configured inside it may use identifiers.",
    retention: "During page load; downstream tag retention is listed separately",
  },
  {
    name: "Google Ads and conversion identifiers, including _gcl_* where configured",
    storage: "Cookie + script request",
    provider: "Google",
    purpose: "Attributes inquiries and paid orders to advertising and measures campaign performance after marketing consent.",
    retention: "Depends on the enabled Google tag and campaign configuration",
  },
];

const RECORDING: CookieEntry[] = [
  {
    name: "PostHog session recording data",
    storage: "Cookie + localStorage + browser recording requests",
    provider: "PostHog",
    purpose: "Records masked or redacted interaction sessions to find usability problems after separate recording consent.",
    retention: "Up to 12 months unless deleted sooner or the provider configuration changes",
  },
  {
    name: "Sentry Replay session data",
    storage: "sessionStorage or IndexedDB + recording requests",
    provider: "Sentry (Functional Software, Inc.)",
    purpose: "Captures replay context around technical errors after separate recording consent.",
    retention: "According to the Sentry Replay project configuration; normally no more than 30 days",
  },
];

export default function CookiePolicyPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Cookie policy
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated: {formatDate(LAST_UPDATED)}
        </p>

        <Section title="1. Scope">
          <p>
            This policy covers cookies and similar browser technologies used by
            {` ${SITE.name}`}, including localStorage, sessionStorage, pixels,
            scripts, SDKs, IndexedDB, and measurement requests. Names can vary
            by browser, secure-domain prefix, provider release, and tag
            configuration, so the tables describe both known names and their
            functions.
          </p>
        </Section>

        <Section title="2. Your choices">
          <p>
            Necessary technologies support a service you request, security,
            sign-in, checkout, and storing your choice. Where permitted, they
            operate without consent. Optional analytics, marketing, and session
            recording are controlled separately and are off until you opt in
            where consent is required.
          </p>
          <p>
            Reopen <ConsentSettingsLink className="underline-offset-4 hover:underline" />{" "}
            at any time. Withdrawing consent stops new optional browser
            collection on this site but does not reverse processing that already
            occurred. You can also clear site data in your browser; doing so may
            sign you out, remove your estimate, clear chat state, or reset your
            consent choice.
          </p>
        </Section>

        <CookieTable
          title="3. Necessary and functional technologies"
          subtitle="Used to provide features you request, protect forms and accounts, complete checkout, and remember privacy choices. PayPal and Turnstile data is triggered only when the related feature is used and configured."
          rows={NECESSARY_AND_FUNCTIONAL}
        />

        <CookieTable
          title="4. Analytics and performance"
          subtitle="Browser analytics and performance tools that are consent-gated where required. Limited server-side logs and aggregate, cookieless measurements may operate for security and reliability where the law permits."
          rows={ANALYTICS}
        />

        <CookieTable
          title="5. Marketing measurement"
          subtitle="Used only after marketing consent and only when the relevant tag is configured. LinkedIn tracking is not currently active in the production code covered by this policy."
          rows={MARKETING}
        />

        <CookieTable
          title="6. Session recording"
          subtitle="Used only after separate session-recording consent. Recording configurations are intended to mask sensitive fields, but you should still avoid entering unnecessary sensitive information."
          rows={RECORDING}
        />

        <Section title="7. Browser privacy signals">
          <p>
            You can always use our cookie settings to refuse optional tracking.
            Some browsers also send Global Privacy Control or other preference
            signals. Where a signal creates a legally binding opt-out and our
            technology can recognise it, we treat it as an opt-out from sale,
            sharing, and targeted advertising. Browser “Do Not Track” signals
            do not have one consistent legal or technical meaning, so cookie
            settings remain the reliable control on this site.
          </p>
        </Section>

        <Section title="8. More information">
          <p>
            The{" "}
            <Link
              href="/legal/privacy"
              className="text-foreground underline-offset-4 hover:underline"
            >
              privacy policy
            </Link>{" "}
            explains the personal data, legal bases, recipients, international
            transfers, retention rules, and rights connected with these tools.
            Questions can be sent to{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            .
          </p>
        </Section>
      </article>
      <FinalCta />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}

function CookieTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: CookieEntry[];
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        {subtitle}
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-secondary/60 text-foreground/80">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Storage</th>
              <th className="px-3 py-3">Provider</th>
              <th className="px-3 py-3">Purpose</th>
              <th className="px-3 py-3">Retention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground/70">
            {rows.map((row) => (
              <tr key={`${row.provider}-${row.name}`} className="align-top">
                <td className="px-3 py-3 font-mono text-xs text-foreground/85">
                  {row.name}
                </td>
                <td className="px-3 py-3">{row.storage}</td>
                <td className="px-3 py-3">{row.provider}</td>
                <td className="px-3 py-3">{row.purpose}</td>
                <td className="px-3 py-3">{row.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
