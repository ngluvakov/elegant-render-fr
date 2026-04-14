"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthState } from "@/server/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: AuthState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="mt-8 space-y-5">
      <GoogleSignInButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ili sa email-om</span>
        <div className="h-px flex-1 bg-border" />
      </div>

    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Lozinka</Label>
          <Link
            href="/zaboravljena-lozinka"
            className="text-xs text-muted-foreground hover:text-accent"
          >
            Zaboravili ste lozinku?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
        {pending ? "Prijava…" : "Prijavite se"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nemate nalog?{" "}
        <Link href="/registracija" className="font-medium text-foreground hover:text-accent">
          Registrujte se
        </Link>
      </p>
    </form>
    </div>
  );
}
