import { cloneWorld } from "./clone.ts";
import type { RoutingRule, StorageCategory, StorageWorld } from "./types.ts";

function sortRules(rules: RoutingRule[]): RoutingRule[] {
  return [...rules].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function moveRule(world: StorageWorld, ruleId: string, direction: -1 | 1): StorageWorld {
  const next = cloneWorld(world);
  const rules = sortRules(next.profile.rules);
  const index = rules.findIndex((rule) => rule.id === ruleId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rules.length) return next;
  const current = rules[index];
  const other = rules[target];
  if (!current || !other) return next;
  rules[index] = other;
  rules[target] = current;
  rules.forEach((rule, order) => {
    rule.order = (order + 1) * 10;
  });
  next.profile.rules = rules;
  return next;
}

export function setRuleEnabled(world: StorageWorld, ruleId: string, enabled: boolean): StorageWorld {
  const next = cloneWorld(world);
  const rule = next.profile.rules.find((item) => item.id === ruleId);
  if (rule) rule.enabled = enabled;
  return next;
}

export function toggleRuleExclusion(
  world: StorageWorld,
  ruleId: string,
  destinationId: string,
): StorageWorld {
  const next = cloneWorld(world);
  const rule = next.profile.rules.find((item) => item.id === ruleId);
  if (!rule) return next;
  if (rule.excludeDestinationIds.includes(destinationId)) {
    rule.excludeDestinationIds = rule.excludeDestinationIds.filter((id) => id !== destinationId);
  } else {
    rule.excludeDestinationIds = [...rule.excludeDestinationIds, destinationId];
  }
  return next;
}

export function setRuleDestinations(
  world: StorageWorld,
  ruleId: string,
  destinationIds: string[],
): StorageWorld {
  const next = cloneWorld(world);
  const rule = next.profile.rules.find((item) => item.id === ruleId);
  if (!rule) return next;
  const seen = new Set<string>();
  rule.destinationIds = destinationIds.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return next;
}

export function addRule(world: StorageWorld, rule: RoutingRule): StorageWorld {
  const next = cloneWorld(world);
  if (next.profile.rules.some((item) => item.id === rule.id)) return next;
  next.profile.rules = [...next.profile.rules, rule];
  return next;
}

export function removeRule(world: StorageWorld, ruleId: string): StorageWorld {
  const next = cloneWorld(world);
  next.profile.rules = next.profile.rules.filter((rule) => rule.id !== ruleId);
  return next;
}

export function addCategory(world: StorageWorld, category: StorageCategory): StorageWorld {
  const next = cloneWorld(world);
  if (next.profile.categories.some((item) => item.id === category.id)) return next;
  next.profile.categories = [...next.profile.categories, category];
  return next;
}

export function removeCategory(world: StorageWorld, categoryId: string): StorageWorld {
  const next = cloneWorld(world);
  next.profile.categories = next.profile.categories.filter((category) => category.id !== categoryId);
  return next;
}

export function setReserve(world: StorageWorld, definitionId: string, keepInPack: number): StorageWorld {
  const next = cloneWorld(world);
  const keep = Math.max(0, Math.floor(keepInPack));
  const existing = next.profile.reserves.find((reserve) => reserve.definitionId === definitionId);
  if (keep === 0) {
    next.profile.reserves = next.profile.reserves.filter(
      (reserve) => reserve.definitionId !== definitionId,
    );
    return next;
  }
  if (existing) existing.keepInPack = keep;
  else next.profile.reserves = [...next.profile.reserves, { definitionId, keepInPack: keep }];
  return next;
}

export function setLotMarks(
  world: StorageWorld,
  lotId: string,
  marks: { favorite?: boolean; equipped?: boolean },
): StorageWorld {
  const next = cloneWorld(world);
  for (const container of next.containers) {
    const lot = container.lots.find((item) => item.id === lotId);
    if (!lot) continue;
    if (marks.favorite !== undefined) lot.favorite = marks.favorite;
    if (marks.equipped !== undefined) lot.equipped = marks.equipped;
    break;
  }
  return next;
}
