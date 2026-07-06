import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/server/actions/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Email verification",
  description: "Confirm your email address and activate your Elegant Render account.",
  robots: NO_INDEX_ROBOTS,
};

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl text-foreground">Invalid link</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The verification link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {result.success ? (
          <>
            <h1 className="text-3xl text-foreground">Email confirmed</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.message}
            </p>
            <div className="mt-6">
              <ButtonLink href="/portal" variant="accent" size="lg">
                Go to portal
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl text-foreground">Error</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.error}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-foreground hover:text-accent"
              >
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
