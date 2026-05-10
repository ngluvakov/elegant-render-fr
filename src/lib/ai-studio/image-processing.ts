import sharp from "sharp";
import type { AiImageProvider } from "./catalog";

export type Dimensions = {
  width: number;
  height: number;
};

export type ProviderTarget = {
  width: number;
  height: number;
  ratioLabel: string;
  openaiSize: "1024x1024" | "1024x1536" | "1536x1024";
};

const GEMINI_TARGETS = [
  { ratioLabel: "9:16", width: 768, height: 1344 },
  { ratioLabel: "2:3", width: 832, height: 1248 },
  { ratioLabel: "3:4", width: 864, height: 1184 },
  { ratioLabel: "1:1", width: 1024, height: 1024 },
  { ratioLabel: "4:3", width: 1184, height: 864 },
  { ratioLabel: "3:2", width: 1248, height: 832 },
  { ratioLabel: "16:9", width: 1344, height: 768 },
  { ratioLabel: "21:9", width: 1536, height: 672 },
] as const;

export async function getImageDimensions(buffer: Buffer): Promise<Dimensions> {
  const metadata = await sharp(buffer).rotate().metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Dimenzije slike nisu dostupne.");
  }
  return { width: metadata.width, height: metadata.height };
}

export function pickProviderTarget(
  dims: Dimensions,
  provider: AiImageProvider,
): ProviderTarget {
  const ratio = dims.width / dims.height;
  const openaiSize =
    ratio < 0.92 ? "1024x1536" : ratio > 1.1 ? "1536x1024" : "1024x1024";

  if (provider === "openai") {
    if (openaiSize === "1024x1536") {
      return { width: 1024, height: 1536, ratioLabel: "2:3", openaiSize };
    }
    if (openaiSize === "1536x1024") {
      return { width: 1536, height: 1024, ratioLabel: "3:2", openaiSize };
    }
    return { width: 1024, height: 1024, ratioLabel: "1:1", openaiSize };
  }

  const target = GEMINI_TARGETS.reduce((best, candidate) => {
    const candidateDelta = Math.abs(candidate.width / candidate.height - ratio);
    const bestDelta = Math.abs(best.width / best.height - ratio);
    return candidateDelta < bestDelta ? candidate : best;
  }, GEMINI_TARGETS[0]);

  return {
    width: target.width,
    height: target.height,
    ratioLabel: target.ratioLabel,
    openaiSize,
  };
}

export async function prepareInputForProvider(
  buffer: Buffer,
  target: ProviderTarget,
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(target.width, target.height, {
      fit: "cover",
      position: "center",
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function prepareObjectInputForProvider(
  buffer: Buffer,
): Promise<{ image: Buffer; width: number; height: number }> {
  const image = await sharp(buffer)
    .rotate()
    .resize(2048, 2048, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 92 })
    .toBuffer();
  const metadata = await sharp(image).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Dimenzije slike nisu dostupne.");
  }
  return { image, width: metadata.width, height: metadata.height };
}

export async function prepareMaskForProvider(
  buffer: Buffer,
  target: ProviderTarget,
): Promise<Buffer> {
  return sharp(buffer)
    .ensureAlpha()
    .resize(target.width, target.height, {
      fit: "cover",
      position: "center",
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
}

export async function prepareObjectMaskForProvider(
  buffer: Buffer,
  dims: Dimensions,
): Promise<Buffer> {
  const normalized = await sharp(buffer)
    .ensureAlpha()
    .resize(dims.width, dims.height, {
      fit: "fill",
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
  const radius = Math.max(10, Math.round(Math.min(dims.width, dims.height) * 0.018));
  const editAlpha = await sharp(normalized)
    .extractChannel("alpha")
    .negate()
    .blur(radius)
    .png()
    .toBuffer();
  const maskAlpha = await sharp(editAlpha).negate().png().toBuffer();

  return sharp({
    create: {
      width: dims.width,
      height: dims.height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .joinChannel(maskAlpha)
    .png()
    .toBuffer();
}

export async function prepareReferenceForProvider(
  buffer: Buffer,
  target: ProviderTarget,
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(target.width, target.height, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function composeWithMask({
  original,
  aiResult,
  mask,
  originalDims,
  maskInverted = false,
  softenMask = false,
}: {
  original: Buffer;
  aiResult: Buffer;
  mask: Buffer;
  originalDims: Dimensions;
  maskInverted?: boolean;
  softenMask?: boolean;
}): Promise<Buffer> {
  const normalizedOriginal = await sharp(original)
    .rotate()
    .resize(originalDims.width, originalDims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 94 })
    .toBuffer();

  const resizedResult = await sharp(aiResult)
    .rotate()
    .resize(originalDims.width, originalDims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .removeAlpha()
    .png()
    .toBuffer();

  const maskAlpha = sharp(mask)
    .ensureAlpha()
    .resize(originalDims.width, originalDims.height, {
      fit: "fill",
      kernel: sharp.kernel.nearest,
    })
    .extractChannel("alpha");

  let editAlphaPipeline = maskInverted ? maskAlpha : maskAlpha.negate();
  if (softenMask) {
    const radius = Math.max(10, Math.round(Math.min(originalDims.width, originalDims.height) * 0.018));
    editAlphaPipeline = editAlphaPipeline.blur(radius);
  }

  const editAlpha = await editAlphaPipeline.png().toBuffer();

  const maskedResult = await sharp(resizedResult)
    .removeAlpha()
    .joinChannel(editAlpha)
    .png()
    .toBuffer();

  return sharp(normalizedOriginal)
    .composite([{ input: maskedResult, blend: "over" }])
    .jpeg({ quality: 94 })
    .toBuffer();
}

export async function resizeToOriginal(
  buffer: Buffer,
  dims: Dimensions,
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(dims.width, dims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 94 })
    .toBuffer();
}
