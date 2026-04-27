/**
 * naming.ts — Filename composition for AI Studio downloads.
 *
 * Each generation gets three names:
 *  - rootFileName: slugified original-upload name, propagated through
 *    derivative chains (when a result is reused as input).
 *  - inputFileName: literal name of the file used as input (= parent's
 *    resultFileName when derivative, else = rootFileName).
 *  - resultFileName: deterministic, computed from
 *    `{rootBase}__{editCode}__v{NN}__{YYYYMMDD}.{ext}`.
 *
 * Old generations (created before this feature shipped) have all three
 * unset; downloads fall back to `obrada-YYYYMMDD-{shortId}.{ext}`.
 */
import type { AiEditType } from "@/lib/ai-studio/catalog";

const EDIT_TYPE_CODES: Record<AiEditType, string> = {
  item_removal: "remove",
  day_to_dusk: "dusk",
  sky_replacement: "sky",
  wall_color_change: "wall",
  virtual_staging: "staging",
  virtual_renovation: "renov",
  room_redesign: "redesign",
};

export function editTypeCode(editType: AiEditType): string {
  return EDIT_TYPE_CODES[editType] ?? "edit";
}

const DIACRITIC_MAP: Record<string, string> = {
  Š: "S",
  š: "s",
  Đ: "Dj",
  đ: "dj",
  Č: "C",
  č: "c",
  Ć: "C",
  ć: "c",
  Ž: "Z",
  ž: "z",
};

function latinize(value: string): string {
  return value
    .split("")
    .map((ch) => DIACRITIC_MAP[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export function splitFileName(fileName: string): { base: string; ext: string } {
  const cleaned = fileName.trim();
  const dot = cleaned.lastIndexOf(".");
  if (dot <= 0 || dot === cleaned.length - 1) {
    return { base: cleaned, ext: "jpg" };
  }
  const rawExt = cleaned.slice(dot + 1).toLowerCase();
  const ext = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : "jpg";
  return { base: cleaned.slice(0, dot), ext };
}

// Slugify a filename to lowercase ascii with hyphens. Caps length so a
// download header doesn't end up with a 200-char monster from a phone.
export function slugifyFileName(fileName: string, maxBaseLength = 60): string {
  const { base, ext } = splitFileName(fileName);
  const slug = latinize(base)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxBaseLength) || "slika";
  return `${slug}.${ext}`;
}

export function formatDateCode(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function padCounter(n: number): string {
  return String(Math.max(1, n)).padStart(2, "0");
}

export function composeResultFileName(args: {
  rootFileName: string;
  editType: AiEditType;
  counter: number;
  date: Date;
  resultExtension?: string;
}): string {
  const { base } = splitFileName(args.rootFileName);
  const ext = args.resultExtension ?? "jpg";
  return `${base}__${editTypeCode(args.editType)}__v${padCounter(args.counter)}__${formatDateCode(args.date)}.${ext}`;
}

// Used when a generation predates filename tracking. Gives the customer
// something better than the cuid.
export function fallbackDownloadName(args: {
  generationId: string;
  createdAt: Date;
  mimeType?: string | null;
}): string {
  const ext = args.mimeType?.includes("png") ? "png" : "jpg";
  const shortId = args.generationId.slice(-6);
  return `obrada-${formatDateCode(args.createdAt)}-${shortId}.${ext}`;
}

// Encodes a filename for the Content-Disposition header. RFC 6266 +
// RFC 5987 — falls back gracefully on old clients but lets modern ones
// see the full UTF-8 string. The plain-ASCII version drops anything
// outside [a-zA-Z0-9._-].
export function contentDispositionFileName(fileName: string): string {
  const ascii = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
