/**
 * Portfolio gallery data — the 99 tiles rendered on /portfolio (33 rows × 3).
 *
 * Three tile kinds:
 *  - "image"    static render (click → enlarged in a lightbox)
 *  - "panorama" equirectangular 360 (click → draggable Pannellum viewer). `full`
 *               is the 4096×2048 equirectangular jpg; `src` is a 4:3 preview thumb.
 *  - "video"    architectural animation (click → player). `full` is the mp4;
 *               `src` is the poster webp.
 *
 * Compressed assets are produced by scripts/build-portfolio-images.mjs and
 * scripts/build-portfolio-videos.mjs from the local P:\ masters (never committed).
 */

export type PortfolioTile =
  | { kind: "image"; src: string; alt: string; label: string }
  | { kind: "panorama"; src: string; full: string; alt: string; label: string }
  | { kind: "video"; src: string; full: string; alt: string; label: string };

const A = "/artwork";
const P = "/artwork/portfolio";
const nn = (i: number) => String(i + 1).padStart(2, "0");

/** Existing 4-variant static-render categories (…-01..04.webp), kept as-is. */
const keptGroup = (label: string, base: string): PortfolioTile[] =>
  Array.from({ length: 4 }, (_, i) => ({
    kind: "image" as const,
    src: `${A}/${base}-0${i + 1}.webp`,
    alt: `${label} — example ${i + 1}, Elegant Render`,
    label,
  }));

const KEPT: PortfolioTile[] = [
  ...keptGroup("Interior renders", "portfolio-interior-static"),
  ...keptGroup("Aerial renders", "portfolio-aerial"),
  ...keptGroup("3D streetscape", "portfolio-streetscape"),
  ...keptGroup("Landscape design", "portfolio-landscape-design"),
  ...keptGroup("Render in a site photo", "portfolio-photomontage"),
  ...keptGroup("Day-to-dusk", "portfolio-day-to-dusk"),
  ...keptGroup("3D site plan", "portfolio-3d-site-plan"),
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-one-bedroom-apartment.webp`, alt: "3D floor plan of a one-bedroom apartment, Elegant Render", label: "3D floor plans" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-one-bedroom-open-concept.webp`, alt: "3D floor plan of an open-concept one-bedroom apartment, Elegant Render", label: "3D floor plans" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-duplex-two-levels.webp`, alt: "3D floor plan of a two-level duplex, Elegant Render", label: "3D floor plans" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-house-with-garage.webp`, alt: "3D floor plan of a house with a garage, Elegant Render", label: "3D floor plans" },
];

/** New interior renders (interior-01..19.webp). */
const INTERIOR_ALT = [
  "Bathroom — interior render, Elegant Render",
  "Living room — interior render, Elegant Render",
  "Kitchen — interior render, Elegant Render",
  "Bedroom — interior render, Elegant Render",
  "Basement pool — interior render, Elegant Render",
  "Sauna — interior render, Elegant Render",
  "Master bedroom — interior render, Elegant Render",
  "Bathroom — interior render, Elegant Render",
  "Living and dining room — interior render, Elegant Render",
  "Living room of a two-bedroom apartment — interior render, Elegant Render",
  "Media room — interior render, Elegant Render",
  "Dining room — interior render, Elegant Render",
  "Massage room — interior render, Elegant Render",
  "Virtually staged space — interior render, Elegant Render",
  "Upstairs bedroom — interior render, Elegant Render",
  "Kitchen — interior render, Elegant Render",
  "Living room — interior render, Elegant Render",
  "Bedroom — interior render, Elegant Render",
  "Hallway and living room — interior render, Elegant Render",
];
const NEW_INTERIOR: PortfolioTile[] = INTERIOR_ALT.map((alt, i) => ({
  kind: "image",
  src: `${P}/interior-${nn(i)}.webp`,
  alt,
  label: "Interior renders",
}));

/** New exterior renders (exterior-*.webp; 07 intentionally omitted). */
const EXTERIOR: { n: string; alt: string }[] = [
  { n: "01", alt: "Front facade — exterior render, Elegant Render" },
  { n: "02", alt: "Night view of an A-frame house — exterior render, Elegant Render" },
  { n: "03", alt: "Side view of the building — exterior render, Elegant Render" },
  { n: "04", alt: "Aerial view of a complex — exterior render, Elegant Render" },
  { n: "05", alt: "Front facade — exterior render, Elegant Render" },
  { n: "06", alt: "Terraced residential building on a slope — exterior render, Elegant Render" },
  { n: "08", alt: "Residential complex — exterior render, Elegant Render" },
  { n: "09", alt: "Night view — exterior render, Elegant Render" },
  { n: "10", alt: "Front view of the building — exterior render, Elegant Render" },
  { n: "11", alt: "Front facade of the building — exterior render, Elegant Render" },
  { n: "12", alt: "Side view of the building — exterior render, Elegant Render" },
  { n: "13", alt: "Residential building — exterior render, Elegant Render" },
  { n: "14", alt: "Rear facade — exterior render, Elegant Render" },
];
const NEW_EXTERIOR: PortfolioTile[] = EXTERIOR.map(({ n, alt }) => ({
  kind: "image",
  src: `${P}/exterior-${n}.webp`,
  alt,
  label: "Exterior renders",
}));

/** 3D floor plans — original "3D floor plans" set (osnova-01..04.webp). */
const OSNOVA: { file: string; alt: string }[] = [
  { file: "3d-floor-plan-01", alt: "3D floor plan from a bird's-eye perspective, Elegant Render" },
  { file: "3d-floor-plan-02", alt: "3D floor plan of an apartment, Elegant Render" },
  { file: "3d-floor-plan-03", alt: "3D floor plan of an A-frame house, Elegant Render" },
  // osnova-04 replaced by the "Levi stan" duplex 3D floor plan (fresh,
  // cache-safe filename so the CDN serves the new bytes).
  {
    file: "3d-floor-plan-duplex-left-unit",
    alt: "3D floor plan of a duplex apartment — left unit, Elegant Render",
  },
];
const NEW_OSNOVA: PortfolioTile[] = OSNOVA.map(({ file, alt }) => ({
  kind: "image",
  src: `${P}/${file}.webp`,
  alt,
  label: "3D floor plans",
}));

/** More 3D floor plans (3d-floor-plan-space-01..04.webp), shown under "3D floor plans". */
const OSNOVA_PROSTORA_ALT = [
  "3D floor plan from a bird's-eye perspective, Elegant Render",
  "3D floor plan of a ground floor, Elegant Render",
  "3D floor plan of the first and second floor, Elegant Render",
  "3D floor plan with a garage, Elegant Render",
];
const NEW_OSNOVA_PROSTORA: PortfolioTile[] = OSNOVA_PROSTORA_ALT.map((alt, i) => ({
  kind: "image",
  src: `${P}/3d-floor-plan-space-${nn(i)}.webp`,
  alt,
  label: "3D floor plans",
}));

/** Interactive 360 panoramas (360-01..19): thumb .webp + full -full.jpg. */
const PANO_META: { label: string; alt: string }[] = [
  { label: "Interior 360 tour", alt: "360 tour — living room, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — kitchen and living area, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — bedroom, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — bathroom, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — living area, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — pool, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — spa, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — sauna, Elegant Render" },
  { label: "Exterior 360 tour", alt: "360 tour — rooftop terrace, Elegant Render" },
  { label: "Exterior 360 tour", alt: "360 tour — exterior, Elegant Render" },
  { label: "Exterior 360 tour", alt: "360 tour — villa exterior, Elegant Render" },
  { label: "Exterior 360 tour", alt: "360 tour — exterior, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — living area, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — main hall, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — living room, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — interior, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — café, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — bedroom, Elegant Render" },
  { label: "Interior 360 tour", alt: "360 tour — living and dining room, Elegant Render" },
];
const PANORAMAS: PortfolioTile[] = PANO_META.map((m, i) => ({
  kind: "panorama",
  src: `${P}/360-${nn(i)}.webp`,
  full: `${P}/360-${nn(i)}-full.jpg`,
  alt: m.alt,
  label: m.label,
}));

/** Architectural animations (video-01..08.mp4 + poster .webp). */
const VIDEO_ALT = [
  "Animation — A-frame house, Elegant Render",
  "Animation — second floor, Elegant Render",
  "Animation — apartment floor plan, Elegant Render",
  "Animation — walkthrough of an apartment, Elegant Render",
  "Animation — residential building, Elegant Render",
  "Animation — interior, Elegant Render",
  "Animation — ground floor, Elegant Render",
  "Animation — A-frame house, Elegant Render",
];
const VIDEOS: PortfolioTile[] = VIDEO_ALT.map((alt, i) => ({
  kind: "video",
  src: `${P}/video-${nn(i)}.webp`,
  full: `${P}/video-${nn(i)}.mp4`,
  alt,
  label: "Architectural animation",
}));

/**
 * Round-robin by category label so the grid mixes categories and media kinds
 * (a panorama and a video surface early, not clumped). Deterministic → stable
 * SSR output.
 */
function interleave(tiles: PortfolioTile[]): PortfolioTile[] {
  const buckets = new Map<string, PortfolioTile[]>();
  for (const t of tiles) {
    const list = buckets.get(t.label);
    if (list) list.push(t);
    else buckets.set(t.label, [t]);
  }
  const lists = [...buckets.values()];
  const out: PortfolioTile[] = [];
  for (let round = 0; out.length < tiles.length; round++) {
    for (const list of lists) {
      if (round < list.length) out.push(list[round]);
    }
  }
  return out;
}

export const PORTFOLIO_TILES: PortfolioTile[] = interleave([
  ...KEPT,
  ...NEW_INTERIOR,
  ...NEW_EXTERIOR,
  ...NEW_OSNOVA,
  ...NEW_OSNOVA_PROSTORA,
  ...PANORAMAS,
  ...VIDEOS,
]);
