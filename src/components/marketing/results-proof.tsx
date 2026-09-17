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
    title: "Un intérieur qui se vend dès la brochure",
    service: "Rendus d’intérieur",
    price: "dès €170",
    timing: "premières ébauches sous 3-5 jours ouvrés",
    body: "Une seule commande couvre tout l’étage : 10 rendus d’intérieur statiques + le plan.",
    href: "/tarifs?group=interior&add=int-static&from=home-proof#configurator",
    image: "/artwork/expert-interior-renders.webp",
    imageAlt:
      "Rendus d’intérieur - un intérieur meublé qui se vend dès la brochure",
  },
  {
    title: "Une pièce vide devient une annonce que les acheteurs comprennent",
    service: "Home staging virtuel",
    price: "dès €18",
    timing: "une valorisation photo rapide",
    body: "Une photo d’un espace vide reçoit mobilier, style et atmosphère — sans meubler physiquement le bien.",
    href: "/tarifs?group=staging-renovation&add=vs-static&from=home-proof#configurator",
    before: "/artwork/expert-virtual-staging-hero-before.webp",
    after: "/artwork/expert-virtual-staging-hero-after.webp",
    beforeAlt:
      "Home staging virtuel - un salon vide avant le staging numérique",
    afterAlt:
      "Home staging virtuel - un salon meublé prêt pour l’annonce immobilière",
  },
  {
    title: "Un extérieur avec un budget clair pour les angles supplémentaires",
    service: "Rendus d’extérieur",
    price: "dès €250",
    timing: "angle suivant dès €48",
    body: "La première vue couvre la construction du modèle 3D du bien ; chaque caméra supplémentaire issue du même modèle coûte nettement moins.",
    href: "/tarifs?group=exterior-renders&add=ext-static&from=home-proof#configurator",
    image: "/artwork/expert-exterior-renders.webp",
    imageAlt:
      "Rendus d’extérieur - une vue extérieure photoréaliste d’un bâtiment",
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
              Le résultat avant la décision
            </p>
            <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
              Les acheteurs n’ont pas à imaginer. Ils voient l’espace, le prix
              et la prochaine étape.
            </h2>
          </div>
          <Link
            href="/tarifs#configurator"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-fit rounded-[4px]",
            )}
          >
            Ouvrir le calculateur
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
                  autoDemoIntervalMs={7000}
                  className="aspect-[4/3] w-full bg-secondary"
                >
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#0a0a0a]/55 px-2 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] text-white/95">
                    Avant / après
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
                    Obtenir votre devis
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
