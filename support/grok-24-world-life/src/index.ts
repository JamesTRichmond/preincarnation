/**
 * PREINCARNATION world-life.
 * Deterministic posts, routines, and era substitution.
 * Not a hunger, job, weather, or economy simulation.
 * Narrative cast and quests are inputs; fixtures stand in when the pack is absent.
 */
export { ACTIVITIES, ACTIVITY_LIST, ROLE_ACTIVITIES, eventsOnTick, samplePose } from "./activities.ts";
export { CAST, ERAS, MEMORIES, ROLES, buildCast, holderFor } from "./cast.ts";
export { HUBS, intervale, middlebury, otter } from "./hubs.ts";
export { cellKey, compileWalk, nearestOpen, pathfind } from "./nav.ts";
export { QUEST_FIXTURES } from "./quests.ts";
export { memoryLine, roleTitle, vacantLine, workLine } from "./talk.ts";
export {
  MAX_STEP_TICKS,
  RECOVER_AFTER,
  addEphemeral,
  clearEphemeral,
  createHubWorld,
  createWorld,
  defaultCatalog,
  endTalk,
  loadWorld,
  requestTalk,
  saveWorld,
  setActiveOverrides,
  stateHash,
  stationOf,
  step,
  validateHub,
} from "./world.ts";
export type {
  ActivityDef,
  ActorState,
  Catalog,
  Cell,
  EraHolder,
  EraId,
  HubDef,
  HubId,
  MemoryOfEllis,
  Pose,
  QuestOverride,
  SaveBlob,
  TalkResult,
  World,
  WorldEvent,
} from "./types.ts";
