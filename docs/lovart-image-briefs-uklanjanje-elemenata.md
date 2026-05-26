# Lovart image brief — Uklanjanje predmeta
# Service page: /usluge/uklanjanje-elemenata (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **Uklanjanje predmeta** (€12 jednostavno / €25 kompleksno po slici — agenti nekretnina i fotografi kada se prostor mora prikazati čist a fizičko sređivanje nije isplativo). Sedam fajlova: 1 hero + 2 problem slider halves (nered ⇄ čist prostor) + 4 portfolio frame-a različitih scenarija.

**Audijencija:** Agencije nekretnina (čist listing photo), fotografi (post-produkcija praznih jedinica). Per-image transformacija, **outsourced** preko White Rook partner mreže.

---

## Global constraints (svih 7 asset-a)

- Hero i portfolio: čisti, sređeni prostori — ne sterilno, ne stejdžovano, samo "ovde se može slikati"
- Problem slider: nered/stvari mora da bude **realističan** — ne "obviously placed clutter", već stvarno životne stvari (knjige, čaše, kablovi, kutije)
- Bez ljudi, bez logoa, bez "Removed!" overlay-a
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB
- Naming basename: `uklanjanje-elemenata`

---

## Asset 1 — Hero

- **Filename:** `detail-uklanjanje-elemenata.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** čista, sređena dnevna soba ili kuhinja — vidljivi nameštaj, podovi, zidovi bez nereda
- **Vibe:** "Spremno za listing fotografiju" — funkcionalno, ne magazinski, ali bez ničega što vizuelno smeta

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-uklanjanje-elemenata-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** ista soba sa **realnim neredom** — torbe na stolici, kablovi na stolu, knjige na podu, šolja sa kafom, otvorena kutija
- **Tone:** "fotograf došao na termin, stan nije sređen" — autentično, ne pretrpano
- **Critical:** identičan kadar kao Asset 3

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-uklanjanje-elemenata-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista soba bez nereda — sve uklonjeno digitalno, pozadina rekonstruisana
- **Critical:** **camera lock obavezna** — isti kadar, samo sadržaj se menja

---

## Asset 4 — Portfolio 01 (dnevna soba — jednostavno uklanjanje)

- **Filename:** `portfolio-uklanjanje-elemenata-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** dnevna soba pre/posle — sitno uklanjanje (lične stvari, magazini, čaše)
- **Alt text:** `"Uklanjanje predmeta — dnevna soba sređena za listing fotografiju"`

---

## Asset 5 — Portfolio 02 (kuhinja — uklanjanje sa rekonstrukcijom)

- **Filename:** `portfolio-uklanjanje-elemenata-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** kuhinja gde je veći aparat ili kuhinjski element uklonjen, pozadina rekonstruisana
- **Alt text:** `"Uklanjanje predmeta — kuhinja sa rekonstruisanom pozadinom posle uklanjanja aparata"`

---

## Asset 6 — Portfolio 03 (kupatilo — toaletne stvari uklonjene)

- **Filename:** `portfolio-uklanjanje-elemenata-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** kupatilo sa uklonjenim toaletnim stvarima sa polica, čistim ogledalima
- **Alt text:** `"Uklanjanje predmeta — kupatilo sa praznim policama spremno za fotografiju"`

---

## Asset 7 — Portfolio 04 (spoljni prostor — uklanjanje vozila / kablova)

- **Filename:** `portfolio-uklanjanje-elemenata-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** spoljna fasada ili dvorište sa uklonjenim parkiranim vozilom ili električnim kablovima
- **Alt text:** `"Uklanjanje predmeta — spoljna fasada bez parkiranog vozila i vidljivih kablova"`

---

## Delivery checklist

- [ ] `detail-uklanjanje-elemenata.webp` (1920×1080)
- [ ] `problem-uklanjanje-elemenata-before.webp` (960×720)
- [ ] `problem-uklanjanje-elemenata-after.webp` (960×720)
- [ ] `portfolio-uklanjanje-elemenata-01.webp` (1920×1080)
- [ ] `portfolio-uklanjanje-elemenata-02.webp` (1920×1080)
- [ ] `portfolio-uklanjanje-elemenata-03.webp` (1920×1080)
- [ ] `portfolio-uklanjanje-elemenata-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 camera-locked (slider zavisi)
- [ ] Portfolio pokriva: jednostavno / kompleksno (rekonstrukcija pozadine) / interijer / eksterijer

---

## Već u repo-u

- `public/artwork/expert-uklanjanje-elemenata-before.webp` + `-after.webp`
- `public/artwork/detail-uklanjanje-elemenata-before.webp` + `-after.webp`
- `public/artwork/listing-item-removal-before.webp` + `-after.webp`
- `public/artwork/ai-tool-item_removal-before.webp` + `-after.webp`

Postojeća detail-*-before/after može da se reuse kao slider halves.

---

## Konteks za lovart prompt

Dva tier-a: jednostavno €12 (sitnice, lične stvari) i kompleksno €25 (veliki objekat sa rekonstrukcijom pozadine). Pakovanje 10+ slika: €10 jednostavno / €20 kompleksno. Portfolio treba da pokrije oba tier-a — slika #2 (kuhinja) i slika #4 (vozilo) pokazuju **kompleksno** sa rekonstrukcijom; slika #1 (dnevna) i slika #3 (kupatilo) pokazuju **jednostavno**.

**Outsourced reminder:** ova usluga ide preko White Rook partner mreže — vizuelno mora da bude na nivou ostalih in-house servisa.
