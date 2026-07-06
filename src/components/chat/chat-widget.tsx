/**
 * ChatWidget — Floating AI assistant button + chat drawer.
 * Persists conversation and open/closed state across page navigations
 * via sessionStorage. The contextual tip bubble is shown by default and
 * its dismissal is session-scoped (resets next session). Appears on every
 * marketing/portal page, including AI Studio, where it lifts above the
 * fixed mobile credit dock.
 *
 * Used on: (marketing)/layout.tsx, portal/layout.tsx
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import { CONSENT_CHANGE_EVENT, readConsent } from "@/lib/consent";
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
    "Hi, I'm the Elegant Render assistant. Describe your project or ask me anything — I'll help you choose the right service.",
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
  // Session-scoped: once the user closes the tip bubble it stays closed for
  // the rest of the session, but advice is shown again in a new session.
  try {
    return sessionStorage.getItem(STORAGE_KEY_GUIDE_DISMISSED) === "1";
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
  const displayCurrency = usePublicCurrency();
  const pricingSettings = usePublicPricingSettings();
  const guideContext = useAssistantGuideSnapshot();
  const guideContextKey = JSON.stringify(guideContext ?? null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [consentDecided, setConsentDecided] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const guideTips = useMemo(
    () =>
      getChatGuideTips(
        pathname,
        guideContext,
        displayCurrency,
        pricingSettings,
      ),
    [displayCurrency, guideContext, pathname, pricingSettings],
  );
  const activeTip =
    guideTips.length > 0 ? guideTips[tipIndex % guideTips.length] : null;
  const missingItems = guideContext?.missingItems ?? [];
  const readinessWarnings = guideContext?.readinessWarnings ?? [];
  const hasReadinessAttention =
    missingItems.length > 0 || readinessWarnings.length > 0;
  const showGuideBubble =
    !open &&
    hydrated &&
    Boolean(activeTip || hasReadinessAttention) &&
    (!guideDismissed || hasReadinessAttention);

  // Lift the FAB + tip bubble above page-level fixed mobile bars so they don't
  // overlap: the AI Studio credit dock (lg:hidden, always present) and the
  // pricing MobileQuoteBar (xl:hidden, only when the cart has items). Driven
  // by the injected guide context, not pathname, so it stays route-agnostic.
  const liftForDock = guideContext?.page === "ai_studio";
  const liftForQuoteBar =
    guideContext?.page === "pricing" && (guideContext?.cartItemCount ?? 0) > 0;
  const fabBottomClass = liftForDock
    ? "bottom-[5.75rem] sm:bottom-[6.5rem] lg:bottom-6"
    : liftForQuoteBar
      ? "bottom-[5.5rem] sm:bottom-[6rem] xl:bottom-6"
      : "bottom-5 sm:bottom-6";
  const bubbleBottomClass = liftForDock
    ? "bottom-[9.5rem] sm:bottom-[10.5rem] lg:bottom-24"
    : liftForQuoteBar
      ? "bottom-[9.25rem] sm:bottom-[10rem] xl:bottom-24"
      : "bottom-[4.75rem] sm:bottom-24";

  // Load persisted state after hydration
  useEffect(() => {
    const hasConsent = readConsent() !== null;
    setConsentDecided(hasConsent);
    if (hasConsent) {
      setMessages(loadMessages());
      setOpen(loadOpen());
      setGuideDismissed(loadGuideDismissed());
      setChatSessionId(loadChatSessionId());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const syncConsent = () => setConsentDecided(readConsent() !== null);
    window.addEventListener(CONSENT_CHANGE_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, syncConsent);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !consentDecided || chatSessionId) return;
    setMessages(loadMessages());
    setOpen(loadOpen());
    setGuideDismissed(loadGuideDismissed());
    setChatSessionId(loadChatSessionId());
  }, [chatSessionId, consentDecided, hydrated]);

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
      sessionStorage.setItem(STORAGE_KEY_GUIDE_DISMISSED, "1");
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
            guideContext,
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Communication error");
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
                "Sorry, something went wrong. Please try again or reach us via the [Contact](/contact) page.",
            };
            return updated;
          });
        }
      } finally {
        setStreaming(false);
      }
    },
    [chatSessionId, guideContext, messages, pathname],
  );

  if (!hydrated || !consentDecided) return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_30px_rgba(28,26,25,0.15)] transition-all hover:scale-105 sm:right-6 sm:h-14 sm:w-14",
          fabBottomClass,
          open
            ? "bg-foreground text-background"
            : "bg-accent text-white",
        )}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>

      {showGuideBubble && (
        <div
          className={cn(
            "fixed right-4 z-40 w-[min(19rem,calc(100vw-5.25rem))] rounded-2xl border px-3.5 py-3 pr-9 text-foreground shadow-[0_14px_42px_rgba(28,26,25,0.14)] backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-300 after:absolute after:-bottom-1.5 after:right-5 after:h-3 after:w-3 after:rotate-45 after:border-b after:border-r sm:right-6 sm:w-80 sm:px-4",
            bubbleBottomClass,
            missingItems.length > 0
              ? "border-[color:var(--color-ember)]/55 bg-[color:var(--color-sand-soft)]/95 after:border-[color:var(--color-ember)]/55 after:bg-[color:var(--color-sand-soft)]/95"
              : readinessWarnings.length > 0
                ? "border-accent/45 bg-background/95 after:border-accent/45 after:bg-background/95"
                : "border-border/50 bg-background/95 after:border-border/50 after:bg-background/95",
          )}
        >
          <p
            className={cn(
              "text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
              missingItems.length > 0
                ? "text-[color:var(--color-ember-deep)]"
                : "text-accent",
            )}
          >
            {missingItems.length > 0
              ? "Needed before processing"
              : activeTip?.label ?? "AI Studio"}
          </p>
          {activeTip && (
            <p className="mt-1 text-[0.78rem] leading-snug text-foreground/85 sm:text-xs">
              {activeTip.body}
            </p>
          )}
          {missingItems.length > 0 && (
            <ul className="mt-2 space-y-1 text-[0.76rem] leading-snug text-foreground/90 sm:text-xs">
              {missingItems.map((item) => (
                <li key={item} className="flex gap-1.5">
                  <span aria-hidden="true">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {missingItems.length === 0 && readinessWarnings.length > 0 && (
            <div className="mt-2 space-y-1 text-[0.76rem] leading-snug text-[color:var(--color-ember-deep)] sm:text-xs">
              {readinessWarnings.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          )}
          {!hasReadinessAttention && (
            <button
              type="button"
              onClick={dismissGuide}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Hide assistant tips"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
                Elegant Render assistant
              </p>
              <p className="text-[0.72rem] text-muted-foreground">
                Help choosing a service
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
