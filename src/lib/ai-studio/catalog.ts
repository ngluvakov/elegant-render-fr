export const AI_CREDIT_PRODUCT_ID = "ai-studio-credits";
export const AI_CREDIT_CATEGORY_ID = "ai-studio";
export const AI_CREDIT_UNITS_PER_CREDIT = 2;
export const AI_CREDIT_EXPIRES_AFTER_MONTHS = 12;
export const AI_FILE_RETENTION_DAYS = 30;
export const AI_FREE_REGENERATIONS = 2;

export type AiEditType =
  | "item_removal"
  | "day_to_dusk"
  | "sky_replacement"
  | "wall_color_change"
  | "virtual_staging"
  | "object_insertion"
  | "virtual_renovation"
  | "room_redesign";

export type AiImageProvider = "gemini_flash" | "gemini_pro" | "openai";

export type AiImageEngineId =
  | "nano_banana_pro"
  | "nano_banana"
  | "gpt_image_15"
  | "gpt_image_2_test";

export type AiImageEngine = {
  id: AiImageEngineId;
  label: string;
  provider: AiImageProvider;
  model: string;
  isExperimental?: boolean;
  isActive: boolean;
};

export type AiEditComplexity = "simple" | "complex";

export type AiStyleOption = {
  id: string;
  label: string;
  image?: string;
};

export type AiEditOption = {
  id: string;
  label: string;
};

export type AiEditTypeDefinition = {
  id: AiEditType;
  label: string;
  shortLabel: string;
  complexity: AiEditComplexity;
  units: number;
  description: string;
  supportsStyles?: boolean;
  supportsColor?: boolean;
  // Whether the customer can scope the edit with a brush/rect mask.
  // Atmospheric edits (sky_replacement, day_to_dusk) operate globally
  // — masking adds nothing — so we hide the Advanced toggle for them.
  supportsMask?: boolean;
  // Whether `selectedOption` is multi-valued (CSV of ids). Currently
  // only item_removal: a customer often wants to remove multiple
  // categories (furniture + clutter + people) in one pass.
  multiSelect?: boolean;
  // Whether this edit needs a second customer-uploaded reference image.
  // Used by object_insertion, where image 1 is the scene and image 2 is
  // the object to merge into that scene.
  requiresReferenceImage?: boolean;
  // Provider that gives the best result/price tradeoff for this edit.
  // The UI surfaces it as "Preporučeno" and seeds the picker default.
  recommendedProvider?: AiImageProvider;
  // Edit-specific placeholder for the prompt textarea so the example
  // matches the operation (e.g. "ukloni X, Y" for item_removal vs
  // "dodaj nameštaj…" for staging).
  promptPlaceholder?: string;
  optionsLabel?: string;
  options?: AiEditOption[];
};

export const AI_STYLE_OPTIONS: AiStyleOption[] = [
  { id: "none", label: "Bez stila" },
  { id: "modern", label: "Modern", image: "/styles/modern.webp" },
  { id: "contemporary", label: "Contemporary", image: "/styles/contemporary.webp" },
  { id: "scandinavian", label: "Scandinavian", image: "/styles/scandinavian.webp" },
  { id: "mid-century", label: "Mid-century", image: "/styles/mid-century.webp" },
  { id: "farmhouse", label: "Farmhouse", image: "/styles/farmhouse.webp" },
  { id: "industrial-urban", label: "Industrial urban", image: "/styles/industrial-urban.webp" },
  { id: "primorski", label: "Primorski", image: "/styles/primorski.webp" },
];

export const AI_EDIT_TYPES: AiEditTypeDefinition[] = [
  {
    id: "item_removal",
    label: "Uklanjanje elemenata",
    shortLabel: "Item Removal",
    complexity: "simple",
    units: 1,
    description: "Uklanjanje predmeta, nereda, ljudi, vozila ili sitnih smetnji sa fotografije.",
    supportsMask: true,
    multiSelect: true,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. ukloni saobraćajne znake i kese; pažljivo sa senkama na zidu",
    optionsLabel: "Šta uklanjamo (može više)",
    options: [
      { id: "furniture", label: "Nameštaj" },
      { id: "clutter", label: "Nered i sitnice" },
      { id: "vehicles", label: "Vozila" },
      { id: "people", label: "Ljudi" },
      { id: "surfaces", label: "Tragovi sa zidova/poda" },
    ],
  },
  {
    id: "day_to_dusk",
    label: "Dan u noć",
    shortLabel: "Day-to-Dusk",
    complexity: "simple",
    units: 1,
    description: "Pretvaranje dnevne fotografije u večernji ili sutonski prikaz.",
    supportsMask: false,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. zadržati prirodno osvetljenje na fasadi, suptilan sjaj prozora",
    optionsLabel: "Atmosfera",
    options: [
      { id: "warm-dusk", label: "Topli suton" },
      { id: "blue-hour", label: "Plavi sat" },
      { id: "evening-lights", label: "Večernja svetla" },
      { id: "luxury-night", label: "Luksuzni noćni izgled" },
      { id: "real-estate", label: "Realistična agencijska obrada" },
    ],
  },
  {
    id: "sky_replacement",
    label: "Zamena neba",
    shortLabel: "Sky Replacement",
    complexity: "simple",
    units: 1,
    description: "Zamena sivog ili oblačnog neba atraktivnijom atmosferom.",
    supportsMask: false,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. blago osvetljenje, suptilni oblaci, ne menjati boju zgrade",
    optionsLabel: "Nebo",
    options: [
      { id: "clear-blue", label: "Vedro plavo" },
      { id: "soft-clouds", label: "Blago oblačno" },
      { id: "golden-hour", label: "Zlatni sat" },
      { id: "dramatic", label: "Dramatično nebo" },
      { id: "sunset", label: "Sunset" },
    ],
  },
  {
    id: "wall_color_change",
    label: "Promena boje zidova",
    shortLabel: "Wall Color",
    complexity: "simple",
    units: 1,
    description: "Brza promena boje zidova uz color picker i dodatne instrukcije.",
    supportsColor: true,
    supportsMask: true,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. zadrži boju lajsni i ramova, ne dirati nameštaj",
  },
  {
    id: "virtual_staging",
    label: "Virtuelno opremanje",
    shortLabel: "Virtual Staging",
    complexity: "complex",
    units: 2,
    description: "Dodavanje nameštaja i dekora u praznu ili slabo uređenu prostoriju.",
    supportsStyles: true,
    supportsMask: true,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. topao moderni nameštaj, drveni patos, sačuvati prozore i osvetljenje",
    optionsLabel: "Tip prostorije",
    options: [
      { id: "living-room", label: "Dnevna soba" },
      { id: "bedroom", label: "Spavaća soba" },
      { id: "kitchen", label: "Kuhinja" },
      { id: "dining-room", label: "Trpezarija" },
      { id: "office", label: "Kancelarija" },
      { id: "terrace", label: "Terasa/eksterijer" },
      { id: "other", label: "Drugo" },
    ],
  },
  {
    id: "object_insertion",
    label: "Dodavanje ili zamena objekta",
    shortLabel: "Object Insert/Replace",
    complexity: "complex",
    units: 2,
    description:
      "Dodavanje ili zamena komada nameštaja/dekora iz jedne ili više referentnih slika uz usklađivanje perspektive, svetla i senki.",
    supportsMask: true,
    requiresReferenceImage: true,
    recommendedProvider: "gemini_pro",
    promptPlaceholder:
      "npr. postavi fotelju pored prozora ili zameni postojeću stolicu; uskladi skalu, svetlo i senku",
    optionsLabel: "Tip objekta",
    options: [
      { id: "furniture", label: "Nameštaj" },
      { id: "decor", label: "Dekor" },
      { id: "lighting", label: "Rasveta" },
      { id: "appliance", label: "Uređaj" },
      { id: "plant", label: "Biljka" },
      { id: "artwork", label: "Umetnost" },
      { id: "other", label: "Drugo" },
    ],
  },
  {
    id: "virtual_renovation",
    label: "Virtuelna renovacija",
    shortLabel: "Renovation",
    complexity: "complex",
    units: 2,
    description: "Promena materijala, podova, zidova, kuhinje, kupatila ili celog izgleda.",
    supportsStyles: true,
    supportsMask: true,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. zameni pod hrastovim parketom, ostavi raspored kuhinje",
    optionsLabel: "Šta menjamo",
    options: [
      { id: "floors", label: "Podovi" },
      { id: "walls", label: "Zidovi" },
      { id: "kitchen", label: "Kuhinja" },
      { id: "bathroom", label: "Kupatilo" },
      { id: "lighting", label: "Rasveta" },
      { id: "materials", label: "Materijali" },
      { id: "full-look", label: "Kompletan izgled" },
    ],
  },
  {
    id: "room_redesign",
    label: "Redizajn prostorije",
    shortLabel: "Room Redesign",
    complexity: "complex",
    units: 2,
    description: "Promena stila, atmosfere i vizuelnog identiteta postojeće prostorije.",
    supportsStyles: true,
    supportsMask: true,
    recommendedProvider: "gemini_pro",
    promptPlaceholder: "npr. svetli skandinavski stil, zadržati orijentaciju i prozore",
    optionsLabel: "Tip prostorije",
    options: [
      { id: "living-room", label: "Dnevna soba" },
      { id: "bedroom", label: "Spavaća soba" },
      { id: "kitchen", label: "Kuhinja" },
      { id: "dining-room", label: "Trpezarija" },
      { id: "office", label: "Kancelarija" },
      { id: "terrace", label: "Terasa/eksterijer" },
      { id: "other", label: "Drugo" },
    ],
  },
];

export const AI_IMAGE_PROVIDERS: Array<{
  id: AiImageProvider;
  label: string;
  modelEnv: string;
  defaultModel: string;
}> = [
  {
    id: "gemini_flash",
    label: "Nano Banana",
    modelEnv: "AI_STUDIO_GEMINI_MODEL",
    defaultModel: "gemini-2.5-flash-image",
  },
  {
    id: "gemini_pro",
    label: "Nano Banana Pro",
    modelEnv: "AI_STUDIO_GEMINI_PRO_MODEL",
    defaultModel: "gemini-3-pro-image-preview",
  },
  {
    id: "openai",
    label: "OpenAI Images",
    modelEnv: "AI_STUDIO_OPENAI_MODEL",
    defaultModel: "gpt-image-2",
  },
];

export const ACTIVE_AI_IMAGE_PROVIDER_IDS: AiImageProvider[] = [
  "gemini_flash",
  "gemini_pro",
  "openai",
];

export const ACTIVE_AI_IMAGE_PROVIDERS = AI_IMAGE_PROVIDERS.filter((provider) =>
  ACTIVE_AI_IMAGE_PROVIDER_IDS.includes(provider.id),
);

export const DEFAULT_AI_PROVIDER: AiImageProvider = "gemini_pro";

export const AI_IMAGE_ENGINES: AiImageEngine[] = [
  {
    id: "nano_banana_pro",
    label: "Nano Banana Pro",
    provider: "gemini_pro",
    model: "gemini-3-pro-image-preview",
    isActive: true,
  },
  {
    id: "nano_banana",
    label: "Nano Banana",
    provider: "gemini_flash",
    model: "gemini-2.5-flash-image",
    isActive: true,
  },
  {
    id: "gpt_image_15",
    label: "GPT Image 1.5",
    provider: "openai",
    model: "gpt-image-1.5",
    isActive: true,
  },
  {
    id: "gpt_image_2_test",
    label: "GPT Image 2",
    provider: "openai",
    model: "gpt-image-2",
    isExperimental: true,
    isActive: true,
  },
];

export const ACTIVE_AI_IMAGE_ENGINES = AI_IMAGE_ENGINES.filter(
  (engine) => engine.isActive,
);

export const DEFAULT_AI_ENGINE_ID: AiImageEngineId = "nano_banana_pro";

export type AiCreditTier = {
  minCredits: number;
  centsPerCredit: number;
};

export const AI_CREDIT_TIERS: AiCreditTier[] = [
  { minCredits: 100, centsPerCredit: 150 },
  { minCredits: 50, centsPerCredit: 160 },
  { minCredits: 25, centsPerCredit: 180 },
  { minCredits: 1, centsPerCredit: 200 },
] as const;

export function getAiEditType(id: AiEditType): AiEditTypeDefinition {
  const def = AI_EDIT_TYPES.find((item) => item.id === id);
  if (!def) throw new Error(`Unknown AI edit type: ${id}`);
  return def;
}

// Splits a possibly-CSV selectedOption value into discrete option ids.
// Multi-select edits store comma-separated; single-select edits store
// a single id; null/empty returns []. Trims whitespace and drops empty.
export function parseSelectedOptions(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

// Resolves the human-readable label(s) for a generation's selectedOption,
// supporting both single (string) and multi (CSV) shapes.
export function formatSelectedOptionLabels(
  editType: AiEditType,
  selectedOption: string | null | undefined,
): string | null {
  const ids = parseSelectedOptions(selectedOption);
  if (ids.length === 0) return null;
  const def = AI_EDIT_TYPES.find((item) => item.id === editType);
  if (!def?.options) return ids.join(", ");
  return ids
    .map((id) => def.options!.find((opt) => opt.id === id)?.label ?? id)
    .join(", ");
}

export function getAiProvider(id: AiImageProvider) {
  const provider = AI_IMAGE_PROVIDERS.find((item) => item.id === id);
  if (!provider) throw new Error(`Unknown AI provider: ${id}`);
  return provider;
}

export function isActiveAiProvider(id: AiImageProvider): boolean {
  return ACTIVE_AI_IMAGE_PROVIDER_IDS.includes(id);
}

export function getAiProviderModel(id: AiImageProvider): string {
  const provider = getAiProvider(id);
  return process.env[provider.modelEnv] || provider.defaultModel;
}

export function getAiImageEngine(id: AiImageEngineId): AiImageEngine {
  const engine = AI_IMAGE_ENGINES.find((item) => item.id === id);
  if (!engine) throw new Error(`Unknown AI engine: ${id}`);
  return engine;
}

export function isActiveAiImageEngine(id: AiImageEngineId): boolean {
  return ACTIVE_AI_IMAGE_ENGINES.some((engine) => engine.id === id);
}

export function getDefaultEngineForProvider(
  provider: AiImageProvider,
): AiImageEngine {
  if (provider === "gemini_flash") return getAiImageEngine("nano_banana");
  if (provider === "openai") return getAiImageEngine("gpt_image_2_test");
  return getAiImageEngine(DEFAULT_AI_ENGINE_ID);
}

export function resolveAiImageEngine({
  engineId,
  provider,
}: {
  engineId?: AiImageEngineId | null;
  provider?: AiImageProvider | null;
}): AiImageEngine | null {
  if (engineId) {
    const engine = AI_IMAGE_ENGINES.find((item) => item.id === engineId);
    return engine ?? null;
  }
  if (provider) return getDefaultEngineForProvider(provider);
  return getAiImageEngine(DEFAULT_AI_ENGINE_ID);
}

export function getAiEngineIdForGeneration(
  provider: AiImageProvider,
  model: string | null | undefined,
): AiImageEngineId {
  const modelMatch = model
    ? AI_IMAGE_ENGINES.find(
        (engine) => engine.provider === provider && engine.model === model,
      )
    : null;
  return (modelMatch ?? getDefaultEngineForProvider(provider)).id;
}

export function getAiEngineLabelForGeneration(
  provider: AiImageProvider,
  model: string | null | undefined,
): string {
  const engineId = getAiEngineIdForGeneration(provider, model);
  return getAiImageEngine(engineId).label;
}

export function calculateAiCreditPurchase(
  credits: number,
  tiers: AiCreditTier[] = AI_CREDIT_TIERS,
) {
  const quantity = Math.max(1, Math.floor(credits));
  const sorted = tiers.slice().sort((a, b) => b.minCredits - a.minCredits);
  const tier =
    sorted.find((item) => quantity >= item.minCredits) ??
    sorted[sorted.length - 1] ??
    AI_CREDIT_TIERS[AI_CREDIT_TIERS.length - 1];
  const totalCents = quantity * tier.centsPerCredit;
  return {
    credits: quantity,
    units: quantity * AI_CREDIT_UNITS_PER_CREDIT,
    centsPerCredit: tier.centsPerCredit,
    totalCents,
  };
}

export function centsToEur(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number): string {
  const value = cents / 100;
  return value % 1 === 0 ? `€${value.toFixed(0)}` : `€${value.toFixed(2)}`;
}

export function formatCreditsFromUnits(units: number): string {
  const credits = units / AI_CREDIT_UNITS_PER_CREDIT;
  return credits % 1 === 0 ? `${credits.toFixed(0)} kredita` : `${credits.toFixed(1)} kredita`;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isAiCreditProduct(productId: string): boolean {
  return productId === AI_CREDIT_PRODUCT_ID;
}
