import { P } from "./habitat.ts";
import type { Encounter, HabitatKind, Sign, Waypoint } from "./types.ts";

const base = {
  flightSeconds: 5.5,
  returnSeconds: 16,
  resettleMinutes: 75,
  observeRange: 198,
  huntRange: 116,
  closeRange: 60,
  visibility: 0.92,
  soundFloor: 0,
};

function sign(
  id: string,
  at: { x: number; y: number },
  atMinute: number,
  kind: Sign["kind"],
  bearing: number,
  identifies: boolean,
  hint: string,
): Sign {
  return { id, x: at.x, y: at.y, atMinute, kind, bearing, identifies, hint };
}

function wp(at: { x: number; y: number }, atMinute: number, activity: string): Waypoint {
  return { x: at.x, y: at.y, atMinute, activity };
}

function E(
  partial: Omit<Encounter, "flightSeconds" | "returnSeconds" | "resettleMinutes" | "observeRange" | "huntRange" | "closeRange" | "visibility" | "soundFloor"> &
    Partial<Pick<Encounter, "flightSeconds" | "returnSeconds" | "resettleMinutes" | "observeRange" | "huntRange" | "closeRange" | "visibility" | "soundFloor">>,
): Encounter {
  return { ...base, ...partial };
}

/**
 * Eighteen authored circuits. All of them are on this representative margin.
 * Nothing in here is a glowing trail — direction lives on the mark you are reading.
 */
export const ENCOUNTERS: Encounter[] = [
  E({
    id: "fox-meadow-pounce",
    title: "Pounce in the lower hay",
    habitat: "field",
    profileId: "fox",
    blurb: "A narrow line through the hay, then the dig where she hunted a vole.",
    wind: { fromDeg: 0, strength: 0.8 },
    pocket: { x: 1240, y: 1040, r: 360 },
    route: [
      wp(P.foxM0, 900, "traveling"),
      wp(P.foxM1, 950, "listening"),
      wp(P.foxM2, 1040, "pouncing"),
      wp(P.foxM3, 1100, "traveling"),
    ],
    escape: [P.foxMEscape, P.foxMEscape2],
    signs: [
      sign("fox-m-track", P.foxM0, 900, "track", 40, true, "One register, not a wander. The line leaves northeast across the hay, toward the upper meadow. She is already ahead of this print."),
      sign("fox-m-dig", P.foxM2, 1040, "scat", 55, true, "A dig and a small scat. This is the hunt, not the commute. She was facing northeast when she left it."),
    ],
  }),
  E({
    id: "deer-hemlock-apple",
    title: "Hemlock bed to the drops",
    habitat: "woods",
    profileId: "deer",
    blurb: "A daytime bed in hemlock. Later she walks the gap to the fallen apples.",
    wind: { fromDeg: 135, strength: 0.85 },
    visibility: 0.78,
    pocket: { x: 1800, y: 720, r: 640 },
    resettleMinutes: 90,
    route: [
      wp(P.bed, 900, "bedded"),
      wp(P.bed, 985, "rising"),
      wp(P.deerT2, 1008, "traveling"),
      wp(P.deerGapE, 1022, "traveling"),
      wp(P.deerGapW, 1030, "traveling"),
      wp(P.deerSouth, 1048, "traveling"),
      wp(P.deerOrchard, 1068, "traveling"),
      wp(P.apples, 1090, "feeding"),
      wp(P.apples, 1160, "feeding"),
    ],
    escape: [P.deerEscape, P.deerEscape2],
    signs: [
      sign("deer-bed", P.bed, 900, "bed", 300, true, "A hemlock bed, still held. The long axis points northwest, out the stone gap toward the orchard. If this pocket's wind is off the southeast, do not walk the prints straight in — you would be upwind the whole way."),
      sign("deer-track-woods", P.deerT2, 1008, "track", 280, true, "Walking tracks, unhurried, leaving the bed northwest toward the wall gap."),
      sign("deer-track-gap", P.deerGapW, 1030, "track", 300, false, "She used the gap. The next prints aim northwest, into the orchard, not back into the trees."),
      sign("deer-browse", P.apples, 1090, "browse", 270, true, "Apple skins, torn not cut. She is feeding here, facing back toward the woods only when she checks."),
    ],
  }),
  E({
    id: "turkey-oak-scratch",
    title: "Oak scratch",
    habitat: "woods",
    profileId: "turkey",
    blurb: "Fresh scratch in the oak gap. They can see a walking person across it.",
    wind: { fromDeg: 270, strength: 0.4 },
    visibility: 0.88,
    pocket: { x: 2520, y: 440, r: 240 },
    route: [
      wp(P.oak1, 960, "scratching"),
      wp(P.oak1, 1040, "scratching"),
      wp(P.oak2, 1100, "moving to roost"),
    ],
    escape: [P.oak2, P.oakEscape],
    signs: [
      sign("turkey-scratch", P.oak1, 960, "scratch", 20, true, "Leaves flipped, still pale underneath. A flock worked north, toward the taller oaks, not down to the hay."),
      sign("turkey-feather", P.oak2, 1000, "feather", 15, true, "A barred feather caught on a stem. Body feather, not a kill. They moved north through the gap."),
    ],
  }),
  E({
    id: "grouse-drum-line",
    title: "Drum log",
    habitat: "woods",
    profileId: "grouse",
    blurb: "A ruffed grouse on a log. Dry leaves carry farther than your scent.",
    wind: { fromDeg: 10, strength: 0.35 },
    pocket: { x: 2280, y: 220, r: 200 },
    resettleMinutes: 55,
    route: [
      wp(P.grouse1, 940, "drumming"),
      wp(P.grouse1, 1020, "drumming"),
      wp(P.grouse2, 1080, "feeding"),
    ],
    escape: [P.grouse2, P.grouseEscape],
    signs: [
      sign("grouse-drop", P.grouse1, 940, "droppings", 70, true, "Grouse droppings on the log — ruffed country, not spruce. The bird is using this log, and the feed line runs east into the younger stems. Your scent will not be what flushes it."),
      sign("grouse-feather", P.grouse2, 1080, "feather", 80, false, "A rufous feather where it fed. East of the log."),
    ],
  }),
  E({
    id: "bobcat-ledge",
    title: "Ledge cat",
    habitat: "woods",
    profileId: "bobcat",
    blurb: "Round prints on the stone. No claws. The cat is the reward, not a target.",
    wind: { fromDeg: 220, strength: 0.7 },
    visibility: 0.8,
    pocket: { x: 2600, y: 1760, r: 250 },
    resettleMinutes: 110,
    route: [
      wp(P.cat1, 930, "traveling the ledge"),
      wp(P.cat1, 990, "pausing"),
      wp(P.cat2, 1080, "traveling the ledge"),
    ],
    escape: [P.cat2, P.catEscape],
    signs: [
      sign("cat-track", P.cat1, 930, "track", 140, true, "Round, direct, no claw marks. A bobcat, headed southeast along the ledge. October is not a month this pocket will let you shoot one."),
      sign("cat-scrape", P.cat2, 1000, "scat", 150, true, "A scrape and a small scat on the stone. Still southeast. The cat pauses where the ledge opens."),
    ],
  }),
  E({
    id: "cottontail-brush-row",
    title: "Brush-row form",
    habitat: "orchard",
    profileId: "cottontail",
    blurb: "A form under the brush, and a nibble just outside it. A box works if you leave.",
    wind: { fromDeg: 90, strength: 0.65 },
    pocket: { x: 860, y: 280, r: 200 },
    route: [
      wp(P.bun1, 960, "in form"),
      wp(P.bun1, 1005, "in form"),
      wp(P.bun2, 1045, "nipping"),
      wp(P.bun3, 1100, "nipping"),
    ],
    escape: [P.bun2, P.bunEscape],
    signs: [
      sign("bun-form", P.bun1, 960, "form", 60, true, "A form, warm, under the brush. Eastern cottontail — farm edge, not the rarer New England cottontail. When it leaves it nips east, just outside the stems. A box belongs on that next step, and you cannot stand over it."),
      sign("bun-nip", P.bun2, 1045, "browse", 80, true, "Fresh nips on the orchard grass. It came east out of the form."),
    ],
  }),
  E({
    id: "fox-orchard-mouse",
    title: "Orchard lane",
    habitat: "orchard",
    profileId: "fox",
    blurb: "The same kind of fox, a different meal: mice along the lane, not the hay.",
    wind: { fromDeg: 180, strength: 0.75 },
    pocket: { x: 1720, y: 260, r: 190 },
    route: [
      wp(P.foxO1, 1000, "traveling"),
      wp(P.foxO2, 1060, "pouncing"),
      wp(P.foxO3, 1120, "listening"),
    ],
    escape: [P.foxO2, P.foxOEscape],
    signs: [
      sign("fox-o-track", P.foxO1, 920, "track", 330, true, "Fox again, but the lane is north of the wall. Last night's print points northwest. Wind off the south will carry you if you come up from the hay."),
      sign("fox-o-cache", P.foxO2, 1060, "scat", 300, false, "A small cache hole between the rows. She worked north, then checked west."),
    ],
  }),
  E({
    id: "deer-apple-yearling",
    title: "Yearling at the west row",
    habitat: "orchard",
    profileId: "deer",
    blurb: "Another deer, already on the west drops. Different wind than the hemlock doe.",
    wind: { fromDeg: 315, strength: 0.7 },
    pocket: { x: 640, y: 490, r: 180 },
    route: [
      wp(P.year1, 960, "feeding"),
      wp(P.year2, 1040, "feeding"),
      wp(P.year2, 1120, "feeding"),
    ],
    escape: [P.year1, P.yearEscape],
    signs: [
      sign("year-track", P.year1, 960, "track", 40, true, "Smaller deer tracks, feeding not fleeing. They drift northeast along the row. Wind here comes off the northwest — the hemlock pocket's rule does not apply."),
      sign("year-browse", P.year2, 1040, "browse", 20, true, "More skins. The yearling is staying in this row, facing north into the trees when it worries."),
    ],
  }),
  E({
    id: "muskrat-pushup",
    title: "Push-up channel",
    habitat: "marsh",
    profileId: "muskrat",
    blurb: "Cuttings and a tail drag. Not a beaver, and not a shot.",
    wind: { fromDeg: 200, strength: 0.5 },
    soundFloor: 0.25,
    visibility: 0.8,
    pocket: { x: 980, y: 1600, r: 200 },
    route: [
      wp(P.musk1, 950, "cutting"),
      wp(P.musk2, 1030, "swimming the channel"),
      wp(P.musk2, 1120, "cutting"),
    ],
    escape: [P.musk2, P.muskEscape],
    signs: [
      sign("musk-cut", P.musk1, 950, "browse", 120, true, "Cattail cuttings, peeled. A muskrat channel, with a thin tail drag heading southeast. Too small for beaver."),
      sign("musk-drag", P.musk2, 1000, "drag", 110, true, "The drag continues southeast. The animal is in the channel, not on the bank you are standing on."),
    ],
  }),
  E({
    id: "wood-duck-timber",
    title: "Timber hole",
    habitat: "marsh",
    profileId: "wood-duck",
    blurb: "Wood ducks in the flooded stems. They leave when they see you. No season is claimed.",
    wind: { fromDeg: 250, strength: 0.45 },
    visibility: 0.7,
    soundFloor: 0.3,
    pocket: { x: 620, y: 1340, r: 210 },
    route: [
      wp(P.duck1, 960, "loafing"),
      wp(P.duck1, 1050, "loafing"),
      wp(P.duck2, 1120, "loafing"),
    ],
    escape: [P.duck2, P.duckEscape],
    signs: [
      sign("duck-feather", P.duck1, 940, "feather", 320, true, "A wood duck feather — the white thread and the iridescence, not a mallard's speculum lying in a field. They are using the timber north of this feather."),
      sign("duck-web", P.duck2, 1080, "track", 300, true, "Webbed prints in the mud, heading northwest toward the creek, not out onto the hay."),
    ],
  }),
  E({
    id: "raccoon-marsh-cray",
    title: "Crayfish ditch",
    habitat: "marsh",
    profileId: "raccoon",
    blurb: "Last night's hands in the mud. The raccoon comes back late.",
    wind: { fromDeg: 80, strength: 0.55 },
    visibility: 0.75,
    pocket: { x: 1360, y: 1780, r: 210 },
    route: [
      wp(P.coonM1, 1088, "foraging"),
      wp(P.coonM2, 1140, "foraging"),
      wp(P.coonM2, 1200, "traveling"),
    ],
    escape: [P.coonM2, P.coonMEscape],
    signs: [
      sign("coon-m-hand", P.coonM1, 200, "track", 140, true, "A hand, five toes, hours old. Last night's raccoon worked southeast along the ditch. The animal is not here yet this evening. A box can wait on the line; you should not."),
      sign("coon-m-dig", P.coonM2, 220, "browse", 150, false, "Crayfish shells and a dug bank. The meal was southeast of the first prints."),
    ],
  }),
  E({
    id: "cottontail-marsh-berm",
    title: "Berm rabbit",
    habitat: "marsh",
    profileId: "cottontail",
    blurb: "A second rabbit, on the firm berm where the marsh meets the hay.",
    wind: { fromDeg: 350, strength: 0.6 },
    pocket: { x: 1220, y: 1310, r: 170 },
    route: [
      wp(P.berm1, 970, "in form"),
      wp(P.berm1, 1030, "in form"),
      wp(P.berm2, 1080, "nipping"),
    ],
    escape: [P.berm1, P.bermEscape],
    signs: [
      sign("berm-form", P.berm1, 970, "form", 50, true, "Another form, this one on the berm. It will nip northeast if you let it. The orchard rabbit is a different animal."),
      sign("berm-nip", P.berm2, 1080, "browse", 40, false, "Nips on the berm grass. Northeast of the form."),
    ],
  }),
  E({
    id: "coyote-hay-transit",
    title: "Hay crossing",
    habitat: "field",
    profileId: "coyote",
    blurb: "Scat on a line through the south hay. The coyote crosses once, later.",
    wind: { fromDeg: 260, strength: 0.85 },
    pocket: { x: 1000, y: 1520, r: 280 },
    resettleMinutes: 100,
    route: [
      wp(P.yote1, 1010, "traveling"),
      wp(P.yote2, 1045, "scent-posting"),
      wp(P.yote3, 1085, "traveling"),
    ],
    escape: [P.yote3, P.yoteEscape],
    signs: [
      sign("yote-scat", P.yote1, 800, "scat", 100, true, "Coyote scat on the south line, from this morning, heading east. They are not on it now. Wind off the west will announce you if you wait upwind of the crossing."),
      sign("yote-track", P.yote2, 1045, "track", 90, true, "Fresh now. Direct register, larger than the fox. Still east."),
    ],
  }),
  E({
    id: "turkey-field-edge",
    title: "Flock at the woods edge",
    habitat: "field",
    profileId: "turkey",
    blurb: "The same kind of bird, in the open hay. If you can see them clearly, they can see you walking.",
    wind: { fromDeg: 90, strength: 0.3 },
    visibility: 1,
    pocket: { x: 1780, y: 1040, r: 230 },
    route: [
      wp(P.turkF1, 980, "feeding"),
      wp(P.turkF1, 1060, "feeding"),
      wp(P.turkF2, 1120, "moving to roost"),
    ],
    escape: [P.turkFEscape, P.turkFEscape2],
    signs: [
      sign("turk-f-scratch", P.turkF1, 980, "scratch", 40, true, "Hay scratched open. A flock feeding, drifting northeast toward the wall gap and the roost trees. Scent will not save you. Stillness might."),
      sign("turk-f-drop", P.turkF2, 1040, "droppings", 30, false, "Droppings farther northeast. They are working toward the woods, not the creek."),
    ],
  }),
  E({
    id: "deer-alfalfa-edge",
    title: "Alfalfa edge",
    habitat: "field",
    profileId: "deer",
    blurb: "A deer on the alfalfa just south of the wall. This pocket's wind comes off the north.",
    wind: { fromDeg: 0, strength: 0.9 },
    pocket: { x: 1140, y: 800, r: 175 },
    route: [
      wp(P.alf1, 960, "feeding"),
      wp(P.alf2, 1040, "feeding"),
      wp(P.alf2, 1140, "feeding"),
    ],
    escape: [P.alfEscape, P.alfEscape2],
    signs: [
      sign("alf-track", P.alf1, 960, "track", 120, true, "Deer on the alfalfa, tracks heading southeast along the wall. Wind in this pocket is from the north. Come up from the south, or you are walking your scent onto the animal. The hemlock doe is a different circuit."),
      sign("alf-browse", P.alf2, 1040, "browse", 140, true, "Alfalfa nipped, still wet. Feeding, facing southeast."),
    ],
  }),
  E({
    id: "otter-slide-creek",
    title: "Slide on Otter Creek",
    habitat: "water",
    profileId: "otter",
    blurb: "A slide and a spraint. The creek covers footfall. It does not cover a wind off the hay.",
    wind: { fromDeg: 90, strength: 0.8 },
    soundFloor: 0.74,
    visibility: 0.86,
    pocket: { x: 360, y: 1040, r: 230 },
    route: [
      wp(P.otter1, 960, "sliding"),
      wp(P.otter2, 1030, "fishing"),
      wp(P.otter2, 1120, "scenting"),
    ],
    escape: [P.otter2, P.otterEscape],
    signs: [
      sign("otter-slide", P.otter1, 960, "slide", 0, true, "A belly slide, worn, aimed north along the bank toward the eddy. Spraint nearby is a message, not a direction of travel. Wind off the hay — the east — blows onto this bank. Crosswind, from up-creek or down-creek, is the quiet approach. Downwind is in the river."),
      sign("otter-spraint", P.otter2, 1000, "spraint", 10, true, "Spraint on a rock, fish scales in it. A latrine, north of the slide. Not a deer trail and not a path you are meant to follow into the water."),
    ],
  }),
  E({
    id: "beaver-scent-mound",
    title: "Scent mound",
    habitat: "water",
    profileId: "beaver",
    blurb: "A mound on the north bank. The beaver comes off the lodge later. You do not open it.",
    wind: { fromDeg: 140, strength: 0.6 },
    soundFloor: 0.62,
    pocket: { x: 400, y: 430, r: 200 },
    route: [
      wp(P.beav1, 1055, "mounding"),
      wp(P.beav2, 1110, "hauling"),
      wp(P.beav2, 1180, "hauling"),
    ],
    escape: [P.beav2, P.beavEscape],
    signs: [
      sign("beav-mound", P.beav1, 880, "mound", 330, true, "A scent mound, mud patted up, smelling of castoreum. Beaver, not muskrat. The feeding drag leaves northwest. The animal is still on the water until later."),
      sign("beav-drag", P.beav2, 1110, "drag", 320, true, "A fresh haul off the bank, northwest. Cut stems, wider than the muskrat's work."),
    ],
  }),
  E({
    id: "raccoon-creek-ford",
    title: "Ford prints",
    habitat: "water",
    profileId: "raccoon",
    blurb: "Hands in the ford mud. A second raccoon, and a place a box can sit until evening.",
    wind: { fromDeg: 170, strength: 0.55 },
    soundFloor: 0.5,
    pocket: { x: 460, y: 1600, r: 200 },
    route: [
      wp(P.coonF1, 1120, "foraging"),
      wp(P.coonF2, 1170, "washing"),
      wp(P.coonF2, 1230, "traveling"),
    ],
    escape: [P.coonF2, P.coonFEscape],
    signs: [
      sign("coon-f-hand", P.coonF1, 240, "track", 160, true, "Hand prints in the ford, cold, from before dawn, heading south along the mud. This is not the ditch raccoon. Set a box on the south line and leave the bank."),
      sign("coon-f-shell", P.coonF2, 300, "browse", 170, false, "Mussel shell and a wet stone. The work continued south."),
    ],
  }),
];

export const ENCOUNTER_BY_ID: Record<string, Encounter> = Object.fromEntries(
  ENCOUNTERS.map((e) => [e.id, e]),
);

export const HABITAT_KINDS: HabitatKind[] = ["woods", "orchard", "marsh", "field", "water"];

/** The four circuits that teach the loop if an afternoon is short. The other fourteen are on the ground too. */
export const REPRESENTATIVE_IDS = [
  "fox-meadow-pounce",
  "deer-hemlock-apple",
  "turkey-field-edge",
  "otter-slide-creek",
] as const;
