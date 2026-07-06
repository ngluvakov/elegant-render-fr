import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Complaints procedure",
  description: `How to submit a complaint about a ${SITE.name} digital service, what to include, and when to expect a response.`,
  path: "/legal/complaints",
});

export default function ComplaintsPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Complaints procedure
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. When to use this procedure">
          <p>
            Use this procedure if you believe a delivered render, virtual
            staging image, animation, AI Studio output, or other digital
            deliverable does not match the agreed brief, has a production
            defect, or was delivered materially later than the confirmed
            timeline for reasons within our control.
          </p>
          <p>
            Normal revision requests should be made through the project portal.
            A complaint is for issues that cannot be solved through the included
            revision rounds or normal support conversation.
          </p>
        </Section>

        <Section title="2. How to submit a complaint">
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Email{" "}
              <a
                href={`mailto:${IMPRINT.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.email}
              </a>{" "}
              with your order number and the subject line &quot;Complaint&quot;.
            </li>
            <li>
              Describe the issue clearly and identify the affected file,
              service, or revision round.
            </li>
            <li>
              Attach screenshots, marked-up references, or links that show what
              is wrong and what outcome you are asking for.
            </li>
            <li>
              If the issue relates to a PayPal payment, include the PayPal order
              ID or capture ID shown in your receipt if available.
            </li>
          </ol>
        </Section>

        <Section title="3. Response time">
          <p>
            We aim to acknowledge complaints promptly and provide a written
            response within 14 days. If the issue requires technical review,
            supplier information, or a file audit, we may need more time; if so,
            we will explain the reason and give a realistic update.
          </p>
        </Section>

        <Section title="4. Possible outcomes">
          <p>
            If we accept the complaint, we may correct the deliverable, provide
            an additional revision round, offer a partial refund, or refund the
            relevant amount where correction is not reasonable. Refund handling
            follows our{" "}
            <Link
              href="/legal/refunds"
              className="text-foreground underline-offset-4 hover:underline"
            >
              refunds policy
            </Link>
            .
          </p>
          <p>
            If we do not accept the complaint, we will explain our reasoning and
            identify any remaining practical options.
          </p>
        </Section>

        <Section title="5. Escalation">
          <p>
            We prefer to resolve disputes directly. If you are an EU consumer
            and remain dissatisfied, you may contact a consumer authority or
            alternative dispute resolution body in your country of residence.
            We are not generally obliged to participate in a particular
            alternative dispute resolution process unless mandatory law requires
            it or we agree in writing.
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
