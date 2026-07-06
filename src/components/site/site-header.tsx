/**
 * SiteHeader — sticky marketing header per the White Rook design handoff:
 * 72px tall, rgba(255,255,255,0.85) + 12px backdrop blur, 1px bottom
 * border. Left: ER logo (48px) + wordmark; center: five nav links with
 * hover underline; right: "Sign in" (secondary) + "Start a project"
 * (primary green). The old "powered by White Rook" badge is removed —
 * White Rook attribution lives in the footer only.
 *
 * Used on: marketing layout (all public pages).
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_FEATURES } from "@/lib/site-features";
import { cn } from "@/lib/utils";

const MAIN_NAV: Array<{ href: string; label: string; pattern: string }> = [
  { href: "/services", label: "Services", pattern: "/services" },
  { href: "/pricing", label: "Pricing", pattern: "/pricing" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Our work", pattern: "/portfolio" }]
    : []),
  { href: "/faq", label: "FAQ", pattern: "/faq" },
  { href: "/contact", label: "Contact", pattern: "/contact" },
];

const SIGN_IN_CLASSES =
  "inline-flex h-9 items-center rounded-[4px] border border-[#111111] bg-white px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary";
const START_PROJECT_CLASSES =
  "inline-flex h-9 items-center rounded-[4px] bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-[#00c77e] active:bg-[#00b372]";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = !!session?.user;

  const isActive = (pattern: string) =>
    pathname === pattern || pathname.startsWith(`${pattern}/`);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/85 backdrop-blur-[12px]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between gap-8 px-6 sm:px-12">
        <Link
          href="/"
          className="flex items-center gap-3.5 text-foreground"
          aria-label="Elegant Render — home"
        >
          <Image
            src="/branding/er-logo-black.png"
            alt="Elegant Render"
            width={2011}
            height={3186}
            priority
            className="h-12 w-auto"
          />
          <span className="text-[15px] font-medium tracking-[-0.01em]">
            Elegant Render
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground hover:underline",
                isActive(item.pattern) && "text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={isLoggedIn ? "/portal" : "/login"}
            className={SIGN_IN_CLASSES}
          >
            {isLoggedIn ? "Portal" : "Sign in"}
          </Link>
          <QuickInquiryLink
            className={START_PROJECT_CLASSES}
            inquiry={{ source: "site-header", sourceLabel: "Header CTA" }}
          >
            Start a project
          </QuickInquiryLink>
        </div>

        {/* Mobile trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] text-foreground transition-colors duration-200 hover:bg-secondary md:hidden"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex flex-col gap-6 overflow-y-auto p-6"
          >
            <SheetTitle className="sr-only">Main menu</SheetTitle>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 text-foreground"
            >
              <Image
                src="/branding/er-logo-black.png"
                alt="Elegant Render"
                width={2011}
                height={3186}
                className="h-10 w-auto"
              />
              <span className="text-[15px] font-medium tracking-[-0.01em]">
                Elegant Render
              </span>
            </Link>

            <nav className="flex flex-col gap-1">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-[4px] px-3 py-2.5 text-lg text-foreground transition-colors duration-200 hover:bg-secondary",
                    isActive(item.pattern) && "bg-secondary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/ai-studio"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-[4px] px-3 py-2.5 text-lg text-foreground transition-colors duration-200 hover:bg-secondary",
                  isActive("/ai-studio") && "bg-secondary",
                )}
              >
                AI Studio
              </Link>
            </nav>

            <div className="mt-auto flex flex-col gap-2">
              <Link
                href={isLoggedIn ? "/portal" : "/login"}
                onClick={() => setMobileOpen(false)}
                className={cn(SIGN_IN_CLASSES, "h-11 justify-center")}
              >
                {isLoggedIn ? "Portal" : "Sign in"}
              </Link>
              <QuickInquiryLink
                onClick={() => setMobileOpen(false)}
                onOpen={() => setMobileOpen(false)}
                className={cn(START_PROJECT_CLASSES, "h-11 justify-center")}
                inquiry={{
                  source: "mobile-menu",
                  sourceLabel: "Mobile header CTA",
                }}
              >
                Start a project
              </QuickInquiryLink>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
