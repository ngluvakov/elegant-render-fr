# /usluge listing — image briefs for lovart.ai

Working document for generating **23 images** that refresh the `/usluge` listing page:
- **1 hero showcase pair** (16:9) that drives the new auto-animating diagonal-reveal slider at the top of the page
- **9 single 4:3 cards** for services that deliver a product (renders, plans, animations, 360 tours, aerial)
- **6 before/after card pairs** for transformation services (staging, renovation, day-to-dusk, item removal, landscape, photomontage) — these need both states so the customer can see the value at a glance
- **1 iframe card** for 360° enterijeri (already uses Kuula embed — no image)

**Why the transformation cards need pairs:** a single "after" shot of Uklanjanje predmeta shows a beautiful dining room — but the customer can't tell what we did. They see "nice room," not "we removed the clutter." Same for staging, renovation, day-to-dusk: the value of the service is the delta, not the end state. A small per-card reveal slider (mouse-tracked, same component as the AI Studio tool picker cards) makes the transformation legible without auto-animating six sliders at once.

> **Positioning:** the listing page is **top-of-funnel** — the prospect arrives from search or homepage and decides whether we're worth their time within the first scroll. Imagery has to do the heaviest single lift on the site. Same upmarket Sotheby's-tier voice as detail + AI Studio briefs, but each card needs to **earn its position in a 4-column grid** by being visually distinct from its neighbors.

---

## 1. Surface map

- **Hero showcase slider** (NEW): one 16:9 before/after pair (1920×1080). Auto-animates from 0% → 50% diagonal when scrolled into view, hover-to-100% on desktop, scroll-driven on mobile. Replaces the existing 4-card "Pre i posle" static grid.
- **Service grid — single cards** (9 cards in 4:3, 1200×900): for product-delivery services (renders, plans, animations, 360 tour, aerial). One still image per card.
- **Service grid — before/after card pairs** (6 cards × 2 = 12 images in 4:3, 1200×900 each): for transformation services. Renders a small mouse-tracked diagonal reveal (same component as the AI Studio tool picker cards on `/ai-studio`).
- **360° enterijeri card**: stays as a Kuula iframe (no image).

---

## 2. Technical specifications

| Parameter | Value |
|---|---|
| Hero showcase pair dimensions | **1920×1080 px** (16:9) |
| Service grid card dimensions | **1200×900 px** (4:3) — both single cards and before/after pair cards |
| Output format | WebP, sRGB, quality 85 |
| Naming — hero showcase | `listing-showcase-before.webp` + `listing-showcase-after.webp` |
| Naming — single grid cards | `listing-{slug-or-variant}.webp` (see naming map) |
| Naming — pair grid cards | `listing-{slug-or-variant}-before.webp` + `-after.webp` (see naming map) |
| Path | Drop into `public/artwork/` |
| Mobile crop | Cards stay 4:3 on mobile; hero showcase keeps 16:9. Keep key elements within central 90% of frame. |
| Pair frame discipline (hero + cards) | **Identical frame** for every before/after pair (same camera position, same zoom, same lighting on unchanged elements). The transformation is the entire visual payoff of the reveal. |

---

## 3. Naming map — grid cards (9 single + 6 pairs = 21 images) + showcase pair (2) + iframe (0) = **23 images total**

| # | Card label (UI) | Type | Files |
|---|---|---|---|
| 1 | Unutrašnji renderi | single | `listing-interior-static.webp` |
| 2 | 360° enterijeri | iframe | — (no image) |
| 3 | Spoljašnji renderi | single | `listing-exterior-static.webp` |
| 4 | 360° eksterijeri | single | `listing-exterior-360.webp` |
| 5 | Prikaz iz vazduha | single | `listing-exterior-aerial.webp` |
| 6 | Uređenje pejzaža | **pair** | `listing-landscape-before.webp` + `-after.webp` |
| 7 | Fotomontaža | **pair** | `listing-photomontage-before.webp` + `-after.webp` |
| 8 | 3D osnove prostora | single | `listing-floorplan-3d.webp` |
| 9 | 2D osnove prostora | single | `listing-floorplan-2d.webp` |
| 10 | 3D site planovi | single | `listing-siteplan.webp` |
| 11 | Arhitektonske animacije | single | `listing-animation.webp` |
| 12 | 360 ture | single | `listing-tour-360.webp` |
| 13 | Virtuelno opremanje | **pair** | `listing-staging-before.webp` + `-after.webp` |
| 14 | Virtuelna renovacija | **pair** | `listing-renovation-before.webp` + `-after.webp` |
| 15 | Dnevni u noćni prikaz | **pair** | `listing-day-to-dusk-before.webp` + `-after.webp` |
| 16 | Uklanjanje elemenata | **pair** | `listing-item-removal-before.webp` + `-after.webp` |

Plus the showcase pair (hero):
- `listing-showcase-before.webp` (1920×1080)
- `listing-showcase-after.webp` (1920×1080)

**Total: 23 new images** (1 hero pair = 2 + 9 single cards + 6 card pairs = 12 + 0 for iframe).

---

## 4. Global style (append to every prompt)

```
Style: high-end real estate listing photography in the style of 
Sotheby's International Realty, Christie's listings, or Architectural 
Digest. Captured on a medium-format mirrorless camera (Hasselblad X2D / 
Fujifilm GFX feel) with a 24mm or 35mm tilt-shift lens — perfectly 
corrected verticals, zero distortion, professional composition. Natural 
daylight as the primary source, balanced by subtle interior or 
landscape fill where appropriate. Magazine-grade color grading: warm 
neutrals, off-white walls, walnut and oak wood, marble accents, 
brushed brass hardware, deep sage and forest green, soft clay 
terracotta, ink and charcoal tones. Properties depicted are upmarket: 
Belgrade penthouses, Adriatic coastal villas, modern Hamptons-style 
principal residences. No people in frame. No text, logos, watermarks, 
UI elements. Cards: aspect ratio 4:3 (1200×900). Showcase pair: aspect 
ratio 16:9 (1920×1080). Each card must read as visually distinct from 
its grid neighbors.
```

---

## 5. Hero showcase pair (1920×1080)

The most important pair on the listing — it's what drives the auto-animating slider that grabs the visitor on first scroll. Pick the **strongest single transformation** in our service catalog: virtual renovation of a dated bathroom into a contemporary spa-grade ensuite. Bigger visual delta than staging (which just adds furniture); more emotional than landscaping. Plus the bathroom format works at 16:9.

### 5.1 Listing showcase pair → `listing-showcase-{before,after}.webp`

**Concept:** Dated 80s primary ensuite bathroom of a property awaiting renovation → the same bathroom transformed to a contemporary spa-grade ensuite. Same footprint, dramatic material lift.

**Before prompt:**
```
Dated 1980s primary ensuite bathroom in a luxury property awaiting 
renovation, captured wide on a 24mm tilt-shift lens at eye level from 
the doorway. The full room visible in 16:9: salmon-pink large-format 
ceramic floor tile, pink-veined marble countertop on a heavy oak 
double-vanity with two undermount sinks and large gold-toned framed 
mirrors, drop-in cream acrylic bathtub with original gold fixtures, 
ceramic tile surround up to chest height in matching salmon-pink, 
single fluorescent ceiling fixture with frosted globe, sliding-glass 
shower door at the far end with mineral build-up. Visible signs of 
age: dated grout, brass fixtures tarnished, slight wear on tile. 
Clean but obviously 40 years behind. Cold flat overhead lighting. 
Premium location but bones aside, it has not been touched. 
[+global style]
```

**After prompt** (same frame):
```
The exact same bathroom — same wall positions, same window placement, 
same camera angle as the previous image — fully renovated to a 
contemporary spa standard. Large-format honed white-oak-look 
porcelain floor tile, full-height honed Calacatta marble slabs on 
the wet wall behind a freestanding sculptural soaking tub in matte 
white, floating walnut double-vanity with integrated Corian sinks 
and matte-black wall-mounted faucets, large round black-framed 
backlit mirrors, single linear LED architectural pendant in matte 
black above the vanity, integrated cove lighting at the ceiling. 
Frameless walk-in shower visible at the far end with black hardware 
and oversized rainfall head. Calm, restrained, boutique-hotel 
aesthetic, photo-realistic, magazine-feature quality. Same window 
light. [+global style]
```

---

## 6. Service grid cards (15 unique still images, 1200×900)

Each card must visually differentiate from its neighbors in the grid. Below: what the scene should show plus the prompt.

---

### 6.1 Unutrašnji renderi → `listing-interior-static.webp`

**What:** Wide cinematic Belgrade penthouse master bedroom suite (DIFFERENT room from detail and home — bedrooms here, not living rooms there). Soft morning light.

```
Belgrade penthouse master bedroom suite, captured wide on a 24mm 
tilt-shift lens, eye-level shot from the suite entrance. Low walnut 
platform bed centered against the back wall, dressed in crisp ivory 
linen with a folded sage textured throw. Walnut nightstands flanking 
with low brass-and-alabaster table lamps. Wide-plank European white-
oak floor, soft warm plaster walls, floor-to-ceiling window on the 
right with linen drapes pulled back revealing a soft city skyline. 
Custom plaster ceiling with subtle cove lighting. Single oversized 
abstract textured artwork above the bed. Warm soft morning light. 
[+global style]
```

---

### 6.2 360° enterijeri — IFRAME (no image)

Already uses Kuula 360 embed in the card. No lovart work needed.

---

### 6.3 Spoljašnji renderi → `listing-exterior-static.webp`

**What:** Adriatic-coastal contemporary villa, side three-quarter view at golden hour. Different angle from detail/home set (which featured front-three-quarter modern villa).

```
Adriatic-coastal contemporary villa exterior, captured on a 35mm 
tilt-shift lens, side three-quarter view from across a manicured 
terrace at slight elevation. Single-story horizontal massing in 
travertine and walnut cladding, deep architectural overhangs casting 
soft shadows, floor-to-ceiling glass curtain walls revealing the 
living room interior, infinity pool just visible flowing toward the 
sea horizon. Mature olive trees framing the right edge, paved 
limestone terrace with a single sculptural daybed and a low travertine 
side table. Late afternoon golden hour light, soft long shadows across 
the facade, mediterranean blue sea in the distance. No people, no 
boats. [+global style]
```

---

### 6.4 360° eksterijeri → `listing-exterior-360.webp`

**What:** Same villa concept but from a 360-friendly angle — slightly elevated approach showing the building set within its surroundings, hinting at the immersive nature without an obvious VR cue.

```
Modern hillside villa exterior, captured on a 24mm tilt-shift lens, 
slightly elevated wide approach view from the entry drive. The villa 
sits centered with deep architectural depth: travertine entry portico 
with custom blackened-steel pivot door on the left, full glass 
curtain wall along the main facade on the right, integrated landscape 
strips with low ornamental grasses softening the foundation, paved 
limestone driveway curving into the foreground. Strong sense of 
"the whole property" — you can see the building, the approach, the 
context, all at once. Soft late-afternoon light. The composition 
feels designed to be the start of a 360 walkthrough. [+global style]
```

---

### 6.5 Prikaz iz vazduha → `listing-exterior-aerial.webp`

**What:** Drone aerial of a single luxury villa with pool, garden, parking — dramatic top-down angle (35-40°).

```
Aerial drone-elevation view of a single luxury contemporary villa 
property, captured at a dramatic 35-degree angle from above. The 
full property is in frame: travertine-and-walnut villa centered, 
infinity pool extending toward a manicured lawn edge, walled garden 
with mature olive trees, paved limestone driveway and three-car 
parking court, low-profile pool pavilion with a single outdoor sofa. 
Surrounding context: hillside Mediterranean terraces softly out of 
focus. Late morning sunlight casting confident long shadows from the 
villa across the pool and lawn. Architectural-magazine drone 
photography aesthetic. [+global style]
```

---

### 6.6 Uređenje pejzaža — PAIR → `listing-landscape-{before,after}.webp`

**What:** Bare hillside back-garden of a luxury property → fully designer-landscaped Mediterranean garden. Same camera angle, same boundary walls — only the planting and hardscape change.

**Before prompt:**
```
Bare large back-garden of a luxury hillside property, captured wide 
on a 24mm tilt-shift lens at eye level from a low garden vantage 
point. Roughly 20×15 meters of empty ground visible: patchy dry 
grass, exposed soil, some weed clusters, a low honey-toned limestone 
retaining wall along the back boundary. No paths, no plants, no 
pavilion, no water feature. Glimpse of the villa's terrace stone 
edge visible at the very bottom of the frame (suggesting the rest 
of the house exists out of frame). Neutral diffuse afternoon light. 
Empty potential. [+global style]
```

**After prompt** (same frame):
```
The exact same back-garden, same camera angle and same light as the 
previous image — now fully designer-landscaped. Curved stone-paver 
pathway running through dense planted beds of lavender, rosemary, 
ornamental grasses, and low olive saplings, with a mature olive tree 
as a centerpiece in the middle ground. A long narrow reflecting pool 
in matte black stone runs along the right edge, mirroring the sky. 
A small walnut-and-blackened-steel garden pavilion with a single 
sculptural daybed in the back-left corner. Same honey-toned limestone 
retaining wall along the back boundary, unchanged. Same villa 
terrace edge at the bottom of the frame. Soft afternoon golden hour 
light. Sophisticated achievable Mediterranean garden. [+global style]
```

---

### 6.7 Fotomontaža — PAIR → `listing-photomontage-{before,after}.webp`

**What:** Real-looking photograph of an empty hillside building lot → the same photograph with a contemporary luxury villa seamlessly composited onto the lot.

**Before prompt:**
```
Wide architectural site photograph of an empty premium hillside 
building lot, captured on a 35mm tilt-shift lens at eye level from 
across the access road. The lot sits cleared and graded but empty: 
bare leveled earth, a few sparse weeds, low rough stone retaining 
walls along the lot edges. Adjacent context: upmarket existing 
neighbors visible at distance on either side (modern Mediterranean 
villas, soft and out of focus), mature cypress trees framing the 
lot edges, real power lines overhead. Distant view beyond: rolling 
Adriatic hills, soft hazy horizon. Bright early-afternoon light, 
mostly clear sky with subtle layered cirrus clouds. Real documentary 
photograph feel, no architectural rendering visible on the lot itself. 
[+global style]
```

**After prompt** (same frame):
```
The exact same hillside lot, same camera angle and lighting as the 
previous image — but now a contemporary luxury villa is photo-
realistically inserted on the lot. The villa: two-story, travertine 
and walnut-clad facade, deep architectural overhangs, floor-to-
ceiling glass curtain walls catching the daylight, dark blackened-
steel window frames, custom walnut pivot front door at the entry. 
Paved limestone driveway leading to a low entry portico. Mature 
olive trees flanking the entrance. The villa integrates seamlessly: 
matching sun angle and shadow direction with the existing photograph, 
matching color temperature with the neighboring buildings and sky, 
matching scale relative to the surrounding context. The photograph 
looks like the villa has always been there. [+global style]
```

---

### 6.8 3D osnove prostora → `listing-floorplan-3d.webp`

**What:** Premium 3D floor plan, slight angle, fully furnished — different apartment from the detail brief (use a larger 4-bedroom layout here).

```
Premium 3D architectural floor plan of a 140m² four-bedroom luxury 
apartment, captured top-down with a 15-degree isometric tilt for 
depth. Fully furnished and styled: large open-plan kitchen/dining/
living with marble island, ivory bouclé sectional, walnut dining 
table for six, primary suite with king bed and ensuite, three 
additional bedrooms each styled differently (child, guest, study), 
walk-in laundry, two bathrooms. Light European oak floors throughout, 
soft warm-white walls sectioned at half height so the plan reads 
cleanly, integrated black-framed glass doors. Soft even daylight from 
above, no harsh shadows. Slim hairline outlines on walls. Investor-
brochure aesthetic, no labels, no measurements, no UI elements. 
[+global style]
```

---

### 6.9 2D osnove prostora → `listing-floorplan-2d.webp`

**What:** Clean 2D vector floor plan in a magazine-spread aesthetic. Same apartment layout as the 3D version for visual consistency, rendered as 2D.

```
Clean magazine-grade 2D architectural floor plan of a 140m² four-
bedroom luxury apartment, captured perfectly top-down. Pure 2D 
vector style: thin black hairline walls, light cream interior fill, 
walnut-tone floor pattern hatching, sparse symbolic furniture 
indications (square for bed, circle for round dining table, rectangle 
for kitchen island). Slim sage-green window indications, deep walnut 
door swings. Single discreet room-area badge at center of each 
prostorija in muted brass. Magazine-spread quality, premium real-
estate listing aesthetic, no measurements or text labels visible. 
[+global style]
```

---

### 6.10 3D site planovi → `listing-siteplan.webp`

**What:** Aerial 3D masterplan of a multi-villa development. Different from the detail brief (which used a residential apartment complex) — here, a small luxury villa community of 4-6 detached homes.

```
Aerial 3D render of a small luxury villa community masterplan, 
captured from drone elevation at a 50-degree top-down angle. Five 
contemporary single-story villas in travertine and walnut cladding, 
arranged organically across hillside terraced lots, each with its 
own infinity pool, garden, paved driveway, and walled boundary. 
Shared private access road in honey-toned limestone winding through 
the community. Communal landscape zones with mature olive groves and 
cypress lines. Mediterranean topography with subtle level changes 
between lots. Late morning sun casting strong confident shadows from 
the villas. Surrounding context: hillside Adriatic landscape softly 
out of focus, glimpse of sea at top of frame. Investor-grade. 
[+global style]
```

---

### 6.11 Arhitektonske animacije → `listing-animation.webp`

**What:** A still that suggests motion / cinematic flythrough. Use a Steadicam-style low-and-wide composition with intentional motion blur in the background trees, sharp on the architecture.

```
Cinematic still frame from an architectural flythrough animation, 
captured wide on a 24mm tilt-shift lens, low-and-forward Steadicam-
style approach toward the front entry of a contemporary luxury villa. 
Travertine and walnut-clad architecture with the entry walkway 
leading into the foreground. The architecture is sharp, perfectly 
exposed and focused. The mature olive trees flanking the walkway 
have subtle directional motion blur (suggesting forward camera 
movement). Late afternoon golden hour light. The composition reads 
unmistakably as a frame from a film, not a still photo. [+global style]
```

---

### 6.12 360 ture → `listing-tour-360.webp`

**What:** An interior shot composed to suggest 360 immersion — wide-angle from room center showing the full room wrap, with a hint of the spherical envelope (very subtle barrel curvature only at extreme edges).

```
Interior of a luxury Belgrade penthouse living room captured to 
evoke a 360 panoramic perspective — extra-wide-angle composition 
from the geometric center of the room at eye level, showing both 
side walls converging slightly at the frame edges. Bouclé curved 
sectional sofa wrapping around a low travertine coffee table at 
center, walnut built-in bookcases on the left, floor-to-ceiling 
glass curtain wall on the right opening to a city view, large 
abstract canvas on the back wall. Wide-plank European oak floor. 
Soft afternoon natural light from the right. The composition feels 
designed for spherical viewing, hints at immersion without being a 
visible 360 stitch. [+global style]
```

---

### 6.13 Virtuelno opremanje — PAIR → `listing-staging-{before,after}.webp`

**What:** Empty open-plan living room of a Belgrade loft conversion → the same room fully designer-staged. Same architectural shell, only the furnishing changes. Different room concept from the home and AI Studio briefs (loft, not penthouse).

**Before prompt:**
```
Completely empty open-plan living room of a contemporary Belgrade 
loft conversion, captured wide on a 24mm tilt-shift lens, eye-level 
corner view. Exposed brick accent wall on the left painted in soft 
warm white, modern walnut shelving against it (empty shelves). 
Wide-plank European oak floor totally bare — no rug, no furniture, 
no decor, no kitchen items at the island visible at the far edge of 
frame. Large industrial-style black-framed window on the back wall 
pouring soft afternoon daylight in. Beautiful architectural shell 
but visually cold and unfinished. [+global style]
```

**After prompt** (same frame):
```
The exact same loft living room, same camera angle and lighting as 
the previous image — now stylishly designer-staged. Low cream linen 
modular sectional sofa facing a sculptural travertine coffee table, 
single sage textile throw across one arm of the sofa, a few 
intentional design objects on the table (a Murano-glass vessel, a 
folded art monograph, a single brass candleholder). Hand-knotted 
neutral wool rug grounding the seating. The walnut shelves now 
populated with curated art books, ceramic vessels, a single brass 
candlestick. Linear pendant in blackened steel above the kitchen 
island. Magazine-grade designer-curated, believable, not over-styled. 
[+global style]
```

---

### 6.14 Virtuelna renovacija — PAIR → `listing-renovation-{before,after}.webp`

**What:** Dated 90s luxury kitchen → contemporary renovated kitchen in the same footprint. DIFFERENT room from the bathroom hero showcase pair (kitchen here, bathroom in §5.1) so the listing carries TWO renovation transformations without redundancy.

**Before prompt:**
```
Dated 1990s luxury kitchen interior awaiting renovation, captured 
wide on a 24mm tilt-shift lens, eye-level corner view showing the 
full depth. Heavy honey-oak raised-panel kitchen cabinetry with 
brass cup handles, dated cream-and-beige granite countertops, 
oversized stainless-steel range hood with worn finish, almond-color 
electric cooktop, beige ceramic tile backsplash up to the underside 
of upper cabinets. Worn beige ceramic tile floor. Fluorescent box 
ceiling fixture overhead, yellowing white ceiling. Single dated 
wooden bar stool at the island. Clean but visibly 30 years behind. 
Cold flat overhead lighting. [+global style]
```

**After prompt** (same frame):
```
The exact same kitchen — same wall positions, same layout, same 
camera angle as the previous image — fully renovated to a 
contemporary luxury standard. Bespoke matte sage-green flat-front 
kitchen cabinetry with integrated walnut handles, Calacatta marble 
waterfall island replacing the old granite, single sculptural 
pendant in matte black above the island, brushed brass tap, fully 
integrated appliances behind walnut paneling. Wide-plank European 
oak floor replacing the old ceramic. Exposed concrete ceiling with 
track lighting replacing the fluorescent box. Single walnut counter 
stool with linen cushion at the island, styled ceramic bowl of 
citrus and a wooden cutting board with rustic bread on the counter. 
Warm afternoon light through the same back window. [+global style]
```

---

### 6.15 Dnevni u noćni prikaz — PAIR → `listing-day-to-dusk-{before,after}.webp`

**What:** Adriatic villa exterior at midday → the same villa at deep blue hour with full interior glow. Same camera angle, same architectural lighting on facade — only the time of day changes.

**Before prompt:**
```
Adriatic luxury villa exterior, captured wide on a 35mm tilt-shift 
lens, front-three-quarter view from across an approach driveway at 
slight elevation. Travertine and walnut architecture with floor-to-
ceiling glass curtain walls, custom blackened-steel pivot door, 
mature olive trees framing the entrance, infinity pool just visible 
on the side reflecting the bright sky. Bright midday daylight, faint 
hazy sky, clean soft shadows. Villa interior is unlit — windows 
read as dark glass reflecting the day. Pool sits flat and unlit. 
Beautiful but flat — captured at the worst time of day for marketing. 
[+global style]
```

**After prompt** (same frame):
```
The exact same villa, exact same camera angle and architectural 
lighting on the facade as the previous image — now captured at deep 
blue hour. Sky is a cinematic deep indigo gradient with a faint 
warm amber band along the horizon. Every interior light gently on: 
warm 2700K glow spilling through the floor-to-ceiling glass, accent 
uplighting on the travertine cladding catching the texture, 
integrated landscape lighting along the driveway and around the 
olive trees. The infinity pool glows from within with subtle 
turquoise uplighting, casting rippled reflections on the lower 
facade. Same composition, same villa, transformed time of day. 
Magazine-cover quality. [+global style]
```

---

### 6.16 Uklanjanje predmeta — PAIR → `listing-item-removal-{before,after}.webp`

**What:** Cluttered/lived-in luxury dining room → the same room cleaned for listing photography. Same furniture, same camera angle — clutter digitally removed and surface restyled.

**Before prompt:**
```
Lived-in dining room of a luxury Adriatic-coastal villa, captured 
on a 35mm tilt-shift lens, eye-level wide shot from the adjoining 
living room. Long sculptural travertine dining table for eight 
visible in the foreground, but the room is clearly lived-in: half-
finished meal plates and water glasses scattered across the table, 
crumpled linen napkins, an open laptop and stack of papers on one 
end, a child's backpack draped over one of the ivory bouclé dining 
chairs, scattered shoes near the door, a folded laundry basket on 
the walnut credenza along the back wall, a half-empty wine bottle 
and two used glasses. Beautiful room underneath, but obviously 
mid-day-of-living. Soft afternoon light from the right. [+global style]
```

**After prompt** (same frame):
```
The exact same dining room from the same camera angle and lighting 
as the previous image — with every item of clutter digitally 
removed. Ivory bouclé dining chairs perfectly aligned, table 
spotless except for a single low sculptural centerpiece of three 
brass candleholders and a hand-thrown ceramic bowl with three 
lemons. Walnut credenza along the back wall cleared, now holding 
only a single tall ceramic floor vase with pampas grass. Floor 
clean: no shoes, no backpack, no laundry. The beautiful room is now 
listing-ready, magazine-grade. Same furniture, same lighting, same 
composition — just restored to "show home" condition. 
[+global style]
```

---

## 7. Repository wiring after upload

After dropping the 23 images into `public/artwork/`:

1. **Hero showcase slider**: `<BeforeAfterShowcase>` component (already built) gets `beforeSrc` + `afterSrc` pointing to `listing-showcase-{before,after}.webp`. Component handles the load animation + hover (desktop) + scroll-driven (mobile).
2. **Service grid — single cards (9)**: each card's `imageSrc` in [services-showcase.tsx](src/components/marketing/services-showcase.tsx) (around lines 95-321) gets updated to the new `listing-*.webp` path.
3. **Service grid — pair cards (6)**: the Service type in services-showcase will be extended with optional `beforeSrc` + `afterSrc` fields. Pair cards render with the existing `<BeforeAfterReveal>` component (same one the AI Studio tool picker uses on `/ai-studio` — mouse-tracked diagonal reveal, lighter than `<BeforeAfterShowcase>` so we don't fire 6 auto-animations at once). Default state shows the after image with a small "Pre / posle" pill in a corner; on hover the diagonal reveal tracks mouse position.
4. **360° enterijeri card** stays unchanged (continues using Kuula iframe).
5. **Cleanup**: the 4 hardcoded `ARTWORK.triptych*` paths become obsolete and can be removed.

**Tell me "listing images are up"** when you drop them and I'll wire the paths in one commit, type-check, push.

---

## 8. Workflow tips

- **Generate in batches by category** — all 4 exterior cards first (so they share a visual language), then all 3 floor-plan/site-plan cards, etc. Easier to maintain visual cohesion within the grid.
- **Showcase pair gets the same seed for before + after**. Run after at slightly different angles if first try doesn't align — alignment matters more here because the slider amplifies any mismatch.
- **Grid neighbor check** before settling on a card image: open the previous card's image side-by-side and ask "are these obviously different scenes?" If they feel like variations of the same room, regenerate.
- **For animation card (6.11)**: lovart may not understand "motion blur on trees, sharp on architecture." Try with explicit terms: `directional motion blur on the foreground vegetation as if captured from a tracking shot, the building tack-sharp and motionless`.

---

## 9. TL;DR

- **23 images** total: 1 hero showcase pair (16:9, 1920×1080) + 9 single 4:3 cards + 6 before/after card pairs × 2 + 0 for 360° iframe card
- **`listing-showcase-{before,after}.webp`** drives the auto-animating diagonal slider at the top of the page (replaces the old 4-card "Pre i posle" grid)
- **`listing-{slug}.webp`** for single product cards (renders, plans, animation, 360 tour, aerial — 9 cards)
- **`listing-{slug}-{before,after}.webp`** for transformation cards (staging, renovation, day-to-dusk, item removal, landscape, photomontage — 6 pairs), each rendered with `<BeforeAfterReveal>` for a mouse-tracked mini-slider per card so the customer instantly sees the value
- After upload → I patch `services-showcase.tsx` in one commit + push
