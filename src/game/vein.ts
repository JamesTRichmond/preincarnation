import type { VeinRite } from "./types.ts";

/** Pixel reach of an unlived step. 9px is the old 0.55-tile floor; 44px is 2.75 tiles. */
export const STEP_MIN = 9;
export const STEP_MAX = 44;
/** Eight sim ticks at 30Hz. Shorter than a flinch, and never stacked onto one. */
export const STEP_INVULN = 8 / 30;
/** Ten ticks. Anything longer, or not a number, is wiped — not clamped into safety. */
export const INVULN_MAX = 10 / 30;
export const OPEN_CAP = 2;
/** Borrowed tomorrow waits twenty-four ticks, then strikes the cross once. */
export const TOMORROW_DELAY = 24 / 30;
export const TOMORROW_REACH = 14;

/**
 * The lamp spends the body's mana. The reference court used a second pool
 * large enough to make these rites free on a life whose max mana is 8.
 */
export const RITE_COST: Record<VeinRite, number> = {
  listen: 2,
  step: 2,
  tomorrow: 3,
  coat: 3,
};

export type ListenState = {
  listening: boolean;
  stored: string | null;
};

export type WitnessResult = "ignore" | "stored" | "opened" | "capped";

export function freshListen(): ListenState {
  return { listening: false, stored: null };
}

export function clampOpens(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(OPEN_CAP, Math.floor(n));
}

/** Step i-frames only. Ordinary flinch time is longer than this cap and is not passed through here. */
export function clampInvuln(v: number): number {
  if (!Number.isFinite(v) || v <= 0 || v > INVULN_MAX) return 0;
  return v;
}

export function pay(mp: number, rite: VeinRite): { ok: true; mp: number } | { ok: false } {
  const cost = RITE_COST[rite];
  if (!Number.isFinite(mp) || mp < cost) return { ok: false };
  return { ok: true, mp: mp - cost };
}

export function lampReady(flags: { ySlot: string | null; lanternOn: boolean; relics: readonly string[] }): boolean {
  return flags.ySlot === "lantern" && flags.lanternOn && flags.relics.includes("lantern");
}

/**
 * A repeated bite of the same kind opens once. The third opening in a chapter is refused.
 * A different kind does not spend the note.
 */
export function witnessBite(
  listen: ListenState,
  kind: string,
  opens: number,
): { listen: ListenState; opens: number; result: WitnessResult } {
  const noted = clampOpens(opens);
  if (!listen.listening && !listen.stored) return { listen, opens: noted, result: "ignore" };
  if (noted >= OPEN_CAP) return { listen: freshListen(), opens: noted, result: "capped" };
  if (!listen.stored) return { listen: { listening: true, stored: kind }, opens: noted, result: "stored" };
  if (listen.stored !== kind) return { listen, opens: noted, result: "ignore" };
  return { listen: freshListen(), opens: noted + 1, result: "opened" };
}

/** The opened bite adds one point of sword, once. It does not stack. */
export function consumePunish(armed: boolean): { armed: boolean; bonus: number } {
  if (!armed) return { armed: false, bonus: 0 };
  return { armed: false, bonus: 1 };
}

export type StepPoint = { x: number; y: number };

/**
 * Facing-only step. The whole segment must be clear. Too-short steps are rejected
 * so the brief mercy cannot be stuttered against a wall.
 */
export function validateStep(
  from: StepPoint,
  dir: StepPoint,
  bounds: { w: number; h: number },
  blocked: (x: number, y: number) => boolean,
): { ok: true; x: number; y: number; dist: number } | { ok: false; reason: string } {
  const len = Math.hypot(dir.x, dir.y);
  if (!Number.isFinite(from.x) || !Number.isFinite(from.y) || len <= 0) {
    return { ok: false, reason: "That step is not a place." };
  }
  const dist = STEP_MAX;
  if (dist < STEP_MIN || dist > STEP_MAX) {
    return { ok: false, reason: "That step is farther than the unlived reach." };
  }
  const x = from.x + (dir.x / len) * dist;
  const y = from.y + (dir.y / len) * dist;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ok: false, reason: "That step is not a place." };
  const margin = 6;
  if (x < margin || y < margin || x > bounds.w - margin || y > bounds.h - margin) {
    return { ok: false, reason: "The county ends there." };
  }
  const samples = Math.ceil(dist / 4);
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const sx = from.x + (x - from.x) * t;
    const sy = from.y + (y - from.y) * t;
    if (blocked(sx, sy)) return { ok: false, reason: "The step meets a wall." };
  }
  return { ok: true, x, y, dist };
}

/** One bite, then the coat is gone. A written death does not spend it. */
export function coatTurn(coat: number, scripted: boolean): { coat: number; absorbed: boolean } {
  if (scripted || !(coat > 0)) return { coat, absorbed: false };
  return { coat: 0, absorbed: true };
}

/** Death keeps how many openings this chapter has used, and forgets the recording. */
export function chapterDeath(opens: number, _listen: ListenState): { opens: number; listen: ListenState } {
  return { opens: clampOpens(opens), listen: freshListen() };
}

/** Waking after the chapter is the rest. The lamp may witness again. */
export function chapterRest(): { opens: number; listen: ListenState } {
  return { opens: 0, listen: freshListen() };
}
