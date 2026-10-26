// @ts-nocheck
/**
 * PREINCARNATION — Sugar & Ash.
 * Public combat module. No homing. One protagonist. Puzzle seals are solid.
 *
 *   import { createWorld, createYard, step, enqueue, attune } from ".../src/index.js";
 */
export { COSTS, LIMITS, isReduced, multCapOf, projectileCapOf } from "./constants.js";
export { ABILITY_RECORDS, COMBINATIONS, recordsDocument } from "./records.js";
export { HANDLERS } from "./abilities.js";
export {
  addActor,
  addAnchor,
  addBlocker,
  addSeal,
  addWall,
  applyStatus,
  bloomBlossom,
  anchorAccessible,
  createWorld,
  cutTether,
  dealDamage,
  ellisOf,
  getActor,
  linkActors,
  plantBlossom,
  plantMark,
  spawnProjectile,
  updateAwareness,
} from "./state.js";
export { attune, chooseWeave, enqueue, releaseBrace, resolveVerb, run, step } from "./step.js";
export { createYard, YARD } from "./map.js";

import { ABILITY_RECORDS, COMBINATIONS, recordsDocument } from "./records.js";
import { HANDLERS } from "./abilities.js";

export function listAbilities() {
  return ABILITY_RECORDS.map((r) => ({
    id: r.id,
    name: r.name,
    discipline: r.discipline,
    capstone: r.capstone,
    featured: r.featured,
  }));
}

export function getAbility(id) {
  return ABILITY_RECORDS.find((r) => r.id === id) ?? null;
}

export function assertCatalog() {
  const ids = ABILITY_RECORDS.map((r) => r.id);
  const missing = ids.filter((id) => !HANDLERS[id]);
  const extra = Object.keys(HANDLERS).filter((id) => !ids.includes(id));
  if (missing.length || extra.length) {
    throw new Error(`catalog drift missing=${missing.join(",")} extra=${extra.join(",")}`);
  }
  const sugar = ABILITY_RECORDS.filter((r) => r.discipline === "sugar");
  const ash = ABILITY_RECORDS.filter((r) => r.discipline === "ash");
  if (sugar.length !== 12 || ash.length !== 12) throw new Error("expected 12 + 12");
  if (sugar.filter((r) => r.capstone).length !== 2) throw new Error("sugar capstones");
  if (ash.filter((r) => r.capstone).length !== 2) throw new Error("ash capstones");
  if (COMBINATIONS.length < 4) throw new Error("combinations");
  return true;
}

export function snapshot(world) {
  return {
    time: world.time,
    sap: world.resources.sap,
    ember: world.resources.ember,
    lastLine: world.lastLine,
    attune: { ...world.attune },
    projectiles: world.projectiles.map((p) => ({
      id: p.id,
      kind: p.kind,
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      homing: p.homing,
      steering: p.steering,
    })),
    tethers: world.tethers.filter((t) => t.alive).map((t) => ({ ...t })),
    blossoms: world.blossoms.filter((b) => b.alive).map((b) => ({ id: b.id, x: b.x, y: b.y, armed: b.armed })),
    marks: world.marks.filter((m) => m.alive).length,
    actors: world.actors.map((a) => ({
      id: a.id,
      hp: a.hp,
      alive: a.alive,
      x: a.x,
      y: a.y,
      wreath: a.wreath,
      onScreen: a.onScreen,
      boss: a.boss,
    })),
    events: world.events.slice(),
    telegraphs: world.telegraphs.map((t) => t.kind),
  };
}

export { recordsDocument as abilityDocument };
