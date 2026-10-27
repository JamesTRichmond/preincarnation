/**
 * Encounter model. Replays the order of operations in src/game/engine.ts sim()
 * and the formulas in src/game/rules.ts. It does not invent enemy kinds.
 * Simulation of stated mechanics — not a playtest.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const UNITS = JSON.parse(readFileSync(join(root, "canon/units.json"), "utf8"));
export const PLACEMENTS = JSON.parse(readFileSync(join(root, "canon/placements.json"), "utf8"));

export const DT = 1 / 60;

const T = {
  grass: 0, flowers: 1, path: 2, gravel: 3, water: 4, bridge: 5, wood: 6, pine: 7,
  wall: 8, marble: 9, marbleWall: 10, cosmic: 11, void: 12, cobble: 13, soil: 14,
  cracked: 15, sand: 16, rail: 17, cliff: 18, cliffLip: 19,
};
const CH = {
  ".": T.grass, ",": T.flowers, p: T.path, g: T.gravel, "~": T.water, b: T.bridge,
  f: T.wood, T: T.pine, "#": T.wall, m: T.marble, M: T.marbleWall, c: T.cosmic,
  v: T.void, o: T.cobble, s: T.soil, x: T.cracked, a: T.sand, r: T.rail, "=": T.wood,
  h: T.cliff, u: T.cliffLip,
};
const MARKS = new Set(["H", "I", "B", "W", "N", "F", "Q", "&", "S", "C", "P", "D", "U", "R", "K", "k", "L", "n"]);

export function enemyMaxHp(kind, cycle, tropoverse, cap) {
  const base = UNITS.enemies[kind].hp;
  let mul = 1 + cycle * UNITS.hpScale.perCycle;
  if (cap != null) mul = Math.min(mul, cap);
  if (tropoverse) mul *= UNITS.hpScale.tropoverse;
  return Math.round(base * mul);
}

export function slashDamage(form, edge, tropoverse, flawId) {
  const spec = UNITS.forms[form];
  const flaw = UNITS.flaws[flawId] ?? UNITS.flaws.pride;
  const tropo = tropoverse ? UNITS.playerTropoSlash : 1;
  return (UNITS.starterIron.dmg + spec.damage - 1) * (1 + edge * UNITS.upgrades.edge.slashMulPerRank) * tropo * flaw.damageMul;
}

export function spinDamage(form, edge) {
  const spec = UNITS.forms[form];
  return 2.2 + spec.damage + edge * UNITS.upgrades.edge.spinAddPerRank;
}

export function moveSpeed(form, stride, flawId, weatherMul, attacking) {
  const spec = UNITS.forms[form];
  const flaw = UNITS.flaws[flawId] ?? UNITS.flaws.pride;
  let s = spec.speed * (1 + stride * UNITS.upgrades.stride.speedMulPerRank) * flaw.speedMul * weatherMul;
  if (attacking) s *= UNITS.attackMoveMul;
  return s;
}

export function bodyHp(form, vitality) {
  return UNITS.forms[form].hp + vitality;
}

/** Live isSolid, plus an optional patch that puts cracked and cliff back on the embryo list. */
export function isSolid(id, form, patch) {
  if (id === T.water && (form === "embryo" || false)) return false;
  if (form === "embryo") {
    if (patch?.embryoCrackedAndCliffSolid) {
      return id === T.pine || id === T.wall || id === T.marbleWall || id === T.cracked || id === T.cliff;
    }
    return id === T.pine || id === T.wall || id === T.marbleWall;
  }
  return UNITS.othersSolid.includes(tileName(id));
}

function tileName(id) {
  return Object.entries(T).find(([, n]) => n === id)?.[0] ?? "grass";
}

export function parseQuarry() {
  const src = PLACEMENTS.quarrySrc;
  const h = src.length;
  const w = Math.max(...src.map((r) => r.length));
  const tiles = [];
  const marks = {};
  for (let y = 0; y < h; y++) {
    const line = src[y].padEnd(w, "#");
    const row = [];
    for (let x = 0; x < w; x++) {
      const ch = line[x];
      if (MARKS.has(ch)) {
        (marks[ch] ??= []).push({ x, y });
        if (ch === "C" || ch === "S" || ch === "k" || ch === "n") row.push(T.marble);
        else if (ch === "L") row.push(T.marbleWall);
        else row.push(T.cobble);
      } else row.push(CH[ch] ?? T.grass);
    }
    tiles.push(row);
  }
  return { tiles, w, h, marks };
}

export function reachable(tiles, form, sx, sy, patch) {
  const h = tiles.length;
  const w = tiles[0].length;
  const q = [[sx, sy]];
  const seen = new Set([sx + "," + sy]);
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = nx + "," + ny;
      if (seen.has(k)) continue;
      if (isSolid(tiles[ny][nx], form, patch)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

function hypot(x, y) {
  return Math.hypot(x, y);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

/**
 * One fight.
 * policy.kind: "space" | "assisted" | "flee"
 * patch.fisherNormalize renormalizes the fisher steer so weave does not multiply speed.
 */
export function fight(opts) {
  const {
    actors,
    build,
    policy,
    patch = {},
    arena = { minX: -2400, minY: -2400, maxX: 2400, maxY: 2400 },
    seconds = 30,
    weatherMul = 1,
  } = opts;
  const tropo = !!build.tropoverse;
  const cap = patch.enemyCycleMulCap ?? null;
  const hpMax = bodyHp(build.form, build.vitality);
  const slash = slashDamage(build.form, build.edge, tropo, build.flaw);
  const spin = spinDamage(build.form, build.edge);
  const bottles = (build.bottles ?? []).slice();
  let sips = 0;
  let bombs = build.bombs ?? 0;
  let bombUsed = 0;

  const originX = actors[0] ? actors[0].x : 0;
  const originY = actors[0] ? actors[0].y : 0;
  const local = actors.map((a) => ({ ...a, x: a.x - originX, y: a.y - originY }));
  const startDist = opts.startDist ?? 90;
  const px0 = startDist;
  const py0 = 0;
  const player = {
    x: px0,
    y: py0,
    hp: hpMax,
    maxHp: hpMax,
    dirX: -1,
    dirY: 0,
    attackT: 0,
    invuln: 0,
    dashT: 0,
    charge: 0,
  };
  const enemies = local.map((a, i) => {
    const maxHp = enemyMaxHp(a.kind, build.cycle, tropo, cap);
    return {
      id: a.id ?? a.kind + i,
      kind: a.kind,
      x: a.x,
      y: a.y,
      hp: maxHp,
      maxHp,
      hurt: 0,
      alive: true,
      peakSpeed: 0,
    };
  });

  const contacts = [];
  let idleBlocked = 0;
  let dangerFrames = 0;
  let frames = 0;
  let controlLocked = 0;
  const limit = Math.round(seconds / DT);
  let dashReady = canDash(build);

  for (let f = 0; f < limit; f++) {
    frames++;
    const t = f * DT;
    const alive = enemies.filter((e) => e.alive);
    if (player.hp <= 0 || alive.length === 0) break;

    if (player.attackT > 0) player.attackT -= DT;
    if (player.invuln > 0) player.invuln -= DT;
    if (player.dashT > 0) player.dashT -= DT;

    const nearest = closest(player, alive);
    const distN = nearest ? hypot(nearest.x - player.x, nearest.y - player.y) : Infinity;
    const aggroed = alive.filter((e) => distOf(player, e) < aggroOf(e.kind));
    const threatened = aggroed.length > 0;
    if (threatened) dangerFrames++;

    if (policy.kind === "assisted" && bottlesHaveHeal(bottles) && player.hp <= nextHit(alive) && player.hp < player.maxHp) {
      sip(bottles);
      sips++;
      player.hp = Math.min(player.maxHp, player.hp + UNITS.syrupHeal);
    }

    const wantFlee = policy.kind === "flee" || (nearest && distN < (policy.kind === "assisted" ? 18 : 14));
    let mx = 0;
    let my = 0;
    if (nearest) {
      const dx = player.x - nearest.x;
      const dy = player.y - nearest.y;
      const d = hypot(dx, dy) || 1;
      const awayX = dx / d;
      const awayY = dy / d;
      const hold = policy.kind === "assisted" ? 24 : 20;
      if (policy.kind === "flee" || distN < (policy.kind === "assisted" ? 18 : 14)) {
        mx = awayX;
        my = awayY;
      } else if (distN > hold + 8) {
        mx = -awayX;
        my = -awayY;
      } else {
        mx = -awayY * 0.35 + awayX * ((distN - hold) / 8);
        my = awayX * 0.35 + awayY * ((distN - hold) / 8);
        const m = hypot(mx, my) || 1;
        mx /= m;
        my /= m;
      }
      if (mx || my) {
        player.dirX = mx;
        player.dirY = my;
        if (Math.abs(mx) > Math.abs(my)) {
          /* facing follows motion, matching engine */
        }
      }
    }

    const attacking = player.attackT > 0;
    const spd = moveSpeed(build.form, build.stride, build.flaw, weatherMul, attacking);

    if (wantFlee && distN < 16 && player.dashT <= 0 && dashReady) {
      const d = hypot(mx, my) || 1;
      player.x += (mx / d) * UNITS.dashDistance;
      player.y += (my / d) * UNITS.dashDistance;
      player.dashT = build.boots || build.form === "smuggler" ? UNITS.dashCooldownBoots : UNITS.dashCooldownBare;
      if (build.form !== "smuggler" && !build.boots && !build.shadowStep) player.dashT = 0;
    }

    player.x = clamp(player.x + mx * spd * DT, arena.minX, arena.maxX);
    player.y = clamp(player.y + my * spd * DT, arena.minY, arena.maxY);

    if (policy.kind !== "flee" && nearest && player.attackT <= 0) {
      const d = distOf(player, nearest);
      const dx = nearest.x - player.x;
      const dy = nearest.y - player.y;
      const inBand = d >= 12 && d <= hitReach();
      const blocked = nearest.hurt > 0;
      if (threatened && blocked && d <= hitReach()) idleBlocked++;
      if (inBand && !blocked) {
        const m = hypot(dx, dy) || 1;
        player.dirX = dx / m;
        player.dirY = dy / m;
        fireSlash(player, nearest, slash);
      } else if (policy.kind === "assisted" && bombs > 0 && d < 22 && nearest.hurt <= 0) {
        bombs--;
        bombUsed++;
        if (nearest.hurt <= 0) {
          nearest.hp -= 2;
          nearest.hurt = UNITS.enemyHurtOnHit;
          if (nearest.hp <= 0) nearest.alive = false;
        }
      }
    }

    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.hurt > 0) e.hurt -= DT;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = hypot(dx, dy) || 1;
      const spec = UNITS.enemies[e.kind];
      let sp = spec.speed;
      if (e.kind === "wraith" && build.wraithBond) sp *= UNITS.upgrades.wraithBond.wraithSpeedMul;
      if (dist < aggroOf(e.kind)) {
        if (spec.dormantUntilDamaged && e.hp >= e.maxHp) {
          /* stands */
        } else {
          let ix = dx / dist;
          let iy = dy / dist;
          if (spec.weave) {
            ix += Math.sin(t * spec.weaveX) * spec.weaveAmp;
            iy += Math.cos(t * spec.weaveY) * spec.weaveAmp;
            if (patch.fisherNormalize) {
              const m = hypot(ix, iy) || 1;
              ix /= m;
              iy /= m;
            }
          }
          const stepX = ix * sp * DT;
          const stepY = iy * sp * DT;
          const inst = hypot(stepX, stepY) / DT;
          if (inst > e.peakSpeed) e.peakSpeed = inst;
          e.x += stepX;
          e.y += stepY;
          if (dist < UNITS.contactRadius && e.hurt <= 0) {
            if (player.invuln <= 0) {
              player.hp -= spec.contact;
              player.invuln = UNITS.playerInvuln;
              contacts.push({ t: round3(t), kind: e.kind, dmg: spec.contact, dist: round3(dist) });
            }
            e.hurt = UNITS.enemyHurtOnContact;
          }
        }
      }
    }
  }

  const aliveLeft = enemies.filter((e) => e.alive);
  const elapsed = frames * DT;
  const won = player.hp > 0 && aliveLeft.length === 0;
  return {
    won,
    timedOut: player.hp > 0 && aliveLeft.length > 0,
    elapsed: round3(elapsed),
    playerHp: round3(player.hp),
    maxHp: hpMax,
    damageTaken: round3(hpMax - player.hp),
    contacts: contacts.length,
    contactLog: contacts.slice(0, 8),
    sips,
    bombUsed,
    ttk: won ? round3(elapsed) : null,
    idleFraction: dangerFrames ? round3(idleBlocked / dangerFrames) : 0,
    controlLockedFrames: controlLocked,
    enemyPeak: Object.fromEntries(enemies.map((e) => [e.id, round3(e.peakSpeed)])),
    slash: round3(slash),
    spin: round3(spin),
    remain: aliveLeft.map((e) => ({ id: e.id, hp: round3(e.hp), maxHp: e.maxHp })),
  };
}

function fireSlash(player, enemy, dmg) {
  const ox = player.x + norm(player).x * UNITS.slashOrigin;
  const oy = player.y + norm(player).y * UNITS.slashOrigin;
  if (hypot(enemy.x - ox, enemy.y - oy) >= UNITS.starterIron.reach + UNITS.hitSlack) return false;
  if (enemy.hurt > 0 || !enemy.alive) return false;
  enemy.hp -= dmg;
  enemy.hurt = UNITS.enemyHurtOnHit;
  const k = norm(player);
  enemy.x += k.x * UNITS.knockback;
  enemy.y += k.y * UNITS.knockback;
  player.attackT = UNITS.attackRecovery;
  if (enemy.hp <= 0) enemy.alive = false;
  return true;
}

function norm(p) {
  const m = hypot(p.dirX, p.dirY) || 1;
  return { x: p.dirX / m, y: p.dirY / m };
}

function hitReach() {
  return UNITS.slashOrigin + UNITS.starterIron.reach + UNITS.hitSlack;
}

function canDash(build) {
  return !!(build.boots || build.shadowStep || build.form === "smuggler");
}

function aggroOf(kind) {
  return UNITS.aggro[kind] ?? UNITS.aggro.default;
}

function distOf(p, e) {
  return hypot(e.x - p.x, e.y - p.y);
}

function closest(p, list) {
  let best = null;
  let bd = Infinity;
  for (const e of list) {
    const d = distOf(p, e);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

function nextHit(alive) {
  let n = Infinity;
  for (const e of alive) n = Math.min(n, UNITS.enemies[e.kind].contact);
  return n === Infinity ? 1 : n;
}

function bottlesHaveHeal(bottles) {
  return bottles.some((b) => b === "syrup" || b === "deluxe");
}

function sip(bottles) {
  const i = bottles.findIndex((b) => b === "syrup" || b === "deluxe");
  if (i >= 0) bottles[i] = "empty";
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

export function actorsFromPlacement(p) {
  if (p.group) {
    return p.group.map((g) => ({
      id: g.id,
      kind: g.kind,
      x: g.x * UNITS.tile + 8,
      y: g.y * UNITS.tile + 8,
    }));
  }
  return [{
    id: p.prop,
    kind: p.kind,
    x: p.x * UNITS.tile + 8,
    y: p.y * UNITS.tile + 8,
  }];
}

/** Pairs whose aggro circles can both contain one point. No tell channel exists in the engine. */
export function simultaneousPairs(list) {
  const out = [];
  const flat = [];
  const seenActor = new Set();
  for (const p of list) {
    const members = p.group
      ? p.group.map((g) => ({ map: p.map, id: g.id, kind: g.kind, x: g.x, y: g.y }))
      : [{ map: p.map, id: p.prop, kind: p.kind, x: p.x, y: p.y }];
    for (const m of members) {
      if (m.x == null) continue;
      const key = m.map + "|" + m.id + "|" + m.x + "|" + m.y;
      if (seenActor.has(key)) continue;
      seenActor.add(key);
      flat.push(m);
    }
  }
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      const a = flat[i];
      const b = flat[j];
      if (a.map !== b.map) continue;
      const d = hypot((a.x - b.x) * UNITS.tile, (a.y - b.y) * UNITS.tile);
      const reach = aggroOf(a.kind) + aggroOf(b.kind);
      if (d < reach) {
        out.push({ map: a.map, a: a.id, b: b.id, distPx: Math.round(d), combinedAggro: reach });
      }
    }
  }
  return out;
}

export function staticBudget(kind, build) {
  const hp = enemyMaxHp(kind, build.cycle, !!build.tropoverse, null);
  const slash = slashDamage(build.form, build.edge, !!build.tropoverse, build.flaw);
  const contact = UNITS.enemies[kind].contact;
  const pHp = bodyHp(build.form, build.vitality);
  const hitsToKill = Math.ceil((hp - 1e-9) / slash);
  let hpLeft = pHp;
  let mistakes = 0;
  while (hpLeft - contact > 0) {
    hpLeft -= contact;
    mistakes++;
  }
  return {
    enemyHp: hp,
    slash: round3(slash),
    hitsToKill,
    connectSeconds: round3(hitsToKill * UNITS.enemyHurtOnHit),
    contact,
    playerHp: pHp,
    mistakesBeforeDeath: mistakes,
  };
}

/**
 * Resource trace. Mirrors resolveDeath + erodeGrave. Does not change enemy stats.
 * Recovery rules are optional and never touch maxHp or gate flags.
 */
export function resourceTrace(patch, rand = mulberry(1)) {
  const rows = [];
  let arrows = 10;
  let bombs = 3;
  let bottles = ["empty", "empty"];
  let relics = ["sword", "shovel", "bow", "lantern", "hammer"];
  let syrupStash = true;
  let townsCleared = ["quarry"];
  let upgrades = { vitality: 3, edge: 3 };
  const kept = [];
  for (let n = 1; n <= 6; n++) {
    const winters = 14 + Math.floor(rand() * 5);
    const mundaneKept = rand() < (winters >= 12 ? 0.22 : winters >= 6 ? 0.55 : 0.8);
    kept.push(mundaneKept);
    arrows = 0;
    bombs = 0;
    bottles = bottles.slice();
    if (patch?.restoreSyrup && syrupStash && !bottles.some((b) => b === "syrup" || b === "deluxe")) {
      const i = bottles.findIndex((b) => b === "empty");
      if (i >= 0) bottles[i] = "syrup";
      else bottles[0] = "syrup";
    }
    if (patch?.bowQuiver && relics.includes("bow") && arrows === 0) arrows = patch.bowQuiver;
    rows.push({
      death: n,
      winters,
      mundaneKept,
      arrows,
      bombs,
      bottles: bottles.slice(),
      relics: relics.slice(),
      townsCleared: townsCleared.slice(),
      vitality: upgrades.vitality,
      maxHpUnchanged: true,
    });
    if (bottles.includes("syrup")) {
      const i = bottles.indexOf("syrup");
      bottles[i] = "empty";
    }
  }
  return { rows, mundaneKeepRate: round3(kept.filter(Boolean).length / kept.length) };
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assertFormulas() {
  const errors = [];
  if (slashDamage("wanderer", 0, false, "cannot_rest") !== 1) errors.push("slash wanderer");
  if (Math.abs(slashDamage("wanderer", 1, false, "pride") - 1.18) > 1e-9) errors.push("edge");
  if (spinDamage("wanderer", 0) !== 3.2) errors.push("spin");
  if (bodyHp("officer", 0) !== 5) errors.push("officer hp");
  if (bodyHp("wanderer", 3) !== 6) errors.push("vitality");
  if (enemyMaxHp("crow", 0, false, null) !== 2) errors.push("crow");
  if (enemyMaxHp("bear", 5, false, null) !== 11) errors.push("bear c5");
  if (enemyMaxHp("crow", 0, true, null) !== 3) errors.push("tropo crow");
  if (UNITS.enemies.resident.placed !== false) errors.push("resident placed flag");
  if (errors.length) throw new Error("formula drift: " + errors.join(", "));
}
