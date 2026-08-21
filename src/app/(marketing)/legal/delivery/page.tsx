import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Livraison numérique",
  description: `Comment ${SITE.name} livre les rendus, animations, fichiers AI Studio et autres livrables numériques de projet.`,
  path: "/legal/delivery",
});

export default function DeliveryPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Livraison numérique
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour :{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Format de livraison">
          <p>
            {SITE.name} livre exclusivement du contenu numérique. Il n’y a
            aucune expédition physique. Les livrables peuvent comprendre des
            rendus statiques, des éléments de visite virtuelle 360°, des
            animations, des résultats AI Studio, des plans d’étage, des plans
            de masse et des fichiers de projet associés.
          </p>
        </Section>

        <Section title="2. Où les fichiers sont livrés">
          <p>
            Les fichiers finaux sont normalement livrés via l’espace client,
            sous le numéro de commande concerné. Nous pouvons aussi envoyer des
            liens de téléchargement ou des pièces jointes par e-mail lorsque
            cela est plus pratique pour le projet.
          </p>
          <p>
            L’espace client est accessible à l’adresse{" "}
            <Link
              href="/portal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              /portal
            </Link>
            .
          </p>
        </Section>

        <Section title="3. Délais de livraison">
          <p>
            Les délais standard sont indiqués sur les pages de services ou
            confirmés dans votre devis. La production commence généralement
            après le paiement complet et la réception d’un brief exploitable,
            des fichiers sources, des références et des éventuelles
            clarifications requises.
          </p>
          <p>
            Si la livraison est retardée parce que des informations requises
            manquent, que le brief change, qu’un service tiers est indisponible
            ou qu’un cas de force majeure survient, nous fournirons une mise à
            jour écrite et un nouveau délai réaliste.
          </p>
          {/* TODO(legal-review): Verify this paragraph against the French rules on failure to supply digital content or a digital service (art. L224-25-10 ff. Code de la consommation, transposing Directive (EU) 2019/770) — French law defines the notice-and-termination mechanism more precisely than this generic wording. */}
          <p>
            Si nous ne fournissons pas un contenu ou un service numérique au
            moment requis, le droit impératif de la consommation peut vous
            permettre d’en exiger la fourniture et, dans des cas définis, de
            résoudre le contrat. Contactez-nous en indiquant le numéro de
            commande afin que nous puissions enquêter rapidement.
          </p>
        </Section>

        <Section title="4. Types de fichiers standard">
          <p>
            Les rendus statiques sont généralement fournis au format JPG ou
            PNG, le plus souvent jusqu’en 4K, sauf confirmation d’un autre
            format de sortie. Les animations sont généralement fournies au
            format MP4 ou MOV. D’autres formats peuvent être convenus dans les
            notes de commande ou le devis lorsqu’ils sont techniquement
            disponibles.
          </p>
        </Section>

        <Section title="5. Accès mondial">
          <p>
            La livraison numérique est disponible dans le monde entier, sous
            réserve des restrictions de plateforme, de paiement, de sanctions
            et de contrôle des exportations pouvant s’appliquer à l’une des
            parties ou au prestataire de paiement.
          </p>
        </Section>

        <Section title="6. Accès et conservation">
          <p>
            Téléchargez rapidement les travaux terminés et conservez votre
            propre sauvegarde. Les entrées et sorties d’AI Studio sont
            disponibles pendant 30 jours. La conservation des livrables de
            projet sur mesure peut varier selon la commande, la période de
            révision et les besoins d’assistance ; il ne s’agit pas d’un
            service de stockage cloud permanent.
          </p>
        </Section>

        <Section title="7. Questions sur la livraison">
          <p>
            Les questions relatives à la livraison peuvent être envoyées à{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            .
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
