import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Politique relative aux cookies",
  description: `Cookies et technologies similaires utilisés par ${SITE.name}, y compris le stockage nécessaire, l’analyse d’audience, la mesure marketing, les outils de paiement et la relecture de session.`,
  path: "/legal/cookies",
});

type CookieEntry = {
  name: string;
  storage: string;
  provider: string;
  purpose: string;
  retention: string;
};

const NECESSARY_AND_FUNCTIONAL: CookieEntry[] = [
  {
    name: "authjs.session-token / __Secure-authjs.session-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Maintient la connexion d’un compte authentifié et protège les routes de l’espace client.",
    retention: "Jusqu’à la déconnexion ou l’expiration de la session ; normalement 30 jours au plus",
  },
  {
    name: "authjs.csrf-token / __Host-authjs.csrf-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Protège les requêtes d’authentification contre la falsification de requêtes intersites.",
    retention: "Session du navigateur ou expiration du flux d’authentification",
  },
  {
    name: "authjs.callback-url / __Secure-authjs.callback-url",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Vous ramène à la page souhaitée après l’authentification.",
    retention: "Session du navigateur ou expiration du flux d’authentification",
  },
  {
    name: "er-consent",
    storage: "localStorage",
    provider: "Elegant Render",
    purpose: "Enregistre les catégories que vous avez acceptées ou refusées ainsi que la date de la décision.",
    retention: "Jusqu’à ce que vous modifiiez votre choix ou effaciez le stockage du navigateur",
  },
  {
    name: "er-checkout-quote et er-checkout-withdrawal-waived-at",
    storage: "sessionStorage",
    provider: "Elegant Render",
    purpose: "Transporte le devis sélectionné et le choix de rétractation vers le paiement.",
    retention: "Session de l’onglet du navigateur ; effacé après le paiement lorsque cela est possible",
  },
  {
    name: "er-chat-* et er-chat-proposal",
    storage: "sessionStorage + localStorage",
    provider: "Elegant Render",
    purpose: "Conserve l’état du chat, un identifiant de session de chat pseudonyme et un devis proposé pendant votre navigation sur le site.",
    retention: "Messages et état de l’interface : session de l’onglet ; identifiant de session : jusqu’à l’effacement du stockage du navigateur",
  },
  {
    name: "Données de sécurité Turnstile (les noms peuvent varier)",
    storage: "Cookie + requête de script",
    provider: "Cloudflare",
    purpose: "Vérifie que les formulaires publics ne font pas l’objet d’abus automatisés lorsque Turnstile est activé.",
    retention: "Contrôlée par Cloudflare et limitée à la finalité de sécurité",
  },
  {
    name: "Cookies du SDK et du paiement PayPal",
    storage: "Cookie + requête de script",
    provider: "PayPal",
    purpose: "Fournit les contrôles de paiement, la prévention de la fraude, l’approbation et le suivi du statut du paiement après l’ouverture du paiement PayPal.",
    retention: "Contrôlée par PayPal ; varie selon le cookie, le compte et la source de financement",
  },
];

const ANALYTICS: CookieEntry[] = [
  {
    name: "Vercel Web Analytics et Speed Insights",
    storage: "Requête de mesure ; conçue pour fonctionner sans profil publicitaire intersites",
    provider: "Vercel",
    purpose: "Mesure l’utilisation agrégée des pages et les performances réelles des utilisateurs.",
    retention: "Selon la configuration du projet Vercel et les règles de conservation du prestataire",
  },
  {
    name: "ph_* et identifiants générés par le prestataire",
    storage: "Cookie + localStorage",
    provider: "PostHog",
    purpose: "Mesure l’utilisation du produit, les parcours et les tunnels de conversion après consentement à l’analyse.",
    retention: "Jusqu’à 12 mois, sauf suppression anticipée ou modification de la configuration du prestataire",
  },
  {
    name: "_ga et _ga_*",
    storage: "Cookie",
    provider: "Google Analytics 4",
    purpose: "Distingue les visites et mesure le trafic et l’utilisation des pages après consentement à l’analyse.",
    retention: "Jusqu’à 24 mois, sauf suppression anticipée ou modification de la configuration des balises",
  },
  {
    name: "Contexte d’erreurs et de performance Sentry",
    storage: "Requête de script + stockage de session du navigateur le cas échéant",
    provider: "Sentry (Functional Software, Inc.)",
    purpose: "Diagnostique les erreurs et les problèmes de performance du navigateur après consentement à l’analyse. Les journaux de sécurité et d’erreurs côté serveur peuvent aussi être traités indépendamment du consentement du navigateur lorsque cela est nécessaire.",
    retention: "Selon la configuration du projet Sentry et les besoins liés aux incidents",
  },
];

const MARKETING: CookieEntry[] = [
  {
    name: "Google Tag Manager",
    storage: "Script + dataLayer",
    provider: "Google",
    purpose: "Ne charge que les balises autorisées par vos choix d’analyse et de marketing. Tag Manager ne crée pas lui-même de profil publicitaire, mais les balises configurées en son sein peuvent utiliser des identifiants.",
    retention: "Pendant le chargement de la page ; la conservation des balises en aval est indiquée séparément",
  },
  {
    name: "Identifiants Google Ads et de conversion, y compris _gcl_* le cas échéant",
    storage: "Cookie + requête de script",
    provider: "Google",
    purpose: "Attribue les demandes et les commandes payées à la publicité et mesure la performance des campagnes après consentement marketing.",
    retention: "Dépend de la balise Google activée et de la configuration de la campagne",
  },
];

const RECORDING: CookieEntry[] = [
  {
    name: "Données d’enregistrement de session PostHog",
    storage: "Cookie + localStorage + requêtes d’enregistrement du navigateur",
    provider: "PostHog",
    purpose: "Enregistre des sessions d’interaction masquées ou caviardées afin d’identifier des problèmes d’ergonomie, après un consentement distinct à l’enregistrement.",
    retention: "Jusqu’à 12 mois, sauf suppression anticipée ou modification de la configuration du prestataire",
  },
  {
    name: "Données de session Sentry Replay",
    storage: "sessionStorage ou IndexedDB + requêtes d’enregistrement",
    provider: "Sentry (Functional Software, Inc.)",
    purpose: "Capture le contexte de relecture autour des erreurs techniques, après un consentement distinct à l’enregistrement.",
    retention: "Selon la configuration du projet Sentry Replay ; normalement 30 jours au plus",
  },
];

export default function CookiePolicyPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Politique relative aux cookies
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour : {formatDate(LAST_UPDATED)}
        </p>

        <Section title="1. Champ d’application">
          <p>
            La présente politique couvre les cookies et les technologies de
            navigateur similaires utilisés par
            {` ${SITE.name}`}, y compris localStorage, sessionStorage, les
            pixels, scripts, SDK, IndexedDB et les requêtes de mesure. Les noms
            peuvent varier selon le navigateur, le préfixe de domaine
            sécurisé, la version du prestataire et la configuration des
            balises ; les tableaux décrivent donc à la fois les noms connus et
            leurs fonctions.
          </p>
        </Section>

        <Section title="2. Vos choix">
          {/* TODO(legal-review): Verify this consent model against CNIL cookie guidance: parity between accept and refuse actions on the banner, the recommended consent re-collection interval (CNIL recommends 6 months, max 13 months), retention of consent/refusal proof, and whether any analytics tool is intended to rely on the CNIL audience-measurement exemption (art. 82 loi Informatique et Libertés) instead of consent. */}
          <p>
            Les technologies nécessaires prennent en charge un service que vous
            demandez, la sécurité, la connexion, le paiement et
            l’enregistrement de votre choix. Lorsque cela est permis, elles
            fonctionnent sans consentement. Les outils facultatifs d’analyse,
            de marketing et d’enregistrement de session sont contrôlés
            séparément et restent désactivés tant que vous n’avez pas donné
            votre accord, lorsque le consentement est requis.
          </p>
          <p>
            Rouvrez <ConsentSettingsLink className="underline-offset-4 hover:underline" />{" "}
            à tout moment. Le retrait du consentement met fin à toute nouvelle
            collecte facultative par le navigateur sur ce site, mais n’annule
            pas les traitements déjà effectués. Vous pouvez aussi effacer les
            données du site dans votre navigateur ; cela peut vous
            déconnecter, supprimer votre devis, effacer l’état du chat ou
            réinitialiser votre choix de consentement.
          </p>
        </Section>

        <CookieTable
          title="3. Technologies nécessaires et fonctionnelles"
          subtitle="Utilisées pour fournir les fonctionnalités que vous demandez, protéger les formulaires et les comptes, finaliser le paiement et mémoriser les choix de confidentialité. Les données PayPal et Turnstile ne sont déclenchées que lorsque la fonctionnalité correspondante est utilisée et configurée."
          rows={NECESSARY_AND_FUNCTIONAL}
        />

        <CookieTable
          title="4. Analyse d’audience et performance"
          subtitle="Outils d’analyse et de performance du navigateur soumis au consentement lorsque celui-ci est requis. Des journaux limités côté serveur et des mesures agrégées, sans cookies, peuvent fonctionner à des fins de sécurité et de fiabilité lorsque la loi le permet."
          rows={ANALYTICS}
        />

        <CookieTable
          title="5. Mesure marketing"
          subtitle="Utilisée uniquement après consentement marketing et uniquement lorsque la balise concernée est configurée. Le suivi LinkedIn n’est actuellement pas actif dans le code de production couvert par la présente politique."
          rows={MARKETING}
        />

        <CookieTable
          title="6. Enregistrement de session"
          subtitle="Utilisé uniquement après un consentement distinct à l’enregistrement de session. Les configurations d’enregistrement sont conçues pour masquer les champs sensibles, mais évitez néanmoins de saisir des informations sensibles inutiles."
          rows={RECORDING}
        />

        <Section title="7. Signaux de confidentialité du navigateur">
          <p>
            Vous pouvez toujours utiliser nos paramètres de cookies pour
            refuser le suivi facultatif. Certains navigateurs envoient
            également le signal Global Privacy Control ou d’autres signaux de
            préférence. Lorsqu’un signal crée un refus juridiquement
            contraignant et que notre technologie peut le reconnaître, nous le
            traitons comme un refus de la vente, du partage et de la publicité
            ciblée. Les signaux « Do Not Track » des navigateurs n’ont pas de
            signification juridique ou technique unique ; les paramètres de
            cookies restent donc le contrôle fiable sur ce site.
          </p>
        </Section>

        <Section title="8. Plus d’informations">
          <p>
            La{" "}
            <Link
              href="/legal/privacy"
              className="text-foreground underline-offset-4 hover:underline"
            >
              politique de confidentialité
            </Link>{" "}
            explique les données personnelles, les bases légales, les
            destinataires, les transferts internationaux, les règles de
            conservation et les droits liés à ces outils. Vos questions peuvent
            être envoyées à{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
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

function CookieTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: CookieEntry[];
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        {subtitle}
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-secondary/60 text-foreground/80">
            <tr>
              <th className="px-3 py-3">Nom</th>
              <th className="px-3 py-3">Stockage</th>
              <th className="px-3 py-3">Prestataire</th>
              <th className="px-3 py-3">Finalité</th>
              <th className="px-3 py-3">Conservation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground/70">
            {rows.map((row) => (
              <tr key={`${row.provider}-${row.name}`} className="align-top">
                <td className="px-3 py-3 font-mono text-xs text-foreground/85">
                  {row.name}
                </td>
                <td className="px-3 py-3">{row.storage}</td>
                <td className="px-3 py-3">{row.provider}</td>
                <td className="px-3 py-3">{row.purpose}</td>
                <td className="px-3 py-3">{row.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
