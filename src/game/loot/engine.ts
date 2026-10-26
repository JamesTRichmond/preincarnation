import {
  HOME_SITE,
  MATERIAL_VALUE,
  SITES,
  START_SITE,
  STORE_SITE,
  catalog,
  defOf,
} from "./catalog.ts";
import type {
  Action,
  CacheState,
  Custody,
  Effects,
  Instance,
  ItemDef,
  LedgerEntry,
  Stats,
  UseSpec,
  World,
} from "./types.ts";

export class Fail extends Error {}

const GATE: Partial<Record<keyof Effects, number>> = {
  grip: 10,
  trail: 10,
  night: 10,
  cold: 10,
  chapel: 10,
  carry: 10,
};

export function passGate(world: World, stat: keyof Effects): boolean {
  const need = GATE[stat];
  if (need == null) return false;
  return world.effects[stat] >= need;
}

export function totalValue(world: World): number {
  let n = world.playerScrip + world.merchantScrip;
  for (const inst of Object.values(world.instances)) {
    if (inst.custody === "destroyed") continue;
    n += defOf(inst.defId).value;
  }
  for (const [mat, qty] of Object.entries(world.materials)) {
    n += (MATERIAL_VALUE[mat] ?? 0) * qty;
  }
  return n;
}

function emptyCaches(): Record<string, CacheState> {
  const caches: Record<string, CacheState> = {};
  for (const cache of catalog.caches) {
    caches[cache.id] = { presented: false, corroborated: false, looted: false, sealed: false };
  }
  return caches;
}

export function makeWorld(opts?: { inspectFirst?: boolean }): World {
  const sites: World["sites"] = {};
  for (const site of SITES) sites[site.id] = { surveyed: false, signaled: false };
  const locks: Record<string, boolean> = {};
  const stuck: Record<string, boolean> = {};
  for (let i = 0; i < 16; i++) {
    locks[`lock.${i}`] = false;
    stuck[`stuck.${i}`] = false;
  }
  return {
    year: 1998,
    life: 1,
    age: 37,
    alive: true,
    place: START_SITE,
    playerScrip: 0,
    merchantScrip: 0,
    fireTurns: 0,
    inspectFirst: opts?.inspectFirst ?? false,
    stats: { satiation: 30, warmth: 40, health: 60, light: 0, clue: 0, guard: 0, memory: 0 },
    effects: { grip: 0, trail: 0, night: 0, cold: 0, chapel: 0, carry: 0, memory: 0 },
    materials: {},
    instances: {},
    seq: 1,
    knowledge: [],
    caches: emptyCaches(),
    locks,
    stuck,
    sites,
    ledger: [],
    log: [],
    trace: [],
    valueSeeded: 0,
  };
}

function ledger(world: World, entry: Omit<LedgerEntry, "seq" | "life" | "year">): void {
  world.ledger.push({ seq: world.ledger.length + 1, life: world.life, year: world.year, ...entry });
}

export function seedScrip(world: World, who: "player" | "merchant", amount: number): void {
  if (amount < 0) throw new Error("negative scrip seed");
  if (who === "player") world.playerScrip += amount;
  else world.merchantScrip += amount;
  world.valueSeeded += amount;
  ledger(world, { op: "seed", reason: "scrip-seed", valueDelta: amount });
}

export function seedMaterial(world: World, mat: string, qty: number): void {
  if (!MATERIAL_VALUE[mat]) throw new Error(`bad mat ${mat}`);
  world.materials[mat] = (world.materials[mat] ?? 0) + qty;
  const delta = MATERIAL_VALUE[mat] * qty;
  world.valueSeeded += delta;
  ledger(world, { op: "seed", reason: "material-seed", valueDelta: delta });
}

export function seedInstance(
  world: World,
  defId: string,
  custody: Custody,
  opts?: { siteId?: string; condition?: number; reason?: string },
): Instance {
  const def = defOf(defId);
  const iid = `L${world.life}-${world.seq++}`;
  if (world.instances[iid]) throw new Error(`duplicate iid ${iid}`);
  const inst: Instance = {
    iid,
    defId,
    ownerLife: custody === "inventory" || custody === "equipped" ? world.life : 0,
    custody,
    siteId: opts?.siteId,
    condition: opts?.condition ?? 100,
    inspected: false,
    read: false,
    notes: 0,
    preserved: false,
    spoiled: false,
    restored: false,
    attested: false,
    broken: Boolean(def.broken),
    history: [`Seeded as ${custody} (${opts?.reason ?? "seed"}) in ${world.year}.`],
    origin: opts?.reason ?? "seed",
  };
  world.instances[iid] = inst;
  world.valueSeeded += def.value;
  ledger(world, {
    op: "create",
    iid,
    defId,
    to: custody,
    reason: opts?.reason ?? "probe-seed",
    valueDelta: def.value,
  });
  return inst;
}

function createTransformed(world: World, defId: string, reason: string, history: string): Instance {
  const def = defOf(defId);
  const iid = `L${world.life}-${world.seq++}`;
  if (world.instances[iid]) throw new Error(`duplicate iid ${iid}`);
  const inst: Instance = {
    iid,
    defId,
    ownerLife: world.life,
    custody: "inventory",
    condition: 100,
    inspected: false,
    read: false,
    notes: 0,
    preserved: false,
    spoiled: false,
    restored: false,
    attested: false,
    broken: Boolean(def.broken),
    history: [history],
    origin: reason,
  };
  world.instances[iid] = inst;
  ledger(world, { op: "create", iid, defId, to: "inventory", reason, valueDelta: def.value });
  return inst;
}

function move(world: World, inst: Instance, to: Custody, reason: string): void {
  const from = inst.custody;
  inst.custody = to;
  ledger(world, { op: "move", iid: inst.iid, defId: inst.defId, from, to, reason, valueDelta: 0 });
}

function destroy(world: World, inst: Instance, reason: string): void {
  if (inst.custody === "destroyed") throw new Fail("Already gone.");
  const from = inst.custody;
  inst.custody = "destroyed";
  inst.containerIid = undefined;
  inst.slot = undefined;
  ledger(world, {
    op: "destroy",
    iid: inst.iid,
    defId: inst.defId,
    from,
    to: "destroyed",
    reason,
    valueDelta: -defOf(inst.defId).value,
  });
}

function requireAlive(world: World): void {
  if (!world.alive) throw new Fail("You are between lives. Return before you act.");
}

function instOf(world: World, iid: string): Instance {
  const inst = world.instances[iid];
  if (!inst) throw new Fail("That object is not in this life.");
  return inst;
}

function held(inst: Instance): boolean {
  return inst.custody === "inventory" || inst.custody === "equipped";
}

function gateInspect(world: World, inst: Instance): void {
  if (world.inspectFirst && !inst.inspected) {
    throw new Fail(`Inspect ${defOf(inst.defId).name} before using it.`);
  }
}

function bumpStat(stats: Stats, stat: keyof Stats, amount: number): void {
  stats[stat] = Math.max(0, Math.min(100, stats[stat] + amount));
}

function contentsOf(world: World, container: Instance): Instance[] {
  return Object.values(world.instances).filter(
    (i) => i.containerIid === container.iid && i.custody === "contained",
  );
}

function perform(world: World, inst: Instance, use: UseSpec): string {
  requireAlive(world);
  const def = defOf(inst.defId);
  gateInspect(world, inst);

  switch (use.op) {
    case "repair": {
      if (inst.custody !== "inventory") throw new Fail("Hold the nail to use it.");
      const target = Object.values(world.instances).find(
        (i) =>
          i.custody === "inventory" &&
          defOf(i.defId).slot === use.slot &&
          i.condition < 100 &&
          i.iid !== inst.iid,
      );
      if (!target) throw new Fail(`Nothing in the ${use.slot} family needs repair.`);
      target.condition = Math.min(100, target.condition + use.amount);
      target.history.push(`Repaired +${use.amount} with ${def.name} in ${world.year}.`);
      destroy(world, inst, "repair");
      return `${def.name} closes the split. ${defOf(target.defId).name} is at ${target.condition}.`;
    }
    case "salvage": {
      if (inst.custody !== "inventory") throw new Fail("Salvage only what you are holding.");
      if (contentsOf(world, inst).length > 0) {
        for (const inner of contentsOf(world, inst)) {
          inner.containerIid = undefined;
          inner.siteId = undefined;
          move(world, inner, "inventory", "emptied");
          inner.history.push(`Spilled from ${def.name}.`);
        }
      }
      for (const [mat, qty] of Object.entries(use.yields)) {
        world.materials[mat] = (world.materials[mat] ?? 0) + qty;
      }
      destroy(world, inst, "salvage");
      const got = Object.entries(use.yields)
        .map(([m, q]) => `${q} ${m}`)
        .join(", ");
      return `Salvaged ${def.name} into ${got}.`;
    }
    case "bind": {
      if (inst.custody !== "inventory") throw new Fail("Hold the cord.");
      const cache = world.caches[use.cacheId];
      if (!cache) throw new Fail("No such cache.");
      if (cache.sealed) throw new Fail("That cache is already bound.");
      cache.sealed = true;
      destroy(world, inst, "bind");
      return `${def.name} seals ${use.cacheId}.`;
    }
    case "light": {
      if (inst.custody !== "inventory") throw new Fail("Hold the tinder.");
      world.fireTurns += use.turns;
      destroy(world, inst, "light");
      return `Fire is up for ${world.fireTurns} turns.`;
    }
    case "store": {
      if (inst.custody !== "inventory") throw new Fail("Hold the tin.");
      if (contentsOf(world, inst).length > 0) throw new Fail("The tin already holds something.");
      const small = Object.values(world.instances).find(
        (i) => i.custody === "inventory" && i.iid !== inst.iid && defOf(i.defId).small,
      );
      if (!small) throw new Fail("No small thing is free to pack.");
      small.containerIid = inst.iid;
      move(world, small, "contained", "store");
      small.history.push(`Packed into ${def.name}.`);
      return `${defOf(small.defId).name} is inside ${def.name}.`;
    }
    case "unlock": {
      if (inst.custody !== "inventory") throw new Fail("Hold the key.");
      if (world.locks[use.lockId] == null) throw new Fail("No such lock.");
      if (world.locks[use.lockId]) throw new Fail("Already unlocked.");
      world.locks[use.lockId] = true;
      inst.history.push(`Opened ${use.lockId} in ${world.year}.`);
      return `${def.name} opens ${use.lockId}.`;
    }
    case "annotate": {
      if (inst.custody !== "inventory") throw new Fail("Hold the pencil.");
      const letter = Object.values(world.instances).find(
        (i) => i.custody === "inventory" && defOf(i.defId).category === "evidence",
      );
      if (!letter) throw new Fail("No letter is in hand to annotate.");
      letter.notes += 1;
      letter.history.push(`Margin note ${letter.notes} by ${def.name}.`);
      inst.condition = Math.max(0, inst.condition - 1);
      return `A margin note lands on ${defOf(letter.defId).name}.`;
    }
    case "survey": {
      if (inst.custody !== "inventory") throw new Fail("Hold the compass.");
      if (world.place !== use.siteId) throw new Fail(`Survey only works at ${use.siteId}.`);
      if (world.sites[use.siteId]?.surveyed) throw new Fail("This ground is already surveyed.");
      world.sites[use.siteId]!.surveyed = true;
      inst.history.push(`Surveyed ${use.siteId}.`);
      return `${use.siteId} is surveyed.`;
    }
    case "press": {
      if (inst.custody !== "inventory") throw new Fail("Hold the press stone.");
      const food = Object.values(world.instances).find(
        (i) => i.custody === "inventory" && defOf(i.defId).category === "food" && !i.preserved,
      );
      if (!food) throw new Fail("No unpreserved food is in hand.");
      food.preserved = true;
      food.history.push(`Pressed under ${def.name} in ${world.year}.`);
      return `${defOf(food.defId).name} will survive the years, spoiled but present.`;
    }
    case "cut": {
      if (inst.custody !== "inventory") throw new Fail("Hold the knife.");
      const food = Object.values(world.instances).find(
        (i) => i.custody === "inventory" && defOf(i.defId).tags.includes("raw"),
      );
      if (!food) throw new Fail("Nothing raw to cut.");
      destroy(world, food, "cut");
      world.materials.herb = (world.materials.herb ?? 0) + 1;
      inst.condition = Math.max(0, inst.condition - 5);
      return `Cut ${defOf(food.defId).name} down to a pinch of herb.`;
    }
    case "bandage": {
      if (inst.custody !== "inventory") throw new Fail("Hold the linen.");
      const before = world.stats.health;
      bumpStat(world.stats, "health", use.amount);
      if (world.stats.health === before) throw new Fail("Health is already capped.");
      destroy(world, inst, "bandage");
      return `Health moves from ${before} to ${world.stats.health}.`;
    }
    case "signal": {
      if (inst.custody !== "inventory") throw new Fail("Hold the glass.");
      if (world.place !== use.siteId) throw new Fail(`Signal only carries at ${use.siteId}.`);
      if (world.sites[use.siteId]?.signaled) throw new Fail("Already signaled.");
      world.sites[use.siteId]!.signaled = true;
      inst.condition = Math.max(0, inst.condition - 5);
      return `${use.siteId} flashes back.`;
    }
    case "wedge": {
      if (inst.custody !== "inventory") throw new Fail("Hold the wedge.");
      if (world.stuck[use.stuckId] == null) throw new Fail("No such stuck stone.");
      if (world.stuck[use.stuckId]) throw new Fail("Already wedged open.");
      world.stuck[use.stuckId] = true;
      destroy(world, inst, "wedge");
      return `${use.stuckId} shifts open.`;
    }
    case "consume": {
      if (inst.custody !== "inventory") throw new Fail("Hold it to use it.");
      const before = world.stats[use.stat];
      bumpStat(world.stats, use.stat, use.amount);
      if (world.stats[use.stat] === before) throw new Fail(`${use.stat} is already capped.`);
      destroy(world, inst, "consume");
      return `${def.name} raises ${use.stat} from ${before} to ${world.stats[use.stat]}.`;
    }
    case "stoke": {
      if (inst.custody !== "inventory") throw new Fail("Hold it to stoke.");
      if (world.fireTurns <= 0) throw new Fail("There is no fire to stoke.");
      world.fireTurns += use.turns;
      destroy(world, inst, "stoke");
      return `The fire holds for ${world.fireTurns} turns.`;
    }
    case "eat": {
      if (inst.custody !== "inventory") throw new Fail("Hold the food.");
      if (inst.spoiled) {
        const before = world.stats.health;
        bumpStat(world.stats, "health", -6);
        destroy(world, inst, "eat-spoiled");
        return `Spoiled ${def.name} drops health from ${before} to ${world.stats.health}.`;
      }
      const before = world.stats.satiation;
      bumpStat(world.stats, "satiation", use.amount);
      if (world.stats.satiation === before) throw new Fail("You cannot eat another bite.");
      destroy(world, inst, "eat");
      return `${def.name} raises satiation from ${before} to ${world.stats.satiation}.`;
    }
    case "cook": {
      if (inst.custody !== "inventory") throw new Fail("Hold the raw food.");
      if (!def.cooksTo) throw new Fail("This does not cook.");
      if (world.fireTurns <= 0) throw new Fail("Light a fire first.");
      world.fireTurns -= 1;
      destroy(world, inst, "cook");
      const cooked = createTransformed(
        world,
        def.cooksTo,
        "cook",
        `Cooked from ${def.name} in ${world.year}, life ${world.life}.`,
      );
      return `Cooked ${defOf(cooked.defId).name}.`;
    }
    case "compost": {
      if (inst.custody !== "inventory") throw new Fail("Hold it to compost.");
      world.materials[use.mat] = (world.materials[use.mat] ?? 0) + use.qty;
      destroy(world, inst, "compost");
      return `Composted into ${use.qty} ${use.mat}.`;
    }
    case "equip": {
      if (inst.custody !== "inventory") throw new Fail("Hold it to equip.");
      if (!def.slot || !def.effectStat || !def.effectAmt) throw new Fail("This is not equipment.");
      const occupied = Object.values(world.instances).find(
        (i) => i.custody === "equipped" && i.slot === def.slot,
      );
      if (occupied) throw new Fail(`${def.slot} is already worn.`);
      inst.slot = def.slot;
      move(world, inst, "equipped", "equip");
      world.effects[def.effectStat] += def.effectAmt;
      inst.history.push(`Equipped in ${world.year}. ${def.effectStat} +${def.effectAmt}.`);
      return `${def.name} equips. ${def.effectStat} is ${world.effects[def.effectStat]}. Gate ${passGate(world, def.effectStat) ? "opens" : "stays shut"}.`;
    }
    case "place": {
      if (inst.custody !== "inventory") throw new Fail("Hold it to place it.");
      if (!def.placeSlot) throw new Fail("This is not a decoration.");
      inst.siteId = world.place;
      inst.slot = def.placeSlot;
      move(world, inst, "placed", "place");
      inst.history.push(`Placed on the ${def.placeSlot} at ${world.place} in ${world.year}.`);
      return `${def.name} sits on the ${def.placeSlot} at ${world.place}.`;
    }
    case "unplace": {
      if (inst.custody !== "placed") throw new Fail("It is not placed.");
      if (inst.siteId !== world.place) throw new Fail("You are not where it sits.");
      inst.slot = undefined;
      inst.siteId = undefined;
      move(world, inst, "inventory", "unplace");
      inst.history.push(`Taken up in ${world.year}.`);
      return `${def.name} comes back to the pack.`;
    }
    case "display": {
      if (inst.custody !== "inventory") throw new Fail("Hold the relic to display it.");
      if (def.category !== "relic") throw new Fail("Only relics display.");
      if (inst.broken && !inst.restored) throw new Fail("Restore it before it will sit out.");
      inst.siteId = world.place;
      inst.slot = "mantel";
      move(world, inst, "displayed", "display");
      world.effects.memory += 4;
      inst.history.push(`Displayed at ${world.place} in ${world.year}.`);
      return `${def.name} is on the mantel. Memory effect is ${world.effects.memory}.`;
    }
    case "restore": {
      if (inst.custody !== "inventory") throw new Fail("Hold the relic.");
      if (!inst.broken || inst.restored) throw new Fail("It does not need restoration.");
      if ((world.materials.scrap ?? 0) < 2 || (world.materials.brass ?? 0) < 1) {
        throw new Fail("Restoration needs 2 scrap and 1 brass.");
      }
      world.materials.scrap -= 2;
      world.materials.brass -= 1;
      inst.broken = false;
      inst.restored = true;
      inst.condition = 80;
      inst.history.push(
        `Restored in ${world.year}, life ${world.life}. The bond will cross a death.`,
      );
      return `${def.name} is restored.`;
    }
    case "attest": {
      if (inst.custody !== "inventory" && inst.custody !== "equipped")
        throw new Fail("Hold the relic to attest it.");
      if (def.category !== "relic") throw new Fail("Only relics are attested.");
      if (inst.broken && !inst.restored) throw new Fail("Restore it before the bond will take.");
      if (inst.attested) throw new Fail("Already attested.");
      inst.attested = true;
      inst.history.push(`Attested in ${world.year} by life ${world.life}.`);
      return `${def.name} is attested to life ${world.life}.`;
    }
    case "deck-add": {
      if (inst.custody !== "inventory") throw new Fail("Hold the card.");
      if (def.category !== "card") throw new Fail("That is not a card.");
      move(world, inst, "deck", "deck-add");
      inst.history.push(`Entered the deck in ${world.year}.`);
      return `${def.name} is in the deck.`;
    }
    case "deck-play": {
      if (inst.custody !== "deck") throw new Fail("Play only from the deck.");
      if (!def.playStat || def.playAmt == null) throw new Fail("This card has no suit effect.");
      const before = world.stats[def.playStat];
      move(world, inst, "discard", "deck-play");
      bumpStat(world.stats, def.playStat, def.playAmt);
      inst.history.push(`Played in ${world.year}. ${def.playStat} +${def.playAmt}.`);
      return `${def.name} plays. ${def.playStat} moves from ${before} to ${world.stats[def.playStat]}.`;
    }
    case "read": {
      if (inst.custody !== "inventory") throw new Fail("Hold the letter.");
      if (def.category !== "evidence") throw new Fail("Nothing here to read.");
      if (inst.read) throw new Fail("You have already read it.");
      inst.read = true;
      if (!world.knowledge.includes(def.id)) world.knowledge.push(def.id);
      inst.history.push(`Read in ${world.year} by life ${world.life}.`);
      return `Read. The board keeps ${def.id} even if the paper is lost.`;
    }
    case "present": {
      if (inst.custody !== "inventory") throw new Fail("Hold the letter to present it.");
      if (!inst.read) throw new Fail("Read it before you present it.");
      if (!def.cacheId) throw new Fail("This paper names no cache.");
      const cache = catalog.cacheById.get(def.cacheId);
      const state = world.caches[def.cacheId];
      if (!cache || !state) throw new Fail("The cache it names is not real.");
      if (world.place !== cache.siteId) throw new Fail(`Present it at ${cache.siteId}.`);
      if (def.letterRole === "primary") {
        if (state.presented) throw new Fail("The primary letter was already presented.");
        state.presented = true;
        inst.history.push(`Presented at ${cache.siteId} in ${world.year}. Cache may be searched.`);
        return `${cache.id} recognizes the letter. You may search it.`;
      }
      if (state.corroborated) throw new Fail("Already corroborated.");
      state.corroborated = true;
      inst.history.push(`Corroborated ${cache.id} in ${world.year}.`);
      return `${cache.id} is corroborated. The find will be marked confirmed.`;
    }
    default: {
      const _never: never = use;
      throw new Fail(`Unhandled use ${String(_never)}`);
    }
  }
}

function resolveDeath(world: World): void {
  const place = world.place;
  world.deathPlace = place;
  world.deathYear = world.year;
  world.deathLife = world.life;
  for (const inst of Object.values(world.instances)) {
    if (
      inst.custody === "destroyed" ||
      inst.custody === "merchant" ||
      inst.custody === "ground" ||
      inst.custody === "corpse" ||
      inst.custody === "estate" ||
      inst.custody === "veil"
    ) {
      continue;
    }
    const def = defOf(inst.defId);
    const boundRelic =
      def.category === "relic" &&
      (inst.attested || inst.restored) &&
      (held(inst) || inst.custody === "displayed");
    if (boundRelic) {
      inst.slot = undefined;
      inst.siteId = undefined;
      move(world, inst, "veil", "death-veil");
      inst.history.push(`Crossed with life ${world.life} at death in ${world.year}.`);
      continue;
    }
    if (def.category === "provision" && held(inst)) {
      destroy(world, inst, "death-vanish");
      continue;
    }
    if (def.category === "food" && (held(inst) || inst.custody === "contained")) {
      if (inst.preserved) {
        inst.spoiled = true;
        inst.siteId = place;
        inst.containerIid = undefined;
        inst.slot = undefined;
        move(world, inst, "corpse", "death-spoil");
        inst.history.push(`Preserved food spoiled across the waiting years at ${place}.`);
      } else {
        destroy(world, inst, "death-vanish");
      }
      continue;
    }
    if (inst.custody === "placed" || (inst.custody === "displayed" && def.category !== "relic")) {
      inst.history.push(
        `Remained at ${inst.siteId} after life ${world.life} died in ${world.year}.`,
      );
      continue;
    }
    if (inst.custody === "displayed") {
      inst.history.push(`Left on the mantel at ${inst.siteId} by life ${world.life}.`);
      continue;
    }
    if (inst.custody === "deck") {
      inst.siteId = HOME_SITE;
      inst.slot = undefined;
      move(world, inst, "estate", "death-deck");
      inst.history.push(`Deck left at ${HOME_SITE} by life ${world.life}.`);
      continue;
    }
    if (
      held(inst) ||
      inst.custody === "equipped" ||
      inst.custody === "contained" ||
      inst.custody === "discard"
    ) {
      inst.slot = undefined;
      inst.containerIid = undefined;
      inst.siteId = place;
      move(world, inst, "corpse", "death-drop");
      inst.history.push(`Dropped at ${place} when life ${world.life} died in ${world.year}.`);
    }
  }
  world.effects = { grip: 0, trail: 0, night: 0, cold: 0, chapel: 0, carry: 0, memory: 0 };
  for (const inst of Object.values(world.instances)) {
    if (inst.custody !== "displayed") continue;
    const def = defOf(inst.defId);
    if (def.category === "relic") world.effects.memory += 4;
  }
  world.alive = false;
}

function reduce(world: World, action: Action): string {
  switch (action.type) {
    case "travel": {
      requireAlive(world);
      if (!world.sites[action.siteId]) throw new Fail("No such place.");
      if (world.place === action.siteId) throw new Fail("You are already there.");
      world.place = action.siteId;
      return `Traveled to ${action.siteId}.`;
    }
    case "pickup": {
      requireAlive(world);
      const inst = instOf(world, action.iid);
      if (inst.custody !== "ground") throw new Fail("It is not on the ground.");
      if (inst.siteId !== world.place) throw new Fail("You are not where it lies.");
      inst.siteId = undefined;
      inst.ownerLife = world.life;
      move(world, inst, "inventory", "pickup");
      inst.history.push(`Picked up in ${world.year} by life ${world.life}.`);
      return `Picked up ${defOf(inst.defId).name}.`;
    }
    case "inspect": {
      requireAlive(world);
      const inst = instOf(world, action.iid);
      if (!held(inst) && inst.custody !== "deck" && inst.custody !== "discard") {
        throw new Fail("Inspect what you are holding.");
      }
      inst.inspected = true;
      const def = defOf(inst.defId);
      inst.history.push(`Inspected in ${world.year}.`);
      return `${def.name}: ${def.blurb}`;
    }
    case "use": {
      const inst = instOf(world, action.iid);
      const def = defOf(inst.defId);
      const use = def.uses[action.which];
      if (!use) throw new Fail("That use is not on this definition.");
      return perform(world, inst, use);
    }
    case "equip": {
      const inst = instOf(world, action.iid);
      return perform(world, inst, { op: "equip" });
    }
    case "unequip": {
      requireAlive(world);
      const inst = Object.values(world.instances).find(
        (i) => i.custody === "equipped" && i.slot === action.slot,
      );
      if (!inst) throw new Fail(`Nothing is in ${action.slot}.`);
      const def = defOf(inst.defId);
      if (def.effectStat && def.effectAmt) world.effects[def.effectStat] -= def.effectAmt;
      inst.slot = undefined;
      move(world, inst, "inventory", "unequip");
      return `Unequipped ${def.name}.`;
    }
    case "craft": {
      requireAlive(world);
      const recipe = catalog.recipeById.get(action.recipeId);
      if (!recipe || recipe.kind !== "craft") throw new Fail("No such bench recipe.");
      for (const [mat, qty] of Object.entries(recipe.inputs)) {
        if ((world.materials[mat] ?? 0) < qty) throw new Fail(`Need ${qty} ${mat}.`);
      }
      for (const [mat, qty] of Object.entries(recipe.inputs)) world.materials[mat] -= qty;
      const made = createTransformed(
        world,
        recipe.outputDefId,
        "craft",
        `Crafted in ${world.year} from ${Object.entries(recipe.inputs)
          .map(([m, q]) => `${q} ${m}`)
          .join(", ")}.`,
      );
      return `Crafted ${defOf(made.defId).name}.`;
    }
    case "place":
      return perform(world, instOf(world, action.iid), { op: "place" });
    case "unplace":
      return perform(world, instOf(world, action.iid), { op: "unplace" });
    case "display":
      return perform(world, instOf(world, action.iid), { op: "display" });
    case "restore":
      return perform(world, instOf(world, action.iid), { op: "restore" });
    case "attest":
      return perform(world, instOf(world, action.iid), { op: "attest" });
    case "deck-add":
      return perform(world, instOf(world, action.iid), { op: "deck-add" });
    case "deck-play":
      return perform(world, instOf(world, action.iid), { op: "deck-play" });
    case "read":
      return perform(world, instOf(world, action.iid), { op: "read" });
    case "present":
      return perform(world, instOf(world, action.iid), { op: "present" });
    case "search": {
      requireAlive(world);
      const cache = catalog.cacheById.get(action.cacheId);
      const state = world.caches[action.cacheId];
      if (!cache || !state) throw new Fail("No such cache.");
      if (world.place !== cache.siteId) throw new Fail(`The cache is at ${cache.siteId}.`);
      if (!state.presented) throw new Fail("Nothing opens. Present the letter that names it.");
      if (state.looted) throw new Fail("The cache is empty.");
      const reward = createTransformed(
        world,
        cache.rewardDefId,
        "cache-seed",
        state.corroborated
          ? `Recovered from ${cache.id} in ${world.year}. Find corroborated.`
          : `Recovered from ${cache.id} in ${world.year}.`,
      );
      world.valueSeeded += defOf(reward.defId).value;
      state.looted = true;
      state.rewardIid = reward.iid;
      return `The cache gives up ${defOf(reward.defId).name}.`;
    }
    case "barter": {
      requireAlive(world);
      if (world.place !== STORE_SITE) throw new Fail("The buyer is at Vergennes Wharf.");
      const offer = instOf(world, action.offerIid);
      const stock = instOf(world, action.stockIid);
      if (offer.custody !== "inventory") throw new Fail("You are not holding the offer.");
      if (stock.custody !== "merchant") throw new Fail("That is not on the counter.");
      const delta = defOf(stock.defId).value - defOf(offer.defId).value;
      if (delta > 0) {
        if (world.playerScrip < delta) throw new Fail(`You are short ${delta} scrip.`);
        world.playerScrip -= delta;
        world.merchantScrip += delta;
      } else if (delta < 0) {
        if (world.merchantScrip < -delta) throw new Fail("The merchant cannot make change.");
        world.merchantScrip -= -delta;
        world.playerScrip += -delta;
      }
      offer.ownerLife = 0;
      move(world, offer, "merchant", "barter-give");
      offer.history.push(`Bartered away in ${world.year} by life ${world.life}.`);
      stock.ownerLife = world.life;
      move(world, stock, "inventory", "barter-receive");
      stock.history.push(`Received in trade in ${world.year} by life ${world.life}.`);
      return `Traded ${defOf(offer.defId).name} for ${defOf(stock.defId).name}.`;
    }
    case "buy": {
      requireAlive(world);
      if (world.place !== STORE_SITE) throw new Fail("The counter is at Vergennes Wharf.");
      const stock = instOf(world, action.iid);
      if (stock.custody !== "merchant") throw new Fail("Not for sale.");
      const price = defOf(stock.defId).value;
      if (world.playerScrip < price) throw new Fail(`Price is ${price} scrip.`);
      world.playerScrip -= price;
      world.merchantScrip += price;
      stock.ownerLife = world.life;
      move(world, stock, "inventory", "purchase");
      stock.history.push(`Bought in ${world.year} by life ${world.life} for ${price}.`);
      return `Bought ${defOf(stock.defId).name}.`;
    }
    case "die": {
      if (!world.alive) throw new Fail("Already dead.");
      resolveDeath(world);
      return `Life ${world.deathLife} ends at ${world.deathPlace} in ${world.year}.`;
    }
    case "return": {
      if (world.alive) throw new Fail("You are still alive.");
      const previous = world.life;
      world.year += 14;
      world.life += 1;
      world.age = 14;
      world.alive = true;
      world.place = HOME_SITE;
      world.stats = {
        satiation: 30,
        warmth: 40,
        health: 60,
        light: 0,
        clue: 0,
        guard: 0,
        memory: 0,
      };
      world.fireTurns = 0;
      for (const inst of Object.values(world.instances)) {
        if (inst.custody !== "veil") continue;
        inst.ownerLife = world.life;
        inst.slot = undefined;
        inst.siteId = undefined;
        move(world, inst, "inventory", "return-veil");
        inst.history.push(
          `Returned with life ${world.life} in ${world.year}, still the same object carried by life ${previous}.`,
        );
      }
      return `It is ${world.year}. You are fourteen. Life ${previous} is fourteen years gone. What was bound is still itself.`;
    }
    case "claim": {
      requireAlive(world);
      const inst = instOf(world, action.iid);
      if (
        inst.custody !== "corpse" &&
        inst.custody !== "estate" &&
        inst.custody !== "placed" &&
        inst.custody !== "displayed"
      ) {
        throw new Fail("Nothing here is waiting to be claimed.");
      }
      if (
        (inst.custody === "corpse" || inst.custody === "placed" || inst.custody === "displayed") &&
        inst.siteId !== world.place
      ) {
        throw new Fail(`Claim it at ${inst.siteId}.`);
      }
      if (inst.custody === "estate" && world.place !== HOME_SITE)
        throw new Fail(`The estate is at ${HOME_SITE}.`);
      const previousOwner = inst.ownerLife;
      if (inst.custody === "displayed")
        world.effects.memory = Math.max(0, world.effects.memory - 4);
      inst.ownerLife = world.life;
      inst.slot = undefined;
      inst.siteId = undefined;
      move(world, inst, "inventory", "claim");
      inst.history.push(
        `Claimed in ${world.year} by life ${world.life} from life ${previousOwner}. Same object, not a copy.`,
      );
      return `Claimed ${defOf(inst.defId).name}. The record names life ${previousOwner}.`;
    }
    default: {
      const _never: never = action;
      throw new Fail(`Unhandled action ${String(_never)}`);
    }
  }
}

export function step(world: World, action: Action): { world: World; ok: boolean; message: string } {
  const menu = action.menu ?? "none";
  const next = structuredClone(world);
  try {
    const message = reduce(next, action);
    next.trace.push({
      menu,
      action: action.type,
      ok: true,
      itemId: "iid" in action ? action.iid : undefined,
    });
    next.log.push(message);
    if (next.log.length > 80) next.log.splice(0, next.log.length - 80);
    return { world: next, ok: true, message };
  } catch (error) {
    if (!(error instanceof Fail)) throw error;
    const traced = structuredClone(world);
    traced.trace.push({
      menu,
      action: action.type,
      ok: false,
      itemId: "iid" in action ? action.iid : undefined,
    });
    traced.log.push(error.message);
    if (traced.log.length > 80) traced.log.splice(0, traced.log.length - 80);
    return { world: traced, ok: false, message: error.message };
  }
}

export function must(world: World, action: Action): World {
  const result = step(world, action);
  if (!result.ok) throw new Error(`${action.type} failed: ${result.message}`);
  return result.world;
}

export function groundAt(world: World, siteId: string): Instance[] {
  return Object.values(world.instances).filter(
    (i) => i.custody === "ground" && i.siteId === siteId,
  );
}

export function inventory(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => i.custody === "inventory");
}

export function merchantGoods(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => i.custody === "merchant");
}

export function equipped(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => i.custody === "equipped");
}

export function placedAt(world: World): Instance[] {
  return Object.values(world.instances).filter(
    (i) => (i.custody === "placed" || i.custody === "displayed") && i.siteId === world.place,
  );
}

export function claimable(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => {
    if (i.custody === "estate") return world.place === HOME_SITE;
    if (i.custody === "corpse" || i.custody === "placed" || i.custody === "displayed")
      return i.siteId === world.place;
    return false;
  });
}

export function deck(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => i.custody === "deck");
}

export function discard(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => i.custody === "discard");
}

function placeOwn(
  world: World,
  defId: string,
  siteId: string,
  opts?: { condition?: number },
): Instance {
  const def = defOf(defId);
  if (def.source.kind === "site" && def.source.siteId !== siteId) {
    throw new Error(`refusing to place ${defId} off its source ${def.source.siteId}`);
  }
  return seedInstance(world, defId, "ground", {
    siteId,
    condition: opts?.condition,
    reason: "site-seed",
  });
}

export function initialPlay(): World {
  const world = makeWorld({ inspectFirst: true });
  seedScrip(world, "merchant", 80);
  placeOwn(world, "obj.nail.0", START_SITE);
  placeOwn(world, "obj.cord.0", START_SITE);
  placeOwn(world, "obj.tinder.0", START_SITE);
  placeOwn(world, "obj.press.0", START_SITE);
  placeOwn(world, "obj.knife.0", START_SITE);
  placeOwn(world, "obj.tin.0", START_SITE);
  placeOwn(world, "obj.key.0", START_SITE);
  placeOwn(world, "obj.compass.0", START_SITE);
  placeOwn(world, "food.raw.0", START_SITE);
  placeOwn(world, "eq.hands.0", START_SITE, { condition: 45 });
  placeOwn(world, "eq.feet.0", START_SITE);
  placeOwn(world, "rel.0", START_SITE);
  placeOwn(world, "rel.12", START_SITE);
  placeOwn(world, "pro.0", START_SITE);
  placeOwn(world, "obj.nail.1", "vergennes-wharf");
  placeOwn(world, "food.raw.1", "vergennes-wharf");
  placeOwn(world, "dec.1", "vergennes-wharf");
  placeOwn(world, "evi.0", "goshen-bog");
  placeOwn(world, "card.stone.1.0", HOME_SITE);
  placeOwn(world, "card.river.2.0", HOME_SITE);
  seedInstance(world, "pro.1", "merchant", { reason: "merchant-seed" });
  seedInstance(world, "dec.0", "merchant", { reason: "merchant-seed" });
  return world;
}

export function activeInstances(world: World): Instance[] {
  return Object.values(world.instances).filter((i) => i.custody !== "destroyed");
}

export function createsOf(world: World, iid: string): LedgerEntry[] {
  return world.ledger.filter((e) => e.op === "create" && e.iid === iid);
}

export function defName(id: string): string {
  return catalog.byId.get(id)?.name ?? id;
}

export function useSpec(def: ItemDef, which: 0 | 1): UseSpec {
  const use = def.uses[which];
  if (!use) throw new Error(`missing use ${which} on ${def.id}`);
  return use;
}
