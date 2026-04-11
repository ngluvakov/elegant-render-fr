import { Clock3, HelpCircle } from "lucide-react";

export function NextIteration() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="rounded-3xl border border-[color:var(--color-border-warm)] bg-card/90 p-6 shadow-[0_30px_80px_rgba(28,26,25,0.08)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">
                Sledeća iteracija
              </p>
              <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl">
                Odatle prelazimo na pravi konfigurator — ne na još jednu
                prezentaciju firme.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <Clock3 className="mb-3 h-5 w-5 text-[color:var(--color-clay-deep)]" />
                <p className="text-sm font-semibold text-foreground">
                  Kalkulacija po obimu
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sledeći korak je unos količine: broj soba, dodatnih kamera,
                  spratova ili sekundi animacije.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <HelpCircle className="mb-3 h-5 w-5 text-[color:var(--color-sage-deep)]" />
                <p className="text-sm font-semibold text-foreground">
                  Upload i potvrda
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Posle izbora logike cene dolazi upload materijala i potvrda
                  finalnog obračuna sa jasnim rokom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
