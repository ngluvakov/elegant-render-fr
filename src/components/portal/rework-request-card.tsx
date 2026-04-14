"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestReworkAction } from "@/server/actions/rework";

export function ReworkRequestCard({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRework = async () => {
    setPending(true);
    setError("");
    const result = await requestReworkAction(orderId);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <div className="flex items-center gap-2">
        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Zatražite izmene
        </h3>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        U cenu je uračunato 3 kruga revizija. Opišite željene izmene kroz
        poruke iznad, a zatim kliknite dugme ispod.
      </p>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={handleRework}
        disabled={pending}
      >
        {pending ? "Slanje…" : "Zatraži reviziju"}
      </Button>
    </div>
  );
}
