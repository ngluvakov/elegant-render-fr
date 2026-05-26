# Lovart image brief — 3D situacioni planovi
# Service page: /usluge/3d-situacioni (planned dedicated landing)
# Prepared: 2026-05-26
# Status: brief — artwork pending

Image set za **3D situacione planove** (€350 — masterplani, stambeni kompleksi, poslovne zone, razvojni projekti). Sedam fajlova: 1 hero + 2 problem slider halves (2D plan ⇄ 3D plan sa kontekstom) + 4 portfolio frame-a različitih kompleksa.

**Audijencija:** Investitori i developeri (masterplan prezentacije), urbanisti i studija (regulatorne procedure), arhitekte (investitorske ponude). **Najviši tier** u našem katalogu — €350 baza, B2B premium.

---

## Global constraints (svih 7 asset-a)

- Color temperature: 5000–5500K dnevno svetlo — masterplan se gleda na dnevnom svetlu, ne kasno popodne.
- Oblique 45° kamera obavezna — bird's eye perspective, ali NE potpuna nadir (zenith view). Ta perspektiva razlikuje "situacioni plan" od "GIS karte".
- Bez ljudi, bez vozila u prevelikom broju (par parkiranih auta da skala bude jasna).
- Bez compass roses, scale bars, oznaka parcela ("PARCELA 1234/2"), GIS overlay-a.
- Materijali: realan asfalt, beton, šljunak, trava, drveće u zrelom stanju.
- Output: WebP, sRGB, q85, EXIF stripped, < 410 KB.
- Naming basename: `3d-situacioni`.

---

## Asset 1 — Hero

- **Filename:** `detail-3d-situacioni.webp`
- **Dimensions:** 1920×1080 (16:9)
- **Subject:** stambeni kompleks sa 3-5 objekata, zajedničkim prostorima, pristupnim ulicama, parkingom, zelenilom — cela parcela u jednom kadru
- **Composition:** kompleks zauzima centralnih 60% kadra, periferija pokazuje susednu izgradnju (mali deo)
- **Vibe:** "Ovo je projekat koji se prodaje fondu" — premium, ozbiljno, kompletno

---

## Asset 2 — Problem visual (BEFORE half)

- **Filename:** `problem-3d-situacioni-before.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailBeforeAsset` → leva strana `BeforeAfterReveal`
- **Subject:** **2D situacioni plan** istog kompleksa — vektorski izgled, samo gabariti objekata + putevi + parcele
- **Tone:** "stručni crtež" — namerno deluje teško razumljivo

---

## Asset 3 — Problem visual (AFTER half)

- **Filename:** `problem-3d-situacioni-after.webp`
- **Dimensions:** 960×720 (4:3)
- **Wiring:** `detailAfterAsset` → desna strana slider-a
- **Subject:** ista parcela u **3D oblique view** sa svim objektima, putevima, zelenilom, kontekstom
- **Critical:** **gabariti se moraju poklopiti** sa Asset 2 (slider pokazuje "isti masterplan, dva prikaza")

---

## Asset 4 — Portfolio 01 (stambeni kompleks 3–4 zgrade)

- **Filename:** `portfolio-3d-situacioni-01.webp`
- **Dimensions:** 1920×1080
- **Subject:** masterplan stambenog kompleksa sa 3-4 stambene zgrade, zajedničkim prostorima, parking
- **Alt text:** `"3D situacioni plan — stambeni kompleks sa 3 zgrade, zajedničkim prostorom i parking zonama"`

---

## Asset 5 — Portfolio 02 (poslovna zona / mixed-use)

- **Filename:** `portfolio-3d-situacioni-02.webp`
- **Dimensions:** 1920×1080
- **Subject:** mixed-use razvoj — kombinacija stambenog i poslovnog dela na parceli
- **Alt text:** `"3D situacioni plan — mixed-use razvoj sa stambenim i poslovnim objektima"`

---

## Asset 6 — Portfolio 03 (manji masterplan — vile / kuće na parcelama)

- **Filename:** `portfolio-3d-situacioni-03.webp`
- **Dimensions:** 1920×1080
- **Subject:** parcele sa porodičnim kućama / vilama, individualna dvorišta, ulice
- **Alt text:** `"3D situacioni plan — parcele sa porodičnim kućama i individualnim dvorištima"`

---

## Asset 7 — Portfolio 04 (sezonska varijanta ili faza izgradnje)

- **Filename:** `portfolio-3d-situacioni-04.webp`
- **Dimensions:** 1920×1080
- **Subject:** isti masterplan u drugačijoj fazi (npr. prva faza izgradnje vidljiva, druga faza u nazaku) — komunicira da je razvoj phased
- **Alt text:** `"3D situacioni plan — prva faza izgradnje vidljiva, kasnije faze nagovešten kontekst"`

---

## Delivery checklist

- [ ] `detail-3d-situacioni.webp` (1920×1080)
- [ ] `problem-3d-situacioni-before.webp` (960×720) — 2D vektorski plan
- [ ] `problem-3d-situacioni-after.webp` (960×720) — 3D oblique view istih gabarita
- [ ] `portfolio-3d-situacioni-01.webp` (1920×1080)
- [ ] `portfolio-3d-situacioni-02.webp` (1920×1080)
- [ ] `portfolio-3d-situacioni-03.webp` (1920×1080)
- [ ] `portfolio-3d-situacioni-04.webp` (1920×1080)
- [ ] Asset 2 + Asset 3 gabariti se poklapaju
- [ ] Oblique 45° kroz ceo set — NE nadir
- [ ] Portfolio pokriva: stambeni / mixed-use / kuće na parcelama / phased razvoj

---

## Već u repo-u

- `public/artwork/expert-3d-situacioni.webp` (postojeća single image)
- `public/artwork/detail-3d-situacioni.webp` (postojeća single image — biće zamenjena novim 3D hero-om)
- `public/artwork/listing-siteplan.webp` (showcase card)

---

## Konteks za lovart prompt

€350 baza = kompletan teren + svi objekti + pristup + pejzaž + prvi prikaz iz vazduha. Add-ons: dodatni ugao €65 (81% jeftiniji), sezonska varijanta €85, prikaz po fazama izgradnje €95. Slika #7 (faze izgradnje) je add-on koji prodajemo — neka bude jasna u portfoliju.

**Premium tier reminder:** ovo je najskuplja usluga u katalogu. Slike moraju da odražavaju "developer-grade", ne "freelance side project".
