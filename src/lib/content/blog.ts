/**
 * Blog content model — the single source of truth for the /blog section.
 *
 * Posts are authored as type-safe structured blocks (no markdown runtime
 * dependency): each post carries metadata plus a `body` array of blocks.
 * Paragraphs/headings/list items/table cells support a small inline syntax
 * rendered by `renderInline` in `blog-post-body.tsx`:
 *   **bold**, *italic* / _italic_, and [label](href) links.
 *
 * To publish a new post, add a `BlogPost` object to `BLOG_POSTS`. The
 * listing page, post pages, sitemap and JSON-LD all derive from this array.
 */
import { SITE } from "@/lib/content/site";
import { SEO, absoluteUrl, canonicalUrl } from "@/lib/seo";

export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string; lead?: boolean }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "cta"; label: string; href: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date (YYYY-MM-DD) the post was published. */
  date: string;
  /** ISO date of the last meaningful update, if different from `date`. */
  updated?: string;
  author: string;
  coverImage: string;
  coverAlt: string;
  /** Short labels shown as chips; also used to rank related posts. */
  tags: string[];
  /** Extra SEO keyword phrases (not shown), merged into page metadata. */
  keywords?: string[];
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "koliko-kosta-3d-rendering-enterijera",
    title: "Koliko košta 3D rendering enterijera? Cenovnik i vodič za 2026.",
    excerpt:
      "Cena 3D renderovanja enterijera zavisi od složenosti prostora, broja uglova i roka. Kompletan vodič sa cenama i savetima.",
    date: "2026-04-07",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-static.webp",
    coverAlt:
      "Unutrašnji 3D render dnevne sobe sa nameštajem i prirodnim osvetljenjem",
    tags: ["Cenovnik", "3D renderi"],
    keywords: [
      "3D rendering cena",
      "koliko košta 3D render",
      "render enterijera cena",
      "3D vizuelizacija cena Srbija",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Cena 3D renderovanja enterijera jedan je od najčešćih upita koje dobijamo. I to je sasvim razumljivo — kada planirate prodaju ili izdavanje nekretnine, 3D renderi su investicija koja treba da se isplati.",
      },
      {
        type: "paragraph",
        text: "U ovom vodiču ćemo vam pokazati **kako se formira cena**, šta je sve uključeno i kako da dobijete najbolji odnos cene i kvaliteta.",
      },
      {
        type: "heading",
        level: 2,
        text: "Šta utiče na cenu 3D rendera enterijera?",
      },
      { type: "heading", level: 3, text: "1. Složenost prostora" },
      {
        type: "paragraph",
        text: "Osnovni faktor je **složenost arhitekture**. Prostor sa puno pregrada, kosih plafona, lukova i specijalnih elemenata zahteva više vremena za modelovanje. Jednostavna pravougaona soba sa ravnim plafonom je najpovoljnija, dok složeni otvoreni prostori sa kuhinjom, trpezarijom i dnevnim boravkom zahtevaju više posla.",
      },
      { type: "heading", level: 3, text: "2. Broj uglova kamere" },
      {
        type: "paragraph",
        text: "Kod većine agencija, **prvi kadar pokriva modelovanje celog prostora**. Svaki sledeći kadar je znatno povoljniji jer model već postoji — potrebno je samo postaviti novu kameru i prilagoditi kadar.",
      },
      { type: "heading", level: 3, text: "3. Kvalitet opremanja (staging)" },
      {
        type: "paragraph",
        text: "Da li želite osnovni nameštaj ili potpuno dizajnerski uređen prostor? **Virtuelno opremanje** može biti urađeno u više nivoa:",
      },
      {
        type: "list",
        items: [
          "**Osnovno:** funkcionalan nameštaj, osnovni materijali",
          "**Standard:** stilski usklađen nameštaj, dekoracije, biljke",
          "**Premium:** dizajnerski komadi, detaljna rasveta, personalizacija",
        ],
      },
      { type: "heading", level: 3, text: "4. Rok isporuke" },
      {
        type: "paragraph",
        text: "Hitne narudžbine (24–48h) obično imaju doplatu za prioritetnu obradu.",
      },
      { type: "heading", level: 2, text: "Primer cenovnika Elegant Render" },
      {
        type: "paragraph",
        text: "Kod nas su **cene jasne i unapred poznate** — bez skrivenih troškova:",
      },
      {
        type: "table",
        headers: ["Usluga", "Cena (od)"],
        rows: [
          ["Enterijer — prvi kadar (10 soba + 10 kamera)", "**19.924 RSD**"],
          ["Dodatna soba (isti projekat)", "**3.282 RSD**"],
          ["Dodatni kadar (ista soba)", "**1.172 RSD**"],
          ["Dodatni sprat (isti stil, 30% jeftinije)", "**14.064 RSD**"],
          ["360 enterijer — prvi sprat (10 panorama)", "**34.574 RSD**"],
        ],
      },
      {
        type: "paragraph",
        text: "**Važno:** Ako već imate model (npr. iz eksterijernog rendera), ostvarujete popust od 25–50% na enterijersko renderovanje.",
      },
      { type: "heading", level: 2, text: "Kako uštedeti na 3D renderima?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Kombinujte enterijer + eksterijer** — zajednički model donosi velike uštede",
          "**Zakažite više uglova odjednom** — prvi kadar je najskuplji, svaki sledeći je upola jeftiniji",
          "**Koristite standardne pakete** — unapred definisani paketi su povoljniji od potpuno prilagođenih",
          "**Naručite van sezone** — van udarnih meseci (proleće/jesen) rokovi su kraći",
        ],
      },
      { type: "heading", level: 2, text: "Da li se isplati?" },
      {
        type: "paragraph",
        text: "Istraživanja pokazuju da **nekretnine sa profesionalnim 3D renderima** dobijaju:",
      },
      {
        type: "list",
        items: [
          "**32% više upita** od potencijalnih kupaca",
          "**Prodaja 2–3 nedelje brže** u odnosu na nekretnine bez rendera",
          "**Veća prodajna cena** — kupci su spremni da plate više za nekretninu koju su videli u najboljem svetlu",
        ],
      },
      { type: "heading", level: 2, text: "Kako do ponude?" },
      { type: "paragraph", text: "Proces je jednostavan:" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pošaljite osnovne podatke o prostoru (kvadratura, broj soba, spratova)",
          "Odaberite paket koji vam odgovara",
          "Dostavite tlocrte ili referentne slike",
          "Za 7–14 dana dobijate gotove fotorealistične rendere",
        ],
      },
      {
        type: "cta",
        label: "Izračunajte cenu za vaš projekat",
        href: "/cene",
      },
    ],
  },
  {
    slug: "virtuelna-renovacija-vs-stvarna",
    title: "Virtuelna renovacija vs stvarna renovacija: šta je isplativije?",
    excerpt:
      "Poređenje virtuelne i stvarne renovacije — cena, vreme, ishod. Kada je virtuelna renovacija bolji izbor od izvođenja radova.",
    date: "2026-04-14",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtuelna-renovacija.webp",
    coverAlt: "Poređenje pre i posle virtuelne renovacije dnevne sobe",
    tags: ["Renovacija", "Prodaja nekretnina"],
    keywords: [
      "virtuelna renovacija",
      "virtuelna renovacija stana",
      "renovacija vs virtuelno",
      "AI renovacija",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Kada razmišljate o renoviranju stana ili kuće, prvo što vam pada na pamet jeste **stvarna renovacija** — majstori, gips, boje, podovi, nered i troškovi. Ali postoji i druga opcija koja poslednjih godina dobija sve više pažnje: **virtuelna renovacija**.",
      },
      {
        type: "paragraph",
        text: "U ovom članku poredimo oba pristupa — cenu, vreme, ishod i situacije u kojima je svaki od njih pravi izbor.",
      },
      { type: "heading", level: 2, text: "Šta je virtuelna renovacija?" },
      {
        type: "paragraph",
        text: "Virtuelna renovacija je **digitalna transformacija postojećeg prostora** korišćenjem 3D modelovanja i fotorealističnog renderovanja. Na osnovu fotografija vašeg postojećeg prostora, naš tim kreira novi izgled — menjamo zidove, podove, nameštaj, boje, materijale, pa čak i arhitektonske elemente.",
      },
      {
        type: "paragraph",
        text: "Virtuelna renovacija **ne zahteva fizičke radove**. Sve promene se dešavaju na ekranu, a rezultat je fotorealistična slika koja prikazuje kako bi prostor izgledao nakon renovacije.",
      },
      {
        type: "heading",
        level: 2,
        text: "Poređenje: virtuelna vs stvarna renovacija",
      },
      {
        type: "table",
        headers: ["Aspekt", "Virtuelna renovacija", "Stvarna renovacija"],
        rows: [
          ["**Cena**", "**7.735 RSD po pogledu**", "10.000–100.000+ EUR"],
          ["**Vreme**", "3–7 dana", "2–6 meseci"],
          ["**Nered i buka**", "❌ Nema", "✅ Ima"],
          ["**Fizički rezultat**", "Fotorealistična slika", "Stvarni prostor"],
          ["**Više varijanti**", "Lako (samo promena materijala)", "Skupo i sporo"],
          ["**Rizik od greške**", "Minimalan", "Visok (loša izvedba)"],
        ],
      },
      { type: "heading", level: 2, text: "Kada koristiti virtuelnu renovaciju?" },
      { type: "heading", level: 3, text: "1. Prodaja nekretnine" },
      {
        type: "paragraph",
        text: "Ovo je **najčešći razlog** za virtuelnu renovaciju. Ako prodajete stan ili kuću koja izgleda zastarelo, kupcima je teško da zamisle njen potencijal. Virtuelna renovacija im pokazuje **kako prostor može da izgleda** — i to ih motiviše da ponude višu cenu.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. Investitori i preprodavci (flipping)",
      },
      {
        type: "paragraph",
        text: "Ako kupujete nekretninu da biste je renovirali i prodali, virtuelna renovacija vam pomaže da:",
      },
      {
        type: "list",
        items: [
          "Testirate **različite stilove pre izvođenja radova**",
          "Pokažete **potencijal kupcima i partnerima** pre nego što uložite fizički novac",
          "Kreirate **marketing materijal** za prodaju pre renovacije (pre-selling)",
        ],
      },
      { type: "heading", level: 3, text: "3. Arhitektonske konsultacije" },
      {
        type: "paragraph",
        text: "Arhitekte i dizajneri enterijera koriste virtuelnu renovaciju da bi **klijentima prikazali mogućnosti** pre nego što se donesu konačne odluke o materijalima i rasporedu.",
      },
      { type: "heading", level: 2, text: "A kada je stvarna renovacija neizbežna?" },
      {
        type: "list",
        items: [
          "Kada su **instalacije dotrajale** (struja, vodovod, grejanje)",
          "Kada je potrebna **promena rasporeda prostorija** (rušenje zidova)",
          "Kada je **konstrukcija ugrožena** (vlaga, pukotine, temelj)",
          "Kada se prostor **fizički koristi** (useljavate se)",
        ],
      },
      { type: "heading", level: 2, text: "Praktičan primer" },
      {
        type: "list",
        items: [
          "**Klijent:** Prodaje stan u novobeogradskom bloku iz 80-ih",
          "**Problem:** Kupci ne vide potencijal zbog zastarelog nameštaja i boja",
          "**Rešenje:** Virtuelna renovacija za 4 sobe — 8 pogleda",
          "**Cena:** 8 × 7.735 RSD = **61.880 RSD** (~527 EUR)",
          "**Vreme isporuke:** 7 dana",
        ],
      },
      {
        type: "paragraph",
        text: "**Rezultat:** Stan je prodat za **15% više od početne cene** u roku od 3 nedelje.",
      },
      { type: "heading", level: 2, text: "Preporuka" },
      {
        type: "paragraph",
        text: "U većini slučajeva, **najbolji pristup je kombinacija** — virtuelna renovacija za marketing i prikazivanje potencijala, a stvarna renovacija samo za ključne funkcionalne popravke.",
      },
      {
        type: "paragraph",
        text: "Ako niste sigurni šta vam treba, pošaljite nam fotografije prostora i mi ćemo vam dati preporuku — bez obaveze.",
      },
      {
        type: "cta",
        label: "Izračunajte cenu virtuelne renovacije",
        href: "/cene?group=opremanje-renovacija",
      },
    ],
  },
  {
    slug: "kako-dobiti-ponudu-za-3d-vizuelizaciju",
    title: "Kako dobiti ponudu za 3D vizuelizaciju? Brzi vodič kroz proces",
    excerpt:
      "Sve što treba da znate pre nego što naručite 3D render — kako pripremiti brief, koje informacije su potrebne i koliko traje izrada.",
    date: "2026-04-21",
    author: "Elegant Render",
    coverImage: "/artwork/blog-3d-vizuelizacija-duplex.webp",
    coverAlt:
      "3D osnova dupleks stana — fotorealističan tlocrt sa nameštajem i rasporedom prostorija, pogled odozgo",
    tags: ["Vodič", "3D renderi"],
    keywords: [
      "ponuda za 3D vizuelizaciju",
      "kako naručiti 3D render",
      "brief za render",
      "arhitektonska vizuelizacija proces",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Naručivanje 3D vizuelizacije može delovati komplikovano ako nikada ranije niste radili sa profesionalnim render agencijama. U ovom vodiču vas vodimo kroz ceo proces — od prvog upita do gotovog rendera.",
      },
      { type: "heading", level: 2, text: "Korak 1: Pošaljite upit" },
      {
        type: "paragraph",
        text: "Sve počinje jednostavnim upitom. Možete ga poslati putem:",
      },
      {
        type: "list",
        items: [
          "**Kontakt forme** na našem sajtu",
          "**Mejla** na kontakt@elegantrender.rs",
          "**Instagram** direktne poruke",
        ],
      },
      {
        type: "paragraph",
        text: "U ovoj fazi nam nisu potrebni detaljni nacrti — dovoljno je da znate **osnovne informacije**:",
      },
      {
        type: "list",
        items: [
          "Vrsta prostora (enterijer / eksterijer / pejzaž)",
          "Približna kvadratura",
          "Broj soba / uglova koji vas zanimaju",
          "Rok za isporuku",
          "Budžet (opciono)",
        ],
      },
      { type: "heading", level: 2, text: "Korak 2: Dobijate ponudu" },
      { type: "paragraph", text: "U roku od **24h** dobijate:" },
      {
        type: "list",
        items: [
          "✅ **Preciznu cenu** (RSD, bez skrivenih troškova)",
          "✅ **Rok isporuke**",
          "✅ **Šta je uključeno** (modelovanje, teksturisanje, render)",
          "✅ **Opcije za uštedu** (popusti na dodatne uglove, kombinovane usluge)",
        ],
      },
      {
        type: "paragraph",
        text: "Sve naše cene su **transparentne i unapred poznate** — možete ih videti i direktno na [stranici sa cenama](/cene).",
      },
      { type: "heading", level: 2, text: "Korak 3: Priprema briefa" },
      {
        type: "paragraph",
        text: "Brief je skraćeni opis projekta. Što je brief detaljniji, to je render bliži vašoj viziji. Dobar brief sadrži:",
      },
      { type: "paragraph", text: "**Obavezno:**" },
      {
        type: "list",
        items: [
          "Tlocrte (ili skicu rasporeda prostorija)",
          "Referentne fotografije stila koji vam se sviđa",
          "Dimenzije prostora",
        ],
      },
      { type: "paragraph", text: "**Poželjno:**" },
      {
        type: "list",
        items: [
          "Paleta boja ili uzorci materijala",
          "Fotografije nameštaja koji želite da koristimo",
          "Primeri \"like\" i \"dislike\" (šta volite, a šta ne)",
        ],
      },
      {
        type: "quote",
        text: "**Savet:** Niste sigurni kakav stil želite? Nema problema — naš dizajnerski tim može da predloži nekoliko opcija na osnovu karaktera prostora.",
      },
      { type: "heading", level: 2, text: "Korak 4: Izrada" },
      {
        type: "paragraph",
        text: "Kada potvrdite ponudu i dostavite materijale, kreće proces:",
      },
      {
        type: "table",
        headers: ["Faza", "Trajanje", "Opis"],
        rows: [
          ["**Modelovanje**", "2–5 dana", "Izrada 3D modela prostora"],
          ["**Teksturisanje**", "1–3 dana", "Nanošenje materijala i boja"],
          ["**Opremanje**", "2–4 dana", "Nameštaj, dekor, biljke"],
          ["**Osvetljenje**", "1–2 dana", "Prirodno i veštačko osvetljenje"],
          ["**Renderovanje**", "1–3 dana", "Finalni izračun slike"],
        ],
      },
      {
        type: "paragraph",
        text: "**Ukupno:** 7–14 dana za standardne projekte.",
      },
      { type: "heading", level: 3, text: "Revizije" },
      {
        type: "paragraph",
        text: "Deo procesa su i **revizije** — prilagođavanja na osnovu vaših povratnih informacija. Nakon prve verzije, možete tražiti izmene u:",
      },
      {
        type: "list",
        items: [
          "Bojama zidova i podova",
          "Poziciji kamere",
          "Vrsti nameštaja",
          "Osvetljenju",
        ],
      },
      {
        type: "paragraph",
        text: "Obično su **2–3 kruga revizija** dovoljna za savršen rezultat.",
      },
      { type: "heading", level: 2, text: "Korak 5: Isporuka" },
      {
        type: "paragraph",
        text: "Gotove rendere dobijate u **visokoj rezoluciji** (najmanje 4K), spremne za:",
      },
      {
        type: "list",
        items: [
          "✅ Objavljivanje u oglasima za nekretnine",
          "✅ Štampu (brošure, katalozi, bilbordi)",
          "✅ Društvene mreže (Instagram, Facebook, LinkedIn)",
          "✅ Prezentacije investitorima i klijentima",
        ],
      },
      { type: "heading", level: 2, text: "Česta pitanja" },
      {
        type: "paragraph",
        text: "**Koliko košta 3D render?** Cena zavisi od složenosti. Enterijerski renderi kreću od **19.924 RSD** za paket od 10 soba. Pogledajte [kompletan cenovnik](/cene).",
      },
      {
        type: "paragraph",
        text: "**Šta ako nemam tlocrte?** Nema problema. Možemo da modelujemo prostor na osnovu fotografija i približnih dimenzija.",
      },
      {
        type: "paragraph",
        text: "**Da li radite i vikendom?** Da, za hitne projekte nudimo prioritetnu obradu uz doplatu.",
      },
      {
        type: "paragraph",
        text: "**Kako plaćam?** Plaćanje je pouzećem ili uplatom na račun. Za veće projekte moguće je dogovoriti avansno plaćanje.",
      },
      { type: "heading", level: 2, text: "Pošaljite upit i krenimo" },
      {
        type: "paragraph",
        text: "Proces je jednostavan, a mi smo tu da vam pomognemo na svakom koraku — od ideje do gotovog fotorealističnog rendera.",
      },
      { type: "cta", label: "Pošaljite brief", href: "/kontakt" },
    ],
  },
  {
    slug: "ai-studio-obrada-fotografija-nekretnina",
    title:
      "AI Studio — kako veštačka inteligencija obrađuje fotografije nekretnina",
    excerpt:
      "AI obrada fotografija nekretnina je najbrži način da unapredite oglas. Sve o AI Studio alatima, cenama i efektu na prodaju.",
    date: "2026-04-28",
    author: "Elegant Render",
    coverImage: "/artwork/ai-tool-virtual_staging-after.webp",
    coverAlt:
      "AI obrada fotografije nekretnine — pre i posle AI Studio tretmana",
    tags: ["AI Studio", "Fotografija nekretnina"],
    keywords: [
      "AI obrada fotografija nekretnina",
      "AI studio",
      "obrada fotografija veštačka inteligencija",
      "AI retuširanje",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Fotografija je prvi kontakt kupca sa nekretninom. Istraživanja pokazuju da **oglasi sa profesionalnim fotografijama dobijaju do 118% više pregleda**. Ali šta ako nemate budžet za profesionalnog fotografa ili vam je potrebna obrada velikog broja slika u kratkom roku?",
      },
      {
        type: "paragraph",
        text: "Tu stupa **AI obrada fotografija nekretnina** — alat koji je promenio način na koji agencije i agenti pripremaju vizuelni materijal.",
      },
      { type: "heading", level: 2, text: "Šta je AI Studio?" },
      {
        type: "paragraph",
        text: "AI Studio je naš sistem za **automatsku obradu i unapređenje fotografija nekretnina** koji koristi napredne algoritme veštačke inteligencije. Za razliku od klasične Photoshop obrade koja zahteva sate rada, AI obrađuje slike u **nekoliko minuta**.",
      },
      {
        type: "heading",
        level: 2,
        text: "Šta AI može da uradi sa fotografijom nekretnine?",
      },
      {
        type: "heading",
        level: 3,
        text: "1. ✅ Automatska korekcija boja i osvetljenja",
      },
      {
        type: "list",
        items: [
          "Ispravlja **ekspoziciju** — tamne sobe postaju svetlije, a preeksponirani prozori dobijaju detalje",
          "Balansira **belu boju** — fotografije deluju prirodno, bez žućkastog ili plavkastog tona",
          "Poboljšava **kontrast i zasićenje** — prostor deluje privlačnije bez izobličenja",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "2. ✅ Uklanjanje neželjenih elemenata",
      },
      {
        type: "list",
        items: [
          "Lične stvari (čarape na podu, deterdženti, kozmetika)",
          "Ružni detalji (kablovi, produžni kabl, radijatori)",
          "Fleke na zidovima, ogrebotine na nameštaju",
        ],
      },
      {
        type: "heading",
        level: 3,
        text: "3. ✅ Zamena neba na eksterijer fotografijama",
      },
      {
        type: "paragraph",
        text: "Sivo i oblačno nebo **odmah postaje plavo i sunčano**. Ovo je jedan od najtraženijih AI tretmana za eksterijerne fotografije.",
      },
      { type: "heading", level: 3, text: "4. ✅ HDR obrada" },
      {
        type: "paragraph",
        text: "Kombinuje više ekspozicija u jednu savršeno osvetljenu sliku — vidite i detalje u enterijeru i kroz prozor istovremeno.",
      },
      {
        type: "heading",
        level: 3,
        text: "5. ✅ \"Dan u noć\" transformacija",
      },
      {
        type: "paragraph",
        text: "Dnevne fotografije pretvaramo u **dramatične noćne scene** sa toplim osvetljenjem prozora i sumračnim nebom.",
      },
      { type: "heading", level: 2, text: "AI Studio vs klasična obrada" },
      {
        type: "table",
        headers: ["Aspekt", "AI Studio", "Klasična Photoshop obrada"],
        rows: [
          ["**Cena**", "Od 1.172 RSD po slici", "2.000–5.000 RSD po slici"],
          ["**Vreme obrade**", "Nekoliko minuta", "1–3 sata po slici"],
          [
            "**Konzistentnost**",
            "Identičan kvalitet na svim slikama",
            "Zavisi od urednika",
          ],
          ["**Obrada grupe (10+)**", "Automatski batch", "Ručno, sliku po sliku"],
          ["**Prilagođavanje**", "Osnovno", "Potpuna kontrola"],
        ],
      },
      { type: "heading", level: 2, text: "Ko koristi AI Studio?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Agenti za nekretnine** — koji objavljuju 10–50 oglasa mesečno i treba im brza, konzistentna obrada",
          "**Investitori** — koji prodaju više nekretnina istovremeno",
          "**Fotografi** — kojima AI služi kao polazna tačka za dalju obradu",
          "**Agencije** — koje žele da standardizuju vizuelni identitet svih oglasa",
        ],
      },
      { type: "heading", level: 2, text: "Praktičan primer" },
      {
        type: "list",
        items: [
          "**Klijent:** Agencija za nekretnine, 45 oglasa mesečno",
          "**Problem:** Svaki oglas zahteva 5–8 fotografija, obrada ručno košta 3.000 RSD po slici",
          "**Rešenje:** AI Studio + Dan u noć obrada",
        ],
      },
      {
        type: "paragraph",
        text: "**Pre AI Studija:** 45 oglasa × 6 slika × 3.000 RSD = **810.000 RSD mesečno**, uz **180 sati** ručne obrade mesečno.",
      },
      {
        type: "paragraph",
        text: "**Posle AI Studija:** 45 oglasa × 6 slika × 1.172 RSD = **316.440 RSD mesečno**, uz **15 sati** pregleda mesečno.",
      },
      {
        type: "paragraph",
        text: "**Ušteda: 61% na budžetu i 92% na vremenu.**",
      },
      { type: "heading", level: 2, text: "Kako naručiti AI Studio obradu?" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Pošaljite fotografije** putem naše platforme",
          "**Odaberite tretman** (osnovna obrada, Dan u noć, uklanjanje elemenata)",
          "**Dobijate obrađene slike** u roku od 24h (ili 48h za batch obrade)",
          "**Preuzimate** u visokoj rezoluciji, spremne za objavljivanje",
        ],
      },
      { type: "heading", level: 2, text: "Ograničenja AI obrade" },
      {
        type: "paragraph",
        text: "Iako je AI izuzetno moćan alat, nije uvek rešenje za sve. AI ima problema sa:",
      },
      {
        type: "list",
        items: [
          "**Složenim uklanjanjima** — veliki objekti ili delovi prostora koji zahtevaju rekonstrukciju",
          "**Specifičnim brand bojama** — kada je potrebna tačna reprodukcija Pantone boja",
          "**Kreativnim odlukama** — AI ne može da \"smisli\" novi dizajn prostora",
        ],
      },
      {
        type: "paragraph",
        text: "Za te slučajeve nudimo i **klasičnu obradu u Photoshopu** kroz naš tim grafičkih dizajnera.",
      },
      { type: "cta", label: "Isprobaj AI Studio", href: "/ai-studio" },
    ],
  },
  {
    slug: "360-ture-u-prodaji-nekretnina",
    title:
      "360 ture u prodaji nekretnina: zašto kupci vole interaktivni prikaz",
    excerpt:
      "360 ture i virtuelne šetnje povećavaju angažovanje kupaca za preko 40%. Kako funkcionišu, koliko koštaju i kada ih koristiti.",
    date: "2026-05-05",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-360.webp",
    coverAlt: "360 virtuelna tura enterijera — interaktivni prikaz prostora",
    tags: ["360 ture", "Prodaja nekretnina"],
    keywords: [
      "360 tura nekretnina",
      "virtuelna tura",
      "3D tura stana",
      "interaktivni prikaz nekretnine",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Zamislite da kupac može da **prošeta kroz stan** bez fizičkog dolaska — da pogleda svaku sobu, proviri kroz prozor, pogleda plafon i pod, sve iz udobnosti svog dnevnog boravka.",
      },
      {
        type: "paragraph",
        text: "To nije naučna fantastika. To je **360 tura**, i postaje standard u prodaji nekretnina širom sveta.",
      },
      { type: "heading", level: 2, text: "Šta je 360 tura?" },
      {
        type: "paragraph",
        text: "360 tura (još je zovu virtuelna šetnja ili interaktivni prikaz) jeste **skup panoramskih fotografija ili renderova** koji su povezani u interaktivno iskustvo. Kupac klikom miša ili dodirom na ekranu prelazi iz sobe u sobu, okreće se za 360 stepeni i dobija osećaj **stvarnog boravka u prostoru**.",
      },
      { type: "heading", level: 2, text: "Zašto 360 ture funkcionišu?" },
      {
        type: "heading",
        level: 3,
        text: "1. Kupci su već navikli na interaktivni sadržaj",
      },
      {
        type: "paragraph",
        text: "Instagram Reels, TikTok, YouTube Shorts — ljudi su navikli da konzumiraju vizuelni sadržaj koji **reaguje na njihove pokrete**. Statična fotografija deluje dosadno u poređenju sa interaktivnim iskustvom.",
      },
      {
        type: "heading",
        level: 3,
        text: "2. Smanjuje broj fizičkih obilazaka",
      },
      {
        type: "paragraph",
        text: "Agent prodaje nekretnine provodi u proseku **6–8 sati** na fizičkim obilascima po jednoj nekretnini. Sa 360 turom, samo **ozbiljni kupci** dolaze na fizički obilazak — ostali su već eliminisani kroz virtuelnu šetnju.",
      },
      { type: "heading", level: 3, text: "3. Povećava angažovanje" },
      { type: "paragraph", text: "Statistike pokazuju da:" },
      {
        type: "list",
        items: [
          "**Kupci provode 3–5 minuta** u 360 turi (u poređenju sa 10–15 sekundi na statičnoj fotografiji)",
          "**40% više kupaca** šalje upit nakon što su videli 360 turu",
          "Nekretnine sa 360 turom **dobijaju 20–30% više zakazanih obilazaka**",
        ],
      },
      { type: "heading", level: 2, text: "Kada koristiti 360 turu?" },
      { type: "heading", level: 3, text: "📍 Nekretnine u prodaji" },
      {
        type: "paragraph",
        text: "360 tura je **idealna za sve nekretnine koje su spremne za prodaju**. Posebno je efikasna za:",
      },
      {
        type: "list",
        items: [
          "**Luksuzne nekretnine** — kupci očekuju premium iskustvo",
          "**Nekretnine u drugom gradu** — kupci ne mogu lako da dođu na fizički obilazak",
          "**Investicione nekretnine** — brza procena potencijala bez odlaska na teren",
          "**Stanovi u izgradnji** — prikaz završenog izgleda pre useljenja",
        ],
      },
      { type: "heading", level: 3, text: "📍 Nekretnine pod kirijom" },
      {
        type: "paragraph",
        text: "Iznajmljivači koriste 360 ture da bi **filtrirali zakupce** pre fizičkog obilaska.",
      },
      { type: "heading", level: 2, text: "Vrste 360 tura koje nudimo" },
      { type: "heading", level: 3, text: "Statička 360 tura" },
      {
        type: "paragraph",
        text: "Kombinacija fotorealističnih 3D renderova u 360 formi. Kupac se kreće klikom na tačke (hotspotove) u prostoru.",
      },
      {
        type: "paragraph",
        text: "**Cena:** Od **34.574 RSD po spratu** (10 panorama + 10 statičkih uglova + tlocrt).",
      },
      { type: "heading", level: 3, text: "Interaktivna 360 tura" },
      {
        type: "paragraph",
        text: "Naprednija verzija sa interaktivnim elementima — mogućnost otvaranja vrata, paljenja svetla, menjanja materijala.",
      },
      {
        type: "paragraph",
        text: "**Cena:** Po upitu (isporučuje se kroz partnersku mrežu).",
      },
      {
        type: "heading",
        level: 2,
        text: "Razlika između 360 i običnih renderova",
      },
      {
        type: "table",
        headers: ["", "Statički render", "360 render"],
        rows: [
          ["**Interaktivnost**", "❌", "✅"],
          ["**Vreme zadržavanja**", "10–15 sekundi", "3–5 minuta"],
          ["**Pregled kupca**", "Jedan kadar", "Ceo prostor"],
          ["**Fizički obilasci**", "100% potrebni", "40% manje potrebni"],
          ["**Cena**", "19.924 RSD (sprat)", "34.574 RSD (sprat)"],
        ],
      },
      { type: "heading", level: 2, text: "Kako se kreira 360 tura?" },
      {
        type: "heading",
        level: 3,
        text: "Ako nekretnina postoji (fotografija):",
      },
      {
        type: "paragraph",
        text: "Potrebno je fotografisati svaku sobu profesionalnom 360 kamerom, a zatim spojiti panorame u interaktivnu turu kroz specijalizovani softver.",
      },
      {
        type: "heading",
        level: 3,
        text: "Ako nekretnina ne postoji (3D render):",
      },
      {
        type: "paragraph",
        text: "Kreiramo kompletan 3D model prostora, postavljamo kamere na ključne tačke, i renderujemo svaku panoramu ponaosob. Zatim ih povezujemo u interaktivnu turu.",
      },
      { type: "heading", level: 2, text: "Najbolje prakse za 360 ture" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Započnite na ulaznim vratima** — prirodna tačka ulaska",
          "**Ograničite na 8–12 hotspotova** — previše opcija zbunjuje kupca",
          "**Dodajte tlocrt sprata** — kupac vidi gde se nalazi u odnosu na ostatak prostora",
          "**Označite ključne karakteristike** — nova kuhinja, klima, pogled",
          "**Uključite CTA** — \"Zakažite obilazak\" na kraju ture",
        ],
      },
      { type: "heading", level: 2, text: "Primer: Prodaja stambene zgrade" },
      {
        type: "list",
        items: [
          "**Klijent:** Investitor, novi stambeni kompleks",
          "**Potreba:** Prikazati 3 tipa stana potencijalnim kupcima pre završetka gradnje",
          "**Rešenje:** 360 ture za svaki tip stana",
        ],
      },
      { type: "paragraph", text: "**Rezultat:**" },
      {
        type: "list",
        items: [
          "**15% stanova prodato pre završetka gradnje** (pre-selling)",
          "**Smanjen broj fizičkih obilazaka za 60%**",
          "**Kupci su donosili odluke brže** — prosečno 2 dana umesto 2 nedelje",
        ],
      },
      {
        type: "cta",
        label: "Izračunajte cenu 360 ture",
        href: "/cene?group=360-ture",
      },
    ],
  },
];

// Average adult reading speed is ~200 wpm; count words across text-bearing
// blocks to give a rough "min čitanja" figure.
const WORDS_PER_MINUTE = 200;

export function estimateReadingMinutes(post: BlogPost): number {
  const words = post.body.reduce((total, block) => {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "quote":
        return total + countWords(block.text);
      case "list":
        return total + countWords(block.items.join(" "));
      case "table":
        return (
          total + countWords([...block.headers, ...block.rows.flat()].join(" "))
        );
      case "cta":
        return total + countWords(block.label);
      default:
        return total;
    }
  }, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const MONTHS_SR = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

/** Formats an ISO date (YYYY-MM-DD) as Serbian long form, e.g. "2. jul 2026." */
export function formatBlogDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day}. ${MONTHS_SR[month - 1]} ${year}.`;
}

/** All posts, newest first. */
export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** Other posts, ranked by shared tags, for the "keep reading" strip. */
export function getRelatedBlogPosts(post: BlogPost, limit = 2): BlogPost[] {
  return getAllBlogPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => sharedTagCount(b, post) - sharedTagCount(a, post))
    .slice(0, limit);
}

function sharedTagCount(a: BlogPost, b: BlogPost): number {
  return a.tags.filter((tag) => b.tags.includes(tag)).length;
}

/** All keyword phrases for a post's page metadata (tags + SEO keywords). */
export function blogPostKeywords(post: BlogPost): string[] {
  return Array.from(new Set([...post.tags, ...(post.keywords ?? [])]));
}

export function buildBlogPostingJsonLd(post: BlogPost) {
  const url = canonicalUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    headline: post.title,
    description: post.excerpt,
    inLanguage: SEO.htmlLang,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    image: absoluteUrl(post.coverImage),
    keywords: blogPostKeywords(post).join(", "),
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    author: {
      "@type": "Organization",
      name: post.author,
      url: SITE.url,
    },
    publisher: { "@id": SEO.organizationId },
  };
}

export function buildBlogItemListJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absoluteUrl("/blog")}#blog`,
    name: `${SITE.name} Blog`,
    url: absoluteUrl("/blog"),
    inLanguage: SEO.htmlLang,
    publisher: { "@id": SEO.organizationId },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.date,
      image: absoluteUrl(post.coverImage),
    })),
  };
}
