/** Equipment contract for PREINCARNATION.
 * Tools, keys, and form transformations are owned by other sessions.
 * This module only reads them. It never grants a key or a mandatory tool.
 */

export const TOOL_IDS = [
  "tool.quarry.wedge",
  "tool.quarry.pry",
  "tool.quarry.maul",
  "tool.creek.net",
  "tool.creek.channel",
  "tool.creek.staff",
  "tool.sugar.brush",
  "tool.sugar.hook",
  "tool.sugar.jar",
  "tool.ash.scoop",
  "tool.ash.censer",
  "tool.ash.brand",
  "tool.lantern.body",
  "tool.lantern.wick",
  "tool.lantern.mirror",
  "tool.hollow.horn",
  "tool.hollow.veil",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type Mastery = "quarry" | "creek" | "sugar" | "ash" | "lantern" | "hollow";

export type Category = "mainHand" | "wearable" | "trinket" | "toolAttachment" | "utility";

export type BodySlot =
  | "mainHand"
  | "head"
  | "torso"
  | "waist"
  | "hands"
  | "feet"
  | "cloak"
  | "trinket"
  | "utility";

export type ItemSlot = BodySlot | "attachment";

export type Silhouette =
  | "blade"
  | "long"
  | "blunt"
  | "fan"
  | "cloth"
  | "band"
  | "foot"
  | "hand"
  | "head"
  | "charm"
  | "mesh"
  | "hook"
  | "kit"
  | "stake"
  | "board";

export interface ItemDef {
  id: string;
  index: number;
  name: string;
  category: Category;
  slot: ItemSlot;
  hands: 0 | 1 | 2;
  mastery: Mastery;
  silhouette: Silhouette;
  mark: string;
  purpose: string;
  channels: readonly string[];
  bonusKey: string | null;
  chargeMax: number | null;
  attachesTo: ToolId | null;
  claimsOffHand: boolean;
  freesTwoHand: boolean;
  suppressedBy: readonly string[];
  spotlight: boolean;
}

export interface FormRef {
  id: string;
  tags: string[];
}

export interface SafeMark {
  x: number;
  y: number;
  frozen: boolean;
}

export interface Session {
  v: 2;
  slots: Partial<Record<BodySlot, string>>;
  attachments: Partial<Record<ToolId, string>>;
  inventory: string[];
  lostAndFound: string[];
  mods: Record<string, string>;
  charges: Record<string, number>;
  form: FormRef;
  suppressed: string[];
  stowMemory: string[];
  safeMark: SafeMark | null;
  x: number;
  y: number;
  flagX: number | null;
  flagY: number | null;
  storedProjectile: { tag: string } | null;
  grainPin: string | null;
  warmthCharged: boolean;
  ashLiberated: boolean;
  lanternLocation: "carried" | "staked" | "absent";
  alive: boolean;
  tools: Record<ToolId, boolean>;
  hasKey: boolean;
  compassDir: string | null;
  standingOnArmedFault: boolean;
}

export type ActionKind =
  | "survey"
  | "counter"
  | "block"
  | "release"
  | "shove"
  | "net"
  | "wedge"
  | "door"
  | "dark"
  | "stake"
  | "unstake"
  | "listen"
  | "horn"
  | "veil"
  | "snuff"
  | "explore"
  | "mark";

export interface Action {
  kind: ActionKind;
  counterMs?: number;
  facing?: string;
  projectileTag?: string;
  seam?: "square" | "slanted";
  submerged?: boolean;
  inCombat?: boolean;
  hitstun?: boolean;
  atRest?: boolean;
  smoke?: boolean;
  rolling?: boolean;
  secondTap?: boolean;
  turnAround?: boolean;
  useCharge?: boolean;
  strikeClapper?: boolean;
  heavyOnThread?: boolean;
  missed?: boolean;
  scoopUsed?: boolean;
  useStaff?: boolean;
  useChannel?: boolean;
  useHorn?: boolean;
  useJar?: boolean;
  useBrand?: boolean;
  removeLantern?: boolean;
}

export type FactValue = string | number | boolean;
export type Facts = Record<string, FactValue>;

export interface EffectOut {
  facts?: Facts;
  tell?: string;
  spend?: boolean;
}

export type EquipResult =
  | { ok: true; session: Session }
  | { ok: false; reason: string; session: Session };

export const SAVE_VERSION = 2;

export const SAMPLE_FORMS: FormRef[] = [
  { id: "form.walker", tags: [] },
  { id: "form.wader", tags: ["submerged"] },
  { id: "form.burrow", tags: ["no-cloak"] },
  { id: "form.perch", tags: ["no-feet"] },
  { id: "form.ashen", tags: ["incorporeal", "no-hands"] },
  { id: "form.lantern-borne", tags: ["light-body"] },
];
