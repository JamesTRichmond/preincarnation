export { GEAR, GEAR_BY_ID, CREEL_LIMIT } from "./data/gear.ts";
export { SPECIES, SPECIES_BY_ID, PRESENCE_NOTE, BEHAVIOR_NOTE } from "./data/species.ts";
export { LOCATIONS, LOCATIONS_BY_ID, GROUP_LABEL } from "./data/locations.ts";
export { stepTension, TENSION_ABS_MAX, SNAP_GRACE, GIVE_CAP, HOLD_PRESSURE } from "./sim/tension.ts";
export { simulateFight, stepFight, createFight, isHotState, policyFor, forceFor } from "./sim/fight.ts";
export { createBite, stepBite, tellSentence, currentBeat } from "./sim/bite.ts";
export { castLanding, cancelCast, releaseCast, idleCast } from "./sim/cast.ts";
export { rankSpecies, speciesFit, pickSpecies, hourPeriod, spotAt } from "./sim/fit.ts";
export { resolveCatch, swapKeep, drainRewards, emptySave, rewardKey, markRead } from "./sim/catch.ts";
export { exportSession, parseSession, writeSave, loadSession, memoryStorage, STORAGE_KEY, SAVE_VERSION } from "./sim/save.ts";
export { axisFromCodes, EMPTY_ACTIONS, GAME_CODES } from "./sim/input.ts";
export {
  createSession,
  beginTownHole,
  openWaters,
  chooseLocation,
  chooseSpot,
  chooseGear,
  chooseHour,
  castAgain,
  applyFocusLoss,
  resumeSession,
  stepSession,
  keepFish,
  releaseFish,
  swapFish,
  liftLine,
  debugHook,
  debugLand,
} from "./sim/session.ts";

export const FISHING_CONTRACT = {
  version: 1,
  playableSpecies: 12,
  playableLocations: 18,
  gearSetups: 5,
  creelLimit: 4,
  dataOnlyIds: [] as string[],
  storageKey: "preincarnation.fishing.v1",
  notInThisModule: ["overworld traversal", "the fourteen-year death", "cooking", "the relationship graph"],
} as const;
