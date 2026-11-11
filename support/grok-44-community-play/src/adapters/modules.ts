import type { ModuleId } from "../types.ts";
import { probeModule } from "./registry.ts";

export const MODULE_LABEL: Record<ModuleId, string> = {
  cards: "cards",
  cooking: "cooking",
  fishing: "fishing",
  tracking: "tracking",
  music: "music",
  traversal: "traversal",
};

/**
 * Sessions that would own the live minigames. None of those packages are mounted
 * in this community-play build, so the status stays fixture-pending until one
 * registers through `registerLiveModule`.
 */
export const MODULE_SESSIONS: Record<ModuleId, string> = {
  cards: "cards session — not mounted",
  cooking: "cooking session — not mounted",
  fishing: "fishing session — not mounted",
  tracking: "tracking session — not mounted",
  music: "music session — not mounted",
  traversal: "traversal session — not mounted",
};

export function fixtureLabel(moduleId: ModuleId): string {
  const label = MODULE_LABEL[moduleId];
  return `FIXTURE — the ${label} minigame is not loaded in this session. This result is authored, not played. Live integration: pending.`;
}

export type ModuleReport = {
  moduleId: ModuleId;
  label: string;
  status: "live" | "fixture-pending";
  detail: string;
};

export function integrationReport(): ModuleReport[] {
  return (Object.keys(MODULE_LABEL) as ModuleId[]).map((moduleId) => {
    const live = probeModule(moduleId);
    if (live) {
      return {
        moduleId,
        label: MODULE_LABEL[moduleId],
        status: "live",
        detail: `Live module registered (${live.ownerHint}).`,
      };
    }
    return {
      moduleId,
      label: MODULE_LABEL[moduleId],
      status: "fixture-pending",
      detail: `${MODULE_SESSIONS[moduleId]}. Results are authored stand-ins.`,
    };
  });
}
