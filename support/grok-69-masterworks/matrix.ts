/**
 * Same-yard comparisons. Winners change with the situation.
 * The four seed pieces together are not a best set.
 */
import { lootId } from "./items.ts";
import {
  armTelegraph,
  clearMovables,
  createSim,
  dodge,
  dodgeBoots,
  equip,
  equipLegacy,
  foeById,
  placeFoe,
  placeMovable,
  placePlayer,
  shove,
  strikeNow,
  type Sim,
} from "./sim.ts";

const id = lootId;

export type MatrixRow = {
  id: string;
  situation: string;
  winner: string;
  scores: { name: string; value: number }[];
};

function cut(sim: Sim, who = "foe") {
  return sim.log.filter((e) => e.t === "damage" && e.to === who).reduce((s, e) => s + (e.t === "damage" ? e.amount : 0), 0);
}

function fresh() {
  const sim = createSim();
  clearMovables(sim);
  return sim;
}

function beside(sim: Sim) {
  placeFoe(sim, "foe", sim.player.x + 1, sim.player.y, 30);
}

function far(sim: Sim) {
  placeFoe(sim, "foe", sim.player.x + 2, sim.player.y, 30);
}

function scoreOf(name: string, value: number) {
  return { name, value: Math.round(value * 1000) / 1000 };
}

function winnerOf(scores: { name: string; value: number }[]) {
  const best = Math.max(...scores.map((s) => s.value));
  const names = scores.filter((s) => Math.abs(s.value - best) < 1e-9).map((s) => s.name);
  return names.length === 1 ? names[0] : "tie";
}

function row(idKey: string, situation: string, scores: { name: string; value: number }[]): MatrixRow {
  return { id: idKey, situation, winner: winnerOf(scores), scores };
}

function kit(sim: Sim) {
  equip(sim, "weapon", id(1));
  equip(sim, "wearable", id(21));
  equip(sim, "trinket", id(41));
  equip(sim, "utility", id(61));
}

export function runMatrix(): MatrixRow[] {
  const openRifle = fresh();
  equipLegacy(openRifle, "rifle");
  far(openRifle);
  strikeNow(openRifle);
  const openMargin = fresh();
  equip(openMargin, "weapon", id(1));
  far(openMargin);
  strikeNow(openMargin);
  const openIron = fresh();
  far(openIron);
  strikeNow(openIron);
  const openKit = fresh();
  kit(openKit);
  far(openKit);
  strikeNow(openKit);

  const clinchIron = fresh();
  beside(clinchIron);
  strikeNow(clinchIron);
  const clinchMargin = fresh();
  equip(clinchMargin, "weapon", id(1));
  beside(clinchMargin);
  strikeNow(clinchMargin);
  const clinchKit = fresh();
  kit(clinchKit);
  beside(clinchKit);
  strikeNow(clinchKit);

  const dry = fresh();
  equipLegacy(dry, "rifle");
  dry.legacyWeapon.ammo = 0;
  beside(dry);
  strikeNow(dry);
  const dryMargin = fresh();
  equip(dryMargin, "weapon", id(1));
  beside(dryMargin);
  strikeNow(dryMargin);

  const sickle = fresh();
  equip(sickle, "weapon", id(20));
  beside(sickle);
  strikeNow(sickle);
  const sickleIron = fresh();
  beside(sickleIron);
  strikeNow(sickleIron);

  const sealA = fresh();
  equip(sealA, "utility", id(79));
  beside(sealA);
  strikeNow(sealA);
  const sealB = fresh();
  equip(sealB, "utility", id(79));
  beside(sealB);
  strikeNow(sealB);
  sealB.log = [];
  strikeNow(sealB);
  const sealIron = fresh();
  beside(sealIron);
  strikeNow(sealIron);

  const boots = fresh();
  armTelegraph(boots, "foe", { delay: 0.5, kind: "line" });
  dodgeBoots(boots);
  const coatEarly = fresh();
  equip(coatEarly, "wearable", id(21));
  armTelegraph(coatEarly, "foe", { delay: 0.5, kind: "line" });
  dodge(coatEarly);
  const kitEarly = fresh();
  kit(kitEarly);
  armTelegraph(kitEarly, "foe", { delay: 0.5, kind: "line" });
  dodge(kitEarly);

  const coatNarrow = fresh();
  equip(coatNarrow, "wearable", id(21));
  armTelegraph(coatNarrow, "foe", { delay: 0.12, kind: "line" });
  dodge(coatNarrow);
  const bootsNarrow = fresh();
  armTelegraph(bootsNarrow, "foe", { delay: 0.12, kind: "line" });
  dodgeBoots(bootsNarrow);
  const kitNarrow = fresh();
  kit(kitNarrow);
  armTelegraph(kitNarrow, "foe", { delay: 0.12, kind: "line" });
  dodge(kitNarrow);

  function slide(sim: Sim, utility: number | null, x: number, y: number, facing: 0 | 1 | 2 | 3) {
    if (utility) equip(sim, "utility", id(utility));
    placePlayer(sim, x, y, facing);
    const pot = placeMovable(sim, "pot", x + (facing === 1 ? 1 : facing === 3 ? -1 : 0), y + (facing === 2 ? 1 : facing === 0 ? -1 : 0));
    const y0 = pot.y;
    shove(sim);
    return Math.abs(pot.y - y0) + Math.abs(pot.x - (x + (facing === 1 ? 1 : facing === 3 ? -1 : 0)));
  }
  const handsOpen = slide(fresh(), null, 5, 4, 2);
  const wedgeOpen = slide(fresh(), 77, 5, 4, 2);
  const handsHall = slide(fresh(), null, 1, 4, 2);
  const wedgeHall = slide(fresh(), 77, 1, 4, 2);
  const kitHall = (() => {
    const sim = fresh();
    kit(sim);
    return slide(sim, null, 1, 4, 2);
  })();

  const wetCast = fresh();
  equip(wetCast, "weapon", id(8));
  wetCast.tiles[4][7] = "water";
  far(wetCast);
  strikeNow(wetCast);
  const wetIron = fresh();
  wetIron.tiles[4][7] = "water";
  far(wetIron);
  strikeNow(wetIron);

  const dryCast = fresh();
  equip(dryCast, "weapon", id(8));
  beside(dryCast);
  strikeNow(dryCast);
  const dryIron = fresh();
  beside(dryIron);
  strikeNow(dryIron);

  const grave = fresh();
  equip(grave, "weapon", id(16));
  placePlayer(grave, 7, 2, 1);
  placeFoe(grave, "foe", 8, 2, 30);
  strikeNow(grave);
  const graveIron = fresh();
  placePlayer(graveIron, 7, 2, 1);
  placeFoe(graveIron, "foe", 8, 2, 30);
  strikeNow(graveIron);

  const off = fresh();
  equip(off, "weapon", id(16));
  beside(off);
  strikeNow(off);

  const stick = fresh();
  equip(stick, "weapon", id(18));
  beside(stick);
  strikeNow(stick);
  const stickFull = fresh();
  equip(stickFull, "weapon", id(18));
  equip(stickFull, "wearable", id(21));
  equip(stickFull, "trinket", id(41));
  equip(stickFull, "utility", id(61));
  beside(stickFull);
  strikeNow(stickFull);

  const nail = fresh();
  equip(nail, "weapon", id(1));
  equip(nail, "utility", id(54));
  far(nail);
  strikeNow(nail);

  return [
    row("open-field", "Foe two tiles out, room around you", [
      scoreOf("Kitchen-door Winchester", cut(openRifle)),
      scoreOf("Margin Blade", cut(openMargin)),
      scoreOf("Short iron", cut(openIron)),
      scoreOf("Seed kit", cut(openKit)),
    ]),
    row("clinch", "Foe on the next tile", [
      scoreOf("Margin Blade", cut(clinchMargin)),
      scoreOf("Short iron", cut(clinchIron)),
      scoreOf("Seed kit", cut(clinchKit)),
    ]),
    row("dry-rifle", "Winchester with an empty magazine, foe adjacent", [
      scoreOf("Kitchen-door Winchester", cut(dry)),
      scoreOf("Margin Blade", cut(dryMargin)),
    ]),
    row("full-health", "You are unhurt", [
      scoreOf("Last-light Sickle", cut(sickle)),
      scoreOf("Short iron", cut(sickleIron)),
    ]),
    row("seal-open", "First cut with the seal armed", [
      scoreOf("Damage Seal", cut(sealA)),
      scoreOf("Short iron", cut(sealIron)),
    ]),
    row("seal-follow", "The cut after the seal has fired", [
      scoreOf("Damage Seal", cut(sealB)),
      scoreOf("Short iron", cut(sealIron)),
    ]),
    row("panic-dodge", "Dodge while the telegraph still has half a second", [
      scoreOf("Gap boots", boots.player.iframe),
      scoreOf("Narrowcoat", coatEarly.player.iframe),
      scoreOf("Seed kit", kitEarly.player.iframe),
    ]),
    row("narrow-dodge", "Dodge inside the coat's short window", [
      scoreOf("Narrowcoat", coatNarrow.tetherTo ? 1 : 0),
      scoreOf("Gap boots", bootsNarrow.tetherTo ? 1 : 0),
      scoreOf("Seed kit", kitNarrow.tetherTo ? 1 : 0),
    ]),
    row("open-shove", "Pot on open ground", [
      scoreOf("Bare hands", handsOpen),
      scoreOf("Quarry Wedge", wedgeOpen),
    ]),
    row("corridor-shove", "Pot in the pillar corridor", [
      scoreOf("Bare hands", handsHall),
      scoreOf("Quarry Wedge", wedgeHall),
      scoreOf("Seed kit", kitHall),
    ]),
    row("water-body", "Foe standing on water, two tiles out", [
      scoreOf("Creek Cast", cut(wetCast)),
      scoreOf("Short iron", cut(wetIron)),
    ]),
    row("dry-cast", "Foe on dry ground, within iron's reach", [
      scoreOf("Creek Cast", cut(dryCast)),
      scoreOf("Short iron", cut(dryIron)),
    ]),
    row("on-grave", "Foe standing on the grave", [
      scoreOf("Grave Fork", cut(grave)),
      scoreOf("Short iron", cut(graveIron)),
    ]),
    row("off-grave", "Foe standing on ordinary ground", [
      scoreOf("Grave Fork", cut(off)),
      scoreOf("Short iron", cut(sickleIron)),
    ]),
    row("lone-stick", "Pairing stick with the other slots empty", [
      scoreOf("Pairing Stick", cut(stick)),
      scoreOf("Short iron", cut(sickleIron)),
    ]),
    row("crowded-stick", "Pairing stick inside a full masterwork kit", [
      scoreOf("Pairing Stick", cut(stickFull)),
      scoreOf("Short iron", cut(sickleIron)),
    ]),
    row("nailed-margin", "Margin blade with the old nail, foe two tiles out", [
      scoreOf("Old Iron Nail", cut(nail)),
      scoreOf("Margin Blade", cut(openMargin)),
      scoreOf("Short iron", cut(openIron)),
    ]),
  ];
}

export function matrixFindings(rows: MatrixRow[]) {
  const winners = new Set(rows.map((r) => r.winner));
  const kitWinsAll = rows.every((r) => {
    const kitScore = r.scores.find((s) => s.name === "Seed kit");
    if (!kitScore) return false;
    const best = Math.max(...r.scores.map((s) => s.value));
    return kitScore.value >= best - 1e-9 && r.scores.filter((s) => s.value >= best - 1e-9).length === 1;
  });
  return {
    winners: [...winners],
    ironWins: rows.some((r) => r.winner === "Short iron"),
    bootsWin: rows.some((r) => r.winner === "Gap boots"),
    rifleWins: rows.some((r) => r.winner === "Kitchen-door Winchester"),
    kitWinsAll,
    foeStillThere: foeById(createSim()).hp > 0,
  };
}
