/**
 * PortfolioGallery — the /portfolio grid of 100 tiles with a click-to-open
 * lightbox. Static renders enlarge; 360 panoramas open the interactive
 * (drag-to-look) Pannellum viewer; videos open an autoplaying player.
 *
 * Thumbnails stay lightweight (one <Image> each); heavy viewers mount only
 * while the lightbox is open, so the page load isn't affected by 16 panoramas
 * and 8 videos.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Play, X } from "lucide-react";
import { Panorama360 } from "@/components/marketing/panorama-360";
import type { PortfolioTile } from "@/lib/portfolio-gallery";

const GRID_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

function Tile({
  tile,
  priority,
  onOpen,
}: {
  tile: PortfolioTile;
  priority: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-secondary text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Image
        src={tile.src}
        alt={tile.alt}
        fill
        sizes={GRID_SIZES}
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* 360 badge */}
      {tile.kind === "panorama" && (
        <span className="absolute left-3 top-3 rounded-full bg-foreground/75 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-background/95 backdrop-blur-sm">
          360°
        </span>
      )}

      {/* Video play button */}
      {tile.kind === "video" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </span>
      )}

      {/* Category caption on hover */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent px-3 pb-2.5 pt-10 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-background/95 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {tile.label}
      </span>
    </button>
  );
}

function LightboxMedia({ tile }: { tile: PortfolioTile }) {
  if (tile.kind === "panorama") {
    return (
      <div className="relative aspect-video w-[min(94vw,1360px)] overflow-hidden rounded-lg bg-black">
        <Panorama360 src={tile.full} title={tile.alt} />
      </div>
    );
  }

  if (tile.kind === "video") {
    return (
      <video
        src={tile.full}
        poster={tile.src}
        controls
        autoPlay
        playsInline
        className="max-h-[86vh] w-[min(94vw,1360px)] rounded-lg bg-black"
      />
    );
  }

  return (
    <div className="relative aspect-[4/3] w-[min(94vw,1200px)] max-h-[86vh] overflow-hidden rounded-lg">
      <Image
        src={tile.src}
        alt={tile.alt}
        fill
        sizes="94vw"
        className="object-contain"
      />
    </div>
  );
}

export function PortfolioGallery({ tiles }: { tiles: PortfolioTile[] }) {
  const [active, setActive] = useState<PortfolioTile | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile, i) => (
          <Tile
            key={tile.src}
            tile={tile}
            priority={i < 6}
            onOpen={() => setActive(tile)}
          />
        ))}
      </div>

      <Dialog.Root
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/85 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 focus:outline-none">
            {active && (
              <>
                <Dialog.Title className="sr-only">{active.alt}</Dialog.Title>
                <LightboxMedia tile={active} />
              </>
            )}
            <Dialog.Close
              aria-label="Zatvori"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
