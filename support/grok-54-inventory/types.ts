export type ItemKind =
  | "physical"
  | "equipment"
  | "crafting"
  | "food"
  | "collectible"
  | "narrative"
  | "quest";

export type Protection = "none" | "quest" | "story";
export type Heft = "light" | "moderate" | "heavy";
export type EquipSlot = "body" | "hand" | "neck" | "belt";
export type ContainerId = "pack" | "hearth" | "display" | "equipped";
export type Era = "before" | "interval" | "after";
export type ContentClass = "authored" | "fixture";
export type UseVisibility = "known" | "learnable";
export type Verb =
  | "use"
  | "equip"
  | "eat"
  | "craft"
  | "display"
  | "modify"
  | "inspect"
  | "plant"
  | "drink";

export type ItemUse = {
  id: string;
  verb: Verb;
  label: string;
  where: string;
  visibility: UseVisibility;
};

export type ItemDef = {
  id: string;
  name: string;
  kind: ItemKind;
  contentClass: ContentClass;
  heft: Heft;
  stackLimit: number;
  unique: boolean;
  protection: Protection;
  dismantlable: boolean;
  modifiable: boolean;
  slot?: EquipSlot;
  stats?: Partial<Record<"warmth" | "grip" | "care" | "reach", number>>;
  tags: string[];
  summary: string;
  uses: ItemUse[];
  setId?: string;
  setName?: string;
};

export type Provenance = {
  era: Era;
  place: string;
  note: string;
  yearLabel: string;
};

export type ItemInstance = {
  instanceId: string;
  defId: string;
  qty: number;
  container: ContainerId;
  slot?: EquipSlot;
  favorite: boolean;
  condition: number;
  provenance: Provenance;
  learnedUseIds: string[];
  acquiredAt: number;
  keptThroughInterval: boolean;
};

export type GroundStack = {
  groundId: string;
  defId: string;
  qty: number;
  provenance: Provenance;
  condition: number;
};

export type ViewId =
  | "pack"
  | "hearth"
  | "display"
  | "collection"
  | "recipes"
  | "checks";

export type SortKey = "name" | "kind" | "qty" | "recent" | "heft" | "favorite";
export type ContentFilter = "authored" | "fixture" | "all";

export type Caps = { pack: number; hearth: number; display: number };

export type Pending =
  | { kind: "modify"; id: string }
  | { kind: "dismantle"; ids: string[] };

export type InventoryState = {
  instances: ItemInstance[];
  ground: GroundStack[];
  discovered: string[];
  pending: Pending | null;
  focusedId: string | null;
  cursor: number;
  selected: string[];
  batch: boolean;
  view: ViewId;
  content: ContentFilter;
  query: string;
  sort: SortKey;
  kind: ItemKind | "all";
  favoritesOnly: boolean;
  protectedOnly: boolean;
  atHearth: boolean;
  noticeSeq: number;
  nextSerial: number;
  caps: Caps;
};

export type NoticeTone = "info" | "discover" | "warn" | "ok";

export type InventoryNotice = {
  id: number;
  tone: NoticeTone;
  text: string;
};

export type Effect =
  | { type: "notice"; notice: InventoryNotice }
  | { type: "homestead"; text: string };

export type CarryReport = {
  packSlots: number;
  packCap: number;
  hearthSlots: number;
  hearthCap: number;
  displaySlots: number;
  displayCap: number;
  heavyInPack: number;
  purpose: string;
};

export type PlayerUse = {
  id: string;
  verb: Verb;
  label: string;
  where: string;
  confirmed: boolean;
};

export type PlayerItem = {
  instanceId: string;
  defId: string;
  name: string;
  kind: ItemKind;
  contentClass: ContentClass;
  heft: Heft;
  qty: number;
  container: ContainerId;
  slot?: EquipSlot;
  favorite: boolean;
  condition: number;
  protection: Protection;
  dismantlable: boolean;
  modifiable: boolean;
  summary: string;
  uses: PlayerUse[];
  unconfirmed: number;
  storyWithheld: number;
  provenance: Provenance;
  keptThroughInterval: boolean;
  setId?: string;
  setName?: string;
  tags: string[];
  stats?: ItemDef["stats"];
};

export type RecipeIngredient = {
  defId: string;
  qty: number;
  consume: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  station: "hearth" | "pack";
  ingredients: RecipeIngredient[];
  resultDefId: string;
  resultQty: number;
  known: boolean;
  blurb: string;
};

export type RecipeLine = {
  defId: string;
  name: string;
  need: number;
  have: number;
  consume: boolean;
};

export type RecipeView = {
  id: string;
  name: string;
  station: "hearth" | "pack";
  blurb: string;
  lines: RecipeLine[];
  ready: boolean;
  reason: string;
  resultName: string;
};

export type Action =
  | { type: "search"; query: string }
  | { type: "sort"; sort: SortKey }
  | { type: "kind"; kind: ItemKind | "all" }
  | { type: "content"; content: ContentFilter }
  | { type: "favoritesOnly"; on: boolean }
  | { type: "protectedOnly"; on: boolean }
  | { type: "view"; view: ViewId }
  | { type: "focus"; id: string | null }
  | { type: "move"; dir: -1 | 1 | "pageup" | "pagedown" | "home" | "end" }
  | { type: "toggle-batch" }
  | { type: "toggle-select"; id: string }
  | { type: "clear-selection" }
  | { type: "favorite"; id: string }
  | { type: "pickup"; groundId: string }
  | { type: "stash"; id: string }
  | { type: "withdraw"; id: string }
  | { type: "display"; id: string }
  | { type: "undisplay"; id: string }
  | { type: "equip"; id: string }
  | { type: "unequip"; id: string }
  | { type: "use"; id: string }
  | { type: "inspect"; id: string }
  | { type: "begin-modify"; id: string }
  | { type: "begin-dismantle"; ids: string[] }
  | { type: "confirm-pending" }
  | { type: "cancel-pending" }
  | { type: "batch-stash" }
  | { type: "batch-favorite" }
  | { type: "craft"; recipeId: string }
  | { type: "toggle-hearth" }
  | { type: "reincarnate" }
  | { type: "reset" }
  | { type: "display-set"; setId: string };

export type SkipReason =
  | "Protected"
  | "Favorite"
  | "Authored"
  | "Worn"
  | "Not dismantlable";

export type DismantlePlan = {
  ok: ItemInstance[];
  skipped: { inst: ItemInstance; reason: SkipReason }[];
};

export const CARRY_PURPOSE =
  "The pack is for what you want at hand. Overflow files itself at the hearth. Heft is noted and never slows you.";

export const VIEWS: ViewId[] = [
  "pack",
  "hearth",
  "display",
  "collection",
  "recipes",
  "checks",
];

export const VIEW_LABEL: Record<ViewId, string> = {
  pack: "Pack",
  hearth: "Hearth",
  display: "Shelf",
  collection: "Collection",
  recipes: "Recipes",
  checks: "Checks",
};

export const KIND_LABEL: Record<ItemKind, string> = {
  physical: "Thing",
  equipment: "Gear",
  crafting: "Craft",
  food: "Food",
  collectible: "Kept",
  narrative: "Story",
  quest: "Quest",
};

export const SLOT_LABEL: Record<EquipSlot, string> = {
  body: "Body",
  hand: "Hand",
  neck: "Neck",
  belt: "Belt",
};

export const STAT_LABEL: Record<"warmth" | "grip" | "care" | "reach", string> = {
  warmth: "Warmth",
  grip: "Grip",
  care: "Care",
  reach: "Reach",
};
