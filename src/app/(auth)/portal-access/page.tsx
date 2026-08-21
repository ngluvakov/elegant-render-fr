/**
 * portal-pristup/page.tsx — Magic link landing page.
 *
 * Reads ?token= from email, renders an auto-submitting form that calls
 * magicLinkSignInAction. JS-disabled fallback shows a manual button.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { magicLinkSignInAction } from "@/server/actions/auth";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { AutoSubmitMagicLink } from "./auto-submit";

export const metadata: Metadata = {
  title: "Accès à l’espace client",
  description:
    "Accès sécurisé à l’espace client Elegant Render via le lien reçu par e-mail.",
  robots: NO_INDEX_ROBOTS,
};

export default async function PortalAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const next = params.next ?? "/portal";

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl text-foreground">Ce lien n’est pas valide</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ouvrez l’e-mail le plus récent ou demandez un nouveau lien.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent underline-offset-4 hover:underline"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl text-foreground">Connexion en cours…</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Un instant — nous vous redirigeons vers votre commande.
      </p>

      <form action={magicLinkSignInAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="next" value={next} />
        <AutoSubmitMagicLink />
        <noscript>
          <button
            type="submit"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground"
          >
            Accéder à l’espace client
          </button>
        </noscript>
      </form>
    </div>
  );
}
