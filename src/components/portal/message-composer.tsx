/**
 * MessageComposer — Textarea + send button for posting new messages
 * to an order's comment thread via server action.
 *
 * Used on: /portal/orders/[orderId] (order detail page).
 */
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction } from "@/server/actions/comment";

type MessageComposerProps = {
  orderId: string;
};

export function MessageComposer({ orderId }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setPending(true);
    setError("");

    const result = await createCommentAction(orderId, body);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setBody("");
    setPending(false);
    router.refresh();
    textareaRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/40 bg-card/60 p-4"
    >
      {error && (
        <p className="mb-3 text-xs text-destructive">{error}</p>
      )}
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Écrivez un message à l’équipe…"
        rows={3}
        className="resize-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[0.72rem] text-muted-foreground">
          L’équipe répond généralement sous un jour ouvré.
        </p>
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={pending || !body.trim()}
        >
          <Send className="mr-1.5 h-3 w-3" />
          {pending ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </form>
  );
}
