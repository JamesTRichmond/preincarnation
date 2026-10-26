import { PRACTICE_WEIGHTS, type Weights } from "./ai.ts";
import { CARD_LIST, IDENTITIES, type Identity } from "./cards.ts";

export interface Opponent {
  id: string;
  name: string;
  blurb: string;
  kind: "tutorial" | "practice" | "personality";
  identity: Identity;
  deck: string[];
  weights: Weights;
  practice: boolean;
}

export function pureDeck(identity: Identity): string[] {
  const ids = CARD_LIST.filter((card) => card.identity === identity).map((card) => card.id);
  if (ids.length !== 12) throw new Error(`${identity} has ${ids.length} cards`);
  return [...ids, ...ids];
}

function doubled(ids: string[]): string[] {
  return [...ids, ...ids];
}

const adaRiver = [
  "rk-rope-ferry",
  "rk-ice-house",
  "rk-landing",
  "rk-reed-bed",
  "rk-cistern",
  "rk-ruth",
  "rk-bram",
  "rk-mill",
];
const adaCommons = ["cm-well", "cm-wharf-office", "cm-handshake", "cm-bench"];
const jonasTimber = [
  "tt-saw-pit",
  "tt-bunkhouse",
  "tt-woodlot",
  "tt-yard",
  "tt-nell",
  "tt-broadaxe",
  "tt-sawhorse",
  "tt-shop",
];
const jonasStrange = ["te-thaw", "te-bite", "te-cold-room", "te-wrong-map"];

const W = {
  ira: { foundations: 2, hearths: 5, institutions: 1, water: 1, lineages: 6, pacts: 1, deny: 1, tend: 2, memory: 3, warmth: 1 },
  ruth: { foundations: 2, hearths: 2, institutions: 3, water: 6, lineages: 2, pacts: 2, deny: 2, tend: 1, memory: 2, warmth: 1 },
  deacon: { foundations: 2, hearths: 3, institutions: 6, water: 1, lineages: 3, pacts: 2, deny: 1, tend: 2, memory: 2, warmth: 1 },
  nell: { foundations: 3, hearths: 2, institutions: 2, water: 1, lineages: 2, pacts: 1, deny: 1, tend: 5, memory: 1, warmth: 1 },
  february: { foundations: 2, hearths: 1, institutions: 1, water: 1, lineages: 2, pacts: 3, deny: 4, tend: 1, memory: 2, warmth: 2 },
  clerk: { foundations: 2, hearths: 2, institutions: 3, water: 2, lineages: 1, pacts: 6, deny: 0, tend: 1, memory: 2, warmth: 1 },
  ada: { foundations: 2, hearths: 2, institutions: 3, water: 5, lineages: 1, pacts: 3, deny: 1, tend: 1, memory: 2, warmth: 1 },
  ripton: { foundations: 2, hearths: 4, institutions: 4, water: 0, lineages: 5, pacts: 1, deny: 1, tend: 2, memory: 3, warmth: 1 },
  jonas: { foundations: 3, hearths: 1, institutions: 2, water: 0, lineages: 1, pacts: 1, deny: 3, tend: 4, memory: 1, warmth: 1 },
  two: { foundations: 2, hearths: 2, institutions: 3, water: 2, lineages: 1, pacts: 5, deny: 0, tend: 1, memory: 2, warmth: 1 },
  captain: { foundations: 2, hearths: 1, institutions: 2, water: 5, lineages: 1, pacts: 1, deny: 5, tend: 1, memory: 1, warmth: 1 },
  penn: { foundations: 2, hearths: 2, institutions: 6, water: 0, lineages: 2, pacts: 2, deny: 2, tend: 1, memory: 2, warmth: 1 },
} satisfies Record<string, Weights>;

export const OPPONENTS: Opponent[] = [
  {
    id: "tutorial",
    name: "The lesson",
    blurb: "A short county. Four winters an era, then one card carried. The neighbor plays the obvious porch.",
    kind: "tutorial",
    identity: "commons",
    deck: pureDeck("commons"),
    weights: PRACTICE_WEIGHTS,
    practice: true,
  },
  {
    id: "mara",
    name: "Mara Ellison",
    blurb: "Practice. She plays houses and tends them. She does not bother with pacts, routes, or memory.",
    kind: "practice",
    identity: "orchard",
    deck: pureDeck("orchard"),
    weights: PRACTICE_WEIGHTS,
    practice: true,
  },
  {
    id: "ira",
    name: "Ira Colby",
    blurb: "Plants kin beside kin. A lineage is the whole point of the second era.",
    kind: "personality",
    identity: "orchard",
    deck: pureDeck("orchard"),
    weights: W.ira,
    practice: false,
  },
  {
    id: "ruth",
    name: "Ruth Smalley",
    blurb: "Keeps the ice road. She would rather share a river than own a dry field.",
    kind: "personality",
    identity: "river",
    deck: pureDeck("river"),
    weights: W.ruth,
    practice: false,
  },
  {
    id: "deacon",
    name: "Deacon Hale",
    blurb: "Founds the school and the chapel and then stands next to them until they count.",
    kind: "personality",
    identity: "parish",
    deck: pureDeck("parish"),
    weights: W.deacon,
    practice: false,
  },
  {
    id: "nell",
    name: "Nell Vantine",
    blurb: "Would rather put another mark on a board than start a new one.",
    kind: "personality",
    identity: "timber",
    deck: pureDeck("timber"),
    weights: W.nell,
    practice: false,
  },
  {
    id: "february",
    name: "The February Guest",
    blurb: "Plays the winters that misbehave: a rumor, an open door, guests who recognize each other.",
    kind: "personality",
    identity: "threshold",
    deck: pureDeck("threshold"),
    weights: W.february,
    practice: false,
  },
  {
    id: "clerk",
    name: "Selectboard Clerk",
    blurb: "Scores the border. A pact is the favorite sentence in the minutes.",
    kind: "personality",
    identity: "commons",
    deck: pureDeck("commons"),
    weights: W.clerk,
    practice: false,
  },
  {
    id: "ada",
    name: "Ada Ferris",
    blurb: "River work with a well and a bench borrowed from the commons.",
    kind: "personality",
    identity: "river",
    deck: doubled([...adaRiver, ...adaCommons]),
    weights: W.ada,
    practice: false,
  },
  {
    id: "ripton",
    name: "The Ripton Sisters",
    blurb: "Parish ground, but they keep a family the way the orchards do.",
    kind: "personality",
    identity: "parish",
    deck: pureDeck("parish"),
    weights: W.ripton,
    practice: false,
  },
  {
    id: "jonas",
    name: "Jonas Wheelwright",
    blurb: "Timber, plus black ice when a dry board needs a water tag.",
    kind: "personality",
    identity: "timber",
    deck: doubled([...jonasTimber, ...jonasStrange]),
    weights: W.jonas,
    practice: false,
  },
  {
    id: "two",
    name: "Two Households",
    blurb: "Plays as if the county is a shared table. Low spite, high pacts.",
    kind: "personality",
    identity: "commons",
    deck: pureDeck("commons"),
    weights: W.two,
    practice: false,
  },
  {
    id: "captain",
    name: "Captain of the Wharf",
    blurb: "Takes the river plots you wanted and is not romantic about it.",
    kind: "personality",
    identity: "river",
    deck: pureDeck("river"),
    weights: W.captain,
    practice: false,
  },
  {
    id: "penn",
    name: "Schoolteacher Penn",
    blurb: "The district school first. Everything else is adjacency for it.",
    kind: "personality",
    identity: "parish",
    deck: pureDeck("parish"),
    weights: W.penn,
    practice: false,
  },
];

export const PERSONALITIES = OPPONENTS.filter((opponent) => opponent.kind === "personality");

export function opponentById(id: string): Opponent {
  const found = OPPONENTS.find((opponent) => opponent.id === id);
  if (!found) throw new Error(`No opponent ${id}`);
  return found;
}

export function deckIdentityName(identity: Identity): string {
  return IDENTITIES[identity].name;
}
