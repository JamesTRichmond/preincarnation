import { DEV_CATALOG } from "./catalog.ts";
import type { GameplaySnapshot, SaveSlot, Settings } from "./types.ts";

/** Development fixture lives. Not engine saves. */

export const DAMAGE_MESSAGE =
  "The ink ran across the years on this page. It cannot be read like this.";

export function defaultSettings(): Settings {
  return {
    music: 6,
    sfx: 8,
    screenShake: true,
    textPace: "steady",
    reduceMotion: false,
    touch: "auto",
    hints: "auto",
  };
}

export function freshLife(): GameplaySnapshot {
  return {
    lifeName: DEV_CATALOG.character.name,
    returnIndex: 1,
    eraId: "frost",
    placeId: "ferry",
    position: { x: 8, y: 30 },
    facing: "e",
    hearts: { current: 5, max: 5 },
    ownedToolIds: ["lantern"],
    activeToolId: "lantern",
    quickSlots: ["lantern", null, null, null],
    bottles: [],
    upgradeIds: [],
    discoveredPlaceIds: ["ferry"],
    evidence: [],
    keyIds: [],
    openedLockIds: [],
    history: [
      {
        returnIndex: 1,
        eraId: "frost",
        years: 0,
        closed: "This life has not closed.",
        living: true,
      },
    ],
    playSeconds: 0,
    completion: null,
    flags: {},
  };
}

/** A late life used by the sample slots. Still mid-story: no ending written. */
export function ashBarLife(): GameplaySnapshot {
  return {
    lifeName: DEV_CATALOG.character.name,
    returnIndex: 4,
    eraId: "quiet",
    placeId: "archive",
    position: { x: 48, y: 22 },
    facing: "e",
    hearts: { current: 4, max: 6 },
    ownedToolIds: DEV_CATALOG.tools.map((tool) => tool.id),
    activeToolId: "lantern",
    quickSlots: ["lantern", "lens", "shard", "hammer"],
    bottles: [
      { id: "b-spring", kindId: "spring", sips: 2 },
      { id: "b-ink", kindId: "ink", sips: 1 },
      { id: "b-oil", kindId: "oil", sips: 1 },
    ],
    upgradeIds: ["heart-vessel", "steady-wick", "true-lens"],
    discoveredPlaceIds: ["ferry", "millrace", "railcut", "chapel", "archive", "orchard"],
    evidence: [
      { id: "ticket", inked: true },
      { id: "chisel-marks", inked: true },
      { id: "flood-line", inked: true },
      { id: "coat-thread", inked: true },
      { id: "shelf", inked: false },
    ],
    keyIds: ["ferry-key", "archive-key"],
    openedLockIds: ["ferry-boathouse"],
    history: [
      {
        returnIndex: 1,
        eraId: "frost",
        years: 19,
        closed: "The ice closed over the millrace.",
        living: false,
      },
      {
        returnIndex: 2,
        eraId: "rail",
        years: 34,
        closed: "They set the tools down at the cut and let the life end.",
        living: false,
      },
      {
        returnIndex: 3,
        eraId: "flood",
        years: 7,
        closed: "The chapel loft took them with the last of the hymn.",
        living: false,
      },
      {
        returnIndex: 4,
        eraId: "quiet",
        years: 4,
        closed: "This life is still open.",
        living: true,
      },
    ],
    playSeconds: 4820,
    completion: null,
    flags: {},
  };
}

export function earlyLife(): GameplaySnapshot {
  const life = freshLife();
  life.playSeconds = 640;
  life.position = { x: 14, y: 28 };
  life.ownedToolIds = ["lantern", "hook", "lens", "coil"];
  life.quickSlots = ["lantern", "hook", null, null];
  life.bottles = [{ id: "b-empty", kindId: "empty", sips: 0 }];
  life.history = [
    {
      returnIndex: 1,
      eraId: "frost",
      years: 1,
      closed: "This life is still open.",
      living: true,
    },
  ];
  return life;
}

export function fixtureSlots(): SaveSlot[] {
  return [
    { id: "slot-1", occupied: true, damaged: false, snapshot: ashBarLife() },
    { id: "slot-2", occupied: true, damaged: true, snapshot: earlyLife() },
    { id: "slot-3", occupied: false, damaged: false, snapshot: null },
  ];
}

export function withCompletion(life: GameplaySnapshot, endingId: string): GameplaySnapshot {
  return {
    ...life,
    completion: { endingId },
    history: life.history.map((chapter) =>
      chapter.living ? { ...chapter, living: false, closed: "The life was set down." } : chapter,
    ),
  };
}
