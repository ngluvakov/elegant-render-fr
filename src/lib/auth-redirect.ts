const DEFAULT_AUTH_CALLBACK = "/portal";

export function sanitizeAuthCallback(
  value: FormDataEntryValue | string | string[] | null | undefined,
  fallback = DEFAULT_AUTH_CALLBACK,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/portal")) return fallback;
  if (trimmed.startsWith("//") || trimmed.includes("\\")) return fallback;

  return trimmed;
}
