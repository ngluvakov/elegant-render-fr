"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type AuthState } from "@/server/actions/auth";

const initialState: AuthState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/10 px-4 py-3 text-sm text-[color:var(--color-sage-deep)]">
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">
          <Pencil className="h-3 w-3 text-accent/60" />
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Sending..." : "Send link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-accent"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
