/**
 * FaqCards — FAQ section with question/answer cards in a two-column grid.
 *
 * Used on: / (home page).
 */
import { HelpCircle } from "lucide-react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FAQ_ITEMS } from "@/lib/content/site";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export async function FaqCards() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;

  return (
    <section id="faq" className="pb-16 pt-10 md:pb-20 md:pt-14 lg:pb-24 lg:pt-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="mb-10 max-w-2xl space-y-3">
          <SectionKicker>Česta pitanja</SectionKicker>
          <h2 className="text-4xl leading-tight text-foreground md:text-5xl">
            Pitanja koja direktno utiču na kupovnu odluku.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
            >
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-1 h-5 w-5 flex-shrink-0 text-[color:var(--color-clay-deep)]" />
                <div>
                  <h3 className="text-lg text-foreground">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {formatPublicPriceText(
                      item.answer,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
