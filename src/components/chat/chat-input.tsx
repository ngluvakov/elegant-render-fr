/**
 * ChatInput — Message input field with send button for the AI chat.
 *
 * Used on: ChatWidget
 */
"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-border/40 bg-card/80 px-3 py-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Décrivez votre besoin…"
        disabled={disabled}
        className="flex-1 rounded-xl border border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-accent/40"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors hover:bg-[var(--color-green-hover)] disabled:opacity-40"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
