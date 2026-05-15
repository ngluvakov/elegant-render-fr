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

export type ImageBufferSummary = {
  sizeBytes: number;
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  hasAlpha?: boolean;
  orientation?: number;
};

export type ProviderTarget = {
  width: number;
  height: number;
  ratioLabel: string;
  openaiSize: "1024x1024" | "1024x1536" | "1536x1024";
};

export type ObjectMaskMode = "source_object" | "placement_guide";
export type ObjectWorkZoneCategory =
  | "furniture"
  | "decor"
  | "lighting"
  | "appliance"
  | "plant"
  | "artwork"
  | string;

type MaskBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  selectedCount: number;
};

type ReferenceCrop = {
  left: number;
  top: number;
  width: number;
  height: number;
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

async function readSingleChannelRaw(
  image: ReturnType<typeof sharp>,
  dims: Dimensions,
): Promise<Buffer> {
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== dims.width || info.height !== dims.height) {
    throw new Error(
      `AI compositing failed: alpha mask is ${info.width}x${info.height}, expected ${dims.width}x${dims.height}.`,
    );
  }
  if (info.channels === 1) return data;

  return sharp(data, {
    raw: { width: dims.width, height: dims.height, channels: info.channels },
  })
    .extractChannel(0)
    .raw()
    .toBuffer();
}

function createRgbaFromRgbAndAlpha({
  rgb,
  alpha,
  dims,
}: {
  rgb: Buffer;
  alpha: Buffer;
  dims: Dimensions;
}): Buffer {
  const pixelCount = dims.width * dims.height;
  if (alpha.length !== pixelCount || rgb.length !== pixelCount * 3) {
    throw new Error(
      `AI compositing failed: RGB length ${rgb.length}, alpha length ${alpha.length}, expected ${pixelCount} pixels.`,
    );
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

async function createAiResultRgbOverOriginal({
  normalizedOriginal,
  aiResult,
  dims,
}: {
  normalizedOriginal: Buffer;
  aiResult: Buffer;
  dims: Dimensions;
}): Promise<Buffer> {
  const aiLayer = await sharp(aiResult)
    .rotate()
    .resize(dims.width, dims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .toColorspace("srgb")
    .ensureAlpha()
    .png()
    .toBuffer();

  const { data, info } = await sharp(normalizedOriginal)
    .resize(dims.width, dims.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .composite([{ input: aiLayer, blend: "over" }])
    .toColorspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = dims.width * dims.height;
  if (
    info.width !== dims.width ||
    info.height !== dims.height ||
    info.channels !== 3 ||
    data.length !== pixelCount * 3
  ) {
    throw new Error(
      `AI compositing failed: normalized result is ${info.width}x${info.height}x${info.channels}, expected ${dims.width}x${dims.height}x3.`,
    );
  }

  return data;
}

function isArtworkCategory(category?: string | null): boolean {
  return category === "artwork";
}

function createSelectedMaskAlpha({
  maskAlpha,
  dims,
  maskInverted,
}: {
  maskAlpha: Buffer;
  dims: Dimensions;
  maskInverted: boolean;
}): { alpha: Buffer; bounds: MaskBounds | null } {
  let minX = dims.width;
  let minY = dims.height;
  let maxX = -1;
  let maxY = -1;
  let selectedCount = 0;
  const alpha = Buffer.alloc(dims.width * dims.height);

  for (let index = 0; index < maskAlpha.length; index++) {
    const selected = maskInverted ? maskAlpha[index] > 10 : maskAlpha[index] < 245;
    if (!selected) continue;
    selectedCount++;
    alpha[index] = 255;
    const x = index % dims.width;
    const y = Math.floor(index / dims.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (maxX < minX || maxY < minY) return { alpha, bounds: null };
  return {
    alpha,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      selectedCount,
    },
  };
}

function createPaddedBoundsAlpha({
  bounds,
  dims,
  category,
}: {
  bounds: MaskBounds;
  dims: Dimensions;
  category?: string | null;
}): Buffer {
  const alpha = Buffer.alloc(dims.width * dims.height);
  const bboxMaxSide = Math.max(bounds.width, bounds.height);
  const shortSide = Math.min(dims.width, dims.height);
  const padding = isArtworkCategory(category)
    ? Math.min(shortSide * 0.045, Math.max(bboxMaxSide * 0.04, shortSide * 0.012))
    : Math.min(shortSide * 0.16, Math.max(bboxMaxSide * 0.22, shortSide * 0.04));
  const x0 = Math.max(0, Math.floor(bounds.minX - padding));
  const y0 = Math.max(0, Math.floor(bounds.minY - padding));
  const x1 = Math.min(dims.width, Math.ceil(bounds.maxX + 1 + padding));
  const y1 = Math.min(dims.height, Math.ceil(bounds.maxY + 1 + padding));

  for (let y = y0; y < y1; y++) {
    alpha.fill(255, y * dims.width + x0, y * dims.width + x1);
  }

  return alpha;
}

async function createDilatedShapeAlpha({
  selectedAlpha,
  bounds,
  dims,
  mode,
}: {
  selectedAlpha: Buffer;
  bounds: MaskBounds;
  dims: Dimensions;
  mode: ObjectMaskMode;
}): Promise<Buffer> {
  const bboxMaxSide = Math.max(bounds.width, bounds.height);
  const shortSide = Math.min(dims.width, dims.height);
  const factor = mode === "source_object" ? 0.35 : 0.2;
  const minDilation = mode === "source_object" ? shortSide * 0.025 : shortSide * 0.018;
  const cap =
    mode === "source_object"
      ? Math.min(shortSide * 0.18, 180)
      : Math.min(shortSide * 0.12, 140);
  const dilation = Math.max(
    4,
    Math.round(Math.min(cap, Math.max(bboxMaxSide * factor, minDilation))),
  );
  const inverse = Buffer.alloc(selectedAlpha.length, 255);
  for (let index = 0; index < selectedAlpha.length; index++) {
    if (selectedAlpha[index] > 0) inverse[index] = 0;
  }

  return readSingleChannelRaw(
    sharp(inverse, {
      raw: { width: dims.width, height: dims.height, channels: 1 },
    })
      .dilate(dilation)
      .negate(),
    dims,
  );
}

async function createObjectWorkZoneAlpha({
  maskAlpha,
  dims,
  maskInverted,
  mode,
  category,
}: {
  maskAlpha: Buffer;
  dims: Dimensions;
  maskInverted: boolean;
  mode: ObjectMaskMode;
  category?: string | null;
}): Promise<Buffer> {
  const { alpha: selectedAlpha, bounds } = createSelectedMaskAlpha({
    maskAlpha,
    dims,
    maskInverted,
  });
  if (!bounds) return selectedAlpha;
  if (isArtworkCategory(category)) {
    return createPaddedBoundsAlpha({ bounds, dims, category });
  }
  return createDilatedShapeAlpha({ selectedAlpha, bounds, dims, mode });
}

async function createObjectSoftWorkZoneAlpha({
  mask,
  dims,
  maskInverted,
  mode,
  category,
}: {
  mask: Buffer;
  dims: Dimensions;
  maskInverted: boolean;
  mode: ObjectMaskMode;
  category?: string | null;
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
  const workZoneAlpha = await createObjectWorkZoneAlpha({
    maskAlpha: normalizedMaskAlpha,
    dims,
    maskInverted,
    mode,
    category,
  });
  const featherRatio = isArtworkCategory(category)
    ? 0.01
    : mode === "source_object"
      ? 0.02
      : 0.016;
  const feather = Math.max(
    isArtworkCategory(category) ? 6 : 12,
    Math.round(Math.min(dims.width, dims.height) * featherRatio),
  );

  return readSingleChannelRaw(
    sharp(workZoneAlpha, {
      raw: { width: dims.width, height: dims.height, channels: 1 },
    }).blur(feather),
    dims,
  );
}

async function createUserMaskSoftEditAlpha({
  mask,
  dims,
  maskInverted,
}: {
  mask: Buffer;
  dims: Dimensions;
  maskInverted: boolean;
}): Promise<Buffer> {
  const maskAlpha = sharp(mask)
    .ensureAlpha()
    .resize(dims.width, dims.height, {
      fit: "fill",
      kernel: sharp.kernel.nearest,
    })
    .extractChannel("alpha");
  const editAlphaPipeline = maskInverted ? maskAlpha : maskAlpha.negate();
  const feather = Math.max(
    8,
    Math.round(Math.min(dims.width, dims.height) * 0.012),
  );

  return readSingleChannelRaw(editAlphaPipeline.blur(feather), dims);
}

function createRedRgbaWithAlpha(alpha: Buffer): Buffer {
  const rgba = Buffer.allocUnsafe(alpha.length * 4);
  for (let index = 0; index < alpha.length; index++) {
    const offset = index * 4;
    rgba[offset] = 255;
    rgba[offset + 1] = 64;
    rgba[offset + 2] = 64;
    rgba[offset + 3] = Math.min(210, alpha[index]);
  }
  return rgba;
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

export async function describeImageBuffer(
  buffer: Buffer,
): Promise<ImageBufferSummary> {
  const metadata = await sharp(buffer).metadata();
  return {
    sizeBytes: buffer.length,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
  };
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
  options: { category?: string | null } = {},
): Promise<Buffer> {
  const editAlpha =
    mode === "source_object"
      ? await createUserMaskSoftEditAlpha({
          mask: buffer,
          dims,
          maskInverted: false,
        })
      : await createObjectSoftWorkZoneAlpha({
          mask: buffer,
          dims,
          maskInverted: false,
          mode,
          category: options.category,
        });
  const maskAlpha = await readSingleChannelRaw(
    sharp(editAlpha, {
      raw: { width: dims.width, height: dims.height, channels: 1 },
    }).negate(),
    dims,
  );

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
  options: { category?: string | null } = {},
): Promise<{ image: Buffer; mimeType: string }> {
  if (!isArtworkCategory(options.category)) {
    const focused = await prepareFocusedObjectReference(buffer);
    if (focused) return { image: focused, mimeType: "image/png" };
  }

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

async function prepareFocusedObjectReference(buffer: Buffer): Promise<Buffer | null> {
  const oriented = await sharp(buffer).rotate().toBuffer();
  const metadata = await sharp(oriented).metadata();
  if (!metadata.width || !metadata.height) return null;

  const crop = await detectReferenceContentCrop(oriented, {
    width: metadata.width,
    height: metadata.height,
  });
  if (!crop) return null;

  const cropped = await sharp(oriented).extract(crop).png().toBuffer();
  const contained = await sharp(cropped)
    .resize(1840, 1840, {
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
    .keepIccProfile()
    .png({ quality: 95 })
    .toBuffer();
  const containedMetadata = await sharp(contained).metadata();
  if (!containedMetadata.width || !containedMetadata.height) return null;

  return sharp({
    create: {
      width: 2048,
      height: 2048,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
    },
  })
    .composite([
      {
        input: contained,
        left: Math.round((2048 - containedMetadata.width) / 2),
        top: Math.round((2048 - containedMetadata.height) / 2),
      },
    ])
    .png({ quality: 95 })
    .toBuffer();
}

async function detectReferenceContentCrop(
  image: Buffer,
  dims: Dimensions,
): Promise<ReferenceCrop | null> {
  const maxSampleSide = 256;
  const { data, info } = await sharp(image)
    .resize(maxSampleSide, maxSampleSide, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels < 4) return null;

  const pixelCount = info.width * info.height;
  let transparentCount = 0;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    if (data[offset + 3] < 245) transparentCount++;
  }

  const useAlpha = transparentCount / pixelCount > 0.04;
  const background = useAlpha ? null : estimateCornerBackground(data, info);
  if (!useAlpha && !background) return null;

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let contentCount = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * info.channels;
      const isContent = useAlpha
        ? data[offset + 3] > 32
        : backgroundDistance(data, offset, background) > 36;
      if (!isContent) continue;
      contentCount++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;
  const bboxWidth = maxX - minX + 1;
  const bboxHeight = maxY - minY + 1;
  const selectedRatio = contentCount / pixelCount;
  const bboxRatio = (bboxWidth * bboxHeight) / pixelCount;
  const touchesEdges =
    (minX <= 2 ? 1 : 0) +
    (minY <= 2 ? 1 : 0) +
    (maxX >= info.width - 3 ? 1 : 0) +
    (maxY >= info.height - 3 ? 1 : 0);

  if (
    selectedRatio < 0.025 ||
    bboxRatio > 0.86 ||
    touchesEdges >= 3 ||
    bboxWidth < 18 ||
    bboxHeight < 18
  ) {
    return null;
  }

  const scaleX = dims.width / info.width;
  const scaleY = dims.height / info.height;
  const marginX = bboxWidth * scaleX * 0.1;
  const marginY = bboxHeight * scaleY * 0.1;
  const left = Math.max(0, Math.floor(minX * scaleX - marginX));
  const top = Math.max(0, Math.floor(minY * scaleY - marginY));
  const right = Math.min(dims.width, Math.ceil((maxX + 1) * scaleX + marginX));
  const bottom = Math.min(dims.height, Math.ceil((maxY + 1) * scaleY + marginY));
  const width = right - left;
  const height = bottom - top;

  if (width < 32 || height < 32) return null;
  return { left, top, width, height };
}

function estimateCornerBackground(
  data: Buffer,
  info: sharp.OutputInfo,
): [number, number, number] | null {
  const sampleSize = Math.max(
    4,
    Math.min(14, Math.floor(Math.min(info.width, info.height) / 10)),
  );
  const corners = [
    [0, 0],
    [info.width - sampleSize, 0],
    [0, info.height - sampleSize],
    [info.width - sampleSize, info.height - sampleSize],
  ] as const;
  const samples = corners.map(([startX, startY]) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let y = startY; y < startY + sampleSize; y++) {
      for (let x = startX; x < startX + sampleSize; x++) {
        const offset = (y * info.width + x) * info.channels;
        r += data[offset];
        g += data[offset + 1];
        b += data[offset + 2];
        count++;
      }
    }
    return [r / count, g / count, b / count] as [number, number, number];
  });
  const first = samples[0];
  const maxCornerDelta = Math.max(
    ...samples.map((sample) =>
      Math.abs(sample[0] - first[0]) +
      Math.abs(sample[1] - first[1]) +
      Math.abs(sample[2] - first[2]),
    ),
  );
  if (maxCornerDelta > 95) return null;
  return [
    samples.reduce((sum, sample) => sum + sample[0], 0) / samples.length,
    samples.reduce((sum, sample) => sum + sample[1], 0) / samples.length,
    samples.reduce((sum, sample) => sum + sample[2], 0) / samples.length,
  ];
}

function backgroundDistance(
  data: Buffer,
  offset: number,
  background: [number, number, number] | null,
): number {
  if (!background) return 0;
  return (
    Math.abs(data[offset] - background[0]) +
    Math.abs(data[offset + 1] - background[1]) +
    Math.abs(data[offset + 2] - background[2])
  ) / 3;
}

export async function createObjectWorkZoneOverlay({
  mask,
  dims,
  maskInverted = false,
  mode = "placement_guide",
  category,
}: {
  mask: Buffer;
  dims: Dimensions;
  maskInverted?: boolean;
  mode?: ObjectMaskMode;
  category?: string | null;
}): Promise<Buffer> {
  const alpha = await createObjectSoftWorkZoneAlpha({
    mask,
    dims,
    maskInverted,
    mode,
    category,
  });
  return sharp(createRedRgbaWithAlpha(alpha), {
    raw: { width: dims.width, height: dims.height, channels: 4 },
  })
    .png()
    .toBuffer();
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
  objectCategory,
}: {
  original: Buffer;
  aiResult: Buffer;
  mask: Buffer;
  originalDims: Dimensions;
  maskInverted?: boolean;
  softenMask?: boolean;
  expandMask?: boolean;
  objectMaskMode?: ObjectMaskMode;
  objectCategory?: string | null;
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

  const resizedResultRgb = await createAiResultRgbOverOriginal({
    normalizedOriginal,
    aiResult,
    dims: originalDims,
  });

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
        category: objectCategory,
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
    editAlphaFromObjectWorkZone ??
    (await readSingleChannelRaw(editAlphaPipeline, originalDims));

  const maskedResult = await sharp(
    createRgbaFromRgbAndAlpha({
      rgb: resizedResultRgb,
      alpha: editAlpha,
      dims: originalDims,
    }),
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
