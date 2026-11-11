import { playActivity } from "../adapters/play.ts";
import { integrationReport, type ModuleReport } from "../adapters/modules.ts";
import { ERAS } from "../eras.ts";
import { festivalById, FESTIVALS } from "../festivals/index.ts";
import {
  currentPostingId,
  isSeasonOpen,
  nextPosting,
  REAL_TIME_WAIT_MS,
  turnTheWeek,
  weekLabel,
} from "../schedule/calendar.ts";
import {
  canPlayTune,
  letterIsOpen,
  pinLetter,
  placeReward,
  setStoolTune,
  spokenInterpretation,
  type SlotKey,
} from "../memory/room.ts";
import { rewardById } from "../rewards/catalog.ts";
import { applyEffectToState } from "../rivals/progress.ts";
import { rivalById } from "../rivals/roster.ts";
import { createInitialSave, recordKey } from "../save/save.ts";
import type {
  ActivityResult,
  Amendment,
  AttendedRecord,
  EraId,
  FestivalId,
  OutcomeId,
  PlayerChoice,
  RewardGrant,
  RivalEffect,
  RivalId,
  SaveData,
  Tone,
} from "../types.ts";

export { REAL_TIME_WAIT_MS, createInitialSave, recordKey };

const WEIGHT: Record<OutcomeId, number> = {
  excelled: 2,
  "accessible-complete": 2,
  managed: 1,
  faltered: -1,
  withdrew: -1,
};

export function toneOf(results: ActivityResult[]): Tone {
  if (results.length === 0) return "sour";
  const score = results.reduce((sum, result) => sum + WEIGHT[result.outcome], 0);
  if (score >= 4) return "warm";
  if (score <= 0) return "sour";
  return "mixed";
}

export function heatsCount(results: ActivityResult[]): boolean {
  return results.some((result) => result.outcome !== "withdrew");
}

export function isResolved(save: SaveData, festivalId: FestivalId): boolean {
  const key = recordKey(save.eraId, festivalId);
  return Boolean(save.attended[key]) || save.declined.includes(key);
}

export function isEligible(save: SaveData, festivalId: FestivalId): boolean {
  return isSeasonOpen(save.townWeek, festivalId) && !isResolved(save, festivalId);
}

function withRivals(save: SaveData, effects: RivalEffect[], flags: string[]): SaveData {
  const rivals = { ...save.rivals };
  for (const effect of effects) {
    rivals[effect.rivalId] = applyEffectToState(rivals[effect.rivalId], effect);
  }
  const story = new Set(save.storyFlags);
  for (const flag of flags) story.add(flag);
  for (const effect of effects) if (effect.flag) story.add(effect.flag);
  return { ...save, rivals, storyFlags: [...story] };
}

export function prizesFor(
  festivalId: FestivalId,
  eraId: EraId,
  tone: Tone,
  results: ActivityResult[],
  storyFlags: readonly string[],
): string[] {
  const festival = festivalById(festivalId);
  const done = heatsCount(results);
  const ids: string[] = [];
  for (const rule of festival.prizes) {
    if (rule.eraId && rule.eraId !== eraId) continue;
    let ok = false;
    if (rule.when === "finish") ok = done;
    if (rule.when === "tone-warm") ok = done && tone === "warm";
    if (rule.when === "tone-not-sour") ok = done && tone !== "sour";
    if (rule.when === "flag") ok = Boolean(done && rule.flag && storyFlags.includes(rule.flag));
    if (rule.when === "activity") {
      const result = results.find((item) => item.activityId === rule.activityId);
      ok = Boolean(result && rule.outcomes?.includes(result.outcome));
    }
    if (ok && !ids.includes(rule.rewardId)) ids.push(rule.rewardId);
  }
  return ids;
}

export function beginFestival(save: SaveData, festivalId: FestivalId): SaveData {
  if (save.inProgress) return save;
  if (!isEligible(save, festivalId)) return save;
  return {
    ...save,
    inProgress: {
      festivalId,
      eraId: save.eraId,
      phase: "intro",
      activityIndex: 0,
      results: [],
      checkpoint: {
        rivals: structuredClone(save.rivals),
        storyFlags: save.storyFlags.slice(),
      },
    },
  };
}

export function acknowledgeIntro(save: SaveData): SaveData {
  if (!save.inProgress || save.inProgress.phase !== "intro") return save;
  return { ...save, inProgress: { ...save.inProgress, phase: "activity" } };
}

export function chooseHeat(save: SaveData, choice: PlayerChoice): SaveData {
  if (!save.inProgress || save.inProgress.phase !== "activity") return save;
  const festival = festivalById(save.inProgress.festivalId);
  const activity = festival.activities[save.inProgress.activityIndex];
  if (!activity) return save;
  const result = playActivity({
    festival,
    activity,
    era: save.inProgress.eraId,
    choice,
  });
  return pushResult(save, result);
}

export function withdrawHeat(save: SaveData): SaveData {
  if (!save.inProgress || save.inProgress.phase !== "activity") return save;
  const festival = festivalById(save.inProgress.festivalId);
  const activity = festival.activities[save.inProgress.activityIndex];
  if (!activity) return save;
  const result = playActivity({
    festival,
    activity,
    era: save.inProgress.eraId,
    choice: { withdraw: true },
  });
  return pushResult(save, result);
}

function pushResult(save: SaveData, result: ActivityResult): SaveData {
  const progress = save.inProgress;
  if (!progress) return save;
  const effects: RivalEffect[] = result.rivalLines.map((line) => ({
    rivalId: line.rivalId,
    delta: line.delta,
    line: line.line,
    flag: line.flag,
  }));
  const next = withRivals(save, effects, result.flags);
  const results = [...progress.results, result];
  const festival = festivalById(progress.festivalId);
  const more = progress.activityIndex + 1 < festival.activities.length;
  return {
    ...next,
    inProgress: {
      ...progress,
      results,
      activityIndex: more ? progress.activityIndex + 1 : progress.activityIndex,
      phase: more ? "activity" : "closing",
      checkpoint: progress.checkpoint,
    },
  };
}

export function fileGathering(save: SaveData): SaveData {
  const progress = save.inProgress;
  if (!progress || progress.phase !== "closing") return save;
  const tone = toneOf(progress.results);
  const done = heatsCount(progress.results);
  if (!done) {
    return {
      ...save,
      rivals: progress.checkpoint.rivals,
      storyFlags: progress.checkpoint.storyFlags,
      inProgress: null,
    };
  }
  const prizeIds = prizesFor(progress.festivalId, progress.eraId, tone, progress.results, save.storyFlags);
  const record: AttendedRecord = {
    festivalId: progress.festivalId,
    eraId: progress.eraId,
    tone,
    prizeIds,
    results: progress.results,
  };
  const key = recordKey(progress.eraId, progress.festivalId);
  const known = new Set(save.grants.map((grant) => grant.rewardId));
  const grants: RewardGrant[] = prizeIds
    .filter((rewardId) => !known.has(rewardId))
    .map((rewardId) => ({
      rewardId,
      eraId: progress.eraId,
      festivalId: progress.festivalId,
      tone,
    }));
  return {
    ...save,
    attended: { ...save.attended, [key]: record },
    grants: [...save.grants, ...grants],
    inProgress: null,
  };
}

export function abandonGathering(save: SaveData): SaveData {
  if (!save.inProgress) return save;
  return {
    ...save,
    rivals: save.inProgress.checkpoint.rivals,
    storyFlags: save.inProgress.checkpoint.storyFlags,
    inProgress: null,
  };
}

export function declineFestival(save: SaveData, festivalId: FestivalId): SaveData {
  if (!isSeasonOpen(save.townWeek, festivalId) || isResolved(save, festivalId)) return save;
  let next = save;
  if (save.inProgress?.festivalId === festivalId) next = abandonGathering(save);
  if (isResolved(next, festivalId)) return next;
  const festival = festivalById(festivalId);
  next = withRivals(next, festival.onDecline, []);
  const key = recordKey(next.eraId, festivalId);
  return { ...next, declined: [...next.declined, key] };
}

export function advanceWeek(save: SaveData): SaveData {
  if (save.inProgress) return save;
  return { ...save, townWeek: turnTheWeek(save.townWeek) };
}

export function townIsReady(save: SaveData): SaveData {
  if (save.inProgress) return save;
  const posting = nextPosting(save.townWeek);
  if (!posting) return save;
  return { ...save, townWeek: posting.openWeek };
}

export function passFourteenYears(save: SaveData): SaveData {
  if (save.eraId !== "first-turning" || save.inProgress) return save;
  return { ...save, eraId: "the-return", townWeek: 0 };
}

export function earnedIds(save: SaveData): Set<string> {
  return new Set(save.grants.map((grant) => grant.rewardId));
}

export function placeInRoom(save: SaveData, kind: SlotKey, index: number, rewardId: string | null): SaveData {
  const placed = placeReward(save.memory, kind, index, rewardId, earnedIds(save));
  if (!placed.ok) return save;
  return { ...save, memory: placed.memory };
}

export function pinInRoom(save: SaveData, rewardId: string | null): SaveData {
  const placed = pinLetter(save.memory, rewardId, earnedIds(save));
  if (!placed.ok) return save;
  return { ...save, memory: placed.memory };
}

export function setRoomTune(save: SaveData, rewardId: string | null): SaveData {
  const placed = setStoolTune(save.memory, rewardId, earnedIds(save));
  if (!placed.ok) return save;
  return { ...save, memory: placed.memory };
}

export function amendCaption(save: SaveData, rewardId: string, amendment: Amendment): SaveData {
  if (save.eraId !== "the-return") return save;
  if (!earnedIds(save).has(rewardId)) return save;
  return {
    ...save,
    memory: {
      ...save.memory,
      amendments: { ...save.memory.amendments, [rewardId]: amendment },
    },
  };
}

export function markLetterRead(save: SaveData, rewardId: string): SaveData {
  const reward = rewardById(rewardId);
  if (!reward?.letter || !earnedIds(save).has(rewardId)) return save;
  if (!letterIsOpen(reward, save.eraId)) return save;
  if (save.lettersRead.includes(rewardId)) return save;
  return { ...save, lettersRead: [...save.lettersRead, rewardId] };
}

export function tuneAllowed(save: SaveData, rewardId: string): boolean {
  return canPlayTune(rewardId, earnedIds(save));
}

export function captionFor(save: SaveData, rewardId: string): string | null {
  const reward = rewardById(rewardId);
  if (!reward) return null;
  return spokenInterpretation(reward, save.eraId, save.memory.amendments[rewardId]);
}

export function untoldNotes(save: SaveData): string[] {
  if (save.eraId !== "the-return") return [];
  return FESTIVALS.filter((festival) => !save.attended[recordKey("first-turning", festival.id)]).map(
    (festival) => festival.untold,
  );
}

export type BoardCard = {
  id: FestivalId;
  name: string;
  place: string;
  seasonLabel: string;
  hostName: string;
  state: "posted" | "still-open" | "not-yet" | "attended" | "declined" | "in-progress";
  tone?: Tone;
  eraNote: string;
};

export type BoardModel = {
  eraYear: string;
  eraName: string;
  ellis: string;
  lede: string;
  weekLabel: string;
  townWeek: number;
  cards: BoardCard[];
  jumpLabel: string | null;
  canTurnWeek: boolean;
  canPassYears: boolean;
  inProgressName: string | null;
  modules: ModuleReport[];
};

export function boardModel(save: SaveData): BoardModel {
  const era = ERAS[save.eraId];
  const current = currentPostingId(save.townWeek);
  const posting = nextPosting(save.townWeek);
  const cards: BoardCard[] = FESTIVALS.map((festival) => {
    const key = recordKey(save.eraId, festival.id);
    const attended = save.attended[key];
    let state: BoardCard["state"] = "not-yet";
    if (save.inProgress?.festivalId === festival.id) state = "in-progress";
    else if (attended) state = "attended";
    else if (save.declined.includes(key)) state = "declined";
    else if (isSeasonOpen(save.townWeek, festival.id) && festival.id === current) state = "posted";
    else if (isSeasonOpen(save.townWeek, festival.id)) state = "still-open";
    return {
      id: festival.id,
      name: festival.name,
      place: festival.place,
      seasonLabel: festival.seasonLabel,
      hostName: rivalById(festival.hostRivalId).name,
      state,
      tone: attended?.tone,
      eraNote: festival.eraChanges[save.eraId],
    };
  }).sort((a, b) => festivalById(a.id).openWeek - festivalById(b.id).openWeek);
  return {
    eraYear: era.year,
    eraName: era.name,
    ellis: era.ellis,
    lede: era.lede,
    weekLabel: weekLabel(save.townWeek),
    townWeek: save.townWeek,
    cards,
    jumpLabel: posting ? `${posting.label} — ${festivalById(posting.id).name}` : null,
    canTurnWeek: !save.inProgress && save.townWeek < 23,
    canPassYears: save.eraId === "first-turning" && !save.inProgress,
    inProgressName: save.inProgress ? festivalById(save.inProgress.festivalId).name : null,
    modules: integrationReport(),
  };
}

export function rivalIdsAt(festivalId: FestivalId): RivalId[] {
  return festivalById(festivalId).rivals;
}
