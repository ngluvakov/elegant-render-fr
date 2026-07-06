import type { Metadata } from "next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "New password",
  description: "Set a new password for your account.",
  robots: NO_INDEX_ROBOTS,
};

type SearchParams = Promise<{ token?: string }>;

export default async function ResetPasswordPage({
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
            The password reset link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            New password
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter a new password for your account.
          </p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
