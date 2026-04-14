import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default async function PortalPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-20 md:py-28">
      <SectionKicker>Portal</SectionKicker>
      <h1 className="mt-4 text-4xl text-foreground md:text-5xl">
        Dobrodošli, {user?.name?.split(" ")[0] || "korisniče"}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Ovde ćete moći da pratite vaše porudžbine, komunicirate sa timom i
        preuzimate gotove fajlove.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-lg font-semibold text-foreground">Porudžbine</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Još nemate aktivnih porudžbina. Sistem za naručivanje biće dostupan
            uskoro.
          </p>
          <div className="mt-4">
            <ButtonLink href="/cene" size="sm" variant="accent">
              Pogledajte cene
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-lg font-semibold text-foreground">Profil</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upravljajte svojim podacima — ime, telefon, lozinka.
          </p>
          <div className="mt-4">
            <ButtonLink href="/portal/profil" size="sm" variant="outline">
              Izmeni profil
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
          <h2 className="text-lg font-semibold text-foreground">Nalog</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {user?.email}
          </p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
