import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Privacy policy",
  description: `How ${SITE.name} collects, uses, shares, protects, and retains personal data, and how people worldwide can exercise their privacy rights.`,
  path: "/legal/privacy",
});

type ProcessingActivity = {
  activity: string;
  data: string;
  purposeAndBasis: string;
  recipients: string;
  retention: string;
};

const PROCESSING_ACTIVITIES: ProcessingActivity[] = [
  {
    activity: "Website, security, and fraud prevention",
    data: "IP address, request time, device and browser details, consent state, security events, error logs, and rate-limit identifiers.",
    purposeAndBasis:
      "Provide and secure the site, prevent abuse, investigate faults, and protect accounts. The basis is performance of the service and our legitimate interests in security and reliability.",
    recipients:
      "Vercel, Sentry, Upstash, Cloudflare Turnstile when enabled, and our authorised technical team.",
    retention:
      "For the shortest period needed to diagnose and secure the service, subject to provider settings and a longer period when an incident, legal claim, or audit requires it.",
  },
  {
    activity: "Inquiries and estimates",
    data: "Name, email, phone, company, country, project brief, budget, deadline, source page, messages, and uploaded plans, photos, or references.",
    purposeAndBasis:
      "Answer inquiries, prepare an estimate, assess source material, and follow up on requested services. The basis is steps at your request before a contract and our legitimate interest in managing genuine inquiries.",
    recipients:
      "Our team, hosting and storage providers, Resend, Bitrix24, Cloudmersive for file scanning, and professional advisers where needed.",
    retention:
      "Until the inquiry is resolved and afterwards for a period reasonably needed for follow-up, record keeping, and possible claims. Unused draft estimates expire after 30 days.",
  },
  {
    activity: "Accounts and authentication",
    data: "Name, email, phone, password hash, authentication tokens, Google account identifiers when Google sign-in is used, account activity, and portal preferences.",
    purposeAndBasis:
      "Create and operate the account, authenticate you, provide portal access, and keep an audit trail. The basis is contract performance and our legitimate interests in account security and accountability.",
    recipients:
      "Our managed database and hosting providers, Auth.js infrastructure, Google when you choose Google sign-in, Resend, and authorised administrators.",
    retention:
      "For the life of the account. After a valid deletion request, data is deleted or anonymised within 30 days unless it must be retained for accounting, security, dispute, or legal reasons.",
  },
  {
    activity: "Orders, billing, payments, and delivery",
    data: "Buyer and billing details, tax or VAT identifiers, order contents, prices, payment status, PayPal order and capture references, payer email and country returned by PayPal, invoices, messages, revisions, and deliverables.",
    purposeAndBasis:
      "Form and perform the contract, collect payment, issue invoices, deliver work, manage revisions and refunds, and comply with accounting, tax, sanctions, and legal duties.",
    recipients:
      "Our team, PayPal, Resend, Bitrix24, Plutos when invoice sync is enabled, accountants, auditors, banks, advisers, and competent authorities where required.",
    retention:
      "Operational records are kept for the contract and support period. Invoices, payment evidence, and related accounting records may be kept for up to 10 years, or longer where applicable law or a live claim requires it.",
  },
  {
    activity: "Project files and AI Studio",
    data: "Plans, photographs, images, prompts, masks, reference images, configuration choices, generated outputs, file metadata, and provider response identifiers.",
    purposeAndBasis:
      "Create the requested render or image edit, scan files for malware, provide download history, support revisions, and troubleshoot failed generations. The basis is contract performance and our legitimate interests in service security and quality.",
    recipients:
      "Supabase storage, Cloudmersive, OpenAI and Google Gemini depending on the AI engine selected, and authorised production staff.",
    retention:
      "AI Studio input and output files are available for 30 days. Other project files are kept for delivery, agreed revisions, support, and any necessary legal record, then deleted or archived under access controls.",
  },
  {
    activity: "Analytics, advertising measurement, and session replay",
    data: "Page views, clicks, navigation, device information, account or pseudonymous identifiers, campaign data, and masked interaction recordings. Advertising click identifiers may be processed when the corresponding tool is enabled.",
    purposeAndBasis:
      "Measure and improve the service, diagnose difficult flows, attribute campaigns, and measure advertising. Optional browser analytics, advertising, and replay use consent where required. Limited server-side service events and aggregate, cookieless performance measurements may rely on legitimate interests where permitted.",
    recipients:
      "Vercel Web Analytics and Speed Insights, PostHog, Google Analytics and Tag Manager, Sentry, and advertising providers enabled in our tag configuration.",
    retention:
      "According to the consent category and provider configuration described in the cookie policy. You can withdraw optional consent at any time.",
  },
  {
    activity: "Support, complaints, withdrawal, and privacy requests",
    data: "Contact details, order number, request content, identity evidence where necessary, correspondence, timestamps, and the outcome of the request.",
    purposeAndBasis:
      "Respond, verify the requester, keep evidence of the request and our response, and establish or defend legal claims. The basis is contract performance, legal obligations, and legitimate interests in accountable dispute handling.",
    recipients:
      "Our authorised team, email and hosting providers, legal advisers, insurers, payment providers, and regulators or courts where required.",
    retention:
      "For the time needed to complete the request and for the applicable complaint or limitation period. Evidence of a contract withdrawal may be retained with the order record.",
  },
];

export default function PrivacyPolicyPage() {
  const euRepresentative = IMPRINT.euRepresentative;

  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Privacy policy
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated: {formatDate(LAST_UPDATED)}
        </p>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/75">
          This policy explains how {IMPRINT.shortName}, the operator of{" "}
          {SITE.name}, handles personal data when you visit the site, contact
          us, request an estimate, place an order, use the portal or AI Studio,
          or exercise a legal right. It is intended for an international
          audience and applies alongside any mandatory privacy law in your
          location.
        </p>

        <Section title="1. Who is responsible for your data">
          <p>
            The controller is {IMPRINT.legalName}, {IMPRINT.street},{" "}
            {IMPRINT.postalCode} {IMPRINT.city}, {IMPRINT.country}. Company
            number: {IMPRINT.registryNumber}. Tax ID: {IMPRINT.taxId}.
          </p>
          <p>
            Privacy questions and requests can be sent to{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            . This is our privacy contact; we have not appointed a data
            protection officer because our present processing does not require
            one.
          </p>
          {euRepresentative && (
            <p>
              Our representative in the European Union for GDPR article 27 is{" "}
              {euRepresentative.name}, {euRepresentative.address}. Contact:{" "}
              <a
                href={`mailto:${euRepresentative.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {euRepresentative.email}
              </a>
              .
            </p>
          )}
        </Section>

        <Section title="2. Where data comes from">
          <p>We receive personal data:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>directly from you in forms, checkout, the portal, uploads, email, and support messages;</li>
            <li>automatically from your browser, device, and our security and analytics tools;</li>
            <li>from services you choose, including Google sign-in and PayPal;</li>
            <li>from a customer, colleague, architect, agent, or company that includes you in a project; and</li>
            <li>from public or official sources used to verify company, tax, VAT, sanctions, or payment information.</li>
          </ul>
          <p>
            If we receive your data from someone else, we provide this notice
            at the first appropriate contact or within the period required by
            applicable law, unless an exception applies.
          </p>
        </Section>

        <Section title="3. What we process, why, and for how long">
          <p>
            The entries below connect each activity with its data, purpose,
            legal basis, recipients, and retention rule. More than one legal
            basis can apply when an activity serves distinct purposes.
          </p>
          <div className="mt-6 space-y-5">
            {PROCESSING_ACTIVITIES.map((entry) => (
              <ProcessingCard key={entry.activity} entry={entry} />
            ))}
          </div>
        </Section>

        <Section title="4. When information is required">
          <p>
            Identity, contact, billing, order, payment, and usable project
            information marked as required are necessary to enter into or
            perform a contract. If you do not provide them, we may be unable to
            prepare an estimate, accept payment, create an invoice, or deliver
            the service. Optional fields, optional cookies, and marketing
            choices can be refused without losing access to the core service.
          </p>
        </Section>

        <Section title="5. Project files and information about other people">
          <p>
            Plans, photographs, property files, and correspondence can contain
            personal data about occupants, owners, employees, or other people.
            Please share only what the project needs, remove unnecessary
            personal details, and make sure you have authority to provide the
            material. Unless it is essential and agreed with us first, do not
            upload identity documents, financial credentials, medical data, or
            other sensitive information.
          </p>
          <p>
            We do not use private customer project files to train our own
            general-purpose AI models. When you choose an AI Studio engine, the
            selected inputs and prompt are sent to that provider to produce the
            requested result under the provider terms and business settings in
            force for our account.
          </p>
        </Section>

        <Section title="6. Sharing and independent controllers">
          <p>
            We disclose personal data only as needed for the purposes above: to
            contracted service providers, authorised staff and production
            partners, accountants and professional advisers, payment and
            identity providers, and public authorities where law requires it.
            Providers that process data for us must be bound by appropriate
            confidentiality, security, and data-protection terms.
          </p>
          <p>
            PayPal, Google sign-in, advertising networks, tax authorities, and
            some professional advisers may act as independent controllers for
            their own purposes. Their privacy notices apply to that separate
            processing. If the business is reorganised, financed, sold, or
            merged, relevant data may be disclosed under confidentiality and
            transferred with the affected business, subject to applicable law.
          </p>
        </Section>

        <Section title="7. International data transfers">
          <p>
            We are established in Serbia and use providers in Serbia, the
            European Economic Area, the United Kingdom, the United States, and
            other countries. Your data may therefore be processed outside your
            country. Serbia is not currently covered by an EU adequacy decision.
          </p>
          <p>
            Where EEA, UK, Swiss, Serbian, or other transfer rules require a
            mechanism, we use the mechanism appropriate to the transfer, such
            as an adequacy decision, approved Standard Contractual Clauses,
            contractual safeguards, and supplementary technical or
            organisational measures. You can ask our privacy contact for
            information about the safeguard relevant to your data.
          </p>
        </Section>

        <Section title="8. Cookies and tracking choices">
          <p>
            Necessary storage supports sign-in, security, checkout, and your
            privacy choices. Optional browser analytics, marketing measurement,
            and session replay are disabled until the relevant consent is given
            where consent is required. See the{" "}
            <Link
              href="/legal/cookies"
              className="text-foreground underline-offset-4 hover:underline"
            >
              cookie policy
            </Link>{" "}
            or open <ConsentSettingsLink className="underline-offset-4 hover:underline" />.
          </p>
          <p>
            We do not sell personal information for money. Optional disclosures
            to advertising providers can be treated as “sharing”, targeted
            advertising, or cross-context behavioural advertising under some
            US privacy laws. You can opt out by keeping the Marketing category
            off or withdrawing it in cookie settings.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We use access controls, role-based permissions, encrypted
            transport, password hashing, malware scanning, logging, backups,
            supplier controls, and incident procedures designed to protect data.
            Our management systems include ISO/IEC 27001:2022 certification.
            No online system is risk-free, so please use a strong password and
            contact us promptly if you suspect unauthorised account access.
          </p>
        </Section>

        <Section title="10. Your privacy rights">
          <p>
            Depending on your location and the processing, you may have rights
            to know or access data, receive a copy, correct it, delete it,
            restrict or object to processing, portability, withdraw consent,
            opt out of sale, sharing, or targeted advertising, limit certain
            sensitive-data uses, appeal a refusal, and complain to a regulator.
            These rights are not absolute; for example, we can retain invoice
            data that law requires us to keep.
          </p>
          <p>
            Email{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}?subject=Privacy%20request`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>{" "}
            with “Privacy request” in the subject. Account holders can also
            export account data or request deletion from the portal profile. We
            may verify your identity, authority, and jurisdiction before acting.
            You may use an authorised agent where the law permits it. We do not
            discriminate against anyone for exercising a privacy right.
          </p>
        </Section>

        <Section title="11. Regional information">
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Serbia:</strong> rights arise under the Serbian Law on
              Personal Data Protection. You may complain to the{" "}
              <ExternalLink href="https://www.poverenik.rs/en/">
                Commissioner for Information of Public Importance and Personal
                Data Protection
              </ExternalLink>
              .
            </li>
            <li>
              <strong>EEA:</strong> the GDPR rights described above apply when
              the GDPR covers our processing. You may complain to the authority
              where you live, work, or believe an infringement occurred. The{" "}
              <ExternalLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">
                EDPB lists national supervisory authorities
              </ExternalLink>
              .
            </li>
            <li>
              <strong>United Kingdom:</strong> UK GDPR rights apply when UK law
              covers our processing. Complaints can be made to the{" "}
              <ExternalLink href="https://ico.org.uk/make-a-complaint/data-protection-complaints/">
                Information Commissioner&apos;s Office
              </ExternalLink>
              .
            </li>
            <li>
              <strong>United States:</strong> residents of states with
              comprehensive privacy laws may make the access, correction,
              deletion, portability, opt-out, limitation, or appeal requests
              provided by their law. Our privacy contact is the designated
              request method. We do not knowingly sell or share data of people
              under 16.
            </li>
            <li>
              <strong>Other regions:</strong> if privacy law in your country
              gives you an additional right, contact us and identify your
              country. We will apply the right where that law governs our
              processing.
            </li>
          </ul>
        </Section>

        <Section title="12. Children">
          <p>
            The service is intended for adults and business users, not children.
            We do not knowingly create accounts for or collect data directly
            from anyone under 16. A parent or guardian who believes a child has
            provided data should contact us so we can investigate and delete it
            where appropriate.
          </p>
        </Section>

        <Section title="13. Automated processing">
          <p>
            AI tools generate images from the instructions and files you choose,
            and security tools can flag suspicious requests or files. We do not
            make decisions based solely on automated processing that produce
            legal or similarly significant effects for you. PayPal and other
            independent providers may make their own fraud, identity, or payment
            decisions under their notices.
          </p>
        </Section>

        <Section title="14. Changes to this policy">
          <p>
            We update this policy when our services, providers, or legal duties
            change. The date at the top shows the latest revision. If a change
            materially affects how we use existing data, we will provide a
            prominent notice or contact affected users where required.
          </p>
        </Section>
      </article>
      <FinalCta />
    </>
  );
}

function ProcessingCard({ entry }: { entry: ProcessingActivity }) {
  return (
    <section className="rounded-xl border border-border/60 bg-secondary/25 p-6">
      <h3 className="text-xl text-foreground">{entry.activity}</h3>
      <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-[150px_1fr]">
        <dt className="font-semibold text-foreground/80">Data</dt>
        <dd>{entry.data}</dd>
        <dt className="font-semibold text-foreground/80">Purpose and basis</dt>
        <dd>{entry.purposeAndBasis}</dd>
        <dt className="font-semibold text-foreground/80">Recipients</dt>
        <dd>{entry.recipients}</dd>
        <dt className="font-semibold text-foreground/80">Retention</dt>
        <dd>{entry.retention}</dd>
      </dl>
    </section>
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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </a>
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
