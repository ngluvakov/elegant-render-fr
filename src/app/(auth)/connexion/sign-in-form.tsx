"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthState } from "@/server/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: AuthState = {};

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const registrationHref =
    callbackUrl === "/portal"
      ? "/inscription"
      : `/inscription?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="mt-8 space-y-5">
      <GoogleSignInButton callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou par e-mail</span>
        <div className="h-px flex-1 bg-border" />
      </div>

    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">
          <Pencil className="h-3 w-3 text-accent/60" />
          Adresse e-mail
        </Label>
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
          <Label htmlFor="password">
            <Pencil className="h-3 w-3 text-accent/60" />
            Mot de passe
          </Label>
          <Link
            href="/mot-de-passe-oublie"
            className="text-xs text-muted-foreground hover:text-accent"
          >
            Mot de passe oublié ?
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
        {pending ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href={registrationHref} className="font-medium text-foreground hover:text-accent">
          Créer un compte
        </Link>
      </p>
    </form>
    </div>
  );
}
