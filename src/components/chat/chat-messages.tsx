/**
 * ChatMessages — Scrollable message list for the AI assistant chat.
 * Renders user and assistant messages with markdown link support.
 *
 * Used on: ChatWidget
 */
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function renderContent(content: string) {
  // Convert markdown links [text](/path) to clickable links
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
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
          {renderContent(msg.content)}
          {msg.role === "assistant" && msg.content === "" && (
            <span className="inline-block h-4 w-1 animate-pulse bg-accent/60" />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
