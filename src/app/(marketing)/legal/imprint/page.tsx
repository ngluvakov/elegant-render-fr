import type { Metadata } from "next";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Imprint",
  description: `Legal information for ${SITE.name} and White Rook DOO, including company registration, contact, and data protection details.`,
  path: "/legal/imprint",
});

const companyAddress = `${IMPRINT.street}, ${IMPRINT.postalCode} ${IMPRINT.city}, Serbia`;

export default function ImprintPage() {
  const euRepresentative = IMPRINT.euRepresentative;

  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Imprint
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
          This page identifies the company responsible for {SITE.name}. It is
          provided for transparency and for the information duties that apply to
          an online service offered to customers in the European market.
        </p>

        <dl className="mt-12 grid gap-x-8 gap-y-5 rounded-xl border border-border/60 bg-secondary/30 p-8 sm:grid-cols-[200px_1fr]">
          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Service provider
          </dt>
          <dd className="text-base leading-relaxed text-foreground">
            {IMPRINT.legalName}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Trading name
          </dt>
          <dd className="text-base text-foreground">{IMPRINT.shortName}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Registered office
          </dt>
          <dd className="text-base text-foreground">{companyAddress}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Company number
          </dt>
          <dd className="font-mono text-base text-foreground">
            {IMPRINT.registryNumber}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tax ID
          </dt>
          <dd className="font-mono text-base text-foreground">{IMPRINT.taxId}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Activity code
          </dt>
          <dd className="text-base text-foreground">
            {IMPRINT.activityCode} - specialised design activities
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Incorporated
          </dt>
          <dd className="text-base text-foreground">
            {new Date(IMPRINT.foundedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            General contact
          </dt>
          <dd className="text-base">
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Data protection
          </dt>
          <dd className="text-base">
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
          </dd>
        </dl>

        <Section title="EU representative">
          {euRepresentative ? (
            <p>
              Our representative in the European Union for GDPR article 27
              purposes is {euRepresentative.name}, {euRepresentative.address}. You
              can contact the representative at{" "}
              <a
                href={`mailto:${euRepresentative.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {euRepresentative.email}
              </a>
              .
            </p>
          ) : (
            <p>
              {IMPRINT.shortName} is established in Serbia and offers services
              to customers in the European Union. Appointment of an EU
              representative under GDPR article 27 is pending and must be
              completed before public launch. Until the representative is named,
              EU data protection requests can be sent to{" "}
              <a
                href={`mailto:${IMPRINT.privacyEmail}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.privacyEmail}
              </a>
              .
            </p>
          )}
        </Section>

        <Section title="Public registers and supervisory authorities">
          <p>
            {IMPRINT.shortName} is registered with the Serbian Business Registers
            Agency. Public company data can be checked by searching the company
            number on{" "}
            <a
              href={`https://pretraga2.apr.gov.rs/unifiedentitysearch/Search/Details/${IMPRINT.registryNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              the agency register
            </a>
            .
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Serbian Business Registers Agency - company registration.</li>
            <li>
              Commissioner for Information of Public Importance and Personal
              Data Protection - Serbian data protection authority.
            </li>
            <li>
              EU residents may also contact the data protection authority in the
              member state where they live, work, or believe an issue occurred.
            </li>
          </ul>
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
    <section className="mt-16">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}
