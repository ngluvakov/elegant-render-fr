/**
 * PortalSidebar — Navigation sidebar with admin vs. client link variants,
 * brand logo, user info, and sign-out button.
 *
 * Used on: PortalLayoutShell (all /portal/* pages).
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  Headphones,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Shield,
  ShoppingBag,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/brand-logo";
import { signOutAction } from "@/server/actions/sign-out";

const CLIENT_NAV = [
  { href: "/portal", label: "Pregled", icon: LayoutDashboard, exact: true },
  { href: "/portal/porudzbine", label: "Porudžbine", icon: ShoppingBag, exact: false },
  { href: "/portal/ai-studio", label: "AI Studio", icon: ImageIcon, exact: false },
  { href: "/portal/profil", label: "Profil", icon: User, exact: true },
];

const ADMIN_NAV = [
  { href: "/portal/admin", label: "Admin", icon: Shield, exact: true },
  {
    href: "/portal/admin/analitika",
    label: "Analitika",
    icon: BarChart3,
    exact: false,
  },
  { href: "/portal/ai-studio", label: "AI Studio", icon: ImageIcon, exact: false },
  {
    href: "/portal/admin/upiti",
    label: "Upiti",
    icon: Inbox,
    exact: false,
  },
  {
    href: "/portal/admin/vr-upiti",
    label: "VR upiti",
    icon: Headphones,
    exact: false,
  },
  {
    href: "/portal/admin/ai-studio",
    label: "AI generacije",
    icon: ImageIcon,
    exact: false,
  },
  {
    href: "/portal/admin/chat-feedback",
    label: "AI zahtevi",
    icon: MessageSquareWarning,
    exact: false,
  },
  { href: "/portal/profil", label: "Profil", icon: User, exact: true },
];

type PortalSidebarProps = {
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
};

export function PortalSidebar({ userName, userEmail, isAdmin }: PortalSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <BrandLogo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {(isAdmin ? ADMIN_NAV : CLIENT_NAV).map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground shadow-[0_2px_8px_rgba(28,26,25,0.04)]"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Nazad na sajt
        </Link>

        {/* User info + sign out */}
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/40 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {userName?.charAt(0)?.toUpperCase() || "K"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {userName}
            </p>
            <p className="truncate text-[0.72rem] text-muted-foreground">
              {userEmail}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Odjavite se"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
