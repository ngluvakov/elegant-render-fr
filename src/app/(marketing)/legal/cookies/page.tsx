import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Cookie policy",
  description: `Cookies and similar technologies used by ${SITE.name}, including necessary, analytics, marketing, payment, and replay tools.`,
  path: "/legal/cookies",
});

type CookieEntry = {
  name: string;
  storage: string;
  provider: string;
  purpose: string;
  retention: string;
};

const NECESSARY: CookieEntry[] = [
  {
    name: "next-auth.session-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Keeps you signed in after login.",
    retention: "Until logout or up to 30 days",
  },
  {
    name: "next-auth.csrf-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Protects login and account forms from cross-site request forgery.",
    retention: "Browser session",
  },
  {
    name: "next-auth.callback-url",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Remembers where to return you after login.",
    retention: "Browser session",
  },
  {
    name: "er-country",
    storage: "Cookie",
    provider: "Elegant Render",
    purpose: "Stores country context for regional display and buyer validation.",
    retention: "30 days",
  },
  {
    name: "er-consent",
    storage: "localStorage",
    provider: "Elegant Render",
    purpose: "Stores your cookie and tracking choices.",
    retention: "Until you clear browser storage or change settings",
  },
];

const ANALYTICS: CookieEntry[] = [
  {
    name: "ph_*",
    storage: "Cookie + localStorage",
    provider: "PostHog Inc.",
    purpose: "Measures product usage, funnels, and page behaviour after consent.",
    retention: "Up to 12 months",
  },
  {
    name: "_ga, _ga_*",
    storage: "Cookie",
    provider: "Google Analytics 4",
    purpose: "Measures visits, traffic sources, and page usage after consent.",
    retention: "Up to 24 months",
  },
  {
    name: "Google Tag Manager",
    storage: "Script + dataLayer",
    provider: "Google Tag Manager",
    purpose: "Loads measurement tags according to your consent choices.",
    retention: "During page load",
  },
  {
    name: "sentry-* (trace)",
    storage: "Cookie",
    provider: "Sentry (Functional Software, Inc.)",
    purpose: "Helps diagnose performance and application errors.",
    retention: "Browser session",
  },
];

const MARKETING_AND_PAYMENT: CookieEntry[] = [
  {
    name: "PayPal SDK and checkout cookies",
    storage: "Cookie + script requests",
    provider: "PayPal",
    purpose:
      "Enables PayPal checkout, fraud prevention, payment approval, and payment status handling.",
    retention: "Controlled by PayPal; varies by cookie and funding source",
  },
  {
    name: "Google Ads / conversion tags",
    storage: "Cookie + script requests",
    provider: "Google",
    purpose:
      "Measures advertising conversions where marketing tags are enabled and consent is granted.",
    retention: "Varies by Google tag configuration",
  },
];

const RECORDING: CookieEntry[] = [
  {
    name: "ph_session_*",
    storage: "Cookie + IndexedDB",
    provider: "PostHog Inc.",
    purpose:
      "Records anonymised interaction sessions for support and product improvement after consent.",
    retention: "Up to 12 months",
  },
  {
    name: "Sentry Replay",
    storage: "Cookie + IndexedDB",
    provider: "Sentry (Functional Software, Inc.)",
    purpose:
      "Records replay context around errors so we can reproduce technical problems after consent.",
    retention: "30 days",
  },
];

export default function CookiePolicyPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Cookie policy
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. What cookies are">
          <p>
            Cookies are small text files stored in your browser. Similar
            technologies include localStorage, sessionStorage, IndexedDB, pixels,
            scripts, and dataLayer events. Some are needed for the site to work;
            others are used only if you give consent.
          </p>
        </Section>

        <Section title="2. Your choices">
          <p>
            You can accept all optional technologies, keep only necessary
            technologies, or change individual categories. You can reopen the
            settings here: <ConsentSettingsLink className="underline-offset-4 hover:underline" />.
          </p>
          <p>
            You can also delete cookies in your browser settings. Browser
            deletion may sign you out or reset your consent preferences.
          </p>
        </Section>

        <CookieTable
          title="3. Necessary technologies"
          subtitle="Required for login, security, checkout, and remembering your choices. These do not require consent."
          rows={NECESSARY}
        />

        <CookieTable
          title="4. Analytics"
          subtitle="Used only with analytics consent to understand performance, funnels, and product usage."
          rows={ANALYTICS}
        />

        <CookieTable
          title="5. Marketing and payment"
          subtitle="Marketing tags require marketing consent. PayPal technologies are loaded when you choose PayPal checkout or interact with PayPal payment controls."
          rows={MARKETING_AND_PAYMENT}
        />

        <CookieTable
          title="6. Session replay"
          subtitle="Used only with session recording consent to diagnose errors and improve difficult flows."
          rows={RECORDING}
        />

        <Section title="7. More information">
          <p>
            For details about personal data processing, see our{" "}
            <Link
              href="/legal/privacy"
              className="text-foreground underline-offset-4 hover:underline"
            >
              privacy policy
            </Link>
            . Questions can be sent to{" "}
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
      <p className="mt-3 text-base leading-relaxed text-foreground/65">
        {subtitle}
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border/60">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Storage</th>
              <th className="px-3 py-3">Provider</th>
              <th className="px-3 py-3">Purpose</th>
              <th className="px-3 py-3">Retention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground/75">
            {rows.map((row) => (
              <tr key={`${row.provider}-${row.name}`}>
                <td className="px-3 py-3 font-mono text-xs text-foreground">
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
