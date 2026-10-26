import type {
  Category,
  EquipSlot,
  ItemDefinition,
  ItemInstance,
  LootState,
  Owner,
  ResolvedContent,
} from "./types.ts";
import { EQUIP_SLOTS } from "./types.ts";

export const BASE_CARRY = 26;

export function emptyState(): LootState {
  return {
    version: 1,
    clock: 0,
    idCounter: 1,
    purse: 0,
    traderPurse: 0,
    instances: {},
    owners: {},
    equipment: {},
    placements: {},
    journal: [],
    evidence: [],
    handoffs: [],
    markers: [],
    flags: {},
    deaths: [],
    log: [],
    actor: {
      name: "Ellis Perch",
      satiety: 62,
      warmth: 55,
      light: 0,
      calm: 48,
      disposition: {},
    },
  };
}

export function mustInstance(state: LootState, id: string): ItemInstance {
  const inst = state.instances[id];
  if (!inst) {
    throw new Error(`Missing instance ${id}`);
  }
  return inst;
}

export function ownerOf(state: LootState, id: string): Owner {
  const owner = state.owners[id];
  if (!owner) throw new Error(`Missing owner for ${id}`);
  return owner;
}

export function itemsIn(state: LootState, kind: Owner["kind"]): ItemInstance[] {
  return Object.values(state.instances).filter((inst) => state.owners[inst.id]?.kind === kind);
}

export function findByDefinition(state: LootState, definitionId: string): ItemInstance[] {
  return Object.values(state.instances).filter((inst) => inst.definitionId === definitionId);
}

export function protectionOf(def: ItemDefinition, inst: ItemInstance): "none" | "quest" | "essential" {
  return inst.protection ?? def.protection;
}

export function unitWeight(def: ItemDefinition): number {
  return def.weight;
}

export function stackWeight(def: ItemDefinition, quantity: number): number {
  return def.weight * quantity;
}

export function conditionFactor(condition: number | null): number {
  if (condition == null) return 1;
  return 0.45 + 0.55 * (Math.max(0, Math.min(100, condition)) / 100);
}

export function unitValue(def: ItemDefinition, condition: number | null): number {
  return Math.max(0, Math.round(def.value * conditionFactor(condition)));
}

export function isPlayerOwner(owner: Owner): boolean {
  return owner.kind !== "trader";
}

/** Worn gear and the pack both count. Stash, bench, and the stall do not. */
export function countsTowardCarry(owner: Owner): boolean {
  return owner.kind === "carry" || owner.kind === "equipped";
}

export function carryWeight(state: LootState, content: ResolvedContent): number {
  let total = 0;
  for (const inst of Object.values(state.instances)) {
    const owner = state.owners[inst.id];
    if (!owner || !countsTowardCarry(owner)) continue;
    const def = content.definitions.get(inst.definitionId);
    if (!def) continue;
    total += def.weight * inst.quantity;
  }
  return round1(total);
}

export function carryLimit(state: LootState, content: ResolvedContent): number {
  let bonus = 0;
  const packId = state.equipment.back;
  if (packId) {
    const inst = state.instances[packId];
    const def = inst ? content.definitions.get(inst.definitionId) : undefined;
    if (def?.carryBonus) bonus += def.carryBonus;
  }
  return BASE_CARRY + bonus;
}

export interface DerivedPreview {
  carryWeight: number;
  carryLimit: number;
  satiety: number;
  warmth: number;
  /** Worn lantern, if any. Not a combat light. */
  lantern: number;
  /** Banked firelight from kindling or a torch. */
  bankedLight: number;
  calm: number;
  /** Preview edge from the worn blade. Mastery owns real hits. */
  edge: number;
  worn: Partial<Record<EquipSlot, string>>;
}

export function derivedPreview(state: LootState, content: ResolvedContent): DerivedPreview {
  let warmth = state.actor.warmth;
  let lantern = 0;
  let edge = 0;
  for (const slot of EQUIP_SLOTS) {
    const id = state.equipment[slot];
    if (!id) continue;
    const inst = state.instances[id];
    if (!inst) continue;
    const def = content.definitions.get(inst.definitionId);
    if (!def) continue;
    const sound = inst.condition == null || inst.condition > 15;
    if (sound && def.equippedEffect?.warmth) warmth += def.equippedEffect.warmth;
    if (slot === "light") {
      lantern = inst.condition != null && inst.condition >= 20 ? (def.equippedEffect?.light ?? 0) : 0;
    }
    if (slot === "main-hand" && def.tags.includes("bladed")) {
      const base = inst.condition == null ? 0 : Math.round(inst.condition / 10);
      edge = base + inst.modEdge;
    }
  }
  return {
    carryWeight: carryWeight(state, content),
    carryLimit: carryLimit(state, content),
    satiety: state.actor.satiety,
    warmth: clamp(warmth),
    lantern,
    bankedLight: state.actor.light,
    calm: state.actor.calm,
    edge,
    worn: { ...state.equipment },
  };
}

export function pieceCount(state: LootState): number {
  return Object.keys(state.instances).length;
}

export function playerPieceIds(state: LootState): string[] {
  return Object.values(state.instances)
    .filter((inst) => {
      const owner = state.owners[inst.id];
      return owner ? isPlayerOwner(owner) : false;
    })
    .map((inst) => inst.id)
    .sort();
}

export function countOwned(state: LootState, definitionId: string, kinds: Owner["kind"][]): number {
  let n = 0;
  for (const inst of Object.values(state.instances)) {
    if (inst.definitionId !== definitionId) continue;
    const owner = state.owners[inst.id];
    if (owner && kinds.includes(owner.kind)) n += inst.quantity;
  }
  return n;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function categoryLabel(category: Category): string {
  switch (category) {
    case "ordinary":
      return "Material";
    case "equipment":
      return "Gear";
    case "relic":
      return "Relic";
    case "ingredient":
      return "Field";
    case "card":
      return "Card";
    case "dish":
      return "Dish";
    case "trophy":
      return "Display";
    case "document":
      return "Paper";
    default:
      return category;
  }
}
