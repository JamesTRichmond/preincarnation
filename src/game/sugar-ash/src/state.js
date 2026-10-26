// @ts-nocheck
import {
  COSTS,
  LIMITS,
  blossomCapOf,
  chainMaxOf,
  isReduced,
  multCapOf,
  projectileCapOf,
} from "./constants.js";
import {
  blockedAt,
  clamp,
  dist,
  distPointSeg,
  lineBlocked,
  moveBody,
  norm,
  pointInRect,
  rot,
  segHitsRect,
} from "./geometry.js";

/** Ability modules register completion/cancel hooks here. No import cycle. */
let HANDLERS = {};
const HIT_HOOKS = {};
export function registerHandlers(table) {
  HANDLERS = table;
}
export function registerHitHook(kind, fn) {
  HIT_HOOKS[kind] = fn;
}

export function say(world, text) {
  world.log.push(text);
  if (world.log.length > 36) world.log.shift();
  world.lastLine = text;
}

export function emit(world, type, data = {}) {
  world.events.push({ t: Math.round(world.time * 1000) / 1000, type, ...data });
  if (world.events.length > 400) world.events.shift();
}

export function uid(world, prefix) {
  const n = world.nextId++;
  return `${prefix}-${n}`;
}

export function createWorld(opts = {}) {
  return {
    time: 0,
    settings: {
      reducedEffects: false,
      ambientRegen: false,
      ...(opts.settings ?? {}),
    },
    bounds: opts.bounds ?? { x: 0, y: 0, w: 1200, h: 800 },
    camera: opts.camera ?? { x: 0, y: 0, w: 1200, h: 800 },
    autoAwareness: opts.autoAwareness ?? false,
    ai: opts.ai ?? false,
    actors: [],
    anchors: [],
    walls: [],
    seals: [],
    blockers: [],
    decals: [],
    projectiles: [],
    blossoms: [],
    marks: [],
    tethers: [],
    zones: [],
    telegraphs: [],
    queue: [],
    log: [],
    events: [],
    floats: [],
    sparks: [],
    input: {
      keys: new Set(),
      aimX: 0,
      aimY: 0,
      aimActive: false,
      move: null,
    },
    attune: { sugar: opts.sugar ?? null, ash: opts.ash ?? null },
    resources: { sap: 100, ember: 100, sapMax: 100, emberMax: 100 },
    channel: null,
    prepared: null,
    tithe: 0,
    quenchCd: 0,
    markCounter: 0,
    wreathStreak: 0,
    lastWreathTarget: null,
    braced: false,
    releasePulse: false,
    pendingChoice: null,
    chainBudget: null,
    counters: {
      fizzled: 0,
      blooms: 0,
      spawned: 0,
      tetherBreaks: 0,
      chains: 0,
    },
    nextId: 1,
    lastLine: "",
    hitstop: 0,
  };
}

export function addActor(world, spec) {
  const boss = !!spec.boss || spec.kind === "boss";
  const actor = {
    id: spec.id ?? uid(world, "a"),
    name: spec.name ?? "figure",
    team: spec.team ?? (spec.id === "ellis" ? "ellis" : "foe"),
    kind: spec.kind ?? (boss ? "boss" : spec.id === "ellis" ? "ellis" : "foe"),
    boss,
    x: spec.x ?? 0,
    y: spec.y ?? 0,
    px: spec.x ?? 0,
    py: spec.y ?? 0,
    vx: 0,
    vy: 0,
    r: spec.r ?? (boss ? 22 : spec.id === "ellis" ? 14 : 15),
    facing: spec.facing ?? 0,
    hp: spec.hp ?? (boss ? 220 : 80),
    maxHp: spec.hp ?? (boss ? 220 : 80),
    alive: spec.alive !== false,
    onScreen: spec.onScreen !== false,
    damageFactor: spec.damageFactor ?? (boss ? LIMITS.bossBloom : 1),
    immunities: {
      displace: boss,
      hardBind: boss,
      stun: boss,
      ...(spec.immunities ?? {}),
    },
    wreath: 0,
    wreathTimer: 0,
    statuses: [],
    iframe: 0,
    rooted: 0,
    stagger: 0,
    shield: false,
    speed: spec.speed ?? (spec.id === "ellis" ? LIMITS.ellisSpeed : boss ? LIMITS.bossSpeed : LIMITS.foeSpeed),
    ai: spec.ai !== false,
    confined: null,
    color: spec.color ?? null,
  };
  world.actors.push(actor);
  return actor;
}

export function addWall(world, rect) {
  world.walls.push({ ...rect });
  return rect;
}
export function addSeal(world, rect) {
  const s = { ...rect, seal: true };
  world.seals.push(s);
  return s;
}
export function addBlocker(world, c) {
  world.blockers.push({ ...c });
  return c;
}
export function addAnchor(world, spec) {
  const a = {
    id: spec.id ?? uid(world, "anchor"),
    name: spec.name ?? "stake",
    kind: "anchor",
    anchorKind: spec.anchorKind ?? "stake",
    x: spec.x,
    y: spec.y,
    r: spec.r ?? 8,
    hp: spec.hp ?? 30,
    alive: true,
    onScreen: spec.onScreen !== false,
    team: "fixture",
  };
  world.anchors.push(a);
  return a;
}

export function getActor(world, id) {
  return world.actors.find((a) => a.id === id) ?? world.anchors.find((a) => a.id === id) ?? null;
}
export function ellisOf(world) {
  return world.actors.find((a) => a.id === "ellis");
}

export function spend(world, key, n) {
  if (n <= 0) return true;
  if (world.resources[key] < n - 1e-6) return false;
  world.resources[key] = Math.round((world.resources[key] - n) * 100) / 100;
  return true;
}
export function gain(world, key, n) {
  const max = key === "sap" ? world.resources.sapMax : world.resources.emberMax;
  world.resources[key] = Math.min(max, Math.round((world.resources[key] + n) * 100) / 100);
}

export function hasStatus(actor, id) {
  return !!actor?.statuses?.some((s) => s.id === id && s.remaining > 0);
}

export function clearStatus(actor, id) {
  if (!actor) return;
  actor.statuses = actor.statuses.filter((s) => s.id !== id);
}

function recipientsForEcho(world, source) {
  const seen = new Set([source.id]);
  const queue = [source.id];
  const out = [];
  while (queue.length && out.length < 3) {
    const id = queue.shift();
    for (const te of world.tethers) {
      if (!te.alive) continue;
      let otherId = null;
      if (te.aId === id && te.bKind === "actor") otherId = te.bId;
      else if (te.bId === id && te.aKind === "actor") otherId = te.aId;
      if (!otherId || seen.has(otherId)) continue;
      seen.add(otherId);
      const other = getActor(world, otherId);
      if (!other || !other.alive || other.kind === "anchor") continue;
      if (other.boss || other.immunities?.hardBind) {
        emit(world, "echo-blocked", { by: other.id });
        continue;
      }
      if (!other.onScreen) {
        emit(world, "echo-offscreen", { id: other.id });
        continue;
      }
      out.push(other);
      if (out.length >= 3) break;
      queue.push(other.id);
    }
  }
  return out;
}

export function applyStatus(world, target, status, opts = {}) {
  if (!target || !target.alive) return false;
  if (!target.onScreen && !opts.force) {
    emit(world, "status-ignored", { id: target.id, reason: "offscreen", status: status.id });
    return false;
  }
  if (
    target.boss &&
    (status.id === "sweet-rot" || status.id === "sap-tax" || status.id === "hard-bind")
  ) {
    emit(world, "boss-immune", { status: status.id, id: target.id });
    return false;
  }
  const existing = target.statuses.find((s) => s.id === status.id);
  if (existing) {
    existing.remaining = Math.max(existing.remaining, status.remaining);
    existing.potency = Math.max(existing.potency ?? 0, status.potency ?? 0);
  } else {
    target.statuses.push({
      id: status.id,
      remaining: status.remaining,
      potency: status.potency ?? 1,
    });
  }
  emit(world, "status", { id: target.id, status: status.id, remaining: status.remaining, echo: !!opts.echo });
  if (!opts.echo && !opts.noEcho && world.attune.sugar === "common-root") {
    const pals = recipientsForEcho(world, target);
    if (pals.length) {
      if (!spend(world, "sap", COSTS.commonEcho)) {
        say(world, "Common Root: not enough sap — only the struck root takes the status.");
      } else {
        for (const pal of pals) {
          applyStatus(
            world,
            pal,
            {
              id: status.id,
              remaining: status.remaining * 0.5,
              potency: (status.potency ?? 1) * 0.5,
            },
            { echo: true },
          );
        }
        say(world, `Common Root shares ${status.id} with ${pals.length}.`);
      }
    }
  }
  return true;
}

export function speedMul(actor) {
  let m = 1;
  for (const s of actor.statuses) {
    if (s.remaining <= 0) continue;
    if (s.id === "sap-tax") m *= 0.9;
    if (s.id === "sweet-rot") m *= 1 - (s.potency ?? 0.2);
    if (s.id === "lantern") m *= 0.9;
  }
  return m;
}

export function dealDamage(world, target, amount, spec = {}) {
  const result = {
    amount: 0,
    mult: 1,
    ignored: false,
    reason: null,
    capped: false,
    combo: null,
  };
  if (!target || !target.alive || target.kind === "anchor") {
    result.ignored = true;
    result.reason = "invalid";
    return result;
  }
  if (!target.onScreen) {
    result.ignored = true;
    result.reason = "offscreen";
    emit(world, "damage-ignored", { id: target.id, reason: "offscreen" });
    return result;
  }
  if (target.iframe > 0 && !spec.ignoreIframe) {
    result.ignored = true;
    result.reason = "iframe";
    return result;
  }
  let base = amount;
  if (spec.kind === "bloom" && hasStatus(target, "lantern")) base *= LIMITS.lanternMul;
  let flat = 0;
  let allowWreath = spec.allowWreath !== false;
  if (
    spec.kind === "bloom" &&
    target.wreath >= 2 &&
    hasStatus(target, "lantern") &&
    !spec.skipKindling
  ) {
    target.wreath = Math.max(0, target.wreath - 1);
    flat += LIMITS.kindlingFlat;
    allowWreath = false;
    result.combo = "debt-kindling";
    emit(world, "combo", { id: "debt-kindling", target: target.id });
    say(world, "Debt Kindling: a loop burns as fuel, not as a second multiplier.");
  }
  let mult = spec.extraMult ?? 1;
  if (allowWreath && target.wreath > 0) mult *= 1 + LIMITS.wreathPerLoop * target.wreath;
  const cap = multCapOf(world);
  if (mult > cap) {
    mult = cap;
    result.capped = true;
    emit(world, "mult-capped", { cap, id: target.id });
  }
  let total = base * mult + flat;
  if (!spec.ignoreFactor) total *= target.damageFactor ?? 1;
  if (target.shield) {
    total *= 0.7;
    target.shield = false;
    say(world, "Quench takes the edge off the hit.");
  }
  if (hasStatus(target, "owed") && spec.clean) {
    total += 4;
    clearStatus(target, "owed");
    emit(world, "tithe-paid", { id: target.id });
  }
  total = Math.max(0, Math.round(total));
  target.hp -= total;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    emit(world, "death", { id: target.id });
  }
  result.amount = total;
  result.mult = mult;
  if (total > 0) {
    world.floats.push({
      x: target.x,
      y: target.y - target.r,
      text: String(total),
      life: 0.7,
      kind: spec.kind ?? "hit",
    });
    if (spec.fromEllis && target.team === "foe") gain(world, "ember", 4);
    if (target.id === "ellis") {
      frayOne(world);
      if (world.channel?.interruptible !== false) cancelChannel(world, "hit");
      if (world.prepared) {
        world.prepared = null;
        gain(world, "ember", COSTS.lastArrowRefund);
        say(world, "The nocked arrow slips — 4 ember returned.");
      }
    }
  }
  if (spec.stagger && !(target.boss && target.immunities?.stun)) {
    target.stagger = Math.max(target.stagger, spec.stagger);
  } else if (spec.stagger && target.boss) {
    emit(world, "boss-immune", { status: "stun", id: target.id });
  }
  if (spec.displace) {
    if (target.boss && target.immunities?.displace) {
      emit(world, "boss-immune", { status: "displace", id: target.id });
    } else {
      moveBody(world, target, spec.displace.x, spec.displace.y);
    }
  }
  emit(world, "damage", {
    id: target.id,
    amount: total,
    mult,
    capped: result.capped,
    kind: spec.kind ?? "hit",
    combo: result.combo,
  });
  return result;
}

export function frayOne(world) {
  let best = null;
  for (const a of world.actors) {
    if (a.wreath > 0 && (!best || a.wreath > best.wreath)) best = a;
  }
  if (!best) return;
  best.wreath -= 1;
  say(world, `One loop frays on ${best.name}.`);
  emit(world, "wreath-fray", { id: best.id, n: best.wreath });
}

export function tryWreath(world, target, clean) {
  if (!target || !target.alive || !target.onScreen) return false;
  if (world.attune.sugar !== "wreath-of-debts" && !clean?.force) {
    /* caller gates attunement; force used by tests */
  }
  if (!clean) {
    world.wreathStreak = 0;
    return false;
  }
  const cap = target.boss ? LIMITS.wreathBossMax : LIMITS.wreathMax;
  if (target.wreath >= cap) {
    target.wreathTimer = LIMITS.wreathDecay;
    say(world, target.boss ? "The warden holds only two loops." : "The wreath is already tight.");
    return false;
  }
  const cost = target.wreath <= 0 ? COSTS.wreathOpen : COSTS.wreathLoop;
  if (!spend(world, "sap", cost)) {
    say(world, "Wreath of Debts: not enough sap — the hit stays ordinary.");
    return false;
  }
  target.wreath += 1;
  target.wreathTimer = LIMITS.wreathDecay;
  world.wreathStreak += 1;
  world.lastWreathTarget = target.id;
  say(world, `Wreath ${target.wreath} settles on ${target.name}.`);
  emit(world, "wreath", { id: target.id, n: target.wreath });
  return true;
}

export function shedWreath(world) {
  world.wreathStreak = 0;
  const t = world.lastWreathTarget && getActor(world, world.lastWreathTarget);
  if (t && t.wreath > 0) {
    t.wreath -= 1;
    say(world, "The step breaks the streak — one loop falls.");
    emit(world, "wreath-shed", { id: t.id, n: t.wreath });
  }
}

export function spawnProjectile(world, spec) {
  const cap = projectileCapOf(world);
  if (world.projectiles.length >= cap) {
    world.counters.fizzled += 1;
    world.sparks.push({ x: spec.x, y: spec.y, life: 0.35, kind: "fizzle" });
    say(world, "The hand is full — that shot fizzles instead of steering itself.");
    emit(world, "fizzle", { ability: spec.abilityId ?? null });
    return null;
  }
  const p = {
    id: uid(world, "p"),
    x: spec.x,
    y: spec.y,
    vx: spec.vx,
    vy: spec.vy,
    r: spec.r ?? 4,
    life: spec.life ?? 0.8,
    damage: spec.damage ?? 0,
    extraMult: spec.extraMult ?? 1,
    ownerId: spec.ownerId ?? "ellis",
    abilityId: spec.abilityId ?? "base",
    kind: spec.kind ?? "arrow",
    alive: true,
    homing: false,
    steering: "straight",
    pierceLeft: spec.pierceLeft ?? 0,
    falloff: spec.falloff ?? 1,
    minFalloff: spec.minFalloff ?? 0.4,
    hitIds: [],
    child: !!spec.child,
    plants: spec.plants ?? null,
    plantOnActor: !!spec.plantOnActor,
    wreath: !!spec.wreath,
    clean: !!spec.clean,
    refundWhiff: spec.refundWhiff ?? 0,
    refundSeal: spec.refundSeal ?? 0,
    traveled: 0,
    originX: spec.x,
    originY: spec.y,
    dirX: 0,
    dirY: 0,
    flesh: false,
    passedMarkIds: [],
    passedBlossomIds: [],
    wickIds: [],
    stagger: spec.stagger ?? 0,
    displaceScale: spec.displaceScale ?? 0,
    fromEllis: spec.fromEllis !== false,
    winters: !!spec.winters,
    stakeId: spec.stakeId ?? null,
  };
  const sp = Math.hypot(p.vx, p.vy) || 1;
  p.dirX = p.vx / sp;
  p.dirY = p.vy / sp;
  world.projectiles.push(p);
  world.counters.spawned += 1;
  return p;
}

export function endpoint(world, te, which) {
  const kind = which === "a" ? te.aKind : te.bKind;
  const id = which === "a" ? te.aId : te.bId;
  if (kind === "anchor") return world.anchors.find((a) => a.id === id) ?? null;
  return world.actors.find((a) => a.id === id) ?? null;
}

export function linkActors(world, a, b, opts = {}) {
  if (!a || !b || a.id === b.id) return null;
  if (a.alive === false || b.alive === false) return null;
  if (!a.onScreen || !b.onScreen) {
    emit(world, "link-refused", { reason: "offscreen" });
    return null;
  }
  const block = lineBlocked(world, a, b);
  if (block) {
    emit(world, "link-refused", { reason: block });
    return null;
  }
  const living = world.tethers.filter((t) => t.alive);
  if (living.length >= LIMITS.maxTethers) {
    say(world, "No room for another thread.");
    return null;
  }
  if (
    living.some(
      (t) =>
        (t.aId === a.id && t.bId === b.id) || (t.aId === b.id && t.bId === a.id),
    )
  ) {
    return living.find(
      (t) => (t.aId === a.id && t.bId === b.id) || (t.aId === b.id && t.bId === a.id),
    );
  }
  const d = dist(a, b);
  const te = {
    id: uid(world, "tether"),
    aId: a.id,
    bId: b.id,
    aKind: a.kind === "anchor" ? "anchor" : "actor",
    bKind: b.kind === "anchor" ? "anchor" : "actor",
    slack: opts.slack ?? d + 36,
    tension: opts.tension ?? 20,
    age: 0,
    maxAge: opts.maxAge ?? LIMITS.tetherDuration,
    glazed: false,
    glazeArm: 0,
    lease: !!opts.lease,
    alive: true,
    off: 0,
    punishCd: 0,
    abilityId: opts.abilityId ?? "link",
  };
  world.tethers.push(te);
  emit(world, "tether", { id: te.id, a: a.id, b: b.id, lease: te.lease, tension: te.tension });
  say(world, te.lease ? `Orchard Lease binds ${b.name ?? b.id} to the stake.` : "A sugar thread takes.");
  return te;
}

export function breakTether(world, te, reason) {
  if (!te.alive) return;
  te.alive = false;
  world.counters.tetherBreaks += 1;
  emit(world, "tether-break", { id: te.id, reason, tension: te.tension, abilityId: te.abilityId });
  say(world, `Thread breaks (${reason}).`);
  if (reason !== "ellis-cut" && reason !== "cancel" && world.tithe > 0) {
    const back = Math.min(COSTS.titheGainMax, te.tension * 0.2);
    gain(world, "sap", back);
    const breaker = world._breakActor;
    if (breaker && breaker.team === "foe") {
      applyStatus(world, breaker, { id: "owed", remaining: 2, potency: 1 }, { noEcho: true });
    }
    emit(world, "tithe", { sap: back, reason });
    say(world, `Tithe returns ${back.toFixed(1)} sap.`);
  }
}

export function cutTether(world, id) {
  const te = world.tethers.find((t) => t.id === id && t.alive);
  if (!te) return;
  breakTether(world, te, "ellis-cut");
}

export function nearestAnchor(world, actor, reach = LIMITS.pressureReach) {
  let best = null;
  let bestD = reach;
  for (const a of world.anchors) {
    if (!anchorAccessible(world, actor, a, reach)) continue;
    const d = dist(actor, a);
    if (d <= bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export function anchorAccessible(world, actor, anchor, reach = LIMITS.pressureReach) {
  if (!anchor || !anchor.alive) return false;
  if (!anchor.onScreen) return false;
  if (dist(actor, anchor) > reach) return false;
  if (lineBlocked(world, actor, anchor)) return false;
  return true;
}

export function plantBlossom(world, spec) {
  if (pointInSeal(world, spec.x, spec.y) || blockedInterior(world, spec.x, spec.y)) {
    if (spec.refund) gain(world, "ember", spec.refund);
    say(world, "The seal refuses the blossom — ember returned.");
    emit(world, "plant-refused", { reason: "seal" });
    return null;
  }
  const cap = blossomCapOf(world);
  const live = world.blossoms.filter((b) => b.alive);
  if (live.length >= cap) {
    if (spec.refund) gain(world, "ember", spec.refund);
    say(world, "The orchard is full — the bud does not take.");
    emit(world, "plant-refused", { reason: "cap" });
    return null;
  }
  const b = {
    id: uid(world, "blossom"),
    x: spec.x,
    y: spec.y,
    r: spec.r ?? LIMITS.blossomR,
    arm: 0,
    armTime: spec.armTime ?? LIMITS.blossomArm,
    life: spec.life ?? LIMITS.blossomLife,
    armed: false,
    banked: false,
    alive: true,
    spent: false,
    deliberate: spec.deliberate !== false,
    hp: 1,
  };
  world.blossoms.push(b);
  if (b.deliberate) {
    world.markCounter += 1;
    emit(world, "mark-count", { n: world.markCounter });
  }
  emit(world, "blossom", { id: b.id, deliberate: b.deliberate, x: b.x, y: b.y });
  return b;
}

export function plantMark(world, spec) {
  if (pointInSeal(world, spec.x, spec.y)) {
    if (spec.refund) gain(world, "ember", spec.refund);
    emit(world, "plant-refused", { reason: "seal" });
    say(world, "Cinder Letter cannot be written on a seal.");
    return null;
  }
  const live = world.marks.filter((m) => m.alive);
  if (live.length >= LIMITS.maxMarks) {
    live.sort((a, b) => a.life - b.life);
    live[0].alive = false;
    emit(world, "mark-expire", { id: live[0].id, reason: "cap" });
  }
  const m = {
    id: uid(world, "mark"),
    x: spec.x,
    y: spec.y,
    r: 12,
    life: LIMITS.markLife,
    alive: true,
    deliberate: true,
    banked: false,
  };
  world.marks.push(m);
  world.markCounter += 1;
  emit(world, "mark", { id: m.id, x: m.x, y: m.y, n: world.markCounter });
  return m;
}

function pointInSeal(world, x, y) {
  return world.seals.some((s) => pointInRect(x, y, s));
}
function blockedInterior(world, x, y) {
  return world.walls.some((s) => pointInRect(x, y, s));
}

export function snuffBlossom(world, b, reason) {
  if (!b.alive || b.spent) return;
  b.alive = false;
  b.spent = true;
  emit(world, "snuff", { id: b.id, reason });
}

export function bloomBlossom(world, b, opts = {}) {
  if (!b || !b.alive || b.spent || !b.armed || b.banked) return false;
  b.spent = true;
  b.alive = false;
  world.counters.blooms += 1;
  const chainOk = opts.chain !== false;
  let sootStopped = false;
  for (const a of world.actors) {
    if (!a.alive || a.kind === "anchor") continue;
    if (dist(a, b) > b.r + a.r * 0.2) continue;
    const res = dealDamage(world, a, opts.amount ?? LIMITS.bloomBase, {
      kind: "bloom",
      fromEllis: true,
      stagger: a.boss ? 0 : 0.15,
      allowWreath: true,
      extraMult: opts.extraMult ?? 1,
    });
    if (res.combo) {
      /* recorded */
    }
    if (hasStatus(a, "soot") && !res.ignored) {
      sootStopped = true;
      const bonus = a.boss ? 1 : 3;
      gain(world, "ember", bonus);
      emit(world, "soot-bank", { id: a.id, ember: bonus });
      say(world, "Soot Covenant banks the coal and refuses the chain.");
    }
  }
  emit(world, "bloom", { id: b.id, chain: chainOk && !sootStopped, source: opts.source ?? "spark" });
  if (chainOk && !sootStopped) {
    const max = chainMaxOf(world);
    const depth = opts.depth ?? 1;
    if (depth < max) {
      for (const n of world.blossoms) {
        if (!n.alive || !n.armed || n.banked || n.spent) continue;
        if (dist(n, b) > LIMITS.chainGap) continue;
        const next = n;
        const delay = world.time + 0.15;
        world.queueMicro = world.queueMicro ?? [];
        world.queueMicro.push({
          at: delay,
          run: () => bloomBlossom(world, next, { ...opts, depth: depth + 1, source: "chain" }),
        });
      }
    }
  }
  return true;
}

export function sparkAt(world, x, y, radius, source) {
  for (const b of [...world.blossoms]) {
    if (!b.alive || !b.armed || b.banked || b.spent) continue;
    if (Math.hypot(b.x - x, b.y - y) <= b.r + radius) {
      bloomBlossom(world, b, { source });
    }
  }
}

export function startChannel(world, spec) {
  world.channel = {
    abilityId: spec.id,
    elapsed: 0,
    max: spec.max,
    interruptible: spec.interruptible !== false,
    earlyRelease: !!spec.earlyRelease,
    hold: !!spec.hold,
    root: spec.root !== false,
    sapSpent: 0,
    payload: spec.payload ?? {},
  };
  world.braced = true;
  emit(world, "channel-start", { id: spec.id });
}

export function cancelChannel(world, reason) {
  const ch = world.channel;
  if (!ch || world._cancelling) return;
  world._cancelling = true;
  world.channel = null;
  const e = ellisOf(world);
  if (e) e.rooted = 0;
  const h = HANDLERS[ch.abilityId];
  h?.cancel?.(world, ch, reason);
  emit(world, "channel-cancel", { id: ch.abilityId, reason });
  world._cancelling = false;
}

export function completeChannel(world, how) {
  const ch = world.channel;
  if (!ch) return;
  world.channel = null;
  const e = ellisOf(world);
  if (e) e.rooted = 0;
  const h = HANDLERS[ch.abilityId];
  h?.complete?.(world, ch, how);
  emit(world, "channel-complete", { id: ch.abilityId, how });
}

function notePass(world, p, x1, y1, x2, y2) {
  for (const m of world.marks) {
    if (!m.alive || m.banked) continue;
    if (p.passedMarkIds.includes(m.id)) continue;
    const d = distPointSeg(m.x, m.y, x1, y1, x2, y2);
    if (d.dist <= 18) p.passedMarkIds.push(m.id);
  }
  for (const b of world.blossoms) {
    if (!b.alive || !b.armed) continue;
    if (p.passedBlossomIds.includes(b.id)) continue;
    const d = distPointSeg(b.x, b.y, x1, y1, x2, y2);
    if (d.dist <= b.r) p.passedBlossomIds.push(b.id);
  }
}

function wickAlong(world, p, x1, y1, x2, y2) {
  if (p.kind !== "sap") return;
  for (const b of [...world.blossoms]) {
    if (!b.alive || !b.armed || b.banked || p.wickIds.includes(b.id)) continue;
    const d = distPointSeg(b.x, b.y, x1, y1, x2, y2);
    if (d.dist > b.r + p.r) continue;
    p.wickIds.push(b.id);
    p.extraMult *= LIMITS.wickMul;
    bloomBlossom(world, b, { chain: false, source: "sap-lit-wick", extraMult: 1 });
    emit(world, "combo", { id: "sap-lit-wick", blossom: b.id });
    say(world, "Sap-lit Wick: the bolt burns the bud and does not chain.");
  }
}

export function resolveNeedle(world, p) {
  if (p.flesh) {
    if (p.refundWhiff) gain(world, "sap", p.refundWhiff);
    say(world, "Thread the Needle struck flesh — the gap was the target.");
    emit(world, "thread-whiff", { reason: "flesh" });
    return;
  }
  const foes = world.actors.filter((a) => a.alive && a.team === "foe" && a.onScreen);
  const cand = [];
  for (const f of foes) {
    const relx = f.x - p.originX;
    const rely = f.y - p.originY;
    const along = relx * p.dirX + rely * p.dirY;
    const perp = Math.abs(relx * p.dirY - rely * p.dirX);
    const side = Math.sign(relx * p.dirY - rely * p.dirX) || 1;
    if (along < 8 || along > p.traveled + 12) continue;
    if (perp <= f.r + 2) {
      p.flesh = true;
    }
    if (perp < LIMITS.needlePerp && perp > f.r - 1) cand.push({ f, along, perp, side });
  }
  if (p.flesh) {
    if (p.refundWhiff) gain(world, "sap", p.refundWhiff);
    say(world, "Thread the Needle struck flesh — the gap was the target.");
    emit(world, "thread-whiff", { reason: "flesh" });
    return;
  }
  let best = null;
  for (let i = 0; i < cand.length; i++) {
    for (let j = i + 1; j < cand.length; j++) {
      const A = cand[i];
      const B = cand[j];
      if (A.side === B.side) continue;
      if (Math.abs(A.along - B.along) > LIMITS.needlePairAlong) continue;
      const score = A.perp + B.perp;
      if (!best || score < best.score) best = { A, B, score };
    }
  }
  if (!best) {
    if (p.refundWhiff) gain(world, "sap", p.refundWhiff);
    say(world, "The needle finds no pair — part of the sap returns.");
    emit(world, "thread-whiff", { reason: "gap" });
    return;
  }
  let tension = 25;
  if (p.passedMarkIds.length) {
    const id = p.passedMarkIds[0];
    const m = world.marks.find((mm) => mm.id === id && mm.alive);
    if (m) {
      m.alive = false;
      tension += 20;
      emit(world, "combo", { id: "needle-through-coals", mark: id });
      say(world, "Needle through Coals: the letter burns into the new thread.");
    }
  }
  const te = linkActors(world, best.A.f, best.B.f, {
    tension,
    slack: dist(best.A.f, best.B.f) + 28,
    abilityId: "thread-the-needle",
  });
  if (te) emit(world, "thread", { tether: te.id, tension });
  else if (p.refundWhiff) gain(world, "sap", p.refundWhiff);
}

function forkSplit(world, p) {
  const kids = [35, -35];
  let made = 0;
  for (const deg of kids) {
    const v = rot(p.vx, p.vy, deg);
    const c = spawnProjectile(world, {
      x: p.x,
      y: p.y,
      vx: v.x,
      vy: v.y,
      damage: 7,
      life: 0.45,
      kind: "cinder",
      abilityId: "split-the-billet",
      child: true,
      r: 3,
      fromEllis: true,
    });
    if (c) made += 1;
  }
  emit(world, "split", { made });
}

function plantFor(world, p, x, y) {
  if (!p.plants) return;
  if (p.plants === "blossom") {
    plantBlossom(world, { x, y, deliberate: true, refund: p.refundSeal });
  } else if (p.plants === "letter") {
    plantMark(world, { x, y, refund: p.refundSeal });
  }
}

function onHitActor(world, p, actor) {
  if (p.kind === "needle") {
    p.flesh = true;
    return;
  }
  if (p.hitIds.includes(actor.id)) return;
  p.hitIds.push(actor.id);
  const passed = p.passedMarkIds.length + p.passedBlossomIds.length;
  let extra = p.extraMult ?? 1;
  let dmg = p.damage;
  if (p.abilityId === "last-arrow-first" || p.winters || p.kind === "winter" || p.kind === "prepared") {
    if (passed <= 0) dmg *= 0.5;
    else extra *= 1 + 0.35 * Math.min(passed, 3);
  }
  if (p.winters) {
    dmg *= p.falloff;
    p.falloff = Math.max(p.minFalloff, p.falloff - 0.15);
  }
  const res = dealDamage(world, actor, dmg, {
    extraMult: extra,
    fromEllis: p.fromEllis,
    kind: p.kind === "sap" ? "sap" : "shot",
    clean: p.clean,
    stagger: p.stagger,
    displace:
      p.displaceScale > 0
        ? { x: p.dirX * p.displaceScale, y: p.dirY * p.displaceScale }
        : null,
  });
  if (p.wreath && res.amount >= 0 && !res.ignored) tryWreath(world, actor, p.clean && !res.ignored);
  if (p.kind === "winter" || p.winters) {
    for (const id of p.passedBlossomIds) {
      const b = world.blossoms.find((bb) => bb.id === id);
      if (b) bloomBlossom(world, b, { chain: false, source: "fourteen-winters" });
    }
  }
  sparkAt(world, actor.x, actor.y, 8, p.abilityId);
  if (p.plantOnActor && p.plants === "blossom") {
    plantBlossom(world, { x: actor.x, y: actor.y, deliberate: true, refund: 0 });
  }
  if (HIT_HOOKS[p.kind]) HIT_HOOKS[p.kind](world, p, actor, res);
  if (p.pierceLeft > 0) {
    p.pierceLeft -= 1;
    if (p.pierceLeft <= 0) p.alive = false;
  } else {
    p.alive = false;
    if (p.plants === "letter") {
      /* a letter that hits a body is not written */
      emit(world, "letter-lost", { id: actor.id });
    }
  }
}

export function tickProjectiles(world, dt) {
  for (const p of world.projectiles) {
    if (!p.alive) continue;
    const nx = p.x + p.vx * dt;
    const ny = p.y + p.vy * dt;
    notePass(world, p, p.x, p.y, nx, ny);
    wickAlong(world, p, p.x, p.y, nx, ny);
    let blocked = null;
    for (const s of world.seals) {
      if (segHitsRect(p.x, p.y, nx, ny, s)) blocked = "seal";
    }
    if (!blocked) {
      for (const w of world.walls) if (segHitsRect(p.x, p.y, nx, ny, w)) blocked = "wall";
      if (!blocked) {
        for (const c of world.blockers) {
          const d = distPointSeg(c.x, c.y, p.x, p.y, nx, ny);
          if (d.dist < c.r) blocked = "wall";
        }
      }
    }
    if (blocked) {
      if (blocked === "seal" && p.refundSeal) gain(world, p.plants ? "ember" : "sap", p.refundSeal);
      if (p.kind === "split" && !p.child && blocked === "wall") forkSplit(world, p);
      if (p.plants && blocked !== "seal") plantFor(world, p, p.x, p.y);
      if (p.kind === "needle") resolveNeedle(world, p);
      emit(world, "projectile-stop", { id: p.id, reason: blocked, ability: p.abilityId });
      p.alive = false;
      continue;
    }
    let struck = null;
    for (const a of world.actors) {
      if (!a.alive || a.id === p.ownerId || !a.onScreen) continue;
      if (p.hitIds.includes(a.id)) continue;
      const d = distPointSeg(a.x, a.y, p.x, p.y, nx, ny);
      if (d.dist <= a.r + p.r) {
        struck = a;
        break;
      }
    }
    p.x = nx;
    p.y = ny;
    p.traveled += Math.hypot(p.vx * dt, p.vy * dt);
    p.life -= dt;
    if (struck) onHitActor(world, p, struck);
    if (p.alive && p.life <= 0) {
      if (p.plants && !p.plantOnActor) plantFor(world, p, p.x, p.y);
      if (p.plants === "blossom" && p.plantOnActor) {
        /* expired in air: plant at end anyway so a whiff still seeds ground */
        plantFor(world, p, p.x, p.y);
      }
      if (p.kind === "needle") resolveNeedle(world, p);
      p.alive = false;
    } else if (p.alive && p.kind !== "needle" && p.kind !== "sap") {
      sparkAt(world, p.x, p.y, p.r, p.abilityId);
    }
  }
  world.projectiles = world.projectiles.filter((p) => p.alive);
}

function glassTouch(world, te) {
  const A = endpoint(world, te, "a");
  const B = endpoint(world, te, "b");
  if (!A || !B) return;
  for (const actor of world.actors) {
    if (!actor.alive || actor.team !== "foe") continue;
    const prevCross = segmentsCross(actor.px, actor.py, actor.x, actor.y, A.x, A.y, B.x, B.y);
    if (!prevCross) continue;
    shatterGlass(world, te, A, B);
    return;
  }
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function shatterGlass(world, te, A, B) {
  te.alive = false;
  world.counters.tetherBreaks += 1;
  emit(world, "glass-shatter", { id: te.id });
  say(world, "Sugar Glass shatters along the thread.");
  for (const actor of world.actors) {
    if (!actor.alive || actor.kind === "anchor") continue;
    const d = distPointSeg(actor.x, actor.y, A.x, A.y, B.x, B.y);
    if (d.dist > actor.r + 8) continue;
    dealDamage(world, actor, LIMITS.glassBurst, {
      kind: "glass",
      fromEllis: true,
      allowWreath: true,
      ignoreFactor: false,
    });
  }
  let refunds = 0;
  for (const b of [...world.blossoms]) {
    if (!b.alive) continue;
    const d = distPointSeg(b.x, b.y, A.x, A.y, B.x, B.y);
    if (d.dist > b.r + 8) continue;
    snuffBlossom(world, b, "glass");
    if (refunds < 3) {
      gain(world, "ember", 2);
      refunds += 1;
    }
    emit(world, "combo", { id: "glass-orchard", blossom: b.id });
    say(world, "Glass Orchard: the blossom is smothered, not bloomed.");
  }
}

export function tickTethers(world, dt) {
  for (const te of world.tethers) {
    if (!te.alive) continue;
    const A = endpoint(world, te, "a");
    const B = endpoint(world, te, "b");
    if (!A || !B || A.alive === false || B.alive === false) {
      breakTether(world, te, "death");
      continue;
    }
    if (!A.onScreen || !B.onScreen) {
      te.off += dt;
      if (te.off > LIMITS.offscreenGrace) breakTether(world, te, "offscreen");
      continue;
    }
    te.off = 0;
    const block = lineBlocked(world, A, B);
    if (block) {
      breakTether(world, te, block === "seal" ? "seal" : "los");
      continue;
    }
    te.age += dt;
    if (te.age > te.maxAge) {
      breakTether(world, te, "duration");
      continue;
    }
    const d = dist(A, B);
    if (d > te.slack) {
      world._breakActor = A.team === "foe" ? A : B.team === "foe" ? B : null;
      breakTether(world, te, "distance");
      world._breakActor = null;
      continue;
    }
    if (te.glazed) {
      te.glazeArm -= dt;
      if (te.glazeArm <= 0) glassTouch(world, te);
      continue;
    }
    if (te.lease) continue;
    const rel = separating(A, B);
    if (rel > 18 && d > te.slack * 0.7) {
      te.punishCd -= dt;
      if (te.punishCd <= 0) {
        te.punishCd = 0.25;
        const raw = 3 + te.tension * 0.06;
        for (const target of [A, B]) {
          if (!target || target.kind === "anchor" || target.team === "ellis") continue;
          if (target.boss) {
            dealDamage(world, target, raw * LIMITS.bossSeparate, {
              kind: "tether",
              fromEllis: true,
              ignoreFactor: true,
              allowWreath: false,
            });
          } else {
            dealDamage(world, target, raw, {
              kind: "tether",
              fromEllis: true,
              allowWreath: false,
            });
            applyStatus(world, target, { id: "sap-tax", remaining: 0.35, potency: 0.1 }, { noEcho: true });
          }
        }
        emit(world, "separate-punish", { id: te.id });
      }
    }
  }
  world.tethers = world.tethers.filter((t) => t.alive);
}

function separating(A, B) {
  if (A.kind === "anchor" || B.kind === "anchor") {
    const actor = A.kind === "anchor" ? B : A;
    const anchor = A.kind === "anchor" ? A : B;
    const n = norm(actor.x - anchor.x, actor.y - anchor.y);
    return actor.vx * n.x + actor.vy * n.y;
  }
  const n = norm(B.x - A.x, B.y - A.y);
  return (B.vx - A.vx) * n.x + (B.vy - A.vy) * n.y;
}

export function tickLease(world, actor) {
  if (!actor.alive || actor.boss) return;
  for (const te of world.tethers) {
    if (!te.alive || !te.lease) continue;
    let anchor = null;
    if (te.aKind === "anchor" && te.bId === actor.id) anchor = endpoint(world, te, "a");
    if (te.bKind === "anchor" && te.aId === actor.id) anchor = endpoint(world, te, "b");
    if (!anchor) continue;
    const n = norm(actor.x - anchor.x, actor.y - anchor.y);
    const away = actor.vx * n.x + actor.vy * n.y;
    if (away > 0) {
      actor.vx -= n.x * away * 0.25;
      actor.vy -= n.y * away * 0.25;
    }
  }
}

export function tickBlossoms(world, dt) {
  for (const b of world.blossoms) {
    if (!b.alive) continue;
    if (b.banked) continue;
    if (!b.armed) {
      b.arm += dt;
      if (b.arm >= b.armTime) b.armed = true;
    }
    b.life -= dt;
    if (b.life <= 0) {
      b.alive = false;
      emit(world, "blossom-expire", { id: b.id });
    }
  }
  world.blossoms = world.blossoms.filter((b) => b.alive);
  for (const m of world.marks) {
    if (!m.alive || m.banked) continue;
    m.life -= dt;
    if (m.life <= 0) {
      m.alive = false;
      emit(world, "mark-expire", { id: m.id });
    }
  }
  world.marks = world.marks.filter((m) => m.alive);
}

export function tickZones(world, dt) {
  for (const z of world.zones) {
    if (!z.alive) continue;
    z.life -= dt;
    if (z.life <= 0) {
      z.alive = false;
      for (const a of world.actors) if (a.confined === z.id) a.confined = null;
      continue;
    }
    if (z.kind !== "sugarhouse") continue;
    for (const a of world.actors) {
      if (a.confined !== z.id || !a.alive || a.boss) continue;
      const r = a.r;
      a.x = clamp(a.x, z.x + r, z.x + z.w - r);
      a.y = clamp(a.y, z.y + r, z.y + z.h - r);
    }
  }
  world.zones = world.zones.filter((z) => z.alive);
}

export function tickStatuses(world, dt) {
  if (world.tithe > 0) world.tithe = Math.max(0, world.tithe - dt);
  if (world.quenchCd > 0) world.quenchCd = Math.max(0, world.quenchCd - dt);
  for (const a of world.actors) {
    if (a.iframe > 0) a.iframe = Math.max(0, a.iframe - dt);
    if (a.rooted > 0) a.rooted = Math.max(0, a.rooted - dt);
    if (a.stagger > 0) a.stagger = Math.max(0, a.stagger - dt);
    if (a.wreath > 0) {
      a.wreathTimer -= dt;
      if (a.wreathTimer <= 0) {
        a.wreath -= 1;
        a.wreathTimer = LIMITS.wreathDecay;
        emit(world, "wreath-decay", { id: a.id, n: a.wreath });
      }
    }
    for (const s of a.statuses) s.remaining -= dt;
    a.statuses = a.statuses.filter((s) => s.remaining > 0);
  }
}

export function updateAwareness(world, rect) {
  const r = rect ?? world.camera;
  for (const a of world.actors) {
    const on =
      a.x + a.r >= r.x && a.x - a.r <= r.x + r.w && a.y + a.r >= r.y && a.y - a.r <= r.y + r.h;
    if (a._awarenessLock != null) a.onScreen = a._awarenessLock;
    else a.onScreen = on;
  }
  for (const a of world.anchors) {
    if (a._awarenessLock != null) a.onScreen = a._awarenessLock;
    else a.onScreen = pointInRect(a.x, a.y, r) || (a.x >= r.x && a.x <= r.x + r.w && a.y >= r.y && a.y <= r.y + r.h);
  }
}

export function isClean(world, target) {
  const e = ellisOf(world);
  if (!e || !target) return false;
  const speed = Math.hypot(e.vx, e.vy);
  if (speed > LIMITS.cleanSpeed) return false;
  const ang = Math.atan2(target.y - e.y, target.x - e.x);
  let d = ang - e.facing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d) <= LIMITS.cleanAngle;
}

export function faceVec(actor) {
  return { x: Math.cos(actor.facing), y: Math.sin(actor.facing) };
}

export function aimEllis(world, action) {
  const e = ellisOf(world);
  if (!e || !action || action.aimX == null || action.aimY == null) return e;
  const dx = action.aimX - e.x;
  const dy = action.aimY - e.y;
  if (Math.hypot(dx, dy) > 1) e.facing = Math.atan2(dy, dx);
  return e;
}

/** Foes inside the pruning-hook arc. Never picks an offscreen body. */
export function foesInArc(world) {
  const e = ellisOf(world);
  if (!e) return [];
  const out = [];
  for (const a of world.actors) {
    if (!a.alive || a.team !== "foe" || !a.onScreen) continue;
    const dx = a.x - e.x;
    const dy = a.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d > LIMITS.meleeRange + a.r * 0.3) continue;
    const ang = Math.atan2(dy, dx);
    let diff = ang - e.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > LIMITS.meleeArc) continue;
    out.push(a);
  }
  return out;
}

export { HANDLERS };
