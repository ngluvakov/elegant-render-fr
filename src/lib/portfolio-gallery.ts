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
    alt: `${label} — exemple ${i + 1}, Elegant Render`,
    label,
  }));

const KEPT: PortfolioTile[] = [
  ...keptGroup("Rendus d’intérieur", "portfolio-interior-static"),
  // "Aerial renders" — fresh, cache-safe files for tiles 01 (aerial
  // montage), 03 and 04; tile 02 keeps the built version.
  ...keptGroup("Rendus aériens", "portfolio-aerial").map(
    (tile, i): PortfolioTile => {
      const src =
        i === 0
          ? `${A}/portfolio-aerial-01-montage.webp`
          : i === 2
            ? `${A}/portfolio-aerial-03-v2.webp`
            : i === 3
              ? `${A}/portfolio-aerial-04-v2.webp`
              : tile.src;
      const alt =
        i === 0
          ? "Rendu aérien d’un complexe résidentiel en lumière dorée — Rendus aériens, Elegant Render"
          : tile.alt;
      return { kind: "image", src, alt, label: "Rendus aériens" };
    },
  ),
  ...keptGroup("Perspective de rue 3D", "portfolio-streetscape"),
  ...keptGroup("Aménagement paysager", "portfolio-landscape-design"),
  ...keptGroup("Rendu dans une photo du site", "portfolio-photomontage"),
  ...keptGroup("Jour au crépuscule", "portfolio-day-to-dusk"),
  // "3D site plan" — tile 01 uses a fresh, cache-safe file.
  ...keptGroup("Plan de masse 3D", "portfolio-3d-site-plan").map(
    (tile, i): PortfolioTile =>
      i === 0
        ? {
            kind: "image",
            src: `${A}/portfolio-3d-site-plan-01-v2.webp`,
            alt: tile.alt,
            label: "Plan de masse 3D",
          }
        : tile,
  ),
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-one-bedroom-apartment.webp`, alt: "Plan 3D d’un appartement d’une chambre, Elegant Render", label: "Plans 3D" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-one-bedroom-open-concept.webp`, alt: "Plan 3D d’un appartement d’une chambre à espace ouvert, Elegant Render", label: "Plans 3D" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-duplex-two-levels.webp`, alt: "Plan 3D d’un duplex sur deux niveaux, Elegant Render", label: "Plans 3D" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-house-with-garage.webp`, alt: "Plan 3D d’une maison avec garage, Elegant Render", label: "Plans 3D" },
];

/** New interior renders (interior-01..19.webp). */
const INTERIOR_ALT = [
  "Salle de bain — rendu d’intérieur, Elegant Render",
  "Salon — rendu d’intérieur, Elegant Render",
  "Cuisine — rendu d’intérieur, Elegant Render",
  "Chambre — rendu d’intérieur, Elegant Render",
  "Piscine en sous-sol — rendu d’intérieur, Elegant Render",
  "Sauna — rendu d’intérieur, Elegant Render",
  "Chambre principale — rendu d’intérieur, Elegant Render",
  "Salle de bain — rendu d’intérieur, Elegant Render",
  "Salon et salle à manger — rendu d’intérieur, Elegant Render",
  "Salon d’un appartement de deux chambres — rendu d’intérieur, Elegant Render",
  "Salle multimédia — rendu d’intérieur, Elegant Render",
  "Salle à manger — rendu d’intérieur, Elegant Render",
  "Salle de massage — rendu d’intérieur, Elegant Render",
  "Espace en home staging virtuel — rendu d’intérieur, Elegant Render",
  "Chambre à l’étage — rendu d’intérieur, Elegant Render",
  "Cuisine — rendu d’intérieur, Elegant Render",
  "Salon — rendu d’intérieur, Elegant Render",
  "Chambre — rendu d’intérieur, Elegant Render",
  "Entrée et salon — rendu d’intérieur, Elegant Render",
];
const NEW_INTERIOR: PortfolioTile[] = INTERIOR_ALT.map((alt, i) => ({
  kind: "image",
  src: `${P}/interior-${nn(i)}.webp`,
  alt,
  label: "Rendus d’intérieur",
}));

/** New exterior renders (exterior-*.webp; 07 intentionally omitted). */
const EXTERIOR: { n: string; alt: string; file?: string }[] = [
  { n: "01", alt: "Façade avant — rendu d’extérieur, Elegant Render" },
  {
    n: "02",
    alt: "Rendu d’extérieur — cour paysagée avec aire de jeux pour enfants, jardin et vue sur les montagnes, Elegant Render",
    file: "exterior-gossau-playground.webp",
  },
  { n: "03", alt: "Vue latérale du bâtiment — rendu d’extérieur, Elegant Render" },
  { n: "04", alt: "Vue aérienne d’un complexe — rendu d’extérieur, Elegant Render" },
  { n: "05", alt: "Façade avant — rendu d’extérieur, Elegant Render" },
  { n: "06", alt: "Immeuble résidentiel en terrasses à flanc de pente — rendu d’extérieur, Elegant Render" },
  { n: "08", alt: "Complexe résidentiel — rendu d’extérieur, Elegant Render" },
  { n: "09", alt: "Vue de nuit — rendu d’extérieur, Elegant Render" },
  { n: "10", alt: "Vue avant du bâtiment — rendu d’extérieur, Elegant Render" },
  { n: "11", alt: "Façade avant du bâtiment — rendu d’extérieur, Elegant Render" },
  { n: "12", alt: "Vue latérale du bâtiment — rendu d’extérieur, Elegant Render" },
  { n: "13", alt: "Immeuble résidentiel — rendu d’extérieur, Elegant Render" },
  { n: "14", alt: "Façade arrière — rendu d’extérieur, Elegant Render" },
];
const NEW_EXTERIOR: PortfolioTile[] = EXTERIOR.map(({ n, alt, file }) => ({
  kind: "image",
  src: `${P}/${file ?? `exterior-${n}.webp`}`,
  alt,
  label: "Rendus d’extérieur",
}));

/** 3D floor plans — original "3D floor plans" set (osnova-01..04.webp). */
const OSNOVA: { file: string; alt: string }[] = [
  { file: "3d-floor-plan-01", alt: "Plan 3D en vue aérienne, Elegant Render" },
  { file: "3d-floor-plan-02", alt: "Plan 3D d’un appartement, Elegant Render" },
  { file: "3d-floor-plan-03", alt: "Plan 3D d’une maison en A, Elegant Render" },
  // osnova-04 replaced by the "Levi stan" duplex 3D floor plan (fresh,
  // cache-safe filename so the CDN serves the new bytes).
  {
    file: "3d-floor-plan-duplex-left-unit",
    alt: "Plan 3D d’un duplex — logement de gauche, Elegant Render",
  },
];
const NEW_OSNOVA: PortfolioTile[] = OSNOVA.map(({ file, alt }) => ({
  kind: "image",
  src: `${P}/${file}.webp`,
  alt,
  label: "Plans 3D",
}));

/** More 3D floor plans (3d-floor-plan-space-01..04.webp), shown under "3D floor plans". */
const OSNOVA_PROSTORA_ALT = [
  "Plan 3D en vue aérienne, Elegant Render",
  "Plan 3D d’un rez-de-chaussée, Elegant Render",
  "Plan 3D du premier et du deuxième étage, Elegant Render",
  "Plan 3D avec garage, Elegant Render",
];
const NEW_OSNOVA_PROSTORA: PortfolioTile[] = OSNOVA_PROSTORA_ALT.map((alt, i) => ({
  kind: "image",
  src: `${P}/3d-floor-plan-space-${nn(i)}.webp`,
  alt,
  label: "Plans 3D",
}));

/** Interactive 360 panoramas (360-01..19): thumb .webp + full -full.jpg. */
const PANO_META: { label: string; alt: string }[] = [
  { label: "Visite 360° intérieure", alt: "Visite 360° — salon, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — cuisine et pièce de vie, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — chambre, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — salle de bain, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — pièce de vie, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — piscine, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — spa, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — sauna, Elegant Render" },
  { label: "Visite 360° extérieure", alt: "Visite 360° — toit-terrasse, Elegant Render" },
  { label: "Visite 360° extérieure", alt: "Visite 360° — extérieur, Elegant Render" },
  { label: "Visite 360° extérieure", alt: "Visite 360° — extérieur d’une villa, Elegant Render" },
  { label: "Visite 360° extérieure", alt: "Visite 360° — extérieur, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — pièce de vie, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — hall principal, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — salon, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — intérieur, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — café, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — chambre, Elegant Render" },
  { label: "Visite 360° intérieure", alt: "Visite 360° — salon et salle à manger, Elegant Render" },
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
  "Animation — maison en A, Elegant Render",
  "Animation — deuxième étage, Elegant Render",
  "Animation — plan d’appartement, Elegant Render",
  "Animation — visite virtuelle d’un appartement, Elegant Render",
  "Animation — immeuble résidentiel, Elegant Render",
  "Animation — intérieur, Elegant Render",
  "Animation — rez-de-chaussée, Elegant Render",
  "Animation — maison en A, Elegant Render",
];
const VIDEOS: PortfolioTile[] = VIDEO_ALT.map((alt, i) => ({
  kind: "video",
  src: `${P}/video-${nn(i)}.webp`,
  full: `${P}/video-${nn(i)}.mp4`,
  alt,
  label: "Animation architecturale",
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
