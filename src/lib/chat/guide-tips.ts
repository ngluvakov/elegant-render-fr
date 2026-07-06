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

const GENERAL_TIPS: ChatGuideTip[] = [
  {
    id: "model-reuse",
    label: "Smarter budget",
    body:
      "If you are already planning a render, the same 3D model can make an animation, 360 or VR cheaper.",
  },
  {
    id: "better-input",
    label: "Better results",
    body:
      "Floor plans, photographs and style references usually reduce the number of revision rounds.",
  },
  {
    id: "missing-details",
    label: "Before you submit",
    body:
      "Add the number of rooms, floors and views plus the deadline before you submit the project.",
  },
];

const PRICING_TIPS: ChatGuideTip[] = [
  {
    id: "animation-active",
    label: "Cheaper animation",
    body:
      "Animation is cheapest with an active 3D project: €15/sec drops to €8/sec.",
  },
  {
    id: "vr-existing-model",
    label: "VR with a model",
    body:
      "VR with an existing model starts at €1500; standalone VR from €3000.",
  },
  {
    id: "interior-included",
    label: "Use the full package",
    body:
      "The interior package includes 10 rooms and 10 renders. Fewer rooms? Point the remaining views at the key spaces.",
  },
  {
    id: "wrong-service-choice",
    label: "Choosing a service",
    body:
      "If you are not sure what you need, describe the goal. Sometimes adding a service is cheaper than ordering the wrong format.",
  },
];

const AI_STUDIO_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "ai-tool-choice",
    label: "Choosing an AI tool",
    body:
      "Simple tools are for quick corrections; advanced tools work better when you change a larger part of the space.",
  },
  {
    id: "ai-credit-logic",
    label: "Credits",
    body:
      "Simple edits use 0.5 credits, complex ones 1 credit. A larger pack lowers the price per credit.",
  },
  {
    id: "ai-instruction",
    label: "Clear AI instructions",
    body:
      "For AI edits, write down what may change and what must stay the same.",
  },
  {
    id: "ai-object-reference",
    label: "Item as reference",
    body:
      "To add or replace furniture/decor you need a photo of the space and one or more images of the exact item you are inserting.",
  },
];

const CREDIT_TIPS: ChatGuideTip[] = [
  {
    id: "credit-tier",
    label: "Price per credit",
    body:
      "If you plan a series of edits, a larger pack lowers the price per credit and stays valid for 12 months.",
  },
  {
    id: "credit-simple-complex",
    label: "Planning your edits",
    body:
      "Quick corrections usually use 0.5 credits, while staging, renovation and redesign use 1 credit.",
  },
];

const ORDER_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "order-source-files",
    label: "Files help",
    body:
      "The most useful uploads are floor plans, photos of the current state, sketches and material references.",
  },
  {
    id: "order-instructions",
    label: "Better instructions",
    body:
      "Adding a short project goal helps the first result land closer to what you want.",
  },
  {
    id: "order-camera-priority",
    label: "View priorities",
    body:
      "Tell us which angles you most want to sell or explain.",
  },
];

const SERVICE_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "service-materials",
    label: "Before ordering",
    body:
      "For this service, prepare floor plans, photographs, style references and a short list of priorities in advance.",
  },
  {
    id: "service-scope",
    label: "Project scope",
    body:
      "A clear number of rooms, floors, views or hotspots prevents choosing the wrong package.",
  },
];

const PORTFOLIO_TIPS: ChatGuideTip[] = [
  {
    id: "portfolio-reference",
    label: "Save a reference",
    body:
      "If you want a result similar to one of our projects, save the reference and note exactly what you like about it.",
  },
  {
    id: "portfolio-style",
    label: "Style is deliberate",
    body:
      "The most useful references show the light, materials and atmosphere you want.",
  },
];

const CONTACT_TIPS: ChatGuideTip[] = [
  {
    id: "contact-short-brief",
    label: "Short brief",
    body:
      "Basic details, a deadline and the project goal are enough. We can clarify the rest without pressure.",
  },
];

const ABOUT_TIPS: ChatGuideTip[] = [
  {
    id: "about-white-rook",
    label: "Who is behind the brand",
    body:
      "Elegant Render is a B2C sub-brand of White Rook DOO, with the same team and a clearer process for end customers.",
  },
  {
    id: "about-certificates",
    label: "Certifications",
    body:
      "The process relies on ISO 9001, ISO/IEC 27001 and ISO 50001 certifications verified by TUV Rheinland.",
  },
];

const FAQ_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "faq-answer-scope",
    label: "Quick answers",
    body:
      "Ask specifically about timing, materials, revisions, pricing or AI edits and you will get the shortest relevant answer.",
  },
  {
    id: "faq-next-step",
    label: "Next step",
    body:
      "If the answer depends on project scope, the fastest next step is a description plus floor plans/photos via a quick inquiry.",
  },
];

const CONTEXT_TIPS: ChatGuideRule[] = [
  {
    id: "ai-before-upload",
    label: "Before uploading",
    body:
      "Upload a clear photograph. Wide shots work best for staging and renovation; for adding or replacing furniture/decor, also include separate images of that item.",
    pages: ["ai_studio"],
    stages: ["before_upload"],
    priority: 100,
  },
  {
    id: "ai-after-upload",
    label: "Before generating",
    body:
      "Before generating, write down what must stay the same: walls, windows, layout, materials.",
    pages: ["ai_studio"],
    stages: ["after_upload", "ready_to_generate"],
    priority: 95,
  },
  {
    id: "ai-virtual-staging",
    label: "Virtual staging",
    body:
      "State the room's purpose, style, palette and anything you do not want to appear in the space.",
    pages: ["ai_studio"],
    editTypes: ["virtual_staging"],
    priority: 90,
  },
  {
    id: "ai-object-insertion",
    label: "Furniture/decor in interiors",
    body:
      "The first item image is the main one. Additional angles must show the same model/color/material. A mask is recommended for adding and required for replacing.",
    pages: ["ai_studio"],
    editTypes: ["object_insertion"],
    priority: 90,
  },
  {
    id: "ai-renovation-redesign",
    label: "Renovation",
    body:
      "Separate materials, furniture and lighting. AI understands the request better when it is not all in one sentence.",
    pages: ["ai_studio"],
    editTypes: ["virtual_renovation", "room_redesign"],
    priority: 90,
  },
  {
    id: "ai-item-removal",
    label: "Item removal",
    body:
      "If you are removing a larger item, an advanced mask helps keep the background more natural.",
    pages: ["ai_studio"],
    editTypes: ["item_removal"],
    priority: 90,
  },
  {
    id: "ai-wall-color",
    label: "Wall color",
    body:
      "When changing walls, note whether the ceiling, floor and furniture should stay untouched.",
    pages: ["ai_studio"],
    editTypes: ["wall_color_change"],
    priority: 90,
  },
  {
    id: "ai-no-credits",
    label: "Credits",
    body:
      "Simple edits use 0.5 credits, complex ones 1 credit. A larger pack lowers the price per credit.",
    pages: ["ai_studio"],
    stages: ["no_credits"],
    priority: 110,
  },
  {
    id: "ai-result-loop",
    label: "Almost there?",
    body:
      "If the result is close, use it as the new input image and ask only for a small correction.",
    pages: ["ai_studio"],
    stages: ["has_result"],
    priority: 105,
  },
  {
    id: "order-missing-data",
    label: "Waiting for details",
    body:
      "These items are waiting for a description or files. Add at least a floor plan, photographs and a short project goal.",
    pages: ["order_detail"],
    stages: ["missing_order_data"],
    priority: 110,
  },
  {
    id: "order-interior-rooms",
    label: "Interior",
    body:
      "If you have fewer than 10 rooms, use the remaining views for the living room, kitchen or master bedroom.",
    pages: ["order_detail"],
    productIds: ["int-static", "interior-static"],
    priority: 95,
  },
  {
    id: "order-360-interior",
    label: "360 interior",
    body:
      "For each room, list the hotspot priorities and the static views that must exist.",
    pages: ["order_detail"],
    productIds: ["int-360", "interior-360"],
    priority: 95,
  },
  {
    id: "order-exterior-sides",
    label: "Exterior",
    body:
      "Tell us which sides of the building matter most. A new angle from an unmodeled side may require additional geometry.",
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
      "Describe the start, end and pace of the camera. If an active model already exists, the animation is significantly cheaper.",
    pages: ["order_detail"],
    productIds: ["anim", "animation-from-scratch", "tour-assembly"],
    priority: 94,
  },
  {
    id: "order-staging-renovation",
    label: "Staging and renovation",
    body:
      "Add style references and what should not change. That is often more valuable than a long general instruction.",
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
    label: "Files",
    body:
      "The most useful uploads are floor plans, photos of the current state, sketches and material references.",
    pages: ["order_detail"],
    priority: 70,
    when: (context) => context.hasFiles === false,
  },
  // ── Pricing (/pricing) — cart-aware purchase advice ──────────
  {
    id: "pricing-empty-cart",
    label: "Start from the goal",
    body:
      "Pick a service from the table and the price is calculated instantly. If you are not sure what you need, ask me here.",
    pages: ["pricing"],
    priority: 100,
    when: (context) => !(context.productIds && context.productIds.length),
  },
  {
    id: "pricing-exterior-second-view",
    label: "A second view costs less",
    body:
      "You have an exterior in the cart — a second view from the same model (360 or aerial) costs significantly less because the model is already built.",
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
    label: "Animation with your model",
    body:
      "Animation is significantly cheaper with an active 3D model than from scratch. If you are already ordering a render, add it in the same order.",
    pages: ["pricing"],
    productIds: ["anim", "animation-from-scratch"],
    priority: 95,
  },
  {
    id: "pricing-model-first-discount",
    label: "The model is built once",
    body:
      "More views from the same model = a lower price per view. The first delivery carries the full amount; each following one is cheaper.",
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
