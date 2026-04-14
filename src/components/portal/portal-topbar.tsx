/**
 * PortalTopbar — Top bar showing the current section title, breadcrumb for
 * order detail pages, and a mobile menu trigger button.
 *
 * Used on: PortalLayoutShell (all /portal/* pages).
 */
"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const SECTION_NAMES: Record<string, string> = {
  "/portal": "Pregled",
  "/portal/porudzbine": "Porudžbine",
  "/portal/profil": "Profil",
};

type PortalTopbarProps = {
  onMenuClick?: () => void;
  showMenuTrigger?: boolean;
};

export function PortalTopbar({
  onMenuClick,
  showMenuTrigger,
}: PortalTopbarProps) {
  const pathname = usePathname();

  // Find matching section name
  let sectionName = "Portal";
  for (const [path, name] of Object.entries(SECTION_NAMES)) {
    if (pathname === path || (path !== "/portal" && pathname.startsWith(path))) {
      sectionName = name;
      break;
    }
  }

  // Order detail breadcrumb
  const isOrderDetail = pathname.match(/\/portal\/porudzbine\/(.+)/);

  return (
    <div className="flex h-14 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur lg:px-6">
      {showMenuTrigger && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Otvori meni"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{sectionName}</span>
        {isOrderDetail && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-muted-foreground">Detalji</span>
          </>
        )}
      </div>
    </div>
  );
}
