# Lovart image brief — Virtuelno opremanje
# Service page: /usluge/virtuelno-opremanje (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set for the **Virtuelno opremanje** landing page (€18 prva slika, virtual staging za prazne nekretnine — agencije i vlasnici). Sedam fajlova: 1 hero + 2 problem slider halves (prazna ⇄ opremljena) + 4 portfolio frame-a različitih tipova prostorija.

**Audijencija:** Agenti nekretnina i vlasnici praznih jedinica koji žele brže klikove na oglas i više poziva. B2C, "po slici" pricing model.

---

## Global constraints (svih 7 asset-a)

- Color temperature: 5000–5500K dnevno svetlo ili kasno popodne. Topla editorial paleta — ne Instagram filter, ne real estate stock.
- Bez ljudi u kadru. Life-implied details OK (knjiga, šolja, biljka).
- Bez logoa, watermark-a, MLS overlay-a, real-estate listing UI.
- Mature materijali — drvo, tekstil, kamen. Bez plastic glossy AI-look.
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB per file.
- Naming basename: `virtuelno-opremanje`.
- Drop u `public/artwork/`.

---

## Asset 1 — Hero

- **Filename:** `detail-virtuelno-opremanje.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** topla dnevna soba kompletno opremljena — kauč, kafe-sto, biljke, ćilim, prirodno svetlo
- **Composition:** 3/4 view, prostor za hero overlay (subject malo levo)
- **Vibe:** "Ovaj stan može da bude moj" — emocionalno, ne real-estate sterilno

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-virtuelno-opremanje-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal` slider-a
- **Subject:** **fotografija** prazne nekretnine (ne render!) — beli zidovi, parket, prazno. Realistično "snimljeno u nekretnini koja se prodaje".
- **Tone:** ravno dnevno svetlo, slabe senke, deluje "neprivlačno"
- **Critical:** identičan ugao kao Asset 3 — slider povlači jednu preko druge

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-virtuelno-opremanje-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista soba sa virtuelno postavljenim nameštajem — kauč, ćilim, slika na zidu, biljka, lampa
- **Critical:** **camera lock obavezna** (BeforeAfterReveal kompozituje jedna preko druge)

---

## Asset 4 — Portfolio 01 (dnevna soba)

- **Filename:** `portfolio-virtuelno-opremanje-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** opremljena dnevna soba — drugi stil od hero-a (npr. moderniji minimalist)
- **Alt text:** `"Virtuelno opremanje — moderna dnevna soba sa minimalističkim nameštajem"`

---

## Asset 5 — Portfolio 02 (spavaća)

- **Filename:** `portfolio-virtuelno-opremanje-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** opremljena spavaća soba — krevet, noćni stočići, lampe, topla paleta
- **Alt text:** `"Virtuelno opremanje — spavaća soba sa toplim materijalima"`

---

## Asset 6 — Portfolio 03 (kuhinja sa trpezarijom)

- **Filename:** `portfolio-virtuelno-opremanje-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** opremljena kuhinja sa trpezarijskim stolom i stolicama
- **Alt text:** `"Virtuelno opremanje — kuhinja sa trpezarijom i prirodnim svetlom"`

---

## Asset 7 — Portfolio 04 (radni prostor / kućna kancelarija)

- **Filename:** `portfolio-virtuelno-opremanje-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** sekcija namenjena radu od kuće — sto, stolica, polica sa knjigama
- **Alt text:** `"Virtuelno opremanje — kućna kancelarija sa policama i prirodnim svetlom"`

---

## Delivery checklist

- [ ] `detail-virtuelno-opremanje.webp` (1920×1080)
- [ ] `problem-virtuelno-opremanje-before.webp` (960×720)
- [ ] `problem-virtuelno-opremanje-after.webp` (960×720)
- [ ] `portfolio-virtuelno-opremanje-01.webp` (1920×1080)
- [ ] `portfolio-virtuelno-opremanje-02.webp` (1920×1080)
- [ ] `portfolio-virtuelno-opremanje-03.webp` (1920×1080)
- [ ] `portfolio-virtuelno-opremanje-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 camera-locked (slider zavisi)
- [ ] Każda portfolio slika prikazuje drugačiji tip prostorije

---

## Već u repo-u (alternativa ako lovart kasni)

- `public/artwork/expert-virtuelno-opremanje-before.webp` (postojeća)
- `public/artwork/expert-virtuelno-opremanje-after.webp` (postojeća)
- `public/artwork/detail-virtuelno-opremanje-before.webp` (postojeća)
- `public/artwork/detail-virtuelno-opremanje-after.webp` (postojeća)
- `public/artwork/listing-staging-before.webp` + `-after.webp` (showcase card pair)

Postojeće detail-*-before/after mogu se ponovo upotrebiti kao slider halves ako su dovoljnog kvaliteta — wire bi onda bilo bez novih problem-* fajlova. Preporuka: koristi nove lovart fajlove radi konzistentnosti seta.

---

## Konteks za lovart prompt

Cena €18 = jedna slika. €15 svaka sledeća soba iste nekretnine. Pakovanje 10+ slika: €13 po slici. Add-on "promena stila opremanja iste sobe" (€12) sugeriše da set treba da pokazuje različite stilove — uključi makar dva stilska pravca u portfoliju (npr. moderni minimalist + warm Scandinavian).
