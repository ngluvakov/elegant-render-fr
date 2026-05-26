# Lovart image brief — Prikaz iz vazduha (Aerial renders)
# Service page: /usluge/prikazi-iz-vazduha
# Prepared: 2026-05-26

Image set for the dedicated **Prikazi iz vazduha** (aerial render) landing page. Seven assets total: 1 hero + 2 problem-visual halves (before/after slider) + 4 portfolio frames. Locked in Elegant Gentlemen round-table session `20260526-1500-aerial-render-page`.

---

## Global constraints (all 7 assets)

- Color temperature: 5000–5500K daylight or golden-hour warm. **No cyan/teal grading. No GIS palette.**
- **No compass roses, scale bars, coordinate overlays, watermarks.**
- **No nadir (true vertical top-down) composition** — oblique 45° mandatory on all assets.
- Surrounding context: minimum 2–3 neighboring structures (partial, muted). No floating island objects.
- Vegetation: minimum 15% of visible ground as mature canopy (not planted sticks).
- Human scale: at least one pedestrian or parked vehicle per image.
- Style register: editorial architectural visualization, warm — same palette as Elegant Render exterior renders, viewed from above.
- Output: WebP, sRGB, quality 85 (`cwebp -q 85`), strip EXIF, target < 410 KB per image.
- Drop into `public/artwork/` with exact filenames below.

---

## Asset 1 — Hero

- **Filename:** `detail-exterior-aerial.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** mid-rise residential complex, 4–6 floors, oblique 45°
- **Composition:** building fills ~55–60% of frame vertically; rooftop geometry clearly visible; sky max 30% of frame (upper portion)
- **Light:** early morning or late evening — long shadows fall INTO frame, emphasizing 3D massing and roof material
- **Context:** parcel boundary and greenery at parcel edge visible; surrounding urban block partially in frame (implied neighborhood)
- **Direction note:** NOT identical light direction to `spoljasnji-renderi` hero (which uses eye-level late afternoon)
- **Overlay consideration:** gradient overlay applied in-browser (`from-foreground/85`) — ensure mid-tones in lower-left quadrant are not blown out

---

## Asset 2 — Problem visual (BEFORE half of slider)

- **Filename:** `problem-aerial-before.webp`
- **Dimensions:** 960×720 px (4:3)
- **Wiring:** this file feeds `service.detailBeforeAsset` and renders as the left side of `BeforeAfterReveal` slider (draggable, not side-by-side columns).
- **Subject:** bare parcel — stylized 3D top-oblique recreation of a satellite-register view
- **STRICT:** NO actual satellite data, NO Google/Bing imagery, NO watermarks. Stylized 3D recreation only.
- **Composition:** lot lines visible, no structure, bare earth with rough ground texture
- **Color:** desaturated warm gray/brown — looks like real source material a developer would provide
- **Tone:** low contrast, slightly flat — intentionally the "problem" side

---

## Asset 3 — Problem visual (AFTER half of slider)

- **Filename:** `problem-aerial-after.webp`
- **Dimensions:** 960×720 px (4:3)
- **Wiring:** this file feeds `service.detailAfterAsset` and renders as the right side of `BeforeAfterReveal` slider.
- **Subject:** same parcel bounds as Asset 2, now with completed structure, mature vegetation, and access roads in Elegant Render editorial style
- **Composition:** oblique 45°, warm light, editorial register — must feel noticeably richer and warmer than the "before"
- **Critical:** same camera position, same zoom, same parcel boundary alignment as Asset 2 — only the content of the parcel changes (this is what the slider reveals)

---

## Asset 4 — Portfolio 01 (stambeni kompleks)

- **Filename:** `portfolio-aerial-01.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** residential complex, multiple buildings (3–4), access roads, communal green between blocks
- **Light:** oblique 45°, golden hour
- **Composition:** building massing occupies top 55–60%; parcel boundary, road access, and landscaping visible in lower portion; sky ≤15%
- **Alt text in code:** `"Stambeni kompleks, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render"`

---

## Asset 5 — Portfolio 02 (individualna vila)

- **Filename:** `portfolio-aerial-02.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** individual villa or single-family house, lower oblique angle (closer, more intimate)
- **Composition:** pool or garden clearly visible; parcel boundary legible; surrounding neighbors partially in frame; building + garden in top 55–60%, sky ≤15%
- **Alt text in code:** `"Individualna vila, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render"`

---

## Asset 6 — Portfolio 03 (mešovita namena)

- **Filename:** `portfolio-aerial-03.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** mixed-use building on corner site — retail ground floor + residential above
- **Composition:** two facades visible, implied pedestrian plaza at street corner
- **Alt text in code:** `"Mešovita namena, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render"`

---

## Asset 7 — Portfolio 04 (poslovni / industrijski)

- **Filename:** `portfolio-aerial-04.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** commercial or light-industrial building, higher oblique (more context visible)
- **Composition:** parking lot with cars + landscaping visible; road access from two directions implied
- **Alt text in code:** `"Poslovni objekat, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render"`

---

## Delivery checklist

- [ ] `detail-exterior-aerial.webp` (1920×1080)
- [ ] `problem-aerial-before.webp` (960×720)
- [ ] `problem-aerial-after.webp` (960×720)
- [ ] `portfolio-aerial-01.webp` (1920×1080)
- [ ] `portfolio-aerial-02.webp` (1920×1080)
- [ ] `portfolio-aerial-03.webp` (1920×1080)
- [ ] `portfolio-aerial-04.webp` (1920×1080)
- [ ] All files in WebP @ q85, < 410 KB, EXIF stripped, sRGB
- [ ] No watermarks, compass roses, GIS overlays, or true-nadir compositions
- [ ] Each portfolio image shows a different building typology
- [ ] Asset 2 + Asset 3 share identical camera position (BeforeAfterReveal requires registered framing)

---

## Already in place (do not redeliver)

- `public/artwork/listing-exterior-aerial.webp` — used for services-showcase card and as fallback for og:image during the gap between commits.

---

## Wiring (after delivery)

Drop files into `public/artwork/`. In `src/lib/catalog/services.ts` `prikazi-iz-vazduha` Service block, add:

```ts
detailAsset: "/artwork/detail-exterior-aerial.webp",
detailBeforeAsset: "/artwork/problem-aerial-before.webp",
detailAfterAsset: "/artwork/problem-aerial-after.webp",
portfolioImages: [
  { src: "/artwork/portfolio-aerial-01.webp", alt: "Stambeni kompleks, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render" },
  { src: "/artwork/portfolio-aerial-02.webp", alt: "Individualna vila, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render" },
  { src: "/artwork/portfolio-aerial-03.webp", alt: "Mešovita namena, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render" },
  { src: "/artwork/portfolio-aerial-04.webp", alt: "Poslovni objekat, ptičja perspektiva — parcela, pristupni putevi i zelenilo — Elegant Render" },
],
```

Once these paths are wired, the hero conditional gradient fallback (sage tint) auto-disables — the hero shows the real image again.
