import type { GameplaySnapshot, RetentionReport } from "../types.ts";

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function retentionReport(frozen: GameplaySnapshot, live: GameplaySnapshot): RetentionReport {
  return {
    positionHeld: frozen.position.x === live.position.x && frozen.position.y === live.position.y,
    timeHeld: frozen.playSeconds === live.playSeconds,
    eraHeld: frozen.eraId === live.eraId && frozen.returnIndex === live.returnIndex,
    facingHeld: frozen.facing === live.facing,
    placeHeld: frozen.placeId === live.placeId,
    discoveriesHeld:
      frozen.discoveredPlaceIds.length === live.discoveredPlaceIds.length &&
      frozen.discoveredPlaceIds.every((id, index) => live.discoveredPlaceIds[index] === id),
  };
}

export function sameGround(frozen: GameplaySnapshot, live: GameplaySnapshot): boolean {
  const report = retentionReport(frozen, live);
  return report.positionHeld && report.timeHeld && report.eraHeld && report.facingHeld && report.placeHeld;
}
