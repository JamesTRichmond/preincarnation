import { z } from "zod";
import type { Catalog } from "./catalog.ts";
import { foldJournal, loadoutProblems, setGameMirror } from "./logic.ts";
import { commit } from "./logic.ts";
import {
  INSPECTED_GAME_SAVE_VERSION,
  fail,
  ok,
  type DeathCause,
  type GameMirror,
  type MasteryState,
  type Result,
} from "./types.ts";

export const MASTERY_SAVE_KEY = "preincarnation.mastery.v1";
export { INSPECTED_GAME_SAVE_VERSION };

const DeathCauseSchema = z.enum(["combat", "hazard", "scripted", "release"]);
const EraSchema = z.enum(["era-1", "era-2", "era-3", "era-4", "era-5", "era-6"]);

const GrantEvent = z.object({
  t: z.literal("grant"),
  sourceId: z.string(),
  lifeId: z.string(),
  amount: z.number().int().positive(),
  via: z.enum(["bank", "escrow"]),
}).strict();

const DeathEvent = z.object({
  t: z.literal("death"),
  lifeId: z.string(),
  cycle: z.number().int().positive(),
  cause: DeathCauseSchema,
  deathSiteKey: z.string().min(1).max(80),
  hollow: z.boolean(),
  paid: z.number().int().nonnegative(),
  paidSources: z.array(z.string()),
}).strict();

const ReturnEvent = z.object({
  t: z.literal("return"),
  nextLifeId: z.string(),
  lifeSerial: z.number().int().positive(),
}).strict();

const PurchaseEvent = z.object({
  t: z.literal("purchase"),
  id: z.string(),
  cost: z.number().int().positive(),
}).strict();

const RespecEvent = z.object({
  t: z.literal("respec"),
  refunded: z.array(z.object({ id: z.string(), amount: z.number().int().nonnegative() }).strict()),
}).strict();

const RefundEvent = z.object({
  t: z.literal("refund"),
  id: z.string(),
  amount: z.number().int().nonnegative(),
}).strict();

const OpenEraEvent = z.object({ t: z.literal("open-era"), era: EraSchema }).strict();
const OpenDungeonEvent = z.object({
  t: z.literal("open-dungeon"),
  dungeon: z.string().regex(/^dungeon-(0[1-9]|1[0-6])$/),
}).strict();
const GrantBoundEvent = z.object({ t: z.literal("grant-bound"), id: z.string() }).strict();

export const JournalEventSchema = z.discriminatedUnion("t", [
  GrantEvent,
  DeathEvent,
  ReturnEvent,
  PurchaseEvent,
  RespecEvent,
  RefundEvent,
  OpenEraEvent,
  OpenDungeonEvent,
  GrantBoundEvent,
]);

const LoadoutSchema = z.object({
  sockets: z.array(z.string()).max(6),
  tools: z.array(z.string()).max(2),
  forms: z.array(z.string()).max(3),
  vow: z.string().nullable(),
  capstone: z.string().nullable(),
}).strict();

const GameMirrorSchema = z.object({
  name: z.string().min(1).max(80),
  year: z.number().int(),
  lastDeed: z.string().max(400),
  incarnation: z.enum(["wanderer", "smuggler", "officer", "embryo"]),
  skillPoints: z.number().int().nonnegative(),
  karma: z.number().int(),
  host: z.enum(["god", "devil"]).nullable(),
  saveVersion: z.number().int().nonnegative(),
}).strict();

export const RecordOverlaySchema = z.object({
  id: z.string().regex(/^(?:(?:quarry|creek|sugar|ash|lantern|hollow)\.ins\.(?:0[1-9]|1[0-2])|tool\.(?:0[1-9]|[12][0-9]|3[0-6])|form\.(?:0[1-9]|[12][0-9]|3[0-2])|cross\.(?:0[1-9]|1[0-9]|2[0-4]))$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  cost: z.number().int().positive(),
  channel: z.string().min(1),
  hosts: z.array(z.enum(["slash", "spin", "walk", "dash", "swim", "tool:shovel", "tool:hookshot", "tool:boots", "tool:flippers", "tool:lantern", "tool:hammer", "tool:net", "tool:mirror", "tool:cape", "tool:cane", "tool:bow", "tool:bombs"])).optional(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  role: z.enum(["standard", "vow", "capstone"]).optional(),
  requires: z.array(z.string()).optional(),
  requiresSources: z.array(z.string()).optional(),
  requiresEras: z.array(EraSchema).optional(),
  requiresDungeons: z.array(z.string()).optional(),
  excludes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  modifiers: z.array(z.object({
    key: z.string().min(1),
    op: z.enum(["add", "mul", "flag"]),
    value: z.union([z.number(), z.boolean()]),
  }).strict()).optional(),
  bound: z.boolean().optional(),
}).strict();

export const WitnessSourceSchema = z.object({
  id: z.string().regex(/^src\.(discovery|encounter|choice)\.[a-z0-9-]+$/),
  kind: z.enum(["discovery", "encounter", "choice"]),
  repeat: z.enum(["campaign", "life"]),
  amount: z.number().int().positive(),
  label: z.string().min(1),
  note: z.string().min(1),
}).strict();

export const MasteryStateSchema = z.object({
  version: z.literal(1),
  phase: z.enum(["living", "afterlife"]),
  cycle: z.number().int().nonnegative(),
  lifeId: z.string().regex(/^life-[1-9][0-9]*$/),
  lifeSerial: z.number().int().positive(),
  witnessBank: z.number().int().nonnegative(),
  suicideStreak: z.number().int().nonnegative(),
  repeatPaid: z.record(z.string(), z.object({ pays: z.number().int().nonnegative(), total: z.number().int().nonnegative() }).strict()),
  escrow: z.array(z.object({ sourceId: z.string(), amount: z.number().int().positive() }).strict()),
  claimedCampaign: z.array(z.string()),
  claimedThisLife: z.array(z.string()),
  meaningfulActs: z.number().int().nonnegative(),
  owned: z.record(z.string(), z.object({ costPaid: z.number().int().nonnegative(), bound: z.boolean() }).strict()),
  loadout: LoadoutSchema,
  eraOpened: z.array(EraSchema),
  dungeonsOpened: z.array(z.string()),
  lastDeathSite: z.string().nullable(),
  lastDeathCause: DeathCauseSchema.nullable(),
  respecsThisVisit: z.number().int().nonnegative(),
  journal: z.array(JournalEventSchema).max(4000),
  game: GameMirrorSchema,
}).strict();

const COMPARED = [
  "version",
  "phase",
  "cycle",
  "lifeId",
  "lifeSerial",
  "witnessBank",
  "suicideStreak",
  "repeatPaid",
  "escrow",
  "claimedCampaign",
  "claimedThisLife",
  "meaningfulActs",
  "owned",
  "eraOpened",
  "dungeonsOpened",
  "lastDeathSite",
  "lastDeathCause",
  "respecsThisVisit",
] as const;

function canon(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canon).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, inner]) => `${JSON.stringify(key)}:${canon(inner)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function validateSave(raw: unknown, catalog: Catalog): Result<MasteryState> {
  const parsed = MasteryStateSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.join(".") || "save";
    return fail("invalid-save", `${where}: ${issue?.message ?? "Save did not match the schema."}`);
  }
  const folded = foldJournal(parsed.data.journal, catalog, parsed.data.game);
  if (!folded.ok) return folded;
  for (const field of COMPARED) {
    if (canon(folded.value[field]) !== canon(parsed.data[field])) {
      return fail("invalid-save", `Save field ${field} does not replay from the journal. The ledger was refused.`);
    }
  }
  const load = loadoutProblems(folded.value, parsed.data.loadout, catalog);
  if (load) return fail("invalid-save", load);
  return ok({ ...folded.value, loadout: parsed.data.loadout, game: parsed.data.game });
}

export type GameSaveView = {
  version: number;
  cycle: number;
  karma: number;
  incarnation: GameMirror["incarnation"];
  character: { name: string; skillPoints: number };
  flags: {
    returnedFromDeath: boolean;
    lastDeed: string;
    afterlifeHost: "god" | "devil" | null;
    year: number;
  };
};

const INCARNATIONS = ["wanderer", "smuggler", "officer", "embryo"] as const;

export function readGameSaveView(raw: unknown): Result<GameSaveView> {
  if (!raw || typeof raw !== "object") return fail("bad-game-save", "Game save is missing.");
  const game = raw as Partial<GameSaveView> & { character?: Partial<GameSaveView["character"]>; flags?: Partial<GameSaveView["flags"]> };
  if (typeof game.version !== "number" || typeof game.cycle !== "number" || typeof game.karma !== "number") {
    return fail("bad-game-save", "Game save is missing version, cycle, or karma.");
  }
  if (!INCARNATIONS.includes(game.incarnation as (typeof INCARNATIONS)[number])) {
    return fail("bad-game-save", "Game save has an unknown incarnation.");
  }
  const character = game.character;
  const flags = game.flags;
  if (!character || typeof character.name !== "string" || typeof character.skillPoints !== "number") {
    return fail("bad-game-save", "Game save is missing the character sheet.");
  }
  if (!flags || typeof flags.returnedFromDeath !== "boolean" || typeof flags.year !== "number" || typeof flags.lastDeed !== "string") {
    return fail("bad-game-save", "Game save is missing death flags.");
  }
  if (flags.afterlifeHost !== "god" && flags.afterlifeHost !== "devil" && flags.afterlifeHost !== null) {
    return fail("bad-game-save", "Game save has an unknown afterlife host.");
  }
  return ok({
    version: game.version,
    cycle: game.cycle,
    karma: game.karma,
    incarnation: game.incarnation as GameSaveView["incarnation"],
    character: { name: character.name, skillPoints: character.skillPoints },
    flags: {
      returnedFromDeath: flags.returnedFromDeath,
      lastDeed: flags.lastDeed,
      afterlifeHost: flags.afterlifeHost,
      year: flags.year,
    },
  });
}

export function syncMirror(state: MasteryState, game: GameSaveView): MasteryState {
  return setGameMirror(state, {
    name: game.character.name,
    year: game.flags.year,
    lastDeed: game.flags.lastDeed,
    incarnation: game.incarnation,
    skillPoints: game.character.skillPoints,
    karma: game.karma,
    host: game.flags.afterlifeHost,
    saveVersion: game.version,
  });
}

/** Closes the life. Does not write the game save and does not touch skill points. */
export function deathFromGame(
  state: MasteryState,
  game: GameSaveView,
  report: { cause: DeathCause; deathSiteKey: string },
  catalog: Catalog,
): Result<MasteryState> {
  const died = commit(
    state,
    { t: "death", cause: report.cause, deathSiteKey: report.deathSiteKey, cycle: game.cycle },
    catalog,
  );
  if (!died.ok) return died;
  return ok(syncMirror(died.value, game));
}

/** Back to the county. Cycle stays where the runtime left it. */
export function returnFromGame(state: MasteryState, game: GameSaveView, catalog: Catalog): Result<MasteryState> {
  if (game.flags.returnedFromDeath) return fail("bad-phase", "The runtime still has this life closed.");
  if (game.cycle !== state.cycle) return fail("cycle", "Returning does not advance the cycle.");
  const back = commit(state, { t: "return" }, catalog);
  if (!back.ok) return back;
  return ok(syncMirror(back.value, game));
}
