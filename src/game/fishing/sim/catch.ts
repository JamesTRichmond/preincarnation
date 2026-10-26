import { CREEL_LIMIT } from "../data/gear.ts";
import { SPECIES_BY_ID } from "../data/species.ts";
import type { CatchInstance, FishingReward, FishingSave, JournalEntry } from "./types.ts";

export type FailReason = "duplicate" | "creel-full" | "not-pending" | "missing" | "already-drained";

export type CatchResult = { ok: true; save: FishingSave } | { ok: false; save: FishingSave; reason: FailReason };

export function emptySave(): FishingSave {
  return {
    journal: {},
    creel: [],
    resolvedIds: [],
    rewardQueue: [],
    drainedIds: [],
    reads: [],
    stats: { kept: 0, released: 0, lost: 0 },
  };
}

export function rewardKey(reward: FishingReward): string {
  return `${reward.kind}:${reward.catchId}`;
}

export function markRead(save: FishingSave, readId: string): FishingSave {
  if (save.reads.includes(readId)) return save;
  return { ...save, reads: [...save.reads, readId] };
}

function withJournal(
  save: FishingSave,
  fish: CatchInstance,
  how: "keep" | "release" | "lost",
): { save: FishingSave; stageReward: FishingReward | null } {
  const prev = save.journal[fish.speciesId];
  const times = (prev?.times ?? 0) + 1;
  const stage = Math.min(4, Math.max(prev?.stage ?? 0, times));
  const entry: JournalEntry = {
    speciesId: fish.speciesId,
    times,
    kept: (prev?.kept ?? 0) + (how === "keep" ? 1 : 0),
    released: (prev?.released ?? 0) + (how === "release" ? 1 : 0),
    lost: (prev?.lost ?? 0) + (how === "lost" ? 1 : 0),
    stage,
    locationIds: [...new Set([...(prev?.locationIds ?? []), fish.locationId])],
    gearIds: [...new Set([...(prev?.gearIds ?? []), fish.gearId])],
    bestLengthCm: Math.max(prev?.bestLengthCm ?? 0, fish.lengthCm),
  };
  const stageReward: FishingReward | null =
    stage > (prev?.stage ?? 0)
      ? { kind: "journal", catchId: fish.id, speciesId: fish.speciesId, stage }
      : null;
  return { save: { ...save, journal: { ...save.journal, [fish.speciesId]: entry } }, stageReward };
}

export function resolveCatch(save: FishingSave, fish: CatchInstance, how: "keep" | "release" | "lost"): CatchResult {
  if (save.resolvedIds.includes(fish.id)) return { ok: false, save, reason: "duplicate" };
  if (how === "keep" && save.creel.length >= CREEL_LIMIT) return { ok: false, save, reason: "creel-full" };

  const next = withJournal(save, fish, how);
  const rewardQueue = [...save.rewardQueue];
  if (next.stageReward) rewardQueue.push(next.stageReward);
  const stats = { ...save.stats };
  let creel = save.creel;
  if (how === "keep") {
    stats.kept += 1;
    creel = [...creel, { ...fish, status: "kept" }];
    rewardQueue.push({
      kind: "food",
      catchId: fish.id,
      speciesId: fish.speciesId,
      meal: fish.meal,
      portions: fish.portions,
    });
  } else if (how === "release") {
    stats.released += 1;
    rewardQueue.push({
      kind: "regard",
      catchId: fish.id,
      speciesId: fish.speciesId,
      tag: "gentle-hands",
      line: SPECIES_BY_ID[fish.speciesId]?.regard ?? "You put it back.",
    });
  } else {
    stats.lost += 1;
  }

  return {
    ok: true,
    save: {
      ...next.save,
      creel,
      stats,
      rewardQueue,
      resolvedIds: [...save.resolvedIds, fish.id],
    },
  };
}

/** Set a kept fish back so a new one can come home. Refuses if that meal already left the trip. */
export function swapKeep(save: FishingSave, discardId: string, fish: CatchInstance): CatchResult {
  if (save.resolvedIds.includes(fish.id)) return { ok: false, save, reason: "duplicate" };
  const discard = save.creel.find((item) => item.id === discardId);
  if (!discard) return { ok: false, save, reason: "missing" };
  if (save.drainedIds.includes(`food:${discardId}`)) return { ok: false, save, reason: "already-drained" };

  const prev = save.journal[discard.speciesId];
  const journal = { ...save.journal };
  if (prev) journal[discard.speciesId] = { ...prev, kept: Math.max(0, prev.kept - 1) };
  const stripped: FishingSave = {
    ...save,
    journal,
    creel: save.creel.filter((item) => item.id !== discardId),
    rewardQueue: save.rewardQueue.filter((reward) => !(reward.kind === "food" && reward.catchId === discardId)),
    stats: { ...save.stats, kept: Math.max(0, save.stats.kept - 1) },
  };
  return resolveCatch(stripped, fish, "keep");
}

export function drainRewards(save: FishingSave): { save: FishingSave; rewards: FishingReward[] } {
  const seen = new Set(save.drainedIds);
  const rewards: FishingReward[] = [];
  for (const reward of save.rewardQueue) {
    const key = rewardKey(reward);
    if (seen.has(key)) continue;
    seen.add(key);
    rewards.push(reward);
  }
  return { rewards, save: { ...save, rewardQueue: [], drainedIds: [...seen] } };
}
