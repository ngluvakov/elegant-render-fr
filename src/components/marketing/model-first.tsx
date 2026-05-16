/**
 * ModelFirst — Explains the "model-first pricing" philosophy: first output
 * builds the 3D model, subsequent outputs cost less. Includes ordering steps.
 *
 * Used on: / (home page).
 */
import { ORDERING_STEPS } from "@/lib/content/site";

export function ModelFirst() {
  return (
    <section id="model-first" className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-foreground/10 bg-foreground p-6 text-background shadow-[0_30px_70px_rgba(28,26,25,0.18)] sm:p-8">
            <p className="text-[0.7rem] uppercase tracking-[0.28em] text-background/65">
              Model-first pricing
            </p>
            <h2 className="mt-4 text-4xl leading-tight text-background sm:text-5xl">
              Zašto je naš model cena bolji?
            </h2>
            <p className="mt-5 text-sm leading-7 text-background/70">
              Kada jednom izgradimo 3D model Vaše nekretnine, on postaje Vaš
              digitalni resurs. Svaka sledeća usluga iz tog modela je značajno
              jeftinija — od dodatnih uglova do animacije i situacionog plana.
            </p>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {ORDERING_STEPS.map((step) => (
              <article
                key={step.step}
                className="rounded-2xl border border-border/70 bg-card/85 p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/70 text-sm font-semibold text-foreground">
                    {step.step}
                  </div>
                  <h3 className="text-lg text-foreground">{step.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
