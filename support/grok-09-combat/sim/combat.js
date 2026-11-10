import { REFERENCE_UNITS as U } from "../reference/units.js";
import { forceState } from "./fsm.js";

/**
 * Shared hit resolution. Enemies do not have i-frames.
 * After two connecting hitstun blows, an enemy enters hyperarmor:
 * further blows glance and do not extend hitstun. This is the anti-stun-lock law.
 */
export function scaleGodDamage(base, form, family) {
  if (base <= 0) return 0;
  if (form === "god" && (family === "memory" || family === "unrealized")) {
    return Math.max(1, Math.floor(base * U.global_rules.god_damage_multiplier_vs[family]));
  }
  return base;
}

export function scaleIncoming(damage, profile) {
  if (damage <= 0) return 0;
  const mult = profile?.damage_taken_mult ?? 1;
  return Math.max(0, Math.floor(damage * mult));
}

export function applyHit(target, amount, source, world) {
  if (!target.alive || target.spared) return { ignored: true, reason: "gone" };
  if ((target.iframes || 0) > 0) return { ignored: true, reason: "iframes" };

  let damage = amount;
  let hitstun = source?.hitstun ?? 8;
  let glanced = false;
  if ((target.hyperarmor || 0) > 0) {
    glanced = true;
    damage = amount >= 2 ? Math.floor(amount / 2) : 0;
    hitstun = 0;
  }
  if (target.kind === "ellis") damage = scaleIncoming(damage, world.profile);

  target.hp -= damage;
  const result = {
    ignored: false,
    damage,
    glanced,
    attack: source?.attack || null,
    source: source?.id || null,
  };

  if (!glanced && damage > 0 && target.kind === "ellis") {
    target.hitstun = U.ellis.hitstun_frames;
    target.iframes = (target.baseIframes || 0) + (world.profile.iframe_bonus || 0);
  }

  if (!glanced && target.kind === "enemy") {
    if (hitstun > 0 && damage > 0) {
      target.hitstun = hitstun;
      target.poise = (target.poise || 0) + 1;
      target.consecutiveStunHits = (target.consecutiveStunHits || 0) + 1;
    }
    if (
      (target.consecutiveStunHits || 0) >= U.global_rules.hyperarmor_after_hits &&
      target.hp > 0
    ) {
      target.hyperarmor = U.global_rules.hyperarmor_frames;
      target.hitstun = 0;
      target.poise = 0;
      target.consecutiveStunHits = 0;
      if (target.machine) forceState(target.machine, "hyperarmor");
      result.hyperarmor = true;
    }
  }

  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    result.killed = true;
    if (target.machine) forceState(target.machine, "dead");
    if (target.kind === "enemy") {
      target.flags.dead = true;
      const drop = target.def.lifecycle.on_death;
      target.flags.drop = drop?.drop || null;
      if (target.def.lifecycle.on_death?.forfeit)
        target.flags[target.def.lifecycle.on_death.forfeit] = true;
    }
  }

  world.events.push({ t: world.tick, type: "hit", target: target.id, ...result });
  return result;
}

export function bladeDamage(form, family) {
  return scaleGodDamage(U.ellis.blade_tap.damage[form], form, family);
}

export function spinDamage(form, family) {
  return scaleGodDamage(U.ellis.blade_spin.damage[form], form, family);
}
