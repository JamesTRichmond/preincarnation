import type {
  BeatId,
  EraId,
  HabitatId,
  LightMode,
  Pace,
  PrepId,
  SoundMode,
  StationId,
  WeatherId,
  WorldState,
} from "./types.ts";

export const ERA_LABEL: Record<EraId, string> = {
  mudlight: "Mudlight",
  "green-crown": "Green Crown",
  "amber-gate": "Amber Gate",
  "vein-night": "Vein Night",
  "locked-snow": "Locked Snow",
};

export const ERA_NOTE: Record<EraId, string> = {
  mudlight: "Ice leaving the creek. The first wet weeks.",
  "green-crown": "High summer. Milkweed, turtlehead, and open water.",
  "amber-gate": "Goldenrod weeks. The meadow going brass.",
  "vein-night": "The Vein runs close. Living light, and years that were not lived.",
  "locked-snow": "The meadow shut. Only what overwinters is honest.",
};

export const BEAT_LABEL: Record<BeatId, string> = {
  dawn: "Dawn",
  morning: "Morning",
  noon: "Noon",
  dusk: "Dusk",
  "true-dark": "True Dark",
};

export const WEATHER_LABEL: Record<WeatherId, string> = {
  clear: "Clear",
  "after-rain": "After rain",
  mist: "Mist",
};

export const PACE_LABEL: Record<Pace, string> = {
  creep: "Creep",
  ordinary: "Ordinary pace",
  hurry: "Hurry",
};

export const LIGHT_LABEL: Record<LightMode, string> = {
  off: "Lantern dark",
  warm: "Warm lantern",
  dim: "Dim lantern",
  pulse: "Pulsing lantern",
};

export const SOUND_LABEL: Record<SoundMode, string> = {
  quiet: "Quiet",
  clap: "A clap",
  whistle: "A whistle",
  drum: "Drumming the bark",
  "match-tick": "Matching the tick",
};

export const PREP_LABEL: Record<PrepId, string> = {
  "turn-log": "Turn the log",
  "turn-stone": "Turn a flat stone",
  "palm-water": "Wet your hands",
  "sugar-cloth": "Lay a sugar cloth",
  "sap-smear": "Smear a little sap",
  "infirmary-scrap": "Hang an infirmary scrap",
};

export const HABITAT_INFO: Record<
  HabitatId,
  { name: string; place: string; blurb: string }
> = {
  "lantern-meadow": {
    name: "Lantern Meadow",
    place: "Otter Creek floodplain, Weybridge",
    blurb: "The wet meadow below the Moth Infirmary. This is the walk you can take today.",
  },
  "dead-creek": {
    name: "Dead Creek",
    place: "Addison dikes and cattail",
    blurb: "Impoundments and a long sky. Not on today's walk.",
  },
  "snake-mountain": {
    name: "Snake Mountain",
    place: "West slope, Addison",
    blurb: "Talus, red oak, and bark that holds a winter firefly. Not on today's walk.",
  },
  "champlain-shore": {
    name: "Champlain shore",
    place: "Button Bay cobble and fields",
    blurb: "Lake wind, a cove, and the summer hatch. Not on today's walk.",
  },
  "infirmary-lane": {
    name: "Infirmary lane",
    place: "The papered windows above the meadow",
    blurb: "Sister Halve's moth house. Not on today's walk.",
  },
  "lincoln-gap": {
    name: "Lincoln Gap",
    place: "Hardwoods and a cold seep",
    blurb: "Thrush country, vernal pools, and water that stays cold. Not on today's walk.",
  },
};

export const STATION_INFO: Record<StationId, { name: string; line: string; preps: PrepId[] }> = {
  milkweed: {
    name: "Milkweed verge",
    line: "Common milkweed along the near path. The flowers are the work.",
    preps: [],
  },
  goldenrod: {
    name: "Goldenrod bank",
    line: "A brass stand of goldenrod between the path and the wall.",
    preps: [],
  },
  creek: {
    name: "Creek bend",
    line: "Slow water, flat stones, and a shaded lip where a damselfly sits.",
    preps: ["turn-stone"],
  },
  wall: {
    name: "Stone wall",
    line: "Fieldstone, lichen, and Ellis Quill's usual perch on the far end.",
    preps: ["palm-water"],
  },
  log: {
    name: "Old log",
    line: "A down maple in the damp grass. The underside stays dark.",
    preps: ["turn-log", "palm-water"],
  },
  turtlehead: {
    name: "Turtlehead pocket",
    line: "A wet scrape where white turtlehead still holds its row of flowers.",
    preps: [],
  },
  spring: {
    name: "Spring channel",
    line: "A cold thread off the main creek. Cress, gravel, and a fish that will not use the warm bend.",
    preps: [],
  },
  lantern: {
    name: "Lantern circle",
    line: "The last rise toward the Infirmary. One paper lantern, and the moths that know it.",
    preps: [],
  },
};

export const TRAIL: StationId[] = [
  "milkweed",
  "goldenrod",
  "wall",
  "creek",
  "log",
  "turtlehead",
  "spring",
  "lantern",
];

export function freshWorld(): WorldState {
  return {
    habitatId: "lantern-meadow",
    era: "green-crown",
    beat: "morning",
    weather: "clear",
    station: null,
    pace: "ordinary",
    light: "off",
    sound: "quiet",
    preps: [],
  };
}

export function nextBeat(beat: BeatId): BeatId {
  const order: BeatId[] = ["dawn", "morning", "noon", "dusk", "true-dark"];
  const index = order.indexOf(beat);
  return order[(index + 1) % order.length] ?? "dawn";
}

export function nextWeather(weather: WeatherId): WeatherId {
  if (weather === "clear") return "after-rain";
  if (weather === "after-rain") return "mist";
  return "clear";
}
