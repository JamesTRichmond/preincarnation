import type { World } from "./types.ts";

/** Tick-driven consequences that are part of the effect system, not lore. */
export function settle(world: World): void {
  for (const chance of world.opportunities) {
    if (chance.localTicks > 0) continue;
    if (!chance.pendingLoss) continue;
    if (chance.tag === "last-june" && world.flags["june.stable"] === true) {
      chance.available = true;
      chance.lost = false;
      chance.pendingLoss = false;
      chance.sealedIn = "";
      continue;
    }
    chance.lost = true;
    chance.available = false;
    chance.pendingLoss = false;
    chance.sealedIn = "";
  }

  const chalkUntil = world.flags["chalk.untilTick"];
  const chalkId = world.flags["chalk.boundary"];
  if (typeof chalkUntil === "number" && world.tick >= chalkUntil && typeof chalkId === "string") {
    const bound = world.boundaries.find((entry) => entry.id === chalkId);
    if (bound && bound.class === "survey-mark") bound.readable = false;
    world.flags["chalk.untilTick"] = false;
    world.flags["chalk.boundary"] = "";
  }

  const inkTick = world.flags["ink.returnTick"];
  const inkId = world.flags["ink.boundary"];
  if (typeof inkTick === "number" && world.tick >= inkTick && typeof inkId === "string") {
    const bound = world.boundaries.find((entry) => entry.id === inkId);
    if (bound && bound.class === "survey-mark" && world.flags[`inked.${bound.id}`] === true) {
      bound.readable = true;
      bound.notch = bound.originNotch;
      world.flags[`inked.${bound.id}`] = false;
    }
    world.flags["ink.returnTick"] = false;
    world.flags["ink.boundary"] = "";
  }

  if (world.flags["ash.untilDawn"] === true && world.tick > flagNum(world, "ash.dawnTick")) {
    world.actor.cannotSayOwnName = false;
    world.flags["ash.untilDawn"] = false;
  }

  if (world.flags["sound.nightUntil"] === true) {
    /* boolean lock stored separately */
  }
  const nightUntil = world.flags["sound.nightUntilTick"];
  if (typeof nightUntil === "number" && world.tick >= nightUntil) {
    world.flags["sound.nightLock"] = false;
  }
}

function flagNum(world: World, key: string): number {
  const value = world.flags[key];
  return typeof value === "number" ? value : 0;
}

export function advance(world: World, ticks = 1): World {
  const next = structuredClone(world);
  for (const chance of next.opportunities) {
    if (chance.localTicks > 0) chance.localTicks = Math.max(0, chance.localTicks - ticks);
  }
  next.tick += ticks;
  settle(next);
  if (next.flags["maeve.absent"] === true && ticks > 0) {
    const maeve = next.people.find((person) => person.id === "maeve");
    if (maeve) maeve.present = true;
    next.flags["maeve.absent"] = false;
  }
  next.log.push(`Time moves ${ticks}.`);
  return next;
}
