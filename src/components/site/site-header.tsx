/**
 * SiteHeader — Sticky marketing site header with mega-menu services dropdown,
 * main navigation links, auth/portal button, and a mobile drawer.
 *
 * Used on: marketing layout (all public pages).
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, ChevronDown, Menu, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
  { href: "/cene", label: "Cene", pattern: "/cene" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio", pattern: "/portfolio" }]
    : []),
  { href: "/o-nama", label: "O nama", pattern: "/o-nama" },
  { href: "/kontakt", label: "Kontakt", pattern: "/kontakt" },
];

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

  const servicesActive = pathname === "/usluge" || pathname.startsWith("/usluge/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[min(96vw,1720px)] items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <a
            href="https://www.thewhiterook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Powered by White Rook"
            className="hidden items-center transition-opacity hover:opacity-80 sm:inline-flex"
          >
            <Image
              src="/branding/powered-by-whiterook.webp"
              alt="Powered by White Rook"
              width={480}
              height={188}
              priority
              className="h-11 w-auto"
            />
          </a>
        </div>

        {/* Desktop nav */}
        <NavigationMenu
          value={navMenuValue}
          onValueChange={setNavMenuValue}
          className="hidden max-w-none flex-1 justify-center md:flex"
        >
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "text-foreground/70 hover:text-foreground",
                  servicesActive && "text-foreground",
                )}
              >
                Usluge
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[min(92vw,640px)] p-5">
                  <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/50 pb-3">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Usluge
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        Sve iz zvaničnog cenovnika
                      </p>
                    </div>
                    <NavigationMenuLink
                      render={
                        <Link
                          href="/usluge"
                          onClick={() => setNavMenuValue(null)}
                          className="text-xs font-medium text-accent hover:underline"
                        />
                      }
                    >
                      Pogledaj sve
                      <ArrowRight className="ml-1 inline h-3 w-3" />
                    </NavigationMenuLink>
                  </div>

                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {CATEGORY_ORDER.map((category) => {
                      const services = getServicesByCategory(category).filter(
                        (s) => !s.hideFromMenu,
                      );
                      if (services.length === 0) return null;
                      return (
                        <div key={category} className="space-y-1">
                          <p className="px-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {CATEGORY_LABELS[category]}
                          </p>
                          {services.map((service) => (
                            <NavigationMenuLink
                              key={service.slug}
                              render={
                                <Link
                                  href={`/usluge/${service.slug}`}
                                  onClick={() => setNavMenuValue(null)}
                                />
                              }
                              className="!flex items-center justify-between gap-3 px-2 py-1.5"
                            >
                              <span className="text-sm text-foreground">
                                {service.name}
                              </span>
                              <span className="text-[0.72rem] font-medium text-muted-foreground">
                                od{" "}
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
                    "px-3 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground",
                    isActive(item.pattern) && "text-foreground",
                  )}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink
            href={isLoggedIn ? "/portal" : "/prijava"}
            size="sm"
            variant="outline"
          >
            <User className="mr-1.5 h-3.5 w-3.5" />
            {isLoggedIn ? "Portal" : "Prijava"}
          </ButtonLink>
          <QuickInquiryLink
            size="sm"
            variant="accent"
            inquiry={{ source: "site-header", sourceLabel: "Header CTA" }}
          >
            Pošaljite brief
          </QuickInquiryLink>
        </div>

        {/* Mobile trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            aria-label="Otvori meni"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "md:hidden",
            )}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex flex-col gap-6 overflow-y-auto p-6"
          >
            <SheetTitle className="sr-only">Glavni meni</SheetTitle>
            <BrandLogo />

            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setMobileServicesOpen((v) => !v)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-lg text-foreground transition-colors hover:bg-muted",
                  servicesActive && "bg-muted/50",
                )}
                aria-expanded={mobileServicesOpen}
              >
                Usluge
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
                    href="/usluge"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium text-accent hover:bg-muted"
                  >
                    Pogledaj sve
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  {SERVICES.map((service) => (
                    <Link
                      key={service.slug}
                      href={`/usluge/${service.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span>{service.name}</span>
                      <span className="text-[0.72rem] text-muted-foreground">
                        od{" "}
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
                    "rounded-lg px-3 py-2.5 text-lg text-foreground transition-colors hover:bg-muted",
                    isActive(item.pattern) && "bg-muted/50",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-2">
              <ButtonLink
                href={isLoggedIn ? "/portal" : "/prijava"}
                onClick={() => setMobileOpen(false)}
                variant="outline"
                className="w-full"
              >
                <User className="mr-1.5 h-3.5 w-3.5" />
                {isLoggedIn ? "Portal" : "Prijava"}
              </ButtonLink>
              <QuickInquiryLink
                onClick={() => setMobileOpen(false)}
                onOpen={() => setMobileOpen(false)}
                variant="accent"
                className="w-full"
                inquiry={{
                  source: "mobile-menu",
                  sourceLabel: "Mobile header CTA",
                }}
              >
                Pošaljite brief
              </QuickInquiryLink>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
