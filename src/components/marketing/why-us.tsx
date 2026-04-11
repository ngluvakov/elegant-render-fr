import { WHY_US } from "@/lib/content/site";

export function WhyUs() {
  return (
    <section className="border-y border-border/50 bg-secondary/30 py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
            Zašto Elegant Render
          </p>
          <h2 className="mt-4 text-4xl leading-tight text-foreground md:text-5xl">
            Tri razloga zbog kojih klijenti biraju nas
          </h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {WHY_US.map((item) => (
            <div key={item.title} className="flex flex-col gap-3">
              <h3 className="text-xl text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
