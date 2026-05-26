# Lovart image brief — 2D i 3D osnove
# Service page: /usluge/osnove (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **2D i 3D osnove** (€20 2D / €29 3D — preglednost rasporeda za oglas, prodaju, dozvolu, planiranje). Sedam fajlova: 1 hero + 2 problem slider halves (CAD/blueprint ⇄ čista 3D osnova) + 4 portfolio frame-a različitih tipova osnova.

**Audijencija:** Agencije nekretnina (oglasi koji prodaju), investitori (tipovi stanova u zgradi), arhitekte (klijent ne čita tehnički crtež).

---

## Global constraints (svih 7 asset-a)

- Color temperature: warm editorial. Bez "tehnical drawing" hladne plavo-bele palete.
- Bez ljudi, bez logoa.
- Bez plot tabel-a, naslova "FLOOR PLAN", scale bar-ova, sever-strelica preko slike.
- Tipografija na osnovi: minimalna i čitljiva. Oznake prostorija ("Dnevna 24m²", "Kuhinja 12m²") u WARM neutralnoj boji, ne crna na beloj.
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB.
- Naming basename: `osnove`.

---

## Asset 1 — Hero

- **Filename:** `detail-osnove.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** **3D osnova** stana sa nameštajem, izometrijski ili lagano oblique view
- **Composition:** sredina sa otvorenim layout-om — nameštaj raspoređen, vidljive prostorije, oznake "Dnevna soba", "Spavaća 1" itd.
- **Vibe:** "Kupac razume raspored na prvi pogled"

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-osnove-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** **klasičan tehnički blueprint** istog stana — crne linije na beloj/blue print pozadini, samo zidovi i otvori, bez nameštaja, sa oznakama dimenzija (npr. "3.20 m", "2.80 m")
- **Tone:** "stručni crtež, ne marketinški materijal" — namerno deluje teško razumljivo bez treniranog oka

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-osnove-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista osnova ali kao **2D ili 3D Elegant Render verzija** — kolorisana, nameštaj prikazan, oznake prostorija u srpskom
- **Critical:** **isti tlocrt geometrije** kao Asset 2 (slider mora da pokaže "isti stan, drugačiji prikaz")

---

## Asset 4 — Portfolio 01 (3D osnova — porodična kuća)

- **Filename:** `portfolio-osnove-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** 3D osnova porodične kuće sa nameštajem, lagano oblique view
- **Alt text:** `"3D osnova — porodična kuća sa rasporedom prostorija i nameštajem"`

---

## Asset 5 — Portfolio 02 (3D osnova — stan)

- **Filename:** `portfolio-osnove-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** 3D osnova stana u zgradi (manji m²) — komaktan layout, nameštaj
- **Alt text:** `"3D osnova — stan u zgradi sa kompaktnim rasporedom"`

---

## Asset 6 — Portfolio 03 (2D čisti plan)

- **Filename:** `portfolio-osnove-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** **2D verzija** — čist kolorisani plan stana, vektorski izgled, oznake i dimenzije
- **Alt text:** `"2D osnova — čist tehnički plan sa oznakama i dimenzijama"`

---

## Asset 7 — Portfolio 04 (dupleks ili dva sprata)

- **Filename:** `portfolio-osnove-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** osnova dupleksa ili dva sprata jedan pored drugog
- **Alt text:** `"3D osnova — dupleks sa rasporedom oba sprata"`

---

## Delivery checklist

- [ ] `detail-osnove.webp` (1920×1080)
- [ ] `problem-osnove-before.webp` (960×720)
- [ ] `problem-osnove-after.webp` (960×720)
- [ ] `portfolio-osnove-01.webp` (1920×1080)
- [ ] `portfolio-osnove-02.webp` (1920×1080)
- [ ] `portfolio-osnove-03.webp` (1920×1080)
- [ ] `portfolio-osnove-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 imaju isti tlocrt geometrije (slider pokazuje isti stan, dva načina prikaza)
- [ ] Portfolio mix: bar 1 dvospratni / dupleks; bar 1 2D čist plan; ostatak 3D

---

## Već u repo-u

- `public/artwork/expert-osnove.webp` (postojeća, koristi se kao card thumbnail)
- `public/artwork/detail-osnove.webp` (postojeća, single image — **biće zamenjena novim 3D hero-om**)
- `public/artwork/listing-floorplan-2d.webp` + `listing-floorplan-3d.webp` (showcase cards)
- `public/artwork/elegant-render-floorplan-3d.webp` (postojeća, može da posluži kao portfolio item ako kvalitet odgovara)

---

## Konteks za lovart prompt

Dve varijante: 2D (€20) i 3D (€29). Hero treba da pokaže **3D verziju** jer je upečatljivija. Portfolio mora da pokrije i 2D (jer ga prodajemo). Add-on "Verzija sa nameštajem" (€6–€8) i "Varijanta dizajna (isti raspored, drugi nameštaj)" sugeriše da portfolio može da pokaže isti raspored sa različitim nameštajem.
