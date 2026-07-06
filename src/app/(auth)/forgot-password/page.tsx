import type { Metadata } from "next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link.",
  robots: NO_INDEX_ROBOTS,
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl text-foreground md:text-4xl">
            Forgot password
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter your email address and we will send you a link to set a new
            password.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
