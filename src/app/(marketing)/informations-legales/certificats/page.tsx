import type { Metadata } from "next";
import Image from "next/image";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import {
  CERTIFIER,
  ISO_CERTIFICATIONS,
  SITE,
} from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const CERTIFICATES_DESCRIPTION = `${SITE.name} travaille selon les normes ISO 9001:2015, ISO/IEC 27001:2022 et ISO 50001:2018, certifiées par ${CERTIFIER.name}.`;

const CERTIFICATE_COPY: Record<string, { domain: string; description: string }> = {
  "iso-9001": {
    domain: "Management de la qualité",
    description:
      "La norme ISO 9001:2015 couvre le management de la qualité pour la fourniture de services. Elle soutient un flux de travail cohérent, de la réception des fichiers de projet aux cycles de révision et à la livraison des rendus finaux.",
  },
  "iso-27001": {
    domain: "Sécurité de l’information",
    description:
      "La norme ISO/IEC 27001:2022 couvre le management de la sécurité de l’information. Elle soutient le contrôle des accès, la gestion des incidents, les procédures de conservation et le traitement sécurisé des fichiers des clients.",
  },
  "iso-50001": {
    domain: "Management de l’énergie",
    description:
      "La norme ISO 50001:2018 couvre le management de l’énergie. Elle soutient des améliorations mesurées et documentées de la consommation d’énergie dans la production et les opérations.",
  },
};

export const metadata: Metadata = createPublicMetadata({
  title: "Certificats et normes",
  description: CERTIFICATES_DESCRIPTION,
  path: "/informations-legales/certificats",
});

export default function CertificatesPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Certificats et normes
        </h1>

        <div className="mt-10 flex justify-center rounded-2xl border border-border/60 bg-card/60 p-6 md:p-10">
          <Image
            src={CERTIFIER.badgeAsset.src}
            alt={CERTIFIER.badgeAsset.alt}
            width={CERTIFIER.badgeAsset.width}
            height={CERTIFIER.badgeAsset.height}
            sizes="(max-width: 768px) 90vw, 520px"
            className="h-auto w-full max-w-[520px]"
            priority
          />
        </div>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-foreground/75">
          <p>
            {SITE.name} travaille selon trois normes ISO internationales
            certifiées par <strong>{CERTIFIER.name}</strong>. Elles couvrent la
            qualité de la fourniture, la sécurité de l’information et le
            management de l’énergie.
          </p>
          <p className="text-sm text-foreground/65">
            Le certificat combiné porte l’identifiant{" "}
            <strong className="text-foreground/85">9000025319</strong>. Le
            document original est disponible{" "}
            <a
              href={CERTIFIER.badgeAsset.pdfSrc}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              au format PDF
            </a>
            .
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {ISO_CERTIFICATIONS.map((cert) => {
            const copy = CERTIFICATE_COPY[cert.id];
            return (
              <div
                key={cert.id}
                className="rounded-xl border border-border/60 bg-secondary/30 p-8"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {copy.domain}
                </p>
                <h2 className="mt-3 text-2xl text-foreground md:text-3xl">
                  {cert.code}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-foreground/75">
                  {copy.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/60">
                  <span>
                    Délivré par :{" "}
                    <strong className="text-foreground/80">
                      {CERTIFIER.name}
                    </strong>
                  </span>
                  {cert.certNumber && (
                    <span className="text-foreground/55">
                      Numéro de certificat : {cert.certNumber}
                    </span>
                  )}
                  {cert.verifyUrl && (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      Vérifier le certificat
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">
            À propos de l’organisme de certification
          </h2>
          <p className="mt-2 text-sm text-foreground/55">
            Organisme international de certification et d’audit
          </p>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {CERTIFIER.name} est un organisme de certification international.
            Ses certificats reposent sur des audits indépendants et des
            systèmes de management suivis dans la durée, et non sur une
            déclaration ponctuelle.
          </p>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
