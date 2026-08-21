import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/marketing/final-cta";
import { PortfolioGallery } from "@/components/marketing/portfolio-gallery";
import { PORTFOLIO_TILES } from "@/lib/portfolio-gallery";
import { createPublicMetadata } from "@/lib/seo";
import { SITE_FEATURES } from "@/lib/site-features";

export const metadata: Metadata = createPublicMetadata({
  title: "Portfolio",
  description:
    "Une sélection de nos projets — rendus d’intérieur et d’extérieur, visites virtuelles 360° interactives, animations architecturales, home staging virtuel, rénovation virtuelle et plans 3D.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  if (!SITE_FEATURES.portfolio) {
    notFound();
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <p className="section-kicker">Portfolio</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Une sélection de projets qui montrent ce que nous faisons
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Intérieurs, extérieurs, visites virtuelles 360° interactives et
          animations architecturales. Cliquez sur une vue 360° pour la faire
          pivoter à la souris, ou sur une animation pour la lancer — le tout
          repose sur le même principe : une atmosphère chaleureuse, une
          composition lisible et une impression réaliste de l’espace.
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <PortfolioGallery tiles={PORTFOLIO_TILES} />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
