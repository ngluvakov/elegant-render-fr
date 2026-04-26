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
  | "virtual_renovation"
  | "room_redesign";

export type AiImageProvider = "gemini_flash" | "gemini_pro" | "openai";

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
    optionsLabel: "Šta uklanjamo",
    options: [
      { id: "furniture", label: "Ukloni nameštaj" },
      { id: "clutter", label: "Ukloni nered" },
      { id: "vehicles", label: "Ukloni vozila" },
      { id: "people", label: "Ukloni ljude" },
      { id: "surfaces", label: "Očisti zidove/pod" },
    ],
  },
  {
    id: "day_to_dusk",
    label: "Dan u noć",
    shortLabel: "Day-to-Dusk",
    complexity: "simple",
    units: 1,
    description: "Pretvaranje dnevne fotografije u večernji ili sutonski prikaz.",
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
  },
  {
    id: "virtual_staging",
    label: "Virtuelno opremanje",
    shortLabel: "Virtual Staging",
    complexity: "complex",
    units: 2,
    description: "Dodavanje nameštaja i dekora u praznu ili slabo uređenu prostoriju.",
    supportsStyles: true,
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
    id: "virtual_renovation",
    label: "Virtuelna renovacija",
    shortLabel: "Renovation",
    complexity: "complex",
    units: 2,
    description: "Promena materijala, podova, zidova, kuhinje, kupatila ili celog izgleda.",
    supportsStyles: true,
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
    label: "GPT Image 1.5",
    modelEnv: "AI_STUDIO_OPENAI_MODEL",
    defaultModel: "gpt-image-1.5",
  },
];

export const DEFAULT_AI_PROVIDER: AiImageProvider = "gemini_flash";

export const AI_CREDIT_TIERS = [
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

export function getAiProvider(id: AiImageProvider) {
  const provider = AI_IMAGE_PROVIDERS.find((item) => item.id === id);
  if (!provider) throw new Error(`Unknown AI provider: ${id}`);
  return provider;
}

export function getAiProviderModel(id: AiImageProvider): string {
  const provider = getAiProvider(id);
  return process.env[provider.modelEnv] || provider.defaultModel;
}

export function calculateAiCreditPurchase(credits: number) {
  const quantity = Math.max(1, Math.floor(credits));
  const tier = AI_CREDIT_TIERS.find((item) => quantity >= item.minCredits) ??
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
