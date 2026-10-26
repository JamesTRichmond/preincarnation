import { HOLD_SECONDS, PRESS_RESOURCES, baseProfile, emptyResources } from "./effects.ts";
import type {
  ActionProfile,
  ArenaWorld,
  BeginResult,
  Channel,
  EffectId,
  MasteryObject,
  Op,
  PendingAction,
  ResolveResult,
  ResourceId,
  ResourceMap,
} from "./types.ts";

export const BINDING_CAP = 2;

const NUMERIC: Channel[] = [
  "radius",
  "reach",
  "windup",
  "cooldown",
  "duration",
  "distance",
  "damageMul",
  "speedMul",
  "chargeThreshold",
  "chargeRate",
  "statusBurn",
  "statusSlow",
  "selfSlow",
  "knockback",
  "iFrames",
  "heal",
  "lightOuter",
  "lightInner",
  "lightRear",
  "surveyRadius",
];

const STRING_CHANNELS: Channel[] = ["pattern", "lightShape", "targetFilter"];

const COVERAGE: Record<string, number> = {
  plus: 5,
  single: 1,
  line3: 3,
  "forward-cut": 1,
  circle: 1,
  line: 1,
  radial: 1,
  cone: 0.55,
  wide: 0.8,
  low: 0.7,
  "narrow-cone": 0.35,
  "rear-cone": 0.4,
  shot: 1,
  split2: 2,
  splash: 1,
  "forward-phase": 1,
  sidestep: 1,
  blink: 1,
  "water-step": 1,
  point: 1,
  drink: 1,
  block: 1,
  "warp-home": 1,
  "posts-only": 1,
};

export function stackPositive(values: number[]): number {
  const ordered = values.filter((value) => value > 0).sort((a, b) => b - a);
  let total = 0;
  let weight = 1;
  for (const value of ordered) {
    total += value * weight;
    weight *= 0.5;
  }
  return total;
}

/** Penalties stack in full. Bonuses diminish: 100%, 50%, 25%... */
export function stackSigned(values: number[]): number {
  const penalty = values.filter((value) => value < 0).reduce((sum, value) => sum + value, 0);
  return penalty + stackPositive(values);
}

export function itemApplies(item: MasteryObject, effectId: EffectId, world: ArenaWorld): boolean {
  if (!item.compatibleEffects.includes(effectId)) return false;
  return opsFor(item, effectId, world).length > 0;
}

function whenMatches(item: MasteryObject, world: ArenaWorld): boolean {
  if (!item.when) return true;
  if (item.when.mapId && world.mapId !== item.when.mapId) return false;
  if (item.when.minHp != null && world.hp < item.when.minHp) return false;
  if (item.when.inWater != null && world.inWater !== item.when.inWater) return false;
  return true;
}

export function opsFor(item: MasteryObject, effectId: EffectId, world: ArenaWorld): Op[] {
  const chosen = whenMatches(item, world) ? item.ops : item.elseOps;
  return chosen.filter((op) => op.effect === effectId);
}

function activeItems(items: MasteryObject[], effectId: EffectId, world: ArenaWorld): MasteryObject[] {
  return items.filter((item) => itemApplies(item, effectId, world) && opsFor(item, effectId, world).length > 0);
}

export function resourceLoop(items: MasteryObject[], effectId: EffectId): string | null {
  const spent = new Set<ResourceId>(PRESS_RESOURCES[effectId] ?? []);
  const gained = new Set<ResourceId>();
  if (effectId === "action.bow") spent.add("arrows");
  if (effectId === "action.sip") gained.add("hp");
  if (effectId === "action.slash" || effectId === "action.smash") {
    /* hitEnemy does not refund hp unless a weapon affix says lifesteal. This pack does not grant lifesteal. */
  }
  for (const item of items) {
    if (!item.compatibleEffects.includes(effectId)) continue;
    if (item.extraCost && (item.extraCost.amount > 0)) spent.add(item.extraCost.id);
    for (const grant of item.grants) {
      if (grant.amount > 0) gained.add(grant.id);
    }
    const heals = item.ops.concat(item.elseOps).some((op) => op.effect === effectId && op.channel === "heal" && op.mode === "add" && Number(op.value) > 0);
    if (heals) gained.add("hp");
    const spendsHp = item.extraCost?.id === "hp";
    if (heals && spendsHp) return "hp heal paid with hp";
  }
  for (const resource of spent) {
    if (gained.has(resource)) return resource;
  }
  return null;
}

function conflictReason(items: MasteryObject[], effectId: EffectId, world: ArenaWorld): string | null {
  if (items.length > BINDING_CAP) return `Binding cap is ${BINDING_CAP}. Existing loadout only — no new slot.`;
  const loop = resourceLoop(items, effectId);
  if (loop) return `Resource loop on ${loop}. A fitting may not refund what this action spends.`;
  const applying = activeItems(items, effectId, world);
  const groups = new Map<string, string>();
  for (const item of applying) {
    if (!item.exclusivityGroup) continue;
    const prior = groups.get(item.exclusivityGroup);
    if (prior) return `${item.name} and ${prior} both claim ${item.exclusivityGroup}.`;
    groups.set(item.exclusivityGroup, item.name);
  }
  const sets = new Map<string, { name: string; value: string }>();
  for (const item of applying) {
    for (const op of opsFor(item, effectId, world)) {
      if (op.mode !== "set") continue;
      const key = op.channel;
      const value = String(op.value);
      const prior = sets.get(key);
      if (prior && prior.value !== value) return `${item.name} and ${prior.name} set ${key} differently.`;
      if (prior && prior.value === value) return `${item.name} duplicates ${prior.name} on ${key}.`;
      sets.set(key, { name: item.name, value });
    }
  }
  return null;
}

function readNumber(profile: ActionProfile, channel: Channel): number {
  return profile[channel as keyof ActionProfile] as number;
}

function writeNumber(profile: ActionProfile, channel: Channel, value: number) {
  (profile as unknown as Record<string, number>)[channel] = value;
}

function applyNumeric(profile: ActionProfile, channel: Channel, ops: Op[], priorBurn: number) {
  const sets = ops.filter((op) => op.mode === "set");
  if (sets.length === 1) writeNumber(profile, channel, Number(sets[0].value));
  const adds = ops.filter((op) => op.mode === "add").map((op) => Number(op.value));
  if (channel === "statusBurn" && priorBurn > 0) adds.push(priorBurn);
  if (adds.length) writeNumber(profile, channel, readNumber(profile, channel) + stackSigned(adds));
  const muls = ops.filter((op) => op.mode === "mul").map((op) => Number(op.value));
  if (muls.length) {
    let penalty = 1;
    const bonuses: number[] = [];
    for (const factor of muls) {
      if (factor >= 1) bonuses.push(factor - 1);
      else penalty *= factor;
    }
    const next = readNumber(profile, channel) * penalty * (1 + stackPositive(bonuses));
    writeNumber(profile, channel, next);
  }
}

function derive(profile: ActionProfile, world: ArenaWorld) {
  if (profile.effectId === "action.bow" && !profile.blocked) {
    profile.power = Math.min(1, profile.chargeRate * HOLD_SECONDS);
    profile.speed = (160 + profile.power * 140) * profile.speedMul;
    if (profile.power < profile.chargeThreshold || world.arrows < 1) {
      profile.fizzle = true;
      profile.spent.arrows = 0;
      profile.blockReason = world.arrows < 1 ? "No arrows." : "Draw did not reach the release threshold.";
      profile.damage = 0;
    } else {
      profile.fizzle = false;
      profile.blockReason = null;
      profile.spent.arrows = 1;
      profile.damage = 1.3 * (0.7 + profile.power) * (1 + world.edge * 0.1) * profile.damageMul;
    }
  } else if (!profile.blocked) {
    profile.damage *= profile.damageMul;
    profile.speed *= profile.speedMul;
  }
  if (profile.effectId === "action.hook") {
    profile.distance = profile.speed * profile.duration;
  }
  if (profile.effectId === "action.sip") {
    profile.grants.hp = profile.heal;
  }
  profile.coverage = COVERAGE[profile.pattern] ?? profile.coverage;
  if (profile.targetFilter === "posts-only") profile.targetCount = 1;
  if (profile.pattern === "split2") profile.coverage = 2;
  profile.radius = Math.max(0, profile.radius);
  profile.reach = Math.max(0, profile.reach);
  profile.windup = Math.max(0, profile.windup);
  profile.distance = Math.max(0, profile.distance);
  profile.iFrames = Math.max(0, profile.iFrames);
  profile.lightOuter = Math.max(0, profile.lightOuter);
  profile.lightInner = Math.max(0, profile.lightInner);
  if (profile.cooldown < 0) profile.cooldown = 0;
}

function extraAffordable(items: MasteryObject[], effectId: EffectId, world: ArenaWorld, profile: ActionProfile): string | null {
  const need = emptyResources();
  for (const resource of PRESS_RESOURCES[effectId] ?? []) need[resource] += profile.spent[resource];
  for (const item of activeItems(items, effectId, world)) {
    if (!item.extraCost) continue;
    need[item.extraCost.id] += item.extraCost.amount;
  }
  if (need.mp > world.mp + 1e-9) return "Not enough mp for the fitting and the tool together.";
  if (need.arrows > world.arrows) return "Not enough arrows.";
  if (need.bombs > world.bombs) return "Not enough powder kegs.";
  if (need.hp > 0 && world.hp - need.hp < 0.25) return "The fitting's blood cost would drop you under a quarter heart.";
  if (need.bottle > 0 && !world.bottles.some((bottle) => bottle !== "empty")) return "No bottles.";
  return null;
}

export function resolveAction(effectId: EffectId, items: MasteryObject[], world: ArenaWorld): ResolveResult {
  const reason = conflictReason(items, effectId, world);
  if (reason) {
    const code = reason.startsWith("Binding cap") ? "cap" : reason.startsWith("Resource loop") ? "loop" : "incompatible";
    return { ok: false, reason, code };
  }
  const profile = baseProfile(effectId, world);
  const applying = profile.blocked ? [] : activeItems(items, effectId, world);
  if (!profile.blocked && applying.length) {
    const afford = extraAffordable(items, effectId, world, profile);
    if (afford) {
      profile.blocked = true;
      profile.blockReason = afford;
      profile.spent = emptyResources();
      profile.grants = emptyResources();
      profile.flags = { lanternOn: false, quarryOpen: false, excavated: false, eroded: false, tileOpened: false };
      profile.fizzle = false;
      return { ok: true, profile, activeIds: applying.map((item) => item.id) };
    }
    const byChannel = new Map<Channel, Op[]>();
    for (const item of applying) {
      for (const op of opsFor(item, effectId, world)) {
        const list = byChannel.get(op.channel) ?? [];
        list.push(op);
        byChannel.set(op.channel, list);
      }
    }
    for (const channel of STRING_CHANNELS) {
      const ops = byChannel.get(channel);
      if (!ops?.length) continue;
      const set = ops.find((op) => op.mode === "set");
      if (set) (profile as unknown as Record<string, string>)[channel] = String(set.value);
    }
    for (const channel of NUMERIC) {
      const ops = byChannel.get(channel);
      if (!ops?.length) continue;
      applyNumeric(profile, channel, ops, channel === "statusBurn" ? world.priorBurn : 0);
    }
    if (world.priorBurn > 0 && !byChannel.has("statusBurn") && (effectId === "action.slash" || effectId === "action.smash" || effectId === "action.bow")) {
      profile.statusBurn = world.priorBurn;
    }
    for (const item of applying) {
      if (item.extraCost) profile.spent[item.extraCost.id] += item.extraCost.amount;
      if (item.selfHarmIfInside > 0 && world.insideBlast) profile.resolveHarm += item.selfHarmIfInside;
      for (const grant of item.grants) profile.grants[grant.id] += grant.amount;
    }
    derive(profile, world);
  } else if (!profile.blocked && world.priorBurn > 0 && (effectId === "action.slash" || effectId === "action.bow" || effectId === "action.smash")) {
    profile.statusBurn = world.priorBurn;
  }
  return { ok: true, profile, activeIds: applying.map((item) => item.id) };
}

export function cloneWorld(world: ArenaWorld): ArenaWorld {
  return structuredClone(world);
}

function consumeBottle(world: ArenaWorld) {
  const index = world.bottles.findIndex((bottle) => bottle !== "empty");
  if (index >= 0) world.bottles[index] = "empty";
}

export function applyPress(world: ArenaWorld, spent: ResourceMap) {
  world.mp -= spent.mp;
  world.bombs -= spent.bombs;
  world.hp -= spent.hp;
  world.karma -= spent.karma;
  if (spent.bottle) consumeBottle(world);
}

export function applyResolve(world: ArenaWorld, profile: ActionProfile) {
  if (profile.blocked) return;
  world.arrows -= profile.spent.arrows;
  world.hp += profile.grants.hp;
  world.hp -= profile.resolveHarm;
  world.mp = Math.min(world.maxMp, world.mp + profile.grants.mp);
  if (profile.flags.lanternOn) world.lanternOn = true;
  if (profile.flags.quarryOpen) world.quarryOpen = true;
  if (profile.flags.excavated) world.excavated = true;
  if (profile.flags.tileOpened) world.tileOpened = true;
}

function pressPortion(_effectId: EffectId, spent: ResourceMap): ResourceMap {
  return {
    mp: spent.mp,
    arrows: 0,
    bombs: spent.bombs,
    hp: spent.hp,
    karma: spent.karma,
    bottle: spent.bottle,
  };
}

export function beginAction(effectId: EffectId, items: MasteryObject[], world: ArenaWorld): BeginResult {
  const result = resolveAction(effectId, items, world);
  if (!result.ok) return { phase: "resolved", result, world: cloneWorld(world) };
  const next = cloneWorld(world);
  if (result.profile.blocked) return { phase: "resolved", result, world: next };
  const press = pressPortion(effectId, result.profile.spent);
  applyPress(next, press);
  if (result.profile.windup > 1e-6) {
    const pending: PendingAction = {
      phase: "winding",
      effectId,
      items,
      preWorld: cloneWorld(world),
      world: next,
      pressSpent: press,
      windup: result.profile.windup,
    };
    return { phase: "winding", pending, preview: result };
  }
  applyResolve(next, result.profile);
  return { phase: "resolved", result, world: next };
}

export function stripAndFinish(pending: PendingAction, removeId: string): { result: ResolveResult; world: ArenaWorld } {
  const items = pending.items.filter((item) => item.id !== removeId);
  const preview = resolveAction(pending.effectId, items, pending.preWorld);
  const world = cloneWorld(pending.world);
  if (!preview.ok) return { result: preview, world };
  const profile = preview.profile;
  const pressKeys: ResourceId[] = ["mp", "bombs", "hp", "karma", "bottle"];
  for (const key of pressKeys) profile.spent[key] = pending.pressSpent[key];
  applyResolve(world, profile);
  return { result: { ok: true, profile, activeIds: preview.activeIds }, world };
}

export function shapeView(profile: ActionProfile) {
  return {
    blocked: profile.blocked,
    fizzle: profile.fizzle,
    radius: round(profile.radius),
    reach: round(profile.reach),
    windup: round(profile.windup),
    cooldown: round(profile.cooldown),
    duration: round(profile.duration),
    distance: round(profile.distance),
    damage: round(profile.damage),
    speed: round(profile.speed),
    chargeThreshold: round(profile.chargeThreshold),
    chargeRate: round(profile.chargeRate),
    pattern: profile.pattern,
    lightShape: profile.lightShape,
    targetFilter: profile.targetFilter,
    targetCount: profile.targetCount,
    statusBurn: round(profile.statusBurn),
    statusSlow: round(profile.statusSlow),
    selfSlow: round(profile.selfSlow),
    knockback: round(profile.knockback),
    iFrames: round(profile.iFrames),
    heal: round(profile.heal),
    lightOuter: round(profile.lightOuter),
    lightInner: round(profile.lightInner),
    lightRear: round(profile.lightRear),
    surveyRadius: round(profile.surveyRadius),
    coverage: round(profile.coverage),
    lanternOn: profile.flags.lanternOn,
    quarryOpen: profile.flags.quarryOpen,
    excavated: profile.flags.excavated,
    eroded: profile.flags.eroded,
    tileOpened: profile.flags.tileOpened,
  };
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function shapesEqual(a: ActionProfile, b: ActionProfile): boolean {
  return JSON.stringify(shapeView(a)) === JSON.stringify(shapeView(b));
}
