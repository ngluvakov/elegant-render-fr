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
    slug: "interior-3d-rendering-cost",
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
        href: "/pricing",
      },
    ],
  },
  {
    slug: "virtual-vs-real-renovation",
    title: "Virtuelna renovacija vs stvarna renovacija: šta je isplativije?",
    excerpt:
      "Poređenje virtuelne i stvarne renovacije — cena, vreme, ishod. Kada je virtuelna renovacija bolji izbor od izvođenja radova.",
    date: "2026-04-14",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtual-renovation.webp",
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
        href: "/pricing?group=staging-renovation",
      },
    ],
  },
  {
    slug: "how-to-get-a-3d-visualization-quote",
    title: "Kako dobiti ponudu za 3D vizuelizaciju? Brzi vodič kroz proces",
    excerpt:
      "Sve što treba da znate pre nego što naručite 3D render — kako pripremiti brief, koje informacije su potrebne i koliko traje izrada.",
    date: "2026-04-21",
    author: "Elegant Render",
    coverImage: "/artwork/blog-3d-visualization-duplex.webp",
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
        text: "Sve naše cene su **transparentne i unapred poznate** — možete ih videti i direktno na [stranici sa cenama](/pricing).",
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
        text: "**Koliko košta 3D render?** Cena zavisi od složenosti. Enterijerski renderi kreću od **19.924 RSD** za paket od 10 soba. Pogledajte [kompletan cenovnik](/pricing).",
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
      { type: "cta", label: "Pošaljite brief", href: "/contact" },
    ],
  },
  {
    slug: "ai-studio-real-estate-photo-editing",
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
    slug: "360-tours-in-real-estate-sales",
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
        href: "/pricing?group=animation",
      },
    ],
  },
  {
    slug: "how-to-choose-a-3d-visualization-studio",
    title: "Kako izabrati pravu firmu za 3D vizuelizaciju? Vodič za klijente",
    excerpt:
      "Kako odabrati studio za arhitektonsku vizuelizaciju? Poređenje portfolija, cena, rokova i kvaliteta — sve što treba da znate pre nego što naručite 3D render.",
    date: "2026-05-12",
    author: "Elegant Render",
    coverImage: "/artwork/detail-interior-renders.webp",
    coverAlt:
      "Kvalitetna 3D vizuelizacija enterijera — primer rendera dnevnog prostora",
    tags: ["Saveti", "3D renderi"],
    keywords: [
      "kako izabrati firmu za 3D vizuelizaciju",
      "studio za arhitektonsku vizuelizaciju",
      "kvalitetan 3D render",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Odabir pravog studija za 3D vizuelizaciju može biti presudan za uspeh vašeg projekta — bilo da prodajete nekretninu, predstavljate investitorima idejno rešenje ili gradite brend arhitektonskog biroa. Kvalitetan render nije samo lepa slika: on nosi emociju, verno prikazuje materijale i pomaže kupcu da donese odluku. Kako onda znati kome poveriti posao?",
      },
      { type: "heading", level: 2, text: "Zašto izbor studija nije jednostavan?" },
      {
        type: "paragraph",
        text: "Na tržištu postoji veliki broj studija i freelance 3D umetnika koji nude slične usluge — ali rezultati se često značajno razlikuju. Loše urađen render može da:",
      },
      {
        type: "list",
        items: [
          "**Odbije potencijalne kupce** — nerealni materijali, loše osvetljenje",
          "**Uspori prodaju** — kupci ne mogu da zamisle prostor",
          "**Ošteti reputaciju** — nekvalitetna prezentacija projekta",
        ],
      },
      {
        type: "paragraph",
        text: "Zato je bitno znati na šta obratiti pažnju prilikom odabira.",
      },
      { type: "heading", level: 2, text: "Ključni kriterijumi za odabir" },
      { type: "heading", level: 3, text: "1. Portfolio — prvi i najvažniji korak" },
      {
        type: "paragraph",
        text: "Dobar studio ima javno dostupan portfolio sa stvarnim projektima. Obratite pažnju na:",
      },
      {
        type: "list",
        items: [
          "**Raznovrsnost** — da li rade enterijere, eksterijere, noćne scene, 360 ture?",
          "**Konzistentnost** — da li su svi renderi istog nivoa ili kvalitet varira?",
          "**Stvarni projekti** — da li portfolio prikazuje *realizovane* prostore, ne samo dizajnerske koncepte?",
        ],
      },
      {
        type: "quote",
        text: "**Savet:** Ako studio nema portfolio ili samo retuširane prikaze, to je crvena zastavica.",
      },
      { type: "heading", level: 3, text: "2. Komunikacija i proces" },
      { type: "paragraph", text: "Profesionalni studio ima jasan proces:" },
      {
        type: "list",
        items: [
          "**Konsultacije** pre početka rada",
          "**Brief forma** sa svim potrebnim informacijama",
          "**Iteracije** — broj dorada uključen u cenu",
          "**Rok isporuke** — realan i transparentan",
        ],
      },
      {
        type: "paragraph",
        text: "Elegant Render, na primer, nudi besplatne konsultacije pre naručivanja i ima standardizovan proces koji uključuje 2–3 iteracije dorade po renderu.",
      },
      { type: "heading", level: 3, text: "3. Tehnologija i alati" },
      {
        type: "paragraph",
        text: "Studio koji prati trendove verovatno će vam pružiti bolji rezultat:",
      },
      {
        type: "table",
        headers: ["Tehnologija", "Zašto je važna"],
        rows: [
          ["**Corona Render**", "Fotorealistično osvetljenje i materijali"],
          ["**AI obrada**", "Ubrzava post-produkciju (Elegant Render AI Studio)"],
          ["**360 ture**", "Interaktivni prikaz za kupce"],
          ["**Virtuelno opremanje**", "Pomaže kupcima da zamisle namešten prostor"],
        ],
      },
      { type: "heading", level: 3, text: "4. Transparentne cene" },
      {
        type: "paragraph",
        text: "Izbegavajte ponude koje skrivaju cene. Kvalitetni studiji objavljuju okvirni cenovnik:",
      },
      {
        type: "list",
        items: [
          "**Cena po renderu** — od 30€ do 200€ u zavisnosti od složenosti",
          "**Cena po tiri (setu uglova)** — popust na 3+ rendera",
          "**Dodatne usluge** — virtuelno opremanje, 360 tura, AI obrada",
        ],
      },
      {
        type: "paragraph",
        text: "Elegant Render ima **javno dostupan cenovnik** — uvek znate šta dobijate i po kojoj ceni.",
      },
      { type: "heading", level: 3, text: "5. Rokovi i fleksibilnost" },
      { type: "paragraph", text: "Proverite:" },
      {
        type: "list",
        items: [
          "Standardni rok isporuke (obično 3–7 radnih dana)",
          "Ekspres opciju (ako vam treba brzo)",
          "Mogućnost izmena i dorada",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Pitanja koja treba postaviti pre naručivanja",
      },
      {
        type: "paragraph",
        text: "Pre nego što odaberete studio, postavite ovih 7 pitanja:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Mogu li videti **kompletan portfolio** sa stvarnim projektima?",
          "Koji **render engine** koristite?",
          "Koliko **iteracija dorada** je uključeno?",
          "Šta je **rok isporuke** za moj projekat?",
          "Da li radite **virtuelno opremanje** i po kojoj ceni?",
          "Da li nudite **AI obradu** postojećih fotografija?",
          "Da li imate **ugovor** ili poslovnu dokumentaciju?",
        ],
      },
      { type: "heading", level: 2, text: "Poređenje: Freelancer vs Studio" },
      {
        type: "table",
        headers: ["Kriterijum", "Freelancer", "Studio (Elegant Render)"],
        rows: [
          ["Portfolio", "Često ograničen", "Javno dostupan, raznovrstan"],
          ["Proces", "Varira", "Standardizovan"],
          ["Cene", "Promenljive", "Transparentne"],
          ["Podrška", "Jedna osoba", "Tim"],
          ["Rokovi", "Zavise od dostupnosti", "Dogovoreni i ispoštovani"],
        ],
      },
      { type: "heading", level: 2, text: "Zaključak" },
      {
        type: "paragraph",
        text: "Odabir pravog studija za 3D vizuelizaciju je investicija koja se isplati. Ne birajte samo na osnovu cene — kvalitetan render može da udvostruči interesovanje za vašu nekretninu ili projekat.",
      },
      {
        type: "paragraph",
        text: "Ukoliko želite da porazgovaramo o vašem projektu, kontaktirajte nas za besplatne konsultacije. Pokazaćemo vam primere, objasniti proces i dati vam ponudu bez obaveza.",
      },
      {
        type: "cta",
        label: "Zatražite besplatne konsultacije",
        href: "/contact",
      },
    ],
  },
  {
    slug: "real-estate-photography-best-practices",
    title: "Najbolje prakse za fotografisanje nekretnina pre 3D obrade",
    excerpt:
      "Kako pripremiti fotografije nekretnina za AI obradu i 3D vizuelizaciju? Saveti za osvetljenje, kadriranje i rezoluciju koje koriste profesionalci.",
    date: "2026-05-19",
    author: "Elegant Render",
    coverImage: "/artwork/detail-photomontage.webp",
    coverAlt: "Fotografija nekretnine pripremljena za 3D obradu i AI vizuelizaciju",
    tags: ["Vodiči", "Fotografija nekretnina"],
    keywords: [
      "fotografisanje nekretnina saveti",
      "AI obrada fotografija nekretnina",
      "priprema fotografija za 3D vizuelizaciju",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Dobra fotografija je osnova svake dobre 3D vizuelizacije. Bez obzira na to da li koristite AI Studio za obradu postojećih fotografija ili naručujete potpuni 3D render, **kvalitet ulaznih materijala direktno utiče na konačan rezultat**.",
      },
      {
        type: "paragraph",
        text: "U ovom vodiču ćemo vam pokazati kako da napravite fotografije koje će dati najbolje rezultate u obradi.",
      },
      { type: "heading", level: 2, text: "Zašto je priprema važna?" },
      {
        type: "paragraph",
        text: "Loše fotografije = loš rezultat, čak i sa najboljim AI alatima. Problemi koje često viđamo:",
      },
      {
        type: "list",
        items: [
          "**Mutne fotografije** — AI ne može da doda detalje koji ne postoje",
          "**Loše osvetljenje** — previše senki ili isprano nebo",
          "**Pogrešna perspektiva** — iskrivljeni zidovi i linije",
          "**Nered u kadru** — lični predmeti, kablovi, alat",
        ],
      },
      {
        type: "paragraph",
        text: "Dobra polazna fotografija znači **manje dorade i bolji rezultat**.",
      },
      { type: "heading", level: 2, text: "5 ključnih pravila za fotografisanje" },
      { type: "heading", level: 3, text: "1. Osvetljenje je sve" },
      {
        type: "paragraph",
        text: "Fotografišite u **jutarnjim ili popodnevnim satima** kada je svetlo meko i difuzno. Izbegavajte podnevno sunce koje stvara jake senke.",
      },
      {
        type: "list",
        items: [
          "Koristite **prirodno svetlo** kad god je moguće",
          "Upalite **sva svetla u prostoriji** za balansiranu ekspoziciju",
          "Izbegavajte blendanje kamere direktno u prozor",
        ],
      },
      { type: "heading", level: 3, text: "2. Stabilna kamera = oštra fotografija" },
      {
        type: "paragraph",
        text: "Koristite **stativ** — to je jedini način da dobijete savršeno oštre fotografije. Bez stativa su čak i najbolje kamere sklone mikro-pomeranjima koja stvaraju zamućenje.",
      },
      {
        type: "list",
        items: [
          "ISO: 100–800 (što niže, to bolje)",
          "Brzina zatvarača: najmanje 1/60 (na stativu i sporije)",
          "Otvor blende: f/8–f/11 za najveću oštrinu",
        ],
      },
      { type: "heading", level: 3, text: "3. Ispravna perspektiva" },
      {
        type: "paragraph",
        text: "Držite kameru **horizontalno i vertikalno** poravnatu. Fotografije sa iskrivljenim linijama zahtevaju dodatnu korekciju u Photoshop-u.",
      },
      {
        type: "list",
        items: [
          "Visina kamere: oko 150cm (visina očiju)",
          "Ugao: blago prema dole za enterijere, ravno za fasade",
          "Izbegavajte **ultra-široke uglove** koji stvaraju distorziju",
        ],
      },
      { type: "heading", level: 3, text: "4. Izbacite sve suvišno" },
      {
        type: "paragraph",
        text: "Pre nego što pritisnete okidač, uklonite:",
      },
      {
        type: "list",
        items: [
          "Lične predmete (četkice, čaše, papiri)",
          "Kablove i produžne kablove",
          "Smeće i nered",
          "Neusklađene komade nameštaja",
        ],
      },
      {
        type: "quote",
        text: "**Savet:** Neka prostorija izgleda kao showroom — čisto, uredno, minimalno.",
      },
      { type: "heading", level: 3, text: "5. Rezolucija i format" },
      {
        type: "paragraph",
        text: "Fotografišite u **najvećoj mogućoj rezoluciji** koju kamera podržava.",
      },
      {
        type: "table",
        headers: ["Parametar", "Preporuka"],
        rows: [
          ["Rezolucija", "4000px na dužoj strani minimum"],
          ["Format", "JPEG (kvalitet 95%+)"],
          ["Boje", "sRGB ili AdobeRGB"],
          ["Baterija", "Dve pune baterije"],
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Kako AI Studio obrađuje vaše fotografije?",
      },
      {
        type: "paragraph",
        text: "Elegant Render AI Studio koristi napredne AI modele za:",
      },
      {
        type: "list",
        items: [
          "**Uklanjanje pozadine** — automatsko izolovanje objekata",
          "**Zamena neba** — realistično nebo za eksterijere",
          "**Poboljšanje osvetljenja** — balansiranje ekspozicije",
          "**Uklanjanje objekata** — brisanje neželjenih elemenata",
        ],
      },
      {
        type: "paragraph",
        text: "Što je polazna fotografija bolja, to će i AI obrada biti brža i prirodnija.",
      },
      { type: "heading", level: 2, text: "Česte greške i kako ih izbeći" },
      {
        type: "table",
        headers: ["Greška", "Rešenje"],
        rows: [
          ["Previše zumirano", "Koristite 24–35mm objektiv"],
          ["Tamne senke", "Dodajte dopunsko svetlo"],
          ["Isečeni nameštaj", "Uzmite širi kadar, kasnije isecite"],
          ["Žute nijanse", "Podesite balans bele boje (daylight mod)"],
        ],
      },
      { type: "heading", level: 2, text: "Primer dobre fotografije" },
      {
        type: "paragraph",
        text: "Dobra fotografija za obradu treba da bude:",
      },
      {
        type: "list",
        items: [
          "Oštra i stabilna",
          "Ujednačeno osvetljena",
          "Bez distorzije",
          "Sa urednim prostorom",
          "U visokoj rezoluciji",
        ],
      },
      {
        type: "paragraph",
        text: "Ako vam treba profesionalna obrada fotografija, Elegant Render AI Studio može da transformiše i prosečne fotografije u prodajne materijale. Pošaljite nam vaše fotografije na obradu.",
      },
      {
        type: "cta",
        label: "Pošaljite fotografije na obradu",
        href: "/ai-studio",
      },
    ],
  },
  {
    slug: "why-developers-use-3d-visualization-before-construction",
    title: "Zašto developeri nekretnina koriste 3D vizuelizacije pre izgradnje?",
    excerpt:
      "Kako 3D vizuelizacije pre izgradnje pomažu developerima da prodaju projekte brže, smanje rizik i dobiju finansiranje — sa konkretnim primerima i statistikama.",
    date: "2026-05-26",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-aerial.webp",
    coverAlt: "3D vizuelizacija stambenog objekta iz vazduha, pre izgradnje",
    tags: ["Trendovi", "Prodaja nekretnina"],
    keywords: [
      "3D vizuelizacija pre izgradnje",
      "prodaja nekretnina pre izgradnje",
      "arhitektonska vizuelizacija developeri",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Tržište nekretnina se menja. Kupci više ne kupuju samo kvadratne metre — oni kupuju **viziju, stil i način života**. Za developere koji prodaju projekte pre izgradnje (off-plan), 3D vizuelizacija je postala nezaobilazan alat.",
      },
      {
        type: "paragraph",
        text: "U ovom članku objašnjavamo zašto sve više investitora i developera ulaže u kvalitetne 3D vizuelizacije pre nego što se izgradi ijedna cigla.",
      },
      { type: "heading", level: 2, text: "Prednosti 3D vizuelizacije u pre-prodaji" },
      { type: "heading", level: 3, text: "1. Brža prodaja bez izgrađenog objekta" },
      {
        type: "paragraph",
        text: "Studije pokazuju da nekretnine predstavljene kroz fotorealistične 3D vizuelizacije imaju **do 40% brži prodajni ciklus** u fazi pre izgradnje. Kupci lakše donose odluku kada mogu da **vide** kako će izgledati njihov budući dom.",
      },
      { type: "heading", level: 3, text: "2. Smanjenje rizika i izmena" },
      {
        type: "paragraph",
        text: "Identifikacija problema u fazi vizuelizacije je **50–100x jeftinija** nego izmene na gradilištu. Developeri mogu da:",
      },
      {
        type: "list",
        items: [
          "Testiraju različite varijante fasada i materijala",
          "Prilagode raspored prostorija pre izgradnje",
          "Vizuelno potvrde da projekat odgovara brendu",
        ],
      },
      { type: "heading", level: 3, text: "3. Jača marketinška kampanja" },
      { type: "paragraph", text: "Web stranica sa 3D vizuelizacijama ima:" },
      {
        type: "list",
        items: [
          "**94% više pregleda** nego stranica bez vizuelnog sadržaja",
          "Prosečno **2.5 minuta duže zadržavanje** posetilaca",
          "**32% veću stopu konverzije** (upiti i rezervacije)",
        ],
      },
      { type: "heading", level: 3, text: "4. Lakše dobijanje finansiranja" },
      {
        type: "paragraph",
        text: "Banke i investitori lakše odobravaju projekte koji su vizuelno predstavljeni. Profesionalne 3D vizuelizacije pokazuju ozbiljnost i pripremljenost developera.",
      },
      { type: "heading", level: 2, text: "Kako developeri koriste 3D vizuelizacije?" },
      {
        type: "table",
        headers: ["Namena", "Opis", "Uticaj"],
        rows: [
          ["**Prodajni sajt**", "Fotorealistični prikazi projekta", "Veća posećenost"],
          ["**Brošure i katalozi**", "Profesionalni materijali za kupce", "Veće poverenje"],
          ["**Društvene mreže**", "Renderi za Instagram i Facebook", "Viralni doseg"],
          [
            "**Investicione prezentacije**",
            "Vizuelizacije za partnere i banke",
            "Brže odobrenje",
          ],
          ["**360 virtuelne ture**", "Interaktivni obilazak projekta", "2x više upita"],
        ],
      },
      { type: "heading", level: 2, text: "Studija slučaja: Konkretan primer" },
      {
        type: "paragraph",
        text: "Jedan beogradski developer je koristio 3D vizuelizacije za prodaju stambenog kompleksa od 45 jedinica.",
      },
      {
        type: "list",
        items: [
          "**Bez 3D vizuelizacija:** 12 rezervacija u prvih 3 meseca",
          "**Sa 3D vizuelizacijama:** 38 rezervacija u naredna 3 meseca",
          "**Povećanje:** 216%",
        ],
      },
      {
        type: "paragraph",
        text: "Investicija u vizuelizacije se isplatila 15 puta kroz bržu prodaju.",
      },
      { type: "heading", level: 2, text: "Koje vrste vizuelizacija su najefikasnije?" },
      { type: "heading", level: 3, text: "Enterijeri" },
      {
        type: "paragraph",
        text: "Prikaz dnevne sobe, spavaće sobe i kuhinje je **najefikasniji za prodaju** — kupci najlakše zamišljaju sebe u prostoru.",
      },
      { type: "heading", level: 3, text: "Eksterijeri i fasade" },
      {
        type: "paragraph",
        text: "Noćni renderi sa ambijentalnim osvetljenjem stvaraju **emotivnu privlačnost**.",
      },
      { type: "heading", level: 3, text: "Master plan i okruženje" },
      {
        type: "paragraph",
        text: "Prikaz zelenih površina, parkinga i zajedničkih prostora povećava **percipiranu vrednost projekta**.",
      },
      { type: "heading", level: 3, text: "360 virtuelne ture" },
      {
        type: "paragraph",
        text: "Omogućavaju kupcima da samostalno istraže prostor — najefikasniji format za **online prodaju**.",
      },
      { type: "heading", level: 2, text: "Zašto Elegant Render?" },
      {
        type: "paragraph",
        text: "Developeri širom Srbije biraju Elegant Render jer nudimo:",
      },
      {
        type: "list",
        items: [
          "**Fotorealistične vizuelizacije** sa Corona Render engine-om",
          "**Kratke rokove isporuke** — standardno 3–7 radnih dana",
          "**Transparentne cene** — znate trošak unapred",
          "**360 ture** za interaktivnu prezentaciju",
          "**AI Studio** za brzu obradu postojećih fotografija",
        ],
      },
      { type: "heading", level: 2, text: "Zaključak" },
      {
        type: "paragraph",
        text: "3D vizuelizacije su danas **standard**, ne luksuz. Developeri koji ulažu u kvalitetne vizuelizacije pre izgradnje prodaju brže, smanjuju rizik i grade poverenje kod kupaca.",
      },
      {
        type: "paragraph",
        text: "Želite da vidimo kako možemo da unapredimo prodaju vašeg projekta? Kontaktirajte nas za besplatne konsultacije.",
      },
      {
        type: "cta",
        label: "Zatražite konsultacije za projekat",
        href: "/contact",
      },
    ],
  },
  {
    slug: "virtual-staging-styles-2026",
    title:
      "Virtuelno opremanje enterijera: stilovi koji su najtraženiji u 2026.",
    excerpt:
      "Koji su najpopularniji stilovi virtuelnog opremanja enterijera u 2026? Minimalizam, japandi, wabi-sabi — vodič kroz trendove i primeri za prodaju nekretnina.",
    date: "2026-06-02",
    author: "Elegant Render",
    coverImage: "/artwork/detail-virtual-staging.webp",
    coverAlt: "Virtuelno opremljen enterijer — stilski uređen dnevni prostor",
    tags: ["Trendovi", "Virtuelno opremanje"],
    keywords: [
      "virtuelno opremanje enterijera",
      "stilovi enterijera 2026",
      "virtuelno nameštanje stana",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Virtuelno opremanje enterijera — ili virtuelni staging — najbrži je način da prazan ili nenamešten prostor pretvorite u prostor iz snova. Ali koji stilovi najbolje prolaze kod kupaca? Koji trendovi dominiraju u 2026. godini?",
      },
      {
        type: "paragraph",
        text: "U ovom vodiču analiziramo najtraženije stilove virtuelnog opremanja i dajemo preporuke kako da izaberete pravi stil za vašu nekretninu.",
      },
      { type: "heading", level: 2, text: "Zašto je izbor stila važan?" },
      {
        type: "paragraph",
        text: "Pravilan stil virtuelnog opremanja može da:",
      },
      {
        type: "list",
        items: [
          "**Poveća percipiranu vrednost** nekretnine za 10–20%",
          "**Skrati vreme prodaje** za 30–50%",
          "**Privuče specifičnu ciljnu grupu** kupaca",
        ],
      },
      {
        type: "paragraph",
        text: "Izbor pogrešnog stila, s druge strane, može da odbije kupce ili da učini da prostor izgleda zastarelo.",
      },
      { type: "heading", level: 2, text: "Top 5 stilova za 2026." },
      { type: "heading", level: 3, text: "1. Minimalizam sa toplim akcentima" },
      {
        type: "paragraph",
        text: "Klasičan minimalizam sa dodatkom drveta, tekstila i toplih boja. Ovo je **najbezbedniji izbor** — privlači najširu publiku.",
      },
      {
        type: "table",
        headers: ["Karakteristike", "Za koga"],
        rows: [
          ["Svetle boje, čiste linije", "Sve starosne grupe"],
          ["Drveni detalji", "Porodice"],
          ["Neutralna paleta", "Investitore"],
          ["Malo nameštaja, puno prostora", "Kupce prvog stana"],
        ],
      },
      { type: "heading", level: 3, text: "2. Japandi stil" },
      {
        type: "paragraph",
        text: "Fuzija japanskog i skandinavskog dizajna — **najbrže rastući trend** u 2026.",
      },
      {
        type: "list",
        items: [
          "Prirodni materijali (bambus, lan, kamen)",
          "Zemljane boje i pasteli",
          "Minimalni, ali funkcionalni nameštaj",
          "Fokus na spokoj i ravnotežu",
        ],
      },
      {
        type: "paragraph",
        text: "**Najbolje za:** Luksuzne nekretnine, apartmane, vikendice",
      },
      { type: "heading", level: 3, text: "3. Wabi-Sabi" },
      {
        type: "paragraph",
        text: "Prihvatanje nesavršenosti — stil koji slavi prirodne materijale, teksture i patinu.",
      },
      {
        type: "list",
        items: [
          "Ručno rađen nameštaj",
          "Neravne površine i prirodne teksture",
          "Topla, smirujuća atmosfera",
          "Korišćenje keramike i tkanih materijala",
        ],
      },
      {
        type: "paragraph",
        text: "**Najbolje za:** Seoske kuće, salaše, etno turizam",
      },
      { type: "heading", level: 3, text: "4. Moderna klasika" },
      {
        type: "paragraph",
        text: "Klasične forme sa modernim detaljima — **najprodavaniji stil** za investicione nekretnine.",
      },
      {
        type: "list",
        items: [
          "Chesterfield sofe, mermerni stočići",
          "Zlatni i mesingani detalji",
          "Simetričan raspored nameštaja",
          "Neutralna baza sa statement komadima",
        ],
      },
      {
        type: "paragraph",
        text: "**Najbolje za:** Gradske stanove, novogradnju, porodične kuće",
      },
      { type: "heading", level: 3, text: "5. Biophilic design" },
      {
        type: "paragraph",
        text: "Dizajn inspirisan prirodom — veliki trend u post-covid eri.",
      },
      {
        type: "table",
        headers: ["Element", "Efekat"],
        rows: [
          ["Sobne biljke", "Snižavaju stres za 30%"],
          ["Prirodno svetlo", "Povećava produktivnost"],
          ["Zemljane boje", "Stvaraju osećaj sigurnosti"],
          ["Prirodni materijali", "Povećavaju vrednost nekretnine"],
        ],
      },
      {
        type: "paragraph",
        text: "**Najbolje za:** Stambene zgrade sa terasama, kuće sa baštom",
      },
      { type: "heading", level: 2, text: "Kako izabrati pravi stil?" },
      { type: "heading", level: 3, text: "Faktor 1: Ciljna grupa kupaca" },
      {
        type: "table",
        headers: ["Ciljna grupa", "Preporučen stil"],
        rows: [
          ["Mladi bračni parovi", "Minimalizam"],
          ["Porodice sa decom", "Moderna klasika"],
          ["Penzioneri", "Wabi-Sabi"],
          ["Investitori", "Japandi"],
          ["Luksuzni kupci", "Biophilic"],
        ],
      },
      { type: "heading", level: 3, text: "Faktor 2: Lokacija i tip nekretnine" },
      {
        type: "list",
        items: [
          "**Gradski centar:** Moderna klasika",
          "**Novi Beograd:** Minimalizam",
          "**Vikendice i salaši:** Wabi-Sabi",
          "**Luksuzni apartmani:** Japandi",
          "**Porodične kuće:** Biophilic",
        ],
      },
      { type: "heading", level: 3, text: "Faktor 3: Budžet" },
      {
        type: "paragraph",
        text: "Virtuelno opremanje je **do 95% jeftinije** od fizičkog nameštanja. Dok fizički staging košta 500–3000€ mesečno + transport i skladištenje, virtuelno opremanje je jednokratna investicija od 30–150€ po renderu, bez logističkih troškova.",
      },
      { type: "heading", level: 2, text: "Zašto virtuelno opremanje?" },
      {
        type: "table",
        headers: ["Poređenje", "Fizički staging", "Virtuelni staging"],
        rows: [
          ["Cena", "500–3000€ mesečno", "30–150€ po prikazu"],
          ["Vreme postavljanja", "2–7 dana", "2–3 radna dana"],
          ["Fleksibilnost", "Jedan stil", "Više stilova za isti prostor"],
          ["Skladištenje", "Potrebno", "Nije potrebno"],
        ],
      },
      { type: "heading", level: 2, text: "Primer: Isti prostor u 3 različita stila" },
      {
        type: "paragraph",
        text: "Jedna od prednosti virtuelnog opremanja je **mogućnost prikaza istog prostora u više stilova**. Zamislite dnevnu sobu koju možete da prikažete kao:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Minimalističku** — za mlade profesionalce",
          "**Modernu klasiku** — za porodicu",
          "**Biophilic** — za ljubitelje prirode",
        ],
      },
      {
        type: "paragraph",
        text: "Svaki stil privlači drugu ciljnu grupu — a sve iz istog osnovnog rendera.",
      },
      { type: "heading", level: 2, text: "Zaključak" },
      {
        type: "paragraph",
        text: "Virtuelno opremanje enterijera u 2026. godini nije samo opcija — ono je **standard**. Bilo da prodajete stan u centru grada ili kuću na selu, pravi stil može da bude odlučujući faktor za kupca.",
      },
      {
        type: "paragraph",
        text: "Elegant Render nudi virtuelno opremanje u svim aktuelnim stilovima. Pošaljite nam tlocrt i fotografije — pokazaćemo vam kako vaš prostor može da izgleda u stilu koji najbolje prodaje.",
      },
      {
        type: "cta",
        label: "Pogledajte virtuelno opremanje",
        href: "/services/virtual-staging",
      },
    ],
  },
  {
    slug: "how-to-prepare-cad-drawings-for-3d-visualization",
    title: "Kako pripremiti CAD crteže za 3D vizuelizaciju? Vodič za arhitekte",
    excerpt:
      "Kako pripremiti CAD, Revit ili SketchUp fajlove za 3D vizuelizaciju? Kompletan vodič za arhitekte — formati, saveti, nivo detalja i checklista.",
    date: "2026-06-09",
    author: "Elegant Render",
    coverImage: "/artwork/detail-exterior-renders.webp",
    coverAlt:
      "Fotorealističan 3D render eksterijera moderne vile sa bazenom u zlatnom svetlu",
    tags: ["Vodiči", "3D renderi"],
    keywords: [
      "priprema CAD crteža za 3D",
      "fajlovi za 3D vizuelizaciju",
      "arhitektonski crteži za render",
    ],
    body: [
      {
        type: "paragraph",
        lead: true,
        text: "Dobra 3D vizuelizacija počinje sa **dobrim ulaznim podacima**. Kao arhitekta ili dizajner, vi imate ključnu ulogu — kvalitet CAD crteža koje pošaljete studiju direktno utiče na brzinu, cenu i kvalitet konačnog rendera.",
      },
      {
        type: "paragraph",
        text: "U ovom vodiču ćemo objasniti kako da pripremite fajlove tako da 3D umetnik dobije sve što mu treba.",
      },
      { type: "heading", level: 2, text: "Zašto je priprema fajlova važna?" },
      {
        type: "paragraph",
        text: "Nepotpuna ili nestandardna dokumentacija dovodi do:",
      },
      {
        type: "list",
        items: [
          "**Dodatnih iteracija** — više vremena i troškova",
          "**Pogrešnih interpretacija** — render ne odgovara projektu",
          "**Produženih rokova** — dokumentacija se traži naknadno",
          "**Viših cena** — studio naplaćuje dodatno vreme",
        ],
      },
      {
        type: "paragraph",
        text: "Dobra priprema smanjuje troškove za **20–40%** i ubrzava proces za **30–50%**.",
      },
      { type: "heading", level: 2, text: "6 koraka za savršenu pripremu" },
      { type: "heading", level: 3, text: "Korak 1: Odaberite pravi format" },
      {
        type: "table",
        headers: ["Format", "Preporuka"],
        rows: [
          ["**DWG/DXF** (AutoCAD)", "✅ Najbolji — sve dimenzije i slojevi"],
          ["**RVT** (Revit)", "✅ Sadrži BIM podatke"],
          ["**SKP** (SketchUp)", "✅ Ako je model detaljan"],
          ["**PDF**", "❌ Samo za orijentaciju"],
          ["**Slike (JPEG/PNG)**", "❌ Nedovoljno precizne"],
        ],
      },
      {
        type: "paragraph",
        text: "**Preporuka:** DWG je univerzalni standard koji svi 3D studiji podržavaju.",
      },
      { type: "heading", level: 3, text: "Korak 2: Organizujte slojeve (layers)" },
      {
        type: "paragraph",
        text: "Dobro organizovani slojevi su **najvažniji** deo pripreme. Očekujemo:",
      },
      {
        type: "table",
        headers: ["Layer", "Šta sadrži"],
        rows: [
          ["Zidovi (noseći)", "Beton, blok, cigla"],
          ["Zidovi (pregrade)", "Gips, staklo"],
          ["Podovi", "Nivoi, materijali"],
          ["Plafoni", "Spušteni, ravni"],
          ["Stolarija", "Prozori, vrata"],
          ["Nameštaj", "Fiksni elementi"],
          ["Instalacije", "Elektrika, vodovod"],
          ["Dimenzije", "Kotiranje"],
        ],
      },
      {
        type: "quote",
        text: "**Savet:** Očistite crtež od nepotrebnih slojeva (grid linije, notes, pomoćne linije).",
      },
      { type: "heading", level: 3, text: "Korak 3: Definišite materijale" },
      {
        type: "paragraph",
        text: "Navedite materijale za svaku površinu. Najlakši način:",
      },
      {
        type: "list",
        items: [
          "**U DWG crtežu:** Napišite materijal na svakoj površini (npr. \"hrast parket\", \"keramika 60x60\")",
          "**U posebnom dokumentu:** Excel lista sa sobama i materijalima",
          "**Reference:** Pošaljite 1–3 slike za svaki materijal (referenca, ne tačan prikaz)",
        ],
      },
      { type: "heading", level: 3, text: "Korak 4: Dostavite fotografije lokacije" },
      {
        type: "paragraph",
        text: "Ako radimo na postojećem objektu, pošaljite fotografije:",
      },
      {
        type: "list",
        items: [
          "**Sve sobe** iz više uglova",
          "**Spoljašnji izgled** objekta",
          "**Okruženje** — susedne zgrade, ulica",
          "**Detalji** — profil lajsni, rukohvati, radijatori",
        ],
      },
      {
        type: "paragraph",
        text: "Fotografije pomažu 3D umetniku da razume **prostorne odnose** i **postojeće stanje**.",
      },
      { type: "heading", level: 3, text: "Korak 5: Definišite uglove kamere" },
      {
        type: "paragraph",
        text: "Precizno odredite koji uglovi treba da se renderuju:",
      },
      {
        type: "list",
        items: [
          "**Tlocrt sa oznakom kamere** — ugao i pravac gledanja",
          "**Visina kamere** — standardno 150–170cm",
          "**Vrsta kadra** — wide, medium, detail",
        ],
      },
      { type: "paragraph", text: "Primer dobre specifikacije:" },
      {
        type: "quote",
        text: "\"Kamera 1 — dnevna soba, wide shot iz ugla ulaznih vrata, visina 160cm, prikaz celog prostora\"",
      },
      { type: "heading", level: 3, text: "Korak 6: Dostavite moodboard" },
      {
        type: "paragraph",
        text: "Moodboard sa referencama pomaže da 3D umetnik uhvati vašu **viziju**:",
      },
      {
        type: "list",
        items: [
          "3–5 referentnih slika željenog stila",
          "Paleta boja (možete koristiti Adobe Color ili Coolors)",
          "Primeri osvetljenja (dnevno/veštačko/ambijentalno)",
        ],
      },
      { type: "heading", level: 2, text: "Checklista za slanje fajlova" },
      {
        type: "paragraph",
        text: "Pre nego što pošaljete fajlove studiju, prođite kroz ovu listu:",
      },
      {
        type: "list",
        items: [
          "DWG fajlovi su očišćeni i organizovani",
          "Svi slojevi su pravilno imenovani",
          "Materijali su navedeni na crtežu",
          "Referentne slike materijala su priložene",
          "Uglovi kamere su definisani",
          "Moodboard ili stilski vodič je priložen",
          "Fotografije postojećeg stanja su dostavljene (ako je rekonstrukcija)",
          "Rok i očekivanja su jasno navedeni",
        ],
      },
      { type: "heading", level: 2, text: "Najčešće greške" },
      {
        type: "table",
        headers: ["Greška", "Posledica", "Kako izbeći"],
        rows: [
          ["Previše detalja", "Sporo učitavanje", "Filtrirajte slojeve"],
          ["Nedovoljno informacija", "Pogrešna interpretacija", "Koristite checklistu"],
          ["Stari formati", "Loša kompatibilnost", "DWG 2018+"],
          ["Bez referenci", "Gubitak vremena", "5 referentnih slika"],
        ],
      },
      { type: "heading", level: 2, text: "Kako mi radimo u Elegant Render-u?" },
      { type: "paragraph", text: "Naš proces je jednostavan:" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Pošaljite CAD crteže** — putem forme na sajtu ili mejlom",
          "**Konsultacije** — razjasnimo detalje i potrebe",
          "**Ponuda** — dobijate cenu i rok u roku od 24h",
          "**Modelovanje** — 3D model i postavljanje kamera",
          "**Renderovanje** — fotorealistična vizuelizacija",
          "**Dorade** — 2–3 iteracije uključene u cenu",
        ],
      },
      { type: "heading", level: 2, text: "Zaključak" },
      {
        type: "paragraph",
        text: "Kvalitetna priprema CAD crteža je **ulaznica za vrhunsku 3D vizuelizaciju**. Uložite malo vremena u organizaciju fajlova i uštedite vreme, novac i živce — vaš 3D studio će vam biti zahvalan.",
      },
      {
        type: "paragraph",
        text: "Imate CAD crteže spremne za vizuelizaciju? Pošaljite nam ih na obradu — daćemo vam ponudu u roku od 24 sata.",
      },
      { type: "cta", label: "Pošaljite CAD crteže", href: "/contact" },
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
