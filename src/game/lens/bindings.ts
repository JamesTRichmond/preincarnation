import type { RuntimeBinding } from "./types.ts";

/**
 * Called out in the desk so a fixture is never mistaken for the live game.
 * Storage routing is another session. Pickup, sale, and salvage are refused.
 */
export const UNIMPLEMENTED_RUNTIME_BINDINGS: readonly RuntimeBinding[] = [
  {
    id: "world-spawn",
    label: "Ground entities",
    status: "unbound",
    detail:
      "The walk reads live props. This filter does not spawn, move, or delete them. The sample clearing in the tests is not the county.",
  },
  {
    id: "discovery-writeback",
    label: "Discovery write-back",
    status: "unbound",
    detail:
      "Reading a label here does not mark a first discovery as found. Preservation still uses the fixture flag.",
  },
  {
    id: "project-mastery",
    label: "Live project and mastery",
    status: "unbound",
    detail:
      "The live project is the Marble Vein. Mastery is not queried from the character. A farmhouse rifle is stamped as a conflict. The sample fixture still says Lantern Rite and Glasswright, and it is not the walk.",
  },
  {
    id: "storage-routing",
    label: "Storage routing",
    status: "unbound",
    detail:
      "Bags, stash, and routing belong to another session. This filter never chooses a destination.",
  },
  {
    id: "pickup-sale-salvage",
    label: "Pickup, sale, and salvage",
    status: "refused",
    detail:
      "No result approves or performs pickup, sale, or salvage. A hidden label is only visually quiet, and the object remains in the world.",
  },
];

export const FIXTURE_NOTICE =
  "Reference fixture. These objects are sample ground loot, not entities from the adventure runtime.";
