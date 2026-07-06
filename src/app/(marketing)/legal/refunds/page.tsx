import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Refunds policy",
  description: `Refund handling for ${SITE.name} digital services, including PayPal refunds, partial refunds, and processing timelines.`,
  path: "/legal/refunds",
});

export default function RefundsPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Refunds policy
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. General approach">
          <p>
            We sell bespoke digital services. Refunds depend on the order
            status, the amount of work already performed, whether deliverables
            were supplied, and whether the issue can reasonably be corrected
            through revision rounds.
          </p>
          <p>
            This policy does not limit mandatory rights you may have as a
            consumer under applicable law.
          </p>
        </Section>

        <Section title="2. Before production starts">
          <p>
            If you request cancellation before production has started and before
            we have committed meaningful project resources, we will normally
            refund the paid amount, less any non-recoverable payment processing
            or third-party costs where allowed by law.
          </p>
        </Section>

        <Section title="3. After production starts">
          <p>
            Once production has started, any refund may be partial. We may
            deduct the value of completed work, time spent, purchased assets,
            third-party processing, and delivered files. Where the problem can
            be corrected within scope, we will usually offer correction or an
            additional revision round before considering a refund.
          </p>
        </Section>

        <Section title="4. After delivery">
          <p>
            After final delivery, refunds are generally available only where the
            deliverable materially fails to match the agreed brief and the issue
            cannot reasonably be corrected. Dissatisfaction caused by a new
            creative direction, changed brief, missing source material, or
            customer-side approval delay is handled as a revision or new
            estimate rather than a full refund.
          </p>
        </Section>

        <Section title="5. PayPal refunds">
          <p>
            PayPal refunds are issued through PayPal to the original funding
            source where possible and in the original transaction currency.
            PayPal, your card issuer, or your bank controls any currency
            conversion, settlement timing, or statement presentation.
          </p>
          <p>
            PayPal balance refunds can appear quickly, often within the same day
            or the next day. Card-funded refunds commonly take 3-5 working days,
            but some issuers may take longer or show the refund on the next
            statement cycle.
          </p>
        </Section>

        <Section title="6. How to request a refund">
          <p>
            Email{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>{" "}
            with your order number, the reason for the request, and any files or
            screenshots that support it. If the request is also a complaint, we
            will handle it under the{" "}
            <Link
              href="/legal/complaints"
              className="text-foreground underline-offset-4 hover:underline"
            >
              complaints procedure
            </Link>
            .
          </p>
        </Section>

        <Section title="7. Withdrawal rights">
          <p>
            EU consumers should also read the{" "}
            <Link
              href="/legal/withdrawal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              withdrawal notice
            </Link>
            , which explains the 14-day withdrawal right and the digital content
            waiver that may apply when you ask us to start immediately.
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
