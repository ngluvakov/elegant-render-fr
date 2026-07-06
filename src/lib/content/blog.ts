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
    title: "How much does an interior 3D render cost in 2026?",
    excerpt:
      "A practical guide to interior render pricing, camera angles, room count, staging detail, and when to request an estimate.",
    date: "2026-04-07",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-static.webp",
    coverAlt: "Photoreal interior render of a furnished living room",
    tags: ["Pricing", "Interior renders"],
    keywords: ["interior render cost", "3D rendering price", "real estate renders"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Interior render cost depends on the amount of modelling, the number of camera angles, the quality of styling, and the deadline. The first view usually carries most of the setup work; later views from the same model are more efficient.",
      },
      {
        type: "heading",
        level: 2,
        text: "What affects the price?",
      },
      {
        type: "list",
        items: [
          "**Room complexity:** open-plan spaces, custom ceilings, stairs, and built-in furniture take longer to model.",
          "**Camera count:** extra views are easier once the model exists, but each still needs composition, lighting, and review.",
          "**Styling depth:** virtual staging ranges from simple functional furnishing to detailed editorial styling.",
          "**Deadline:** rush work can require priority scheduling and extra review time.",
        ],
      },
      {
        type: "paragraph",
        text: "Use the [pricing configurator](/pricing) for public price points. If the scope is unclear, send the plans and references through [contact](/contact) and ask for an estimate.",
      },
      { type: "cta", label: "Get your estimate", href: "/pricing" },
    ],
  },
  {
    slug: "virtual-vs-real-renovation",
    title: "Virtual renovation vs real renovation",
    excerpt:
      "When a digital renovation is enough for marketing, planning, and sales, and when physical work is still unavoidable.",
    date: "2026-04-09",
    author: "Elegant Render",
    coverImage: "/artwork/ai-tool-virtual_staging-after.webp",
    coverAlt: "Virtually renovated real estate interior",
    tags: ["Virtual renovation", "Real estate marketing"],
    keywords: ["virtual renovation", "renovation render", "property marketing"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Virtual renovation is a digital preview of what a space could become. It helps sellers, agents, and designers show potential before committing to physical work.",
      },
      {
        type: "table",
        headers: ["Question", "Virtual renovation", "Real renovation"],
        rows: [
          ["Best for", "Marketing, concept testing, investor decks", "Actual use and construction"],
          ["Timeline", "Days", "Weeks or months"],
          ["Risk", "Low production risk", "Contractor, material, and site risk"],
          ["Output", "Photoreal image", "Physical space"],
        ],
      },
      {
        type: "paragraph",
        text: "Use virtual renovation when buyers need to understand potential. Use real renovation when the property must physically change before occupancy.",
      },
      { type: "cta", label: "Plan a virtual renovation", href: "/services/virtual-renovation" },
    ],
  },
  {
    slug: "how-to-get-a-3d-visualization-quote",
    title: "How to get an estimate for a 3D render",
    excerpt:
      "What to send, how to describe the brief, and how the team turns files into a clear estimate.",
    date: "2026-04-11",
    author: "Elegant Render",
    coverImage: "/artwork/blog-3d-visualization-duplex.webp",
    coverAlt: "3D floor plan render of a duplex apartment",
    tags: ["Guide", "Estimate"],
    keywords: ["3D render estimate", "architectural visualization brief"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "A good estimate starts with a clear brief. You do not need perfect documentation, but the more context you send, the more accurate the scope and timeline become.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Choose the nearest service on /pricing.",
          "Upload plans, photos, model files, or reference images.",
          "Explain the goal: listing, sale, planning, investor deck, or design approval.",
          "Mention deadline, output format, and any must-keep details.",
        ],
      },
      {
        type: "paragraph",
        text: "If something is missing, the team will ask for clarification instead of guessing. That keeps the estimate useful.",
      },
      { type: "cta", label: "Send a project brief", href: "/contact" },
    ],
  },
  {
    slug: "ai-studio-real-estate-photo-editing",
    title: "AI Studio for real estate photo editing",
    excerpt:
      "How AI Studio helps with decluttering, sky replacement, object changes, virtual staging, and fast listing improvements.",
    date: "2026-04-14",
    author: "Elegant Render",
    coverImage: "/artwork/ai-tool-virtual_staging-before.webp",
    coverAlt: "Real estate room before AI editing",
    tags: ["AI Studio", "Real estate photos"],
    keywords: ["AI real estate photo editing", "virtual staging AI", "property photo editing"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "AI Studio is built for fast photo improvements when a full 3D render is not necessary. It can clean up listings, test style ideas, and prepare visual options quickly.",
      },
      {
        type: "list",
        items: [
          "Remove distracting objects from a room or exterior photo.",
          "Change sky, light, or atmosphere for a stronger listing image.",
          "Add furniture references for virtual staging concepts.",
          "Generate repeat variations while the edit type stays the same.",
        ],
      },
      {
        type: "paragraph",
        text: "For high-value marketing campaigns, combine AI Studio with manual review or a full render service.",
      },
      { type: "cta", label: "Open AI Studio", href: "/ai-studio" },
    ],
  },
  {
    slug: "360-tours-in-real-estate-sales",
    title: "How 360 virtual tours help sell property",
    excerpt:
      "Where 360 tours fit in real estate marketing and how they complement still renders and floor plans.",
    date: "2026-04-16",
    author: "Elegant Render",
    coverImage: "/artwork/detail-360-eksterijer.webp",
    coverAlt: "Exterior 360 virtual tour preview",
    tags: ["360 virtual tour", "Real estate marketing"],
    keywords: ["360 virtual tour", "property tour", "real estate visualization"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "A 360 virtual tour lets buyers explore the relationship between spaces, not just isolated views. It is useful when flow, scale, and context matter.",
      },
      {
        type: "paragraph",
        text: "Use still renders for hero images, floor plans for layout clarity, and a 360 tour when the buyer needs to feel how the property connects.",
      },
      { type: "cta", label: "Explore 360 tours", href: "/services/exterior-360" },
    ],
  },
  {
    slug: "how-to-choose-a-3d-visualization-studio",
    title: "How to choose a 3D visualization studio",
    excerpt:
      "A checklist for comparing portfolios, process, pricing clarity, revision handling, and delivery promises.",
    date: "2026-04-18",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-aerial.webp",
    coverAlt: "Aerial exterior render of a residential development",
    tags: ["Guide", "Architectural visualization"],
    keywords: ["choose 3D visualization studio", "render studio checklist"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "A good studio should make scope, price, timeline, and revision handling easy to understand before you commit.",
      },
      {
        type: "list",
        items: [
          "Look for relevant examples, not only the most dramatic portfolio image.",
          "Ask what is included in the first draft and what counts as a new scope.",
          "Check whether pricing is visible or whether every small request needs a call.",
          "Confirm file delivery, revision rounds, and who owns the final outputs.",
        ],
      },
      { type: "cta", label: "Compare services", href: "/services" },
    ],
  },
  {
    slug: "real-estate-photography-best-practices",
    title: "Real estate photography before AI editing",
    excerpt:
      "Simple capture habits that make item removal, day-to-dusk, and virtual staging results more reliable.",
    date: "2026-04-20",
    author: "Elegant Render",
    coverImage: "/artwork/detail-dan-u-noc-before.webp",
    coverAlt: "Daytime exterior photo before day-to-dusk editing",
    tags: ["Photography", "AI Studio"],
    keywords: ["real estate photo tips", "AI editing source photo"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "AI and manual editing both work better when the source photo is sharp, level, and honestly lit.",
      },
      {
        type: "list",
        items: [
          "Shoot from a stable height and keep vertical lines straight.",
          "Avoid extreme wide-angle distortion when possible.",
          "Take one clean reference photo before moving objects.",
          "Capture windows and exterior views if they matter to the brief.",
        ],
      },
      { type: "cta", label: "Improve a photo", href: "/ai-studio" },
    ],
  },
  {
    slug: "why-developers-use-3d-visualization-before-construction",
    title: "Why developers use 3D visualization before construction",
    excerpt:
      "How pre-construction renders support sales, investor alignment, planning conversations, and buyer confidence.",
    date: "2026-04-22",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-aerial.webp",
    coverAlt: "Pre-construction exterior render for a development",
    tags: ["Developers", "Exterior renders"],
    keywords: ["pre-construction render", "developer visualization"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Before construction, buyers and stakeholders need to understand a project that does not exist yet. Renders turn plans into a shared visual reference.",
      },
      {
        type: "paragraph",
        text: "Developers use visualization for brochures, listings, investor decks, sales offices, planning conversations, and internal design alignment.",
      },
      { type: "cta", label: "Start an exterior render", href: "/services/exterior-renders" },
    ],
  },
  {
    slug: "virtual-staging-styles-2026",
    title: "Virtual staging styles for 2026",
    excerpt:
      "How to choose a staging style that supports the property, the likely buyer, and the listing channel.",
    date: "2026-04-24",
    author: "Elegant Render",
    coverImage: "/artwork/ai-tool-virtual_staging-after.webp",
    coverAlt: "Virtually staged room with neutral furniture",
    tags: ["Virtual staging", "Interior renders"],
    keywords: ["virtual staging styles", "real estate staging 2026"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "The best virtual staging style is not the loudest one. It should make the room easier to understand and help the likely buyer imagine living there.",
      },
      {
        type: "list",
        items: [
          "Use neutral contemporary styling for broad buyer appeal.",
          "Use warmer residential styling for family homes.",
          "Use minimal styling when layout clarity matters more than decor.",
          "Avoid furniture that hides scale or blocks key architectural features.",
        ],
      },
      { type: "cta", label: "Plan virtual staging", href: "/services/virtual-staging" },
    ],
  },
  {
    slug: "how-to-prepare-cad-drawings-for-3d-visualization",
    title: "How to prepare CAD drawings for 3D visualization",
    excerpt:
      "A short checklist for sending plans, elevations, dimensions, materials, and references that speed up rendering.",
    date: "2026-04-26",
    author: "Elegant Render",
    coverImage: "/artwork/blog-3d-visualization-duplex.webp",
    coverAlt: "Architectural floor plan prepared for rendering",
    tags: ["Guide", "CAD"],
    keywords: ["prepare CAD for render", "3D visualization files"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Clean input files reduce questions, prevent assumptions, and help the first drafts land closer to the brief.",
      },
      {
        type: "list",
        items: [
          "Send floor plans, elevations, sections, and site context if available.",
          "Mark any dimensions that are approximate or likely to change.",
          "Include material references, furniture references, and must-match colours.",
          "Name files clearly and mention which version is current.",
        ],
      },
      { type: "cta", label: "Send project files", href: "/contact" },
    ],
  },
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Formats an ISO date (YYYY-MM-DD) as an English long date. */
export function formatBlogDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day} ${MONTHS_EN[month - 1]} ${year}`;
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
