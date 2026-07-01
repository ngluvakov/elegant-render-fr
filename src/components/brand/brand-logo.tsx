/**
 * BrandLogo — Displays the Elegant Render logo as a home link or plain image.
 *
 * Used on: SiteHeader, SiteFooter, PortalSidebar, and various layouts.
 * @prop size — "sm" | "md" | "lg"
 * @prop surface — "light" | "dark" (controls drop shadow)
 * @prop asChild — renders without the home link wrapper
 */
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  surface?: "light" | "dark";
  /** When true, renders as a plain span wrapper without the home link. */
  asChild?: boolean;
};

const LOGO_SRC = "/branding/elegant-render-logo-with-padding.png";

/*
  Intrinsic dimensions of the current logo asset: 1371×2048 (portrait, aspect ≈ 0.67).
  We keep these as the <Image> width/height props so Next.js reserves the correct
  aspect slot; actual rendered size is driven by the Tailwind height class.
*/
const LOGO_INTRINSIC = { width: 1371, height: 2048 } as const;

const sizeClasses = {
  sm: "h-11 w-auto",
  md: "h-14 w-auto",
  lg: "h-20 w-auto",
  xl: "h-[9.45rem] w-auto", // 151px — oversized header logo (overflows the bar)
} as const;

const surfaceClasses = {
  light: "drop-shadow-[0_10px_24px_rgba(28,26,25,0.08)]",
  dark: "drop-shadow-[0_16px_34px_rgba(0,0,0,0.28)]",
} as const;

export function BrandLogo({
  className,
  size = "md",
  surface = "light",
  asChild,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={LOGO_SRC}
        alt="Elegant Render logo"
        width={LOGO_INTRINSIC.width}
        height={LOGO_INTRINSIC.height}
        priority
        className={cn(sizeClasses[size], surfaceClasses[surface])}
      />
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
