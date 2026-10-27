import { REFERENCE_UNITS as U } from "../reference/units.js";
import { applyHit, bladeDamage, spinDamage } from "./combat.js";
import {
  DIRS,
  bodyRect,
  dist,
  ellisHurt,
  faceToward,
  hasLineOfSight,
  parseArena,
  placeBox,
  rectsOverlap,
  tileAt,
  tryMove,
  DEFAULT_ARENA,
} from "./geometry.js";
import {
  beginTick,
  createMachine,
  effectiveFrames,
  endTick,
  forceState,
  machineState,
} from "./fsm.js";

export const predicates = {
  sees: (ctx) => ctx.sees,
  lost: (ctx) => !ctx.sees,
  dist_lt: (ctx, tr) => ctx.dist < tr.value,
  dist_gt: (ctx, tr) => ctx.dist > tr.value,
  hp_lte: (ctx, tr) => ctx.hp <= tr.value,
  idle_gte: (ctx, tr) => ctx.playerIdle >= tr.value,
  blade: (ctx) => ctx.bladeOut,
  no_blade: (ctx) => !ctx.bladeOut,
  tool: (ctx, tr) => ctx.tool === tr.tool,
  lamp: (ctx) => ctx.lamp,
  no_lamp: (ctx) => !ctx.lamp,
  facing_away: (ctx) => ctx.facingAway,
  facing_me: (ctx) => !ctx.facingAway,
  behind: (ctx) => ctx.behind,
  flag: (ctx, tr) => !!ctx.flags[tr.flag],
  no_flag: (ctx, tr) => !ctx.flags[tr.flag],
  form: (ctx, tr) => ctx.form === tr.form,
  mercy_ready: (ctx) => ctx.mercyReady,
  on_lane: (ctx) => ctx.onLane,
  always: () => true,
};

function snapshot(machine) {
  return { state: machine.state, frame: machine.frame, entered: machine.entered };
}

function restore(machine, snap) {
  machine.state = snap.state;
  machine.frame = snap.frame;
  machine.entered = snap.entered;
}

function arcSees(enemy, ellis, arcDeg) {
  if (arcDeg >= 360) return true;
  const dir = DIRS[enemy.facing];
  const dx = ellis.x - enemy.x;
  const dy = ellis.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  const dot = (dx / len) * dir.x + (dy / len) * dir.y;
  const limit = Math.cos((arcDeg * Math.PI) / 360);
  return dot >= limit;
}

function computeSees(enemy, ellis, world) {
  const det = enemy.def.detection;
  if (det.aggro === "never") return false;
  const d = dist(enemy, ellis);
  if (d > det.sight_px) return false;
  if (det.los && !hasLineOfSight(world.arena, enemy, ellis)) return false;
  if (det.aggro === "blade") return !!(ellis.bladeOut || ellis.action);
  if (det.aggro === "lamp") return !!ellis.lamp;
  if (det.aggro === "zone") return !!ellis.onZone;
  if (!arcSees(enemy, ellis, det.arc_deg ?? 360)) return false;
  return true;
}

function mercyReady(enemy, ellis) {
  const mercy = enemy.def.mercy;
  if (!mercy?.available || !mercy.ready) return false;
  const ready = mercy.ready;
  if (ready.tool && ellis.tool !== ready.tool) return false;
  if (ready.lamp && !ellis.lamp) return false;
  if (ready.no_blade && (ellis.bladeOut || ellis.action)) return false;
  if (ready.face && isFacingAway(ellis, enemy)) return false;
  if (ready.front && isBehind(enemy, ellis)) return false;
  if (ready.no_lamp && ellis.lamp) return false;
  if ((ready.idle || 0) > ellis.idle) return false;
  if (ready.form && ellis.form !== ready.form) return false;
  if (ready.flag && !enemy.flags[ready.flag]) return false;
  return true;
}

function isBehind(enemy, ellis) {
  const dir = DIRS[enemy.facing];
  const dx = ellis.x - enemy.x;
  const dy = ellis.y - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  return (dx / len) * dir.x + (dy / len) * dir.y < -0.35;
}

function isFacingAway(ellis, enemy) {
  const dir = DIRS[ellis.facing];
  const dx = enemy.x - ellis.x;
  const dy = enemy.y - ellis.y;
  return dx * dir.x + dy * dir.y <= 0;
}

function buildCtx(enemy, world) {
  const ellis = world.ellis;
  return {
    tellBonus: world.profile.tell_bonus || 0,
    dist: dist(enemy, ellis),
    sees: computeSees(enemy, ellis, world),
    hp: enemy.hp,
    playerIdle: ellis.idle,
    bladeOut: !!(ellis.bladeOut || ellis.action),
    tool: ellis.tool,
    lamp: !!ellis.lamp,
    facingAway: isFacingAway(ellis, enemy),
    behind: isBehind(enemy, ellis),
    flags: enemy.flags,
    form: ellis.form,
    mercyReady: mercyReady(enemy, ellis),
    onLane: !!ellis.onLane,
  };
}

export function attackRect(enemy, attack) {
  if (attack.anchor === "ellis_at_tell" && enemy.anchor) {
    const w = attack.shape.w || attack.shape.across || 20;
    const h = attack.shape.h || attack.shape.along || 20;
    return { x: enemy.anchor.x - w / 2, y: enemy.anchor.y - h / 2, w, h };
  }
  if (attack.kind === "charge") {
    const facing = enemy.lockedFacing || enemy.facing;
    const origin = enemy.lockedPos || enemy;
    const length = (attack.charge_speed || 2) * (attack.active || 24) + 12;
    const across = (attack.shape?.across || 16) + 4;
    if (facing === "E") return { x: origin.x, y: origin.y - across / 2, w: length, h: across };
    if (facing === "W")
      return { x: origin.x - length, y: origin.y - across / 2, w: length, h: across };
    if (facing === "S") return { x: origin.x - across / 2, y: origin.y, w: across, h: length };
    return { x: origin.x - across / 2, y: origin.y - length, w: across, h: length };
  }
  if (attack.shape?.absolute) return { ...attack.shape };
  const origin = enemy.lockedPos || enemy;
  const facing = enemy.lockedFacing || enemy.facing;
  return placeBox(origin, facing, attack.shape || { ox: 16, along: 16, across: 14 });
}

function makeActor(def, pos, profile, delay = 0) {
  const machine = createMachine({ ...def, initial: def.detection.initial });
  return {
    id: def.id,
    kind: "enemy",
    def,
    machine,
    x: pos.x,
    y: pos.y,
    facing: pos.facing || "S",
    hp: def.stats.hp,
    maxHp: def.stats.hp,
    alive: true,
    spared: false,
    hitstun: 0,
    hyperarmor: 0,
    poise: 0,
    consecutiveStunHits: 0,
    iframes: 0,
    footprint: {
      w: def.silhouette.footprint_px[0],
      h: def.silhouette.footprint_px[1],
    },
    flags: {},
    sleep: delay,
    struckThisSwing: false,
    lockedFacing: null,
    lockedPos: null,
    anchor: null,
    tellStarted: -999,
    returnState: def.return_state || def.detection.initial,
  };
}

function makeEllis(pos, form, profile, script) {
  const hp = U.ellis.hp[form] + (profile.bonus_hp || 0);
  return {
    id: "ellis",
    kind: "ellis",
    form,
    x: pos.x,
    y: pos.y,
    facing: script.facing || "N",
    hp,
    maxHp: hp,
    alive: true,
    hitstun: 0,
    iframes: 0,
    baseIframes: U.ellis.iframes_on_hit[form],
    action: null,
    bladeOut: !!script.bladeOut,
    tool: script.tool || null,
    lamp: script.lamp ?? script.tool === "lamp",
    idle: 0,
    blocking: script.mode === "block",
    onZone: false,
    onLane: false,
    speed: U.ellis.walk_px_per_frame[form],
  };
}

function moveActor(actor, dirName, speed, arena) {
  if (!dirName || dirName === "hold") return false;
  const step = Math.min(Math.abs(speed), 2.8);
  return tryMove(actor, dirName, step, arena, { stopAtHazard: true });
}

function applyEnemyMove(enemy, state, world) {
  const move = state.move || { type: "hold" };
  const ellis = world.ellis;
  if (state.kind === "telegraph") {
    enemy.facing = enemy.lockedFacing || enemy.facing;
    return;
  }
  if (move.type === "hold" || !move.type) return;
  if (move.type === "charge") {
    const facing = enemy.lockedFacing || enemy.facing;
    enemy.facing = facing;
    tryMove(enemy, facing, move.speed || 2, world.arena, { stopAtHazard: true });
    return;
  }
  if (move.type === "seek" || move.type === "flee" || move.type === "axis") {
    const toward = move.type !== "flee";
    let dir = faceToward(enemy, ellis);
    if (!toward) {
      const back = { N: "S", S: "N", E: "W", W: "E" };
      dir = back[dir];
    }
    if (move.type === "axis") {
      const dx = Math.abs(ellis.x - enemy.x);
      const dy = Math.abs(ellis.y - enemy.y);
      dir = dx > dy ? (ellis.x > enemy.x ? "E" : "W") : ellis.y > enemy.y ? "S" : "N";
      if (!toward) dir = { N: "S", S: "N", E: "W", W: "E" }[dir];
    }
    enemy.facing = dir;
    moveActor(enemy, dir, move.speed || enemy.def.stats.speed || 0.45, world.arena);
    return;
  }
  if (move.type === "patrol") {
    enemy.patrolDir = enemy.patrolDir || move.dir || "E";
    const moved = moveActor(enemy, enemy.patrolDir, move.speed || 0.6, world.arena);
    if (!moved) {
      enemy.patrolDir = { E: "W", W: "E", N: "S", S: "N" }[enemy.patrolDir];
    }
    enemy.facing = enemy.patrolDir;
  }
}

function dangerFromEnemy(enemy, world) {
  const state = machineState(enemy.machine);
  if (!state?.attack) return null;
  const attack = enemy.def.attacks[state.attack];
  if (!attack) return null;
  if (state.kind === "telegraph") {
    if (enemy.machine.frame < world.profile.reaction_frames) return null;
    const total = effectiveFrames(state, { tellBonus: world.profile.tell_bonus || 0 });
    const remaining = Math.max(0, total - enemy.machine.frame);
    if (attack.kind === "projectile") {
      const facing = enemy.lockedFacing || enemy.facing;
      const origin = enemy.lockedPos || enemy;
      const dir = DIRS[facing];
      const samples = [];
      let x = origin.x + dir.x * 12;
      let y = origin.y + dir.y * 12;
      const life = attack.lifetime || 60;
      const speed = attack.speed || 1.4;
      for (let i = 0; i < life && i < 80; i++) {
        samples.push({
          t: world.tick + remaining + i,
          rect: { x: x - 5, y: y - 5, w: 10, h: 10 },
        });
        x += dir.x * speed;
        y += dir.y * speed;
      }
      return { samples, damage: attack.damage || 1, id: state.attack, source: enemy.id };
    }
    const rect = attackRect(enemy, attack);
    return {
      t0: world.tick + remaining,
      t1: world.tick + remaining + (attack.active || 6),
      rect,
      damage: attack.damage || 0,
      id: state.attack,
      source: enemy.id,
    };
  }
  if (state.kind === "active" || state.kind === "zone") {
    const rect = attackRect(enemy, attack);
    return {
      t0: world.tick,
      t1: world.tick + 8,
      rect,
      damage: attack.damage || 0,
      id: state.attack,
      source: enemy.id,
      live: true,
    };
  }
  return null;
}

function predicted(world) {
  const list = [];
  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.spared) continue;
    const danger = dangerFromEnemy(enemy, world);
    if (danger) list.push(danger);
  }
  for (const shot of world.projectiles) {
    const samples = [];
    let x = shot.x;
    let y = shot.y;
    const dir = DIRS[shot.facing];
    for (let i = 0; i <= shot.life && i < 24; i++) {
      samples.push({
        t: world.tick + i,
        rect: { x: x - shot.w / 2, y: y - shot.h / 2, w: shot.w, h: shot.h },
      });
      x += dir.x * shot.speed;
      y += dir.y * shot.speed;
    }
    list.push({ samples, damage: shot.damage, id: shot.attack, source: shot.owner, live: true });
  }
  for (const extra of world.scriptedDangers || []) {
    if (world.tick < extra.tellStart + world.profile.reaction_frames) continue;
    if (world.tick > extra.t1) continue;
    list.push(extra);
  }
  return list;
}

function overlapsAt(danger, hurt, t) {
  if (danger.samples) {
    return danger.samples.some((sample) => sample.t === t && rectsOverlap(sample.rect, hurt));
  }
  if (t < danger.t0 || t >= danger.t1) return false;
  return rectsOverlap(expand(danger.rect, 0), hurt);
}

function expand(rect, px) {
  return { x: rect.x - px, y: rect.y - px, w: rect.w + px * 2, h: rect.h + px * 2 };
}

function ghostCost(world, dirName, dangers, frames) {
  const ghost = { x: world.ellis.x, y: world.ellis.y };
  let cost = 0;
  for (let i = 1; i <= frames; i++) {
    if (dirName !== "hold")
      tryMove(ghost, dirName, world.ellis.speed, world.arena, { stopAtHazard: true });
    const hurt = ellisHurt(ghost);
    for (const danger of dangers) {
      if (overlapsAt(danger, hurt, world.tick + i)) cost += 100 * (danger.damage || 1);
    }
    for (const enemy of world.enemies) {
      if (!enemy.alive || enemy.spared) continue;
      if ((enemy.def.stats.contact_damage || 0) > 0 && rectsOverlap(hurt, bodyRect(enemy))) {
        cost += 40;
      }
    }
  }
  return cost;
}

function bestDir(world, dangers) {
  const options = ["hold", "N", "E", "S", "W"];
  let best = null;
  for (const dir of options) {
    const cost = ghostCost(world, dir, dangers, 46);
    const end = ghostEnd(world, dir, 46);
    let sep = 999;
    if (dangers.length) {
      sep = Math.min(
        ...dangers.map((danger) => {
          const rect = danger.rect || danger.samples?.[0]?.rect;
          if (!rect) return 999;
          const cx = rect.x + rect.w / 2;
          const cy = rect.y + rect.h / 2;
          return Math.hypot(end.x - cx, end.y - cy);
        }),
      );
    }
    if (!best || cost < best.cost - 0.01) best = { dir, cost, sep };
    else if (best.dir !== "hold" && Math.abs(cost - best.cost) < 0.01 && sep > best.sep + 0.5) {
      best = { dir, cost, sep };
    }
  }
  return best;
}

function ghostEnd(world, dirName, frames) {
  const ghost = { x: world.ellis.x, y: world.ellis.y };
  for (let i = 0; i < frames; i++) {
    if (dirName !== "hold")
      tryMove(ghost, dirName, world.ellis.speed, world.arena, { stopAtHazard: true });
  }
  return ghost;
}

function nearestEnemy(world) {
  let best = null;
  let bestD = Infinity;
  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.spared) continue;
    const d = dist(world.ellis, enemy);
    if (d < bestD) {
      best = enemy;
      bestD = d;
    }
  }
  return best;
}

function punishWindow(enemy) {
  const state = machineState(enemy.machine);
  return !!state && (enemy.def.defeat.windows || []).includes(state.id);
}

function startSpin(world) {
  const ellis = world.ellis;
  ellis.action = { name: "spin", frame: 0, hit: false };
  ellis.bladeOut = true;
  ellis.idle = 0;
}

function resolveSpin(world) {
  const ellis = world.ellis;
  if (!ellis.action || ellis.action.hit) return;
  const radius = U.ellis.blade_spin.radius_px;
  const targets = [...world.enemies];
  if (world.boss) targets.push(world.boss);
  for (const enemy of targets) {
    if (enemy.spared) continue;
    if (enemy.alive === false) continue;
    if (dist(ellis, enemy) > radius + 8) continue;
    ellis.action.hit = true;
    const family = enemy.family || enemy.def?.family;
    const amount = spinDamage(ellis.form, family);
    if (enemy === world.boss) bossTakeHit(world, amount, "spin");
    else {
      applyHit(
        enemy,
        amount,
        { attack: "blade_spin", id: "ellis", hitstun: U.ellis.blade_spin.hitstun_dealt },
        world,
      );
      world.hitsLanded += 1;
    }
  }
}

function bossTakeHit(world, amount, attack) {
  const boss = world.boss;
  if (!boss || boss.resolved) return;
  if (!boss.vulnerable) {
    boss.banked += amount;
    world.events.push({ t: world.tick, type: "banked", amount, attack });
    return;
  }
  boss.hp -= amount;
  world.events.push({ t: world.tick, type: "boss_hit", amount, attack });
  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.killed = true;
    if (boss.win === "hp") {
      boss.resolved = true;
      boss.resolvedAt = world.tick;
    }
  }
}

function refreshBoss(world) {
  const boss = world.boss;
  if (!boss || boss.resolved) return;
  const ellis = world.ellis;
  for (const point of boss.checkpoints || []) {
    if (point.id && dist(ellis, point) <= 10) boss.visited.add(point.id);
  }
  if (boss.gate === "tool" && ellis.tool === boss.tool && dist(ellis, boss.socket) <= 18) {
    if (world.tick >= boss.earliest && world.tick <= boss.earliest + boss.window)
      boss.mechanic = true;
  }
  if (
    boss.gate === "sheathe" &&
    !ellis.bladeOut &&
    !ellis.action &&
    ellis.idle >= boss.sheatheFrames
  ) {
    if (world.tick >= boss.earliest) boss.mechanic = true;
  }
  if (boss.gate === "tiles") {
    const need = boss.tiles || [];
    boss.mechanic = need.every((id) => boss.visited.has(id));
  }
  const timed = world.tick >= boss.earliest;
  if (boss.gate === "endure") boss.vulnerable = timed;
  else boss.vulnerable = timed && !!boss.mechanic;
  if (boss.win === "endure" && boss.vulnerable && world.damageTaken === 0 && ellis.alive) {
    boss.resolved = true;
    boss.resolvedAt = world.tick;
  }
  if (boss.win === "mechanic" && boss.vulnerable && boss.mechanic) {
    boss.resolved = true;
    boss.resolvedAt = world.tick;
  }
}

function resolveScripted(world) {
  const hurt = ellisHurt(world.ellis);
  for (const danger of world.scriptedDangers) {
    if (world.tick < danger.t0 || world.tick >= danger.t1) continue;
    if (danger.hit) continue;
    if (!rectsOverlap(danger.rect, hurt)) continue;
    danger.hit = true;
    const hit = applyHit(
      world.ellis,
      danger.damage || 1,
      { attack: danger.id, id: danger.source || danger.id, hitstun: 8 },
      world,
    );
    if (!hit.ignored && hit.damage > 0) {
      world.damageTaken += hit.damage;
      world.hitBy.push(danger.id);
    }
  }
}
function startTap(world, target) {
  const ellis = world.ellis;
  ellis.facing = faceToward(ellis, target);
  ellis.action = { name: "tap", frame: 0, hit: false };
  ellis.bladeOut = true;
  ellis.idle = 0;
}

function resolveBlade(world) {
  const ellis = world.ellis;
  if (!ellis.action || ellis.action.hit) return;
  const rect = bladeRect(ellis);
  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.spared) continue;
    if (!rectsOverlap(rect, bodyRect(enemy))) continue;
    ellis.action.hit = true;
    const amount = bladeDamage(ellis.form, enemy.def.family);
    applyHit(
      enemy,
      amount,
      { attack: "blade_tap", id: "ellis", hitstun: U.ellis.blade_tap.hitstun_dealt },
      world,
    );
    world.hitsLanded += 1;
    if (enemy.def.lifecycle.on_death?.forfeit && !enemy.alive) {
      enemy.flags[enemy.def.lifecycle.on_death.forfeit] = true;
    }
  }
}

function bladeRect(ellis) {
  const dir = DIRS[ellis.facing];
  const cx = ellis.x + dir.x * U.ellis.blade_tap.reach_center_px;
  const cy = ellis.y + dir.y * U.ellis.blade_tap.reach_center_px;
  const { w, h } = U.ellis.blade_tap.hitbox;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

function applyTool(world, enemy) {
  const ellis = world.ellis;
  const spec = enemy.def.tools[ellis.tool];
  if (!spec || spec.effect === "none") return false;
  const state = machineState(enemy.machine);
  if (spec.states && !spec.states.includes("*") && !spec.states.includes(state.id)) return false;
  if (dist(ellis, enemy) > (spec.range || 56)) return false;
  if (ellis.toolLatch === enemy.id + spec.effect) return false;
  ellis.toolLatch = enemy.id + spec.effect;
  if (spec.damage) {
    applyHit(
      enemy,
      spec.damage,
      { attack: spec.effect, id: "tool", hitstun: spec.stun || 8 },
      world,
    );
    world.hitsLanded += 1;
  }
  if (spec.flag) enemy.flags[spec.flag] = true;
  if (spec.effect === "pacify" || spec.effect === "catch") {
    enemy.spared = true;
    enemy.flags.spared = true;
    const drop = enemy.def.lifecycle.on_spare;
    if (drop?.drop) enemy.flags.drop = drop.drop;
    forceState(enemy.machine, "spared");
  } else if (spec.goto) {
    forceState(enemy.machine, spec.goto);
  }
  world.events.push({
    t: world.tick,
    type: "tool",
    tool: ellis.tool,
    enemy: enemy.id,
    effect: spec.effect,
  });
  return true;
}

function moveToward(world, point) {
  const ellis = world.ellis;
  const dx = point.x - ellis.x;
  const dy = point.y - ellis.y;
  if (Math.hypot(dx, dy) < 2) return false;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : dy > 0 ? "S" : "N";
  ellis.facing = faceToward(ellis, point);
  ellis.lastDir = dir;
  return moveActor(ellis, dir, ellis.speed, world.arena);
}

function attackBusy(world) {
  return world.enemies.some((enemy) => {
    if (!enemy.alive || enemy.spared) return false;
    const kind = machineState(enemy.machine)?.kind;
    return kind === "telegraph" || kind === "active" || kind === "zone";
  });
}

function stepEllis(world, script) {
  const ellis = world.ellis;
  if (ellis.iframes > 0) ellis.iframes -= 1;
  if (!ellis.alive) return;
  if (ellis.hitstun > 0) {
    ellis.hitstun -= 1;
    ellis.idle = 0;
    return;
  }
  if (ellis.action) {
    ellis.action.frame += 1;
    if (ellis.action.name === "spin") {
      const spin = U.ellis.blade_spin;
      if (ellis.action.frame >= spin.startup && ellis.action.frame < spin.startup + spin.active)
        resolveSpin(world);
      if (ellis.action.frame >= spin.total) ellis.action = null;
      return;
    }
    const tap = U.ellis.blade_tap;
    if (ellis.action.frame >= tap.startup && ellis.action.frame < tap.startup + tap.active)
      resolveBlade(world);
    if (ellis.action.frame >= tap.total) ellis.action = null;
    if (ellis.action) return;
  }

  const mode = script.mode;
  if (mode === "foolish") {
    ellis.idle = 0;
    if (script.oscillate) {
      const dir = Math.floor(world.tick / 18) % 2 === 0 ? "E" : "W";
      moveActor(ellis, dir, ellis.speed, world.arena);
    }
    if (script.bladeOut) ellis.bladeOut = true;
    return;
  }

  if (mode === "greedy" || mode === "greedy_spin") {
    ellis.bladeOut = true;
    ellis.idle = 0;
    const target = world.boss || nearestEnemy(world);
    if (!target) return;
    const d = dist(ellis, target);
    if (mode === "greedy_spin") {
      if (d > 16) moveToward(world, target);
      else startSpin(world);
      return;
    }
    if (d > 20) moveToward(world, target);
    else startTap(world, target);
    return;
  }

  const freshTell = world.enemies.some((enemy) => enemy.tellStarted === world.tick);
  if (freshTell && mode !== "foolish") ellis.reactionLock = world.profile.reaction_frames;
  if ((ellis.reactionLock || 0) > 0 && mode !== "block" && mode !== "foolish") {
    ellis.reactionLock -= 1;
    if (ellis.lastDir) moveActor(ellis, ellis.lastDir, ellis.speed, world.arena);
    return;
  }

  const dangers = predicted(world);
  const escape = bestDir(world, dangers);
  if (mode !== "block" && escape.dir !== "hold") {
    ellis.lastDir = escape.dir;
    moveActor(ellis, escape.dir, ellis.speed, world.arena);
    ellis.idle = 0;
    return;
  }
  if (mode !== "block" && escape.cost > 0) {
    ellis.idle = 0;
    return;
  }

  if (mode === "blade") {
    const target = nearestEnemy(world);
    if (!target) return;
    ellis.bladeOut = true;
    ellis.idle = 0;
    const stateId = target.machine.state;
    if (ellis.punishState !== stateId) {
      ellis.punishState = stateId;
      ellis.tappedThis = false;
    }
    const d = dist(ellis, target);
    if (attackBusy(world) && !punishWindow(target)) return;
    if (punishWindow(target) && !ellis.action) {
      if (!ellis.tappedThis) {
        if (d > 21) {
          moveToward(world, target);
          return;
        }
        if (d < 15) {
          moveActor(ellis, faceToward(target, ellis), ellis.speed, world.arena);
          return;
        }
        startTap(world, target);
        ellis.tappedThis = true;
        return;
      }
      if (d < 48) moveActor(ellis, faceToward(target, ellis), ellis.speed, world.arena);
      return;
    }
    // Enter the trigger ring (~28px) so a tell can start, then the escape branch runs.
    if (d > 30) moveToward(world, target);
    else if (d < 24) moveActor(ellis, faceToward(target, ellis), ellis.speed, world.arena);
    return;
  }

  if (mode === "dodge") {
    const target = nearestEnemy(world);
    if (target && dist(ellis, target) < 42) {
      moveActor(ellis, faceToward(target, ellis), ellis.speed, world.arena);
    }
    ellis.bladeOut = false;
    ellis.idle += 1;
    return;
  }

  if (mode === "block") {
    ellis.blocking = true;
    ellis.tool = "block_rod";
    const point = script.point;
    if (point) moveToward(world, point);
    const target = nearestEnemy(world);
    if (target) ellis.facing = faceToward(ellis, target);
    ellis.idle = 0;
    return;
  }

  if (mode === "route") {
    ellis.bladeOut = !!script.bladeOut;
    if (script.tool) ellis.tool = script.tool;
    if (script.lamp) ellis.lamp = true;
    const points = script.checkpoints || [];
    if (!ellis.cleared) ellis.cleared = new Set();
    for (const point of points) {
      const key = point.id || `${point.x},${point.y}`;
      if (dist(ellis, point) <= 10) ellis.cleared.add(key);
    }
    const goal = points.find((point) => !ellis.cleared.has(point.id || `${point.x},${point.y}`));
    if (goal) moveToward(world, goal);
    else ellis.idle += 1;
    return;
  }

  // mercy, tool, puzzle, nonlethal
  ellis.bladeOut = false;
  if (script.tool) ellis.tool = script.tool;
  if (script.lamp || ellis.tool === "lamp") ellis.lamp = true;
  if (script.face !== false) {
    const target = nearestEnemy(world);
    if (target && script.face) ellis.facing = faceToward(ellis, target);
  }
  if (script.point) moveToward(world, script.point);
  ellis.idle += 1;
  const target = nearestEnemy(world);
  if (target && ellis.tool && mode !== "nonlethal") applyTool(world, target);
  if (target && mercyReady(target, ellis) && !target.spared) {
    target.spared = true;
    target.flags.spared = true;
    const drop = target.def.lifecycle.on_spare;
    if (drop?.drop) target.flags.drop = drop.drop;
    if (drop?.flag) target.flags[drop.flag] = true;
    forceState(target.machine, "spared");
  }
}

function resolveEnemyAttacks(world) {
  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.spared) continue;
    const state = machineState(enemy.machine);
    if (!state?.attack) continue;
    const attack = enemy.def.attacks[state.attack];
    if (!attack || attack.kind === "projectile") continue;
    if (state.kind !== "active" && state.kind !== "zone") continue;
    const rect = attackRect(enemy, attack);
    const hurt = ellisHurt(world.ellis);
    if (!rectsOverlap(rect, hurt)) continue;
    if (enemy.struckThisSwing && state.kind !== "zone") continue;
    if (state.kind === "zone") {
      enemy.zoneCd = (enemy.zoneCd || 0) - 1;
      if (enemy.zoneCd > 0) continue;
      enemy.zoneCd = 30;
    }
    enemy.struckThisSwing = true;
    if (world.ellis.blocking && attack.blockable) {
      enemy.flags.blocked = true;
      world.events.push({ t: world.tick, type: "block", attack: state.attack, enemy: enemy.id });
      if (enemy.def.defeat.block_goto) forceState(enemy.machine, enemy.def.defeat.block_goto);
      continue;
    }
    const hit = applyHit(
      world.ellis,
      attack.damage || 1,
      { attack: state.attack, id: enemy.id, hitstun: attack.hitstun || 8 },
      world,
    );
    if (!hit.ignored && hit.damage > 0) {
      world.damageTaken += hit.damage;
      world.hitBy.push(state.attack);
      const kb = attack.knockback_px || 0;
      if (kb > 0) {
        const mult = enemy.def.forms[world.ellis.form]?.knockback_taken_mult;
        const px = mult ? kb * mult : kb;
        const facing = enemy.lockedFacing || enemy.facing;
        for (let i = 0; i < Math.round(px); i++) {
          tryMove(world.ellis, facing, 1, world.arena, { stopAtHazard: true });
        }
      }
    }
  }
}

function spawnProjectile(enemy, attack, world) {
  const cap = world.profile.projectile_cap;
  if (world.projectiles.length >= cap) {
    world.projectiles.shift();
    world.fizzles += 1;
  }
  const origin = enemy.lockedPos || enemy;
  const facing = enemy.lockedFacing || enemy.facing;
  const dir = DIRS[facing];
  world.projectiles.push({
    owner: enemy.id,
    attack: attack.id || "shot",
    x: origin.x + dir.x * 12,
    y: origin.y + dir.y * 12,
    facing,
    speed: attack.speed || 1.4,
    life: attack.lifetime || 60,
    w: 8,
    h: 8,
    damage: attack.damage || 1,
    hit: false,
  });
}

function stepProjectiles(world) {
  const next = [];
  for (const shot of world.projectiles) {
    const dir = DIRS[shot.facing];
    shot.x += dir.x * shot.speed;
    shot.y += dir.y * shot.speed;
    shot.life -= 1;
    const tile = tileAt(world.arena, shot.x, shot.y);
    if (!tile || tile.kind === "wall" || shot.life <= 0) continue;
    if (
      !shot.hit &&
      rectsOverlap({ x: shot.x - 4, y: shot.y - 4, w: 8, h: 8 }, ellisHurt(world.ellis))
    ) {
      shot.hit = true;
      const hit = applyHit(
        world.ellis,
        shot.damage,
        { attack: shot.attack, id: shot.owner, hitstun: 8 },
        world,
      );
      if (!hit.ignored && hit.damage > 0) {
        world.damageTaken += hit.damage;
        world.hitBy.push(shot.attack);
      }
      continue;
    }
    next.push(shot);
  }
  world.projectiles = next;
  world.maxProjectiles = Math.max(world.maxProjectiles, world.projectiles.length);
}

function stepEnemy(enemy, world) {
  if (!enemy.alive || enemy.spared) return;
  if (enemy.sleep > 0) {
    enemy.sleep -= 1;
    return;
  }
  if (enemy.hyperarmor > 0) enemy.hyperarmor -= 1;
  if (enemy.hitstun > 0 && enemy.hyperarmor <= 0) {
    enemy.hitstun -= 1;
    return;
  }
  const ctx = buildCtx(enemy, world);
  const begun = beginTick(enemy.machine);
  const state = begun.state;
  if (begun.entered) {
    if (state.kind === "telegraph") {
      if (state.keep_facing) enemy.lockedFacing = enemy.facing;
      else enemy.lockedFacing = state.face || faceToward(enemy, world.ellis);
      enemy.facing = enemy.lockedFacing;
      enemy.lockedPos = { x: enemy.x, y: enemy.y };
      enemy.anchor = { x: world.ellis.x, y: world.ellis.y };
      enemy.tellStarted = world.tick;
      world.telegraphs.push({
        t: world.tick,
        source: enemy.id,
        attack: state.attack,
        resolve: world.tick + effectiveFrames(state, ctx),
      });
    }
    if (state.kind === "active") enemy.struckThisSwing = false;
    if (state.kind === "active" && state.attack) {
      const attack = enemy.def.attacks[state.attack];
      if (attack?.kind === "projectile")
        spawnProjectile(enemy, { ...attack, id: state.attack }, world);
    }
    if (state.kind === "spared") {
      enemy.spared = true;
      enemy.flags.spared = true;
    }
    if (state.set_flag) enemy.flags[state.set_flag] = true;
  }
  if (state.superarmor) enemy.hyperarmor = Math.max(enemy.hyperarmor || 0, 2);
  if (state.kind !== "dead" && state.kind !== "spared") applyEnemyMove(enemy, state, world);
  const snap = snapshot(enemy.machine);
  const result = endTick(enemy.machine, ctx, predicates);
  if (result.next) {
    const next = machineState(enemy.machine);
    if (
      next?.kind === "telegraph" &&
      world.conductor === "stagger" &&
      someoneAttacking(world, enemy)
    ) {
      restore(enemy.machine, snap);
    }
  }
}

function slimArena(map) {
  return {
    cols: map.cols,
    rows: map.rows,
    tiles: map.tiles.map((tile) => ({
      tx: tile.tx,
      ty: tile.ty,
      kind: tile.kind,
      ch: tile.ch,
    })),
  };
}

function captureFrame(world) {
  const hazards = [];
  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.spared) continue;
    const state = machineState(enemy.machine);
    if (!state?.attack) continue;
    if (state.kind !== "telegraph" && state.kind !== "active" && state.kind !== "zone") continue;
    const attack = enemy.def.attacks[state.attack];
    if (!attack || attack.kind === "projectile") continue;
    const rect = attackRect(enemy, attack);
    hazards.push({
      kind: state.kind,
      id: state.attack,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
    });
  }
  for (const danger of world.scriptedDangers || []) {
    const telling = world.tick >= danger.tellStart && world.tick < danger.t0;
    const live = world.tick >= danger.t0 && world.tick < danger.t1;
    if (!telling && !live) continue;
    hazards.push({
      kind: live ? "active" : "telegraph",
      id: danger.id,
      x: danger.rect.x,
      y: danger.rect.y,
      w: danger.rect.w,
      h: danger.rect.h,
    });
  }
  if (world.protect) {
    const bonus = world.profile?.tell_bonus || 0;
    const t0 = world.protect.t + bonus;
    const tellStart = world.protect.t - 36;
    const telling = world.tick >= tellStart && world.tick < t0;
    const live = world.tick >= t0 && world.tick < t0 + 10;
    if (telling || live) {
      hazards.push({
        kind: live ? "active" : "telegraph",
        id: "intercept",
        x: world.protect.x - 10,
        y: world.protect.y - 10,
        w: 20,
        h: 20,
      });
    }
  }
  const bodies = world.enemies.map((enemy) => ({
    id: enemy.id,
    x: enemy.x,
    y: enemy.y,
    facing: enemy.facing,
    hp: enemy.hp,
    state: enemy.machine.state,
    kind: machineState(enemy.machine)?.kind || "idle",
    spared: enemy.spared,
    alive: enemy.alive,
  }));
  if (world.boss) {
    bodies.push({
      id: world.boss.id,
      x: world.boss.x,
      y: world.boss.y,
      facing: "S",
      hp: world.boss.hp,
      state: world.boss.resolved ? "resolved" : world.boss.vulnerable ? "open" : "gated",
      kind: world.boss.resolved ? "spared" : "idle",
      spared: !!world.boss.resolved,
      alive: true,
      banked: world.boss.banked,
    });
  }
  return {
    t: world.tick,
    ellis: {
      x: world.ellis.x,
      y: world.ellis.y,
      facing: world.ellis.facing,
      hp: world.ellis.hp,
      tool: world.ellis.tool,
      blade: !!(world.ellis.bladeOut || world.ellis.action),
    },
    bodies,
    shots: world.projectiles.map((shot) => ({ x: shot.x, y: shot.y })),
    hazards,
    damage: world.damageTaken,
  };
}

function maybeRecord(world) {
  if (world.replay) world.replay.push(captureFrame(world));
}

function someoneAttacking(world, self) {
  return world.enemies.some((other) => {
    if (other === self || !other.alive) return false;
    const kind = machineState(other.machine)?.kind;
    return kind === "telegraph" || kind === "active";
  });
}

export function simulateTrial(def, trial, profile, arena = null) {
  const map = arena || (def.arena ? parseArena(def.arena) : DEFAULT_ARENA);
  const home = def.spawn?.enemy || map.homes[0] || { x: 120, y: 88 };
  const ellisPos = trial.start || def.spawn?.ellis || map.start || { x: 120, y: 152 };
  const script = {
    mode: trial.mode,
    tool: trial.tool || null,
    lamp: trial.lamp || false,
    bladeOut: !!trial.bladeOut,
    point: trial.point || null,
    face: trial.face || false,
    facing: trial.facing || null,
    oscillate: !!trial.oscillate,
  };
  const world = {
    tick: 0,
    profile,
    arena: map,
    conductor: trial.conductor || null,
    enemies: [
      makeActor(def, { ...home, facing: def.spawn?.facing || "S" }, profile, trial.enemyDelay || 0),
    ],
    ellis: makeEllis(ellisPos, trial.form || "officer", profile, script),
    events: [],
    projectiles: [],
    telegraphs: [],
    damageTaken: 0,
    hitsLanded: 0,
    hitBy: [],
    fizzles: 0,
    maxProjectiles: 0,
    scriptedDangers: [],
    trace: [],
    replay: trial.record ? [] : null,
  };
  const frames = trial.frames || 720;
  for (let t = 0; t < frames; t++) {
    world.tick = t;
    for (const enemy of world.enemies) stepEnemy(enemy, world);
    stepProjectiles(world);
    resolveEnemyAttacks(world);
    resolveScripted(world);
    stepEllis(world, script);
    maybeRecord(world);
    if (t % 15 === 0) {
      const enemy = world.enemies[0];
      world.trace.push({
        t,
        state: enemy.machine.state,
        hp: enemy.hp,
        dist: Math.round(dist(enemy, world.ellis)),
        ex: Math.round(world.ellis.x),
        ey: Math.round(world.ellis.y),
        damage: world.damageTaken,
        hits: world.hitsLanded,
        flags: { ...enemy.flags },
      });
    }
    if (!world.ellis.alive) break;
  }
  const enemy = world.enemies[0];
  return {
    damageTaken: world.damageTaken,
    hitsLanded: world.hitsLanded,
    hitBy: world.hitBy,
    flags: enemy.flags,
    spared: enemy.spared,
    killed: !enemy.alive,
    finalState: enemy.machine.state,
    maxProjectiles: world.maxProjectiles,
    fizzles: world.fizzles,
    telegraphs: world.telegraphs,
    trace: world.trace,
    events: world.events.filter((e) => e.type === "hit" || e.type === "tool" || e.type === "block"),
    replay: world.replay,
    arena: trial.record ? slimArena(map) : undefined,
  };
}

export function simulateEncounter(encounter, members, profile) {
  const map = parseArena(encounter.arena);
  const script = {
    mode: encounter.sim_mode || "dodge",
    tool: encounter.tool || null,
    lamp: !!encounter.lamp,
    bladeOut: !!encounter.bladeOut,
    point: encounter.anchor || null,
    checkpoints: encounter.checkpoints || [],
    face: !!encounter.face,
  };
  const world = {
    tick: 0,
    profile,
    arena: map,
    conductor: encounter.conductor || "stagger",
    enemies: encounter.members.map((member, index) => {
      const def = members[member.enemy];
      const pos = member.at;
      return makeActor(
        def,
        { x: pos.x, y: pos.y, facing: member.facing || "S" },
        profile,
        member.delay || index * (encounter.stagger || 0),
      );
    }),
    ellis: makeEllis(encounter.ellis, encounter.form || "officer", profile, script),
    events: [],
    projectiles: [],
    telegraphs: [],
    damageTaken: 0,
    hitsLanded: 0,
    hitBy: [],
    fizzles: 0,
    maxProjectiles: 0,
    scriptedDangers: (encounter.extra_dangers || []).map((danger) => ({
      ...danger,
      tellStart: danger.t - danger.tell,
      t0: danger.t + (profile.tell_bonus || 0),
      t1: danger.t + (profile.tell_bonus || 0) + danger.active,
      source: danger.id,
    })),
    trace: [],
    replay: encounter.record ? [] : null,
    protect: encounter.protection
      ? {
          x: encounter.protection.intercept.x,
          y: encounter.protection.intercept.y,
          t: encounter.protection.strikes[0]?.t ?? 0,
        }
      : null,
  };
  const frames = encounter.frames || 480;
  let protectorHp = encounter.protection?.hp ?? null;
  for (let t = 0; t < frames; t++) {
    world.tick = t;
    for (const enemy of world.enemies) stepEnemy(enemy, world);
    stepProjectiles(world);
    resolveEnemyAttacks(world);
    resolveScripted(world);
    stepEllis(world, script);
    maybeRecord(world);
    if (encounter.protection) {
      for (const strike of encounter.protection.strikes) {
        const t0 = strike.t + (profile.tell_bonus || 0);
        if (t !== t0) continue;
        const blocked =
          Math.abs(world.ellis.x - encounter.protection.intercept.x) < 10 &&
          Math.abs(world.ellis.y - encounter.protection.intercept.y) < 10 &&
          (world.ellis.tool === "block_rod" ||
            world.ellis.blocking ||
            encounter.protection.intercept_tool == null);
        if (!blocked) protectorHp -= strike.damage;
      }
    }
  }
  const overlap = overlappingTellIssues(world.telegraphs, 10);
  return {
    damageTaken: world.damageTaken,
    hitsLanded: world.hitsLanded,
    hitBy: world.hitBy,
    flags: Object.assign({}, ...world.enemies.map((enemy) => enemy.flags)),
    maxProjectiles: world.maxProjectiles,
    fizzles: world.fizzles,
    overlap,
    protectorHp,
    telegraphs: world.telegraphs.length,
    spared: world.enemies.filter((enemy) => enemy.spared).map((enemy) => enemy.id),
    killed: world.enemies.filter((enemy) => !enemy.alive).map((enemy) => enemy.id),
    trace: world.trace.slice(-8),
    replay: world.replay,
    arena: encounter.record ? slimArena(map) : undefined,
  };
}

export function simulateBossFight(boss, trial, profile) {
  const map = parseArena(boss.arena);
  const script = {
    mode: trial.mode,
    tool: trial.tool || null,
    lamp: !!trial.lamp,
    bladeOut: !!trial.bladeOut,
    checkpoints: trial.checkpoints || [],
    face: false,
  };
  const bonus = profile.tell_bonus || 0;
  const scriptedDangers = (boss.dangers || []).map((danger) => ({
    id: danger.id,
    rect: danger.rect,
    damage: danger.damage || 1,
    tell: danger.tell || 48,
    t: danger.t,
    tellStart: danger.t - (danger.tell || 48),
    t0: danger.t + bonus,
    t1: danger.t + bonus + (danger.active || 16),
    source: boss.id,
    hit: false,
  }));
  const bossBody = {
    id: boss.id,
    kind: "boss",
    family: boss.family,
    x: boss.bossAt.x,
    y: boss.bossAt.y,
    hp: boss.hp,
    maxHp: boss.hp,
    alive: true,
    banked: 0,
    vulnerable: false,
    resolved: false,
    resolvedAt: null,
    killed: false,
    mechanic: false,
    visited: new Set(),
    gate: boss.gate,
    win: boss.win,
    earliest: boss.earliest,
    tool: boss.tool || null,
    socket: boss.socket,
    window: boss.window || 180,
    sheatheFrames: boss.sheatheFrames || 40,
    tiles: boss.tiles || [],
    checkpoints: script.checkpoints,
  };
  const world = {
    tick: 0,
    profile,
    arena: map,
    conductor: null,
    enemies: [],
    boss: bossBody,
    ellis: makeEllis(trial.start, trial.form || "officer", profile, script),
    events: [],
    projectiles: [],
    telegraphs: boss.dangers.map((danger) => ({
      t: Math.max(0, danger.t - (danger.tell || 48)),
      source: boss.id,
      attack: danger.id,
      resolve: danger.t,
    })),
    damageTaken: 0,
    hitsLanded: 0,
    hitBy: [],
    fizzles: 0,
    maxProjectiles: 0,
    scriptedDangers,
    replay: trial.record ? [] : null,
  };
  for (let t = 0; t < trial.frames; t++) {
    world.tick = t;
    refreshBoss(world);
    resolveScripted(world);
    stepEllis(world, script);
    refreshBoss(world);
    maybeRecord(world);
    if (!world.ellis.alive) break;
  }
  return {
    damageTaken: world.damageTaken,
    hitBy: world.hitBy,
    resolved: bossBody.resolved,
    resolvedAt: bossBody.resolvedAt,
    banked: bossBody.banked,
    hp: bossBody.hp,
    killed: bossBody.killed,
    mechanic: bossBody.mechanic,
    visited: [...bossBody.visited],
    alive: world.ellis.alive,
    replay: world.replay,
    arena: trial.record ? slimArena(map) : undefined,
  };
}

export function overlappingTellIssues(telegraphs, gap) {
  const issues = [];
  for (let i = 0; i < telegraphs.length; i++) {
    for (let j = i + 1; j < telegraphs.length; j++) {
      const a = telegraphs[i];
      const b = telegraphs[j];
      if (a.source === b.source) continue;
      if (Math.abs(a.t - b.t) < gap) {
        issues.push({ a: a.attack, b: b.attack, t: a.t, dt: Math.abs(a.t - b.t) });
      }
    }
  }
  return issues;
}

export { parseArena, DEFAULT_ARENA };
