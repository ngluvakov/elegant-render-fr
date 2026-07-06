/**
 * PortfolioGallery — the /portfolio grid of tiles with a click-to-open
 * lightbox. Static renders enlarge; videos open an autoplaying player;
 * 360 panoramas are drag-to-look right in the grid.
 *
 * Thumbnails stay lightweight (one <Image> each). To keep WebGL contexts low,
 * a panorama tile only mounts its live viewer while hovered (desktop) and
 * tears it down on leave; touch devices tap to open the fullscreen viewer.
 */
"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Maximize2, Play, X } from "lucide-react";
import { Panorama360 } from "@/components/marketing/panorama-360";
import type { PortfolioTile } from "@/lib/portfolio-gallery";

type PanoramaPortfolioTile = Extract<PortfolioTile, { kind: "panorama" }>;

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
        className="object-cover"
      />

      {/* Video play button */}
      {tile.kind === "video" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[4px] bg-background/85 text-foreground shadow-sm backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </span>
      )}

      {/* Category caption on hover */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent px-3 pb-2.5 pt-10 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {tile.label}
      </span>
    </button>
  );
}

/**
 * A 360 tile that becomes a live, drag-to-look viewer on hover. The heavy
 * Pannellum viewer mounts only while hovered and is destroyed on leave, so at
 * most a couple of WebGL contexts are ever alive at once. On touch devices
 * (no hover) the tile opens the fullscreen viewer on tap.
 */
function PanoramaTile({
  tile,
  priority,
  onOpen,
}: {
  tile: PanoramaPortfolioTile;
  priority: boolean;
  onOpen: () => void;
}) {
  const [active, setActive] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  const clearLeaveTimer = () => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  // Ignore hover from coarse pointers (touch) — those tap to open fullscreen.
  const activate = (e: ReactPointerEvent) => {
    if (e.pointerType === "touch") return;
    clearLeaveTimer();
    setActive(true);
  };
  const scheduleDeactivate = () => {
    clearLeaveTimer();
    leaveTimer.current = window.setTimeout(() => setActive(false), 140);
  };

  useEffect(() => {
    return () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    };
  }, []);

  return (
    <div
      onPointerEnter={activate}
      onPointerLeave={scheduleDeactivate}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-secondary"
    >
      {/* Thumbnail — stays behind the viewer so there's no black flash while
          the panorama loads. */}
      <Image
        src={tile.src}
        alt={tile.alt}
        fill
        sizes={GRID_SIZES}
        priority={priority}
        className="object-cover"
      />

      {/* Live drag-to-look viewer — only while hovered. */}
      {active && (
        <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
          <Panorama360 src={tile.full} title={tile.alt} showZoomCtrl={false} />
        </div>
      )}

      {/* 360 badge */}
      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-foreground/75 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white/90 backdrop-blur-sm">
        360°
      </span>

      {/* Fullscreen — sits above the viewer so it works while dragging. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open fullscreen: ${tile.alt}`}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-[4px] bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {/* Tap/click-to-open surface — present only when the live viewer isn't
          up (touch devices, and desktop before hover). Removing it on hover
          lets the viewer receive the drag. */}
      {!active && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open 360° view: ${tile.alt}`}
          className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        />
      )}

      {/* Caption / drag hint on hover */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-foreground/75 to-transparent px-3 pb-2.5 pt-10 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {active ? "Drag to look around" : tile.label}
      </span>
    </div>
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
        {tiles.map((tile, i) =>
          tile.kind === "panorama" ? (
            <PanoramaTile
              key={tile.src}
              tile={tile}
              priority={i < 6}
              onOpen={() => setActive(tile)}
            />
          ) : (
            <Tile
              key={tile.src}
              tile={tile}
              priority={i < 6}
              onOpen={() => setActive(tile)}
            />
          ),
        )}
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
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-[4px] bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
