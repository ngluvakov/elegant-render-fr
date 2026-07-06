/**
 * optimize-3d-osnove-portfolio.mjs — Replace the four portfolio tiles on
 * /services/3d-floor-plans with the new landscape 3D floor-plan renders.
 *
 * These masters are already 16:9 (≈5334×3000), so NO rotation — just a
 * center cover-crop to 1600×900 and WebP encode (q82 / effort 6).
 *
 * Run: node scripts/optimize-3d-osnove-portfolio.mjs
 */

import sharp from "sharp";
import { stat } from "node:fs/promises";
import { join } from "node:path";

const SRC = "J:/Marketing dept/2026/Jun 2026/2 Web page content/3D Floorplans/Nove";
const OUT = join(process.cwd(), "public", "artwork");

const jobs = [
  { src: "The Ridgedale - 5.jpg", out: "portfolio-3d-floor-plans-one-bedroom-apartment.webp" },
  { src: "2512-FP8_E_7-1x1 G.0000.jpg", out: "portfolio-3d-floor-plans-one-bedroom-open-concept.webp" },
  { src: "3_LW04_823sqft .jpg", out: "portfolio-3d-floor-plans-duplex-two-levels.webp" },
  { src: "9710 Table Mountain - 1.jpg", out: "portfolio-3d-floor-plans-house-with-garage.webp" },
];

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;

async function main() {
  for (const j of jobs) {
    const srcPath = join(SRC, j.src);
    const outPath = join(OUT, j.out);
    const before = await stat(srcPath);

    await sharp(srcPath)
      .resize(1600, 900, { fit: "cover", position: "center" })
      .webp({ quality: 82, effort: 6 })
      .toFile(outPath);

    const after = await stat(outPath);
    console.log(`${j.out.padEnd(48)} ${kb(before.size)} → ${kb(after.size)}`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
