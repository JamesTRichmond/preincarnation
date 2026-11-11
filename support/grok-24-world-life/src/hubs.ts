import type { HubDef } from "./types.ts";

const town = {
  yards: [{ x: 0, y: 0, w: 20, h: 14 }],
  greens: [{ x: 8, y: 6, w: 5, h: 4 }],
  fields: [] as { x: number; y: number; w: number; h: number }[],
  orchards: [] as { x: number; y: number; w: number; h: number }[],
};

/** Mill street and the merchant row. Geographic plate, not a family chronicle. */
export const middlebury: HubDef = {
  id: "hub.middlebury",
  plate: "Working town",
  place: "Middlebury — mill street",
  unboundNote: "Shop names and holders are seats. The narrative pack supplies who actually kept them.",
  ground: "town",
  w: 20,
  h: 14,
  structures: [
    { id: "mill", x: 1, y: 1, w: 4, h: 4, kind: "mill", label: "Mill" },
    { id: "print", x: 8, y: 1, w: 4, h: 3, kind: "shop", label: "Print" },
    { id: "smith", x: 14, y: 1, w: 5, h: 3, kind: "smith", label: "Smithy" },
    { id: "merchant", x: 14, y: 6, w: 5, h: 3, kind: "shop", label: "Scales" },
    { id: "cooper", x: 1, y: 8, w: 4, h: 4, kind: "shop", label: "Cooper" },
    { id: "staves", x: 6, y: 10, w: 3, h: 3, kind: "shed", label: "Staves" },
  ],
  waters: [{ x: 0, y: 5, w: 2, h: 3 }],
  piers: [],
  blocked: [],
  stations: [
    { id: "mb.stone", x: 5, y: 3, name: "millstone", public: true },
    { id: "mb.race", x: 3, y: 6, name: "mill race", public: true },
    { id: "mb.type", x: 10, y: 4, name: "type case", public: true },
    { id: "mb.forge", x: 16, y: 4, name: "forge", public: true },
    { id: "mb.scale", x: 16, y: 9, name: "grain scale", public: true },
    { id: "mb.bench", x: 3, y: 7, name: "cooper's bench", public: true },
    { id: "mb.staves", x: 9, y: 11, name: "stave rack", public: true },
    { id: "mb.green", x: 11, y: 8, name: "the green", public: true },
  ],
  fallbackId: "mb.green",
  ...town,
  routines: [
    {
      id: "r.miller",
      roleId: "role.miller",
      steps: [
        { stationId: "mb.stone", activityId: "dress-millstone", ticks: 16 },
        { stationId: "mb.race", activityId: "sound-the-race", ticks: 12 },
      ],
    },
    {
      id: "r.cooper",
      roleId: "role.cooper",
      steps: [
        { stationId: "mb.bench", activityId: "hoop-barrel", ticks: 16 },
        { stationId: "mb.staves", activityId: "sight-stave", ticks: 12 },
      ],
    },
    {
      id: "r.printer",
      roleId: "role.printer",
      steps: [{ stationId: "mb.type", activityId: "set-type", ticks: 18 }],
    },
    {
      id: "r.smith",
      roleId: "role.smith",
      steps: [{ stationId: "mb.forge", activityId: "pump-bellows", ticks: 18 }],
    },
    {
      id: "r.clerk",
      roleId: "role.clerk",
      steps: [{ stationId: "mb.scale", activityId: "weigh-grain", ticks: 18 }],
    },
  ],
  bindings: [
    { bindingId: "b.miller", roleId: "role.miller", routineId: "r.miller", homeStationId: "mb.stone" },
    { bindingId: "b.cooper", roleId: "role.cooper", routineId: "r.cooper", homeStationId: "mb.bench" },
    { bindingId: "b.printer", roleId: "role.printer", routineId: "r.printer", homeStationId: "mb.type" },
    { bindingId: "b.smith", roleId: "role.smith", routineId: "r.smith", homeStationId: "mb.forge" },
    { bindingId: "b.clerk", roleId: "role.clerk", routineId: "r.clerk", homeStationId: "mb.scale" },
  ],
};

const farmPaint = {
  yards: [{ x: 0, y: 9, w: 14, h: 5 }],
  greens: [] as { x: number; y: number; w: number; h: number }[],
  fields: [{ x: 14, y: 5, w: 6, h: 8 }],
  orchards: [{ x: 8, y: 1, w: 6, h: 5 }],
};

/** Dairy, orchard, hay lot. Which town's intervale is for the pack to bind. */
export const intervale: HubDef = {
  id: "hub.intervale",
  plate: "Agricultural community",
  place: "The intervale",
  unboundNote: "Not assigned to a family farm. Cornwall and New Haven both have claim; the pack chooses.",
  ground: "farm",
  w: 20,
  h: 14,
  structures: [
    { id: "house", x: 1, y: 1, w: 5, h: 3, kind: "house", label: "House" },
    { id: "dairy", x: 1, y: 6, w: 4, h: 3, kind: "shed", label: "Dairy" },
    { id: "barn", x: 14, y: 1, w: 5, h: 4, kind: "barn", label: "Barn" },
    { id: "t1", x: 9, y: 2, w: 1, h: 1, kind: "tree", label: "" },
    { id: "t2", x: 11, y: 2, w: 1, h: 1, kind: "tree", label: "" },
    { id: "t3", x: 13, y: 2, w: 1, h: 1, kind: "tree", label: "" },
    { id: "t4", x: 10, y: 4, w: 1, h: 1, kind: "tree", label: "" },
    { id: "t5", x: 12, y: 4, w: 1, h: 1, kind: "tree", label: "" },
    { id: "well", x: 8, y: 8, w: 1, h: 1, kind: "well", label: "Well" },
  ],
  waters: [],
  piers: [],
  blocked: [
    { x: 1, y: 12 },
    { x: 3, y: 12 },
    { x: 5, y: 12 },
    { x: 7, y: 12 },
    { x: 9, y: 12 },
    { x: 13, y: 12 },
    { x: 15, y: 12 },
    { x: 17, y: 12 },
  ],
  stations: [
    { id: "iv.churn", x: 3, y: 5, name: "churn stand", public: true },
    { id: "iv.loft", x: 2, y: 9, name: "cheese loft stair", public: false },
    { id: "iv.tree", x: 10, y: 3, name: "orchard row", public: true },
    { id: "iv.bin", x: 12, y: 6, name: "apple bin", public: true },
    { id: "iv.windrow", x: 16, y: 7, name: "windrow", public: true },
    { id: "iv.wagon", x: 18, y: 8, name: "hay wagon", public: true },
    { id: "iv.gap", x: 11, y: 12, name: "fence gap", public: true },
    { id: "iv.posts", x: 8, y: 11, name: "post pile", public: true },
    { id: "iv.well", x: 9, y: 8, name: "well sweep", public: true },
    { id: "iv.trough", x: 6, y: 9, name: "trough", public: true },
    { id: "iv.yard", x: 8, y: 10, name: "yard", public: true },
  ],
  fallbackId: "iv.yard",
  ...farmPaint,
  routines: [
    {
      id: "r.dairy",
      roleId: "role.dairy",
      steps: [
        { stationId: "iv.churn", activityId: "turn-churn", ticks: 14 },
        { stationId: "iv.loft", activityId: "wrap-cheese", ticks: 8 },
      ],
    },
    {
      id: "r.orchard",
      roleId: "role.orchard",
      steps: [
        { stationId: "iv.tree", activityId: "sort-apples", ticks: 14 },
        { stationId: "iv.bin", activityId: "sort-apples", ticks: 12 },
      ],
    },
    {
      id: "r.hay",
      roleId: "role.hay",
      steps: [
        { stationId: "iv.windrow", activityId: "pitch-hay", ticks: 14 },
        { stationId: "iv.wagon", activityId: "pitch-hay", ticks: 12 },
      ],
    },
    {
      id: "r.fence",
      roleId: "role.fence",
      steps: [
        { stationId: "iv.gap", activityId: "mend-fence", ticks: 14 },
        { stationId: "iv.posts", activityId: "mend-fence", ticks: 10 },
      ],
    },
    {
      id: "r.well",
      roleId: "role.well",
      steps: [
        { stationId: "iv.well", activityId: "draw-well", ticks: 12 },
        { stationId: "iv.trough", activityId: "draw-well", ticks: 10 },
      ],
    },
  ],
  bindings: [
    { bindingId: "b.dairy", roleId: "role.dairy", routineId: "r.dairy", homeStationId: "iv.churn" },
    { bindingId: "b.orchard", roleId: "role.orchard", routineId: "r.orchard", homeStationId: "iv.tree" },
    { bindingId: "b.hay", roleId: "role.hay", routineId: "r.hay", homeStationId: "iv.windrow" },
    { bindingId: "b.fence", roleId: "role.fence", routineId: "r.fence", homeStationId: "iv.gap" },
    { bindingId: "b.well", roleId: "role.well", routineId: "r.well", homeStationId: "iv.well" },
  ],
};

/** Wharf, hull on stocks, sail loft. Not a claim about a particular historic yard. */
export const otter: HubDef = {
  id: "hub.otter",
  plate: "Waterside settlement",
  place: "Otter landing",
  unboundNote: "The landing is a plate for the creek. Which wharf and whose yard the pack must say.",
  ground: "water",
  w: 20,
  h: 14,
  structures: [
    { id: "loft", x: 1, y: 1, w: 5, h: 3, kind: "shop", label: "Sail loft" },
    { id: "fish", x: 1, y: 6, w: 4, h: 3, kind: "shed", label: "Fish house" },
    { id: "hull", x: 14, y: 5, w: 5, h: 3, kind: "hull", label: "Hull" },
  ],
  waters: [{ x: 0, y: 11, w: 20, h: 3 }],
  piers: [
    { x: 6, y: 11, w: 8, h: 1 },
    { x: 8, y: 12, w: 4, h: 1 },
  ],
  blocked: [],
  stations: [
    { id: "ot.bench", x: 3, y: 4, name: "sail bench", public: true },
    { id: "ot.block", x: 3, y: 9, name: "fish block", public: true },
    { id: "ot.ice", x: 6, y: 8, name: "ice chest", public: true },
    { id: "ot.net", x: 8, y: 4, name: "net rack", public: true },
    { id: "ot.gunwale", x: 11, y: 6, name: "gunwale", public: true },
    { id: "ot.seamA", x: 14, y: 4, name: "forward seam", public: true },
    { id: "ot.seamB", x: 19, y: 6, name: "aft seam", public: true },
    { id: "ot.bollard", x: 7, y: 10, name: "bollard", public: true },
    { id: "ot.gang", x: 10, y: 11, name: "gangway", public: true },
    { id: "ot.step", x: 9, y: 10, name: "landing step", public: true },
  ],
  fallbackId: "ot.step",
  yards: [{ x: 0, y: 0, w: 20, h: 11 }],
  greens: [],
  fields: [],
  orchards: [],
  routines: [
    {
      id: "r.ferry",
      roleId: "role.ferry",
      steps: [
        { stationId: "ot.bollard", activityId: "coil-line", ticks: 14 },
        { stationId: "ot.gang", activityId: "coil-line", ticks: 12 },
      ],
    },
    {
      id: "r.net",
      roleId: "role.net",
      steps: [
        { stationId: "ot.net", activityId: "mend-net", ticks: 14 },
        { stationId: "ot.gunwale", activityId: "mend-net", ticks: 12 },
      ],
    },
    {
      id: "r.caulker",
      roleId: "role.caulker",
      steps: [
        { stationId: "ot.seamA", activityId: "caulk-seam", ticks: 14 },
        { stationId: "ot.seamB", activityId: "caulk-seam", ticks: 12 },
      ],
    },
    {
      id: "r.fish",
      roleId: "role.fish",
      steps: [
        { stationId: "ot.block", activityId: "ice-catch", ticks: 12 },
        { stationId: "ot.ice", activityId: "ice-catch", ticks: 12 },
      ],
    },
    {
      id: "r.sailmaker",
      roleId: "role.sailmaker",
      steps: [{ stationId: "ot.bench", activityId: "stitch-sail", ticks: 18 }],
    },
  ],
  bindings: [
    { bindingId: "b.ferry", roleId: "role.ferry", routineId: "r.ferry", homeStationId: "ot.bollard" },
    { bindingId: "b.net", roleId: "role.net", routineId: "r.net", homeStationId: "ot.net" },
    { bindingId: "b.caulker", roleId: "role.caulker", routineId: "r.caulker", homeStationId: "ot.seamA" },
    { bindingId: "b.fish", roleId: "role.fish", routineId: "r.fish", homeStationId: "ot.block" },
    { bindingId: "b.sailmaker", roleId: "role.sailmaker", routineId: "r.sailmaker", homeStationId: "ot.bench" },
  ],
};

export const HUBS = {
  "hub.middlebury": middlebury,
  "hub.intervale": intervale,
  "hub.otter": otter,
} as const;
