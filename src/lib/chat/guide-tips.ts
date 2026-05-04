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
    label: "Pametniji budžet",
    body:
      "Ako već planirate render, isti 3D model može pojeftiniti animaciju, 360 ili VR.",
  },
  {
    id: "better-input",
    label: "Bolji rezultat",
    body:
      "Osnove, fotografije i stil reference najčešće smanjuju broj revizija.",
  },
  {
    id: "missing-details",
    label: "Pre slanja",
    body:
      "Dodajte broj prostorija, spratova, kadrova i rok pre nego što pošaljete projekat.",
  },
];

const PRICING_TIPS: ChatGuideTip[] = [
  {
    id: "animation-active",
    label: "Animacija jeftinije",
    body:
      "Animacija je najpovoljnija uz aktivan 3D projekat: €15/sek pada na €8/sek.",
  },
  {
    id: "vr-existing-model",
    label: "VR sa modelom",
    body:
      "VR sa postojećim modelom kreće od €1500; samostalni VR od €3000.",
  },
  {
    id: "interior-included",
    label: "Iskoristite paket",
    body:
      "Enterijer uključuje 10 soba i 10 rendera. Manje soba? Preostale kadrove usmerite na ključne prostorije.",
  },
  {
    id: "wrong-service-choice",
    label: "Izbor usluge",
    body:
      "Ako niste sigurni šta vam treba, opišite cilj. Nekad je jeftinije dodati uslugu nego naručiti pogrešan format.",
  },
];

const AI_STUDIO_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "ai-tool-choice",
    label: "Izbor AI alata",
    body:
      "Simple alati su za brze korekcije; advanced alati su bolji kada menjate veći deo prostora.",
  },
  {
    id: "ai-credit-logic",
    label: "Krediti",
    body:
      "Jednostavne obrade troše 0.5 kredita, kompleksne 1 kredit. Veći paket spušta cenu po kreditu.",
  },
  {
    id: "ai-instruction",
    label: "Jasna AI instrukcija",
    body:
      "Kod AI obrade napišite šta sme da se menja, a šta mora da ostane isto.",
  },
];

const CREDIT_TIPS: ChatGuideTip[] = [
  {
    id: "credit-tier",
    label: "Cena po kreditu",
    body:
      "Ako planirate seriju obrada, veći paket smanjuje cenu po kreditu i važi 12 meseci.",
  },
  {
    id: "credit-simple-complex",
    label: "Planiranje obrade",
    body:
      "Brze korekcije obično troše 0.5 kredita, a staging, renovacija i redesign 1 kredit.",
  },
];

const ORDER_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "order-source-files",
    label: "Fajlovi pomažu",
    body:
      "Najkorisnije je poslati osnove, fotografije postojećeg stanja, skice i reference materijala.",
  },
  {
    id: "order-instructions",
    label: "Bolje instrukcije",
    body:
      "Dodavanje kratkog cilja projekta pomaže da prvi rezultat bude bliži onome što želite.",
  },
  {
    id: "order-camera-priority",
    label: "Prioritet kadrova",
    body:
      "Napišite koje uglove najviše želite da prodate ili objasnite.",
  },
];

const SERVICE_ROUTE_TIPS: ChatGuideTip[] = [
  {
    id: "service-materials",
    label: "Pre poručivanja",
    body:
      "Za ovu uslugu unapred spremite osnove, fotografije, reference stila i kratku listu prioriteta.",
  },
  {
    id: "service-scope",
    label: "Opseg projekta",
    body:
      "Jasan broj prostorija, spratova, kadrova ili hotspotova sprečava pogrešan izbor paketa.",
  },
];

const PORTFOLIO_TIPS: ChatGuideTip[] = [
  {
    id: "portfolio-reference",
    label: "Sačuvajte referencu",
    body:
      "Ako želite rezultat sličan nekom radu, sačuvajte referencu i napišite šta vam se tačno dopada.",
  },
  {
    id: "portfolio-style",
    label: "Stil nije slučajan",
    body:
      "Najkorisnije reference su one koje pokazuju svetlo, materijale i atmosferu koju želite.",
  },
];

const CONTACT_TIPS: ChatGuideTip[] = [
  {
    id: "contact-short-brief",
    label: "Kratak brief",
    body:
      "Dovoljni su osnovni podaci, rok i cilj projekta. Detalje možemo razjasniti bez pritiska.",
  },
];

const CONTEXT_TIPS: ChatGuideRule[] = [
  {
    id: "ai-before-upload",
    label: "Pre uploada",
    body:
      "Uploadujte jednu jasnu fotografiju. Za staging i renovaciju najbolji su široki kadrovi bez jakog motion blur-a.",
    pages: ["ai_studio"],
    stages: ["before_upload"],
    priority: 100,
  },
  {
    id: "ai-after-upload",
    label: "Pre generisanja",
    body:
      "Pre generisanja napišite šta mora da ostane isto: zidovi, prozori, raspored, materijali.",
    pages: ["ai_studio"],
    stages: ["after_upload", "ready_to_generate"],
    priority: 95,
  },
  {
    id: "ai-virtual-staging",
    label: "Virtual staging",
    body:
      "Navedite namenu sobe, stil, paletu i šta ne želite da se pojavi u prostoru.",
    pages: ["ai_studio"],
    editTypes: ["virtual_staging"],
    priority: 90,
  },
  {
    id: "ai-renovation-redesign",
    label: "Renovacija",
    body:
      "Odvojite materijale, nameštaj i osvetljenje. AI bolje razume zahtev kada nije sve u jednoj rečenici.",
    pages: ["ai_studio"],
    editTypes: ["virtual_renovation", "room_redesign"],
    priority: 90,
  },
  {
    id: "ai-item-removal",
    label: "Uklanjanje predmeta",
    body:
      "Ako uklanjate veći predmet, advanced maska pomaže da pozadina ostane prirodnija.",
    pages: ["ai_studio"],
    editTypes: ["item_removal"],
    priority: 90,
  },
  {
    id: "ai-wall-color",
    label: "Boja zidova",
    body:
      "Za promenu zidova napišite da li plafon, pod i nameštaj treba da ostanu netaknuti.",
    pages: ["ai_studio"],
    editTypes: ["wall_color_change"],
    priority: 90,
  },
  {
    id: "ai-no-credits",
    label: "Krediti",
    body:
      "Jednostavne obrade troše 0.5 kredita, kompleksne 1 kredit. Veći paket spušta cenu po kreditu.",
    pages: ["ai_studio"],
    stages: ["no_credits"],
    priority: 110,
  },
  {
    id: "ai-result-loop",
    label: "Blizu dobrog?",
    body:
      "Ako je rezultat blizu dobrog, koristite ga kao novu ulaznu sliku i tražite samo malu korekciju.",
    pages: ["ai_studio"],
    stages: ["has_result"],
    priority: 105,
  },
  {
    id: "order-missing-data",
    label: "Čekaju podatke",
    body:
      "Ove stavke čekaju opis ili fajlove. Dodajte bar osnovu, fotografije i kratak cilj projekta.",
    pages: ["order_detail"],
    stages: ["missing_order_data"],
    priority: 110,
  },
  {
    id: "order-interior-rooms",
    label: "Enterijer",
    body:
      "Ako imate manje od 10 soba, iskoristite preostale kadrove za dnevnu, kuhinju ili master spavaću.",
    pages: ["order_detail"],
    productIds: ["int-static", "interior-static"],
    priority: 95,
  },
  {
    id: "order-360-interior",
    label: "360 enterijer",
    body:
      "Za svaku sobu napišite hotspot prioritete i statične kadrove koji moraju postojati.",
    pages: ["order_detail"],
    productIds: ["int-360", "interior-360"],
    priority: 95,
  },
  {
    id: "order-exterior-sides",
    label: "Eksterijer",
    body:
      "Navedite koje strane objekta su najvažnije. Novi ugao sa nemodelovane strane može tražiti dodatnu geometriju.",
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
    label: "Animacija",
    body:
      "Opišite početak, kraj i tempo kamere. Ako već postoji aktivan model, animacija je znatno povoljnija.",
    pages: ["order_detail"],
    productIds: ["anim", "animation-from-scratch", "tour-assembly"],
    priority: 94,
  },
  {
    id: "order-staging-renovation",
    label: "Staging i renovacija",
    body:
      "Dodajte reference stila i šta ne treba menjati. To je često važnije od duge opšte instrukcije.",
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
    label: "Fajlovi",
    body:
      "Najkorisnije je poslati osnove, fotografije postojećeg stanja, skice i reference materijala.",
    pages: ["order_detail"],
    priority: 70,
    when: (context) => context.hasFiles === false,
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
  if (pathname.startsWith("/portal/ai-studio/krediti")) {
    return [...CREDIT_TIPS, ...AI_STUDIO_ROUTE_TIPS];
  }

  if (pathname.startsWith("/portal/ai-studio")) {
    return AI_STUDIO_ROUTE_TIPS;
  }

  if (pathname.startsWith("/portal/porudzbine")) {
    return [...ORDER_ROUTE_TIPS, ...PRICING_TIPS];
  }

  if (pathname === "/cene" || pathname.startsWith("/poruci")) {
    return [...PRICING_TIPS, ...ORDER_ROUTE_TIPS];
  }

  if (pathname.startsWith("/ai-studio")) {
    return [...AI_STUDIO_ROUTE_TIPS, ...CREDIT_TIPS];
  }

  if (pathname.startsWith("/usluge")) {
    return [...SERVICE_ROUTE_TIPS, ...PRICING_TIPS];
  }

  if (pathname.startsWith("/portfolio")) {
    return [...PORTFOLIO_TIPS, ...SERVICE_ROUTE_TIPS];
  }

  if (pathname.startsWith("/kontakt")) {
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
  displayCurrency: DisplayCurrency = "eur",
  pricingSettings?: PublicPricingFormatSettings,
): ChatGuideTip[] {
  if (pathname.startsWith("/kontakt")) {
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
