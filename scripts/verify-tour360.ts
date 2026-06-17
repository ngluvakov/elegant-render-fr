/**
 * verify-tour360.ts — Sanity check the int-360 pricing math.
 *
 * NOTE: This intentionally diverges from the official Pillar 1 cenovnik.
 * The cenovnik defines two separate hotspot rules ("11th+ hotspot room"
 * 5.274 RSD and "additional hotspot in same room" 3.164 RSD). The platform was
 * simplified per product-owner request (PR replacing those rules with a
 * single flat quota: **10 hotspots included per floor, +3.164 RSD each
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
function check(label: string, actual: number, expected: number, unit = "") {
  const ok = actual === expected;
  if (!ok) failures++;
  const suffix = unit ? ` ${unit}` : "";
  console.log(
    `  ${ok ? "✓" : "✗"} ${label}: ${actual}${suffix}${ok ? "" : ` (expected ${expected}${suffix})`}`,
  );
}

function checkRsd(label: string, actual: number, expected: number) {
  check(label, actual, expected, "RSD");
}

function room(hotspots: number, staticCameras = 0) {
  return { name: "Soba", hotspots, staticCameras };
}

// Case 1: small flat — 1 floor, 4 rooms × 1 hotspot, 5 cameras, assembly on.
// 4 hotspots within 10 -> no extras. Assembly < 5 hotspots -> +2.344 RSD.
// Expected: 34.574 + 2.344 = 36.918 RSD
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
  checkRsd("ukupno", calc.totalRsd, 36918);
  check("totalHotspots", calc.totalHotspots, 4);
  checkRsd("assembly base", calc.assembly.baseCost, 2344);
  console.log("");
}

// Case 2: 2 floors, F1 = 6 hotspots + 8 cameras, F2 = 5 hotspots + 4
// cameras. Assembly + floor-plan nav. 11 hotspots total → assembly FREE.
// Each floor under its 10-hotspot quota.
// Expected: 34.574 + 24.026 + 0 (free) + 1.758 = 60.358 RSD
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
  checkRsd("ukupno", calc.totalRsd, 60358);
  check("totalHotspots", calc.totalHotspots, 11);
  checkRsd("assembly free", calc.assembly.baseCost, 0);
  checkRsd("floor plan", calc.assembly.floorPlanNavCost, 1758);
  console.log("");
}

// Case 3: complex floor — 12 rooms, dnevna has 3 hotspots, others 1 each.
// Total hotspots = 11×1 + 3 = 14. Cameras = 15.
// Flat-hotspot model: 14 - 10 = 4 extra x 3.164 RSD = 12.656 RSD.
// Cameras 5 x 1.172 RSD = 5.860 RSD.
// Expected: 34.574 + 12.656 + 5.860 = 53.090 RSD
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
  checkRsd("ukupno", calc.totalRsd, 53090);
  check("totalHotspots", calc.floors[0].totalHotspots, 14);
  check("extraHotspots", calc.floors[0].extraHotspots, 4);
  check("totalCameras", calc.floors[0].totalCameras, 15);
  check("extraCameras", calc.floors[0].extraCameras, 5);
  console.log("");
}

// Case 4: edge — 1 room with 11 hotspots → 1 hotspot over flat 10 quota.
// Expected: 34.574 + 3.164 = 37.738 RSD
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
  checkRsd("ukupno", calc.totalRsd, 37738);
  check("extraHotspots", calc.floors[0].extraHotspots, 1);
  console.log("");
}

console.log(
  failures === 0
    ? "✅ All tour360 checks passed.\n"
    : `❌ ${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
