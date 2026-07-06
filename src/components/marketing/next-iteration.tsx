/**
 * NextIteration — Conversion CTA block placed between the model-first
 * explainer and the FAQ. Surfaces a single primary action ("Get your
 * estimate") plus three reassurance pills (revisions, ISO, delivery).
 *
 * Used on: / (home page).
 */
import { BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

const TRUST_PILLS = [
  { icon: BadgeCheck, label: "3 revision rounds included" },
  { icon: ShieldCheck, label: "ISO 9001 · 27001 · 50001" },
  { icon: Clock3, label: "Typically 3-5 working days" },
] as const;

export function NextIteration() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="rounded-lg border border-border bg-card p-8 sm:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Ready when you are
            </p>
            <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl">
              Ready to check your budget?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Build a rough estimate in the calculator first. When you&apos;re
              ready, your order continues from the same estimate basket — no
              starting over.
            </p>
            <div className="mt-7">
              <ButtonLink href="/pricing#configurator" variant="accent" size="lg">
                Get your estimate
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {TRUST_PILLS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
