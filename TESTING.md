# Elegant Render — Test scenariji

Kompletna checklist za end-to-end testiranje cele platforme.

---

## 1. Marketing sajt

### 1.1 Navigacija
- [ ] Početna stranica (`/`) se učitava sa hero sekcijom i cenovnikom
- [ ] Header prikazuje sve linkove: Usluge, Cene, Portfolio, O nama, Kontakt
- [ ] "Prijavite se" dugme vodi na `/prijava` (kada nisi ulogovan)
- [ ] "Portal" dugme vodi na `/portal` (kada si ulogovan)
- [ ] "Powered by White Rook" badge vodi na thewhiterook.com
- [ ] Mobile hamburger meni radi i prikazuje sve linkove
- [ ] Footer prikazuje sve sekcije i pravne linkove

### 1.2 Stranice
- [ ] `/usluge` — prikazuje sve kategorije usluga
- [ ] `/usluge/[slug]` — prikazuje detalj usluge sa cenama i varijantama
- [ ] `/cene` — interaktivni konfigurator radi (dodavanje usluga, stepper, total)
- [ ] `/portfolio` — prikazuje placeholder kartice (čeka prave slike)
- [ ] `/o-nama` — prikazuje tekst o brendu
- [ ] `/kontakt` — forma prikazuje sva polja (forma je disabled pending Bitrix24)
- [ ] `/pravno/privatnost` — prikazuje stub tekst
- [ ] `/pravno/uslovi` — prikazuje stub tekst
- [ ] `/pravno/kolacici` — prikazuje stub tekst

### 1.3 SEO
- [ ] Svaka stranica ima `<title>` tag
- [ ] Svaka stranica ima `<meta description>`
- [ ] OpenGraph tagovi postoje na svim stranicama
- [ ] `sitemap.xml` se generiše ispravno
- [ ] `robots.txt` se generiše ispravno

---

## 2. Autentikacija

### 2.1 Registracija email/lozinka
- [ ] Otvori `/registracija`
- [ ] Popuni ime, email, lozinku (min 8 karaktera)
- [ ] Klikni "Napravite nalog"
- [ ] Preusmeri na `/portal`
- [ ] Proveri inbox — stigao verifikacioni email sa `noreply@elegantrender.rs`
- [ ] Klikni link u emailu → email verified

### 2.2 Registracija sa postojećim emailom
- [ ] Pokušaj registraciju sa već postojećim emailom
- [ ] Prikazuje grešku "Nalog sa ovom email adresom već postoji"

### 2.3 Prijava email/lozinka
- [ ] Otvori `/prijava`
- [ ] Unesi email i lozinku
- [ ] Klikni "Prijavite se"
- [ ] Preusmeri na `/portal`

### 2.4 Pogrešna lozinka
- [ ] Unesi pogrešnu lozinku
- [ ] Prikazuje "Pogrešan email ili lozinka"

### 2.5 Google OAuth
- [ ] Klikni "Nastavite sa Google" na `/prijava`
- [ ] Google consent screen se otvara
- [ ] Izaberi nalog → preusmeri na `/portal`
- [ ] Isto radi sa `/registracija`

### 2.6 Zaboravljena lozinka
- [ ] Otvori `/zaboravljena-lozinka`
- [ ] Unesi email
- [ ] Klikni "Pošaljite link"
- [ ] Prikazuje poruku o poslatom emailu
- [ ] Proveri inbox — stigao reset email
- [ ] Klikni link → otvara `/nova-lozinka?token=...`
- [ ] Unesi novu lozinku → preusmeri na `/prijava`
- [ ] Prijavi se sa novom lozinkom

### 2.7 Odjava
- [ ] Iz portala klikni sign-out u sidebar-u
- [ ] Preusmeri na početnu stranicu
- [ ] `/portal` sada preusmeri na `/prijava`

### 2.8 Route protection
- [ ] Pokušaj direktan pristup `/portal` bez logina → redirect na `/prijava`
- [ ] Pokušaj direktan pristup `/portal/porudzbine` bez logina → redirect

---

## 3. Pricing konfigurator

### 3.1 Dodavanje usluga
- [ ] Otvori `/cene`
- [ ] Klikni na kategoriju (npr. "Unutrašnji renderi")
- [ ] Prikazuju se produkti za tu kategoriju
- [ ] Klikni "Dodaj" → usluga se dodaje u ponudu
- [ ] Sidebar prikazuje stavku i total

### 3.2 Konfiguracija add-on-a
- [ ] Dodaj uslugu sa included quantities (npr. Render enterijera (statički) — 10 prostorija)
- [ ] Stepper počinje na 10, badge prikazuje "Uključeno"
- [ ] Povećaj na 12 → prikazuje "+2 extra" i cenu za 2 dodatne
- [ ] Smanji nazad na 10 → cena se vraća na baznu

### 3.3 Animacija (trajanje)
- [ ] Dodaj animaciju (od nule)
- [ ] Slider za trajanje radi (15-180 sekundi)
- [ ] Popust za trajanje se prikazuje (10%, 20%, 25%)
- [ ] Total se ažurira u realnom vremenu

### 3.4 Naruči
- [ ] Dodaj bar jednu uslugu
- [ ] Klikni "Naruči" → preusmeri na `/poruci`
- [ ] Quote je sačuvan i prikazan na checkout stranici

---

## 4. Checkout flow

### 4.1 Guest checkout
- [ ] Na `/poruci` prikazuje se korak "Vaši podaci" (jer nisi ulogovan)
- [ ] Unesi ime i email
- [ ] Klikni "Nastavi" → kreira guest nalog
- [ ] Proveri inbox — stigao email za postavljanje lozinke

### 4.2 Logged-in checkout
- [ ] Prijavi se pre checkout-a
- [ ] Na `/poruci` preskače se korak "Vaši podaci" → ide direktno na upload

### 4.3 Upload fajlova
- [ ] Drag-and-drop zona prihvata fajlove
- [ ] Klik na zonu otvara file picker
- [ ] Upload progress se prikazuje
- [ ] Uploadovani fajl se prikazuje u listi sa veličinom
- [ ] Moguće je obrisati uploadovani fajl
- [ ] Napomena polje prihvata tekst

### 4.4 Pregled porudžbine
- [ ] Prikazuje sve stavke sa cenama
- [ ] Prikazuje uploadovane fajlove
- [ ] Prikazuje napomenu
- [ ] Prikazuje tačan total
- [ ] "Nastavi na plaćanje" kreira porudžbinu u bazi

### 4.5 Mock kartica
- [ ] Izaberi "Kartica" metod
- [ ] Polja su pre-popunjena (4111... / 12/28 / 123)
- [ ] Klikni "Plati" → simulacija uspešna
- [ ] Prikazuje potvrdu "Porudžbina primljena!"
- [ ] Proveri inbox — stigao confirmation email

### 4.6 PayPal sandbox
- [ ] Izaberi "PayPal" metod
- [ ] PayPal dugme se učitava
- [ ] Klikni → otvara PayPal sandbox popup
- [ ] Prijavi se sa sandbox buyer nalogom
- [ ] Potvrdi plaćanje → vraća na potvrdu
- [ ] Proveri inbox — stigao confirmation email

### 4.7 Direktan pristup bez quote-a
- [ ] Otvori `/poruci` direktno (bez prethodnog dodavanja usluga)
- [ ] Preusmeri nazad na `/cene`

---

## 5. Client portal

### 5.1 Dashboard
- [ ] `/portal` prikazuje sidebar navigaciju
- [ ] Stat kartice prikazuju ispravne brojeve
- [ ] Aktivni projekti prikazuju kartice sa statusom
- [ ] Nedavna aktivnost prikazuje poslednje promene
- [ ] Bez porudžbina prikazuje empty state sa linkom na cene

### 5.2 Lista porudžbina
- [ ] `/portal/porudzbine` prikazuje sve porudžbine korisnika
- [ ] Pretraga po broju porudžbine radi
- [ ] Filter po statusu radi
- [ ] Klik na porudžbinu vodi na detalj

### 5.3 Detalj porudžbine
- [ ] Status tracker prikazuje ispravnu fazu
- [ ] Stavke se prikazuju sa cenama
- [ ] Fajlovi se prikazuju
- [ ] Empty state za komentare ("Nema poruka")
- [ ] Empty state za deliverables ("Još nema gotovih fajlova")

### 5.4 Komentari
- [ ] Napiši poruku u composer → klikni "Pošalji"
- [ ] Poruka se pojavljuje u thread-u sa "[Klijent]" oznakom
- [ ] Polling osvežava komentare svakih 30 sekundi

### 5.5 Revision upload
- [ ] "Pošaljite izmene" kartica prihvata fajlove
- [ ] Upload radi i fajl se pojavljuje u order files

### 5.6 Rework request
- [ ] Kada je status "in_review" → prikazuje se "Zatražite izmene" kartica
- [ ] Klikni dugme → status se menja na "revision_requested"
- [ ] Tracker se ažurira

### 5.7 Pending payment
- [ ] Neplaćena porudžbina prikazuje "Čeka uplatu" karticu
- [ ] PayPal i mock kartica opcije su dostupne
- [ ] Plaćanje uspeva → status se ažurira

### 5.8 Profil
- [ ] `/portal/profil` prikazuje ime, email, telefon
- [ ] Izmeni ime i telefon → sačuvaj → prikazuje uspeh
- [ ] Promeni lozinku → sačuvaj → nova lozinka radi pri sledećoj prijavi

### 5.9 Mobile
- [ ] Sidebar se pretvara u drawer na mobilnom
- [ ] Hamburger meni otvara drawer
- [ ] Sve stranice su čitljive na malom ekranu
- [ ] Two-column layout na order detail se stekuje vertikalno

### 5.10 AI Studio
- [ ] Postojećih 7 alata rade bez reference panela i šalju samo osnovnu sliku
- [ ] "Dodavanje objekta u enterijer" prikazuje upload enterijera i manji panel "Objekat / uglovi" u istom redu na desktopu
- [ ] Generate je blokiran dok ne postoje osnovna slika i bar jedna referentna slika objekta
- [ ] Dodavanje objekta radi sa 1 referencom bez maske i čuva rezultat, istoriju i download linkove
- [ ] Multi-angle flow prihvata do 5 slika istog objekta i prikazuje ih u detalju obrade
- [ ] "Zameni postojeći" automatski koristi Advanced mode i blokira Generate dok maska nije nacrtana
- [ ] Obrada sa Advanced maskom koristi masku kao zonu postavljanja ili komad koji se menja
- [ ] "Ponovi sa istim podešavanjima" vraća sve referentne slike objekta i režim dodavanja/zamene

---

## 6. Admin panel

### 6.1 Pristup
- [ ] Prijavi se kao `admin@elegantrender.rs` / `Admin2026!`
- [ ] Sidebar prikazuje samo "Admin" i "Profil" (bez klijentskih linkova)
- [ ] Klijentski nalog NE vidi "Admin" u sidebar-u

### 6.2 Dashboard
- [ ] Stat kartice: ukupan prihod, porudžbine, aktivni, završeni, klijenti
- [ ] Pretraga po klijentu, emailu, broju porudžbine radi
- [ ] Filter po statusu radi
- [ ] Filter po vrsti usluge radi
- [ ] Tabela prikazuje sve porudžbine svih klijenata

### 6.3 Admin order detail
- [ ] Prikazuje klijentove podatke (ime, email, telefon)
- [ ] Status tracker prikazuje ispravnu fazu
- [ ] "Promeni status" dugmad prikazuju samo validne tranzicije
- [ ] Klikni na status → status se menja → tracker se ažurira
- [ ] Konverzacija prikazuje sve komentare (klijentske i timske)
- [ ] "Odgovor tima" composer šalje poruku sa oznakom "Tim"
- [ ] Klijent vidi timsku poruku u svom portalu

### 6.4 Deliverable upload
- [ ] "Otpremi deliverable" kartica prima fajlove
- [ ] Upload uspeva → fajl se pojavljuje u "Isporučeni fajlovi"
- [ ] Klijent vidi fajl u "Spremno za preuzimanje" panelu
- [ ] Download link radi (signed URL)

---

## 7. Bitrix24 sinhronizacija

### 7.1 Outbound: Nova porudžbina
- [ ] Kreiraj porudžbinu i plati
- [ ] U Bitrix24 → CRM → Dealovi → "Elegant Render" pipeline
- [ ] Deal je kreiran sa ispravnim nazivom, iznosom, kontaktom
- [ ] Stage odgovara statusu porudžbine

### 7.2 Outbound: Promena statusa
- [ ] Promeni status u admin panelu (npr. paid → in_progress)
- [ ] U Bitrix24: Deal stage se ažurirao

### 7.3 Outbound: Komentar
- [ ] Pošalji klijentski komentar iz portala
- [ ] U Bitrix24: komentar se pojavio u Deal timeline-u sa "[Klijent]" prefiksom
- [ ] Pošalji timski komentar iz admin panela
- [ ] U Bitrix24: komentar se pojavio sa "[Tim]" prefiksom

### 7.4 Outbound: Fajl
- [ ] Upload fajl (source, revision, ili deliverable)
- [ ] U Bitrix24: timeline komentar sa linkom na fajl

### 7.5 Inbound: Promena stage-a
- [ ] U Bitrix24: prevuci Deal na drugi stage (npr. "U izradi" → "Na pregledu")
- [ ] U portalu: status porudžbine se promenio
- [ ] Nema infinite loop (status se ne vraća nazad)

### 7.6 Reconciliation
- [ ] Ručno pozovi: `GET /api/cron/bitrix-reconcile?secret=CRON_SECRET` (sa Authorization header)
- [ ] Proveri logove — nema drift-a za sinhronizovane porudžbine
- [ ] Ako postoji porudžbina bez Deal-a, pokušava ponovo

---

## 8. Email notifikacije

- [ ] Registracija → verifikacioni email
- [ ] Zaboravljena lozinka → reset email
- [ ] Guest checkout → email za postavljanje lozinke
- [ ] Uspešno plaćanje → confirmation email sa brojem porudžbine i iznosom
- [ ] Svi emailovi dolaze sa `noreply@elegantrender.rs`
- [ ] Emailovi imaju Elegant Render branding (clay dugme, warm boje)

---

## 9. Error handling

- [ ] Pogrešan URL → prikazuje 404 stranicu sa "Nazad na početnu" linkom
- [ ] Nevalidni checkout podaci → prikazuje grešku (ne puca)
- [ ] PayPal greška → prikazuje poruku o grešci
- [ ] Upload prevelikog fajla (>50MB) → prikazuje poruku
- [ ] Nepostojeci orderId u portalu → 404

---

## 10. Pre-launch checklist

Kada sadržaj bude spreman:

- [ ] Zameni portfolio placeholder slike pravim renderima
- [ ] Zameni pravne stub tekstove pravim tekstovima
- [ ] Poveži elegantrender.rs domen sa Vercel
- [ ] Ažuriraj `AUTH_URL` na `https://elegantrender.rs`
- [ ] Dodaj `https://elegantrender.rs/api/auth/callback/google` u Google OAuth redirect URIs
- [ ] Promeni `PAYPAL_MODE=live` i zameni sandbox kredencijale
- [ ] Ukloni `robots: { index: false }` iz root layout-a
- [ ] Uključi Supabase point-in-time recovery
- [ ] Proveri Sentry monitoring (kada se instalira)
- [ ] Uradi kompletni smoke test sa pravim podacima
