import type { PortSpec } from "../types.ts";

/**
 * Reference module for game interfaces this package does not own.
 *
 * PREINCARNATION's world, inventory, NPC barter, quest memory, spatial audio,
 * and save records are not linked here. Nothing in this file talks to them.
 * The workshop supplies a local stand-in and labels every result
 * `via: "workshop-stand-in"`. A stand-in is not integration.
 *
 * Status is `missing` until a real game build implements the methods and this
 * spec is revised in the same change. Do not flip a status without the
 * implementation.
 */
export const GAME_PORTS: PortSpec[] = [
  {
    id: "port.world",
    status: "missing",
    why: "No Addison County scene graph is linked. Place, weather, era, hour, and fixtures are not read from the game.",
    methods: ["placeId", "era", "weather", "hour", "fixtures", "flora"],
    standIn: "The return shed at the Otter Creek landing pretends to be one room, with a stove, a skiff on the ways, and a hook rail.",
  },
  {
    id: "port.clock",
    status: "missing",
    why: "The game clock is not available. Minutes added by a recipe do not move the county.",
    methods: ["now", "advanceMinutes"],
    standIn: "The shed keeps a local hour on the bench card and advances it when a job names a duration.",
  },
  {
    id: "port.inventory",
    status: "missing",
    why: "Ellis's pack and the world container components are not mounted.",
    methods: ["list", "add", "remove", "transfer"],
    standIn: "Instances live in this shed's own list: bench, display, neighbor blanket, consumed.",
  },
  {
    id: "port.social.barter",
    status: "missing",
    why: "No neighbor, innkeeper, or farm schedule resolves a trade.",
    methods: ["offer", "resolve", "refuse"],
    standIn: "One blanket of catalog objects sits by the door. The exchange is local and in kind, never currency.",
  },
  {
    id: "port.social.consent",
    status: "missing",
    why: "No NPC can grant relic or estate consent.",
    methods: ["requestConsent", "holder"],
    standIn: "Relic and estate rules refuse trade and dismantle. There is no one here to ask.",
  },
  {
    id: "port.display.fixture",
    status: "missing",
    why: "Mantels, windows, and hook rails in the county are not addressable props.",
    methods: ["listFixtures", "mount", "unmount"],
    standIn: "Four shed fixtures accept a display: mantel, hook rail, window, bench front.",
  },
  {
    id: "port.quest.flag",
    status: "missing",
    why: "Memory and quest flags from the first life are not written to the game.",
    methods: ["set", "get"],
    standIn: "Local flags (a paid seam, a heard cadence) stay in the shed state only.",
  },
  {
    id: "port.audio.emit",
    status: "missing",
    why: "No spatial audio is played for bells, mugs, or horns.",
    methods: ["emit", "attenuate"],
    standIn: "The log states range and whether the wind ate the sound. Nothing is heard.",
  },
  {
    id: "port.persist",
    status: "missing",
    why: "Item condition is not saved into the game record.",
    methods: ["saveInstance", "loadInstance"],
    standIn: "The browser keeps the shed on this device only, under a local key, separate from any game save.",
  },
];

export const PORT_IDS = GAME_PORTS.map((p) => p.id);

export function getPort(id: string): PortSpec | undefined {
  return GAME_PORTS.find((p) => p.id === id);
}
