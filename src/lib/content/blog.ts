/**
 * Blog content model — the single source of truth for the /blog section.
 *
 * Posts are authored as type-safe structured blocks (no markdown runtime
 * dependency): each post carries metadata plus a `body` array of blocks.
 * Paragraphs/headings/list items support a small inline syntax rendered by
 * `renderInline` in `blog-post-body.tsx`:
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
  | { type: "image"; src: string; alt: string; caption?: string };

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
  tags: string[];
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "virtuelno-opremanje-prodaja-nekretnina",
    title: "Kako virtuelno opremanje ubrzava prodaju nekretnina",
    excerpt:
      "Prazan stan teško priča priču. Virtuelno opremanje kupcu pokazuje kako se u prostoru živi — i zašto se isplati platiti traženu cenu.",
    date: "2026-06-18",
    author: SITE.name,
    coverImage: "/artwork/expert-virtuelno-opremanje-naslovna-after.webp",
    coverAlt:
      "Virtuelno opremljen dnevni boravak sa toplim, neutralnim enterijerom",
    tags: ["Virtuelno opremanje", "Prodaja nekretnina", "Saveti"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Kupci ne kupuju kvadrate — kupuju predstavu o životu u prostoru. Kada uđu u prazan stan, tu predstavu moraju sami da sastave, a većina ljudi to jednostavno ne ume. Virtuelno opremanje tu prazninu popunjava umesto njih.",
      },
      {
        type: "heading",
        level: 2,
        text: "Prazan prostor deluje manji i hladniji",
      },
      {
        type: "paragraph",
        text: "Bez nameštaja nema razmere. Soba bez kreveta i ormara izgleda i manje i bezličnije nego što jeste, a oglasna fotografija praznog zida retko koga zaustavi u skrolovanju. Opremljena fotografija radi suprotno: daje kontekst, toplinu i jasan raspored.",
      },
      {
        type: "image",
        src: "/artwork/detail-virtuelno-opremanje-before.webp",
        alt: "Prazan dnevni boravak pre virtuelnog opremanja",
        caption: "Isti prostor pre — tačan, ali bez priče.",
      },
      {
        type: "image",
        src: "/artwork/detail-virtuelno-opremanje-after.webp",
        alt: "Isti dnevni boravak posle virtuelnog opremanja",
        caption: "Posle — kupac odmah vidi kako bi tu živeo.",
      },
      {
        type: "heading",
        level: 2,
        text: "Šta konkretno dobijate",
      },
      {
        type: "list",
        items: [
          "**Više klikova na oglas** — opremljena naslovna fotografija privlači pažnju u pretrazi.",
          "**Brža odluka** — kupac ne mora da zamišlja raspored, već ga vidi.",
          "**Bolja pregovaračka pozicija** — prostor koji deluje dovršeno lakše brani traženu cenu.",
          "**Niža cena od klasičnog stejdžinga** — bez iznajmljivanja i transporta nameštaja.",
        ],
      },
      {
        type: "quote",
        text: "Fotografija je prvi utisak, a prvi utisak se pravi jednom. Isplati se da bude opremljen.",
      },
      {
        type: "heading",
        level: 2,
        text: "Kada ima najviše smisla",
      },
      {
        type: "paragraph",
        text: "Virtuelno opremanje najbrže se isplati kod praznih stanova, novogradnje bez nameštaja i prostora koji su ispražnjeni pre prodaje. Ako je stan već lepo opremljen, češće ćemo predložiti [virtuelnu renovaciju](/usluge/virtuelna-renovacija) ili [uklanjanje suvišnih predmeta](/usluge/uklanjanje-predmeta) umesto potpunog opremanja.",
      },
      {
        type: "paragraph",
        text: "Ako razmišljate o prodaji ili izdavanju, pogledajte kako izgleda naša usluga [virtuelnog opremanja](/usluge/virtuelno-opremanje) i pošaljite nam fotografije prostora — okvirnu cenu i predlog dobijate isti dan.",
      },
    ],
  },
  {
    slug: "2d-ili-3d-osnove-sta-odabrati",
    title: "2D ili 3D osnove: šta odabrati za vaš projekat",
    excerpt:
      "2D osnova daje precizan tehnički raspored, 3D osnova prodaje utisak prostora. Evo kako da izaberete pravu — ili obe.",
    date: "2026-06-30",
    author: SITE.name,
    coverImage: "/artwork/detail-3d-osnove.webp",
    coverAlt: "3D osnova stana sa nameštajem, pogled odozgo",
    tags: ["Osnove", "2D i 3D", "Saveti"],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Osnova (tlocrt) je najbrži način da neko shvati kako je prostor organizovan. Pitanje je samo koliko toga želite da pokažete — suvu tehniku ili ceo doživljaj prostora.",
      },
      {
        type: "heading",
        level: 2,
        text: "2D osnova — jasnoća i preciznost",
      },
      {
        type: "paragraph",
        text: "Kolorisana 2D osnova pokazuje raspored prostorija, dimenzije i namenu svakog dela stana, čisto i pregledno. Idealna je za oglase, dokumentaciju i brzo poređenje više jedinica. Kupac za nekoliko sekundi vidi koliko soba ima i kako se povezuju.",
      },
      {
        type: "image",
        src: "/artwork/detail-2d-osnove.webp",
        alt: "Kolorisana 2D osnova stana sa rasporedom prostorija",
        caption: "2D osnova — pregledna i laka za čitanje.",
      },
      {
        type: "heading",
        level: 2,
        text: "3D osnova — utisak i atmosfera",
      },
      {
        type: "paragraph",
        text: "3D osnova („dollhouse\" pogled) dodaje nameštaj, materijale i osvetljenje. Umesto apstraktnih linija, kupac vidi opremljen prostor odozgo — a to prodaje emociju, ne samo kvadrate. Zato je 3D osnova moćna na naslovnici oglasa i u prezentacijama investitora.",
      },
      {
        type: "image",
        src: "/artwork/detail-3d-osnove.webp",
        alt: "3D osnova istog stana sa nameštajem i materijalima",
        caption: "3D osnova — isti raspored, ali sa doživljajem prostora.",
      },
      {
        type: "heading",
        level: 2,
        text: "Kako da izaberete",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Za **dokumentaciju i brzo poređenje** — dovoljna je 2D osnova.",
          "Za **oglas koji treba da se istakne** — 3D osnova ostavlja jači prvi utisak.",
          "Za **projekte i investitore** — najbolje rade obe: 2D za preciznost, 3D za prezentaciju.",
        ],
      },
      {
        type: "paragraph",
        text: "U praksi najčešće preporučujemo kombinaciju. Pogledajte primere za [2D osnove](/usluge/2d-osnove) i [3D osnove](/usluge/3d-osnove), pa nam javite šta vam treba — predlažemo optimalan format za vaš konkretan projekat.",
      },
    ],
  },
];

// Average adult reading speed is ~200 wpm; count words across text-bearing
// blocks to give a rough "min čitanja" figure.
const WORDS_PER_MINUTE = 200;

export function estimateReadingMinutes(post: BlogPost): number {
  const words = post.body.reduce((total, block) => {
    if (
      block.type === "paragraph" ||
      block.type === "heading" ||
      block.type === "quote"
    ) {
      return total + countWords(block.text);
    }
    if (block.type === "list") {
      return total + countWords(block.items.join(" "));
    }
    return total;
  }, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const MONTHS_SR = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

/** Formats an ISO date (YYYY-MM-DD) as Serbian long form, e.g. "2. jul 2026." */
export function formatBlogDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day}. ${MONTHS_SR[month - 1]} ${year}.`;
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
    keywords: post.tags.join(", "),
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
