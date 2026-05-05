import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ProfileForm } from "./profile-form";
import { PrivacyActions } from "./privacy-actions";

export const metadata: Metadata = {
  title: "Profil",
  robots: { index: false, follow: false },
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
      deletionRequestedAt: true,
    },
  });

  if (!user) return null;

  const hasPassword = Boolean(user.passwordHash);

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
      />

      <PrivacyActions
        deletionRequestedAt={user.deletionRequestedAt?.toISOString() ?? null}
      />
    </div>
  );
}
