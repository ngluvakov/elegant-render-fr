"use client";

import { useActionState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileAction,
  type ProfileState,
} from "@/server/actions/profile";

const initialState: ProfileState = {};

type ProfileFormProps = {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  hasPassword: boolean;
};

export function ProfileForm({
  defaultName,
  defaultEmail,
  defaultPhone,
  hasPassword,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/10 px-4 py-3 text-sm text-[color:var(--color-sage-deep)]">
          Podaci su uspešno ažurirani.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          <Pencil className="h-3 w-3 text-accent/60" />
          Ime i prezime
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={defaultEmail}
          disabled
          className="opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          Email adresa se ne može menjati.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          <Pencil className="h-3 w-3 text-accent/60" />
          Telefon
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          autoComplete="tel"
        />
      </div>

      <div id="password" className="space-y-2 scroll-mt-24">
        <Label htmlFor="newPassword">
          <Pencil className="h-3 w-3 text-accent/60" />
          {hasPassword ? "Nova lozinka (opciono)" : "Postavite lozinku"}
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder={
            hasPassword ? "Ostavite prazno ako ne menjate" : "Najmanje 8 karaktera"
          }
        />
        {!hasPassword && (
          <p className="text-xs text-muted-foreground">
            Nakon postavljanja, moći ćete da se prijavite direktno bez
            čekanja na link iz email-a.
          </p>
        )}
      </div>

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Čuvanje…" : "Sačuvajte izmene"}
      </Button>
    </form>
  );
}
