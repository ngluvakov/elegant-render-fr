# Lovart image brief — Dnevni u noćni prikaz
# Service page: /usluge/dan-u-noc (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **Dnevni u noćni prikaz** (€10 po slici — agenti nekretnina i investitori kada ista scena treba i dnevnu i večernju verziju za marketing). Sedam fajlova: 1 hero + 2 problem slider halves (dnevna fotografija ⇄ večernja transformacija) + 4 portfolio frame-a različitih transformacija.

**Audijencija:** Agencije nekretnina (dramatic listing photos), investitori (marketing kampanje sa dnevno/večernjim varijantama). Per-image transformacija, **outsourced** preko White Rook partner mreže.

---

## Global constraints (svih 7 asset-a)

- Hero i portfolio: **dramatičan dusk look** — narandžasto/ljubičasto nebo, topao prozor-glow, fasada osvetljena spolja
- Problem slider: dnevna verzija mora da bude **iste scene** kao "after" — slider povlači jednu preko druge
- Bez ljudi (osim ako foto već ima), bez logoa
- Bez "Day to Dusk" tekstualnih overlay-a, "Before/After" tagova
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB
- Naming basename: `dan-u-noc`

---

## Asset 1 — Hero

- **Filename:** `detail-dan-u-noc.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** modernan eksterijer (porodična kuća ili manja zgrada) u **dusk transformaciji** — toplo nebo, osvetljeni prozori, fasadno spolja osvetljenje, vegetacija u tamnijoj paleti
- **Composition:** subject malo levo, prostor za hero overlay; nebo zauzima gornju trećinu sa gradijentom narandžasto→ljubičasto
- **Vibe:** "Ovo se prodaje na listing fotografiji" — luksuzno bez kiča

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-dan-u-noc-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** **dnevna fotografija** iste kuće — ravno popodnevno svetlo, plavo nebo bez oblaka, prosečna real-estate-style listing fotografija
- **Tone:** "kako agent obično snima objekat" — funkcionalno, ne dramatic
- **Critical:** identičan kadar kao Asset 3

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-dan-u-noc-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista kuća u dusk transformaciji — promenjeno nebo, osvetljeni prozori, fasadno osvetljenje
- **Critical:** **camera lock obavezna** — isti kadar, samo svetlo se menja

---

## Asset 4 — Portfolio 01 (porodična kuća — dusk)

- **Filename:** `portfolio-dan-u-noc-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** porodična kuća sa terasom, osvetljeni prozori, akcent svetla u dvorištu
- **Alt text:** `"Dnevni u noćni — porodična kuća sa osvetljenim prozorima i fasadnim svetlom"`

---

## Asset 5 — Portfolio 02 (stambena zgrada — dusk)

- **Filename:** `portfolio-dan-u-noc-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** stambena zgrada sa terasama, osvetljeni stanovi, ulična svetla
- **Alt text:** `"Dnevni u noćni — stambena zgrada sa osvetljenim terasama u večernjem režimu"`

---

## Asset 6 — Portfolio 03 (vila sa bazenom)

- **Filename:** `portfolio-dan-u-noc-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** vila sa bazenom — voda reflektuje topao dusk, podvodno osvetljenje bazena, terasa sa light fixtures
- **Alt text:** `"Dnevni u noćni — vila sa osvetljenim bazenom i terasom"`

---

## Asset 7 — Portfolio 04 (poslovni objekat ili restoran-terasa)

- **Filename:** `portfolio-dan-u-noc-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** poslovni objekat ili restoran sa terasom — fasadno osvetljenje, neon ili sign-age vidljivo (ali bez specifične brendiranja)
- **Alt text:** `"Dnevni u noćni — poslovni objekat sa fasadnim osvetljenjem i osvetljenim ulazom"`

---

## Delivery checklist

- [ ] `detail-dan-u-noc.webp` (1920×1080)
- [ ] `problem-dan-u-noc-before.webp` (960×720)
- [ ] `problem-dan-u-noc-after.webp` (960×720)
- [ ] `portfolio-dan-u-noc-01.webp` (1920×1080)
- [ ] `portfolio-dan-u-noc-02.webp` (1920×1080)
- [ ] `portfolio-dan-u-noc-03.webp` (1920×1080)
- [ ] `portfolio-dan-u-noc-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 camera-locked (isti kadar)
- [ ] Portfolio pokriva: porodična / stambena / vila / poslovna typology

---

## Već u repo-u

- `public/artwork/expert-dan-u-noc-before.webp` + `-after.webp`
- `public/artwork/detail-dan-u-noc-before.webp` + `-after.webp`
- `public/artwork/listing-day-to-dusk-before.webp` + `-after.webp`
- `public/artwork/ai-tool-day_to_dusk-before.webp` + `-after.webp`

Postojeća detail-*-before/after može da se reuse kao slider halves. Hero i 4 portfolio su novi.

---

## Konteks za lovart prompt

€10 po slici, €8 po slici za pakovanje 10+ slika. Rush 24h: +50% (outsourced flag). Hero treba da deluje **fotorealistično** — ne "obviously rendered" — jer se prodaje kao retouch / post-produkcija, ne kao 3D render. Razlika u odnosu na klasičan render eksterijera: ovde menjamo postojeću fotografiju, ne gradimo iz nacrta.
