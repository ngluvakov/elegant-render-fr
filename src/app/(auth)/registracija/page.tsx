import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Registracija",
  description: "Napravite Elegant Render nalog — besplatno.",
};

export default function RegistracijaPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            Registracija
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Napravite nalog da biste mogli da naručujete, pratite projekte i
            komunicirate sa timom.
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
