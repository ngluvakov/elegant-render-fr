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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/5 p-4">
      <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-[color:var(--color-sage-deep)]">
        Odgovor tima
      </p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Napišite poruku klijentu…"
        rows={3}
        className="resize-none"
      />
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          <Send className="mr-1.5 h-3 w-3" />
          {pending ? "Slanje…" : "Pošalji kao tim"}
        </Button>
      </div>
    </form>
  );
}
