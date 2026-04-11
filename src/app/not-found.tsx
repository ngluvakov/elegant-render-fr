import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
        404
      </p>
      <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
        Stranica nije pronađena
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70">
        Izgleda da link koji ste otvorili više ne postoji ili je premešten.
        Vratite se na početnu ili pogledajte sve usluge.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Na početnu
        </ButtonLink>
        <ButtonLink href="/usluge" size="lg" variant="outline">
          Pogledaj usluge
        </ButtonLink>
      </div>
    </main>
  );
}
