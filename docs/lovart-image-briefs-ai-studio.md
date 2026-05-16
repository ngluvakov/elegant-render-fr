# AI Studio — image briefs for lovart.ai

Working document for generating **16 images** (8 before/after pairs) that will replace the existing `ai-tool-*.webp` preview images and fill the missing `object_insertion` (Add or Replace Furniture/Decor) preview that is currently empty.

> **Positioning:** AI Studio is sold to **upmarket customers** — premium residential properties, designer interiors, well-maintained high-end real estate. Imagery should read as **professional listing photography** for a Sotheby's-tier brokerage, not an iPhone snapshot. Still photographic in voice (the distinction from expert mode, which is hand-crafted 3D rendering), but elevated, polished, and obviously curated. Targets: Belgrade penthouse owners, Mediterranean coastal villa investors, high-end Hamptons-modern principal residences.

---

## 1. Technical specifications (apply to every image)

Same as the expert set:

| Parameter | Value |
|---|---|
| **Dimensions** | **1600 × 1067 px** (3:2 aspect ratio) |
| Output format | WebP, sRGB, quality 85 |
| Mobile crop | Image is cropped to 4:3 on mobile (object-cover); keep key elements within the central ~80% of the frame |
| Naming convention | `ai-tool-{id}-before.webp` + `ai-tool-{id}-after.webp` (overwrite existing) |
| Path | Drop into `public/artwork/` (overwrites the existing 7 sets + adds the new `object_insertion` pair) |
| Aspect for pairs | **Identical frame** — same camera position, same zoom, same lighting. Difference is ONLY in the content the tool transforms. |

**Naming map (tool_id):**

| AI tool (UI label) | File ID | Paths (after upload) |
|---|---|---|
| Item removal | `item_removal` | `ai-tool-item_removal-before.webp` + `-after.webp` |
| Day to dusk | `day_to_dusk` | `ai-tool-day_to_dusk-before.webp` + `-after.webp` |
| Sky replacement | `sky_replacement` | `ai-tool-sky_replacement-before.webp` + `-after.webp` |
| Wall color change | `wall_color_change` | `ai-tool-wall_color_change-before.webp` + `-after.webp` |
| Virtual staging | `virtual_staging` | `ai-tool-virtual_staging-before.webp` + `-after.webp` |
| Object insertion / replacement | `object_insertion` | `ai-tool-object_insertion-before.webp` + `-after.webp` |
| Virtual renovation | `virtual_renovation` | `ai-tool-virtual_renovation-before.webp` + `-after.webp` |
| Room redesign | `room_redesign` | `ai-tool-room_redesign-before.webp` + `-after.webp` |

---

## 2. Global style (append to every prompt)

```
Style: high-end real estate listing photography in the style of 
Sotheby's International Realty or Christie's listings. Captured on a 
medium-format mirrorless camera (Hasselblad X2D / Fujifilm GFX feel) 
with a 24mm or 35mm tilt-shift lens — perfectly corrected verticals, 
zero distortion, professional composition. Natural daylight balanced 
with subtle interior fill. Magazine-grade color grading: warm 
neutrals, off-white walls, walnut and oak wood, marble accents, 
brushed brass hardware, deep sage and forest green, soft clay 
terracotta, ink and charcoal tones. Properties depicted are 
upmarket: Belgrade penthouses, Adriatic coastal villas, modern 
Hamptons-style principal residences. No people in frame. No text, 
logos, watermarks, UI elements. Aspect ratio 3:2 (1600×1067).
```

**Difference from the expert brief:** the expert brief emphasizes "hyperrealistic architectural visualization, professional photography." This brief emphasizes **high-end real estate listing photography**, treating each image as a frame from a luxury brokerage marketing set. The subtle distinction reinforces the product split:
- **Expert mode** = bespoke 3D rendering (clearly modeled scenes)
- **AI Studio** = transformations applied to real, already-shot luxury property photography

---

## 3. Before/After pairs (8 pairs = 16 images)

**Critical for every pair:** identical frame, identical zoom, identical lighting on the unchanged elements. The transformation is only what the tool literally does.

---

### 3.1 Item removal
Paths: `ai-tool-item_removal-before.webp` + `ai-tool-item_removal-after.webp`

**Concept:** A chef-grade kitchen island with everyday clutter → the same island, listing-ready.

**Before prompt:**
```
High-end chef's kitchen island, close-up photograph from a premium 
real estate listing. 35mm tilt-shift camera, eye-level shot across 
the island. Calacatta marble waterfall countertop, walnut cabinet 
fronts visible behind, integrated brass pendant lamps overhead, 
Wolf range in the background. Visible clutter on the island surface: 
opened cookbook, half-empty espresso cup, balled-up linen tea towel, 
unopened mail stack, cutting board with onion skins, a child's water 
bottle. The room itself is beautiful; only the island surface looks 
lived-in. Soft afternoon side light through unseen window. 
[+global style]
```

**After prompt** (same frame):
```
The exact same kitchen island, same camera angle and lighting as the 
previous image — every item of clutter digitally removed. The marble 
surface is now spotless, holding only a single styled centerpiece: a 
hand-thrown ceramic bowl with three sculptural lemons and a low brass 
fruit stand with figs. Same cabinets, same pendants, same range, same 
light. The composition reads as a listing hero shot. [+global style]
```

---

### 3.2 Day to dusk
Paths: `ai-tool-day_to_dusk-before.webp` + `ai-tool-day_to_dusk-after.webp`

**Concept:** A contemporary luxury villa exterior at midday → the same villa at blue hour, warm interior glow visible through every window.

**Before prompt:**
```
Contemporary luxury villa exterior, premium real estate listing 
photograph. 24mm tilt-shift camera, front-three-quarter view from a 
manicured approach drive. Travertine and walnut-clad architecture, 
floor-to-ceiling glass curtain walls, infinity pool just visible on 
the side, mature olive trees framing the entrance, custom blackened-
steel pivot front door. Bright midday daylight, faintly hazy sky, 
clean soft shadows. The villa interior is unlit — windows read as 
dark glass reflecting the day. Architectural digest aesthetic, no 
people, no cars. [+global style]
```

**After prompt** (same frame):
```
The same villa, same camera angle and architectural lighting on the 
facade as the previous image — now captured at blue hour. The sky is 
a deep indigo-to-amber gradient, with a faint band of warm horizon 
glow. Every interior light is softly on: warm 2700K glow spilling 
through the floor-to-ceiling glass, accent lights grazing the 
travertine cladding, integrated landscape lighting along the drive 
and around the olive trees. Pool glows from below with subtle 
turquoise uplighting. Cinematic, aspirational, end-of-day. Same 
composition. [+global style]
```

---

### 3.3 Sky replacement
Paths: `ai-tool-sky_replacement-before.webp` + `ai-tool-sky_replacement-after.webp`

**Concept:** A hilltop villa shot on a flat overcast day → the same villa with a cinematic golden-hour sky.

**Before prompt:**
```
Modern hilltop villa exterior, real estate listing photograph. 35mm 
tilt-shift camera, slight elevated angle from the access road. White 
limestone facade, deep architectural overhangs, large glass openings, 
manicured cypress trees flanking the entrance, terracotta-tiled 
courtyard visible at the base. The sky filling the top 45% of the 
frame is a flat featureless overcast gray — the architecture looks 
beautiful but the sky kills the photograph entirely. Quality of light 
on the building is soft and diffuse. [+global style]
```

**After prompt** (same frame):
```
The exact same villa, exact same camera angle and exact same diffuse 
soft light on the facade as the previous image — the sky is the only 
element changed. The new sky is dramatic golden-hour: deep cerulean 
blue at the top transitioning through pink and amber down to a warm 
glowing horizon, with delicate layered cirrus clouds catching the 
sun. No relighting of the building (the diffuse light from the 
overcast shoot is preserved exactly). Sky only. [+global style]
```

---

### 3.4 Wall color change
Paths: `ai-tool-wall_color_change-before.webp` + `ai-tool-wall_color_change-after.webp`

**Concept:** A primary bedroom suite with neutral walls → the same suite with a deep moss green accent wall behind the bed.

**Before prompt:**
```
Primary bedroom suite in a luxury property, real estate listing 
photograph. 28mm tilt-shift camera, eye-level shot from the suite 
entrance. King platform bed in walnut frame centered against the 
back wall, dressed in crisp ivory linens with a folded textured 
throw. Walnut nightstands with low brass-and-alabaster table lamps. 
Wide-plank European white-oak floor, custom plaster ceiling with 
subtle cove lighting, large floor-to-ceiling window on the right 
with floor-length linen drapes pulled back. All walls — including 
the back wall behind the bed — are a soft off-white plaster finish. 
Beautiful and restrained, but the back wall is doing nothing 
dramatic. [+global style]
```

**After prompt** (same frame):
```
The exact same primary bedroom suite, same camera angle and same 
lighting as the previous image — but the back wall behind the bed is 
now finished in a deep matte moss green (color approximately #4a5a44, 
a Farrow & Ball "Bancha"-style green). All other surfaces are 
unchanged: trim is still ivory, ceiling is still pale plaster, oak 
floor unchanged, bedding unchanged, walnut frame unchanged. The new 
accent wall reads as sophisticated and intentional, magazine-feature 
quality. Just the one wall changed. [+global style]
```

---

### 3.5 Virtual staging
Paths: `ai-tool-virtual_staging-before.webp` + `ai-tool-virtual_staging-after.webp`

**Concept:** An empty open-plan kitchen + dining of a luxury new-build → the same space, fully staged by a high-end interior designer. **Different from the expert version** (full living room) — here the staging covers a kitchen and adjoining dining area.

**Before prompt:**
```
Empty open-plan kitchen and dining area in a luxury new-build 
apartment, real estate listing photograph. 24mm tilt-shift camera, 
wide eye-level corner view. Bespoke walnut cabinetry with integrated 
appliances, Calacatta marble waterfall island, brushed brass tap, 
exposed concrete ceiling with track lighting, large factory-style 
black-framed window on the back wall. Floor is wide-plank European 
oak. Totally empty: no stools at the island, no dining table, no 
decor, no rugs, no art. Beautiful shell but visually cold and 
unfinished. Bright but flat daylight. [+global style]
```

**After prompt** (same frame):
```
The exact same kitchen + dining space, same camera angle and 
unchanged architectural lighting as the previous image — now fully 
staged. Three sculptural walnut-and-leather counter stools at the 
island. Round travertine dining table in the foreground with four 
ivory bouclé dining chairs, a low brass candleholder centerpiece, 
and a small Murano-glass vase with eucalyptus. Large abstract canvas 
above a low walnut credenza on the back wall. Soft hand-knotted wool 
rug grounding the dining table. A few intentional objects on the 
island: a cutting board with rustic bread, a small ceramic bowl of 
citrus, a single brass pepper mill. Warm, designer-curated, 
magazine-grade. Believable, not over-styled. [+global style]
```

---

### 3.6 Object insertion / replacement (NEW — fills gap)
Paths: `ai-tool-object_insertion-before.webp` + `ai-tool-object_insertion-after.webp`

**Concept:** A designer living room with a deliberately empty reading corner → the same room with a single high-end armchair, side table, and floor lamp inserted into that corner.

**Before prompt:**
```
Sophisticated living room in a luxury property, real estate listing 
photograph. 28mm tilt-shift camera, eye-level shot from the room 
entrance. Curved bouclé sectional sofa on the left, low travertine 
coffee table in front with a single sculptural ceramic vessel, 
abstract textured artwork above a built-in bookcase on the back 
wall. Wide-plank European oak floor, large floor-to-ceiling window 
on the right pouring soft afternoon light into the room. The 
BACK-RIGHT CORNER between the bookcase and the window is intentionally 
empty — bare oak floor, no furniture, no decor, just an obvious 
negative space that the eye reads as unfinished. Otherwise fully 
designed and beautiful. [+global style]
```

**After prompt** (same frame):
```
The exact same living room, same camera angle and same lighting as 
the previous image — but the previously empty back-right corner now 
contains a single high-end designer reading setup: a curved lounge 
armchair in cognac saddle leather with brushed brass legs, a small 
round travertine side table next to it holding a single hardback art 
book and a brass cup, and a sculptural arched floor lamp in 
blackened steel with a linen shade arcing over the chair. The chair 
sits with believable scale, casts a correct shadow consistent with 
the existing window light direction, and feels like it was always 
intended for that corner. Everything else in the room is exactly 
unchanged. [+global style]
```

---

### 3.7 Virtual renovation
Paths: `ai-tool-virtual_renovation-before.webp` + `ai-tool-virtual_renovation-after.webp`

**Concept:** **Different from the expert version** (kitchen) — here a dated 1980s ensuite primary bathroom transformed into a contemporary spa-quality renovation in the same footprint.

**Before prompt:**
```
Dated 1980s ensuite primary bathroom in a property awaiting 
renovation, real estate listing photograph. 28mm tilt-shift camera, 
eye-level shot from doorway. Beige-pink ceramic floor tile, pink 
marble countertop on a heavy oak vanity with two undermount sinks, 
old gold-tone framed wall mirror spanning the vanity, drop-in beige 
acrylic bathtub with original gold fixtures, ceramic tile surround 
up to chest height in matching pink-beige, frosted-glass 
incandescent ceiling fixture. Visible age signs: dated grout, brass 
fixtures tarnished. Bathroom is clean but obviously 40 years 
behind. [+global style]
```

**After prompt** (same frame):
```
The exact same bathroom — same wall positions, same vanity location, 
same tub location, same camera angle as the previous image — fully 
renovated to a contemporary spa standard. Large-format honed white-
oak-look porcelain floor tile, full-height honed Calacatta marble 
slabs on the wet wall behind the freestanding sculptural soaking 
tub, floating walnut double-vanity with integrated Corian sinks 
and matte-black wall-mounted faucets, large round black-framed 
backlit mirror, single linear LED architectural pendant in matte 
black, integrated cove lighting at the ceiling. Calm, restrained, 
boutique-hotel aesthetic. Photorealistic, listing-ready. 
[+global style]
```

---

### 3.8 Room redesign
Paths: `ai-tool-room_redesign-before.webp` + `ai-tool-room_redesign-after.webp`

**Concept:** A living room finished in eclectic Mediterranean style → the same room redesigned in minimalist contemporary. **Same architectural shell, completely different furnishing language.**

**Before prompt:**
```
Living room interior decorated in eclectic Mediterranean / Provence 
style, real estate listing photograph. 28mm tilt-shift camera, eye-
level corner view. Wide-plank distressed-oak floor, lime-washed 
plaster walls in a warm cream, dark walnut beamed ceiling, ornate 
wrought-iron chandelier, deep terracotta tile entry visible at the 
edge. Furniture: heavily carved chestnut credenza, oversized sage 
linen-slipcovered sofa with patterned kilim throw pillows, 
distressed leather club chair, vintage Persian rug, glazed ceramic 
table lamps, dried botanical arrangements, antique brass mirror. 
Warm but visually busy — a beautiful but specific aesthetic. Soft 
daylight from window. [+global style]
```

**After prompt** (same frame):
```
The exact same room (same floor plan, same window location, same 
wall heights, same beamed ceiling) as the previous image — redesigned 
in minimalist contemporary style. The walls have been smoothed to a 
fresh off-white plaster, the floor refinished as a uniform pale 
European oak. Furniture replaced entirely: a low boxy linen sectional 
in soft ivory, a sculptural travertine coffee table, a single oversized 
neutral abstract canvas on the back wall, a sleek blackened-steel 
arched floor lamp, a low walnut credenza with a single ceramic vessel 
holding tall pampas grass. The walnut beamed ceiling remains as the 
one warm architectural anchor. Visually calm, breathable, gallery-like. 
Same camera angle and natural daylight. [+global style]
```

---

## 4. Repository wiring after upload

After you drop the 16 images into `public/artwork/`:

**1. Home page (`quick-order-hero.tsx`)** — the `aiBeforeAfter()` function currently excludes `object_insertion`. I'll remove that — all 8 tools will return a pair. Line in `src/components/marketing/quick-order-hero.tsx`:

```ts
function aiBeforeAfter(id: AiEditType) {
  if (id === "object_insertion") return null;   // <- this line gets removed
  return {
    before: `/artwork/ai-tool-${id}-before.webp`,
    after: `/artwork/ai-tool-${id}-after.webp`,
  };
}
```

**2. AI Studio marketing page (`src/app/(marketing)/ai-studio/page.tsx`)** — `toolDetails.object_insertion` currently only has `gradient`, no `beforeSrc/afterSrc`. I'll add:

```ts
object_insertion: {
  ...
  beforeSrc: "/artwork/ai-tool-object_insertion-before.webp",
  afterSrc: "/artwork/ai-tool-object_insertion-after.webp",
  ...
}
```

All other paths already exist in the code (overwriting the existing 7 files → no code change required).

**Tell me "AI images are up"** when they're in place, and I'll commit-and-push in one shot:
- Remove the `object_insertion` exception in `aiBeforeAfter()`
- Add `beforeSrc/afterSrc` to `object_insertion` in `toolDetails`
- Type-check + SSR sanity + push

---

## 5. Lovart workflow tips (pairs)

- **Use the same seed for each pair** — critical. Lovart should recognize "after" as a variation of "before," not a new frame.
- **Main difference from the expert brief:** the style anchor is "high-end real estate listing photography" (Sotheby's/Christie's tier), not "hyperrealistic architectural visualization." That means:
  - Magazine-grade composition, perfectly corrected verticals (tilt-shift framing)
  - Designer-curated content (every object is intentional, not random)
  - High-end materials throughout (walnut, marble, brass, linen, bouclé, travertine)
- **If lovart drifts middle-market** — append to the prompt: `Sotheby's International Realty listing aesthetic, professional medium-format photography, magazine-quality interior design, no IKEA, no big-box retail furniture`.
- **Specifically for `object_insertion`** — the hardest image in the set because it requires **believable insertion** (shadow direction, scale matching, floor contact). If lovart fails on the first try, be explicit: `the armchair occupies the visible empty corner with correct floor contact, casts a soft shadow consistent with the window light direction from the right, sits at human-scale relative to the existing sofa and coffee table`.

---

## 6. TL;DR

- **16 images** (8 pairs) at `public/artwork/ai-tool-{id}-{before,after}.webp`
- **1 pair is brand new** (`object_insertion`), the other 7 overwrite existing files
- **Visual tone:** high-end real estate listing photography, Sotheby's-tier brokerage feel (not iPhone documentary)
- **Upmarket subject matter:** Belgrade penthouses, coastal villas, Hamptons-modern residences — luxury but tasteful, not opulent
- After upload → I'll patch the code in one commit (2 small edits in 2 files) + commit/push
