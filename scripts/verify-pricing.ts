/**
 * verify-pricing.ts — Exercises the cross-service discount engine against the
 * spec bundles and edge cases. Run: `npx tsx scripts/verify-pricing.ts`.
 */
import {
  calculateQuote,
  resolveDiscount,
  type QuoteItem,
} from "../src/lib/catalog/calculate";

type Case = {
  name: string;
  items: QuoteItem[];
  expect?: {
    total?: number;
    savings?: number;
    perItem?: Array<{ instanceId: string; total?: number; discountPct?: number }>;
  };
};

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${label}: ${String(actual)}${ok ? "" : ` (expected ${String(expected)})`}`,
  );
}

function qi(
  instanceId: string,
  productId: string,
  categoryId: string,
  overrides: Partial<QuoteItem> = {},
): QuoteItem {
  return {
    instanceId,
    productId,
    categoryId,
    addOnQuantities: overrides.addOnQuantities ?? {},
    ...(overrides.durationSeconds !== undefined
      ? { durationSeconds: overrides.durationSeconds }
      : {}),
  };
}

const cases: Case[] = [
  {
    name: "Solo exterior-static — no discount",
    items: [qi("a", "ext-static", "exterior")],
    expect: { perItem: [{ instanceId: "a", total: 250, discountPct: 0 }] },
  },
  {
    name: "ext-static + ext-360 — 360 discounted 40% from exterior-shell",
    items: [
      qi("s", "ext-static", "exterior"),
      qi("t", "ext-360", "exterior"),
    ],
    expect: {
      perItem: [
        { instanceId: "s", discountPct: 0 },
        { instanceId: "t", discountPct: 40 },
      ],
    },
  },
  {
    name: "int-static + fp3d-single — floor plan −70%",
    items: [
      qi("i", "int-static", "interior"),
      qi("f", "fp3d-single", "floorplans-3d"),
    ],
    expect: {
      perItem: [
        { instanceId: "i", discountPct: 0 },
        { instanceId: "f", total: 9, discountPct: 70 },
      ],
    },
  },
  {
    name: "int-static + fp2d-single — 2D floor plan −50%",
    items: [
      qi("i", "int-static", "interior"),
      qi("f", "fp2d-single", "floorplans-2d"),
    ],
    expect: {
      perItem: [
        { instanceId: "f", total: 10, discountPct: 50 },
      ],
    },
  },
  {
    name: "Photomontage — no pm-extended add-on: −50% with exterior present",
    items: [
      qi("e", "ext-static", "exterior"),
      qi("p", "pm-first", "photomontage"),
    ],
    expect: {
      perItem: [{ instanceId: "p", discountPct: 50 }],
    },
  },
  {
    name: "Photomontage — with pm-extended add-on: falls back to −15%",
    items: [
      qi("e", "ext-static", "exterior"),
      qi("p", "pm-first", "photomontage", {
        addOnQuantities: { "pm-extended": 1 },
      }),
    ],
    expect: {
      perItem: [{ instanceId: "p", discountPct: 15 }],
    },
  },
  {
    name: "vr-standalone + ext-static — VR −50% from exterior-shell, ext-static −50% from complete-model",
    items: [
      qi("v", "vr-standalone", "vr-experiences"),
      qi("e", "ext-static", "exterior"),
    ],
    expect: {
      perItem: [
        { instanceId: "v", discountPct: 50 }, // spec: Ext→VR is −50%
        { instanceId: "e", discountPct: 50 }, // NEW (Phase A): ext-static consumes complete-model from vr-standalone
      ],
    },
  },
  {
    name: "int-360 + vt-tour — tour −100%",
    items: [
      qi("i", "int-360", "interior"),
      qi("t", "vt-tour", "virtual-tours"),
    ],
    expect: {
      perItem: [
        { instanceId: "i", discountPct: 0 },
        { instanceId: "t", total: 0, discountPct: 100 },
      ],
    },
  },
  {
    name: "Animation 30s + ext-static — anim −33%, ext-static −50% (bidirectional)",
    items: [
      qi("e", "ext-static", "exterior"),
      qi("a", "anim-scratch", "animation", { durationSeconds: 30 }),
    ],
    expect: {
      perItem: [
        // anim-scratch creates complete-model → ext-static consumes it at −50%
        { instanceId: "e", discountPct: 50 },
        // ext-static creates exterior-shell → anim-scratch consumes it at −33%
        { instanceId: "a", discountPct: 33 },
      ],
    },
  },
  {
    name: "apt-floor + ext-static — ext-static −30% (exterior-shell from apt, sourceProducts filter)",
    items: [
      qi("a", "apt-floor", "apartment"),
      qi("e", "ext-static", "exterior"),
    ],
    expect: {
      perItem: [
        { instanceId: "a", discountPct: 0 },
        { instanceId: "e", discountPct: 30 },
      ],
    },
  },
  {
    name: "pm-first + ext-static — ext-static −25% (no pm-extended); pm also gets ext-shell rule",
    items: [
      qi("p", "pm-first", "photomontage"),
      qi("e", "ext-static", "exterior"),
    ],
    expect: {
      perItem: [
        // pm-first (300) is more expensive than ext-static (250), so ext-static is
        // canonical for exterior-shell → pm-first still qualifies for its own
        // exterior-shell consume at −50%.
        { instanceId: "p", discountPct: 50 },
        // ext-static consumes exterior-shell from pm-first → −25% (no pm-extended add-on).
        { instanceId: "e", discountPct: 25 },
      ],
    },
  },
  {
    name: "land-static + ext-static — ext-static −15% (terrain from landscape)",
    items: [
      qi("l", "land-static", "landscape"),
      qi("e", "ext-static", "exterior"),
    ],
    expect: {
      perItem: [
        // land-static consumes exterior-shell from ext-static at −25%
        { instanceId: "l", discountPct: 25 },
        // ext-static consumes terrain-model from land-static at −15%
        { instanceId: "e", discountPct: 15 },
      ],
    },
  },
  {
    name: "Two ext-static items — sourceProducts filter keeps both full",
    items: [
      qi("a", "ext-static", "exterior"),
      qi("b", "ext-static", "exterior"),
    ],
    expect: {
      perItem: [
        { instanceId: "a", discountPct: 0 },
        { instanceId: "b", discountPct: 0 },
      ],
    },
  },
];

console.log("\n🧪 Pricing dependencies — engine verification\n");

for (const c of cases) {
  console.log(`• ${c.name}`);
  const calc = calculateQuote(c.items);
  if (c.expect?.total !== undefined) check("total", calc.total, c.expect.total);
  if (c.expect?.savings !== undefined)
    check("savings", calc.originalTotal - calc.total, c.expect.savings);
  for (const exp of c.expect?.perItem ?? []) {
    const b = calc.items.find((i) => i.instanceId === exp.instanceId);
    if (!b) {
      failures++;
      console.log(`  ✗ no breakdown for ${exp.instanceId}`);
      continue;
    }
    if (exp.total !== undefined)
      check(`${exp.instanceId} total`, b.totalEur, exp.total);
    if (exp.discountPct !== undefined)
      check(`${exp.instanceId} discountPct`, b.discountPct, exp.discountPct);
  }
  console.log("");
}

// Resolver-only smoke test: target qualifies when a sibling (not itself)
// creates the required asset.
console.log("• resolveDiscount: self-only creator returns null");
{
  const items = [qi("solo", "ext-360", "exterior")];
  const r = resolveDiscount(items[0], items);
  check("null result", r, null);
}

console.log(
  failures === 0
    ? `\n✅ All checks passed.\n`
    : `\n❌ ${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
