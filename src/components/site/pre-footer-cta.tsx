/**
 * PreFooterCta — Conversion band rendered just above the SiteFooter on
 * secondary marketing pages (services, pricing, about, faq, contact,
 * ai-studio). Flat white band with 1px borders so it contrasts with the
 * dark footer below.
 *
 * Copy is props-driven with sensible defaults; pages can specialize the
 * heading/body without forking the layout. Pair with QuickInquiryLink
 * for the secondary action so visitors who aren't ready to configure
 * can still get an estimate without leaving the page they're on.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import type { InquiryFormSource } from "@/components/inquiry/project-inquiry-form";

type Props = {
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  inquirySource?: InquiryFormSource;
};

export function PreFooterCta({
  eyebrow = "Prochaine étape",
  heading = "Ouvrez le calculateur et obtenez votre prix en quelques minutes.",
  body = "Choisissez un type de visualisation, définissez les paramètres et voyez immédiatement le prix exact — sans forfaits, sans conditions cachées.",
  ctaLabel = "Ouvrir le calculateur",
  ctaHref = "/tarifs#configurator",
  secondaryLabel = "Ou envoyez une demande rapide",
  inquirySource = {
    source: "pre-footer-cta",
    sourceLabel: "PreFooter quick inquiry",
  },
}: Props) {
  return (
    <section
      aria-label="Prochaine étape"
      className="mt-20 border-y border-border bg-background"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-12 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="max-w-2xl">
            <p className="section-kicker">{eyebrow}</p>
            <h2 className="mt-4 text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.02em] text-foreground md:text-4xl">
              {heading}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
            <Link
              href={ctaHref}
              className="group inline-flex h-[52px] items-center gap-2 rounded-[4px] bg-accent px-7 text-base font-medium text-accent-foreground transition-colors duration-200 hover:bg-[#00c77e] active:bg-[#00b372]"
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
            <QuickInquiryLink
              inquiry={inquirySource}
              className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline"
            >
              {secondaryLabel}
            </QuickInquiryLink>
          </div>
        </div>
      </div>
    </section>
  );
}
