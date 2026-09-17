"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthState } from "@/server/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: AuthState = {};

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const signInHref =
    callbackUrl === "/portal"
      ? "/connexion"
      : `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`;

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
        <Label htmlFor="name">
          <Pencil className="h-3 w-3 text-accent/60" />
          Nom complet
        </Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
        />
      </div>

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
        <Label htmlFor="password">
          <Pencil className="h-3 w-3 text-accent/60" />
          Mot de passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">8 caractères minimum</p>
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
        {pending ? "Création du compte…" : "Créer un compte"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        <Link href={signInHref} className="font-medium text-foreground hover:text-accent">
          Se connecter
        </Link>
      </p>
    </form>
    </div>
  );
}
