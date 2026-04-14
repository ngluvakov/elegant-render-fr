import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Zaboravljena lozinka",
  description: "Zatražite link za resetovanje lozinke.",
};

export default function ZaboravljenaLozinkaPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            Zaboravljena lozinka
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Unesite email adresu i poslaćemo vam link za postavljanje nove
            lozinke.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
