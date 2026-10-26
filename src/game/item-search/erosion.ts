import { placeById } from "./places.ts";
import type { KnownWorld, WorldInstance } from "./types.ts";

/**
 * Fourteen-year return.
 *
 * Mirrors the grave rule in the game: mundane steel left in the open rarely
 * lasts, arrows are gone after eight winters, bombs are spent, magic remains,
 * and a bonded lamp comes back to the hand — not the grass.
 * The rule here is deterministic so a search result can be tested.
 * Undiscovered loot is copied through untouched and still must not be indexed.
 */
export function lostToWinter(instance: WorldInstance, yearsAway: number): boolean {
  if (instance.kind !== "owned") return false;
  if (instance.synthetic) return false;
  if (yearsAway < 14) return false;
  if (instance.exposure !== "open") return false;
  if (instance.bonded || instance.magic || instance.persists) return false;
  return true;
}

export function projectReturn(world: KnownWorld, years = 14): KnownWorld {
  const hand = placeById("in-hand");
  const instances: WorldInstance[] = [];

  for (const instance of world.instances) {
    if (instance.discovered === false) continue;
    if (lostToWinter(instance, years)) continue;

    if (instance.bonded) {
      instances.push({
        ...instance,
        equipped: true,
        custody: "equipped",
        exposure: "indoor",
        location: {
          placeId: hand.placeId,
          label: "In hand — it returned with you",
          container: hand.container,
          accessible: true,
        },
        confirmedYear: world.year + years,
        notes: "Bonded. Fourteen winters did not leave it where you fell.",
      });
      continue;
    }

    const barred = instance.location.placeId === "barn-loft";
    instances.push({
      ...instance,
      location: {
        ...instance.location,
        accessible: barred ? false : instance.location.accessible,
      },
      confirmedYear: world.year + years,
      notes: barred
        ? "You stored it here. The loft was barred while you were gone."
        : instance.notes,
    });
  }

  return {
    ...world,
    revision: world.revision + 1,
    year: world.year + years,
    yearsAway: years,
    instances,
  };
}
