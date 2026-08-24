/**
 * job-application.ts — shared constants and helpers for the /jobs page.
 *
 * Mirrors src/lib/project-inquiry.ts: one module both the client form and
 * the server action import, so limits and option lists never drift apart.
 */

export const JOB_APPLICATION_MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB per file
export const JOB_APPLICATION_MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB per application
export const JOB_APPLICATION_MAX_PORTFOLIO_FILES = 3;

/** CV: document formats. Portfolio: documents, archives and images. */
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedJobApplicationMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export type JobApplicationFileKind = "cv" | "portfolio";

export type JobApplicationFileInput = {
  kind: JobApplicationFileKind;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

export const JOB_POSITIONS = [
  "Artiste 3D",
  "Chef de projet",
  "Autre",
] as const;

export const JOB_EMPLOYMENT_TYPES = [
  "Temps plein",
  "Temps partiel",
  "Freelance / prestation",
  "Stage",
] as const;

export const JOB_EXPERIENCE_LEVELS = [
  "Moins d’un an",
  "1–3 ans",
  "3–5 ans",
  "5–10 ans",
  "Plus de 10 ans",
] as const;

/** 3D and adjacent software the candidate can tick on the application. */
export const JOB_SOFTWARE = [
  "3ds Max",
  "Corona Renderer",
  "V-Ray",
  "Photoshop",
  "Krita",
  "Blender",
  "ZBrush",
  "Marvelous Designer",
  "Unreal Engine",
  "D5 Render",
  "Lumion",
  "SketchUp",
  "Cinema 4D",
  "Rhino",
  "Revit",
  "Twinmotion",
  "Substance Painter",
  "Substance Designer",
  "After Effects",
  "Premiere Pro",
  "Outils d’image IA (Midjourney, SD…)",
] as const;

/** What the candidate can actually do in 3D. */
export const JOB_3D_SKILLS = [
  "Modélisation",
  "Sculpture",
  "Dépliage UV",
  "Animation",
  "Rigging",
  "Simulation (tissus, fluides, particules)",
] as const;

export function formatJobFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
