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
  title: "Pristup portalu",
  description:
    "Siguran magic link ulaz u Elegant Render portal iz email poruke.",
  robots: NO_INDEX_ROBOTS,
};

export default async function PortalPristupPage({
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
        <h1 className="text-2xl text-foreground">Link nije validan</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Otvorite najnoviji email ili zatražite novi link.
        </p>
        <Link
          href="/prijava"
          className="mt-6 inline-block text-sm text-accent underline-offset-4 hover:underline"
        >
          Idite na prijavu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl text-foreground">Prijavljujemo vas…</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Trenutak — preusmeravamo vas na vašu porudžbinu.
      </p>

      <form action={magicLinkSignInAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="next" value={next} />
        <AutoSubmitMagicLink />
        <noscript>
          <button
            type="submit"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white"
          >
            Pristupi portalu
          </button>
        </noscript>
      </form>
    </div>
  );
}
