import OpenAI, { toFile } from "openai";
import { getAiProviderModel, type AiImageProvider } from "./catalog";
import type { ProviderTarget } from "./image-processing";

const AI_PROVIDER_TIMEOUT_MS = 120_000;
const AI_PROVIDER_RETRY_DELAY_MS = 1_200;

export type AiEditProviderInput = {
  provider: AiImageProvider;
  model: string;
  prompt: string;
  image: Buffer;
  imageMimeType: string;
  imageRoleText?: string;
  referenceImages?: Array<{ image: Buffer; mimeType: string }>;
  referenceImage?: Buffer;
  referenceMimeType?: string;
  mask?: Buffer;
  maskMimeType?: string;
  target?: ProviderTarget;
};

export type AiEditProviderOutput = {
  image: Buffer;
  mimeType: string;
  provider: AiImageProvider;
  model: string;
  providerResponseId?: string;
  fallbackFrom?: AiImageProvider;
};

class AiProviderError extends Error {
  status?: number;
  provider: AiImageProvider;
  model: string;
  publicMessage: string;
  fallbackAllowed: boolean;

  constructor({
    provider,
    model,
    status,
    message,
    publicMessage,
    fallbackAllowed,
  }: {
    provider: AiImageProvider;
    model: string;
    status?: number;
    message: string;
    publicMessage: string;
    fallbackAllowed: boolean;
  }) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.model = model;
    this.status = status;
    this.publicMessage = publicMessage;
    this.fallbackAllowed = fallbackAllowed;
  }
}

let openAiClient: OpenAI | null = null;

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY nije konfigurisan.");
  }
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openAiClient;
}

export async function generateAiEdit(
  input: AiEditProviderInput,
): Promise<AiEditProviderOutput> {
  const attempts = getProviderAttempts(input.provider);
  let lastError: unknown = null;

  for (const provider of attempts) {
    if (provider !== input.provider && !isProviderConfigured(provider)) continue;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const output =
          provider === "openai"
            ? await generateWithOpenAi(input)
            : await generateWithGemini(input, provider);

        return {
          ...output,
          fallbackFrom: provider === input.provider ? undefined : input.provider,
        };
      } catch (err) {
        lastError = err;
        logProviderFailure(err, provider, attempt);
        if (shouldRetryProviderAttempt(err, attempt)) {
          await sleep(AI_PROVIDER_RETRY_DELAY_MS);
          continue;
        }
        if (!isFallbackAllowed(err)) throw toPublicError(err);
        break;
      }
    }
  }

  throw toPublicError(lastError);
}

async function generateWithGemini(
  input: AiEditProviderInput,
  provider: Exclude<AiImageProvider, "openai">,
): Promise<AiEditProviderOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nije konfigurisan.");

  const model = input.model;
  const imageRoleText = input.imageRoleText ?? "Image 1: interior scene to edit.";
  const parts: Array<Record<string, unknown>> = [
    { text: input.prompt },
    { text: imageRoleText },
    {
      inline_data: {
        mime_type: input.imageMimeType,
        data: input.image.toString("base64"),
      },
    },
  ];
  const references = getReferenceImages(input);

  references.forEach((reference, index) => {
    parts.push({
      text:
        index === 0
          ? `Image ${index + 2}: primary furniture/decor reference.`
          : `Image ${index + 2}: additional angle/detail view of the same furniture/decor item.`,
    });
    parts.push({
      inline_data: {
        mime_type: reference.mimeType,
        data: reference.image.toString("base64"),
      },
    });
  });

  if (input.mask) {
    parts.push({
      text: "Mask for Image 1; follow the mask semantics in the instructions.",
    });
    parts.push({
      inline_data: {
        mime_type: input.maskMimeType ?? "image/png",
        data: input.mask.toString("base64"),
      },
    });
  }

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          ...(input.target
            ? {
                imageConfig: {
                  aspectRatio: input.target.ratioLabel,
                },
              }
            : {}),
        },
      }),
    },
    { provider, model },
  );

  if (!res.ok) {
    const body = await readResponseText(res);
    throw new AiProviderError({
      provider,
      model,
      status: res.status,
      message: `Gemini image generation failed: ${res.status} ${body}`,
      publicMessage: getPublicProviderMessage("gemini", res.status, body),
      fallbackAllowed: isFallbackStatus(res.status),
    });
  }

  const data = await res.json();
  const outputParts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = outputParts.find(
    (part: { inlineData?: { data?: string }; inline_data?: { data?: string } }) =>
      part.inlineData?.data || part.inline_data?.data,
  );
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;
  const base64 = inlineData?.data;
  if (!base64) throw noImageReturnedError(provider, model);

  return {
    image: Buffer.from(base64, "base64"),
    mimeType: inlineData.mimeType ?? inlineData.mime_type ?? "image/png",
    provider,
    model,
    providerResponseId: data.responseId,
  };
}

async function generateWithOpenAi(
  input: AiEditProviderInput,
): Promise<AiEditProviderOutput> {
  const model = input.model;
  const client = getOpenAiClient();
  const images = [
    await toFile(new Uint8Array(input.image), "scene.jpg", {
      type: input.imageMimeType,
    }),
  ];
  const references = getReferenceImages(input);

  for (let index = 0; index < references.length; index++) {
    const reference = references[index];
    images.push(
      await toFile(
        new Uint8Array(reference.image),
        `object-reference-${index + 1}.${imageExtension(reference.mimeType)}`,
        {
          type: reference.mimeType,
        },
      ),
    );
  }

  const mask = input.mask
    ? await toFile(new Uint8Array(input.mask), "mask.png", {
        type: input.maskMimeType ?? "image/png",
      })
    : undefined;

  let data: {
    id?: string;
    data?: Array<{ b64_json?: string | null; url?: string | null }>;
  };
  try {
    data = await client.images.edit(
      {
        model,
        prompt: input.prompt,
        image: images.length === 1 ? images[0] : images,
        ...(mask ? { mask } : {}),
        size: input.target?.openaiSize ?? "auto",
        output_format: "png",
        ...(references.length > 0 && supportsOpenAiInputFidelity(model)
          ? { input_fidelity: "high" as const }
          : {}),
      },
      { timeout: AI_PROVIDER_TIMEOUT_MS },
    );
  } catch (err) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status?: unknown }).status)
        : undefined;
    const body = err instanceof Error ? err.message : String(err);
    throw new AiProviderError({
      provider: "openai",
      model,
      status,
      message: `OpenAI image edit failed: ${status ?? "unknown"} ${body}`,
      publicMessage: getPublicProviderMessage("openai", status ?? 500, body),
      fallbackAllowed: false,
    });
  }

  const item = data.data?.[0];
  if (item?.b64_json) {
    return {
      image: Buffer.from(item.b64_json, "base64"),
      mimeType: "image/png",
      provider: "openai",
      model,
      providerResponseId: data.id,
    };
  }
  if (item?.url) {
    const imageRes = await fetchWithTimeout(
      item.url,
      {},
      { provider: "openai", model },
    );
    if (!imageRes.ok) {
      throw new AiProviderError({
        provider: "openai",
        model,
        status: imageRes.status,
        message: `OpenAI result URL was not accessible: ${imageRes.status}`,
        publicMessage:
          "AI provider nije uspeo da vrati sliku. Probajte sa čistijom referencom, širom maskom ili drugim engine-om.",
        fallbackAllowed: false,
      });
    }
    return {
      image: Buffer.from(await imageRes.arrayBuffer()),
      mimeType: imageRes.headers.get("content-type") ?? "image/png",
      provider: "openai",
      model,
      providerResponseId: data.id,
    };
  }

  throw noImageReturnedError("openai", model);
}

function getReferenceImages(
  input: AiEditProviderInput,
): Array<{ image: Buffer; mimeType: string }> {
  if (input.referenceImages?.length) return input.referenceImages;
  if (!input.referenceImage) return [];
  return [
    {
      image: input.referenceImage,
      mimeType: input.referenceMimeType ?? "image/jpeg",
    },
  ];
}

function imageExtension(mimeType: string): "jpg" | "png" | "webp" {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function supportsOpenAiInputFidelity(model: string): boolean {
  return model === "gpt-image-1.5";
}

function getProviderAttempts(provider: AiImageProvider): AiImageProvider[] {
  return [provider];
}

function isProviderConfigured(provider: AiImageProvider): boolean {
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.GEMINI_API_KEY);
}

function isFallbackAllowed(err: unknown): boolean {
  return err instanceof AiProviderError && err.fallbackAllowed;
}

function shouldRetryProviderAttempt(err: unknown, attempt: number): boolean {
  return (
    attempt === 1 &&
    err instanceof AiProviderError &&
    typeof err.status === "number" &&
    err.status >= 500
  );
}

function isFallbackStatus(status: number): boolean {
  return status === 403 || status === 404 || status === 429 || status >= 500;
}

function toPublicError(err: unknown): Error {
  if (err instanceof AiProviderError) return new Error(err.publicMessage);
  if (err instanceof Error) return err;
  return new Error("AI obrada trenutno nije uspela.");
}

function getPublicProviderMessage(
  provider: "gemini" | "openai",
  status: number,
  body: string,
): string {
  const lowerBody = body.toLowerCase();
  if (
    status === 429 ||
    lowerBody.includes("quota") ||
    lowerBody.includes("rate limit") ||
    lowerBody.includes("resource_exhausted")
  ) {
    return provider === "gemini"
      ? "Google AI engine trenutno nema raspoloživ quota za ovu obradu. Pokušajte ponovo malo kasnije ili izaberite drugi engine."
      : "OpenAI engine trenutno nema raspoloživ quota za ovu obradu. Pokušajte ponovo malo kasnije ili izaberite drugi engine.";
  }
  if (status === 401 || status === 403) {
    return "AI engine nije autorizovan ili nema uključen billing za izabrani model.";
  }
  if (status === 404) {
    return "Izabrani AI model trenutno nije dostupan.";
  }
  if (status === 400 && lowerBody.includes("input_fidelity")) {
    return "Izabrani OpenAI model ne podržava režim visoke vernosti reference. Izaberite GPT Image 1.5 ili Nano Banana Pro za ovu obradu.";
  }
  if (status >= 500) {
    return "AI provider trenutno ne odgovara stabilno. Pokušajte ponovo za nekoliko minuta.";
  }
  return "AI obrada nije uspela. Proverite sliku i prompt, pa pokušajte ponovo.";
}

function noImageReturnedError(
  provider: AiImageProvider,
  model: string,
): AiProviderError {
  return new AiProviderError({
    provider,
    model,
    status: 502,
    message: `${provider} did not return an image payload.`,
    publicMessage:
      "AI provider nije vratio sliku ni posle ponovnog pokušaja. Probajte sa čistijom referencom, širom maskom ili drugim engine-om.",
    fallbackAllowed: false,
  });
}

async function readResponseText(res: Response): Promise<string> {
  const text = await res.text();
  return text.length > 1500 ? `${text.slice(0, 1500)}...` : text;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  context: { provider: AiImageProvider; model: string },
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiProviderError({
        provider: context.provider,
        model: context.model,
        status: 408,
        message: `${context.provider} image request timed out after ${AI_PROVIDER_TIMEOUT_MS}ms`,
        publicMessage:
          "AI provider nije odgovorio na vreme. Pokušajte ponovo ili izaberite drugi engine.",
        fallbackAllowed: true,
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logProviderFailure(
  err: unknown,
  provider: AiImageProvider,
  attempt: number,
) {
  const message = err instanceof Error ? err.message : String(err);
  const status = err instanceof AiProviderError ? err.status : undefined;
  const model =
    err instanceof AiProviderError ? err.model : getAiProviderModel(provider);
  console.error("[AI Studio] Provider attempt failed", {
    provider,
    model,
    attempt,
    status,
    message: message.length > 1500 ? `${message.slice(0, 1500)}...` : message,
  });
}
