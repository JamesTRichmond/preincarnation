/** Public types for the Ferry Hearth music activity. */

export type InstrumentId = "fiddle" | "guitar" | "spoons";

export type Gesture = "lift" | "settle" | "stamp" | "hold";

export type Variant = "relaxed" | "mastery";

export type PlayMode = "practice" | "duet";

export type Grade = "together" | "early" | "late" | "slipped";

export type LineWho = "player" | "npc";

export type Line = {
  /** Set only when the piece declares an explicit duet. */
  who?: LineWho;
  gesture: Gesture;
  /** Readable teaching line. No note names required to play. */
  words: string;
  /** Original notation. See notation.ts. */
  notes: string;
};

export type Npc = {
  name: string;
  instrument: InstrumentId;
  manner: string;
};

export type Piece = {
  id: string;
  title: string;
  place: string;
  blurb: string;
  /** How the pulse feels, in ordinary words. */
  pulse: string;
  /** Steps per minute. A step is the piece's beat, not a theory term we show. */
  bpm: number;
  stepsPerBar: number;
  /** MIDI note number of the home pitch (60 = C4). */
  tonic: number;
  lead: InstrumentId;
  support: InstrumentId;
  featured: boolean;
  duet: "alternate" | "explicit";
  npc: Npc;
  lines: Line[];
};

export type MotifNote = {
  /** Steps after the cue (or after the sound's own step, for auto notes this is 0). */
  step: number;
  /** -1 is an unpitched knock (spoons, or a tap if another instrument voices it). */
  midi: number;
  dur: number;
  velocity: number;
};

export type Cue = {
  id: string;
  step: number;
  gesture: Gesture;
  words: string;
  /** Who the player is answering, for the lane label. */
  asker: string;
  motif: MotifNote[];
  /** 0 means a tap. Above 0, the pad should stay down. */
  holdSteps: number;
};

export type AutoSound = {
  id: string;
  step: number;
  midi: number;
  dur: number;
  velocity: number;
  instrument: InstrumentId;
  detuneCents: number;
};

export type Chart = {
  id: string;
  pieceId: string;
  title: string;
  bpm: number;
  stepsPerBar: number;
  tonic: number;
  countIn: number;
  totalSteps: number;
  cues: Cue[];
  /** NPC phrases and the count-in, for the lane. Not judged. */
  companions: Companion[];
  auto: AutoSound[];
};

export type Companion = {
  id: string;
  step: number;
  words: string;
  name: string;
};

export type HostAudioBridge = {
  /** The activity is about to use its own audio context. Duck the main score if you have one. */
  onFocus?: () => void;
  /** The player left. This module has suspended its own context and will not touch yours. */
  onRelease?: () => void;
  /** Leave the sitting and return to the county. The canvas game supplies this. */
  onStand?: () => void;
};

export type InstrumentIdentity = {
  id: InstrumentId;
  name: string;
  tool: string;
  line: string;
  yield: string;
};
