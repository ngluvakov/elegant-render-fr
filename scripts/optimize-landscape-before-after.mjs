/**
 * optimize-landscape-before-after.mjs — One-shot conversion of the new
 * "Uređenje pejzaža" before/after masters into web-ready WebP assets.
 *
 * Source masters (16:9, 2048×1152 PNG) live on the marketing share:
 *   A.png = landscaped yard  → AFTER  (posle)
 *   B.png = bare graded lot   → BEFORE (pre)
 *
 * The on-page "Pre / posle" reveal renders in an aspect-[4/3] frame
 * (LandingTemplate), so we center-crop 16:9 → 4:3 (identical crop on both
 * halves keeps the diagonal reveal camera-locked) and emit 1280×960 WebP,
 * quality 82 / effort 6, EXIF stripped (sharp default). Budget < 410 KB.
 *
 * Run: node scripts/optimize-landscape-before-after.mjs
 */

import sharp from "sharp";
import { stat } from "node:fs/promises";
import { join } from "node:path";

const SRC_DIR = "J:/Marketing dept/2026/Jun 2026/2 Web page content/Landscaping";
const OUT_DIR = join(process.cwd(), "public", "artwork");

const TARGET_W = 1280;
const TARGET_H = 960; // 4:3
const QUALITY = 82;
const EFFORT = 6;

const jobs = [
  { src: "B.png", out: "problem-landscape-design-before.webp", role: "BEFORE (gola parcela)" },
  { src: "A.png", out: "problem-landscape-design-after.webp", role: "AFTER (uređen pejzaž)" },
];

const formatKB = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  for (const job of jobs) {
    const srcPath = join(SRC_DIR, job.src);
    const outPath = join(OUT_DIR, job.out);

    const beforeStat = await stat(srcPath);

    await sharp(srcPath)
      .resize(TARGET_W, TARGET_H, { fit: "cover", position: "center" })
      .webp({ quality: QUALITY, effort: EFFORT })
      .toFile(outPath);

    const afterStat = await stat(outPath);
    console.log(
      `${job.src} → ${job.out}  [${job.role}]  ${formatKB(beforeStat.size)} → ${formatKB(afterStat.size)}`,
    );
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
