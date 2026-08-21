import type { Metadata } from "next";
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
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

const FAQ_DESCRIPTION =
  "Réponses aux questions les plus fréquentes sur la visualisation architecturale, les tarifs, les délais, les documents à fournir, les séries de révisions et la retouche photo immobilière par IA.";

type FaqItem = { question: string; answer: string };
type FaqGroup = { title: string; items: readonly FaqItem[] };

const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    title: "Questions générales",
    items: FAQ_ITEMS,
  },
  {
    title: "Services et tarifs",
    items: SERVICES_PAGE_FAQS,
  },
  {
    title: "AI Studio",
    items: AI_STUDIO_FAQS,
  },
];

export const metadata: Metadata = createPublicMetadata({
  title: "Questions fréquentes",
  description: FAQ_DESCRIPTION,
  path: "/faq",
});

export default async function FaqPage() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;
  const formatAnswer = (answer: string) =>
    formatPublicPriceText(answer, displayCurrency, pricingSettings);
  const faqGroups = FAQ_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      answer: formatAnswer(item.answer),
    })),
  }));
  const allFaqs = faqGroups.flatMap((group) => group.items);

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/faq",
            name: `Questions fréquentes — ${SITE.name}`,
            description: FAQ_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            {
              name: "Questions fréquentes",
              path: "/faq",
            },
          ]),
          buildFaqJsonLd(allFaqs),
        ]}
      />
      <main className="mx-auto w-full max-w-[min(96vw,1180px)] px-6 pb-24 pt-20 md:pt-28">
        <p className="section-kicker">Questions</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Questions fréquentes
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Des réponses courtes et concrètes sur le processus, les délais, les
          tarifs, les documents à fournir et la retouche photo immobilière
          par IA.
        </p>

        <div className="mt-14 space-y-14">
          {faqGroups.map((group) => (
            <section key={group.title} className="scroll-mt-24">
              <h2 className="text-3xl leading-tight text-foreground md:text-4xl">
                {group.title}
              </h2>
              <div className="mt-4 flex flex-col">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    className="group border-b border-border py-1"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[18px] text-[17px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        aria-hidden
                        className="font-mono font-normal text-muted-foreground group-open:hidden"
                      >
                        +
                      </span>
                      <span
                        aria-hidden
                        className="hidden font-mono font-normal text-muted-foreground group-open:inline"
                      >
                        −
                      </span>
                    </summary>
                    <p className="max-w-[640px] pb-5 text-[15px] leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <PreFooterCta
        heading="Encore des questions — ou prêt à vous lancer ?"
        body="Si vous n’avez pas trouvé votre réponse, ouvrez le calculateur et composez vous-même votre configuration, ou envoyez une demande rapide — nous répondons le jour même (jour ouvré)."
      />
    </>
  );
}
