import type { Metadata } from "next";
import Link from "next/link";
import { QuickOrderHero } from "@/components/marketing/quick-order-hero";
import { ResultsProof } from "@/components/marketing/results-proof";
import { PlatformPrinciples } from "@/components/marketing/platform-principles";
import { ModelFirst } from "@/components/marketing/model-first";
import { IsoStrip } from "@/components/marketing/iso-strip";
import { NextIteration } from "@/components/marketing/next-iteration";
import { FaqCards } from "@/components/marketing/faq-cards";
import { MarketingServicesShowcase } from "@/components/marketing/marketing-services-showcase";
import { JsonLd } from "@/components/seo/json-ld";
import { buildHomeJsonLd, createPublicMetadata, SEO } from "@/lib/seo";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { FAQ_ITEMS } from "@/lib/content/site";

/*
 * Homepage — section order mirrors elegantrender.rs 1:1 (owner's binding
 * requirement: same structure, new design language) plus the IsoStrip
 * kept from the international redesign. See docs/platform-decisions.md
 * ("Homepage restored to .rs layout parity") and
 * docs/design-handoff/DEVIATIONS.md.
 */

export const metadata: Metadata = createPublicMetadata({
  title: "Architectural visualization",
  description: SEO.defaultDescription,
  twitterDescription: SEO.twitterDescription,
  path: "/",
  keywords: [
    "architectural visualization Europe",
    "photorealistic 3D renders",
    "virtual staging for real estate",
  ],
});

export default async function Home() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const formattedFaqs = FAQ_ITEMS.map((item) => ({
    ...item,
    answer: formatPublicPriceText(
      item.answer,
      displayCurrency,
      pricingCatalog.settings,
    ),
  }));

  return (
    <>
      <JsonLd data={buildHomeJsonLd(formattedFaqs)} />
      <QuickOrderHero />
      <SearchIntentSection />
      <ResultsProof />
      <PlatformPrinciples />
      <ModelFirst />
      <IsoStrip />
      <NextIteration />
      <FaqCards />
      <MarketingServicesShowcase />
    </>
  );
}

const INTENT_COLUMNS = [
  {
    title: "Architectural visualization",
    text: "Realistic interior and exterior renders. The base price covers building the 3D model — every additional angle or room costs significantly less.",
    href: "/pricing?group=interior#configurator",
  },
  {
    title: "Virtual staging & renovation",
    text: "Transform empty or dated spaces from photographs. The first image covers the design; each further image of the same room saves you up to 33%.",
    href: "/pricing?group=staging-renovation#configurator",
  },
  {
    title: "Interactive plans & tours",
    text: "From clear 2D/3D floor plans to immersive 360° tours. Order several outputs from the same model and the discounts apply to the whole project.",
    href: "/pricing?group=plans#configurator",
  },
] as const;

/** Search-intent columns — the .rs SearchIntentSection with the approved
 * English copy, styled per the White Rook tokens. */
function SearchIntentSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-6 py-16 sm:px-12 md:grid-cols-3 md:py-24">
        {INTENT_COLUMNS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group block border-t border-[#d4d4d4] pt-6"
          >
            <h2 className="mb-3 text-[22px] font-medium tracking-[-0.01em] text-foreground">
              {item.title}
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
              {item.text}
            </p>
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-foreground group-hover:underline">
              See pricing →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
