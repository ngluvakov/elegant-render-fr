import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Brush, Coins, Layers3, Wand2 } from "lucide-react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ButtonLink } from "@/components/ui/button-link";
import {
  AI_CREDIT_TIERS,
  AI_EDIT_TYPES,
  calculateAiCreditPurchase,
  formatCents,
} from "@/lib/ai-studio/catalog";

export const metadata: Metadata = {
  title: "AI Studio",
  description:
    "AI obrada fotografija nekretnina uz kredite, simple prompt mode i napredne maske.",
  openGraph: {
    title: "AI Studio — Elegant Render",
    description:
      "Brza AI obrada fotografija nekretnina: staging, uklanjanje elemenata, nebo, dan-u-noć i renovacija.",
    url: "/ai-studio",
  },
};

export default function AiStudioLandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[min(96vw,1720px)] items-center gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionKicker>AI Studio</SectionKicker>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] text-foreground md:text-7xl">
              AI obrada fotografija nekretnina
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Uploadujte fotografiju, izaberite tip obrade i pokrenite AI
              rezultat odmah iz portala. Simple mode je brz prompt, advanced
              mode dodaje maske, selekcije i crtanje po slici.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/portal/ai-studio" variant="accent" size="lg">
                Otvori AI Studio
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/cene" variant="outline" size="lg">
                Kupi kredite
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "/artwork/elegant-render-virtual-staging-scene.webp",
                "/artwork/elegant-render-services-before-after-grid.webp",
                "/artwork/elegant-render-hero-interior.webp",
                "/artwork/elegant-render-feature-exterior.webp",
              ].map((src, index) => (
                <div
                  key={src}
                  className={`overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_24px_70px_rgba(28,26,25,0.12)] ${
                    index % 2 === 0 ? "sm:translate-y-8" : ""
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={720}
                    height={540}
                    className="aspect-[4/3] w-full object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <div className="grid gap-5 md:grid-cols-4">
            {[
              {
                icon: Wand2,
                title: "Simple prompt",
                text: "Za brze obrade kada je instrukcija dovoljna.",
              },
              {
                icon: Brush,
                title: "Advanced maske",
                text: "Brush, pravougaonik, invert, undo i precizna selekcija.",
              },
              {
                icon: Layers3,
                title: "Lančane obrade",
                text: "Rezultat prve obrade može postati input za sledeću.",
              },
              {
                icon: Coins,
                title: "Krediti",
                text: "Jedan kredit pokriva jednu kompleksnu ili dve jednostavne obrade.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-card/80 p-5"
              >
                <item.icon className="h-5 w-5 text-accent" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/35 py-20">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionKicker>Obrade</SectionKicker>
              <h2 className="mt-3 text-4xl text-foreground">
                Sedam početnih AI alata
              </h2>
            </div>
            <Link
              href="/portal/ai-studio"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Probaj u portalu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {AI_EDIT_TYPES.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/60 bg-background p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  {item.units === 1 ? "0.5 kredita" : "1 kredit"}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid w-full max-w-[min(96vw,1720px)] gap-8 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionKicker>Krediti</SectionKicker>
            <h2 className="mt-3 text-4xl text-foreground">
              Kupite koliko vam treba
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Paketi su samo prečice. Ako unesete bilo koji broj kredita,
              primenjuje se najbolji threshold za tu količinu.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[10, 25, 50, 100].map((credits) => {
              const purchase = calculateAiCreditPurchase(credits);
              return (
                <div
                  key={credits}
                  className="rounded-2xl border border-border/60 bg-card/80 p-5"
                >
                  <p className="text-3xl font-bold text-foreground">
                    {credits}
                  </p>
                  <p className="text-sm text-muted-foreground">kredita</p>
                  <p className="mt-4 text-xl font-semibold text-foreground">
                    {formatCents(purchase.totalCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(purchase.centsPerCredit)} po kreditu
                  </p>
                </div>
              );
            })}
          </div>
          <div className="lg:col-start-2">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {AI_CREDIT_TIERS.slice().reverse().map((tier, index) => {
                const next = AI_CREDIT_TIERS.slice().reverse()[index + 1];
                const label = next
                  ? `${tier.minCredits}-${next.minCredits - 1}`
                  : `${tier.minCredits}+`;
                return (
                  <span
                    key={tier.minCredits}
                    className="rounded-full bg-secondary px-3 py-1"
                  >
                    {label}: {formatCents(tier.centsPerCredit)}/kredit
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
