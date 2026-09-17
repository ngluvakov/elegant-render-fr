/**
 * NewDraftButton — Create an empty draft order and jump into its detail page.
 * Used on /portal/orders so the client can start configuring directly in
 * the portal instead of being bounced to /tarifs.
 */
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createEmptyDraft } from "@/server/actions/order";

export function NewDraftButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    start(async () => {
      const res = await createEmptyDraft();
      if (res.error || !res.orderId) {
        alert(res.error ?? "Erreur lors de la création du brouillon.");
        return;
      }
      router.push(`/portal/orders/${res.orderId}`);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="group inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-[var(--color-green-hover)] disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
      )}
      {pending ? "Création…" : "Nouveau brouillon"}
    </button>
  );
}
