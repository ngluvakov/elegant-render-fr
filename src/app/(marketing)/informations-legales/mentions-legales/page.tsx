import type { Metadata } from "next";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Mentions légales",
  description: `Informations légales concernant ${SITE.name} et White Rook DOO, y compris l’immatriculation de la société, les coordonnées et les informations relatives à la protection des données.`,
  path: "/informations-legales/mentions-legales",
});

const companyAddress = `${IMPRINT.street}, ${IMPRINT.postalCode} ${IMPRINT.city}, Serbie`;

export default function ImprintPage() {
  const euRepresentative = IMPRINT.euRepresentative;

  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Mentions légales
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
          Cette page identifie la société responsable de {SITE.name}. Elle est
          fournie à des fins de transparence et au titre des obligations
          d’information applicables à un service en ligne proposé à des
          clients.
        </p>
        {/* TODO(legal-review): French "mentions légales" requirements (LCEN, art. 6) — a lawyer should verify whether this page must additionally name a directeur de la publication, the hosting provider (name, address, phone), the share capital, and an intra-EU/French VAT number for a site aimed at the French market. The current content mirrors the English build and lists only the Serbian registry data. */}

        <dl className="mt-12 grid gap-x-8 gap-y-5 rounded-xl border border-border/60 bg-secondary/30 p-8 sm:grid-cols-[200px_1fr]">
          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Prestataire
          </dt>
          <dd className="text-base leading-relaxed text-foreground">
            {IMPRINT.legalName}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Nom commercial
          </dt>
          <dd className="text-base text-foreground">{IMPRINT.shortName}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Siège social
          </dt>
          <dd className="text-base text-foreground">{companyAddress}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Numéro d’immatriculation
          </dt>
          <dd className="font-mono text-base text-foreground">
            {IMPRINT.registryNumber}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Identifiant fiscal
          </dt>
          <dd className="font-mono text-base text-foreground">{IMPRINT.taxId}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Code d’activité
          </dt>
          <dd className="text-base text-foreground">
            {IMPRINT.activityCode} - activités spécialisées de design
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Date d’immatriculation
          </dt>
          <dd className="text-base text-foreground">
            {new Date(IMPRINT.foundedAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Contact général
          </dt>
          <dd className="text-base">
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Protection des données
          </dt>
          <dd className="text-base">
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
          </dd>
        </dl>

        <Section title="Contacts pour la protection des données">
          <p>
            Les questions et demandes relatives à la vie privée peuvent être
            adressées directement au responsable du traitement à l’adresse{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            .
          </p>
          {/* TODO(legal-review): IMPRINT.euRepresentative is currently null, so no EU representative is displayed. For a controller established outside the EU that offers services to people in France, an article 27 GDPR representative in the Union is likely mandatory — a lawyer should verify and, if required, one must be appointed and named here. */}
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

        <Section title="Registres publics et autorités de contrôle">
          <p>
            {IMPRINT.shortName} est immatriculée auprès de l’Agence serbe des
            registres du commerce. Les données publiques de la société peuvent
            être vérifiées en recherchant le numéro d’immatriculation dans{" "}
            <a
              href={`https://pretraga2.apr.gov.rs/unifiedentitysearch/Search/Details/${IMPRINT.registryNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              le registre de l’agence
            </a>
            .
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Agence serbe des registres du commerce - immatriculation des
              sociétés.
            </li>
            <li>
              Commissaire à l’information d’importance publique et à la
              protection des données personnelles - autorité serbe de
              protection des données.
            </li>
            <li>
              Les résidents de l’UE peuvent également contacter l’autorité de
              protection des données de l’État membre dans lequel ils vivent,
              travaillent ou estiment qu’un incident s’est produit.
            </li>
          </ul>
          {/* TODO(legal-review): For a site aimed at France, verify whether the CNIL should be expressly named here as the competent supervisory authority for users in France. */}
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
    <section className="mt-16">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}
