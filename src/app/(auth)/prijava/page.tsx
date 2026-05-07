import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Prijava",
  description: "Prijavite se na svoj Elegant Render nalog.",
  robots: NO_INDEX_ROBOTS,
};

export default async function PrijavaPage() {
  // Already signed in → /portal. Without this, clicking a provider
  // button while authenticated triggers Auth.js v5's "link the new
  // OAuth account to the current session user" path, which silently
  // attaches Google sub to whichever User you were already logged
  // in as — confusing because it looks like a sign-in but is
  // actually account linking. Easier to never show the form when a
  // session exists.
  const session = await auth();
  if (session?.user?.id) redirect("/portal");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">Prijava</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Prijavite se na svoj nalog da pratite porudžbine i komunicirate sa
            timom.
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
