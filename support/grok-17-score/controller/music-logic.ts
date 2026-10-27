/** Pure gain rules for the adaptive score. No audio nodes, no game imports. */

export type Intensity = 0 | 1 | 2;
export type MenuMode = "veil" | "duck-only";

/** Equal-power pair. t=0 is fully outgoing; t=1 is fully incoming. */
export function equalPower(t: number): { out: number; inn: number } {
  const x = Math.min(1, Math.max(0, t));
  return {
    out: Math.cos(x * Math.PI * 0.5),
    inn: Math.sin(x * Math.PI * 0.5),
  };
}

/** Curve samples for AudioParam.setValueCurveAtTime. Never exactly 0 (older Chrome throws). */
export function equalPowerCurve(fadeIn: boolean, steps = 32, peak = 1): Float32Array {
  const curve = new Float32Array(steps);
  const floor = 0.0001;
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 1 : i / (steps - 1);
    const { out, inn } = equalPower(t);
    curve[i] = Math.max(floor, (fadeIn ? inn : out) * peak);
  }
  return curve;
}

export function layerGain(
  layerIntensity: Intensity,
  level: Intensity,
  solo: number | null,
  index: number,
): number {
  if (solo !== null) return solo === index ? 1 : 0;
  return level >= layerIntensity ? 1 : 0;
}

export function menuDuck(open: boolean): number {
  return open ? 0.28 : 1;
}

/** Veil amount. Title and ending duck only, so the cue itself stays the menu music. */
export function veilAmount(open: boolean, menu: MenuMode, hasCue: boolean): number {
  if (!open) return 0;
  if (hasCue && menu === "duck-only") return 0;
  return 0.9;
}

export function masterTarget(muted: boolean, userSuspended: boolean): number {
  return muted || userSuspended ? 0 : 1;
}
