/**
 * One-off: resize + compress the public/styles/*.png reference images.
 * Outputs .webp at max 960px wide, quality 82. Deletes the originals
 * and rewrites the ROOM_STYLES image paths via a follow-up edit.
 */
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const STYLES_DIR = path.join(process.cwd(), "public", "styles");

async function main() {
  const entries = await readdir(STYLES_DIR);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith(".png"));

  for (const file of pngs) {
    const srcPath = path.join(STYLES_DIR, file);
    const outPath = path.join(STYLES_DIR, file.replace(/\.png$/i, ".webp"));
    const srcStat = await stat(srcPath);

    await sharp(srcPath)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(outPath);

    const outStat = await stat(outPath);
    console.log(
      `${file}: ${(srcStat.size / 1024).toFixed(0)} KB → ${(outStat.size / 1024).toFixed(0)} KB (webp)`,
    );

    await unlink(srcPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
