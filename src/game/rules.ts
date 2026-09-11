import { INCARNATIONS, LIMBO_UPGRADES, type UpgradeDef } from "./content.ts";
import { RELIC_BY_ID, type Grave, type RelicId } from "./items.ts";
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

export function fillDialogueText(text: string, name: string, year: number, cycle: number) {
  return text
    .replaceAll("{name}", name)
    .replaceAll("{year}", String(year))
    .replaceAll("{cycle}", String(cycle));
}

export function signedKarmaLabel(n: number): string {
  return (n >= 0 ? "+" : "") + n;
}

export function skillAwardForDeath(idealId: string, townsCleared: readonly string[]): number {
  return 2 + (idealId === "the_job" && !townsCleared.includes("quarry") ? 1 : 0);
}

export function wintersPassed(rand: () => number = Math.random): number {
  return 14 + Math.floor(rand() * 5);
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
  const awarded = skillAwardForDeath(save.character.idealId, save.flags.townsCleared ?? []);
  const deed = save.flags.lastDeed || "You died with the Vein still quiet";
  const thisLife = deed + ". " + awarded + " skill for the walk back.";

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
    weapons: save.inventory
      .filter((w) => w.id !== "starter-iron")
      .map((w) => ({
        id: w.id,
        name: w.name,
        magic: w.affixes.some((a) => a.magic),
        kind: w.kind,
      })),
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
  save.character.skillPoints += skillAwardForDeath(save.character.idealId, save.flags.townsCleared ?? []);
  save.flags.afterlifeHost = save.karma < devilThreshold(save.character.flawId) ? "devil" : "god";
  save.flags.returnedFromDeath = true;
  return save;
}
