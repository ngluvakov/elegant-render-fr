export function sanitizeAiStudioError(message?: string | null): string {
  const text = message?.trim();
  if (!text) return "The AI generation failed. Please try again.";

  const lower = text.toLowerCase();
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    return "The AI engine has no available quota for this generation right now. Choose another engine or try again a little later.";
  }

  if (
    lower.includes("api_key") ||
    lower.includes("is not configured") ||
    lower.includes("unauthorized") ||
    lower.includes("not authorized")
  ) {
    return "The AI engine is not properly configured for the selected model.";
  }

  if (
    lower.includes("gemini image generation failed") ||
    lower.includes("openai image edit failed")
  ) {
    return "The AI provider could not process the image. Check the image and the prompt, then try again.";
  }

  return text.length > 280 ? `${text.slice(0, 280)}...` : text;
}
