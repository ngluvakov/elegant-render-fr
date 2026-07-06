import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Terms of service",
  description: `Terms for ordering architectural renders, virtual staging, day-to-dusk, photomontage, AI Studio, and related digital services from ${SITE.name}.`,
  path: "/legal/terms",
});

export default function TermsPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Terms of service
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
          These terms apply when you use {SITE.name} or order digital services
          from {IMPRINT.shortName}. They are written for international customers
          and should be read together with our privacy, refunds, withdrawal,
          complaints, delivery, and cookie notices.
        </p>

        <Section title="1. Service provider">
          <p>
            {SITE.name} is operated by {IMPRINT.legalName}, trading as{" "}
            {IMPRINT.shortName}, registered at {IMPRINT.street},{" "}
            {IMPRINT.postalCode} {IMPRINT.city}, Serbia. The company number is{" "}
            {IMPRINT.registryNumber} and the tax ID is {IMPRINT.taxId}.
          </p>
          <p>
            You can contact us at{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Services">
          <p>
            We create bespoke digital deliverables, including interior and
            exterior renders, 360 virtual tours, architectural animations, 2D
            and 3D floor plans, site plans, virtual staging, virtual renovation,
            day-to-dusk edits, photomontage, item removal, and AI Studio image
            processing.
          </p>
          <p>
            Each order is based on the selected service, the details you submit,
            the files you upload, and any written instructions confirmed in the
            checkout, portal, or email conversation.
          </p>
        </Section>

        <Section title="3. Ordering and account access">
          <p>
            You place an order through the checkout or through a manual estimate
            that we confirm in writing. We may create or use a portal account so
            you can upload files, follow progress, request revision rounds, and
            download deliverables.
          </p>
          <p>
            You are responsible for providing accurate contact, billing, and
            project information. If files, dimensions, access details, or
            references are missing, deadlines can move until the missing
            information is supplied.
          </p>
        </Section>

        <Section title="4. Prices and payment">
          <p>
            Public prices are displayed for guidance and may be shown in the
            visitor&apos;s local currency. Invoices are issued in EUR unless a
            different written arrangement is agreed. PayPal may show and process
            the transaction in the currency presented at checkout.
          </p>
          <p>
            Payment is due before production starts unless we agree otherwise in
            writing. PayPal payments are subject to PayPal&apos;s own terms, fraud
            checks, funding-source rules, and processing status.
          </p>
        </Section>

        <Section title="5. Customer materials and rights">
          <p>
            You confirm that you have the right to provide all plans, photos,
            models, references, logos, text, and other materials you upload or
            send to us. You remain responsible for third-party rights in those
            materials.
          </p>
          <p>
            You grant us the limited rights needed to review, process, store,
            transform, and deliver the materials for your project and related
            support. We do not claim ownership of your original files.
          </p>
        </Section>

        <Section title="6. Delivery and revision rounds">
          <p>
            Delivery is digital only. Typical timelines are listed on service
            pages or confirmed in your estimate. Timelines begin when payment is
            complete and the project brief is usable.
          </p>
          <p>
            Included revision rounds cover reasonable adjustments within the
            agreed scope. New rooms, new viewpoints, new design directions,
            missing source material, or a different service may require a new
            estimate.
          </p>
          <p>
            See the{" "}
            <Link
              href="/legal/delivery"
              className="text-foreground underline-offset-4 hover:underline"
            >
              delivery notice
            </Link>{" "}
            for more detail.
          </p>
        </Section>

        <Section title="7. Withdrawal right for consumers">
          <p>
            EU consumers may have a 14-day right of withdrawal for distance
            contracts. Because our work is custom digital content and digital
            services, checkout may ask you to consent to immediate performance
            and acknowledge that the right of withdrawal can be lost once the
            digital content or service has been fully supplied.
          </p>
          <p>
            The detailed notice and model form are available on the{" "}
            <Link
              href="/legal/withdrawal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              withdrawal page
            </Link>
            .
          </p>
        </Section>

        <Section title="8. Refunds and complaints">
          <p>
            Refund handling depends on project status, delivered work, and the
            reason for the request. PayPal refunds are returned through PayPal
            to the original funding source where possible.
          </p>
          <p>
            See our{" "}
            <Link
              href="/legal/refunds"
              className="text-foreground underline-offset-4 hover:underline"
            >
              refunds policy
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/complaints"
              className="text-foreground underline-offset-4 hover:underline"
            >
              complaints procedure
            </Link>
            .
          </p>
        </Section>

        <Section title="9. Acceptable use">
          <p>
            You must not use the service to request unlawful, misleading,
            infringing, abusive, or discriminatory content. We may refuse or
            stop work where a project would violate law, platform rules,
            third-party rights, or our production standards.
          </p>
        </Section>

        <Section title="10. Intellectual property in deliverables">
          <p>
            After full payment, you may use the final deliverables for the
            project purpose described in the order, including property marketing,
            presentations, listings, websites, and investor materials, unless a
            narrower licence is agreed in writing.
          </p>
          <p>
            Working files, production scenes, prompts, intermediate drafts,
            internal methods, and reusable assets remain our production
            materials unless expressly transferred in writing.
          </p>
        </Section>

        <Section title="11. Liability">
          <p>
            Our deliverables are visual communication assets. They are not
            architectural plans, engineering documentation, building permits,
            safety instructions, or a substitute for professional technical
            advice.
          </p>
          <p>
            We are responsible for providing the ordered digital service with
            reasonable care and skill. To the fullest extent allowed by law, we
            are not liable for indirect loss, lost profit, lost opportunity, or
            decisions made from materials that were supplied to us incorrectly
            or incompletely.
          </p>
        </Section>

        <Section title="12. Governing law and consumer protections">
          <p>
            These terms are governed by the law of Serbia. If you are a consumer
            habitually resident in the European Union, this choice of law does
            not deprive you of mandatory consumer protections that cannot be
            contractually waived under the law of your country of residence, in
            line with article 6 of Regulation (EC) No 593/2008 (Rome I).
          </p>
        </Section>

        <Section title="13. Alternative dispute resolution">
          <p>
            We prefer to resolve complaints directly and in writing. If a
            dispute cannot be resolved, EU consumers may contact a competent
            consumer authority or alternative dispute resolution body in their
            country of residence. We are not generally obliged to participate in
            a particular alternative dispute resolution procedure unless
            mandatory law requires it or we agree in writing.
          </p>
          <p>
            The European Commission&apos;s online dispute resolution platform was
            closed on 20 July 2025, so we do not link to it or use it for new
            complaints.
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
