/**
 * Blog content model - the single source of truth for the /blog section.
 *
 * Posts are authored as type-safe structured blocks (no markdown runtime
 * dependency): each post carries metadata plus a `body` array of blocks.
 * Paragraphs/headings/list items/table cells support a small inline syntax
 * rendered by `renderInline` in `blog-post-body.tsx`:
 *   **bold**, *italic* / _italic_, and [label](href) links.
 *
 * To publish a new post, add a `BlogPost` object to `BLOG_POSTS`. The
 * listing page, post pages, sitemap and JSON-LD all derive from this array.
 */
import { SITE } from "@/lib/content/site";
import { SEO, absoluteUrl, canonicalUrl } from "@/lib/seo";

export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string; lead?: boolean }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "cta"; label: string; href: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date (YYYY-MM-DD) the post was published. */
  date: string;
  /** ISO date of the last meaningful update, if different from `date`. */
  updated?: string;
  author: string;
  coverImage: string;
  coverAlt: string;
  /** Short labels shown as chips; also used to rank related posts. */
  tags: string[];
  /** Extra SEO keyword phrases (not shown), merged into page metadata. */
  keywords?: string[];
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "interior-3d-rendering-cost",
    title: "Combien coûte un rendu 3D d’intérieur ? Guide des prix 2026",
    excerpt:
      "Le prix d’un rendu 3D d’intérieur dépend de la complexité de l’espace, du nombre de vues et du délai. Un guide complet avec les prix et nos conseils.",
    date: "2026-04-07",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-static.webp",
    coverAlt:
      "Rendu 3D d’intérieur d’un séjour avec mobilier et lumière naturelle",
    tags: ["Tarifs", "Rendus 3D"],
    keywords: [
      "prix rendu 3D",
      "combien coûte un rendu 3D",
      "prix rendu intérieur",
      "tarifs visualisation 3D",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Le coût d’un rendu 3D d’intérieur est l’une des questions que l’on nous pose le plus souvent. Et c’est parfaitement compréhensible — lorsque vous préparez la vente ou la location d’un bien, les rendus 3D sont un investissement qui doit se rentabiliser.",
      },
      {
        type: "paragraph",
        text: "Dans ce guide, nous vous montrons **comment le prix se construit**, ce qui est inclus et comment obtenir le meilleur rapport qualité-prix.",
      },
      {
        type: "heading",
        level: 2,
        text: "Qu’est-ce qui influence le prix d’un rendu d’intérieur ?",
      },
      { type: "heading", level: 3, text: "1. La complexité de l’espace" },
      {
        type: "paragraph",
        text: "Le facteur de base est la **complexité architecturale**. Un espace avec de nombreuses cloisons, des plafonds en pente, des arches et des éléments particuliers demande plus de temps de modélisation. Une pièce rectangulaire simple au plafond plat est la plus abordable, tandis que les grands espaces ouverts combinant cuisine, salle à manger et séjour demandent plus de travail.",
      },
      { type: "heading", level: 3, text: "2. Le nombre de vues" },
      {
        type: "paragraph",
        text: "Chez la plupart des agences, **la première vue couvre la modélisation de l’ensemble de l’espace**. Chaque vue suivante est nettement moins chère, car le modèle existe déjà — il ne reste qu’à positionner une nouvelle caméra et à travailler la composition.",
      },
      { type: "heading", level: 3, text: "3. La qualité du staging" },
      {
        type: "paragraph",
        text: "Souhaitez-vous un mobilier basique ou un intérieur entièrement décoré ? Le **home staging virtuel** se décline en plusieurs niveaux :",
      },
      {
        type: "list",
        items: [
          "**Basique :** mobilier fonctionnel, matériaux simples",
          "**Standard :** mobilier assorti au style, décorations, plantes",
          "**Premium :** pièces de créateurs, éclairage travaillé, personnalisation",
        ],
      },
      { type: "heading", level: 3, text: "4. Le délai" },
      {
        type: "paragraph",
        text: "Les commandes urgentes (24–48 h) entraînent généralement un supplément pour traitement prioritaire.",
      },
      {
        type: "heading",
        level: 2,
        text: "Exemple de grille tarifaire Elegant Render",
      },
      {
        type: "paragraph",
        text: "Chez nous, **les prix sont clairs et connus à l’avance** — sans frais cachés :",
      },
      {
        type: "table",
        headers: ["Service", "Prix (à partir de)"],
        rows: [
          ["Intérieur — premier niveau (10 pièces, caméras illimitées)", "**170 €**"],
          ["Pièce meublée supplémentaire (même projet)", "**28 €**"],
          ["Angle de vue supplémentaire (même pièce)", "**10 €**"],
          ["Niveau supplémentaire (même style, 30 % moins cher)", "**120 €**"],
          ["Intérieur 360 — premier niveau (10 panoramas)", "**295 €**"],
        ],
      },
      {
        type: "paragraph",
        text: "**Important :** si un modèle complet existe déjà (par exemple issu d’un rendu extérieur), le rendu d’intérieur est jusqu’à 50 % moins cher.",
      },
      { type: "heading", level: 2, text: "Comment économiser sur les rendus 3D ?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Combinez intérieur + extérieur** — un modèle commun permet de grandes économies",
          "**Réservez plusieurs vues à la fois** — la première vue est la plus chère, chacune des suivantes l’est beaucoup moins",
          "**Choisissez les formules standard** — les formules prédéfinies sont plus abordables que les prestations entièrement sur mesure",
          "**Commandez hors saison** — en dehors des mois de pointe (printemps/automne), les délais sont plus courts",
        ],
      },
      { type: "heading", level: 2, text: "Est-ce que cela en vaut la peine ?" },
      {
        type: "paragraph",
        text: "Les études montrent que **les biens présentés avec des rendus 3D professionnels** obtiennent :",
      },
      {
        type: "list",
        items: [
          "**32 % de demandes en plus** de la part d’acheteurs potentiels",
          "**Une vente 2 à 3 semaines plus rapide** par rapport aux biens sans rendus",
          "**Un prix de vente plus élevé** — les acheteurs sont prêts à payer davantage pour un bien qu’ils ont vu sous son meilleur jour",
        ],
      },
      { type: "heading", level: 2, text: "Comment obtenir un devis ?" },
      { type: "paragraph", text: "Le processus est simple :" },
      {
        type: "list",
        ordered: true,
        items: [
          "Envoyez les informations de base sur l’espace (surface, nombre de pièces, niveaux)",
          "Choisissez la formule qui vous convient",
          "Fournissez les plans ou des images de référence",
          "Sous 7 à 14 jours, vous recevez des rendus photoréalistes finalisés",
        ],
      },
      {
        type: "cta",
        label: "Calculez le prix de votre projet",
        href: "/pricing",
      },
    ],
  },
  {
    slug: "virtual-vs-real-renovation",
    title: "Rénovation virtuelle ou rénovation réelle : laquelle est la plus rentable ?",
    excerpt:
      "Comparatif entre rénovation virtuelle et rénovation réelle — coût, délai, résultat. Quand la rénovation virtuelle est un meilleur choix que les travaux.",
    date: "2026-04-09",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtual-renovation.webp",
    coverAlt: "Comparaison avant/après d’un séjour rénové virtuellement",
    tags: ["Rénovation", "Vente immobilière"],
    keywords: [
      "rénovation virtuelle",
      "rénovation virtuelle d’appartement",
      "rénovation réelle ou virtuelle",
      "rénovation par IA",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Lorsque vous pensez à rénover un appartement ou une maison, la première image qui vient à l’esprit est celle d’une **rénovation réelle** — artisans, plaques de plâtre, peinture, revêtements de sol, poussière et dépenses. Il existe pourtant une autre option qui gagne du terrain depuis quelques années : la **rénovation virtuelle**.",
      },
      {
        type: "paragraph",
        text: "Dans cet article, nous comparons les deux approches — coût, délai, résultat et les situations dans lesquelles chacune est le bon choix.",
      },
      { type: "heading", level: 2, text: "Qu’est-ce que la rénovation virtuelle ?" },
      {
        type: "paragraph",
        text: "La rénovation virtuelle est une **transformation numérique d’un espace existant** au moyen de la modélisation 3D et du rendu photoréaliste. À partir de photographies de votre espace actuel, notre équipe en crée une nouvelle version — nous modifions les murs, les sols, le mobilier, les couleurs, les matériaux et même certains éléments architecturaux.",
      },
      {
        type: "paragraph",
        text: "La rénovation virtuelle **ne nécessite aucuns travaux**. Chaque modification se fait à l’écran, et le résultat est une image photoréaliste montrant à quoi ressemblerait l’espace après rénovation.",
      },
      {
        type: "heading",
        level: 2,
        text: "Comparatif : rénovation virtuelle vs rénovation réelle",
      },
      {
        type: "table",
        headers: ["Aspect", "Rénovation virtuelle", "Rénovation réelle"],
        rows: [
          ["**Coût**", "**66 € par vue**", "10 000–100 000 € et plus"],
          ["**Délai**", "3 à 7 jours", "2 à 6 mois"],
          ["**Poussière et bruit**", "❌ Aucun", "✅ Beaucoup"],
          ["**Résultat physique**", "Image photoréaliste", "Espace réel"],
          ["**Variantes multiples**", "Facile (il suffit de changer les matériaux)", "Coûteux et lent"],
          ["**Risque d’erreurs**", "Minime", "Élevé (malfaçons)"],
        ],
      },
      { type: "heading", level: 2, text: "Quand recourir à la rénovation virtuelle ?" },
      { type: "heading", level: 3, text: "1. La vente d’un bien immobilier" },
      {
        type: "paragraph",
        text: "C’est la **raison la plus fréquente** d’une rénovation virtuelle. Si vous vendez un appartement ou une maison à l’aspect vieillissant, les acheteurs peinent à en imaginer le potentiel. Une rénovation virtuelle leur montre **ce que l’espace pourrait devenir** — et cela les incite à proposer un prix plus élevé.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. Investisseurs et marchands de biens",
      },
      {
        type: "paragraph",
        text: "Si vous achetez un bien pour le rénover et le revendre, la rénovation virtuelle vous aide à :",
      },
      {
        type: "list",
        items: [
          "Tester **différents styles avant tous travaux**",
          "Montrer **le potentiel aux acheteurs et aux partenaires** avant d’investir de l’argent réel",
          "Créer du **support marketing** pour vendre avant la rénovation (pré-commercialisation)",
        ],
      },
      { type: "heading", level: 3, text: "3. Missions de conseil en architecture" },
      {
        type: "paragraph",
        text: "Les architectes et les architectes d’intérieur utilisent la rénovation virtuelle pour **montrer les possibilités à leurs clients** avant les décisions finales sur les matériaux et l’agencement.",
      },
      { type: "heading", level: 2, text: "Et quand la rénovation réelle est-elle incontournable ?" },
      {
        type: "list",
        items: [
          "Quand les **installations sont vétustes** (électricité, plomberie, chauffage)",
          "Quand la **distribution des pièces doit changer** (suppression de cloisons)",
          "Quand la **structure est atteinte** (humidité, fissures, fondations)",
          "Quand l’espace est **réellement occupé** (vous y emménagez)",
        ],
      },
      { type: "heading", level: 2, text: "Un exemple concret" },
      {
        type: "list",
        items: [
          "**Client :** vente d’un appartement dans un immeuble des années 1980",
          "**Problème :** les acheteurs ne perçoivent pas le potentiel à cause d’un mobilier et de couleurs datés",
          "**Solution :** rénovation virtuelle de 4 pièces — 8 vues",
          "**Coût :** 8 × 66 € = **528 €**",
          "**Délai de livraison :** 7 jours",
        ],
      },
      {
        type: "paragraph",
        text: "**Résultat :** l’appartement s’est vendu **15 % au-dessus du prix initial demandé** en 3 semaines.",
      },
      { type: "heading", level: 2, text: "Notre recommandation" },
      {
        type: "paragraph",
        text: "Dans la plupart des cas, **la meilleure approche est une combinaison des deux** — la rénovation virtuelle pour le marketing et la mise en valeur du potentiel, et la rénovation réelle uniquement pour les réparations fonctionnelles essentielles.",
      },
      {
        type: "paragraph",
        text: "Si vous hésitez sur ce qu’il vous faut, envoyez-nous des photos de l’espace et nous vous ferons une recommandation — sans aucun engagement.",
      },
      {
        type: "cta",
        label: "Calculez le prix d’une rénovation virtuelle",
        href: "/services/virtual-renovation",
      },
    ],
  },
  {
    slug: "how-to-get-a-3d-visualization-quote",
    title: "Comment obtenir un devis de visualisation 3D ? Guide rapide du processus",
    excerpt:
      "Tout ce qu’il faut savoir avant de commander un rendu 3D — comment préparer le brief, quelles informations fournir et combien de temps dure la production.",
    date: "2026-04-11",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/blog-3d-visualization-duplex.webp",
    coverAlt:
      "Plan 3D d’un appartement en duplex — vue photoréaliste de dessus avec mobilier et agencement des pièces",
    tags: ["Guide", "Rendus 3D"],
    keywords: [
      "devis visualisation 3D",
      "comment commander un rendu 3D",
      "brief de rendu",
      "processus de visualisation architecturale",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Commander une visualisation 3D peut sembler compliqué si vous n’avez jamais travaillé avec un studio de rendu professionnel. Dans ce guide, nous vous accompagnons tout au long du processus — de la première demande au rendu finalisé.",
      },
      { type: "heading", level: 2, text: "Étape 1 : envoyer une demande" },
      {
        type: "paragraph",
        text: "Tout commence par une simple demande. Vous pouvez l’envoyer via :",
      },
      {
        type: "list",
        items: [
          "Le **formulaire de contact** de notre site",
          "**E-mail** à info@elegantrender.fr",
          "Message direct sur **Instagram**",
        ],
      },
      {
        type: "paragraph",
        text: "À ce stade, nous n’avons pas besoin de plans détaillés — il suffit de connaître les **informations de base** :",
      },
      {
        type: "list",
        items: [
          "Type d’espace (intérieur / extérieur / paysage)",
          "Surface approximative",
          "Nombre de pièces / de vues souhaitées",
          "Délai de livraison",
          "Budget (facultatif)",
        ],
      },
      { type: "heading", level: 2, text: "Étape 2 : vous recevez un devis" },
      { type: "paragraph", text: "Sous **24 heures**, vous recevez :" },
      {
        type: "list",
        items: [
          "✅ **Un prix précis** (en euros, sans frais cachés)",
          "✅ **Un délai de livraison**",
          "✅ **Le détail de ce qui est inclus** (modélisation, texturage, rendu)",
          "✅ **Des pistes d’économie** (remises sur les vues supplémentaires, services combinés)",
        ],
      },
      {
        type: "paragraph",
        text: "Tous nos prix sont **transparents et connus à l’avance** — vous pouvez aussi les consulter directement sur la [page des tarifs](/pricing).",
      },
      { type: "heading", level: 2, text: "Étape 3 : préparer le brief" },
      {
        type: "paragraph",
        text: "Le brief est une description condensée du projet. Plus il est précis, plus le rendu sera proche de votre vision. Un bon brief contient :",
      },
      { type: "paragraph", text: "**Indispensable :**" },
      {
        type: "list",
        items: [
          "Les plans (ou un croquis de l’agencement des pièces)",
          "Des photos de référence d’un style qui vous plaît",
          "Les dimensions de l’espace",
        ],
      },
      { type: "paragraph", text: "**Un plus :**" },
      {
        type: "list",
        items: [
          "Une palette de couleurs ou des échantillons de matériaux",
          "Des photos du mobilier que vous souhaitez voir utilisé",
          "Des exemples « j’aime » et « je n’aime pas » (ce que vous adorez, et ce que vous n’aimez pas)",
        ],
      },
      {
        type: "quote",
        text: "**Conseil :** vous ne savez pas quel style choisir ? Aucun problème — notre équipe de design peut vous proposer quelques options en fonction du caractère de l’espace.",
      },
      { type: "heading", level: 2, text: "Étape 4 : la production" },
      {
        type: "paragraph",
        text: "Une fois le devis confirmé et les documents transmis, le processus démarre :",
      },
      {
        type: "table",
        headers: ["Phase", "Durée", "Description"],
        rows: [
          ["**Modélisation**", "2 à 5 jours", "Construction du modèle 3D de l’espace"],
          ["**Texturage**", "1 à 3 jours", "Application des matériaux et des couleurs"],
          ["**Staging**", "2 à 4 jours", "Mobilier, décoration, plantes"],
          ["**Éclairage**", "1 à 2 jours", "Lumière naturelle et artificielle"],
          ["**Rendu**", "1 à 3 jours", "Calcul de l’image finale"],
        ],
      },
      {
        type: "paragraph",
        text: "**Total :** 7 à 14 jours pour un projet standard.",
      },
      { type: "heading", level: 3, text: "Révisions" },
      {
        type: "paragraph",
        text: "Les **révisions** font partie du processus — des ajustements à partir de vos retours. Après la première version, vous pouvez demander des modifications sur :",
      },
      {
        type: "list",
        items: [
          "Les couleurs des murs et des sols",
          "La position de la caméra",
          "Le type de mobilier",
          "L’éclairage",
        ],
      },
      {
        type: "paragraph",
        text: "En général, **2 à 3 cycles de révision** suffisent pour un résultat parfait.",
      },
      { type: "heading", level: 2, text: "Étape 5 : la livraison" },
      {
        type: "paragraph",
        text: "Vous recevez les rendus finalisés en **haute résolution** (4K minimum), prêts pour :",
      },
      {
        type: "list",
        items: [
          "✅ La publication dans les annonces immobilières",
          "✅ L’impression (brochures, catalogues, panneaux d’affichage)",
          "✅ Les réseaux sociaux (Instagram, Facebook, LinkedIn)",
          "✅ Les présentations aux investisseurs et aux clients",
        ],
      },
      { type: "heading", level: 2, text: "Questions fréquentes" },
      {
        type: "paragraph",
        text: "**Combien coûte un rendu 3D ?** Le prix dépend de la complexité. Les rendus d’intérieur commencent à **170 €** pour une formule de 10 pièces. Consultez la [grille tarifaire complète](/pricing).",
      },
      {
        type: "paragraph",
        text: "**Et si je n’ai pas de plans ?** Aucun problème. Nous pouvons modéliser l’espace à partir de photographies et de dimensions approximatives.",
      },
      {
        type: "paragraph",
        text: "**Travaillez-vous le week-end ?** Oui, pour les projets urgents nous proposons un traitement prioritaire avec supplément.",
      },
      {
        type: "paragraph",
        text: "**Comment se passe le paiement ?** Le paiement s’effectue par carte ou PayPal. Pour les projets plus importants, un échéancier avec acompte peut être convenu.",
      },
      { type: "heading", level: 2, text: "Envoyez une demande et lançons le projet" },
      {
        type: "paragraph",
        text: "Le processus est simple, et nous sommes là pour vous accompagner à chaque étape — de l’idée au rendu photoréaliste finalisé.",
      },
      { type: "cta", label: "Envoyer un brief", href: "/contact" },
    ],
  },
  {
    slug: "ai-studio-real-estate-photo-editing",
    title: "AI Studio — comment l’intelligence artificielle retouche les photos immobilières",
    excerpt:
      "La retouche photo immobilière par IA est le moyen le plus rapide d’améliorer une annonce. Tout sur les outils AI Studio, les prix et l’effet sur les ventes.",
    date: "2026-04-14",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/ai-tool-virtual_staging-after.webp",
    coverAlt:
      "Photo immobilière retouchée par IA — avant et après le traitement AI Studio",
    tags: ["AI Studio", "Photographie immobilière"],
    keywords: [
      "retouche photo immobilière IA",
      "AI studio",
      "retouche photo intelligence artificielle",
      "retouche IA",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "La photographie est le premier contact de l’acheteur avec un bien. Les études montrent que **les annonces avec des photos professionnelles obtiennent jusqu’à 118 % de vues en plus**. Mais que faire si vous n’avez pas le budget pour un photographe professionnel, ou si vous devez faire retoucher un grand volume d’images dans un délai serré ?",
      },
      {
        type: "paragraph",
        text: "C’est là qu’intervient la **retouche photo immobilière par IA** — un outil qui a changé la façon dont les agences et les agents préparent leurs supports visuels.",
      },
      { type: "heading", level: 2, text: "Qu’est-ce qu’AI Studio ?" },
      {
        type: "paragraph",
        text: "AI Studio est notre système de **retouche et d’amélioration automatiques des photos immobilières**, propulsé par une intelligence artificielle avancée. Là où un travail classique sous Photoshop prend des heures, l’IA traite les images en **quelques minutes**.",
      },
      {
        type: "heading",
        level: 2,
        text: "Que peut faire l’IA avec une photo immobilière ?",
      },
      {
        type: "heading",
        level: 3,
        text: "1. ✅ Correction automatique des couleurs et de la lumière",
      },
      {
        type: "list",
        items: [
          "Corrige l’**exposition** — les pièces sombres s’éclaircissent et les fenêtres surexposées retrouvent du détail",
          "Équilibre la **balance des blancs** — les photos paraissent naturelles, sans dominante jaune ou bleue",
          "Améliore le **contraste et la saturation** — l’espace paraît plus accueillant, sans distorsion",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "2. ✅ Suppression des éléments indésirables",
      },
      {
        type: "list",
        items: [
          "Objets personnels (chaussettes au sol, produits ménagers, cosmétiques)",
          "Détails inesthétiques (câbles, rallonges, radiateurs)",
          "Taches sur les murs, rayures sur le mobilier",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "3. ✅ Remplacement du ciel sur les photos d’extérieur",
      },
      {
        type: "paragraph",
        text: "Un ciel gris et couvert **devient instantanément bleu et ensoleillé**. C’est l’un des traitements IA les plus demandés en photographie d’extérieur.",
      },
      { type: "heading", level: 3, text: "4. ✅ Traitement HDR" },
      {
        type: "paragraph",
        text: "Combine plusieurs expositions en une seule image parfaitement éclairée — vous voyez à la fois les détails de l’intérieur et la vue par la fenêtre.",
      },
      {
        type: "heading",
        level: 3,
        text: "5. ✅ Transformation jour au crépuscule",
      },
      {
        type: "paragraph",
        text: "Nous transformons des photos de jour en **scènes de crépuscule spectaculaires**, avec des fenêtres chaleureusement éclairées et un ciel de tombée du jour.",
      },
      { type: "heading", level: 2, text: "AI Studio vs retouche classique" },
      {
        type: "table",
        headers: ["Aspect", "AI Studio", "Retouche Photoshop classique"],
        rows: [
          ["**Prix**", "À partir de 10 € par image", "20–45 € par image"],
          ["**Temps de traitement**", "Quelques minutes", "1 à 3 heures par image"],
          [
            "**Régularité**",
            "Qualité identique sur toutes les images",
            "Dépend du retoucheur",
          ],
          ["**Traitement par lot (10+)**", "Lot automatique", "Manuel, image par image"],
          ["**Contrôle fin**", "Basique", "Contrôle total"],
        ],
      },
      { type: "heading", level: 2, text: "Qui utilise AI Studio ?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Les agents immobiliers** — qui publient 10 à 50 annonces par mois et ont besoin d’une retouche rapide et homogène",
          "**Les investisseurs** — qui vendent plusieurs biens en même temps",
          "**Les photographes** — qui utilisent l’IA comme point de départ avant leurs propres retouches",
          "**Les agences** — qui uniformisent l’identité visuelle de toutes leurs annonces",
        ],
      },
      { type: "heading", level: 2, text: "Un exemple concret" },
      {
        type: "list",
        items: [
          "**Client :** agence immobilière, 45 annonces par mois",
          "**Problème :** chaque annonce demande 5 à 8 photos, et la retouche manuelle coûte 25 € par image",
          "**Solution :** AI Studio + traitement jour au crépuscule",
        ],
      },
      {
        type: "paragraph",
        text: "**Avant AI Studio :** 45 annonces × 6 images × 25 € = **6 750 € par mois**, avec **180 heures** de retouche manuelle chaque mois.",
      },
      {
        type: "paragraph",
        text: "**Après AI Studio :** 45 annonces × 6 images × 10 € = **2 700 € par mois**, avec **15 heures** de contrôle par mois.",
      },
      {
        type: "paragraph",
        text: "**Économie : 60 % du budget et 92 % du temps.**",
      },
      { type: "heading", level: 2, text: "Comment commander une retouche AI Studio ?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Envoyez vos photos** via notre plateforme",
          "**Choisissez le traitement** (retouche de base, jour au crépuscule, suppression d’objets)",
          "**Recevez les images retouchées** sous 24 h (ou 48 h pour les commandes par lot)",
          "**Téléchargez-les** en haute résolution, prêtes à publier",
        ],
      },
      { type: "heading", level: 2, text: "Les limites de la retouche par IA" },
      {
        type: "paragraph",
        text: "Aussi puissante soit-elle, l’IA n’est pas la réponse à tout. Elle atteint ses limites sur :",
      },
      {
        type: "list",
        items: [
          "**Les suppressions complexes** — objets volumineux ou parties de l’espace à reconstruire",
          "**Les couleurs de marque précises** — quand une reproduction Pantone exacte est exigée",
          "**Les décisions créatives** — l’IA ne peut pas « inventer » un nouveau design pour l’espace",
        ],
      },
      {
        type: "paragraph",
        text: "Pour ces cas, nous proposons aussi la **retouche Photoshop classique**, réalisée par notre équipe de graphistes.",
      },
      { type: "cta", label: "Essayer AI Studio", href: "/ai-studio" },
    ],
  },
  {
    slug: "360-tours-in-real-estate-sales",
    title: "Les visites 360° dans la vente immobilière : pourquoi les acheteurs adorent la visite interactive",
    excerpt:
      "Les visites 360° et les visites virtuelles augmentent l’engagement des acheteurs de plus de 40 %. Comment elles fonctionnent, ce qu’elles coûtent et quand les utiliser.",
    date: "2026-04-16",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-360.webp",
    coverAlt: "Visite virtuelle 360° d’un intérieur — vue interactive de l’espace",
    tags: ["Visites 360°", "Vente immobilière"],
    keywords: [
      "visite 360° immobilier",
      "visite virtuelle",
      "visite 3D d’appartement",
      "visite immobilière interactive",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Imaginez qu’un acheteur puisse **parcourir un appartement** sans s’y rendre — inspecter chaque pièce, jeter un œil par la fenêtre, examiner le plafond et le sol, le tout depuis le confort de son propre salon.",
      },
      {
        type: "paragraph",
        text: "Ce n’est pas de la science-fiction. C’est une **visite 360°**, et elle devient la norme dans la vente immobilière partout dans le monde.",
      },
      { type: "heading", level: 2, text: "Qu’est-ce qu’une visite 360° ?" },
      {
        type: "paragraph",
        text: "Une visite 360° (aussi appelée visite virtuelle ou visite interactive) est un **ensemble de photographies ou de rendus panoramiques** reliés en une expérience interactive. D’un clic ou d’un geste, l’acheteur passe de pièce en pièce, tourne à 360 degrés et a la sensation d’**être réellement dans l’espace**.",
      },
      { type: "heading", level: 2, text: "Pourquoi les visites 360° fonctionnent-elles ?" },
      {
        type: "heading",
        level: 3,
        text: "1. Les acheteurs sont déjà habitués aux contenus interactifs",
      },
      {
        type: "paragraph",
        text: "Instagram Reels, TikTok, YouTube Shorts — le public a l’habitude de consommer des contenus visuels qui **répondent à ses gestes**. Une photo statique paraît terne face à une expérience interactive.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. Elles réduisent le nombre de visites physiques",
      },
      {
        type: "paragraph",
        text: "Un agent immobilier passe en moyenne **6 à 8 heures** en visites physiques par bien. Avec une visite 360°, seuls les **acheteurs sérieux** se déplacent — les autres se sont déjà filtrés d’eux-mêmes grâce à la visite virtuelle.",
      },
      { type: "heading", level: 3, text: "3. Elles augmentent l’engagement" },
      { type: "paragraph", text: "Les statistiques montrent que :" },
      {
        type: "list",
        items: [
          "**Les acheteurs passent 3 à 5 minutes** dans une visite 360° (contre 10 à 15 secondes sur une photo statique)",
          "**40 % d’acheteurs en plus** envoient une demande après avoir vu une visite 360°",
          "Les biens avec visite 360° **obtiennent 20 à 30 % de visites programmées en plus**",
        ],
      },
      { type: "heading", level: 2, text: "Quand utiliser une visite 360° ?" },
      { type: "heading", level: 3, text: "📍 Biens à vendre" },
      {
        type: "paragraph",
        text: "La visite 360° est **idéale pour tout bien prêt à la vente**. Elle est particulièrement efficace pour :",
      },
      {
        type: "list",
        items: [
          "**Les biens de prestige** — les acheteurs attendent une expérience premium",
          "**Les biens situés dans une autre ville** — les acheteurs ne peuvent pas venir facilement pour une visite physique",
          "**Les biens d’investissement** — une évaluation rapide du potentiel sans déplacement",
          "**Les appartements en cours de construction** — montrer le rendu final avant la livraison",
        ],
      },
      { type: "heading", level: 3, text: "📍 Biens à louer" },
      {
        type: "paragraph",
        text: "Les bailleurs utilisent les visites 360° pour **présélectionner les locataires** avant une visite physique.",
      },
      { type: "heading", level: 2, text: "Les types de visites 360° que nous proposons" },
      { type: "heading", level: 3, text: "Visite 360° statique" },
      {
        type: "paragraph",
        text: "Une combinaison de rendus 3D photoréalistes au format 360°. L’acheteur se déplace en cliquant sur des points (hotspots) dans l’espace.",
      },
      {
        type: "paragraph",
        text: "**Prix :** à partir de **295 € par niveau** (10 panoramas + 10 vues statiques + un plan).",
      },
      { type: "heading", level: 3, text: "Visite 360° interactive" },
      {
        type: "paragraph",
        text: "Une version plus avancée avec des éléments interactifs — ouvrir les portes, allumer la lumière, changer les matériaux.",
      },
      {
        type: "paragraph",
        text: "**Prix :** sur demande (réalisée via notre réseau de partenaires).",
      },
      {
        type: "heading",
        level: 2,
        text: "La différence entre 360° et rendus classiques",
      },
      {
        type: "table",
        headers: ["", "Rendu statique", "Rendu 360°"],
        rows: [
          ["**Interactivité**", "❌", "✅"],
          ["**Temps passé sur le contenu**", "10 à 15 secondes", "3 à 5 minutes"],
          ["**Vue d’ensemble pour l’acheteur**", "Une seule vue", "Tout l’espace"],
          ["**Visites physiques**", "100 % nécessaires", "40 % de moins"],
          ["**Prix**", "170 € (niveau)", "295 € (niveau)"],
        ],
      },
      { type: "heading", level: 2, text: "Comment une visite 360° est-elle créée ?" },
      {
        type: "heading",
        level: 3,
        text: "Si le bien existe (photographie) :",
      },
      {
        type: "paragraph",
        text: "Chaque pièce est photographiée avec une caméra 360° professionnelle, puis les panoramas sont assemblés en une visite interactive à l’aide d’un logiciel spécialisé.",
      },
      {
        type: "heading",
        level: 3,
        text: "Si le bien n’existe pas encore (rendu 3D) :",
      },
      {
        type: "paragraph",
        text: "Nous créons un modèle 3D complet de l’espace, plaçons les caméras aux points clés et calculons chaque panorama individuellement. Nous les relions ensuite en une visite interactive.",
      },
      { type: "heading", level: 2, text: "Bonnes pratiques pour les visites 360°" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Commencez à la porte d’entrée** — le point d’entrée naturel",
          "**Limitez la visite à 8–12 hotspots** — trop d’options désorientent l’acheteur",
          "**Ajoutez un plan** — l’acheteur voit où il se situe par rapport au reste de l’espace",
          "**Mettez en avant les points forts** — cuisine neuve, climatisation, la vue",
          "**Incluez un appel à l’action** — « Programmer une visite » à la fin du parcours",
        ],
      },
      { type: "heading", level: 2, text: "Exemple : la vente d’un immeuble résidentiel" },
      {
        type: "list",
        items: [
          "**Client :** investisseur, complexe résidentiel neuf",
          "**Besoin :** présenter 3 types d’appartements aux acheteurs potentiels avant la fin du chantier",
          "**Solution :** visites 360° pour chaque type d’appartement",
        ],
      },
      { type: "paragraph", text: "**Résultat :**" },
      {
        type: "list",
        items: [
          "**15 % des appartements vendus avant la fin du chantier** (pré-commercialisation)",
          "**Visites physiques réduites de 60 %**",
          "**Des acheteurs décidés plus vite** — 2 jours en moyenne au lieu de 2 semaines",
        ],
      },
      {
        type: "cta",
        label: "Calculez le prix d’une visite 360°",
        href: "/pricing",
      },
    ],
  },
  {
    slug: "how-to-choose-a-3d-visualization-studio",
    title: "Comment choisir le bon studio de visualisation 3D ? Guide du client",
    excerpt:
      "Comment choisir un studio de visualisation architecturale ? Comparer les portfolios, les prix, les délais et la qualité — tout ce qu’il faut savoir avant de commander un rendu 3D.",
    date: "2026-04-18",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-renders.webp",
    coverAlt:
      "Visualisation 3D d’intérieur de haute qualité — exemple de rendu d’un espace de vie",
    tags: ["Conseils", "Rendus 3D"],
    keywords: [
      "comment choisir un studio de visualisation 3D",
      "studio de visualisation architecturale",
      "rendu 3D de qualité",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Le choix du bon studio de visualisation 3D peut être déterminant pour la réussite de votre projet — que vous vendiez un bien, présentiez un concept à des investisseurs ou construisiez l’image d’un cabinet d’architecture. Un rendu de qualité n’est pas qu’une jolie image : il transmet une émotion, restitue fidèlement les matériaux et aide l’acheteur à se décider. Alors, comment savoir à qui confier la mission ?",
      },
      { type: "heading", level: 2, text: "Pourquoi le choix d’un studio n’est-il pas simple ?" },
      {
        type: "paragraph",
        text: "Le marché regorge de studios et d’artistes 3D indépendants proposant des services similaires — mais les résultats varient souvent de manière significative. Un rendu mal réalisé peut :",
      },
      {
        type: "list",
        items: [
          "**Rebuter les acheteurs potentiels** — matériaux irréalistes, mauvais éclairage",
          "**Ralentir la vente** — les acheteurs n’arrivent pas à se projeter dans l’espace",
          "**Nuire à votre réputation** — une présentation du projet de piètre qualité",
        ],
      },
      {
        type: "paragraph",
        text: "C’est pourquoi il est important de savoir quoi regarder au moment de choisir.",
      },
      { type: "heading", level: 2, text: "Les critères de choix essentiels" },
      { type: "heading", level: 3, text: "1. Le portfolio — la première étape, et la plus importante" },
      {
        type: "paragraph",
        text: "Un bon studio dispose d’un portfolio public avec des projets réels. Soyez attentif à :",
      },
      {
        type: "list",
        items: [
          "**La variété** — réalisent-ils des intérieurs, des extérieurs, des scènes de nuit, des visites 360° ?",
          "**La régularité** — tous les rendus sont-ils du même niveau, ou la qualité varie-t-elle ?",
          "**Des projets réels** — le portfolio montre-t-il des espaces *construits*, et pas seulement des concepts ?",
        ],
      },
      {
        type: "quote",
        text: "**Conseil :** si un studio n’a pas de portfolio, ou seulement des aperçus retouchés, c’est un signal d’alerte.",
      },
      { type: "heading", level: 3, text: "2. La communication et le processus" },
      { type: "paragraph", text: "Un studio professionnel suit un processus clair :" },
      {
        type: "list",
        items: [
          "**Des échanges préalables** avant le début du travail",
          "**Un formulaire de brief** avec toutes les informations nécessaires",
          "**Des itérations** — le nombre de révisions incluses dans le prix",
          "**Un délai de livraison** — réaliste et transparent",
        ],
      },
      {
        type: "paragraph",
        text: "Elegant Render, par exemple, propose des échanges gratuits avant la commande et suit un processus standardisé incluant 2 à 3 itérations de révision par rendu.",
      },
      { type: "heading", level: 3, text: "3. La technologie et les outils" },
      {
        type: "paragraph",
        text: "Un studio qui suit les évolutions du métier vous donnera probablement un meilleur résultat :",
      },
      {
        type: "table",
        headers: ["Technologie", "Pourquoi c’est important"],
        rows: [
          ["**Corona Render**", "Éclairage et matériaux photoréalistes"],
          ["**Retouche IA**", "Accélère la post-production (Elegant Render AI Studio)"],
          ["**Visites 360°**", "Présentation interactive pour les acheteurs"],
          ["**Home staging virtuel**", "Aide les acheteurs à imaginer un espace meublé"],
        ],
      },
      { type: "heading", level: 3, text: "4. Des prix transparents" },
      {
        type: "paragraph",
        text: "Évitez les prestataires qui cachent leurs prix. Les studios sérieux publient une grille tarifaire indicative :",
      },
      {
        type: "list",
        items: [
          "**Prix par rendu** — de 30 à 200 € selon la complexité",
          "**Prix par série de vues** — une remise à partir de 3 rendus",
          "**Services complémentaires** — home staging virtuel, visite 360°, retouche IA",
        ],
      },
      {
        type: "paragraph",
        text: "Elegant Render dispose d’une **grille tarifaire publique** — vous savez toujours ce que vous obtenez, et à quel prix.",
      },
      { type: "heading", level: 3, text: "5. Délais et flexibilité" },
      { type: "paragraph", text: "Vérifiez :" },
      {
        type: "list",
        items: [
          "Le délai de livraison standard (généralement 3 à 7 jours ouvrés)",
          "Une option express (si le temps presse)",
          "La possibilité de modifications et de révisions",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Les questions à poser avant de commander",
      },
      {
        type: "paragraph",
        text: "Avant de choisir un studio, posez ces 7 questions :",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Puis-je voir un **portfolio complet** avec des projets réels ?",
          "Quel **moteur de rendu** utilisez-vous ?",
          "Combien d’**itérations de révision** sont incluses ?",
          "Quel est le **délai de livraison** pour mon projet ?",
          "Proposez-vous le **home staging virtuel**, et à quel prix ?",
          "Proposez-vous la **retouche IA** de photos existantes ?",
          "Disposez-vous d’un **contrat** ou de documents commerciaux ?",
        ],
      },
      { type: "heading", level: 2, text: "Comparatif : freelance vs studio" },
      {
        type: "table",
        headers: ["Critère", "Freelance", "Studio (Elegant Render)"],
        rows: [
          ["Portfolio", "Souvent limité", "Public, varié"],
          ["Processus", "Variable", "Standardisé"],
          ["Prix", "Fluctuants", "Transparents"],
          ["Support", "Une seule personne", "Une équipe"],
          ["Délais", "Selon disponibilité", "Convenus et tenus"],
        ],
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "Choisir le bon studio de visualisation 3D est un investissement qui se rentabilise. Ne choisissez pas uniquement sur le prix — un rendu de qualité peut doubler l’intérêt pour votre bien ou votre projet.",
      },
      {
        type: "paragraph",
        text: "Si vous souhaitez parler de votre projet, contactez-nous pour un échange gratuit. Nous vous montrerons des exemples, vous expliquerons le processus et vous remettrons un devis sans engagement.",
      },
      {
        type: "cta",
        label: "Demander une consultation gratuite",
        href: "/contact",
      },
    ],
  },
  {
    slug: "real-estate-photography-best-practices",
    title: "Les bonnes pratiques pour photographier un bien immobilier avant la retouche 3D",
    excerpt:
      "Comment préparer des photos immobilières pour la retouche IA et la visualisation 3D ? Les conseils des professionnels sur la lumière, le cadrage et la résolution.",
    date: "2026-04-20",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-photomontage.webp",
    coverAlt: "Photo immobilière préparée pour la retouche 3D et la visualisation par IA",
    tags: ["Guide", "Photographie immobilière"],
    keywords: [
      "conseils photographie immobilière",
      "retouche photo immobilière IA",
      "préparer des photos pour la visualisation 3D",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Une bonne photo est le fondement de toute bonne visualisation 3D. Que vous utilisiez AI Studio pour retoucher des photos existantes ou commandiez un rendu 3D complet, **la qualité du matériau de départ influence directement le résultat final**.",
      },
      {
        type: "paragraph",
        text: "Dans ce guide, nous vous montrons comment prendre des photos qui donnent les meilleurs résultats en retouche.",
      },
      { type: "heading", level: 2, text: "Pourquoi la préparation compte-t-elle ?" },
      {
        type: "paragraph",
        text: "De mauvaises photos = un mauvais résultat, même avec les meilleurs outils d’IA. Les problèmes que nous rencontrons souvent :",
      },
      {
        type: "list",
        items: [
          "**Photos floues** — l’IA ne peut pas ajouter des détails qui n’existent pas",
          "**Mauvaise lumière** — trop d’ombres ou un ciel délavé",
          "**Mauvaise perspective** — des murs et des lignes qui penchent",
          "**Encombrement dans le cadre** — objets personnels, câbles, outils",
        ],
      },
      {
        type: "paragraph",
        text: "Une bonne photo source, c’est **moins de reprises et un meilleur résultat**.",
      },
      { type: "heading", level: 2, text: "5 règles clés pour la prise de vue" },
      { type: "heading", level: 3, text: "1. La lumière avant tout" },
      {
        type: "paragraph",
        text: "Photographiez le **matin ou en fin d’après-midi**, quand la lumière est douce et diffuse. Évitez le soleil de midi, qui crée des ombres dures.",
      },
      {
        type: "list",
        items: [
          "Privilégiez la **lumière naturelle** chaque fois que c’est possible",
          "Allumez **toutes les lumières de la pièce** pour une exposition équilibrée",
          "Évitez de pointer l’appareil directement vers une fenêtre",
        ],
      },
      { type: "heading", level: 3, text: "2. Un appareil stable = une photo nette" },
      {
        type: "paragraph",
        text: "Utilisez un **trépied** — c’est le seul moyen d’obtenir des photos parfaitement nettes. Sans lui, même les meilleurs appareils subissent des micro-mouvements qui provoquent du flou.",
      },
      {
        type: "list",
        items: [
          "ISO : 100–800 (le plus bas est le mieux)",
          "Vitesse d’obturation : au moins 1/60 (plus lente sur trépied)",
          "Ouverture : f/8–f/11 pour une netteté maximale",
        ],
      },
      { type: "heading", level: 3, text: "3. Une perspective correcte" },
      {
        type: "paragraph",
        text: "Tenez l’appareil **de niveau, horizontalement et verticalement**. Les photos aux lignes penchées demandent une correction supplémentaire sous Photoshop.",
      },
      {
        type: "list",
        items: [
          "Hauteur de l’appareil : environ 150 cm (hauteur des yeux)",
          "Angle : légèrement plongeant pour les intérieurs, frontal pour les façades",
          "Évitez les **objectifs ultra grand-angle**, qui créent de la distorsion",
        ],
      },
      { type: "heading", level: 3, text: "4. Retirez tout le superflu" },
      {
        type: "paragraph",
        text: "Avant de déclencher, retirez :",
      },
      {
        type: "list",
        items: [
          "Les objets personnels (brosses à dents, lunettes, papiers)",
          "Les câbles et les rallonges",
          "Les déchets et le désordre",
          "Les meubles dépareillés",
        ],
      },
      {
        type: "quote",
        text: "**Conseil :** faites ressembler la pièce à un showroom — propre, rangée, minimale.",
      },
      { type: "heading", level: 3, text: "5. Résolution et format" },
      {
        type: "paragraph",
        text: "Photographiez à la **résolution la plus élevée** que permet votre appareil.",
      },
      {
        type: "table",
        headers: ["Paramètre", "Recommandation"],
        rows: [
          ["Résolution", "Au moins 4000 px sur le grand côté"],
          ["Format", "JPEG (qualité 95 % ou plus)"],
          ["Couleurs", "sRGB ou AdobeRGB"],
          ["Batterie", "Deux batteries pleines"],
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Comment AI Studio traite-t-il vos photos ?",
      },
      {
        type: "paragraph",
        text: "Elegant Render AI Studio s’appuie sur des modèles d’IA avancés pour :",
      },
      {
        type: "list",
        items: [
          "**La suppression d’arrière-plan** — isolation automatique des objets",
          "**Le remplacement du ciel** — un ciel réaliste pour les extérieurs",
          "**L’amélioration de la lumière** — équilibrage de l’exposition",
          "**La suppression d’objets** — effacement des éléments indésirables",
        ],
      },
      {
        type: "paragraph",
        text: "Meilleure est la photo source, plus la retouche IA sera rapide et naturelle.",
      },
      { type: "heading", level: 2, text: "Les erreurs fréquentes et comment les éviter" },
      {
        type: "table",
        headers: ["Erreur", "Correction"],
        rows: [
          ["Zoom trop serré", "Utilisez un objectif 24–35 mm"],
          ["Ombres bouchées", "Ajoutez une lumière d’appoint"],
          ["Meubles coupés", "Cadrez plus large, recadrez ensuite"],
          ["Tons jaunes", "Réglez la balance des blancs (mode lumière du jour)"],
        ],
      },
      { type: "heading", level: 2, text: "Un exemple de bonne photo" },
      {
        type: "paragraph",
        text: "Une bonne photo à retoucher doit être :",
      },
      {
        type: "list",
        items: [
          "Nette et stable",
          "Éclairée de manière homogène",
          "Sans distorsion",
          "Prise dans un espace rangé",
          "En haute résolution",
        ],
      },
      {
        type: "paragraph",
        text: "Si vous avez besoin d’une retouche professionnelle, Elegant Render AI Studio peut transformer même des photos moyennes en supports de vente. Envoyez-nous vos photos à retoucher.",
      },
      {
        type: "cta",
        label: "Envoyer des photos à retoucher",
        href: "/ai-studio",
      },
    ],
  },
  {
    slug: "why-developers-use-3d-visualization-before-construction",
    title: "Pourquoi les promoteurs immobiliers utilisent-ils la visualisation 3D avant la construction ?",
    excerpt:
      "Comment les visualisations 3D avant construction aident les promoteurs à vendre plus vite, à réduire les risques et à obtenir des financements — avec des exemples concrets et des statistiques.",
    date: "2026-04-22",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-aerial.webp",
    coverAlt: "Visualisation 3D aérienne d’un immeuble résidentiel, avant construction",
    tags: ["Tendances", "Vente immobilière"],
    keywords: [
      "visualisation 3D avant construction",
      "vente immobilière sur plan (VEFA)",
      "visualisation architecturale pour promoteurs",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Le marché immobilier change. Les acheteurs n’achètent plus seulement des mètres carrés — ils achètent une **vision, un style et un mode de vie**. Pour les promoteurs qui commercialisent leurs projets avant construction — la vente sur plan, en VEFA —, la visualisation 3D est devenue un outil incontournable.",
      },
      {
        type: "paragraph",
        text: "Dans cet article, nous expliquons pourquoi de plus en plus d’investisseurs et de promoteurs misent sur des visualisations 3D de qualité avant même la pose de la première brique.",
      },
      { type: "heading", level: 2, text: "Les avantages de la visualisation 3D en pré-commercialisation" },
      { type: "heading", level: 3, text: "1. Vendre plus vite sans bâtiment achevé" },
      {
        type: "paragraph",
        text: "Les études montrent que les biens présentés à l’aide de visualisations 3D photoréalistes connaissent **un cycle de vente jusqu’à 40 % plus rapide** en phase de pré-construction. Les acheteurs se décident plus facilement lorsqu’ils peuvent **voir** à quoi ressemblera leur futur logement.",
      },
      { type: "heading", level: 3, text: "2. Moins de risques, moins de modifications" },
      {
        type: "paragraph",
        text: "Détecter un problème au stade de la visualisation coûte **50 à 100 fois moins cher** que des modifications sur le chantier. Les promoteurs peuvent :",
      },
      {
        type: "list",
        items: [
          "Tester différentes variantes de façades et de matériaux",
          "Ajuster la distribution des pièces avant la construction",
          "Vérifier visuellement que le projet est fidèle à la marque",
        ],
      },
      { type: "heading", level: 3, text: "3. Une campagne marketing plus forte" },
      { type: "paragraph", text: "Un site web avec des visualisations 3D obtient :" },
      {
        type: "list",
        items: [
          "**94 % de vues en plus** qu’une page sans contenu visuel",
          "En moyenne **2,5 minutes de temps passé en plus** sur la page",
          "Un **taux de conversion supérieur de 32 %** (demandes et réservations)",
        ],
      },
      { type: "heading", level: 3, text: "4. Un financement facilité" },
      {
        type: "paragraph",
        text: "Les banques et les investisseurs approuvent plus volontiers les projets présentés visuellement. Des visualisations 3D professionnelles témoignent du sérieux et de la préparation du promoteur.",
      },
      { type: "heading", level: 2, text: "Comment les promoteurs utilisent-ils les visualisations 3D ?" },
      {
        type: "table",
        headers: ["Usage", "Description", "Impact"],
        rows: [
          ["**Site de commercialisation**", "Aperçus photoréalistes du projet", "Plus de trafic"],
          ["**Brochures et catalogues**", "Supports professionnels pour les acheteurs", "Plus de confiance"],
          ["**Réseaux sociaux**", "Rendus pour Instagram et Facebook", "Portée virale"],
          [
            "**Présentations aux investisseurs**",
            "Visualisations pour les partenaires et les banques",
            "Validation plus rapide",
          ],
          ["**Visites virtuelles 360°**", "Un parcours interactif du projet", "2 fois plus de demandes"],
        ],
      },
      { type: "heading", level: 2, text: "Étude de cas : un exemple concret" },
      {
        type: "paragraph",
        text: "Un promoteur basé à Belgrade a utilisé des visualisations 3D pour vendre un ensemble résidentiel de 45 logements.",
      },
      {
        type: "list",
        items: [
          "**Sans visualisations 3D :** 12 réservations au cours des 3 premiers mois",
          "**Avec visualisations 3D :** 38 réservations au cours des 3 mois suivants",
          "**Progression :** 216 %",
        ],
      },
      {
        type: "paragraph",
        text: "L’investissement dans les visualisations a été rentabilisé 15 fois grâce à l’accélération des ventes.",
      },
      { type: "heading", level: 2, text: "Quels types de visualisation sont les plus efficaces ?" },
      { type: "heading", level: 3, text: "Intérieurs" },
      {
        type: "paragraph",
        text: "Montrer le séjour, la chambre et la cuisine est **le plus efficace pour la vente** — c’est là que les acheteurs se projettent le plus facilement.",
      },
      { type: "heading", level: 3, text: "Extérieurs et façades" },
      {
        type: "paragraph",
        text: "Les rendus de nuit avec un éclairage d’ambiance créent **un attrait émotionnel**.",
      },
      { type: "heading", level: 3, text: "Plan de masse et abords" },
      {
        type: "paragraph",
        text: "Montrer les espaces verts, le stationnement et les parties communes augmente la **valeur perçue du projet**.",
      },
      { type: "heading", level: 3, text: "Visites virtuelles 360°" },
      {
        type: "paragraph",
        text: "Elles laissent les acheteurs explorer l’espace par eux-mêmes — le format le plus efficace pour la **vente en ligne**.",
      },
      { type: "heading", level: 2, text: "Pourquoi Elegant Render ?" },
      {
        type: "paragraph",
        text: "Les promoteurs choisissent Elegant Render parce que nous offrons :",
      },
      {
        type: "list",
        items: [
          "**Des visualisations photoréalistes** produites avec le moteur Corona Render",
          "**Des délais courts** — généralement 3 à 7 jours ouvrés",
          "**Des prix transparents** — vous connaissez le coût à l’avance",
          "**Des visites 360°** pour une présentation interactive",
          "**AI Studio** pour la retouche rapide de photos existantes",
        ],
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "Les visualisations 3D sont aujourd’hui **la norme**, pas un luxe. Les promoteurs qui investissent dans des visualisations de qualité avant la construction vendent plus vite, réduisent les risques et instaurent la confiance avec les acheteurs.",
      },
      {
        type: "paragraph",
        text: "Vous aimeriez voir comment nous pouvons dynamiser la commercialisation de votre projet ? Contactez-nous pour un échange gratuit.",
      },
      {
        type: "cta",
        label: "Demander une consultation projet",
        href: "/contact",
      },
    ],
  },
  {
    slug: "virtual-staging-styles-2026",
    title: "Home staging virtuel : les styles d’intérieur les plus demandés en 2026",
    excerpt:
      "Quels sont les styles de home staging virtuel les plus populaires en 2026 ? Minimalisme, japandi, wabi-sabi — un tour des tendances avec des exemples pour la vente immobilière.",
    date: "2026-04-24",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtual-staging.webp",
    coverAlt: "Intérieur mis en scène virtuellement — un espace de vie meublé avec style",
    tags: ["Tendances", "Home staging virtuel"],
    keywords: [
      "styles de home staging virtuel",
      "styles d’intérieur 2026",
      "ameublement virtuel d’appartement",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Le home staging virtuel est le moyen le plus rapide de transformer un espace vide ou non meublé en logement de rêve. Mais quels styles séduisent le plus les acheteurs ? Quelles tendances dominent en 2026 ?",
      },
      {
        type: "paragraph",
        text: "Dans ce guide, nous analysons les styles de home staging virtuel les plus demandés et vous donnons des recommandations pour choisir le bon style pour votre bien.",
      },
      { type: "heading", level: 2, text: "Pourquoi le choix du style est-il important ?" },
      {
        type: "paragraph",
        text: "Le bon style de home staging virtuel peut :",
      },
      {
        type: "list",
        items: [
          "**Augmenter la valeur perçue** d’un bien de 10 à 20 %",
          "**Raccourcir le délai de vente** de 30 à 50 %",
          "**Attirer un groupe cible précis** d’acheteurs",
        ],
      },
      {
        type: "paragraph",
        text: "Le mauvais style, à l’inverse, peut rebuter les acheteurs ou donner à l’espace un air démodé.",
      },
      { type: "heading", level: 2, text: "Top 5 des styles pour 2026" },
      { type: "heading", level: 3, text: "1. Le minimalisme aux accents chaleureux" },
      {
        type: "paragraph",
        text: "Le minimalisme classique enrichi de bois, de textiles et de couleurs chaudes. C’est le **choix le plus sûr** — il plaît au public le plus large.",
      },
      {
        type: "table",
        headers: ["Caractéristiques", "Idéal pour"],
        rows: [
          ["Couleurs claires, lignes épurées", "Tous les âges"],
          ["Détails en bois", "Les familles"],
          ["Une palette neutre", "Les investisseurs"],
          ["Peu de meubles, beaucoup d’espace", "Les primo-accédants"],
        ],
      },
      { type: "heading", level: 3, text: "2. Le japandi" },
      {
        type: "paragraph",
        text: "La fusion du design japonais et scandinave — la **tendance qui progresse le plus vite** en 2026.",
      },
      {
        type: "list",
        items: [
          "Matériaux naturels (bambou, lin, pierre)",
          "Couleurs terreuses et pastels",
          "Un mobilier minimal mais fonctionnel",
          "L’accent mis sur le calme et l’équilibre",
        ],
      },
      {
        type: "paragraph",
        text: "**Idéal pour :** biens de prestige, appartements, résidences de vacances",
      },
      { type: "heading", level: 3, text: "3. Le wabi-sabi" },
      {
        type: "paragraph",
        text: "L’acceptation de l’imperfection — un style qui célèbre les matériaux naturels, les textures et la patine.",
      },
      {
        type: "list",
        items: [
          "Mobilier artisanal",
          "Surfaces irrégulières et textures naturelles",
          "Une atmosphère chaleureuse et apaisante",
          "Céramiques et matières tissées",
        ],
      },
      {
        type: "paragraph",
        text: "**Idéal pour :** maisons de campagne, corps de ferme, gîtes ruraux",
      },
      { type: "heading", level: 3, text: "4. Le classique moderne" },
      {
        type: "paragraph",
        text: "Des formes classiques avec des détails contemporains — le **style qui vend le mieux** pour les biens d’investissement.",
      },
      {
        type: "list",
        items: [
          "Canapés Chesterfield, tables d’appoint en marbre",
          "Détails dorés et laiton",
          "Une disposition symétrique du mobilier",
          "Une base neutre avec des pièces fortes",
        ],
      },
      {
        type: "paragraph",
        text: "**Idéal pour :** appartements en ville, programmes neufs, maisons familiales",
      },
      { type: "heading", level: 3, text: "5. Le design biophilique" },
      {
        type: "paragraph",
        text: "Un design inspiré de la nature — une tendance majeure de l’ère post-covid.",
      },
      {
        type: "table",
        headers: ["Élément", "Effet"],
        rows: [
          ["Plantes d’intérieur", "Réduisent le stress de 30 %"],
          ["Lumière naturelle", "Augmente la productivité"],
          ["Couleurs terreuses", "Créent un sentiment de sécurité"],
          ["Matériaux naturels", "Augmentent la valeur du bien"],
        ],
      },
      {
        type: "paragraph",
        text: "**Idéal pour :** immeubles avec terrasses, maisons avec jardin",
      },
      { type: "heading", level: 2, text: "Comment choisir le bon style ?" },
      { type: "heading", level: 3, text: "Facteur 1 : le groupe cible d’acheteurs" },
      {
        type: "table",
        headers: ["Groupe cible", "Style recommandé"],
        rows: [
          ["Jeunes couples", "Minimalisme"],
          ["Familles avec enfants", "Classique moderne"],
          ["Retraités", "Wabi-sabi"],
          ["Investisseurs", "Japandi"],
          ["Acheteurs haut de gamme", "Biophilique"],
        ],
      },
      { type: "heading", level: 3, text: "Facteur 2 : l’emplacement et le type de bien" },
      {
        type: "list",
        items: [
          "**Centre-ville :** classique moderne",
          "**Appartements neufs :** minimalisme",
          "**Maisons de vacances et corps de ferme :** wabi-sabi",
          "**Appartements de prestige :** japandi",
          "**Maisons familiales :** biophilique",
        ],
      },
      { type: "heading", level: 3, text: "Facteur 3 : le budget" },
      {
        type: "paragraph",
        text: "Le home staging virtuel est **jusqu’à 95 % moins cher** que l’ameublement physique. Là où le staging physique coûte 500 à 3 000 € par mois, plus le transport et le stockage, le home staging virtuel est un investissement unique de 30 à 150 € par rendu, sans frais de logistique.",
      },
      { type: "heading", level: 2, text: "Pourquoi le home staging virtuel ?" },
      {
        type: "table",
        headers: ["Comparaison", "Staging physique", "Home staging virtuel"],
        rows: [
          ["Coût", "500–3 000 € par mois", "30–150 € par vue"],
          ["Temps de mise en place", "2 à 7 jours", "2 à 3 jours ouvrés"],
          ["Flexibilité", "Un seul style", "Plusieurs styles pour le même espace"],
          ["Stockage", "Nécessaire", "Inutile"],
        ],
      },
      { type: "heading", level: 2, text: "Exemple : le même espace en 3 styles différents" },
      {
        type: "paragraph",
        text: "L’un des atouts du home staging virtuel est de pouvoir **présenter le même espace dans plusieurs styles**. Imaginez un séjour que vous pouvez proposer en version :",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Minimaliste** — pour les jeunes actifs",
          "**Classique moderne** — pour une famille",
          "**Biophilique** — pour les amoureux de la nature",
        ],
      },
      {
        type: "paragraph",
        text: "Chaque style attire un groupe cible différent — le tout à partir du même rendu de base.",
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "En 2026, le home staging virtuel n’est plus une simple option — c’est **la norme**. Que vous vendiez un appartement en centre-ville ou une maison à la campagne, le bon style peut faire pencher la décision de l’acheteur.",
      },
      {
        type: "paragraph",
        text: "Elegant Render propose le home staging virtuel dans tous les styles actuels. Envoyez-nous un plan et des photos — nous vous montrerons comment votre espace peut se présenter dans le style qui vend le mieux.",
      },
      {
        type: "cta",
        label: "Découvrir le home staging virtuel",
        href: "/services/virtual-staging",
      },
    ],
  },
  {
    slug: "how-to-prepare-cad-drawings-for-3d-visualization",
    title: "Comment préparer des plans CAO pour la visualisation 3D ? Guide pour les architectes",
    excerpt:
      "Comment préparer des fichiers CAO, Revit ou SketchUp pour la visualisation 3D ? Un guide complet pour les architectes — formats, conseils, niveau de détail et check-list.",
    date: "2026-04-26",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-renders.webp",
    coverAlt:
      "Rendu 3D extérieur photoréaliste d’une villa moderne avec piscine dans une lumière dorée",
    tags: ["Guide", "Rendus 3D"],
    keywords: [
      "préparer des plans CAO pour la 3D",
      "fichiers pour visualisation 3D",
      "plans d’architecte pour le rendu",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Une bonne visualisation 3D commence par de **bonnes données d’entrée**. En tant qu’architecte ou designer, vous jouez un rôle clé — la qualité des plans CAO que vous transmettez au studio influence directement la rapidité, le prix et la qualité du rendu final.",
      },
      {
        type: "paragraph",
        text: "Dans ce guide, nous expliquons comment préparer vos fichiers pour que l’artiste 3D dispose de tout ce dont il a besoin.",
      },
      { type: "heading", level: 2, text: "Pourquoi la préparation des fichiers est-elle importante ?" },
      {
        type: "paragraph",
        text: "Une documentation incomplète ou non standard entraîne :",
      },
      {
        type: "list",
        items: [
          "**Des itérations supplémentaires** — plus de temps et de coûts",
          "**Des erreurs d’interprétation** — le rendu ne correspond pas au projet",
          "**Des délais rallongés** — la documentation est réclamée après coup",
          "**Des prix plus élevés** — le studio facture le temps supplémentaire",
        ],
      },
      {
        type: "paragraph",
        text: "Une bonne préparation réduit les coûts de **20 à 40 %** et accélère le processus de **30 à 50 %**.",
      },
      { type: "heading", level: 2, text: "6 étapes pour une préparation parfaite" },
      { type: "heading", level: 3, text: "Étape 1 : choisir le bon format" },
      {
        type: "table",
        headers: ["Format", "Recommandation"],
        rows: [
          ["**DWG/DXF** (AutoCAD)", "✅ Le meilleur — toutes les cotes et tous les calques"],
          ["**RVT** (Revit)", "✅ Contient les données BIM"],
          ["**SKP** (SketchUp)", "✅ Si le modèle est détaillé"],
          ["**PDF**", "❌ Pour se repérer uniquement"],
          ["**Images (JPEG/PNG)**", "❌ Pas assez précises"],
        ],
      },
      {
        type: "paragraph",
        text: "**Recommandation :** le DWG est le standard universel pris en charge par tous les studios 3D.",
      },
      { type: "heading", level: 3, text: "Étape 2 : organiser les calques" },
      {
        type: "paragraph",
        text: "Des calques bien organisés sont la partie **la plus importante** de la préparation. Nous attendons :",
      },
      {
        type: "table",
        headers: ["Calque", "Contenu"],
        rows: [
          ["Murs (porteurs)", "Béton, parpaing, brique"],
          ["Murs (cloisons)", "Plaques de plâtre, verre"],
          ["Sols", "Niveaux, matériaux"],
          ["Plafonds", "Suspendus, plats"],
          ["Menuiseries", "Fenêtres, portes"],
          ["Mobilier", "Éléments fixes"],
          ["Réseaux", "Électricité, plomberie"],
          ["Cotes", "Lignes de cote"],
        ],
      },
      {
        type: "quote",
        text: "**Conseil :** nettoyez le plan des calques inutiles (trames, annotations, lignes de construction).",
      },
      { type: "heading", level: 3, text: "Étape 3 : définir les matériaux" },
      {
        type: "paragraph",
        text: "Indiquez les matériaux de chaque surface. Les méthodes les plus simples :",
      },
      {
        type: "list",
        items: [
          "**Dans le plan DWG :** notez le matériau sur chaque surface (p. ex. « parquet chêne », « carrelage céramique 60x60 »)",
          "**Dans un document séparé :** une liste Excel des pièces et des matériaux",
          "**Des références :** envoyez 1 à 3 images par matériau (une référence, pas une correspondance exacte)",
        ],
      },
      { type: "heading", level: 3, text: "Étape 4 : fournir des photos du site" },
      {
        type: "paragraph",
        text: "Si nous travaillons sur un bâtiment existant, envoyez des photos de :",
      },
      {
        type: "list",
        items: [
          "**Toutes les pièces** sous plusieurs angles",
          "**L’extérieur** du bâtiment",
          "**L’environnement** — les bâtiments voisins, la rue",
          "**Les détails** — profils de moulures, mains courantes, radiateurs",
        ],
      },
      {
        type: "paragraph",
        text: "Les photos aident l’artiste 3D à comprendre les **relations spatiales** et l’**état existant**.",
      },
      { type: "heading", level: 3, text: "Étape 5 : définir les angles de vue" },
      {
        type: "paragraph",
        text: "Précisez exactement quelles vues doivent être rendues :",
      },
      {
        type: "list",
        items: [
          "**Un plan avec repères de caméras** — angle et direction du regard",
          "**La hauteur de la caméra** — généralement 150 à 170 cm",
          "**Le type de plan** — large, moyen, détail",
        ],
      },
      { type: "paragraph", text: "Un exemple de bonne spécification :" },
      {
        type: "quote",
        text: "« Caméra 1 — séjour, plan large depuis l’angle de la porte d’entrée, hauteur 160 cm, montrant l’ensemble de l’espace »",
      },
      { type: "heading", level: 3, text: "Étape 6 : fournir un moodboard" },
      {
        type: "paragraph",
        text: "Un moodboard avec des références aide l’artiste 3D à saisir votre **vision** :",
      },
      {
        type: "list",
        items: [
          "3 à 5 images de référence du style souhaité",
          "Une palette de couleurs (vous pouvez utiliser Adobe Color ou Coolors)",
          "Des exemples d’éclairage (lumière du jour/artificielle/d’ambiance)",
        ],
      },
      { type: "heading", level: 2, text: "Check-list avant l’envoi des fichiers" },
      {
        type: "paragraph",
        text: "Avant de transmettre vos fichiers au studio, passez cette liste en revue :",
      },
      {
        type: "list",
        items: [
          "Les fichiers DWG sont nettoyés et organisés",
          "Tous les calques sont correctement nommés",
          "Les matériaux sont indiqués sur le plan",
          "Les images de référence des matériaux sont jointes",
          "Les angles de vue sont définis",
          "Un moodboard ou un guide de style est joint",
          "Des photos de l’état existant sont fournies (pour les réhabilitations)",
          "Le délai et les attentes sont clairement formulés",
        ],
      },
      { type: "heading", level: 2, text: "Les erreurs les plus fréquentes" },
      {
        type: "table",
        headers: ["Erreur", "Conséquence", "Comment l’éviter"],
        rows: [
          ["Trop de détails", "Chargement lent des fichiers", "Filtrez les calques"],
          ["Trop peu d’informations", "Erreurs d’interprétation", "Suivez la check-list"],
          ["Formats anciens", "Compatibilité limitée", "DWG 2018+"],
          ["Pas de références", "Temps perdu", "5 images de référence"],
        ],
      },
      { type: "heading", level: 2, text: "Comment travaillons-nous chez Elegant Render ?" },
      { type: "paragraph", text: "Notre processus est simple :" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Envoyez les plans CAO** — via le formulaire du site ou par e-mail",
          "**Échanges** — nous clarifions les détails et les besoins",
          "**Devis** — vous recevez le prix et le délai sous 24 h",
          "**Modélisation** — le modèle 3D et la mise en place des caméras",
          "**Rendu** — la visualisation photoréaliste",
          "**Révisions** — 2 à 3 itérations incluses dans le prix",
        ],
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "Des plans CAO bien préparés sont **le billet d’entrée vers une visualisation 3D de premier ordre**. Investissez un peu de temps dans l’organisation de vos fichiers et gagnez du temps, de l’argent et de la sérénité — votre studio 3D vous en remerciera.",
      },
      {
        type: "paragraph",
        text: "Vous avez des plans CAO prêts pour la visualisation ? Envoyez-les-nous — vous recevrez un devis sous 24 heures.",
      },
      { type: "cta", label: "Envoyer des plans CAO", href: "/contact" },
    ],
  },
];

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/** Formats an ISO date (YYYY-MM-DD) as a French long date. */
export function formatBlogDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day} ${MONTHS_FR[month - 1]} ${year}`;
}

/** All posts, newest first. */
export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** Other posts, ranked by shared tags, for the "keep reading" strip. */
export function getRelatedBlogPosts(post: BlogPost, limit = 2): BlogPost[] {
  return getAllBlogPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => sharedTagCount(b, post) - sharedTagCount(a, post))
    .slice(0, limit);
}

function sharedTagCount(a: BlogPost, b: BlogPost): number {
  return a.tags.filter((tag) => b.tags.includes(tag)).length;
}

export function estimateReadingMinutes(post: BlogPost): number {
  const words = post.body.reduce((count, block) => {
    if (block.type === "table") {
      const tableText = [...block.headers, ...block.rows.flat()].join(" ");
      return count + countWords(tableText);
    }

    if (block.type === "list") {
      return count + block.items.reduce((sum, item) => sum + countWords(item), 0);
    }

    if (block.type === "image") {
      return count + countWords(block.caption ?? block.alt);
    }

    if (block.type === "cta") {
      return count + countWords(block.label);
    }

    return count + countWords(block.text);
  }, 0);

  return Math.max(1, Math.ceil(words / 220));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** All keyword phrases for a post's page metadata (tags + SEO keywords). */
export function blogPostKeywords(post: BlogPost): string[] {
  return Array.from(new Set([...post.tags, ...(post.keywords ?? [])]));
}

export function buildBlogPostingJsonLd(post: BlogPost) {
  const url = canonicalUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    headline: post.title,
    description: post.excerpt,
    inLanguage: SEO.htmlLang,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    image: absoluteUrl(post.coverImage),
    keywords: blogPostKeywords(post).join(", "),
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    author: {
      "@type": "Organization",
      name: post.author,
      url: SITE.url,
    },
    publisher: { "@id": SEO.organizationId },
  };
}

export function buildBlogItemListJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absoluteUrl("/blog")}#blog`,
    name: `${SITE.name} Blog`,
    url: absoluteUrl("/blog"),
    inLanguage: SEO.htmlLang,
    publisher: { "@id": SEO.organizationId },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.date,
      image: absoluteUrl(post.coverImage),
    })),
  };
}
