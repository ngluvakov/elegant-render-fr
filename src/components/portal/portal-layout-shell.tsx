/**
 * PortalLayoutShell — Main portal layout with a fixed sidebar on desktop,
 * a mobile drawer, and a topbar. Wraps all /portal/* page content.
 *
 * Used on: /portal layout (all portal pages).
 */
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PortalSidebar } from "./portal-sidebar";
import { PortalTopbar } from "./portal-topbar";
import { SetPasswordBanner } from "./set-password-banner";
import type { AdminPermission } from "@/lib/admin-permissions";

type PortalLayoutShellProps = {
  userName: string;
  userEmail: string;
  adminPermissions?: AdminPermission[];
  hasPassword: boolean;
  children: React.ReactNode;
};

export function PortalLayoutShell({
  userName,
  userEmail,
  adminPermissions = [],
  hasPassword,
  children,
}: PortalLayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar md:block">
        <PortalSidebar
          userName={userName}
          userEmail={userEmail}
          adminPermissions={adminPermissions}
        />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <PortalSidebar
            userName={userName}
            userEmail={userEmail}
            adminPermissions={adminPermissions}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-64">
        <PortalTopbar
          showMenuTrigger
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          {!hasPassword && <SetPasswordBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
