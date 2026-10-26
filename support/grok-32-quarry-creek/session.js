/**
 * Playable cut. Resolves only the eight implemented abilities.
 * Authored abilities stay in the codex — this file never calls them.
 */
import {
  TOOL_ID,
  abilityById,
  advanceFlood,
  armEvade,
  beginCairn,
  beginHeartbeat,
  createState,
  endHeartbeat,
  interruptMovement,
  markFissure,
  markUndertow,
  noteTape,
  releaseBorrow,
  releaseFault,
  releaseVerdict,
  resetCombatState,
  resolveEvade,
  resolveGuardHit,
  resolveUndertow,
  startReturnFlood,
  tapGuard,
  tickDefense,
  tickGuard,
  tickHeartbeat,
  tickWindup,
  tileKey,
  touchProjectile,
  tryShove,
  useDungeonTool,
} from "./rules.js";

const SPEED = 4.4;
const RADIUS = 0.28;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function buildArena() {
  const state = createState(16, 11);
  for (let x = 0; x < state.w; x++) {
    for (let y = 0; y < state.h; y++) {
      if (x === 0 || y === 0 || x === state.w - 1 || y === state.h - 1) state.walls.add(tileKey(x, y));
    }
  }
  for (let y = 2; y <= 7; y++) if (y !== 5) state.walls.add(tileKey(8, y));
  for (let y = 1; y <= 9; y++) if (y !== 5) state.walls.add(tileKey(13, y));
  for (let y = 1; y <= 9; y++) if (y !== 5) state.walls.add(tileKey(14, y));
  state.door = { id: "seam_door", x: 13, y: 5, open: false, requiresTool: TOOL_ID };
  state.goal = { x: 14, y: 5 };
  state.routeCritical = [{ x: 12, y: 5 }];
  for (const [x, y] of [
    [4, 8],
    [5, 8],
    [6, 8],
  ]) state.hazards.add(tileKey(x, y));
  state.movables = [
    { id: "sled-a", x: 3, y: 6 },
    { id: "sled-b", x: 5, y: 4 },
  ];
  state.enemies = [
    foe("mite-1", "mite", 4, 3, 28),
    foe("mite-2", "mite", 6, 6, 28),
    foe("archer", "archer", 11, 3, 22),
    foe("warden", "warden", 11, 7, 170, { anchor: true, heavy: true, boss: true, trueAim: true }),
  ];
  state.player.x = 2.5;
  state.player.y = 8.5;
  state.player.facing = { x: 0, y: -1 };
  state.player.mass = 72;
  state.player.flow = 72;
  state.player.pathTape = [{ x: 2, y: 8 }];
  return state;
}

function foe(id, kind, x, y, hp, extra = {}) {
  return {
    id,
    kind,
    x,
    y,
    hp,
    maxHp: hp,
    anchor: false,
    heavy: false,
    boss: false,
    trueAim: false,
    cool: kind === "archer" ? 0.8 : kind === "warden" ? 1.1 : 0.35,
    special: kind === "warden" ? 5.5 : 0,
    telegraph: null,
    flash: 0,
    ...extra,
  };
}

function log(state, text) {
  state.log.unshift({ text });
  if (state.log.length > 6) state.log.length = 6;
}

function cardinal(facing) {
  if (Math.abs(facing.x) > Math.abs(facing.y)) return { x: Math.sign(facing.x) || 1, y: 0 };
  return { x: 0, y: Math.sign(facing.y) || -1 };
}

function asTile(state, fn) {
  const player = state.player;
  const ox = player.x;
  const oy = player.y;
  const fx = Math.floor(ox);
  const fy = Math.floor(oy);
  player.x = fx;
  player.y = fy;
  const result = fn();
  if (player.x !== fx || player.y !== fy) {
    player.x += 0.5;
    player.y += 0.5;
  } else {
    player.x = ox;
    player.y = oy;
  }
  return result;
}

export function createSession() {
  const state = buildArena();
  const keys = new Set();
  let engaged = false;
  let steer = 0;
  let vx = 0;
  let vy = 0;
  let lastTile = "2,8";
  let strikeCd = 0;
  let hazardAcc = 0;
  let dash = null;
  let shake = 0;
  let cleared = false;
  const shotId = { n: 1 };

  function say(text) {
    log(state, text);
  }

  function tileSolid(tx, ty, ignoreMovable) {
    if (state.walls.has(tileKey(tx, ty))) return "wall";
    if (state.door && !state.door.open && state.door.x === tx && state.door.y === ty) return "door";
    if (state.cairns.some((cairn) => cairn.hp > 0 && cairn.x === tx && cairn.y === ty)) return "cairn";
    if (state.movables.some((movable) => movable.id !== ignoreMovable && movable.x === tx && movable.y === ty)) {
      return "movable";
    }
    if (state.enemies.some((enemy) => enemy.hp > 0 && enemy.x === tx && enemy.y === ty)) return "enemy";
    return null;
  }

  function bodyHits(px, py) {
    const hits = [];
    const minX = Math.floor(px - RADIUS);
    const maxX = Math.floor(px + RADIUS);
    const minY = Math.floor(py - RADIUS);
    const maxY = Math.floor(py + RADIUS);
    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const nearestX = Math.max(tx, Math.min(px, tx + 1));
        const nearestY = Math.max(ty, Math.min(py, ty + 1));
        const dist = Math.hypot(px - nearestX, py - nearestY);
        if (dist > RADIUS) continue;
        const solid = tileSolid(tx, ty);
        if (solid) hits.push({ tx, ty, solid });
      }
    }
    return hits;
  }

  function tryShoveInto(hits, sx, sy) {
    if (!state.player.committed || Math.abs(sx) + Math.abs(sy) !== 1) return false;
    const movables = hits.filter((hit) => hit.solid === "movable");
    if (!movables.length) return false;
    const movable = state.movables.find((item) => item.x === movables[0].tx && item.y === movables[0].ty);
    if (!movable) return false;
    const result = tryShove(state, movable.id, sx, sy);
    if (result.ok) say("The sled takes the shoulder.");
    else if (result.interrupted) say(`The gait breaks — ${labelReason(result.reason)}.`);
    return result.ok;
  }

  function moveAxis(dx, dy) {
    const player = state.player;
    if (dx !== 0) {
      const nx = player.x + dx;
      const hits = bodyHits(nx, player.y);
      if (!hits.length) player.x = nx;
      else if (tryShoveInto(hits, Math.sign(dx), 0)) {
        const again = bodyHits(nx, player.y);
        if (!again.length) player.x = nx;
      }
    }
    if (dy !== 0) {
      const ny = player.y + dy;
      const hits = bodyHits(player.x, ny);
      if (!hits.length) player.y = ny;
      else if (tryShoveInto(hits, 0, Math.sign(dy))) {
        const again = bodyHits(player.x, ny);
        if (!again.length) player.y = ny;
      }
    }
  }

  function rememberTile() {
    const tx = Math.floor(state.player.x);
    const ty = Math.floor(state.player.y);
    const key = `${tx},${ty}`;
    if (key === lastTile) return;
    lastTile = key;
    asTile(state, () => noteTape(state));
  }

  function die() {
    resetCombatState(state, "death");
    state.player.x = 2.5;
    state.player.y = 8.5;
    state.player.facing = { x: 0, y: -1 };
    state.player.spawnGrace = 0.6;
    dash = null;
    lastTile = "2,8";
    say("Death clears the cut. Strikes refill mass. Evades refill flow.");
  }

  function hurt(amount, attack) {
    const player = state.player;
    if (player.spawnGrace > 0) return { ignored: "grace" };
    if (player.guarding) {
      const result = asTile(state, () => resolveGuardHit(state, attack));
      if (result.negated) say("Verdict catches the blow.");
      else {
        if (player.windup || player.flood) interruptMovement(state, "hit");
        if (result.spilled && (attack.tier === "red" || attack.unstoppable)) say("Red iron spills the verdict.");
        else if (result.spilled) say("The guard was late. The store spills.");
        else say("Another hit lands inside the guard.");
      }
      if (player.hp <= 0) die();
      shake = Math.min(6, shake + 3);
      return result;
    }
    if (player.evadeArmed && state.time <= player.evadeUntil) {
      const result = resolveEvade(state, attack);
      if (result.negated) {
        say("Current borrowed. J sends it back.");
        return result;
      }
      if (attack.tier === "red" || attack.unstoppable) say("That current will not be borrowed.");
    }
    if (player.windup || player.flood) interruptMovement(state, "hit");
    player.hp -= amount;
    shake = Math.min(7, shake + 4);
    if (player.hp <= 0) die();
    return { damage: amount };
  }

  function doCommit() {
    const player = state.player;
    if (player.committed) {
      player.committed = false;
      say("The gait lets go.");
      return;
    }
    const numbers = abilityById("walking_quarry").numbers;
    const threshold = abilityById("walking_quarry").cost.massThreshold || 10;
    if (player.mass < threshold) {
      say("Walking Quarry wants mass in the legs.");
      return;
    }
    if (player.stamina < numbers.entryStamina) {
      say("Not enough stamina to commit.");
      return;
    }
    player.stamina -= numbers.entryStamina;
    player.committed = true;
    say("Gait committed. Run at a sled.");
  }

  function doMark() {
    const result = asTile(state, () => markFissure(state, cardinal(state.player.facing)));
    if (!result.ok) say(`The fault refuses — ${labelReason(result.reason)}.`);
    else say("Fissure marked. J propagates.");
  }

  function doCairn() {
    if (state.player.windup) return;
    const dir = cardinal(state.player.facing);
    const x = Math.floor(state.player.x) + dir.x;
    const y = Math.floor(state.player.y) + dir.y;
    const result = asTile(state, () => beginCairn(state, x, y));
    if (!result.ok) say(`Cairnfall refuses — ${labelReason(result.reason)}.`);
    else say("Rooted. The courses are deciding.");
  }

  function doFlood() {
    const result = asTile(state, () => startReturnFlood(state));
    if (!result.ok) say(result.reason === "empty_path" ? "No path to return." : `Flood refuses — ${labelReason(result.reason)}.`);
    else say("The flood runs backward.");
  }

  function doHeart() {
    if (state.player.heartbeat > 0) {
      const ended = endHeartbeat(state);
      say(`Heartbeats close. ${ended.released.filter((item) => item.damage).length} motes leave.`);
      return;
    }
    const result = beginHeartbeat(state);
    if (!result.ok) say(`Heartbeats refuse — ${labelReason(result.reason)}.`);
    else say("Between heartbeats. The first three shots may turn.");
  }

  function doUndertow() {
    const originX = state.player.x;
    const originY = state.player.y;
    const facing = cardinal(state.player.facing);
    let best = null;
    let bestScore = Infinity;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x + 0.5 - originX;
      const dy = enemy.y + 0.5 - originY;
      const dist = Math.hypot(dx, dy);
      if (dist > 5.2) continue;
      const dot = (dx * facing.x + dy * facing.y) / (dist || 1);
      if (dot < 0.15) continue;
      if (dist < bestScore) {
        best = enemy;
        bestScore = dist;
      }
    }
    if (!best) {
      say("Nothing in front to pull.");
      return;
    }
    const result = markUndertow(state, best.id);
    if (!result.ok) say(result.reason === "anchored" ? "The Warden is anchored. Undertow moves nobody." : `Undertow refuses — ${labelReason(result.reason)}.`);
    else say(`Undertow marks ${best.kind}. J is the confirm.`);
  }

  function doTool() {
    const result = asTile(state, () => useDungeonTool(state));
    if (!result.ok) {
      if (result.reason === "too_far") say("The seam chisel only answers beside the door.");
      else say(`The door stays — ${labelReason(result.reason)}.`);
      return;
    }
    say("The chisel opens the seam. No hammer does this.");
  }

  function doEvade() {
    if (state.player.windup) {
      say("The swing has rooted you.");
      return;
    }
    const result = armEvade(state);
    if (!result.ok) {
      say(`Evade refuses — ${labelReason(result.reason)}.`);
      return;
    }
    const moveX = (keys.has("KeyA") || keys.has("ArrowLeft") ? -1 : 0) + (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0);
    const moveY = (keys.has("KeyW") || keys.has("ArrowUp") ? -1 : 0) + (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const dir = moveX || moveY ? normalize(moveX, moveY) : { ...cardinal(state.player.facing) };
    dash = { t: 0.12, x: dir.x, y: dir.y };
  }

  function doStrike() {
    if (strikeCd > 0 || state.player.windup) return;
    strikeCd = 0.36;
    if (state.player.heartbeat > 0) endHeartbeat(state);
    if (state.player.borrow) {
      const result = asTile(state, () => releaseBorrow(state, cardinal(state.player.facing)));
      say(result.damage ? `Borrowed current returns for ${result.damage}.` : "The return dies on stone.");
      return;
    }
    if (state.fissure) {
      const result = asTile(state, () => releaseFault(state));
      if (!result.ok) say(`The hammer refuses — ${labelReason(result.reason)}.`);
      else if (!result.hits.length) say("The fault runs, and finds no body.");
      else say(`Fault hits ${result.hits.length} for ${result.total}.`);
      return;
    }
    if (state.player.undertow) {
      const originX = Math.floor(state.player.x);
      const originY = Math.floor(state.player.y);
      const facing = cardinal(state.player.facing);
      const lane = [1, 2, 3].map((step) => ({ x: originX + facing.x * step, y: originY + facing.y * step }));
      const pulled = resolveUndertow(state, lane);
      if (pulled.moved) say("Undertow drags them into the lane.");
      else if (pulled.reason === "blocked") say("The pull has no legal lane.");
    }
    const facing = cardinal(state.player.facing);
    let hit = false;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x + 0.5 - state.player.x;
      const dy = enemy.y + 0.5 - state.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1.35) continue;
      const dot = (dx * facing.x + dy * facing.y) / (dist || 1);
      if (dot < 0.2) continue;
      enemy.hp -= 12;
      enemy.flash = 0.12;
      hit = true;
      if (enemy.hp <= 0) say(`${enemy.kind} breaks.`);
    }
    if (hit) state.player.mass = Math.min(state.player.maxMass, state.player.mass + 8);
    else say("The swing finds air.");
  }

  function handleDown(code, repeat) {
    keys.add(code);
    if (!engaged || repeat) return;
    if (code === "KeyV") doCommit();
    if (code === "KeyQ") doMark();
    if (code === "KeyJ") doStrike();
    if (code === "KeyC") doCairn();
    if (code === "KeyR") doFlood();
    if (code === "KeyH") doHeart();
    if (code === "KeyU") doUndertow();
    if (code === "KeyF") doTool();
    if (code === "Space") doEvade();
    if (code === "KeyK") {
      if (state.player.a11y.holdAlternative && state.player.guarding) {
        if (state.player.verdictStored > 0) {
          const released = asTile(state, () => releaseVerdict(state, cardinal(state.player.facing)));
          say(released.ok ? `Verdict leaves for ${released.damage}.` : "The verdict has nothing stored.");
        } else state.player.guarding = false;
      } else {
        asTile(state, () => tapGuard(state));
      }
    }
  }

  function handleUp(code) {
    keys.delete(code);
    if (!engaged) return;
    if (code === "KeyK" && !state.player.a11y.holdAlternative) {
      if (state.player.verdictStored > 0) {
        const released = asTile(state, () => releaseVerdict(state, cardinal(state.player.facing)));
        say(released.ok ? `Verdict leaves for ${released.damage}.` : "Empty guard.");
      } else state.player.guarding = false;
    }
  }

  function step(dt) {
    dt = Math.min(0.05, dt);
    if (!engaged) return snapshot(dt);
    state.time += dt;
    const player = state.player;
    strikeCd = Math.max(0, strikeCd - dt);
    shake = Math.max(0, shake - dt * 18);
    for (const enemy of state.enemies) enemy.flash = Math.max(0, enemy.flash - dt);

    let ax = 0;
    let ay = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) ax -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) ax += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) ay -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) ay += 1;
    if (steer) ax -= steer;
    if (dash && dash.t > 0) {
      ax = dash.x;
      ay = dash.y;
      dash.t -= dt;
    }
    const moving = Math.hypot(ax, ay) > 0;
    if (moving) {
      const n = normalize(ax, ay);
      ax = n.x;
      ay = n.y;
      if (!pointerAim) player.facing = { x: ax, y: ay };
    }
    const rooted = !!player.windup;
    const scale = player.speedScale || 1;
    const boost = dash && dash.t > 0 ? 1.7 : 1;
    if (!rooted && moving) moveAxis(ax * SPEED * scale * boost * dt, ay * SPEED * scale * boost * dt);
    vx = rooted || !moving ? 0 : ax * SPEED;
    vy = rooted || !moving ? 0 : ay * SPEED;
    rememberTile();

    if (player.committed) {
      player.stamina -= abilityById("walking_quarry").numbers.staminaPerSecond * dt;
      if (moving) player.momentum = Math.min(6, player.momentum + dt * 10);
      else player.momentum = Math.max(0, player.momentum - dt * 4);
      if (player.stamina <= 0 || player.mass < 10) {
        player.committed = false;
        player.stamina = Math.max(0, player.stamina);
        say("The gait fails.");
      }
    } else {
      player.momentum = Math.max(0, player.momentum - dt * 7);
      if (moving) player.mass = Math.max(0, player.mass - 4 * dt);
    }
    if (!moving) player.flow = Math.max(0, player.flow - 6 * dt);
    if (!player.committed && !player.windup) {
      player.stamina = Math.min(player.maxStamina, player.stamina + 18 * dt);
    }
    player.mass = Math.max(0, Math.min(player.maxMass, player.mass));
    player.flow = Math.max(0, Math.min(player.maxFlow, player.flow));

    tickDefense(player, dt);
    tickGuard(state, dt);
    const beat = tickHeartbeat(state, dt);
    if (beat?.released) say("The heartbeats end. Motes go with the facing.");
    if (player.evadeArmed && state.time > player.evadeUntil) player.evadeArmed = false;
    if (state.fissure && state.time > state.fissure.until) {
      state.fissure = null;
      say("The fissure seals itself.");
    }
    if (player.borrow && state.time > player.borrow.until) {
      player.borrow = null;
      say("The borrowed current forgets.");
    }
    if (player.undertow && state.time > player.undertow.until) {
      player.undertow = null;
      say("Undertow slips.");
    }
    if (player.windup) {
      const cairn = tickWindup(state, dt);
      if (cairn && !cairn.pending) {
        say(cairn.ok ? "A temporary cairn stands. It is not a door." : `The courses fail — ${labelReason(cairn.reason)}.`);
      }
    }
    if (player.flood) {
      player.flood.acc = (player.flood.acc || 0) + dt;
      const each = 0.45 / player.flood.steps.length;
      while (player.flood && player.flood.acc >= each) {
        player.flood.acc -= each;
        const stepped = asTile(state, () => advanceFlood(state));
        if (!stepped.ok) {
          say(`Flood stops — ${labelReason(stepped.reason)}.`);
          break;
        }
        if (stepped.done) say("The flood arrives clean.");
      }
    }
    for (const cairn of [...state.cairns]) {
      if (state.time > cairn.until || cairn.hp <= 0) {
        state.cairns = state.cairns.filter((item) => item !== cairn);
        say("The cairn crumbles.");
      }
    }

    stepEnemies(dt);
    stepShots(dt);
    const tx = Math.floor(player.x);
    const ty = Math.floor(player.y);
    if (state.hazards.has(tileKey(tx, ty))) {
      hazardAcc += dt;
      if (hazardAcc > 0.55) {
        hazardAcc = 0;
        if (player.spawnGrace <= 0) {
          player.hp -= 8;
          if (player.windup) interruptMovement(state, "hazard");
          say("The pit bites.");
          if (player.hp <= 0) die();
        }
      }
    } else hazardAcc = 0;

    if (!cleared && state.door.open && tx === state.goal.x && ty === state.goal.y) {
      cleared = true;
      say("The shard answers the chisel, not the hammer.");
    }
    return snapshot();
  }

  let pointerAim = false;

  function stepEnemies(dt) {
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      if (enemy.telegraph) {
        enemy.telegraph.t -= dt;
        if (enemy.telegraph.t <= 0) {
          const attack = enemy.telegraph;
          enemy.telegraph = null;
          resolveEnemyAttack(enemy, attack);
        }
      } else {
        enemy.cool -= dt;
        if (enemy.kind === "warden") {
          enemy.special -= dt;
          const dist = Math.hypot(enemy.x + 0.5 - state.player.x, enemy.y + 0.5 - state.player.y);
          if (enemy.special <= 0) {
            enemy.telegraph = { t: 0.7, kind: "ring", tier: "red", unstoppable: true, damage: 18, dx: 0, dy: 0 };
            enemy.special = 7.5;
            say("The Warden's ring is red. It will not be caught.");
          } else if (dist < 2.05 && enemy.cool <= 0) {
            enemy.telegraph = {
              t: 0.48,
              kind: "slam",
              tier: "yellow",
              damage: 14,
              dx: Math.sign(state.player.x - enemy.x),
              dy: Math.sign(state.player.y - enemy.y),
            };
            enemy.cool = 2.5;
          }
        } else if (enemy.kind === "archer") {
          if (enemy.cool <= 0) {
            enemy.telegraph = { t: 0.32, kind: "shot", tier: "yellow" };
            enemy.cool = 1.85;
          }
        } else if (enemy.cool <= 0) {
          const dist = Math.hypot(enemy.x + 0.5 - state.player.x, enemy.y + 0.5 - state.player.y);
          if (dist < 1.05) {
            enemy.telegraph = {
              t: 0.28,
              kind: "bite",
              tier: "yellow",
              damage: 9,
              dx: Math.sign(state.player.x - (enemy.x + 0.5)),
              dy: Math.sign(state.player.y - (enemy.y + 0.5)),
            };
            enemy.cool = 1.05;
          }
        }
      }
      enemy.move = (enemy.move || 0) - dt;
      if (!enemy.telegraph && enemy.move <= 0) {
        const dist = Math.hypot(enemy.x + 0.5 - state.player.x, enemy.y + 0.5 - state.player.y);
        if (enemy.kind === "archer") {
          if (dist < 3.2) stepFoe(enemy, true);
          else if (dist > 6.2) stepFoe(enemy, false);
        } else if (dist > (enemy.kind === "warden" ? 1.45 : 1.05)) stepFoe(enemy, false);
        enemy.move = enemy.kind === "warden" ? 0.62 : 0.4;
      }
    }
  }

  function resolveEnemyAttack(enemy, attack) {
    const dist = Math.hypot(enemy.x + 0.5 - state.player.x, enemy.y + 0.5 - state.player.y);
    if (attack.kind === "shot") {
      const dx = state.player.x - (enemy.x + 0.5);
      const dy = state.player.y - (enemy.y + 0.5);
      const n = normalize(dx, dy);
      state.projectiles.push({
        id: `shot-${shotId.n++}`,
        x: enemy.x + 0.5 + n.x * 0.4,
        y: enemy.y + 0.5 + n.y * 0.4,
        vx: n.x * 5.4,
        vy: n.y * 5.4,
        deflectable: true,
        unstoppable: false,
        tier: "yellow",
        damage: 8,
        life: 2.4,
      });
      return;
    }
    const reach = attack.kind === "ring" ? 2.25 : attack.kind === "slam" ? 1.7 : 1.15;
    if (dist <= reach) hurt(attack.damage, attack);
  }

  function stepFoe(enemy, flee) {
    const tx = Math.floor(state.player.x);
    const ty = Math.floor(state.player.y);
    let best = null;
    let bestScore = flee ? -Infinity : Infinity;
    for (const [dx, dy] of DIRS) {
      const nx = enemy.x + dx;
      const ny = enemy.y + dy;
      if (!footRoom(nx, ny, enemy)) continue;
      const score = Math.hypot(nx + 0.5 - (tx + 0.5), ny + 0.5 - (ty + 0.5));
      if (flee ? score > bestScore : score < bestScore) {
        bestScore = score;
        best = { x: nx, y: ny };
      }
    }
    const here = Math.hypot(enemy.x + 0.5 - (tx + 0.5), enemy.y + 0.5 - (ty + 0.5));
    if (!best) return;
    if (!flee && bestScore >= here) return;
    enemy.x = best.x;
    enemy.y = best.y;
  }

  function footRoom(x, y, self) {
    if (x <= 0 || y <= 0 || x >= state.w - 1 || y >= state.h - 1) return false;
    if (state.walls.has(tileKey(x, y))) return false;
    if (state.door && !state.door.open && state.door.x === x && state.door.y === y) return false;
    if (state.cairns.some((cairn) => cairn.hp > 0 && cairn.x === x && cairn.y === y)) return false;
    if (state.movables.some((movable) => movable.x === x && movable.y === y)) return false;
    if (state.enemies.some((enemy) => enemy !== self && enemy.hp > 0 && enemy.x === x && enemy.y === y)) return false;
    if (Math.floor(state.player.x) === x && Math.floor(state.player.y) === y) return false;
    return true;
  }

  function stepShots(dt) {
    const next = [];
    for (const shot of state.projectiles) {
      shot.life -= dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (shot.life <= 0) continue;
      const tx = Math.floor(shot.x);
      const ty = Math.floor(shot.y);
      if (state.walls.has(tileKey(tx, ty))) continue;
      if (state.door && !state.door.open && state.door.x === tx && state.door.y === ty) continue;
      const cairn = state.cairns.find((item) => item.hp > 0 && item.x === tx && item.y === ty);
      if (cairn) {
        if (!shot.unstoppable) {
          cairn.hp -= shot.damage;
          continue;
        }
      }
      const dist = Math.hypot(shot.x - state.player.x, shot.y - state.player.y);
      if (dist < 0.42) {
        if (state.player.heartbeat > 0) {
          const touched = touchProjectile(state, shot);
          if (touched.absorbed) continue;
        }
        hurt(shot.damage, shot);
        continue;
      }
      next.push(shot);
    }
    state.projectiles = next;
  }

  function snapshot() {
    const player = state.player;
    const now = state.time;
    const cds = {};
    for (const id of [
      "split_the_fault",
      "walking_quarry",
      "verdict_of_stone",
      "cairnfall",
      "borrowed_current",
      "return_flood",
      "river_between_heartbeats",
      "undertow",
    ]) {
      cds[id] = Math.max(0, (player.cooldowns[id] || 0) - now);
    }
    const tx = Math.floor(player.x);
    const ty = Math.floor(player.y);
    let hint = "Eight live abilities. The door answers only the seam chisel.";
    if (player.borrow) hint = "Borrowed current is live. J returns it.";
    else if (state.fissure) hint = "Fissure is live. J propagates the fault.";
    else if (player.undertow) hint = "Undertow is marked. J confirms the pull.";
    else if (player.windup) hint = "Cairnfall has rooted you.";
    else if (player.heartbeat > 0) hint = "Heartbeats open. A fourth shot still wounds.";
    else if (state.door && Math.abs(tx - state.door.x) + Math.abs(ty - state.door.y) === 1 && !state.door.open) {
      hint = "Beside the seam. F uses the chisel.";
    }
    return {
      hp: player.hp,
      maxHp: player.maxHp,
      stamina: player.stamina,
      mass: player.mass,
      flow: player.flow,
      momentum: player.momentum,
      committed: player.committed,
      verdict: player.verdictStored,
      guarding: player.guarding,
      borrow: !!player.borrow,
      heartbeat: player.heartbeat,
      motes: player.motes.length,
      fissure: !!state.fissure,
      cairns: state.cairns.length,
      tape: player.pathTape.length,
      flood: !!player.flood,
      evade: player.evadeArmed,
      undertow: !!player.undertow,
      windup: player.windup ? Math.max(0, player.windup.t) : 0,
      cleared,
      doorOpen: !!state.door?.open,
      log: state.log.map((entry) => entry.text),
      cds,
      hint,
      a11y: { ...player.a11y },
      speed: Math.hypot(vx, vy),
      x: player.x,
      y: player.y,
      shake,
    };
  }

  function setPointer(worldX, worldY, active) {
    pointerAim = !!active;
    if (!active || worldX == null) return;
    const dx = worldX - state.player.x;
    const dy = worldY - state.player.y;
    if (Math.hypot(dx, dy) > 0.15) state.player.facing = normalize(dx, dy);
  }

  return {
    state,
    step,
    snapshot,
    setEngaged(value) {
      engaged = !!value;
      if (!engaged) keys.clear();
    },
    isEngaged: () => engaged,
    setA11y(partial) {
      Object.assign(state.player.a11y, partial);
    },
    setKeys(codes) {
      keys.clear();
      for (const code of codes) keys.add(code);
    },
    setSteer(value) {
      steer = value || 0;
    },
    press(code) {
      handleDown(code, false);
      if (code !== "KeyK" || state.player.a11y.holdAlternative) handleUp(code);
    },
    hold(code, down) {
      if (down) handleDown(code, false);
      else handleUp(code);
    },
    resetLoadout() {
      resetCombatState(state, "loadout");
      say("Loadout set down. Charges, tape, cairn, and fissure are gone.");
    },
    handleDown,
    handleUp,
    getX: () => state.player.x,
    getY: () => state.player.y,
    getSpeed: () => Math.hypot(vx, vy),
    getYaw: () => Math.atan2(state.player.facing.x, -state.player.facing.y),
    setPointer,
    nudge(dx, dy) {
      state.player.x += dx;
      state.player.y += dy;
    },
  };
}

function normalize(x, y) {
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
}

function labelReason(reason) {
  switch (reason) {
    case "protected_geometry":
      return "protected stone";
    case "tool_required":
      return "a tool is required";
    case "door_sealed":
      return "the door is sealed";
    case "would_seal_route":
      return "that would seal the chisel route";
    case "stamina":
      return "not enough stamina";
    case "mass":
      return "not enough mass";
    case "flow":
      return "not enough flow";
    case "cooldown":
      return "still cooling";
    case "occupied":
      return "the tile is occupied";
    case "hazard":
      return "the pit will not hold a cairn";
    case "no_fissure":
      return "no legal fissure";
    case "no_momentum":
      return "no run-up";
    case "heartbeat_recovery":
      return "the heartbeats have not settled";
    case "empty_path":
      return "the tape is empty";
    case "anchored":
      return "anchored";
    default:
      return reason || "refused";
  }
}
