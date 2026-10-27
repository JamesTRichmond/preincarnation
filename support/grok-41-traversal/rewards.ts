import type { Course } from "./types.ts";

/**
 * Field notes are cosmetic. They are not flags, items, or chapter locks.
 * The campaign must not call this to gate story progress — it cannot.
 */
export function rewardsGateCampaign(): false {
  return false;
}

export function fieldNoteFor(course: Course): string {
  return course.fieldNote;
}
