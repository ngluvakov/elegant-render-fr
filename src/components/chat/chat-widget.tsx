/**
 * ChatWidget — Floating AI assistant button + chat drawer.
 * Persists conversation and open/closed state across page navigations
 * via sessionStorage. Appears on all marketing pages (bottom-right corner).
 *
 * Used on: (marketing)/layout.tsx
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessages, type ChatMessage } from "./chat-messages";
import { ChatInput } from "./chat-input";

const STORAGE_KEY_MESSAGES = "er-chat-messages";
const STORAGE_KEY_OPEN = "er-chat-open";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Zdravo! Ja sam Elegant Render asistent. Opišite mi vaš projekat ili pitajte šta vas zanima — pomoći ću vam da izaberete pravu uslugu.",
};

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [WELCOME_MESSAGE];
}

function loadOpen(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY_OPEN) === "1";
  } catch {}
  return false;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted state after hydration
  useEffect(() => {
    setMessages(loadMessages());
    setOpen(loadOpen());
    setHydrated(true);
  }, []);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages, hydrated]);

  // Persist open state
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY_OPEN, open ? "1" : "0");
  }, [open, hydrated]);

  const toggleOpen = () => setOpen((v) => !v);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: "user", content: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setStreaming(true);

      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMsg]);

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Greška u komunikaciji");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: accumulated,
            };
            return updated;
          });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content:
                "Izvinite, došlo je do greške. Pokušajte ponovo ili nas kontaktirajte na [Kontakt](/kontakt) stranici.",
            };
            return updated;
          });
        }
      } finally {
        setStreaming(false);
      }
    },
    [messages],
  );

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_30px_rgba(28,26,25,0.15)] transition-all hover:scale-105",
          open
            ? "bg-foreground text-background"
            : "bg-accent text-white",
        )}
        aria-label={open ? "Zatvori asistenta" : "Otvori asistenta"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[min(520px,70vh)] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_20px_60px_rgba(28,26,25,0.15)]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border/40 bg-card/80 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
              <MessageCircle className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Elegant Render asistent
              </p>
              <p className="text-[0.72rem] text-muted-foreground">
                Pomoć pri izboru usluge
              </p>
            </div>
          </div>

          {/* Messages */}
          <ChatMessages messages={messages} />

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={streaming} />
        </div>
      )}
    </>
  );
}
