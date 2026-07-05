import type { Metadata } from "next";
import { Home, Sparkles } from "lucide-react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "404 — Stranica nije pronađena",
  description:
    "Stranica nije pronađena. Vratite se na početnu stranicu ili otvorite pregled Elegant Render usluga.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative grid flex-1 grid-cols-[minmax(0,1fr)] place-items-center overflow-hidden px-6 pt-14 pb-72 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-warm to-transparent"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-12 h-48 w-[min(38rem,85vw)] -translate-x-1/2 border border-border-soft/70 bg-warm-white/45 shadow-[0_32px_90px_-55px_rgba(28,26,25,0.55)] sm:top-16 sm:h-72"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-20 h-44 w-[min(32rem,76vw)] -translate-x-1/2 border border-border-warm/70 sm:top-28 sm:h-72"
      />

      <section className="relative mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
        <SectionKicker align="center">404</SectionKicker>
        <p className="mt-8 font-heading text-[clamp(5rem,18vw,10rem)] leading-none text-coal/10">
          404
        </p>
        <h1 className="mt-[-1rem] max-w-[18rem] text-3xl leading-tight text-foreground sm:mt-[-1.4rem] sm:max-w-2xl sm:text-6xl">
          Stranica nije pronađena
        </h1>
        <p className="mt-6 max-w-sm text-base leading-8 text-foreground/70 sm:max-w-xl sm:text-lg">
          Izgleda da je ovaj link napustio plan. Vratite se na početnu
          stranicu ili nastavite ka pregledu usluga.
        </p>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center">
          <ButtonLink href="/" size="lg" className="w-full gap-2 sm:w-auto">
            <Home aria-hidden size={18} />
            Na početnu
          </ButtonLink>
          <ButtonLink
            href="/services"
            size="lg"
            variant="outline"
            className="w-full gap-2 sm:w-auto"
          >
            <Sparkles aria-hidden size={18} />
            Pogledaj usluge
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
