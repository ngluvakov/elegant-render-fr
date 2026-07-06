import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Privacy policy",
  description: `How ${SITE.name} processes personal data under the GDPR, including EU rights, processors, and third-country transfers.`,
  path: "/legal/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Privacy policy
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
        <p className="mt-6 text-base leading-relaxed text-foreground/75">
          This policy explains how {IMPRINT.shortName}, the operator of{" "}
          {SITE.name}, processes personal data when you visit the site, request
          an estimate, place an order, use the portal, or contact us.
        </p>

        <Section title="1. Controller">
          <p>
            The controller is {IMPRINT.legalName}, {IMPRINT.street},{" "}
            {IMPRINT.postalCode} {IMPRINT.city}, Serbia. You can contact us at{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            .
          </p>
          <p>
            {IMPRINT.shortName} is established outside the European Union.
            Appointment of an EU representative under GDPR article 27 is pending
            and must be completed before public launch. The appointed
            representative will be added to the{" "}
            <Link
              href="/legal/imprint"
              className="text-foreground underline-offset-4 hover:underline"
            >
              imprint
            </Link>
            .
          </p>
        </Section>

        <Section title="2. Data we process">
          <ul className="list-disc space-y-2 pl-5">
            <li>Identity and contact data, such as name, email, phone, company, and country.</li>
            <li>Account and portal data, such as login details, project messages, order status, and support history.</li>
            <li>Billing and payment data, such as buyer type, invoice details, PayPal transaction references, and payment status.</li>
            <li>Project files and instructions, such as plans, photos, references, room notes, and uploaded deliverables.</li>
            <li>Technical data, such as IP address, device, browser, logs, consent choices, and security events.</li>
            <li>Analytics and marketing data, where you have given consent.</li>
          </ul>
        </Section>

        <Section title="3. Purposes and legal bases">
          <ul className="list-disc space-y-2 pl-5">
            <li>To provide estimates, create orders, deliver files, and manage revision rounds - contract performance or pre-contract steps.</li>
            <li>To process payments, invoices, refunds, accounting, and tax records - contract performance and legal obligations.</li>
            <li>To secure accounts, prevent abuse, diagnose errors, and preserve service integrity - legitimate interests.</li>
            <li>To respond to support, complaints, and legal requests - contract performance, legitimate interests, and legal obligations.</li>
            <li>To measure analytics, advertising performance, and session replay - consent where required.</li>
            <li>To send service emails about orders, payments, files, and account access - contract performance or legitimate interests.</li>
          </ul>
        </Section>

        <Section title="4. Processors and recipients">
          <p>
            We use service providers for hosting, database and storage, email,
            analytics, payments, error monitoring, security, AI processing, and
            customer relationship management. These providers process data under
            contract or under their own legal obligations where they act as
            independent controllers, such as payment providers.
          </p>
          <p>
            Current categories include Vercel, Supabase, Auth.js-related
            authentication infrastructure, Resend, PayPal, PostHog, Google
            Analytics and Google Tag Manager, Sentry, OpenAI or other AI
            providers used for AI Studio, antivirus/file scanning providers, and
            Bitrix24.
          </p>
        </Section>

        <Section title="5. International transfers">
          <p>
            Serbia does not currently have a European Commission adequacy
            decision. Because we are established in Serbia and use international
            providers, personal data can be transferred outside the European
            Economic Area.
          </p>
          <p>
            Where GDPR transfer rules apply, we rely on appropriate safeguards
            such as Standard Contractual Clauses, provider data processing
            terms, EU-region hosting where available, transfer impact
            assessments, encryption in transit, access controls, and data
            minimisation.
          </p>
        </Section>

        <Section title="6. Retention">
          <p>
            We keep personal data only as long as needed for the purpose for
            which it was collected, including order delivery, accounting, tax,
            dispute handling, security, and legal obligations. Project files may
            be retained for support, revision, and audit purposes, then deleted
            or archived according to operational retention rules.
          </p>
        </Section>

        <Section title="7. Your GDPR rights">
          <p>
            Depending on the situation, you may have the right to access,
            rectify, erase, restrict, object to processing, receive a copy of
            your data, withdraw consent, and lodge a complaint with a data
            protection authority.
          </p>
          <p>
            To exercise your rights, contact{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            . We may need to verify your identity before acting on a request.
          </p>
        </Section>

        <Section title="8. Cookies and consent">
          <p>
            Optional analytics, marketing, and session recording technologies
            are controlled through consent choices. Details are in the{" "}
            <Link
              href="/legal/cookies"
              className="text-foreground underline-offset-4 hover:underline"
            >
              cookie policy
            </Link>
            .
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We use technical and organisational measures such as access control,
            encrypted transport, role-based permissions, logging, file scanning,
            and incident response procedures. No online system can be guaranteed
            perfectly secure, but we design the service to reduce risk and limit
            access to people and processors who need it.
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
