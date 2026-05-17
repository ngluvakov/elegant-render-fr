import type { Metadata } from "next";
import { Mail, KeyRound, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ProfileForm } from "./profile-form";
import { PrivacyActions } from "./privacy-actions";

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Uredite profil, nalog, način prijave i podatke koje koristite na Elegant Render portalu.",
  robots: { index: false, follow: false },
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  credentials: "Email i lozinka",
};

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      billingBuyerType: true,
      billingCountryCode: true,
      billingCompanyName: true,
      billingCompanyTaxId: true,
      billingCompanyMb: true,
      billingCompanyAddress: true,
      deletionRequestedAt: true,
      accounts: {
        select: { provider: true, providerAccountId: true },
        orderBy: { provider: "asc" },
      },
    },
  });

  if (!user) return null;

  const hasPassword = Boolean(user.passwordHash);
  const linkedProviders = user.accounts.map((a) => a.provider);
  const hasCredentials = hasPassword;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-20 md:py-28">
      <SectionKicker>Profil</SectionKicker>
      <h1 className="mt-4 text-3xl text-foreground md:text-4xl">
        Vaši podaci
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ažurirajte ime, telefon ili lozinku.
      </p>

      <ProfileForm
        defaultName={user.name ?? ""}
        defaultEmail={user.email}
        defaultPhone={user.phone ?? ""}
        hasPassword={hasPassword}
        defaultBilling={{
          buyerType: user.billingBuyerType,
          countryCode: user.billingCountryCode ?? "RS",
          companyName: user.billingCompanyName ?? "",
          companyTaxId: user.billingCompanyTaxId ?? "",
          companyMb: user.billingCompanyMb ?? "",
          companyAddress: user.billingCompanyAddress ?? "",
        }}
      />

      {/* Auth methods. Defensive surfacing — lets the customer
          confirm the email they expect is on the account, and which
          providers can sign them in. Footgun coverage for the
          Auth.js account-linking edge cases. */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold text-foreground">
          Načini prijave
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Email vezan za nalog: <strong>{user.email}</strong>. Sledeći
          načini su omogućeni za vašu prijavu:
        </p>
        <ul className="mt-3 space-y-2">
          {hasCredentials && (
            <li className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-xs">
              <KeyRound className="h-3.5 w-3.5 text-[color:var(--color-sage-deep)]" />
              <span className="text-foreground">Email i lozinka</span>
            </li>
          )}
          {linkedProviders.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-sage-deep)]" />
              <span className="text-foreground">
                {PROVIDER_LABELS[p] ?? p}
              </span>
            </li>
          ))}
          {!hasCredentials && linkedProviders.length === 0 && (
            <li className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <Mail className="h-3.5 w-3.5" />
              Nema aktivnih načina prijave. Postavite lozinku ili
              povežite Google.
            </li>
          )}
        </ul>
        <p className="mt-3 text-[0.7rem] text-muted-foreground">
          Ako neki način ovde ne odgovara onome što očekujete (npr.
          email se razlikuje od vašeg Google naloga), javite se na{" "}
          <a
            href="mailto:kontakt@elegantrender.rs"
            className="text-foreground underline-offset-2 hover:underline"
          >
            kontakt@elegantrender.rs
          </a>
          .
        </p>
      </section>

      <PrivacyActions
        deletionRequestedAt={user.deletionRequestedAt?.toISOString() ?? null}
      />
    </div>
  );
}
