# Naslovna strana — brief slika za lovart.ai

Ovaj dokument je radni list za generisanje 16 slika (4 pojedinačne + 6 before/after parova × 2) koje će zameniti sve postojeće preview slike na naslovnoj strani. Slike se prikazuju u "Minimalni ulaz" kartici (lev kolona) kada korisnik izabere uslugu iz desnog picker panela.

> **360 ture i animacije** ne treba slika — koristi se Kuula 360 iframe (već konfigurisan). Opciono možeš dodati poster sliku kao fallback ako Kuula ne učita.

---

## 1. Tehničke specifikacije (validne za sve slike)

| Parametar | Vrednost |
|---|---|
| **Dimenzije** | **1600 × 1067 px** (3:2 odnos) |
| Format izlaza | WebP, sRGB, kvalitet 85 |
| Mobilni crop | Slika će se na mobilnom kropovati na 4:3 (object-cover), pa važni elementi MORAJU biti unutar centralnih ~80% kadra |
| Naming konvencija | `expert-{slug}.webp` za pojedinačne · `expert-{slug}-before.webp` + `expert-{slug}-after.webp` za parove |
| Putanja | Drop u `public/artwork/` (relativno na repo root) |
| Aspect za before/after par | **Identičan kadar** (ista pozicija kamere, isti zoom). Razlika SAMO u sadržaju (nameštaj, materijali, vegetacija, atmosfera). Ako se kadar mrdne, reveal slider gubi smisao. |

---

## 2. Globalni stil (uneti u svaki prompt kao osnova)

Lovart se često zbunjuje sa "stilom" ako ga ne kažeš eksplicitno. Stavi ovo na kraj svakog prompta:

```
Style: hyperrealistic architectural visualization, professional 
photography, warm natural lighting, balanced exposure, Balkan modern 
aesthetic. Color palette: warm neutrals, sage green, clay terracotta 
accents, oak wood, soft whites. No people in frame. No text, logos, 
watermarks, UI elements. Aspect ratio 3:2 (1600×1067).
```

**Brend kontekst** (za referencu, ne kopiraj u prompt): Elegant Render je B2C arhitektonska vizuelizacija — topao, moderan, pristupačan ton. Ciljaj na "stan koji bi prodavao u Beogradu / Novom Sadu / Nišu", a ne na "luksuzna vila u Cape Codu".

---

## 3. Pojedinačne slike (4 komada)

### 3.1 Unutrašnji renderi → `expert-unutrasnji-renderi.webp`

**Šta treba da prikaže:** Atraktivan, opremljen dnevni boravak iz kuta. Skandinavski-mediteranski mix. Vidi se dovoljno arhitekture (prozor, plafon, pod) da kupac shvati da je ovo "prikaz cele sobe", ne samo deo nameštaja.

**Prompt:**
```
Modern Scandinavian-Mediterranean living room interior, 35mm camera, 
eye-level corner view. Light oak parquet floor, soft white walls, 
floor-to-ceiling window on the left with sheer linen curtains and 
sage-green velvet armchair beside it. Walnut sideboard with ceramic 
vases on the right wall, a large abstract painting above. Subtle 
afternoon light streaming through window, warm golden hour glow. 
Cozy but spacious atmosphere. [+globalni stil]
```

---

### 3.2 Spoljašnji renderi → `expert-spoljasnji-renderi.webp`

**Šta treba da prikaže:** Moderna porodična kuća (može i manja vila) sa naglašenom arhitekturom, jasno se vidi fasada + okruženje. Ne mega-vila, ne luksuz — već "kuća kakvu naručilac uglavnom gradi u Srbiji 2026".

**Prompt:**
```
Modern two-story family house, contemporary architecture with flat roof 
and large windows, white stucco facade with vertical wood cladding on 
the entrance wall. View from front-left at slight low angle (4-foot 
height). Manicured front lawn, single olive tree, paved walkway leading 
to wooden front door. Late afternoon golden hour light, soft long 
shadows. Neutral sky with subtle clouds. Suburban setting, no cars, no 
people. [+globalni stil]
```

---

### 3.3 2D i 3D osnove → `expert-osnove.webp`

**Šta treba da prikaže:** 3D top-down floor plan (pogled odozgo) opremljenog stana. Nameštaj uredno postavljen, vidljiv raspored prostorija. Treba da liči na premijum prospekt za novu zgradu.

**Prompt:**
```
Top-down 3D architectural floor plan of a modern 70m² two-bedroom 
apartment, fully furnished. Visible kitchen, dining area, living 
room with sofa and TV, two bedrooms with beds, bathroom. Light oak 
floors, white walls (sectioned at half-height so floor plan is 
readable). Soft daylight from above, no harsh shadows. Slight 
isometric tilt (10-15 degrees). Clean axonometric render, no labels, 
no measurements visible. [+globalni stil]
```

---

### 3.4 Situacioni planovi → `expert-3d-situacioni.webp`

**Šta treba da prikaže:** Pogled iz vazduha na celu parcelu sa zgradom/zgradama, parkingom, pristupnom stazom, drvećem. Investicioni masterplan vibe, ne mega-projekat — manji kompleks ili masterplan jedne lokacije.

**Prompt:**
```
Aerial drone-view 3D render of a small residential complex masterplan: 
two-story modern apartment building (white stucco + wood accents), 
parking lot for 8 cars, paved walkway with green lawn strips, 
deciduous trees lining the south side, communal courtyard with 
benches. Captured from 45-degree top-down angle, late morning light, 
soft shadows. Realistic terrain with subtle topography. Surrounding 
context: low suburban buildings, neighboring lots simplified. 
[+globalni stil]
```

---

## 4. Before/After parovi (6 parova = 12 slika)

**KRITIČNO:** Za sve parove — **isti kadar, isti zoom, ista perspektiva kamere**. Promeni samo sadržaj.

Lovart taktika: prvo generiši "before" sliku. Onda u istoj sesiji (ili sa "image-to-image" mode) generiši "after" varijantu sa istim seed-om i istom kompozicijom — samo izmeni opisane elemente.

---

### 4.1 Virtuelno opremanje
Putanja: `expert-virtuelno-opremanje-before.webp` + `expert-virtuelno-opremanje-after.webp`

**Koncept:** Prazna spavaća soba → opremljena moderna spavaća soba.

**Before prompt:**
```
Completely empty bedroom interior, 28mm camera, eye-level shot from 
the doorway. Bare oak parquet floor, white walls, single large window 
on the back wall with sheer curtains, soft natural daylight. Just an 
empty room — no furniture, no decor, no rugs. Clean and slightly 
cold atmosphere. [+globalni stil]
```

**After prompt** (isti kadar):
```
The same bedroom from the same camera angle as the previous image — 
now fully furnished. Queen-size bed with sage linen bedding centered 
under the window. Walnut nightstands with table lamps on either side. 
Oversized linen-fabric reading chair in the right corner with floor 
lamp. Soft wool area rug under the bed. Framed botanical art above the 
bed. Warm, inviting, lived-in atmosphere. Same lighting and camera. 
[+globalni stil]
```

---

### 4.2 Virtuelna renovacija
Putanja: `expert-virtuelna-renovacija-before.webp` + `expert-virtuelna-renovacija-after.webp`

**Koncept:** Stara/zapuštena kuhinja → renovirana moderna kuhinja u istom rasporedu.

**Before prompt:**
```
Old dated kitchen interior, 28mm camera, eye-level view from the 
doorway. Worn beige tile floor, yellowing white wall paint, dated 
1990s wooden cabinets in honey-oak finish with brass handles, old 
white laminate countertop, old gas stove, fluorescent ceiling light 
strip. Visible signs of age: scuffs on walls, scratched cabinets. 
Cold harsh overhead lighting. Empty of clutter but visibly outdated. 
[+globalni stil]
```

**After prompt** (isti kadar):
```
The same kitchen from the same camera angle as the previous image — 
now fully renovated. Same layout but: light oak parquet floor, fresh 
white walls, modern flat-front kitchen cabinets in matte sage green 
with brass-bar handles, white quartz countertop, induction cooktop, 
under-cabinet warm LED lighting, single pendant lamp over a small 
breakfast nook. Stylish, calm, modern Balkan kitchen aesthetic. 
[+globalni stil]
```

---

### 4.3 Uređenje pejzaža
Putanja: `expert-prikazi-dvorista-before.webp` + `expert-prikazi-dvorista-after.webp`

**Koncept:** Bara/zapušteno dvorište → uređena bašta sa stazom i biljkama.

**Before prompt:**
```
Empty residential backyard, 24mm camera, slightly elevated shot from 
patio looking outward (about 5-foot camera height). Bare patchy grass, 
some dirt, weeds. Plain wooden fence at the back. No paths, no plants, 
no furniture. Overcast neutral lighting. Dimensions approximately 
12×8 meters, suburban Serbian context. [+globalni stil]
```

**After prompt** (isti kadar):
```
The same backyard from the same camera angle as the previous image — 
now fully landscaped. Curved stone-paver pathway leading from foreground 
to the back fence, well-trimmed lush green lawn on either side, raised 
flower beds with lavender and ornamental grasses on the right, small 
ornamental tree (olive or maple) in the back-left corner, simple wood 
bench beside the path. Soft afternoon golden hour light. Inviting, 
calm, achievable Mediterranean-Balkan garden. [+globalni stil]
```

---

### 4.4 Fotomontaža
Putanja: `expert-fotomontaza-before.webp` + `expert-fotomontaza-after.webp`

**Koncept:** Fotografija prazne parcele (zemljište + nebo) → ista fotografija sa 3D modelom zgrade uklopljenim u tačnu poziciju.

**Before prompt:**
```
Photograph of an empty suburban lot, captured at street level, 35mm 
camera. Flat patch of bare earth with sparse weeds, neighboring older 
houses visible in the distance on either side (lower-rise, 1980s-90s 
Serbian context). Plain wood fence around the lot. Power lines 
overhead. Warm afternoon light, mostly clear sky with subtle clouds. 
Realistic documentary-style photo, no architectural rendering visible. 
[+globalni stil]
```

**After prompt** (isti kadar):
```
The same lot, same camera angle and lighting as the previous image — 
but now a modern two-story family house is photo-realistically inserted 
on the lot. The house has white stucco facade, large windows, slate-gray 
flat roof, single front door, paved driveway. The integration is seamless: 
matching sun angle, matching shadow direction, matching color temperature 
with the neighboring buildings and sky. The photo looks like the house 
was always there. [+globalni stil]
```

---

### 4.5 Dnevni u noćni prikaz
Putanja: `expert-dan-u-noc-before.webp` + `expert-dan-u-noc-after.webp`

**Koncept:** Eksterijer kuće u danu (svetlo, mat) → ista kuća u sutonu (topli unutrašnji svetla, plavkasto nebo, dramatic).

**Before prompt:**
```
Modern single-story family house exterior, 35mm camera, front-three-quarter 
view from approximately 6 meters distance. White stucco facade, large front 
windows, wooden entrance door, paved driveway, small garden patch with 
shrubs. Bright midday daylight, slightly overcast sky, soft even shadows. 
Realistic documentary feel, lights inside the house are off (interior 
appears dark through the windows). [+globalni stil]
```

**After prompt** (isti kadar):
```
The same house, same camera angle as the previous image — but at dusk 
(blue hour). Sky is deep blue-purple gradient. Warm yellow lights are on 
in all front windows, glowing softly. Single warm wall-mounted entrance 
light by the door. Subtle uplighting on the facade emphasizing texture. 
Driveway slightly reflective from earlier rain. Mood: warm, inviting, 
end-of-day. Same composition and house, different time of day. 
[+globalni stil]
```

---

### 4.6 Uklanjanje predmeta
Putanja: `expert-uklanjanje-elemenata-before.webp` + `expert-uklanjanje-elemenata-after.webp`

**Koncept:** Zatrpana fotografija stana sa ličnim stvarima / neredom → ista fotografija sa uklonjenim elementima, čista i spremna za oglas.

**Before prompt:**
```
Lived-in living room photo, real estate listing context, 28mm camera, 
eye-level shot from the corner. Visible clutter: scattered shoes by 
the door, jackets thrown over a chair, mail and magazines on the 
coffee table, a folded laundry basket on the sofa, kids toys on the 
floor, a half-empty water glass and remote control on the side table. 
Otherwise nicely decorated room: oak floor, white walls, modern sofa. 
Realistic documentary style, soft natural daylight from window. 
[+globalni stil]
```

**After prompt** (isti kadar):
```
The same living room from the exact same camera angle and lighting as 
the previous image — but with all clutter digitally removed. Floor is 
clean, no shoes, no laundry basket, no toys, no magazines, no water 
glass. Coffee table empty except a single styled centerpiece (small 
ceramic vase with single sprig of eucalyptus). The room is now 
listing-ready, calm, photographed. Same furniture, same lighting, 
same composition — just clean. [+globalni stil]
```

---

## 5. Sumarni red u repo-u nakon uploada

Kad budeš imao sve slike u `public/artwork/`, izmene u [services.ts](src/lib/catalog/services.ts) su:

| Slug | Polje | Vrednost |
|---|---|---|
| `unutrasnji-renderi` | `asset` | `"/artwork/expert-unutrasnji-renderi.webp"` |
| `spoljasnji-renderi` | `asset` | `"/artwork/expert-spoljasnji-renderi.webp"` |
| `osnove` | `asset` | `"/artwork/expert-osnove.webp"` |
| `3d-situacioni` | `asset` | `"/artwork/expert-3d-situacioni.webp"` |
| `virtuelno-opremanje` | `beforeAsset` + `afterAsset` | `"/artwork/expert-virtuelno-opremanje-before.webp"` + `-after.webp` |
| `virtuelna-renovacija` | `beforeAsset` + `afterAsset` | `"/artwork/expert-virtuelna-renovacija-before.webp"` + `-after.webp` |
| `prikazi-dvorista` | `beforeAsset` + `afterAsset` | `"/artwork/expert-prikazi-dvorista-before.webp"` + `-after.webp` |
| `fotomontaza` | `beforeAsset` + `afterAsset` | `"/artwork/expert-fotomontaza-before.webp"` + `-after.webp` |
| `dan-u-noc` | `beforeAsset` + `afterAsset` | `"/artwork/expert-dan-u-noc-before.webp"` + `-after.webp` |
| `uklanjanje-elemenata` | `beforeAsset` + `afterAsset` | `"/artwork/expert-uklanjanje-elemenata-before.webp"` + `-after.webp` |
| `360-ture-i-animacije` | (zadržava `embedSrc`) | — |

Reci mi "slike su gore" kada budu na mestu, ja ću u jednom commit-u zameniti sve putanje, ukloniti cloudfront `HERO_ASSET / SERVICES_ASSET / PROCESS_ASSET / PORTFOLIO_ASSET` konstante koje više neće biti potrebne, i pokrenuti SSR sanity.

---

## 6. Saveti za lovart workflow

- **Generiši before pre after**, koristi isti seed (ili "image-to-image") za after da kadar ostane fiksiran.
- **Ako lovart insistira na ljudima** — eksplicitno: `no people, no figures, no silhouettes`.
- **Tekst u slici** — pojavljuje se često; eksplicitno: `no text, no logos, no labels, no signs`.
- **Per-image quality check pre uvoza:**
  - Otvori sliku u 100% zoom-u — vidi se li artefakt na ivici prozora, čudni odrazi.
  - Probaj na mobile breakpointu (Chrome DevTools, 360×800) — vidi se li ključni element u kadru posle 4:3 crop-a.
- **Stilski revizioni krug** — generiši sve 16 slika sa istim core stilom; tek onda biraj između varijanti. Konzistentnost > pojedinačni "wow".
