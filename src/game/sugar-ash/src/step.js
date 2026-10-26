// @ts-nocheck
import { COSTS, LIMITS } from "./constants.js";
import { moveBody, norm } from "./geometry.js";
import { buildTelegraphs } from "./telegraphs.js";
import { HANDLERS } from "./abilities.js";
import {
  aimEllis,
  cancelChannel,
  completeChannel,
  dealDamage,
  ellisOf,
  emit,
  faceVec,
  foesInArc,
  gain,
  getActor,
  isClean,
  say,
  sparkAt,
  spawnProjectile,
  speedMul,
  tickBlossoms,
  tickLease,
  tickProjectiles,
  tickStatuses,
  tickTethers,
  tickZones,
  updateAwareness,
} from "./state.js";
import { dash } from "./sugar.js";

export function attune(world, discipline, id) {
  if (discipline !== "sugar" && discipline !== "ash") return false;
  world.attune[discipline] = id;
  emit(world, "attune", { discipline, id });
  const name = id ?? "nothing";
  say(world, `${discipline === "sugar" ? "Sugar" : "Ash"} attuned: ${name}.`);
  return true;
}

export function enqueue(world, verb, extra = {}) {
  world.queue.push({ verb, ...extra });
}

export function releaseBrace(world) {
  world.braced = false;
  world.releasePulse = true;
}

export function chooseWeave(world, id) {
  const p = world.pendingChoice;
  if (!p || !p.ids.includes(id)) return false;
  world.pendingChoice = null;
  resolveVerb(world, { ...p.action, forceId: id });
  return true;
}

function baseVerb(world, action) {
  const e = aimEllis(world, action) ?? ellisOf(world);
  if (!e || !e.alive) return;
  if (action.verb === "strike") {
    const foes = foesInArc(world);
    action.hits = action.hits ?? [];
    for (const t of foes) {
      const clean = isClean(world, t);
      const res = dealDamage(world, t, LIMITS.meleeDamage, {
        fromEllis: true,
        clean,
        kind: "strike",
      });
      action.hits.push({ id: t.id, clean, immediate: true, amount: res.amount });
      sparkAt(world, t.x, t.y, 12, "strike");
    }
    if (!foes.length) say(world, "The hook finds no one.");
  } else if (action.verb === "shot") {
    const f = faceVec(e);
    const clean = Math.hypot(e.vx, e.vy) <= LIMITS.cleanSpeed;
    spawnProjectile(world, {
      x: e.x + f.x * 16,
      y: e.y + f.y * 16,
      vx: f.x * LIMITS.arrowSpeed,
      vy: f.y * LIMITS.arrowSpeed,
      damage: LIMITS.arrowDamage,
      life: LIMITS.arrowLife,
      kind: "arrow",
      abilityId: "shot",
      wreath: world.attune.sugar === "wreath-of-debts",
      clean,
    });
    say(world, "A plain shot. No weave claimed it.");
  } else if (action.verb === "step") {
    const dir = dirOf(world, action, e);
    dash(world, e, dir, LIMITS.dash);
    e.iframe = LIMITS.iframe;
    emit(world, "step", {});
  } else if (action.verb === "brace") {
    world.braced = true;
    emit(world, "brace", {});
  }
}

function dirOf(world, action, e) {
  if (action.dirX != null || action.dirY != null) return norm(action.dirX ?? 0, action.dirY ?? 0);
  return wish(world, e);
}

export function resolveVerb(world, action) {
  if (action.verb === "step" && world.prepared) {
    world.prepared = null;
    gain(world, "ember", COSTS.lastArrowRefund);
    say(world, "Stepping slips the nocked arrow. 4 ember returns.");
    emit(world, "nock-cancel", { reason: "step" });
  }
  if (
    world.channel?.abilityId === "sap-pressure" &&
    (action.verb === "shot" || action.verb === "strike")
  ) {
    completeChannel(world, "release");
    return;
  }
  const ids = [world.attune.sugar, world.attune.ash].filter(Boolean);
  const claimers = ids.filter((id) => HANDLERS[id]?.claim?.(world, action.verb));
  if (!action.forceId && claimers.length > 1) {
    world.pendingChoice = { verb: action.verb, ids: claimers, action: { ...action } };
    say(world, "Two weaves claim this action. Choose which hand answers.");
    emit(world, "choice", { verb: action.verb, ids: claimers });
    return;
  }
  const chosen =
    action.forceId && ids.includes(action.forceId) ? action.forceId : (claimers[0] ?? null);
  action.consumed = false;
  action.hits = action.hits ?? [];
  if (chosen && HANDLERS[chosen]?.apply) HANDLERS[chosen].apply(world, action);
  if (!action.consumed) baseVerb(world, action);
  for (const id of ids) HANDLERS[id]?.passive?.(world, action);
}

function wish(world, e) {
  const stick = world.input?.move;
  if (stick && Math.hypot(stick.x, stick.y) > 0.2) return norm(stick.x, stick.y);
  const k = world.input?.keys ?? new Set();
  let x = 0;
  let y = 0;
  if (k.has("KeyA") || k.has("ArrowLeft")) x -= 1;
  if (k.has("KeyD") || k.has("ArrowRight")) x += 1;
  if (k.has("KeyW") || k.has("ArrowUp")) y -= 1;
  if (k.has("KeyS") || k.has("ArrowDown")) y += 1;
  if (!x && !y) return { x: 0, y: 0 };
  return norm(x, y);
}

function steerFoe(world, actor) {
  const e = ellisOf(world);
  if (!e) return { x: 0, y: 0 };
  let x = e.x - actor.x;
  let y = e.y - actor.y;
  const d = Math.hypot(x, y);
  if (d < 78) {
    x = 0;
    y = 0;
  } else {
    x /= d || 1;
    y /= d || 1;
  }
  if (!actor.boss) {
    for (const te of world.tethers) {
      if (!te.alive || te.lease) continue;
      let other = null;
      if (te.aId === actor.id && te.bKind === "actor") other = getActor(world, te.bId);
      else if (te.bId === actor.id && te.aKind === "actor") other = getActor(world, te.aId);
      if (!other || other.team !== "foe" || !other.alive) continue;
      x += actor.x - other.x;
      y += actor.y - other.y;
    }
  }
  return norm(x, y);
}

export function step(world, dt) {
  const h = Math.min(Math.max(dt, 0), 0.05);
  world.time += h;
  const queued = world.queue.splice(0, world.queue.length);
  for (const action of queued) resolveVerb(world, action);

  if (world.channel) {
    const ch = world.channel;
    const handler = HANDLERS[ch.abilityId];
    if (handler?.tick) {
      const stop = handler.tick(world, ch, h);
      if (stop === "cancel" && world.channel) cancelChannel(world, "anchor-lost");
    }
    if (world.channel) {
      world.channel.elapsed += h;
      if (world.channel.elapsed >= world.channel.max) completeChannel(world, "full");
    }
  }
  if (world.releasePulse) {
    world.releasePulse = false;
    if (world.channel?.earlyRelease) completeChannel(world, "release");
    else if (world.channel?.hold) cancelChannel(world, "release");
  }

  const due = [];
  const later = [];
  for (const job of world.queueMicro ?? []) {
    if (job.at <= world.time) due.push(job);
    else later.push(job);
  }
  world.queueMicro = later;
  for (const job of due) job.run();

  for (const a of world.actors) {
    a.px = a.x;
    a.py = a.y;
  }

  const e = ellisOf(world);
  if (e && e.alive) {
    if (world.input?.aimActive) {
      const dx = world.input.aimX - e.x;
      const dy = world.input.aimY - e.y;
      if (Math.hypot(dx, dy) > 2) e.facing = Math.atan2(dy, dx);
    }
    const rooted = e.rooted > 0 || e.stagger > 0 || world.channel?.root;
    if (rooted) {
      e.vx = 0;
      e.vy = 0;
    } else {
      const w = wish(world, e);
      const sp = e.speed * speedMul(e);
      e.vx = w.x * sp;
      e.vy = w.y * sp;
      moveBody(world, e, e.vx * h, e.vy * h);
    }
  }
  for (const a of world.actors) {
    if (!a.alive || a.id === "ellis") continue;
    if (a.stagger > 0) {
      a.vx = 0;
      a.vy = 0;
      continue;
    }
    if (a.drive) {
      a.vx = a.drive.x;
      a.vy = a.drive.y;
    } else if (world.ai && a.ai) {
      const w = steerFoe(world, a);
      const sp = a.speed * speedMul(a);
      a.vx = w.x * sp;
      a.vy = w.y * sp;
    }
    tickLease(world, a);
    moveBody(world, a, a.vx * h, a.vy * h);
  }

  tickZones(world, h);
  tickProjectiles(world, h);
  tickTethers(world, h);
  tickBlossoms(world, h);
  tickStatuses(world, h);

  if (world.settings.ambientRegen) {
    if (world.braced && !world.channel) gain(world, "sap", 8 * h);
    const ember = world.resources.ember - 3 * h;
    world.resources.ember = Math.max(0, ember);
  }

  if (world.autoAwareness) updateAwareness(world);

  for (const f of world.floats) f.life -= h;
  world.floats = world.floats.filter((f) => f.life > 0);
  for (const s of world.sparks) s.life -= h;
  world.sparks = world.sparks.filter((s) => s.life > 0);

  world.telegraphs = buildTelegraphs(world);
}

export function run(world, seconds) {
  const n = Math.max(1, Math.round(seconds / (1 / 60)));
  for (let i = 0; i < n; i++) step(world, 1 / 60);
}
