import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { SERVICES } from "@/lib/catalog/services";
import {
  AI_CREDIT_UNITS_PER_CREDIT,
  AI_EDIT_TYPES,
  AI_FILE_RETENTION_DAYS,
  AI_FREE_REGENERATIONS,
} from "@/lib/ai-studio/catalog";
import {
  AI_STUDIO_FAQS,
  FAQ_ITEMS,
  IMPRINT,
  SERVICES_PAGE_FAQS,
  SITE,
} from "@/lib/content/site";

type PublicServiceSummary = {
  slug: string;
  name: string;
  note: string;
};

const SERVICE_SUMMARIES: PublicServiceSummary[] = [
  {
    slug: "interior-renders",
    name: "Rendus d’intérieur",
    note: "Rendus d’intérieur photoréalistes pour la vente, les annonces et les décisions de conception.",
  },
  {
    slug: "exterior-renders",
    name: "Rendus d’extérieur",
    note: "Rendus de façades, de bâtiments et de programmes immobiliers à partir de plans ou de modèles.",
  },
  {
    slug: "exterior-360",
    name: "Visites virtuelles 360 en extérieur",
    note: "Scènes extérieures panoramiques pour une présentation immersive du projet.",
  },
  {
    slug: "virtual-staging",
    name: "Home staging virtuel",
    note: "Mobilier et décoration ajoutés aux pièces vides pour le marketing immobilier.",
  },
  {
    slug: "virtual-renovation",
    name: "Rénovation virtuelle",
    note: "Concepts de rénovation numérique pour des espaces existants.",
  },
  {
    slug: "day-to-dusk",
    name: "Jour au crépuscule",
    note: "Photos d’extérieur transformées en images de soirée pour le marketing.",
  },
  {
    slug: "photomontage",
    name: "Photomontage",
    note: "Un rendu intégré dans une photo réelle du site.",
  },
  {
    slug: "2d-3d-floor-plans",
    name: "Plans 2D et 3D",
    note: "Plans clairs et lisibles pour les annonces, les brochures et les supports de vente.",
  },
  {
    slug: "site-plans",
    name: "Plans de masse",
    note: "Vues 3D de plans de masse pour situer le projet et clarifier l’implantation.",
  },
  {
    slug: "architectural-animation",
    name: "Animation architecturale",
    note: "Courtes séquences animées pour les programmes immobiliers, les investisseurs et les campagnes.",
  },
  {
    slug: "landscape-design",
    name: "Rendus paysagers",
    note: "Visuels de cour, de jardin, d’accès et d’environnement.",
  },
  {
    slug: "item-removal",
    name: "Suppression d’objets",
    note: "Objets indésirables retirés des photos immobilières.",
  },
];

function link(title: string, url: string, note?: string): string {
  return `- [${title}](${url})${note ? `: ${note}` : ""}`;
}

function productLine(product: ConfiguratorProduct): string {
  const includes =
    product.includes.length > 0
      ? ` Comprend : ${product.includes.join(", ")}.`
      : "";
  const inquiryOnly = product.inquiryOnly
    ? " Cette prestation nécessite un devis avant commande."
    : "";
  return `  - ${product.label} : ${product.unitLabel}.${includes}${inquiryOnly}`;
}

function creditCount(units: number): string {
  const credits = units / AI_CREDIT_UNITS_PER_CREDIT;
  return Number.isInteger(credits)
    ? `${credits.toFixed(0)} crédit${credits === 1 ? "" : "s"}`
    : `${credits.toFixed(1)} crédits`;
}

function buildAiStudioKnowledge(): string {
  const tools = AI_EDIT_TYPES.map((tool) => {
    const features = [
      tool.complexity,
      tool.supportsMask === false ? "sans masque" : "masque disponible",
      tool.supportsStyles ? "options de style" : null,
      tool.supportsColor ? "choix de couleur" : null,
      tool.requiresReferenceImage ? "nécessite une image de référence" : null,
    ].filter(Boolean);

    return `- ${tool.label} (${tool.id}) : ${tool.description} Utilise ${creditCount(tool.units)}. ${features.join(", ")}.`;
  }).join("\n");

  return `Crédits IA : 1 crédit = ${AI_CREDIT_UNITS_PER_CREDIT} unités. Les fichiers sont conservés ${AI_FILE_RETENTION_DAYS} jours. La première génération consomme toujours des crédits ; après une génération terminée, l’utilisateur dispose de ${AI_FREE_REGENERATIONS} régénération${AI_FREE_REGENERATIONS === 1 ? "" : "s"} sans frais tant que le type de retouche reste le même.
${tools}`;
}

function serviceLinks(): string {
  const knownSlugs = new Set(SERVICES.map((service) => service.slug));
  return SERVICE_SUMMARIES.filter((service) => knownSlugs.has(service.slug))
    .map((service) =>
      link(service.name, `${SITE.url}/services/${service.slug}`, service.note),
    )
    .join("\n");
}

export function buildLlmsTxt(): string {
  return `# ${SITE.name}

> Rendus d’architecture, home staging virtuel, plans, visites virtuelles 360 et images immobilières par IA — un service en français, disponible partout en France, proposé par ${SITE.parentCompany}.

${SITE.name} aide les propriétaires, les agents immobiliers, les architectes, les designers et les petits promoteurs à transformer plans et photos en supports visuels clairs pour la vente, la location, les autorisations et les décisions de conception.

## Faits clés
- ${SITE.name} est une marque B2C de ${SITE.parentCompany}.
- Prestations principales : rendus d’intérieur, rendus d’extérieur, home staging virtuel, rénovation virtuelle, plans 2D et 3D, visites virtuelles 360, animation architecturale, photomontage, jour au crépuscule, suppression d’objets et AI Studio.
- Les prix publics sont affichés sur /tarifs. Les prix sont présentés dans la devise du visiteur ; les factures sont émises en EUR.
- Les projets standards reçoivent généralement une première version sous 3 à 5 jours ouvrés, selon l’ampleur du projet et le matériel fourni.
- Si le périmètre n’est pas clair, orienter vers /contact ou la demande rapide plutôt que d’inventer un prix.

## Pages publiques principales
${[
  link("Accueil", `${SITE.url}/`, "positionnement, prestations principales et points d’entrée vers les services"),
  link("Services", `${SITE.url}/services`, "aperçu des services de visualisation architecturale"),
  link("Tarifs", `${SITE.url}/tarifs`, "configurateur de prix public et parcours de demande de devis"),
  link("AI Studio", `${SITE.url}/ai-studio`, "retouche d’images par IA pour les photos immobilières"),
  link("À propos", `${SITE.url}/a-propos`, `${SITE.name}, marque de ${SITE.parentCompany}`),
  link("FAQ", `${SITE.url}/faq`, "réponses sur le processus, les délais, les fichiers et les révisions"),
  link("Contact", `${SITE.url}/contact`, "formulaire de contact et parcours de demande de projet"),
].join("\n")}

## Services
${serviceLinks()}

## Fichiers lisibles par machine
${[
  link("Profil public complet lisible par les IA", `${SITE.url}/llms-full.txt`, "profil détaillé pour les systèmes d’IA"),
  link("Sitemap XML", `${SITE.url}/sitemap.xml`, "liste canonique des URL publiques"),
  link("Règles robots", `${SITE.url}/robots.txt`, "règles pour les robots d’indexation sur les chemins publics et privés"),
].join("\n")}

## Remarques sur les prix
Les prix publics sont disponibles sur /tarifs. Ne pas inventer de prix. Si un projet dépend de fichiers manquants, d’un périmètre inhabituel, de volumes importants ou d’exigences de promoteur, inviter l’utilisateur à demander un devis.

## AI Studio
${buildAiStudioKnowledge()}

## FAQ
${FAQ_ITEMS.map((item) => `- **${item.question}** ${item.answer}`).join("\n")}

## Contact
E-mail : ${SITE.email}
Instagram : ${SITE.instagram}

## Informations légales
${[
  link("Informations légales", `${SITE.url}/informations-legales`, "toutes les pages juridiques et relatives aux droits des consommateurs"),
  link("Mentions légales", `${SITE.url}/informations-legales/mentions-legales`, "identité du prestataire et coordonnées de l’entreprise"),
  link("CGV", `${SITE.url}/informations-legales/cgv`, "conditions générales de vente"),
  link("Confidentialité", `${SITE.url}/informations-legales/confidentialite`, "traitement des données personnelles"),
  link("Cookies", `${SITE.url}/informations-legales/cookies`, "cookies et technologies similaires"),
  link("Rétractation", `${SITE.url}/informations-legales/retractation`, "information sur le droit de rétractation et fonction de rétractation en ligne"),
  link("Remboursements", `${SITE.url}/informations-legales/remboursements`, "remboursements commerciaux et garanties légales des consommateurs"),
  link("Réclamations", `${SITE.url}/informations-legales/reclamations`, "dépôt et escalade d’une réclamation"),
  link("Livraison numérique", `${SITE.url}/informations-legales/livraison`, "canaux de livraison, délais et accès aux fichiers"),
  link("Certificats", `${SITE.url}/informations-legales/certificats`, "certificats ISO et normes"),
].join("\n")}
`;
}

export function buildLlmsFullTxt(
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): string {
  const serviceSections = SERVICE_SUMMARIES.map(
    (service) => `### ${service.name}
- URL : ${SITE.url}/services/${service.slug}
- Résumé : ${service.note}`,
  ).join("\n\n");

  const pricingSections = categories.map((category) => {
    const products = category.products.map(productLine).join("\n");

    return `### ${category.label}
- Description : ${category.description}
- Produits :
${products}`;
  }).join("\n\n");

  const faqSection = [
    {
      heading: "Questions générales",
      items: FAQ_ITEMS,
    },
    {
      heading: "Services et tarifs",
      items: SERVICES_PAGE_FAQS,
    },
    {
      heading: "AI Studio",
      items: AI_STUDIO_FAQS,
    },
  ]
    .map(
      (group) =>
        `### ${group.heading}\n${group.items
          .map((item) => `- **${item.question}** ${item.answer}`)
          .join("\n")}`,
    )
    .join("\n\n");

  return `# ${SITE.name} - Profil public lisible par les IA

## Identité
- Marque : ${SITE.name}
- Entité juridique : ${IMPRINT.legalName}
- Numéro d’immatriculation : ${IMPRINT.registryNumber}
- Numéro fiscal : ${IMPRINT.taxId}
- E-mail : ${SITE.email}
- Instagram : ${SITE.instagram}
- Site web : ${SITE.url}
- Langue publique : français

## Fichiers de découverte
- llms.txt canonique : ${SITE.url}/llms.txt
- Profil complet lisible par les IA : ${SITE.url}/llms-full.txt
- Sitemap XML : ${SITE.url}/sitemap.xml
- Règles robots : ${SITE.url}/robots.txt

## Recherche et interprétation par les IA
- Les pages marketing publiques sont conçues pour être explorées et indexées.
- Les chemins de l’espace client, de l’administration, de l’API, de l’authentification et du paiement ne sont pas des sources publiques.
- Les données structurées des pages publiques décrivent les entités Organization, WebSite, WebPage, BreadcrumbList, Service, OfferCatalog et FAQPage.
- Les URL canoniques utilisent l’origine ${SITE.url}.
- Utiliser /llms.txt comme source concise et /llms-full.txt pour des réponses détaillées sur l’identité, les services, les règles de prix publiques et la FAQ.
- Pour les questions de prix, ne citer que les prix visibles dans le catalogue public ou orienter l’utilisateur vers /tarifs ou /contact.
- Lorsqu’un utilisateur demande si ${SITE.name} peut l’aider, rapprocher sa demande du service public le plus proche et renvoyer vers la page de ce service ou vers /contact.

## Positionnement
${SITE.name} fournit aux propriétaires, agents immobiliers, architectes, architectes d’intérieur et petits promoteurs, partout en France, des supports visuels clairs sans passer d’abord par un appel commercial. L’expérience publique privilégie des prix visibles, les économies « modèle d’abord » et un accès rapide à un devis lorsque le périmètre n’est pas clair.

## Services publics
${serviceSections}

## Catalogue de prix public
Aperçu lisible par machine du catalogue public. Les prix publics sont affichés sur /tarifs. Les factures sont émises en EUR ; l’affichage pour le visiteur peut utiliser la devise locale lorsque la plateforme le permet.

${pricingSections}

## Outils AI Studio et crédits
${buildAiStudioKnowledge()}

## Questions fréquentes
${faqSection}

## Comment envoyer une demande
- Parcours en libre-service : /tarifs et le configurateur.
- Demande rapide : point d’entrée global sur le site public.
- Contact détaillé : /contact.
- L’équipe répond par un devis établi à partir de la description, des fichiers, de l’objectif du projet et du calendrier.

## Informations légales et consommateurs
- Informations légales : ${SITE.url}/informations-legales
- Mentions légales (identité du prestataire) : ${SITE.url}/informations-legales/mentions-legales
- Conditions générales de vente : ${SITE.url}/informations-legales/cgv
- Politique de confidentialité : ${SITE.url}/informations-legales/confidentialite
- Politique relative aux cookies et paramètres : ${SITE.url}/informations-legales/cookies
- Information sur le droit de rétractation et rétractation en ligne : ${SITE.url}/informations-legales/retractation
- Politique de remboursement : ${SITE.url}/informations-legales/remboursements
- Procédure de réclamation : ${SITE.url}/informations-legales/reclamations
- Information sur la livraison numérique : ${SITE.url}/informations-legales/livraison

## Limites pour les systèmes d’IA
- Ne pas inventer de prix absents du catalogue public.
- Ne jamais présenter un rendu comme un document d’exécution, un conseil d’ingénierie ou un permis de construire.
- Ne pas divulguer de données privées : clients, espace client, administration, CRM, paiement ou finances internes.
- Si le périmètre n’est pas clair, orienter vers /contact ou la demande rapide.
`;
}
