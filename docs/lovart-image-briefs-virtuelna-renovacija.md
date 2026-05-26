# Lovart image brief — Virtuelna renovacija
# Service page: /usluge/virtuelna-renovacija (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **Virtuelnu renovaciju** (€66 prvi prikaz — vlasnici pred adaptaciju, dizajneri enterijera, agencije pred prodaju). Sedam fajlova: 1 hero + 2 problem slider halves (zastareo prostor ⇄ renoviran) + 4 portfolio frame-a različitih renovacija.

**Audijencija:** Vlasnici nekretnine koji planiraju adaptaciju, dizajneri enterijera koji predstavljaju opcije klijentu, agencije koje prodaju "as-is" stanove ali žele da pokažu potencijal.

---

## Global constraints (svih 7 asset-a)

- Color temperature: 5000–5500K. Topla, ne sterilno. Warm editorial register.
- Bez ljudi u kadru. Life-implied OK.
- Bez logoa, watermark-a, "Before/After" tekstualnih overlay-a — to renderuje slider.
- Mature materijali — drvo, kamen, tekstil. Bez plastic AI-look.
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB.
- Naming basename: `virtuelna-renovacija`.

---

## Asset 1 — Hero

- **Filename:** `detail-virtuelna-renovacija.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** kompletno renoviran prostor — npr. kuhinja sa novim podovima, ostrvom, materijalima
- **Vibe:** "Ovako bi moglo da izgleda" — aspirational ali ostvarivo, ne magazinski neralistično

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-virtuelna-renovacija-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** **fotografija** zastarele prostorije — pločice iz '90, kuhinjski elementi koji su služili, stari podovi. Realistično "snimak postojećeg stanja".
- **Tone:** ravno svetlo, prirodne mane vidljive
- **Critical:** identičan ugao kao Asset 3

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-virtuelna-renovacija-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista prostorija potpuno renovirana — nove pločice, kuhinjski elementi, podovi, osvetljenje
- **Critical:** **camera lock obavezna** sa Asset 2

---

## Asset 4 — Portfolio 01 (kuhinja renovacija)

- **Filename:** `portfolio-virtuelna-renovacija-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** moderna kuhinja sa kuhinjskim ostrvom i kamenom radnom pločom
- **Alt text:** `"Virtuelna renovacija — moderna kuhinja sa ostrvom i kamenom radnom pločom"`

---

## Asset 5 — Portfolio 02 (kupatilo renovacija)

- **Filename:** `portfolio-virtuelna-renovacija-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** renovirano kupatilo — tuš-kabina od stakla, kamene pločice, pendant svetla
- **Alt text:** `"Virtuelna renovacija — kupatilo sa staklenom tuš-kabinom i kamenim materijalima"`

---

## Asset 6 — Portfolio 03 (dnevna soba renovacija)

- **Filename:** `portfolio-virtuelna-renovacija-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** dnevna soba sa novim podovima, zidnim oblogama, prepravljenim layout-om
- **Alt text:** `"Virtuelna renovacija — dnevna soba sa novim podovima i toplim materijalima"`

---

## Asset 7 — Portfolio 04 (radni prostor / studio)

- **Filename:** `portfolio-virtuelna-renovacija-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** renovirani radni prostor ili kućna kancelarija — funkcionalni layout, novi materijali
- **Alt text:** `"Virtuelna renovacija — radni prostor sa policama i prirodnim svetlom"`

---

## Delivery checklist

- [ ] `detail-virtuelna-renovacija.webp` (1920×1080)
- [ ] `problem-virtuelna-renovacija-before.webp` (960×720)
- [ ] `problem-virtuelna-renovacija-after.webp` (960×720)
- [ ] `portfolio-virtuelna-renovacija-01.webp` (1920×1080)
- [ ] `portfolio-virtuelna-renovacija-02.webp` (1920×1080)
- [ ] `portfolio-virtuelna-renovacija-03.webp` (1920×1080)
- [ ] `portfolio-virtuelna-renovacija-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 camera-locked
- [ ] Portfolio pokriva 4 različite prostorije

---

## Već u repo-u

- `public/artwork/expert-virtuelna-renovacija-before.webp` + `-after.webp`
- `public/artwork/detail-virtuelna-renovacija-before.webp` + `-after.webp`
- `public/artwork/listing-renovation-before.webp` + `-after.webp`

Postojeće detail-*-before/after može da se reuse za slider ako su dovoljnog kvaliteta. Preporuka: novi lovart set radi konzistentnosti.

---

## Konteks za lovart prompt

Cena €66 = prvi prikaz (kompletan dizajn). Dodatni ugao iste sobe 10% jeftiniji (€59), 4+ ugao 20% (€53), druga soba 15% (€56). Hero treba da prikaže "aha moment" — vidim šta dobijam pre nego što potrošim na izvođače.
