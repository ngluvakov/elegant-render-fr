import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/server/actions/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Vérification de l’e-mail",
  description: "Confirmez votre adresse e-mail et activez votre compte Elegant Render.",
  robots: NO_INDEX_ROBOTS,
};

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl text-foreground">Lien invalide</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Le lien de vérification est invalide.
          </p>
        </div>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {result.success ? (
          <>
            <h1 className="text-3xl text-foreground">Adresse e-mail confirmée</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.message}
            </p>
            <div className="mt-6">
              <ButtonLink href="/portal" variant="accent" size="lg">
                Accéder à l’espace client
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl text-foreground">Erreur</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.error}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-foreground hover:text-accent"
              >
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
