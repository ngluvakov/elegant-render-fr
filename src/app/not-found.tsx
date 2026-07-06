import type { Metadata } from "next";
import { Home, Sparkles } from "lucide-react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "404 — Page not found",
  description:
    "Page not found. Return to the homepage or browse the Elegant Render services.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative grid flex-1 grid-cols-[minmax(0,1fr)] place-items-center overflow-hidden px-6 pt-14 pb-72 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-12 h-48 w-[min(38rem,85vw)] -translate-x-1/2 border border-border bg-secondary/50 sm:top-16 sm:h-72"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-20 h-44 w-[min(32rem,76vw)] -translate-x-1/2 border border-border sm:top-28 sm:h-72"
      />

      <section className="relative mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
        <SectionKicker align="center">404</SectionKicker>
        <p className="mt-8 font-heading text-[clamp(5rem,18vw,10rem)] leading-none text-foreground/10">
          404
        </p>
        <h1 className="mt-[-1rem] max-w-[18rem] text-3xl leading-tight text-foreground sm:mt-[-1.4rem] sm:max-w-2xl sm:text-6xl">
          Page not found
        </h1>
        <p className="mt-6 max-w-sm text-base leading-8 text-foreground/70 sm:max-w-xl sm:text-lg">
          It looks like this link left the plan. Return to the homepage
          or continue to the services overview.
        </p>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center">
          <ButtonLink href="/" size="lg" className="w-full gap-2 sm:w-auto">
            <Home aria-hidden size={18} />
            Back to homepage
          </ButtonLink>
          <ButtonLink
            href="/services"
            size="lg"
            variant="outline"
            className="w-full gap-2 sm:w-auto"
          >
            <Sparkles aria-hidden size={18} />
            View services
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
