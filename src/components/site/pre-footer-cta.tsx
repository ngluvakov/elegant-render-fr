/**
 * PreFooterCta — Conversion band rendered just above the SiteFooter on
 * secondary marketing pages (services, pricing, about, faq, contact,
 * ai-studio). Sits on a warm neutral surface so it contrasts with the
 * dark footer below and the ivory page content above.
 *
 * Copy is props-driven with sensible defaults; pages can specialize the
 * heading/body without forking the layout. Pair with QuickInquiryLink
 * for the secondary action so visitors who aren't ready to configure
 * can still get a quote without leaving the page they're on.
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
  eyebrow = "Sledeći korak",
  heading = "Otvori kalkulator i vidi cenu za par minuta.",
  body = "Izaberi tip vizuelizacije, podesi parametre, i odmah vidi tačnu cenu — bez paketa i sitnih slova.",
  ctaLabel = "Otvori kalkulaciju i narudžbinu",
  ctaHref = "/#naruci",
  secondaryLabel = "Ili pošalji brzi upit",
  inquirySource = { source: "pre-footer-cta", sourceLabel: "PreFooter brzi upit" },
}: Props) {
  return (
    <section
      aria-label="Sledeći korak"
      className="relative isolate mt-20 overflow-hidden border-y border-[var(--color-border-soft)] bg-[var(--color-warm-white)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,131,99,0.10),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(143,154,138,0.08),transparent_38%)]"
      />
      <div className="relative mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="max-w-2xl">
            <p className="section-kicker">{eyebrow}</p>
            <h2 className="mt-4 text-3xl leading-tight text-[var(--color-coal)] md:text-4xl">
              {heading}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-muted-foreground)]">
              {body}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-clay)] px-6 py-3.5 text-sm font-medium text-white shadow-[0_18px_40px_rgba(184,131,99,0.28)] transition hover:bg-[var(--color-clay-deep)]"
            >
              {ctaLabel}
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <QuickInquiryLink
              inquiry={inquirySource}
              className="text-sm text-[var(--color-muted-foreground)] underline-offset-4 transition hover:text-[var(--color-clay-deep)] hover:underline"
            >
              {secondaryLabel}
            </QuickInquiryLink>
          </div>
        </div>
      </div>
    </section>
  );
}
