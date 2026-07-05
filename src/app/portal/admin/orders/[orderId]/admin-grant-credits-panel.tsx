"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_CREDIT_UNITS_PER_CREDIT,
  formatCreditsFromUnits,
} from "@/lib/ai-studio/catalog";
import { adminGrantAiCredits } from "@/server/actions/admin";

type Props = {
  userId: string;
  userName: string | null;
  userEmail: string;
  balanceUnits: number;
  expiresAt: Date | null;
};

export function AdminGrantCreditsPanel({
  userId,
  userName,
  userEmail,
  balanceUnits,
  expiresAt,
}: Props) {
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState("1");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsedCredits = Math.floor(Number(credits));
    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      setError("Unesite ispravan broj kredita.");
      return;
    }
    if (!note.trim()) {
      setError("Razlog dodavanja je obavezan.");
      return;
    }
    setPending(true);
    const result = await adminGrantAiCredits({
      userId,
      units: parsedCredits * AI_CREDIT_UNITS_PER_CREDIT,
      note,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setCredits("1");
    setNote("");
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-sage-deep)]" />
            AI krediti — {userName ?? userEmail}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Trenutni balans:{" "}
            <strong className="text-foreground">
              {formatCreditsFromUnits(balanceUnits)}
            </strong>
            {expiresAt && (
              <>
                {" · ističu "}
                {expiresAt.toLocaleDateString("sr-Latn-RS")}
              </>
            )}
          </p>
        </div>
        {!open && (
          <Button size="sm" onClick={() => setOpen(true)}>
            Dodaj kredite
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Broj kredita</Label>
            <Input
              type="number"
              min="1"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-[0.68rem] text-muted-foreground">
              1 kredit = {AI_CREDIT_UNITS_PER_CREDIT} jedinica · krediti važe 12 meseci
            </p>
          </div>
          <div>
            <Label className="text-xs">Razlog (vidljiv u istoriji)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="npr. Kompenzacija za neuspelu obradu, marketing gift…"
              rows={2}
              className="mt-1 resize-none"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Dodavanje…" : "Dodaj kredite"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={pending}
            >
              Otkaži
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
