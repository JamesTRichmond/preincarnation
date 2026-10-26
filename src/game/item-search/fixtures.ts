import type { WorldInstance } from "./types.ts";

export const FIXTURE_COUNT = 10_000;
export const FIXTURE_MARK = "[fixture]";
export const FIXTURE_PROVENANCE =
  "Synthetic performance fixture. Not an authored item. Not a place in Addison County.";

/**
 * Deterministic performance instances. Every name starts with `[fixture]`.
 * They never carry authored effect tags such as `light`.
 */
export function makeFixtures(count = FIXTURE_COUNT, year = 2040): WorldInstance[] {
  const instances: WorldInstance[] = [];
  for (let n = 0; n < count; n++) {
    const shared = n % 5 === 0;
    const slip = String(n % 20).padStart(2, "0");
    const label = shared ? `Bin slip ${slip}` : `Cordwood tally ${n}`;
    const rack = n % 40;
    const shelf = n % 8;
    instances.push({
      instanceId: `fixture-${n}`,
      catalogId: "synthetic-fixture",
      name: `${FIXTURE_MARK} ${label}`,
      quantity: (n % 4) + 1,
      kind: "fixture",
      custody: "stored",
      equipped: false,
      reservedFor: null,
      location: {
        placeId: `fixture-rack-${rack}`,
        label: `Fixture rack ${rack}, shelf ${shelf}`,
        container: "fixture-rack",
        accessible: true,
      },
      exposure: "indoor",
      components: ["counterfoil"],
      effects: ["tally"],
      effectNote: "A counted slip used to measure search. It does not burn or open a door.",
      confirmedYear: year,
      synthetic: true,
      discovered: true,
      notes: FIXTURE_PROVENANCE,
    });
  }
  return instances;
}
