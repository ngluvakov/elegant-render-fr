/**
 * PlatformPrinciples — the four-step ordering process per the design
 * handoff Process section: mono eyebrow + display heading, then four
 * columns with a 2px near-black border-top, mono step index, title and
 * text. Copy is final English from docs/design-handoff/README.md.
 *
 * Used on: / (home page).
 */
import { PLATFORM_PRINCIPLES } from "@/lib/content/site";

export function PlatformPrinciples() {
  return (
    <section id="process" className="bg-background">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20 sm:px-12 md:py-32">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-[680px]">
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              A clear ordering process
            </p>
            <h2 className="text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.02em] text-foreground md:text-[44px]">
              From estimate to final files — no guessing what happens next.
            </h2>
          </div>
          <p className="max-w-[400px] text-[15px] leading-relaxed text-muted-foreground">
            The calculator makes the decision easy. What follows stays short:
            materials, first drafts, revisions and delivery through your
            portal.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {PLATFORM_PRINCIPLES.map((principle, index) => (
            <article
              key={principle.title}
              className="border-t-2 border-[#111111] pt-5"
            >
              <p className="mb-2.5 font-mono text-xs tracking-[0.08em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mb-2.5 text-lg font-medium text-foreground">
                {principle.title.replace(/^\d+\.\s*/, "")}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {principle.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
