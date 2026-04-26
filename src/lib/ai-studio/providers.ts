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
  providerResponseId?: string;
};

export async function generateAiEdit(
  input: AiEditProviderInput,
): Promise<AiEditProviderOutput> {
  if (input.provider === "openai") return generateWithOpenAi(input);
  return generateWithGemini(input);
}

async function generateWithGemini(
  input: AiEditProviderInput,
): Promise<AiEditProviderOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nije konfigurisan.");

  const model = getAiProviderModel(input.provider);
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
    const body = await res.text();
    throw new Error(`Gemini image generation failed: ${res.status} ${body}`);
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
    const body = await res.text();
    throw new Error(`OpenAI image edit failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const item = data.data?.[0];
  if (item?.b64_json) {
    return {
      image: Buffer.from(item.b64_json, "base64"),
      mimeType: "image/png",
      providerResponseId: data.id,
    };
  }
  if (item?.url) {
    const imageRes = await fetch(item.url);
    if (!imageRes.ok) throw new Error("OpenAI result URL nije dostupan.");
    return {
      image: Buffer.from(await imageRes.arrayBuffer()),
      mimeType: imageRes.headers.get("content-type") ?? "image/png",
      providerResponseId: data.id,
    };
  }

  throw new Error("OpenAI nije vratio sliku.");
}
