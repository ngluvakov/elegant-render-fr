import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Remboursements",
  description: `Traitement des remboursements pour les services numériques de ${SITE.name}, y compris les remboursements PayPal, les remboursements partiels et les délais de traitement.`,
  path: "/legal/refunds",
});

export default function RefundsPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Remboursements
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour :{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Approche générale">
          <p>
            Nous vendons des services numériques sur mesure. Les remboursements
            dépendent du statut de la commande, du volume de travail déjà
            réalisé, de la fourniture éventuelle de livrables et de la
            possibilité raisonnable de corriger le problème par des cycles de
            révision.
          </p>
          <p>
            La présente politique ne limite pas les droits impératifs dont vous
            pouvez bénéficier en tant que consommateur en vertu de la loi
            applicable.
          </p>
        </Section>

        <Section title="2. Avant le début de la production">
          <p>
            En dehors d’un droit légal de rétractation, si vous demandez
            l’annulation avant le début de la production et avant que nous
            ayons engagé des ressources significatives sur le projet, nous
            remboursons normalement le montant payé. Nous ne déduisons les
            frais de paiement ou de tiers non récupérables que lorsque le
            contrat et la loi applicable le permettent.
          </p>
        </Section>

        <Section title="3. Après le début de la production">
          <p>
            En dehors d’un recours impératif du consommateur, une fois la
            production commencée, le remboursement en cas d’annulation peut
            être partiel. Le calcul peut tenir compte du travail réalisé, du
            temps passé, des ressources achetées, des traitements de tiers et
            des fichiers livrés lorsque la loi le permet. Si la demande
            constitue une rétractation légale valable, tout paiement
            proportionnel est calculé selon les règles de rétractation
            applicables.
          </p>
        </Section>

        <Section title="4. Après la livraison">
          <p>
            Après la livraison finale, un remboursement n’est en principe
            possible que lorsque le livrable s’écarte substantiellement du
            brief convenu et que le problème ne peut raisonnablement être
            corrigé. Une insatisfaction due à une nouvelle direction créative,
            à un brief modifié, à des documents sources manquants ou à un
            retard de validation côté client est traitée comme une révision ou
            un nouveau devis, et non comme un remboursement intégral.
          </p>
          {/* TODO(legal-review): Verify this paragraph against the French "garantie légale de conformité" for digital content and digital services (art. L224-25-1 ff. Code de la consommation) — French law may require naming the guarantee, its duration, and the hierarchy of remedies (mise en conformité, then price reduction or termination). */}
          <p>
            Cette approche commerciale ne limite pas le droit du consommateur
            d’exiger la mise en conformité d’un service ou d’un contenu
            numérique non conforme, d’obtenir une réduction du prix ou de
            résoudre le contrat lorsque les conditions légales sont réunies.
          </p>
        </Section>

        <Section title="5. Remboursements PayPal">
          <p>
            Les remboursements PayPal sont émis via PayPal vers la source de
            financement d’origine lorsque cela est possible, et dans la devise
            de la transaction d’origine. PayPal, l’émetteur de votre carte ou
            votre banque contrôle toute conversion de devise, le délai de
            règlement et la présentation sur le relevé.
          </p>
          <p>
            Nous initions un remboursement approuvé sans retard injustifié.
            PayPal, l’émetteur de votre carte ou votre banque contrôle ensuite
            le délai de règlement ; le crédit peut donc ne pas apparaître
            immédiatement. Nous fournirons la référence du remboursement
            lorsqu’elle est disponible.
          </p>
        </Section>

        <Section title="6. Comment demander un remboursement">
          <p>
            Écrivez à{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>{" "}
            en indiquant votre numéro de commande, le motif de la demande et
            tout fichier ou capture d’écran à l’appui. Si la demande constitue
            également une réclamation, nous la traiterons selon la{" "}
            <Link
              href="/legal/complaints"
              className="text-foreground underline-offset-4 hover:underline"
            >
              procédure de réclamation
            </Link>
            .
          </p>
        </Section>

        <Section title="7. Rétractation légale et autres droits">
          <p>
            Les consommateurs de l’UE doivent également lire la{" "}
            <Link
              href="/legal/withdrawal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              notice de rétractation
            </Link>
            , qui explique le droit de rétractation de 14 jours, l’exécution
            immédiate et les règles distinctes applicables aux services et aux
            contenus numériques. Les droits impératifs locaux des consommateurs
            s’appliquent indépendamment de la présente politique commerciale.
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
