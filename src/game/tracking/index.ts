/**
 * Otter Creek tracking rules. Not the Marble Vein, and not mounted on the
 * 320×240 life. The field UI from the sandbox is a different canvas and
 * would replace the one person on the Green. These are the circuits,
 * senses, and rewards, ready for a later chapter that still dies and returns.
 */

export { ENCOUNTERS, ENCOUNTER_BY_ID, HABITAT_KINDS, REPRESENTATIVE_IDS } from "./encounters.ts";
export { COVER, PLAYER_START, WORLD, groundAt, habitatLabel } from "./habitat.ts";
export { PROFILE_LIST, PROFILES } from "./profiles.ts";
export { ART } from "./types.ts";
export {
  CLOCK_PER_SEC,
  IDLE_ACTIONS,
  POINTS,
  READ_RANGE,
  SIGN_NOTICE,
  animalPose,
  animalPosition,
  assessThreat,
  createSession,
  currentOffer,
  discoveredCount,
  footing,
  formatClock,
  huntBlockers,
  nearestPocket,
  nearbyMark,
  nonlethalCeiling,
  placeTrap,
  playerCanSee,
  readNearest,
  readSign,
  readWind,
  resolveChoice,
  restToNextAfternoon,
  shotReach,
  sit,
  tick,
  windKnown,
} from "./sim.ts";
export type { Actions, Footing, Offer, Pose } from "./sim.ts";
export type {
  AnimalRuntime,
  Encounter,
  FieldPage,
  HabitatKind,
  Profile,
  Session,
  Stance,
  TickEvent,
} from "./types.ts";
