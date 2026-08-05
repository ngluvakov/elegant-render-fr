import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";
import { WithdrawalForm } from "./withdrawal-form";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Withdrawal right",
  description: `EU and EEA consumer withdrawal information for ${SITE.name}, including the online withdrawal function and model notice.`,
  path: "/legal/withdrawal",
});

export default function WithdrawalPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Withdrawal right
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated: {formatDate(LAST_UPDATED)}
        </p>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/75">
          This notice explains the statutory right of withdrawal for consumers
          who enter into an eligible distance contract. It does not limit any
          stronger mandatory right in the country whose law applies to you.
        </p>

        <Section title="1. Who has the right">
          <p>
            If you are an EU or EEA consumer and order online for purposes
            mainly outside your trade, business, craft, or profession, you
            generally have 14 days to withdraw from an eligible service contract
            without giving a reason. The period normally starts on the day the
            contract is concluded.
          </p>
          <p>
            Business customers do not have this statutory consumer withdrawal
            right, but can still ask to cancel under the{" "}
            <Link
              href="/legal/refunds"
              className="text-foreground underline-offset-4 hover:underline"
            >
              refunds policy
            </Link>
            . Consumers elsewhere may have a similar or longer local right.
          </p>
        </Section>

        <Section title="2. How the deadline is met">
          <p>
            It is enough to send an unambiguous statement before the applicable
            deadline. You may use the online function or model notice below, or
            email{" "}
            <a
              href={`mailto:${IMPRINT.email}?subject=Withdrawal%20from%20contract`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            . You do not need to explain why you are withdrawing. Keep the
            confirmation or sent email as evidence.
          </p>
        </Section>

        <Section title="3. Starting work during the 14-day period">
          <p>
            Our orders can include a service contract, digital content supplied
            without a physical medium, or both. The legal result depends on what
            was ordered and how performance began.
          </p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Services:</strong> if you expressly ask us to begin during
              the withdrawal period and then withdraw before full performance,
              you may have to pay a proportionate amount for work supplied up to
              the withdrawal notice, where the legal conditions are met. The
              right is lost after the service is fully performed only if the
              required prior express consent and acknowledgement were given.
            </li>
            <li>
              <strong>Digital content:</strong> the right can be lost when supply
              begins only if you gave prior express consent to immediate supply,
              acknowledged the loss of the right, and received the required
              contract confirmation on a durable medium.
            </li>
          </ul>
          <p>
            A checkbox accepting general terms is not, by itself, a substitute
            for any separate express request or acknowledgement required by law.
            If the required information, request, consent, acknowledgement, or
            confirmation was not properly provided, the statutory consequences
            of that omission apply.
          </p>
        </Section>

        <Section title="4. Effects of a valid withdrawal">
          <p>
            When withdrawal is valid, we reimburse amounts due without undue
            delay and no later than the mandatory deadline, normally 14 days
            after we are informed. We use the original payment method unless
            you expressly agree otherwise, and we do not charge a reimbursement
            fee. PayPal or your funding provider controls when the credit appears
            in your balance or statement.
          </p>
          <p>
            A proportionate amount can remain payable for a service properly
            started at your express request before withdrawal. Separate
            statutory remedies for non-conforming or defective digital content
            or services continue to apply and are not replaced by this notice.
          </p>
        </Section>

        <section id="online-withdrawal" className="mt-14 scroll-mt-24 rounded-xl border border-border/60 bg-secondary/25 p-6 md:p-8">
          <h2 className="text-3xl text-foreground">Withdraw from the contract here</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
            This function sends an unambiguous withdrawal statement. First enter
            the contract details, then review and confirm the statement. We
            record the server receipt time and email a durable copy. Submitting
            the form does not ask you to waive any right or give a reason.
          </p>
          <div className="mt-7">
            <WithdrawalForm />
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-border/60 bg-secondary/30 p-6 md:p-8">
          <h2 className="text-2xl text-foreground">Model withdrawal notice</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Complete and send this notice only if you wish to withdraw. The
            online form above is optional; a clear statement by email is also
            valid when sent on time.
          </p>
          <div className="mt-5 space-y-3 rounded-lg bg-background/70 p-5 font-mono text-sm leading-relaxed text-foreground/80">
            <p>To: {IMPRINT.legalName}</p>
            <p>Address: {IMPRINT.street}, {IMPRINT.postalCode} {IMPRINT.city}, {IMPRINT.country}</p>
            <p>Email: {IMPRINT.email}</p>
            <p>
              I hereby give notice that I withdraw from my contract for the
              supply of the following service or digital content:
            </p>
            <p>Contract or order number:</p>
            <p>Ordered on:</p>
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

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
