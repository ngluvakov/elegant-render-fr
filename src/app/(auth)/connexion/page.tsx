import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sanitizeAuthCallback } from "@/lib/auth-redirect";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte Elegant Render.",
  robots: NO_INDEX_ROBOTS,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const callbackUrl = sanitizeAuthCallback(params.callbackUrl);

  // Already signed in → /portal. Without this, clicking a provider
  // button while authenticated triggers Auth.js v5's "link the new
  // OAuth account to the current session user" path, which silently
  // attaches Google sub to whichever User you were already logged
  // in as — confusing because it looks like a sign-in but is
  // actually account linking. Easier to never show the form when a
  // session exists.
  const session = await auth();
  if (session?.user?.id) redirect(callbackUrl);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">Connexion</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Connectez-vous pour suivre vos commandes et échanger avec l’équipe.
          </p>
        </div>
        <SignInForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
