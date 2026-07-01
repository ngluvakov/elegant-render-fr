import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import { PortfolioGallery } from "@/components/marketing/portfolio-gallery";
import { PORTFOLIO_TILES } from "@/lib/portfolio-gallery";
import { createPublicMetadata } from "@/lib/seo";
import { SITE_FEATURES } from "@/lib/site-features";

export const metadata: Metadata = createPublicMetadata({
  title: "Portfolio",
  description:
    "Izbor naših projekata — renderi enterijera i eksterijera, interaktivne 360 ture, arhitektonske animacije, virtuelno opremanje, virtuelna renovacija i 3D osnove.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  if (!SITE_FEATURES.portfolio) {
    notFound();
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <SectionKicker>Portfolio</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Izbor projekata koji pokazuju šta radimo
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Enterijeri, eksterijeri, interaktivne 360 ture i arhitektonske
          animacije. Kliknite na 360 prikaz da ga zavrtite mišem, ili na
          animaciju da je pustite — sve sa istim principom: topla atmosfera,
          čitljiv raspored i realan utisak prostora.
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
