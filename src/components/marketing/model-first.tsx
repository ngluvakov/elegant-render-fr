/**
 * ModelFirst — "Model-first pricing" section per the design handoff: a dark
 * #0a0a0a panel (green mono eyebrow + display heading) next to a 2×2 grid of
 * white cards with mono indices, each a concrete saving from reusing the
 * 3D model. Copy is final English from docs/design-handoff/README.md.
 *
 * Used on: / (home page).
 */
import { ORDERING_STEPS } from "@/lib/content/site";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export async function ModelFirst() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);

  return (
    <section id="model-first" className="bg-background">
      <div className="mx-auto grid w-full max-w-[1280px] gap-6 px-6 py-20 sm:px-12 md:py-32 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="flex flex-col justify-center rounded-[4px] bg-[#0a0a0a] p-8 sm:p-12">
          <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">
            More renders, lower price per render
          </p>
          <h2 className="mb-5 text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.02em] text-white md:text-[40px]">
            We build the model once. Everything after it costs less.
          </h2>
          <p className="text-[15px] leading-relaxed text-white/65">
            Once we build the 3D model of your property, it becomes your
            digital asset. Every further output from that model — extra
            angles, animation, site plans — is priced at a fraction of the
            first one. You always see how the price is formed before you
            order.
          </p>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          {ORDERING_STEPS.map((step) => (
            <article
              key={step.step}
              className="rounded-[4px] border border-border bg-card p-8 transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
            >
              <p className="mb-2.5 font-mono text-xs tracking-[0.08em] text-muted-foreground">
                {step.step}
              </p>
              <h3 className="mb-2.5 text-lg font-medium text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground tabular-nums">
                {formatPublicPriceText(
                  step.description,
                  displayCurrency,
                  pricingCatalog.settings,
                )}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
