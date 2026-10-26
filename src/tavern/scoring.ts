import type { Grade, Gesture } from "./types.ts";
import { gestureLabel } from "./voices.ts";

export type Tolerance = {
  /** Full window, milliseconds, on either side of the beat. */
  windowMs: number;
};

export function togetherBand(windowMs: number): number {
  return Math.max(30, windowMs * 0.4);
}

export function judgeDelta(deltaMs: number, windowMs: number): Grade {
  const abs = Math.abs(deltaMs);
  if (abs <= togetherBand(windowMs)) return "together";
  if (abs <= windowMs) return deltaMs < 0 ? "early" : "late";
  return "slipped";
}

export function variantWindowMs(variant: "relaxed" | "mastery"): number {
  return variant === "mastery" ? 110 : 260;
}

export function gradeHold(
  pressMs: number,
  releaseMs: number,
  cueMs: number,
  holdMs: number,
  windowMs: number,
): Grade {
  const start = judgeDelta(pressMs - cueMs, windowMs);
  if (start === "slipped") return "slipped";
  const needed = cueMs + holdMs * 0.65;
  if (releaseMs < needed) return "early";
  return start === "late" ? "late" : "together";
}

export function pointsFor(grade: Grade): number {
  if (grade === "together") return 1;
  if (grade === "early" || grade === "late") return 0.6;
  return 0;
}

/** 100 means every breath landed together. Misses lower it and never end the tune. */
export function closeness(grades: Grade[]): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + pointsFor(grade), 0);
  return Math.round((sum / grades.length) * 100);
}

export function feedbackCopy(grade: Grade, gesture: Gesture): string {
  if (gesture === "hold" && grade === "together") return "Held with the room.";
  if (gesture === "hold" && grade === "early") return "Let it rest a little longer.";
  if (grade === "together") return "Together.";
  if (grade === "early") return "A little soon. The room can wait.";
  if (grade === "late") return "A little after. There's another breath.";
  return "That one passed. The tune is still going.";
}

export function teachCopy(gesture: Gesture): string {
  return `Not this one — the words say ${gestureLabel(gesture)}.`;
}

export function summaryCopy(grades: Grade[]): { title: string; body: string } {
  if (grades.length === 0) {
    return {
      title: "The tune finished.",
      body: "The room played it through.",
    };
  }
  const slipped = grades.filter((g) => g === "slipped").length;
  const together = grades.filter((g) => g === "together").length;
  if (slipped === grades.length) {
    return {
      title: "You stayed till the end.",
      body: "Every step slipped past, and the tune still finished. It will be here.",
    };
  }
  if (together / grades.length >= 0.75) {
    return {
      title: "They leaned in.",
      body: "The tune belongs in the room now.",
    };
  }
  if (slipped > 0) {
    return {
      title: "The room stayed with you.",
      body: "A few breaths slipped past. The rest landed.",
    };
  }
  return {
    title: "The room stayed with you.",
    body: "Not every step was centered, and none of them stopped the tune.",
  };
}
