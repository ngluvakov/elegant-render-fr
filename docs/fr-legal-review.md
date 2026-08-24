# elegantrender.fr — points for French legal review

**The legal pages on this site are a faithful French translation of the English
`elegantrender.com` text. They are not French legal drafting.** Nothing here was
invented, softened or dropped — but French law imposes obligations the English
source was never written against.

**A French lawyer must clear this list before the site goes live.** The same
applies to the German sibling (`elegantrender.de`) with German law.

Each item below corresponds to a `TODO(legal-review)` comment left in the code
at the exact spot it concerns — grep for it:

```
grep -rn "TODO(legal-review)" "src/app/(marketing)/legal"
```

---

## Mentions légales — `legal/imprint/page.tsx`

1. **LCEN art. 6 content requirements.** The page currently lists only the
   Serbian registry data, as the English build did. Verify whether French law
   additionally requires a *directeur de la publication*, the hosting
   provider's name/address/phone, the share capital, and an intra-EU/French
   VAT number.
2. **EU representative (RGPD art. 27).** `IMPRINT.euRepresentative` is `null`,
   so none is displayed. A non-EU controller targeting France likely must
   appoint one — verify, and if so name them.
3. **CNIL.** Verify whether the CNIL must be expressly named among the
   supervisory authorities shown to French users.

## CGV — `legal/terms/page.tsx`

4. **§7 Withdrawal.** Wording mirrors the EU directive. Check against
   Code de la consommation art. L221-18 ff., L221-25, L221-28 1° and 13°, and
   the mandatory pre-contractual information wording.
5. **§8 Garantie légale de conformité.** Verify whether the legal guarantee for
   digital content/services (art. L224-25-1 ff.) must be named, and whether a
   standardized guarantee notice must accompany the CGV.
6. **§12 Liability limits.** Verify enforceability against the *clauses
   abusives* regime (art. R212-1) for consumers.
7. **§14 Choice of Serbian law.** Verify the Rome I art. 6 carve-out for French
   consumers, and whether an express statement that the Code de la consommation
   applies regardless is required.
8. **§15 Médiateur de la consommation.** France requires a designated consumer
   mediator (art. L612-1 ff.), named with contact details. The text currently
   states there is no general ADR obligation. Verify whether the obligation
   reaches a Serbian provider targeting France — if it does, a mediator must be
   appointed and named.

## Politique de confidentialité — `legal/privacy/page.tsx`

9. **§1 Art. 27 representative + DPO statement.** Same `euRepresentative: null`
   gap as the imprint; also verify the "no DPO required" statement.
10. **§11 Regional list.** No France/CNIL entry exists (none in the English
    build either). Verify whether the CNIL must be named as the complaint
    authority for French users.
11. **§12 Age of digital consent.** The text carries the English build's
    threshold of 16. In France it is **15** (art. 45, loi Informatique et
    Libertés). Verify the "under 16" references in §11 and §12.

## Politique cookies — `legal/cookies/page.tsx`

12. **CNIL cookie rules (§2).** Verify the consent model: accept/refuse parity
    on the banner, consent re-collection interval (CNIL recommends 6 months,
    13 max), proof-of-consent retention, and whether any analytics tool intends
    to rely on the CNIL audience-measurement exemption instead of consent.

## Droit de rétractation — `legal/withdrawal/page.tsx`

13. **The notice as a whole.** Verify against art. L221-18 to L221-28: when the
    14-day period starts, the express-consent/acknowledgement conditions, and
    the proportionate-payment rule (L221-25).
14. **The model form.** Compare with the statutory French model withdrawal form
    (annexe à l'art. R221-1) and align if that form is mandatory.

## Remboursements — `legal/refunds/page.tsx`

15. **§4.** Verify against the garantie légale de conformité
    (art. L224-25-1 ff.): naming the guarantee, its duration, and the remedy
    hierarchy (mise en conformité → réduction du prix / résolution).

## Réclamations — `legal/complaints/page.tsx`

16. **§5 Voies de recours.** Same médiateur de la consommation question as
    CGV §15 — designation and naming likely required.

## Livraison numérique — `legal/delivery/page.tsx`

17. **§3 Failure to supply.** Verify against art. L224-25-10 ff. Code de la
    consommation (transposing Directive (EU) 2019/770) — French law defines the
    notice-and-termination mechanism more precisely than the generic wording.

---

## Operational notes (not legal, but needed before launch)

- Hardcoded support addresses were switched from `info@elegantrender.com` to
  `info@elegantrender.fr` — **the `.fr` mailbox must exist.**
- The withdrawal/complaint instructions now tell users to write with the
  subject « Réclamation » — the team inbox filters should expect the French
  subject.
- « Accès mondial » in *Livraison numérique* §5 was deliberately **not**
  geo-narrowed to France: it states contractual availability, not marketing
  reach.
- Serbian institution names are rendered in French (« Agence serbe des
  registres du commerce », « Commissaire à l'information d'importance publique
  et à la protection des données personnelles »), matching how the English
  build translated them.
