import type { Course, Tier } from "./types.ts";
import { EARLY } from "./courses-early.ts";
import { MIXED } from "./courses-mixed.ts";
import { ROUTE } from "./courses-route.ts";
import { MASTERY } from "./courses-mastery.ts";

export const TIER_ORDER: Tier[] = ["early", "mixed", "route", "mastery"];

export const TIER_LABEL: Record<Tier, string> = {
  early: "Early movement",
  mixed: "Mixed tools",
  route: "Water, height, route",
  mastery: "Late mastery",
};

export const COURSES: Course[] = [...EARLY, ...MIXED, ...ROUTE, ...MASTERY];

const byId = new Map(COURSES.map((c) => [c.id, c]));

export function getCourse(id: string): Course | undefined {
  return byId.get(id);
}

export function coursesIn(tier: Tier): Course[] {
  return COURSES.filter((c) => c.tier === tier);
}

export const FEATURED_IDS = COURSES.filter((c) => c.featured).map((c) => c.id);
