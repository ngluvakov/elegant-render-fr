export function sanitizeAiStudioError(message?: string | null): string {
  const text = message?.trim();
  if (!text) return "AI obrada trenutno nije uspela.";

  const lower = text.toLowerCase();
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    return "AI engine trenutno nema raspoloživ quota za ovu obradu. Izaberite drugi engine ili pokušajte ponovo malo kasnije.";
  }

  if (
    lower.includes("api_key") ||
    lower.includes("nije konfigurisan") ||
    lower.includes("unauthorized") ||
    lower.includes("not authorized")
  ) {
    return "AI engine nije pravilno konfigurisan za izabrani model.";
  }

  if (
    lower.includes("gemini image generation failed") ||
    lower.includes("openai image edit failed")
  ) {
    return "AI provider nije uspeo da obradi sliku. Proverite sliku i prompt, pa pokušajte ponovo.";
  }

  return text.length > 280 ? `${text.slice(0, 280)}...` : text;
}
