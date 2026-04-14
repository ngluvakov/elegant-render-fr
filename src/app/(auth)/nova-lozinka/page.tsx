import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Nova lozinka",
  description: "Postavite novu lozinku za vaš nalog.",
};

type SearchParams = Promise<{ token?: string }>;

export default async function NovaLozinkaPage({
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
            Link za resetovanje lozinke je nevažeći ili je istekao.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            Nova lozinka
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Unesite novu lozinku za vaš nalog.
          </p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
