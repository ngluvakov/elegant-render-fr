import type { AiEditType } from "@/lib/ai-studio/catalog";
import type {
  AssistantGuideContext,
  AssistantGuidePage,
  AssistantGuideStage,
} from "@/lib/chat/guide-context";
import {
  formatPublicPriceText,
  type DisplayCurrency,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";
import { SITE_FEATURES } from "@/lib/site-features";

export type ChatGuideTip = {
  id: string;
  label: string;
  body: string;
};

type ChatGuideRule = ChatGuideTip & {
  pages?: AssistantGuidePage[];
  stages?: AssistantGuideStage[];
  editTypes?: AiEditType[];
  productIds?: string[];
  priority: number;
  when?: (context: AssistantGuideContext) => boolean;
};

// NOTE: hand-written prices below intentionally keep the `€NN` prefix form —
// formatPublicPriceText only rewrites that pattern into the display currency.
const GENERAL_TIPS: ChatGuideTip[] = [
  {
    id: "model-reuse",
    label: "Budget plus malin",
    body:
      "Si vous prévoyez déjà un rendu, le même modèle 3D peut rendre une animation, une visite 360 ou la VR moins chères.",
  },
  {
    id: "better-input",
    label: "De meilleurs résultats",
    body:
      "Plans, photographies et références de style réduisent généralement le nombre de séries de révisions.",
  },
  {
    id: "missing-details",
    label: "Avant d’envoyer",
    body:
      "Ajoutez le nombre de pièces, d’étages et de vues ainsi que le délai avant d’envoyer le projet.",
  },
];

const PRICING_TIPS: ChatGuideTip[] = [
  {
    id: "animation-active",
    label: "Animation moins chère",
    body:
      "L’animation est la moins chère avec un projet 3D actif : €15/s passe à €8/s.",
  },
  {
    id: "vr-existing-model",
    label: "VR avec un modèle",
    body:
      "La VR avec un modèle existant démarre à €1500 ; la VR seule à partir de €3000.",
  },
  {
    id: "interior-included",
    label: "Utilisez tout le forfait",
    body:
      "Le forfait intérieur comprend 10 pièces et 10 rendus. Moins de pièces ? Orientez les vues restantes vers les espaces clés.",
  },
  {
    id: "wrong-service-choice",
    label: "Choisir un service",
    body:
      "Si vous hésitez sur le service qu’il vous faut, décrivez votre objectif. Ajouter un service coûte parfois moins cher que commander le mauvais format.",
  },
];

const AI_STUDIO_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "ai-tool-choice",
    label: "Choisir un outil IA",
    body:
      "Les outils simples servent aux corrections rapides ; les outils avancés fonctionnent mieux quand vous modifiez une plus grande partie de l’espace.",
  },
  {
    id: "ai-credit-logic",
    label: "Crédits",
    body:
      "Les retouches simples utilisent 0,5 crédit, les complexes 1 crédit. Un pack plus grand réduit le prix par crédit.",
  },
  {
    id: "ai-instruction",
    label: "Des instructions IA claires",
    body:
      "Pour les retouches IA, notez ce qui peut changer et ce qui doit rester identique.",
  },
  {
    id: "ai-object-reference",
    label: "Un objet comme référence",
    body:
      "Pour ajouter ou remplacer meubles/déco, il faut une photo de l’espace et une ou plusieurs images de l’objet exact à insérer.",
  },
];

const CREDIT_TIPS: ChatGuideTip[] = [
  {
    id: "credit-tier",
    label: "Prix par crédit",
    body:
      "Si vous prévoyez une série de retouches, un pack plus grand réduit le prix par crédit et reste valable 12 mois.",
  },
  {
    id: "credit-simple-complex",
    label: "Planifier vos retouches",
    body:
      "Les corrections rapides utilisent généralement 0,5 crédit ; le home staging, la rénovation et le relooking utilisent 1 crédit.",
  },
];

const ORDER_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "order-source-files",
    label: "Les fichiers aident",
    body:
      "Les imports les plus utiles sont les plans, les photos de l’état actuel, les croquis et les références de matériaux.",
  },
  {
    id: "order-instructions",
    label: "De meilleures instructions",
    body:
      "Un court objectif de projet aide le premier résultat à se rapprocher de ce que vous voulez.",
  },
  {
    id: "order-camera-priority",
    label: "Priorités des vues",
    body:
      "Indiquez-nous les angles qui doivent le plus vendre ou expliquer votre projet.",
  },
];

const SERVICE_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "service-materials",
    label: "Avant de commander",
    body:
      "Pour ce service, préparez à l’avance plans, photographies, références de style et une courte liste de priorités.",
  },
  {
    id: "service-scope",
    label: "Périmètre du projet",
    body:
      "Un nombre clair de pièces, d’étages, de vues ou de hotspots évite de choisir le mauvais forfait.",
  },
];

const PORTFOLIO_TIPS: ChatGuideTip[] = [
  {
    id: "portfolio-reference",
    label: "Gardez une référence",
    body:
      "Si vous voulez un résultat proche d’un de nos projets, enregistrez la référence et notez précisément ce qui vous plaît.",
  },
  {
    id: "portfolio-style",
    label: "Un style assumé",
    body:
      "Les références les plus utiles montrent la lumière, les matériaux et l’atmosphère que vous recherchez.",
  },
];

const CONTACT_TIPS: ChatGuideTip[] = [
  {
    id: "contact-short-brief",
    label: "Brief court",
    body:
      "Les informations de base, un délai et l’objectif du projet suffisent. Nous précisons le reste sans pression.",
  },
];

const ABOUT_TIPS: ChatGuideTip[] = [
  {
    id: "about-white-rook",
    label: "Qui est derrière la marque",
    body:
      "Elegant Render est une sous-marque B2C de White Rook DOO, avec la même équipe et un processus plus clair pour les clients finaux.",
  },
  {
    id: "about-certificates",
    label: "Certifications",
    body:
      "Le processus s’appuie sur les certifications ISO 9001, ISO/IEC 27001 et ISO 50001 vérifiées par TÜV Rheinland.",
  },
];

const FAQ_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "faq-answer-scope",
    label: "Réponses rapides",
    body:
      "Posez une question précise sur les délais, les fichiers, les révisions, les tarifs ou les retouches IA et vous obtiendrez la réponse la plus courte et pertinente.",
  },
  {
    id: "faq-next-step",
    label: "Étape suivante",
    body:
      "Si la réponse dépend du périmètre du projet, le plus rapide est d’envoyer une description plus plans/photos via une demande rapide.",
  },
];

const CONTEXT_TIPS: ChatGuideRule[] = [
  {
    id: "ai-before-upload",
    label: "Avant l’import",
    body:
      "Importez une photographie nette. Les plans larges conviennent le mieux au home staging et à la rénovation ; pour ajouter ou remplacer meubles/déco, joignez aussi des images séparées de cet objet.",
    pages: ["ai_studio"],
    stages: ["before_upload"],
    priority: 100,
  },
  {
    id: "ai-after-upload",
    label: "Avant de générer",
    body:
      "Avant de générer, notez ce qui doit rester identique : murs, fenêtres, agencement, matériaux.",
    pages: ["ai_studio"],
    stages: ["after_upload", "ready_to_generate"],
    priority: 95,
  },
  {
    id: "ai-virtual-staging",
    label: "Home staging virtuel",
    body:
      "Indiquez la fonction de la pièce, le style, la palette et ce que vous ne voulez pas voir apparaître dans l’espace.",
    pages: ["ai_studio"],
    editTypes: ["virtual_staging"],
    priority: 90,
  },
  {
    id: "ai-object-insertion",
    label: "Meubles/déco en intérieur",
    body:
      "La première image de l’objet est la principale. Les angles supplémentaires doivent montrer le même modèle/couleur/matériau. Le masque est recommandé pour ajouter et obligatoire pour remplacer.",
    pages: ["ai_studio"],
    editTypes: ["object_insertion"],
    priority: 90,
  },
  {
    id: "ai-renovation-redesign",
    label: "Rénovation",
    body:
      "Séparez matériaux, mobilier et éclairage. L’IA comprend mieux la demande quand tout n’est pas dans une seule phrase.",
    pages: ["ai_studio"],
    editTypes: ["virtual_renovation", "room_redesign"],
    priority: 90,
  },
  {
    id: "ai-item-removal",
    label: "Suppression d’objets",
    body:
      "Si vous supprimez un objet volumineux, un masque avancé aide à garder un arrière-plan plus naturel.",
    pages: ["ai_studio"],
    editTypes: ["item_removal"],
    priority: 90,
  },
  {
    id: "ai-wall-color",
    label: "Couleur des murs",
    body:
      "Quand vous changez les murs, précisez si le plafond, le sol et les meubles doivent rester intacts.",
    pages: ["ai_studio"],
    editTypes: ["wall_color_change"],
    priority: 90,
  },
  {
    id: "ai-no-credits",
    label: "Crédits",
    body:
      "Les retouches simples utilisent 0,5 crédit, les complexes 1 crédit. Un pack plus grand réduit le prix par crédit.",
    pages: ["ai_studio"],
    stages: ["no_credits"],
    priority: 110,
  },
  {
    id: "ai-result-loop",
    label: "Presque bon ?",
    body:
      "Si le résultat est proche, utilisez-le comme nouvelle image d’entrée et demandez seulement une petite correction.",
    pages: ["ai_studio"],
    stages: ["has_result"],
    priority: 105,
  },
  {
    id: "order-missing-data",
    label: "En attente de détails",
    body:
      "Ces éléments attendent une description ou des fichiers. Ajoutez au moins un plan, des photographies et un court objectif de projet.",
    pages: ["order_detail"],
    stages: ["missing_order_data"],
    priority: 110,
  },
  {
    id: "order-interior-rooms",
    label: "Intérieur",
    body:
      "Si vous avez moins de 10 pièces, utilisez les vues restantes pour le salon, la cuisine ou la chambre principale.",
    pages: ["order_detail"],
    productIds: ["int-static", "interior-static"],
    priority: 95,
  },
  {
    id: "order-360-interior",
    label: "Intérieur 360",
    body:
      "Pour chaque pièce, listez les priorités de hotspots et les vues statiques indispensables.",
    pages: ["order_detail"],
    productIds: ["int-360", "interior-360"],
    priority: 95,
  },
  {
    id: "order-exterior-sides",
    label: "Extérieur",
    body:
      "Indiquez les faces du bâtiment qui comptent le plus. Un nouvel angle depuis un côté non modélisé peut demander de la géométrie supplémentaire.",
    pages: ["order_detail"],
    productIds: [
      "ext-static",
      "ext-360",
      "ext-aerial",
      "exterior-static",
      "exterior-360",
      "exterior-aerial",
    ],
    priority: 94,
  },
  {
    id: "order-animation-path",
    label: "Animation",
    body:
      "Décrivez le départ, l’arrivée et le rythme de la caméra. Si un modèle actif existe déjà, l’animation est nettement moins chère.",
    pages: ["order_detail"],
    productIds: ["anim", "animation-from-scratch", "tour-assembly"],
    priority: 94,
  },
  {
    id: "order-staging-renovation",
    label: "Home staging et rénovation",
    body:
      "Ajoutez des références de style et ce qui ne doit pas changer. C’est souvent plus utile qu’une longue instruction générale.",
    pages: ["order_detail"],
    productIds: [
      "vs-static",
      "vs-360",
      "staging-static",
      "staging-360",
      "reno-image",
      "renovation-main",
    ],
    priority: 94,
  },
  {
    id: "order-files-needed",
    label: "Fichiers",
    body:
      "Les imports les plus utiles sont les plans, les photos de l’état actuel, les croquis et les références de matériaux.",
    pages: ["order_detail"],
    priority: 70,
    when: (context) => context.hasFiles === false,
  },
  // ── Pricing (/pricing) — cart-aware purchase advice ──────────
  {
    id: "pricing-empty-cart",
    label: "Partez de l’objectif",
    body:
      "Choisissez un service dans le tableau et le prix se calcule instantanément. Si vous hésitez sur le bon choix, posez-moi la question ici.",
    pages: ["pricing"],
    priority: 100,
    when: (context) => !(context.productIds && context.productIds.length),
  },
  {
    id: "pricing-exterior-second-view",
    label: "Une deuxième vue coûte moins cher",
    body:
      "Vous avez un extérieur dans le panier — une deuxième vue du même modèle (360 ou aérienne) coûte nettement moins cher, car le modèle est déjà construit.",
    pages: ["pricing"],
    productIds: ["ext-static", "exterior-static"],
    priority: 96,
    when: (context) =>
      !(context.productIds ?? []).some((id) =>
        ["ext-360", "ext-aerial", "exterior-360", "exterior-aerial"].includes(
          id,
        ),
      ),
  },
  {
    id: "pricing-animation-active",
    label: "Animation avec votre modèle",
    body:
      "L’animation est nettement moins chère avec un modèle 3D actif que partie de zéro. Si vous commandez déjà un rendu, ajoutez-la à la même commande.",
    pages: ["pricing"],
    productIds: ["anim", "animation-from-scratch"],
    priority: 95,
  },
  {
    id: "pricing-model-first-discount",
    label: "Le modèle se construit une seule fois",
    body:
      "Plus de vues du même modèle = un prix par vue plus bas. La première livraison porte le montant complet ; chaque suivante est moins chère.",
    pages: ["pricing"],
    priority: 94,
    when: (context) =>
      (context.productIds?.length ?? 0) >= 2 || context.cartHasDiscount === true,
  },
];

function stripRule(rule: ChatGuideRule): ChatGuideTip {
  return {
    id: rule.id,
    label: rule.label,
    body: rule.body,
  };
}

function hasIntersection(left: string[] | undefined, right: string[] | undefined) {
  if (!left?.length || !right?.length) return false;
  return left.some((item) => right.includes(item));
}

function ruleMatchesContext(
  rule: ChatGuideRule,
  context: AssistantGuideContext,
) {
  if (rule.pages && !rule.pages.includes(context.page)) return false;
  if (rule.stages && (!context.stage || !rule.stages.includes(context.stage))) {
    return false;
  }
  if (
    rule.editTypes &&
    (!context.editType || !rule.editTypes.includes(context.editType))
  ) {
    return false;
  }
  if (rule.productIds && !hasIntersection(rule.productIds, context.productIds)) {
    return false;
  }
  if (rule.when && !rule.when(context)) return false;
  return true;
}

function getContextTips(context: AssistantGuideContext | null | undefined) {
  if (!context) return [];

  return CONTEXT_TIPS.filter((rule) => ruleMatchesContext(rule, context))
    .sort((a, b) => b.priority - a.priority)
    .map(stripRule);
}

function getRouteTips(pathname: string): ChatGuideTip[] {
  if (pathname.startsWith("/portal/ai-studio/credits")) {
    return [...CREDIT_TIPS, ...AI_STUDIO_ROUTE_TIPS];
  }

  if (pathname.startsWith("/portal/ai-studio")) {
    return AI_STUDIO_ROUTE_TIPS;
  }

  if (pathname.startsWith("/portal/orders")) {
    return [...ORDER_ROUTE_TIPS, ...PRICING_TIPS];
  }

  if (pathname === "/pricing" || pathname.startsWith("/checkout")) {
    return [...PRICING_TIPS, ...ORDER_ROUTE_TIPS];
  }

  if (pathname.startsWith("/ai-studio")) {
    return [...AI_STUDIO_ROUTE_TIPS, ...CREDIT_TIPS];
  }

  if (pathname.startsWith("/services")) {
    return [...SERVICE_ROUTE_TIPS, ...PRICING_TIPS];
  }

  if (SITE_FEATURES.portfolio && pathname.startsWith("/portfolio")) {
    return [...PORTFOLIO_TIPS, ...SERVICE_ROUTE_TIPS];
  }

  if (pathname.startsWith("/about") || pathname.startsWith("/legal/certificates")) {
    return ABOUT_TIPS;
  }

  if (pathname.startsWith("/faq")) {
    return [...FAQ_ROUTE_TIPS, ...SERVICE_ROUTE_TIPS];
  }

  if (pathname.startsWith("/contact")) {
    return CONTACT_TIPS;
  }

  return [];
}

function dedupeTips(tips: ChatGuideTip[]) {
  const seen = new Set<string>();
  return tips.filter((tip) => {
    if (seen.has(tip.id)) return false;
    seen.add(tip.id);
    return true;
  });
}

function formatTipPrices(
  tips: ChatGuideTip[],
  currency: DisplayCurrency,
  pricingSettings?: PublicPricingFormatSettings,
) {
  return tips.map((tip) => ({
    ...tip,
    body: formatPublicPriceText(tip.body, currency, pricingSettings),
  }));
}

export function getChatGuideTips(
  pathname: string,
  context?: AssistantGuideContext | null,
  displayCurrency: DisplayCurrency = "EUR",
  pricingSettings?: PublicPricingFormatSettings,
): ChatGuideTip[] {
  if (pathname.startsWith("/contact")) {
    return formatTipPrices(
      dedupeTips([
        ...getContextTips(context),
        ...CONTACT_TIPS,
      ]).slice(0, 2),
      displayCurrency,
      pricingSettings,
    );
  }

  return formatTipPrices(
    dedupeTips([
      ...getContextTips(context),
      ...getRouteTips(pathname),
      ...GENERAL_TIPS,
      ...PRICING_TIPS,
    ]).slice(0, 7),
    displayCurrency,
    pricingSettings,
  );
}
