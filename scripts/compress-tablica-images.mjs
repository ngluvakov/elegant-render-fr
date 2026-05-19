/**
 * compress-tablica-images.mjs — One-shot resize + re-encode for the
 * 18 tablica-*.webp images in public/artwork/.
 *
 * Targets: 1920×1080 (cover crop if aspect deviates), WebP quality 82,
 * effort 6 (max compression effort, slower encode).
 *
 * Backs up originals to public/artwork/_tablica-originals/ before
 * overwriting so the user keeps a high-quality master.
 *
 * Run: node scripts/compress-tablica-images.mjs
 */

import sharp from "sharp";
import { readdir, mkdir, copyFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTWORK_DIR = join(__dirname, "..", "public", "artwork");
const BACKUP_DIR = join(ARTWORK_DIR, "_tablica-originals");

const TARGET_W = 1920;
const TARGET_H = 1080;
const QUALITY = 82;
const EFFORT = 6;

const formatKB = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  await mkdir(BACKUP_DIR, { recursive: true });

  const files = (await readdir(ARTWORK_DIR))
    .filter((f) => f.startsWith("tablica-") && f.endsWith(".webp"))
    .sort();

  if (files.length === 0) {
    console.log("No tablica-*.webp files found.");
    return;
  }

  console.log(`Processing ${files.length} files...\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  for (const file of files) {
    const srcPath = join(ARTWORK_DIR, file);
    const backupPath = join(BACKUP_DIR, file);
    const tmpPath = join(ARTWORK_DIR, `_compressing-${file}`);

    const beforeStat = await stat(srcPath);
    totalBefore += beforeStat.size;

    // Backup original if not already backed up.
    let alreadyBacked = false;
    try {
      await stat(backupPath);
      alreadyBacked = true;
    } catch {}
    if (!alreadyBacked) {
      await copyFile(srcPath, backupPath);
    }

    // Re-encode from the backup (always use the highest-quality source)
    // so re-runs don't progressively degrade.
    await sharp(backupPath)
      .resize(TARGET_W, TARGET_H, { fit: "cover", position: "center" })
      .webp({ quality: QUALITY, effort: EFFORT })
      .toFile(tmpPath);

    // Atomic replace.
    const { rename } = await import("node:fs/promises");
    await rename(tmpPath, srcPath);

    const afterStat = await stat(srcPath);
    totalAfter += afterStat.size;

    rows.push({
      file,
      before: formatKB(beforeStat.size),
      after: formatKB(afterStat.size),
      saved: `${Math.round((1 - afterStat.size / beforeStat.size) * 100)}%`,
    });
  }

  // Pretty print results.
  const col = (s, w) => s.padEnd(w);
  console.log(col("File", 38) + col("Before", 12) + col("After", 12) + "Saved");
  console.log("─".repeat(70));
  for (const r of rows) {
    console.log(col(r.file, 38) + col(r.before, 12) + col(r.after, 12) + r.saved);
  }
  console.log("─".repeat(70));
  console.log(
    col("TOTAL", 38) +
      col(formatKB(totalBefore), 12) +
      col(formatKB(totalAfter), 12) +
      `${Math.round((1 - totalAfter / totalBefore) * 100)}%`,
  );
  console.log(`\nOriginals backed up to: ${BACKUP_DIR}`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
