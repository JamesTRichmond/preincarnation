import { applyOp, type FxCtx } from "./effects.ts";
import { getGadget } from "./catalog.ts";
import { ID } from "./ids.ts";
import {
  ActionFail,
  type ActionResult,
  type Args,
  type Gadget,
  type Store,
  type World,
} from "./types.ts";
import { findKit } from "./world.ts";

function clone(world: World): World {
  return structuredClone(world);
}

function finish(world: World, ok: boolean, code: string, proofs: string[], notes: string[]): ActionResult {
  return { ok, code, proofs, notes, world };
}

function run(
  world0: World,
  lootId: string,
  body: (ctx: { world: World; self: NonNullable<ReturnType<typeof findKit>>; g: Gadget }) => void,
): ActionResult {
  const g = getGadget(lootId);
  if (!g) return finish(world0, false, "UNKNOWN_ITEM", [], [`No gadget ${lootId}.`]);
  const world = clone(world0);
  const self = findKit(world, lootId);
  if (!self) return finish(world0, false, "NOT_IN_KIT", [], [`${g.name} is not in the kit.`]);
  const proofs: string[] = [];
  const notes: string[] = [];
  try {
    body({ world, self, g });
    return finish(world, true, "OK", proofs, notes);
  } catch (err) {
    if (err instanceof ActionFail) {
      return finish(err.commit ? world : world0, false, err.code, proofs, [err.message]);
    }
    throw err;
  }
}

export function perform(world0: World, lootId: string, useId: "a" | "b", args: Args = {}): ActionResult {
  const g0 = getGadget(lootId);
  if (!g0) return finish(world0, false, "UNKNOWN_ITEM", [], [`No gadget ${lootId}.`]);
  const use = g0.uses.find((u) => u.id === useId);
  if (!use) return finish(world0, false, "NO_USE", [], ["That action is not on this piece."]);
  const proofs: string[] = [];
  const notes: string[] = [];
  const world = clone(world0);
  const self = findKit(world, lootId);
  if (!self) return finish(world0, false, "NOT_IN_KIT", [], [`${g0.name} is not in the kit.`]);
  try {
    if (self.condition <= 0) throw new ActionFail("BROKEN", `${g0.name} is spent. Restore it or salvage it.`);
    if (g0.storage.dampSensitive && world.weather.wet && self.stored !== "tin" && !self.sealed) {
      throw new ActionFail("DAMP", `${g0.name} is damp-sensitive and not in a tin. Dry it or case it.`);
    }
    if (g0.storage.crushSensitive && self.stored === "pack" && world.flags.packHeavy === true) {
      throw new ActionFail("CRUSH", `${g0.name} is under a heavy pack load.`);
    }
    if (use.verb === "display") {
      if (world.shelf.includes(self.lootId)) throw new ActionFail("ALREADY_SHELVED", `${g0.name} is already on the shelf.`);
      if (world.shelf.length >= 4) throw new ActionFail("SHELF_FULL", "The study shelf holds four pieces.");
    }
    const ctx: FxCtx = { world, self, op: use.ops[0]!, args, proofs, notes };
    for (const op of use.ops) {
      ctx.op = op;
      applyOp(ctx);
    }
    self.condition = Math.max(0, self.condition - g0.wear);
    if (use.verb === "display" && !world.shelf.includes(self.lootId)) {
      world.shelf.push(self.lootId);
      self.stored = "shelf";
    }
    return finish(world, true, "OK", proofs, notes);
  } catch (err) {
    if (err instanceof ActionFail) {
      return finish(err.commit ? world : world0, false, err.code, proofs, [err.message]);
    }
    throw err;
  }
}

export function displayItem(world0: World, lootId: string): ActionResult {
  return run(world0, lootId, ({ world, self, g }) => {
    if (world.shelf.includes(self.lootId)) throw new ActionFail("ALREADY_SHELVED", `${g.name} is already displayed.`);
    if (world.shelf.length >= 4) throw new ActionFail("SHELF_FULL", "The study shelf holds four pieces.");
    world.shelf.push(self.lootId);
    self.stored = "shelf";
    const note = `Displayed: ${g.storage.display}`;
    world.log.push(note);
  });
}

export function tradeItem(world0: World, lootId: string): ActionResult {
  return run(world0, lootId, ({ world, self, g }) => {
    if (g.tradeRefuse) throw new ActionFail("HEIRLOOM", g.tradeRefuse);
    world.merchant.credit += g.tradeCredit;
    world.kit = world.kit.filter((k) => k.lootId !== self.lootId);
    world.shelf = world.shelf.filter((id) => id !== self.lootId);
    const note = `Sold ${g.name} for ${g.tradeCredit} credit.`;
    world.log.push(note);
  });
}

export function stowItem(world0: World, lootId: string, store: Store): ActionResult {
  return run(world0, lootId, ({ world, self, g }) => {
    if (store === "tin" && !g.storage.canTin) throw new ActionFail("NO_TIN", `${g.name} has no tin.`);
    if (store === "shelf") throw new ActionFail("USE_DISPLAY", "Use display to put a piece on the shelf.");
    world.shelf = world.shelf.filter((id) => id !== self.lootId);
    self.stored = store;
    if (store === "tin") self.sealed = true;
    if (store !== "tin") self.sealed = false;
    world.log.push(`${g.name} stowed in ${store}.`);
  });
}

export function restoreItem(world0: World, lootId: string): ActionResult {
  return run(world0, lootId, ({ world, self, g }) => {
    const job = g.restore;
    if (!job) throw new ActionFail("NO_RESTORE", `${g.name} cannot be restored. Salvage is the honest end.`);
    if (job.requireFlag && !gateOpen(g, world)) {
      throw new ActionFail(job.requireFlag === "bookDisplayed" ? "NO_MEMORY" : "NEED_CUP", job.note);
    }
    for (const [mat, n] of Object.entries(job.need ?? {})) {
      if ((world.materials[mat] ?? 0) < n) {
        throw new ActionFail("NEED_MATERIAL", `Restore needs ${n} ${mat}.`);
      }
    }
    for (const [mat, n] of Object.entries(job.need ?? {})) {
      world.materials[mat] = (world.materials[mat] ?? 0) - n;
    }
    self.condition = job.to ?? 100;
    if (!self.mods.includes("restored")) self.mods.push("restored");
    if (world.flags.fineAid === true) {
      if (!self.mods.includes("loupe-helped")) self.mods.push("loupe-helped");
      world.flags.fineAid = false;
    }
    world.log.push(job.note);
  });
}

function gateOpen(g: Gadget, world: World): boolean {
  const flag = g.restore?.requireFlag;
  if (!flag) return true;
  if (world.flags[flag] === true) return true;
  if (g.id === ID.recorder && world.places.pot?.clean === true) return true;
  return false;
}

export function salvageItem(world0: World, lootId: string): ActionResult {
  return run(world0, lootId, ({ world, self, g }) => {
    const job = g.salvage;
    if (!job) throw new ActionFail("NO_SALVAGE", `${g.name} does not break down into parts.`);
    if (self.condition > 15) throw new ActionFail("NOT_SPENT", "Salvage a ruined piece only (condition 15 or under).");
    for (const [mat, n] of Object.entries(job.yield ?? {})) {
      world.materials[mat] = (world.materials[mat] ?? 0) + n;
    }
    world.kit = world.kit.filter((k) => k.lootId !== self.lootId);
    world.shelf = world.shelf.filter((id) => id !== self.lootId);
    world.log.push(job.note);
  });
}
