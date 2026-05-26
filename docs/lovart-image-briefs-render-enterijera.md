# Lovart image brief — Render enterijera (statički)
# Service page: /usluge/render-enterijera
# Prepared: 2026-05-26
# Status: artwork delivered + wired in commit (TBD)

Image set for the dedicated **Render enterijera** landing page (statički interior, €170, ceo sprat sa do 10 prostorija). Seven assets total: 1 hero + 2 problem-visual halves (before/after slider) + 4 portfolio frames covering typology range (dnevna, kuhinja, spavaća, kupatilo).

---

## Global constraints (all 7 assets)

- Color temperature: 5000–5500K dnevno ili kasno popodnevno svetlo. Warm editorial register — same family as spoljasnji-renderi hero.
- Bez ljudi u kadru. Life-implied tragovi (knjige na stočiću, šolja, biljka) su prihvatljivi i poželjni.
- Bez logoa, vodenih žigova, UI overlay-a.
- Mature materijali: drvo, kamen, tekstil. Bez plastic glossy AI-look.
- Output: WebP, sRGB, q85, EXIF stripped, target < 410 KB per file.
- Naming basename mirrors `variant.id: "interior-static"` — kasniji 360-interior split (ako ga budemo radili) koristi `interior-360` osnovu, bez kolizije.
- Drop into `public/artwork/`.

---

## Asset 1 — Hero

- **Filename:** `detail-interior-static.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** dnevna soba ili master spavaća — emotional / aspirational room, ne radna prostorija
- **Composition:** 3/4 view (ne ortogonalan facade), centralni subject malo levo, sa prostorom za hero overlay
- **Light:** topla popodnevna ili kasno-jutarnja svetlost kroz prozor
- **Materials:** vidljiv izbor (drvo, tekstil, kamen) — komunicira "stvaran prostor"

---

## Asset 2 — Problem visual (BEFORE half of slider)

- **Filename:** `problem-interior-static-before.webp`
- **Dimensions:** 960×720 px (4:3)
- **Wiring:** feeds `service.detailBeforeAsset` → leva strana `BeforeAfterReveal` slider-a
- **Subject:** prazna soba ili 2D nacrt iste sobe sa labelama
- **Tone:** hladnije, ravno svetlo, bez nameštaja — "problem" side
- **Critical:** identičan ugao kao Asset 3 (BeforeAfterReveal kompozituje preko)

---

## Asset 3 — Problem visual (AFTER half of slider)

- **Filename:** `problem-interior-static-after.webp`
- **Dimensions:** 960×720 px (4:3)
- **Wiring:** feeds `service.detailAfterAsset` → desna strana slider-a
- **Subject:** ista soba potpuno opremljena u Elegant Render registru
- **Critical:** **camera lock sa Asset 2** — isti ugao, ista perspektiva, samo sadržaj prostorije se menja

---

## Asset 4 — Portfolio 01 (dnevna soba)

- **Filename:** `portfolio-interior-static-01.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** dnevna soba — kauč, kafe-sto, prirodno svetlo sa prozora, otvoreni layout ka kuhinji ako moguće

---

## Asset 5 — Portfolio 02 (kuhinja)

- **Filename:** `portfolio-interior-static-02.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** kuhinja — radna ploča, kuhinjski elementi, pendant svetla, materijal radne ploče vidljiv

---

## Asset 6 — Portfolio 03 (glavna spavaća)

- **Filename:** `portfolio-interior-static-03.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** glavna spavaća — krevet, noćni stočići, indirektno svetlo, topla paleta. Light register obavezan — Elegant Render ne ide na dark mood.

---

## Asset 7 — Portfolio 04 (kupatilo)

- **Filename:** `portfolio-interior-static-04.webp`
- **Dimensions:** 1920×1080 px (16:9)
- **Subject:** kupatilo — fokus na materijal (pločica, mermer, kamen), tuš-kabina ili kada, prirodno svetlo ako moguće

---

## Delivery checklist (DONE)

- [x] `detail-interior-static.webp` (1920×1080)
- [x] `problem-interior-static-before.webp` (960×720)
- [x] `problem-interior-static-after.webp` (960×720)
- [x] `portfolio-interior-static-01.webp` (1920×1080) — dnevna
- [x] `portfolio-interior-static-02.webp` (1920×1080) — kuhinja
- [x] `portfolio-interior-static-03.webp` (1920×1080) — spavaća
- [x] `portfolio-interior-static-04.webp` (1920×1080) — kupatilo
- [x] All files in WebP @ q85, < 410 KB, EXIF stripped, sRGB
- [x] Asset 2 + Asset 3 share identical camera position (BeforeAfterReveal slider)
- [x] Each portfolio image shows a different room typology

---

## Already in repo

- `public/artwork/listing-interior-static.webp` — services-showcase listing card image
- `public/artwork/expert-unutrasnji-renderi.webp` — home/quick-order picker thumbnail (reused as `asset` on this Service)

---

## Wiring (already applied in services.ts)

```ts
detailAsset: "/artwork/detail-interior-static.webp",
detailBeforeAsset: "/artwork/problem-interior-static-before.webp",
detailAfterAsset: "/artwork/problem-interior-static-after.webp",
portfolioImages: [
  { src: "/artwork/portfolio-interior-static-01.webp", alt: "Dnevna soba sa kuhinjskim ostrvom — Elegant Render" },
  { src: "/artwork/portfolio-interior-static-02.webp", alt: "Kuhinja sa pendant svetlima i materijalom kamene radne ploče — Elegant Render" },
  { src: "/artwork/portfolio-interior-static-03.webp", alt: "Glavna spavaća soba sa indirektnim svetlom i toplom paletom — Elegant Render" },
  { src: "/artwork/portfolio-interior-static-04.webp", alt: "Kupatilo sa prirodnim svetlom i mermernim materijalom — Elegant Render" },
],
```
