import { rewardById } from "../rewards/catalog.ts";
import type {
  Amendment,
  EraId,
  MemoryRoomState,
  RewardDef,
  RewardKind,
} from "../types.ts";

export const SLOT_COUNTS = { trophies: 4, objects: 4, sketches: 3 } as const;
export type SlotKey = keyof typeof SLOT_COUNTS;

const KIND_TO_SLOT: Partial<Record<RewardKind, SlotKey>> = {
  trophy: "trophies",
  object: "objects",
  sketch: "sketches",
};

export function emptyMemory(): MemoryRoomState {
  return {
    trophies: Array.from({ length: SLOT_COUNTS.trophies }, () => null),
    objects: Array.from({ length: SLOT_COUNTS.objects }, () => null),
    sketches: Array.from({ length: SLOT_COUNTS.sketches }, () => null),
    pinnedLetterId: null,
    stoolTuneId: null,
    amendments: {},
  };
}

export function slotKeyForKind(kind: RewardKind): SlotKey | null {
  return KIND_TO_SLOT[kind] ?? null;
}

export type PlaceResult =
  | { ok: true; memory: MemoryRoomState }
  | { ok: false; reason: "unearned" | "unknown" | "wrong-kind" | "duplicate" | "bad-index" };

function placedIds(memory: MemoryRoomState): Set<string> {
  return new Set(
    [...memory.trophies, ...memory.objects, ...memory.sketches].filter((id): id is string => Boolean(id)),
  );
}

export function placeReward(
  memory: MemoryRoomState,
  kind: SlotKey,
  index: number,
  rewardId: string | null,
  earned: ReadonlySet<string>,
): PlaceResult {
  const slots = memory[kind];
  if (index < 0 || index >= slots.length) return { ok: false, reason: "bad-index" };
  if (rewardId === null) {
    const next = slots.slice();
    next[index] = null;
    return { ok: true, memory: { ...memory, [kind]: next } };
  }
  if (!earned.has(rewardId)) return { ok: false, reason: "unearned" };
  const reward = rewardById(rewardId);
  if (!reward) return { ok: false, reason: "unknown" };
  if (slotKeyForKind(reward.kind) !== kind) return { ok: false, reason: "wrong-kind" };
  if (placedIds(memory).has(rewardId) && slots[index] !== rewardId) {
    return { ok: false, reason: "duplicate" };
  }
  const next = slots.slice();
  next[index] = rewardId;
  return { ok: true, memory: { ...memory, [kind]: next } };
}

export function pinLetter(
  memory: MemoryRoomState,
  rewardId: string | null,
  earned: ReadonlySet<string>,
): PlaceResult {
  if (rewardId === null) return { ok: true, memory: { ...memory, pinnedLetterId: null } };
  const reward = rewardById(rewardId);
  if (!reward || reward.kind !== "letter") return { ok: false, reason: "wrong-kind" };
  if (!earned.has(rewardId)) return { ok: false, reason: "unearned" };
  return { ok: true, memory: { ...memory, pinnedLetterId: rewardId } };
}

export function setStoolTune(
  memory: MemoryRoomState,
  rewardId: string | null,
  earned: ReadonlySet<string>,
): PlaceResult {
  if (rewardId === null) return { ok: true, memory: { ...memory, stoolTuneId: null } };
  const reward = rewardById(rewardId);
  if (!reward || reward.kind !== "tune" || !reward.tuneId) return { ok: false, reason: "wrong-kind" };
  if (!earned.has(rewardId)) return { ok: false, reason: "unearned" };
  return { ok: true, memory: { ...memory, stoolTuneId: rewardId } };
}

export function canPlayTune(rewardId: string, earned: ReadonlySet<string>): boolean {
  const reward = rewardById(rewardId);
  return Boolean(reward && reward.kind === "tune" && reward.tuneId && earned.has(rewardId));
}

export function letterIsOpen(reward: RewardDef, era: EraId): boolean {
  if (reward.letter?.sealUntilReturn && era !== "the-return") return false;
  return Boolean(reward.letter);
}

export function spokenInterpretation(
  reward: RewardDef,
  era: EraId,
  amendment: Amendment | undefined,
): string | null {
  if (era !== "the-return") return null;
  if (amendment === "take-down") return null;
  if (amendment === "amend") return reward.interpretation.fair;
  return reward.interpretation[reward.interpretation.defaultTone];
}

export function notYetLine(): string {
  return "No one has inherited this yet. The first life does not get a descendant's caption.";
}

export function normalizeMemory(input: Partial<MemoryRoomState> | null | undefined): MemoryRoomState {
  const base = emptyMemory();
  if (!input) return base;
  const fit = (value: unknown, length: number): Array<string | null> => {
    const source = Array.isArray(value) ? value : [];
    return Array.from({ length }, (_, index) => {
      const item = source[index];
      return typeof item === "string" ? item : null;
    });
  };
  const amendments: MemoryRoomState["amendments"] = {};
  if (input.amendments && typeof input.amendments === "object") {
    for (const [key, value] of Object.entries(input.amendments)) {
      if (value === "leave" || value === "amend" || value === "take-down") amendments[key] = value;
    }
  }
  return {
    trophies: fit(input.trophies, SLOT_COUNTS.trophies),
    objects: fit(input.objects, SLOT_COUNTS.objects),
    sketches: fit(input.sketches, SLOT_COUNTS.sketches),
    pinnedLetterId: typeof input.pinnedLetterId === "string" ? input.pinnedLetterId : null,
    stoolTuneId: typeof input.stoolTuneId === "string" ? input.stoolTuneId : null,
    amendments,
  };
}
