import type { EraDef, EraHolder, EraId, MemoryOfEllis } from "./types.ts";

/**
 * Six return windows. Names are plate labels only.
 * The narrative pack owns the real era titles; these stay provisional.
 */
export const ERAS: EraDef[] = [
  { id: "return.1", ordinal: 1, plate: "First return", yearsFromAnchor: 0, provisional: true },
  { id: "return.2", ordinal: 2, plate: "Fourteen years", yearsFromAnchor: 14, provisional: true },
  { id: "return.3", ordinal: 3, plate: "Twenty-eight", yearsFromAnchor: 28, provisional: true },
  { id: "return.4", ordinal: 4, plate: "Forty-two", yearsFromAnchor: 42, provisional: true },
  { id: "return.5", ordinal: 5, plate: "Fifty-six", yearsFromAnchor: 56, provisional: true },
  { id: "return.6", ordinal: 6, plate: "Seventy", yearsFromAnchor: 70, provisional: true },
];

export const MEMORIES: MemoryOfEllis[] = [
  "unmet",
  "the child at the edge of the work",
  "the one who left before the freshet",
  "a name the predecessor kept",
  "the returned, fourteen years thinner",
  "only the book remembers",
];

export interface RolePlate {
  id: string;
  title: string;
  hubId: "hub.middlebury" | "hub.intervale" | "hub.otter";
}

/** Occupational seats. No surnames — families belong to the narrative pack. */
export const ROLES: RolePlate[] = [
  { id: "role.miller", title: "Miller", hubId: "hub.middlebury" },
  { id: "role.cooper", title: "Cooper", hubId: "hub.middlebury" },
  { id: "role.printer", title: "Printer", hubId: "hub.middlebury" },
  { id: "role.smith", title: "Smith", hubId: "hub.middlebury" },
  { id: "role.clerk", title: "Clerk", hubId: "hub.middlebury" },
  { id: "role.dairy", title: "Dairy hand", hubId: "hub.intervale" },
  { id: "role.orchard", title: "Orchardist", hubId: "hub.intervale" },
  { id: "role.hay", title: "Hay hand", hubId: "hub.intervale" },
  { id: "role.fence", title: "Fence mender", hubId: "hub.intervale" },
  { id: "role.well", title: "Well keeper", hubId: "hub.intervale" },
  { id: "role.ferry", title: "Ferry hand", hubId: "hub.otter" },
  { id: "role.net", title: "Net mender", hubId: "hub.otter" },
  { id: "role.caulker", title: "Caulker", hubId: "hub.otter" },
  { id: "role.fish", title: "Fish seller", hubId: "hub.otter" },
  { id: "role.sailmaker", title: "Sailmaker", hubId: "hub.otter" },
];

/**
 * Seat chain. actorId changes every return so the same routine is kept by
 * a different person. Sailmaker seat 6 is intentionally empty: a missing
 * successor must become a shuttered post, not a thrown error or a wanderer.
 */
export function buildCast(): EraHolder[] {
  const holders: EraHolder[] = [];
  for (const role of ROLES) {
    for (const era of ERAS) {
      const missing = role.id === "role.sailmaker" && era.id === "return.6";
      holders.push({
        eraId: era.id,
        roleId: role.id,
        actorId: missing ? null : `${role.id}#${era.ordinal}`,
        spokenName: role.title,
        seatLabel: missing ? "no successor in the cast" : `seat ${era.ordinal} of 6`,
        memory: MEMORIES[era.ordinal - 1] ?? "unmet",
        provisional: true,
      });
    }
  }
  return holders;
}

export const CAST: EraHolder[] = buildCast();

export function holderFor(
  holders: readonly EraHolder[],
  eraId: EraId,
  roleId: string,
): EraHolder | undefined {
  return holders.find((h) => h.eraId === eraId && h.roleId === roleId);
}
