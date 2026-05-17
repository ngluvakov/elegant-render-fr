import type { Metadata } from "next";
import { QuickOrderHero } from "@/components/marketing/quick-order-hero";
import { PlatformPrinciples } from "@/components/marketing/platform-principles";
import { ModelFirst } from "@/components/marketing/model-first";
import { NextIteration } from "@/components/marketing/next-iteration";
import { FaqCards } from "@/components/marketing/faq-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { buildHomeJsonLd, createPublicMetadata, SEO } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Arhitektonska vizuelizacija",
  description: SEO.defaultDescription,
  twitterDescription: SEO.twitterDescription,
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
            title: "Arhitektonska vizuelizacija",
            text: "Realistični prikazi enterijera i eksterijera. Osnovna cena pokriva izradu modela, a svaki dodatni ugao ili prostorija košta znatno manje. Idealno za investitore i arhitekte.",
          },
          {
            title: "Virtuelno opremanje i renovacija",
            text: "Transformišite prazne ili zastarele prostore na osnovu fotografija. Prva slika pokriva dizajn, a svaka sledeća slika iste prostorije donosi uštedu do 33%.",
          },
          {
            title: "Interaktivni prikazi i osnove",
            text: "Od jasnih 2D/3D osnova do imerzivnih 360 tura. Naručite više usluga iz istog modela i ostvarite automatske popuste na celokupan projekat.",
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
