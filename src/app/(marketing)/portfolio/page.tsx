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
    "A selection of our projects — interior and exterior renders, interactive 360° virtual tours, architectural animations, virtual staging, virtual renovation and 3D floor plans.",
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
          A selection of projects that show what we do
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Interiors, exteriors, interactive 360° virtual tours and
          architectural animations. Click a 360° view to spin it with your
          mouse, or an animation to play it — all built on the same principle:
          a warm atmosphere, a legible layout and a realistic impression of
          the space.
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
