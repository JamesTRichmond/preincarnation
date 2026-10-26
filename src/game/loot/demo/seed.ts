import { grantItem } from "../src/dispatch.ts";
import { findByDefinition } from "../src/state.ts";
import { emptyState } from "../src/state.ts";
import { resolveContent } from "../src/content.ts";
import type { EquipSlot, LootState, ResolvedContent } from "../src/types.ts";
import { demoPack } from "./pack.ts";

export const demoContent: ResolvedContent = resolveContent(demoPack);

interface SeedPiece {
  definitionId: string;
  quantity: number;
  condition?: number;
  trader?: boolean;
}

const PIECES: SeedPiece[] = [
  { definitionId: "demo.ord.cut-nail", quantity: 12 },
  { definitionId: "demo.ord.slate-flake", quantity: 6 },
  { definitionId: "demo.ord.raw-wool", quantity: 5 },
  { definitionId: "demo.ord.beeswax-cake", quantity: 3 },
  { definitionId: "demo.ord.cedar-kindling", quantity: 8 },
  { definitionId: "demo.ord.river-clay", quantity: 4 },
  { definitionId: "demo.ord.iron-strap", quantity: 2 },
  { definitionId: "demo.ord.wax-torch", quantity: 1 },
  { definitionId: "demo.eq.perch-knife", quantity: 1, condition: 42 },
  { definitionId: "demo.eq.wool-cap", quantity: 1, condition: 68 },
  { definitionId: "demo.eq.barn-lantern", quantity: 1, condition: 22 },
  { definitionId: "demo.eq.pocket-hone", quantity: 1, condition: 80 },
  { definitionId: "demo.eq.canvas-pack", quantity: 1, condition: 75 },
  { definitionId: "demo.eq.brook-boots", quantity: 1, condition: 51 },
  { definitionId: "demo.ing.nightcrawlers", quantity: 4, condition: 70 },
  { definitionId: "demo.ing.chamomile-bunch", quantity: 3, condition: 90 },
  { definitionId: "demo.ing.creek-lure", quantity: 2 },
  { definitionId: "demo.ing.road-salt", quantity: 3 },
  { definitionId: "demo.rel.ellis-compass", quantity: 1 },
  { definitionId: "demo.rel.mother-locket", quantity: 1 },
  { definitionId: "demo.rel.baptist-key", quantity: 1 },
  { definitionId: "demo.card.covered-bridge", quantity: 1 },
  { definitionId: "demo.card.sugarhouse-night", quantity: 1 },
  { definitionId: "demo.dish.johnnycake", quantity: 2, condition: 64 },
  { definitionId: "demo.dish.cheddar-biscuit", quantity: 1, condition: 80 },
  { definitionId: "demo.trp.antler-plaque", quantity: 1 },
  { definitionId: "demo.trp.fern-press", quantity: 1 },
  { definitionId: "demo.trp.school-sundial", quantity: 1 },
  { definitionId: "demo.doc.perch-letter", quantity: 1 },
  { definitionId: "demo.doc.otter-creek-map", quantity: 1 },
  { definitionId: "demo.ord.cut-nail", quantity: 10, trader: true },
  { definitionId: "demo.ing.road-salt", quantity: 4, trader: true },
  { definitionId: "demo.ord.cedar-kindling", quantity: 8, trader: true },
  { definitionId: "demo.ord.raw-wool", quantity: 4, trader: true },
];

const WORN: { definitionId: string; slot: EquipSlot }[] = [
  { definitionId: "demo.eq.canvas-pack", slot: "back" },
  { definitionId: "demo.eq.perch-knife", slot: "main-hand" },
  { definitionId: "demo.eq.wool-cap", slot: "head" },
  { definitionId: "demo.rel.ellis-compass", slot: "trinket" },
];

export function createDemoState(content: ResolvedContent = demoContent): LootState {
  const state = emptyState();
  state.purse = 16;
  state.traderPurse = content.trader.purse;
  state.actor.name = "Ellis Perch";
  for (const piece of PIECES) {
    grantItem(state, content, {
      definitionId: piece.definitionId,
      quantity: piece.quantity,
      condition: piece.condition,
      owner: piece.trader ? { kind: "trader" } : { kind: "carry" },
      source: {
        kind: "seed",
        note: piece.trader ? "On Hale's board at the start of the demo." : "In the demo pack at open.",
        fromIds: [],
      },
    });
  }
  for (const worn of WORN) {
    const inst = findByDefinition(state, worn.definitionId).find(
      (item) => state.owners[item.id]?.kind === "carry",
    );
    if (!inst) throw new Error(`Demo seed is missing ${worn.definitionId}`);
    state.owners[inst.id] = { kind: "equipped", slot: worn.slot };
    state.equipment[worn.slot] = inst.id;
  }
  state.log = [
    {
      clock: 0,
      message:
        "Demo ledger opened. Thirty demonstration items are in the pack, worn, or on Hale's board. The production catalog is not loaded.",
    },
  ];
  return state;
}
