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
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import { formatPublicPrice } from "@/lib/catalog/display-currency";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Lagani markdown za poruke asistenta: linkovi, **bold** i "- " liste.
// Model ih redovno emituje, a ranije su se prikazivali kao sirov tekst
// (samo su linkovi bili renderovani).
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={`${keyPrefix}-${i}`}
          href={link[2]}
          className="font-medium text-accent underline underline-offset-2 hover:text-accent/80"
        >
          {link[1]}
        </a>
      );
    }
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong
          key={`${keyPrefix}-${i}`}
          className="font-semibold text-foreground"
        >
          {bold[1]}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function renderLinks(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const listItem = line.match(/^\s*[-•]\s+(.*)$/);
    if (listItem) {
      return (
        <span key={i} className="flex gap-2">
          <span aria-hidden className="text-accent">
            •
          </span>
          <span className="flex-1">{renderInline(listItem[1], `l${i}`)}</span>
        </span>
      );
    }
    return (
      <span key={i}>
        {renderInline(line, `l${i}`)}
        {i < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

type ProposalItem = {
  id: string;
  qty: number;
  sourceMode?: string;
  isPrimary?: boolean;
};

type ParsedProposal = {
  primary: ProposalItem[];
  related: ProposalItem[];
  note: string | null;
};

// Accepts "id:qty" or "id/sourceMode:qty". The sourceMode form is used
// for the consolidated `anim` product (anim/scratch:30, anim/active:60).
function parseProposalItems(raw: string[]): ProposalItem[] {
  return raw
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
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

// Parses a :::predlog body. Two grammars supported:
//
//   Option A (flat, legacy — backwards-compatible):
//     id1:qty,id2:qty,id3:qty
//
//   Option B (sectioned, current):
//     primary: id:qty
//     related: id1:qty,id2:qty
//     note: free-form Serbian text
//
// Option B is detected by a `primary:` line. Anything else falls through
// to flat parse so older bot completions keep working.
function parseProposalBody(body: string): ParsedProposal {
  const trimmed = body.trim();
  const hasPrimaryLine = /^primary\s*:/im.test(trimmed);

  if (!hasPrimaryLine) {
    const flat = parseProposalItems(trimmed.split(","));
    const [first, ...rest] = flat;
    return {
      primary: first ? [{ ...first, isPrimary: true }] : [],
      related: rest,
      note: null,
    };
  }

  const lines = trimmed.split(/\r?\n/);
  let primaryRaw = "";
  let relatedRaw = "";
  let note: string | null = null;

  for (const line of lines) {
    const match = line.match(/^(primary|related|note)\s*:\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "primary") primaryRaw = value;
    else if (key === "related") relatedRaw = value;
    else if (key === "note") note = value || null;
  }

  return {
    primary: parseProposalItems(primaryRaw.split(",")).map((item) => ({
      ...item,
      isPrimary: true,
    })),
    related: parseProposalItems(relatedRaw.split(",")),
    note,
  };
}

function ProposalCard({ proposal }: { proposal: ParsedProposal }) {
  const router = useRouter();
  const pathname = usePathname();
  const displayCurrency = usePublicCurrency();
  const pricingSettings = usePublicPricingSettings();
  const isOnCene = pathname === "/pricing";

  const primary = proposal.primary
    .map((e) => ({ ...e, product: getConfiguratorProduct(e.id) }))
    .filter((e) => e.product);
  const related = proposal.related
    .map((e) => ({ ...e, product: getConfiguratorProduct(e.id) }))
    .filter((e) => e.product);

  if (primary.length === 0 && related.length === 0) return null;

  // Cart receives only primary items. Related are surfaced in the
  // configurator postcard after the primary is added.
  const cartPayload = primary.length > 0 ? primary : related;

  const handleAccept = () => {
    sessionStorage.setItem(
      "er-chat-proposal",
      JSON.stringify(
        cartPayload.map(({ id, qty, sourceMode }) => ({ id, qty, sourceMode })),
      ),
    );

    if (isOnCene) {
      window.dispatchEvent(new CustomEvent("er-chat-proposal"));
    } else {
      router.push("/pricing");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
      <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-accent">
        Predlog usluga
      </p>
      <div className="space-y-1.5">
        {primary.map((item) => (
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
                pricingSettings,
              )}
            </span>
          </div>
        ))}
      </div>
      {related.length > 0 && (
        <div className="mt-2 border-t border-accent/10 pt-2">
          <p className="mb-1 text-[0.68rem] font-medium text-foreground/60">
            Uz ovaj paket:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {related.map((item) => (
              <span
                key={item.id}
                className="rounded-md bg-foreground/5 px-2 py-0.5 text-[0.68rem] text-foreground/75"
              >
                {item.product!.product.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {proposal.note && (
        <p className="mt-2 text-[0.68rem] italic text-foreground/60">
          {proposal.note}
        </p>
      )}
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
  const proposal = proposalMatch
    ? parseProposalBody(proposalMatch[1])
    : null;
  const hasItems =
    proposal && (proposal.primary.length > 0 || proposal.related.length > 0);

  return (
    <>
      {renderLinks(textBefore)}
      {hasItems && <ProposalCard proposal={proposal} />}
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
