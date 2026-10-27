/** Cross-item ids. Iron shares a pocket with the dry compass and spoils a bearing. */

export const ID = {
  bird: "loot.expansion.gadget.001",
  spring: "loot.expansion.gadget.016",
  prism: "loot.expansion.gadget.017",
  collimator: "loot.expansion.gadget.023",
  arc: "loot.expansion.gadget.032",
  resonator: "loot.expansion.gadget.033",
  recorder: "loot.expansion.gadget.034",
  fork: "loot.expansion.gadget.042",
  weight: "loot.expansion.gadget.049",
  wrench: "loot.expansion.gadget.052",
  key: "loot.expansion.gadget.053",
  chain: "loot.expansion.gadget.062",
  pennies: "loot.expansion.gadget.063",
  pads: "loot.expansion.gadget.064",
  halfChain: "loot.expansion.gadget.065",
  compass: "loot.expansion.gadget.069",
  barometer: "loot.expansion.gadget.070",
  cup: "loot.expansion.gadget.072",
  calipers: "loot.expansion.gadget.073",
  borer: "loot.expansion.gadget.074",
  level: "loot.expansion.gadget.075",
  refractor: "loot.expansion.gadget.078",
  book: "loot.expansion.gadget.080",
} as const;

export const IRON_IDS = new Set<string>([
  "loot.expansion.gadget.051",
  "loot.expansion.gadget.052",
  "loot.expansion.gadget.057",
  "loot.expansion.gadget.059",
  "loot.expansion.gadget.062",
  "loot.expansion.gadget.065",
]);

export function lootId(n: number): string {
  return `loot.expansion.gadget.${String(n).padStart(3, "0")}`;
}
