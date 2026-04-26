import { getAiProviderModel, type AiImageProvider } from "./catalog";

export type AiEditProviderInput = {
  provider: AiImageProvider;
  prompt: string;
  image: Buffer;
  imageMimeType: string;
  mask?: Buffer;
  maskMimeType?: string;
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

export async function generateAiEdit(
  input: AiEditProviderInput,
): Promise<AiEditProviderOutput> {
  const attempts = getProviderAttempts(input.provider);
  let lastError: unknown = null;

  for (const provider of attempts) {
    if (provider !== input.provider && !isProviderConfigured(provider)) continue;

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
      logProviderFailure(err, provider);
      if (!isFallbackAllowed(err)) throw toPublicError(err);
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

  const model = getAiProviderModel(provider);
  const parts: Array<Record<string, unknown>> = [
    { text: input.prompt },
    {
      inline_data: {
        mime_type: input.imageMimeType,
        data: input.image.toString("base64"),
      },
    },
  ];

  if (input.mask) {
    parts.push({
      inline_data: {
        mime_type: input.maskMimeType ?? "image/png",
        data: input.mask.toString("base64"),
      },
    });
  }

  const res = await fetch(
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
        },
      }),
    },
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
  if (!base64) throw new Error("Gemini nije vratio sliku.");

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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY nije konfigurisan.");
  }

  const model = getAiProviderModel("openai");

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", input.prompt);
  form.append(
    "image",
    new Blob([new Uint8Array(input.image)], { type: input.imageMimeType }),
    "input.png",
  );
  form.append("size", "auto");

  if (input.mask) {
    form.append(
      "mask",
      new Blob([new Uint8Array(input.mask)], {
        type: input.maskMimeType ?? "image/png",
      }),
      "mask.png",
    );
  }

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await readResponseText(res);
    throw new AiProviderError({
      provider: "openai",
      model,
      status: res.status,
      message: `OpenAI image edit failed: ${res.status} ${body}`,
      publicMessage: getPublicProviderMessage("openai", res.status, body),
      fallbackAllowed: false,
    });
  }

  const data = await res.json();
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
    const imageRes = await fetch(item.url);
    if (!imageRes.ok) throw new Error("OpenAI result URL nije dostupan.");
    return {
      image: Buffer.from(await imageRes.arrayBuffer()),
      mimeType: imageRes.headers.get("content-type") ?? "image/png",
      provider: "openai",
      model,
      providerResponseId: data.id,
    };
  }

  throw new Error("OpenAI nije vratio sliku.");
}

function getProviderAttempts(provider: AiImageProvider): AiImageProvider[] {
  if (provider === "gemini_pro") return ["gemini_pro", "gemini_flash", "openai"];
  if (provider === "gemini_flash") return ["gemini_flash", "openai"];
  return ["openai"];
}

function isProviderConfigured(provider: AiImageProvider): boolean {
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.GEMINI_API_KEY);
}

function isFallbackAllowed(err: unknown): boolean {
  return err instanceof AiProviderError && err.fallbackAllowed;
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
      ? "Google AI engine trenutno nema raspoloživ quota za ovu obradu. Pokušavamo drugi engine, a ako se ponovi izaberite Nano Banana ili GPT Image."
      : "OpenAI engine trenutno nema raspoloživ quota za ovu obradu. Pokušajte ponovo malo kasnije ili izaberite drugi engine.";
  }
  if (status === 401 || status === 403) {
    return "AI engine nije autorizovan ili nema uključen billing za izabrani model.";
  }
  if (status === 404) {
    return "Izabrani AI model trenutno nije dostupan.";
  }
  if (status >= 500) {
    return "AI provider trenutno ne odgovara stabilno. Pokušajte ponovo za nekoliko minuta.";
  }
  return "AI obrada nije uspela. Proverite sliku i prompt, pa pokušajte ponovo.";
}

async function readResponseText(res: Response): Promise<string> {
  const text = await res.text();
  return text.length > 1500 ? `${text.slice(0, 1500)}...` : text;
}

function logProviderFailure(err: unknown, provider: AiImageProvider) {
  const message = err instanceof Error ? err.message : String(err);
  const status = err instanceof AiProviderError ? err.status : undefined;
  const model =
    err instanceof AiProviderError ? err.model : getAiProviderModel(provider);
  console.error("[AI Studio] Provider attempt failed", {
    provider,
    model,
    status,
    message: message.length > 1500 ? `${message.slice(0, 1500)}...` : message,
  });
}
