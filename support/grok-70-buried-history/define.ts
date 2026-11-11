import type { EraId, HistoryObject } from "./types.ts";

const ALL: readonly EraId[] = ["pre-absence", "the-fourteen", "return"];

type Draft = Omit<HistoryObject, "id" | "evidence" | "persistence"> & {
  evidence: { howRead: string; readable: string };
  persistence: {
    holds: string;
    shift: string;
    presentation: Record<EraId, string>;
  };
};

export function item(n: number, draft: Draft): HistoryObject {
  const num = String(n).padStart(3, "0");
  return {
    ...draft,
    id: `loot.expansion.history.${num}`,
    evidence: {
      evidenceId: `ev.expansion.history.${num}`,
      howRead: draft.evidence.howRead,
      readable: draft.evidence.readable,
    },
    persistence: {
      eras: ALL,
      holds: draft.persistence.holds,
      shift: draft.persistence.shift,
      presentation: draft.persistence.presentation,
    },
  };
}
