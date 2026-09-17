import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Informations légales",
  description: `Informations sur la société, la confidentialité, les cookies, les droits des consommateurs, la livraison, les remboursements, les réclamations et les certifications pour ${SITE.name}.`,
  path: "/informations-legales",
});

const LEGAL_PAGES = [
  {
    href: "/informations-legales/mentions-legales",
    title: "Mentions légales",
    description: "Le prestataire, les informations d’immatriculation de la société, les coordonnées et les autorités de contrôle.",
  },
  {
    href: "/informations-legales/cgv",
    title: "Conditions générales de vente (CGV)",
    description: "Les conditions contractuelles applicables aux devis, commandes, livrables numériques, comptes, paiements et licences.",
  },
  {
    href: "/informations-legales/confidentialite",
    title: "Politique de confidentialité",
    description: "Quelles données personnelles nous traitons, pourquoi, où elles vont, combien de temps elles sont conservées, et vos droits régionaux.",
  },
  {
    href: "/informations-legales/cookies",
    title: "Politique relative aux cookies",
    description: "L’inventaire actuel du stockage navigateur, des outils d’analyse, de mesure publicitaire et de relecture de session.",
  },
  {
    href: "/informations-legales/retractation",
    title: "Droit de rétractation",
    description: "Informations sur la rétractation pour les consommateurs de l’UE et de l’EEE, le modèle d’avis et la fonction de rétractation en ligne.",
  },
  {
    href: "/informations-legales/remboursements",
    title: "Remboursements",
    description: "Le traitement des remboursements avant et après production, les délais des prestataires de paiement et les recours impératifs des consommateurs.",
  },
  {
    href: "/informations-legales/reclamations",
    title: "Procédure de réclamation",
    description: "Comment déposer une réclamation, comment exercer un recours et quelles informations nous aident à la résoudre.",
  },
  {
    href: "/informations-legales/livraison",
    title: "Livraison numérique",
    description: "Canaux de livraison, délais, formats, accès et marche à suivre en cas de retard de livraison.",
  },
  {
    href: "/informations-legales/certificats",
    title: "Certificats et normes",
    description: "Nos certifications ISO 9001, ISO/IEC 27001 et ISO 50001 et les documents de vérification.",
  },
] as const;

export default function LegalIndexPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-5xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Informations légales
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70">
          Informations sur la société, conditions de service, informations de
          confidentialité et droits des consommateurs pour {SITE.name}. Les
          droits impératifs en vigueur dans votre pays s’appliquent même
          lorsqu’une politique ci-dessous prévoit une règle contractuelle plus
          restrictive.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {LEGAL_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-xl border border-border/60 bg-secondary/25 p-6 transition-colors hover:border-foreground/25 hover:bg-secondary/45"
            >
              <h2 className="text-2xl text-foreground group-hover:underline group-hover:underline-offset-4">
                {page.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </article>
      <FinalCta />
    </>
  );
}
