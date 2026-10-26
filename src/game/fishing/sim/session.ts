import { GEAR_BY_ID } from "../data/gear.ts";
import { LOCATIONS_BY_ID } from "../data/locations.ts";
import { SPECIES_BY_ID } from "../data/species.ts";
import { createBite, currentBeat, stepBite, tellSentence } from "./bite.ts";
import { cancelCast, castLanding, idleCast, releaseCast, startCharge, tickCharge, tryCancelFlight, FLIGHT_SECONDS } from "./cast.ts";
import { emptySave, markRead, resolveCatch, swapKeep } from "./catch.ts";
import { createFight, isHotState, stepFight } from "./fight.ts";
import { pickSpecies, rankSpecies, spotAt } from "./fit.ts";
import { clamp, lerp } from "./num.ts";
import { rngNext } from "./rng.ts";
import type { Actions, PresentState, Session } from "./types.ts";

const FIXED = 1 / 60;

export function emptyPresent(): PresentState {
  return { interest: 0, speciesId: null, elapsed: 0, hint: "", missedSpot: false };
}

export function createSession(seed = (Date.now() ^ 0x9e3779b9) >>> 0): Session {
  const safeSeed = seed >>> 0 || 1;
  return {
    version: 1,
    seed: safeSeed,
    rng: safeSeed,
    phase: "title",
    paused: false,
    pauseReason: null,
    hour: 15,
    locationId: "town-hole",
    spotId: null,
    gearId: "willow-worm",
    wideTiming: true,
    reducedMotion: false,
    aimX: 0.36,
    aimY: 0.58,
    anglerX: 0.36,
    giveLatched: false,
    cast: idleCast(),
    present: emptyPresent(),
    bite: null,
    fight: null,
    pending: null,
    line: "The creek is optional.",
    save: emptySave(),
    acc: 0,
    seq: 0,
    castsLanded: 0,
    dirty: false,
    suppressCast: false,
  };
}

export function chooseLocation(session: Session, locationId: string): void {
  const loc = LOCATIONS_BY_ID[locationId];
  if (!loc) return;
  const sweet = loc.spots.find((spot) => spot.sweet) ?? loc.spots[0];
  session.locationId = loc.id;
  session.hour = loc.hour;
  session.spotId = null;
  session.phase = "read";
  session.aimX = sweet?.x ?? 0.5;
  session.aimY = sweet?.y ?? 0.5;
  session.anglerX = session.aimX;
  session.cast = idleCast();
  session.present = emptyPresent();
  session.bite = null;
  session.fight = null;
  session.pending = null;
  session.line = loc.blurb;
  session.dirty = true;
}

export function chooseSpot(session: Session, spotId: string): void {
  const loc = LOCATIONS_BY_ID[session.locationId];
  const spot = loc?.spots.find((item) => item.id === spotId);
  if (!loc || !spot) return;
  session.spotId = spot.id;
  session.aimX = spot.x;
  session.aimY = spot.y;
  session.anglerX = spot.x;
  session.phase = "aiming";
  session.cast = idleCast();
  session.line = spot.read;
  if (spot.sweet) session.save = markRead(session.save, `${loc.id}:${spot.id}`);
  session.dirty = true;
}

export function beginTownHole(session: Session): void {
  session.locationId = "town-hole";
  session.gearId = "willow-worm";
  session.hour = 15;
  session.paused = false;
  session.pauseReason = null;
  chooseSpot(session, "rope-shade");
  session.line = "Willow pole, worm, shade under the rope tree. Hold to cast.";
}

export function openWaters(session: Session): void {
  session.phase = "waters";
  session.line = "Choose a water. Five outfits, no treasure hunt.";
  session.dirty = true;
}

export function chooseGear(session: Session, gearId: string): void {
  if (!GEAR_BY_ID[gearId]) return;
  if (session.phase === "fight" || session.phase === "bite" || session.phase === "flight") return;
  session.gearId = gearId;
  session.dirty = true;
}

export function chooseHour(session: Session, hour: number): void {
  if (session.phase === "fight" || session.phase === "bite") return;
  session.hour = ((hour % 24) + 24) % 24;
  session.dirty = true;
}

export function castAgain(session: Session): void {
  session.phase = "aiming";
  session.bite = null;
  session.fight = null;
  session.pending = null;
  session.present = emptyPresent();
  session.cast = idleCast();
  session.giveLatched = false;
  session.paused = false;
  session.pauseReason = null;
  session.line = "Same water. Hold to cast.";
  session.dirty = true;
}

export function applyFocusLoss(session: Session): void {
  session.paused = true;
  session.pauseReason = "focus";
  session.dirty = true;
  if (session.phase === "charging") {
    cancelCast(session.cast, "focus");
    session.phase = "aiming";
    session.suppressCast = true;
    session.line = "The cast stopped when you looked away.";
  } else if (session.phase === "flight" && tryCancelFlight(session.cast, "focus")) {
    session.phase = "aiming";
    session.suppressCast = true;
    session.line = "You checked the cast before it landed.";
  }
}

export function resumeSession(session: Session): void {
  session.paused = false;
  session.pauseReason = null;
}

export function debugHook(session: Session, speciesId: string): void {
  const species = SPECIES_BY_ID[speciesId];
  const loc = LOCATIONS_BY_ID[session.locationId];
  const gear = GEAR_BY_ID[session.gearId];
  if (!species || !loc || !gear) return;
  const spot = loc.spots.find((item) => item.id === session.spotId) ?? loc.spots[0];
  session.spotId = spot?.id ?? null;
  session.seq += 1;
  session.pending = {
    id: `c-${session.seed}-${session.seq}`,
    speciesId: species.id,
    locationId: loc.id,
    spotId: spot?.id ?? "",
    gearId: gear.id,
    lengthCm: species.lengthCm[0],
    meal: species.meal,
    portions: species.portions,
    status: "pending",
  };
  const made = createFight(species, gear, session.pending.id, session.rng, spot?.coverSide ?? 0);
  session.rng = made.rng;
  session.fight = made.fight;
  session.bite = null;
  session.phase = "fight";
  session.giveLatched = false;
  session.paused = false;
  session.line = `${species.commonName} is on.`;
  session.dirty = true;
}

export function debugLand(session: Session, speciesId: string): void {
  debugHook(session, speciesId);
  if (session.fight) session.fight.outcome = "landed";
  session.phase = "landed";
  session.line = "In the net.";
}

export function keepFish(session: Session) {
  if (session.pending && session.save.resolvedIds.includes(session.pending.id)) {
    return { ok: false as const, save: session.save, reason: "duplicate" as const };
  }
  if (session.phase !== "landed" || !session.pending) {
    return { ok: false as const, save: session.save, reason: "not-pending" as const };
  }
  const result = resolveCatch(session.save, session.pending, "keep");
  if (!result.ok) return result;
  session.save = result.save;
  session.pending = { ...session.pending, status: "kept" };
  session.phase = "resolved";
  session.line = `Kept. ${session.pending.meal}.`;
  session.dirty = true;
  return result;
}

export function releaseFish(session: Session) {
  if (session.phase !== "landed" || !session.pending) {
    return { ok: false as const, save: session.save, reason: "not-pending" as const };
  }
  const result = resolveCatch(session.save, session.pending, "release");
  if (!result.ok) return result;
  session.save = result.save;
  session.pending = { ...session.pending, status: "released" };
  session.phase = "resolved";
  session.line = "Back it goes.";
  session.dirty = true;
  return result;
}

export function swapFish(session: Session, discardId: string) {
  if (session.phase !== "landed" || !session.pending) {
    return { ok: false as const, save: session.save, reason: "not-pending" as const };
  }
  const result = swapKeep(session.save, discardId, session.pending);
  if (!result.ok) return result;
  session.save = result.save;
  session.pending = { ...session.pending, status: "kept" };
  session.phase = "resolved";
  session.line = `Set one back. Kept ${session.pending.meal}.`;
  session.dirty = true;
  return result;
}

function loseFish(session: Session, line: string): void {
  if (session.pending && !session.save.resolvedIds.includes(session.pending.id)) {
    const result = resolveCatch(session.save, session.pending, "lost");
    if (result.ok) session.save = result.save;
    session.pending = { ...session.pending, status: "lost" };
  }
  session.phase = "resolved";
  session.line = line;
  session.dirty = true;
}

export function stepSession(session: Session, dt: number, actions: Actions): void {
  if (!(dt > 0) || !Number.isFinite(dt) || session.paused) return;
  session.acc += Math.min(1.5, dt);
  let edges = actions;
  let guard = 0;
  while (session.acc >= FIXED && guard < 100) {
    session.acc -= FIXED;
    stepFixed(session, FIXED, edges);
    edges = { ...edges, cancel: false, giveToggle: false, confirm: false };
    guard += 1;
  }
}

function nudgeAim(session: Session, actions: Actions, dt: number, speed: number, walk: boolean): void {
  session.aimX = clamp(session.aimX + actions.ax * speed * dt, 0.08, 0.92);
  session.aimY = clamp(session.aimY + actions.ay * speed * dt, 0.16, 0.74);
  if (walk) session.anglerX = session.aimX;
}

function stepFixed(session: Session, dt: number, actions: Actions): void {
  if (session.phase === "read" || session.phase === "aiming" || session.phase === "charging") {
    nudgeAim(session, actions, dt, 0.55, true);
  } else if (session.phase === "present") {
    nudgeAim(session, actions, dt, 0.16, false);
  }

  if (actions.giveToggle && session.phase === "fight") session.giveLatched = !session.giveLatched;

  if (!actions.castHeld) session.suppressCast = false;

  if (session.phase === "aiming" && actions.castHeld && !session.suppressCast) {
    startCharge(session.cast);
    session.phase = "charging";
    session.line = "Hold until the arc reaches the water you want.";
  }

  if (session.phase === "charging") {
    if (actions.cancel) {
      cancelCast(session.cast, "player");
      session.phase = "aiming";
      session.suppressCast = true;
      session.line = "Cast cancelled.";
      session.dirty = true;
      return;
    }
    if (!actions.castHeld) {
      const released = releaseCast(session.cast);
      if (released === "short") {
        session.phase = "aiming";
        session.line = "That was not a cast. Hold a little longer.";
      } else {
        session.phase = "flight";
        session.line = "The line is in the air.";
      }
      return;
    }
    tickCharge(session.cast, dt);
    return;
  }

  if (session.phase === "flight") {
    if (actions.cancel && tryCancelFlight(session.cast, "player")) {
      session.phase = "aiming";
      session.suppressCast = true;
      session.line = "You checked the cast.";
      session.dirty = true;
      return;
    }
    session.cast.flight += dt / FLIGHT_SECONDS;
    if (session.cast.flight >= 1) settleCast(session);
    return;
  }

  if (session.phase === "present") {
    stepPresent(session, dt);
    return;
  }

  if (session.phase === "bite" && session.bite) {
    const before = session.bite.index;
    session.bite = stepBite(session.bite, dt, actions.hookHeld);
    const beat = currentBeat(session.bite);
    if (session.bite.outcome === "pending" && beat?.commit && before !== session.bite.index) {
      session.line = "Set. Hold through the mark.";
    }
    if (session.bite.outcome === "hooked") hookup(session);
    else if (session.bite.outcome === "early") {
      session.phase = "present";
      session.present.interest = 0.2;
      session.present.elapsed = 0;
      session.bite = null;
      session.line = "Too soon. That fish will not forgive a twitch.";
    } else if (session.bite.outcome === "miss") {
      session.phase = "present";
      session.present.interest = 0.35;
      session.present.elapsed = 0;
      session.bite = null;
      session.line = "The tell passed. Stay with the next one.";
    }
    return;
  }

  if (session.phase === "fight" && session.fight && session.fight.outcome === "fighting") {
    const species = SPECIES_BY_ID[session.fight.speciesId];
    const gear = GEAR_BY_ID[session.gearId];
    if (!species || !gear) return;
    if (Math.abs(actions.ax) > 0.05) {
      session.fight.rod = clamp(session.fight.rod + Math.sign(actions.ax) * dt * 3.4, -1, 1);
    }
    const outcome = stepFight(
      session.fight,
      species,
      gear,
      { pressure: actions.pressureHeld, give: session.giveLatched, rod: session.fight.rod },
      dt,
    );
    const state = session.fight.script[session.fight.index]?.state;
    if (outcome === "fighting" && state) {
      session.line = isHotState(state)
        ? "Ease. Give line until the rod softens."
        : "Pressure. Bring it in while it is quiet.";
    }
    if (outcome === "landed") {
      session.phase = "landed";
      session.line = `${species.commonName} in the net. Keep it, or put it back.`;
      session.dirty = true;
    } else if (outcome === "snap") loseFish(session, "The line went. The fish kept the day.");
    else if (outcome === "spit") loseFish(session, "It threw the hook.");
    else if (outcome === "cover") loseFish(session, "It took the cover, and the line with it.");
  }
}

function settleCast(session: Session): void {
  const gear = GEAR_BY_ID[session.gearId];
  const loc = LOCATIONS_BY_ID[session.locationId];
  if (!gear || !loc) return;
  const land = castLanding(session.anglerX, session.aimX, session.aimY, session.cast.power, gear.castRange);
  session.cast.landX = land.x;
  session.cast.landY = land.y;
  session.cast.short = land.short;
  session.cast.phase = "settled";
  session.cast.flight = 1;
  session.castsLanded += 1;
  session.phase = "present";
  session.present = emptyPresent();
  const hit = spotAt(loc, land.x, land.y);
  session.present.missedSpot = !hit;
  if (hit) session.spotId = hit.id;
  session.line = !hit ? "Short of any seam. Lift and try the dark water." : land.short ? "A bit short, but it is in the seam." : "The line is on the water.";
  session.dirty = true;
}

function stepPresent(session: Session, dt: number): void {
  const loc = LOCATIONS_BY_ID[session.locationId];
  const gear = GEAR_BY_ID[session.gearId];
  const spot = loc?.spots.find((item) => item.id === session.spotId) ?? null;
  session.present.elapsed += dt;
  if (!loc || !gear || !spot || session.present.missedSpot) {
    session.present.interest = Math.max(0, session.present.interest - dt * 0.08);
    if (session.present.elapsed > 2.5) session.present.hint = "Nothing under the line. Aim for a marked seam.";
    return;
  }
  const ranked = rankSpecies(loc, spot, gear, session.hour);
  const top = ranked[0];
  if (!top || top.score < 0.35) {
    session.present.interest = Math.max(0, session.present.interest - dt * 0.05);
    if (session.present.elapsed > 4) session.present.hint = "This outfit is wrong for the seam, or the hour is.";
    return;
  }
  session.present.hint = "";
  const rate = 0.16 + top.score * 0.2;
  session.present.interest = Math.min(1, session.present.interest + rate * dt);
  if (session.present.interest < 1 || session.present.elapsed < 1.15) return;
  const roll = rngNext(session.rng);
  session.rng = roll.state;
  const speciesId = pickSpecies(ranked, roll.value);
  const species = speciesId ? SPECIES_BY_ID[speciesId] : undefined;
  if (!species) return;
  session.present.speciesId = species.id;
  session.bite = createBite(species, session.wideTiming);
  session.phase = "bite";
  session.line = `A tell. ${tellSentence(session.bite.beats)}.`;
  session.dirty = true;
}

function hookup(session: Session): void {
  const speciesId = session.bite?.speciesId ?? session.present.speciesId;
  const species = speciesId ? SPECIES_BY_ID[speciesId] : undefined;
  const loc = LOCATIONS_BY_ID[session.locationId];
  const gear = GEAR_BY_ID[session.gearId];
  const spot = loc?.spots.find((item) => item.id === session.spotId);
  if (!species || !loc || !gear) return;
  const lengthRoll = rngNext(session.rng);
  session.rng = lengthRoll.state;
  session.seq += 1;
  const lengthCm = Math.round(lerp(species.lengthCm[0], species.lengthCm[1], lengthRoll.value));
  session.pending = {
    id: `c-${session.seed}-${session.seq}`,
    speciesId: species.id,
    locationId: loc.id,
    spotId: spot?.id ?? "",
    gearId: gear.id,
    lengthCm,
    meal: species.meal,
    portions: species.portions,
    status: "pending",
  };
  const made = createFight(species, gear, session.pending.id, session.rng, spot?.coverSide ?? 0);
  session.rng = made.rng;
  session.fight = made.fight;
  session.bite = null;
  session.giveLatched = false;
  session.phase = "fight";
  const opening = session.fight.script[0]?.state;
  session.line = isHotState(opening ?? "steady")
    ? `${species.commonName}. Ease the first run.`
    : `${species.commonName}. Pressure while it is quiet.`;
  session.dirty = true;
}

export function liftLine(session: Session): void {
  if (session.phase !== "present" && session.phase !== "bite") return;
  session.phase = "aiming";
  session.bite = null;
  session.present = emptyPresent();
  session.cast = idleCast();
  session.line = "Line lifted. The water is still there.";
  session.dirty = true;
}
