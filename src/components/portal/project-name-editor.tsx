/**
 * ProjectNameEditor — Inline autosave editor for Order.projectName.
 * Renders as a large, heading-style text input with a ghost underline that
 * animates into an accent underline on focus. Autosaves after 600ms debounce.
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

  return (
    <div className="group relative mt-1 inline-flex max-w-full items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 100))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={fallbackLabel}
        className={cn(
          "min-w-0 flex-1 bg-transparent font-heading text-2xl text-foreground outline-none placeholder:text-muted-foreground/50 md:text-3xl",
          "border-b-2 border-transparent transition-colors",
          focused && "border-accent/60",
        )}
      />
      {!focused && !value && (
        <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 transition-opacity group-hover:opacity-100 sm:opacity-0" />
      )}
      {savedAt && Date.now() - savedAt < 2000 && (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-[color:var(--color-sage-deep)] animate-in fade-in duration-200">
          <Check className="h-3 w-3" />
          Sačuvano
        </span>
      )}
    </div>
  );
}
