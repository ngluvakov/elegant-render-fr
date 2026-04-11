import { SectionKicker } from "@/components/brand/section-kicker";
import { HOW_IT_WORKS } from "@/lib/content/site";

export function HowItWorks() {
  return (
    <section className="border-y border-border/50 bg-secondary/30 py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionKicker align="center">Kako funkcioniše</SectionKicker>
          <h2 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">
            Četiri jasna koraka od ideje do prikaza
          </h2>
        </div>

        <ol className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <li
              key={item.step}
              className="relative flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {item.step}
              </span>
              <h3 className="text-xl text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/70">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
