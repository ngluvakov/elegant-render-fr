# Elegant Render — Claude Code handoff za Fazu 1

## Smer projekta

Faza 1 više ne sme da izgleda kao klasična prezentacija studija. Pravac je **transaction-first servisna platforma** za brzu kupovinu arhitekturne vizuelizacije, ali uz **potpunu usklađenost sa postojećim cenovnikom i model-first pricing filozofijom**.

Kupac treba da vidi sledeće već u prvom ekranu:

1. **koju uslugu bira**,
2. **koja je zvanična početna cena**,
3. **po kom principu se cena dalje širi**,
4. **šta šalje za početak**,
5. **šta je sledeći korak ka narudžbini**.

## Najvažnije pravilo

> Ne koristiti izmišljene marketinške pakete poput Starter, Standard, Plus ili bilo koje bundle cene koje ne postoje u zvaničnom cenovniku.

Interfejs mora da koristi **realnu javnu baznu cenu** i **realne add-on stavke** iz postojećih PDF dokumenata.

## Cenovna logika koja mora ostati ista

| Usluga | Javni ulaz | Kako prikazati na sajtu |
| --- | --- | --- |
| Unutrašnji renderi | **€170** | Static Interior — osnovni paket po spratu, do 10 opremljenih soba, neograničene kamere, floor plan |
| 360 enterijer | **€295** | 360 Interior — paket po spratu, do 10 hotspot soba, 10 statičkih kamera, floor plan |
| Spoljašnji renderi | **€250** | prvi statični kadar + jasna logika dodatne kamere i extended model surcharge |
| 360 eksterijer | **€335** | prvi 360 prikaz + doplate za hotspotove |
| Aerial eksterijer | **€420** | aerial izlaz kao poseban tip obračuna |
| Virtual staging | **€18** | prva slika, bez bundle paketa |
| 360 staging | **€34** | prvi 360 hotspot |
| Virtual renovation | **€66** | prvi prikaz prostora |
| 2D floor plan | **€20** | single level 2D osnova |
| 3D floor plan | **€29** | single level 3D osnova |
| 360 tour add-on | **€20** | tour assembly / hosting, ne mešati sa cenom rendera |
| Animacija od nule | **€15/sec** | animation pricing mora ostati odvojena logika |

## Obavezne doplate koje interfejs mora podržati

| Kategorija | Add-on logika |
| --- | --- |
| Enterijer static | 11+ soba **€28**, dodatni sprat **€120** |
| Enterijer 360 | 11+ hotspot soba **€45**, dodatni hotspot iste sobe **€27**, dodatna statička kamera **€10**, dodatni sprat **€205** |
| Eksterijer static | dodatna kamera **€48**, extended model surcharge **+25%** jednom po modelu |
| Eksterijer 360 | dodatni hotspot **€48**, extended hotspot **€60**, volume rate nakon 4 dodatna hotspota **€53** |
| Virtual staging | dodatni ugao **€12**, druga soba **€15**, nakon 10 slika **€13**, re-staging **€12** |
| Renovacija | dodatni ugao **€59**, 4th+ ugao **€53**, druga soba **€56**, nakon 5 soba **€50** |
| 2D floor plan | double level **€32**, dodatni nivo **€10**, duplicate floor **€6**, furnished **€6**, color variant **€4** |
| 3D floor plan | double level **€46**, dodatni nivo **€15**, duplicate floor **€10**, furniture overlay **€8**, design variant **€6** |
| 360 tour add-on | interactive floor plan **€15**, branded/white-label UI **€35** |
| Animacija | existing White Rook model **€10/sec**, active rendering project **€8/sec**, additional camera path **€5/sec**, day/night **+30%**, seasonal **+40%** |

## UX princip koji treba sačuvati

Sajt ne treba da vodi korisnika u „upoznajte naš studio“ smeru, već u **"izaberi uslugu → razumi cenu → dodaj obim → pošalji materijale"** tok.

Zato su sledeće stvari obavezne:

- **quick order panel** iznad prevoja,
- izbor usluge kao jasne kartice,
- izbor tačnog tipa obračuna iz cenovnika,
- order summary sa baznom cenom i uključenim stavkama,
- lista add-on stavki odmah ispod,
- jasan CTA ka budućem konfiguratoru / narudžbini,
- minimalni required input po usluzi.

## Šta ne raditi

- ne vraćati sajt u corporate / agency prezentaciju,
- ne uvoditi luksuzni i distancirani ton,
- ne skrivati cenu iza kontakta,
- ne koristiti generičke kartice paketa ako ne odgovaraju cenovniku,
- ne mešati 360 turu i animaciju u jednu cenu,
- ne mešati 2D i 3D osnove u jednu nepreciznu uslugu.

## Sledeći logičan korak za Claude Code

Claude Code treba da razvije sledeću iteraciju kao **pravi pricing configurator** sa ovim modulima:

1. izbor usluge,
2. izbor pricing mode-a,
3. unos količine (sobe, kamere, spratovi, hotspotovi, sekunde),
4. automatski obračun po pravilima iz cenovnika,
5. upload potrebnih materijala,
6. order summary,
7. CTA za potvrdu upita / narudžbine.

## Vizuelni asseti koji ostaju aktivni

| Namena | URL |
| --- | --- |
| Hero enterijer | `https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-hero-01-cof6RpY9ycfwrFhhZguZbn.webp` |
| Services / transformacija prostora | `https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-services-01-LuNQfFVpbhKVCFf7cXAbYJ.webp` |
| Process / radna scena | `https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-process-01-aUsUQMZT3yMu6WtsnrjA8L.webp` |
| Eksterijer / showcase | `https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-portfolio-01-HpiHZcQXFq7MF3BnppeqJc.webp` |

## Status trenutnog prototipa

Trenutni prototip u `client/src/pages/Home.tsx` je već prebačen sa prezentacionog pristupa na **model-first transaction-first** pravac i sada koristi javne početne cene i javne add-on stavke iz cenovnika.

Dalji razvoj treba da ide ka preciznijem konfiguratoru, a ne ka još bogatijem marketinškom homepage-u.
