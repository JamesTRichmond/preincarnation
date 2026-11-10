import { OBJECTIVES } from "./content.ts";

export type QuestView = {
  mode: string;
  mapId: string;
  talkedElder: boolean;
  hasShovel: boolean;
  hasLantern: boolean;
  lanternOn: boolean;
  hasKey: boolean;
  lockOpen: boolean;
  hasHammer: boolean;
  quarryQuiet: boolean;
  sentinelFaced: boolean;
  cycle: number;
  seamThin: boolean;
  graveWaiting: boolean;
};

/** The one job, said as the next step. No new gate. */
export function liveObjective(v: QuestView): string {
  if (v.mode === "limbo") return OBJECTIVES.limbo;
  if (v.mapId === "soloverse") return OBJECTIVES.spectrum;
  if (v.mapId === "quarry") {
    if (!v.hasLantern) return "TAKE the lamp by the door. The Vein is blind without it.";
    if (!v.lanternOn) return "OPEN the lamp. The hammer does not land in the dark.";
    if (!v.hasKey) return "TAKE the key in the west alcove.";
    if (!v.lockOpen) return "USE the key on the north lock.";
    if (!v.hasHammer) return "TAKE the marble hammer past the lock.";
    if (!v.quarryQuiet && !v.sentinelFaced) return "SMASH the cracked marble — lamp open — then FACE the Sentinel.";
    return "WALK west, or die here and come back with the shovel.";
  }
  if (!v.talkedElder && v.mapId === "middlebury") return OBJECTIVES.start;
  if (!v.hasShovel) return "TAKE the shovel by the stone.";
  if (v.mapId === "middlebury" && v.seamThin) return OBJECTIVES.seam;
  if (!v.quarryQuiet && !v.sentinelFaced) return OBJECTIVES.quarry;
  if (v.graveWaiting) return "DIG the grave of your last skin. The shovel is the verb.";
  return OBJECTIVES.county;
}

/** First life, in order. Each line is the one the county should be saying. */
export function firstLifeSteps(): string[] {
  const base = {
    mode: "play",
    mapId: "middlebury",
    talkedElder: false,
    hasShovel: false,
    hasLantern: false,
    lanternOn: false,
    hasKey: false,
    lockOpen: false,
    hasHammer: false,
    quarryQuiet: false,
    sentinelFaced: false,
    cycle: 0,
    seamThin: false,
    graveWaiting: false,
  };
  return [
    liveObjective(base),
    liveObjective({ ...base, talkedElder: true }),
    liveObjective({ ...base, talkedElder: true, hasShovel: true }),
    liveObjective({ ...base, talkedElder: true, hasShovel: true, mapId: "quarry" }),
    liveObjective({ ...base, talkedElder: true, hasShovel: true, mapId: "quarry", hasLantern: true, lanternOn: true, hasKey: true, lockOpen: true, hasHammer: true }),
  ];
}
