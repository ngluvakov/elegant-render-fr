import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sanitizeAuthCallback } from "@/lib/auth-redirect";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez gratuitement votre compte Elegant Render.",
  robots: NO_INDEX_ROBOTS,
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const callbackUrl = sanitizeAuthCallback(params.callbackUrl);

  // Already signed in → /portal. Same rationale as the sign-in page:
  // clicking the Google button on registration while authenticated
  // would link that Google account to the current session user
  // instead of creating a fresh signup.
  const session = await auth();
  if (session?.user?.id) redirect(callbackUrl);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            Inscription
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Créez un compte pour commander, suivre vos projets et échanger
            avec l’équipe.
          </p>
        </div>
        <SignUpForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
