import { ButtonLink } from "@/components/ui/button-link";

export function FinalCta() {
  return (
    <section className="py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="rounded-2xl bg-foreground px-8 py-20 text-center text-background md:px-16">
          <h2 className="mx-auto max-w-2xl text-4xl leading-tight md:text-5xl">
            Pošaljite nam prostor — vratimo vam jasan prikaz.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/75">
            Ručno izrađeni renderi sa jasnim cenama i brzim procesom. Obično se
            javljamo istog radnog dana.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/kontakt" size="xl" variant="secondary">
              Pošaljite projekat
            </ButtonLink>
            <ButtonLink
              href="/cene"
              size="xl"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              Pogledajte cenovnik
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
