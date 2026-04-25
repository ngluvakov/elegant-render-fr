/**
 * verify-tour360.ts — Sanity check the int-360 pricing math.
 *
 * NOTE: This intentionally diverges from the official Pillar 1 cenovnik.
 * The cenovnik defines two separate hotspot rules ("11th+ hotspot room"
 * €45 and "additional hotspot in same room" €27). The platform was
 * simplified per product-owner request (PR replacing those rules with a
 * single flat quota: **10 hotspots included per floor, +€27 each
 * after**). Static-camera and floor-base rules are unchanged. Tour
 * assembly rules are unchanged.
 *
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

// Case 1: small flat — 1 floor, 4 rooms × 1 hotspot, 5 cameras, assembly on.
// 4 hotspots within 10 → no extras. Assembly < 5 hotspots → +€20.
// Expected: €295 + €20 = €315
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
  console.log("• Slučaj 1: stan, 4 hotspota, sklapanje");
  check("ukupno", calc.totalEur, 315);
  check("totalHotspots", calc.totalHotspots, 4);
  check("assembly base", calc.assembly.baseCost, 20);
  console.log("");
}

// Case 2: 2 floors, F1 = 6 hotspots + 8 cameras, F2 = 5 hotspots + 4
// cameras. Assembly + floor-plan nav. 11 hotspots total → assembly FREE.
// Each floor under its 10-hotspot quota.
// Expected: €295 + €205 + €0 (free) + €15 = €515
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
  console.log("• Slučaj 2: kuća, 11 hotspotova, sklapanje + tlocrt");
  check("ukupno", calc.totalEur, 515);
  check("totalHotspots", calc.totalHotspots, 11);
  check("assembly free", calc.assembly.baseCost, 0);
  check("floor plan", calc.assembly.floorPlanNavCost, 15);
  console.log("");
}

// Case 3: complex floor — 12 rooms, dnevna has 3 hotspots, others 1 each.
// Total hotspots = 11×1 + 3 = 14. Cameras = 15.
// Flat-hotspot model: 14 - 10 = 4 extra × €27 = €108. Cameras 5 × €10 = €50.
// Expected: €295 + €108 + €50 = €453
// (Compare to original cenovnik calc for the same input: €489.)
{
  const rooms = [
    room(3, 5), // dnevna: 3 hotspots + 5 cameras
    ...Array.from({ length: 11 }, () => room(1, 1)),
  ];
  // Adjust cameras to be exactly 15: 5 + 11 - 1 = 15 (strip 1 camera from
  // any of the 1-camera rooms).
  rooms[1] = room(1, 0);
  const floors: Tour360Floor[] = [
    {
      id: "f1",
      name: "Sprat 1",
      rooms,
    },
  ];
  const calc = calcTour360Total(floors, defaultTourAssembly());
  console.log("• Slučaj 3: 12 soba, dnevna 3 hotspota, 14 hotspota / 15 kamera");
  check("ukupno", calc.totalEur, 453);
  check("totalHotspots", calc.floors[0].totalHotspots, 14);
  check("extraHotspots", calc.floors[0].extraHotspots, 4);
  check("totalCameras", calc.floors[0].totalCameras, 15);
  check("extraCameras", calc.floors[0].extraCameras, 5);
  console.log("");
}

// Case 4: edge — 1 room with 11 hotspots → 1 hotspot over flat 10 quota.
// Expected: €295 + €27 = €322
{
  const floors: Tour360Floor[] = [
    {
      id: "f1",
      name: "Sprat 1",
      rooms: [room(11, 0)],
    },
  ];
  const calc = calcTour360Total(floors, defaultTourAssembly());
  console.log("• Slučaj 4: 1 soba × 11 hotspota");
  check("ukupno", calc.totalEur, 322);
  check("extraHotspots", calc.floors[0].extraHotspots, 1);
  console.log("");
}

console.log(
  failures === 0
    ? "✅ All tour360 checks passed.\n"
    : `❌ ${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
