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
    title: "How much does interior 3D rendering cost? 2026 price guide",
    excerpt:
      "The price of interior 3D rendering depends on the complexity of the space, the number of angles and the deadline. A complete guide with prices and tips.",
    date: "2026-04-07",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-static.webp",
    coverAlt:
      "Interior 3D render of a living room with furniture and natural light",
    tags: ["Pricing", "3D renders"],
    keywords: [
      "3D rendering cost",
      "how much does a 3D render cost",
      "interior render price",
      "3D visualization pricing",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "The cost of interior 3D rendering is one of the most common questions we get. And that is entirely reasonable — when you are planning to sell or let a property, 3D renders are an investment that should pay for itself.",
      },
      {
        type: "paragraph",
        text: "In this guide we will show you **how the price is formed**, what is included and how to get the best value for money.",
      },
      {
        type: "heading",
        level: 2,
        text: "What affects the price of an interior render?",
      },
      { type: "heading", level: 3, text: "1. Complexity of the space" },
      {
        type: "paragraph",
        text: "The basic factor is **architectural complexity**. A space with many partitions, sloped ceilings, arches and special elements takes longer to model. A simple rectangular room with a flat ceiling is the most affordable, while complex open-plan spaces with a kitchen, dining and living area require more work.",
      },
      { type: "heading", level: 3, text: "2. Number of camera angles" },
      {
        type: "paragraph",
        text: "With most agencies, **the first view covers modelling the entire space**. Every following view is considerably cheaper because the model already exists — all that is needed is a new camera position and a composition pass.",
      },
      { type: "heading", level: 3, text: "3. Staging quality" },
      {
        type: "paragraph",
        text: "Do you want basic furniture or a fully designed interior? **Virtual staging** can be done at several levels:",
      },
      {
        type: "list",
        items: [
          "**Basic:** functional furniture, basic materials",
          "**Standard:** stylistically matched furniture, decorations, plants",
          "**Premium:** designer pieces, detailed lighting, personalisation",
        ],
      },
      { type: "heading", level: 3, text: "4. Deadline" },
      {
        type: "paragraph",
        text: "Rush orders (24–48h) usually carry a surcharge for priority handling.",
      },
      { type: "heading", level: 2, text: "Elegant Render price list example" },
      {
        type: "paragraph",
        text: "With us, **prices are clear and known upfront** — no hidden costs:",
      },
      {
        type: "table",
        headers: ["Service", "Price (from)"],
        rows: [
          ["Interior — first floor (10 rooms, unlimited cameras)", "**€170**"],
          ["Additional furnished room (same project)", "**€28**"],
          ["Additional camera angle (same room)", "**€10**"],
          ["Additional floor (same style, 30% cheaper)", "**€120**"],
          ["360 interior — first floor (10 panoramas)", "**€295**"],
        ],
      },
      {
        type: "paragraph",
        text: "**Important:** If a complete model already exists (for example from an exterior render), interior rendering is up to 50% cheaper.",
      },
      { type: "heading", level: 2, text: "How to save on 3D renders?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Combine interior + exterior** — a shared model brings large savings",
          "**Book several angles at once** — the first view is the most expensive, every following one is far cheaper",
          "**Use standard packages** — predefined packages are more affordable than fully custom scopes",
          "**Order off-season** — outside peak months (spring/autumn) turnaround times are shorter",
        ],
      },
      { type: "heading", level: 2, text: "Is it worth it?" },
      {
        type: "paragraph",
        text: "Research shows that **properties with professional 3D renders** get:",
      },
      {
        type: "list",
        items: [
          "**32% more enquiries** from potential buyers",
          "**Sold 2–3 weeks faster** compared to properties without renders",
          "**A higher sale price** — buyers are willing to pay more for a property they have seen in its best light",
        ],
      },
      { type: "heading", level: 2, text: "How to get a quote?" },
      { type: "paragraph", text: "The process is simple:" },
      {
        type: "list",
        ordered: true,
        items: [
          "Send basic information about the space (floor area, number of rooms, floors)",
          "Choose the package that suits you",
          "Provide floor plans or reference images",
          "In 7–14 days you receive finished photoreal renders",
        ],
      },
      {
        type: "cta",
        label: "Calculate the price for your project",
        href: "/pricing",
      },
    ],
  },
  {
    slug: "virtual-vs-real-renovation",
    title: "Virtual renovation vs real renovation: which pays off?",
    excerpt:
      "Comparing virtual and real renovation — cost, time, outcome. When a virtual renovation is a better choice than physical works.",
    date: "2026-04-09",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtual-renovation.webp",
    coverAlt: "Before and after comparison of a virtually renovated living room",
    tags: ["Renovation", "Real estate sales"],
    keywords: [
      "virtual renovation",
      "virtual apartment renovation",
      "renovation vs virtual",
      "AI renovation",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "When you think about renovating an apartment or a house, the first thing that comes to mind is a **real renovation** — contractors, drywall, paint, flooring, mess and costs. But there is another option that has been getting more and more attention in recent years: **virtual renovation**.",
      },
      {
        type: "paragraph",
        text: "In this article we compare both approaches — cost, time, outcome and the situations in which each of them is the right choice.",
      },
      { type: "heading", level: 2, text: "What is virtual renovation?" },
      {
        type: "paragraph",
        text: "Virtual renovation is a **digital transformation of an existing space** using 3D modelling and photoreal rendering. Based on photographs of your existing space, our team creates a new look — we change walls, floors, furniture, colours, materials and even architectural elements.",
      },
      {
        type: "paragraph",
        text: "Virtual renovation **requires no physical works**. Every change happens on screen, and the result is a photoreal image showing what the space would look like after renovation.",
      },
      {
        type: "heading",
        level: 2,
        text: "Comparison: virtual vs real renovation",
      },
      {
        type: "table",
        headers: ["Aspect", "Virtual renovation", "Real renovation"],
        rows: [
          ["**Cost**", "**€66 per view**", "€10,000–100,000+"],
          ["**Time**", "3–7 days", "2–6 months"],
          ["**Mess and noise**", "❌ None", "✅ Plenty"],
          ["**Physical result**", "Photoreal image", "Actual space"],
          ["**Multiple variants**", "Easy (just change materials)", "Expensive and slow"],
          ["**Risk of mistakes**", "Minimal", "High (poor workmanship)"],
        ],
      },
      { type: "heading", level: 2, text: "When to use virtual renovation?" },
      { type: "heading", level: 3, text: "1. Selling a property" },
      {
        type: "paragraph",
        text: "This is the **most common reason** for a virtual renovation. If you are selling an apartment or a house that looks dated, buyers struggle to imagine its potential. A virtual renovation shows them **what the space could look like** — and that motivates them to offer a higher price.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. Investors and flippers",
      },
      {
        type: "paragraph",
        text: "If you are buying a property to renovate and resell, virtual renovation helps you:",
      },
      {
        type: "list",
        items: [
          "Test **different styles before any physical work**",
          "Show **the potential to buyers and partners** before investing real money",
          "Create **marketing material** to sell before the renovation (pre-selling)",
        ],
      },
      { type: "heading", level: 3, text: "3. Architectural consultations" },
      {
        type: "paragraph",
        text: "Architects and interior designers use virtual renovation to **show clients the possibilities** before final decisions on materials and layout are made.",
      },
      { type: "heading", level: 2, text: "And when is a real renovation unavoidable?" },
      {
        type: "list",
        items: [
          "When the **installations are worn out** (electrical, plumbing, heating)",
          "When the **room layout needs to change** (removing walls)",
          "When the **structure is compromised** (damp, cracks, foundations)",
          "When the space is **physically used** (you are moving in)",
        ],
      },
      { type: "heading", level: 2, text: "A practical example" },
      {
        type: "list",
        items: [
          "**Client:** Selling an apartment in a 1980s residential block",
          "**Problem:** Buyers cannot see the potential because of dated furniture and colours",
          "**Solution:** Virtual renovation for 4 rooms — 8 views",
          "**Cost:** 8 × €66 = **€528**",
          "**Delivery time:** 7 days",
        ],
      },
      {
        type: "paragraph",
        text: "**Result:** The apartment sold for **15% above the initial asking price** within 3 weeks.",
      },
      { type: "heading", level: 2, text: "Our recommendation" },
      {
        type: "paragraph",
        text: "In most cases, **the best approach is a combination** — virtual renovation for marketing and showing potential, and real renovation only for the key functional repairs.",
      },
      {
        type: "paragraph",
        text: "If you are not sure what you need, send us photos of the space and we will give you a recommendation — no strings attached.",
      },
      {
        type: "cta",
        label: "Calculate the price of a virtual renovation",
        href: "/services/virtual-renovation",
      },
    ],
  },
  {
    slug: "how-to-get-a-3d-visualization-quote",
    title: "How to get a quote for 3D visualization? A quick guide to the process",
    excerpt:
      "Everything you need to know before ordering a 3D render — how to prepare the brief, what information is needed and how long production takes.",
    date: "2026-04-11",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/blog-3d-visualization-duplex.webp",
    coverAlt:
      "3D floor plan of a duplex apartment — photoreal top-down view with furniture and room layout",
    tags: ["Guide", "3D renders"],
    keywords: [
      "3D visualization quote",
      "how to order a 3D render",
      "render brief",
      "architectural visualization process",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Ordering a 3D visualization can feel complicated if you have never worked with a professional render studio before. In this guide we walk you through the whole process — from the first enquiry to the finished render.",
      },
      { type: "heading", level: 2, text: "Step 1: Send an enquiry" },
      {
        type: "paragraph",
        text: "It all starts with a simple enquiry. You can send it via:",
      },
      {
        type: "list",
        items: [
          "The **contact form** on our website",
          "**Email** at info@elegantrender.com",
          "**Instagram** direct message",
        ],
      },
      {
        type: "paragraph",
        text: "At this stage we do not need detailed drawings — it is enough to know the **basic information**:",
      },
      {
        type: "list",
        items: [
          "Type of space (interior / exterior / landscape)",
          "Approximate floor area",
          "Number of rooms / angles you are interested in",
          "Delivery deadline",
          "Budget (optional)",
        ],
      },
      { type: "heading", level: 2, text: "Step 2: You receive a quote" },
      { type: "paragraph", text: "Within **24 hours** you receive:" },
      {
        type: "list",
        items: [
          "✅ **A precise price** (EUR, no hidden costs)",
          "✅ **A delivery deadline**",
          "✅ **What is included** (modelling, texturing, rendering)",
          "✅ **Ways to save** (discounts on extra angles, combined services)",
        ],
      },
      {
        type: "paragraph",
        text: "All our prices are **transparent and known upfront** — you can also see them directly on the [pricing page](/pricing).",
      },
      { type: "heading", level: 2, text: "Step 3: Preparing the brief" },
      {
        type: "paragraph",
        text: "The brief is a condensed description of the project. The more detailed the brief, the closer the render will be to your vision. A good brief contains:",
      },
      { type: "paragraph", text: "**Required:**" },
      {
        type: "list",
        items: [
          "Floor plans (or a sketch of the room layout)",
          "Reference photos of a style you like",
          "Dimensions of the space",
        ],
      },
      { type: "paragraph", text: "**Nice to have:**" },
      {
        type: "list",
        items: [
          "A colour palette or material samples",
          "Photos of furniture you want us to use",
          "\"Like\" and \"dislike\" examples (what you love, and what you don't)",
        ],
      },
      {
        type: "quote",
        text: "**Tip:** Not sure what style you want? No problem — our design team can suggest a few options based on the character of the space.",
      },
      { type: "heading", level: 2, text: "Step 4: Production" },
      {
        type: "paragraph",
        text: "Once you confirm the quote and provide the materials, the process begins:",
      },
      {
        type: "table",
        headers: ["Phase", "Duration", "Description"],
        rows: [
          ["**Modelling**", "2–5 days", "Building the 3D model of the space"],
          ["**Texturing**", "1–3 days", "Applying materials and colours"],
          ["**Staging**", "2–4 days", "Furniture, decor, plants"],
          ["**Lighting**", "1–2 days", "Natural and artificial lighting"],
          ["**Rendering**", "1–3 days", "Final image computation"],
        ],
      },
      {
        type: "paragraph",
        text: "**Total:** 7–14 days for standard projects.",
      },
      { type: "heading", level: 3, text: "Revisions" },
      {
        type: "paragraph",
        text: "Part of the process are **revisions** — adjustments based on your feedback. After the first version, you can request changes to:",
      },
      {
        type: "list",
        items: [
          "Wall and floor colours",
          "Camera position",
          "Type of furniture",
          "Lighting",
        ],
      },
      {
        type: "paragraph",
        text: "Usually **2–3 revision rounds** are enough for a perfect result.",
      },
      { type: "heading", level: 2, text: "Step 5: Delivery" },
      {
        type: "paragraph",
        text: "You receive the finished renders in **high resolution** (at least 4K), ready for:",
      },
      {
        type: "list",
        items: [
          "✅ Publishing in property listings",
          "✅ Print (brochures, catalogues, billboards)",
          "✅ Social media (Instagram, Facebook, LinkedIn)",
          "✅ Presentations to investors and clients",
        ],
      },
      { type: "heading", level: 2, text: "Frequently asked questions" },
      {
        type: "paragraph",
        text: "**How much does a 3D render cost?** The price depends on complexity. Interior renders start from **€170** for a 10-room package. See the [full price list](/pricing).",
      },
      {
        type: "paragraph",
        text: "**What if I don't have floor plans?** No problem. We can model the space from photographs and approximate dimensions.",
      },
      {
        type: "paragraph",
        text: "**Do you work on weekends?** Yes, for urgent projects we offer priority handling for a surcharge.",
      },
      {
        type: "paragraph",
        text: "**How do I pay?** Payment is by card or PayPal. For larger projects an advance payment schedule can be arranged.",
      },
      { type: "heading", level: 2, text: "Send an enquiry and let's start" },
      {
        type: "paragraph",
        text: "The process is simple, and we are here to help you at every step — from the idea to the finished photoreal render.",
      },
      { type: "cta", label: "Send a brief", href: "/contact" },
    ],
  },
  {
    slug: "ai-studio-real-estate-photo-editing",
    title: "AI Studio — how artificial intelligence edits real estate photos",
    excerpt:
      "AI real estate photo editing is the fastest way to upgrade a listing. Everything about AI Studio tools, prices and the effect on sales.",
    date: "2026-04-14",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/ai-tool-virtual_staging-after.webp",
    coverAlt:
      "AI-edited real estate photo — before and after the AI Studio treatment",
    tags: ["AI Studio", "Real estate photography"],
    keywords: [
      "AI real estate photo editing",
      "AI studio",
      "artificial intelligence photo editing",
      "AI retouching",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Photography is the buyer's first contact with a property. Research shows that **listings with professional photos get up to 118% more views**. But what if you don't have the budget for a professional photographer, or you need a large batch of images edited on a short deadline?",
      },
      {
        type: "paragraph",
        text: "That is where **AI real estate photo editing** comes in — a tool that has changed the way agencies and agents prepare visual material.",
      },
      { type: "heading", level: 2, text: "What is AI Studio?" },
      {
        type: "paragraph",
        text: "AI Studio is our system for **automatic editing and enhancement of real estate photos** powered by advanced artificial intelligence. Unlike classic Photoshop work that takes hours, AI processes images in **a few minutes**.",
      },
      {
        type: "heading",
        level: 2,
        text: "What can AI do with a real estate photo?",
      },
      {
        type: "heading",
        level: 3,
        text: "1. ✅ Automatic colour and lighting correction",
      },
      {
        type: "list",
        items: [
          "Fixes **exposure** — dark rooms get brighter, and blown-out windows regain detail",
          "Balances **white point** — photos look natural, without a yellow or blue cast",
          "Improves **contrast and saturation** — the space looks more inviting without distortion",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "2. ✅ Removing unwanted elements",
      },
      {
        type: "list",
        items: [
          "Personal items (socks on the floor, detergents, cosmetics)",
          "Ugly details (cables, extension cords, radiators)",
          "Stains on walls, scratches on furniture",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "3. ✅ Sky replacement on exterior photos",
      },
      {
        type: "paragraph",
        text: "A grey, overcast sky **instantly becomes blue and sunny**. This is one of the most requested AI treatments for exterior photography.",
      },
      { type: "heading", level: 3, text: "4. ✅ HDR processing" },
      {
        type: "paragraph",
        text: "Combines multiple exposures into one perfectly lit image — you see the interior details and the view through the window at the same time.",
      },
      {
        type: "heading",
        level: 3,
        text: "5. ✅ Day-to-dusk transformation",
      },
      {
        type: "paragraph",
        text: "We turn daytime photos into **dramatic dusk scenes** with warm window lighting and a twilight sky.",
      },
      { type: "heading", level: 2, text: "AI Studio vs classic editing" },
      {
        type: "table",
        headers: ["Aspect", "AI Studio", "Classic Photoshop editing"],
        rows: [
          ["**Price**", "From €10 per image", "€20–45 per image"],
          ["**Processing time**", "A few minutes", "1–3 hours per image"],
          [
            "**Consistency**",
            "Identical quality across all images",
            "Depends on the editor",
          ],
          ["**Batch editing (10+)**", "Automatic batch", "Manual, image by image"],
          ["**Fine control**", "Basic", "Full control"],
        ],
      },
      { type: "heading", level: 2, text: "Who uses AI Studio?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Real estate agents** — publishing 10–50 listings a month who need fast, consistent editing",
          "**Investors** — selling several properties at the same time",
          "**Photographers** — using AI as a starting point for further editing",
          "**Agencies** — standardising the visual identity of all their listings",
        ],
      },
      { type: "heading", level: 2, text: "A practical example" },
      {
        type: "list",
        items: [
          "**Client:** Real estate agency, 45 listings a month",
          "**Problem:** Every listing needs 5–8 photos, and manual editing costs €25 per image",
          "**Solution:** AI Studio + day-to-dusk processing",
        ],
      },
      {
        type: "paragraph",
        text: "**Before AI Studio:** 45 listings × 6 images × €25 = **€6,750 per month**, with **180 hours** of manual editing every month.",
      },
      {
        type: "paragraph",
        text: "**After AI Studio:** 45 listings × 6 images × €10 = **€2,700 per month**, with **15 hours** of review per month.",
      },
      {
        type: "paragraph",
        text: "**Savings: 60% of the budget and 92% of the time.**",
      },
      { type: "heading", level: 2, text: "How to order AI Studio editing?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Send your photos** through our platform",
          "**Choose the treatment** (basic editing, day-to-dusk, item removal)",
          "**Receive the edited images** within 24h (or 48h for batch orders)",
          "**Download** in high resolution, ready to publish",
        ],
      },
      { type: "heading", level: 2, text: "The limits of AI editing" },
      {
        type: "paragraph",
        text: "As powerful as AI is, it is not always the answer to everything. AI struggles with:",
      },
      {
        type: "list",
        items: [
          "**Complex removals** — large objects or parts of the space that need reconstruction",
          "**Specific brand colours** — when exact Pantone reproduction is required",
          "**Creative decisions** — AI cannot \"invent\" a new design for the space",
        ],
      },
      {
        type: "paragraph",
        text: "For those cases we also offer **classic Photoshop editing** through our team of graphic designers.",
      },
      { type: "cta", label: "Try AI Studio", href: "/ai-studio" },
    ],
  },
  {
    slug: "360-tours-in-real-estate-sales",
    title: "360 tours in real estate sales: why buyers love interactive viewing",
    excerpt:
      "360 tours and virtual walkthroughs increase buyer engagement by over 40%. How they work, what they cost and when to use them.",
    date: "2026-04-16",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-360.webp",
    coverAlt: "Interior 360 virtual tour — interactive view of the space",
    tags: ["360 tours", "Real estate sales"],
    keywords: [
      "360 property tour",
      "virtual tour",
      "3D apartment tour",
      "interactive property viewing",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Imagine a buyer being able to **walk through an apartment** without physically visiting — looking around every room, peeking through the window, checking the ceiling and the floor, all from the comfort of their own living room.",
      },
      {
        type: "paragraph",
        text: "That is not science fiction. That is a **360 tour**, and it is becoming the standard in real estate sales worldwide.",
      },
      { type: "heading", level: 2, text: "What is a 360 tour?" },
      {
        type: "paragraph",
        text: "A 360 tour (also called a virtual walkthrough or interactive viewing) is a **set of panoramic photographs or renders** connected into an interactive experience. With a mouse click or a tap, the buyer moves from room to room, turns a full 360 degrees and gets the feeling of **actually being in the space**.",
      },
      { type: "heading", level: 2, text: "Why do 360 tours work?" },
      {
        type: "heading",
        level: 3,
        text: "1. Buyers are already used to interactive content",
      },
      {
        type: "paragraph",
        text: "Instagram Reels, TikTok, YouTube Shorts — people are used to consuming visual content that **responds to their movements**. A static photo feels dull compared to an interactive experience.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. It reduces the number of physical viewings",
      },
      {
        type: "paragraph",
        text: "A sales agent spends on average **6–8 hours** on physical viewings per property. With a 360 tour, only **serious buyers** come to a physical viewing — the rest have already filtered themselves out through the virtual walkthrough.",
      },
      { type: "heading", level: 3, text: "3. It increases engagement" },
      { type: "paragraph", text: "The statistics show that:" },
      {
        type: "list",
        items: [
          "**Buyers spend 3–5 minutes** in a 360 tour (compared to 10–15 seconds on a static photo)",
          "**40% more buyers** send an enquiry after seeing a 360 tour",
          "Properties with a 360 tour **get 20–30% more scheduled viewings**",
        ],
      },
      { type: "heading", level: 2, text: "When to use a 360 tour?" },
      { type: "heading", level: 3, text: "📍 Properties for sale" },
      {
        type: "paragraph",
        text: "A 360 tour is **ideal for any property that is ready for sale**. It is especially effective for:",
      },
      {
        type: "list",
        items: [
          "**Luxury properties** — buyers expect a premium experience",
          "**Properties in another city** — buyers cannot easily come for a physical viewing",
          "**Investment properties** — quick assessment of potential without a site visit",
          "**Apartments under construction** — showing the finished look before move-in",
        ],
      },
      { type: "heading", level: 3, text: "📍 Rental properties" },
      {
        type: "paragraph",
        text: "Landlords use 360 tours to **pre-screen tenants** before a physical viewing.",
      },
      { type: "heading", level: 2, text: "The types of 360 tours we offer" },
      { type: "heading", level: 3, text: "Static 360 tour" },
      {
        type: "paragraph",
        text: "A combination of photoreal 3D renders in 360 form. The buyer moves by clicking on points (hotspots) in the space.",
      },
      {
        type: "paragraph",
        text: "**Price:** From **€295 per floor** (10 panoramas + 10 static angles + a floor plan).",
      },
      { type: "heading", level: 3, text: "Interactive 360 tour" },
      {
        type: "paragraph",
        text: "A more advanced version with interactive elements — opening doors, switching lights on, changing materials.",
      },
      {
        type: "paragraph",
        text: "**Price:** On request (delivered through our partner network).",
      },
      {
        type: "heading",
        level: 2,
        text: "The difference between 360 and standard renders",
      },
      {
        type: "table",
        headers: ["", "Static render", "360 render"],
        rows: [
          ["**Interactivity**", "❌", "✅"],
          ["**Time on content**", "10–15 seconds", "3–5 minutes"],
          ["**Buyer's overview**", "One view", "The whole space"],
          ["**Physical viewings**", "100% needed", "40% fewer needed"],
          ["**Price**", "€170 (floor)", "€295 (floor)"],
        ],
      },
      { type: "heading", level: 2, text: "How is a 360 tour created?" },
      {
        type: "heading",
        level: 3,
        text: "If the property exists (photography):",
      },
      {
        type: "paragraph",
        text: "Each room is photographed with a professional 360 camera, and the panoramas are then stitched into an interactive tour using specialised software.",
      },
      {
        type: "heading",
        level: 3,
        text: "If the property does not exist yet (3D render):",
      },
      {
        type: "paragraph",
        text: "We create a complete 3D model of the space, place cameras at the key points, and render each panorama individually. Then we connect them into an interactive tour.",
      },
      { type: "heading", level: 2, text: "Best practices for 360 tours" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Start at the front door** — the natural entry point",
          "**Limit the tour to 8–12 hotspots** — too many options confuse the buyer",
          "**Add a floor plan** — the buyer sees where they are relative to the rest of the space",
          "**Highlight key features** — new kitchen, air conditioning, the view",
          "**Include a CTA** — \"Schedule a viewing\" at the end of the tour",
        ],
      },
      { type: "heading", level: 2, text: "Example: selling a residential building" },
      {
        type: "list",
        items: [
          "**Client:** Investor, new residential complex",
          "**Need:** Show 3 apartment types to potential buyers before construction is finished",
          "**Solution:** 360 tours for each apartment type",
        ],
      },
      { type: "paragraph", text: "**Result:**" },
      {
        type: "list",
        items: [
          "**15% of the apartments sold before construction finished** (pre-selling)",
          "**Physical viewings reduced by 60%**",
          "**Buyers decided faster** — 2 days on average instead of 2 weeks",
        ],
      },
      {
        type: "cta",
        label: "Calculate the price of a 360 tour",
        href: "/pricing",
      },
    ],
  },
  {
    slug: "how-to-choose-a-3d-visualization-studio",
    title: "How to choose the right 3D visualization studio? A client's guide",
    excerpt:
      "How to pick an architectural visualization studio? Comparing portfolios, prices, deadlines and quality — everything you need to know before ordering a 3D render.",
    date: "2026-04-18",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-renders.webp",
    coverAlt:
      "High-quality interior 3D visualization — a living space render example",
    tags: ["Tips", "3D renders"],
    keywords: [
      "how to choose a 3D visualization studio",
      "architectural visualization studio",
      "quality 3D render",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Choosing the right 3D visualization studio can be decisive for the success of your project — whether you are selling a property, presenting a concept to investors or building an architecture firm's brand. A quality render is not just a pretty picture: it carries emotion, represents materials faithfully and helps the buyer make a decision. So how do you know who to trust with the job?",
      },
      { type: "heading", level: 2, text: "Why is choosing a studio not simple?" },
      {
        type: "paragraph",
        text: "The market is full of studios and freelance 3D artists offering similar services — but the results often differ significantly. A poorly made render can:",
      },
      {
        type: "list",
        items: [
          "**Put off potential buyers** — unrealistic materials, bad lighting",
          "**Slow down the sale** — buyers cannot picture the space",
          "**Damage your reputation** — a low-quality presentation of the project",
        ],
      },
      {
        type: "paragraph",
        text: "That is why it matters to know what to look for when choosing.",
      },
      { type: "heading", level: 2, text: "The key selection criteria" },
      { type: "heading", level: 3, text: "1. Portfolio — the first and most important step" },
      {
        type: "paragraph",
        text: "A good studio has a publicly available portfolio with real projects. Pay attention to:",
      },
      {
        type: "list",
        items: [
          "**Variety** — do they do interiors, exteriors, night scenes, 360 tours?",
          "**Consistency** — are all renders at the same level, or does quality vary?",
          "**Real projects** — does the portfolio show *built* spaces, not just design concepts?",
        ],
      },
      {
        type: "quote",
        text: "**Tip:** If a studio has no portfolio, or only retouched previews, that is a red flag.",
      },
      { type: "heading", level: 3, text: "2. Communication and process" },
      { type: "paragraph", text: "A professional studio has a clear process:" },
      {
        type: "list",
        items: [
          "**Consultations** before the work starts",
          "**A brief form** with all the required information",
          "**Iterations** — the number of revisions included in the price",
          "**A delivery deadline** — realistic and transparent",
        ],
      },
      {
        type: "paragraph",
        text: "Elegant Render, for example, offers free consultations before ordering and has a standardised process that includes 2–3 revision iterations per render.",
      },
      { type: "heading", level: 3, text: "3. Technology and tools" },
      {
        type: "paragraph",
        text: "A studio that keeps up with the trends will likely give you a better result:",
      },
      {
        type: "table",
        headers: ["Technology", "Why it matters"],
        rows: [
          ["**Corona Render**", "Photoreal lighting and materials"],
          ["**AI editing**", "Speeds up post-production (Elegant Render AI Studio)"],
          ["**360 tours**", "Interactive presentation for buyers"],
          ["**Virtual staging**", "Helps buyers imagine a furnished space"],
        ],
      },
      { type: "heading", level: 3, text: "4. Transparent prices" },
      {
        type: "paragraph",
        text: "Avoid offers that hide their prices. Quality studios publish an indicative price list:",
      },
      {
        type: "list",
        items: [
          "**Price per render** — from €30 to €200 depending on complexity",
          "**Price per set of angles** — a discount on 3+ renders",
          "**Additional services** — virtual staging, 360 tour, AI editing",
        ],
      },
      {
        type: "paragraph",
        text: "Elegant Render has a **publicly available price list** — you always know what you are getting and at what price.",
      },
      { type: "heading", level: 3, text: "5. Deadlines and flexibility" },
      { type: "paragraph", text: "Check:" },
      {
        type: "list",
        items: [
          "The standard delivery time (usually 3–7 working days)",
          "An express option (if you need it fast)",
          "The possibility of changes and revisions",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Questions to ask before ordering",
      },
      {
        type: "paragraph",
        text: "Before you choose a studio, ask these 7 questions:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Can I see a **complete portfolio** with real projects?",
          "Which **render engine** do you use?",
          "How many **revision iterations** are included?",
          "What is the **delivery deadline** for my project?",
          "Do you do **virtual staging** and at what price?",
          "Do you offer **AI editing** of existing photos?",
          "Do you have a **contract** or business documentation?",
        ],
      },
      { type: "heading", level: 2, text: "Comparison: freelancer vs studio" },
      {
        type: "table",
        headers: ["Criterion", "Freelancer", "Studio (Elegant Render)"],
        rows: [
          ["Portfolio", "Often limited", "Public, varied"],
          ["Process", "Varies", "Standardised"],
          ["Prices", "Changeable", "Transparent"],
          ["Support", "One person", "A team"],
          ["Deadlines", "Depend on availability", "Agreed and kept"],
        ],
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "Choosing the right 3D visualization studio is an investment that pays off. Don't choose on price alone — a quality render can double the interest in your property or project.",
      },
      {
        type: "paragraph",
        text: "If you would like to talk about your project, contact us for a free consultation. We will show you examples, explain the process and give you a quote with no obligations.",
      },
      {
        type: "cta",
        label: "Request a free consultation",
        href: "/contact",
      },
    ],
  },
  {
    slug: "real-estate-photography-best-practices",
    title: "Best practices for photographing real estate before 3D editing",
    excerpt:
      "How to prepare real estate photos for AI editing and 3D visualization? Tips on lighting, framing and resolution used by professionals.",
    date: "2026-04-20",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-photomontage.webp",
    coverAlt: "A real estate photo prepared for 3D editing and AI visualization",
    tags: ["Guide", "Real estate photography"],
    keywords: [
      "real estate photography tips",
      "AI real estate photo editing",
      "preparing photos for 3D visualization",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "A good photo is the foundation of every good 3D visualization. Whether you use AI Studio to edit existing photos or order a full 3D render, **the quality of the input material directly affects the final result**.",
      },
      {
        type: "paragraph",
        text: "In this guide we will show you how to take photos that produce the best editing results.",
      },
      { type: "heading", level: 2, text: "Why does preparation matter?" },
      {
        type: "paragraph",
        text: "Bad photos = a bad result, even with the best AI tools. Problems we see often:",
      },
      {
        type: "list",
        items: [
          "**Blurry photos** — AI cannot add detail that does not exist",
          "**Bad lighting** — too many shadows or a washed-out sky",
          "**Wrong perspective** — skewed walls and lines",
          "**Clutter in the frame** — personal items, cables, tools",
        ],
      },
      {
        type: "paragraph",
        text: "A good source photo means **less rework and a better result**.",
      },
      { type: "heading", level: 2, text: "5 key rules for the shoot" },
      { type: "heading", level: 3, text: "1. Lighting is everything" },
      {
        type: "paragraph",
        text: "Shoot in the **morning or late afternoon** when the light is soft and diffuse. Avoid the midday sun, which creates harsh shadows.",
      },
      {
        type: "list",
        items: [
          "Use **natural light** whenever possible",
          "Turn on **all the lights in the room** for a balanced exposure",
          "Avoid pointing the camera straight into a window",
        ],
      },
      { type: "heading", level: 3, text: "2. A stable camera = a sharp photo" },
      {
        type: "paragraph",
        text: "Use a **tripod** — it is the only way to get perfectly sharp photos. Without one, even the best cameras suffer from micro-movement that causes blur.",
      },
      {
        type: "list",
        items: [
          "ISO: 100–800 (the lower the better)",
          "Shutter speed: at least 1/60 (slower on a tripod)",
          "Aperture: f/8–f/11 for maximum sharpness",
        ],
      },
      { type: "heading", level: 3, text: "3. Correct perspective" },
      {
        type: "paragraph",
        text: "Keep the camera **level both horizontally and vertically**. Photos with skewed lines need extra correction in Photoshop.",
      },
      {
        type: "list",
        items: [
          "Camera height: around 150cm (eye level)",
          "Angle: slightly downward for interiors, straight-on for facades",
          "Avoid **ultra-wide lenses** that create distortion",
        ],
      },
      { type: "heading", level: 3, text: "4. Remove everything unnecessary" },
      {
        type: "paragraph",
        text: "Before you press the shutter, remove:",
      },
      {
        type: "list",
        items: [
          "Personal items (toothbrushes, glasses, papers)",
          "Cables and extension cords",
          "Rubbish and clutter",
          "Mismatched pieces of furniture",
        ],
      },
      {
        type: "quote",
        text: "**Tip:** Make the room look like a showroom — clean, tidy, minimal.",
      },
      { type: "heading", level: 3, text: "5. Resolution and format" },
      {
        type: "paragraph",
        text: "Shoot at the **highest resolution** your camera supports.",
      },
      {
        type: "table",
        headers: ["Parameter", "Recommendation"],
        rows: [
          ["Resolution", "At least 4000px on the long edge"],
          ["Format", "JPEG (quality 95%+)"],
          ["Colours", "sRGB or AdobeRGB"],
          ["Battery", "Two full batteries"],
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "How does AI Studio process your photos?",
      },
      {
        type: "paragraph",
        text: "Elegant Render AI Studio uses advanced AI models for:",
      },
      {
        type: "list",
        items: [
          "**Background removal** — automatic object isolation",
          "**Sky replacement** — a realistic sky for exteriors",
          "**Lighting enhancement** — exposure balancing",
          "**Object removal** — erasing unwanted elements",
        ],
      },
      {
        type: "paragraph",
        text: "The better the source photo, the faster and more natural the AI edit will be.",
      },
      { type: "heading", level: 2, text: "Common mistakes and how to avoid them" },
      {
        type: "table",
        headers: ["Mistake", "Fix"],
        rows: [
          ["Zoomed in too far", "Use a 24–35mm lens"],
          ["Dark shadows", "Add fill light"],
          ["Cropped furniture", "Take a wider frame, crop later"],
          ["Yellow tones", "Set the white balance (daylight mode)"],
        ],
      },
      { type: "heading", level: 2, text: "An example of a good photo" },
      {
        type: "paragraph",
        text: "A good photo for editing should be:",
      },
      {
        type: "list",
        items: [
          "Sharp and stable",
          "Evenly lit",
          "Free of distortion",
          "Of a tidy space",
          "In high resolution",
        ],
      },
      {
        type: "paragraph",
        text: "If you need professional photo editing, Elegant Render AI Studio can turn even average photos into sales material. Send us your photos for editing.",
      },
      {
        type: "cta",
        label: "Send photos for editing",
        href: "/ai-studio",
      },
    ],
  },
  {
    slug: "why-developers-use-3d-visualization-before-construction",
    title: "Why do real estate developers use 3D visualization before construction?",
    excerpt:
      "How pre-construction 3D visualizations help developers sell projects faster, reduce risk and secure financing — with concrete examples and statistics.",
    date: "2026-04-22",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-aerial.webp",
    coverAlt: "Aerial 3D visualization of a residential building, before construction",
    tags: ["Trends", "Real estate sales"],
    keywords: [
      "3D visualization before construction",
      "off-plan property sales",
      "architectural visualization for developers",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "The real estate market is changing. Buyers no longer buy just square metres — they buy a **vision, a style and a way of life**. For developers selling projects before construction (off-plan), 3D visualization has become an indispensable tool.",
      },
      {
        type: "paragraph",
        text: "In this article we explain why more and more investors and developers put money into quality 3D visualizations before a single brick is laid.",
      },
      { type: "heading", level: 2, text: "The advantages of 3D visualization in pre-sales" },
      { type: "heading", level: 3, text: "1. Faster sales without a finished building" },
      {
        type: "paragraph",
        text: "Studies show that properties presented through photoreal 3D visualizations have **up to a 40% faster sales cycle** in the pre-construction phase. Buyers decide more easily when they can **see** what their future home will look like.",
      },
      { type: "heading", level: 3, text: "2. Reduced risk and fewer changes" },
      {
        type: "paragraph",
        text: "Catching a problem at the visualization stage is **50–100x cheaper** than changes on the construction site. Developers can:",
      },
      {
        type: "list",
        items: [
          "Test different facade and material variants",
          "Adjust room layouts before construction",
          "Visually confirm the project matches the brand",
        ],
      },
      { type: "heading", level: 3, text: "3. A stronger marketing campaign" },
      { type: "paragraph", text: "A website with 3D visualizations gets:" },
      {
        type: "list",
        items: [
          "**94% more views** than a page without visual content",
          "An average of **2.5 minutes longer time on page**",
          "A **32% higher conversion rate** (enquiries and reservations)",
        ],
      },
      { type: "heading", level: 3, text: "4. Easier financing" },
      {
        type: "paragraph",
        text: "Banks and investors approve visually presented projects more readily. Professional 3D visualizations demonstrate the developer's seriousness and preparation.",
      },
      { type: "heading", level: 2, text: "How do developers use 3D visualizations?" },
      {
        type: "table",
        headers: ["Use", "Description", "Impact"],
        rows: [
          ["**Sales website**", "Photoreal previews of the project", "More traffic"],
          ["**Brochures and catalogues**", "Professional buyer material", "More trust"],
          ["**Social media**", "Renders for Instagram and Facebook", "Viral reach"],
          [
            "**Investor presentations**",
            "Visualizations for partners and banks",
            "Faster approval",
          ],
          ["**360 virtual tours**", "An interactive walkthrough of the project", "2x more enquiries"],
        ],
      },
      { type: "heading", level: 2, text: "Case study: a concrete example" },
      {
        type: "paragraph",
        text: "A Belgrade-based developer used 3D visualizations to sell a 45-unit residential complex.",
      },
      {
        type: "list",
        items: [
          "**Without 3D visualizations:** 12 reservations in the first 3 months",
          "**With 3D visualizations:** 38 reservations in the following 3 months",
          "**Increase:** 216%",
        ],
      },
      {
        type: "paragraph",
        text: "The investment in visualizations paid for itself 15 times over through faster sales.",
      },
      { type: "heading", level: 2, text: "Which types of visualization are most effective?" },
      { type: "heading", level: 3, text: "Interiors" },
      {
        type: "paragraph",
        text: "Showing the living room, bedroom and kitchen is **the most effective for sales** — buyers most easily imagine themselves in the space.",
      },
      { type: "heading", level: 3, text: "Exteriors and facades" },
      {
        type: "paragraph",
        text: "Night renders with ambient lighting create **an emotional pull**.",
      },
      { type: "heading", level: 3, text: "Master plan and surroundings" },
      {
        type: "paragraph",
        text: "Showing green areas, parking and shared spaces raises the **perceived value of the project**.",
      },
      { type: "heading", level: 3, text: "360 virtual tours" },
      {
        type: "paragraph",
        text: "They let buyers explore the space on their own — the most effective format for **online sales**.",
      },
      { type: "heading", level: 2, text: "Why Elegant Render?" },
      {
        type: "paragraph",
        text: "Developers choose Elegant Render because we offer:",
      },
      {
        type: "list",
        items: [
          "**Photoreal visualizations** built on the Corona Render engine",
          "**Short delivery times** — typically 3–7 working days",
          "**Transparent prices** — you know the cost upfront",
          "**360 tours** for interactive presentation",
          "**AI Studio** for fast editing of existing photos",
        ],
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "3D visualizations are the **standard** today, not a luxury. Developers who invest in quality visualizations before construction sell faster, reduce risk and build trust with buyers.",
      },
      {
        type: "paragraph",
        text: "Would you like to see how we can improve your project's sales? Contact us for a free consultation.",
      },
      {
        type: "cta",
        label: "Request a project consultation",
        href: "/contact",
      },
    ],
  },
  {
    slug: "virtual-staging-styles-2026",
    title: "Virtual staging: the most requested interior styles in 2026",
    excerpt:
      "What are the most popular virtual staging styles in 2026? Minimalism, japandi, wabi-sabi — a guide through the trends with examples for real estate sales.",
    date: "2026-04-24",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtual-staging.webp",
    coverAlt: "Virtually staged interior — a stylishly furnished living space",
    tags: ["Trends", "Virtual staging"],
    keywords: [
      "virtual staging styles",
      "interior styles 2026",
      "virtual apartment furnishing",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Virtual staging is the fastest way to turn an empty or unfurnished space into a dream home. But which styles resonate best with buyers? Which trends dominate in 2026?",
      },
      {
        type: "paragraph",
        text: "In this guide we analyse the most requested virtual staging styles and give recommendations on choosing the right style for your property.",
      },
      { type: "heading", level: 2, text: "Why does the choice of style matter?" },
      {
        type: "paragraph",
        text: "The right virtual staging style can:",
      },
      {
        type: "list",
        items: [
          "**Increase the perceived value** of a property by 10–20%",
          "**Shorten the time to sell** by 30–50%",
          "**Attract a specific target group** of buyers",
        ],
      },
      {
        type: "paragraph",
        text: "The wrong style, on the other hand, can put buyers off or make the space look dated.",
      },
      { type: "heading", level: 2, text: "Top 5 styles for 2026" },
      { type: "heading", level: 3, text: "1. Minimalism with warm accents" },
      {
        type: "paragraph",
        text: "Classic minimalism with added wood, textiles and warm colours. This is the **safest choice** — it appeals to the widest audience.",
      },
      {
        type: "table",
        headers: ["Characteristics", "Best for"],
        rows: [
          ["Light colours, clean lines", "All age groups"],
          ["Wooden details", "Families"],
          ["A neutral palette", "Investors"],
          ["Little furniture, lots of space", "First-time buyers"],
        ],
      },
      { type: "heading", level: 3, text: "2. Japandi" },
      {
        type: "paragraph",
        text: "A fusion of Japanese and Scandinavian design — the **fastest-growing trend** of 2026.",
      },
      {
        type: "list",
        items: [
          "Natural materials (bamboo, linen, stone)",
          "Earthy colours and pastels",
          "Minimal but functional furniture",
          "A focus on calm and balance",
        ],
      },
      {
        type: "paragraph",
        text: "**Best for:** Luxury properties, apartments, holiday homes",
      },
      { type: "heading", level: 3, text: "3. Wabi-sabi" },
      {
        type: "paragraph",
        text: "Embracing imperfection — a style that celebrates natural materials, textures and patina.",
      },
      {
        type: "list",
        items: [
          "Handmade furniture",
          "Uneven surfaces and natural textures",
          "A warm, calming atmosphere",
          "Ceramics and woven materials",
        ],
      },
      {
        type: "paragraph",
        text: "**Best for:** Country houses, farmsteads, rural tourism rentals",
      },
      { type: "heading", level: 3, text: "4. Modern classic" },
      {
        type: "paragraph",
        text: "Classic forms with modern details — the **best-selling style** for investment properties.",
      },
      {
        type: "list",
        items: [
          "Chesterfield sofas, marble side tables",
          "Gold and brass details",
          "A symmetrical furniture arrangement",
          "A neutral base with statement pieces",
        ],
      },
      {
        type: "paragraph",
        text: "**Best for:** City apartments, new builds, family houses",
      },
      { type: "heading", level: 3, text: "5. Biophilic design" },
      {
        type: "paragraph",
        text: "Nature-inspired design — a major trend of the post-covid era.",
      },
      {
        type: "table",
        headers: ["Element", "Effect"],
        rows: [
          ["Indoor plants", "Reduce stress by 30%"],
          ["Natural light", "Increases productivity"],
          ["Earthy colours", "Create a sense of security"],
          ["Natural materials", "Increase property value"],
        ],
      },
      {
        type: "paragraph",
        text: "**Best for:** Apartment buildings with terraces, houses with gardens",
      },
      { type: "heading", level: 2, text: "How to choose the right style?" },
      { type: "heading", level: 3, text: "Factor 1: The target buyer group" },
      {
        type: "table",
        headers: ["Target group", "Recommended style"],
        rows: [
          ["Young couples", "Minimalism"],
          ["Families with children", "Modern classic"],
          ["Retirees", "Wabi-sabi"],
          ["Investors", "Japandi"],
          ["Luxury buyers", "Biophilic"],
        ],
      },
      { type: "heading", level: 3, text: "Factor 2: Location and property type" },
      {
        type: "list",
        items: [
          "**City centre:** Modern classic",
          "**New-build apartments:** Minimalism",
          "**Holiday homes and farmsteads:** Wabi-sabi",
          "**Luxury apartments:** Japandi",
          "**Family houses:** Biophilic",
        ],
      },
      { type: "heading", level: 3, text: "Factor 3: Budget" },
      {
        type: "paragraph",
        text: "Virtual staging is **up to 95% cheaper** than physical furnishing. While physical staging costs €500–3,000 a month plus transport and storage, virtual staging is a one-off investment of €30–150 per render, with no logistics costs.",
      },
      { type: "heading", level: 2, text: "Why virtual staging?" },
      {
        type: "table",
        headers: ["Comparison", "Physical staging", "Virtual staging"],
        rows: [
          ["Cost", "€500–3,000 per month", "€30–150 per view"],
          ["Setup time", "2–7 days", "2–3 working days"],
          ["Flexibility", "One style", "Several styles for the same space"],
          ["Storage", "Required", "Not needed"],
        ],
      },
      { type: "heading", level: 2, text: "Example: the same space in 3 different styles" },
      {
        type: "paragraph",
        text: "One of the advantages of virtual staging is **showing the same space in several styles**. Imagine a living room you can present as:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Minimalist** — for young professionals",
          "**Modern classic** — for a family",
          "**Biophilic** — for nature lovers",
        ],
      },
      {
        type: "paragraph",
        text: "Each style attracts a different target group — all from the same base render.",
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "In 2026, virtual staging is not just an option — it is the **standard**. Whether you are selling a city-centre apartment or a house in the countryside, the right style can be the deciding factor for the buyer.",
      },
      {
        type: "paragraph",
        text: "Elegant Render offers virtual staging in all the current styles. Send us a floor plan and photos — we will show you how your space can look in the style that sells best.",
      },
      {
        type: "cta",
        label: "Explore virtual staging",
        href: "/services/virtual-staging",
      },
    ],
  },
  {
    slug: "how-to-prepare-cad-drawings-for-3d-visualization",
    title: "How to prepare CAD drawings for 3D visualization? A guide for architects",
    excerpt:
      "How to prepare CAD, Revit or SketchUp files for 3D visualization? A complete guide for architects — formats, tips, level of detail and a checklist.",
    date: "2026-04-26",
    updated: "2026-07-23",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-renders.webp",
    coverAlt:
      "Photoreal exterior 3D render of a modern villa with a pool in golden light",
    tags: ["Guide", "3D renders"],
    keywords: [
      "preparing CAD drawings for 3D",
      "files for 3D visualization",
      "architectural drawings for rendering",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "A good 3D visualization starts with **good input data**. As an architect or designer, you play a key role — the quality of the CAD drawings you send to the studio directly affects the speed, price and quality of the final render.",
      },
      {
        type: "paragraph",
        text: "In this guide we explain how to prepare your files so the 3D artist gets everything they need.",
      },
      { type: "heading", level: 2, text: "Why does file preparation matter?" },
      {
        type: "paragraph",
        text: "Incomplete or non-standard documentation leads to:",
      },
      {
        type: "list",
        items: [
          "**Extra iterations** — more time and cost",
          "**Misinterpretations** — the render does not match the design",
          "**Longer deadlines** — documentation gets requested after the fact",
          "**Higher prices** — the studio bills the extra time",
        ],
      },
      {
        type: "paragraph",
        text: "Good preparation cuts costs by **20–40%** and speeds up the process by **30–50%**.",
      },
      { type: "heading", level: 2, text: "6 steps to perfect preparation" },
      { type: "heading", level: 3, text: "Step 1: Choose the right format" },
      {
        type: "table",
        headers: ["Format", "Recommendation"],
        rows: [
          ["**DWG/DXF** (AutoCAD)", "✅ Best — all dimensions and layers"],
          ["**RVT** (Revit)", "✅ Contains BIM data"],
          ["**SKP** (SketchUp)", "✅ If the model is detailed"],
          ["**PDF**", "❌ For orientation only"],
          ["**Images (JPEG/PNG)**", "❌ Not precise enough"],
        ],
      },
      {
        type: "paragraph",
        text: "**Recommendation:** DWG is the universal standard that every 3D studio supports.",
      },
      { type: "heading", level: 3, text: "Step 2: Organise the layers" },
      {
        type: "paragraph",
        text: "Well organised layers are the **most important** part of the preparation. We expect:",
      },
      {
        type: "table",
        headers: ["Layer", "What it contains"],
        rows: [
          ["Walls (load-bearing)", "Concrete, block, brick"],
          ["Walls (partitions)", "Drywall, glass"],
          ["Floors", "Levels, materials"],
          ["Ceilings", "Suspended, flat"],
          ["Joinery", "Windows, doors"],
          ["Furniture", "Fixed elements"],
          ["Installations", "Electrical, plumbing"],
          ["Dimensions", "Dimension lines"],
        ],
      },
      {
        type: "quote",
        text: "**Tip:** Clean the drawing of unnecessary layers (grid lines, notes, construction lines).",
      },
      { type: "heading", level: 3, text: "Step 3: Define the materials" },
      {
        type: "paragraph",
        text: "List the materials for every surface. The easiest ways:",
      },
      {
        type: "list",
        items: [
          "**In the DWG drawing:** Write the material on each surface (e.g. \"oak parquet\", \"ceramic tile 60x60\")",
          "**In a separate document:** An Excel list of rooms and materials",
          "**References:** Send 1–3 images per material (a reference, not an exact match)",
        ],
      },
      { type: "heading", level: 3, text: "Step 4: Provide site photos" },
      {
        type: "paragraph",
        text: "If we are working on an existing building, send photos of:",
      },
      {
        type: "list",
        items: [
          "**All rooms** from several angles",
          "**The exterior** of the building",
          "**The surroundings** — neighbouring buildings, the street",
          "**Details** — moulding profiles, handrails, radiators",
        ],
      },
      {
        type: "paragraph",
        text: "Photos help the 3D artist understand the **spatial relationships** and the **existing condition**.",
      },
      { type: "heading", level: 3, text: "Step 5: Define the camera angles" },
      {
        type: "paragraph",
        text: "Specify precisely which angles should be rendered:",
      },
      {
        type: "list",
        items: [
          "**A floor plan with camera markers** — angle and direction of view",
          "**Camera height** — typically 150–170cm",
          "**Type of shot** — wide, medium, detail",
        ],
      },
      { type: "paragraph", text: "An example of a good specification:" },
      {
        type: "quote",
        text: "\"Camera 1 — living room, wide shot from the front-door corner, height 160cm, showing the whole space\"",
      },
      { type: "heading", level: 3, text: "Step 6: Provide a moodboard" },
      {
        type: "paragraph",
        text: "A moodboard with references helps the 3D artist capture your **vision**:",
      },
      {
        type: "list",
        items: [
          "3–5 reference images of the desired style",
          "A colour palette (you can use Adobe Color or Coolors)",
          "Lighting examples (daylight/artificial/ambient)",
        ],
      },
      { type: "heading", level: 2, text: "File submission checklist" },
      {
        type: "paragraph",
        text: "Before sending your files to the studio, run through this list:",
      },
      {
        type: "list",
        items: [
          "DWG files are cleaned and organised",
          "All layers are properly named",
          "Materials are noted on the drawing",
          "Material reference images are attached",
          "Camera angles are defined",
          "A moodboard or style guide is attached",
          "Photos of the existing condition are provided (for reconstructions)",
          "The deadline and expectations are clearly stated",
        ],
      },
      { type: "heading", level: 2, text: "The most common mistakes" },
      {
        type: "table",
        headers: ["Mistake", "Consequence", "How to avoid it"],
        rows: [
          ["Too much detail", "Slow file loading", "Filter the layers"],
          ["Too little information", "Misinterpretation", "Use the checklist"],
          ["Old formats", "Poor compatibility", "DWG 2018+"],
          ["No references", "Lost time", "5 reference images"],
        ],
      },
      { type: "heading", level: 2, text: "How do we work at Elegant Render?" },
      { type: "paragraph", text: "Our process is simple:" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Send the CAD drawings** — via the form on the site or by email",
          "**Consultations** — we clarify the details and needs",
          "**Quote** — you get the price and deadline within 24h",
          "**Modelling** — the 3D model and camera setup",
          "**Rendering** — the photoreal visualization",
          "**Revisions** — 2–3 iterations included in the price",
        ],
      },
      { type: "heading", level: 2, text: "Conclusion" },
      {
        type: "paragraph",
        text: "Well prepared CAD drawings are **the ticket to a first-class 3D visualization**. Invest a little time in organising your files and save time, money and nerves — your 3D studio will thank you.",
      },
      {
        type: "paragraph",
        text: "Have CAD drawings ready for visualization? Send them over — we will give you a quote within 24 hours.",
      },
      { type: "cta", label: "Send CAD drawings", href: "/contact" },
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
