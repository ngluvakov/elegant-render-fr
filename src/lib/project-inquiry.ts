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
  "Nisam siguran/na",
  "Unutrašnji renderi",
  "Spoljašnji renderi",
  "360 ture i animacije",
  "Virtuelno opremanje",
  "Virtuelna renovacija",
  "2D/3D osnove prostora",
  "AI obrada fotografija",
  "Veći projekat / više usluga",
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
