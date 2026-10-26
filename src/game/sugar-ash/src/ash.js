// @ts-nocheck
import { COSTS, LIMITS, chainMaxOf, isReduced } from "./constants.js";
import { dist, norm, rot } from "./geometry.js";
import { dash } from "./sugar.js";
import {
  aimEllis,
  applyStatus,
  bloomBlossom,
  dealDamage,
  ellisOf,
  emit,
  faceVec,
  foesInArc,
  gain,
  isClean,
  plantBlossom,
  plantMark,
  registerHitHook,
  say,
  snuffBlossom,
  spawnProjectile,
  spend,
  startChannel,
} from "./state.js";

function marksAlongFuture() {
  /* path test happens on the projectile */
}

export const ASH = {
  "orchard-of-embers": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      if (!spend(world, "ember", COSTS.orchard)) {
        say(world, "Orchard of Embers: not enough ember — the shot stays plain.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: LIMITS.arrowDamage * 0.7,
        life: LIMITS.arrowLife,
        kind: "arrow",
        abilityId: "orchard-of-embers",
        plants: "blossom",
        plantOnActor: true,
        refundSeal: COSTS.orchard,
        wreath: world.attune.sugar === "wreath-of-debts",
        clean: true,
      });
      action.consumed = true;
      say(world, "The shot will root a blossom where it ends. It will not follow a body.");
    },
  },

  "handful-of-cinders": {
    verbs: ["strike"],
    claim(world, verb) {
      return verb === "strike" && foesInArc(world).length > 0;
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      const foes = foesInArc(world);
      if (!foes.length) return;
      if (!spend(world, "ember", COSTS.handful)) {
        say(world, "Handful of Cinders: not enough ember — the strike stays a strike.");
        return;
      }
      const t = foes[0];
      const res = dealDamage(world, t, LIMITS.meleeDamage * 0.3, {
        fromEllis: true,
        clean: isClean(world, t),
        kind: "strike",
      });
      action.hits = [{ id: t.id, clean: isClean(world, t), immediate: true, amount: res.amount }];
      const angles = isReduced(world) ? LIMITS.fanAnglesReduced : LIMITS.fanAngles;
      const f = faceVec(e);
      let made = 0;
      for (const deg of angles) {
        const v = rot(f.x * LIMITS.fanSpeed, f.y * LIMITS.fanSpeed, deg);
        const p = spawnProjectile(world, {
          x: e.x + f.x * 12,
          y: e.y + f.y * 12,
          vx: v.x,
          vy: v.y,
          damage: LIMITS.fanDamage,
          life: LIMITS.fanLife,
          kind: "cinder",
          abilityId: "handful-of-cinders",
          r: 3,
        });
        if (p) made += 1;
      }
      emit(world, "handful", { made, asked: angles.length });
      say(world, `Handful of Cinders throws ${made} straight cinders along the aim.`);
      action.consumed = true;
    },
  },

  "last-arrow-first": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      prepareOrLoose(world, action, false);
    },
  },

  "kiln-bloom": {
    verbs: ["brace"],
    claim(_w, v) {
      return v === "brace";
    },
    apply(world, action) {
      const chosen = kilnChoice(world);
      if (chosen.length < 3) {
        say(world, "Kiln Bloom: the kiln is cold — fewer than three armed marks in the wedge.");
        emit(world, "kiln-cold", { n: chosen.length });
        return;
      }
      if (!spend(world, "ember", COSTS.kiln)) {
        say(world, "Kiln Bloom: not enough ember.");
        return;
      }
      startChannel(world, {
        id: "kiln-bloom",
        max: LIMITS.kilnTime,
        earlyRelease: false,
        hold: true,
        root: true,
        payload: { ids: chosen.map((b) => b.id) },
      });
      action.consumed = true;
      say(world, "Kiln Bloom draws the corridor. The marks are the shape.");
    },
    complete(world, ch) {
      const blossoms = ch.payload.ids
        .map((id) => world.blossoms.find((b) => b.id === id && b.alive && b.armed))
        .filter(Boolean);
      if (blossoms.length < 3) {
        gain(world, "ember", COSTS.kiln);
        say(world, "Kiln Bloom lost its marks and returns the ember.");
        emit(world, "kiln-cold", { n: blossoms.length });
        return;
      }
      const e = ellisOf(world);
      const f = faceVec(e);
      const corridor = corridorOf(e, f, blossoms, isReduced(world));
      const cut = cutCorridorAtSeal(world, e, f, corridor.length);
      for (const b of blossoms) snuffBlossom(world, b, "kiln");
      let hit = 0;
      for (const a of world.actors) {
        if (!a.alive || a.team !== "foe") continue;
        const relx = a.x - e.x;
        const rely = a.y - e.y;
        const along = relx * f.x + rely * f.y;
        const perp = Math.abs(relx * f.y - rely * f.x);
        if (along < 0 || along > cut || perp > corridor.half) continue;
        dealDamage(world, a, 16, {
          kind: "kiln",
          fromEllis: true,
          allowWreath: true,
          stagger: a.boss ? 0 : 0.2,
        });
        hit += 1;
      }
      emit(world, "kiln", { hit, length: cut, half: corridor.half });
      say(world, "Kiln Bloom spends the marks on one shaped blast.");
      world._lastCorridor = { ...corridor, length: cut };
    },
    cancel(world) {
      gain(world, "ember", COSTS.kiln * 0.5);
      say(world, "Kiln Bloom breaks. The marks remain. Half the ember returns.");
      emit(world, "kiln-cancel", { refund: COSTS.kiln * 0.5 });
    },
  },

  "cinder-letter": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      if (!spend(world, "ember", COSTS.letter)) {
        say(world, "Cinder Letter: not enough ember.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: LIMITS.arrowDamage * 0.8,
        life: LIMITS.arrowLife,
        kind: "letter",
        abilityId: "cinder-letter",
        plants: "letter",
        refundSeal: COSTS.letter,
      });
      action.consumed = true;
      say(world, "Cinder Letter writes on ground or stone, never on a body.");
    },
  },

  "bank-the-coals": {
    verbs: ["strike"],
    claim(world, verb) {
      if (verb !== "strike") return false;
      return nearestCoal(world) != null;
    },
    apply(world, action) {
      const coal = nearestCoal(world);
      if (!coal) return;
      if (!spend(world, "ember", COSTS.bank)) {
        say(world, "Bank the Coals: not enough ember.");
        return;
      }
      coal.obj.banked = !coal.obj.banked;
      emit(world, "bank", { id: coal.obj.id, banked: coal.obj.banked, kind: coal.kind });
      say(
        world,
        coal.obj.banked
          ? "Banked. The timer holds until you strike it again."
          : "The coal is unbound and runs again.",
      );
      action.consumed = true;
    },
  },

  "ash-step": {
    verbs: ["step"],
    claim(_w, v) {
      return v === "step";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      const promote = !!action.promote;
      const cost = promote ? COSTS.ashStepPromote : COSTS.ashStep;
      const incidentalOk = !isReduced(world);
      if (!promote && !incidentalOk) {
        say(world, "Reduced effects: a step leaves no incidental cinder.");
        return;
      }
      if (world.resources.ember < cost) {
        say(world, "Ash Step: not enough ember — the step is only a step.");
        return;
      }
      const fromX = e.x;
      const fromY = e.y;
      spend(world, "ember", cost);
      const dir = norm(action.dirX ?? faceVec(e).x, action.dirY ?? faceVec(e).y);
      dash(world, e, dir, LIMITS.dash);
      e.iframe = LIMITS.iframe;
      plantBlossom(world, {
        x: fromX,
        y: fromY,
        deliberate: promote,
        r: promote ? 28 : 18,
        armTime: promote ? LIMITS.blossomArm : 1.2,
        life: promote ? LIMITS.blossomLife : 3,
        refund: 0,
      });
      emit(world, "ash-step", { promote, x: fromX, y: fromY });
      say(world, promote ? "The step promotes a deliberate blossom." : "A small cinder stays where Ellis was.");
      action.consumed = true;
    },
  },

  "split-the-billet": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      if (!spend(world, "ember", COSTS.split)) {
        say(world, "Split the Billet: not enough ember.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: 9,
        life: 0.7,
        kind: "split",
        abilityId: "split-the-billet",
      });
      action.consumed = true;
      say(world, "Split the Billet forks only off stone or wood, at a fixed angle.");
    },
  },

  "lantern-debt": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      if (!spend(world, "ember", COSTS.lantern)) {
        say(world, "Lantern Debt: not enough ember.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: LIMITS.arrowDamage * 0.6,
        life: LIMITS.arrowLife,
        kind: "lantern",
        abilityId: "lantern-debt",
        clean: true,
        wreath: world.attune.sugar === "wreath-of-debts",
      });
      action.consumed = true;
      say(world, "Lantern Debt paints a body. It does not hunt the next one.");
    },
  },

  quench: {
    verbs: ["brace"],
    claim(world, verb) {
      return verb === "brace" && world.quenchCd <= 0;
    },
    apply(world, action) {
      const e = ellisOf(world);
      let n = 0;
      let gained = 0;
      for (const b of [...world.blossoms]) {
        if (!b.alive) continue;
        if (dist(b, e) > LIMITS.quenchRadius) continue;
        snuffBlossom(world, b, "quench");
        n += 1;
        if (gained < 10) {
          gain(world, "ember", 2);
          gained += 2;
        }
      }
      for (const m of [...world.marks]) {
        if (!m.alive) continue;
        if (dist(m, e) > LIMITS.quenchRadius) continue;
        m.alive = false;
        n += 1;
        if (gained < 10) {
          gain(world, "ember", 2);
          gained += 2;
        }
      }
      e.shield = true;
      world.quenchCd = LIMITS.quenchCd;
      action.consumed = true;
      emit(world, "quench", { n, gained });
      say(world, n ? `Quench smothers ${n} and raises a thin shield.` : "Quench finds nothing, but the shield still rises.");
    },
  },

  "fourteen-winters": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      prepareOrLoose(world, action, true);
    },
  },

  "soot-covenant": {
    verbs: ["shot"],
    claim(_w, v) {
      return v === "shot";
    },
    apply(world, action) {
      const e = aimEllis(world, action);
      if (!spend(world, "ember", COSTS.soot)) {
        say(world, "Soot Covenant: not enough ember.");
        return;
      }
      const f = faceVec(e);
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * LIMITS.arrowSpeed,
        vy: f.y * LIMITS.arrowSpeed,
        damage: LIMITS.arrowDamage * 0.5,
        life: LIMITS.arrowLife,
        kind: "soot",
        abilityId: "soot-covenant",
      });
      action.consumed = true;
      say(world, "Soot Covenant marks one body as a bank, not a fuse.");
    },
  },
};

function nearestCoal(world) {
  const e = ellisOf(world);
  if (!e) return null;
  let best = null;
  let bd = 36;
  for (const b of world.blossoms) {
    if (!b.alive) continue;
    const d = dist(b, e);
    if (d < bd) {
      bd = d;
      best = { obj: b, kind: "blossom" };
    }
  }
  for (const m of world.marks) {
    if (!m.alive) continue;
    const d = dist(m, e);
    if (d < bd) {
      bd = d;
      best = { obj: m, kind: "mark" };
    }
  }
  return best;
}

function qualifying(world) {
  const armed = world.blossoms.filter((b) => b.alive && b.armed && b.deliberate);
  return world.marks.filter((m) => m.alive).length + armed.length;
}

function prepareOrLoose(world, action, winters) {
  const e = aimEllis(world, action);
  if (!world.prepared) {
    if (!spend(world, "ember", COSTS.lastArrow)) {
      say(world, "Not enough ember to nock the first arrow.");
      return;
    }
    world.prepared = { at: world.time, readyAt: world.time + LIMITS.prepareDelay, winters };
    action.consumed = true;
    emit(world, "nock", { readyAt: world.prepared.readyAt });
    say(world, "The first arrow is nocked. Loose it through a mark you already placed.");
    return;
  }
  if (world.time < world.prepared.readyAt) {
    say(world, "The first arrow is still settling on the string.");
    action.consumed = true;
    return;
  }
  const f = faceVec(e);
  const charged = !!action.charged;
  const useWinter = winters && charged && world.markCounter >= 14;
  if (winters && charged && world.markCounter < 14) {
    say(world, "Fourteen winters have not been marked. The arrow flies as itself.");
  }
  if (useWinter) {
    if (!spend(world, "ember", COSTS.winters)) {
      say(world, "Fourteen Winters: not enough ember. The nocked arrow flies instead.");
    } else {
      const cap = isReduced(world) ? LIMITS.wintersPierceReduced : 8;
      spawnProjectile(world, {
        x: e.x + f.x * 16,
        y: e.y + f.y * 16,
        vx: f.x * 360,
        vy: f.y * 360,
        damage: 18,
        life: 1.1,
        kind: "winter",
        abilityId: "fourteen-winters",
        pierceLeft: cap,
        falloff: 1,
        minFalloff: isReduced(world) ? 0.25 : 0.4,
        winters: true,
        r: 5,
      });
      world.markCounter = 0;
      world.prepared = null;
      action.consumed = true;
      emit(world, "winters", { cap });
      say(world, "Fourteen Winters: one arrow, no seekers, only the line you drew.");
      return;
    }
  }
  spawnProjectile(world, {
    x: e.x + f.x * 16,
    y: e.y + f.y * 16,
    vx: f.x * LIMITS.arrowSpeed,
    vy: f.y * LIMITS.arrowSpeed,
    damage: 14,
    life: LIMITS.arrowLife,
    kind: "prepared",
    abilityId: "last-arrow-first",
    wreath: world.attune.sugar === "wreath-of-debts",
    clean: true,
  });
  world.prepared = null;
  action.consumed = true;
  emit(world, "last-arrow", { marks: qualifying(world) });
  say(world, "Last Arrow First. The bonus exists only if this line crosses an earlier mark.");
}

function kilnChoice(world) {
  const e = ellisOf(world);
  const f = faceVec(e);
  const maxTake = isReduced(world) ? 3 : 5;
  const list = [];
  for (const b of world.blossoms) {
    if (!b.alive || !b.armed || !b.deliberate || b.banked) continue;
    const relx = b.x - e.x;
    const rely = b.y - e.y;
    const along = relx * f.x + rely * f.y;
    const perp = Math.abs(relx * f.y - rely * f.x);
    if (along < 12 || along > 280) continue;
    const ang = Math.atan2(perp, along);
    if (ang > (70 * Math.PI) / 180) continue;
    list.push({ b, along });
  }
  list.sort((a, b) => a.along - b.along);
  return list.slice(0, maxTake).map((x) => x.b);
}

function corridorOf(e, f, blossoms, reduced) {
  let far = 40;
  let half = reduced ? 26 : 34;
  for (const b of blossoms) {
    const relx = b.x - e.x;
    const rely = b.y - e.y;
    const along = relx * f.x + rely * f.y;
    const perp = Math.abs(relx * f.y - rely * f.x);
    far = Math.max(far, along + 18);
    half = Math.max(half, perp);
  }
  half = Math.min(reduced ? 46 : 78, half);
  return { length: far, half, ox: e.x, oy: e.y, fx: f.x, fy: f.y };
}

function cutCorridorAtSeal(world, e, f, length) {
  let cut = length;
  const x2 = e.x + f.x * length;
  const y2 = e.y + f.y * length;
  for (const s of world.seals) {
    if (!segmentHits(e.x, e.y, x2, y2, s)) continue;
    // step back to just before the seal by sampling
    for (let t = 0; t <= length; t += 4) {
      const x = e.x + f.x * t;
      const y = e.y + f.y * t;
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
        cut = Math.min(cut, Math.max(0, t - 4));
        break;
      }
    }
  }
  return cut;
}

function segmentHits(x1, y1, x2, y2, rect) {
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return true;
  }
  return false;
}

registerHitHook("lantern", (world, _p, actor) => {
  if (!actor.onScreen) return;
  const remaining = actor.boss ? 1.5 : 3.5;
  applyStatus(world, actor, { id: "lantern", remaining, potency: 1 });
  say(world, `${actor.name} carries a lantern.`);
});

registerHitHook("soot", (world, _p, actor) => {
  if (!actor.onScreen) return;
  const remaining = actor.boss ? 3 : 5;
  applyStatus(world, actor, { id: "soot", remaining, potency: 1 }, { noEcho: true });
  say(world, `${actor.name} is under soot. Blooms will not chain from them.`);
});

export function armedDeliberate(world) {
  return world.blossoms.filter((b) => b.alive && b.armed && b.deliberate);
}

export { kilnChoice, corridorOf };
