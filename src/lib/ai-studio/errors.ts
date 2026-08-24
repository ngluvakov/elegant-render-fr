export function sanitizeAiStudioError(message?: string | null): string {
  const text = message?.trim();
  if (!text) return "La génération IA a échoué. Veuillez réessayer.";

  const lower = text.toLowerCase();
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    return "Le moteur IA n’a pas de quota disponible pour cette génération en ce moment. Choisissez un autre moteur ou réessayez un peu plus tard.";
  }

  if (
    lower.includes("api_key") ||
    lower.includes("is not configured") ||
    lower.includes("unauthorized") ||
    lower.includes("not authorized")
  ) {
    return "Le moteur IA n’est pas correctement configuré pour le modèle sélectionné.";
  }

  if (
    lower.includes("gemini image generation failed") ||
    lower.includes("openai image edit failed")
  ) {
    return "Le fournisseur IA n’a pas pu traiter l’image. Vérifiez l’image et les instructions, puis réessayez.";
  }

  return text.length > 280 ? `${text.slice(0, 280)}...` : text;
}
