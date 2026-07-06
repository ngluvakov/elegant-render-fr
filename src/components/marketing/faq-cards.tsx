/**
 * FaqCards — homepage FAQ per the design handoff: #fafafa section, grid
 * 0.8fr/1.2fr — left heading "Before you ask", right five native
 * `<details>` rows with 1px bottom borders and a mono "+" marker.
 *
 * Used on: / (home page).
 */
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
    <section id="faq" className="border-t border-border bg-secondary">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-6 py-16 sm:px-12 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Frequent questions
          </p>
          <h2 className="mb-4 text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.02em] text-foreground md:text-[40px]">
            Before you ask
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Anything else on your mind? Write to us — we reply within one
            working day.
          </p>
        </div>

        <div className="flex flex-col">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group border-b border-border py-1"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[18px] text-[17px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="font-mono font-normal text-muted-foreground group-open:hidden"
                >
                  +
                </span>
                <span
                  aria-hidden
                  className="hidden font-mono font-normal text-muted-foreground group-open:inline"
                >
                  −
                </span>
              </summary>
              <p className="max-w-[640px] pb-5 text-[15px] leading-relaxed text-muted-foreground">
                {formatPublicPriceText(
                  item.answer,
                  displayCurrency,
                  pricingSettings,
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
