/**
 * optimize-3d-osnove.mjs — One-shot conversion of the new "3D osnove"
 * (3D floor-plan) masters into web-ready WebP assets for /usluge/3d-osnove.
 *
 * Source masters are tall PORTRAIT renders (3506×4958). The page frames are
 * LANDSCAPE (16:9 hero + portfolio tiles, 4:3 before/after slider), so per the
 * brief we ROTATE each plan 90° CW → landscape, then cover-crop to the target
 * frame (crop eats mostly the white margins, keeping the rooms readable).
 *
 * New files are 3d-osnove-specific (the old osnove-* files are shared with the
 * hidden "2d-i-3d-osnove" combined service and must stay untouched).
 *
 * Mapping:
 *   Type 2            → hero (detail) + listing card + portfolio tile 2
 *   Type 1 (3D)       → "posle" half + portfolio tile 1
 *   Type 1 (2D plan)  → "pre" half (2D→3D reveal)
 *   Type 3 / 3-no-bal → portfolio tiles 3 / 4
 *
 * Run: node scripts/optimize-3d-osnove.mjs
 */

import sharp from "sharp";
import { stat } from "node:fs/promises";
import { join } from "node:path";

const SRC = "J:/Marketing dept/2026/Jun 2026/2 Web page content/3D Floorplans";
const OUT = join(process.cwd(), "public", "artwork");
const EFFORT = 6;

const T1_3D = "Pre i posle/ASA - 3D Floor Plans - 1_Type 1.jpg";
const T1_2D = "Pre i posle/1_Type 1.png";
const T2 = "ASA - 3D Floor Plans - 2_Type 2.jpg";
const T3 = "ASA - 3D Floor Plans - 3_Type 3.jpg";
const T4 = "ASA - 3D Floor Plans - 4_Type 3 No Balcony.jpg";

const jobs = [
  // hero (16:9)
  { src: T2, out: "detail-3d-osnove.webp", w: 1920, h: 1080, q: 82 },
  // listing / card (4:3)
  { src: T2, out: "listing-3d-osnove.webp", w: 1200, h: 900, q: 82 },
  // before/after reveal (4:3) — 2D plan → 3D render
  { src: T1_2D, out: "problem-3d-osnove-before.webp", w: 1000, h: 750, q: 90 },
  { src: T1_3D, out: "problem-3d-osnove-after.webp", w: 1000, h: 750, q: 82 },
  // portfolio (16:9) — four distinct unit types
  { src: T1_3D, out: "portfolio-3d-osnove-tip-1.webp", w: 1600, h: 900, q: 82 },
  { src: T2, out: "portfolio-3d-osnove-tip-2.webp", w: 1600, h: 900, q: 82 },
  { src: T3, out: "portfolio-3d-osnove-tip-3.webp", w: 1600, h: 900, q: 82 },
  { src: T4, out: "portfolio-3d-osnove-tip-3-bez-balkona.webp", w: 1600, h: 900, q: 82 },
];

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;

async function main() {
  for (const j of jobs) {
    const srcPath = join(SRC, j.src);
    const outPath = join(OUT, j.out);
    const before = await stat(srcPath);

    await sharp(srcPath)
      .rotate(90) // portrait → landscape
      .resize(j.w, j.h, { fit: "cover", position: "center" })
      .webp({ quality: j.q, effort: EFFORT })
      .toFile(outPath);

    const after = await stat(outPath);
    console.log(`${j.out.padEnd(40)} ${j.w}x${j.h}  ${kb(before.size)} → ${kb(after.size)}`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
