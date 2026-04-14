import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/server/actions/auth";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Verifikacija emaila",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ token?: string }>;

export default async function VerifikacijaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl text-foreground">Nevažeći link</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Link za verifikaciju je nevažeći.
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
            <h1 className="text-3xl text-foreground">Email potvrđen</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.message}
            </p>
            <div className="mt-6">
              <ButtonLink href="/portal" variant="accent" size="lg">
                Idite na portal
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl text-foreground">Greška</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.error}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link
                href="/prijava"
                className="font-medium text-foreground hover:text-accent"
              >
                Nazad na prijavu
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
