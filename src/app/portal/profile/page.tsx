import type { Metadata } from "next";
import { Mail, KeyRound, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ProfileForm } from "./profile-form";
import { PrivacyActions } from "./privacy-actions";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Edit your profile, account, sign-in method, and details used in the Elegant Render portal.",
  robots: { index: false, follow: false },
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  credentials: "Email and password",
};

export default async function ProfilePage() {
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
      <SectionKicker>Profile</SectionKicker>
      <h1 className="mt-4 text-3xl text-foreground md:text-4xl">
        Your details
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Update your name, phone, or password.
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
          companyAddress: user.billingCompanyAddress ?? "",
        }}
      />

      {/* Auth methods. Defensive surfacing — lets the customer
          confirm the email they expect is on the account, and which
          providers can sign them in. Footgun coverage for the
          Auth.js account-linking edge cases. */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold text-foreground">
          Sign-in methods
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Account email: <strong>{user.email}</strong>. These methods are
          enabled for your sign-in:
        </p>
        <ul className="mt-3 space-y-2">
          {hasCredentials && (
            <li className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-xs">
              <KeyRound className="h-3.5 w-3.5 text-[color:var(--color-sage-deep)]" />
              <span className="text-foreground">Email and password</span>
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
              There are no active sign-in methods. Set a password or connect
              Google.
            </li>
          )}
        </ul>
        <p className="mt-3 text-[0.7rem] text-muted-foreground">
          If any method here does not match what you expect (for example, the
          email differs from your Google account), contact us at{" "}
          <a
            href="mailto:info@elegantrender.com"
            className="text-foreground underline-offset-2 hover:underline"
          >
            info@elegantrender.com
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
