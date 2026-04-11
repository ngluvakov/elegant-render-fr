"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SERVICES,
  getServicesByCategory,
} from "@/lib/catalog/services";
import { cn } from "@/lib/utils";

const MAIN_NAV: Array<{ href: string; label: string; pattern: string }> = [
  { href: "/cene", label: "Cene", pattern: "/cene" },
  { href: "/portfolio", label: "Portfolio", pattern: "/portfolio" },
  { href: "/o-nama", label: "O nama", pattern: "/o-nama" },
  { href: "/kontakt", label: "Kontakt", pattern: "/kontakt" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const isActive = (pattern: string) =>
    pathname === pattern || pathname.startsWith(`${pattern}/`);

  const servicesActive = pathname === "/usluge" || pathname.startsWith("/usluge/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <BrandLogo />

        {/* Desktop nav */}
        <NavigationMenu className="hidden max-w-none flex-1 justify-center md:flex">
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
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Usluge
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        Sve iz zvaničnog Model-First cenovnika
                      </p>
                    </div>
                    <NavigationMenuLink
                      render={
                        <Link
                          href="/usluge"
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
                      const services = getServicesByCategory(category);
                      if (services.length === 0) return null;
                      return (
                        <div key={category} className="space-y-1">
                          <p className="px-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {CATEGORY_LABELS[category]}
                          </p>
                          {services.map((service) => (
                            <NavigationMenuLink
                              key={service.slug}
                              render={
                                <Link href={`/usluge/${service.slug}`} />
                              }
                              className="!flex items-center justify-between gap-3 px-2 py-1.5"
                            >
                              <span className="text-sm text-foreground">
                                {service.name}
                              </span>
                              <span className="text-[0.65rem] font-medium text-muted-foreground">
                                od {service.variants[0].priceLabel}
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
                  render={<Link href={item.href} />}
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

        <div className="hidden md:block">
          <ButtonLink href="/kontakt" size="sm" variant="accent">
            Pošaljite projekat
          </ButtonLink>
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
                    "h-4 w-4 transition-transform",
                    mobileServicesOpen && "rotate-180",
                  )}
                />
              </button>

              {mobileServicesOpen && (
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
                      <span className="text-[0.65rem] text-muted-foreground">
                        od {service.variants[0].priceLabel}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

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

            <ButtonLink
              href="/kontakt"
              onClick={() => setMobileOpen(false)}
              variant="accent"
              className="mt-auto"
            >
              Pošaljite projekat
            </ButtonLink>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
