import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Politique de confidentialité",
  description: `Comment ${SITE.name} collecte, utilise, partage, protège et conserve les données personnelles, et comment chacun, où qu’il se trouve, peut exercer ses droits en matière de vie privée.`,
  path: "/informations-legales/confidentialite",
});

type ProcessingActivity = {
  activity: string;
  data: string;
  purposeAndBasis: string;
  recipients: string;
  retention: string;
};

const PROCESSING_ACTIVITIES: ProcessingActivity[] = [
  {
    activity: "Site web, sécurité et prévention de la fraude",
    data: "Adresse IP, heure de la requête, informations sur l’appareil et le navigateur, état du consentement, événements de sécurité, journaux d’erreurs et identifiants de limitation de débit.",
    purposeAndBasis:
      "Fournir et sécuriser le site, prévenir les abus, analyser les incidents et protéger les comptes. La base est l’exécution du service et nos intérêts légitimes en matière de sécurité et de fiabilité.",
    recipients:
      "Vercel, Sentry, Upstash, Cloudflare Turnstile lorsqu’il est activé, et notre équipe technique autorisée.",
    retention:
      "Pendant la durée la plus courte nécessaire au diagnostic et à la sécurisation du service, selon la configuration des prestataires, et plus longtemps lorsqu’un incident, une action en justice ou un audit l’exige.",
  },
  {
    activity: "Demandes et devis",
    data: "Nom, e-mail, téléphone, société, pays, brief du projet, budget, échéance, page d’origine, messages, ainsi que les plans, photos ou références importés.",
    purposeAndBasis:
      "Répondre aux demandes, préparer un devis, évaluer les documents sources et donner suite aux services demandés. La base est l’exécution de mesures précontractuelles prises à votre demande et notre intérêt légitime à gérer les demandes sérieuses.",
    recipients:
      "Notre équipe, les prestataires d’hébergement et de stockage, Resend, Bitrix24, Cloudmersive pour l’analyse des fichiers, et des conseillers professionnels si nécessaire.",
    retention:
      "Jusqu’à la résolution de la demande, puis pendant une durée raisonnablement nécessaire au suivi, à la tenue des dossiers et aux éventuelles réclamations. Les devis provisoires non utilisés expirent après 30 jours.",
  },
  {
    activity: "Comptes et authentification",
    data: "Nom, e-mail, téléphone, empreinte du mot de passe, jetons d’authentification, identifiants de compte Google lorsque la connexion Google est utilisée, activité du compte et préférences de l’espace client.",
    purposeAndBasis:
      "Créer et gérer le compte, vous authentifier, fournir l’accès à l’espace client et conserver une piste d’audit. La base est l’exécution du contrat et nos intérêts légitimes en matière de sécurité des comptes et de traçabilité.",
    recipients:
      "Nos prestataires de base de données gérée et d’hébergement, l’infrastructure Auth.js, Google lorsque vous choisissez la connexion Google, Resend et les administrateurs autorisés.",
    retention:
      "Pendant la durée de vie du compte. Après une demande de suppression valable, les données sont supprimées ou anonymisées sous 30 jours, sauf si elles doivent être conservées pour des raisons comptables, de sécurité, de litige ou juridiques.",
  },
  {
    activity: "Commandes, facturation, paiements et livraison",
    data: "Coordonnées de l’acheteur et de facturation, identifiants fiscaux ou de TVA, contenu des commandes, prix, statut du paiement, références de commande et de capture PayPal, e-mail et pays du payeur communiqués par PayPal, factures, messages, révisions et livrables.",
    purposeAndBasis:
      "Former et exécuter le contrat, encaisser le paiement, émettre les factures, livrer le travail, gérer les révisions et les remboursements, et respecter les obligations comptables, fiscales, de sanctions et légales.",
    recipients:
      "Notre équipe, PayPal, Resend, Bitrix24, Plutos lorsque la synchronisation des factures est activée, les comptables, auditeurs, banques, conseillers et autorités compétentes lorsque cela est requis.",
    retention:
      "Les données opérationnelles sont conservées pendant la durée du contrat et de l’assistance. Les factures, preuves de paiement et pièces comptables associées peuvent être conservées jusqu’à 10 ans, ou plus longtemps lorsque la loi applicable ou une réclamation en cours l’exige.",
  },
  {
    activity: "Fichiers de projet et AI Studio",
    data: "Plans, photographies, images, prompts, masques, images de référence, choix de configuration, résultats générés, métadonnées de fichiers et identifiants de réponse des prestataires.",
    purposeAndBasis:
      "Créer le rendu ou la retouche d’image demandés, analyser les fichiers contre les logiciels malveillants, fournir l’historique de téléchargement, prendre en charge les révisions et diagnostiquer les générations en échec. La base est l’exécution du contrat et nos intérêts légitimes en matière de sécurité et de qualité du service.",
    recipients:
      "Le stockage Supabase, Cloudmersive, OpenAI et Google Gemini selon le moteur d’IA sélectionné, et le personnel de production autorisé.",
    retention:
      "Les fichiers d’entrée et de sortie d’AI Studio sont disponibles pendant 30 jours. Les autres fichiers de projet sont conservés pour la livraison, les révisions convenues, l’assistance et toute conservation légale nécessaire, puis supprimés ou archivés sous contrôle d’accès.",
  },
  {
    activity: "Analyse d’audience, mesure publicitaire et relecture de session",
    data: "Pages vues, clics, navigation, informations sur l’appareil, identifiants de compte ou pseudonymes, données de campagne et enregistrements d’interactions masqués. Des identifiants de clic publicitaires peuvent être traités lorsque l’outil correspondant est activé.",
    purposeAndBasis:
      "Mesurer et améliorer le service, diagnostiquer les parcours difficiles, attribuer les campagnes et mesurer la publicité. Les outils facultatifs d’analyse navigateur, de publicité et de relecture reposent sur le consentement lorsque celui-ci est requis. Des événements de service limités côté serveur et des mesures de performance agrégées, sans cookies, peuvent reposer sur l’intérêt légitime lorsque cela est permis.",
    recipients:
      "Vercel Web Analytics et Speed Insights, PostHog, Google Analytics et Tag Manager, Sentry, ainsi que les prestataires publicitaires activés dans notre configuration de balises.",
    retention:
      "Selon la catégorie de consentement et la configuration des prestataires décrites dans la politique relative aux cookies. Vous pouvez retirer votre consentement facultatif à tout moment.",
  },
  {
    activity:
      "Assistance, réclamations, rétractation et demandes relatives à la vie privée",
    data: "Coordonnées, numéro de commande, contenu de la demande, justificatifs d’identité si nécessaire, correspondance, horodatages et issue de la demande.",
    purposeAndBasis:
      "Répondre, vérifier l’identité du demandeur, conserver la preuve de la demande et de notre réponse, et constater, exercer ou défendre des droits en justice. La base est l’exécution du contrat, les obligations légales et l’intérêt légitime à un traitement responsable des litiges.",
    recipients:
      "Notre équipe autorisée, les prestataires d’e-mail et d’hébergement, les conseillers juridiques, assureurs, prestataires de paiement, et les régulateurs ou tribunaux lorsque cela est requis.",
    retention:
      "Pendant la durée nécessaire au traitement de la demande et pendant le délai de réclamation ou de prescription applicable. La preuve d’une rétractation peut être conservée avec le dossier de la commande.",
  },
];

export default function PrivacyPolicyPage() {
  const euRepresentative = IMPRINT.euRepresentative;

  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Politique de confidentialité
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour : {formatDate(LAST_UPDATED)}
        </p>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/75">
          La présente politique explique comment {IMPRINT.shortName},
          exploitant de {SITE.name}, traite les données personnelles lorsque
          vous visitez le site, nous contactez, demandez un devis, passez
          commande, utilisez l’espace client ou AI Studio, ou exercez un droit
          légal. Elle s’adresse à un public international et s’applique
          parallèlement à toute loi impérative sur la protection de la vie
          privée en vigueur là où vous vous trouvez.
        </p>

        <Section title="1. Qui est responsable de vos données">
          <p>
            Le responsable du traitement est {IMPRINT.legalName},{" "}
            {IMPRINT.street}, {IMPRINT.postalCode} {IMPRINT.city},{" "}
            {IMPRINT.country}. Numéro d’immatriculation :{" "}
            {IMPRINT.registryNumber}. Identifiant fiscal : {IMPRINT.taxId}.
          </p>
          <p>
            Les questions et demandes relatives à la vie privée peuvent être
            adressées à{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            . Il s’agit de notre point de contact vie privée ; nous n’avons
            pas désigné de délégué à la protection des données, car nos
            traitements actuels ne l’exigent pas.
          </p>
          {/* TODO(legal-review): IMPRINT.euRepresentative is currently null. For a controller established outside the EU that targets people in France, an article 27 GDPR representative in the Union is likely mandatory — a lawyer should verify this, and the DPO assessment above, under RGPD/CNIL practice. */}
          {euRepresentative && (
            <p>
              Notre représentant dans l’Union européenne au titre de
              l’article 27 du RGPD est {euRepresentative.name},{" "}
              {euRepresentative.address}. Contact :{" "}
              <a
                href={`mailto:${euRepresentative.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {euRepresentative.email}
              </a>
              .
            </p>
          )}
        </Section>

        <Section title="2. D’où proviennent les données">
          <p>Nous recevons des données personnelles :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>directement de vous, via les formulaires, le paiement, l’espace client, les fichiers importés, les e-mails et les messages d’assistance ;</li>
            <li>automatiquement depuis votre navigateur, votre appareil et nos outils de sécurité et d’analyse ;</li>
            <li>des services que vous choisissez, notamment la connexion Google et PayPal ;</li>
            <li>d’un client, d’un collègue, d’un architecte, d’un agent ou d’une société qui vous associe à un projet ; et</li>
            <li>de sources publiques ou officielles utilisées pour vérifier des informations de société, fiscales, de TVA, de sanctions ou de paiement.</li>
          </ul>
          <p>
            Si nous recevons vos données d’un tiers, nous fournissons la
            présente information lors du premier contact approprié ou dans le
            délai requis par la loi applicable, sauf exception.
          </p>
        </Section>

        <Section title="3. Ce que nous traitons, pourquoi et pendant combien de temps">
          <p>
            Les fiches ci-dessous relient chaque activité à ses données, sa
            finalité, sa base légale, ses destinataires et sa règle de
            conservation. Plusieurs bases légales peuvent s’appliquer
            lorsqu’une activité sert des finalités distinctes.
          </p>
          <div className="mt-6 space-y-5">
            {PROCESSING_ACTIVITIES.map((entry) => (
              <ProcessingCard key={entry.activity} entry={entry} />
            ))}
          </div>
        </Section>

        <Section title="4. Quand les informations sont requises">
          <p>
            Les informations d’identité, de contact, de facturation, de
            commande, de paiement et de projet marquées comme requises sont
            nécessaires à la conclusion ou à l’exécution d’un contrat. Si vous
            ne les fournissez pas, nous pouvons être dans l’impossibilité de
            préparer un devis, d’accepter un paiement, d’émettre une facture ou
            de fournir le service. Les champs facultatifs, les cookies
            facultatifs et les choix marketing peuvent être refusés sans perdre
            l’accès au service principal.
          </p>
        </Section>

        <Section title="5. Fichiers de projet et informations concernant d’autres personnes">
          <p>
            Les plans, photographies, fichiers immobiliers et correspondances
            peuvent contenir des données personnelles concernant des occupants,
            propriétaires, salariés ou d’autres personnes. Ne partagez que ce
            dont le projet a besoin, supprimez les détails personnels inutiles
            et assurez-vous d’être autorisé à fournir les documents. Sauf
            nécessité et accord préalable avec nous, n’importez pas de
            documents d’identité, d’identifiants financiers, de données
            médicales ni d’autres informations sensibles.
          </p>
          <p>
            Nous n’utilisons pas les fichiers de projet privés de nos clients
            pour entraîner nos propres modèles d’IA à usage général. Lorsque
            vous choisissez un moteur AI Studio, les entrées sélectionnées et
            le prompt sont transmis à ce prestataire pour produire le résultat
            demandé, dans le cadre des conditions et des paramètres
            professionnels en vigueur pour notre compte.
          </p>
        </Section>

        <Section title="6. Partage et responsables de traitement indépendants">
          <p>
            Nous ne divulguons les données personnelles que dans la mesure
            nécessaire aux finalités ci-dessus : aux prestataires de services
            sous contrat, au personnel autorisé et aux partenaires de
            production, aux comptables et conseillers professionnels, aux
            prestataires de paiement et d’identité, et aux autorités publiques
            lorsque la loi l’exige. Les prestataires qui traitent des données
            pour notre compte doivent être liés par des engagements appropriés
            de confidentialité, de sécurité et de protection des données.
          </p>
          <p>
            PayPal, la connexion Google, les réseaux publicitaires, les
            autorités fiscales et certains conseillers professionnels peuvent
            agir en qualité de responsables de traitement indépendants pour
            leurs propres finalités. Leurs politiques de confidentialité
            s’appliquent à ces traitements distincts. En cas de
            réorganisation, de financement, de cession ou de fusion de
            l’entreprise, les données concernées peuvent être divulguées sous
            confidentialité et transférées avec l’activité concernée, sous
            réserve de la loi applicable.
          </p>
        </Section>

        <Section title="7. Transferts internationaux de données">
          <p>
            Nous sommes établis en Serbie et faisons appel à des prestataires
            en Serbie, dans l’Espace économique européen, au Royaume-Uni, aux
            États-Unis et dans d’autres pays. Vos données peuvent donc être
            traitées en dehors de votre pays. La Serbie ne fait actuellement
            pas l’objet d’une décision d’adéquation de l’UE.
          </p>
          <p>
            Lorsque les règles de transfert de l’EEE, du Royaume-Uni, de la
            Suisse, de la Serbie ou d’autres pays exigent un mécanisme, nous
            utilisons le mécanisme adapté au transfert, tel qu’une décision
            d’adéquation, des clauses contractuelles types approuvées, des
            garanties contractuelles et des mesures techniques ou
            organisationnelles supplémentaires. Vous pouvez demander à notre
            contact vie privée des informations sur la garantie applicable à
            vos données.
          </p>
        </Section>

        <Section title="8. Cookies et choix en matière de suivi">
          <p>
            Le stockage nécessaire prend en charge la connexion, la sécurité,
            le paiement et vos choix de confidentialité. Les outils facultatifs
            d’analyse navigateur, de mesure marketing et de relecture de
            session sont désactivés tant que le consentement correspondant n’a
            pas été donné, lorsque celui-ci est requis. Consultez la{" "}
            <Link
              href="/informations-legales/cookies"
              className="text-foreground underline-offset-4 hover:underline"
            >
              politique relative aux cookies
            </Link>{" "}
            ou ouvrez <ConsentSettingsLink className="underline-offset-4 hover:underline" />.
          </p>
          <p>
            Nous ne vendons pas d’informations personnelles contre
            rémunération. Les divulgations facultatives à des prestataires
            publicitaires peuvent être qualifiées de « partage », de publicité
            ciblée ou de publicité comportementale intercontextes au sens de
            certaines lois américaines sur la vie privée. Vous pouvez vous y
            opposer en laissant la catégorie Marketing désactivée ou en la
            retirant dans les paramètres des cookies.
          </p>
        </Section>

        <Section title="9. Sécurité">
          <p>
            Nous utilisons des contrôles d’accès, des permissions par rôle, le
            chiffrement des échanges, le hachage des mots de passe, l’analyse
            antivirus, la journalisation, des sauvegardes, des contrôles des
            fournisseurs et des procédures d’incident conçus pour protéger les
            données. Nos systèmes de management sont notamment certifiés
            ISO/IEC 27001:2022. Aucun système en ligne n’est sans risque ;
            utilisez donc un mot de passe robuste et contactez-nous rapidement
            si vous soupçonnez un accès non autorisé à votre compte.
          </p>
        </Section>

        <Section title="10. Vos droits en matière de vie privée">
          <p>
            Selon votre localisation et le traitement concerné, vous pouvez
            disposer du droit de connaître ou de consulter les données, d’en
            recevoir une copie, de les rectifier, de les supprimer, de limiter
            le traitement ou de vous y opposer, du droit à la portabilité, du
            droit de retirer votre consentement, de refuser la vente, le
            partage ou la publicité ciblée, de limiter certains usages de
            données sensibles, de faire appel d’un refus et de déposer une
            réclamation auprès d’un régulateur. Ces droits ne sont pas
            absolus ; nous pouvons par exemple conserver les données de
            facturation que la loi nous impose de garder.
          </p>
          <p>
            Écrivez à{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}?subject=Privacy%20request`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>{" "}
            en indiquant « Privacy request » en objet. Les titulaires d’un
            compte peuvent également exporter les données du compte ou demander
            leur suppression depuis le profil de l’espace client. Nous pouvons
            vérifier votre identité, votre habilitation et votre juridiction
            avant d’agir. Vous pouvez recourir à un mandataire autorisé lorsque
            la loi le permet. Nous n’exerçons aucune discrimination à
            l’encontre de quiconque exerce un droit relatif à la vie privée.
          </p>
        </Section>

        <Section title="11. Informations régionales">
          {/* TODO(legal-review): There is no France-specific entry in this regional list (the English build has none). A lawyer should verify whether the CNIL should be expressly named as the complaint authority for users in France, alongside or instead of the generic EEA entry. */}
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Serbie :</strong> les droits découlent de la loi serbe
              sur la protection des données personnelles. Vous pouvez adresser
              une réclamation au{" "}
              <ExternalLink href="https://www.poverenik.rs/en/">
                Commissaire à l’information d’importance publique et à la
                protection des données personnelles
              </ExternalLink>
              .
            </li>
            <li>
              <strong>EEE :</strong> les droits du RGPD décrits ci-dessus
              s’appliquent lorsque le RGPD couvre nos traitements. Vous pouvez
              adresser une réclamation à l’autorité du lieu où vous vivez,
              travaillez ou estimez qu’une violation s’est produite. Le{" "}
              <ExternalLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">
                CEPD publie la liste des autorités de contrôle nationales
              </ExternalLink>
              .
            </li>
            <li>
              <strong>Royaume-Uni :</strong> les droits du RGPD britannique
              s’appliquent lorsque le droit du Royaume-Uni couvre nos
              traitements. Les réclamations peuvent être adressées à
              l’<ExternalLink href="https://ico.org.uk/make-a-complaint/data-protection-complaints/">
                Information Commissioner’s Office
              </ExternalLink>
              .
            </li>
            <li>
              <strong>États-Unis :</strong> les résidents des États dotés de
              lois générales sur la vie privée peuvent formuler les demandes
              d’accès, de rectification, de suppression, de portabilité,
              d’opposition, de limitation ou d’appel prévues par leur loi.
              Notre contact vie privée est le canal de demande désigné. Nous ne
              vendons ni ne partageons sciemment les données de personnes de
              moins de 16 ans.
            </li>
            <li>
              <strong>Autres régions :</strong> si la loi sur la vie privée de
              votre pays vous confère un droit supplémentaire, contactez-nous
              en précisant votre pays. Nous appliquerons ce droit lorsque cette
              loi régit nos traitements.
            </li>
          </ul>
        </Section>

        <Section title="12. Enfants">
          {/* TODO(legal-review): The age threshold of 16 is carried over from the English build. In France the age of digital consent under the RGPD is 15 (loi Informatique et Libertés, art. 45) — a lawyer should verify whether the references to "under 16" here and in section 11 need adjusting for France. */}
          <p>
            Le service est destiné aux adultes et aux utilisateurs
            professionnels, non aux enfants. Nous ne créons pas sciemment de
            comptes pour des personnes de moins de 16 ans et ne collectons pas
            sciemment de données directement auprès d’elles. Un parent ou
            tuteur qui pense qu’un enfant a fourni des données doit nous
            contacter afin que nous puissions vérifier la situation et
            supprimer les données le cas échéant.
          </p>
        </Section>

        <Section title="13. Traitements automatisés">
          <p>
            Les outils d’IA génèrent des images à partir des instructions et
            des fichiers que vous choisissez, et les outils de sécurité peuvent
            signaler des requêtes ou fichiers suspects. Nous ne prenons pas de
            décisions fondées exclusivement sur un traitement automatisé
            produisant des effets juridiques ou des effets similaires
            significatifs à votre égard. PayPal et d’autres prestataires
            indépendants peuvent prendre leurs propres décisions en matière de
            fraude, d’identité ou de paiement conformément à leurs politiques.
          </p>
        </Section>

        <Section title="14. Modifications de la présente politique">
          <p>
            Nous mettons à jour la présente politique lorsque nos services, nos
            prestataires ou nos obligations légales évoluent. La date figurant
            en haut de page indique la dernière révision. Si une modification
            affecte substantiellement l’utilisation des données existantes,
            nous publierons un avis bien visible ou contacterons les
            utilisateurs concernés lorsque cela est requis.
          </p>
        </Section>
      </article>
      <FinalCta />
    </>
  );
}

function ProcessingCard({ entry }: { entry: ProcessingActivity }) {
  return (
    <section className="rounded-xl border border-border/60 bg-secondary/25 p-6">
      <h3 className="text-xl text-foreground">{entry.activity}</h3>
      <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-[150px_1fr]">
        <dt className="font-semibold text-foreground/80">Données</dt>
        <dd>{entry.data}</dd>
        <dt className="font-semibold text-foreground/80">Finalité et base</dt>
        <dd>{entry.purposeAndBasis}</dd>
        <dt className="font-semibold text-foreground/80">Destinataires</dt>
        <dd>{entry.recipients}</dd>
        <dt className="font-semibold text-foreground/80">Conservation</dt>
        <dd>{entry.retention}</dd>
      </dl>
    </section>
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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
