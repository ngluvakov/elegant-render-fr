# Artwork brief — /usluge/360-eksterijer

Image set for the dedicated **360° eksterijer** landing page. Six assets total: 1 hero + 4 portfolio frames + 1 optional problem-section visual. All WebP, 16:9 aspect, sRGB, quality 85.

The dedicated page complements the Kuula iframe demo (interactive 360 panorama) that loads in the "Demo" section. These static images are curated **frames from panoramas** — they should feel like one decisive moment captured from a navigable 360 scene, not generic hero renders.

---

## 1. Technical specifications

| Parameter | Value |
|---|---|
| Dimensions | **1920 × 1080 px** (16:9) for hero & portfolio; **1600 × 1200** (4:3) for problem visual |
| Output format | WebP, sRGB, quality 85 (`cwebp -q 85`) |
| File size target | < 400 KB per image |
| Mobile crop | Composition must read inside central 90% of frame |
| EXIF | Strip metadata before commit |
| Path | All under `public/artwork/` |

---

## 2. Voice & visual direction

Same brand tier as `/usluge/spoljasnji-renderi` (Sotheby's/Christie's listing tier, Belgrade penthouses, Adriatic villas, Hamptons-modern principal residences) **with one distinguishing twist**: each image must subtly imply *rotation* — composition off-center, leading lines that curve out of frame, a hint that there is more to see beyond what is shown. The viewer should feel "I can turn around in this scene."

Do NOT include:
- 360° UI overlays (compass, rotation arrows, hotspot pins) — that is the iframe's job
- Wide-angle lens distortion that screams "panorama"
- Watermark, logo, or text

Do include:
- Warm late-afternoon or early-evening light (soft, directional)
- Real material texture on the facade (stone, wood, plaster — not flat gradients)
- Vegetation and surrounding context (not floating buildings)
- A subtle hint of depth beyond the visible frame (a corner suggesting a turn, a path leading out)

---

## 3. Asset list

### 3.1 Hero — `detail-360-eksterijer.webp`

| | |
|---|---|
| **Path** | `public/artwork/detail-360-eksterijer.webp` |
| **Dimensions** | 1920 × 1080 px (16:9) |
| **Subject** | A residential or mixed-use building, 3/4 angle view (not orthogonal facade), late-afternoon golden light, visible facade materials. |
| **Composition** | Building occupies left 60% of frame; right 40% shows surrounding context (street, garden, neighboring buildings half-cropped). Suggest rotation by letting the building corner extend toward the viewer. |
| **Mood** | "This is a place." Calm, dignified, professional. NOT dramatic, NOT cinematic-overlit. |
| **Alt text in code** | "360° eksterijer — Elegant Render" (already set by metadata) |

### 3.2 Problem visual (optional) — `expert-360-eksterijer-problem.webp`

| | |
|---|---|
| **Path** | `public/artwork/expert-360-eksterijer-problem.webp` |
| **Dimensions** | 1600 × 1200 px (4:3) |
| **Subject** | Split-frame composition: **left half** shows the same building from a fixed flat angle (the "static render" approach); **right half** shows the same building from a 3/4 rotated angle revealing depth and material variation. |
| **Purpose** | Visual proof of what 360 panorama unlocks vs. a static render. |
| **Fallback** | If not delivered, the page uses the first portfolio image automatically (graceful fallback exists in `ProblemVisual` helper in `[slug]/page.tsx`). |

### 3.3 Portfolio — 4 images

Four different building typologies, each a curated frame from what would be a 360 panorama of that project. Naming: `portfolio-360-eksterijer-NN.webp` (01..04).

| # | Path | Building type | Subject |
|---|---|---|---|
| 01 | `public/artwork/portfolio-360-eksterijer-01.webp` | **Stambena zgrada** | Frame from a panorama — street-level perspective, entrance facade, approach path |
| 02 | `public/artwork/portfolio-360-eksterijer-02.webp` | **Porodična kuća** | Frame from a panorama — daytime scene, yard, street-facing side, mature vegetation |
| 03 | `public/artwork/portfolio-360-eksterijer-03.webp` | **Poslovni objekat** | Frame from a panorama — entrance facade, brand-visible angle (signage area neutral, no real brand), late-afternoon light |
| 04 | `public/artwork/portfolio-360-eksterijer-04.webp` | **Masterplan / kompleks** | Frame from a panorama — surrounding context, multiple buildings in frame, suggesting a larger development |

Each portfolio image must be **a different project** — not the same building four times. The viewer scrolls and intuits "you do this for many kinds of objects."

### 3.4 Already exists — no new asset needed

- `public/artwork/listing-exterior-360.webp` — already used by services-showcase card. **Do not replace** unless quality upgrade is intended.

---

## 4. Alt text pattern (for code)

Each portfolio image already has alt text wired in `services.ts` `portfolioImages[]`:

| File | Alt text |
|---|---|
| `portfolio-360-eksterijer-01.webp` | "Frame iz 360 panorame stambene zgrade — ulična perspektiva" |
| `portfolio-360-eksterijer-02.webp` | "Frame iz 360 panorame porodične kuće — dnevna scena" |
| `portfolio-360-eksterijer-03.webp` | "Frame iz 360 panorame poslovnog objekta — ulazna fasada" |
| `portfolio-360-eksterijer-04.webp` | "Frame iz 360 panorame masterplana — kontekst okruženja" |

Keep alt text in this format for any future swaps: **"Frame iz 360 panorame [tip objekta] — [perspektiva]"**.

---

## 5. Delivery checklist

- [ ] `detail-360-eksterijer.webp` (1920×1080, < 400 KB)
- [ ] `expert-360-eksterijer-problem.webp` (1600×1200, optional)
- [ ] `portfolio-360-eksterijer-01.webp` (1920×1080)
- [ ] `portfolio-360-eksterijer-02.webp` (1920×1080)
- [ ] `portfolio-360-eksterijer-03.webp` (1920×1080)
- [ ] `portfolio-360-eksterijer-04.webp` (1920×1080)
- [ ] All files dropped into `public/artwork/`
- [ ] WebP quality 85, EXIF stripped, sRGB profile
- [ ] No watermarks, no UI overlays, no panorama distortion
- [ ] Each portfolio image shows a different building typology

---

## 6. Future enhancement (not needed for first ship)

- A **curated Kuula collection** that contains only exterior 360 panoramas (today the page uses the existing mixed `7kLnB` collection from the legacy `360-ture-i-animacije` service). When ready, just replace `detailEmbedSrc` in [src/lib/catalog/services.ts](src/lib/catalog/services.ts) `360-eksterijer` block with the new collection URL.
