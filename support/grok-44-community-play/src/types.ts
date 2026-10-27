/** Community-play contracts. Other minigame sessions are not imported here. */

export const ERA_IDS = ["first-turning", "the-return"] as const;
export type EraId = (typeof ERA_IDS)[number];

export const RIVAL_IDS = [
  "marigold-vesper",
  "calder-brunt",
  "inez-pell",
  "hollis-quinn",
  "juniper-hale",
  "theo-march",
  "sable-okoye",
  "ruth-bellamy",
  "pete-lang",
  "agnes-crowell",
  "lenny-voss",
  "willa-crane",
] as const;
export type RivalId = (typeof RIVAL_IDS)[number];

export const FESTIVAL_IDS = [
  "sap-night",
  "river-sunday",
  "grange-fair",
  "frost-walk",
  "harvest-supper",
  "solstice-hearth",
] as const;
export type FestivalId = (typeof FESTIVAL_IDS)[number];

export const MODULE_IDS = [
  "cards",
  "cooking",
  "fishing",
  "tracking",
  "music",
  "traversal",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export type ApproachId = "careful" | "bold" | "generous" | "withholding";

export type OutcomeId =
  | "excelled"
  | "managed"
  | "faltered"
  | "withdrew"
  | "accessible-complete";

export type Tone = "warm" | "mixed" | "sour";

export type Stance =
  | "untested"
  | "competing"
  | "respect"
  | "tenderness"
  | "grievance"
  | "rupture";

export type IntegrationStatus = "live" | "fixture-pending";
export type ResultSource = "live-module" | "authored-fixture";

export type Line = { speaker: string; text: string };

export type RivalEffect = {
  rivalId: RivalId;
  delta: number;
  line: string;
  flag?: string;
};

export type Decision = {
  id: string;
  label: string;
  approach: ApproachId;
  detail: string;
  outcome: OutcomeId;
  eraOutcome?: Partial<Record<EraId, OutcomeId>>;
  narrative: string;
  eraNarrative?: Partial<Record<EraId, string>>;
  effects: RivalEffect[];
  /** When set for an era, replaces `effects` for that era. */
  eraEffects?: Partial<Record<EraId, RivalEffect[]>>;
  flags?: string[];
};

export type ActivityDef = {
  id: string;
  title: string;
  moduleId: ModuleId;
  scene: string;
  eraScene?: Partial<Record<EraId, string>>;
  accessible: {
    id: string;
    label: string;
    why: string;
    eraNote?: Partial<Record<EraId, string>>;
  };
  decisions: Decision[];
};

export type PrizeWhen = "finish" | "tone-warm" | "tone-not-sour" | "activity" | "flag";

export type PrizeRule = {
  rewardId: string;
  when: PrizeWhen;
  activityId?: string;
  outcomes?: OutcomeId[];
  flag?: string;
  eraId?: EraId;
};

export type FestivalDef = {
  id: FestivalId;
  name: string;
  seasonLabel: string;
  openWeek: number;
  place: string;
  hostRivalId: RivalId;
  hostTitle: string;
  rivals: RivalId[];
  activities: ActivityDef[];
  intro: Record<EraId, Line[]>;
  closing: Record<EraId, Record<Tone, Line[]>>;
  eraChanges: Record<EraId, string>;
  prizes: PrizeRule[];
  onDecline: RivalEffect[];
  untold: string;
};

export type RivalEra = {
  age: number;
  role: string;
  behavior: string;
  greeting: string;
};

export type RivalDef = {
  id: RivalId;
  name: string;
  short: string;
  epithet: string;
  wants: string;
  voice: string;
  competesOver: string;
  ties: Array<{ rivalId: RivalId; nature: string }>;
  eras: Record<EraId, RivalEra>;
};

export type RivalState = {
  bond: number;
  flags: string[];
  lastLine: string;
};

export type PlayerChoice = {
  decisionId: string;
  useAccessible: boolean;
};

export type ActivityResult = {
  activityId: string;
  moduleId: ModuleId;
  source: ResultSource;
  integration: IntegrationStatus;
  fixtureLabel: string | null;
  decisionId: string | null;
  approach: ApproachId | null;
  useAccessible: boolean;
  outcome: OutcomeId;
  narrative: string;
  rivalLines: Array<{ rivalId: RivalId; line: string; delta: number; flag?: string }>;
  flags: string[];
};

export type InProgress = {
  festivalId: FestivalId;
  eraId: EraId;
  phase: "intro" | "activity" | "closing";
  activityIndex: number;
  results: ActivityResult[];
  /** Restored if the gathering is abandoned, so a rehearsal cannot farm bonds. */
  checkpoint: {
    rivals: Record<RivalId, RivalState>;
    storyFlags: string[];
  };
};

export type RewardKind =
  | "trophy"
  | "object"
  | "sketch"
  | "tune"
  | "letter"
  | "relationship";

export type InterpretationTone = "fair" | "inflated" | "wrong";

export type RewardDef = {
  id: string;
  name: string;
  kind: RewardKind;
  blurb: string;
  letter?: { from: string; body: string; sealUntilReturn?: boolean };
  sketch?: { creature: string; ellisNote: string; willaDispute: string };
  tuneId?: string;
  interpretation: {
    defaultTone: InterpretationTone;
    fair: string;
    inflated: string;
    wrong: string;
  };
};

export type RewardGrant = {
  rewardId: string;
  eraId: EraId;
  festivalId: FestivalId;
  tone: Tone;
};

export type Amendment = "leave" | "amend" | "take-down";

export type MemoryRoomState = {
  trophies: Array<string | null>;
  objects: Array<string | null>;
  sketches: Array<string | null>;
  pinnedLetterId: string | null;
  stoolTuneId: string | null;
  amendments: Record<string, Amendment>;
};

export type AttendedRecord = {
  festivalId: FestivalId;
  eraId: EraId;
  tone: Tone;
  prizeIds: string[];
  results: ActivityResult[];
};

export type SaveData = {
  version: 1;
  eraId: EraId;
  townWeek: number;
  attended: Record<string, AttendedRecord>;
  declined: string[];
  rivals: Record<RivalId, RivalState>;
  grants: RewardGrant[];
  storyFlags: string[];
  memory: MemoryRoomState;
  inProgress: InProgress | null;
  lettersRead: string[];
};

export type ActivityLaunch = {
  moduleId: ModuleId;
  festivalId: FestivalId;
  activityId: string;
  eraId: EraId;
  seed: string;
  prompt: string;
  accessibleVariantId?: string;
};

export type LivePlayInput = {
  launch: ActivityLaunch;
  choice: PlayerChoice;
};

export type LivePlayOutput = {
  outcome: OutcomeId;
  narrative: string;
  rivalLines: Array<{ rivalId: RivalId; line: string; delta: number; flag?: string }>;
  flags?: string[];
};

/** A real minigame session may register one of these. This package never fakes one. */
export type LiveMinigameModule = {
  moduleId: ModuleId;
  ownerHint: string;
  play: (input: LivePlayInput) => LivePlayOutput;
};
