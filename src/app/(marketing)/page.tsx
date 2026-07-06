import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/marketing/before-after-slider";
import { FaqCards } from "@/components/marketing/faq-cards";
import { ModelFirst } from "@/components/marketing/model-first";
import { PlatformPrinciples } from "@/components/marketing/platform-principles";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildHomeJsonLd, createPublicMetadata, SEO } from "@/lib/seo";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { FAQ_ITEMS } from "@/lib/content/site";

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

/* Shared CTA styles per the handoff: 52px, radius 4px, green primary
   (#06120C text), 200ms standard-curve transitions, no shadows. */
const CTA_PRIMARY =
  "inline-flex h-[52px] items-center rounded-[4px] bg-accent px-7 text-base font-medium text-accent-foreground transition-colors duration-200 hover:bg-[#00c77e] active:bg-[#00b372]";
const CTA_SECONDARY_DARK =
  "inline-flex h-[52px] items-center rounded-[4px] border border-white/55 px-7 text-base font-medium text-white transition-colors duration-200 hover:border-white";
const CTA_SECONDARY_LIGHT =
  "inline-flex h-[52px] items-center rounded-[4px] border border-[#111111] px-7 text-base font-medium text-foreground transition-colors duration-200 hover:bg-secondary";

export default async function Home() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;
  const price = (text: string) =>
    formatPublicPriceText(text, displayCurrency, pricingSettings);
  const formattedFaqs = FAQ_ITEMS.map((item) => ({
    ...item,
    answer: price(item.answer),
  }));

  return (
    <>
      <JsonLd data={buildHomeJsonLd(formattedFaqs)} />
      <Hero />
      <SpecStrip price={price} />
      <IntentColumns />
      <BeforeAfterSection />
      <ModelFirst />
      <ServicesSection price={price} />
      <PlatformPrinciples />
      <IsoStrip />
      <FaqCards />
      <ClosingCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative h-[560px] overflow-hidden bg-[#0a0a0a] md:h-[680px]">
      <Image
        src="/artwork/detail-interior-static.webp"
        alt="Photorealistic interior render of a furnished living room"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-[0.92]"
      />
      {/* Protection gradient — never a flat wash (handoff spec). */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.72)_0%,rgba(10,10,10,0.25)_45%,rgba(10,10,10,0)_70%)]"
      />
      <div className="relative mx-auto flex h-full w-full max-w-[1280px] flex-col justify-end px-6 pb-12 sm:px-12 md:pb-[72px]">
        <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">
          Architectural visualization · delivered across Europe
        </p>
        <h1 className="mb-5 max-w-[820px] text-pretty text-4xl font-medium leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl md:text-6xl lg:text-[68px]">
          See your space before you decide.
        </h1>
        <p className="mb-9 max-w-[620px] text-base leading-normal text-white/80 md:text-[19px]">
          Hand-crafted renders, virtual staging and visual makeovers for homes
          and properties — with prices you can see up front. A beautiful
          image, a clear price, an easier decision.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className={CTA_PRIMARY}>
            See prices
          </Link>
          <Link href="/portfolio" className={CTA_SECONDARY_DARK}>
            View our work
          </Link>
        </div>
      </div>
    </section>
  );
}

function SpecStrip({ price }: { price: (text: string) => string }) {
  const specs = [
    "First drafts in 3–5 working days",
    "3 revision rounds included",
    price("Interiors from €169"),
    "TÜV Rheinland certified",
  ];
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-x-6 gap-y-2 px-6 py-5 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground tabular-nums sm:px-12">
        {specs.map((spec) => (
          <span key={spec}>{spec}</span>
        ))}
      </div>
    </div>
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

function IntentColumns() {
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

function BeforeAfterSection() {
  return (
    <section id="work" className="border-y border-border bg-secondary">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16 sm:px-12 md:py-24">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-[640px]">
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Virtual staging
            </p>
            <h2 className="text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.02em] text-foreground md:text-[44px]">
              The same room, ready to sell.
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
            Move your cursor across the image to compare. Every piece of
            furniture and light is placed by hand — no generic automated
            output.
          </p>
        </div>
        <BeforeAfterSlider
          beforeSrc="/artwork/ai-tool-virtual_staging-before.webp"
          afterSrc="/artwork/ai-tool-virtual_staging-after.webp"
          alt="virtual staging of an empty living room"
          beforeAlt="Before: empty room"
          afterAlt="After: staged room"
          sizes="(max-width: 1280px) 100vw, 1184px"
          className="aspect-video w-full"
        />
      </div>
    </section>
  );
}

const SERVICE_CARDS = [
  {
    title: "Interior renders",
    text: "Fully furnished, warm, realistic rooms — spaces you could live in.",
    priceLabel: "From €169",
    href: "/services/interior-renders",
    image: "/artwork/pricing-card-interior.webp",
    imageAlt: "Interior render of a furnished room",
  },
  {
    title: "Exterior renders",
    text: "Houses, buildings and complexes, with the full 3D model included.",
    priceLabel: "From €249",
    href: "/services/exterior-renders",
    image: "/artwork/pricing-card-exterior.webp",
    imageAlt: "Exterior render of a residential building",
  },
  {
    title: "Floor plans & site plans",
    text: "Clear 2D and 3D layouts that make a listing easy to understand.",
    priceLabel: "2D & 3D options",
    href: "/services/2d-3d-floor-plans",
    image: "/artwork/pricing-card-plans.webp",
    imageAlt: "2D and 3D floor plans of an apartment",
  },
  {
    title: "360° virtual tours",
    text: "Interactive, VR-ready walkthroughs of a full floor.",
    priceLabel: "From €294",
    href: "/services/interior-360-tour",
    image: "/artwork/detail-exterior-360.webp",
    imageAlt: "360 degree virtual tour preview",
  },
] as const;

function ServicesSection({ price }: { price: (text: string) => string }) {
  return (
    <section id="services" className="border-t border-border bg-secondary">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16 sm:px-12 md:py-24">
        <div className="mb-12 max-w-[720px]">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Services
          </p>
          <h2 className="text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.02em] text-foreground md:text-[44px]">
            Everything comes straight from the official price list.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="block overflow-hidden rounded-[4px] border border-border bg-card transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-[#0a0a0a]">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 296px"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="mb-1.5 text-[17px] font-medium text-foreground">
                  {card.title}
                </h3>
                <p className="mb-3.5 text-sm leading-normal text-muted-foreground">
                  {card.text}
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-foreground tabular-nums">
                  {price(card.priceLabel)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function IsoStrip() {
  const badges = ["ISO 9001:2015", "ISO/IEC 27001:2022", "ISO 50001:2018"];
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-6 px-6 py-10 sm:px-12 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Certified by TÜV Rheinland — audited annually, not self-declared.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {badges.map((badge) => (
            <Link
              key={badge}
              href="/legal/certificates"
              className="rounded-full border border-[#d4d4d4] px-3.5 py-1.5 font-mono text-xs tracking-[0.04em] text-foreground transition-colors duration-200 hover:border-[#111111]"
            >
              {badge}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section id="contact" className="bg-background">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20 text-center sm:px-12 md:py-32">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Ready when you are
        </p>
        <h2 className="mx-auto mb-5 max-w-[760px] text-pretty text-4xl font-medium leading-[1.08] tracking-[-0.025em] text-foreground md:text-[52px]">
          Send us your space. We&apos;ll send back a price — not a sales call.
        </h2>
        <p className="mx-auto mb-9 max-w-[560px] text-base leading-relaxed text-muted-foreground">
          Floor plans, photos, or just a sketch and a goal. You&apos;ll get a
          precise quote and a timeline before any work starts.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <QuickInquiryLink
            className={CTA_PRIMARY}
            inquiry={{
              source: "home-closing-cta",
              sourceLabel: "Homepage closing CTA",
            }}
          >
            Send your space
          </QuickInquiryLink>
          <Link href="/pricing" className={CTA_SECONDARY_LIGHT}>
            See prices first
          </Link>
        </div>
      </div>
    </section>
  );
}
