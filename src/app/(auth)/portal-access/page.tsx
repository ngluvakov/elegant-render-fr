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
  title: "Portal access",
  description:
    "Secure magic-link access to the Elegant Render portal from an email message.",
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
        <h1 className="text-2xl text-foreground">Link is not valid</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Open the newest email or request a new link.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent underline-offset-4 hover:underline"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl text-foreground">Signing you in...</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        One moment - we are redirecting you to your order.
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
            Access portal
          </button>
        </noscript>
      </form>
    </div>
  );
}
