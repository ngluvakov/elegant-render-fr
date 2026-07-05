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
    title: "Enterijer spreman za prodaju iz prospekta",
    service: "Unutrašnji renderi",
    price: "od 19.924 RSD",
    timing: "prvi nacrti 3-5 radnih dana",
    body: "Jedna porudžbina pokriva ceo sprat: 10 statičkih rendera enterijera + tlocrt sprata.",
    href: "/pricing?group=enterijer&add=int-static&from=home-proof#configurator",
    image: "/artwork/expert-unutrasnji-renderi.webp",
    imageAlt:
      "Unutrašnji renderi - opremljen enterijer spreman za prodaju iz prospekta",
  },
  {
    title: "Prazna soba postaje oglas koji se lakše razume",
    service: "Virtuelno opremanje",
    price: "od 2.110 RSD",
    timing: "brz upgrade fotografije",
    body: "Fotografija praznog prostora dobija nameštaj, stil i atmosferu bez fizičkog opremanja nekretnine.",
    href: "/pricing?group=opremanje-renovacija&add=vs-static&from=home-proof#configurator",
    before: "/artwork/expert-virtuelno-opremanje-naslovna-before.webp",
    after: "/artwork/expert-virtuelno-opremanje-naslovna-after.webp",
    beforeAlt:
      "Virtuelno opremanje - prazan dnevni boravak pre digitalnog staginga",
    afterAlt:
      "Virtuelno opremanje - opremljen dnevni boravak spreman za oglas nekretnine",
  },
  {
    title: "Eksterijer sa jasnim budžetom za dodatne uglove",
    service: "Spoljašnji renderi",
    price: "od 29.300 RSD",
    timing: "sledeći ugao od 5.626 RSD",
    body: "Prvi kadar pokriva izradu 3D modela objekta, a svaka sledeća kamera iz istog modela je znatno povoljnija.",
    href: "/pricing?group=renderi-eksterijera&add=ext-static&from=home-proof#configurator",
    image: "/artwork/expert-spoljasnji-renderi.webp",
    imageAlt:
      "Spoljašnji renderi - fotorealističan prikaz eksterijera objekta",
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
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Rezultat pre odluke
            </p>
            <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
              Kupac ne mora da zamišlja. Vidi prostor, cenu i sledeći korak.
            </h2>
          </div>
          <Link
            href="/pricing#configurator"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-fit rounded-full",
            )}
          >
            Otvorite kalkulator
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PROOF_ITEMS.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
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
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/55 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-background/95">
                    Pre / posle
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
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">
                    {item.service}
                  </span>
                  <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatPublicPriceText(
                      item.timing,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </span>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Izračunaj
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
