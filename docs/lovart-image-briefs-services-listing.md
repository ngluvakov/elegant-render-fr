# /usluge listing — image briefs for lovart.ai

Working document for generating **17 images** that refresh the `/usluge` listing page (16 grid cards in 4:3 + 1 before/after showcase pair in 16:9 that drives a new auto-animating diagonal-reveal slider). 360 ture i animacije card already uses a Kuula iframe — no image needed there.

> **Positioning:** the listing page is **top-of-funnel** — the prospect arrives from search or homepage and decides whether we're worth their time within the first scroll. Imagery has to do the heaviest single lift on the site. Same upmarket Sotheby's-tier voice as detail + AI Studio briefs, but each card needs to **earn its position in a 4-column grid** by being visually distinct from its neighbors.

---

## 1. Surface map

- **Hero showcase slider** (NEW): one 16:9 before/after pair (1920×1080). Auto-animates from 0% → 50% diagonal when scrolled into view, hover-to-100% on desktop, scroll-driven on mobile. Replaces the existing 4-card "Pre i posle" static grid.
- **Service grid** (16 cards in 4:3): one unique 1200×900 image per card. Each card visually anchors a distinct service variant (e.g. Static Interior is a different scene from 360 Interior, even though they're both "interior").
- **360° enterijeri card**: stays as a Kuula iframe (no image).

---

## 2. Technical specifications

| Parameter | Value |
|---|---|
| Hero showcase pair dimensions | **1920×1080 px** (16:9) |
| Service grid card dimensions | **1200×900 px** (4:3) |
| Output format | WebP, sRGB, quality 85 |
| Naming — hero showcase | `listing-showcase-before.webp` + `listing-showcase-after.webp` |
| Naming — grid cards | `listing-{slug-or-variant}.webp` (see naming map below) |
| Path | Drop into `public/artwork/` |
| Mobile crop | Cards stay 4:3 on mobile; hero showcase keeps 16:9. Keep key elements within central 90% of frame. |
| Hero pair frame discipline | **Identical frame** (same camera position, same zoom, same lighting on unchanged elements). |

---

## 3. Naming map — grid cards (15 still images)

| # | Card label (UI) | Slug | File |
|---|---|---|---|
| 1 | Unutrašnji renderi | `unutrasnji-renderi-static` | `listing-interior-static.webp` |
| 2 | 360° enterijeri | `unutrasnji-renderi-360` | **iframe — no image** |
| 3 | Spoljašnji renderi | `spoljasnji-renderi-static` | `listing-exterior-static.webp` |
| 4 | 360° eksterijeri | `spoljasnji-renderi-360` | `listing-exterior-360.webp` |
| 5 | Prikaz iz vazduha | `spoljasnji-renderi-aerial` | `listing-exterior-aerial.webp` |
| 6 | Uređenje pejzaža | `prikazi-dvorista` | `listing-landscape.webp` |
| 7 | Fotomontaža | `fotomontaza` | `listing-photomontage.webp` |
| 8 | 3D osnove prostora | `osnove-3d` | `listing-floorplan-3d.webp` |
| 9 | 2D osnove prostora | `osnove-2d` | `listing-floorplan-2d.webp` |
| 10 | 3D site planovi | `situacioni-prikazi` | `listing-siteplan.webp` |
| 11 | Arhitektonske animacije | `animacije` | `listing-animation.webp` |
| 12 | 360 ture | `ture-360` | `listing-tour-360.webp` |
| 13 | Virtuelno opremanje | `virtuelno-opremanje` | `listing-staging.webp` |
| 14 | Virtuelna renovacija | `virtuelna-renovacija` | `listing-renovation.webp` |
| 15 | Dnevni u noćni prikaz | `dan-u-noc` | `listing-day-to-dusk.webp` |
| 16 | Uklanjanje elemenata | `uklanjanje-elemenata` | `listing-item-removal.webp` |

Plus the showcase pair:
- `listing-showcase-before.webp` (1920×1080)
- `listing-showcase-after.webp` (1920×1080)

**Total: 17 new images.**

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

### 6.6 Uređenje pejzaža → `listing-landscape.webp`

**What:** Designer Mediterranean garden — pavilion, stone path, planted beds, water feature. Different angle than detail brief (which used a smaller residential yard).

```
Designer Mediterranean garden of a luxury hillside property, captured 
wide on a 24mm tilt-shift lens at eye level from a low garden 
pathway. Curved stone-paver pathway leading through dense planted 
beds of lavender, rosemary, ornamental grasses, and low olive 
saplings, with a mature olive tree as a centerpiece in the middle 
ground. A long narrow reflecting pool in matte black stone runs along 
the right edge, mirroring the sky. A small walnut-and-blackened-steel 
garden pavilion with a single sculptural daybed in the back-left. 
Walled garden boundary in honey-toned limestone barely visible at 
the edges. Soft afternoon golden hour light, deep depth. [+global style]
```

---

### 6.7 Fotomontaža → `listing-photomontage.webp`

**What:** Architectural composite showing a contemporary building inserted into a real-looking site photograph. Make the composite seamless but clearly a "new build on existing land" narrative.

```
Wide architectural site photograph composite of a contemporary luxury 
villa newly inserted onto a real-looking hillside Adriatic coastal 
lot. 35mm tilt-shift lens, eye-level street-view angle from across 
the access road. The villa: two-story, travertine and walnut-clad, 
deep architectural overhangs, floor-to-ceiling glass facade catching 
the afternoon light. Surrounding context is documentary-real: 
neighboring older Mediterranean houses softly out of focus at the 
edges, mature cypress trees along the lot lines, hazy hills in the 
far distance, real power lines overhead just visible. The new villa 
integrates seamlessly: matching sun angle, matching shadow direction, 
matching color temperature with the existing context. Looks like 
photo + render perfectly composited. [+global style]
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

### 6.13 Virtuelno opremanje → `listing-staging.webp`

**What:** Beautifully staged living room, but showing the "after" state of staging as the listing card (the transformation lives in the hero showcase). Use a DIFFERENT room concept from the home and AI Studio briefs — here, a daytime open-plan living/kitchen of a Manhattan-style townhouse loft.

```
Stylishly staged open-plan living room of a contemporary Belgrade 
loft conversion, captured wide on a 24mm tilt-shift lens, eye-level 
corner view. Exposed brick accent wall on the left painted in soft 
warm white, modern walnut shelving against it. Low cream linen 
modular sectional sofa facing a sculptural travertine coffee table, 
single sage textile throw across one arm of the sofa, a few 
intentional design objects on the table (a Murano-glass vessel, a 
folded art monograph, a single brass candleholder). Wide-plank 
European oak floor with a hand-knotted neutral wool rug grounding 
the seating. Linear pendant in blackened steel above the kitchen 
island visible at the far edge of frame. Warm afternoon daylight 
from a large industrial-style window. [+global style]
```

---

### 6.14 Virtuelna renovacija → `listing-renovation.webp`

**What:** A renovated kitchen (DIFFERENT room from the bathroom in the hero showcase pair, and different from the home/detail briefs which used other rooms). After-state only (the showcase pair is the full before/after).

```
Contemporary renovated luxury kitchen in a Belgrade penthouse, 
captured wide on a 24mm tilt-shift lens, eye-level corner view 
showing the full depth. Bespoke matte sage-green kitchen cabinetry 
with integrated walnut handles, Calacatta marble waterfall island 
with single sculptural pendant in matte black above, brushed brass 
tap, fully integrated appliances. Wide-plank European oak floor, 
exposed concrete ceiling with track lighting, large factory-style 
black-framed window on the back wall opening to a city view. Single 
walnut counter stool with linen cushion at the island, styled 
ceramic bowl of citrus and a wooden cutting board with rustic bread 
on the counter. Warm afternoon light through the back window. 
[+global style]
```

---

### 6.15 Dnevni u noćni prikaz → `listing-day-to-dusk.webp`

**What:** A villa exterior at blue hour with the full interior glow — single dusk shot (the day version is implied by the service name). Make it MORE dramatic than the home/detail variants since this card has to sell the magic by itself, not via comparison.

```
Adriatic luxury villa exterior captured at deep blue hour, 35mm 
tilt-shift lens, front-three-quarter wide view from across an 
illuminated approach driveway at slight elevation. Travertine and 
walnut architecture with floor-to-ceiling glass curtain walls glowing 
softly with warm 2700K interior light. Every interior light gently 
on: warm spill through the glass facade, accent uplighting on the 
travertine cladding catching the texture, integrated landscape 
lighting along the driveway and around mature olive trees. The 
infinity pool glows from within with subtle turquoise uplighting, 
casting rippled reflections on the lower facade. Sky is a cinematic 
deep indigo gradient with a faint amber warm band along the horizon 
behind the villa. Atmosphere: magazine-cover quality, end-of-day, 
aspirational. [+global style]
```

---

### 6.16 Uklanjanje elemenata → `listing-item-removal.webp`

**What:** A pristine listing-ready living room — the "after" state of item removal (the before would be cluttered, but this card is the result, not the comparison). Different room from home/detail briefs.

```
Listing-ready dining room of a luxury Adriatic-coastal villa, 
captured on a 35mm tilt-shift lens, eye-level wide shot from the 
adjoining living room. Long sculptural travertine dining table for 
eight, ivory bouclé dining chairs perfectly aligned, single low 
sculptural centerpiece of three brass candleholders and a hand-
thrown ceramic bowl with three lemons. Walnut credenza along the 
back wall holding a single tall ceramic floor vase with pampas 
grass. Large abstract canvas above. Floor-to-ceiling window on the 
right opening to the terrace beyond, soft afternoon light pouring 
in. Wide-plank European oak floor with a hand-knotted neutral rug 
grounding the table. Every surface intentional, nothing personal 
visible, nothing accidental — show home perfection. [+global style]
```

---

## 7. Repository wiring after upload

After dropping the 17 images into `public/artwork/`:

1. **Showcase slider**: `<BeforeAfterShowcase>` component (already built) gets `beforeSrc` + `afterSrc` pointing to `listing-showcase-{before,after}.webp`. Component handles the load animation + hover (desktop) + scroll-driven (mobile).
2. **Service grid cards**: each card's `imageSrc` in [services-showcase.tsx](src/components/marketing/services-showcase.tsx) (around lines 95-321) gets updated to the new `listing-*.webp` path. The 4 hardcoded `ARTWORK.triptych*` paths become obsolete and can be removed.
3. **360° enterijeri card** stays unchanged (continues using Kuula iframe).

**Tell me "listing images are up"** when you drop them and I'll wire the paths in one commit, type-check, push.

---

## 8. Workflow tips

- **Generate in batches by category** — all 4 exterior cards first (so they share a visual language), then all 3 floor-plan/site-plan cards, etc. Easier to maintain visual cohesion within the grid.
- **Showcase pair gets the same seed for before + after**. Run after at slightly different angles if first try doesn't align — alignment matters more here because the slider amplifies any mismatch.
- **Grid neighbor check** before settling on a card image: open the previous card's image side-by-side and ask "are these obviously different scenes?" If they feel like variations of the same room, regenerate.
- **For animation card (6.11)**: lovart may not understand "motion blur on trees, sharp on architecture." Try with explicit terms: `directional motion blur on the foreground vegetation as if captured from a tracking shot, the building tack-sharp and motionless`.

---

## 9. TL;DR

- **17 images** total: 1 showcase pair (16:9) + 15 grid cards (4:3) + 1 iframe card (no image)
- **`listing-showcase-{before,after}.webp`** (1920×1080) drives the new auto-animating diagonal slider that replaces the 4-card "Pre i posle" grid
- **`listing-*.webp`** (1200×900) for each service variant card, each visually distinct from neighbors
- After upload → I patch `services-showcase.tsx` in one commit + push
