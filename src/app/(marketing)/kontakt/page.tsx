import type { Metadata } from "next";
import { Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionKicker } from "@/components/brand/section-kicker";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Javite nam se. Pošaljite kratak opis projekta i vratićemo se obično istog radnog dana.",
  openGraph: {
    title: "Kontakt — Elegant Render",
    description:
      "Javite nam se. Pošaljite kratak opis projekta i vratićemo se obično istog radnog dana.",
    url: "/kontakt",
  },
};

export default function KontaktPage() {
  return (
    <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pb-24 pt-20 md:pt-28">
      <SectionKicker>Kontakt</SectionKicker>
      <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
        Javite nam se
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
        Opišite šta vam treba — prostor, obim i rok — i vraćamo se obično istog
        radnog dana sa jasnom ponudom.
      </p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <form className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Ime i prezime</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon (opciono)</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Opis projekta</Label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              placeholder="Tip prostora, broj prostorija, rok, stil koji vam se sviđa…"
              required
            />
          </div>
          <p className="text-xs text-foreground/55">
            Slanjem forme pristajete na obradu podataka u skladu sa našom
            Politikom privatnosti.
          </p>
          <Button type="submit" size="lg" disabled>
            Pošaljite (uskoro)
          </Button>
          <p className="text-xs text-foreground/50">
            Forma će biti aktivna nakon integracije sa Bitrix24 — u međuvremenu
            nam pišite direktno na {SITE.email}.
          </p>
        </form>

        <aside className="space-y-8 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Direktan kontakt
            </h2>
            <div className="mt-4 space-y-3">
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 text-foreground transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground transition-colors hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Šta da pošaljete
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/75">
              <li>Osnove prostora (2D ili PDF) ako postoje</li>
              <li>Fotografije postojećeg stanja</li>
              <li>Reference stila i atmosfere</li>
              <li>Okvirni obim i rok</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Iza brenda
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              {SITE.name} je deo {SITE.parentCompany} — krovnog poslovnog
              entiteta sa iskustvom u 3D vizuelizaciji i digitalnim
              arhitektonskim sadržajima.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
