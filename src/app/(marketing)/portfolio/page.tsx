import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import { createPublicMetadata } from "@/lib/seo";
import { SITE_FEATURES } from "@/lib/site-features";

export const metadata: Metadata = createPublicMetadata({
  title: "Portfolio",
  description:
    "Izbor naših projekata — renderi enterijera i eksterijera, 360 ture, virtuelno opremanje, virtuelna renovacija, 3D osnove i adaptacije prostora.",
  path: "/portfolio",
});

type Group = { label: string; items: { src: string; alt: string }[] };

/** Four numbered variants (…-01..-04) under one category label. */
const group = (label: string, base: string): Group => ({
  label,
  items: Array.from({ length: 4 }, (_, i) => ({
    src: `/artwork/${base}-0${i + 1}.webp`,
    alt: `${label} — primer ${i + 1}, Elegant Render`,
  })),
});

const GROUPS: Group[] = [
  group("Renderi enterijera", "portfolio-interior-static"),
  group("360 ture enterijera", "portfolio-interior-360"),
  group("360 ture eksterijera", "portfolio-360-eksterijer"),
  group("Renderi iz vazduha", "portfolio-aerial"),
  group("3D prikaz ulice", "portfolio-streetscape"),
  group("Uređenje pejzaža", "portfolio-prikazi-dvorista"),
  group("Render u fotografiji lokacije", "portfolio-fotomontaza"),
  group("Dnevni u noćni prikaz", "portfolio-dan-u-noc"),
  group("3D situacioni plan", "portfolio-3d-situacioni"),
  group("Osnove prostora", "portfolio-osnove"),
  group("Virtuelno opremanje", "portfolio-virtuelno-opremanje"),
  group("Virtuelna renovacija", "portfolio-virtuelna-renovacija"),
  group("Uklanjanje predmeta", "portfolio-uklanjanje-elemenata"),
  {
    label: "3D osnove",
    items: [
      {
        src: "/artwork/portfolio-3d-osnove-jednosoban-stan.webp",
        alt: "3D osnova jednosobnog stana, Elegant Render",
      },
      {
        src: "/artwork/portfolio-3d-osnove-jednosoban-otvoreni-koncept.webp",
        alt: "3D osnova jednosobnog stana otvorenog koncepta, Elegant Render",
      },
      {
        src: "/artwork/portfolio-3d-osnove-dupleks-dva-nivoa.webp",
        alt: "3D osnova dupleksa na dva nivoa, Elegant Render",
      },
      {
        src: "/artwork/portfolio-3d-osnove-kuca-sa-garazom.webp",
        alt: "3D osnova kuće sa garažom, Elegant Render",
      },
    ],
  },
];

// Interleave one image from each category per round so the grid mixes
// categories instead of showing four near-identical frames in a row.
const ITEMS = Array.from({ length: 4 }).flatMap((_, round) =>
  GROUPS.map((g) => ({ ...g.items[round], label: g.label })),
);

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
          Enterijeri, eksterijeri, 360 ture, virtuelno opremanje, renovacija i
          osnove prostora — svi sa istim principom: topla atmosfera, čitljiv
          raspored i realan utisak prostora.
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((item) => (
              <figure
                key={item.src}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-secondary"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent px-3 pb-2.5 pt-10 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-background/95 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
