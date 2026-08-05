import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Legal information",
  description: `Company, privacy, cookie, consumer-rights, delivery, refund, complaints, and certification information for ${SITE.name}.`,
  path: "/legal",
});

const LEGAL_PAGES = [
  {
    href: "/legal/imprint",
    title: "Imprint",
    description: "The service provider, registered company details, contact information, and supervisory authorities.",
  },
  {
    href: "/legal/terms",
    title: "Terms of service",
    description: "The contract terms for estimates, orders, digital deliverables, accounts, payments, and licences.",
  },
  {
    href: "/legal/privacy",
    title: "Privacy policy",
    description: "What personal data we process, why, where it goes, how long it is kept, and your regional rights.",
  },
  {
    href: "/legal/cookies",
    title: "Cookie policy",
    description: "The current inventory of browser storage, analytics, advertising measurement, and replay tools.",
  },
  {
    href: "/legal/withdrawal",
    title: "Withdrawal right",
    description: "EU and EEA consumer withdrawal information, the model notice, and the online withdrawal function.",
  },
  {
    href: "/legal/refunds",
    title: "Refunds policy",
    description: "Refund handling before and after production, payment-provider timing, and mandatory consumer remedies.",
  },
  {
    href: "/legal/complaints",
    title: "Complaints procedure",
    description: "How to make and escalate a complaint and what information helps us resolve it.",
  },
  {
    href: "/legal/delivery",
    title: "Digital delivery",
    description: "Delivery channels, timing, formats, access, and what happens if a delivery is delayed.",
  },
  {
    href: "/legal/certificates",
    title: "Certificates and standards",
    description: "Our ISO 9001, ISO/IEC 27001, and ISO 50001 certifications and verification material.",
  },
] as const;

export default function LegalIndexPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-5xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Legal information
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70">
          Company disclosures, service terms, privacy information, and consumer
          rights for {SITE.name}. Mandatory rights in your country apply even
          when a policy below provides a narrower contractual rule.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {LEGAL_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-xl border border-border/60 bg-secondary/25 p-6 transition-colors hover:border-foreground/25 hover:bg-secondary/45"
            >
              <h2 className="text-2xl text-foreground group-hover:underline group-hover:underline-offset-4">
                {page.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </article>
      <FinalCta />
    </>
  );
}
