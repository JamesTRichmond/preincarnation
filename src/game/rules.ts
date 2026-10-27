import { INCARNATIONS, LIMBO_UPGRADES, type UpgradeDef } from "./content.ts";
import { graveSnapshot, sipIndex } from "./bag.ts";
import { RELIC_BY_ID, type Grave, type RelicId } from "./items.ts";
import { T } from "./tile-ids.ts";
import type { CycleLedger, Flags, IncarnationId, SaveData, Upgrades } from "./types.ts";
import { starterWeapon } from "./weapons.ts";

export function isIncarnationUnlocked(
  id: IncarnationId,
  cycle: number,
  flags: Flags,
  crowns: number,
): boolean {
  if (id === "wanderer") return true;
  if (id === "smuggler") return cycle >= 1;
  if (id === "officer") return cycle >= 1 && flags.talked.includes("mayor");
  if (id === "embryo") return crowns >= 2 || cycle >= 2;
  return false;
}

export function spendSkillPoint(save: SaveData, key: UpgradeDef["key"]): SaveData | null {
  if (save.character.skillPoints <= 0) return null;
  const def = LIMBO_UPGRADES.find((u) => u.key === key);
  if (!def || def.polarity === "crown") return null;
  const owned = ownedLevel(save.upgrades, key);
  if (owned >= def.max) return null;
  const next: SaveData = {
    ...save,
    character: { ...save.character, skillPoints: save.character.skillPoints - 1 },
    upgrades: { ...save.upgrades },
  };
  if (key === "soloverseKey") return null;
  const k = key as Exclude<typeof key, "soloverseKey">;
  next.upgrades[k] = owned + 1;
  return next;
}

export function refundSkillPoint(save: SaveData, key: UpgradeDef["key"]): SaveData | null {
  const def = LIMBO_UPGRADES.find((u) => u.key === key);
  if (!def || def.polarity === "crown") return null;
  const owned = ownedLevel(save.upgrades, key);
  if (owned <= 0) return null;
  const next: SaveData = {
    ...save,
    character: { ...save.character, skillPoints: save.character.skillPoints + 1 },
    upgrades: { ...save.upgrades },
  };
  const k = key as Exclude<typeof key, "soloverseKey">;
  next.upgrades[k] = owned - 1;
  return next;
}

export function canAfford(def: UpgradeDef, karma: number, crowns: number): boolean {
  if (def.polarity === "crown") return crowns >= def.cost;
  if (def.polarity === "light") return karma >= def.cost;
  return karma <= -def.cost;
}

export function ownedLevel(upgrades: Upgrades, key: UpgradeDef["key"]): number {
  const val = upgrades[key];
  if (typeof val === "boolean") return val ? 1 : 0;
  return val;
}

export function applyUpgrade(save: SaveData, key: UpgradeDef["key"]): SaveData | null {
  const def = LIMBO_UPGRADES.find((u) => u.key === key);
  if (!def) return null;
  const owned = ownedLevel(save.upgrades, key);
  if (owned >= def.max) return null;
  if (!canAfford(def, save.karma, save.crowns)) return null;
  const next: SaveData = {
    ...save,
    upgrades: { ...save.upgrades },
    karma: save.karma,
    crowns: save.crowns,
  };
  if (def.polarity === "crown") next.crowns -= def.cost;
  else if (def.polarity === "light") next.karma -= def.cost;
  else next.karma += def.cost;
  if (key === "soloverseKey") next.upgrades.soloverseKey = true;
  else {
    const k = key as Exclude<typeof key, "soloverseKey">;
    next.upgrades[k] = owned + 1;
  }
  return next;
}

/** HP/MP come from the skin and Spare Heart only. Cycle ages the county, not the ribcage. */
export function bodyStats(id: IncarnationId, vitality: number) {
  const spec = INCARNATIONS[id];
  return {
    maxHp: spec.hp + vitality,
    maxMp: 8 + vitality,
    speed: spec.speed,
    damage: spec.damage,
  };
}

export function applyIncarnationStats(id: IncarnationId, vitality: number) {
  return bodyStats(id, vitality);
}

export function slashDamage(opts: {
  weaponDmg: number;
  incarnationDamage: number;
  edge: number;
  tropoverse: boolean;
  flawId: string;
}): number {
  const tropo = opts.tropoverse ? 1.2 : 1;
  return (
    (opts.weaponDmg + opts.incarnationDamage - 1) *
    (1 + opts.edge * 0.18) *
    tropo *
    sheetDamageMul(opts.flawId)
  );
}

export function spinDamage(incarnationDamage: number, edge: number): number {
  return 2.2 + incarnationDamage + edge * 0.3;
}

export function soloverseReady(save: SaveData): boolean {
  return (
    save.cycle >= 3 &&
    (save.upgrades.soloverseKey || save.incarnation === "embryo" || save.crowns >= 3)
  );
}

export function devilThreshold(flawId: string): number {
  return flawId === "the_other_voice" ? 3 : 0;
}

export function sheetDamageMul(flawId: string): number {
  return flawId === "the_blade" ? 1.15 : 1;
}

export function sheetSpeedMul(flawId: string): number {
  return flawId === "cannot_rest" ? 1.1 : 1;
}

export function fillDialogueText(
  text: string,
  name: string,
  year: number,
  cycle: number,
  deed = "",
  graves = 0,
) {
  return text
    .replaceAll("{name}", name)
    .replaceAll("{year}", String(year))
    .replaceAll("{cycle}", String(cycle))
    .replaceAll("{deed}", deed || "you died with the Vein still quiet")
    .replaceAll("{graves}", String(graves));
}

const STOOP_BAND = new Set<number>([T.rail, T.path, T.cliffLip, T.bridge, T.gravel]);

/** Cracked marble outside the quarry still breaks. In the Vein the lamp must be open. */
export function quarryHammerLands(onQuarry: boolean, hasLantern: boolean, lanternOn: boolean): boolean {
  return !onQuarry || (hasLantern && lanternOn);
}

/** A later life is the same fight. Tropoverse is a place, applied once, not a tax on deaths. */
export function enemyMaxHp(base: number, tropoverse: boolean): number {
  return Math.round(base * (tropoverse ? 1.35 : 1));
}

/**
 * Door exits start on the stoop. Walk south until the tile is grass-or-better:
 * not solid, and not rail, path, cliff lip, bridge, or gravel.
 */
export function stepSouthOffStoop(
  tx: number,
  startTy: number,
  tileAt: (x: number, y: number) => number | undefined,
  isBlocked: (x: number, y: number) => boolean,
): { tx: number; ty: number } | null {
  let ty = startTy;
  for (let i = 0; i < 8; i++) {
    ty += 1;
    const id = tileAt(tx, ty);
    if (id == null) return null;
    if (isBlocked(tx, ty) || STOOP_BAND.has(id)) continue;
    return { tx, ty };
  }
  return null;
}

/** First return stays on *_return. A second death names the last deed. The Heart has no first-return node. */
export function cycleReturnNode(who: "elder" | "farmer" | "mayor" | "heart", cycle: number): string | null {
  if (cycle >= 2) return who + "_second";
  if (cycle >= 1 && who !== "heart") return who + "_return";
  return null;
}

/** County people who are not the Vein. A second talk is a person, not a quest. */
const COUNTY_SIDE = new Set([
  "hunter",
  "ferry",
  "rokeby",
  "camper",
  "conductor",
  "cartog",
  "creemee",
  "prof",
  "bud",
  "hippie",
  "artist",
  "ranger",
  "vmayor",
  "millwright",
  "lockkeep",
  "legislator",
  "intern",
  "coolidge",
  "spectrum",
]);

export function countyAgainNode(npc: string, alreadyTalked: boolean): string | null {
  if (!alreadyTalked || !COUNTY_SIDE.has(npc)) return null;
  return npc + "_again";
}

export function signedKarmaLabel(n: number): string {
  return (n >= 0 ? "+" : "") + n;
}

export function skillAwardForDeath(idealId: string, townsCleared: readonly string[]): number {
  return 2 + (idealId === "the_job" && !townsCleared.includes("quarry") ? 1 : 0);
}

/** Ranks still buyable with skill. Crowns are not skill. */
export function spendableRanksLeft(upgrades: Upgrades): number {
  let left = 0;
  for (const def of LIMBO_UPGRADES) {
    if (def.polarity === "crown") continue;
    left += Math.max(0, def.max - ownedLevel(upgrades, def.key));
  }
  return left;
}

/** Death pays skill only while a rank is still unbought. Held points already count. */
export function chapterSkillAward(save: SaveData): number {
  const raw = skillAwardForDeath(save.character.idealId, save.flags.townsCleared ?? []);
  const room = Math.max(0, spendableRanksLeft(save.upgrades) - save.character.skillPoints);
  return Math.min(raw, room);
}

export function wintersPassed(_rand: () => number = Math.random): number {
  return 14;
}

/** Cardinal lunge stays 12. A diagonal bobcat or Sentinel coat is 3px tighter. */
export const LUNGE_REACH = 12;
export const DIAGONAL_COAT_PX = 3;

export function lungeReach(kind: string, dx: number, dy: number): number {
  if (kind !== "bobcat" && kind !== "sentinel") return LUNGE_REACH;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < 1 || ay < 1) return LUNGE_REACH;
  const ratio = Math.max(ax, ay) / Math.min(ax, ay);
  if (ratio > 1.6) return LUNGE_REACH;
  return LUNGE_REACH - DIAGONAL_COAT_PX;
}

export function lungeHits(kind: string, dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) < lungeReach(kind, dx, dy);
}

/** Full blood, and the bottle in hand would not fill a dry well. */
export function sipRefusedAtFullHp(
  bottles: readonly string[],
  hp: number,
  maxHp: number,
  mp: number,
  maxMp: number,
): boolean {
  if (!(hp >= maxHp - 0.05)) return false;
  const i = sipIndex(bottles as readonly ("empty" | "syrup" | "creemee" | "deluxe")[], hp, maxHp, mp, maxMp);
  if (i < 0) return false;
  const k = bottles[i];
  const dry = mp < maxMp - 0.05;
  if (dry && (k === "creemee" || k === "deluxe")) return false;
  return true;
}

/** Two lines on the mound. Only the first return. Not a banner across the Green. */
export function firstReturnStone(cycle: number, name: string): readonly [string, string] | null {
  if (cycle !== 1) return null;
  const who = (name.trim() || "Unknown").slice(0, 12);
  return [who, "Fourteen winters."];
}

export const PAUSE_GRAVE_NOTE =
  "A grave returns the numbered steel. Skill does not mint once every rank but a Crown is paid.";

const HIGH_TIER = new Set(["bear", "bobcat", "fisher", "wraith"]);
export const SEAM_MERCY = 0.65;

/**
 * The east screen of Middlebury, then the first screen of the Vein.
 * The Green (west Middlebury) and the Sentinel are not in this set.
 */
export function veinSeamScreen(mapId: string, tileX: number): number | null {
  if (mapId === "middlebury" && tileX >= 20) return 0;
  if (mapId === "quarry" && tileX < 20) return 1;
  return null;
}

export function graveSteelStanding(
  graves: readonly { id: string; excavated: boolean; weapons: readonly { id: string; dmg?: number }[] }[],
  inventoryIds: readonly string[],
  passedIds: readonly string[],
): "none" | "in-dirt" | "recovered" | "passed" {
  const open = [...graves].reverse().find((g) => !g.excavated && g.weapons.some((w) => typeof w.dmg === "number"));
  if (!open) return "none";
  const numbered = open.weapons.filter((w) => typeof w.dmg === "number");
  if (numbered.every((w) => inventoryIds.includes(w.id))) return "recovered";
  if (passedIds.includes(open.id)) return "passed";
  return "in-dirt";
}

export function seamSpawnWeight(
  base: number,
  kind: string,
  mapId: string,
  tileX: number,
  cycle: number,
  steel: "none" | "in-dirt" | "recovered" | "passed",
): number {
  if (!(base > 0)) return 0;
  if (cycle < 1 || steel !== "in-dirt") return base;
  if (kind === "sentinel" || !HIGH_TIER.has(kind)) return base;
  const screen = veinSeamScreen(mapId, tileX);
  if (screen == null || screen > 1) return base;
  return base * SEAM_MERCY;
}

/** Stable skip. Weight 0.65 keeps about two of three. The same id does not flicker. */
export function seamSkips(id: string, cycle: number, weight: number): boolean {
  if (!(weight < 1)) return false;
  let h = cycle * 17;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 33) + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000 >= weight;
}

export function bondKeepsake(bondId: string): RelicId | null {
  return bondId === "maeve" ? "lantern" : null;
}

export function relicsForGrave(relics: readonly RelicId[], bondId: string): RelicId[] {
  const keep = bondKeepsake(bondId);
  return relics.filter((r) => r !== "sword" && r !== keep);
}

/** Idempotent. Cycle 0 is the first life — the lamp stays in the grass until you return. */
export function grantBondKeepsake(save: SaveData): SaveData {
  const relic = bondKeepsake(save.character.bondId);
  if (!relic || save.cycle < 1) return save;
  if (!save.flags.relics.includes(relic)) save.flags.relics = [...save.flags.relics, relic];
  save.flags.ySlot = relic;
  if (relic === "lantern") save.flags.lanternOn = true;
  return save;
}

export function ownedUpgradeNames(upgrades: Upgrades): string[] {
  const out: string[] = [];
  for (const u of LIMBO_UPGRADES) {
    if (u.polarity === "crown") continue;
    const n = ownedLevel(upgrades, u.key);
    if (n <= 0) continue;
    out.push(u.max > 1 ? u.name + " " + n : u.name);
  }
  return out;
}

export function groundKeptLine(grave: Grave | undefined): string {
  if (!grave) return "The county kept the year. Nothing else hit the dirt.";
  const bits: string[] = [];
  for (const w of grave.weapons) bits.push(w.name);
  if (grave.arrows) bits.push(grave.arrows + " arrows");
  if (grave.bombs) bits.push(grave.bombs + " kegs");
  if (!bits.length) return "A mound. Weather will take the rest.";
  return bits.join(", ") + ". Bring the shovel.";
}

export function cycleLedger(save: SaveData): CycleLedger {
  const awarded = save.flags.returnedFromDeath ? (save.flags.lastSkillAward ?? 0) : chapterSkillAward(save);
  const deed = save.flags.lastDeed || "You died with the Vein still quiet";
  const thisLife =
    awarded > 0
      ? deed + ". " + awarded + " skill for the walk back."
      : deed + ". The purse already holds every rank. Spend what you hold.";

  const keep: string[] = ["Same hands."];
  const pts = save.character.skillPoints;
  keep.push(pts > 0 ? pts + " skill unspent." : "Shop empty.");
  const relic = bondKeepsake(save.character.bondId);
  if (relic && save.cycle >= 1) keep.push(RELIC_BY_ID[relic].name + " stays with you.");
  const named = ownedUpgradeNames(save.upgrades);
  if (named.length) keep.push(named.join(", ") + ".");

  return {
    thisLife,
    youKeep: keep.join(" "),
    theGround: groundKeptLine(save.flags.graves.at(-1)),
  };
}

export function resolveDeath(
  save: SaveData,
  where: { mapId: SaveData["mapId"]; x: number; y: number },
  winters = wintersPassed(),
): SaveData {
  const iron = starterWeapon();
  const grave: Grave = {
    id: "grave-" + save.cycle + "-" + where.mapId,
    mapId: where.mapId,
    x: where.x,
    y: where.y,
    year: save.flags.year,
    weapons: save.inventory.filter((w) => w.id !== "starter-iron").map((w) => graveSnapshot(w)),
    relics: relicsForGrave(save.flags.relics, save.character.bondId),
    arrows: save.flags.arrows,
    bombs: save.flags.bombs,
    excavated: false,
  };
  save.flags.graves = [...(save.flags.graves ?? []), grave];
  save.inventory = [iron];
  save.equippedId = iron.id;
  save.flags.arrows = 0;
  save.flags.bombs = 0;
  save.cycle += 1;
  save.flags.year += winters;
  const award = chapterSkillAward(save);
  save.character.skillPoints += award;
  save.flags.lastSkillAward = award;
  save.flags.afterlifeHost = save.karma < devilThreshold(save.character.flawId) ? "devil" : "god";
  save.flags.returnedFromDeath = true;
  return save;
}
