/**
 * rename-artwork.mjs — one-shot EN-SEO rename of public/ assets.
 *
 * Generates docs/seo/artwork-rename-map.json from a Serbian→English token
 * dictionary (longest token first), then `git mv`s every tracked file whose
 * name changes, rewrites all code references under src/, and verifies:
 *   (a) zero references to any old filename remain in src/
 *   (b) every /artwork/ and /styles/ path referenced in src/ exists on disk
 *
 * Run once from the repo root: `node scripts/rename-artwork.mjs`
 * The manifest is kept in git as the audit record of the rename.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const MANIFEST = path.join(ROOT, "docs", "seo", "artwork-rename-map.json");

// Longest-first token dictionary. Order matters: longer Serbian compounds
// must convert before their sub-words ("jednosoban-stan" before "stan").
const TOKENS = [
  ["arhitektonska-animacija", "architectural-animation"],
  ["jednosoban-otvoreni-koncept", "one-bedroom-open-concept"],
  ["virtuelno-opremanje", "virtual-staging"],
  ["virtuelna-renovacija", "virtual-renovation"],
  ["uklanjanje-predmeta", "item-removal"],
  ["opremanje-renovacija", "staging-renovation"],
  ["uredjenje-pejzaza", "landscape-design"],
  ["prikazi-dvorista", "landscape-design"],
  ["spoljasnji-renderi", "exterior-renders"],
  ["unutrasnji-renderi", "interior-renders"],
  ["dupleks-dva-nivoa", "duplex-two-levels"],
  ["jednosoban-stan", "one-bedroom-apartment"],
  ["kuca-sa-garazom", "house-with-garage"],
  ["dnevni-boravak", "living-room"],
  ["360-eksterijer", "exterior-360"],
  ["3d-situacioni", "3d-site-plan"],
  ["vizuelizacija", "visualization"],
  ["dan-u-noc", "day-to-dusk"],
  ["fotomontaza", "photomontage"],
  ["2d-osnove", "2d-floor-plans"],
  ["3d-osnove", "3d-floor-plans"],
  ["cene-card", "pricing-card"],
  ["eksterijer", "exterior"],
  ["enterijer", "interior"],
  ["crno-belo", "black-white"],
  ["primorski", "coastal"],
  ["naslovna", "hero"],
  ["animacija", "animation"],
  ["planovi", "plans"],
  ["tablica", "service-table"],
  ["osnove", "floor-plans"],
  ["-pre-r2", "-before-r2"],
  ["kuhinja", "kitchen"],
  ["fasada", "facade"],
  ["kolor", "color"],
  ["ulica", "street"],
  ["soba", "room"],
  ["-stan-", "-apartment-"],
];

function englishName(rel) {
  const dir = path.posix.dirname(rel);
  let base = path.posix.basename(rel);
  for (const [sr, en] of TOKENS) base = base.split(sr).join(en);
  return dir === "." ? base : `${dir}/${base}`;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(path.relative(PUBLIC_DIR, full).split(path.sep).join("/"));
  }
  return out;
}

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

const tracked = new Set(
  git("ls-files", "--", "public").trim().split("\n").map((f) => f.replace(/^public\//, "")),
);

// 1. Build manifest
const files = walk(PUBLIC_DIR);
const map = [];
for (const rel of files) {
  const next = englishName(rel);
  if (next !== rel) map.push({ old: rel, new: next, tracked: tracked.has(rel) });
}
const collisions = new Map();
for (const { new: n } of map) collisions.set(n, (collisions.get(n) ?? 0) + 1);
const dupes = [...collisions.entries()].filter(([, c]) => c > 1);
if (dupes.length) {
  console.error("COLLISIONS:", dupes);
  process.exit(1);
}
mkdirSync(path.dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(map.map(({ old, new: n }) => ({ old, new: n })), null, 2) + "\n");
console.log(`manifest: ${map.length} renames (${map.filter((m) => m.tracked).length} tracked)`);

if (process.argv.includes("--dry-run")) {
  for (const m of map.slice(0, 20)) console.log(`  ${m.old} -> ${m.new}`);
  process.exit(0);
}

// 2. Rename files (git mv for tracked, plain rename for untracked)
import { renameSync } from "node:fs";
for (const { old, new: next, tracked: isTracked } of map) {
  const from = path.join(PUBLIC_DIR, old);
  const to = path.join(PUBLIC_DIR, next);
  mkdirSync(path.dirname(to), { recursive: true });
  if (isTracked) git("mv", `public/${old}`, `public/${next}`);
  else renameSync(from, to);
}
console.log("files renamed");

// 3. Rewrite references in src/ (basename-level replace keeps any path prefix intact)
function walkSrc(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "generated" || entry === "node_modules") continue;
      out.push(...walkSrc(full));
    } else if (/\.(ts|tsx|css|mjs|md|json)$/.test(entry)) out.push(full);
  }
  return out;
}
const srcFiles = walkSrc(path.join(ROOT, "src"));
let editedFiles = 0;
for (const file of srcFiles) {
  let text = readFileSync(file, "utf8");
  let changed = false;
  for (const { old, new: next } of map) {
    const oldBase = path.posix.basename(old);
    const newBase = path.posix.basename(next);
    if (oldBase !== newBase && text.includes(oldBase)) {
      text = text.split(oldBase).join(newBase);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, text);
    editedFiles++;
  }
}
console.log(`references rewritten in ${editedFiles} files`);

// 4. Verify
let bad = 0;
for (const file of srcFiles) {
  const text = readFileSync(file, "utf8");
  for (const { old } of map) {
    const oldBase = path.posix.basename(old);
    const newBase = path.posix.basename(englishName(old));
    if (oldBase !== newBase && text.includes(oldBase)) {
      console.error(`STALE REF: ${path.relative(ROOT, file)} still mentions ${oldBase}`);
      bad++;
    }
  }
  for (const m of text.matchAll(/["'`](\/(?:artwork|styles)\/[^"'`)\s?#]+)/g)) {
    if (m[1].includes("${")) continue; // dynamic template path — not statically checkable
    const p = path.join(PUBLIC_DIR, m[1]);
    if (!existsSync(p)) {
      console.error(`MISSING FILE: ${path.relative(ROOT, file)} references ${m[1]}`);
      bad++;
    }
  }
}
if (bad) process.exit(1);
console.log("verify: OK — no stale refs, all referenced assets exist");
