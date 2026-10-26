import { getItem } from "./catalog/index.ts";
import { lootId } from "./schema.ts";
import type { Instance, WorkshopState } from "./types.ts";

export const SHED_FIXTURES = [
  "shed-stove",
  "skiff-on-the-ways",
  "mantel",
  "hook-rail",
  "window",
  "bench",
  "bench-front",
  "interior",
  "creek",
] as const;

export const DISPLAY_FIXTURES = ["mantel", "hook-rail", "window", "bench-front"] as const;

/** At least thirty ordinary objects, in return condition, on the boatwright's bench. */
const BENCH: { n: number; qty?: number }[] = [
  { n: 1 },
  { n: 2, qty: 40 },
  { n: 3 },
  { n: 4, qty: 4 },
  { n: 14 },
  { n: 19 },
  { n: 22 },
  { n: 27 },
  { n: 34, qty: 16 },
  { n: 36 },
  { n: 37 },
  { n: 38, qty: 8 },
  { n: 39 },
  { n: 42 },
  { n: 44 },
  { n: 47, qty: 6 },
  { n: 50, qty: 20 },
  { n: 54 },
  { n: 79, qty: 30 },
  { n: 102, qty: 4 },
  { n: 107 },
  { n: 114 },
  { n: 126 },
  { n: 130 },
  { n: 133 },
  { n: 134, qty: 2 },
  { n: 135, qty: 3 },
  { n: 152 },
  { n: 158 },
  { n: 171 },
  { n: 216 },
  { n: 218 },
  { n: 219, qty: 4 },
  { n: 221, qty: 12 },
  { n: 225 },
  { n: 233 },
  { n: 234 },
  { n: 237, qty: 8 },
  { n: 238 },
  { n: 239, qty: 40 },
  { n: 240, qty: 3 },
];

/** In-kind offers. Not prices. */
const NEIGHBOR = [83, 48, 63, 102];

function makeInstance(seq: number, n: number, location: Instance["location"], qty?: number): Instance {
  const item = getItem(lootId(n));
  if (!item) throw new Error(`loadout missing ${lootId(n)}`);
  return {
    instanceId: `inst-${seq}`,
    itemId: item.id,
    condition: item.condition.default,
    qty: qty ?? item.stackQty,
    contents: null,
    tags: [...item.tags],
    location,
  };
}

export function freshShed(): WorkshopState {
  const instances: Instance[] = [];
  let seq = 1;
  for (const row of BENCH) instances.push(makeInstance(seq++, row.n, "bench", row.qty));
  for (const n of NEIGHBOR) instances.push(makeInstance(seq++, n, "neighbor"));
  return {
    era: "return",
    weather: "calm",
    hour: 10,
    seq,
    fixtures: [...SHED_FIXTURES],
    instances,
    flags: [],
    log: [
      {
        t: "hour 10",
        text: "Fourteen years on. The boatwright shed still smells of tar, cold iron, and the creek.",
      },
    ],
    provisions: [],
  };
}

export const PERSIST_KEY = "return-shed-loot-v1";
