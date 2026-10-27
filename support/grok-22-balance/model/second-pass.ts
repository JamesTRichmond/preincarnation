/**
 * Same kinematic fight as model/sim.mjs, plus planted and late hands.
 * Not imported by the county. The 320×240 walk stays in src/game.
 * Standard, assisted, and flee keep sim.mjs order. Still, close, and late do not.
 */
import unitsJson from "../canon/units.json" with { type: "json" };
import placementsJson from "../canon/placements.json" with { type: "json" };

export const UNITS = unitsJson;
export const PLACEMENTS = placementsJson;

export const DT = 1 / 60;
export const TILE = UNITS.tile;
export const CONTACT = UNITS.contactRadius;
export const KNOCK = UNITS.knockback;
export const HURT = UNITS.enemyHurtOnHit;
export const REACH = UNITS.slashOrigin + UNITS.starterIron.reach + UNITS.hitSlack;
export const HOLD = 20;

type EnemySpec = {
  hp: number;
  speed: number;
  contact: number;
  weave?: boolean;
  weaveAmp?: number;
  weaveX?: number;
  weaveY?: number;
  dormantUntilDamaged?: boolean;
  placed?: boolean;
};

type FormSpec = {
  hp: number;
  speed: number;
  damage: number;
  innateDash?: boolean;
};

const enemies = UNITS.enemies as Record<string, EnemySpec>;
const forms = UNITS.forms as Record<string, FormSpec>;

export type Actor = { id?: string; kind: string; x: number; y: number };

export type Build = {
  id: string;
  cycle: number;
  form: string;
  vitality: number;
  edge: number;
  stride: number;
  flaw: string;
  boots: boolean;
  shadowStep: boolean;
  wraithBond: boolean;
  tropoverse: boolean;
  bottles?: string[];
  bombs?: number;
};

export type Policy = {
  kind: "standard" | "assisted" | "flee" | "still" | "close" | "late";
  lagFrames?: number;
};

export type Arena = { minX: number; minY: number; maxX: number; maxY: number };

export type SampleFoe = {
  x: number;
  y: number;
  alive: boolean;
  kind: string;
  hp: number;
  maxHp: number;
};

export type Sample = {
  t: number;
  px: number;
  py: number;
  dx: number;
  dy: number;
  hp: number;
  bitten: boolean;
  foes: SampleFoe[];
};

export type FightResult = {
  won: boolean;
  timedOut: boolean;
  elapsed: number;
  playerHp: number;
  maxHp: number;
  damageTaken: number;
  contacts: number;
  contactLog: { t: number; kind: string; dmg: number; dist: number }[];
  sips: number;
  bombUsed: number;
  ttk: number | null;
  idleFraction: number;
  controlLockedFrames: number;
  enemyPeak: Record<string, number>;
  slash: number;
  spin: number;
  remain: { id: string; hp: number; maxHp: number }[];
  minDist: number;
  knockLost: number;
  samples: Sample[];
};

type FightOpts = {
  actors: Actor[];
  build: Build;
  policy: Policy;
  patch?: { fisherNormalize?: boolean; enemyCycleMulCap?: number | null; knockback?: number };
  arena?: Arena;
  seconds?: number;
  weatherMul?: number;
  startDist?: number;
  playerStart?: { x: number; y: number } | null;
  clampEnemies?: boolean;
  recordEvery?: number;
};

function enemy(kind: string): EnemySpec {
  const spec = enemies[kind];
  if (!spec) throw new Error("unknown enemy " + kind);
  return spec;
}

export function enemyMaxHp(kind: string, cycle: number, tropoverse: boolean, cap: number | null) {
  const base = enemy(kind).hp;
  let mul = 1 + cycle * UNITS.hpScale.perCycle;
  if (cap != null) mul = Math.min(mul, cap);
  if (tropoverse) mul *= UNITS.hpScale.tropoverse;
  return Math.round(base * mul);
}

export function slashDamage(form: string, edge: number, tropoverse: boolean, flawId: string) {
  const spec = forms[form];
  if (!spec) throw new Error("unknown form " + form);
  const flaws = UNITS.flaws as Record<string, { speedMul: number; damageMul: number }>;
  const flaw = flaws[flawId] ?? flaws.pride;
  const tropo = tropoverse ? UNITS.playerTropoSlash : 1;
  return (UNITS.starterIron.dmg + spec.damage - 1) * (1 + edge * UNITS.upgrades.edge.slashMulPerRank) * tropo * flaw.damageMul;
}

export function spinDamage(form: string, edge: number) {
  const spec = forms[form];
  if (!spec) throw new Error("unknown form " + form);
  return 2.2 + spec.damage + edge * UNITS.upgrades.edge.spinAddPerRank;
}

export function moveSpeed(form: string, stride: number, flawId: string, weatherMul: number, attacking: boolean) {
  const spec = forms[form];
  if (!spec) throw new Error("unknown form " + form);
  const flaws = UNITS.flaws as Record<string, { speedMul: number; damageMul: number }>;
  const flaw = flaws[flawId] ?? flaws.pride;
  let s = spec.speed * (1 + stride * UNITS.upgrades.stride.speedMulPerRank) * flaw.speedMul * weatherMul;
  if (attacking) s *= UNITS.attackMoveMul;
  return s;
}

export function bodyHp(form: string, vitality: number) {
  const spec = forms[form];
  if (!spec) throw new Error("unknown form " + form);
  return spec.hp + vitality;
}

function hypot(x: number, y: number) {
  return Math.hypot(x, y);
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Listed speed against the authored shove. Positive net means the shove wins if nobody strafes. */
export function hurtMath(kind: string) {
  const speed = enemy(kind).speed;
  const regain = speed * HURT;
  return {
    speed,
    regain: round3(regain),
    net: round3(KNOCK - regain),
    threshold: round3(KNOCK / HURT),
    animalWins: regain > KNOCK,
  };
}

export function actorsFromPlacement(p: {
  prop?: string;
  kind: string;
  x?: number;
  y?: number;
  group?: { id: string; kind: string; x: number; y: number }[];
}): Actor[] {
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
    x: (p.x ?? 0) * UNITS.tile + 8,
    y: (p.y ?? 0) * UNITS.tile + 8,
  }];
}

type Foe = {
  id: string;
  kind: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  hurt: number;
  alive: boolean;
  peakSpeed: number;
};

type Body = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  dirX: number;
  dirY: number;
  attackT: number;
  invuln: number;
  dashT: number;
  charge: number;
};

export function fight(opts: FightOpts): FightResult {
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
  const knock = patch.knockback ?? UNITS.knockback;
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
  const px0 = opts.playerStart ? opts.playerStart.x : startDist;
  const py0 = opts.playerStart ? opts.playerStart.y : 0;
  const player: Body = {
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
  const foes: Foe[] = local.map((a, i) => {
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

  const contacts: FightResult["contactLog"] = [];
  let idleBlocked = 0;
  let dangerFrames = 0;
  let frames = 0;
  const controlLocked = 0;
  const limit = Math.round(seconds / DT);
  const dashReady = canDash(build);
  const variant = policy.kind === "still" || policy.kind === "close" || policy.kind === "late";
  const lag = policy.kind === "late" ? (policy.lagFrames ?? 12) : 0;
  const memory: Intent[] = [];
  let minDist = Infinity;
  let knockLost = 0;
  const samples: Sample[] = [];
  const recordEvery = opts.recordEvery ?? 0;
  let prevContacts = 0;

  const contain = (e: { x: number; y: number }) => {
    if (!opts.clampEnemies) return 0;
    const bx = e.x;
    const by = e.y;
    e.x = clamp(e.x, arena.minX, arena.maxX);
    e.y = clamp(e.y, arena.minY, arena.maxY);
    return hypot(e.x - bx, e.y - by);
  };

  for (let f = 0; f < limit; f++) {
    frames++;
    const t = f * DT;
    const alive = foes.filter((e) => e.alive);
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

    if (!variant) {
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
          if (fireSlash(player, nearest, slash, knock)) knockLost += contain(nearest);
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
    } else {
      const intent = policy.kind === "still"
        ? stillIntent(player, nearest)
        : spacingIntent(player, nearest, policy.kind === "close" ? 13 : 20, policy.kind === "close" ? 12 : 14);
      memory.push(intent);
      const use = lag === 0
        ? intent
        : (memory.length > lag
          ? memory[memory.length - 1 - lag]
          : { mx: 0, my: 0, dirX: player.dirX, dirY: player.dirY, wantFlee: false, tryAttack: false });

      if (use.mx || use.my) {
        player.dirX = use.dirX;
        player.dirY = use.dirY;
      }

      const attacking = player.attackT > 0;
      const spd = moveSpeed(build.form, build.stride, build.flaw, weatherMul, attacking);
      if (use.wantFlee && distN < 16 && player.dashT <= 0 && dashReady && policy.kind !== "still") {
        const d = hypot(use.mx, use.my) || 1;
        player.x += (use.mx / d) * UNITS.dashDistance;
        player.y += (use.my / d) * UNITS.dashDistance;
        player.dashT = build.boots || build.form === "smuggler" ? UNITS.dashCooldownBoots : UNITS.dashCooldownBare;
        if (build.form !== "smuggler" && !build.boots && !build.shadowStep) player.dashT = 0;
      }

      player.x = clamp(player.x + use.mx * spd * DT, arena.minX, arena.maxX);
      player.y = clamp(player.y + use.my * spd * DT, arena.minY, arena.maxY);

      if (nearest && player.attackT <= 0) {
        const d = distOf(player, nearest);
        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        const inBand = d >= 12 && d <= hitReach();
        const blocked = nearest.hurt > 0;
        if (threatened && blocked && d <= hitReach()) idleBlocked++;
        const swing = policy.kind === "late" ? use.tryAttack : inBand && !blocked;
        if (swing && inBand && !blocked) {
          const m = hypot(dx, dy) || 1;
          player.dirX = dx / m;
          player.dirY = dy / m;
          if (fireSlash(player, nearest, slash, knock)) knockLost += contain(nearest);
        }
      }
    }

    for (const e of foes) {
      if (!e.alive) continue;
      if (e.hurt > 0) e.hurt -= DT;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = hypot(dx, dy) || 1;
      const spec = enemy(e.kind);
      let sp = spec.speed;
      if (e.kind === "wraith" && build.wraithBond) sp *= UNITS.upgrades.wraithBond.wraithSpeedMul;
      if (dist < aggroOf(e.kind)) {
        if (spec.dormantUntilDamaged && e.hp >= e.maxHp) {
          /* stands */
        } else {
          let ix = dx / dist;
          let iy = dy / dist;
          if (spec.weave) {
            ix += Math.sin(t * (spec.weaveX ?? 0)) * (spec.weaveAmp ?? 0);
            iy += Math.cos(t * (spec.weaveY ?? 0)) * (spec.weaveAmp ?? 0);
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
          contain(e);
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

    for (const e of foes) {
      if (!e.alive) continue;
      const d = distOf(player, e);
      if (d < minDist) minDist = d;
    }

    if (recordEvery > 0 && f % recordEvery === 0) {
      samples.push({
        t: round3(t),
        px: player.x,
        py: player.y,
        dx: player.dirX,
        dy: player.dirY,
        hp: player.hp,
        bitten: contacts.length > prevContacts,
        foes: foes.map((e) => ({
          x: e.x,
          y: e.y,
          alive: e.alive,
          kind: e.kind,
          hp: e.hp,
          maxHp: e.maxHp,
        })),
      });
      prevContacts = contacts.length;
    }
  }

  const aliveLeft = foes.filter((e) => e.alive);
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
    enemyPeak: Object.fromEntries(foes.map((e) => [e.id, round3(e.peakSpeed)])),
    slash: round3(slash),
    spin: round3(spin),
    remain: aliveLeft.map((e) => ({ id: e.id, hp: round3(e.hp), maxHp: e.maxHp })),
    minDist: minDist === Infinity ? 0 : round3(minDist),
    knockLost: round3(knockLost),
    samples,
  };
}

type Intent = { mx: number; my: number; dirX: number; dirY: number; wantFlee: boolean; tryAttack: boolean };

function stillIntent(player: Body, nearest: Foe | null): Intent {
  if (!nearest) return { mx: 0, my: 0, dirX: player.dirX, dirY: player.dirY, wantFlee: false, tryAttack: false };
  const dx = nearest.x - player.x;
  const dy = nearest.y - player.y;
  const d = hypot(dx, dy) || 1;
  const inBand = d >= 12 && d <= hitReach() && nearest.hurt <= 0;
  return {
    mx: 0,
    my: 0,
    dirX: dx / d,
    dirY: dy / d,
    wantFlee: false,
    tryAttack: inBand,
  };
}

function spacingIntent(player: Body, nearest: Foe | null, hold: number, panic: number): Intent {
  if (!nearest) return { mx: 0, my: 0, dirX: player.dirX, dirY: player.dirY, wantFlee: false, tryAttack: false };
  const dx = player.x - nearest.x;
  const dy = player.y - nearest.y;
  const distN = hypot(dx, dy) || 1;
  const awayX = dx / distN;
  const awayY = dy / distN;
  let mx = 0;
  let my = 0;
  const wantFlee = distN < panic;
  if (wantFlee) {
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
  const toX = nearest.x - player.x;
  const toY = nearest.y - player.y;
  const to = hypot(toX, toY) || 1;
  const inBand = to >= 12 && to <= hitReach() && nearest.hurt <= 0;
  return {
    mx,
    my,
    dirX: mx || my ? mx : player.dirX,
    dirY: mx || my ? my : player.dirY,
    wantFlee,
    tryAttack: inBand && !wantFlee,
  };
}

function fireSlash(player: Body, foe: Foe, dmg: number, knock: number) {
  const ox = player.x + norm(player).x * UNITS.slashOrigin;
  const oy = player.y + norm(player).y * UNITS.slashOrigin;
  if (hypot(foe.x - ox, foe.y - oy) >= UNITS.starterIron.reach + UNITS.hitSlack) return false;
  if (foe.hurt > 0 || !foe.alive) return false;
  foe.hp -= dmg;
  foe.hurt = UNITS.enemyHurtOnHit;
  const k = norm(player);
  foe.x += k.x * knock;
  foe.y += k.y * knock;
  player.attackT = UNITS.attackRecovery;
  if (foe.hp <= 0) foe.alive = false;
  return true;
}

function norm(p: Body) {
  const m = hypot(p.dirX, p.dirY) || 1;
  return { x: p.dirX / m, y: p.dirY / m };
}

function hitReach() {
  return UNITS.slashOrigin + UNITS.starterIron.reach + UNITS.hitSlack;
}

function canDash(build: Build) {
  return !!(build.boots || build.shadowStep || build.form === "smuggler");
}

function aggroOf(kind: string) {
  const table = UNITS.aggro as Record<string, number>;
  return table[kind] ?? table.default;
}

function distOf(p: { x: number; y: number }, e: { x: number; y: number }) {
  return hypot(e.x - p.x, e.y - p.y);
}

function closest(p: { x: number; y: number }, list: Foe[]) {
  let best: Foe | null = null;
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

function nextHit(alive: Foe[]) {
  let n = Infinity;
  for (const e of alive) n = Math.min(n, enemy(e.kind).contact);
  return n === Infinity ? 1 : n;
}

function bottlesHaveHeal(bottles: string[]) {
  return bottles.some((b) => b === "syrup" || b === "deluxe");
}

function sip(bottles: string[]) {
  const i = bottles.findIndex((b) => b === "syrup" || b === "deluxe");
  if (i >= 0) bottles[i] = "empty";
}

export function assertFormulas() {
  const errors: string[] = [];
  if (slashDamage("wanderer", 0, false, "cannot_rest") !== 1) errors.push("slash wanderer");
  if (Math.abs(slashDamage("wanderer", 1, false, "pride") - 1.18) > 1e-9) errors.push("edge");
  if (spinDamage("wanderer", 0) !== 3.2) errors.push("spin");
  if (bodyHp("officer", 0) !== 5) errors.push("officer hp");
  if (bodyHp("wanderer", 3) !== 6) errors.push("vitality");
  if (enemyMaxHp("crow", 0, false, null) !== 2) errors.push("crow");
  if (enemyMaxHp("bear", 5, false, null) !== 11) errors.push("bear c5");
  if (enemyMaxHp("crow", 0, true, null) !== 3) errors.push("tropo crow");
  if (enemies.resident?.placed !== false) errors.push("resident placed flag");
  if (REACH !== 32) errors.push("reach");
  if (CONTACT !== 12) errors.push("contact");
  if (KNOCK !== 10) errors.push("knock");
  if (errors.length) throw new Error("formula drift: " + errors.join(", "));
}

assertFormulas();
