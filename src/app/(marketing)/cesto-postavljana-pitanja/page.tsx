import type { Metadata } from "next";
import { SectionKicker } from "@/components/brand/section-kicker";
import { JsonLd } from "@/components/seo/json-ld";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import {
  AI_STUDIO_FAQS,
  FAQ_ITEMS,
  SERVICES_PAGE_FAQS,
  SITE,
} from "@/lib/content/site";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

const FAQ_DESCRIPTION =
  "Odgovori na najčešća pitanja o arhitektonskoj vizuelizaciji, cenama, rokovima, materijalima, revizijama i AI obradi fotografija nekretnina.";

type FaqItem = { question: string; answer: string };
type FaqGroup = { title: string; items: readonly FaqItem[] };

const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    title: "Opšta pitanja",
    items: FAQ_ITEMS,
  },
  {
    title: "Usluge i cene",
    items: SERVICES_PAGE_FAQS,
  },
  {
    title: "AI Studio",
    items: AI_STUDIO_FAQS,
  },
];

const ALL_FAQS: FaqItem[] = FAQ_GROUPS.flatMap((group) => [...group.items]);

export const metadata: Metadata = createPublicMetadata({
  title: "Često postavljana pitanja",
  description: FAQ_DESCRIPTION,
  path: "/cesto-postavljana-pitanja",
});

export default function CestoPostavljanaPitanjaPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/cesto-postavljana-pitanja",
            name: `Često postavljana pitanja — ${SITE.name}`,
            description: FAQ_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            {
              name: "Često postavljana pitanja",
              path: "/cesto-postavljana-pitanja",
            },
          ]),
          buildFaqJsonLd(ALL_FAQS),
        ]}
      />
      <main className="mx-auto w-full max-w-[min(96vw,1180px)] px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pitanja</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Često postavljana pitanja
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Kratki, konkretni odgovori o procesu, rokovima, cenama, potrebnim
          materijalima i AI obradi fotografija nekretnina.
        </p>

        <div className="mt-14 space-y-12">
          {FAQ_GROUPS.map((group) => (
            <section key={group.title} className="scroll-mt-24">
              <h2 className="text-3xl leading-tight text-foreground md:text-4xl">
                {group.title}
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {group.items.map((item) => (
                  <article
                    key={item.question}
                    className="rounded-xl border border-border/70 bg-card/80 p-6 shadow-[0_14px_40px_rgba(28,26,25,0.04)]"
                  >
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.question}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <PreFooterCta
        heading="Ostalo je još pitanja — ili si spreman?"
        body="Ako odgovor nisi pronašao, otvori kalkulator i složi varijantu sam, ili pošalji brzi upit i vraćamo se istog radnog dana."
      />
    </>
  );
}
