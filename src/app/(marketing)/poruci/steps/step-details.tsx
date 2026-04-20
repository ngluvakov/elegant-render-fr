"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCheckout } from "../checkout-context";
import { ensureCheckoutUser } from "@/server/actions/checkout";

export function StepDetails() {
  const { setCustomer, setUserId, setStep } = useCheckout();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setPending(true);
    setError("");

    const result = await ensureCheckoutUser(name, email);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.userId) {
      setCustomer(name, email);
      setUserId(result.userId);
      setStep(1);
    }

    setPending(false);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
      <h2 className="text-xl font-semibold text-foreground">Vaši podaci</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Unesite ime i email da bismo mogli da vas kontaktiramo u vezi projekta.
        Nalog će biti automatski kreiran.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="checkout-name">
            <Pencil className="h-3 w-3 text-accent/60" />
            Ime i prezime
          </Label>
          <Input
            id="checkout-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-email">
            <Pencil className="h-3 w-3 text-accent/60" />
            Email
          </Label>
          <Input
            id="checkout-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
          {pending ? "Kreiranje…" : "Nastavi"}
        </Button>
      </form>
    </div>
  );
}
