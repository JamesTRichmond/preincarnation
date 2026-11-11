import type { Heft, ItemDef, ItemKind } from "./types.ts";

export const FIXTURE_TOTAL = 520;

const WOODS = ["cedar", "birch", "ash", "pine", "oak", "alder", "willow", "maple"];
const FORMS = ["splint", "offcut", "peg", "shim", "binding", "tag", "coupon", "sample", "wrap", "shard"];
const ADJ = ["river", "kiln", "loft", "barn", "road", "cellar-bin", "orchard", "mill"];
const KINDS: ItemKind[] = ["physical", "crafting", "collectible"];

const LONG_UNIQUE =
  "[Fixture] The unreasonably long cedar measure used by the river survey after the ice went out in the fourteenth spring, sample 052, not a story item, filed so search and focus can be measured against an unreasonable label";

export function buildFixtureDefs(): ItemDef[] {
  const defs: ItemDef[] = [];
  for (let n = 1; n <= FIXTURE_TOTAL; n++) {
    const wood = WOODS[n % WOODS.length] ?? "cedar";
    const form = FORMS[n % FORMS.length] ?? "tag";
    const adj = ADJ[n % ADJ.length] ?? "road";
    const code = String(n).padStart(3, "0");
    const sealed = n % 40 === 0;
    const gear = n % 100 === 3;
    const long = n % 52 === 0;
    const id = `fx-${code}`;
    let name = `[Fixture] ${adj} ${wood} ${form} ${code}`;
    if (sealed) name = `[Fixture] Sealed sample ${code}`;
    if (n === 52) name = LONG_UNIQUE;
    else if (long) {
      name = `[Fixture] Long ${adj} ${wood} ${form} filed so search and focus can be measured ${code}`;
    }
    const heft: Heft = n % 17 === 0 ? "heavy" : n % 5 === 0 ? "moderate" : "light";
    const kind: ItemKind = gear ? "equipment" : (KINDS[n % KINDS.length] ?? "physical");
    defs.push({
      id,
      name,
      kind,
      contentClass: "fixture",
      heft,
      stackLimit: 24,
      unique: false,
      protection: sealed ? "quest" : "none",
      dismantlable: true,
      modifiable: false,
      slot: gear ? "hand" : undefined,
      stats: gear ? { grip: 1, reach: 1 } : undefined,
      tags: ["fixture", wood, form, sealed ? "sealed" : "open"],
      summary: sealed
        ? "Stress-test record. The raw flag says it may be dismantled; quest protection must still refuse a batch."
        : "Stress-test record. Not story content. Labeled so it cannot be mistaken for Ellis's things.",
      uses: [
        {
          id: `${id}-file`,
          verb: "inspect",
          label: "Index as a fixture record",
          where: "Hearth index",
          visibility: "known",
        },
      ],
    });
  }
  return defs;
}

export const FIXTURES: ItemDef[] = buildFixtureDefs();

export const FIXTURES_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  FIXTURES.map((def) => [def.id, def]),
);

export const LONG_FIXTURE_ID = "fx-052";
export const SEALED_FIXTURE_IDS = FIXTURES.filter((def) => def.protection !== "none").map((def) => def.id);
