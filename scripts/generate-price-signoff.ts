// Generates docs/pricing/price-signoff.md — the owner-facing price table
// with per-market presentment amounts, straight from the live catalog and
// currency engine. Re-run after any catalog or FX change:
//   npx tsx scripts/generate-price-signoff.ts
import { writeFileSync } from "node:fs";
import { CONFIGURATOR_CATEGORIES } from "../src/lib/catalog/configurator";
import {
  convertEurCentsToMinor,
  formatChargeAmount,
} from "../src/lib/currency/convert";
import { FX_RATES_AS_OF } from "../src/lib/currency/fx-rates";
import type { ChargeCurrency } from "../src/lib/currency/config";

const SAMPLE: ChargeCurrency[] = ["USD", "GBP", "CHF", "PLN", "SEK", "JPY"];
const lines: string[] = [];
lines.push("# Price table — owner sign-off");
lines.push("");
lines.push(
  `> Generated from the live catalog (\`src/lib/catalog/configurator.ts\`) and the currency engine, FX fixing ${FX_RATES_AS_OF} (ECB).`,
);
lines.push(
  "> EUR is the canonical charged/invoiced base for EUR-zone visitors; other columns show the exact amount a visitor from that market sees AND pays (round-up-then-minus-one marketable pricing).",
);
lines.push(">");
lines.push(
  "> NOTE: the design-handoff marketing copy quotes psychological price points (€169/€249/€294) while the catalog charges the historical EUR list (€170/€250/€295 …). Sign off either (a) keep catalog prices as-is and align marketing copy, or (b) reprice the catalog to x9 endings.",
);
lines.push("");
lines.push("| Service / product | EUR | " + SAMPLE.join(" | ") + " |");
lines.push("| --- " + "| --- ".repeat(SAMPLE.length + 1) + "|");
for (const cat of CONFIGURATOR_CATEGORIES) {
  for (const p of cat.products) {
    if (p.inquiryOnly) continue;
    const eur = p.basePriceEur;
    const cells = SAMPLE.map((c) => {
      const conv = convertEurCentsToMinor(eur * 100, c);
      return formatChargeAmount(conv.amountMinor, c);
    });
    lines.push(`| ${p.label} | €${eur} | ` + cells.join(" | ") + " |");
  }
}
lines.push("");
lines.push("Sign-off: ____________________  date: ____________");
lines.push("");
writeFileSync("docs/pricing/price-signoff.md", lines.join("\n"), "utf8");
console.log("docs/pricing/price-signoff.md written");
