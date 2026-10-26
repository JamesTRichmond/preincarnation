import { LIMBO_UPGRADES } from "./content.ts";
import type { BottleKind, Upgrades } from "./types.ts";

/** Ranks you can still buy with skill. Crowns are not skill. */
export function spendableRanksLeft(upgrades: Upgrades): number {
  let left = 0;
  for (const def of LIMBO_UPGRADES) {
    if (def.polarity === "crown") continue;
    const raw = upgrades[def.key];
    const owned = typeof raw === "boolean" ? (raw ? 1 : 0) : raw;
    left += Math.max(0, def.max - owned);
  }
  return left;
}

/**
 * A bottle only moves if a slot is empty. A full belt leaves the tin where it is.
 * Nothing is drunk, deleted, or turned into a second currency.
 */
export function storeBottle(
  bottles: readonly BottleKind[],
  kind: Exclude<BottleKind, "empty">,
): { bottles: BottleKind[]; stored: boolean } {
  const i = bottles.findIndex((b) => b === "empty");
  if (i < 0) return { bottles: bottles.slice(), stored: false };
  const next = bottles.slice();
  next[i] = kind;
  return { bottles: next, stored: true };
}
