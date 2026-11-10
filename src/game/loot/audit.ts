import {
  HOME_SITE,
  MATERIAL_VALUE,
  SITES,
  START_SITE,
  STORE_SITE,
  TARGET_DEFINITIONS,
  catalog,
  defOf,
} from "./catalog.ts";
import {
  createsOf,
  groundAt,
  initialPlay,
  inventory,
  makeWorld,
  merchantGoods,
  must,
  passGate,
  seedInstance,
  seedMaterial,
  seedScrip,
  step,
  totalValue,
} from "./engine.ts";
import type { Category, Failure, ItemDef, UseSpec, World } from "./types.ts";

export const METHODOLOGY = {
  authored:
    "Definition records in the candidate pack written by this integration pass, plus any external pack file that actually parsed. Names on a list do not count unless the record loaded.",
  implemented:
    "Static only: the source, both uses, handler name, recipe, cache, lock, site, and material all resolve inside this engine. Nothing was executed.",
  demonstrated:
    "A named cross-system case obtained the item, applied a required use, and in that same run crossed a second system: equip gate, craft, barter, cache search, or death and claim/return. Counted only if that case passed.",
  verified:
    "Executed per definition: obtain by its real source, every required use with a measured state change, ownership, reference integrity, the value bound, and a fourteen-year death then return. A failed check removes it from this count.",
} as const;

const HANDLED = new Set<string>([
  "repair",
  "salvage",
  "bind",
  "light",
  "store",
  "unlock",
  "annotate",
  "survey",
  "press",
  "cut",
  "bandage",
  "signal",
  "wedge",
  "consume",
  "stoke",
  "eat",
  "cook",
  "compost",
  "equip",
  "place",
  "unplace",
  "display",
  "restore",
  "attest",
  "deck-add",
  "deck-play",
  "read",
  "present",
]);

const STATS = new Set(["satiation", "warmth", "health", "light", "clue", "guard", "memory"]);
const EFFECTS = new Set(["grip", "trail", "night", "cold", "chapel", "carry", "memory"]);
const PLACE_SLOTS = new Set(["mantel", "wall", "table", "yard"]);
const SLOT_NAMES = new Set(["hands", "feet", "head", "body", "tool", "pack"]);

function fail(itemId: string, check: string, detail: string, fix: string): Failure {
  return { itemId, check, detail, fix };
}

function refOk(ref: string): boolean {
  if (catalog.byId.has(ref)) return true;
  if (catalog.cacheById.has(ref)) return true;
  if (catalog.recipeById.has(ref)) return true;
  if (SITES.some((s) => s.id === ref)) return true;
  if (/^lock\.\d+$/.test(ref) || /^stuck\.\d+$/.test(ref)) return true;
  if (STATS.has(ref) || EFFECTS.has(ref) || PLACE_SLOTS.has(ref) || SLOT_NAMES.has(ref))
    return true;
  if (ref in MATERIAL_VALUE) return true;
  return false;
}

function consumes(use: UseSpec): boolean {
  return (
    use.op === "repair" ||
    use.op === "bind" ||
    use.op === "light" ||
    use.op === "bandage" ||
    use.op === "wedge" ||
    use.op === "salvage" ||
    use.op === "eat" ||
    use.op === "cook" ||
    use.op === "consume" ||
    use.op === "stoke" ||
    use.op === "compost"
  );
}

export function staticFailures(item: ItemDef): Failure[] {
  const out: Failure[] = [];
  const id = item.id;
  if (item.uses.length < 2) {
    out.push(
      fail(
        id,
        "two-uses",
        `only ${item.uses.length} use`,
        "Give the definition two different executable uses.",
      ),
    );
  }
  if (item.uses.length >= 2 && item.uses[0]!.op === item.uses[1]!.op) {
    out.push(
      fail(
        id,
        "two-uses",
        "both uses are the same op",
        "The second use has to be a different handler.",
      ),
    );
  }
  for (const use of item.uses) {
    if (!HANDLED.has(use.op)) {
      out.push(
        fail(
          id,
          "handler",
          `no handler for ${use.op}`,
          "Add the handler in engine.ts perform(), or remove the use.",
        ),
      );
    }
    if (use.op === "salvage") {
      for (const mat of Object.keys(use.yields)) {
        if (!(mat in MATERIAL_VALUE)) {
          out.push(
            fail(
              id,
              "material",
              `unknown salvage mat ${mat}`,
              "Use a material from MATERIAL_VALUE.",
            ),
          );
        }
      }
    }
  }
  for (const ref of item.refs) {
    if (!refOk(ref))
      out.push(
        fail(
          id,
          "ref",
          `unresolved ref ${ref}`,
          "Point the ref at a real site, cache, recipe, item, lock, or material.",
        ),
      );
  }
  if (item.source.kind === "site") {
    const siteId = item.source.siteId;
    if (!SITES.some((s) => s.id === siteId)) {
      out.push(
        fail(
          id,
          "source",
          `site ${siteId} missing`,
          "Set source.siteId to one of the sixteen county sites.",
        ),
      );
    }
  }
  if (item.source.kind === "recipe") {
    const recipe = catalog.recipeById.get(item.source.recipeId);
    if (!recipe || recipe.outputDefId !== item.id) {
      out.push(
        fail(
          id,
          "source",
          "recipe source does not produce this item",
          "Add the bench recipe and set its outputDefId to this id.",
        ),
      );
    }
  }
  if (item.source.kind === "cache") {
    const cache = catalog.cacheById.get(item.source.cacheId);
    if (!cache || cache.rewardDefId !== item.id) {
      out.push(
        fail(
          id,
          "source",
          "cache source does not reward this item",
          "Put this id on a real cache as rewardDefId.",
        ),
      );
    }
  }
  if (item.source.kind === "cook") {
    const raw = catalog.byId.get(item.source.rawId);
    if (!raw || raw.cooksTo !== item.id) {
      out.push(
        fail(
          id,
          "source",
          "cook source raw food does not cook into this",
          "Set the raw food cooksTo and the cook recipe.",
        ),
      );
    }
  }
  if (item.category === "equipment") {
    if (
      !item.uses.some((u) => u.op === "equip") ||
      !item.effectStat ||
      (item.effectAmt ?? 0) < 10
    ) {
      out.push(
        fail(
          id,
          "effect",
          "equipment has no working gate effect",
          "Set effectStat and effectAmt >= 10 so equip opens a gate that fails unequipped.",
        ),
      );
    }
  }
  if (item.category === "decoration" && !item.uses.some((u) => u.op === "place")) {
    out.push(
      fail(id, "place", "decoration cannot be placed", "Add a place use with a real placeSlot."),
    );
  }
  if (item.category === "card") {
    const ops = new Set(item.uses.map((u) => u.op));
    if (!ops.has("deck-add") || !ops.has("deck-play") || item.playAmt == null) {
      out.push(
        fail(
          id,
          "deck",
          "card cannot be decked and played",
          "Add deck-add and deck-play with a playStat and playAmt.",
        ),
      );
    }
  }
  if (item.category === "evidence") {
    const ops = new Set(item.uses.map((u) => u.op));
    if (!ops.has("read") || !ops.has("present") || !item.cacheId) {
      out.push(
        fail(
          id,
          "evidence",
          "letter cannot be read and presented",
          "Add read and present, and a cacheId that exists.",
        ),
      );
    }
  }
  if (item.value < 0)
    out.push(fail(id, "value", "negative value", "Set a non-negative integer value."));
  return out;
}

export function obtain(world: World, def: ItemDef): { world: World; iid: string } {
  switch (def.source.kind) {
    case "site": {
      const inst = seedInstance(world, def.id, "ground", {
        siteId: def.source.siteId,
        reason: "probe-seed",
      });
      let next = world;
      if (next.place !== def.source.siteId)
        next = must(next, { type: "travel", siteId: def.source.siteId });
      next = must(next, { type: "pickup", iid: inst.iid });
      return { world: next, iid: inst.iid };
    }
    case "merchant": {
      seedScrip(world, "player", def.value);
      const inst = seedInstance(world, def.id, "merchant", { reason: "probe-seed" });
      let next = world;
      if (next.place !== STORE_SITE) next = must(next, { type: "travel", siteId: STORE_SITE });
      next = must(next, { type: "buy", iid: inst.iid });
      return { world: next, iid: inst.iid };
    }
    case "recipe": {
      const recipe = catalog.recipeById.get(def.source.recipeId);
      if (!recipe) throw new Error(`missing recipe for ${def.id}`);
      for (const [mat, qty] of Object.entries(recipe.inputs)) seedMaterial(world, mat, qty);
      const before = new Set(Object.keys(world.instances));
      const next = must(world, { type: "craft", recipeId: recipe.id });
      const made = Object.values(next.instances).find((i) => !before.has(i.iid));
      if (!made || made.defId !== def.id) throw new Error(`craft did not produce ${def.id}`);
      return { world: next, iid: made.iid };
    }
    case "cook": {
      const raw = defOf(def.source.rawId);
      const got = obtain(world, raw);
      let next = got.world;
      if (next.fireTurns <= 0) {
        const tinder = seedInstance(next, "obj.tinder.0", "inventory", { reason: "probe-seed" });
        next = must(next, { type: "use", iid: tinder.iid, which: 0 });
      }
      const before = new Set(Object.keys(next.instances));
      next = must(next, { type: "use", iid: got.iid, which: 1 });
      const made = Object.values(next.instances).find((i) => !before.has(i.iid));
      if (!made || made.defId !== def.id) throw new Error(`cook did not produce ${def.id}`);
      return { world: next, iid: made.iid };
    }
    case "cache": {
      const cache = catalog.cacheById.get(def.source.cacheId);
      if (!cache) throw new Error(`missing cache for ${def.id}`);
      const letter = defOf(cache.primaryLetterId);
      const got = obtain(world, letter);
      let next = must(got.world, { type: "read", iid: got.iid });
      if (next.place !== cache.siteId) next = must(next, { type: "travel", siteId: cache.siteId });
      next = must(next, { type: "present", iid: got.iid });
      const before = new Set(Object.keys(next.instances));
      next = must(next, { type: "search", cacheId: cache.id });
      const made = Object.values(next.instances).find((i) => !before.has(i.iid));
      if (!made || made.defId !== def.id) throw new Error(`cache did not yield ${def.id}`);
      return { world: next, iid: made.iid };
    }
    default: {
      const _never: never = def.source;
      throw new Error(`bad source ${String(_never)}`);
    }
  }
}

function prepare(world: World, def: ItemDef, use: UseSpec): World {
  switch (use.op) {
    case "repair":
      seedInstance(world, "eq.hands.0", "inventory", { condition: 40, reason: "probe-seed" });
      return world;
    case "store":
      seedInstance(world, "obj.key.1", "inventory", { reason: "probe-seed" });
      return world;
    case "annotate":
      seedInstance(world, "evi.1", "inventory", { reason: "probe-seed" });
      return world;
    case "survey":
    case "signal":
      return world.place === use.siteId
        ? world
        : must(world, { type: "travel", siteId: use.siteId });
    case "press":
    case "cut":
      seedInstance(world, "food.raw.2", "inventory", { reason: "probe-seed" });
      return world;
    case "stoke":
    case "cook": {
      if (world.fireTurns > 0) return world;
      const tinder = seedInstance(world, "obj.tinder.1", "inventory", { reason: "probe-seed" });
      return must(world, { type: "use", iid: tinder.iid, which: 0 });
    }
    case "restore":
      seedMaterial(world, "scrap", 2);
      seedMaterial(world, "brass", 1);
      return world;
    case "present": {
      const cache = def.cacheId ? catalog.cacheById.get(def.cacheId) : undefined;
      if (!cache) return world;
      return world.place === cache.siteId
        ? world
        : must(world, { type: "travel", siteId: cache.siteId });
    }
    default:
      return world;
  }
}

function assertUse(
  before: World,
  after: World,
  def: ItemDef,
  use: UseSpec,
  iid: string,
): string | null {
  const prev = before.instances[iid];
  const now = after.instances[iid];
  if (!prev || !now) return "instance disappeared from the record";
  if (totalValue(after) > after.valueSeeded)
    return `value rose to ${totalValue(after)} above seeded ${after.valueSeeded}`;
  if (after.valueSeeded < before.valueSeeded) return "valueSeeded shrank during a use";

  switch (use.op) {
    case "repair": {
      if (now.custody !== "destroyed") return "repair did not consume the item";
      const hit = Object.values(after.instances).filter((i) => {
        const was = before.instances[i.iid];
        return (
          was && defOf(i.defId).slot === use.slot && i.condition === was.condition + use.amount
        );
      });
      return hit.length === 1
        ? null
        : "repair did not raise one damaged piece by the stated amount";
    }
    case "salvage": {
      if (now.custody !== "destroyed") return "salvage did not consume the item";
      for (const [mat, qty] of Object.entries(use.yields)) {
        const delta = (after.materials[mat] ?? 0) - (before.materials[mat] ?? 0);
        if (delta !== qty) return `salvage ${mat} delta ${delta} wanted ${qty}`;
      }
      return null;
    }
    case "bind":
      if (now.custody !== "destroyed") return "bind did not consume the cord";
      return after.caches[use.cacheId]?.sealed ? null : "cache was not sealed";
    case "light":
      if (now.custody !== "destroyed") return "light did not consume the tinder";
      return after.fireTurns === before.fireTurns + use.turns ? null : "fire did not advance";
    case "store": {
      if (now.custody !== "inventory") return "tin did not stay in hand";
      const moved = Object.values(after.instances).filter(
        (i) =>
          before.instances[i.iid]?.custody === "inventory" &&
          i.custody === "contained" &&
          i.containerIid === iid,
      );
      return moved.length === 1 ? null : "nothing small was packed into the tin";
    }
    case "unlock":
      return after.locks[use.lockId] && now.custody !== "destroyed"
        ? null
        : "lock did not open or the key was lost";
    case "annotate": {
      const notes = Object.values(after.instances).filter(
        (i) => (i.notes ?? 0) === (before.instances[i.iid]?.notes ?? 0) + 1,
      );
      return notes.length === 1 && now.custody !== "destroyed"
        ? null
        : "no letter gained a margin note";
    }
    case "survey":
      return after.sites[use.siteId]?.surveyed && now.custody !== "destroyed"
        ? null
        : "site was not surveyed";
    case "press": {
      const foods = Object.values(after.instances).filter(
        (i) => !before.instances[i.iid]?.preserved && i.preserved,
      );
      return foods.length === 1 && now.custody !== "destroyed" ? null : "no food was preserved";
    }
    case "cut": {
      if (now.custody === "destroyed") return "the knife was consumed by a cut";
      const herb = (after.materials.herb ?? 0) - (before.materials.herb ?? 0);
      const lost = Object.values(after.instances).some(
        (i) =>
          before.instances[i.iid]?.custody === "inventory" &&
          i.custody === "destroyed" &&
          defOf(i.defId).tags.includes("raw"),
      );
      return herb === 1 && lost ? null : "cut did not turn raw food into herb";
    }
    case "bandage":
      if (now.custody !== "destroyed") return "bandage was not consumed";
      return after.stats.health === before.stats.health + use.amount
        ? null
        : "health did not rise by the bandage amount";
    case "signal":
      return after.sites[use.siteId]?.signaled && now.custody !== "destroyed"
        ? null
        : "site was not signaled";
    case "wedge":
      if (now.custody !== "destroyed") return "wedge was not consumed";
      return after.stuck[use.stuckId] ? null : "stuck stone did not open";
    case "consume":
      if (now.custody !== "destroyed") return "provision was not consumed";
      return after.stats[use.stat] === Math.min(100, before.stats[use.stat] + use.amount)
        ? null
        : `${use.stat} did not rise`;
    case "stoke":
      if (now.custody !== "destroyed") return "stoke did not consume the provision";
      return after.fireTurns === before.fireTurns + use.turns ? null : "fire was not stoked";
    case "eat":
      if (now.custody !== "destroyed") return "food was not eaten";
      if (prev.spoiled)
        return after.stats.health < before.stats.health ? null : "spoiled food did not harm";
      return after.stats.satiation > before.stats.satiation
        ? null
        : "eating did not raise satiation";
    case "cook": {
      if (now.custody !== "destroyed") return "raw food survived cooking";
      if (!def.cooksTo) return "no cooksTo";
      const made = Object.values(after.instances).find(
        (i) => !before.instances[i.iid] && i.defId === def.cooksTo,
      );
      return made && after.fireTurns === before.fireTurns - 1
        ? null
        : "cook did not produce the skillet dish";
    }
    case "compost": {
      if (now.custody !== "destroyed") return "compost did not consume the food";
      const delta = (after.materials[use.mat] ?? 0) - (before.materials[use.mat] ?? 0);
      return delta === use.qty ? null : "compost yield mismatch";
    }
    case "equip": {
      if (now.custody !== "equipped" || !def.effectStat || def.effectAmt == null)
        return "did not equip";
      if (after.effects[def.effectStat] !== before.effects[def.effectStat] + def.effectAmt)
        return "effect did not apply";
      return passGate(after, def.effectStat) && !passGate(before, def.effectStat)
        ? null
        : "gate did not open on equip";
    }
    case "place":
      return now.custody === "placed" && now.siteId === before.place && now.slot === def.placeSlot
        ? null
        : "decoration was not placed in its slot";
    case "unplace":
      return now.custody === "inventory" && !now.siteId
        ? null
        : "decoration did not return to the pack";
    case "display":
      return now.custody === "displayed" && after.effects.memory === before.effects.memory + 4
        ? null
        : "display did not raise the memory effect";
    case "restore":
      return now.restored && !now.broken ? null : "relic stayed broken";
    case "attest":
      return now.attested ? null : "relic was not attested";
    case "deck-add":
      return now.custody === "deck" ? null : "card did not enter the deck";
    case "deck-play":
      if (now.custody !== "discard" || !def.playStat || def.playAmt == null)
        return "card was not discarded from the deck";
      return after.stats[def.playStat] >= before.stats[def.playStat] + def.playAmt
        ? null
        : "play had no suit effect";
    case "read":
      return now.read && after.knowledge.includes(def.id)
        ? null
        : "reading did not reach the board";
    case "present": {
      if (!def.cacheId) return "no cache";
      const cache = after.caches[def.cacheId];
      if (!cache) return "cache state missing";
      if (def.letterRole === "primary")
        return cache.presented ? null : "primary letter did not open the cache";
      return cache.corroborated ? null : "corroborating note did not mark the cache";
    }
    default:
      return "no assertion for that use";
  }
}

function applyUse(
  world: World,
  def: ItemDef,
  iid: string,
  which: 0 | 1,
): { world: World; error: string | null } {
  const use = def.uses[which];
  if (!use) return { world, error: "missing use" };
  let ready = world;
  try {
    ready = prepare(ready, def, use);
  } catch (error) {
    return { world, error: error instanceof Error ? error.message : String(error) };
  }
  const beforeSeed = ready.valueSeeded;
  const result = step(ready, { type: "use", iid, which });
  if (!result.ok) return { world: ready, error: result.message };
  if (result.world.valueSeeded !== beforeSeed && use.op !== "cook") {
    return { world: result.world, error: "use changed valueSeeded" };
  }
  const problem = assertUse(ready, result.world, def, use, iid);
  return { world: result.world, error: problem };
}

export function executionFailures(def: ItemDef): Failure[] {
  const out: Failure[] = [];
  const id = def.id;
  let first: { world: World; iid: string };
  try {
    first = obtain(makeWorld(), def);
  } catch (error) {
    out.push(
      fail(
        id,
        "source-run",
        error instanceof Error ? error.message : String(error),
        "Make the declared source actually produce one owned instance.",
      ),
    );
    return out;
  }
  const owned = first.world.instances[first.iid];
  if (!owned || owned.ownerLife !== first.world.life || owned.custody !== "inventory") {
    out.push(
      fail(
        id,
        "ownership",
        "obtain did not land as this life's inventory",
        "Pickup, purchase, craft, cook, or cache loot must set ownerLife and custody.",
      ),
    );
  }
  if (createsOf(first.world, first.iid).length !== 1) {
    out.push(
      fail(
        id,
        "duplication",
        "obtain created the instance more than once",
        "Create the iid once. Later steps must move it.",
      ),
    );
  }
  const dup = duplicateCreate(first.world);
  if (dup)
    out.push(
      fail(id, "duplication", `iid ${dup} created twice during obtain`, "Stop the second create."),
    );
  if (totalValue(first.world) > first.world.valueSeeded) {
    out.push(
      fail(id, "economy", "obtain increased value above seeds", "Do not mint value in obtain."),
    );
  }

  const useA = def.uses[0];
  if (def.category === "equipment" && def.slot && def.effectStat && useA) {
    const equipped = applyUse(first.world, def, first.iid, 0);
    if (equipped.error) {
      out.push(
        fail(
          id,
          "use-0",
          equipped.error,
          "Equip must raise its effect and open the gate from a shut start.",
        ),
      );
    } else {
      const off = must(equipped.world, { type: "unequip", slot: def.slot });
      if (passGate(off, def.effectStat)) {
        out.push(
          fail(
            id,
            "effect",
            "gate stayed open after unequip",
            "Subtract the effect when the piece leaves the slot.",
          ),
        );
      }
      const salvaged = applyUse(off, def, first.iid, 1);
      if (salvaged.error) {
        out.push(
          fail(
            id,
            "use-1",
            salvaged.error,
            "Equipment's second use must run after it is unequipped.",
          ),
        );
      }
    }
  } else if (useA && !consumes(useA) && def.uses[1]) {
    let world = first.world;
    const a = applyUse(world, def, first.iid, 0);
    if (a.error)
      out.push(
        fail(
          id,
          "use-0",
          a.error,
          `Fix handler ${useA.op} so the state change matches the definition.`,
        ),
      );
    world = a.error ? world : a.world;
    const b = applyUse(world, def, first.iid, 1);
    if (b.error)
      out.push(
        fail(
          id,
          "use-1",
          b.error,
          `Fix handler ${def.uses[1].op} so it still works after the first use.`,
        ),
      );
  } else {
    const a = applyUse(first.world, def, first.iid, 0);
    if (a.error)
      out.push(fail(id, "use-0", a.error, `Fix handler ${useA?.op ?? "?"} for this definition.`));
    if (def.uses[1]) {
      try {
        const second = obtain(makeWorld(), def);
        const b = applyUse(second.world, def, second.iid, 1);
        if (b.error)
          out.push(
            fail(id, "use-1", b.error, `Fix handler ${def.uses[1].op} on a fresh instance.`),
          );
      } catch (error) {
        out.push(
          fail(
            id,
            "use-1",
            error instanceof Error ? error.message : String(error),
            "The second use's obtain path failed.",
          ),
        );
      }
    }
  }

  if (def.category === "evidence" && def.letterRole === "primary" && def.cacheId) {
    try {
      const got = obtain(makeWorld(), def);
      let world = must(got.world, { type: "read", iid: got.iid });
      const cache = catalog.cacheById.get(def.cacheId)!;
      if (world.place !== cache.siteId)
        world = must(world, { type: "travel", siteId: cache.siteId });
      world = must(world, { type: "present", iid: got.iid });
      world = must(world, { type: "search", cacheId: cache.id });
      const again = step(world, { type: "search", cacheId: cache.id });
      if (again.ok)
        out.push(
          fail(id, "duplication", "cache searched twice", "Set looted and refuse a second reward."),
        );
      const rewardId = world.caches[cache.id]?.rewardIid;
      if (!rewardId || createsOf(world, rewardId).length !== 1) {
        out.push(
          fail(
            id,
            "cache",
            "cache reward was not a single create",
            "Seed the reward once on search.",
          ),
        );
      }
    } catch (error) {
      out.push(
        fail(
          id,
          "cache",
          error instanceof Error ? error.message : String(error),
          "Primary letter must open its cache a single time.",
        ),
      );
    }
  }

  try {
    const persistence = persistenceError(def);
    if (persistence)
      out.push(
        fail(
          id,
          "persistence",
          persistence,
          "Keep the same iid across the fourteen-year return and follow the death policy.",
        ),
      );
  } catch (error) {
    out.push(
      fail(
        id,
        "persistence",
        error instanceof Error ? error.message : String(error),
        "Death and return must complete for this definition.",
      ),
    );
  }
  return out;
}

function duplicateCreate(world: World): string | null {
  const seen = new Set<string>();
  for (const entry of world.ledger) {
    if (entry.op !== "create" || !entry.iid) continue;
    if (seen.has(entry.iid)) return entry.iid;
    seen.add(entry.iid);
  }
  return null;
}

function persistenceError(def: ItemDef): string | null {
  const got = obtain(makeWorld(), def);
  let world = got.world;
  const iid = got.iid;
  if (def.category === "relic") {
    if (world.instances[iid]?.broken) {
      seedMaterial(world, "scrap", 2);
      seedMaterial(world, "brass", 1);
    }
    world = must(world, { type: "use", iid, which: 0 });
  } else if (def.category === "decoration") {
    world = must(world, { type: "use", iid, which: 0 });
  } else if (def.category === "card") {
    world = must(world, { type: "use", iid, which: 0 });
  } else if (def.category === "evidence") {
    world = must(world, { type: "read", iid });
  } else if (def.category === "food") {
    const press = seedInstance(world, "obj.press.3", "inventory", { reason: "probe-seed" });
    world = must(world, { type: "use", iid: press.iid, which: 0 });
  } else if (def.category === "equipment") {
    world = must(world, { type: "equip", iid });
  }
  const creates = createsOf(world, iid).length;
  const deathPlace = world.place;
  world = must(world, { type: "die" });
  world = must(world, { type: "return" });
  if (world.year !== 2012 || world.life !== 2 || world.age !== 14)
    return `calendar ${world.year}/${world.life}/${world.age}`;
  if (createsOf(world, iid).length !== creates) return "return created a second copy";
  const inst = world.instances[iid];
  if (!inst) return "record lost";
  if (def.category === "relic") {
    if (inst.custody !== "inventory" || inst.ownerLife !== 2)
      return `relic custody ${inst.custody} owner ${inst.ownerLife}`;
    const text = inst.history.join(" ");
    if (!text.includes("life 1") || !text.includes(String(world.year)))
      return "relic history does not name both lives";
    return duplicateCreate(world);
  }
  if (def.category === "provision") {
    return inst.custody === "destroyed" ? duplicateCreate(world) : "provision survived death";
  }
  if (def.category === "food") {
    if (!inst.spoiled || inst.custody !== "corpse")
      return "preserved food did not spoil onto the corpse";
    if (world.place !== HOME_SITE) return "return did not start at home";
    if (deathPlace !== HOME_SITE) world = must(world, { type: "travel", siteId: deathPlace });
    world = must(world, { type: "claim", iid });
    if (world.instances[iid]?.ownerLife !== 2 || !world.instances[iid]?.spoiled)
      return "spoiled food claim broke identity";
    return duplicateCreate(world);
  }
  if (def.category === "decoration") {
    if (inst.custody !== "placed" || inst.ownerLife === 2)
      return "placed decoration did not remain with the old owner";
    if (inst.siteId !== world.place) world = must(world, { type: "travel", siteId: inst.siteId! });
    world = must(world, { type: "claim", iid });
    if (world.instances[iid]?.ownerLife !== 2 || world.instances[iid]?.iid !== iid)
      return "claim minted or retargeted the decoration";
    return duplicateCreate(world);
  }
  if (def.category === "card") {
    if (inst.custody !== "estate") return `card custody ${inst.custody}`;
    world = must(world, { type: "claim", iid });
    if (world.instances[iid]?.ownerLife !== 2) return "card claim lost ownership";
    return duplicateCreate(world);
  }
  if (def.category === "evidence") {
    if (!world.knowledge.includes(def.id)) return "read knowledge did not survive";
    if (world.knowledge.filter((k) => k === def.id).length !== 1) return "knowledge duplicated";
    if (inst.custody !== "corpse") return "letter body was not left behind";
    return duplicateCreate(world);
  }
  if (inst.custody !== "corpse") return `${def.category} custody after death is ${inst.custody}`;
  if (deathPlace !== world.place) world = must(world, { type: "travel", siteId: deathPlace });
  world = must(world, { type: "claim", iid });
  const claimed = world.instances[iid];
  if (!claimed || claimed.ownerLife !== 2 || claimed.custody !== "inventory")
    return "claim did not transfer the same object";
  if (!claimed.history.some((line) => line.includes("life 1")))
    return "claim history dropped the previous life";
  return duplicateCreate(world);
}

export interface ItemResult {
  id: string;
  category: Category;
  implemented: boolean;
  verified: boolean;
  failures: Failure[];
}

export function verifyItem(def: ItemDef): ItemResult {
  const stat = staticFailures(def);
  const executed = stat.length === 0 ? executionFailures(def) : [];
  const failures = [...stat, ...executed];
  return {
    id: def.id,
    category: def.category,
    implemented: stat.length === 0,
    verified: failures.length === 0,
    failures,
  };
}

function miniStory(def: ItemDef): void {
  const got = obtain(makeWorld(), def);
  let world = got.world;
  const iid = got.iid;
  if (world.instances[iid]?.ownerLife !== world.life) throw new Error(`${def.id} ownership`);
  const first = def.uses[0];
  if (!first) throw new Error(`${def.id} has no use`);
  world = prepare(world, def, first);
  world = must(world, { type: "use", iid, which: 0 });
  if (def.category === "equipment") {
    if (!def.effectStat || !passGate(world, def.effectStat)) throw new Error(`${def.id} gate`);
    world = must(world, { type: "unequip", slot: def.slot! });
    if (passGate(world, def.effectStat)) throw new Error(`${def.id} gate stuck`);
    world = must(world, { type: "equip", iid });
  } else if (def.category === "card") {
    world = must(world, { type: "use", iid, which: 1 });
    if (world.instances[iid]?.custody !== "discard") throw new Error(`${def.id} not played`);
  } else if (def.category === "evidence" && def.letterRole === "primary" && def.cacheId) {
    const cache = catalog.cacheById.get(def.cacheId)!;
    if (world.place !== cache.siteId) world = must(world, { type: "travel", siteId: cache.siteId });
    world = must(world, { type: "use", iid, which: 1 });
    world = must(world, { type: "search", cacheId: cache.id });
    if (!world.caches[cache.id]?.looted) throw new Error(`${def.id} cache`);
  } else if (def.category === "evidence") {
    if (world.place !== catalog.cacheById.get(def.cacheId!)!.siteId) {
      world = must(world, { type: "travel", siteId: catalog.cacheById.get(def.cacheId!)!.siteId });
    }
    world = must(world, { type: "use", iid, which: 1 });
  } else if (def.category === "decoration") {
    const site = world.instances[iid]?.siteId;
    world = must(world, { type: "die" });
    world = must(world, { type: "return" });
    if (world.instances[iid]?.custody !== "placed" || world.instances[iid]?.siteId !== site) {
      throw new Error(`${def.id} did not stay placed`);
    }
  } else if (def.category === "relic") {
    world = must(world, { type: "die" });
    world = must(world, { type: "return" });
    if (world.instances[iid]?.custody !== "inventory" || createsOf(world, iid).length !== 1) {
      throw new Error(`${def.id} reincarnation`);
    }
  } else if (def.category === "food" || def.category === "provision") {
    if (world.instances[iid]?.custody === "destroyed") {
      if (def.uses[1]) {
        const second = obtain(makeWorld(), def);
        world = prepare(second.world, def, def.uses[1]);
        world = must(world, { type: "use", iid: second.iid, which: 1 });
      }
    }
  } else if (def.uses[1] && !consumes(first)) {
    world = prepare(world, def, def.uses[1]);
    world = must(world, { type: "use", iid, which: 1 });
  } else if (def.uses[1]) {
    const second = obtain(makeWorld(), def);
    let other = prepare(second.world, def, def.uses[1]);
    other = must(other, { type: "use", iid: second.iid, which: 1 });
    world = other;
  }
  if (totalValue(world) > world.valueSeeded)
    throw new Error(`${def.id} value ${totalValue(world)} > ${world.valueSeeded}`);
  const dup = duplicateCreate(world);
  if (dup) throw new Error(`${def.id} duplicate ${dup}`);
}

export interface CaseResult {
  id: string;
  title: string;
  systems: string[];
  ok: boolean;
  failures: string[];
  touched: string[];
}

function runSlice(id: string, title: string, systems: string[], ids: string[]): CaseResult {
  const failures: string[] = [];
  const touched: string[] = [];
  for (const itemId of ids) {
    try {
      miniStory(defOf(itemId));
      touched.push(itemId);
    } catch (error) {
      failures.push(`${itemId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { id, title, systems, ok: failures.length === 0, failures, touched };
}

function economyCases(): CaseResult[] {
  const cases: CaseResult[] = [];
  const push = (id: string, title: string, systems: string[], run: () => void) => {
    try {
      run();
      cases.push({ id, title, systems, ok: true, failures: [], touched: [] });
    } catch (error) {
      cases.push({
        id,
        title,
        systems,
        ok: false,
        failures: [error instanceof Error ? error.message : String(error)],
        touched: [],
      });
    }
  };

  push("econ-double-salvage", "Salvage the same nail twice", ["salvage", "duplication"], () => {
    const got = obtain(makeWorld(), defOf("obj.nail.0"));
    const world = must(got.world, { type: "use", iid: got.iid, which: 1 });
    const scrap = world.materials.scrap ?? 0;
    const again = step(world, { type: "use", iid: got.iid, which: 1 });
    if (again.ok) throw new Error("second salvage succeeded");
    if ((again.world.materials.scrap ?? 0) !== scrap)
      throw new Error("scrap changed on failed salvage");
  });

  push("econ-double-eat", "Eat the same apple twice", ["food", "duplication"], () => {
    const got = obtain(makeWorld(), defOf("food.raw.0"));
    const world = must(got.world, { type: "use", iid: got.iid, which: 0 });
    const again = step(world, { type: "use", iid: got.iid, which: 0 });
    if (again.ok) throw new Error("second eat succeeded");
  });

  push("econ-craft-empty", "Craft gloves with no materials", ["craft", "duplication"], () => {
    const world = makeWorld();
    const result = step(world, { type: "craft", recipeId: "recipe.eq.hands.1" });
    if (result.ok) throw new Error("craft succeeded empty");
    if (Object.values(result.world.instances).some((i) => i.defId === "eq.hands.1"))
      throw new Error("output appeared");
  });

  push("econ-barter-conserves", "Barter conserves value", ["barter", "economy"], () => {
    let world = makeWorld();
    seedScrip(world, "merchant", 40);
    const offer = seedInstance(world, "obj.compass.0", "inventory", { reason: "probe-seed" });
    const stock = seedInstance(world, "pro.1", "merchant", { reason: "probe-seed" });
    if (world.place !== STORE_SITE) world = must(world, { type: "travel", siteId: STORE_SITE });
    const before = totalValue(world);
    world = must(world, { type: "barter", offerIid: offer.iid, stockIid: stock.iid });
    if (totalValue(world) !== before) throw new Error(`value ${before} -> ${totalValue(world)}`);
    if (world.instances[offer.iid]?.custody !== "merchant") throw new Error("offer not moved");
    if (world.instances[stock.iid]?.custody !== "inventory") throw new Error("stock not moved");
    if (createsOf(world, offer.iid).length !== 1 || createsOf(world, stock.iid).length !== 1)
      throw new Error("barter cloned");
  });

  push("econ-cache-once", "A cache pays once", ["cache", "duplication"], () => {
    const got = obtain(makeWorld(), defOf("rel.24"));
    const again = step(got.world, { type: "search", cacheId: "cache.0" });
    if (again.ok) throw new Error("second search worked");
    const rewards = Object.values(got.world.instances).filter(
      (i) => i.defId === "rel.24" && i.custody !== "destroyed",
    );
    if (rewards.length !== 1) throw new Error(`reward count ${rewards.length}`);
  });

  push(
    "econ-soulbound-once",
    "Soulbound relic is not copied",
    ["reincarnation", "duplication"],
    () => {
      const got = obtain(makeWorld(), defOf("rel.0"));
      let world = must(got.world, { type: "use", iid: got.iid, which: 0 });
      world = must(world, { type: "die" });
      world = must(world, { type: "return" });
      const copies = Object.values(world.instances).filter(
        (i) => i.defId === "rel.0" && i.custody !== "destroyed",
      );
      if (copies.length !== 1 || copies[0]!.iid !== got.iid) throw new Error("relic copied");
    },
  );

  push(
    "econ-play-from-hand",
    "A card in the pack cannot be played",
    ["deck", "duplication"],
    () => {
      const got = obtain(makeWorld(), defOf("card.stone.1.0"));
      const before = got.world.stats.guard;
      const played = step(got.world, { type: "use", iid: got.iid, which: 1 });
      if (played.ok) throw new Error("played from hand");
      if (played.world.stats.guard !== before) throw new Error("stat changed");
    },
  );

  push("econ-place-twice", "A decoration cannot be placed twice", ["place", "duplication"], () => {
    const got = obtain(makeWorld(), defOf("dec.1"));
    const world = must(got.world, { type: "use", iid: got.iid, which: 0 });
    const again = step(world, { type: "use", iid: got.iid, which: 0 });
    if (again.ok) throw new Error("placed twice");
  });

  push("econ-buy-once", "Merchant stock is one instance", ["barter", "duplication"], () => {
    let world = makeWorld();
    seedScrip(world, "player", 20);
    const stock = seedInstance(world, "pro.1", "merchant", { reason: "probe-seed" });
    if (world.place !== STORE_SITE) world = must(world, { type: "travel", siteId: STORE_SITE });
    world = must(world, { type: "buy", iid: stock.iid });
    const again = step(world, { type: "buy", iid: stock.iid });
    if (again.ok) throw new Error("bought twice");
  });

  push(
    "econ-cook-without-fire",
    "Cook does not destroy food when the fire is out",
    ["cook", "economy"],
    () => {
      const got = obtain(makeWorld(), defOf("food.raw.0"));
      const result = step(got.world, { type: "use", iid: got.iid, which: 1 });
      if (result.ok) throw new Error("cooked without fire");
      if (result.world.instances[got.iid]?.custody !== "inventory") throw new Error("food lost");
    },
  );

  push(
    "econ-fuzz",
    "Two hundred random actions stay inside the value bound",
    ["economy", "duplication"],
    () => {
      const fuzz = runFuzz(200);
      if (!fuzz.ok) throw new Error(fuzz.detail);
    },
  );

  push("econ-return-alive", "The living cannot skip fourteen years", ["reincarnation"], () => {
    const result = step(makeWorld(), { type: "return" });
    if (result.ok) throw new Error("returned while alive");
    if (result.world.year !== 1998) throw new Error("year moved");
  });

  return cases;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runFuzz(steps: number): {
  ok: boolean;
  detail: string;
  actions: number;
  failures: number;
} {
  let world = makeWorld();
  seedScrip(world, "player", 30);
  seedScrip(world, "merchant", 30);
  const seeds = [
    "obj.nail.2",
    "obj.cord.2",
    "food.raw.4",
    "eq.feet.2",
    "card.orchard.3.0",
    "pro.2",
    "dec.2",
    "evi.4",
    "rel.1",
  ];
  for (const id of seeds) {
    const def = defOf(id);
    if (def.source.kind === "site") {
      seedInstance(world, id, "ground", { siteId: def.source.siteId, reason: "probe-seed" });
    }
  }
  seedInstance(world, "pro.1", "merchant", { reason: "probe-seed" });
  const rand = mulberry32(57);
  let failures = 0;
  for (let n = 0; n < steps; n++) {
    const action = randomAction(world, rand);
    const result = step(world, action);
    if (!result.ok) failures += 1;
    world = result.world;
    if (totalValue(world) > world.valueSeeded) {
      return {
        ok: false,
        detail: `step ${n} ${action.type} value ${totalValue(world)} > ${world.valueSeeded}`,
        actions: n + 1,
        failures,
      };
    }
    const dup = duplicateCreate(world);
    if (dup) return { ok: false, detail: `duplicate ${dup}`, actions: n + 1, failures };
  }
  return { ok: true, detail: `${steps} actions, ${failures} rejected`, actions: steps, failures };
}

function randomAction(world: World, rand: () => number): Parameters<typeof step>[1] {
  const ground = groundAt(world, world.place);
  const pack = inventory(world);
  const stock = merchantGoods(world);
  const roll = rand();
  if (roll < 0.15) {
    const site = SITES[Math.floor(rand() * SITES.length)]!.id;
    return { type: "travel", siteId: site };
  }
  if (roll < 0.3 && ground[0])
    return { type: "pickup", iid: ground[Math.floor(rand() * ground.length)]!.iid };
  if (roll < 0.45 && pack[0])
    return { type: "inspect", iid: pack[Math.floor(rand() * pack.length)]!.iid };
  if (roll < 0.7 && pack[0]) {
    const inst = pack[Math.floor(rand() * pack.length)]!;
    return { type: "use", iid: inst.iid, which: rand() < 0.5 ? 0 : 1 };
  }
  if (roll < 0.8 && pack[0] && stock[0] && world.place === STORE_SITE) {
    return {
      type: "barter",
      offerIid: pack[Math.floor(rand() * pack.length)]!.iid,
      stockIid: stock[Math.floor(rand() * stock.length)]!.iid,
    };
  }
  if (roll < 0.9 && world.alive) return { type: "die" };
  if (!world.alive) return { type: "return" };
  return { type: "travel", siteId: START_SITE };
}

export interface FrictionRun {
  id: string;
  events: number;
  noEffectActions: number;
  consecutiveSameMenu: number;
  menuReentries: number;
  pickupToUse: { item: string; between: number | null; inspects: number; travels: number }[];
}

export interface DiscoveryMeasure {
  actionsFromReadToCache: number;
  travelsAfterRead: number;
  cluesReadBeforeFind: number;
  noEffectActions: number;
}

function traceMetrics(
  world: World,
  pairs: { iid: string; item: string }[],
): FrictionRun["pickupToUse"] {
  return pairs.map(({ iid, item }) => {
    const pickupAt = world.trace.findIndex(
      (event) => event.ok && event.action === "pickup" && event.itemId === iid,
    );
    const useAt = world.trace.findIndex(
      (event, index) =>
        index > pickupAt &&
        event.ok &&
        (event.action === "use" || event.action === "equip") &&
        event.itemId === iid,
    );
    if (pickupAt < 0 || useAt < 0) {
      return { item, between: null, inspects: 0, travels: 0 };
    }
    const span = world.trace.slice(pickupAt + 1, useAt);
    return {
      item,
      between: span.length,
      inspects: span.filter((event) => event.action === "inspect").length,
      travels: span.filter((event) => event.action === "travel").length,
    };
  });
}

function summarize(id: string, world: World, pairs: { iid: string; item: string }[]): FrictionRun {
  let consecutive = 0;
  let reentries = 0;
  const seen = new Set<string>();
  for (let i = 0; i < world.trace.length; i++) {
    const prev = world.trace[i - 1];
    const cur = world.trace[i]!;
    if (prev && prev.menu === cur.menu) consecutive += 1;
    if (prev && prev.menu !== cur.menu && seen.has(cur.menu)) reentries += 1;
    seen.add(cur.menu);
  }
  return {
    id,
    events: world.trace.length,
    noEffectActions: world.trace.filter((event) => !event.ok).length,
    consecutiveSameMenu: consecutive,
    menuReentries: reentries,
    pickupToUse: traceMetrics(world, pairs),
  };
}

export function measureFocused(): {
  runs: FrictionRun[];
  discovery: DiscoveryMeasure;
  integratedOk: boolean;
  integratedDetail: string;
  touched: string[];
} {
  let world = initialPlay();
  const nail = groundAt(world, START_SITE).find((i) => i.defId === "obj.nail.0")!;
  const glove = groundAt(world, START_SITE).find((i) => i.defId === "eq.hands.0")!;
  world = must(world, { type: "pickup", iid: nail.iid, menu: "Field" });
  world = must(world, { type: "pickup", iid: glove.iid, menu: "Field" });
  world = must(world, { type: "inspect", iid: nail.iid, menu: "Pack" });
  world = must(world, { type: "use", iid: nail.iid, which: 0, menu: "Pack" });
  const find = summarize("find-inspect-use", world, [{ iid: nail.iid, item: "obj.nail.0" }]);

  let direct = initialPlay();
  const glove2 = groundAt(direct, START_SITE).find((i) => i.defId === "eq.hands.0")!;
  direct = must(direct, { type: "pickup", iid: glove2.iid, menu: "Field" });
  const nail2 = groundAt(direct, START_SITE).find((i) => i.defId === "obj.nail.0")!;
  direct = must(direct, { type: "pickup", iid: nail2.iid, menu: "Field" });
  direct = must(direct, { type: "inspect", iid: nail2.iid, menu: "Pack" });
  direct = must(direct, { type: "use", iid: nail2.iid, which: 0, menu: "Pack" });
  const gate = summarize("inspect-gate-only", direct, [{ iid: nail2.iid, item: "obj.nail.0" }]);

  let clue = initialPlay();
  clue = must(clue, { type: "travel", siteId: "goshen-bog", menu: "Field" });
  const letter = groundAt(clue, "goshen-bog").find((i) => i.defId === "evi.0")!;
  clue = must(clue, { type: "pickup", iid: letter.iid, menu: "Field" });
  clue = must(clue, { type: "inspect", iid: letter.iid, menu: "Board" });
  clue = must(clue, { type: "use", iid: letter.iid, which: 0, menu: "Board" });
  const readIndex = clue.trace.length - 1;
  clue = must(clue, { type: "travel", siteId: "weybridge-falls", menu: "Field" });
  clue = must(clue, { type: "use", iid: letter.iid, which: 1, menu: "Board" });
  clue = must(clue, { type: "search", cacheId: "cache.0", menu: "Board" });
  const afterRead = clue.trace.slice(readIndex + 1, clue.trace.length - 1);
  const discovery: DiscoveryMeasure = {
    actionsFromReadToCache: clue.trace.length - 1 - readIndex - 1,
    travelsAfterRead: afterRead.filter((event) => event.action === "travel").length,
    cluesReadBeforeFind: clue.knowledge.length,
    noEffectActions: clue.trace.filter((event) => !event.ok).length,
  };

  const integrated = runIntegrated();
  return {
    runs: [find, gate, integrated.friction],
    discovery,
    integratedOk: integrated.ok,
    integratedDetail: integrated.detail,
    touched: integrated.touched,
  };
}

function runIntegrated(): {
  ok: boolean;
  detail: string;
  touched: string[];
  friction: FrictionRun;
} {
  const touched = new Set<string>();
  try {
    let world = initialPlay();
    const take = (siteId: string, defId: string, menu = "Field") => {
      const inst = groundAt(world, siteId).find((i) => i.defId === defId);
      if (!inst) throw new Error(`missing ${defId} at ${siteId}`);
      world = must(world, { type: "pickup", iid: inst.iid, menu });
      touched.add(defId);
      return inst.iid;
    };
    const look = (iid: string, menu: string) => {
      world = must(world, { type: "inspect", iid, menu });
    };
    const nail = take(START_SITE, "obj.nail.0");
    const glove = take(START_SITE, "eq.hands.0");
    const tinder = take(START_SITE, "obj.tinder.0");
    const food0 = take(START_SITE, "food.raw.0");
    const press = take(START_SITE, "obj.press.0");
    const cord = take(START_SITE, "obj.cord.0");
    const tin = take(START_SITE, "obj.tin.0");
    const knife = take(START_SITE, "obj.knife.0");
    const key = take(START_SITE, "obj.key.0");
    const compass = take(START_SITE, "obj.compass.0");
    const rel0 = take(START_SITE, "rel.0");
    const rel12 = take(START_SITE, "rel.12");
    const boots = take(START_SITE, "eq.feet.0");
    look(nail, "Pack");
    world = must(world, { type: "use", iid: nail, which: 0, menu: "Pack" });
    if (world.instances[glove]?.condition !== 65)
      throw new Error(`glove condition ${world.instances[glove]?.condition}`);
    look(tinder, "Pack");
    world = must(world, { type: "use", iid: tinder, which: 0, menu: "Pack" });
    look(food0, "Pack");
    world = must(world, { type: "use", iid: food0, which: 1, menu: "Pack" });
    const cooked = inventory(world).find((i) => i.defId === "food.cooked.0");
    if (!cooked || world.fireTurns !== 3) throw new Error("cook failed");
    look(cooked.iid, "Pack");
    world = must(world, { type: "use", iid: cooked.iid, which: 0, menu: "Pack" });
    world = must(world, { type: "travel", siteId: STORE_SITE, menu: "Field" });
    const nail1 = take(STORE_SITE, "obj.nail.1");
    const food1 = take(STORE_SITE, "food.raw.1");
    const dec = take(STORE_SITE, "dec.1");
    look(press, "Pack");
    world = must(world, { type: "use", iid: press, which: 0, menu: "Pack" });
    if (!world.instances[food1]?.preserved) throw new Error("press missed");
    const stock = merchantGoods(world).find((i) => i.defId === "pro.1");
    if (!stock) throw new Error("no merchant salt");
    world = must(world, { type: "barter", offerIid: compass, stockIid: stock.iid, menu: "Store" });
    if (!inventory(world).some((i) => i.defId === "pro.1"))
      throw new Error("barter did not receive");
    touched.add("pro.1");
    world = must(world, { type: "travel", siteId: "goshen-bog", menu: "Field" });
    const letter = take("goshen-bog", "evi.0");
    look(letter, "Board");
    world = must(world, { type: "use", iid: letter, which: 0, menu: "Board" });
    world = must(world, { type: "travel", siteId: "weybridge-falls", menu: "Field" });
    world = must(world, { type: "use", iid: letter, which: 1, menu: "Board" });
    world = must(world, { type: "search", cacheId: "cache.0", menu: "Board" });
    const cached = inventory(world).find((i) => i.defId === "rel.24");
    if (!cached) throw new Error("cache empty");
    touched.add("rel.24");
    look(nail1, "Bench");
    world = must(world, { type: "use", iid: nail1, which: 1, menu: "Bench" });
    look(cord, "Bench");
    world = must(world, { type: "use", iid: cord, which: 1, menu: "Bench" });
    world = must(world, { type: "craft", recipeId: "recipe.eq.hands.1", menu: "Bench" });
    const crafted = inventory(world).find((i) => i.defId === "eq.hands.1");
    if (!crafted) throw new Error("craft failed");
    touched.add("eq.hands.1");
    look(crafted.iid, "Body");
    world = must(world, { type: "use", iid: crafted.iid, which: 0, menu: "Body" });
    if (!passGate(world, "grip")) throw new Error("crafted gloves did not open the gate");
    look(tin, "Bench");
    world = must(world, { type: "use", iid: tin, which: 1, menu: "Bench" });
    look(knife, "Bench");
    world = must(world, { type: "use", iid: knife, which: 1, menu: "Bench" });
    look(key, "Bench");
    world = must(world, { type: "use", iid: key, which: 1, menu: "Bench" });
    look(rel12, "Rooms");
    world = must(world, { type: "use", iid: rel12, which: 0, menu: "Rooms" });
    if (!world.instances[rel12]?.restored) throw new Error("not restored");
    world = must(world, { type: "travel", siteId: HOME_SITE, menu: "Field" });
    const cardA = take(HOME_SITE, "card.stone.1.0");
    const cardB = take(HOME_SITE, "card.river.2.0");
    look(cardA, "Deck");
    look(cardB, "Deck");
    world = must(world, { type: "use", iid: cardA, which: 0, menu: "Deck" });
    world = must(world, { type: "use", iid: cardB, which: 0, menu: "Deck" });
    world = must(world, { type: "use", iid: cardA, which: 1, menu: "Deck" });
    if (world.stats.guard < 1) throw new Error("cards did not score");
    if (world.instances[cardB]?.custody !== "deck") throw new Error("second card left the deck");
    look(dec, "Rooms");
    world = must(world, { type: "use", iid: dec, which: 0, menu: "Rooms" });
    world = must(world, { type: "use", iid: rel12, which: 1, menu: "Rooms" });
    if (world.effects.memory < 4) throw new Error("display effect missing");
    look(rel0, "Pack");
    world = must(world, { type: "use", iid: rel0, which: 0, menu: "Pack" });
    look(boots, "Body");
    world = must(world, { type: "equip", iid: boots, menu: "Body" });
    world = must(world, { type: "die", menu: "Years" });
    world = must(world, { type: "return", menu: "Years" });
    if (world.year !== 2012 || world.life !== 2 || world.age !== 14)
      throw new Error("wrong return");
    if (world.instances[rel0]?.custody !== "inventory" || world.instances[rel0]?.ownerLife !== 2)
      throw new Error("rel0 did not return");
    if (createsOf(world, rel0).length !== 1) throw new Error("rel0 duplicated");
    if (world.instances[rel12]?.custody !== "inventory" || createsOf(world, rel12).length !== 1)
      throw new Error("rel12 return");
    if (
      !world.knowledge.includes("evi.0") ||
      world.knowledge.filter((k) => k === "evi.0").length !== 1
    )
      throw new Error("knowledge");
    if (world.instances[dec]?.custody !== "placed") throw new Error("quilt gone");
    if (world.instances[boots]?.custody !== "corpse" || world.instances[food1]?.spoiled !== true)
      throw new Error("corpse");
    world = must(world, { type: "claim", iid: boots, menu: "Years" });
    world = must(world, { type: "claim", iid: food1, menu: "Years" });
    look(food1, "Pack");
    const health = world.stats.health;
    world = must(world, { type: "use", iid: food1, which: 0, menu: "Pack" });
    if (world.stats.health !== health - 6) throw new Error(`spoiled health ${world.stats.health}`);
    world = must(world, { type: "claim", iid: cached.iid, menu: "Years" });
    if (world.instances[cached.iid]?.ownerLife !== 2 || createsOf(world, cached.iid).length !== 1)
      throw new Error("cache claim");
    if (world.instances[cardA]?.custody !== "corpse")
      throw new Error("played card was not left on the body");
    if (world.instances[cardB]?.custody !== "estate")
      throw new Error("unplayed deck was not left at home");
    world = must(world, { type: "claim", iid: cardB, menu: "Years" });
    if (world.instances[cardB]?.ownerLife !== 2 || createsOf(world, cardB).length !== 1)
      throw new Error("deck claim");
    if (totalValue(world) > world.valueSeeded)
      throw new Error(`value ${totalValue(world)} > ${world.valueSeeded}`);
    if (duplicateCreate(world)) throw new Error(`duplicate ${duplicateCreate(world)}`);
    return {
      ok: true,
      detail:
        "Integrated run finished in 2012 with the same relic, letter, quilt, boots, and cache reward.",
      touched: [...touched],
      friction: summarize("integrated", world, [
        { iid: nail, item: "obj.nail.0" },
        { iid: crafted.iid, item: "eq.hands.1" },
      ]),
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      touched: [...touched],
      friction: {
        id: "integrated",
        events: 0,
        noEffectActions: 0,
        consecutiveSameMenu: 0,
        menuReentries: 0,
        pickupToUse: [],
      },
    };
  }
}

function slices(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

export function runCases(): CaseResult[] {
  const cases: CaseResult[] = [];
  const add = (category: Category, systems: string[]) => {
    slices(catalog.idsByCategory[category], 8).forEach((group, index) => {
      cases.push(
        runSlice(
          `${category}-${index + 1}`,
          `${category} ${index * 8 + 1}–${index * 8 + group.length}`,
          systems,
          group,
        ),
      );
    });
  };
  add("object", ["field", "use", "ownership"]);
  add("equipment", ["equip", "gate", "salvage"]);
  add("relic", ["restore-or-attest", "reincarnation"]);
  add("provision", ["consume", "fire"]);
  add("card", ["deck", "play"]);
  add("food", ["eat", "cook-or-compost"]);
  add("decoration", ["place", "estate"]);
  add("evidence", ["read", "cache"]);
  cases.push(...economyCases());
  const integrated = runIntegrated();
  cases.push({
    id: "play-integrated",
    title: "Find, craft, barter, cache, die, return",
    systems: ["field", "craft", "equip", "barter", "cache", "reincarnation"],
    ok: integrated.ok,
    failures: integrated.ok ? [] : [integrated.detail],
    touched: integrated.touched,
  });
  return cases;
}

export function sessionFriction(world: World): FrictionRun {
  const pairs: { iid: string; item: string }[] = [];
  const seen = new Set<string>();
  for (const event of world.trace) {
    if (!event.ok || event.action !== "pickup" || !event.itemId || seen.has(event.itemId)) continue;
    seen.add(event.itemId);
    pairs.push({ iid: event.itemId, item: world.instances[event.itemId]?.defId ?? event.itemId });
  }
  return summarize("session", world, pairs);
}

export interface CoverageReport {
  targetDefinitions: number;
  methodology: typeof METHODOLOGY;
  candidatePack: string;
  candidateItems: number;
  importedItems: number;
  importedPacks: { packId: string; path: string; items: number }[];
  missingPacks: string[];
  scannedPaths: string[];
  counts: { authored: number; implemented: number; demonstrated: number; verified: number };
  byCategory: Record<
    Category,
    { authored: number; implemented: number; demonstrated: number; verified: number }
  >;
  failures: Failure[];
  cases: { total: number; passed: number; failed: number };
  failedCases: { id: string; failures: string[] }[];
  economy: { ok: boolean; detail: string };
  friction: ReturnType<typeof measureFocused>;
  demonstratedGap: number;
  items: {
    id: string;
    name: string;
    category: Category;
    implemented: boolean;
    verified: boolean;
    demonstrated: boolean;
  }[];
}

export interface ValidatorSnapshot {
  scannedAt: string;
  importedItems: number;
  importedPacks: CoverageReport["importedPacks"];
  missingPacks: string[];
  scannedPaths: string[];
  counts: CoverageReport["counts"];
  byCategory: CoverageReport["byCategory"];
  cases: CoverageReport["cases"];
  failedCases: CoverageReport["failedCases"];
  economy: CoverageReport["economy"];
  friction: CoverageReport["friction"];
  demonstratedGap: number;
  failures: CoverageReport["failures"];
  methodology: CoverageReport["methodology"];
  items: CoverageReport["items"];
}

export function buildReport(scan?: {
  importedItems: number;
  importedPacks: { packId: string; path: string; items: number }[];
  missingPacks: string[];
  scannedPaths: string[];
  extraFailures?: Failure[];
}): CoverageReport {
  const results = catalog.items.map((item) => verifyItem(item));
  const cases = runCases();
  const demonstrated = new Set<string>();
  for (const item of cases) if (item.ok) for (const id of item.touched) demonstrated.add(id);
  const friction = measureFocused();
  if (friction.integratedOk) for (const id of friction.touched) demonstrated.add(id);
  const byCategory = {} as CoverageReport["byCategory"];
  for (const category of [
    "object",
    "equipment",
    "relic",
    "provision",
    "card",
    "food",
    "decoration",
    "evidence",
  ] as const) {
    const rows = results.filter((row) => row.category === category);
    byCategory[category] = {
      authored: rows.length,
      implemented: rows.filter((row) => row.implemented).length,
      demonstrated: rows.filter((row) => demonstrated.has(row.id)).length,
      verified: rows.filter((row) => row.verified).length,
    };
  }
  const failures = results.flatMap((row) => row.failures).concat(scan?.extraFailures ?? []);
  const economy = runFuzz(200);
  return {
    targetDefinitions: TARGET_DEFINITIONS,
    methodology: METHODOLOGY,
    candidatePack: catalog.version,
    candidateItems: catalog.items.length,
    importedItems: scan?.importedItems ?? 0,
    importedPacks: scan?.importedPacks ?? [],
    missingPacks: scan?.missingPacks ?? [],
    scannedPaths: scan?.scannedPaths ?? [],
    counts: {
      authored: catalog.items.length + (scan?.importedItems ?? 0),
      implemented: results.filter((row) => row.implemented).length,
      demonstrated: demonstrated.size,
      verified: results.filter((row) => row.verified).length,
    },
    byCategory,
    failures: failures.slice(0, 40),
    cases: {
      total: cases.length,
      passed: cases.filter((item) => item.ok).length,
      failed: cases.filter((item) => !item.ok).length,
    },
    failedCases: cases
      .filter((item) => !item.ok)
      .map((item) => ({ id: item.id, failures: item.failures.slice(0, 8) })),
    economy,
    friction,
    demonstratedGap: results.filter((row) => row.verified && !demonstrated.has(row.id)).length,
    items: results.map((row) => ({
      id: row.id,
      name: catalog.byId.get(row.id)?.name ?? row.id,
      category: row.category,
      implemented: row.implemented,
      verified: row.verified,
      demonstrated: demonstrated.has(row.id),
    })),
  };
}

export function auditLoose(raw: unknown): Failure[] {
  if (!raw || typeof raw !== "object") {
    return [
      fail(
        "?",
        "shape",
        "item is not an object",
        "Each pack item must be an object with id, category, uses, and source.",
      ),
    ];
  }
  const item = raw as Partial<ItemDef> & { uses?: { op?: string }[] };
  const id = typeof item.id === "string" ? item.id : "?";
  const out: Failure[] = [];
  if (typeof item.id !== "string")
    out.push(fail(id, "shape", "missing id", "Set a stable string id."));
  if (
    !item.category ||
    ![
      "object",
      "equipment",
      "relic",
      "provision",
      "card",
      "food",
      "decoration",
      "evidence",
    ].includes(item.category)
  ) {
    out.push(fail(id, "shape", "missing category", "Use one of the eight loot categories."));
  }
  if (!Array.isArray(item.uses) || item.uses.length < 2) {
    out.push(
      fail(
        id,
        "two-uses",
        "fewer than two uses",
        "Author two different uses and implement both handlers.",
      ),
    );
  }
  const ops = new Set<string>();
  for (const use of item.uses ?? []) {
    const op = use?.op ?? "?";
    ops.add(op);
    if (!HANDLED.has(op))
      out.push(fail(id, "handler", `no handler ${op}`, "Map the op onto perform() or delete it."));
  }
  if (item.category === "equipment" && (item.effectAmt ?? 0) < 10) {
    out.push(
      fail(
        id,
        "effect",
        "effectAmt below the gate",
        "Set effectAmt to at least 10 and equip through the gate.",
      ),
    );
  }
  if (item.category === "evidence" && (!ops.has("read") || !ops.has("present"))) {
    out.push(
      fail(
        id,
        "evidence",
        "letter is missing read or present",
        "Add both handlers and a real cache id.",
      ),
    );
  }
  if (item.category === "card" && (!ops.has("deck-add") || !ops.has("deck-play"))) {
    out.push(fail(id, "deck", "card is missing deck use", "Add deck-add and deck-play."));
  }
  if (item.category === "decoration" && !ops.has("place")) {
    out.push(fail(id, "place", "decoration has no placement", "Add a place handler."));
  }
  const source = item.source as { kind?: string; siteId?: string; cacheId?: string } | undefined;
  if (!source || !source.kind)
    out.push(fail(id, "source", "no source", "Declare site, merchant, recipe, cache, or cook."));
  if (source?.kind === "site" && !SITES.some((s) => s.id === source.siteId)) {
    out.push(fail(id, "source", `unknown site ${source.siteId ?? ""}`, "Use a real site id."));
  }
  if (source?.kind === "cache" && !catalog.cacheById.has(source.cacheId ?? "")) {
    out.push(
      fail(
        id,
        "source",
        `unknown cache ${source.cacheId ?? ""}`,
        "Point at a cache that exists, or do not ship the item.",
      ),
    );
  }
  return out;
}
