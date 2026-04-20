/**
 * ProjectNameEditor — Inline autosave editor for Order.projectName.
 * The field always looks editable: persistent soft underline, pencil icon
 * nudged by a hint chip, and a subtle hover background on the whole row.
 * On focus the underline and icon switch to accent. Autosaves after 600ms debounce.
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

  // Non-editable (paid etc) — plain heading
  if (!editable) {
    return (
      <h1 className="mt-1 font-heading text-2xl text-foreground md:text-3xl">
        {value.trim() || fallbackLabel}
      </h1>
    );
  }

  const isEmpty = !value.trim();

  return (
    <div className="mt-1 space-y-1.5">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
        Naziv projekta
      </p>
      <div
        role="button"
        tabIndex={-1}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "group relative flex max-w-full cursor-text items-center gap-2 rounded-lg px-2 py-1 -mx-2 transition-all duration-200",
          "hover:bg-[color:var(--color-clay)]/[0.06]",
          focused && "bg-[color:var(--color-clay)]/[0.04]",
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 100))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={fallbackLabel}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-heading text-2xl text-foreground outline-none placeholder:italic placeholder:text-muted-foreground/55 md:text-3xl",
            "border-b-2 transition-colors duration-200",
            focused
              ? "border-accent"
              : isEmpty
                ? "border-accent/40 border-dashed"
                : "border-border/50 border-dashed group-hover:border-accent/50",
          )}
        />
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.6rem] font-semibold transition-all duration-200",
            focused
              ? "border-accent bg-accent text-accent-foreground"
              : "border-accent/35 bg-accent/10 text-accent group-hover:border-accent/60 group-hover:bg-accent/15",
          )}
        >
          <Pencil className="h-3 w-3" />
          <span className="hidden sm:inline">
            {isEmpty ? "Dodajte naziv" : "Izmeni"}
          </span>
        </div>
        {savedAt && Date.now() - savedAt < 2000 && (
          <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-[color:var(--color-sage-deep)] animate-in fade-in duration-200">
            <Check className="h-3 w-3" />
            <span className="hidden sm:inline">Sačuvano</span>
          </span>
        )}
      </div>
    </div>
  );
}
