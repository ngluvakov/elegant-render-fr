/**
 * SiteHeader — sticky marketing header per the White Rook design handoff:
 * 72px tall, rgba(255,255,255,0.85) + 12px backdrop blur, 1px bottom
 * border. Left: ER logo (48px) + wordmark; center: nav links with a
 * hover mega-menu on "Services"; right: "Sign in" (secondary) +
 * "Start a project" (primary green). The old "powered by White Rook"
 * badge is removed — White Rook attribution lives in the footer only.
 *
 * Used on: marketing layout (all public pages).
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Collapsible } from "@/components/ui/collapsible";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SERVICES,
  getServicesByCategory,
} from "@/lib/catalog/services";
import { formatPublicPriceText } from "@/lib/catalog/display-currency";
import { SITE_FEATURES } from "@/lib/site-features";
import { cn } from "@/lib/utils";

const MAIN_NAV: Array<{ href: string; label: string; pattern: string }> = [
  { href: "/ai-studio", label: "AI Studio", pattern: "/ai-studio" },
  { href: "/pricing", label: "Pricing", pattern: "/pricing" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio", pattern: "/portfolio" }]
    : []),
  { href: "/blog", label: "Blog", pattern: "/blog" },
  { href: "/faq", label: "FAQ", pattern: "/faq" },
  { href: "/career", label: "Career", pattern: "/career" },
  { href: "/contact", label: "Contact", pattern: "/contact" },
];

// Desktop "Services" mega-menu: split the visible service categories into two
// stacked columns. Each column flows independently (no cross-column grid
// gaps), so categories can be cleanly divided by a horizontal rule.
const MENU_CATEGORIES = CATEGORY_ORDER.filter((category) =>
  getServicesByCategory(category).some((service) => !service.hideFromMenu),
);
const MENU_COLUMNS = [
  MENU_CATEGORIES.slice(0, Math.ceil(MENU_CATEGORIES.length / 2)),
  MENU_CATEGORIES.slice(Math.ceil(MENU_CATEGORIES.length / 2)),
];

// The wordmark next to the logo matches the .rs header exactly: Manrope
// (the .rs body font), text-lg font-medium tracking-tight. Scoped to this
// one span — the rest of the site stays on Inter Tight.
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const SIGN_IN_CLASSES =
  "inline-flex h-9 items-center rounded-[4px] border border-[#111111] bg-white px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary";
const START_PROJECT_CLASSES =
  "inline-flex h-9 items-center rounded-[4px] bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-[#00c77e] active:bg-[#00b372]";

// Desktop nav links keep the .com look: quiet muted text, no hover pill.
const NAV_LINK_CLASSES =
  "rounded-[4px] bg-transparent px-2.5 py-1.5 text-sm font-normal text-muted-foreground transition-colors duration-200 hover:bg-transparent hover:text-foreground hover:underline focus:bg-transparent";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayCurrency = usePublicCurrency();
  const pricingSettings = usePublicPricingSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  // Controlled NavigationMenu state so we can close the mega-menu after
  // the user clicks through a service link — Base-UI doesn't auto-close
  // on Next.js Link navigation, so the menu would otherwise stay open and
  // overlap the destination page.
  const [navMenuValue, setNavMenuValue] = useState<string | null>(null);
  const isLoggedIn = !!session?.user;

  const isActive = (pattern: string) =>
    pathname === pattern || pathname.startsWith(`${pattern}/`);

  const servicesActive =
    pathname === "/services" || pathname.startsWith("/services/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/85 backdrop-blur-[12px]">
      {/* 80px bar with a 72px logo vertically centered — same sizing and
          placement as the .rs header (BrandLogo size="xl" in an h-20 bar).
          Inner content is constrained to the same page-shell container as
          the rest of the site (max-w-[min(96vw,1720px)] px-6), so the
          logo's left edge lines up with where page content begins. */}
      <div className="mx-auto flex h-20 w-full max-w-[min(96vw,1720px)] items-center justify-between gap-8 px-6">
        <Link
          href="/"
          className="flex h-20 items-center gap-3 text-foreground"
          aria-label="Elegant Render — home"
        >
          <Image
            src="/branding/er-logo-black.png"
            alt="Elegant Render"
            width={2011}
            height={3186}
            priority
            className="h-[4.5rem] w-auto"
          />
          <span className="hidden items-center sm:inline-flex">
            <span
              className={cn(
                manrope.className,
                "text-lg font-medium tracking-tight text-foreground",
              )}
            >
              Elegant Render
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <NavigationMenu
          value={navMenuValue}
          onValueChange={setNavMenuValue}
          className="hidden max-w-none flex-1 justify-center md:flex"
        >
          <NavigationMenuList className="gap-1.5">
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  NAV_LINK_CLASSES,
                  "h-auto hover:no-underline data-popup-open:bg-transparent data-popup-open:text-foreground data-open:bg-transparent data-open:text-foreground",
                  servicesActive && "text-foreground",
                )}
              >
                Services
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[min(92vw,640px)] p-5">
                  <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/50 pb-3">
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Services
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        Everything from the official price list
                      </p>
                    </div>
                    <NavigationMenuLink
                      render={
                        <Link
                          href="/services"
                          onClick={() => setNavMenuValue(null)}
                          className="text-xs font-medium text-accent hover:underline"
                        />
                      }
                    >
                      View all
                      <ArrowRight className="ml-1 inline h-3 w-3" />
                    </NavigationMenuLink>
                  </div>

                  {/*
                    Two stacked columns (not an auto grid/multicol): each
                    column flows its categories independently, so there are no
                    cross-column row gaps, and a horizontal rule cleanly
                    separates categories within a column (skipped on the first
                    of each column so no stray line floats at the top).
                  */}
                  <div className="grid gap-x-6 sm:grid-cols-2">
                    {MENU_COLUMNS.map((column, columnIndex) => (
                      <div key={columnIndex}>
                        {column.map((category, indexInColumn) => {
                          const services = getServicesByCategory(
                            category,
                          ).filter((s) => !s.hideFromMenu);
                          return (
                            <div
                              key={category}
                              className={cn(
                                "space-y-1",
                                indexInColumn > 0 &&
                                  "mt-4 border-t border-border/50 pt-4",
                              )}
                            >
                              <p className="px-2 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                {CATEGORY_LABELS[category]}
                              </p>
                              {services.map((service) => (
                                <NavigationMenuLink
                                  key={service.slug}
                                  render={
                                    <Link
                                      href={`/services/${service.slug}`}
                                      onClick={() => setNavMenuValue(null)}
                                    />
                                  }
                                  className="!flex items-center justify-between gap-3 rounded-[4px] px-2 py-1.5"
                                >
                                  <span className="text-sm text-foreground">
                                    {service.name}
                                  </span>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    from{" "}
                                    {formatPublicPriceText(
                                      service.variants[0].priceLabel,
                                      displayCurrency,
                                      pricingSettings,
                                    )}
                                  </span>
                                </NavigationMenuLink>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {MAIN_NAV.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  render={
                    <Link
                      href={item.href}
                      onClick={() => setNavMenuValue(null)}
                    />
                  }
                  className={cn(
                    NAV_LINK_CLASSES,
                    isActive(item.pattern) && "text-foreground",
                  )}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

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
              <button
                type="button"
                onClick={() => setMobileServicesOpen((v) => !v)}
                className={cn(
                  "flex items-center justify-between rounded-[4px] px-3 py-2.5 text-left text-lg text-foreground transition-colors duration-200 hover:bg-secondary",
                  servicesActive && "bg-secondary",
                )}
                aria-expanded={mobileServicesOpen}
              >
                Services
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    mobileServicesOpen && "rotate-180",
                  )}
                />
              </button>

              <Collapsible open={mobileServicesOpen}>
                <div className="ml-2 border-l border-border/60 pl-3">
                  <Link
                    href="/services"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-[4px] px-2 py-2 text-sm font-medium text-accent transition-colors duration-200 hover:bg-secondary"
                  >
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  {SERVICES.map((service) => (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-[4px] px-2 py-2 text-sm text-foreground/80 transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                    >
                      <span>{service.name}</span>
                      <span className="text-xs text-muted-foreground">
                        from{" "}
                        {formatPublicPriceText(
                          service.variants[0].priceLabel,
                          displayCurrency,
                          pricingSettings,
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              </Collapsible>

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
