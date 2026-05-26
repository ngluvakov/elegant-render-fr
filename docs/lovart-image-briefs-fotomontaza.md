# Lovart image brief — Fotomontaža
# Service page: /usluge/fotomontaza (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **Fotomontažu** (€300 — 3D objekat uklopljen u stvarnu fotografiju lokacije, za regulatorne procedure, javnu raspravu, investitorske prezentacije). Sedam fajlova: 1 hero + 2 problem slider halves (prazna lokacija ⇄ objekat uklopljen) + 4 portfolio frame-a različitih scenarija.

**Audijencija:** Investitori i arhitekte koji se bore za urbanističku dozvolu ili predstavljaju projekat fondu/odboru gde realnost lokacije presuđuje. Premium tier — ovo je najbliže "rendering as evidence" usluge u našem katalogu.

---

## Global constraints (svih 7 asset-a)

- Photographic realism: svaka slika MORA da deluje kao stvarna fotografija sa stvarnog mesta. Bez "obviously 3D" cue-ova (perfect lighting, glassy materials, floating shadows).
- Color temperature: matches the photographic source — varira od jutarnjeg do popodnevnog. Slike treba da osećaju "snimano u određenom trenutku".
- Bez UI overlay-a, watermark-a, "as proposed" tekstualnih labela.
- Materijali objekta moraju da imaju vidljivu teksturu i blagi imperfections (ne plastic AI-look).
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB.
- Naming basename: `fotomontaza`.

---

## Asset 1 — Hero

- **Filename:** `detail-fotomontaza.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** modernan objekat (porodična kuća ili manja zgrada) **uklopljen u stvarnu uličnu fotografiju** — sa susednim postojećim zgradama, stablima, parkiranim autima
- **Composition:** objekat zauzima ~40% kadra, ostatak je real-world kontekst (ulica, susedi, parking, vegetacija)
- **Light:** popodnevno, prirodne senke od stabala i okolnih zgrada padaju i preko predloženog objekta — ovo je signal verodostojnosti
- **Vibe:** "Stoji tu kao da je već izgrađen"

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-fotomontaza-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** stvarna fotografija lokacije — prazna parcela ili lokacija pre intervencije, sa susedima, ulicom, vegetacijom
- **Tone:** "snimak iz aprila 2025" feel — stvarna fotografija, ne stilizovana

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-fotomontaza-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista lokacija sa predloženim objektom uklopljenim u kadar
- **Critical:** **camera lock obavezna** — isti ugao, isti zoom, ista perspektiva. Slider povlači "pre i posle" — geometrija mora da se savršeno poklapa.

---

## Asset 4 — Portfolio 01 (porodična kuća na parceli)

- **Filename:** `portfolio-fotomontaza-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** porodična kuća uklopljena u stvarnu uličnu fotografiju u Srbiji ili regionu — vidljiva susedstva
- **Alt text:** `"Fotomontaža — porodična kuća uklopljena u stvarnu uličnu fotografiju"`

---

## Asset 5 — Portfolio 02 (stambena zgrada u urbanom kontekstu)

- **Filename:** `portfolio-fotomontaza-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** manja stambena zgrada uklopljena u uličnu fotografiju gradskog jezgra
- **Alt text:** `"Fotomontaža — stambena zgrada u urbanom kontekstu"`

---

## Asset 6 — Portfolio 03 (poslovni objekat)

- **Filename:** `portfolio-fotomontaza-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** poslovni objekat ili manji kompleks uklopljen u fotografiju lokacije
- **Alt text:** `"Fotomontaža — poslovni objekat uklopljen u fotografiju lokacije"`

---

## Asset 7 — Portfolio 04 (vila ili objekat u prirodi)

- **Filename:** `portfolio-fotomontaza-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** vila ili odmaralište uklopljeno u fotografiju prirode (jezero, planina, more)
- **Alt text:** `"Fotomontaža — vila uklopljena u prirodno okruženje"`

---

## Delivery checklist

- [ ] `detail-fotomontaza.webp` (1920×1080)
- [ ] `problem-fotomontaza-before.webp` (960×720)
- [ ] `problem-fotomontaza-after.webp` (960×720)
- [ ] `portfolio-fotomontaza-01.webp` (1920×1080)
- [ ] `portfolio-fotomontaza-02.webp` (1920×1080)
- [ ] `portfolio-fotomontaza-03.webp` (1920×1080)
- [ ] `portfolio-fotomontaza-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 camera-locked (slider zavisi)
- [ ] Photographic realism kroz ceo set — bez "obviously rendered" indikatora

---

## Već u repo-u

- `public/artwork/expert-fotomontaza-before.webp` + `-after.webp`
- `public/artwork/detail-fotomontaza-before.webp` + `-after.webp`
- `public/artwork/listing-photomontage-before.webp` + `-after.webp`

Postojeće detail-*-before/after može da se reuse ako su fotorealistični. Premium tier zaslužuje novi set radi prezentacije.

---

## Konteks za lovart prompt

€300 baza pokriva analizu fotografije + uklapanje + prvi prikaz. Dodatni ugao iz iste fotografije: €55 (82% jeftiniji). Druga fotografija iste lokacije: €85. Hero mora da prikaže najteži tehnički momenat — uklapanje svetla i senki između stvarne fotografije i 3D modela. Ako se to ne vidi, ostatak prodaje promaši.
