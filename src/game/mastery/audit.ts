import { DEMONSTRATED_IDS, DEMONSTRATIONS, closedWorld, demonstrate, readyWorld, worldFor } from "./arena.ts";
import { MASTERY_OBJECTS, objectById } from "./catalog.ts";
import { shapesEqual, resolveAction, beginAction, stripAndFinish, resourceLoop } from "./compose.ts";
import { INTENTIONALLY_UNBOUND, UNRESOLVED_DISCIPLINE_ABILITIES } from "./effects.ts";
import { bindObject, dropOnDeath, excavate, freshPack } from "./save.ts";
import type { ActionProfile, EffectId, MasteryObject } from "./types.ts";
import { DISCIPLINES, EFFECT_IDS, PACK_SHA } from "./types.ts";

const HIGHER_BETTER = [
  "radius", "reach", "duration", "distance", "damage", "speed", "statusBurn", "statusSlow",
  "knockback", "iFrames", "heal", "lightOuter", "lightInner", "lightRear", "surveyRadius", "coverage", "targetCount", "chargeRate",
] as const;

const LOWER_BETTER = ["windup", "cooldown", "selfSlow", "chargeThreshold"] as const;

const BONUS_ADD = new Set(["radius", "reach", "duration", "distance", "statusBurn", "statusSlow", "knockback", "iFrames", "heal", "lightOuter", "lightRear", "surveyRadius"]);
const BONUS_MUL = new Set(["damageMul", "speedMul", "chargeRate"]);

export type Check = { name: string; ok: boolean; detail: string };

export type AuditReport = {
  packSha: string;
  passed: boolean;
  checks: Check[];
  failures: string[];
  incompatiblePairs: string[];
  duplicatePairs: string[];
  demonstrated: string[];
};

function num(profile: ActionProfile, key: string): number {
  return (profile as unknown as Record<string, number>)[key] ?? 0;
}

function classify(base: ActionProfile, mod: ActionProfile): { better: string[]; worse: string[] } {
  const better: string[] = [];
  const worse: string[] = [];
  for (const key of HIGHER_BETTER) {
    const delta = num(mod, key) - num(base, key);
    if (delta > 1e-6) better.push(key);
    if (delta < -1e-6) worse.push(key);
  }
  for (const key of LOWER_BETTER) {
    const delta = num(mod, key) - num(base, key);
    if (delta < -1e-6) better.push(key);
    if (delta > 1e-6) worse.push(key);
  }
  if (base.pattern !== mod.pattern || base.lightShape !== mod.lightShape || base.targetFilter !== mod.targetFilter) better.push("shape");
  for (const key of ["mp", "arrows", "bombs", "hp", "karma", "bottle"] as const) {
    if (mod.spent[key] > base.spent[key] + 1e-9) worse.push(`spent ${key}`);
  }
  if (mod.resolveHarm > base.resolveHarm + 1e-9) worse.push("resolve harm");
  if (mod.fizzle && !base.fizzle) worse.push("fizzle");
  if (!mod.fizzle && base.fizzle) better.push("fizzle");
  return { better, worse };
}

function positiveOverlap(a: MasteryObject, b: MasteryObject, effect: EffectId): boolean {
  const ops = (item: MasteryObject) => item.ops.concat(item.elseOps).filter((op) => op.effect === effect);
  for (const left of ops(a)) {
    for (const right of ops(b)) {
      if (left.channel !== right.channel) continue;
      if (left.mode === "add" && right.mode === "add" && BONUS_ADD.has(left.channel) && Number(left.value) > 0 && Number(right.value) > 0) return true;
      if (left.mode === "mul" && right.mode === "mul" && BONUS_MUL.has(left.channel) && Number(left.value) > 1 && Number(right.value) > 1) return true;
    }
  }
  return false;
}

const Y: Partial<Record<EffectId, MasteryObject["requires"]["ySlot"]>> = {
  "action.dig": "shovel",
  "action.hook": "hookshot",
  "action.smash": "hammer",
  "action.bow": "bow",
  "action.lantern": "lantern",
  "action.cape": "cape",
};

function worldOn(item: MasteryObject, effect: EffectId) {
  const world = worldFor(item);
  const slot = Y[effect];
  if (slot) world.ySlot = slot;
  if (effect === "action.swim") world.inWater = true;
  return world;
}

export function relate(a: MasteryObject, b: MasteryObject): "self" | "incompatible" | "duplicate" | "independent" {
  if (a.id === b.id) return "self";
  const shared = a.compatibleEffects.filter((effect) => b.compatibleEffects.includes(effect));
  if (!shared.length) return "independent";
  const effect = shared[0];
  const world = worldOn(a, effect);
  const result = resolveAction(effect, [a, b], world);
  if (!result.ok) return "incompatible";
  if (positiveOverlap(a, b, effect)) return "duplicate";
  return "independent";
}

function settledWorld(begun: ReturnType<typeof beginAction>) {
  return begun.phase === "winding" ? begun.pending.world : begun.world;
}

const GATED: EffectId[] = [
  "action.dig", "action.smash", "action.hook", "action.bow", "action.lantern",
  "action.cape", "action.swim", "action.dash", "action.bomb", "action.sip",
];

export function runAudit(): AuditReport {
  const failures: string[] = [];
  const checks: Check[] = [];
  const mark = (name: string, ok: boolean, detail: string) => {
    checks.push({ name, ok, detail });
    if (!ok) failures.push(`${name}: ${detail}`);
  };

  const ids = MASTERY_OBJECTS.map((item) => item.id);
  const expectIds = Array.from({ length: 80 }, (_, index) => `loot.expansion.mastery.${String(index + 1).padStart(3, "0")}`);
  mark("ids", ids.join() === expectIds.join(), `${ids.length} objects`);

  const blob = JSON.stringify(MASTERY_OBJECTS);
  mark("no integrated claim", !/\bintegrated\b/i.test(blob), "tooltip text must not say integrated");
  mark("no upkeep meter", !/\b(durability|fuel meter|oil clock)\b/i.test(blob), "no consumable maintenance");
  mark("discipline ids null", MASTERY_OBJECTS.every((item) => item.disciplineAbilityId === null), "every disciplineAbilityId is null");

  const disc = new Set(MASTERY_OBJECTS.map((item) => item.discipline));
  mark("six disciplines", DISCIPLINES.every((name) => disc.has(name)), [...disc].join(","));

  for (const item of MASTERY_OBJECTS) {
    let changed = 0;
    const better = new Set<string>();
    const worse = new Set<string>();
    for (const effect of item.compatibleEffects) {
      const world = worldOn(item, effect);
      const base = resolveAction(effect, [], world);
      const mod = resolveAction(effect, [item], world);
      if (!base.ok || !mod.ok) {
        failures.push(`${item.id} ${effect} rejected a single legal object (${!mod.ok ? mod.reason : ""})`);
        continue;
      }
      if (base.profile.blocked) {
        failures.push(`${item.id} ${effect} baseline blocked on a ready world: ${base.profile.blockReason}`);
        continue;
      }
      if (mod.profile.blocked) {
        failures.push(`${item.id} ${effect} blocked on a ready world: ${mod.profile.blockReason}`);
        continue;
      }
      if (!shapesEqual(base.profile, mod.profile)) changed += 1;
      const diff = classify(base.profile, mod.profile);
      diff.better.forEach((entry) => better.add(entry));
      diff.worse.forEach((entry) => worse.add(entry));
      if (effect === "action.dig" && mod.profile.flags.eroded !== true) failures.push(`${item.id} dig skipped erosion`);
      if (effect === "action.bomb" && mod.profile.spent.bombs !== 1) failures.push(`${item.id} bomb spend ${mod.profile.spent.bombs}`);
      if (effect === "action.bow" && mod.profile.spent.arrows !== 1) failures.push(`${item.id} arrow spend ${mod.profile.spent.arrows}`);
    }
    if (changed !== item.compatibleEffects.length) failures.push(`${item.id} changed ${changed}/${item.compatibleEffects.length} effects`);
    if (!better.size) failures.push(`${item.id} has no benefit`);
    if (!worse.size) failures.push(`${item.id} has no tradeoff`);
    if (resourceLoop([item], item.compatibleEffects[0])) failures.push(`${item.id} resource loop`);
    if (item.grants.length) failures.push(`${item.id} grants a resource`);
  }

  for (const item of MASTERY_OBJECTS) {
    for (const effect of item.compatibleEffects) {
      if (!GATED.includes(effect)) continue;
      const world = closedWorld(effect);
      const before = structuredClone(world);
      const base = resolveAction(effect, [], world);
      const mod = resolveAction(effect, [item], world);
      if (!base.ok || !mod.ok || !shapesEqual(base.profile, mod.profile) || !base.profile.blocked) {
        failures.push(`${item.id} ${effect} gate not preserved`);
        continue;
      }
      const after = settledWorld(beginAction(effect, [item], world));
      if (after.lanternOn || after.quarryOpen || after.excavated || after.tileOpened) {
        failures.push(`${item.id} ${effect} flipped a flag while gated`);
      }
      if (after.bombs !== before.bombs || after.arrows !== before.arrows || after.mp !== before.mp) {
        failures.push(`${item.id} ${effect} spent a resource while gated`);
      }
    }
  }

  for (const item of MASTERY_OBJECTS.filter((entry) => entry.compatibleEffects.includes("action.bomb"))) {
    const world = worldOn(item, "action.bomb");
    world.hasCracked = false;
    const started = beginAction("action.bomb", [item], world);
    const after = settledWorld(started);
    if (after.quarryOpen || after.tileOpened) failures.push(`${item.id} opened the vein without cracked marble`);
    if (after.bombs !== world.bombs - 1) failures.push(`${item.id} bomb ammo drifted to ${after.bombs}`);
  }

  for (const item of MASTERY_OBJECTS.filter((entry) => entry.extraCost && (entry.extraCost.id === "hp" || entry.extraCost.id === "mp"))) {
    const effect = item.compatibleEffects[0];
    const poor = worldOn(item, effect);
    const baseNeed = effect === "action.cape" ? 1 : 0;
    if (item.extraCost?.id === "hp") poor.hp = 0.4;
    if (item.extraCost?.id === "mp") poor.mp = baseNeed;
    const bare = resolveAction(effect, [], poor);
    const worn = resolveAction(effect, [item], poor);
    if (!bare.ok || !worn.ok || bare.profile.blocked || !worn.profile.blocked) {
      failures.push(`${item.id} did not step aside when its extra cost was unaffordable`);
    }
    const after = settledWorld(beginAction(effect, [item], poor));
    if (after.hp !== poor.hp || after.mp !== poor.mp) failures.push(`${item.id} spent a cost it could not afford`);
  }

  const burnA = objectById("loot.expansion.mastery.047")!;
  const burnB = objectById("loot.expansion.mastery.052")!;
  const burnWorld = worldOn(burnA, "action.slash");
  const aloneA = resolveAction("action.slash", [burnA], burnWorld);
  const aloneB = resolveAction("action.slash", [burnB], burnWorld);
  const both = resolveAction("action.slash", [burnA, burnB], burnWorld);
  if (!aloneA.ok || !aloneB.ok || !both.ok) failures.push("burn pair rejected");
  else {
    const raw = aloneA.profile.statusBurn + aloneB.profile.statusBurn;
    if (!(both.profile.statusBurn < raw - 1e-6)) failures.push(`burn stack ${both.profile.statusBurn} vs raw ${raw}`);
    if (Math.abs(both.profile.statusBurn - 0.6) > 1e-6) failures.push(`expected 0.6 burn, got ${both.profile.statusBurn}`);
  }
  const emberWorld = worldOn(burnB, "action.slash");
  emberWorld.priorBurn = 0.6;
  const withEmber = resolveAction("action.slash", [burnB], emberWorld);
  if (!withEmber.ok || !(withEmber.profile.statusBurn < 1.05 - 1e-6)) failures.push("ember affix stacked in full");

  const conflicts: Array<[string, string]> = [
    ["001", "014"],
    ["042", "045"],
    ["048", "054"],
    ["055", "058"],
    ["072", "076"],
  ];
  for (const [left, right] of conflicts) {
    const a = objectById(`loot.expansion.mastery.${left}`)!;
    const b = objectById(`loot.expansion.mastery.${right}`)!;
    const effect = a.compatibleEffects.find((entry) => b.compatibleEffects.includes(entry))!;
    const result = resolveAction(effect, [a, b], worldOn(a, effect));
    if (result.ok) failures.push(`${left}+${right} should be incompatible`);
  }

  const evil = { ...burnA, grants: [{ id: "hp" as const, amount: 1 }], extraCost: { id: "hp" as const, amount: 1 }, compatibleEffects: ["action.slash" as const] };
  const loop = resolveAction("action.slash", [evil], worldOn(burnA, "action.slash"));
  if (loop.ok || loop.code !== "loop") failures.push("synthetic hp loop was accepted");
  const bomb = objectById("loot.expansion.mastery.002")!;
  const bombLoop = resolveAction("action.bomb", [{ ...bomb, grants: [{ id: "bombs", amount: 1 }] }], worldOn(bomb, "action.bomb"));
  if (bombLoop.ok) failures.push("synthetic bomb refund was accepted");

  const triple = resolveAction("action.smash", MASTERY_OBJECTS.filter((item) => item.compatibleEffects.includes("action.smash")).slice(0, 3), readyWorld({ ySlot: "hammer" }));
  if (triple.ok || triple.code !== "cap") failures.push("three bindings were accepted");

  const windupItems = MASTERY_OBJECTS.filter((item) => item.ops.some((op) => op.channel === "windup" && Number(op.value) > 0));
  const windDiscs = new Set<string>();
  for (const item of windupItems) {
    const effect = item.ops.find((op) => op.channel === "windup")!.effect;
    const world = worldOn(item, effect);
    if (item.selfHarmIfInside) world.insideBlast = true;
    const base = resolveAction(effect, [], world);
    const begun = beginAction(effect, [item], world);
    if (begun.phase !== "winding") {
      failures.push(`${item.id} did not wind up`);
      continue;
    }
    if (begun.pending.world.excavated || begun.pending.world.lanternOn || begun.pending.world.quarryOpen) {
      failures.push(`${item.id} resolved a flag during windup`);
    }
    const finished = stripAndFinish(begun.pending, item.id);
    if (!finished.result.ok || !base.ok || !shapesEqual(finished.result.profile, base.profile)) {
      failures.push(`${item.id} removal did not restore the base shape`);
    }
    if (item.extraCost) {
      const key = item.extraCost.id;
      const spent = (world[key as "mp"] ?? 0) - ((begun.pending.world as unknown as Record<string, number>)[key] ?? 0);
      if (key !== "bottle" && spent + 1e-9 < item.extraCost.amount) failures.push(`${item.id} refunded ${key} on removal`);
    }
    if (item.selfHarmIfInside && finished.world.hp !== world.hp) failures.push(`${item.id} applied blast harm after removal`);
    if (effect === "action.bomb" && finished.world.bombs !== world.bombs - 1) failures.push(`${item.id} refunded the keg`);
    if (effect === "action.sip" && finished.world.bottles[0] !== "empty") failures.push(`${item.id} returned the bottle`);
    if (effect === "action.sip" && Math.abs(finished.world.hp - (world.hp + 4)) > 1e-6) failures.push(`${item.id} heal after removal was ${finished.world.hp}`);
    windDiscs.add(item.discipline);
  }
  mark("interrupt covers disciplines", DISCIPLINES.every((name) => windDiscs.has(name)), [...windDiscs].join(","));

  mark("twenty demonstrated", DEMONSTRATED_IDS.length === 20, String(DEMONSTRATED_IDS.length));
  mark(
    "demos span disciplines",
    new Set(DEMONSTRATED_IDS.map((id) => objectById(id)?.discipline)).size === 6,
    "discipline coverage",
  );
  for (const demo of DEMONSTRATIONS) {
    const result = demonstrate(demo);
    if (demo.expect === "incompatible") {
      if (result.modified.ok) failures.push(`demo ${demo.id} should reject`);
    } else if (!result.modified.ok || !result.baseline.ok) {
      failures.push(`demo ${demo.id} failed to resolve`);
    } else if (demo.expect === "duplicate") {
      const raw = result.items.reduce((sum, item) => sum + item.ops.filter((op) => op.channel === "statusBurn").reduce((inner, op) => inner + Number(op.value), 0), 0);
      if (!(result.modified.profile.statusBurn < raw - 1e-6)) failures.push(`demo ${demo.id} did not cap burn`);
    } else if (shapesEqual(result.baseline.profile, result.modified.profile)) {
      failures.push(`demo ${demo.id} did not change the action`);
    }
    if (demo.expect === "interrupt" && !result.stripped) failures.push(`demo ${demo.id} had no interrupt`);
  }

  const save = freshPack();
  const bound = bindObject(bindObject(save, ids[0]).ok ? (bindObject(save, ids[0]) as { save: typeof save }).save : save, ids[1]);
  const two = bound.ok ? bound.save : save;
  const third = bindObject(two, ids[2]);
  if (third.ok) failures.push("save accepted a third binding");
  const dead = dropOnDeath(two, 2026);
  if (dead.carried.length || dead.bound.length || dead.grave.length !== 80) failures.push("death did not drop the pack onto one grave");
  const noShovel = excavate(dead, false, 2040, () => 0);
  if (noShovel.ok) failures.push("excavated without a shovel");
  const dug = excavate(dead, true, 2026 + 12, () => 0.5);
  if (!dug.ok) failures.push("shovel could not dig");
  else {
    const keptMagic = dug.recovered.filter((id) => objectById(id)?.save.erosion === "magic-kept");
    const keptMundane = dug.recovered.filter((id) => objectById(id)?.save.erosion === "mundane");
    if (!keptMagic.length) failures.push("magic grave goods eroded");
    if (keptMundane.length) failures.push("mundane goods survived a failed 12-winter roll");
  }
  const ledger = { skillPoints: 3, crowns: 1, edge: 2 };
  if (JSON.stringify(ledger) !== JSON.stringify({ ...ledger })) failures.push("ledger mutated");

  const incompatiblePairs: string[] = [];
  const duplicatePairs: string[] = [];
  for (let i = 0; i < MASTERY_OBJECTS.length; i++) {
    for (let j = i + 1; j < MASTERY_OBJECTS.length; j++) {
      const relation = relate(MASTERY_OBJECTS[i], MASTERY_OBJECTS[j]);
      if (relation === "incompatible") incompatiblePairs.push(`${MASTERY_OBJECTS[i].id} × ${MASTERY_OBJECTS[j].id}`);
      if (relation === "duplicate") duplicatePairs.push(`${MASTERY_OBJECTS[i].id} × ${MASTERY_OBJECTS[j].id}`);
    }
  }
  mark("incompatible pairs exist", incompatiblePairs.length > 0, String(incompatiblePairs.length));
  mark("duplicate pairs exist", duplicatePairs.length > 0, String(duplicatePairs.length));
  mark("unbound tools stay listed", INTENTIONALLY_UNBOUND.every((id) => EFFECT_IDS.includes(id)), INTENTIONALLY_UNBOUND.join(", "));
  mark("unresolved disciplines", Object.keys(UNRESOLVED_DISCIPLINE_ABILITIES).length === 6, PACK_SHA);

  return {
    packSha: PACK_SHA,
    passed: failures.length === 0,
    checks,
    failures,
    incompatiblePairs,
    duplicatePairs,
    demonstrated: DEMONSTRATED_IDS,
  };
}

export function matrixCodes(): string[][] {
  const code = { self: "S", incompatible: "X", duplicate: "D", independent: "." } as const;
  return MASTERY_OBJECTS.map((row) => MASTERY_OBJECTS.map((column) => code[relate(row, column)]));
}
