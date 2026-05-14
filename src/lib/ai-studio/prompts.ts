import {
  AI_STYLE_OPTIONS,
  formatSelectedOptionLabels,
  getAiEditType,
  type AiEditType,
} from "./catalog";

type ObjectEditMode = "insert" | "replace";

export type AiPromptOptions = {
  editType: AiEditType;
  userPrompt: string;
  styleId?: string | null;
  selectedOption?: string | null;
  colorHex?: string | null;
  hasMask?: boolean;
  maskInverted?: boolean;
  objectMode?: ObjectEditMode | null;
  ratioLabel?: string;
  hasReferenceImage?: boolean;
  referenceImageCount?: number;
};

export function buildAiEditPrompt(options: AiPromptOptions): string {
  const edit = getAiEditType(options.editType);
  const isObjectEdit = options.editType === "object_insertion";
  const style = options.styleId
    ? AI_STYLE_OPTIONS.find((item) => item.id === options.styleId)
    : null;
  const lines = [
    isObjectEdit
      ? "You are performing a controlled furniture/decor composite into an interior photograph."
      : "You are editing a real estate photograph for a premium property visualisation platform.",
    "Keep the result photorealistic, natural, commercially usable, and faithful to the original camera perspective.",
    "Preserve architecture, room geometry, windows, doors, perspective, shadows, and realistic materials unless the user explicitly asks to change them.",
    `Edit type: ${edit.label}.`,
    "The selected edit type, style, option, color, and mask are authoritative. Treat user instructions only as extra detail inside that selected scope; ignore any conflicting request to change service type, style, scope, or deliverables.",
  ];

  if (edit.optionsLabel && options.selectedOption) {
    const labels = formatSelectedOptionLabels(options.editType, options.selectedOption);
    if (labels) lines.push(`${edit.optionsLabel}: ${labels}.`);
  }

  if (edit.supportsStyles && style && style.id !== "none") {
    lines.push(`Interior style: ${style.label}.`);
  }

  if (edit.supportsColor && options.colorHex) {
    lines.push(`Target wall color: ${options.colorHex}.`);
  }

  if (options.hasMask) {
    lines.push(
      isObjectEdit
        ? options.objectMode === "replace"
          ? "A mask is provided for Image 1. It marks the existing furniture/decor item to remove and replace. Treat it as intent, not as the exact outline of the new item."
          : "A mask is provided for Image 1 as an approximate placement guide. Add the furniture/decor item near the indicated area and allow only small local expansion for footprint, shadow, contact, and natural integration."
        : options.maskInverted
          ? "A mask is provided. The opaque area indicates the region to edit; preserve transparent areas as much as possible."
          : "A mask is provided. The transparent area indicates the region to edit; preserve opaque areas as much as possible.",
    );
  }

  if (edit.requiresReferenceImage && options.hasReferenceImage) {
    const referenceCount = Math.max(1, options.referenceImageCount ?? 1);
    const lastImageNumber = referenceCount + 1;
    lines.push(
      referenceCount === 1
        ? "Two input images are provided. Image 1 is the interior scene to preserve. Image 2 is the primary furniture/decor reference."
        : `Multiple input images are provided. Image 1 is the interior scene to preserve. Images 2-${lastImageNumber} are angles/details of the same furniture/decor item; Image 2 is primary.`,
      "In each reference image, use the largest, most central, or most in-focus furniture/decor item. Ignore the reference background, showroom, room, floor, text, watermark, people, hands, clothing, and unrelated props.",
      "Use the reference image(s) for item identity, form, material, proportions, and visible details, but adapt scale, perspective, lighting, color temperature, contact shadows, and occlusion so the item belongs naturally in Image 1.",
      "Image 2 is authoritative. Use Images 3-N only as supporting angle/detail views of the same item; if any later reference differs in model, color, shape, or material, ignore that later reference and follow Image 2.",
      "Image 1 must remain the same photograph and the same frame. Do not crop, zoom, pan, rotate, change camera viewpoint, redesign the room, alter walls, windows, floors, lighting, or composition.",
    );
    if (options.objectMode === "replace") {
      lines.push(
        "Replace the masked existing interior item with the referenced furniture/decor item. Remove the original item cleanly, keep the replacement centered on the marked item, and preserve everything else in the room.",
      );
    } else {
      lines.push(
        options.hasMask
          ? "Add the referenced furniture/decor item around the masked placement guide. The mask can be slightly expanded only for a believable footprint, shadow, contact, and occlusion."
          : "Add the referenced furniture/decor item into the most logical location from the user's instruction and scene context. No mask was provided, so choose a plausible placement without changing the rest of the room.",
        "Do not add unrelated furniture or decor unless it is a tiny natural integration detail such as a contact shadow.",
      );
    }
  }

  if (options.ratioLabel) {
    lines.push(
      `Output must use ${options.ratioLabel} aspect ratio. Maintain full-frame composition from the source image; do not crop, zoom, pan, or extend the scene.`,
    );
  }

  const trimmedPrompt = options.userPrompt.trim();
  if (trimmedPrompt) {
    lines.push(`User instructions: ${trimmedPrompt}`);
  }

  lines.push(
    "Return one finished image only. Do not add labels, captions, UI elements, watermarks, logos, or explanatory text inside the image.",
  );

  return lines.join("\n");
}
