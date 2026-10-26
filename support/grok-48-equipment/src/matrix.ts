import { CATALOG } from "./catalog.ts";
import type { ItemDef } from "./types.ts";

export const MATRIX_TAGS = ["submerged", "no-cloak", "no-feet", "no-hands", "no-head", "incorporeal", "light-body"] as const;

export interface MatrixRow {
  id: string;
  name: string;
  category: ItemDef["category"];
  slot: string;
  hands: number;
  mastery: ItemDef["mastery"];
  needsTool: string;
  channels: string;
  bonusKey: string;
  claimsOffHand: boolean;
  freesTwoHand: boolean;
  canOpenKeyedDoor: false;
  canLightWithoutLantern: false;
  forms: Record<(typeof MATRIX_TAGS)[number], "active" | "suppressed">;
  conflicts: number;
}

function conflictCount(item: ItemDef): number {
  return CATALOG.filter((other) => {
    if (other.id === item.id) return false;
    if (item.slot === "attachment") return other.attachesTo != null && other.attachesTo === item.attachesTo;
    return other.slot === item.slot;
  }).length;
}

export function compatibilityMatrix(): MatrixRow[] {
  return CATALOG.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    slot: item.slot,
    hands: item.hands,
    mastery: item.mastery,
    needsTool: item.attachesTo ?? "",
    channels: item.channels.join(", "),
    bonusKey: item.bonusKey ?? "",
    claimsOffHand: item.claimsOffHand,
    freesTwoHand: item.freesTwoHand,
    canOpenKeyedDoor: false,
    canLightWithoutLantern: false,
    forms: Object.fromEntries(
      MATRIX_TAGS.map((tag) => [tag, item.suppressedBy.includes(tag) ? "suppressed" : "active"]),
    ) as MatrixRow["forms"],
    conflicts: conflictCount(item),
  }));
}
