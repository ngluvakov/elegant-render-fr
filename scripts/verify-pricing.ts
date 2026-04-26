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
    ...(overrides.sourceMode !== undefined
      ? { sourceMode: overrides.sourceMode }
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
    name: "Animation 30s + ext-static — anim −33%, ext-static −50% (bidirectional)",
    items: [
      qi("e", "ext-static", "exterior"),
      qi("a", "anim", "animation", {
        durationSeconds: 30,
        sourceMode: "scratch",
      }),
    ],
    expect: {
      perItem: [
        // anim/scratch creates complete-model → ext-static consumes it at −50%
        { instanceId: "e", discountPct: 50 },
        // ext-static creates exterior-shell → anim/scratch consumes it at −33%
        { instanceId: "a", discountPct: 33 },
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

// ─── Phase C.1: external-source (referenced prior order) cases ──────────

type ExternalCase = Case & { externalSources: QuoteItem[] };

const externalCases: ExternalCase[] = [
  {
    name: "Ref order has ext-static → new ext-360 gets −40% without its own sibling",
    items: [qi("t", "ext-360", "exterior")],
    externalSources: [qi("ref-e", "ext-static", "exterior")],
    expect: {
      perItem: [{ instanceId: "t", discountPct: 40 }],
    },
  },
  {
    name: "Ref order has int-static → new fp3d-single gets −70%",
    items: [qi("f", "fp3d-single", "floorplans-3d")],
    externalSources: [qi("ref-i", "int-static", "interior")],
    expect: {
      perItem: [{ instanceId: "f", total: 9, discountPct: 70 }],
    },
  },
  {
    name: "Ref order has anim/scratch → new ext-static gets −50% (complete-model)",
    items: [qi("e", "ext-static", "exterior")],
    externalSources: [
      qi("ref-a", "anim", "animation", {
        durationSeconds: 30,
        sourceMode: "scratch",
      }),
    ],
    expect: {
      perItem: [{ instanceId: "e", discountPct: 50 }],
    },
  },
  {
    name: "Rule 4: active ref ext-static → ext-360 boosts 40 → 45",
    items: [qi("t", "ext-360", "exterior")],
    externalSources: [
      {
        ...qi("ref-e", "ext-static", "exterior"),
        fromActiveExternalOrder: true,
      },
    ],
    expect: {
      perItem: [{ instanceId: "t", discountPct: 45 }],
    },
  },
  {
    name: "Rule 4 cap: active ref anim/scratch → ext-static 50 → 55 (capped)",
    items: [qi("e", "ext-static", "exterior")],
    externalSources: [
      {
        ...qi("ref-a", "anim", "animation", {
          durationSeconds: 30,
          sourceMode: "scratch",
        }),
        fromActiveExternalOrder: true,
      },
    ],
    expect: {
      perItem: [{ instanceId: "e", discountPct: 55 }],
    },
  },
  {
    name: "Rule 4 doesn't reduce: active ref int-static → fp3d stays 70",
    items: [qi("f", "fp3d-single", "floorplans-3d")],
    externalSources: [
      {
        ...qi("ref-i", "int-static", "interior"),
        fromActiveExternalOrder: true,
      },
    ],
    expect: {
      perItem: [{ instanceId: "f", discountPct: 70 }],
    },
  },
  // Regression: mimics the portal's repriceOrder flow where int-static
  // items are filtered out of `items` (to go through the per-floor
  // calcInteriorTotal path) but must stay visible to the discount
  // resolver as external sources. Before the fix, int-360 next to
  // int-static saw no interior-model creator and missed its −40%.
  {
    name: "Portal: int-360 + int-static-as-external → int-360 gets −40%",
    items: [qi("t", "int-360", "interior")],
    externalSources: [qi("ext-i", "int-static", "interior")],
    expect: {
      perItem: [{ instanceId: "t", discountPct: 40 }],
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

console.log("🔗 External source cases (referenced prior order):\n");
for (const c of externalCases) {
  console.log(`• ${c.name}`);
  const calc = calculateQuote(c.items, c.externalSources);
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
