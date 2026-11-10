import type { ActorState, MemoryOfEllis } from "./types.ts";
import { ROLES } from "./cast.ts";

const MEMORY_LINE: Record<MemoryOfEllis, string> = {
  unmet: "Ellis is not a name they have been given.",
  "the child at the edge of the work": "They remember Ellis as a child at the edge of the work.",
  "the one who left before the freshet": "They remember Ellis leaving before the freshet.",
  "a name the predecessor kept": "What they know of Ellis is a name the predecessor kept.",
  "the returned, fourteen years thinner": "They know Ellis as the returned, fourteen years thinner.",
  "only the book remembers": "Only the book remembers Ellis. The person at the post does not.",
};

export function roleTitle(roleId: string): string {
  return ROLES.find((r) => r.id === roleId)?.title ?? roleId;
}

export function memoryLine(memory: MemoryOfEllis): string {
  return MEMORY_LINE[memory];
}

export function vacantLine(roleId: string): string {
  const title = roleTitle(roleId);
  return `The ${title.toLowerCase()}'s post is empty. No successor was in the cast, so the work is shuttered. Nothing wanders in their place.`;
}

export function workLine(actor: ActorState, activityLabel: string): string {
  return `${actor.spokenName} keeps this post — ${actor.seatLabel}. ${memoryLine(actor.memory)} Right now: ${activityLabel}. They can speak without being pulled off the work.`;
}
