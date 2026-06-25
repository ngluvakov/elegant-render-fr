# Lovart image brief — Uređenje pejzaža
# Service page: /usluge/prikazi-dvorista (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **Uređenje pejzaža** (€220 — pejzažni arhitekti za prezentaciju klijentu, investitori za zajedničke prostore u kompleksima, vlasnici pred uređenje). Sedam fajlova: 1 hero + 2 problem slider halves (gola parcela ⇄ uređen pejzaž) + 4 portfolio frame-a različitih tipova lokacija.

**Audijencija:** Pejzažni arhitekti (klijentske prezentacije), investitori (zajednički prostori u stambenim kompleksima), vlasnici porodičnih kuća pred uređenje dvorišta.

---

## Global constraints (svih 7 asset-a)

- Color temperature: warm dnevno ili kasno popodne. Bujna vegetacija u realnoj zrelosti (nije "sadno juče").
- Bez ljudi, bez logoa.
- Bez "Landscape Architects" tekstualnih overlay-a, scale bar-ova.
- Materijali: kamenje, drvo, biljke, voda — sve u stvarnim teksturama. Bez plastic AI biljaka.
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB.
- Naming basename: `prikazi-dvorista`.

---

## Asset 1 — Hero

- **Filename:** `detail-prikazi-dvorista.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** uređeno privatno dvorište — popločana terasa, zelene povr­šine, stabla, akcent kamenje
- **Composition:** kuća u pozadini delimično, primarni subjekt je sam pejzaž — kako prostor priziva ljudski boravak
- **Vibe:** "Mesto za nedeljno popodne" — toplo, ostvarivo, ne magazin estate

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-uredjenje-pejzaza-before.webp`
- **Dimensions:** 1280×960 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** gola parcela ili dvorište bez uređenja — zemlja, šut, korov, neoblikovan prostor
- **Tone:** ravno svetlo, "snimano juče pre nego što su radnici stigli"
- **Critical:** identičan ugao kao Asset 3

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-uredjenje-pejzaza-after.webp`
- **Dimensions:** 1280×960 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista parcela uređena — popločana staza, travnjak, sadnice u zrelom stanju, akcent elementi
- **Critical:** **camera lock obavezna** sa Asset 2

---

## Asset 4 — Portfolio 01 (privatno dvorište porodične kuće)

- **Filename:** `portfolio-prikazi-dvorista-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** dvorište porodične kuće sa terasom, travnjakom, sadnicama
- **Alt text:** `"Uređenje pejzaža — privatno dvorište porodične kuće sa terasom i travnjakom"`

---

## Asset 5 — Portfolio 02 (zajednički prostor u stambenom kompleksu)

- **Filename:** `portfolio-prikazi-dvorista-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** zajednički zeleni prostor između stambenih objekata — pešačke staze, klupe, sadnice
- **Alt text:** `"Uređenje pejzaža — zajednički prostor stambenog kompleksa sa pešačkim stazama"`

---

## Asset 6 — Portfolio 03 (vila sa bazenom i terasom)

- **Filename:** `portfolio-prikazi-dvorista-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** dvorište vile — bazen, terasa, sunce-suncobranice, zrele biljke
- **Alt text:** `"Uređenje pejzaža — dvorište vile sa bazenom i terasom"`

---

## Asset 7 — Portfolio 04 (mali park ili kafić-terasa)

- **Filename:** `portfolio-prikazi-dvorista-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** javni mali park, kafić-terasa ili ulični skver sa uređenom vegetacijom
- **Alt text:** `"Uređenje pejzaža — javni prostor sa popločanom stazom i zrelim sadnicama"`

---

## Delivery checklist

- [ ] `detail-prikazi-dvorista.webp` (1920×1080)
- [x] `problem-uredjenje-pejzaza-before.webp` (1280×960)
- [x] `problem-uredjenje-pejzaza-after.webp` (1280×960)
- [ ] `portfolio-prikazi-dvorista-01.webp` (1920×1080)
- [ ] `portfolio-prikazi-dvorista-02.webp` (1920×1080)
- [ ] `portfolio-prikazi-dvorista-03.webp` (1920×1080)
- [ ] `portfolio-prikazi-dvorista-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 camera-locked
- [ ] Portfolio pokriva i privatno i zajedničko (developerski use case)

---

## Već u repo-u

- `public/artwork/expert-prikazi-dvorista-before.webp` + `-after.webp`
- `public/artwork/detail-prikazi-dvorista-before.webp` + `-after.webp`
- `public/artwork/listing-landscape-before.webp` + `-after.webp`

---

## Konteks za lovart prompt

€220 baza pokriva modelovanje terena + vegetaciju + prvi prikaz. Dodatni ugao iste lokacije: €45 (80% jeftiniji). "Pogled iz vazduha na celu lokaciju" je add-on €380 — uradi to kao **opciono Asset 8** ako budžet dozvoli (nije obavezno).
