"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminGrantFreeRevision } from "@/server/actions/admin";

const ALLOWED_STATUSES = new Set([
  "in_progress",
  "in_review",
  "revision_requested",
  "delivered",
]);

export function AdminFreeRevisionPanel({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!ALLOWED_STATUSES.has(currentStatus)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Le motif est obligatoire.");
      return;
    }
    setPending(true);
    setError("");
    const result = await adminGrantFreeRevision({ orderId, note });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setNote("");
    router.refresh();
  };

  const willReopen =
    currentStatus === "delivered" || currentStatus === "revision_requested";

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Gift className="h-3.5 w-3.5 text-accent" />
            Révision offerte
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {willReopen
              ? "Renvoie la commande en production sans frais. Le client reçoit un e-mail."
              : "Enregistre une note concernant la modification offerte. Le client reçoit un e-mail."}
          </p>
        </div>
        {!open && (
          <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
            Accorder une révision offerte
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Motif (le client le verra dans l’e-mail)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. : accordée après échange téléphonique — ajuster la couleur de la porte."
              rows={2}
              className="mt-1 resize-none"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="accent" size="sm" disabled={pending}>
              {pending ? "Envoi en cours…" : "Confirmer la révision offerte"}
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
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
