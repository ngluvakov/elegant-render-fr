/**
 * ChatMessages — Scrollable message list for the AI assistant chat.
 * Renders user and assistant messages with markdown link support.
 * Parses :::predlog blocks into actionable "add to configurator" buttons.
 *
 * Used on: ChatWidget
 */
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { usePublicCurrency } from "@/components/site/public-currency-provider";
import { formatPublicPrice } from "@/lib/catalog/display-currency";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function renderLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      return (
        <a
          key={i}
          href={match[2]}
          className="font-medium text-accent underline underline-offset-2 hover:text-accent/80"
        >
          {match[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

type ProposalItem = { id: string; qty: number; sourceMode?: string };

// Accepts "id:qty" or "id/sourceMode:qty". The sourceMode form is used
// for the consolidated `anim` product (anim/scratch:30, anim/active:60).
function parseProposalItems(raw: string[]): ProposalItem[] {
  return raw.map((entry) => {
    const [head, qtyStr] = entry.split(":");
    const trimmed = head.trim();
    const slash = trimmed.indexOf("/");
    if (slash > 0) {
      return {
        id: trimmed.slice(0, slash),
        sourceMode: trimmed.slice(slash + 1),
        qty: parseInt(qtyStr) || 1,
      };
    }
    return { id: trimmed, qty: parseInt(qtyStr) || 1 };
  });
}

function ProposalCard({ entries }: { entries: ProposalItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const displayCurrency = usePublicCurrency();
  const isOnCene = pathname === "/cene";

  const items = entries
    .map((e) => ({ ...e, product: getConfiguratorProduct(e.id) }))
    .filter((e) => e.product);

  if (items.length === 0) return null;

  const handleAccept = () => {
    sessionStorage.setItem("er-chat-proposal", JSON.stringify(entries));

    if (isOnCene) {
      window.dispatchEvent(new CustomEvent("er-chat-proposal"));
    } else {
      router.push("/cene");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
      <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-accent">
        Predlog usluga
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-foreground">
              {item.qty > 1 && (
                <span className="mr-1 font-semibold text-accent">{item.qty}×</span>
              )}
              {item.product!.product.label}
            </span>
            <span className="font-semibold text-foreground">
              {formatPublicPrice(
                item.product!.product.basePriceEur * item.qty,
                displayCurrency,
              )}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAccept}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        {isOnCene ? "Dodaj u konfigurator" : "Pogledaj na cenovniku"}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const proposalMatch = content.match(/:::predlog\n([\s\S]*?)\n:::/);
  const textBefore = proposalMatch
    ? content.slice(0, proposalMatch.index).trim()
    : content;
  const entries = proposalMatch
    ? parseProposalItems(proposalMatch[1].split(",").filter(Boolean))
    : [];

  return (
    <>
      {renderLinks(textBefore)}
      {entries.length > 0 && <ProposalCard entries={entries} />}
    </>
  );
}

export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="scrollbar-warm flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            msg.role === "user"
              ? "ml-auto bg-accent/10 text-foreground"
              : "mr-auto bg-secondary/60 text-foreground/85",
          )}
        >
          <MessageContent content={msg.content} />
          {msg.role === "assistant" && msg.content === "" && (
            <span className="inline-block h-4 w-1 animate-pulse bg-accent/60" />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
