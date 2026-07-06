/**
 * ResultsProof — concrete visual proof block for the home page.
 * Shows what a buyer can expect before the final CTA: result type, entry
 * price, typical delivery signal, and the next pricing action.
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

const PROOF_ITEMS = [
  {
    title: "An interior ready to sell from the brochure",
    service: "Interior renders",
    price: "from €170",
    timing: "first drafts in 3-5 working days",
    body: "One order covers the whole floor: 10 static interior renders + the floor plan.",
    href: "/pricing?group=interior&add=int-static&from=home-proof#configurator",
    image: "/artwork/expert-interior-renders.webp",
    imageAlt:
      "Interior renders - a furnished interior ready to sell from the brochure",
  },
  {
    title: "An empty room becomes a listing buyers understand",
    service: "Virtual staging",
    price: "from €18",
    timing: "a fast photo upgrade",
    body: "A photo of an empty space gets furniture, style and atmosphere without physically furnishing the property.",
    href: "/pricing?group=staging-renovation&add=vs-static&from=home-proof#configurator",
    before: "/artwork/expert-virtual-staging-hero-before.webp",
    after: "/artwork/expert-virtual-staging-hero-after.webp",
    beforeAlt:
      "Virtual staging - an empty living room before digital staging",
    afterAlt:
      "Virtual staging - a furnished living room ready for a property listing",
  },
  {
    title: "An exterior with a clear budget for extra angles",
    service: "Exterior renders",
    price: "from €250",
    timing: "next angle from €48",
    body: "The first shot covers building the 3D model of the property; every further camera from the same model costs significantly less.",
    href: "/pricing?group=exterior-renders&add=ext-static&from=home-proof#configurator",
    image: "/artwork/expert-exterior-renders.webp",
    imageAlt:
      "Exterior renders - a photorealistic exterior view of a building",
  },
] as const;

export async function ResultsProof() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;

  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              The result before the decision
            </p>
            <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
              Buyers don&apos;t have to imagine. They see the space, the price
              and the next step.
            </h2>
          </div>
          <Link
            href="/pricing#configurator"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-fit rounded-[4px]",
            )}
          >
            Open the calculator
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PROOF_ITEMS.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
            >
              {"before" in item ? (
                <BeforeAfterReveal
                  beforeSrc={item.before}
                  afterSrc={item.after}
                  alt={item.afterAlt}
                  beforeAlt={item.beforeAlt}
                  afterAlt={item.afterAlt}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="aspect-[4/3] w-full bg-secondary"
                >
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#0a0a0a]/55 px-2 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] text-white/95">
                    Before / after
                  </span>
                </BeforeAfterReveal>
              ) : (
                <div className="relative aspect-[4/3] w-full bg-secondary">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-foreground">
                    {item.service}
                  </span>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground">
                    {formatPublicPriceText(
                      item.price,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl leading-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.body}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatPublicPriceText(
                      item.timing,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </span>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.08em] text-foreground hover:underline"
                  >
                    Get your estimate
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
