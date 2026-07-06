import { priceItems, type QuoteItem } from "../src/lib/catalog/calculate";
import { makeFloorId } from "../src/lib/catalog/interior-config";
import {
  defaultTourAssembly,
  type Tour360Floor,
  type TourAssembly,
} from "../src/lib/catalog/tour360-config";

function tour360(floors: Tour360Floor[], assembly: TourAssembly): QuoteItem {
  return {
    instanceId: "i" + Math.random().toString(36).slice(2, 8),
    productId: "int-360",
    categoryId: "interior",
    addOnQuantities: {},
    tour360Config: { floors, tourAssembly: assembly },
  };
}

function floorWithRooms(
  rooms: { hotspots: number; staticCameras: number }[],
): Tour360Floor {
  return {
    id: makeFloorId(),
    name: "Sprat 1",
    rooms: rooms.map((r, i) => ({
      name: `P${i + 1}`,
      hotspots: r.hotspots,
      staticCameras: r.staticCameras,
    })),
  };
}

const tests: Array<{
  label: string;
  floors: Tour360Floor[];
  assembly: TourAssembly;
  expected: number;
}> = [
  {
    label: "1× int-360 default (1 sprat, 0 soba, assembly off)",
    floors: [{ id: makeFloorId(), name: "Sprat 1", rooms: [] }],
    assembly: defaultTourAssembly(),
    expected: 295,
  },
  {
    label: "5 soba × 1 hotspot, web tour ON (free by 5+ threshold)",
    floors: [
      floorWithRooms(
        Array.from({ length: 5 }, () => ({ hotspots: 1, staticCameras: 0 })),
      ),
    ],
    assembly: {
      webTourEnabled: true,
      floorPlanNavEnabled: false,
      whiteLabelEnabled: false,
    },
    expected: 295, // 5 hotspots ≥ 5 threshold → assembly base free
  },
  {
    label: "5 soba × 1 hotspot + floor-plan + white-label",
    floors: [
      floorWithRooms(
        Array.from({ length: 5 }, () => ({ hotspots: 1, staticCameras: 0 })),
      ),
    ],
    assembly: {
      webTourEnabled: true,
      floorPlanNavEnabled: true,
      whiteLabelEnabled: true,
    },
    expected: 345, // 295 + 0 (free base) + 15 + 35
  },
  {
    label: "4 soba × 1 hotspot, web tour ON (paid base, below threshold)",
    floors: [
      floorWithRooms(
        Array.from({ length: 4 }, () => ({ hotspots: 1, staticCameras: 0 })),
      ),
    ],
    assembly: {
      webTourEnabled: true,
      floorPlanNavEnabled: false,
      whiteLabelEnabled: false,
    },
    expected: 315, // 295 + 20 base (below threshold)
  },
  {
    label: "11 soba × 1 hotspot (1 extra), web tour off",
    floors: [
      floorWithRooms(
        Array.from({ length: 11 }, () => ({ hotspots: 1, staticCameras: 0 })),
      ),
    ],
    assembly: defaultTourAssembly(),
    expected: 322, // 295 + 27 (1 extra hotspot @ €27)
  },
];

let pass = 0;
let fail = 0;
for (const t of tests) {
  const item = tour360(t.floors, t.assembly);
  const calc = priceItems([item]);
  const ok = calc.total === t.expected;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${t.label.padEnd(60)} → €${calc.total} (expected €${t.expected})`,
  );
  if (ok) pass++;
  else fail++;
}
console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
