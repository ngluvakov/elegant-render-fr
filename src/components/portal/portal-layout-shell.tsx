"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PortalSidebar } from "./portal-sidebar";
import { PortalTopbar } from "./portal-topbar";

type PortalLayoutShellProps = {
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
  children: React.ReactNode;
};

export function PortalLayoutShell({
  userName,
  userEmail,
  isAdmin,
  children,
}: PortalLayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar md:block">
        <PortalSidebar userName={userName} userEmail={userEmail} isAdmin={isAdmin} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigacija</SheetTitle>
          <PortalSidebar userName={userName} userEmail={userEmail} isAdmin={isAdmin} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-64">
        <PortalTopbar
          showMenuTrigger
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
