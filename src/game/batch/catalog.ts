import type { Category, ContainerId, EquipSlot, ItemKind } from "./types.ts";

export interface SalvagePart {
  defId: string;
  quantity: number;
}

export interface ItemDef {
  id: string;
  nameKey: string;
  kind: ItemKind;
  category: Category;
  /** Marks paid per unit. */
  sellEach: number;
  /** Chapter reputation per unit. */
  donateEach: number;
  salvage: SalvagePart[];
  equipSlot: EquipSlot | null;
  /** Stacks may be split. Uniques are always quantity 1. */
  partial: boolean;
}

export const CONTAINERS: ContainerId[] = [
  "pack",
  "stash",
  "equipped",
  "project-lantern",
  "quest-satchel",
  "vendor",
  "void",
];

export const DEFS: Record<string, ItemDef> = {
  rivet: {
    id: "rivet",
    nameKey: "item.rivet",
    kind: "stack",
    category: "materials",
    sellEach: 2,
    donateEach: 1,
    salvage: [{ defId: "scrap-iron", quantity: 1 }],
    equipSlot: null,
    partial: true,
  },
  resin: {
    id: "resin",
    nameKey: "item.resin",
    kind: "stack",
    category: "materials",
    sellEach: 4,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  oil: {
    id: "oil",
    nameKey: "item.oil",
    kind: "stack",
    category: "provisions",
    sellEach: 5,
    donateEach: 2,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  biscuit: {
    id: "biscuit",
    nameKey: "item.biscuit",
    kind: "stack",
    category: "provisions",
    sellEach: 3,
    donateEach: 2,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  "scrap-iron": {
    id: "scrap-iron",
    nameKey: "item.scrap-iron",
    kind: "stack",
    category: "materials",
    sellEach: 1,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  "cloth-scrap": {
    id: "cloth-scrap",
    nameKey: "item.cloth-scrap",
    kind: "stack",
    category: "materials",
    sellEach: 1,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  buckle: {
    id: "buckle",
    nameKey: "item.buckle",
    kind: "stack",
    category: "materials",
    sellEach: 6,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  "glass-shard": {
    id: "glass-shard",
    nameKey: "item.glass-shard",
    kind: "stack",
    category: "materials",
    sellEach: 4,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  "brass-ring": {
    id: "brass-ring",
    nameKey: "item.brass-ring",
    kind: "stack",
    category: "materials",
    sellEach: 7,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  "brass-scrap": {
    id: "brass-scrap",
    nameKey: "item.brass-scrap",
    kind: "stack",
    category: "materials",
    sellEach: 3,
    donateEach: 1,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  tag: {
    id: "tag",
    nameKey: "item.tag",
    kind: "stack",
    category: "materials",
    sellEach: 0,
    donateEach: 0,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
  lens: {
    id: "lens",
    nameKey: "item.lens",
    kind: "named",
    category: "named",
    sellEach: 80,
    donateEach: 8,
    salvage: [
      { defId: "glass-shard", quantity: 1 },
      { defId: "brass-ring", quantity: 1 },
    ],
    equipSlot: null,
    partial: false,
  },
  wax: {
    id: "wax",
    nameKey: "item.wax",
    kind: "named",
    category: "named",
    sellEach: 15,
    donateEach: 3,
    salvage: [],
    equipSlot: null,
    partial: false,
  },
  fresnel: {
    id: "fresnel",
    nameKey: "item.fresnel",
    kind: "named",
    category: "named",
    sellEach: 0,
    donateEach: 0,
    salvage: [],
    equipSlot: null,
    partial: false,
  },
  coat: {
    id: "coat",
    nameKey: "item.coat",
    kind: "gear",
    category: "gear",
    sellEach: 40,
    donateEach: 4,
    salvage: [
      { defId: "cloth-scrap", quantity: 3 },
      { defId: "buckle", quantity: 1 },
    ],
    equipSlot: "body",
    partial: false,
  },
  whistle: {
    id: "whistle",
    nameKey: "item.whistle",
    kind: "gear",
    category: "gear",
    sellEach: 25,
    donateEach: 2,
    salvage: [{ defId: "brass-scrap", quantity: 1 }],
    equipSlot: "tool",
    partial: false,
  },
  gears: {
    id: "gears",
    nameKey: "item.gears",
    kind: "reservation",
    category: "reservations",
    sellEach: 0,
    donateEach: 0,
    salvage: [],
    equipSlot: null,
    partial: false,
  },
  waybill: {
    id: "waybill",
    nameKey: "item.waybill",
    kind: "evidence",
    category: "evidence",
    sellEach: 0,
    donateEach: 0,
    salvage: [],
    equipSlot: null,
    partial: false,
  },
  mud: {
    id: "mud",
    nameKey: "item.mud",
    kind: "evidence",
    category: "evidence",
    sellEach: 0,
    donateEach: 0,
    salvage: [],
    equipSlot: null,
    partial: false,
  },
  seals: {
    id: "seals",
    nameKey: "item.seals",
    kind: "evidence",
    category: "evidence",
    sellEach: 0,
    donateEach: 0,
    salvage: [],
    equipSlot: null,
    partial: true,
  },
};

export function defOf(defId: string): ItemDef {
  const def = DEFS[defId];
  if (!def) throw new Error(`unknown def ${defId}`);
  return def;
}
