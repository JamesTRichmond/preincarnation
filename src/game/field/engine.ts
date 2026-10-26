import { BEYOND } from "./beyond.ts";
import { MEADOW } from "./meadow.ts";
import type {
  ActionResult,
  BeatId,
  Creature,
  CreatureRecord,
  EncounterAction,
  EraId,
  HabitatId,
  OutingSave,
  Pace,
  PrepId,
  Presence,
  StationId,
  WeatherId,
  WorldState,
} from "./types.ts";
import {
  BEAT_LABEL,
  ERA_LABEL,
  freshWorld,
  HABITAT_INFO,
  LIGHT_LABEL,
  nextBeat,
  nextWeather,
  PREP_LABEL,
  WEATHER_LABEL,
} from "./world.ts";

export const SAVE_VERSION = 1;

export const CREATURES: Creature[] = [...MEADOW, ...BEYOND];

const BY_ID = new Map(CREATURES.map((creature) => [creature.id, creature]));

export function getCreature(id: string): Creature {
  const creature = BY_ID.get(id);
  if (!creature) throw new Error(`Unknown creature: ${id}`);
  return creature;
}

export function hasCreature(id: string): boolean {
  return BY_ID.has(id);
}

export function creaturesInHabitat(habitatId: HabitatId): Creature[] {
  return CREATURES.filter((creature) => creature.habitatId === habitatId);
}

export function creaturesAtStation(station: StationId): Creature[] {
  return CREATURES.filter((creature) => creature.station === station);
}

export function blankRecord(): CreatureRecord {
  return {
    timesSeen: 0,
    timesMissed: 0,
    timesReleased: 0,
    timesKept: 0,
    hintTier: 0,
    rewardsGranted: [],
    confirmedMarks: [],
    lastNote: "",
    fledEpoch: null,
    fledBeat: null,
  };
}

export function freshSave(): OutingSave {
  return {
    version: SAVE_VERSION,
    epoch: 1,
    world: freshWorld(),
    visited: [],
    records: {},
    journal: [],
    active: null,
  };
}

export function recordOf(save: OutingSave, id: string): CreatureRecord {
  return save.records[id] ?? blankRecord();
}

function withRecord(save: OutingSave, id: string, record: CreatureRecord): OutingSave {
  return { ...save, records: { ...save.records, [id]: record } };
}

function bumpTier(tier: CreatureRecord["hintTier"], next: CreatureRecord["hintTier"]): CreatureRecord["hintTier"] {
  return tier > next ? tier : next;
}

export function correctMarkIds(creature: Creature): string[] {
  return creature.sketchMarks.filter((mark) => mark.correct).map((mark) => mark.id);
}

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function stationMatches(clauseStations: StationId[] | undefined, station: StationId | null): boolean {
  if (!clauseStations || clauseStations.length === 0) return true;
  return station !== null && clauseStations.includes(station);
}

function clauseMet(world: WorldState, clause: Creature["presence"]["anyOf"][number]): boolean {
  if (clause.eras && !clause.eras.includes(world.era)) return false;
  if (clause.beats && !clause.beats.includes(world.beat)) return false;
  if (clause.weathers && !clause.weathers.includes(world.weather)) return false;
  if (!stationMatches(clause.stations, world.station)) return false;
  if (clause.lights && !clause.lights.includes(world.light)) return false;
  if (clause.sounds && !clause.sounds.includes(world.sound)) return false;
  if (clause.preps && !clause.preps.every((prep) => world.preps.includes(prep))) return false;
  return true;
}

function joinLabels(ids: string[], label: (id: string) => string): string {
  const names = unique(ids).map(label);
  if (names.length === 0) return "the right conditions";
  if (names.length === 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

export function explainAbsence(save: OutingSave, creature: Creature): string {
  const clauses = creature.presence.anyOf;
  const local = clauses.filter((clause) => stationMatches(clause.stations, save.world.station));
  if (local.length === 0) {
    return `Not on this bank. ${creature.discoveryClue}`;
  }
  const eraOk = local.filter((clause) => !clause.eras || clause.eras.includes(save.world.era));
  if (eraOk.length === 0) {
    const eras = local.flatMap((clause) => clause.eras ?? []);
    return `Wrong season. It shows in ${joinLabels(eras, (id) => ERA_LABEL[id as EraId])}.`;
  }
  const beatOk = eraOk.filter((clause) => !clause.beats || clause.beats.includes(save.world.beat));
  if (beatOk.length === 0) {
    const beats = eraOk.flatMap((clause) => clause.beats ?? []);
    return `Not this quarter-hour. Look in ${joinLabels(beats, (id) => BEAT_LABEL[id as BeatId])}.`;
  }
  const weatherOk = beatOk.filter((clause) => !clause.weathers || clause.weathers.includes(save.world.weather));
  if (weatherOk.length === 0) {
    const weathers = beatOk.flatMap((clause) => clause.weathers ?? []);
    return `The weather is wrong. It wants ${joinLabels(weathers, (id) => WEATHER_LABEL[id as WeatherId])}.`;
  }
  const lightOk = weatherOk.filter((clause) => !clause.lights || clause.lights.includes(save.world.light));
  if (lightOk.length === 0) {
    const lights = weatherOk.flatMap((clause) => clause.lights ?? []);
    return `The light is wrong. It wants ${joinLabels(lights, (id) => LIGHT_LABEL[id as "off"])}.`;
  }
  const soundOk = lightOk.filter((clause) => !clause.sounds || clause.sounds.includes(save.world.sound));
  if (soundOk.length === 0) {
    return "The sound is wrong for it. The clue says what to play.";
  }
  for (const clause of soundOk) {
    const missing = (clause.preps ?? []).filter((prep) => !save.world.preps.includes(prep));
    if (missing.length > 0) {
      return `${missing.map((prep) => PREP_LABEL[prep]).join(", then ")}.`;
    }
  }
  return "The conditions are not together yet.";
}

export function evaluatePresence(save: OutingSave, id: string): Presence {
  const creature = getCreature(id);
  if (creature.habitatId !== save.world.habitatId) {
    const habitat = HABITAT_INFO[creature.habitatId];
    return {
      status: "unavailable-habitat",
      habitatId: creature.habitatId,
      reason: `${habitat.name} is not today's walk. ${habitat.blurb}`,
    };
  }
  const record = recordOf(save, id);
  if (record.fledEpoch === save.epoch && record.fledBeat === save.world.beat) {
    return {
      status: "fled",
      reason: "It left for this quarter-hour. It is not gone from the county. Let the light change, or start the walk over.",
    };
  }
  if (creature.presence.anyOf.some((clause) => clauseMet(save.world, clause))) {
    return { status: "present" };
  }
  return { status: "absent", reason: explainAbsence(save, creature) };
}

function applyWorldAction(save: OutingSave, action: EncounterAction): OutingSave {
  const world = save.world;
  switch (action.type) {
    case "pace":
      return { ...save, world: { ...world, pace: action.pace } };
    case "light":
      return { ...save, world: { ...world, light: action.light } };
    case "sound":
      return { ...save, world: { ...world, sound: action.sound } };
    case "prep":
      if (world.preps.includes(action.prep)) return save;
      return { ...save, world: { ...world, preps: [...world.preps, action.prep] } };
    default:
      return save;
  }
}

function sameAction(left: EncounterAction, right: EncounterAction): boolean {
  if (left.type !== right.type) return false;
  switch (left.type) {
    case "pace":
      return right.type === "pace" && left.pace === right.pace;
    case "light":
      return right.type === "light" && left.light === right.light;
    case "sound":
      return right.type === "sound" && left.sound === right.sound;
    case "prep":
      return right.type === "prep" && left.prep === right.prep;
    case "still":
      return right.type === "still";
    case "tool":
      return right.type === "tool" && left.tool === right.tool && left.timing === right.timing;
    case "marks":
      return false;
    default:
      return false;
  }
}

function flee(save: OutingSave, id: string, message: string): ActionResult {
  const creature = getCreature(id);
  const record = recordOf(save, id);
  const next: CreatureRecord = {
    ...record,
    timesMissed: record.timesMissed + 1,
    hintTier: bumpTier(record.hintTier, 2),
    lastNote: message,
    fledEpoch: save.epoch,
    fledBeat: save.world.beat,
  };
  return {
    save: {
      ...withRecord(save, id, next),
      active: null,
      journal: [
        ...save.journal,
        {
          id: `miss:${id}:${save.epoch}:${save.world.beat}:${next.timesMissed}`,
          creatureId: id,
          text: message,
          channel: "field",
        },
      ],
    },
    kind: "miss",
    message: `${creature.commonName}: ${message}`,
  };
}

export function setEra(save: OutingSave, era: EraId): OutingSave {
  return { ...save, world: { ...save.world, era } };
}

export function setStation(save: OutingSave, station: StationId): OutingSave {
  const visited = save.visited.includes(station) ? save.visited : [...save.visited, station];
  let next: OutingSave = {
    ...save,
    visited,
    world: { ...save.world, station, preps: [], sound: "quiet" },
  };
  if (save.world.habitatId !== "lantern-meadow") return next;
  for (const creature of creaturesAtStation(station)) {
    const record = recordOf(next, creature.id);
    if (record.hintTier >= 1) continue;
    next = withRecord(next, creature.id, { ...record, hintTier: 1 });
  }
  return next;
}

export function setHabitat(save: OutingSave, habitatId: HabitatId): OutingSave {
  const same = habitatId === save.world.habitatId;
  return {
    ...save,
    world: {
      ...save.world,
      habitatId,
      station: habitatId === "lantern-meadow" ? save.world.station : null,
      preps: same ? save.world.preps : [],
    },
  };
}

export function advanceBeat(save: OutingSave): OutingSave {
  return {
    ...save,
    world: {
      ...save.world,
      beat: nextBeat(save.world.beat),
      preps: [],
      sound: "quiet",
    },
  };
}

export function walkTheRidge(save: OutingSave): OutingSave {
  const stepped = advanceBeat(save);
  return { ...stepped, world: { ...stepped.world, weather: nextWeather(save.world.weather) } };
}

export function addPrep(save: OutingSave, prep: PrepId): OutingSave {
  if (!save.world.station) return save;
  if (save.world.preps.includes(prep)) return save;
  return { ...save, world: { ...save.world, preps: [...save.world.preps, prep] } };
}

export function setPace(save: OutingSave, pace: Pace): OutingSave {
  return { ...save, world: { ...save.world, pace } };
}

export function setLight(save: OutingSave, light: WorldState["light"]): OutingSave {
  return { ...save, world: { ...save.world, light } };
}

export function setSound(save: OutingSave, sound: WorldState["sound"]): OutingSave {
  return { ...save, world: { ...save.world, sound } };
}

export function setWeather(save: OutingSave, weather: WeatherId): OutingSave {
  return { ...save, world: { ...save.world, weather } };
}

export function newOuting(save: OutingSave): OutingSave {
  return {
    ...save,
    epoch: save.epoch + 1,
    active: null,
    world: {
      ...freshWorld(),
      habitatId: save.world.habitatId,
      era: save.world.era,
    },
  };
}

export function beginEncounter(save: OutingSave, id: string): ActionResult {
  if (!hasCreature(id)) {
    return { save, kind: "blocked", message: "No such creature is in the book." };
  }
  if (save.active) {
    return { save, kind: "blocked", message: "Finish what is already under your eyes." };
  }
  const presence = evaluatePresence(save, id);
  if (presence.status !== "present") {
    return { save, kind: "blocked", message: presence.reason };
  }
  const creature = getCreature(id);
  return {
    save: {
      ...save,
      active: { creatureId: id, stepIndex: 0, sketchStrikes: 0, log: [creature.behavior] },
    },
    kind: "advance",
    message: creature.behavior,
  };
}

export function leaveEncounter(save: OutingSave): ActionResult {
  if (!save.active) return { save, kind: "blocked", message: "Nothing is under your eyes." };
  const started = save.active.stepIndex > 0 || save.active.sketchStrikes > 0;
  if (!started) {
    return {
      save: { ...save, active: null },
      kind: "ignored",
      message: "You stepped back before it had to leave.",
    };
  }
  return flee(save, save.active.creatureId, "You broke the approach by leaving.");
}

export function applyEncounterAction(save: OutingSave, action: EncounterAction): ActionResult {
  const active = save.active;
  if (!active) return { save, kind: "blocked", message: "Nothing is under your attention." };
  const creature = getCreature(active.creatureId);
  const step = creature.steps[active.stepIndex];
  if (!step) {
    return { save, kind: "ready", message: "It is already accounted for. Release it or keep it." };
  }

  if (step.kind === "sketch") {
    if (action.type !== "marks") {
      const updated = applyWorldAction(save, action);
      return {
        save: updated,
        kind: "ignored",
        message: "The plate is waiting. Ink the marks, or look again.",
      };
    }
    if (sameSet(action.markIds, correctMarkIds(creature))) {
      const stepIndex = active.stepIndex + 1;
      const done = stepIndex >= creature.steps.length;
      const nextActive = {
        ...active,
        stepIndex,
        log: [...active.log, "The plate took the true marks."],
      };
      return {
        save: { ...save, active: nextActive },
        kind: done ? "ready" : "advance",
        message: done ? "The plate is honest. Decide what happens next." : "The plate took the true marks.",
      };
    }
    const strikes = active.sketchStrikes + 1;
    if (strikes >= 2) {
      return flee(save, creature.id, step.wrongText);
    }
    return {
      save: {
        ...save,
        active: {
          ...active,
          sketchStrikes: strikes,
          log: [...active.log, step.wrongText],
        },
      },
      kind: "sketch-retry",
      message: step.wrongText,
    };
  }

  const matched = step.choices.find((choice) => sameAction(choice.action, action));
  const updated = applyWorldAction(save, action);
  if (!matched) {
    return { save: updated, kind: "ignored", message: "That does not answer what it is doing." };
  }
  if (matched.outcome === "miss") {
    return flee(updated, creature.id, matched.missText ?? "It left.");
  }
  const stepIndex = active.stepIndex + 1;
  const done = stepIndex >= creature.steps.length;
  return {
    save: {
      ...updated,
      active: {
        ...active,
        stepIndex,
        log: [...active.log, matched.label],
      },
    },
    kind: done ? "ready" : "advance",
    message: done ? "That was the last of the approach." : matched.label,
  };
}

function rewardAlready(save: OutingSave, rewardId: string): boolean {
  return Object.values(save.records).some((record) => record.rewardsGranted.includes(rewardId));
}

export function applyDisposition(save: OutingSave, disposition: "release" | "keep"): ActionResult {
  const active = save.active;
  if (!active) return { save, kind: "blocked", message: "Nothing is waiting on a decision." };
  const creature = getCreature(active.creatureId);
  if (active.stepIndex < creature.steps.length) {
    return { save, kind: "blocked", message: "The approach is not finished." };
  }
  if (disposition === "keep" && !creature.canKeep) {
    return {
      save,
      kind: "blocked",
      message: creature.keepRefusal ?? "The book will not keep this one.",
    };
  }
  const prior = recordOf(save, creature.id);
  const prose = disposition === "keep" ? creature.keepText : creature.releaseText;
  const grants = creature.rewards.filter((reward) => reward.on === disposition);
  const newly: string[] = [];
  const grantedIds = [...prior.rewardsGranted];
  const journal = [...save.journal];
  const seenCount = prior.timesSeen + 1;
  for (const reward of grants) {
    if (reward.once && (grantedIds.includes(reward.id) || rewardAlready(save, reward.id))) continue;
    if (reward.once) grantedIds.push(reward.id);
    newly.push(reward.label);
    journal.push({
      id: `reward:${creature.id}:${reward.id}:${seenCount}:${grantedIds.length}`,
      creatureId: creature.id,
      text: reward.label,
      channel: reward.channel,
    });
  }
  journal.push({
    id: `note:${creature.id}:${disposition}:${seenCount}`,
    creatureId: creature.id,
    text: prose,
    channel: "field",
  });
  const record: CreatureRecord = {
    ...prior,
    timesSeen: seenCount,
    timesReleased: prior.timesReleased + (disposition === "release" ? 1 : 0),
    timesKept: prior.timesKept + (disposition === "keep" ? 1 : 0),
    hintTier: 3,
    rewardsGranted: grantedIds,
    confirmedMarks: correctMarkIds(creature),
    lastNote: prose,
    fledEpoch: save.epoch,
    fledBeat: save.world.beat,
  };
  return {
    save: { ...withRecord(save, creature.id, record), active: null, journal },
    kind: "done",
    message: prose,
    granted: newly,
  };
}

export function requestHint(save: OutingSave, id: string): ActionResult {
  const creature = getCreature(id);
  const record = recordOf(save, id);
  if (record.hintTier >= 3) {
    return { save, kind: "ignored", message: "The entry is already written." };
  }
  if (record.hintTier === 0) {
    const visited = creature.station ? save.visited.includes(creature.station) : false;
    const elsewhere = creature.habitatId !== save.world.habitatId || !creature.station;
    if (!visited && !elsewhere) {
      return {
        save,
        kind: "blocked",
        message: `Walk to ${creature.siteLabel} first. The rumor is already in the book.`,
      };
    }
    const next = withRecord(save, id, { ...record, hintTier: 1 });
    return { save: next, kind: "advance", message: creature.hints[1] };
  }
  if (record.hintTier === 1) {
    if (record.timesMissed < 1 && record.timesSeen < 1) {
      return {
        save,
        kind: "blocked",
        message: "Miss it honestly, or meet it once, and the approach will settle into a sentence.",
      };
    }
    const next = withRecord(save, id, { ...record, hintTier: 2 });
    return { save: next, kind: "advance", message: creature.hints[2] };
  }
  return {
    save,
    kind: "ignored",
    message: "The approach is as plain as it should be before you try again.",
  };
}

export interface Completion {
  total: number;
  observed: number;
  meadowTotal: number;
  meadowObserved: number;
  byTier: Record<Creature["tier"], { total: number; observed: number }>;
  optional: true;
}

export function completion(save: OutingSave): Completion {
  const byTier: Completion["byTier"] = {
    ordinary: { total: 0, observed: 0 },
    unusual: { total: 0, observed: 0 },
    vein: { total: 0, observed: 0 },
  };
  let observed = 0;
  let meadowObserved = 0;
  const meadowTotal = MEADOW.length;
  for (const creature of CREATURES) {
    byTier[creature.tier].total += 1;
    const seen = recordOf(save, creature.id).timesSeen > 0;
    if (!seen) continue;
    observed += 1;
    byTier[creature.tier].observed += 1;
    if (creature.habitatId === "lantern-meadow") meadowObserved += 1;
  }
  return {
    total: CREATURES.length,
    observed,
    meadowTotal,
    meadowObserved,
    byTier,
    optional: true,
  };
}

export function opportunitySlots(creature: Creature): number {
  let count = 0;
  for (const clause of creature.presence.anyOf) {
    const eras = clause.eras?.length ?? 1;
    const beats = clause.beats?.length ?? 1;
    const weathers = clause.weathers?.length ?? 1;
    count += eras * beats * weathers;
  }
  return count;
}
