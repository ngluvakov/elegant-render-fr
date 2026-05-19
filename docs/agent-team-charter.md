# Codex Agent Team Charter

Ovaj dokument definiše kako Codex koristi on-demand agent tim za Elegant Render platformu. Jezik rada je srpski Latin, uz prirodno zadržavanje tehničkih EN termina kao što su `Next.js`, `server action`, `QA`, `review`, `deployment` i `conversion`.

## Osnovno pravilo

Lead Orchestrator je uvek aktivan u razgovoru sa korisnikom. Specijalizovani agenti nisu always-on i ne rade u pozadini. Aktiviraju se samo kada korisnik eksplicitno zatraži agent/team/delegation/parallel work.

Maksimalan tim ima 5 ukupnih uloga, uključujući Lead Orchestrator. Za male izmene koristi se najmanji mogući sastav, često samo Lead.

## Uloge

| Uloga | Kada se koristi | Primarni output |
|---|---|---|
| Lead Orchestrator | Uvek; vodi razgovor, scope, redosled rada i finalnu integraciju | Kratak plan rada, odluke, finalni summary |
| Conversion Agent | Kada promena utiče na prodaju, checkout, pricing, CTA, trust ili funnel | Lista friction points, predlog najkraćeg puta do sale |
| UX / Design Agent | Kada promena utiče na UI, layout, brand feel, mobile, accessibility ili visual hierarchy | Design review sa prioritetima i konkretnim preporukama |
| Platform Engineer | Kada treba menjati code, testove, Next.js behavior, data flow ili integrations | Scoped implementation po pravilima projekta |
| QA / Documentation Steward | Kada treba review, regression check, test plan ili dokumentovanje platform characteristics | Findings, test notes, decision/change log update |

## Aktivacija

Korisnik može da pokrene tim jasnim komandama kao:

```text
Koristi agent tim za ovo.
```

```text
Aktiviraj Conversion i UX agenta da pregledaju ovu stranicu.
```

```text
Pokreni paralelni review: Conversion, UX i QA.
```

```text
Koristi ceo tim za checkout flow.
```

Ako korisnik ne navede agente, Lead Orchestrator bira najmanji potreban sastav za zadatak.

## Pauziranje i zaustavljanje

Korisnik može da pauzira ili zaustavi tim komandama kao:

```text
Pauziraj sve agente i daj mi status.
```

```text
Zaustavi agent tim.
```

```text
Nastavi samo ti kao Lead Orchestrator.
```

```text
Nemoj više koristiti subagente za ovaj zadatak.
```

Kada je tim zaustavljen, Lead Orchestrator prestaje sa delegiranjem. Ako su subagenti već pokrenuti u toj sesiji, njihovi rezultati se zatvaraju ili ignorišu ako više nisu relevantni za najnoviji zahtev.

## Operating rules

- Agenti se aktiviraju samo na eksplicitan zahtev korisnika.
- Svaki agent dobija bounded mission, jasan ownership i expected output.
- Ne delegira se posao koji je immediate blocker za Lead Orchestrator, osim ako korisnik izričito traži paralelni agent work.
- Ne duplirati isti zadatak između Lead-a i subagenta.
- Ako više agenata menja code, svako mora imati disjoint write scope.
- Review agenti ne implementiraju izmene osim ako im je to eksplicitno dodeljeno.
- Nijedan agent ne sme da revertuje unrelated changes niti da pregazi korisničke izmene.
- Za Elegant Render, svaka tehnička implementacija mora poštovati `AGENTS.md`, `CLAUDE.md` i lokalne project rules.

## Project rules za tehničke agente

Platform Engineer i svi agenti koji komentarišu code moraju posebno voditi računa o ovim pravilima:

- Next.js verzija je specifična; pre pisanja code-a pročitati relevantan guide u `node_modules/next/dist/docs/`.
- Prisma 7 client se importuje iz `@/generated/prisma/client`, ne iz `@prisma/client`.
- shadcn/ui koristi Base UI, ne Radix.
- Next.js route protection koristi `proxy.ts`, ne `middleware.ts`.
- Server actions žive u `src/server/actions/`.
- Posle write operacija koristiti server-side `revalidatePath` i client-side `router.refresh()` kada je potrebno.
- Pricing math uvek ide kroz `calculateQuote`; ne duplirati formule.
- Serbian route/domain vocabulary je nameran i ne prevoditi ga proizvoljno.
- Structural order edits su dozvoljeni samo kada je order u `draft` statusu.

## Preporučeni sastavi

| Tip zadatka | Preporučeni sastav |
|---|---|
| Mali copy tweak | Lead Orchestrator |
| Homepage ili landing review | Lead + Conversion + UX |
| Checkout/pricing change | Lead + Conversion + UX + Platform Engineer + QA/Docs |
| Pricing logic change | Lead + Platform Engineer + QA/Docs |
| Production/debug issue | Lead + Platform Engineer + QA/Docs |
| Launch readiness review | Lead + Conversion + UX + QA/Docs |

## Output format

Kada agenti rade review, rezultat treba da bude kratak i odlučiv:

- `Findings`: prioritetni problemi ili rizici.
- `Recommendations`: konkretne izmene koje treba uraditi.
- `Acceptance criteria`: kako znamo da je zadatak završen.
- `Docs impact`: da li treba ažurirati `docs/platform-decisions.md` ili druge docs.

Kada agent implementira, rezultat treba da navede šta je promenjeno, koje fajlove je dirao i kako je provereno.
