/**
 * ProjectNameEditor — Inline autosave editor for Order.projectName.
 * When empty (and not focused) the fallback label is rendered as a soft italic
 * ghost text with a pencil icon directly after it, making it obvious the text
 * is a placeholder and the field is editable. Clicking anywhere in the row
 * focuses the input. Autosaves after 600ms debounce.
 */
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProjectName } from "@/server/actions/order";

export function ProjectNameEditor({
  orderId,
  initialName,
  fallbackLabel,
  editable,
}: {
  orderId: string;
  initialName: string | null;
  fallbackLabel: string;
  editable: boolean;
}) {
  const [value, setValue] = useState(initialName ?? "");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [, start] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!editable) return;
    if (initRef.current) {
      initRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      start(async () => {
        const res = await updateProjectName(orderId, value);
        if (!res.error) {
          setSavedAt(Date.now());
          router.refresh();
        }
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, orderId, editable, router]);

  useEffect(() => {
    if (!savedAt) return;
    const timeout = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(timeout);
  }, [savedAt]);

  // Non-editable (paid etc) — plain heading
  if (!editable) {
    return (
      <h1 className="mt-1 font-heading text-2xl text-foreground md:text-3xl">
        {value.trim() || fallbackLabel}
      </h1>
    );
  }

  const isEmpty = !value.trim();
  const showGhost = isEmpty && !focused;

  return (
    <div className="mt-1 space-y-1.5">
      <p className="text-[0.72rem] font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground/80">
        Project name
      </p>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "group relative flex max-w-full cursor-text items-center gap-2 rounded-lg px-2 py-1 -mx-2 transition-colors duration-200",
          "hover:bg-secondary/70",
          focused && "bg-secondary/50",
        )}
      >
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 100))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              "w-full bg-transparent font-heading text-2xl text-foreground outline-none md:text-3xl",
              "border-b-2 transition-colors duration-200",
              focused
                ? "border-accent"
                : isEmpty
                  ? "border-accent/40 border-dashed"
                  : "border-border/50 border-dashed group-hover:border-accent/50",
            )}
          />
          {showGhost && (
            <div className="pointer-events-none absolute inset-0 flex items-center gap-3 pr-2">
              <span className="font-heading text-2xl italic text-muted-foreground/60 md:text-3xl">
                {fallbackLabel}
              </span>
              <Pencil className="h-6 w-6 flex-shrink-0 text-accent/70 animate-in fade-in duration-300 md:h-7 md:w-7" />
            </div>
          )}
        </div>
        {savedAt && (
          <span className="inline-flex flex-shrink-0 items-center gap-1 text-[0.72rem] font-medium text-muted-foreground animate-in fade-in duration-200">
            <Check className="h-3 w-3" />
            <span className="hidden sm:inline">Saved</span>
          </span>
        )}
      </div>
    </div>
  );
}
