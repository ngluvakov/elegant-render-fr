import { SectionKicker } from "@/components/brand/section-kicker";
import { PLATFORM_PRINCIPLES } from "@/lib/content/site";

export function PlatformPrinciples() {
  return (
    <section id="principi" className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[1440px] px-6">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <SectionKicker>Cenovni interfejs</SectionKicker>
            <h2 className="text-4xl leading-tight text-foreground md:text-5xl">
              Umesto marketinških paketa, kupac vidi stvarni način obračuna po
              usluzi.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            Prvi nivo iskustva je servisna platforma: bira se usluga, zatim
            tačan tip obračuna, a ispod se prikazuju stvarne doplate koje menjaju
            ukupnu cenu projekta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_PRINCIPLES.map((principle) => (
            <article
              key={principle.title}
              className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
            >
              <p className="text-sm font-semibold text-foreground">
                {principle.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {principle.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
