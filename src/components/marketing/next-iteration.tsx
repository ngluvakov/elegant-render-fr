/**
 * NextIteration — Conversion CTA block placed between the model-first
 * explainer and the FAQ. Surfaces a single primary action ("Obtenir votre
 * devis") plus three reassurance pills (revisions, ISO, delivery).
 *
 * Used on: / (home page).
 */
import { BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

const TRUST_PILLS = [
  { icon: BadgeCheck, label: "3 séries de révisions incluses" },
  { icon: ShieldCheck, label: "ISO 9001 · 27001 · 50001" },
  { icon: Clock3, label: "Généralement 3-5 jours ouvrés" },
] as const;

export function NextIteration() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="rounded-lg border border-border bg-card p-8 sm:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Prêt quand vous l’êtes
            </p>
            <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl">
              Prêt à vérifier votre budget ?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Établissez d’abord une estimation dans le calculateur. Quand vous
              êtes prêt, votre commande reprend le même panier de devis — sans
              repartir de zéro.
            </p>
            <div className="mt-7">
              <ButtonLink href="/tarifs#configurator" variant="accent" size="lg">
                Obtenir votre devis
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
