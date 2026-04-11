import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FAQ_ITEMS } from "@/lib/content/site";

export function Faq() {
  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="text-center">
          <SectionKicker align="center">Česta pitanja</SectionKicker>
          <h2 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">
            Ako nešto nije jasno, verovatno je ovde
          </h2>
        </div>
        <Accordion className="mt-12 w-full" defaultValue={["item-0"]}>
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-foreground/75">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
