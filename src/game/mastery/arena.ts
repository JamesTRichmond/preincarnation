import { objectById } from "./catalog.ts";
import { beginAction, resolveAction, stripAndFinish } from "./compose.ts";
import type { ArenaWorld, EffectId, MasteryObject, RelicId } from "./types.ts";
import { RELIC_IDS } from "./types.ts";

const Y_FOR: Partial<Record<EffectId, RelicId>> = {
  "action.dig": "shovel",
  "action.hook": "hookshot",
  "action.smash": "hammer",
  "action.bow": "bow",
  "action.lantern": "lantern",
  "action.cape": "cape",
  "action.net": "net",
  "action.mirror": "mirror",
  "action.cane": "cane",
};

export function readyWorld(partial: Partial<ArenaWorld> = {}): ArenaWorld {
  return {
    relics: [...RELIC_IDS],
    ySlot: "shovel",
    incarnation: "wanderer",
    shadowStep: false,
    mp: 8,
    maxMp: 8,
    arrows: 8,
    bombs: 3,
    hp: 3,
    maxHp: 3,
    karma: 0,
    bottles: ["syrup", "empty"],
    hasGrave: true,
    graveExcavated: false,
    hasCracked: true,
    inWater: false,
    mapId: "middlebury",
    weaponDmg: 1,
    weaponReach: 14,
    edge: 0,
    flawId: "",
    tropoverse: false,
    incarnationDamage: 1,
    insideBlast: false,
    priorBurn: 0,
    lanternOn: false,
    quarryOpen: false,
    excavated: false,
    tileOpened: false,
    ...partial,
  };
}

export function worldFor(item: MasteryObject, partial: Partial<ArenaWorld> = {}): ArenaWorld {
  const effect = item.compatibleEffects[0];
  const world = readyWorld(partial);
  const ySlot = item.requires.ySlot ?? Y_FOR[effect] ?? world.ySlot;
  world.ySlot = ySlot ?? null;
  if (item.requires.flippers || effect === "action.swim") world.inWater = true;
  if (item.when?.mapId) world.mapId = item.when.mapId;
  if (item.when?.minHp != null) world.hp = Math.max(world.hp, item.when.minHp);
  if (item.when?.inWater) world.inWater = true;
  return world;
}

export function closedWorld(effect: EffectId): ArenaWorld {
  const world = readyWorld();
  world.ySlot = Y_FOR[effect] ?? "shovel";
  if (effect === "action.swim") world.inWater = true;
  switch (effect) {
    case "action.dig":
      world.ySlot = null;
      world.relics = world.relics.filter((id) => id !== "shovel");
      break;
    case "action.smash":
      world.ySlot = null;
      world.relics = world.relics.filter((id) => id !== "hammer");
      break;
    case "action.hook":
      world.ySlot = null;
      world.relics = world.relics.filter((id) => id !== "hookshot");
      break;
    case "action.bow":
      world.arrows = 0;
      break;
    case "action.lantern":
      world.ySlot = null;
      world.relics = world.relics.filter((id) => id !== "lantern");
      break;
    case "action.cape":
    case "action.cane":
      world.mp = 0;
      break;
    case "action.swim":
      world.relics = world.relics.filter((id) => id !== "flippers");
      break;
    case "action.dash":
      world.relics = world.relics.filter((id) => id !== "boots");
      world.shadowStep = false;
      world.incarnation = "wanderer";
      break;
    case "action.bomb":
      world.bombs = 0;
      break;
    case "action.sip":
      world.bottles = ["empty", "empty"];
      break;
    default:
      break;
  }
  return world;
}

export type Demonstration = {
  id: string;
  title: string;
  disciplineNote: string;
  effect: EffectId;
  objectIds: string[];
  expect: "modified" | "incompatible" | "duplicate" | "interrupt";
  blurb: string;
  world?: Partial<ArenaWorld>;
};

function oid(n: number): string {
  return `loot.expansion.mastery.${String(n).padStart(3, "0")}`;
}

/** Twenty objects, all six disciplines. */
export const DEMONSTRATIONS: Demonstration[] = [
  { id: "plug", title: "Plug Wedge", disciplineNote: "Quarry", effect: "action.smash", objectIds: [oid(1)], expect: "modified", blurb: "Smash's plus becomes one tile. Reach grows. The hammer is still required." },
  { id: "spoon", title: "Vein Spoon", disciplineNote: "Quarry", effect: "action.bomb", objectIds: [oid(2)], expect: "modified", blurb: "The keg reaches farther and the next one waits. Ammo is still one keg." },
  { id: "bit", title: "Grave Bit", disciplineNote: "Quarry", effect: "action.dig", objectIds: [oid(3)], expect: "interrupt", blurb: "Wider dig, slower bite. Pull it off mid-windup and the search is ordinary. Erosion still runs." },
  { id: "nail", title: "Keyway Nail", disciplineNote: "Quarry", effect: "action.bomb", objectIds: [oid(12)], expect: "interrupt", blurb: "The keg is spent on the press. Remove the nail before it blooms and the radius is 22. Standing inside no longer cuts you.", world: { insideBlast: true } },
  { id: "cuff", title: "Otter Cuff", disciplineNote: "Creek", effect: "action.swim", objectIds: [oid(15)], expect: "modified", blurb: "A longer water glide. Fins still required." },
  { id: "sleeve", title: "Hook Sleeve", disciplineNote: "Creek", effect: "action.hook", objectIds: [oid(17)], expect: "modified", blurb: "The Sugar-line stays out longer and recasts later." },
  { id: "floe", title: "Floe Nail", disciplineNote: "Creek", effect: "action.dash", objectIds: [oid(19)], expect: "modified", blurb: "Farther dash, longer wait. Take the boots away and nothing happens." },
  { id: "ladle", title: "Ladle Ferrule", disciplineNote: "Sugar", effect: "action.slash", objectIds: [oid(29)], expect: "modified", blurb: "Slash applies slow and loses damage. Sticky, not a new verb." },
  { id: "tin", title: "Tin Spoon", disciplineNote: "Sugar", effect: "action.sip", objectIds: [oid(31)], expect: "interrupt", blurb: "The bottle empties on the press. Remove the spoon and the heal is the ordinary 4." },
  { id: "house", title: "House Spoon", disciplineNote: "Sugar", effect: "action.sip", objectIds: [oid(41)], expect: "interrupt", blurb: "A richer sip if you finish the windup. The bottle does not come back." },
  { id: "nock", title: "Nock Chip", disciplineNote: "Ash", effect: "action.bow", objectIds: [oid(42)], expect: "modified", blurb: "Earlier release, weaker shot, still one arrow." },
  { id: "ember", title: "Ember Wrap", disciplineNote: "Ash", effect: "action.bow", objectIds: [oid(43)], expect: "modified", blurb: "Burn on the existing shot channel. Hp on the press. No refunded arrow." },
  { id: "soot", title: "Soot Nail + Camp Nail", disciplineNote: "Ash", effect: "action.slash", objectIds: [oid(47), oid(52)], expect: "duplicate", blurb: "Two burn adds. The second one counts half. Reach and self-slow still apply in full." },
  { id: "hood", title: "Quarry Hood vs Side Glass", disciplineNote: "Lantern", effect: "action.lantern", objectIds: [oid(55), oid(58)], expect: "incompatible", blurb: "Two light shapes. The lamp refuses both rather than stacking cones." },
  { id: "shutter", title: "Shutter Plate", disciplineNote: "Lantern", effect: "action.lantern", objectIds: [oid(57)], expect: "interrupt", blurb: "Light waits. Remove the plate and the quarry radii stay 28 / 96. No lamp, no light." },
  { id: "seam", title: "Seam Thread", disciplineNote: "Hollow", effect: "action.cape", objectIds: [oid(68)], expect: "modified", blurb: "Longer phase, one extra mp, on top of the cape's own mp." },
  { id: "bead", title: "Shadow Bead", disciplineNote: "Hollow", effect: "action.cape", objectIds: [oid(71)], expect: "interrupt", blurb: "Mp is spent up front, including the bead. Remove it and invuln returns to 0.45. Mp does not return." },
  { id: "low", title: "Low Nail", disciplineNote: "Hollow", effect: "action.dash", objectIds: [oid(77)], expect: "modified", blurb: "A dash that already exists gains a short invuln and a longer wait." },
];

export const DEMONSTRATED_IDS = [...new Set(DEMONSTRATIONS.flatMap((demo) => demo.objectIds))];

export function demonstrate(demo: Demonstration) {
  const items = demo.objectIds.map((id) => objectById(id)).filter((item): item is MasteryObject => !!item);
  const seeded = items[0] ? worldFor(items[0], demo.world) : readyWorld(demo.world);
  const baseline = resolveAction(demo.effect, [], seeded);
  const modified = resolveAction(demo.effect, items, seeded);
  const begun = beginAction(demo.effect, items, seeded);
  const stripped = begun.phase === "winding" && items[0] ? stripAndFinish(begun.pending, items[0].id) : null;
  return { baseline, modified, begun, stripped, items, world: seeded };
}
