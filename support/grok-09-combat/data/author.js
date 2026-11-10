import { REFERENCE_UNITS as U } from "../reference/units.js";

export const FOOL_FRONT = { x: 120, y: 116 };
export const FAIR_START = { x: 120, y: 152 };
export const HOME = { x: 120, y: 88 };

export function tools(map) {
  const out = {};
  for (const id of U.tools) {
    const value = map[id];
    if (!value) throw new Error(`Missing tool ${id}`);
    out[id] = typeof value === "string" ? { effect: "none", note: value } : value;
  }
  return out;
}

export function forms(map) {
  const out = {};
  for (const id of U.forms) {
    const value = map[id];
    if (!value) throw new Error(`Missing form ${id}`);
    out[id] = typeof value === "string" ? { notes: value } : value;
  }
  return out;
}

export function anim(id, frames, read, loop = false) {
  return { id, frames, loop, read };
}

export function meleeAttack(damage = 1, extra = {}) {
  return {
    kind: "melee",
    damage,
    active: 6,
    knockback_px: 10,
    blockable: true,
    shape: { ox: 24, along: 18, across: 14 },
    ...extra,
  };
}

export function chargeAttack(damage = 2, extra = {}) {
  return {
    kind: "charge",
    damage,
    active: 28,
    charge_speed: 2.2,
    blockable: true,
    knockback_px: 12,
    shape: { across: 14 },
    ...extra,
  };
}

export function shotAttack(damage = 1) {
  return {
    kind: "projectile",
    damage,
    active: 1,
    speed: 1.45,
    lifetime: 48,
    knockback_px: 6,
    blockable: true,
    shape: { ox: 12, along: 8, across: 8 },
  };
}

export function finish(def) {
  const ids = new Set(def.states.map((state) => state.id));
  if (!ids.has("hyperarmor")) {
    def.states.push({
      id: "hyperarmor",
      kind: "hyperarmor",
      frames: 24,
      move: { type: "flee", speed: 0.35 },
      on_done: def.return_state,
      anim: "hyperarmor",
    });
  }
  if (!ids.has("dead")) def.states.push({ id: "dead", kind: "dead", frames: null, anim: "death" });
  if (!ids.has("spared"))
    def.states.push({ id: "spared", kind: "spared", frames: null, anim: "spare" });
  if (!def.spawn)
    def.spawn = { enemy: { x: 120, y: 88 }, ellis: { x: 120, y: 152 }, facing: def.facing || "S" };
  if (!def.stats.contact_damage) def.stats.contact_damage = 0;
  if (!def.detection.lose_px) def.detection.lose_px = 180;
  if (!def.detection.forget_frames) def.detection.forget_frames = 90;
  if (!def.detection.hearing_px) def.detection.hearing_px = 16;
  if (def.detection.los == null) def.detection.los = false;
  return def;
}

export function life({ death, spare, ages = 1 }) {
  return {
    room_reset: "restore_hp_and_initial_if_alive",
    on_death: death,
    on_spare: spare,
    on_ellis_death: "increment_life_and_age",
    ages_after_lives: ages,
  };
}
