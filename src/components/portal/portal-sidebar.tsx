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
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  ReceiptText,
  Shield,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/brand-logo";
import { signOutAction } from "@/server/actions/sign-out";
import {
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/admin-permissions";

const CLIENT_NAV = [
  { href: "/portal", label: "Vue d’ensemble", icon: LayoutDashboard, exact: true },
  { href: "/portal/orders", label: "Commandes", icon: ShoppingBag, exact: false },
  { href: "/portal/finance", label: "Finances", icon: ReceiptText, exact: false },
  { href: "/portal/ai-studio", label: "AI Studio", icon: ImageIcon, exact: false },
  { href: "/portal/ai-creations", label: "Créations IA", icon: Images, exact: false },
  { href: "/portal/profile", label: "Profil", icon: User, exact: true },
];

const ADMIN_NAV: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
  permission?: AdminPermission;
}> = [
  { href: "/portal/admin", label: "Admin", icon: Shield, exact: true },
  {
    href: "/portal/admin/analytics",
    label: "Statistiques",
    icon: BarChart3,
    exact: false,
    permission: "ANALYTICS_VIEW",
  },
  { href: "/portal/ai-studio", label: "AI Studio", icon: ImageIcon, exact: false },
  {
    href: "/portal/ai-creations",
    label: "Créations IA",
    icon: Images,
    exact: false,
  },
  {
    href: "/portal/admin/inquiries",
    label: "Demandes",
    icon: Inbox,
    exact: false,
    permission: "INQUIRIES_MANAGE",
  },
  {
    href: "/portal/admin/vr-inquiries",
    label: "Demandes VR",
    icon: Headphones,
    exact: false,
    permission: "INQUIRIES_MANAGE",
  },
  {
    href: "/portal/admin/ai-studio",
    label: "Générations IA",
    icon: ImageIcon,
    exact: false,
    permission: "USAGE_VIEW",
  },
  {
    href: "/portal/admin/chat-feedback",
    label: "Requêtes IA",
    icon: MessageSquareWarning,
    exact: false,
    permission: "ANALYTICS_VIEW",
  },
  {
    href: "/portal/admin/users",
    label: "Utilisateurs",
    icon: User,
    exact: false,
    permission: "USERS_VIEW",
  },
  {
    href: "/portal/admin/finance/pricebook",
    label: "Grille tarifaire",
    icon: ReceiptText,
    exact: false,
    permission: "FINANCE_MANAGE",
  },
  {
    href: "/portal/admin/finance/export",
    label: "Export de factures",
    icon: ReceiptText,
    exact: false,
    permission: "FINANCE_VIEW",
  },
  {
    href: "/portal/admin/revisions",
    label: "Révisions",
    icon: Shield,
    exact: false,
    permission: "AUDIT_VIEW",
  },
  {
    href: "/portal/admin/outbox",
    label: "Boîte d’envoi",
    icon: MessageSquareWarning,
    exact: false,
    permission: "SYSTEM_MANAGE",
  },
  { href: "/portal/profile", label: "Profil", icon: User, exact: true },
];

type PortalSidebarProps = {
  userName: string;
  userEmail: string;
  adminPermissions?: AdminPermission[];
};

export function PortalSidebar({
  userName,
  userEmail,
  adminPermissions = [],
}: PortalSidebarProps) {
  const pathname = usePathname();
  const isAdmin = adminPermissions.length > 0;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const navItems = isAdmin
    ? ADMIN_NAV.filter(
        (item) =>
          !item.permission ||
          hasAdminPermission(adminPermissions, item.permission),
      )
    : CLIENT_NAV;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <BrandLogo size="sm" surface="dark" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[4px] border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                active
                  ? "border-l-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                  : "border-l-transparent text-white/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
          className="flex items-center gap-3 rounded-[4px] px-3 py-2 text-xs text-white/50 transition-colors hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Retour au site
        </Link>

        {/* User info + sign out */}
        <div className="flex items-center gap-3 rounded-[4px] bg-sidebar-accent px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {userName}
            </p>
            <p className="truncate text-[0.72rem] text-white/50">
              {userEmail}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Se déconnecter"
              className="rounded-[4px] p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
