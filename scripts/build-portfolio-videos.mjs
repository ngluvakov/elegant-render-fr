/**
 * build-portfolio-videos.mjs — one-shot web-transcode of the curated portfolio
 * animations into public/artwork/portfolio/ (mp4 + webp poster).
 *
 * Source mp4s live on P:\ (30–70 MB each) and are never committed. Outputs are
 * web-sized H.264 (≤1600px wide, CRF 27, faststart) + a poster frame.
 *
 * Requires ffmpeg on PATH. Run: node scripts/build-portfolio-videos.mjs
 */

import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, stat, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const run = promisify(execFile);

const BASE = "P:\\Promo\\White Rook\\Kontent za freelance sajtove\\Animacije";
const OUT = join(process.cwd(), "public", "artwork", "portfolio");

/** { src, out } → <out>.mp4 + <out>.webp (poster). */
const VIDEOS = [
  { src: "2404-3DRD2_E_1- A Frame Animacija 18.05.mp4", out: "video-01" },
  { src: "2405-FP1_E_1- 2nd Floor Animation.mp4", out: "video-02" },
  { src: "2308-3DRD2_E_8- Floor Plan 001 Animacija.mp4", out: "video-03" },
  { src: "Unit 001.mp4", out: "video-04" },
  { src: "Weisenstrasse 10 Animation 03.25.mp4", out: "video-05" },
  { src: "2404-INR3_E_2- Animacija 16.05.mp4", out: "video-06" },
  { src: "2405-FP1_E_1- Ground Animation.mp4", out: "video-07" },
  { src: "A Frame Animacija.mp4", out: "video-08" },
];

const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;

async function processVideo(job) {
  const srcPath = join(BASE, job.src);
  const mp4Path = join(OUT, `${job.out}.mp4`);
  const posterPath = join(OUT, `${job.out}.webp`);
  const tmpFrame = join(tmpdir(), `${job.out}-frame.jpg`);

  // Transcode: cap width 1600 (even), H.264 CRF 27, web-friendly.
  await run(
    "ffmpeg",
    [
      "-y",
      "-i", srcPath,
      "-vf", "scale='min(1600,iw)':-2",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "27",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "96k",
      mp4Path,
    ],
    { maxBuffer: 1024 * 1024 * 64 },
  );

  // Poster: grab a frame ~1.5s into the (small) transcoded file, then webp it.
  await run("ffmpeg", ["-y", "-ss", "1.5", "-i", mp4Path, "-frames:v", "1", "-q:v", "2", tmpFrame], {
    maxBuffer: 1024 * 1024 * 32,
  });
  await sharp(tmpFrame)
    .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(posterPath);
  await rm(tmpFrame, { force: true });

  const v = await stat(mp4Path);
  const p = await stat(posterPath);
  console.log(`  ${job.out}`.padEnd(14) + ` mp4 ${mb(v.size)}   poster ${(p.size / 1024).toFixed(0)} KB`);
  return v.size;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`\nVideos → ${OUT}`);
  let total = 0;
  let failures = 0;
  for (const job of VIDEOS) {
    try {
      total += await processVideo(job);
    } catch (e) {
      failures++;
      console.error(`  ! FAILED ${job.out} (${job.src}): ${e.message}`);
    }
  }
  console.log(`\nTotal video: ${mb(total)}. ${failures ? failures + " FAILURES ⚠" : "all ok"}`);
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
