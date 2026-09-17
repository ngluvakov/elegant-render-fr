import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Conditions générales de vente (CGV)",
  description: `Conditions applicables à la commande de rendus architecturaux, de home staging virtuel, de retouches jour au crépuscule, de photomontages, d’AI Studio et d’autres services numériques auprès de ${SITE.name}.`,
  path: "/informations-legales/cgv",
});

export default function TermsPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Conditions générales de vente
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour :{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
        <p className="mt-6 text-base leading-relaxed text-foreground/75">
          Les présentes conditions s’appliquent lorsque vous utilisez{" "}
          {SITE.name} ou commandez des services numériques auprès de{" "}
          {IMPRINT.shortName}. Elles sont rédigées pour une clientèle
          internationale et doivent être lues conjointement avec nos politiques
          de confidentialité, de remboursement, de rétractation, de
          réclamation, de livraison et de cookies.
        </p>

        <Section title="1. Prestataire">
          <p>
            {SITE.name} est exploité par {IMPRINT.legalName}, exerçant sous le
            nom commercial {IMPRINT.shortName}, dont le siège est situé{" "}
            {IMPRINT.street}, {IMPRINT.postalCode} {IMPRINT.city}, Serbie. Le
            numéro d’immatriculation est {IMPRINT.registryNumber} et
            l’identifiant fiscal est {IMPRINT.taxId}.
          </p>
          <p>
            Vous pouvez nous contacter à l’adresse{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Services">
          <p>
            Nous créons des livrables numériques sur mesure, notamment des
            rendus d’intérieur et d’extérieur, des visites virtuelles 360°, des
            animations architecturales, des plans 2D et 3D, des plans de masse,
            du home staging virtuel, de la rénovation virtuelle, des retouches
            jour au crépuscule, des photomontages, de la suppression d’objets
            et du traitement d’images AI Studio.
          </p>
          <p>
            Chaque commande repose sur le service sélectionné, les informations
            que vous soumettez, les fichiers que vous importez et toute
            instruction écrite confirmée lors du paiement, dans l’espace client
            ou par échange d’e-mails.
          </p>
        </Section>

        <Section title="3. Commande et accès au compte">
          <p>
            Vous passez commande via le processus de paiement ou via un devis
            établi manuellement que nous confirmons par écrit. Nous pouvons
            créer ou utiliser un compte de l’espace client afin que vous
            puissiez importer des fichiers, suivre l’avancement, demander des
            cycles de révision et télécharger les livrables.
          </p>
          <p>
            Vous êtes responsable de l’exactitude des informations de contact,
            de facturation et de projet fournies. Si des fichiers, dimensions,
            informations d’accès ou références manquent, les délais peuvent
            être décalés jusqu’à ce que les informations manquantes soient
            fournies.
          </p>
          <p>
            Vous devez être âgé d’au moins 18 ans et juridiquement capable de
            conclure le contrat, ou passer la commande avec l’autorisation de
            la personne ou de l’organisation que vous représentez. Gardez
            confidentiels vos identifiants de compte et vos liens d’accès à
            usage unique, et signalez-nous rapidement tout soupçon d’accès non
            autorisé.
          </p>
        </Section>

        <Section title="4. Prix et paiement">
          <p>
            Les prix publics sont affichés à titre indicatif et peuvent être
            présentés dans la devise locale du visiteur. Les factures sont
            émises en EUR, sauf accord écrit différent. PayPal peut afficher et
            traiter la transaction dans la devise présentée au moment du
            paiement.
          </p>
          <p>
            Le paiement est exigible avant le début de la production, sauf
            accord écrit contraire. Les paiements PayPal sont soumis aux
            propres conditions de PayPal, à ses contrôles antifraude, à ses
            règles relatives aux sources de financement et à son statut de
            traitement.
          </p>
        </Section>

        <Section title="5. Documents du client et droits">
          <p>
            Vous confirmez que vous disposez du droit de fournir l’ensemble des
            plans, photos, modèles, références, logos, textes et autres
            documents que vous importez ou nous envoyez. Vous restez
            responsable des droits des tiers sur ces documents.
          </p>
          <p>
            Vous nous accordez les droits limités nécessaires pour examiner,
            traiter, stocker, transformer et livrer les documents dans le cadre
            de votre projet et de l’assistance associée. Nous ne revendiquons
            aucun droit de propriété sur vos fichiers d’origine.
          </p>
        </Section>

        <Section title="6. Livraison et cycles de révision">
          <p>
            La livraison est exclusivement numérique. Les délais habituels sont
            indiqués sur les pages de services ou confirmés dans votre devis.
            Les délais courent à compter du paiement complet et de la réception
            d’un brief exploitable.
          </p>
          <p>
            Les cycles de révision inclus couvrent des ajustements raisonnables
            dans le périmètre convenu. De nouvelles pièces, de nouveaux points
            de vue, de nouvelles directions créatives, des documents sources
            manquants ou un service différent peuvent nécessiter un nouveau
            devis.
          </p>
          <p>
            Consultez la{" "}
            <Link
              href="/informations-legales/livraison"
              className="text-foreground underline-offset-4 hover:underline"
            >
              politique de livraison
            </Link>{" "}
            pour plus de détails.
          </p>
        </Section>

        <Section title="7. Droit de rétractation des consommateurs">
          {/* TODO(legal-review): This clause mirrors the EU Consumer Rights Directive wording from the English build. A lawyer should verify it against the French transposition in the Code de la consommation (art. L221-18 ff., L221-25, L221-28 1° and 13°) and adjust the mandatory pre-contractual information wording if French law requires different or additional statements. */}
          <p>
            Les consommateurs de l’UE et de l’EEE disposent en règle générale
            d’un droit de rétractation de 14 jours pour les contrats de service
            à distance éligibles. Si vous nous demandez expressément de
            commencer pendant cette période puis vous rétractez avant la
            complète exécution, un montant proportionnel peut rester dû lorsque
            les conditions légales sont réunies. Pour les services, le droit
            n’est perdu après la pleine exécution que si le consentement exprès
            préalable et la reconnaissance requis ont été donnés. Pour le
            contenu numérique, des règles différentes peuvent entraîner la
            perte du droit dès le début de la fourniture, mais uniquement après
            le consentement exprès, la reconnaissance et la confirmation sur un
            support durable exigés par la loi.
          </p>
          <p>
            La notice détaillée, le modèle d’avis et la fonction de
            rétractation en ligne sont disponibles sur la{" "}
            <Link
              href="/informations-legales/retractation#online-withdrawal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              page de rétractation
            </Link>
            .
          </p>
        </Section>

        <Section title="8. Remboursements et réclamations">
          <p>
            Le traitement des remboursements dépend du statut du projet, du
            travail livré et du motif de la demande. Les remboursements PayPal
            sont restitués via PayPal vers la source de financement d’origine
            lorsque cela est possible.
          </p>
          <p>
            Consultez notre{" "}
            <Link
              href="/informations-legales/remboursements"
              className="text-foreground underline-offset-4 hover:underline"
            >
              politique de remboursement
            </Link>{" "}
            et notre{" "}
            <Link
              href="/informations-legales/reclamations"
              className="text-foreground underline-offset-4 hover:underline"
            >
              procédure de réclamation
            </Link>
            .
          </p>
          {/* TODO(legal-review): Verify whether French law requires the "garantie légale de conformité" for digital content and digital services (art. L224-25-1 ff. Code de la consommation) to be referenced here by name, and whether a mandatory standardized notice about the legal guarantee must accompany these terms. */}
          <p>
            Ces politiques ne remplacent pas les recours impératifs applicables
            à un service numérique ou à un contenu numérique non fourni,
            défectueux ou non conforme au contrat. Le cas échéant, les
            consommateurs peuvent exiger la mise en conformité, une réduction
            proportionnelle du prix ou la résolution du contrat dans les
            conditions prévues par la loi qui les protège.
          </p>
        </Section>

        <Section title="9. Utilisation acceptable">
          <p>
            Vous ne devez pas utiliser le service pour demander des contenus
            illicites, trompeurs, contrefaisants, abusifs ou discriminatoires.
            Nous pouvons refuser ou interrompre le travail lorsqu’un projet
            violerait la loi, les règles des plateformes, les droits de tiers
            ou nos standards de production.
          </p>
        </Section>

        <Section title="10. AI Studio et résultats automatisés">
          <p>
            AI Studio peut produire des résultats inattendus, inexacts ou
            visuellement incohérents. Vous devez vérifier un résultat avant de
            le publier ou de vous y fier, en particulier lorsqu’il représente
            une caractéristique d’un bien, un produit, une limite de propriété,
            une vue ou une décision d’urbanisme. Un résultat généré par IA est
            un concept visuel, non la preuve d’une situation existante ni un
            conseil professionnel.
          </p>
          <p>
            Ne soumettez pas de contenus illicites, de documents d’identité, de
            documents confidentiels que vous n’êtes pas autorisé à partager, ni
            de contenus portant atteinte à la vie privée ou aux droits de
            propriété intellectuelle d’autrui.
          </p>
        </Section>

        <Section title="11. Propriété intellectuelle des livrables">
          <p>
            Après paiement intégral, vous pouvez utiliser les livrables finaux
            pour la finalité du projet décrite dans la commande, y compris le
            marketing immobilier, les présentations, les annonces, les sites
            web et les documents destinés aux investisseurs, sauf si une
            licence plus restreinte est convenue par écrit.
          </p>
          <p>
            Les fichiers de travail, scènes de production, prompts, ébauches
            intermédiaires, méthodes internes et ressources réutilisables
            demeurent nos éléments de production, sauf transfert exprès convenu
            par écrit.
          </p>
        </Section>

        <Section title="12. Responsabilité">
          <p>
            Nos livrables sont des supports de communication visuelle. Ce ne
            sont ni des plans d’architecte, ni de la documentation
            d’ingénierie, ni des permis de construire, ni des consignes de
            sécurité, ni un substitut à un conseil technique professionnel.
          </p>
          {/* TODO(legal-review): Liability limitations toward consumers are strictly framed in France (clauses abusives, art. R212-1 Code de la consommation). A lawyer should verify that this clause, translated as-is from the English build, remains enforceable and properly carves out the mandatory guarantees for French consumers. */}
          <p>
            Nous sommes responsables de la fourniture du service numérique
            commandé avec un soin et une compétence raisonnables. Dans toute la
            mesure permise par la loi, nous ne sommes pas responsables des
            pertes indirectes, du manque à gagner, des opportunités perdues ni
            des décisions prises sur la base de documents qui nous ont été
            fournis de manière incorrecte ou incomplète.
          </p>
          <p>
            Rien dans les présentes conditions n’exclut ni ne limite une
            responsabilité qui ne peut être légalement exclue, y compris les
            recours impératifs des consommateurs ou la responsabilité en cas de
            fraude, de faute intentionnelle, ou de décès ou de dommage corporel
            causé par une négligence, lorsque la loi applicable en interdit
            l’exclusion.
          </p>
        </Section>

        <Section title="13. Modifications, suspension et résiliation">
          <p>
            Nous pouvons mettre à jour les fonctionnalités du site et les
            présentes conditions pour des raisons juridiques, de sécurité ou
            opérationnelles. Les modifications ne suppriment pas
            rétroactivement les droits attachés à une commande acceptée. Nous
            pouvons suspendre l’accès ou interrompre le travail lorsque cela
            est raisonnablement nécessaire pour traiter un défaut de paiement,
            un risque de sécurité, une utilisation illicite ou une violation
            substantielle, et nous en donnerons notification lorsque cela est
            possible et licite.
          </p>
        </Section>

        <Section title="14. Droit applicable et protection des consommateurs">
          {/* TODO(legal-review): The choice of Serbian law with the Rome I art. 6 carve-out is translated unchanged from the English build. A lawyer should verify how this reads for French consumers — the mandatory provisions of the Code de la consommation apply regardless of the chosen law — and whether French consumer-information rules require an express statement to that effect. */}
          <p>
            Les présentes conditions sont régies par le droit serbe. Si vous
            êtes un consommateur résidant habituellement dans l’Union
            européenne, ce choix de loi ne vous prive pas des protections
            impératives des consommateurs auxquelles il ne peut être dérogé par
            contrat en vertu du droit de votre pays de résidence, conformément
            à l’article 6 du règlement (CE) n° 593/2008 (Rome I).
          </p>
        </Section>

        <Section title="15. Règlement extrajudiciaire des litiges">
          {/* TODO(legal-review): France requires professionals contracting with consumers to guarantee recourse to a consumer mediator (médiateur de la consommation, art. L612-1 ff. Code de la consommation) and to state the mediator's identity and contact details. The current text, translated from the English build, states the opposite default (no obligation to participate in ADR). A lawyer must verify whether this obligation applies to a Serbian provider targeting France and, if so, a mediator must be designated and named here. */}
          <p>
            Nous préférons résoudre les réclamations directement et par écrit.
            Si un litige ne peut être résolu, les consommateurs de l’UE peuvent
            contacter une autorité de protection des consommateurs compétente
            ou un organisme de règlement extrajudiciaire des litiges dans leur
            pays de résidence. Nous ne sommes en principe pas tenus de
            participer à une procédure particulière de règlement
            extrajudiciaire des litiges, sauf si une loi impérative l’exige ou
            si nous l’acceptons par écrit.
          </p>
          <p>
            La plateforme de règlement en ligne des litiges de la Commission
            européenne a été fermée le 20 juillet 2025 ; nous n’y renvoyons
            donc pas et ne l’utilisons pas pour les nouvelles réclamations.
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
