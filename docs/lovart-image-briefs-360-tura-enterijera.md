# Lovart image brief — 360 tura enterijera
# Service page: /usluge/360-tura-enterijera
# Prepared: 2026-05-26
# Status: artwork delivered + wired in commit (TBD)

Image set for the dedicated **360 tura enterijera** landing page (€295, ceo sprat u 360 turi). Seven assets total: 1 hero + 2 problem-visual halves (before/after slider showing rotation reveals more) + 4 portfolio frames from 360 panoramas covering interior typologies.

---

## Global constraints (all 7 assets)

- Color temperature: 5000–5500K dnevno ili kasno popodnevno svetlo. Warm editorial register — same family as render-enterijera (statički), ali sa **spatial** feel umesto intimate.
- Bez ljudi u kadru. Life-implied tragovi prihvatljivi (knjiga, šolja, vaza).
- Bez logoa, vodenih žigova, 360 UI overlay-a (kompas, hotspot pins) — to renderuje iframe.
- Mature materijali: drvo, kamen, tekstil. Bez plastic glossy AI-look.
- Output: WebP, sRGB, q85, EXIF stripped, target < 410 KB per file.
- Naming basename mirrors `variant.id: "interior-360"` — konzistentno sa `exterior-360` šablonom.
- Drop into `public/artwork/`.

---

## Asset 1 — Hero

- **Filename:** `detail-interior-360.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** open-concept dnevna+kuhinja ili master spavaća sa otvorenim layoutom
- **Composition:** 3/4 view sa subjektom mal levo, prostor za hero overlay. Composition mora da implicira prostor van kadra — ugao koji navodi oko da poželi da pogleda iza.
- **Critical:** **ne identičan ugao** kao `detail-interior-static.webp` (render-enterijera hero) — feel mora da bude "spatial", ne intimate

---

## Asset 2 — Problem visual (BEFORE half of slider)

- **Filename:** `problem-interior-360-before.webp`
- **Dimensions:** 960×720 px (4:3)
- **Wiring:** feeds `service.detailBeforeAsset` → leva strana `BeforeAfterReveal` slider-a
- **Subject:** statična slika sobe iz JEDNOG ugla (klasičan render look)
- **Tone:** sugeriše ograničenje "jedne perspektive"

---

## Asset 3 — Problem visual (AFTER half of slider)

- **Filename:** `problem-interior-360-after.webp`
- **Dimensions:** 960×720 px (4:3)
- **Wiring:** feeds `service.detailAfterAsset` → desna strana slider-a
- **Subject:** ista soba iz **drugog ugla** koji otkriva sadržaj koji nije bio vidljiv u #2 (npr. radni kutak, ulazna zona)
- **Critical:** **camera lock NIJE potreban** ovde — poenta je "rotation reveals more", a ne klasičan reveal slider

---

## Asset 4 — Portfolio 01 (open-concept)

- **Filename:** `portfolio-interior-360-01.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** open-concept dnevna + kuhinja — wide frame koji pokazuje vrednost rotacije kroz povezane prostore

---

## Asset 5 — Portfolio 02 (master spavaća)

- **Filename:** `portfolio-interior-360-02.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** glavna spavaća sa indirektnim svetlom i prelazom ka walk-in / kupatilu

---

## Asset 6 — Portfolio 03 (ulazni layout)

- **Filename:** `portfolio-interior-360-03.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** ulaz / hodnik sa pogledom kroz stan — perspektiva koja sugeriše ulazak i istraživanje

---

## Asset 7 — Portfolio 04 (interijer + terasa)

- **Filename:** `portfolio-interior-360-04.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** terasa / balkon sa pogledom na enterijer — most između enterijera i eksterijernog konteksta

---

## Delivery checklist (DONE)

- [x] `detail-interior-360.webp` (1920×1080)
- [x] `problem-interior-360-before.webp` (960×720)
- [x] `problem-interior-360-after.webp` (960×720)
- [x] `portfolio-interior-360-01.webp` (1920×1080) — open-concept
- [x] `portfolio-interior-360-02.webp` (1920×1080) — spavaća
- [x] `portfolio-interior-360-03.webp` (1920×1080) — ulaz/hodnik
- [x] `portfolio-interior-360-04.webp` (1920×1080) — interijer + terasa
- [x] All files in WebP @ q85, < 410 KB, EXIF stripped, sRGB
- [x] Each portfolio image shows a different interior moment

---

## Kuula embed

`https://kuula.co/share/collection/7kLnB` (deljena kolekcija sa 360-eksterijer dok ne napravimo dedicated interior collection).

---

## Already in repo

- `public/artwork/listing-interior-static.webp` — services-showcase listing card (reused as `asset` and `listingAsset` na ovom servisu, jer separate listing-interior-360 ne postoji)

---

## Wiring (already applied in services.ts)

```ts
detailAsset: "/artwork/detail-interior-360.webp",
detailBeforeAsset: "/artwork/problem-interior-360-before.webp",
detailAfterAsset: "/artwork/problem-interior-360-after.webp",
detailEmbedSrc: "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
portfolioImages: [
  { src: "/artwork/portfolio-interior-360-01.webp", alt: "Frame iz 360 ture — open-concept dnevna i kuhinja, prelaz između prostorija" },
  { src: "/artwork/portfolio-interior-360-02.webp", alt: "Frame iz 360 ture — glavna spavaća soba sa indirektnim svetlom" },
  { src: "/artwork/portfolio-interior-360-03.webp", alt: "Frame iz 360 ture — ulazna zona i pogled kroz stan" },
  { src: "/artwork/portfolio-interior-360-04.webp", alt: "Frame iz 360 ture — terasa i prelaz ka enterijernom prostoru" },
],
```
