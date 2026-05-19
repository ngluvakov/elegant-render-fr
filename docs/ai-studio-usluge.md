# AI Studio usluge - kompletan opis za dizajn stranice

## 1. Sta je AI Studio

AI Studio je deo Elegant Render platforme za brzu obradu fotografija nekretnina i prostora. Korisnik uploaduje fotografiju, izabere tip obrade, opcije i eventualno stil, dopise instrukcije i dobija gotovu sliku koju moze da preuzme ili koristi kao novi ulaz za sledecu obradu. Kod dodavanja ili zamene namestaja/dekora korisnik dodaje jednu ili vise slika istog komada, a za zamenu oznacava postojeci komad maskom.

AI Studio nije zamena za kompletan 3D render ili arhitektonski projekat. Njegova uloga je da ubrza manje i srednje vizuelne intervencije na postojecim fotografijama:

- uklanjanje nezeljenih elemenata,
- promena atmosfere fotografije,
- zamena neba,
- promena boje zidova,
- virtuelno opremanje praznog prostora,
- dodavanje ili zamena konkretnog komada namestaja/dekora u enterijeru,
- vizuelna renovacija,
- redizajn postojece prostorije.

Glavna vrednost za klijenta je brzina: moze da testira ideju, popravi fotografiju za oglas, napravi bolju prezentaciju prostora ili dobije smer pre nego sto naruci ozbiljniji render/projekat.

## 2. Osnovni workflow

1. Korisnik ulazi u AI Studio.
2. AI Studio pocinje prazno: istorija postoji, ali radna slika se ne popunjava automatski.
3. Korisnik uploaduje sliku ili iz istorije klikne na rezultat koji zeli da koristi.
4. Bira tip obrade. Za "Dodavanje ili zamena namestaja/dekora" dodaje jednu ili vise slika istog komada.
5. Bira engine, opcije i stil ako postoje.
6. Po potrebi ukljucuje Advanced mode i crta masku.
7. Upisuje instrukciju.
8. Pokrece generisanje.
9. Dobija rezultat.
10. Rezultat moze da preuzme, otvori u detaljima, ponovi sa istim podesavanjima ili koristi kao novu ulaznu sliku.

## 3. Zajednicka pravila za sve usluge

### Ulazni fajl

Podrzani formati:

- JPG,
- PNG,
- WebP.

Preporuceno:

- jasna fotografija,
- sto manje motion blur-a,
- bez prejakih filtera,
- sto bolja rezolucija,
- za enterijer: sirok kadar koji prikazuje geometriju prostora,
- za eksterijer: kadar u kome su objekat i nebo jasno vidljivi.

Limit u interfejsu:

- jedna osnovna slika po obradi; za "Dodavanje ili zamena namestaja/dekora" dodaje se 1-5 referentnih slika istog komada,
- fajl do 50 MB.

### Izlazni fajl

AI Studio vraca jednu finalnu sliku, bez teksta, UI elemenata, watermarka ili objasnjenja unutar slike.

Rezultat se cuva kao JPG i moze da se preuzme iz istorije. Fajlovi AI Studio obrada cuvaju se 30 dana.

Sistem pokusava da sacuva kompoziciju, odnos stranica i dimenzije ulazne slike. AI provider moze interno da radi u svom target formatu, ali finalni rezultat se vraca u dimenzije stvarnog ulaza za tu obradu.

### Krediti

AI Studio koristi kreditni sistem:

- simple obrada trosi 0.5 kredita,
- complex obrada trosi 1 kredit,
- krediti vaze 12 meseci od poslednje dopune.

Vece kupovine kredita smanjuju cenu po kreditu:

- 1+ kredit: 0.50 EUR po kreditu,
- 25+ kredita: 0.45 EUR po kreditu,
- 50+ kredita: 0.40 EUR po kreditu,
- 100+ kredita: 0.38 EUR po kreditu.

### Free regenerations

Sistem podrzava 1 besplatan pokusaj u okviru istog placenog AI generation chain-a, kada korisnik nastavlja iz postojeceg rezultata i obrada ulazi u pokriveni obim.

Za dizajn stranice ovo moze da se objasni jednostavnije:

"Ako rezultat nije dovoljno dobar, korisnik moze da nastavi doradu iz postojece slike bez novog upload-a. Sistem jasno prikazuje da li je sledeci pokusaj besplatan, delimisno naplacen ili punom cenom."

### Simple i Advanced mode

Simple mode:

- najbrzi put,
- korisnik uploaduje sliku, izabere alat/opciju i upise instrukciju,
- idealno za globalne izmene ili kada AI treba sam da razume oblast izmene.

Advanced mode:

- dostupan za alate koji podrzavaju masku,
- korisnik moze brushom ili pravougaonikom da oznaci deo slike,
- koristi se kada treba sacuvati ostatak fotografije,
- narocito korisno kod uklanjanja predmeta, promene zida, staginga, renovacije i redesign-a.

Atmosferski alati kao Day-to-Dusk i Sky Replacement ne koriste masku, jer prirodno menjaju celu scenu.

### Stilovi

Kod staginga, renovacije i redesign-a korisnik moze da izabere stil:

- Modern,
- Contemporary,
- Scandinavian,
- Mid-century,
- Farmhouse,
- Industrial urban,
- Primorski.

Stil je smer, ne garancija tacnog kataloskog proizvoda. Za najbolje rezultate treba dodati i tekstualne instrukcije: paleta, materijali, sta ostaje isto i sta nikako ne treba dodavati.

### Engine izbor

AI Studio trenutno nudi cetiri engine opcije u katalogu, ali za nove obrade namestaja/dekora prikazuje samo dve stabilnije opcije:

- Nano Banana Pro,
- GPT Image 1.5.

Nano Banana i GPT Image 2 ostaju samo radi istorije/kompatibilnosti starih generacija. Default ostaje Nano Banana Pro.

Za dizajn javne stranice engine ne mora biti u prvom planu. Za vecinu korisnika vaznije je pitanje: "Koji alat mi treba?" nego "Koji model radi obradu?"

U samom workspace-u engine moze da ostane kao naprednija kontrola, uz oznaku "Preporuceno".

## 4. Pregled svih AI Studio usluga

| Usluga | Tip | Cena | Maska | Stil | Najbolja za |
| --- | --- | --- | --- | --- | --- |
| Uklanjanje elemenata | Simple | 0.5 kredita | Da | Ne | Ciscenje fotografija |
| Dan u noc | Simple | 0.5 kredita | Ne | Ne | Vecernji izgled eksterijera |
| Zamena neba | Simple | 0.5 kredita | Ne | Ne | Popravka loseg neba |
| Promena boje zidova | Simple | 0.5 kredita | Da | Ne | Brza provera boje |
| Virtuelno opremanje | Complex | 1 kredit | Da | Da | Prazni ili slabo uredjeni prostori |
| Dodavanje ili zamena namestaja/dekora | Complex | 1 kredit | Da | Ne | Dodavanje ili zamena konkretnog komada namestaja/dekora u prostoru |
| Virtuelna renovacija | Complex | 1 kredit | Da | Da | Materijali, podovi, kuhinje, kupatila |
| Redizajn prostorije | Complex | 1 kredit | Da | Da | Promena stila i atmosfere postojece sobe |

## 5. Usluga: Uklanjanje elemenata

### Sta radi

Uklanja nezeljene predmete, nered, ljude, vozila ili tragove sa zidova/poda iz postojece fotografije. Cilj je da fotografija izgleda cistije i spremnije za oglas, prezentaciju ili dalju obradu.

### Kada je korisna

- Na fotografiji postoje kese, kablovi, kutije, alati ili licne stvari.
- Treba ukloniti ljude ili vozila iz kadra.
- Zid ili pod imaju tragove koje treba vizuelno ocistiti.
- Prostor treba da deluje urednije bez kompletne renovacije.

### Inputi

Obavezno:

- jedna fotografija,
- izbor jedne ili vise kategorija za uklanjanje.

Kategorije:

- namestaj,
- nered i sitnice,
- vozila,
- ljudi,
- tragovi sa zidova/poda.

Opcionalno:

- tekstualna instrukcija,
- advanced maska.

### Output

Jedna ociscena fotografija u kojoj su oznaceni ili opisani elementi uklonjeni, a pozadina rekonstruisana sto prirodnije.

### Najbolji promptovi

Dobro:

- "Ukloni kese i kablove pored zida. Sacuvaj pod i senke sto prirodnije."
- "Ukloni automobile ispred kuce, ali ne menjaj fasadu ni ogradu."

Lose:

- "Sredi sliku."
- "Ukloni sve."

### Napomene za dizajn stranice

Ovu uslugu treba predstaviti kao "brzo ciscenje fotografije". Vizuelno je idealna za before/after slider.

Najbolja poruka:

"Uklonite ono sto smeta kupcu da vidi prostor."

## 6. Usluga: Dan u noc

### Sta radi

Pretvara dnevnu fotografiju u vecernji, sutonski ili nocni prikaz. Dodaje atmosferu, toplinu svetla i bolji marketinski utisak, posebno kod eksterijera.

### Kada je korisna

- Dnevna fotografija izgleda ravno ili previse obicno.
- Nekretnina treba da deluje luksuznije.
- Oglas ili prezentacija treba dramaticniju naslovnu sliku.
- Eksterijer ima dobru kompoziciju, ali losu atmosferu.

### Inputi

Obavezno:

- jedna fotografija.

Opcije atmosfere:

- topli suton,
- plavi sat,
- vecernja svetla,
- luksuzni nocni izgled,
- realisticna agencijska obrada.

Opcionalno:

- tekstualna instrukcija.

Maska:

- nije dostupna, jer obrada utice na celu atmosferu slike.

### Output

Jedna fotografija sa vecernjom/nocturnom atmosferom, uz ocuvanu arhitekturu, perspektivu i osnovnu kompoziciju.

### Najbolji promptovi

Dobro:

- "Suptilan plavi sat, topla svetla iz prozora, ne menjati boju fasade."
- "Realisticna agencijska obrada, bez preterano dramaticnog neba."

Lose:

- "Napravi noc."
- "Dodaj sve da izgleda luksuzno."

### Napomene za dizajn stranice

Ovo je emocionalno najprodajnija simple usluga. Treba je prikazati kroz jasnu promenu atmosfere.

Najbolja poruka:

"Pretvorite obicnu dnevnu fotografiju u vecernji kadar koji prodaje emociju."

## 7. Usluga: Zamena neba

### Sta radi

Menja sivo, pregorelo ili neatraktivno nebo atraktivnijom varijantom, uz ocuvanje objekta, perspektive i sto prirodnije svetlo.

### Kada je korisna

- Nebo je sivo, prazno ili lose eksponirano.
- Fotografija je dobra, ali deluje tmurno.
- Treba ujednaciti atmosferu vise fotografija.
- Eksterijer treba bolji prvi utisak.

### Inputi

Obavezno:

- jedna fotografija eksterijera ili kadra sa vidljivim nebom.

Opcije neba:

- vedro plavo,
- blago oblacno,
- zlatni sat,
- dramaticno nebo,
- sunset.

Opcionalno:

- tekstualna instrukcija.

Maska:

- nije dostupna, jer se zamena neba radi globalno.

### Output

Jedna fotografija sa zamenjenim nebom i prilagodjenom atmosferom, bez promene glavnog objekta.

### Najbolji promptovi

Dobro:

- "Blago oblacno nebo, ne menjati boju zgrade ni ekspoziciju fasade."
- "Sunset atmosfera, ali prirodno i bez preteranih boja."

Lose:

- "Stavi lepo nebo."
- "Napravi potpuno drugu scenu."

### Napomene za dizajn stranice

Treba jasno pokazati da je ovo alat za "popravku dobre fotografije", ne za kreiranje potpuno nove scene.

Najbolja poruka:

"Zadrzite kadar koji imate, popravite nebo koje kvari utisak."

## 8. Usluga: Promena boje zidova

### Sta radi

Menja boju zidova na fotografiji, uz nastojanje da plafon, pod, namestaj i rasveta ostanu nepromenjeni. Korisnik bira ciljnu boju pomocu color picker-a i moze dodati instrukcije.

### Kada je korisna

- Klijent zeli da testira novu boju pre farbanja.
- Agent zeli neutralniji izgled prostora.
- Treba prikazati vise varijanti iste sobe.
- Zid je previse taman, napadan ili ne odgovara target kupcu.

### Inputi

Obavezno:

- jedna fotografija enterijera,
- ciljna boja zida.

Opcionalno:

- instrukcija,
- advanced maska za preciznije oznacavanje zida.

### Output

Jedna fotografija u kojoj je promenjena boja zidova, uz ocuvanje ostatka scene.

### Najbolji promptovi

Dobro:

- "Promeni samo zid iza kreveta. Plafon, lajsne i namestaj ostaju isti."
- "Topla svetla bez boja, sacuvati senke i teksturu zida."

Lose:

- "Oboji sve."
- "Napravi modernije."

### Napomene za dizajn stranice

Ova usluga je odlicna za interaktivni demo: originalna slika + swatchevi boja.

Najbolja poruka:

"Testirajte boju zida pre nego sto prostor zaista prefarbate."

## 9. Usluga: Virtuelno opremanje

### Sta radi

Dodaje namestaj, dekor i atmosferu u praznu ili slabo uredjenu prostoriju. Cilj je da prostor dobije namenu i emocionalnu vrednost, bez pravog staginga i fizickog opremanja.

### Kada je korisna

- Prostor je prazan.
- Fotografija deluje hladno i tesko je razumeti proporcije.
- Treba pokazati funkciju sobe.
- Nekretnina treba bolji oglas bez troska fizickog opremanja.

### Inputi

Obavezno:

- jedna fotografija prostora.

Tip prostorije:

- dnevna soba,
- spavaca soba,
- kuhinja,
- trpezarija,
- kancelarija,
- terasa/eksterijer,
- drugo.

Stil:

- Modern,
- Contemporary,
- Scandinavian,
- Mid-century,
- Farmhouse,
- Industrial urban,
- Primorski.

Opcionalno:

- prompt,
- advanced maska.

### Output

Jedna fotografija opremljene prostorije sa dodatim namestajem i dekorom, uz ocuvanu geometriju prostora.

### Najbolji promptovi

Dobro:

- "Dnevna soba, topao moderni stil, neutralna paleta, drvo i svetli tekstil. Ne zatvarati prozore."
- "Spavaca soba u skandinavskom stilu, bez televizora, zadrzati raspored vrata i prozora."

Lose:

- "Opremi lepo."
- "Dodaj luksuzno sve."

### Napomene za dizajn stranice

Ovo je jedna od glavnih AI Studio usluga i treba da bude predstavljena visoko na stranici.

Najbolja poruka:

"Prazan prostor pretvorite u prostor koji kupac odmah razume."

## 10. Usluga: Dodavanje ili zamena namestaja/dekora

### Sta radi

Ubacuje komad namestaja/dekora iz jedne ili vise referentnih slika u postojecu fotografiju enterijera, ili zamenjuje postojeci komad oznacen maskom. Cilj je da se proveri kako konkretan komad namestaja, rasvete, dekora, biljke, umetnosti ili uredjaja vizuelno stoji u prostoru. Torbe, odeca, ruke, ljudi i sitni licni predmeti nisu namenjeni ovom flow-u.

### Kada je korisna

- Klijent ima fotografiju prostora i fotografiju konkretnog proizvoda.
- Treba proveriti skalu, stil i vizuelno uklapanje pre kupovine ili prezentacije.
- Dizajner zeli brz mockup bez kompletnog 3D modelovanja.
- Agent ili vlasnik zeli da pokaze potencijal jednog akcentnog elementa.

### Inputi

Obavezno:

- jedna fotografija enterijera,
- jedna do pet fotografija istog komada koji se ubacuje ili koristi za zamenu,
- za zamenu: maskom oznacen postojeci komad koji menjamo.

Tip komada:

- namestaj,
- dekor,
- rasveta,
- uredjaj,
- biljka,
- umetnost.

Opcionalno:

- prompt,
- advanced maska za okvirnu zonu postavljanja pri dodavanju.

Kod dodavanja bez maske AI sam bira poziciju na osnovu instrukcije i scene, pa rezultat moze biti manje predvidljiv. Kod dodavanja sa maskom, maska je smernica, ne stroga ivica. Kod zamene maska oznacava postojeci komad koji menjamo, a sistem sme da prosiri lokalnu zonu zbog proporcije, nogara, rucki, senke, kontakta i perspektive. Prva referentna slika je autoritativna; dodatne slike se tretiraju samo kao pomocni uglovi istog modela/boje/materijala. Ako referenca ima pozadinu ili vise predmeta, provider treba da koristi najveci, centralni ili najfokusiraniji komad namestaja/dekora i ignorise pozadinu, showroom, tekst, ljude i druge predmete.

### Output

Jedna fotografija enterijera sa uklopljenim ili zamenjenim komadom. Sistem pokusava da sacuva identitet, materijal i proporciju komada, ali rezultat treba komunicirati kao vizuelnu proveru uklapanja, ne kao garanciju kataloski identicnog proizvoda.

### Najbolji promptovi

Dobro:

- "Postavi fotelju pored prozora. Uskladi skalu, pravac svetla i senku na podu."
- "Dodaj lampu na komodu, bez promene ostatka sobe i bez dodatnog dekora."

Lose:

- "Sredi sobu sa ovim."
- "Dodaj sve kao u drugoj slici."

### Napomene za dizajn stranice

Ovu uslugu treba jasno razlikovati od staginga: ne oprema celu prostoriju, nego dodaje ili zamenjuje jedan konkretan referentni komad namestaja/dekora.

Najbolja poruka:

"Proverite kako konkretan komad izgleda u realnom prostoru ili njime zamenite postojeci komad."

## 11. Usluga: Virtuelna renovacija

### Sta radi

Menja materijale, podove, zidove, kuhinju, kupatilo, osvetljenje ili celokupan izgled prostora. Za razliku od staginga, ne dodaje samo namestaj nego menja karakter postojeceg prostora.

### Kada je korisna

- Postoji zastareo enterijer.
- Treba pokazati potencijal renovacije.
- Klijent zeli da testira materijale ili novu atmosferu.
- Investitor zeli pre/after prikaz bez potpunog 3D modela.

### Inputi

Obavezno:

- jedna fotografija prostora.

Opcije promene:

- podovi,
- zidovi,
- kuhinja,
- kupatilo,
- rasveta,
- materijali,
- kompletan izgled.

Stil:

- isti set stilova kao kod staginga.

Opcionalno:

- prompt,
- advanced maska.

### Output

Jedna fotografija sa renoviranim izgledom prostora. Sistem nastoji da sacuva perspektivu, glavnu geometriju, prozore, vrata i raspored, osim ako korisnik eksplicitno trazi izmenu.

### Najbolji promptovi

Dobro:

- "Zameni pod hrastovim parketom, zidovi topla bela, ostavi raspored kuhinje."
- "Modernizuj kupatilo svetlim kamenom i crnim detaljima, ne menjati poziciju tus kabine."

Lose:

- "Renoviraj sve."
- "Napravi skuplje."

### Napomene za dizajn stranice

Ovo treba komunicirati kao "visual renovation preview", ne kao finalni arhitektonski projekat.

Najbolja poruka:

"Pokazite potencijal renovacije pre nego sto donesete skupe odluke."

## 12. Usluga: Redizajn prostorije

### Sta radi

Menja stil, atmosferu i vizuelni identitet postojece prostorije. U odnosu na renovaciju, redizajn je vise fokusiran na izgled, namenu, paletu i dozivljaj prostora, a manje na konkretne gradjevinske elemente.

### Kada je korisna

- Prostor je vec opremljen, ali izgleda zastarelo.
- Treba testirati drugi stil.
- Korisnik zeli inspiraciju za novi enterijer.
- Treba napraviti atraktivniju varijantu postojece sobe.

### Inputi

Obavezno:

- jedna fotografija postojece prostorije.

Tip prostorije:

- dnevna soba,
- spavaca soba,
- kuhinja,
- trpezarija,
- kancelarija,
- terasa/eksterijer,
- drugo.

Stil:

- Modern,
- Contemporary,
- Scandinavian,
- Mid-century,
- Farmhouse,
- Industrial urban,
- Primorski.

Opcionalno:

- prompt,
- advanced maska.

### Output

Jedna fotografija prostorije sa novim stilom, atmosferom i vizuelnom kompozicijom.

### Najbolji promptovi

Dobro:

- "Svetli skandinavski stil, manje vizuelnog nereda, zadrzati prozore i osnovni raspored."
- "Moderni premium izgled, neutralne boje, bez preterano tamnog namestaja."

Lose:

- "Napravi lepse."
- "Promeni sve kako hoces."

### Napomene za dizajn stranice

Redizajn treba pozicionirati izmedju inspiracije i prakticne pripreme za makeover.

Najbolja poruka:

"Vidite kako isti prostor moze da izgleda u potpuno drugom stilu."

## 13. Sta treba prikazati na AI Studio stranici

### Hero sekcija

Primarna poruka:

"Brza AI obrada fotografija za nekretnine, enterijere i eksterijere."

Podnaslov:

"Uploadujte fotografiju, izaberite alat i dobijte spreman vizuelni rezultat za oglas, prezentaciju ili testiranje ideje."

Hero treba da prikaze stvaran before/after primer, ne apstraktnu ilustraciju.

CTA:

- "Otvori AI Studio",
- "Kupi AI kredite",
- "Pogledaj alate".

### Sekcija: Kako radi

1. Uploadujte fotografiju.
2. Izaberite alat.
3. Dodajte instrukcije ili masku.
4. Preuzmite rezultat ili nastavite doradu.

### Sekcija: Alati

Svaki alat treba da ima:

- naziv,
- kratku korist,
- cenu u kreditima,
- oznaku Simple/Complex,
- input,
- output,
- primer dobre instrukcije,
- before/after vizual.

### Sekcija: Simple vs Complex

Simple:

- 0.5 kredita,
- brze korekcije,
- uklanjanje, nebo, atmosfera, boja zidova.

Complex:

- 1 kredit,
- veca promena prostora,
- staging, renovacija, redesign.

### Sekcija: Kada koristiti AI Studio, a kada naruciti render

AI Studio je dobar kada:

- vec imate fotografiju,
- treba brza vizuelna provera,
- treba bolji oglas,
- treba ciscenje ili stilizacija postojece slike.

Render je bolji kada:

- prostor jos ne postoji,
- treba tacna arhitektura,
- treba vise kontrolisanih kadrova,
- treba proizvodni nivo detalja,
- treba kompletna prodajna kampanja.

### Sekcija: Krediti

Objasniti jasno:

- simple obrada = 0.5 kredita,
- complex obrada = 1 kredit,
- krediti vaze 12 meseci,
- veci paketi imaju nizu cenu po kreditu.

### Sekcija: Saveti za najbolji rezultat

- Uploadujte jasnu fotografiju.
- Napisite sta mora da ostane isto.
- Ne trazite vise nepovezanih stvari u jednoj recenici.
- Za staging navedite namenu sobe, stil i paletu.
- Za renovaciju odvojite materijale, namestaj i osvetljenje.
- Za uklanjanje vecih predmeta koristite masku.
- Ako je rezultat blizu dobrog, koristite ga kao novu ulaznu sliku i trazite malu korekciju.

## 14. Ton komunikacije

Ton treba da bude:

- premium,
- jasan,
- praktican,
- bez previse AI hype-a,
- fokusiran na korist za nekretnine.

Izbegavati:

- "magija",
- "sve je moguce",
- "savrsen rezultat uvek",
- tehnicke detalje modela u hero delu.

Koristiti:

- "brza obrada",
- "real estate fotografija",
- "spremno za oglas",
- "testiranje ideje",
- "vizuelna provera",
- "pre/posle prikaz".

## 15. Predlog navigacije stranice

1. Hero sa before/after primerom.
2. Kratak workflow.
3. Grid alata.
4. Showcase za tri glavna scenarija:
   - ocistite fotografiju,
   - opremite prazan prostor,
   - prikazite potencijal renovacije.
5. Krediti i cene.
6. Saveti za dobre inpute.
7. FAQ.
8. CTA za ulazak u AI Studio.

## 16. FAQ pitanja za stranicu

### Da li AI Studio pravi 3D render?

Ne. AI Studio obradjuje postojece fotografije. Ako prostor ne postoji ili treba potpuno kontrolisan arhitektonski prikaz, bolji izbor je klasicni render.

### Da li rezultat uvek bude savrsen?

Ne. Kvalitet zavisi od ulazne fotografije, jasnoce instrukcija i kompleksnosti izmene. Zato AI Studio omogucava nastavak dorade iz postojeceg rezultata.

### Sta ako zelim da nesto ostane isto?

To treba jasno napisati u instrukciji. Na primer: "Ne menjati prozore, pod i raspored namestaja."

### Kada treba koristiti masku?

Masku treba koristiti kada zelite da se izmena desi samo na delu slike: veci predmet, odredjeni zid, deo poda ili zona prostorije.

### Koja je razlika izmedju staginga, renovacije i redesign-a?

Staging dodaje opremu u prazan ili slabo uredjen prostor. Renovacija menja materijale i elemente prostora. Redesign menja stil i atmosferu postojece prostorije.

### Da li mogu rezultat ponovo da obradim?

Da. Rezultat moze da se koristi kao nova ulazna slika za malu korekciju ili nastavak dorade.

### Koliko dugo su fajlovi dostupni?

AI Studio fajlovi se cuvaju 30 dana.

## 17. Kratke kartice za dizajn

### Uklanjanje elemenata

Ocistite fotografiju od nereda, ljudi, vozila ili sitnih smetnji.

Input: fotografija + sta uklanjamo.
Output: cista fotografija.
Cena: 0.5 kredita.

### Dan u noc

Pretvorite dnevni kadar u vecernju atmosferu.

Input: fotografija + atmosfera.
Output: sutonska ili nocna fotografija.
Cena: 0.5 kredita.

### Zamena neba

Zamenite sivo ili lose nebo atraktivnijom atmosferom.

Input: eksterijer sa vidljivim nebom.
Output: fotografija sa boljim nebom.
Cena: 0.5 kredita.

### Promena boje zidova

Testirajte novu boju zida bez farbanja.

Input: fotografija + boja.
Output: fotografija sa novom bojom zida.
Cena: 0.5 kredita.

### Virtuelno opremanje

Dodajte namestaj i dekor u prazan prostor.

Input: fotografija + tip sobe + stil.
Output: opremljen prostor.
Cena: 1 kredit.

### Dodavanje ili zamena namestaja/dekora

Ubacite konkretan komad namestaja/dekora iz referentnih slika u postojeći enterijer ili zamenite postojeći komad.

Input: fotografija enterijera + 1-5 fotografija istog komada + tip komada; za zamenu i maska.
Output: komad dodat u prostor ili postojeći komad zamenjen referencom.
Cena: 1 kredit.

### Virtuelna renovacija

Prikazite kako prostor moze da izgleda posle renovacije.

Input: fotografija + sta menjamo + stil.
Output: renovirana varijanta prostora.
Cena: 1 kredit.

### Redizajn prostorije

Promenite stil i atmosferu postojece sobe.

Input: fotografija + tip sobe + stil.
Output: nova dizajnerska varijanta.
Cena: 1 kredit.
