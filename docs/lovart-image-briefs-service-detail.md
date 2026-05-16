# Service detail pages — image briefs for lovart.ai

Working document for generating **16 hero images** (4 single shots + 6 before/after pairs × 2) that will sit at the top of each `/usluge/[slug]` detail page. The detail page is the bottom-of-funnel surface — the visitor is reading about one specific service and is closest to converting — so the hero must do the heaviest visual lift.

> **360 ture i animacije** does NOT need an image. The detail page uses the same Kuula 360 iframe embed as the home picker (different collection ID this time — see §5).

---

## 1. Why this set is different from the home-page expert set

Home-page hero cards (`/artwork/expert-*.webp`) are **3:2 thumbnails (1600×1067)** designed to read inside a small "Minimalni ulaz" preview card alongside the picker. They are the appetizer.

Detail-page heroes are the **main course**: full-width, immersive, the first thing a visitor reads on the page they landed on from search or from the picker. They need:
- Wider **16:9 (1920×1080)** format, designed to span the content column
- More dramatic composition (deeper depth-of-field, stronger leading lines, more confident lighting)
- A single decisive image per slot — not a "card thumbnail" feel

Same brand voice as the AI Studio brief (Sotheby's / Christie's listing tier, Belgrade penthouses + Adriatic villas + Hamptons-modern principal residences), but **bigger, more cinematic** since these images carry the page alone.

---

## 2. Technical specifications (apply to every image)

| Parameter | Value |
|---|---|
| **Dimensions** | **1920 × 1080 px** (16:9 aspect ratio) |
| Output format | WebP, sRGB, quality 85 |
| Mobile crop | Container reduces to a similar aspect on mobile (no major crop); keep key composition within central 90% of frame |
| Naming convention | `detail-{slug}.webp` for singles · `detail-{slug}-before.webp` + `detail-{slug}-after.webp` for pairs |
| Path | Drop into `public/artwork/` |
| Aspect for pairs | **Identical frame** — same camera position, same zoom, same lighting on unchanged elements. The transformation is only what the service literally does. |

**Naming map (service slug):**

| Service (UI label) | Slug | Type | Paths |
|---|---|---|---|
| Unutrašnji renderi | `unutrasnji-renderi` | Single | `detail-unutrasnji-renderi.webp` |
| Spoljašnji renderi | `spoljasnji-renderi` | Single | `detail-spoljasnji-renderi.webp` |
| 2D i 3D osnove | `osnove` | Single | `detail-osnove.webp` |
| Situacioni planovi | `3d-situacioni` | Single | `detail-3d-situacioni.webp` |
| 360 ture i animacije | `360-ture-i-animacije` | iframe (no image) | — |
| Virtuelno opremanje | `virtuelno-opremanje` | Pair | `detail-virtuelno-opremanje-before.webp` + `-after.webp` |
| Virtuelna renovacija | `virtuelna-renovacija` | Pair | `detail-virtuelna-renovacija-before.webp` + `-after.webp` |
| Uređenje pejzaža | `prikazi-dvorista` | Pair | `detail-prikazi-dvorista-before.webp` + `-after.webp` |
| Fotomontaža | `fotomontaza` | Pair | `detail-fotomontaza-before.webp` + `-after.webp` |
| Dnevni u noćni prikaz | `dan-u-noc` | Pair | `detail-dan-u-noc-before.webp` + `-after.webp` |
| Uklanjanje predmeta | `uklanjanje-elemenata` | Pair | `detail-uklanjanje-elemenata-before.webp` + `-after.webp` |

---

## 3. Global style (append to every prompt)

```
Style: cinematic high-end real estate hero photography in the style of 
Architectural Digest, Sotheby's International Realty, or Wallpaper* 
property features. Captured on a medium-format mirrorless camera 
(Hasselblad X2D / Fujifilm GFX feel) with a 24mm tilt-shift lens — 
perfectly corrected verticals, zero distortion, deliberate professional 
composition. Natural daylight as the primary source, balanced by subtle 
warm interior or landscape fill where appropriate. Color grading is 
restrained and editorial: warm neutrals, off-white walls, walnut and oak 
wood, marble accents, brushed brass hardware, deep sage and forest 
green, soft clay terracotta, ink and charcoal tones. Properties depicted 
are upmarket: Belgrade penthouses, Adriatic coastal villas, modern 
Hamptons-style principal residences. No people in frame. No text, logos, 
watermarks, UI elements. Aspect ratio 16:9 (1920×1080). Cinematic depth, 
not flat — give the image atmosphere.
```

**Difference from the home-page expert brief and the AI Studio brief:** the previous two briefs targeted card-sized framing. This brief targets **page-hero framing** — bigger, more confident, more cinematic. Where the home card might show "a nice interior corner," the detail hero shows "the entire scene as a confident editorial spread."

---

## 4. Single hero images (4 images)

### 4.1 Unutrašnji renderi → `detail-unutrasnji-renderi.webp`

**What it shows:** The full living area of a Belgrade penthouse from a wide cinematic angle. Strong window of natural light on one side, full architectural depth visible (you can see ceiling, floor, far wall, side walls). Designer-quality finishes throughout.

**Prompt:**
```
Belgrade penthouse open-plan living area, captured wide on a 24mm 
tilt-shift lens, cinematic eye-level shot from one corner showing the 
full depth of the room. Floor-to-ceiling windows along the right wall 
revealing a soft afternoon skyline view, sheer linen drapes catching the 
light. Bouclé sectional sofa in soft ivory facing a low travertine 
coffee table. Walnut floor-to-ceiling built-in bookshelves on the back 
wall framing a large abstract canvas. Wide-plank European oak floor. 
Custom plaster ceiling with subtle cove lighting. A sculptural floor 
lamp in blackened steel and a low walnut credenza with a single ceramic 
vessel anchor the foreground. Warm golden afternoon light, deep cinematic 
depth-of-field. [+global style]
```

---

### 4.2 Spoljašnji renderi → `detail-spoljasnji-renderi.webp`

**What it shows:** A complete contemporary family villa exterior shot from a slightly elevated wide angle, showing the full architectural composition with surrounding landscape context — entry, main facade, and approach.

**Prompt:**
```
Contemporary two-story luxury villa exterior, captured wide on a 24mm 
tilt-shift lens, eye-level three-quarter view from across a manicured 
front garden. Travertine and walnut-clad architecture with deep 
architectural overhangs, floor-to-ceiling glass curtain walls revealing 
warmly lit interiors, white limestone base, dark blackened-steel 
window frames. Custom pivot front door in walnut. Mature olive trees 
framing the entrance, paved limestone walkway leading to the door, 
manicured lawn with low ornamental grasses. Late afternoon golden hour 
light raking across the facade, soft long shadows. Restrained 
Mediterranean sky with subtle painterly clouds. Cinematic atmosphere, 
no people, no cars. [+global style]
```

---

### 4.3 2D i 3D osnove → `detail-osnove.webp`

**What it shows:** A premium top-down 3D floor plan of a multi-room apartment, finished to the standard of a developer's investor brochure. Visible furnishings, materials, slight isometric tilt for depth.

**Prompt:**
```
Premium 3D architectural floor plan of a modern 95m² three-bedroom 
apartment, captured top-down with a subtle 12-degree isometric tilt to 
add depth. Fully furnished and styled: open-plan living/dining with 
ivory bouclé sofa, low walnut coffee table, dining table with four 
chairs, designer kitchen with marble island, primary bedroom with 
king bed and walnut nightstands, second bedroom with sleek desk and 
art, third bedroom configured as a study, ensuite bathroom with 
walk-in shower. Light European oak floors throughout, white walls 
sectioned at half-height so the plan reads cleanly. Soft even daylight 
from above, no harsh shadows. Slim hairline outline around walls. 
Investor-brochure aesthetic, no labels, no measurements, no UI 
elements. [+global style]
```

---

### 4.4 Situacioni planovi → `detail-3d-situacioni.webp`

**What it shows:** A cinematic aerial 3D render of a small luxury residential masterplan — multiple buildings, courtyard, landscaping, paving, access roads — captured from drone height at a dramatic angle.

**Prompt:**
```
Aerial 3D render of a small luxury residential complex masterplan, 
captured from drone elevation at a dramatic 50-degree angle. Three 
to four contemporary two-story buildings clad in travertine and 
walnut, arranged around a central landscaped courtyard with mature 
deciduous trees, paved limestone walkways, lawn strips, low ornamental 
grasses. Underground parking entry hidden in the foreground. 
Architectural-quality terrain modeling with subtle topographic 
variation. Surrounding context: lower-density suburban buildings 
softly out of focus, peripheral context simplified. Late morning sun 
casting confident long shadows from the buildings across the courtyard. 
Cinematic depth, investor-brochure quality. [+global style]
```

---

## 5. Before/After pairs (6 pairs = 12 images)

**Critical for every pair:** identical frame, identical zoom, identical lighting on unchanged elements. The transformation is the entire visual payoff of the reveal slider.

---

### 5.1 Virtuelno opremanje
Paths: `detail-virtuelno-opremanje-before.webp` + `detail-virtuelno-opremanje-after.webp`

**Concept:** Empty open-plan kitchen + dining of a luxury new-build apartment, captured wide → the same space fully designer-staged. Different scene from the home brief (which used a kitchen-only frame); detail wants the wider editorial.

**Before prompt:**
```
Empty open-plan kitchen and dining area of a luxury new-build 
apartment, captured wide on a 24mm tilt-shift lens, eye-level shot 
from one corner showing the full depth. Bespoke walnut cabinetry with 
integrated appliances, Calacatta marble waterfall island, brushed brass 
tap, exposed concrete ceiling with track lighting, large factory-style 
black-framed window on the back wall opening to a city view. Wide-plank 
European oak floor. Completely empty — no stools at the island, no 
dining table, no decor, no rugs, no art. Beautiful architectural shell 
but visually cold and unfinished. Bright but flat afternoon daylight 
from the back window. [+global style]
```

**After prompt** (same frame):
```
The exact same kitchen + dining space, same camera angle and unchanged 
architectural lighting as the previous image — now fully designer-
staged for a developer marketing shoot. Three sculptural walnut-and-
leather counter stools at the island. Round travertine dining table 
in the foreground with four ivory bouclé dining chairs, a low brass 
candleholder centerpiece, and a small Murano-glass vase with 
eucalyptus. Oversized abstract canvas above a low walnut credenza on 
the back wall. Soft hand-knotted wool rug grounding the dining table. 
A few intentional objects on the island: a styled wooden cutting board 
with rustic bread, a ceramic bowl of citrus, a single brass pepper 
mill. Warm pendant lights softly on. Magazine-grade, believable, 
not over-styled. [+global style]
```

---

### 5.2 Virtuelna renovacija
Paths: `detail-virtuelna-renovacija-before.webp` + `detail-virtuelna-renovacija-after.webp`

**Concept:** Dated 90s primary bedroom suite → contemporary boutique-hotel suite in the same footprint. Detail brief uses a full bedroom (the AI brief used a bathroom, the home brief used a kitchen — three different rooms across the three briefs to vary the visual library).

**Before prompt:**
```
Dated 1990s primary bedroom suite, real estate listing photograph 
awaiting renovation. 24mm tilt-shift camera, eye-level wide shot from 
the suite entrance showing the full depth. Heavy oak king bed frame 
with brass detailing, dated floral-pattern bedding in muted pinks and 
greens, oak nightstands with brass-and-ceramic table lamps, large 
sliding mirror-front wardrobe on the right wall reflecting the room, 
beige Berber carpet, off-white textured wall paint with visible age, 
yellowed crown molding, fluorescent overhead fixture. Heavy floral 
curtains over a window on the back wall partially drawn. Clean but 
visibly 30+ years behind, depressingly tired. [+global style]
```

**After prompt** (same frame):
```
The exact same bedroom suite — same wall positions, same window 
location, same camera angle as the previous image — fully renovated 
to a contemporary boutique-hotel standard. Wide-plank European white-
oak floor replaces the carpet. Walls finished in soft warm plaster, 
custom plaster ceiling with subtle cove lighting replacing the 
fluorescent. King platform bed in low walnut frame centered against 
the same back wall, dressed in crisp ivory linen with a folded 
textured sage throw. Slim walnut nightstands with low brass-and-
alabaster table lamps. Built-in walnut wardrobe replacing the sliding 
mirror unit, with brushed-brass handles. Linen drapes pulled back at 
the window. Calm, restrained, magazine-feature quality. Same window 
light. [+global style]
```

---

### 5.3 Uređenje pejzaža
Paths: `detail-prikazi-dvorista-before.webp` + `detail-prikazi-dvorista-after.webp`

**Concept:** Bare backyard of a luxury property → designer-landscaped garden with stone pathways, mature planting, a small pavilion structure. Wider editorial frame than the home brief (which used a smaller suburban yard).

**Before prompt:**
```
Bare large backyard of a luxury property, captured wide on a 24mm 
tilt-shift lens, slightly elevated shot from an upper patio looking 
outward (about 8-foot camera height). Roughly 25×15 meters of empty 
ground: patchy dry grass, exposed soil patches, weed clusters. Bare 
concrete retaining wall along the back. No paths, no plants, no 
furniture, no pavilion. Neutral overcast lighting. The villa visible 
in the foreground edges (low part of a travertine wall, suggesting 
the rest of the house exists out of frame). Empty potential. 
[+global style]
```

**After prompt** (same frame):
```
The exact same backyard from the exact same camera angle and lighting 
as the previous image — now fully designer-landscaped. Curved stone-
paver pathway leading from the foreground through to a small 
freestanding garden pavilion in the back-right (walnut-and-blackened-
steel pergola structure with a single woven outdoor sofa underneath). 
Well-trimmed dense green lawn on either side of the path. Raised 
limestone planter beds on the right with lavender, ornamental grasses, 
and a small olive tree. Mature ornamental Japanese maple in the back-
left corner. Soft uplighting just visible on the pavilion. Late 
afternoon warm light. Sophisticated, achievable, designer-Mediterranean 
sensibility. Same villa edge in the foreground unchanged. [+global style]
```

---

### 5.4 Fotomontaža
Paths: `detail-fotomontaza-before.webp` + `detail-fotomontaza-after.webp`

**Concept:** Wide architectural photograph of an empty premium hillside lot → the same lot with a 3D-rendered contemporary villa seamlessly photo-integrated.

**Before prompt:**
```
Wide architectural photograph of an empty premium hillside building 
lot, captured on a 24mm tilt-shift lens at eye level from across the 
access road. The lot sits cleared and graded but empty: bare leveled 
earth, a few sparse weeds, low rough stone retaining walls along the 
edges. Adjacent context: upmarket existing neighbors visible at 
distance on either side (modern villas, soft and out of focus), 
mature Mediterranean cypress trees framing the lot edges. Distant 
view beyond: rolling hills, soft hazy horizon. Bright early-afternoon 
light, mostly clear sky with subtle layered cirrus clouds. Real 
documentary photograph feel, no architectural rendering visible on 
the lot itself. [+global style]
```

**After prompt** (same frame):
```
The exact same hillside lot, same camera angle and same lighting as 
the previous image — but now a contemporary luxury villa is photo-
realistically inserted on the lot. The villa: two-story, travertine 
and walnut-clad facade, deep architectural overhangs, floor-to-ceiling 
glass curtain walls catching the daylight, dark blackened-steel window 
frames, custom walnut pivot front door at the entry. Paved limestone 
driveway leading to a low entry portico. Mature olive trees flanking 
the entrance. The villa integrates seamlessly: matching sun angle and 
shadow direction with the existing photograph, matching color 
temperature with the neighboring buildings and sky, matching scale 
relative to the surrounding context. The photograph looks like the 
villa has always been there. [+global style]
```

---

### 5.5 Dnevni u noćni prikaz
Paths: `detail-dan-u-noc-before.webp` + `detail-dan-u-noc-after.webp`

**Concept:** Luxury villa exterior at midday → the same villa at blue hour with warm interior glow everywhere, landscape uplighting, pool glowing. Editorial-grade nightfall transformation.

**Before prompt:**
```
Contemporary luxury villa exterior, premium architectural photograph. 
24mm tilt-shift camera, front-three-quarter wide view from a manicured 
approach drive at slight elevation. Travertine and walnut-clad 
architecture, deep architectural overhangs, floor-to-ceiling glass 
curtain walls, infinity-edge pool just visible on the side, mature 
olive trees framing the entrance, custom blackened-steel pivot front 
door. Manicured low-grass landscape and stone path. Bright midday 
daylight, faintly hazy sky, clean soft shadows. The villa interior 
is unlit — windows read as dark glass reflecting the day. Pool sits 
flat and unlit. Architectural Digest aesthetic. [+global style]
```

**After prompt** (same frame):
```
The exact same villa, same camera angle and architectural lighting 
on the facade as the previous image — now captured at blue hour. The 
sky is a deep indigo-to-amber gradient, with a soft band of warm 
horizon glow behind the villa. Every interior light is softly on: 
warm 2700K glow spilling through the floor-to-ceiling glass curtain 
walls, accent lights grazing the travertine cladding from below, 
integrated landscape lighting along the drive and around the olive 
trees, custom warm light at the pivot front door. The pool glows from 
within with subtle turquoise uplighting, casting reflected ripples on 
the facade. Subtle warm puddle of light on the limestone path. 
Cinematic, aspirational, magazine-cover quality, end-of-day. 
[+global style]
```

---

### 5.6 Uklanjanje predmeta
Paths: `detail-uklanjanje-elemenata-before.webp` + `detail-uklanjanje-elemenata-after.webp`

**Concept:** Beautifully designed but lived-in living room with the daily clutter of an inhabited home → the same room cleaned for listing photography. Wider editorial frame than the home brief (which used a smaller room corner).

**Before prompt:**
```
Designed and lived-in living room of a luxury property, real estate 
context photograph. 24mm tilt-shift camera, wide eye-level shot from 
the room entrance showing full room depth. The room itself is 
beautifully designed: walnut-floored, white-plaster walls, oversized 
ivory bouclé sectional sofa, low travertine coffee table, abstract 
canvas above a built-in walnut bookshelf, large floor-to-ceiling 
window pouring soft daylight in. But it is clearly lived-in: scattered 
shoes by the entry, jackets draped over a side chair, opened books 
and magazines stacked on the coffee table, a folded laundry basket 
on the sofa, a child's stuffed animal on the floor, a half-empty 
ceramic mug and a few unopened envelopes on the side table, throw 
blankets crumpled, a tablet face-down on the rug. Otherwise stunning. 
[+global style]
```

**After prompt** (same frame):
```
The exact same living room from the exact same camera angle and 
lighting as the previous image — with all daily clutter digitally 
removed for listing photography. Floor is clean: no shoes, no toys, 
no jackets. Coffee table empty except a single styled centerpiece 
(low ceramic vessel with a sprig of eucalyptus and a single hardcover 
art book). Side table empty except a small brass cup with a candle. 
Sofa scatter-cushions plumped and aligned, throw blanket folded 
neatly. Laundry basket gone, tablet gone, envelopes gone, mug gone. 
The beautiful designed room is now listing-ready, calm, magazine-
grade. Same furniture, same lighting, same composition — just 
restored to "show home" condition. [+global style]
```

---

## 6. Repository wiring after upload

The detail page (`src/app/(marketing)/usluge/[slug]/page.tsx`) is wired ahead of time to render whichever of these fields is present on the service catalog entry:

```ts
// Priority chain (same as home picker):
// detailBeforeAsset + detailAfterAsset → <BeforeAfterReveal>
// else detailEmbedSrc → <iframe>
// else detailAsset → <Image>
// else nothing
```

Once the WebPs are dropped into `public/artwork/`, the wiring in `src/lib/catalog/services.ts` is a one-liner per service — e.g. for `unutrasnji-renderi`:

```ts
detailAsset: "/artwork/detail-unutrasnji-renderi.webp",
```

For pairs (e.g. `virtuelno-opremanje`):

```ts
detailBeforeAsset: "/artwork/detail-virtuelno-opremanje-before.webp",
detailAfterAsset: "/artwork/detail-virtuelno-opremanje-after.webp",
```

For 360 ture i animacije, `detailEmbedSrc` is set to the new Kuula collection (`7kLnB`) by the same commit that lands this brief — no upload needed.

**Tell me "detail images for X are up"** when you drop a batch, I'll convert any PNGs to WebP (if needed), populate the catalog fields in one commit, type-check, push.

---

## 7. Lovart workflow tips (this set specifically)

- **Use the same seed within each pair** — even more critical at 16:9 than at 3:2 because the larger frame amplifies any misalignment.
- **The detail set is more cinematic.** If lovart drifts toward "card-thumbnail" framing, append: `cinematic editorial composition, deep architectural depth, magazine spread quality, not a thumbnail`.
- **Composition watch-out:** at 16:9 the mobile crop is minimal (browsers reduce container width but keep aspect close), so the **edges of the frame matter**. Avoid placing key elements right at the edges — keep a 5-10% safe zone.
- **For single heroes (4 images):** these carry the page alone. Be willing to regenerate 3-4 times to find the strongest composition before settling.
- **For pairs (6 × 2):** the after image is the conversion driver. Spend extra time confirming it sells the transformation cleanly.

---

## 8. TL;DR

- **16 detail-page hero images** (4 single + 6 pairs) at `public/artwork/detail-{slug}.webp` (or `-before.webp` + `-after.webp` for pairs)
- **1920×1080 (16:9)**, WebP, q85, Sotheby's-tier cinematic editorial framing
- **360 ture i animacije** uses the new Kuula iframe (`7kLnB`) — no image upload needed
- After upload → I'll patch the catalog fields in one commit, push, and the detail pages start showing the heroes immediately
