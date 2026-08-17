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
  "3D Artist — Interior",
  "3D Artist — Exterior",
  "3D Generalist",
  "360 / VR Specialist",
  "3D Animator",
  "2D/3D Floor Plan Artist",
  "AI Studio Photo Editor",
  "Project Manager",
  "Other",
] as const;

export const JOB_EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Freelance / contract",
  "Internship",
] as const;

export const JOB_EXPERIENCE_LEVELS = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
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
  "AI image tools (Midjourney, SD…)",
] as const;

/** What the candidate can actually do in 3D. */
export const JOB_3D_SKILLS = [
  "Modeling",
  "Sculpting",
  "UV unwrapping",
  "Animation",
  "Rigging",
  "Simulation",
] as const;

export function formatJobFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
