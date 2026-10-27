/** Living bench scenes. The kit persists. Each place keeps its own props. */

import { GADGETS } from "./catalog.ts";
import { emptyWorld, makeKit } from "./world.ts";
import type { Balance, Compartment, Enemy, Gadget, KitItem, Lamp, Puzzle, Weather, World } from "./types.ts";

export type SceneId = "porch" | "vigil" | "loft" | "counter" | "creek" | "orchard" | "study";

export type SceneMeta = {
  id: SceneId;
  title: string;
  figure: string;
  where: string;
  hourLabel: string;
  lead: string;
  cue: string;
};

export const SCENES: SceneMeta[] = [
  {
    id: "porch",
    title: "Seymour Street",
    figure: "Fig. 1 — the porch",
    where: "Middlebury, the old clock shop",
    hourLabel: "4:40",
    lead: "The regulator is gone. A key-copy booth took the window. The dog still watches a narrow slice of the walk.",
    cue: "Loose the bird at the dog. When the barrel is empty, the maintaining spring will lend one wind. Both notes on the pipe call someone who was already in the county.",
  },
  {
    id: "vigil",
    title: "St. Stephen's",
    figure: "Fig. 2 — the vigil",
    where: "Bridport sacristy",
    hourLabel: "6:10",
    lead: "The vigil is an approved lamp. The porch light they left in the cupboard is not. Spectrum ink in the hymnal only shows in the stripe.",
    cue: "Throw the stripe, then soften it with the cider plate. A warm baffle sends the moths off and puts the stripe out.",
  },
  {
    id: "loft",
    title: "Ripton loft",
    figure: "Fig. 3 — the organ board",
    where: "Above the practice room",
    hourLabel: "9:20",
    lead: "A plate in the organ matches 440. The horn will not say so until the fork has touched it. The wrench opens only what the horn has already found.",
    cue: "Calibrate, sweep 440, then draw the bolt. A fresh breeze masks the horn. The sleeper in the corner is rhythm-kind, and the horn is not padded.",
  },
  {
    id: "counter",
    title: "Vergennes counter",
    figure: "Fig. 4 — the overhead balance",
    where: "The hardware shop",
    hourLabel: "11:05",
    lead: "The sash balance wants eighteen ounces and has ten. Overhead work needs the jack chain. The merchant's weight is a little proud.",
    cue: "Hang the chain, seat eight ounces, then accuse the short weight with the penny set.",
  },
  {
    id: "creek",
    title: "Otter Creek",
    figure: "Fig. 5 — bank and mudroom",
    where: "Ferrisburgh, the basin",
    hourLabel: "2:15",
    lead: "The riffle is in the air. The wax keeps one sound, and the lock wants that riffle. Rain is a rumor until the drum and the aneroid agree.",
    cue: "Cut the riffle, play it into the lock. Listen to the drum, then ask the capsule. One blast of the conch spends the breath. A wrong goose call still spooks them.",
  },
  {
    id: "orchard",
    title: "Addison line",
    figure: "Fig. 6 — the half-chain",
    where: "The town orchard",
    hourLabel: "3:30",
    lead: "Thirty-three feet, if a level has said the line is true. Iron in the same pocket pulls the dry compass.",
    cue: "Declare the line, then measure. Pocket the wrench if you want to see the needle lie. Stretch the chain at the knee and the flock balks — nothing is snared.",
  },
  {
    id: "study",
    title: "The study shelf",
    figure: "Fig. 7 — four pegs",
    where: "Ellis's second-life desk",
    hourLabel: "8:00",
    lead: "Four pegs. The offset book does not correct the past. While it is displayed, later readings write themselves into the notes.",
    cue: "Arm the book, then take a reading in the orchard or on the creek. Come back. The note is already there.",
  },
];

export type SceneSlice = {
  weather: Weather;
  hour: number;
  enemies: Enemy[];
  lamps: Lamp[];
  compartments: Compartment[];
  balances: Balance[];
  puzzles: Record<string, Puzzle>;
  sounds: { id: string; label: string }[];
  hiddenSounds: { id: string; label: string }[];
  documents: World["documents"];
  places: World["places"];
};

export type JournalLine = { ok: boolean; code: string; text: string };

export type Session = {
  scene: SceneId;
  kit: KitItem[];
  shelf: string[];
  materials: Record<string, number>;
  flags: Record<string, string | number | boolean>;
  merchant: World["merchant"];
  notes: string[];
  readings: World["readings"];
  identifiedSound: string | null;
  journal: JournalLine[];
  slices: Record<SceneId, SceneSlice>;
};

const pz = (id: string, expects = ""): Puzzle => ({ id, solved: false, expects, progress: 0, detail: "" });

function weather(over: Partial<Weather> = {}): Weather {
  return {
    wind: "calm",
    wet: false,
    dawn: false,
    day: true,
    overcast: false,
    rainComing: false,
    pressure: "steady",
    tempF: 58,
    ...over,
  };
}

function slices(): Record<SceneId, SceneSlice> {
  return {
    porch: {
      weather: weather({ wind: "breeze", tempF: 61 }),
      hour: 16,
      enemies: [
        { id: "porch-dog", kind: "narrow", alert: "idle", rangeYd: 4, timer: 0 },
        { id: "lane", kind: "keen-ear", alert: "idle", rangeYd: 5, timer: 0 },
      ],
      lamps: [],
      compartments: [],
      balances: [],
      puzzles: { cadence: pz("cadence") },
      sounds: [],
      hiddenSounds: [],
      documents: {},
      places: { clock: { keptTime: false } },
    },
    vigil: {
      weather: weather({ tempF: 62 }),
      hour: 18,
      enemies: [],
      lamps: [{ id: "vigil", kind: "church-vigil", lit: true, mode: "steady-pool", moths: true }],
      compartments: [],
      balances: [],
      puzzles: { press: pz("press") },
      sounds: [],
      hiddenSounds: [],
      documents: {
        hymnal: {
          text: "Spectrum ink, second verse: fourteen years is a measure, not a mercy.",
          revealed: false,
        },
      },
      places: { cider: { truthBrix: 14 } },
    },
    loft: {
      weather: weather({ wind: "calm", tempF: 64 }),
      hour: 21,
      enemies: [{ id: "loft-sleeper", kind: "rhythm", alert: "idle", rangeYd: 3, timer: 0 }],
      lamps: [],
      compartments: [{ id: "organ", hertz: 440, revealed: false, unlatched: false, soft: false }],
      balances: [],
      puzzles: {},
      sounds: [],
      hiddenSounds: [{ id: "plate-hum", label: "organ plate" }],
      documents: {},
      places: { cup: { cracked: true }, room: { creak: true } },
    },
    counter: {
      weather: weather({ tempF: 66 }),
      hour: 11,
      enemies: [],
      lamps: [],
      compartments: [],
      balances: [
        {
          id: "sash",
          currentOz: 10,
          targetOz: 18,
          tolerance: 0.5,
          overhead: true,
          hanger: false,
          held: false,
          released: false,
        },
      ],
      puzzles: {},
      sounds: [],
      hiddenSounds: [],
      documents: {},
      places: { door: {} },
    },
    creek: {
      weather: weather({ wind: "breeze", rainComing: true, pressure: "falling", tempF: 54, overcast: true }),
      hour: 14,
      enemies: [
        { id: "geese", kind: "flock", alert: "idle", rangeYd: 12, timer: 0 },
        { id: "fox", kind: "narrow", alert: "idle", rangeYd: 9, timer: 0 },
      ],
      lamps: [],
      compartments: [],
      balances: [],
      puzzles: { "creek-lock": pz("creek-lock", "otter-riffle"), taps: pz("taps"), weather: pz("weather") },
      sounds: [
        { id: "otter-riffle", label: "Otter Creek riffle" },
        { id: "geese-mutter", label: "geese on the bank" },
      ],
      hiddenSounds: [],
      documents: {},
      places: { basin: { water: true }, pot: { clean: true } },
    },
    orchard: {
      weather: weather({ wind: "breeze", tempF: 63, day: true }),
      hour: 15,
      enemies: [{ id: "orchard-geese", kind: "flock", alert: "idle", rangeYd: 8, timer: 0 }],
      lamps: [],
      compartments: [],
      balances: [],
      puzzles: {},
      sounds: [],
      hiddenSounds: [],
      documents: {},
      places: { mark: { truth: "NE" }, crack: { pin: true }, door: { missing: false } },
    },
    study: {
      weather: weather({ wind: "calm", tempF: 67, day: false }),
      hour: 20,
      enemies: [],
      lamps: [],
      compartments: [],
      balances: [],
      puzzles: {},
      sounds: [],
      hiddenSounds: [],
      documents: {},
      places: { site: { truthChanged: true, delta: "filled-cellar", old: "cellar-open" } },
    },
  };
}

export function benchPieces(): Gadget[] {
  return GADGETS.filter((g) => g.bench);
}

export function primaryScene(g: Gadget): SceneId {
  const first = g.scenes[0] === "mudroom" ? "creek" : g.scenes[0];
  if (first === "porch" || first === "vigil" || first === "loft" || first === "counter" || first === "creek" || first === "orchard" || first === "study") {
    return first;
  }
  return "study";
}

export function piecesHere(scene: SceneId): Gadget[] {
  return benchPieces().filter((g) => primaryScene(g) === scene);
}

export function freshSession(): Session {
  const kit = benchPieces().map((g) => {
    const self = makeKit(g, { stored: g.storage.preferred, winds: g.n === 1 ? 3 : 0, massOz: g.n === 49 ? 8 : 0 });
    return self;
  });
  return {
    scene: "porch",
    kit,
    shelf: [],
    materials: { clockOil: 2, beeswax: 2, rouge: 1, cork: 1, stone: 1 },
    flags: {},
    merchant: { markedOz: 8, actualOz: 7.6, shortFlagged: false, ledgerRead: false, credit: 0 },
    notes: [],
    readings: [],
    identifiedSound: null,
    journal: [],
    slices: slices(),
  };
}

export function assemble(session: Session): World {
  const slice = session.slices[session.scene];
  const world = emptyWorld();
  world.scene = session.scene;
  world.weather = structuredClone(slice.weather);
  world.hour = slice.hour;
  world.enemies = structuredClone(slice.enemies);
  world.lamps = structuredClone(slice.lamps);
  world.compartments = structuredClone(slice.compartments);
  world.balances = structuredClone(slice.balances);
  world.puzzles = structuredClone(slice.puzzles);
  world.sounds = structuredClone(slice.sounds);
  world.hiddenSounds = structuredClone(slice.hiddenSounds);
  world.documents = structuredClone(slice.documents);
  world.places = structuredClone(slice.places);
  world.kit = structuredClone(session.kit);
  world.shelf = [...session.shelf];
  world.materials = { ...session.materials };
  world.flags = { ...session.flags };
  world.merchant = { ...session.merchant };
  world.notes = [...session.notes];
  world.readings = session.readings.map((r) => ({ ...r }));
  world.identifiedSound = session.identifiedSound;
  return world;
}

export function absorb(session: Session, world: World): Session {
  return {
    ...session,
    kit: world.kit,
    shelf: [...world.shelf],
    materials: { ...world.materials },
    flags: { ...world.flags },
    merchant: { ...world.merchant },
    notes: [...world.notes],
    readings: world.readings.map((r) => ({ ...r })),
    identifiedSound: world.identifiedSound,
    slices: {
      ...session.slices,
      [session.scene]: {
        weather: world.weather,
        hour: world.hour,
        enemies: world.enemies,
        lamps: world.lamps,
        compartments: world.compartments,
        balances: world.balances,
        puzzles: world.puzzles,
        sounds: world.sounds,
        hiddenSounds: world.hiddenSounds,
        documents: world.documents,
        places: world.places,
      },
    },
  };
}

export function sceneMeta(id: SceneId): SceneMeta {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]!;
}
