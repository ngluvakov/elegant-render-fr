"use client";

import { useActionState } from "react";
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
};

export function ProfileForm({
  defaultName,
  defaultEmail,
  defaultPhone,
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
        <Label htmlFor="name">Ime i prezime</Label>
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
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova lozinka (opciono)</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Ostavite prazno ako ne menjate"
        />
      </div>

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Čuvanje…" : "Sačuvajte izmene"}
      </Button>
    </form>
  );
}
