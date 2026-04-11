import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** When true, renders as a plain span (no link). */
  asChild?: boolean;
};

export function BrandLogo({ className, asChild }: BrandLogoProps) {
  const content = (
    <span
      className={cn(
        "font-[family-name:var(--font-heading)] text-2xl font-medium tracking-tight text-foreground",
        className,
      )}
    >
      Elegant<span className="text-accent"> Render</span>
    </span>
  );

  if (asChild) return content;

  return (
    <Link
      href="/"
      className="inline-flex items-center transition-opacity hover:opacity-80"
      aria-label="Elegant Render — početna"
    >
      {content}
    </Link>
  );
}
