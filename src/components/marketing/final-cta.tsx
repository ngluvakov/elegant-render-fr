/**
 * FinalCta — Dark bottom CTA banner prompting visitors to submit a project.
 *
 * Used on: /portfolio, /blog and legal pages.
 */
import { ButtonLink } from "@/components/ui/button-link";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";

export function FinalCta() {
  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-12">
        <div className="rounded-[4px] bg-[#0a0a0a] px-8 py-20 text-center text-white md:px-16">
          <h2 className="mx-auto max-w-2xl text-pretty text-4xl font-medium leading-[1.1] tracking-[-0.02em] md:text-5xl">
            Send us your space — we&apos;ll send back a clear picture.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70">
            Hand-crafted renders with clear prices and a fast process. We
            usually reply the same working day.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <QuickInquiryLink
              size="xl"
              variant="accent"
              inquiry={{ source: "final-cta", sourceLabel: "Final CTA" }}
            >
              Send your project
            </QuickInquiryLink>
            <ButtonLink
              href="/pricing"
              size="xl"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              See the price list
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
