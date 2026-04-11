import type { Metadata } from "next";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Izbor naših projekata — enterijera, eksterijera, virtuelnog opremanja i adaptacija prostora.",
};

const PLACEHOLDERS = Array.from({ length: 9 }, (_, i) => i + 1);

export default function PortfolioPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 pt-20 md:pt-28">
        <SectionKicker>Portfolio</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Izbor projekata koji pokazuju šta radimo
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Enterijeri, eksterijeri, staging i adaptacije — svi sa istim
          principom: topla atmosfera, čitljiv raspored i realan utisak prostora.
          Finalne slike biće uskoro dostupne.
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDERS.map((n) => (
              <div
                key={n}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-secondary/50"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs uppercase tracking-[0.22em] text-foreground/30">
                    Primer {n.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-foreground/55">
            Puni portfolio je u pripremi. Finalne slike biće dodate pre
            zvaničnog lansiranja sajta.
          </p>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
