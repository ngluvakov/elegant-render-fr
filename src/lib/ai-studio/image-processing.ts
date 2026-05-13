import sharp from "sharp";
import type { AiImageProvider } from "./catalog";

export type Dimensions = {
  width: number;
  height: number;
};

export type NormalizedImage = {
  image: Buffer;
  dimensions: Dimensions;
};

export type ProviderTarget = {
  width: number;
  height: number;
  ratioLabel: string;
  openaiSize: "1024x1024" | "1024x1536" | "1536x1024";
};

export type ObjectMaskMode = "source_object" | "placement_guide";

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

function createBlackRgbaWithAlpha(alpha: Buffer): Buffer {
  const rgba = Buffer.allocUnsafe(alpha.length * 4);
  for (let index = 0; index < alpha.length; index++) {
    const offset = index * 4;
    rgba[offset] = 0;
    rgba[offset + 1] = 0;
    rgba[offset + 2] = 0;
    rgba[offset + 3] = alpha[index];
  }
  return rgba;
}

function createRgbaFromRgbAndAlpha(rgb: Buffer, alpha: Buffer): Buffer {
  if (rgb.length !== alpha.length * 3) {
    throw new Error("RGB i alpha kanal nemaju iste dimenzije.");
  }
  const rgba = Buffer.allocUnsafe(alpha.length * 4);
  for (let index = 0; index < alpha.length; index++) {
    const rgbOffset = index * 3;
    const rgbaOffset = index * 4;
    rgba[rgbaOffset] = rgb[rgbOffset];
    rgba[rgbaOffset + 1] = rgb[rgbOffset + 1];
    rgba[rgbaOffset + 2] = rgb[rgbOffset + 2];
    rgba[rgbaOffset + 3] = alpha[index];
  }
  return rgba;
}

function createObjectWorkZoneAlpha({
  maskAlpha,
  dims,
  maskInverted,
  mode,
}: {
  maskAlpha: Buffer;
  dims: Dimensions;
  maskInverted: boolean;
  mode: ObjectMaskMode;
}): Buffer {
  let minX = dims.width;
  let minY = dims.height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < maskAlpha.length; index++) {
    const selected = maskInverted ? maskAlpha[index] > 10 : maskAlpha[index] < 245;
    if (!selected) continue;
    const x = index % dims.width;
    const y = Math.floor(index / dims.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const alpha = Buffer.alloc(dims.width * dims.height);
  if (maxX < minX || maxY < minY) return alpha;

  const bboxWidth = maxX - minX + 1;
  const bboxHeight = maxY - minY + 1;
  const bboxMaxSide = Math.max(bboxWidth, bboxHeight);
  const shortSide = Math.min(dims.width, dims.height);
  const padding =
    mode === "source_object"
      ? Math.min(
          shortSide * 0.28,
          Math.max(bboxMaxSide * 0.25, shortSide * 0.04),
        )
      : Math.min(
          shortSide * 0.22,
          Math.max(bboxMaxSide * 0.18, shortSide * 0.035),
        );
  const x0 = Math.max(0, Math.floor(minX - padding));
  const y0 = Math.max(0, Math.floor(minY - padding));
  const x1 = Math.min(dims.width, Math.ceil(maxX + 1 + padding));
  const y1 = Math.min(dims.height, Math.ceil(maxY + 1 + padding));

  for (let y = y0; y < y1; y++) {
    alpha.fill(255, y * dims.width + x0, y * dims.width + x1);
  }

  return alpha;
}

async function createObjectSoftWorkZoneAlpha({
  mask,
  dims,
  maskInverted,
  mode,
}: {
  mask: Buffer;
  dims: Dimensions;
  maskInverted: boolean;
  mode: ObjectMaskMode;
}): Promise<Buffer> {
  const normalizedMaskAlpha = await sharp(mask)
    .ensureAlpha()
    .resize(dims.width, dims.height, {
      fit: "fill",
      kernel: sharp.kernel.nearest,
    })
    .extractChannel("alpha")
    .raw()
    .toBuffer();
  const workZoneAlpha = createObjectWorkZoneAlpha({
    maskAlpha: normalizedMaskAlpha,
    dims,
    maskInverted,
    mode,
  });
  const feather = Math.max(
    12,
    Math.round(Math.min(dims.width, dims.height) * 0.018),
  );

  return sharp(workZoneAlpha, {
    raw: { width: dims.width, height: dims.height, channels: 1 },
  })
    .blur(feather)
    .raw()
    .toBuffer();
}

export async function getImageDimensions(buffer: Buffer): Promise<Dimensions> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;
  if (!width || !height) {
    throw new Error("Dimenzije slike nisu dostupne.");
  }
  return { width, height };
}

export async function normalizeInputImage(buffer: Buffer): Promise<NormalizedImage> {
  const image = await sharp(buffer)
    .rotate()
    .keepIccProfile()
    .jpeg({
      quality: 96,
      chromaSubsampling: "4:4:4",
    })
    .toBuffer();
  const metadata = await sharp(image).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Dimenzije slike nisu dostupne.");
  }
  return {
    image,
    dimensions: {
      width: metadata.width,
      height: metadata.height,
    },
  };
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
  mode: ObjectMaskMode = "placement_guide",
): Promise<Buffer> {
  const editAlpha = await createObjectSoftWorkZoneAlpha({
    mask: buffer,
    dims,
    maskInverted: false,
    mode,
  });
  const maskAlpha = await sharp(editAlpha, {
    raw: { width: dims.width, height: dims.height, channels: 1 },
  })
    .negate()
    .raw()
    .toBuffer();

  return sharp(createBlackRgbaWithAlpha(maskAlpha), {
    raw: { width: dims.width, height: dims.height, channels: 4 },
  })
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

export async function prepareObjectReferenceForProvider(
  buffer: Buffer,
): Promise<{ image: Buffer; mimeType: string }> {
  const image = await sharp(buffer)
    .rotate()
    .resize(2048, 2048, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .keepIccProfile()
    .png({ quality: 95 })
    .toBuffer();
  return { image, mimeType: "image/png" };
}

export async function composeWithMask({
  original,
  aiResult,
  mask,
  originalDims,
  maskInverted = false,
  softenMask = false,
  expandMask = false,
  objectMaskMode,
}: {
  original: Buffer;
  aiResult: Buffer;
  mask: Buffer;
  originalDims: Dimensions;
  maskInverted?: boolean;
  softenMask?: boolean;
  expandMask?: boolean;
  objectMaskMode?: ObjectMaskMode;
}): Promise<Buffer> {
  const normalizedOriginal = await sharp(original)
    .rotate()
    .resize(originalDims.width, originalDims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .keepIccProfile()
    .jpeg({
      quality: 96,
      chromaSubsampling: "4:4:4",
    })
    .toBuffer();

  const resizedResultRgb = await sharp(aiResult)
    .rotate()
    .resize(originalDims.width, originalDims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .removeAlpha()
    .raw()
    .toBuffer();

  const maskAlpha = sharp(mask)
    .ensureAlpha()
    .resize(originalDims.width, originalDims.height, {
      fit: "fill",
      kernel: sharp.kernel.nearest,
    })
    .extractChannel("alpha");

  const editAlphaFromObjectWorkZone = objectMaskMode
    ? await createObjectSoftWorkZoneAlpha({
        mask,
        dims: originalDims,
        maskInverted,
        mode: objectMaskMode,
      })
    : null;

  let editAlphaPipeline = maskInverted ? maskAlpha : maskAlpha.negate();
  if (!editAlphaFromObjectWorkZone && expandMask) {
    const expansion = Math.min(
      220,
      Math.max(32, Math.round(Math.min(originalDims.width, originalDims.height) * 0.06)),
    );
    editAlphaPipeline = editAlphaPipeline.threshold(12).dilate(expansion);
  }
  if (softenMask) {
    const radius = Math.max(
      10,
      Math.round(Math.min(originalDims.width, originalDims.height) * 0.018),
    );
    editAlphaPipeline = editAlphaPipeline.blur(radius);
  }

  const editAlpha =
    editAlphaFromObjectWorkZone ?? (await editAlphaPipeline.raw().toBuffer());

  const maskedResult = await sharp(
    createRgbaFromRgbAndAlpha(resizedResultRgb, editAlpha),
    {
      raw: {
        width: originalDims.width,
        height: originalDims.height,
        channels: 4,
      },
    },
  )
    .png()
    .toBuffer();

  return sharp(normalizedOriginal)
    .composite([{ input: maskedResult, blend: "over" }])
    .keepIccProfile()
    .jpeg({
      quality: 96,
      chromaSubsampling: "4:4:4",
    })
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
    .keepIccProfile()
    .jpeg({
      quality: 96,
      chromaSubsampling: "4:4:4",
    })
    .toBuffer();
}
