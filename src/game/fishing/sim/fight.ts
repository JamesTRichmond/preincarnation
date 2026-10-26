import { GEAR_BY_ID } from "../data/gear.ts";
import { SPECIES_BY_ID } from "../data/species.ts";
import { clamp } from "./num.ts";
import { rngNext } from "./rng.ts";
import { HOLD_PRESSURE, SNAP_GRACE, stepTension } from "./tension.ts";
import type { FightBeat, FightOutcome, FightRuntime, FightStateName, FishProfile, Gear } from "./types.ts";

export function isHotState(state: FightStateName): boolean {
  return state === "surge" || state === "jump" || state === "cover";
}

export function buildFightScript(profile: FishProfile, rngState: number): { script: FightBeat[]; rng: number } {
  const beats: FightBeat[] = [];
  const opening: Record<FishProfile["opening"], FightStateName> = {
    burst: "surge",
    weight: "sulk",
    shake: "shake",
    dive: "cover",
  };
  beats.push({ state: opening[profile.opening], dur: 0.85 + profile.burst * 0.9 });
  const rounds = 2 + Math.round(profile.stamina * 2);
  let rng = rngState >>> 0;
  for (let i = 0; i < rounds; i++) {
    if (profile.jump >= 0.55) beats.push({ state: "jump", dur: 0.42 });
    else if (profile.jump >= 0.35) {
      const roll = rngNext(rng);
      rng = roll.state;
      if (roll.value < profile.jump) beats.push({ state: "jump", dur: 0.42 });
    }
    if (profile.cover >= 0.55) beats.push({ state: "cover", dur: 0.8 + profile.cover * 0.35 });
    if (profile.headshake >= 0.55) beats.push({ state: "shake", dur: 0.55 });
    if (profile.sulk >= 0.45) beats.push({ state: "sulk", dur: 0.85 });
    beats.push({
      state: profile.pull >= 0.6 ? "surge" : "steady",
      dur: 0.7 + profile.stamina * 0.35,
    });
  }
  beats.push({ state: "tired", dur: 12 });
  return { script: beats, rng };
}

export function forceFor(profile: FishProfile, state: FightStateName, stateTime: number): number {
  switch (state) {
    case "surge":
      return clamp(profile.pull * 0.92 + 0.08, 0, 1);
    case "steady":
      return clamp(profile.pull * 0.62, 0, 1);
    case "shake":
      return clamp(profile.pull * 0.48 + Math.sin(stateTime * 18) * 0.06 * profile.headshake, 0, 1);
    case "jump":
      return clamp(profile.pull * 0.35, 0, 1);
    case "cover":
      return clamp(profile.pull * 0.7, 0, 1);
    case "sulk":
      return clamp(Math.min(0.28, profile.pull * 0.45), 0, 1);
    case "tired":
      return 0.12;
    default:
      return 0;
  }
}

export function createFight(
  profile: FishProfile,
  gear: Gear,
  catchId: string,
  rngState: number,
  coverSide: -1 | 0 | 1,
): { fight: FightRuntime; rng: number } {
  const built = buildFightScript(profile, rngState);
  const fight: FightRuntime = {
    speciesId: profile.id,
    catchId,
    script: built.script,
    index: 0,
    stateTime: 0,
    elapsed: 0,
    lineOut: 0.46,
    tension: 0.12,
    overSeconds: 0,
    spit: 0,
    coverDanger: 0,
    jumps: built.script[0]?.state === "jump" ? 1 : 0,
    peakTension: 0,
    rod: 0,
    outcome: "fighting",
    coverSide,
  };
  void gear;
  return { fight, rng: built.rng };
}

export interface FightInput {
  pressure: boolean;
  give: boolean;
  rod: number;
}

/**
 * One outcome only. Snap is checked before spit, cover, and landing,
 * so a broken line cannot also become a fish in the net.
 */
export function stepFight(fight: FightRuntime, profile: FishProfile, gear: Gear, input: FightInput, dt: number): FightOutcome {
  if (fight.outcome !== "fighting") return fight.outcome;
  const beat = fight.script[fight.index] ?? fight.script[fight.script.length - 1];
  const state = beat?.state ?? "tired";
  const ff = forceFor(profile, state, fight.stateTime);
  const tension = stepTension({
    tension: fight.tension,
    fishForce: ff,
    pressure: input.pressure ? HOLD_PRESSURE : 0.08,
    giveLine: input.give,
    ceiling: gear.ceiling,
    dt,
    overSeconds: fight.overSeconds,
    grace: SNAP_GRACE,
  });
  fight.tension = tension.tension;
  fight.overSeconds = tension.overSeconds;
  fight.peakTension = Math.max(fight.peakTension, fight.tension);
  fight.rod = clamp(input.rod, -1, 1);

  if (tension.snapped) {
    fight.outcome = "snap";
    return fight.outcome;
  }

  if (state === "jump" && tension.appliedPressure > 0.55) fight.spit += dt * 1.15;
  if (state === "surge" && fight.tension < 0.07) fight.spit += dt * profile.spitSlack;
  if (fight.spit >= 1) {
    fight.outcome = "spit";
    return fight.outcome;
  }

  if (state === "cover" && fight.coverSide !== 0) {
    const pullingAway = Math.sign(fight.rod) === -fight.coverSide && Math.abs(fight.rod) > 0.25;
    const pullingToward = Math.sign(fight.rod) === fight.coverSide && Math.abs(fight.rod) > 0.25;
    if (pullingAway) fight.coverDanger = Math.max(0, fight.coverDanger - dt * 0.75);
    else fight.coverDanger = Math.min(1.4, fight.coverDanger + dt * (pullingToward ? 0.58 : 0.4));
    if (fight.coverDanger >= 1) {
      fight.outcome = "cover";
      return fight.outcome;
    }
  }

  const applied = tension.appliedPressure;
  const recover = (applied * gear.landSpeed * 0.46 - ff * 0.2) * dt;
  fight.lineOut = clamp(fight.lineOut - recover, 0, 1);

  if (state === "tired" && fight.lineOut < 0.2) {
    fight.outcome = "landed";
    return fight.outcome;
  }

  fight.stateTime += dt;
  fight.elapsed += dt;
  if (beat && fight.stateTime >= beat.dur && fight.index < fight.script.length - 1) {
    fight.index += 1;
    fight.stateTime = 0;
    const next = fight.script[fight.index]?.state;
    if (next === "jump") fight.jumps += 1;
  }
  return fight.outcome;
}

export type FightPolicy = "horse" | "smart";

export function policyFor(kind: FightPolicy, state: FightStateName, coverSide: -1 | 0 | 1): FightInput {
  if (kind === "horse") return { pressure: true, give: false, rod: 0 };
  const hot = isHotState(state);
  return {
    pressure: !hot,
    give: hot,
    rod: state === "cover" && coverSide !== 0 ? -coverSide : 0,
  };
}

export interface FightTrace {
  outcome: FightOutcome;
  elapsed: number;
  jumps: number;
  peakTension: number;
  states: string;
  speciesId: string;
  gearId: string;
}

export function simulateFight(
  speciesId: string,
  gearId: string,
  policy: FightPolicy,
  seed: number,
  coverSide: -1 | 0 | 1 = 1,
): FightTrace {
  const profile = SPECIES_BY_ID[speciesId];
  const gear = GEAR_BY_ID[gearId];
  if (!profile || !gear) {
    return { outcome: "spit", elapsed: 0, jumps: 0, peakTension: 0, states: "", speciesId, gearId };
  }
  const made = createFight(profile, gear, `sim-${speciesId}`, seed >>> 0 || 1, coverSide);
  const fight = made.fight;
  let guard = 0;
  while (fight.outcome === "fighting" && guard < 4000) {
    const state = fight.script[fight.index]?.state ?? "tired";
    const input = policyFor(policy, state, fight.coverSide);
    stepFight(fight, profile, gear, input, 1 / 30);
    guard += 1;
  }
  return {
    outcome: fight.outcome,
    elapsed: fight.elapsed,
    jumps: fight.script.filter((b) => b.state === "jump").length,
    peakTension: fight.peakTension,
    states: fight.script.map((b) => b.state).join("-"),
    speciesId,
    gearId,
  };
}
