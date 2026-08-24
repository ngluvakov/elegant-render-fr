export const PROJECT_INQUIRY_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const PROJECT_INQUIRY_MAX_TOTAL_BYTES = 100 * 1024 * 1024;

export const PROJECT_INQUIRY_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/pdf",
] as const;

export type ProjectInquiryFileInput = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

export type ProjectInquirySource = {
  source?: string;
  sourcePath?: string;
  sourceLabel?: string;
};

export const PROJECT_INQUIRY_SERVICE_TYPES = [
  "Je ne sais pas encore",
  "Rendus d’intérieur",
  "Rendus d’extérieur",
  "Visites 360° et animations",
  "Home staging virtuel",
  "Rénovation virtuelle",
  "Plans 2D/3D",
  "Retouche photo par IA",
  "Projet plus vaste / plusieurs services",
] as const;

export function isAllowedProjectInquiryMimeType(mimeType: string): boolean {
  return PROJECT_INQUIRY_ALLOWED_TYPES.includes(
    mimeType as (typeof PROJECT_INQUIRY_ALLOWED_TYPES)[number],
  );
}

export function formatInquiryFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
