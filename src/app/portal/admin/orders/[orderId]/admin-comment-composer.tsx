"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminCreateComment } from "@/server/actions/admin";

export function AdminCommentComposer({ orderId }: { orderId: string }) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    await adminCreateComment(orderId, body);
    setBody("");
    setPending(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-secondary/50 p-4">
      <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
        Réponse de l’équipe
      </p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Écrire un message au client…"
        rows={3}
        className="resize-none"
      />
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          <Send className="mr-1.5 h-3 w-3" />
          {pending ? "Envoi en cours…" : "Envoyer au nom de l’équipe"}
        </Button>
      </div>
    </form>
  );
}
