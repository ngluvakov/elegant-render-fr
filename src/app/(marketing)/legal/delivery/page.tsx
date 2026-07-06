import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-07-06";

export const metadata: Metadata = createPublicMetadata({
  title: "Digital delivery",
  description: `How ${SITE.name} delivers renders, animations, AI Studio files, and other digital project outputs.`,
  path: "/legal/delivery",
});

export default function DeliveryPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Digital delivery
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Last updated:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Delivery format">
          <p>
            {SITE.name} delivers digital content only. There is no physical
            shipping. Deliverables may include static renders, 360 virtual tour
            assets, animations, AI Studio outputs, floor plans, site plans, and
            related project files.
          </p>
        </Section>

        <Section title="2. Where files are delivered">
          <p>
            Finished files are normally delivered through the customer portal
            under the relevant order number. We may also send download links or
            attachments by email when that is more practical for the project.
          </p>
          <p>
            Portal access is available at{" "}
            <Link
              href="/portal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              /portal
            </Link>
            .
          </p>
        </Section>

        <Section title="3. Delivery timing">
          <p>
            Standard timelines are shown on service pages or confirmed in your
            estimate. Production usually starts after payment is complete and we
            have a usable brief, source files, references, and any required
            clarifications.
          </p>
          <p>
            If delivery is delayed because required information is missing, the
            brief changes, a third-party service is unavailable, or a force
            majeure event occurs, we will provide a written update and a
            realistic revised timeline.
          </p>
        </Section>

        <Section title="4. Standard file types">
          <p>
            Static renders are usually supplied as JPG or PNG files, commonly up
            to 4K unless a different output is confirmed. Animations are usually
            supplied as MP4 or MOV. Other formats can be agreed in the order
            notes or estimate where technically available.
          </p>
        </Section>

        <Section title="5. Worldwide access">
          <p>
            Digital delivery is available worldwide, subject to platform,
            payment, sanctions, and export-control restrictions that may apply
            to either party or the payment provider.
          </p>
        </Section>

        <Section title="6. Delivery questions">
          <p>
            Questions about delivery can be sent to{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
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
