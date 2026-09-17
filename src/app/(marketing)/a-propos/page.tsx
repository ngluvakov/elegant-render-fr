import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import { JsonLd } from "@/components/seo/json-ld";
import {
  CERTIFIER,
  ISO_CERTIFICATIONS,
  SITE,
  buildOrganizationJsonLd,
} from "@/lib/content/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

const ABOUT_DESCRIPTION = `${SITE.name} est la sous-marque B2C de ${SITE.parentCompany} dédiée à la visualisation architecturale — avec des prix transparents et un processus rapide.`;

export const metadata: Metadata = createPublicMetadata({
  title: "À propos",
  description: ABOUT_DESCRIPTION,
  path: "/a-propos",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/a-propos",
            name: `À propos — ${SITE.name}`,
            description: ABOUT_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "À propos", path: "/a-propos" },
          ]),
          buildOrganizationJsonLd(),
        ]}
      />
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <p className="section-kicker">À propos</p>
        <h1 className="mt-4 text-5xl leading-[1.05] text-foreground md:text-6xl">
          La visualisation architecturale à visage humain
        </h1>

        <div className="mt-12 space-y-6 text-lg leading-relaxed text-foreground/80">
          <p>
            <strong>{SITE.name}</strong> est une sous-marque dédiée de{" "}
            <strong>{SITE.parentCompany}</strong>, créée avec un objectif
            clair : rendre la visualisation architecturale plus accessible,
            plus compréhensible et plus transparente pour le grand public.
          </p>
          <p>
            Contrairement aux studios traditionnels qui communiquent surtout
            par portfolios et offres individuelles, Elegant Render fonde la
            confiance sur trois promesses clés : <strong>un prix clair</strong>,{" "}
            <strong>une livraison rapide</strong> et{" "}
            <strong>un travail artisanal de qualité professionnelle</strong>.
          </p>
          <p>
            Nous n’avons jamais été conçus comme un studio élitiste réservé à
            un cercle restreint d’investisseurs, mais comme un service
            organisé, soigné visuellement et aux tarifs clairs — pour celles
            et ceux qui veulent voir leur espace sous son meilleur jour, et
            plus clairement, avant de l’aménager, de le vendre ou de le
            rénover.
          </p>
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">
            Au sein du système {SITE.parentCompany}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {SITE.parentCompany} est l’entité faîtière et le socle
            professionnel, avec une expérience en visualisation 3D et en
            contenus architecturaux numériques. Elegant Render en est le canal
            grand public, plus accessible et plus direct pour les clients
            finaux — chaque projet est réalisé par la même équipe, selon les
            mêmes standards de qualité.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">Certificats et normes</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <p className="text-base leading-relaxed text-foreground/75">
              Notre processus repose sur trois normes ISO internationales,
              certifiées par <strong>{CERTIFIER.name}</strong> —{" "}
              {ISO_CERTIFICATIONS.map((cert, idx) => (
                <span key={cert.id}>
                  <strong>{cert.code}</strong> ({cert.domain.toLowerCase()})
                  {idx < ISO_CERTIFICATIONS.length - 1
                    ? idx === ISO_CERTIFICATIONS.length - 2
                      ? " et "
                      : ", "
                    : ""}
                </span>
              ))}
              . En savoir plus sur chaque norme et sur {CERTIFIER.name} :{" "}
              <Link
                href="/informations-legales/certificats"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Voir les certificats →
              </Link>
            </p>
            <Link
              href="/informations-legales/certificats"
              aria-label={`Certificat ${CERTIFIER.name} — voir les détails`}
              className="self-center justify-self-center transition-opacity duration-200 hover:opacity-90 md:self-start md:justify-self-end"
            >
              <Image
                src={CERTIFIER.badgeAsset.src}
                alt={CERTIFIER.badgeAsset.alt}
                width={CERTIFIER.badgeAsset.width}
                height={CERTIFIER.badgeAsset.height}
                sizes="(max-width: 768px) 60vw, 200px"
                className="h-auto w-[200px] max-w-full"
              />
            </Link>
          </div>
        </div>
      </article>
      <PreFooterCta />
    </>
  );
}
