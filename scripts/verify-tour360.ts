/**
 * verify-tour360.ts — Sanity check the int-360 pricing math against the
 * three examples in the official cenovnik instructions.
 * Run: `npx tsx scripts/verify-tour360.ts`
 */
import {
  calcTour360Total,
  defaultTourAssembly,
  type Tour360Floor,
} from "../src/lib/catalog/tour360-config";

let failures = 0;
function check(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${label}: €${actual}${ok ? "" : ` (expected €${expected})`}`,
  );
}

function room(hotspots: number, staticCameras = 0) {
  return { name: "Soba", hotspots, staticCameras };
}

// Example 1: 1 floor, 4 rooms (1 hotspot each), 5 cameras, wants tour assembly.
// Expected: €295 (floor) + €20 (assembly, < 5 hotspots) = €315
{
  const floors: Tour360Floor[] = [
    {
      id: "f1",
      name: "Sprat 1",
      rooms: [room(1), room(1), room(1), room(1, 5)],
    },
  ];
  const calc = calcTour360Total(floors, {
    ...defaultTourAssembly(),
    webTourEnabled: true,
  });
  console.log("• Primer 1: stan, 4 hotspota, sklapanje");
  check("ukupno", calc.totalEur, 315);
  check("totalHotspots", calc.totalHotspots, 4);
  check("assembly base", calc.assembly.baseCost, 20);
  console.log("");
}

// Example 2: 2 floors. F1: 6 rooms × 1 hotspot, 8 cameras. F2: 5 rooms × 1
// hotspot, 4 cameras. Wants assembly + floor-plan nav.
// Expected: 295 + 205 + 0 (assembly free, 11 hotspots) + 15 = €515
{
  const floors: Tour360Floor[] = [
    {
      id: "f1",
      name: "Sprat 1",
      rooms: [
        room(1, 8),
        room(1),
        room(1),
        room(1),
        room(1),
        room(1),
      ],
    },
    {
      id: "f2",
      name: "Sprat 2",
      rooms: [
        room(1, 4),
        room(1),
        room(1),
        room(1),
        room(1),
      ],
    },
  ];
  const calc = calcTour360Total(floors, {
    webTourEnabled: true,
    floorPlanNavEnabled: true,
    whiteLabelEnabled: false,
  });
  console.log("• Primer 2: kuća, 11 hotspotova, sklapanje + tlocrt");
  check("ukupno", calc.totalEur, 515);
  check("totalHotspots", calc.totalHotspots, 11);
  check("assembly free", calc.assembly.baseCost, 0);
  check("floor plan", calc.assembly.floorPlanNavCost, 15);
  console.log("");
}

// Example 3: 1 floor. 12 rooms with hotspot, dnevna soba has 3 hotspots
// (1 base + 2 extra), 15 cameras.
// Expected: 295 + 2×45 (extra hotspot rooms) + 2×27 (additional in same room)
//           + 5×10 (extra cameras) = €489
{
  const rooms = [
    room(3, 5), // dnevna: 3 hotspots, some cameras
    ...Array.from({ length: 11 }, () => room(1, 1)), // 11 more hotspot rooms with 1 hs + 1 cam each
  ];
  // Total cameras: 5 + 11 = 16. Adjust to be exactly 15.
  rooms[1] = room(1, 0); // strip one camera
  // Now totals: hotspot rooms = 12, additional hotspots = 2 (from dnevna), cameras = 5+10 = 15
  const floors: Tour360Floor[] = [
    {
      id: "f1",
      name: "Sprat 1",
      rooms,
    },
  ];
  const calc = calcTour360Total(floors, defaultTourAssembly());
  console.log("• Primer 3: kompleksan sprat, 12 hotspot soba, dnevna 3, 15 kamera");
  check("ukupno", calc.totalEur, 489);
  check("hotspot rooms", calc.floors[0].hotspotRooms, 12);
  check("extra hotspot rooms", calc.floors[0].extraHotspotRooms, 2);
  check("additional hotspots", calc.floors[0].additionalHotspots, 2);
  check("total cameras", calc.floors[0].totalCameras, 15);
  check("extra cameras", calc.floors[0].extraCameras, 5);
  console.log("");
}

console.log(
  failures === 0
    ? "✅ All tour360 checks passed.\n"
    : `❌ ${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
