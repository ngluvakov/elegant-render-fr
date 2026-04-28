/**
 * ChatWidget — Floating AI assistant button + chat drawer.
 * Persists conversation and open/closed state across page navigations
 * via sessionStorage. Appears on all marketing pages (bottom-right corner).
 *
 * Used on: (marketing)/layout.tsx
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistantGuideSnapshot } from "@/lib/chat/guide-context";
import { getChatGuideTips } from "@/lib/chat/guide-tips";
import { ChatMessages, type ChatMessage } from "./chat-messages";
import { ChatInput } from "./chat-input";

const STORAGE_KEY_MESSAGES = "er-chat-messages";
const STORAGE_KEY_OPEN = "er-chat-open";
const STORAGE_KEY_GUIDE_DISMISSED = "er-chat-guide-dismissed";
const STORAGE_KEY_SESSION_ID = "er-chat-session-id";

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

function loadGuideDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_GUIDE_DISMISSED) === "1";
  } catch {}
  return false;
}

function loadChatSessionId(): string | null {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (existing) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY_SESSION_ID, next);
    return next;
  } catch {}
  return null;
}

export function ChatWidget() {
  const pathname = usePathname();
  const guideContext = useAssistantGuideSnapshot();
  const guideContextKey = JSON.stringify(guideContext ?? null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const guideTips = useMemo(
    () => getChatGuideTips(pathname, guideContext),
    [guideContext, pathname],
  );
  const activeTip =
    guideTips.length > 0 ? guideTips[tipIndex % guideTips.length] : null;

  // Load persisted state after hydration
  useEffect(() => {
    setMessages(loadMessages());
    setOpen(loadOpen());
    setGuideDismissed(loadGuideDismissed());
    setChatSessionId(loadChatSessionId());
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

  useEffect(() => {
    if (!hydrated || open || guideDismissed || guideTips.length <= 1) return;
    const timer = window.setInterval(() => {
      setTipIndex((idx) => (idx + 1) % guideTips.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [guideDismissed, guideTips.length, hydrated, open]);

  useEffect(() => {
    setTipIndex(0);
  }, [guideContextKey, pathname]);

  const toggleOpen = () => setOpen((v) => !v);

  const dismissGuide = () => {
    setGuideDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY_GUIDE_DISMISSED, "1");
    } catch {}
  };

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
            pagePath: pathname,
            sessionId: chatSessionId,
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
    [chatSessionId, messages, pathname],
  );

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "fixed bottom-5 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_30px_rgba(28,26,25,0.15)] transition-all hover:scale-105 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14",
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

      {!open && hydrated && !guideDismissed && activeTip && (
        <div className="fixed bottom-[4.75rem] right-4 z-40 w-[min(19rem,calc(100vw-5.25rem))] rounded-2xl border border-border/50 bg-background/95 px-3.5 py-3 pr-9 text-foreground shadow-[0_14px_42px_rgba(28,26,25,0.14)] backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-300 after:absolute after:-bottom-1.5 after:right-5 after:h-3 after:w-3 after:rotate-45 after:border-b after:border-r after:border-border/50 after:bg-background/95 sm:bottom-24 sm:right-6 sm:w-80 sm:px-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">
            {activeTip.label}
          </p>
          <p className="mt-1 text-[0.78rem] leading-snug text-foreground/85 sm:text-xs">
            {activeTip.body}
          </p>
          <button
            type="button"
            onClick={dismissGuide}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Sakrij savete asistenta"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[min(520px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_20px_60px_rgba(28,26,25,0.15)] sm:bottom-24 sm:right-6 sm:w-[min(400px,calc(100vw-3rem))]">
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
