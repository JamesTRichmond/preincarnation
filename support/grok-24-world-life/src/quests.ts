import type { QuestOverride } from "./types.ts";

/**
 * Fixture overrides only. Real quest stages arrive from the quest pack and
 * should use the same shape with source: "pack".
 * Two of these claim the miller so conflict resolution can be shown.
 */
export const QUEST_FIXTURES: QuestOverride[] = [
  {
    id: "fixture.delivery.hold",
    questId: "fixture.delivery",
    stage: "at-bench",
    roleId: "role.cooper",
    priority: 10,
    mode: "hold",
    stationId: "mb.bench",
    activityId: "hoop-barrel",
    blocksTalk: false,
    source: "fixture",
  },
  {
    id: "fixture.freshet.race",
    questId: "fixture.freshet",
    stage: "sounding",
    roleId: "role.miller",
    priority: 30,
    mode: "relocate",
    stationId: "mb.race",
    activityId: "sound-the-race",
    blocksTalk: false,
    source: "fixture",
  },
  {
    id: "fixture.ledger.green",
    questId: "fixture.ledger",
    stage: "ink",
    roleId: "role.miller",
    priority: 10,
    mode: "hold",
    stationId: "mb.green",
    activityId: "weigh-grain",
    blocksTalk: true,
    source: "fixture",
  },
];
