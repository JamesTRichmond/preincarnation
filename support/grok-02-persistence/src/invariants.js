import { deepEqual, validateV3 } from "./model.js";

/** Human-readable invariant ids. `core` is validateV3, which encodes the contract rules. */
export const KNOWN_INVARIANTS = [
  "core",
  "no-synthetic-state",
  "completion-same-as-start",
  "stats-same-as-start",
  "heart-same-as-start",
  "dungeon-clears-same",
];

function endingsOf(state) {
  return {
    seen: state.person.endingsSeen,
    complete: state.person.campaignComplete,
    post: state.world.postCompletion,
    ending: state.world.ending,
  };
}

function clearsOf(state) {
  const out = {};
  for (const [id, row] of Object.entries(state.world.dungeons)) {
    out[id] = { cleared: row.cleared, bossDefeated: row.bossDefeated };
  }
  return out;
}

/**
 * @returns {string | null} problem text, or null when the invariant holds.
 * `no-synthetic-state` is enforced by the runner against the action result, not here.
 */
export function checkInvariant(id, state, session) {
  if (!KNOWN_INVARIANTS.includes(id)) return `unknown invariant ${id}`;
  if (id === "no-synthetic-state") return null;
  if (!state) return `${id}: no state`;
  if (id === "core") {
    const verdict = validateV3(state);
    return verdict.ok ? null : `${verdict.error}${verdict.detail ? ` (${verdict.detail})` : ""}`;
  }
  if (id === "completion-same-as-start" && !deepEqual(endingsOf(state), endingsOf(session.start))) {
    return "completion changed";
  }
  if (id === "stats-same-as-start") {
    for (const stat of ["heart", "stride", "edge"]) {
      if (state.person[stat] !== session.start.person[stat]) return `${stat} changed`;
    }
  }
  if (id === "heart-same-as-start" && state.person.heart !== session.start.person.heart) return "heart changed";
  if (id === "dungeon-clears-same" && !deepEqual(clearsOf(state), clearsOf(session.start))) return "dungeon clears changed";
  return null;
}
