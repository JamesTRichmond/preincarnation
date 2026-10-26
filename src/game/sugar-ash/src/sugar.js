// @ts-nocheck
import { COSTS, LIMITS } from "./constants.js";
import { dist, norm, pointInRect, rectsOverlap } from "./geometry.js";
import {
  aimEllis,
  anchorAccessible,
  applyStatus,
  dealDamage,
  ellisOf,
  emit,
  endpoint,
  faceVec,
  foesInArc,
  gain,
  getActor,
  isClean,
  linkActors,
  nearestAnchor,
  registerHitHook,
  say,
  snuffBlossom,
  spawnProjectile,
  spend,
  startChannel,
} from "./state.js";

function livingTethers(world) {
  return world.tethers.filter((t) => t.alive);
}

function incident(world, actorId) {
  return livingTethers(world).filter((t) => t.aId === actorId || t.bId === actorId);
}

export const SUGAR = {
  "thread-the-needle": {
    verbs: ["shot"],
    claim(_w, verb) {
      return verb === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      if (!spend(world, "sap", COSTS.thread)) {
        say(world, "Thread the Needle: not enough sap — the shot stays a plain arrow.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: 0,
        life: LIMITS.arrowLife,
        kind: "needle",
        abilityId: "thread-the-needle",
        refundWhiff: COSTS.threadRefund,
        r: 3,
      });
      action.consumed = true;
      say(world, "Thread the Needle: the arrow is spent on the gap, not the body.");
    },
  },

  "wreath-of-debts": {
    verbs: [],
    claim() {
      return false;
    },
    passive(world, action) {
      if (action.verb === "step") {
        const { shedWreath } = action._shed;
        shedWreath(world);
        return;
      }
      for (const hit of action.hits ?? []) {
        if (!hit.immediate) continue;
        tryImmediateWreath(world, hit);
      }
    },
  },

  "sap-pressure": {
    verbs: ["brace"],
    claim(world, verb) {
      return verb === "brace" && !world.channel;
    },
    apply(world, action) {
      const e = ellisOf(world);
      const anchor = nearestAnchor(world, e, LIMITS.pressureReach);
      if (!anchor) {
        say(world, "Sap Pressure: no accessible anchor.");
        emit(world, "anchor-refused", { reason: "none" });
        return;
      }
      startChannel(world, {
        id: "sap-pressure",
        max: LIMITS.pressureMax,
        earlyRelease: true,
        root: true,
        interruptible: true,
        payload: { anchorId: anchor.id, tension: 0 },
      });
      action.consumed = true;
      say(world, "Sap Pressure: tension climbs the anchored line. Release to send it.");
    },
    tick(world, ch, dt) {
      const e = ellisOf(world);
      const anchor = world.anchors.find((a) => a.id === ch.payload.anchorId);
      if (!anchorAccessible(world, e, anchor, LIMITS.pressureReach + 8)) {
        return "cancel";
      }
      const want = LIMITS.pressureDrain * dt;
      if (world.resources.sap <= 0 || ch.payload.tension >= 100) return null;
      const take = Math.min(want, world.resources.sap);
      spend(world, "sap", take);
      ch.sapSpent += take;
      ch.payload.tension = Math.min(100, ch.payload.tension + LIMITS.pressureTension * (take / want));
      return null;
    },
    complete(world, ch, how) {
      if (how === "full") {
        say(world, "The line overcharges and vents. Ellis staggers.");
        const e = ellisOf(world);
        if (e) e.stagger = Math.max(e.stagger, 0.3);
        emit(world, "pressure-vent", { tension: ch.payload.tension });
        return;
      }
      const tension = ch.payload.tension ?? 0;
      if (tension < 1) {
        say(world, "The line was still slack.");
        return;
      }
      const e = ellisOf(world);
      const f = faceVec(e);
      const damage = 6 + tension * 0.22;
      spawnProjectile(world, {
        x: e.x + f.x * 18,
        y: e.y + f.y * 18,
        vx: f.x * 520,
        vy: f.y * 520,
        damage,
        life: 0.95,
        kind: "sap",
        abilityId: "sap-pressure",
        r: 5,
        displaceScale: 28 * (tension / 100),
        stagger: 0,
      });
      emit(world, "pressure-release", { tension, damage });
      say(world, "Sap Pressure releases along Ellis's aim — it does not seek.");
    },
    cancel(world, ch, reason) {
      const back = ch.sapSpent * 0.5;
      gain(world, "sap", back);
      if (reason === "anchor-lost" || reason === "tick") {
        say(world, "Anchor lost — half the spent sap returns.");
        emit(world, "anchor-lost", { refund: back });
      } else {
        say(world, "Sap Pressure cancelled.");
        emit(world, "anchor-lost", { refund: back, reason });
      }
    },
  },

  "common-root": {
    verbs: [],
    claim() {
      return false;
    },
    passive(world, action) {
      if (action.verb !== "strike") return;
      for (const hit of action.hits ?? []) {
        if (!hit.immediate) continue;
        const t = getActor(world, hit.id);
        if (!t) continue;
        if (!incident(world, t.id).length) continue;
        applyStatus(world, t, { id: "sweet-rot", remaining: 2, potency: 0.2 });
        say(world, `Sweet rot enters ${t.name}.`);
      }
    },
  },

  "stake-the-row": {
    verbs: ["brace"],
    claim(_w, verb) {
      return verb === "brace";
    },
    apply(world, action) {
      const e = ellisOf(world);
      if (world.seals.some((s) => pointInRect(e.x, e.y, s)) || world.walls.some((s) => pointInRect(e.x, e.y, s))) {
        say(world, "Stake the Row: this tile is sealed.");
        emit(world, "stake-refused", { reason: "seal" });
        return;
      }
      if (!spend(world, "sap", COSTS.stake)) {
        say(world, "Stake the Row: not enough sap.");
        return;
      }
      startChannel(world, {
        id: "stake-the-row",
        max: LIMITS.stakeChannel,
        earlyRelease: false,
        root: true,
        payload: { x: e.x, y: e.y, spent: COSTS.stake },
      });
      action.consumed = true;
      say(world, "The stake is arming — a hit now wastes it.");
    },
    complete(world, ch) {
      const stakes = world.anchors.filter((a) => a.alive && a.anchorKind === "stake");
      if (stakes.length >= LIMITS.maxStakes) {
        stakes.sort((a, b) => (a.born ?? 0) - (b.born ?? 0));
        stakes[0].alive = false;
        emit(world, "stake-crumble", { id: stakes[0].id });
      }
      const { addAnchor } = late();
      const a = addAnchor(world, {
        x: ch.payload.x,
        y: ch.payload.y,
        anchorKind: "stake",
        name: "sugar stake",
      });
      a.born = world.time;
      emit(world, "stake", { id: a.id });
      say(world, "A sugar stake takes the row.");
    },
    cancel(world, ch) {
      gain(world, "sap", COSTS.stakeRefund);
      say(world, "The stake fails. Half the sap returns.");
      emit(world, "stake-cancel", { refund: COSTS.stakeRefund });
    },
  },

  "second-tap": {
    verbs: ["strike"],
    claim(_w, verb) {
      return verb === "strike";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      const foes = foesInArc(world);
      const t = foes[0];
      if (!t) {
        action.hits = action.hits ?? [];
        return;
      }
      const linked = incident(world, t.id).length > 0 || t.wreath > 0;
      const res = dealDamage(world, t, linked ? LIMITS.meleeDamage + 4 : LIMITS.meleeDamage, {
        fromEllis: true,
        clean: isClean(world, t),
        kind: "strike",
      });
      action.hits = [
        { id: t.id, clean: isClean(world, t), immediate: true, amount: res.amount },
      ];
      if (!linked) {
        say(world, "Second Tap finds no debt to strike. The hook is only a hook.");
        emit(world, "tap-whiff", {});
        action.consumed = true;
        return;
      }
      if (!spend(world, "sap", COSTS.secondTap)) {
        say(world, "Second Tap: not enough sap — tension stays put.");
        action.consumed = true;
        return;
      }
      for (const te of incident(world, t.id)) {
        const add = t.boss ? 7 : 15;
        te.tension = Math.min(100, te.tension + add);
      }
      emit(world, "second-tap", { id: t.id });
      say(world, "Second Tap thrums every thread on that body.");
      action.consumed = true;
    },
  },

  "slack-bargain": {
    verbs: ["step"],
    claim(world, verb) {
      return verb === "step" && livingTethers(world).length > 0;
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      const tethers = livingTethers(world);
      if (!tethers.length) return;
      if (world.resources.sap < COSTS.slack) {
        say(world, "Slack Bargain: not enough sap — the step stays ordinary.");
        return;
      }
      let best = tethers[0];
      let bestD = Infinity;
      for (const te of tethers) {
        const A = endpoint(world, te, "a");
        const B = endpoint(world, te, "b");
        if (!A || !B) continue;
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2;
        const d = Math.hypot(mx - e.x, my - e.y);
        if (d < bestD) {
          bestD = d;
          best = te;
        }
      }
      const lengthen = world.resources.sap >= 20;
      spend(world, "sap", COSTS.slack);
      const dir = stepDir(world, action, e);
      const moved = dash(world, e, dir, LIMITS.dash);
      if (lengthen) {
        best.slack += moved;
        say(world, "Slack Bargain gives the thread room.");
      } else {
        best.slack = Math.max(40, best.slack - moved);
        e.rooted = Math.max(e.rooted, 0.2);
        say(world, "Slack Bargain shortens the thread and roots Ellis a moment.");
      }
      e.iframe = LIMITS.iframe;
      emit(world, "slack", { id: best.id, lengthen, moved, slack: best.slack });
      action.consumed = true;
    },
  },

  "sugar-glass": {
    verbs: ["brace"],
    claim(world, verb) {
      return verb === "brace" && livingTethers(world).some((t) => !t.lease);
    },
    apply(world, action) {
      const lines = livingTethers(world).filter((t) => !t.lease && !t.glazed);
      if (!lines.length) {
        say(world, "Sugar Glass: no living thread to glaze.");
        return;
      }
      if (!spend(world, "sap", COSTS.glass)) {
        say(world, "Sugar Glass: not enough sap.");
        return;
      }
      let best = lines[0];
      const e = ellisOf(world);
      let bd = Infinity;
      for (const te of lines) {
        const A = endpoint(world, te, "a");
        const B = endpoint(world, te, "b");
        if (!A || !B) continue;
        const d = Math.hypot((A.x + B.x) / 2 - e.x, (A.y + B.y) / 2 - e.y);
        if (d < bd) {
          bd = d;
          best = te;
        }
      }
      startChannel(world, {
        id: "sugar-glass",
        max: LIMITS.glassChannel,
        earlyRelease: false,
        root: true,
        payload: { tetherId: best.id },
      });
      action.consumed = true;
      say(world, "Sugar Glass is forming. The seam will show before it can break.");
    },
    complete(world, ch) {
      const te = world.tethers.find((t) => t.id === ch.payload.tetherId && t.alive);
      if (!te) {
        say(world, "The thread failed before the glass set. Nothing shatters.");
        emit(world, "glass-lost", {});
        return;
      }
      te.glazed = true;
      te.glazeArm = LIMITS.glassArm;
      emit(world, "glass", { id: te.id });
      say(world, "The thread is glass. The first crossing breaks it.");
    },
    cancel() {
      say(world, "The glaze falls before it sets.");
    },
  },

  tithe: {
    verbs: ["brace"],
    claim(world, verb) {
      return verb === "brace" && world.tithe <= 0;
    },
    apply(world, action) {
      if (!spend(world, "sap", COSTS.tithe)) {
        say(world, "Tithe: not enough sap to swear it.");
        return;
      }
      world.tithe = LIMITS.titheDur;
      action.consumed = true;
      emit(world, "tithe-swear", { duration: LIMITS.titheDur });
      say(world, "Tithe is sworn. A thread Ellis does not cut will pay sap back.");
    },
  },

  "orchard-lease": {
    verbs: ["shot"],
    claim(_w, verb) {
      return verb === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      const stake = world.anchors.find(
        (a) => a.alive && a.anchorKind === "stake" && anchorAccessible(world, e, a, 28),
      );
      if (!stake) {
        say(world, "Orchard Lease: stand at a living stake to fire the lease.");
        emit(world, "lease-refused", { reason: "stake" });
        return;
      }
      if (!spend(world, "sap", COSTS.lease)) {
        say(world, "Orchard Lease: not enough sap.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: 8,
        life: LIMITS.arrowLife,
        kind: "lease",
        abilityId: "orchard-lease",
        stakeId: stake.id,
      });
      action.consumed = true;
      say(world, "Orchard Lease: the shot must hit. It will not chase.");
    },
  },

  "canopy-of-accounts": {
    verbs: ["brace"],
    claim(_w, verb) {
      return verb === "brace";
    },
    apply(world, action) {
      const graph = canopyGraph(world);
      if (!graph.ok) {
        if (spend(world, "sap", 0)) {
          /* no spend */
        }
        say(world, "Canopy of Accounts: the books are not ready.");
        emit(world, "canopy-refused", graph);
        return;
      }
      if (!spend(world, "sap", COSTS.canopy)) {
        say(world, "Canopy of Accounts: not enough sap.");
        return;
      }
      startChannel(world, {
        id: "canopy-of-accounts",
        max: LIMITS.canopyTime,
        earlyRelease: false,
        hold: true,
        root: true,
        payload: {},
      });
      action.consumed = true;
      say(world, "The canopy lifts. Hold — a break now refunds only a part.");
    },
    complete(world) {
      const graph = canopyGraph(world);
      if (!graph.ok) {
        gain(world, "sap", COSTS.canopyRefundWhiff);
        say(world, "The canopy finds the books changed and returns most of the sap.");
        emit(world, "canopy-whiff", {});
        return;
      }
      const paid = new Map();
      for (const te of graph.edges) {
        const A = endpoint(world, te, "a");
        const B = endpoint(world, te, "b");
        for (const target of [A, B]) {
          if (!target || target.kind === "anchor" || !target.alive) continue;
          const n = paid.get(target.id) ?? 0;
          if (n >= 2) continue;
          paid.set(target.id, n + 1);
          const raw = 6 + te.tension * 0.08;
          if (target.boss) {
            dealDamage(world, target, raw * 0.4, {
              kind: "account",
              fromEllis: true,
              ignoreFactor: true,
              allowWreath: false,
            });
          } else {
            dealDamage(world, target, raw, {
              kind: "account",
              fromEllis: true,
              allowWreath: false,
              stagger: 0.2,
            });
          }
        }
        te.tension = 0;
      }
      for (const id of graph.nodes) {
        const a = getActor(world, id);
        if (a && a.wreath) a.wreath = 0;
      }
      emit(world, "canopy", { edges: graph.edges.length });
      say(world, "Canopy of Accounts settles. The threads go slack.");
    },
    cancel(world, _ch, reason) {
      if (reason === "hit") gain(world, "sap", COSTS.canopyRefundHit);
      say(world, "The canopy drops.");
      emit(world, "canopy-cancel", { reason });
    },
  },

  "the-last-sugarhouse": {
    verbs: ["brace"],
    claim(_w, verb) {
      return verb === "brace";
    },
    apply(world, action) {
      const e = ellisOf(world);
      const stakes = world.anchors.filter((a) => a.alive && a.onScreen && a.anchorKind === "stake");
      const here = stakes.find((a) => dist(a, e) < 28 && anchorAccessible(world, e, a, 28));
      if (stakes.length < 2 || !here) {
        say(world, "The Last Sugarhouse needs two stakes, and Ellis at one of them.");
        emit(world, "sugarhouse-refused", { reason: "stakes" });
        return;
      }
      if (world.resources.sap < LIMITS.sugarhouseSap) {
        say(world, "The Last Sugarhouse: the sap is short of fifty.");
        return;
      }
      const rect = footprint(e);
      if (world.seals.some((s) => rectsOverlap(rect, s))) {
        say(world, "The footprint crosses a puzzle seal and will not close.");
        emit(world, "sugarhouse-refused", { reason: "seal" });
        return;
      }
      const others = stakes.filter((a) => a.id !== here.id);
      spend(world, "sap", LIMITS.sugarhouseSap);
      startChannel(world, {
        id: "the-last-sugarhouse",
        max: LIMITS.sugarhouseTime,
        earlyRelease: false,
        hold: true,
        root: true,
        payload: { rect, stakeIds: [here.id, others[0].id] },
      });
      action.consumed = true;
      say(world, "The sugarhouse footprint is drawn. It pulls no one inside.");
    },
    tick(world, ch) {
      const ellis = ellisOf(world);
      for (const id of ch.payload.stakeIds) {
        const stake = world.anchors.find((a) => a.id === id);
        if (!stake || !stake.alive) return "cancel";
      }
      const here = world.anchors.find((a) => a.id === ch.payload.stakeIds[0]);
      if (!anchorAccessible(world, ellis, here, 40)) return "cancel";
      return null;
    },
    complete(world, ch) {
      const rect = ch.payload.rect;
      const dur = world.settings.reducedEffects ? LIMITS.sugarhouseDurReduced : LIMITS.sugarhouseDur;
      const zone = {
        id: `house-${world.nextId++}`,
        kind: "sugarhouse",
        ...rect,
        life: dur,
        alive: true,
      };
      world.zones.push(zone);
      for (const a of world.actors) {
        if (!a.alive || a.team !== "foe") continue;
        if (a.boss) {
          emit(world, "boss-immune", { status: "hard-bind", id: a.id });
          continue;
        }
        if (pointInRect(a.x, a.y, rect)) a.confined = zone.id;
      }
      for (const id of ch.payload.stakeIds) {
        const a = world.anchors.find((x) => x.id === id);
        if (a) a.alive = false;
      }
      emit(world, "sugarhouse", { id: zone.id, w: rect.w, h: rect.h });
      say(world, "The Last Sugarhouse stands. Only those already inside are kept.");
    },
    cancel(world, ch) {
      const back = Math.max(0, LIMITS.sugarhouseSap - COSTS.sugarhouseForfeit);
      gain(world, "sap", back);
      say(world, "The sugarhouse does not rise. Ten sap is forfeit.");
      emit(world, "sugarhouse-cancel", { refund: back });
    },
  },
};

function tryImmediateWreath(world, hit) {
  const t = getActor(world, hit.id);
  if (!t) return;
  const { tryWreath } = lateWreath();
  tryWreath(world, t, hit.clean);
}

function late() {
  return { addAnchor: addAnchorLate };
}
function lateWreath() {
  return { tryWreath: tryWreathLate };
}

import { addAnchor as addAnchorLate, tryWreath as tryWreathLate, shedWreath } from "./state.js";

function stepDir(world, action, e) {
  if (action.dirX != null || action.dirY != null) return norm(action.dirX ?? 0, action.dirY ?? 0);
  const k = world.input?.keys;
  if (k && k.size) {
    let x = 0;
    let y = 0;
    if (k.has("KeyA") || k.has("ArrowLeft")) x -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) x += 1;
    if (k.has("KeyW") || k.has("ArrowUp")) y -= 1;
    if (k.has("KeyS") || k.has("ArrowDown")) y += 1;
    if (x || y) return norm(x, y);
  }
  return faceVec(e);
}

export function dash(world, e, dir, distWant) {
  if (!dir.x && !dir.y) return 0;
  const steps = 8;
  const slice = distWant / steps;
  let moved = 0;
  for (let i = 0; i < steps; i++) {
    const beforeX = e.x;
    const beforeY = e.y;
    const { moveBody } = dashMove();
    moveBody(world, e, dir.x * slice, dir.y * slice);
    const bit = Math.hypot(e.x - beforeX, e.y - beforeY);
    moved += bit;
    if (bit < slice * 0.4) break;
  }
  return moved;
}

function dashMove() {
  return { moveBody: moveBodyLate };
}
import { moveBody as moveBodyLate } from "./geometry.js";

function footprint(e) {
  const f = faceVec(e);
  const cardX = Math.abs(f.x) >= Math.abs(f.y);
  if (cardX) {
    const sign = f.x >= 0 ? 1 : -1;
    const w = 180;
    const h = 120;
    return {
      x: sign > 0 ? e.x : e.x - w,
      y: e.y - h / 2,
      w,
      h,
    };
  }
  const sign = f.y >= 0 ? 1 : -1;
  const w = 120;
  const h = 180;
  return {
    x: e.x - w / 2,
    y: sign > 0 ? e.y : e.y - h,
    w,
    h,
  };
}

function canopyGraph(world) {
  const edges = livingTethers(world).filter((t) => !t.lease);
  const nodes = new Set();
  for (const te of edges) {
    if (te.aKind === "actor") nodes.add(te.aId);
    if (te.bKind === "actor") nodes.add(te.bId);
  }
  let wreath = 0;
  for (const id of nodes) {
    const a = getActor(world, id);
    if (a) wreath += a.wreath ?? 0;
  }
  const ok = edges.length >= 3 && wreath >= 4;
  return { ok, edges, nodes: [...nodes], wreath };
}

export function onLeaseHit(world, proj, actor) {
  const stake = world.anchors.find((a) => a.id === proj.stakeId && a.alive);
  if (!stake) {
    say(world, "The stake is gone. The lease fails.");
    emit(world, "lease-refused", { reason: "stake-dead" });
    return;
  }
  if (!actor.onScreen) return;
  const block = lineBlockedLate(world, stake, actor);
  if (block) {
    say(world, "Orchard Lease cannot cross that line.");
    emit(world, "lease-refused", { reason: block });
    return;
  }
  linkActors(world, stake, actor, {
    lease: true,
    slack: 180,
    maxAge: LIMITS.leaseDuration,
    tension: 10,
    abilityId: "orchard-lease",
  });
}

function lineBlockedLate(world, a, b) {
  return importLine(world, a, b);
}
import { lineBlocked as importLine } from "./geometry.js";

export function sugarPassivesReady() {
  SUGAR["wreath-of-debts"].passive = (world, action) => {
    if (action.verb === "step") {
      shedWreath(world);
      return;
    }
    for (const hit of action.hits ?? []) {
      if (!hit.immediate) continue;
      tryWreathLate(world, getActor(world, hit.id), hit.clean);
    }
  };
}
sugarPassivesReady();
registerHitHook("lease", onLeaseHit);
