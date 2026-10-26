export type CalibrationSample = {
  /** When the knock was scheduled on the audio clock, ms. */
  knockMs: number;
  /** When the player tapped, same clock, ms. */
  tapMs: number;
};

export type CalibrationResult = {
  offsetMs: number | null;
  used: number;
  dropped: number;
};

/**
 * Offset is tap minus knock: how late the knock seemed, including the
 * player's own response. The first tap is practice and is dropped.
 * Taps more than 500 ms off are misses, not latency.
 */
export function measureOffset(samples: CalibrationSample[]): CalibrationResult {
  const deltas = samples.map((s) => s.tapMs - s.knockMs);
  const dropped = deltas.filter((d) => Math.abs(d) > 500).length;
  const kept = deltas.filter((d) => Math.abs(d) <= 500);
  const usable = kept.slice(1);
  if (usable.length < 4) {
    return { offsetMs: null, used: usable.length, dropped };
  }
  const sorted = [...usable].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const offsetMs =
    sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  return { offsetMs, used: usable.length, dropped };
}

export function calibrationCopy(result: CalibrationResult): string {
  if (result.offsetMs == null) {
    return "A few more knocks, then the beat can shift to meet you. Nothing here is a lab measurement.";
  }
  const ms = Math.round(result.offsetMs);
  const direction = ms === 0 ? "on" : ms > 0 ? `${ms} ms after` : `${Math.abs(ms)} ms before`;
  return `From ${result.used} taps just now, your knock lands ${direction} the scheduled one. The beat will shift to meet you. This is not a lab measurement.`;
}

/** Browser-reported delay. Never present this as something we auditioned. */
export function browserLatencyNote(baseSec?: number, outputSec?: number): string | null {
  const base = typeof baseSec === "number" && Number.isFinite(baseSec) ? baseSec : null;
  const output = typeof outputSec === "number" && Number.isFinite(outputSec) ? outputSec : null;
  if (base == null && output == null) return null;
  const ms = Math.round(((base ?? 0) + (output ?? 0)) * 1000);
  return `This browser estimates about ${ms} ms of engine delay. That figure was not auditioned.`;
}

export type Lineup = {
  offsetMs: number;
  stale: boolean;
  reason: string | null;
};

export function freshLineup(offsetMs: number): Lineup {
  return { offsetMs, stale: false, reason: null };
}

export function noteDeviceChange(lineup: Lineup): Lineup {
  return {
    offsetMs: lineup.offsetMs,
    stale: true,
    reason: "The sound path changed. The old lineup may be off.",
  };
}

export function nudgeOffset(lineup: Lineup, offsetMs: number): Lineup {
  return { offsetMs, stale: false, reason: null };
}
