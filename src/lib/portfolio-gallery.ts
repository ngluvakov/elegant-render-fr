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
    alt: `${label} — primer ${i + 1}, Elegant Render`,
    label,
  }));

const KEPT: PortfolioTile[] = [
  ...keptGroup("Renderi enterijera", "portfolio-interior-static"),
  ...keptGroup("Renderi iz vazduha", "portfolio-aerial"),
  ...keptGroup("3D prikaz ulice", "portfolio-streetscape"),
  ...keptGroup("Uređenje pejzaža", "portfolio-landscape-design"),
  ...keptGroup("Render u fotografiji lokacije", "portfolio-photomontage"),
  ...keptGroup("Dnevni u noćni prikaz", "portfolio-day-to-dusk"),
  ...keptGroup("3D situacioni plan", "portfolio-3d-site-plan"),
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-one-bedroom-apartment.webp`, alt: "3D osnova jednosobnog stana, Elegant Render", label: "3D osnove" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-one-bedroom-open-concept.webp`, alt: "3D osnova jednosobnog stana otvorenog koncepta, Elegant Render", label: "3D osnove" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-duplex-two-levels.webp`, alt: "3D osnova dupleksa na dva nivoa, Elegant Render", label: "3D osnove" },
  { kind: "image", src: `${A}/portfolio-3d-floor-plans-house-with-garage.webp`, alt: "3D osnova kuće sa garažom, Elegant Render", label: "3D osnove" },
];

/** New interior renders (interior-01..19.webp). */
const INTERIOR_ALT = [
  "Kupatilo — render enterijera, Elegant Render",
  "Dnevna soba — render enterijera, Elegant Render",
  "Kuhinja — render enterijera, Elegant Render",
  "Spavaća soba — render enterijera, Elegant Render",
  "Bazen u suterenu — render enterijera, Elegant Render",
  "Sauna — render enterijera, Elegant Render",
  "Master spavaća soba — render enterijera, Elegant Render",
  "Kupatilo — render enterijera, Elegant Render",
  "Dnevni boravak i trpezarija — render enterijera, Elegant Render",
  "Dnevna soba trosobnog stana — render enterijera, Elegant Render",
  "Multimedijalna soba — render enterijera, Elegant Render",
  "Trpezarija — render enterijera, Elegant Render",
  "Prostor za masažu — render enterijera, Elegant Render",
  "Virtuelno opremljen prostor — render enterijera, Elegant Render",
  "Spavaća soba na spratu — render enterijera, Elegant Render",
  "Kuhinja — render enterijera, Elegant Render",
  "Dnevna soba — render enterijera, Elegant Render",
  "Spavaća soba — render enterijera, Elegant Render",
  "Hodnik i dnevni boravak — render enterijera, Elegant Render",
];
const NEW_INTERIOR: PortfolioTile[] = INTERIOR_ALT.map((alt, i) => ({
  kind: "image",
  src: `${P}/interior-${nn(i)}.webp`,
  alt,
  label: "Renderi enterijera",
}));

/** New exterior renders (exterior-*.webp; 07 intentionally omitted). */
const EXTERIOR: { n: string; alt: string }[] = [
  { n: "01", alt: "Prednja fasada — render eksterijera, Elegant Render" },
  { n: "02", alt: "Noćni prikaz A-frame kuće — render eksterijera, Elegant Render" },
  { n: "03", alt: "Bočni prikaz objekta — render eksterijera, Elegant Render" },
  { n: "04", alt: "Vazdušni prikaz kompleksa — render eksterijera, Elegant Render" },
  { n: "05", alt: "Prednja fasada — render eksterijera, Elegant Render" },
  { n: "06", alt: "Terasasta stambena zgrada na padini — render eksterijera, Elegant Render" },
  { n: "08", alt: "Stambeni kompleks — render eksterijera, Elegant Render" },
  { n: "09", alt: "Noćni prikaz — render eksterijera, Elegant Render" },
  { n: "10", alt: "Prednji prikaz objekta — render eksterijera, Elegant Render" },
  { n: "11", alt: "Prednja fasada objekta — render eksterijera, Elegant Render" },
  { n: "12", alt: "Bočni prikaz objekta — render eksterijera, Elegant Render" },
  { n: "13", alt: "Stambeni objekat — render eksterijera, Elegant Render" },
  { n: "14", alt: "Zadnja fasada — render eksterijera, Elegant Render" },
];
const NEW_EXTERIOR: PortfolioTile[] = EXTERIOR.map(({ n, alt }) => ({
  kind: "image",
  src: `${P}/exterior-${n}.webp`,
  alt,
  label: "Renderi eksterijera",
}));

/** 3D floor plans — original "3D osnove" set (osnova-01..04.webp). */
const OSNOVA: { file: string; alt: string }[] = [
  { file: "3d-floor-plan-01", alt: "3D osnova iz ptičje perspektive, Elegant Render" },
  { file: "3d-floor-plan-02", alt: "3D osnova stana, Elegant Render" },
  { file: "3d-floor-plan-03", alt: "3D osnova A-frame kuće, Elegant Render" },
  // osnova-04 replaced by the "Levi stan" duplex 3D floor plan (fresh,
  // cache-safe filename so the CDN serves the new bytes).
  {
    file: "3d-floor-plan-duplex-left-unit",
    alt: "3D osnova dupleks stana — levi stan, Elegant Render",
  },
];
const NEW_OSNOVA: PortfolioTile[] = OSNOVA.map(({ file, alt }) => ({
  kind: "image",
  src: `${P}/${file}.webp`,
  alt,
  label: "3D osnove",
}));

/** More 3D floor plans (3d-floor-plan-space-01..04.webp), shown under "3D osnove". */
const OSNOVA_PROSTORA_ALT = [
  "3D osnova iz ptičje perspektive, Elegant Render",
  "3D osnova prizemlja, Elegant Render",
  "3D osnova prvog i drugog sprata, Elegant Render",
  "3D osnova sa garažom, Elegant Render",
];
const NEW_OSNOVA_PROSTORA: PortfolioTile[] = OSNOVA_PROSTORA_ALT.map((alt, i) => ({
  kind: "image",
  src: `${P}/3d-floor-plan-space-${nn(i)}.webp`,
  alt,
  label: "3D osnove",
}));

/** Interactive 360 panoramas (360-01..19): thumb .webp + full -full.jpg. */
const PANO_META: { label: string; alt: string }[] = [
  { label: "360 tura enterijera", alt: "360 tura — dnevna soba, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — kuhinja i dnevni boravak, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — spavaća soba, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — kupatilo, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — dnevni boravak, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — bazen, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — spa, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — sauna, Elegant Render" },
  { label: "360 tura eksterijera", alt: "360 tura — krovna terasa, Elegant Render" },
  { label: "360 tura eksterijera", alt: "360 tura — eksterijer, Elegant Render" },
  { label: "360 tura eksterijera", alt: "360 tura — eksterijer vile, Elegant Render" },
  { label: "360 tura eksterijera", alt: "360 tura — eksterijer, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — dnevna zona, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — glavni hol, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — dnevni boravak, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — enterijer, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — kafe, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — spavaća soba, Elegant Render" },
  { label: "360 tura enterijera", alt: "360 tura — dnevni boravak i trpezarija, Elegant Render" },
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
  "Animacija — A-frame kuća, Elegant Render",
  "Animacija — drugi sprat, Elegant Render",
  "Animacija — osnova stana, Elegant Render",
  "Animacija — šetnja kroz stan, Elegant Render",
  "Animacija — stambeni objekat, Elegant Render",
  "Animacija — enterijer, Elegant Render",
  "Animacija — prizemlje, Elegant Render",
  "Animacija — A-frame kuća, Elegant Render",
];
const VIDEOS: PortfolioTile[] = VIDEO_ALT.map((alt, i) => ({
  kind: "video",
  src: `${P}/video-${nn(i)}.webp`,
  full: `${P}/video-${nn(i)}.mp4`,
  alt,
  label: "Arhitektonska animacija",
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
