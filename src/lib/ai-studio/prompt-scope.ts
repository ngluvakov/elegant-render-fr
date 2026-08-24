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
  { label: "Méditerranéen", terms: ["mediterranean", "mediterraneen", "mediterranee"] },
  { label: "Boho", terms: ["boho", "bohemian", "boheme"] },
  { label: "Minimaliste", terms: ["minimalist", "minimaliste"] },
  { label: "Rustique", terms: ["rustic", "rustique"] },
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
        ? ["industrial", "industriel"]
        : []),
    ],
  })),
  ...EXTRA_STYLE_TERMS,
];

const SERVICE_SCOPE_TERMS: Record<AiEditType, TermGroup[]> = {
  item_removal: [
    {
      label: "du home staging virtuel",
      terms: ["meubler", "meublez", "furnish", "staging", "stage", "ajouter des meubles", "ajoutez des meubles", "add furniture"],
    },
    {
      label: "une rénovation/un redesign",
      terms: ["renov", "renovate", "renovation", "redesign", "changer le style", "changez le style", "change style"],
    },
    {
      label: "un changement de matériaux",
      terms: ["replace floor", "changer le sol", "changez le sol", "remplacer le sol", "remplacez le sol", "new flooring", "nouvelle cuisine", "new kitchen"],
    },
  ],
  day_to_dusk: [
    {
      label: "du home staging/de la rénovation",
      terms: ["meubler", "meublez", "furnish", "staging", "renov", "renovate", "redesign", "ajouter des meubles", "ajoutez des meubles", "add furniture"],
    },
  ],
  sky_replacement: [
    {
      label: "du home staging/de la rénovation",
      terms: ["meubler", "meublez", "furnish", "staging", "renov", "renovate", "redesign", "ajouter des meubles", "ajoutez des meubles", "add furniture"],
    },
  ],
  wall_color_change: [
    {
      label: "du home staging/de la rénovation",
      terms: ["meubler", "meublez", "furnish", "staging", "renov", "renovate", "redesign", "ajouter des meubles", "ajoutez des meubles", "add furniture"],
    },
  ],
  virtual_staging: [
    {
      label: "une rénovation",
      terms: ["renov", "renovate", "replace floor", "changer le sol", "changez le sol", "remplacer le sol", "remplacez le sol", "abattre le mur", "abattez le mur", "casser le mur", "demolir", "remove wall", "supprimer le mur", "supprimez le mur"],
    },
  ],
  object_insertion: [
    {
      label: "du home staging de toute la pièce",
      terms: ["meubler toute la piece", "meubler la piece entiere", "meublez toute la piece", "furnish the room", "stage the room", "ajouter tous les meubles", "ajoutez tous les meubles"],
    },
    {
      label: "une rénovation/un redesign",
      terms: ["renov", "renovate", "renovation", "redesign", "changer le style", "changez le style", "change style"],
    },
  ],
  virtual_renovation: [
    {
      label: "uniquement une suppression d’objets",
      terms: ["remove clutter only", "only remove", "supprime uniquement", "supprimez uniquement", "uniquement supprimer", "seulement supprimer", "juste supprimer"],
    },
  ],
  room_redesign: [
    {
      label: "uniquement une suppression d’objets",
      terms: ["remove clutter only", "only remove", "supprime uniquement", "supprimez uniquement", "uniquement supprimer", "seulement supprimer", "juste supprimer"],
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
      return `Le prompt demande ${group.label}, ce qui ne fait pas partie du service sélectionné « ${edit.label} ». Choisissez l’outil IA correspondant ou retirez cette partie du prompt.`;
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

    const selectedLabel = selected?.label ?? "Aucun style";
    return `Le prompt demande le style « ${group.label} », mais le style sélectionné est « ${selectedLabel} ». Le style se choisit via le contrôle dédié dans AI Studio ; changez-le à cet endroit ou retirez le conflit du prompt.`;
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
