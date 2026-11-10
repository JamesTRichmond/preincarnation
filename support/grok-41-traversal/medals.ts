import { DT, type AccessId } from "./types.ts";
import { MEDAL_FRAMES } from "./measured-runs.ts";

export type Medal = "gold" | "silver" | "bronze";

/** Ranked medals only. Assist is a separate board and never earns a medal. */
export function medalFor(courseId: string, frames: number, access: AccessId): Medal | null {
  if (access !== "standard") return null;
  const band = MEDAL_FRAMES[courseId];
  if (!band) return null;
  if (frames <= band.gold) return "gold";
  if (frames <= band.silver) return "silver";
  if (frames <= band.bronze) return "bronze";
  return null;
}

export function formatTime(frames: number): string {
  return (frames * DT).toFixed(2) + "s";
}

/** Live split against the measured gold. Negative means ahead. */
export function versusGold(frames: number, gold: number): { ahead: boolean; label: string } {
  const delta = frames - gold;
  const ahead = delta <= 0;
  return { ahead, label: (ahead ? "−" : "+") + formatTime(Math.abs(delta)) };
}
