import type { Metadata } from "next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Demandez un lien de réinitialisation de votre mot de passe.",
  robots: NO_INDEX_ROBOTS,
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            Mot de passe oublié
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Saisissez votre adresse e-mail et nous vous enverrons un lien
            pour définir un nouveau mot de passe.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
