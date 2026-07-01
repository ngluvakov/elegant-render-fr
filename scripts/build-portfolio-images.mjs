/**
 * build-portfolio-images.mjs — one-shot web-optimize of the curated portfolio
 * additions (stills, 360 panoramas) into public/artwork/portfolio/.
 *
 * Originals live on the local P:\ drive and are NEVER committed; only the
 * compressed outputs land in the repo.
 *
 * Outputs:
 *   - stills  → <out>.webp                (inside 2000px, q82 — grid crops via CSS,
 *                                           lightbox shows the full uncropped image)
 *   - pano    → 360-NN.webp (thumb, cover 1600x1200) + 360-NN-full.jpg
 *                                           (equirectangular, inside 4096 → 4096x2048, q80)
 *
 * Run: node scripts/build-portfolio-images.mjs
 */

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const BASE = "P:\\Promo\\White Rook\\Kontent za freelance sajtove";
const OUT = join(process.cwd(), "public", "artwork", "portfolio");

const F_ENT = "Render Enterijera";
const F_EXT = "Render Eksterijera";
const F_FP = "3D floor planovi";
const F_360 = "360 renderi";

/** Still-image jobs: { folder, src, out } → <out>.webp (uncropped, ≤2000px). */
const STILLS = [
  // --- Interior (14) ---
  { folder: F_ENT, src: "2304-3DRD1_E_1-Bathroom.jpg", out: "enterijer-01" },
  { folder: F_ENT, src: "2404-3DRD2_E_1- Living room.0000.jpg", out: "enterijer-02" },
  { folder: F_ENT, src: "2404-INR1_E_4-_-Static_Kitchen.0000.jpg", out: "enterijer-03" },
  { folder: F_ENT, src: "2308-3DRD2_E_5 -House A_3 Sprat Levi Stan-Bedroom.0000.jpg", out: "enterijer-04" },
  { folder: F_ENT, src: "2405-FP1_E_1- Basement Pool.jpg", out: "enterijer-05" },
  { folder: F_ENT, src: "2405-FP1_E_1- Basement Sauna 02.jpg", out: "enterijer-06" },
  { folder: F_ENT, src: "2407-INR1_E_2- MidF Master bedroom 22.08-.jpg", out: "enterijer-07" },
  { folder: F_ENT, src: "2404-INR1_E_4- Bathroom 1.0000.jpg", out: "enterijer-08" },
  { folder: F_ENT, src: "2410-FP1_E_3- 101 Living-Dining.jpg", out: "enterijer-09" },
  { folder: F_ENT, src: "2406-3DFP2_E_1-Stan_4_TROSOBAN_Living static.jpg", out: "enterijer-10" },
  { folder: F_ENT, src: "2404-INR1_E_4- Game room 3 First and Second Floor.jpg", out: "enterijer-11" },
  { folder: F_ENT, src: "2504-INR1_E_4- Slika 3 Ulaz A Apartman 4-Static_Dining_Rew_09.05.0000.jpg", out: "enterijer-12" },
  { folder: F_ENT, src: "2405-FP1_E_1- Basement Massag Room.jpg", out: "enterijer-13" },
  { folder: F_ENT, src: "2408-0_PROJEKAT_STAGING-A_E_2-V2_.0000.jpg", out: "enterijer-14" },
  // --- Exterior (10) ---
  { folder: F_EXT, src: "2401-3DRD_E_1- Eksterijer_prednja_strana_26.01_.0000.jpg", out: "eksterijer-01" },
  { folder: F_EXT, src: "2404-3DRD2_E_1- Exterior night A Frame,3TH V2 23.05.jpg", out: "eksterijer-02" },
  { folder: F_EXT, src: "2409-EXR1_E_1- Left.jpg", out: "eksterijer-03" },
  { folder: F_EXT, src: "2504-EXR1_E_1- Aerial-Left_Side_View.jpg", out: "eksterijer-04" },
  { folder: F_EXT, src: "Gossau Front.jpg", out: "eksterijer-05" },
  { folder: F_EXT, src: "2303-CSM2_E_1 view 1 - 29.03.jpg", out: "eksterijer-06" },
  { folder: F_EXT, src: "Zlatibor kompleks Back.jpg", out: "eksterijer-08" },
  { folder: F_EXT, src: "Left Night.jpg", out: "eksterijer-09" },
  { folder: F_EXT, src: "2504-EXR1_E_1-Front-16_13_.jpg", out: "eksterijer-10" },
  // --- Floor plans (4) ---
  { folder: F_FP, src: "2404-FP1K_E_1-_Camera-Bird Eye_rew05.18-.0000.png", out: "osnova-01" },
  { folder: F_FP, src: "2410-FP1_E_4-Floorplan.0000.jpg", out: "osnova-02" },
  { folder: F_FP, src: "2402-3DFP_E_1- A frame FP.0000.jpg", out: "osnova-03" },
  { folder: F_FP, src: "2308-3DRD2_E_6- DUPLEX FP - Levi Stan clean.0000.jpg", out: "osnova-04" },

  // --- "Osnove prostora" replacement: more 3D floor plans (4) ---
  { folder: F_FP, src: "2404-FP1K_E_1- 21.05.png", out: "osnova-prostora-01" },
  { folder: F_FP, src: "2404-FP1_E_4-_Ground Floor.jpg", out: "osnova-prostora-02" },
  { folder: F_FP, src: "2404-INR1_E_4- FLoor Plan First And Second.jpg", out: "osnova-prostora-03" },
  { folder: F_FP, src: "2310-F_3DFP1_E_5 - Garaza1.0000.jpg", out: "osnova-prostora-04" },

  // --- Replacement stills for removed Virtuelno/Virtuelna/Uklanjanje: interior (5) ---
  { folder: F_ENT, src: "2407-INR1_E_2- Bedroom 2ndFloor.jpg", out: "enterijer-15" },
  { folder: F_ENT, src: "2410-FP1_E_2- 002_Kitchen.jpg", out: "enterijer-16" },
  { folder: F_ENT, src: "2504-INR1_E_4- Slika 3 Ulaz A Apartman 4-Static_Living_Rew_09.05.0000.jpg", out: "enterijer-17" },
  { folder: F_ENT, src: "2410-FP1_E_3- 102 Bedroom.jpg", out: "enterijer-18" },
  { folder: F_ENT, src: "Ulaz B Apartman 7 Jednoiposoban-Static_Hallway_Living_1.jpg", out: "enterijer-19" },

  // --- Replacement stills: exterior (4) ---
  { folder: F_EXT, src: "2407-EXR1_E_1- EXT Front.jpg", out: "eksterijer-11" },
  { folder: F_EXT, src: "Gossau Right.jpg", out: "eksterijer-12" },
  { folder: F_EXT, src: "OAZA V8.jpg", out: "eksterijer-13" },
  { folder: F_EXT, src: "ZVEZDA_Static_Back.jpg", out: "eksterijer-14" },
];

/** Panorama jobs (16): { src } → 360-NN.webp (thumb) + 360-NN-full.jpg. */
const PANORAMAS = [
  "2401-3DRD_E_1- 2 Floor - Living .jpg",
  "2311-FP1_E_1-Kitchen Living 12.13.0000.jpg",
  "2404-INR1_E_1-_-360_Bedroom.0000.jpg",
  "2404-INR1_E_1-_360_Bathroom.0000.jpg",
  "2404-INT1K_E_1_360-Livingroom.jpg",
  "2405-FP1_E_1- Basement 360_Pool.jpg",
  "2405-FP1_E_1- Basement 360_Spa.jpg",
  "2405-FP1_E_1- Basement 360_Sauna_001.jpg",
  "2404-INR1_E_5- 360 Balcony Rooftop.0000.jpg",
  "2404-INR1_E_2-_-360_Outdoor.0000.jpg",
  "2404-INR1_E_4- Mastermind Villa - 1st Floor_360 - Outdoor.0000.jpg",
  "2411-EXT1_E_1- 5.jpg",
  "2310-3DRC1_E_2 - Tiny  House Single Floor Living-Dining-Rew21.01_.0000.jpg",
  "2405-FP1_E_1- Ground-360_Main_Hall_1_.jpg",
  "2404-INR1_E_4- 360 Living2 Ground Floor.0000.jpg",
  "2503-RN1_E_2- ponovo.0000.jpg",
  // --- 3 more 360 panoramas (replacement) ---
  "2405-FP1_E_1- Basement 360_Caffe.jpg",
  "2404-INT1K_E_1_360-Bedroom_1.jpg",
  "2305-3DRD1_E_1- Ivy - Living_Dinning.jpg",
];

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
const pad2 = (n) => String(n).padStart(2, "0");

async function processStill(job) {
  const srcPath = join(BASE, job.folder, job.src);
  const outPath = join(OUT, `${job.out}.webp`);
  await sharp(srcPath)
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);
  const after = await stat(outPath);
  console.log(`  ${job.out}.webp`.padEnd(24) + ` ${kb(after.size)}`);
}

async function processPanorama(src, idx) {
  const n = pad2(idx + 1);
  const srcPath = join(BASE, F_360, src);
  const thumbPath = join(OUT, `360-${n}.webp`);
  const fullPath = join(OUT, `360-${n}-full.jpg`);

  // Thumbnail: normal-looking forward slice (center cover-crop to 4:3).
  await sharp(srcPath)
    .resize(1600, 1200, { fit: "cover", position: "center" })
    .webp({ quality: 82, effort: 6 })
    .toFile(thumbPath);

  // Full equirectangular for the Pannellum viewer (2:1, ≤4096 wide).
  await sharp(srcPath)
    .resize({ width: 4096, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(fullPath);

  const t = await stat(thumbPath);
  const f = await stat(fullPath);
  console.log(`  360-${n}`.padEnd(24) + ` thumb ${kb(t.size)}  full ${kb(f.size)}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log(`\nStills → ${OUT}`);
  let failures = 0;
  for (const job of STILLS) {
    try {
      await processStill(job);
    } catch (e) {
      failures++;
      console.error(`  ! FAILED ${job.out} (${job.src}): ${e.message}`);
    }
  }

  console.log(`\nPanoramas → ${OUT}`);
  for (let i = 0; i < PANORAMAS.length; i++) {
    try {
      await processPanorama(PANORAMAS[i], i);
    } catch (e) {
      failures++;
      console.error(`  ! FAILED 360-${pad2(i + 1)} (${PANORAMAS[i]}): ${e.message}`);
    }
  }

  console.log(`\nDone. ${failures ? failures + " FAILURES ⚠" : "all ok"}`);
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
