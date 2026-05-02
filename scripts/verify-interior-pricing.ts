import { priceItems, type QuoteItem } from "../src/lib/catalog/calculate";
import {
  makeFloorId,
  newFloor,
  type InteriorFloor,
  type InteriorRoom,
} from "../src/lib/catalog/interior-config";

function makeRooms(count: number, cameras = 1): InteriorRoom[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Prostorija ${i + 1}`,
    cameras,
  }));
}

function intStatic(floors: InteriorFloor[]): QuoteItem {
  return {
    instanceId: "i" + Math.random().toString(36).slice(2, 8),
    productId: "int-static",
    categoryId: "interior",
    addOnQuantities: {},
    interiorConfig: floors,
  };
}

const scenarios: { label: string; floors: InteriorFloor[]; expected: number }[] =
  [
    {
      label: "1x int-static, default (1 prazan sprat)",
      floors: [newFloor(0)],
      expected: 170,
    },
    {
      label: "1 soba (1 cam)",
      floors: [
        { id: makeFloorId(), name: "Sprat 1", rooms: makeRooms(1, 1) },
      ],
      expected: 170,
    },
    {
      label: "10 soba x 1 cam",
      floors: [
        { id: makeFloorId(), name: "Sprat 1", rooms: makeRooms(10, 1) },
      ],
      expected: 170,
    },
    {
      label: "11 soba x 1 cam",
      floors: [
        { id: makeFloorId(), name: "Sprat 1", rooms: makeRooms(11, 1) },
      ],
      expected: 208,
    },
    {
      label: "12 soba x 1 cam",
      floors: [
        { id: makeFloorId(), name: "Sprat 1", rooms: makeRooms(12, 1) },
      ],
      expected: 246,
    },
    {
      label: "11 soba; jedna ima 2 cam",
      floors: [
        {
          id: makeFloorId(),
          name: "Sprat 1",
          rooms: [
            { name: "P1", cameras: 2 },
            ...makeRooms(10, 1).map((r, i) => ({ ...r, name: `P${i + 2}` })),
          ],
        },
      ],
      expected: 218,
    },
    {
      label: "1 sprat 10 soba + 2. prazan sprat",
      floors: [
        { id: makeFloorId(), name: "Sprat 1", rooms: makeRooms(10, 1) },
        newFloor(1),
      ],
      expected: 290,
    },
    {
      label: "11 soba na 2 sprata",
      floors: [
        { id: makeFloorId(), name: "Sprat 1", rooms: makeRooms(11, 1) },
        { id: makeFloorId(), name: "Sprat 2", rooms: makeRooms(11, 1) },
      ],
      expected: 366,
    },
  ];

let pass = 0;
let fail = 0;
for (const s of scenarios) {
  const item = intStatic(s.floors);
  const calc = priceItems([item]);
  const ok = calc.total === s.expected;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${s.label.padEnd(40)} → €${calc.total} (expected €${s.expected})`,
  );
  if (ok) pass++;
  else fail++;
}
console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
