/**
 * NewDraftButton — Create an empty draft order and jump into its detail page.
 * Used on /portal/porudzbine so the client can start configuring directly in
 * the portal instead of being bounced to /cene.
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
        alert(res.error ?? "Greška pri kreiranju nacrta.");
        return;
      }
      router.push(`/portal/porudzbine/${res.orderId}`);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="group inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_14px_34px_-12px_rgba(159,106,75,0.45)] transition-all hover:bg-accent/90 hover:shadow-[0_18px_40px_-10px_rgba(159,106,75,0.55)] disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
      )}
      {pending ? "Kreira se…" : "Novi nacrt"}
    </button>
  );
}
