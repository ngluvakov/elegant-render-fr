# Google Ads / GTM Conversion Inventory

Ovaj dokument je handoff za agenta koji planira Google Ads, GA4 i Google Tag
Manager merenje i trenutnu runtime implementaciju dataLayer događaja. Cilj je da se ne nagađa šta je
konverzija na Elegant Render platformi, gde nastaje, koliku vrednost nosi i
da li je spremna za Google Ads optimizaciju.

## Trenutno stanje

- Google Tag Manager container: `GTM-5X2MCQ87`.
- GA4 Measurement ID u GTM-u: `G-5090C2WQVB`.
- PostHog je trenutni product analytics source of truth za funnel događaje.
  Šema događaja je u `src/lib/posthog-events.ts`, a client/server helper-i su
  `track()` i `captureServerEvent()`.
- Consent se čuva u `localStorage` kroz `src/lib/consent.ts`. Kategorije su
  `necessary`, `analytics`, `marketing` i `recording`.
- GTM/GA4 treba da rade samo uz odgovarajuću saglasnost. Google Consent Mode
  default je `denied`; `analytics_storage` prati analytics consent, a
  `ad_storage`, `ad_user_data` i `ad_personalization` prate marketing consent.
- LinkedIn Insight Tag (`9178042`) se učitava samo posle `marketing` consent-a.
- Aplikacija sada šalje `er_begin_checkout`, `er_generate_lead` i
  `er_purchase` dataLayer događaje kroz consent-aware helper-e; GTM treba da ih
  mapira u GA4/Google Ads tagove.

**Resolved caveat:** hardcoded GTM bootstrap i `noscript` iframe su uklonjeni iz
`src/app/layout.tsx`. GTM učitavanje je centralizovano u
`src/components/analytics/google-tag-manager-post-launch.tsx` i gated je preko
`NEXT_PUBLIC_GTM_ENABLED` plus analytics ili marketing consent.

## Pravila merenja

- Razdvojiti product analytics od Ads optimizacije. Ne treba svaki PostHog
  signal da postane Google Ads konverzija.
- Primarne Google Ads konverzije treba da budu događaji sa jasnom poslovnom
  vrednošću: plaćena porudžbina, kupljeni AI krediti i kvalifikovan lead.
- Revenue konverzije moraju biti server-validated ili potvrđene iz payment
  source of truth-a. Browser click na dugme za plaćanje nije kupovina.
- Lead konverzije treba meriti na uspešan submit, ne na otvaranje forme.
- Admin-only događaji su korisni za operativnu analitiku, ali nisu Ads
  konverzije po default-u.
- Ne slati raw PII u generičke analytics evente. Enhanced conversions su
  zaseban, eksplicitno odobren setup.

## Conversion Inventory

### Baseline / Consent

| Događaj | Trenutni izvor | Google uloga | Napomena |
|---|---|---|---|
| `virtual_page_view` | `src/components/analytics/google-tag-manager-post-launch.tsx` | GA4 page_view source | Šalje `page_path`, `page_location`, `page_title` posle analytics consent-a. |
| `er_analytics_consent_granted` | `google-tag-manager-post-launch.tsx` | Consent/debug | Nije konverzija; koristi se za proveru consent flow-a u GTM Preview-u. |
| `er_analytics_consent_denied` | `google-tag-manager-post-launch.tsx` | Consent/debug | Nije konverzija. |

### Catalog / Quote Micro-Conversions

| Događaj | Trenutni izvor | Google uloga | Napomena |
|---|---|---|---|
| `quote_started` | `src/components/configurator/quote-context.tsx` | Secondary GA4 goal | Prva dodata usluga; može mapirati u GA4 `add_to_cart` ili custom `quote_started`. |
| `service_added` | `quote-context.tsx` | Secondary GA4 goal | Nosi `product_id`, `category_id`, `cart_size_after`, opcioni `source_mode`. |
| `service_removed` | `quote-context.tsx` | Diagnostic only | Korisno za friction, ne Ads konverzija. |
| `quote_prefilled_from_url` | `src/components/configurator/pricing-configurator.tsx` | Secondary / attribution context | Korisnik došao sa prefill linka ili homepage CTA-a. |
| `quote_loaded_from_share` | `pricing-configurator.tsx` | Secondary / attribution context | Otvoren share token; može značiti returning buyer intent. |
| `quote_saved` | `src/components/configurator/quote-summary.tsx` | Secondary GA4 goal | High-intent micro-conversion; čuva share URL. |
| `checkout_started` | `quote-summary.tsx` | Secondary Ads/GA4 goal | Najvažniji pre-payment korak; mapirati u GA4 `begin_checkout`. |
| `cart_chip_click` | `src/components/configurator/cart-chip.tsx` | Diagnostic | Mobile/compact cart engagement. |
| `category_preview_click` | `src/components/configurator/category-preview.tsx` | Diagnostic | Kategorijski interes. |
| `service_group_picked` | `src/components/configurator/service-adder.tsx` | Diagnostic | Izbor service grupe u konfiguratoru. |
| `service_chip_click` | `src/components/configurator/service-chooser-chips.tsx` | Diagnostic | Filter interes. |
| `service_tablica_click_dodaj` | `src/components/configurator/service-tablica.tsx` | Secondary | Dodavanje iz tabličnog/pricing prikaza. |
| `service_tablica_click_upsell` | `src/components/configurator/related-upsell-card.tsx` | Secondary / upsell | Nosi primarni i related product + discount. |
| `service_matrix_cat_click` | `src/components/configurator/service-matrix-sidebar.tsx` | Diagnostic | Kategorija u matrix prikazu. |
| `service_matrix_add` | `src/components/configurator/service-matrix-row.tsx`, `service-detail-drawer.tsx` | Secondary | Dodavanje iz row ili detail drawer-a. |
| `service_matrix_info_open` | `service-matrix-row.tsx` | Diagnostic | Product info intent. |
| `anim_source_mode_picked` | `service-adder.tsx`, `src/components/portal/animation-config-section.tsx` | Diagnostic / segment | Segmentira animaciju: `scratch`, `existing`, `active`. |
| `staging_type_swapped` | `src/components/portal/staging-config-section.tsx` | Diagnostic | Static vs 360 staging preference. |

### Checkout

| Događaj | Trenutni izvor | Google uloga | Napomena |
|---|---|---|---|
| `order_created` | `src/app/(marketing)/poruci/steps/step-review.tsx` | Secondary Ads/GA4 goal | Order postoji, ali nije plaćen. Nosi `order_number`, `total_rsd`, `item_count`. |
| `payment_started` | `src/app/(marketing)/poruci/steps/step-payment.tsx`, `src/components/portal/pending-payment-card.tsx` | Secondary / funnel step | Nosi provider i total. Ne tretirati kao kupovinu. |
| `payment_failed` | `step-payment.tsx`, `pending-payment-card.tsx` | Diagnostic | Korisno za Ads landing QA i payment friction. |
| `payment_completed` | `step-payment.tsx` | Legacy/test-only signal | Trenutno se pouzdano emituje samo za `card_mock` browser flow. Za real Ads revenue koristiti payment source of truth. |

### Revenue Conversions

| Konverzija | Source of truth | Trenutni signal | Google uloga | Sledeći korak |
|---|---|---|---|---|
| Plaćena service porudžbina | `finishSuccessfulPayment()` u `src/server/actions/payment.ts` posle NestPay potvrde | `er_purchase` preko payment success client/server handoff-a | Primary Ads conversion + GA4 `purchase` | `transaction_id=orderNumber`, `value`, `currency`, `items`; wire transfer ostaje offline import kandidat. |
| Plaćeni AI krediti | `applyPurchasedAiCreditsForOrder()` pozvan iz `finishSuccessfulPayment()` | `er_purchase` sa `contains_ai_credits=true` | Primary Ads conversion + GA4 `purchase` | Za credit-only porudžbine posebna Ads akcija ako budžet optimizuje AI Studio. |
| Nestpay uspeh | `src/app/api/nestpay/return/route.ts` posle hash-verifikovanog approved POST-a | `/poruci/uspeh?oid=...` renderuje `er_purchase` iz persisted order snapshot-a | Primary purchase source | Success page ima browser dedupe; reconciler bez browser-a zahteva budući offline/server-side import. |
| Wire transfer paid | `src/server/actions/mark-wire-paid.ts` | Audit log `payment.wire_received` | Offline/primary revenue conversion | Za Google Ads uvesti offline conversion import ili server-side event; vezati za original `gclid/gbraid/wbraid` ako se čuva. |
| Mock card payment | `mockCardPaymentAction()` | `er_purchase` samo u test-mode browser flow-u | Test only | Filtrirati iz production Ads konverzija. |
| `additional_charge_paid` | `src/server/actions/charge-payment.ts` | PostHog server event | Secondary revenue / optional | Nije new customer acquisition; obično secondary/offline revenue, ne primary bidding. |

### Lead Conversions

| Događaj | Trenutni izvor | Google uloga | Napomena |
|---|---|---|---|
| `quick_inquiry_opened` | `src/components/inquiry/quick-inquiry-provider.tsx` | Secondary / form intent | Otvaranje forme nije lead submit. |
| `contact_form_started` | `src/components/inquiry/project-inquiry-form.tsx` | Secondary / form intent | Samo za `mode="contact"` i prvi focus. |
| `project_inquiry_submitted` | `project-inquiry-form.tsx` + `submitProjectInquiry()` | Primary Ads lead + GA4 `generate_lead` | Uspešan submit generic lead-a; klijent push-uje `er_generate_lead` sa `lead_type`, `source_path`, `file_count`, `has_quote_snapshot`. |
| `vr_inquiry_submitted` | `src/app/(marketing)/usluge/vr/konsultacija/inquiry-form.tsx` + `submitVrInquiry()` | Primary Ads lead + GA4 `generate_lead` | VR konsultacije su inquiry-only proizvod; klijent push-uje `er_generate_lead` sa `lead_type=vr_inquiry`. |

### Lead Qualification / Offline Outcomes

| Outcome | Source of truth | Trenutni signal | Google uloga | Sledeći korak |
|---|---|---|---|---|
| Generic inquiry converted to order | `src/server/actions/convert-inquiry-to-order.ts` | Audit/outbox, nema PostHog event | Offline qualified lead / secondary Ads | Uvesti `project_inquiry_converted` ili offline import; povezati sa izvornim inquiry id-em. |
| `vr_inquiry_converted` | `src/app/portal/admin/vr-upiti/convert-form.tsx` | Client PostHog event u admin UI-u | Offline qualified lead | Bolje premestiti/duplirati server-side da ne zavisi od admin browser-a. |
| `proforma_issued` | `src/server/actions/issue-proforma.ts` | Audit/outbox, nema analytics event | Secondary qualified opportunity | Može biti offline milestone za wire-transfer leadove, ne primary purchase. |
| `wire_transfer_paid` | `src/server/actions/mark-wire-paid.ts` | Audit `payment.wire_received` | Primary/offline revenue | Videti revenue table. |

### AI Studio Activation

| Događaj | Trenutni izvor | Google uloga | Napomena |
|---|---|---|---|
| `ai_generation_started` | `src/app/portal/ai-studio/workspace.tsx` | Secondary activation | Nosi `edit_type`, provider/model, mode, mask/style/options/ref info, `units_charged`. |
| `ai_generation_completed` | `workspace.tsx` | Secondary activation / product success | Dobar GA4 goal za AI Studio engagement, nije Ads primary revenue. |
| `ai_generation_failed` | `workspace.tsx` | Diagnostic | Meriti friction/refund kvalitet. |
| `ai_reference_prepared` | PostHog schema only | Deprecated / not fired | `src/app/api/ai-studio/references/prepare/route.ts` vraća 410; ne planirati tag. |

### Operational / Admin Events

| Događaj | Trenutni izvor | Google uloga | Napomena |
|---|---|---|---|
| `admin_charge_requested` | `src/server/actions/admin-charges.ts` | Not Ads conversion | Operativni signal za dodatne naplate. |
| `additional_charge_paid` | `src/server/actions/charge-payment.ts` | Optional secondary revenue | Vidi revenue table; ne primary acquisition. |
| `admin_credits_granted` | `src/server/actions/admin.ts` | Not Ads conversion | Interni grant, nema plaćanja. |
| `admin_free_revision_granted` | `src/server/actions/admin.ts` | Not Ads conversion | Retention/support signal, ne Ads. |

## Recommended Google Mapping

### Primary Google Ads Conversions

| Google action | Platform trigger | GA4 event | Ads optimization | Vrednost |
|---|---|---|---|---|
| Paid service order | `paymentStatus=completed` za order sa `service` itemima | `purchase` | Primary | `value` = naplaćeni iznos, `currency` = billing currency. |
| Paid AI-credit purchase | `paymentStatus=completed` za order sa `ai_credits` itemima | `purchase` | Primary ili separate primary za AI kampanje | `value` = naplaćeni iznos. |
| Project inquiry submitted | `project_inquiry_submitted` posle uspešnog submit-a | `generate_lead` | Primary lead | Fixed lead value ili dynamic estimate po source/snapshot-u. |
| VR inquiry submitted | `vr_inquiry_submitted` posle uspešnog submit-a | `generate_lead` | Primary lead | Viši fixed lead value od generic inquiry-a. |
| Wire transfer paid | `markWireTransferPaid()` | `purchase` ili offline conversion import | Primary/offline | Naplaćeni iznos iz order-a. |

### Secondary Ads / GA4 Goals

| Platform trigger | GA4/custom event | Zašto |
|---|---|---|
| `checkout_started` | `begin_checkout` | Bidding support i funnel drop-off. |
| `order_created` | custom `order_created` | High intent, ali unpaid. |
| `quote_saved` | custom `quote_saved` | Vraćanje na ponudu / share intent. |
| `payment_started` | custom `payment_started` | Razumevanje provider friction-a. |
| `quick_inquiry_opened` | custom `lead_form_opened` | Lead intent, nije submit. |
| `contact_form_started` | custom `lead_form_started` | Form engagement. |
| `ai_generation_completed` | custom `ai_generation_completed` | AI Studio activation/retention. |

### Diagnostics Only

- `payment_failed`
- `service_removed`
- `ai_generation_failed`
- `admin_credits_granted`
- `admin_free_revision_granted`
- `admin_charge_requested`
- Mock-card production events, ako se ikad pojave, treba filtrirati.

## Implemented dataLayer Contract

Aplikacija gura platform-specific evente u `dataLayer`, a GTM ih mapira u GA4
recommended events i Google Ads conversion tags. Kod se ne vezuje za Ads
label-e; payload tipovi su u `src/lib/analytics/google-data-layer.ts`, a
browser push/dedupe helper je u `src/lib/analytics/google-data-layer-client.ts`.

### Common Fields

| Polje | Tip | Obavezno | Opis |
|---|---|---|---|
| `event` | string | Da | Interni dataLayer event, npr. `er_purchase`, `er_generate_lead`, `er_begin_checkout`. |
| `event_id` | string | Da za konverzije | UUID/idempotency key za dedupe između browser/server signala. |
| `transaction_id` | string | Da za revenue | `Order.orderNumber`, `OrderCharge.id` ili stabilan payment id. |
| `value` | number | Da za revenue | Naplaćeni iznos u major units, npr. `120.00`. |
| `currency` | string | Da za revenue | Uvek `RSD`; koristiti billing currency, ne UI-only currency. |
| `items` | array | Da za ecommerce | GA4 item lista sa product/category podacima. |
| `product_id` | string | Po potrebi | Glavni product za micro/lead evente. |
| `category_id` | string | Po potrebi | Catalog category. |
| `lead_type` | string | Za lead | `project_inquiry`, `vr_inquiry`, `quick_inquiry`, `contact`. |
| `source_path` | string | Za lead/quote | Ruta na kojoj je intent nastao. |
| `payment_provider` | string | Za payment | `nestpay`, `wire_transfer`, `card_mock`. |
| `buyer_type` | string | Za revenue | `individual`, `company_rs`, `company_foreign`. |
| `contains_ai_credits` | boolean | Za order | Segmentacija service vs AI credit order-a. |
| `is_new_customer` | boolean | Po mogućnosti | Korisno za Ads value rules; izvesti server-side. |
| `conversion_source` | string | Da za konverzije | `checkout`, `portal_payment`, `nestpay_return`, `wire_transfer`, `admin_conversion`. |

### GA4 Item Shape

Za `purchase`, `begin_checkout`, `add_to_cart` i slične ecommerce događaje:

```js
{
  item_id: "int-static",
  item_name: "Klasični prikaz enterijera (po spratu)",
  item_category: "interior",
  item_category2: "Unutrašnji renderi",
  item_variant: "service",
  price: 170,
  quantity: 1
}
```

Za AI kredite:

```js
{
  item_id: "ai-studio-credits",
  item_name: "AI Studio krediti",
  item_category: "ai-studio",
  item_variant: "ai_credits",
  price: 5,
  quantity: 10
}
```

### Recommended Internal dataLayer Events

| Internal event | GA4 mapping | Kada se šalje |
|---|---|---|
| `er_add_to_quote` | `add_to_cart` ili custom | Kada se doda usluga/kredit u quote. |
| `er_begin_checkout` | `begin_checkout` | Kada korisnik iz quote summary-ja ide na `/poruci`. |
| `er_order_created` | custom | Kada `createOrder()` uspe, pre plaćanja. |
| `er_payment_started` | custom | Kada korisnik pokrene provider. |
| `er_purchase` | `purchase` | Samo posle payment source of truth potvrde. |
| `er_generate_lead` | `generate_lead` | Samo posle uspešnog lead submit-a. |
| `er_qualified_lead` | custom ili offline conversion | Admin konverzija inquiry-ja u order/proformu. |
| `er_ai_generation_completed` | custom | Kada AI obrada uspe. |
| `er_payment_failed` | custom diagnostic | Kada provider/initiation vrati grešku. |

## Privacy / Consent Rules

- Generic analytics/dataLayer događaji ne smeju sadržati raw email, telefon,
  ime, adresu, PIB/VAT, full message, file name ili storage path.
- `transaction_id`, `order_number`, `inquiry_id` i `charge_id` su dozvoljeni
  kao pseudonymous operational ids.
- Enhanced conversions za web koristiti samo ako vlasnik odobri i pravni tekst
  pokrije obradu. Google preporučuje user-provided data flow kroz Google tag /
  GTM ili hashed first-party podatke. Ne uvoditi bez `marketing` consent-a i
  jasnog DPA/privacy pregleda.
- Ako se uvodi offline conversion import, čuvati click id-eve (`gclid`,
  `gbraid`, `wbraid`) first-party i povezati ih sa order/inquiry record-om bez
  slanja PII-ja u dataLayer.
- Za EEA/Serbia posetioce proveriti Consent Mode v2: `ad_storage`,
  `ad_user_data`, `ad_personalization` i `analytics_storage` moraju imati
  konzistentne default/update vrednosti.

## Implementation Notes For Next Agent

1. GTM bootstrap je usklađen sa `docs/gtm-post-launch.md`; ne vraćati hardcoded
   layout bootstrap ili server-rendered `noscript`.
2. Za nove Google događaje koristiti postojeći typed helper za
   `window.dataLayer.push()` i ne slati evente bez marketing consent-a.
3. Za purchase konverzije emitovati samo iz server-validated trenutka.
   NestPay success page ga gradi iz persisted order snapshot-a; mock kartica je
   test-only. Wire transfer/reconciler su budući offline import ili server-side
   tagging zadatak.
4. Za lead submit koristiti postojeće uspešne server action rezultate, ne samo
   client submit click.
5. GA4 recommended evente koristiti gde se uklapaju (`begin_checkout`,
   `purchase`, `generate_lead`, ecommerce `items`), a ostalo ostaviti kao
   custom events.
6. Napraviti GTM Preview QA matrix: fresh visitor without consent, analytics
   only, marketing accepted, consent revoked, checkout paid, payment failed,
   lead submitted, AI credits paid.

## Verification Checklist

- `rg "track\\(\"" src` pokazuje sve client PostHog call-site-ove.
- `rg "captureServerEvent" src` pokazuje server PostHog call-site-ove.
- Proveriti rute i akcije: `/cene`, `/poruci`, `/kontakt`, `/ai-studio`,
  `/usluge/vr/konsultacija`, `src/app/api/nestpay/return/route.ts`,
  `src/server/actions/payment.ts`, `src/server/actions/mark-wire-paid.ts`,
  `src/server/actions/charge-payment.ts`.
- U GTM Preview-u potvrditi da bez consent-a nema Google tagova koji pišu
  storage.
- U GA4 DebugView-u potvrditi da `purchase` ima `transaction_id`, `value`,
  `currency` i `items`.
- U Google Ads-u podesiti primary/secondary status pre launch-a; ne ostavljati
  micro-conversions kao primary bidding signale.

## Official References

- [Google Consent Mode for websites](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Google Ads enhanced conversions with Google Tag Manager](https://support.google.com/google-ads/answer/13262500)
