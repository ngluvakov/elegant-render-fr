import type { Metadata } from "next";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Withdrawal right",
  description: `EU consumer withdrawal information for ${SITE.name}, including the 14-day right, digital content waiver, and model withdrawal form.`,
  path: "/legal/withdrawal",
});

export default function WithdrawalPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Withdrawal right
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. 14-day withdrawal right">
          <p>
            If you are a consumer in the European Union and order at a distance,
            you may have the right to withdraw from the contract within 14 days
            without giving a reason. The withdrawal period usually runs from the
            day the contract is concluded.
          </p>
          <p>
            To exercise the right, you must send a clear statement before the
            withdrawal period expires. You may use the model form below, but you
            do not have to use that exact format.
          </p>
        </Section>

        <Section title="2. Digital content and immediate performance">
          <p>
            Our services are bespoke digital content and digital services. At
            checkout, you may be asked to consent to immediate performance and
            acknowledge that you lose the right of withdrawal once the digital
            content or digital service has been fully supplied, as reflected in
            article 16(m) of Directive 2011/83/EU.
          </p>
          <p>
            If production has started but the service has not been fully
            supplied, mandatory consumer law may allow proportionate payment for
            the work already performed where applicable.
          </p>
        </Section>

        <Section title="3. Effects of withdrawal">
          <p>
            If you validly withdraw before the right is lost or limited, we will
            refund payments received from you using the same payment method
            where possible, unless we agree otherwise. Refund timing follows the
            payment provider and card issuer rules described in the refunds
            policy.
          </p>
        </Section>

        <Section title="4. How to notify us">
          <p>
            Send your withdrawal notice to{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            . Include enough information for us to identify your order.
          </p>
        </Section>

        <section className="mt-12 rounded-xl border border-border/60 bg-secondary/30 p-6">
          <h2 className="text-2xl text-foreground">Model withdrawal form</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Complete and return this form only if you wish to withdraw from the
            contract.
          </p>
          <div className="mt-5 space-y-3 rounded-lg bg-background/70 p-5 font-mono text-sm leading-relaxed text-foreground/80">
            <p>To: {IMPRINT.shortName}</p>
            <p>Email: {IMPRINT.email}</p>
            <p>
              I hereby give notice that I withdraw from my contract for the
              supply of the following service:
            </p>
            <p>Ordered on:</p>
            <p>Order number:</p>
            <p>Consumer name:</p>
            <p>Consumer address:</p>
            <p>Consumer email:</p>
            <p>Date:</p>
          </div>
        </section>
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
