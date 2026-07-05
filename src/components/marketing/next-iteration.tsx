/**
 * NextIteration — Conversion CTA block placed between the model-first
 * explainer and the FAQ. Surfaces a single primary action ("Izračunajte
 * cenu") plus three reassurance pills (revisions, ISO, delivery).
 *
 * Used on: / (home page).
 */
import { BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

const TRUST_PILLS = [
  { icon: BadgeCheck, label: "3 runde revizija uključene" },
  { icon: ShieldCheck, label: "ISO 9001 · 27001 · 50001" },
  { icon: Clock3, label: "Standardno 3–5 radnih dana" },
] as const;

export function NextIteration() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="rounded-3xl border border-[color:var(--color-border-warm)] bg-card/90 p-8 shadow-[0_30px_80px_rgba(28,26,25,0.08)] sm:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">
              Spremni da krenete?
            </p>
            <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl">
              Spremni da proverite budžet?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Prvo složite okvirnu ponudu u kalkulatoru. Kada ste spremni,
              porudžbina nastavlja iz iste quote korpe bez vraćanja unazad.
            </p>
            <div className="mt-7">
              <ButtonLink href="/pricing#configurator" variant="accent" size="lg">
                Izračunajte cenu
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {TRUST_PILLS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-[0.72rem] text-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-[color:var(--color-sage-deep)]" />
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
