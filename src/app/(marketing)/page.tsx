import type { Metadata } from "next";
import { QuickOrderHero } from "@/components/marketing/quick-order-hero";
import { PlatformPrinciples } from "@/components/marketing/platform-principles";
import { ModelFirst } from "@/components/marketing/model-first";
import { NextIteration } from "@/components/marketing/next-iteration";
import { FaqCards } from "@/components/marketing/faq-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE } from "@/lib/content/site";
import { buildHomeJsonLd, createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Arhitektonska vizuelizacija",
  description: SITE.description,
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={buildHomeJsonLd()} />
      <QuickOrderHero />
      <SearchIntentSection />
      <PlatformPrinciples />
      <ModelFirst />
      <NextIteration />
      <FaqCards />
    </>
  );
}

function SearchIntentSection() {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto grid w-full max-w-[min(96vw,1720px)] gap-6 px-6 md:grid-cols-3">
        {[
          {
            title: "Render enterijera i eksterijera",
            text: "Za stanove, kuće, lokale i manje investitorske projekte kojima treba realističan prikaz pre uređenja, prodaje ili izgradnje.",
          },
          {
            title: "Virtuelno opremanje i renovacija",
            text: "Za postojeće fotografije nekretnina: prazne prostorije, zastareli enterijeri, uklanjanje nereda i bolji prvi utisak u oglasu.",
          },
          {
            title: "3D osnove, 360 ture i AI obrada",
            text: "Za kupce koji moraju brzo da razumeju raspored, kretanje kroz prostor ili potencijal fotografije bez velikog produkcionog procesa.",
          },
        ].map((item) => (
          <article key={item.title} className="border-t border-border/70 pt-5">
            <h2 className="text-xl font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {item.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
