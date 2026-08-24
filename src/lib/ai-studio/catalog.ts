export const AI_CREDIT_PRODUCT_ID = "ai-studio-credits";
export const AI_CREDIT_CATEGORY_ID = "ai-studio";
export const AI_CREDIT_UNITS_PER_CREDIT = 2;
export const AI_CREDIT_EXPIRES_AFTER_MONTHS = 12;
export const AI_FILE_RETENTION_DAYS = 30;
export const AI_FREE_REGENERATIONS = 1;

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
  // Edit-specific placeholder for the prompt textarea so the example
  // matches the operation (e.g. "remove X, Y" for item_removal vs
  // "add furniture…" for staging).
  promptPlaceholder?: string;
  optionsLabel?: string;
  options?: AiEditOption[];
};

export const AI_STYLE_OPTIONS: AiStyleOption[] = [
  { id: "none", label: "Aucun style" },
  { id: "modern", label: "Moderne", image: "/styles/modern.webp" },
  { id: "contemporary", label: "Contemporain", image: "/styles/contemporary.webp" },
  { id: "scandinavian", label: "Scandinave", image: "/styles/scandinavian.webp" },
  { id: "mid-century", label: "Mid-century", image: "/styles/mid-century.webp" },
  { id: "farmhouse", label: "Campagne", image: "/styles/farmhouse.webp" },
  { id: "industrial-urban", label: "Industriel urbain", image: "/styles/industrial-urban.webp" },
  { id: "coastal", label: "Bord de mer", image: "/styles/coastal.webp" },
];

export const AI_EDIT_TYPES: AiEditTypeDefinition[] = [
  {
    id: "item_removal",
    label: "Suppression d’objets",
    shortLabel: "Suppression d’objets",
    complexity: "simple",
    units: 1,
    description: "Supprime les objets, le désordre, les personnes, les véhicules ou les petites distractions d’une photo.",
    supportsMask: true,
    multiSelect: true,
    promptPlaceholder: "ex. supprimez les panneaux de signalisation et les sacs ; attention aux ombres sur le mur",
    optionsLabel: "Ce qu’il faut supprimer (plusieurs choix possibles)",
    options: [
      { id: "furniture", label: "Meubles" },
      { id: "clutter", label: "Désordre et petits objets" },
      { id: "vehicles", label: "Véhicules" },
      { id: "people", label: "Personnes" },
      { id: "surfaces", label: "Traces sur les murs/sols" },
    ],
  },
  {
    id: "day_to_dusk",
    label: "Jour au crépuscule",
    shortLabel: "Jour au crépuscule",
    complexity: "simple",
    units: 1,
    description: "Transforme une photo prise de jour en vue de soirée ou de crépuscule.",
    supportsMask: false,
    promptPlaceholder: "ex. conservez l’éclairage naturel de la façade, lueur subtile aux fenêtres",
    optionsLabel: "Ambiance",
    options: [
      { id: "warm-dusk", label: "Crépuscule chaud" },
      { id: "blue-hour", label: "Heure bleue" },
      { id: "evening-lights", label: "Lumières du soir" },
      { id: "luxury-night", label: "Nuit luxueuse" },
      { id: "real-estate", label: "Retouche immobilière réaliste" },
    ],
  },
  {
    id: "sky_replacement",
    label: "Remplacement du ciel",
    shortLabel: "Remplacement du ciel",
    complexity: "simple",
    units: 1,
    description: "Remplace un ciel gris ou couvert par une ambiance plus flatteuse.",
    supportsMask: false,
    promptPlaceholder: "ex. lumière douce, nuages discrets, ne changez pas la couleur du bâtiment",
    optionsLabel: "Ciel",
    options: [
      { id: "clear-blue", label: "Bleu dégagé" },
      { id: "soft-clouds", label: "Nuages légers" },
      { id: "golden-hour", label: "Heure dorée" },
      { id: "dramatic", label: "Ciel spectaculaire" },
      { id: "sunset", label: "Coucher de soleil" },
    ],
  },
  {
    id: "wall_color_change",
    label: "Changement de couleur des murs",
    shortLabel: "Couleur des murs",
    complexity: "simple",
    units: 1,
    description: "Changement rapide de la couleur des murs avec un sélecteur de couleur et des instructions complémentaires.",
    supportsColor: true,
    supportsMask: true,
    promptPlaceholder: "ex. conservez les couleurs des plinthes et des encadrements, ne touchez pas au mobilier",
  },
  {
    id: "virtual_staging",
    label: "Home staging virtuel",
    shortLabel: "Home staging virtuel",
    complexity: "complex",
    units: 2,
    description: "Ajoute des meubles et de la déco dans une pièce vide ou peu meublée.",
    supportsStyles: true,
    supportsMask: true,
    promptPlaceholder: "ex. mobilier moderne chaleureux, sol en bois, conservez les fenêtres et l’éclairage",
    optionsLabel: "Type de pièce",
    options: [
      { id: "living-room", label: "Salon" },
      { id: "bedroom", label: "Chambre" },
      { id: "kitchen", label: "Cuisine" },
      { id: "dining-room", label: "Salle à manger" },
      { id: "office", label: "Bureau" },
      { id: "terrace", label: "Terrasse/extérieur" },
      { id: "other", label: "Autre" },
    ],
  },
  {
    id: "object_insertion",
    label: "Ajout ou remplacement de meubles/déco",
    shortLabel: "Meubles/déco",
    complexity: "complex",
    units: 2,
    description:
      "Ajoute ou remplace meubles, déco, luminaires, plantes, œuvres d’art ou électroménager en respectant la perspective, la lumière et les ombres.",
    supportsMask: true,
    requiresReferenceImage: true,
    promptPlaceholder:
      "ex. placez le fauteuil près de la fenêtre ou remplacez la chaise existante ; conservez le reste de la pièce",
    optionsLabel: "Type d’objet",
    options: [
      { id: "furniture", label: "Meuble" },
      { id: "decor", label: "Déco" },
      { id: "lighting", label: "Luminaire" },
      { id: "appliance", label: "Électroménager" },
      { id: "plant", label: "Plante" },
      { id: "artwork", label: "Œuvre d’art" },
    ],
  },
  {
    id: "virtual_renovation",
    label: "Rénovation virtuelle",
    shortLabel: "Rénovation",
    complexity: "complex",
    units: 2,
    description: "Change les matériaux, les sols, les murs, la cuisine, la salle de bains ou l’ensemble du look.",
    supportsStyles: true,
    supportsMask: true,
    promptPlaceholder: "ex. remplacez le sol par du parquet en chêne, conservez l’agencement de la cuisine",
    optionsLabel: "Ce qu’il faut changer",
    options: [
      { id: "floors", label: "Sols" },
      { id: "walls", label: "Murs" },
      { id: "kitchen", label: "Cuisine" },
      { id: "bathroom", label: "Salle de bains" },
      { id: "lighting", label: "Éclairage" },
      { id: "materials", label: "Matériaux" },
      { id: "full-look", label: "Look complet" },
    ],
  },
  {
    id: "room_redesign",
    label: "Redesign de pièce",
    shortLabel: "Redesign",
    complexity: "complex",
    units: 2,
    description: "Change le style, l’ambiance et l’identité visuelle d’une pièce existante.",
    supportsStyles: true,
    supportsMask: true,
    promptPlaceholder: "ex. style scandinave clair, conservez l’orientation et les fenêtres",
    optionsLabel: "Type de pièce",
    options: [
      { id: "living-room", label: "Salon" },
      { id: "bedroom", label: "Chambre" },
      { id: "kitchen", label: "Cuisine" },
      { id: "dining-room", label: "Salle à manger" },
      { id: "office", label: "Bureau" },
      { id: "terrace", label: "Terrasse/extérieur" },
      { id: "other", label: "Autre" },
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
export const OBJECT_EDIT_ACTIVE_ENGINE_IDS: AiImageEngineId[] = [
  "nano_banana_pro",
  "gpt_image_15",
];

export type AiCreditTier = {
  minCredits: number;
  centsPerCredit: number;
};

export const AI_CREDIT_TIERS: AiCreditTier[] = [
  { minCredits: 100, centsPerCredit: 38 },
  { minCredits: 50, centsPerCredit: 40 },
  { minCredits: 25, centsPerCredit: 45 },
  { minCredits: 1, centsPerCredit: 50 },
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

// Server picks the engine on each generation: paid (root) goes to Nano
// Banana Pro for quality, the included free retry falls back to Nano
// Banana (Flash) to cap cost. Single source of truth — no client input.
export function pickEngineForBilling(isFreeRetry: boolean): AiImageEngine {
  return isFreeRetry
    ? getAiImageEngine("nano_banana")
    : getAiImageEngine("nano_banana_pro");
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
  unitsPerCredit = AI_CREDIT_UNITS_PER_CREDIT,
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
    units: quantity * unitsPerCredit,
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

export function formatCreditsFromUnits(
  units: number,
  unitsPerCredit = AI_CREDIT_UNITS_PER_CREDIT,
): string {
  const credits = units / unitsPerCredit;
  if (credits === 1) return "1 crédit";
  return credits % 1 === 0
    ? `${credits.toFixed(0)} crédits`
    : `${credits.toFixed(1)} crédits`;
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
