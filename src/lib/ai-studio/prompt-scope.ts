import {
  AI_STYLE_OPTIONS,
  getAiEditType,
  type AiEditType,
} from "./catalog";

type PromptScopeInput = {
  editType: AiEditType;
  prompt: string;
  styleId?: string | null;
};

type TermGroup = {
  label: string;
  terms: string[];
};

const EXTRA_STYLE_TERMS: TermGroup[] = [
  { label: "Hamptons", terms: ["hamptons", "hampton", "hampton's"] },
  { label: "Japandi", terms: ["japandi"] },
  { label: "Mediteranski", terms: ["mediterranean", "mediteran", "mediteranski"] },
  { label: "Boho", terms: ["boho", "bohemian", "boemski"] },
  { label: "Minimalist", terms: ["minimalist", "minimalisticki"] },
  { label: "Rustic", terms: ["rustic", "rustikal"] },
];

const STYLE_TERMS: TermGroup[] = [
  ...AI_STYLE_OPTIONS.filter((style) => style.id !== "none").map((style) => ({
    label: style.label,
    terms: [
      style.id,
      style.label,
      style.label.replace(/\s+/g, "-"),
      style.label.replace(/\s+/g, " "),
      ...(style.id === "industrial-urban"
        ? ["industrial", "industrijski"]
        : []),
    ],
  })),
  ...EXTRA_STYLE_TERMS,
];

const SERVICE_SCOPE_TERMS: Record<AiEditType, TermGroup[]> = {
  item_removal: [
    {
      label: "virtuelno opremanje",
      terms: ["opremi", "opremanje", "furnish", "staging", "stage", "dodaj namestaj", "add furniture"],
    },
    {
      label: "renovacija/redizajn",
      terms: ["renovir", "renovate", "renovation", "redesign", "redizajn", "promeni stil", "change style"],
    },
    {
      label: "promena materijala",
      terms: ["replace floor", "promeni pod", "zameni pod", "new flooring", "nova kuhinja", "new kitchen"],
    },
  ],
  day_to_dusk: [
    {
      label: "opremanje/renovacija",
      terms: ["opremi", "furnish", "staging", "renovir", "renovate", "redesign", "redizajn", "dodaj namestaj"],
    },
  ],
  sky_replacement: [
    {
      label: "opremanje/renovacija",
      terms: ["opremi", "furnish", "staging", "renovir", "renovate", "redesign", "redizajn", "dodaj namestaj"],
    },
  ],
  wall_color_change: [
    {
      label: "opremanje/renovacija",
      terms: ["opremi", "furnish", "staging", "renovir", "renovate", "redesign", "redizajn", "dodaj namestaj"],
    },
  ],
  virtual_staging: [
    {
      label: "renovacija",
      terms: ["renovir", "renovate", "replace floor", "promeni pod", "rusenje", "sruši zid", "remove wall"],
    },
  ],
  object_insertion: [
    {
      label: "virtuelno opremanje cele prostorije",
      terms: ["opremi celu", "furnish the room", "stage the room", "staging cele", "dodaj sav namestaj"],
    },
    {
      label: "renovacija/redizajn",
      terms: ["renovir", "renovate", "renovation", "redesign", "redizajn", "promeni stil", "change style"],
    },
  ],
  virtual_renovation: [
    {
      label: "uklanjanje sitnih elemenata",
      terms: ["remove clutter only", "samo ukloni", "only remove", "ukloni samo"],
    },
  ],
  room_redesign: [
    {
      label: "uklanjanje sitnih elemenata",
      terms: ["remove clutter only", "samo ukloni", "only remove", "ukloni samo"],
    },
  ],
};

export function validateAiPromptScope({
  editType,
  prompt,
  styleId,
}: PromptScopeInput): string | null {
  const normalizedPrompt = normalize(prompt);
  if (!normalizedPrompt) return null;

  const edit = getAiEditType(editType);
  const styleConflict = findStyleConflict(normalizedPrompt, edit.supportsStyles, styleId);
  if (styleConflict) return styleConflict;

  for (const group of SERVICE_SCOPE_TERMS[editType]) {
    if (containsAny(normalizedPrompt, group.terms)) {
      return `Prompt traži ${group.label}, što nije deo izabrane usluge "${edit.label}". Izaberite odgovarajuću AI obradu ili uklonite taj deo prompta.`;
    }
  }

  return null;
}

function findStyleConflict(
  normalizedPrompt: string,
  supportsStyles: boolean | undefined,
  styleId?: string | null,
): string | null {
  if (supportsStyles && (!styleId || styleId === "none")) return null;

  const selected = styleId
    ? AI_STYLE_OPTIONS.find((style) => style.id === styleId)
    : null;

  for (const group of STYLE_TERMS) {
    if (!containsAny(normalizedPrompt, group.terms)) continue;
    const isSelected = Boolean(
      selected &&
        (selected.id === group.terms[0] ||
          normalize(selected.id) === normalize(group.label) ||
          normalize(selected.label) === normalize(group.label)),
    );

    if (supportsStyles && selected && selected.id !== "none" && isSelected) {
      continue;
    }

    const selectedLabel = selected?.label ?? "Bez stila";
    return `Prompt traži stil "${group.label}", ali izabrani stil je "${selectedLabel}". Stil se bira kroz kontrolu u AI Studiju; promenite stil tamo ili uklonite konflikt iz prompta.`;
  }

  return null;
}

function containsAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(normalize(term)));
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
