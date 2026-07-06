/**
 * BrandLogo — Displays the Elegant Render logo as a home link or plain image.
 *
 * Used on: SiteHeader, SiteFooter, PortalSidebar, and various layouts.
 * @prop size — "sm" | "md" | "lg"
 * @prop surface — "light" | "dark" (selects the black or white logo asset)
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

/* Black lettering on light surfaces, white on dark (portal sidebar, footer). */
const LOGO_SRC = {
  light: "/branding/er-logo-black.png",
  dark: "/branding/er-logo-white.png",
} as const;

/*
  Intrinsic dimensions of the logo assets: 2011×3186 (portrait, aspect ≈ 0.63).
  We keep these as the <Image> width/height props so Next.js reserves the correct
  aspect slot; actual rendered size is driven by the Tailwind height class.
*/
const LOGO_INTRINSIC = { width: 2011, height: 3186 } as const;

const sizeClasses = {
  sm: "h-11 w-auto",
  md: "h-14 w-auto",
  lg: "h-20 w-auto",
  xl: "h-[4.5rem] w-auto", // 72px — header logo, contained within the 80px bar (vertically centered, no longer overflows). Only used by SiteHeader.
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
        src={LOGO_SRC[surface]}
        alt="Elegant Render logo"
        width={LOGO_INTRINSIC.width}
        height={LOGO_INTRINSIC.height}
        priority
        className={sizeClasses[size]}
      />
    </span>
  );

  if (asChild) return content;

  return (
    <Link
      href="/"
      className="inline-flex items-center transition-opacity hover:opacity-80"
      aria-label="Elegant Render — home"
    >
      {content}
    </Link>
  );
}
