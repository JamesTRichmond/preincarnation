/** Household loot types. This pack does not own letters, music, or the display wall. */

export type Era = "settlement" | "homestead" | "memory";

export type Category =
  "lamp" | "instrument" | "chime" | "tray" | "container" | "clock" | "worksurface" | "memento";

export type InteractionKind =
  "illumination" | "sound" | "organization" | "serve" | "history" | "craft" | "visitor";

export type Footprint = "small" | "medium" | "wide";

export type AnchorTag = "floor" | "wall" | "hearth" | "porch" | "table" | "shelf" | "work";

export type Rotation = 0 | 90 | 180 | 270;

export interface AcceptRule {
  /** Item tags that may be stowed. */
  tags?: string[];
  /** Catalog categories that may be stowed. */
  categories?: Category[];
  /** Pantry food ids that may be tucked away (existing food only). */
  foods?: string[];
  /** Craft-token tags that may be tucked away. */
  tokenTags?: string[];
}

export interface CatalogItem {
  id: string;
  n: number;
  name: string;
  category: Category;
  interaction: InteractionKind;
  summary: string;
  history: Record<Era, string>;
  footprint: Footprint;
  rotatable: boolean;
  /** Wide or fixed pieces that would seal the door if put in the exit. */
  blocksExit: boolean;
  providesSupport: boolean;
  requiresSupport: boolean;
  anchorTags: AnchorTag[];
  /** Eras in which the primary verb still works. Identity remains in every era. */
  eras: Era[];
  tags: string[];
  brightness?: number;
  /** Stable lamps do not gutter when the window is opened. */
  stableInBreeze?: boolean;
  /** Set only by the betty lamp — names the work, never a stat bonus. */
  workLight?: boolean;
  reveal?: { id: string; text: string };
  revealByEra?: Partial<Record<Era, string>>;
  /** When lit, offer this id to the homestead letters host. */
  lettersOffer?: string;
  /** Extra line folded into the light message if a visitor is present. */
  lightVisitorLine?: string;
  motif?: string;
  needsBreeze?: boolean;
  windable?: boolean;
  /** Memory glass clock: the hour is the memory and will not take a wind. */
  frozenHour?: number;
  /** Water clock stops speaking after this many drips. */
  dripMax?: number;
  strikeVisitorLine?: string;
  accept?: AcceptRule;
  foods?: string[];
  serveVisitorLine?: string;
  yieldName?: string;
  yieldTags?: string[];
  consumesFood?: string;
  /** Name a textile sharing the anchor, without consuming it. */
  namesTextile?: boolean;
  visitorLine?: string;
  greetWrites?: "chalk" | "signature";
  /** Alarm tin arms itself instead of greeting outright. */
  arms?: boolean;
  /** Sun-mark: one alignment, not a wound spring. */
  aligns?: boolean;
  /** Chamberstick names whatever shares its surface. */
  namesCompanions?: boolean;
}

export interface Anchor {
  id: string;
  label: string;
  x: number;
  y: number;
  tags: AnchorTag[];
  capacity: number;
  builtInSupport: boolean;
  exit: boolean;
  /** Room controls this anchor covers when anything sits here. */
  covers: string[];
  /** Overflow place used when a support is removed. Not part of the pretty layouts. */
  overflow: boolean;
}

export interface ControlPoint {
  id: string;
  label: string;
}

export interface FoodPortion {
  id: string;
  name: string;
  portions: number;
}

export interface CraftToken {
  id: string;
  name: string;
  tags: string[];
  originInstanceId: string;
}

export interface HeldFood {
  foodId: string;
  portions: number;
}

export interface InstanceState {
  lit: boolean;
  wind: number;
  drips: number;
  aligned: boolean;
  armed: boolean;
  inspected: boolean;
  craftDone: boolean;
  visitorAck: boolean;
  chalk: string | null;
  signatures: string[];
  heldInstanceIds: string[];
  heldTokenIds: string[];
  heldFood: HeldFood[];
  served: HeldFood[];
  hour: number | null;
}

export interface PlacedObject {
  instanceId: string;
  catalogId: string;
  roomId: string;
  anchorId: string | null;
  rotation: Rotation;
  supportInstanceId: string | null;
  containerInstanceId: string | null;
  packed: boolean;
  displaySlot: string | null;
  state: InstanceState;
}

export interface RoomSave {
  version: number;
  roomId: string;
  era: Era;
  breeze: boolean;
  visitorPresent: boolean;
  visitorName: string;
  pantry: FoodPortion[];
  tokens: CraftToken[];
  instances: PlacedObject[];
  notes: string[];
}

export interface HomesteadHost {
  letters?: { open(letterId: string, sourceInstanceId: string): void };
  music?: { cue(motifId: string, sourceInstanceId: string): void };
  display?: { focus(slotId: string, instanceId: string): void };
}

export interface HostCall {
  system: "letters" | "music" | "display";
  action: string;
  ref: string;
  sourceInstanceId: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  save: RoomSave;
  motif?: string;
  muted?: boolean;
  hostCalls: HostCall[];
  effect: string;
}

export interface SharedBinding {
  instanceId: string;
  roomId: string;
  anchorId: string | null;
  rotation: Rotation;
  supportInstanceId: string | null;
  containerInstanceId: string | null;
  displaySlot: string | null;
  packed: boolean;
}

export const ROOM_ID = "room.ash-bend";
export const SAVE_VERSION = 1;
export const SAVE_KEY = "preincarnation.loot.household.room.ash-bend";
export const PACK_ID = "grok-75-household-loot";
export const VISITOR_NAME = "Mara Ell";

export const DISPLAY_SLOTS = [
  "display.mantel-memory",
  "display.letter-stand",
  "display.window",
] as const;

export type DisplaySlot = (typeof DISPLAY_SLOTS)[number];

export function catalogId(n: number): string {
  return `loot.expansion.home.${String(n).padStart(3, "0")}`;
}

export function instanceIdFor(catalog: string): string {
  return `inst.${catalog}`;
}

export function emptyState(hour: number | null = null): InstanceState {
  return {
    lit: false,
    wind: 0,
    drips: 0,
    aligned: false,
    armed: false,
    inspected: false,
    craftDone: false,
    visitorAck: false,
    chalk: null,
    signatures: [],
    heldInstanceIds: [],
    heldTokenIds: [],
    heldFood: [],
    served: [],
    hour,
  };
}
