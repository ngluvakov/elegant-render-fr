import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Procédure de réclamation",
  description: `Comment soumettre une réclamation concernant un service numérique de ${SITE.name}, ce qu’il faut inclure et quand attendre une réponse.`,
  path: "/informations-legales/reclamations",
});

export default function ComplaintsPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Procédure de réclamation
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour :{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Quand utiliser cette procédure">
          <p>
            Utilisez cette procédure si vous estimez qu’un rendu livré, une
            image de home staging virtuel, une animation, un résultat AI Studio
            ou un autre livrable numérique ne correspond pas au brief convenu,
            présente un défaut de production ou a été livré avec un retard
            substantiel par rapport au délai confirmé pour des raisons relevant
            de notre contrôle.
          </p>
          <p>
            Les demandes de révision habituelles doivent être formulées via
            l’espace client du projet. Une réclamation vise les problèmes qui
            ne peuvent être résolus par les cycles de révision inclus ou par un
            échange normal avec l’assistance.
          </p>
        </Section>

        <Section title="2. Comment soumettre une réclamation">
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Écrivez à{" "}
              <a
                href={`mailto:${IMPRINT.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.email}
              </a>{" "}
              en indiquant votre numéro de commande et l’objet
              « Réclamation ».
            </li>
            <li>
              Décrivez clairement le problème et identifiez le fichier, le
              service ou le cycle de révision concerné.
            </li>
            <li>
              Joignez des captures d’écran, des références annotées ou des
              liens montrant ce qui ne va pas et le résultat que vous demandez.
            </li>
            <li>
              Si le problème concerne un paiement PayPal, indiquez
              l’identifiant de commande ou de capture PayPal figurant sur votre
              reçu, si disponible.
            </li>
          </ol>
        </Section>

        <Section title="3. Délai de réponse">
          <p>
            Nous nous efforçons d’accuser réception des réclamations rapidement
            et de fournir une réponse écrite sous 14 jours. Si le problème
            nécessite un examen technique, des informations d’un fournisseur ou
            un audit de fichiers, un délai supplémentaire peut être
            nécessaire ; dans ce cas, nous en expliquerons la raison et
            donnerons une estimation réaliste.
          </p>
        </Section>

        <Section title="4. Issues possibles">
          <p>
            Si nous acceptons la réclamation, nous pouvons corriger le
            livrable, offrir un cycle de révision supplémentaire, proposer un
            remboursement partiel ou rembourser le montant concerné lorsque la
            correction n’est pas raisonnable. Le traitement des remboursements
            suit notre{" "}
            <Link
              href="/informations-legales/remboursements"
              className="text-foreground underline-offset-4 hover:underline"
            >
              politique de remboursement
            </Link>
            .
          </p>
          <p>
            Si nous n’acceptons pas la réclamation, nous expliquerons notre
            raisonnement et identifierons les options pratiques restantes.
          </p>
        </Section>

        <Section title="5. Voies de recours">
          {/* TODO(legal-review): France requires professionals selling to consumers to offer recourse to a designated médiateur de la consommation (art. L612-1 ff. Code de la consommation) and to state the mediator's identity and contact details on the site. The current text, faithful to the English build, states no general obligation to participate in ADR. A lawyer must verify whether this obligation applies to a Serbian provider targeting France and, if so, a mediator must be designated and named here. */}
          <p>
            Nous préférons résoudre les litiges directement. Si vous êtes un
            consommateur de l’UE et restez insatisfait, vous pouvez contacter
            une autorité de protection des consommateurs ou un organisme de
            règlement extrajudiciaire des litiges dans votre pays de résidence.
            Nous ne sommes en principe pas tenus de participer à une procédure
            particulière de règlement extrajudiciaire des litiges, sauf si une
            loi impérative l’exige ou si nous l’acceptons par écrit.
          </p>
          <p>
            L’ancienne plateforme de règlement en ligne des litiges de la
            Commission européenne a été fermée le 20 juillet 2025 et n’accepte
            plus de réclamations. Cela ne supprime aucun droit de saisir une
            autorité nationale de protection des consommateurs compétente, un
            tribunal ou un organisme disponible de règlement extrajudiciaire
            des litiges.
          </p>
        </Section>
      </article>
      <FinalCta />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}
