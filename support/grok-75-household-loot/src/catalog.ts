import {
  catalogId,
  type AcceptRule,
  type AnchorTag,
  type CatalogItem,
  type Category,
  type Era,
  type Footprint,
  type InteractionKind,
} from "./types.ts";

const S: Era = "settlement";
const H: Era = "homestead";
const M: Era = "memory";

interface Spec {
  footprint?: Footprint;
  rotatable?: boolean;
  blocksExit?: boolean;
  providesSupport?: boolean;
  requiresSupport?: boolean;
  anchorTags: AnchorTag[];
  eras: Era[];
  tags?: string[];
  brightness?: number;
  stableInBreeze?: boolean;
  workLight?: boolean;
  reveal?: { id: string; text: string };
  revealByEra?: Partial<Record<Era, string>>;
  lettersOffer?: string;
  lightVisitorLine?: string;
  motif?: string;
  needsBreeze?: boolean;
  windable?: boolean;
  frozenHour?: number;
  dripMax?: number;
  strikeVisitorLine?: string;
  accept?: AcceptRule;
  foods?: string[];
  serveVisitorLine?: string;
  yieldName?: string;
  yieldTags?: string[];
  consumesFood?: string;
  namesTextile?: boolean;
  visitorLine?: string;
  greetWrites?: "chalk" | "signature";
  arms?: boolean;
  aligns?: boolean;
  namesCompanions?: boolean;
}

function item(
  n: number,
  name: string,
  category: Category,
  interaction: InteractionKind,
  summary: string,
  history: [string, string, string],
  spec: Spec,
): CatalogItem {
  return {
    id: catalogId(n),
    n,
    name,
    category,
    interaction,
    summary,
    history: { settlement: history[0], homestead: history[1], memory: history[2] },
    footprint: spec.footprint ?? "small",
    rotatable: spec.rotatable ?? false,
    blocksExit: spec.blocksExit ?? false,
    providesSupport: spec.providesSupport ?? false,
    requiresSupport: spec.requiresSupport ?? false,
    anchorTags: spec.anchorTags,
    eras: spec.eras,
    tags: spec.tags ?? [],
    brightness: spec.brightness,
    stableInBreeze: spec.stableInBreeze,
    workLight: spec.workLight,
    reveal: spec.reveal,
    revealByEra: spec.revealByEra,
    lettersOffer: spec.lettersOffer,
    lightVisitorLine: spec.lightVisitorLine,
    motif: spec.motif,
    needsBreeze: spec.needsBreeze,
    windable: spec.windable,
    frozenHour: spec.frozenHour,
    dripMax: spec.dripMax,
    strikeVisitorLine: spec.strikeVisitorLine,
    accept: spec.accept,
    foods: spec.foods,
    serveVisitorLine: spec.serveVisitorLine,
    yieldName: spec.yieldName,
    yieldTags: spec.yieldTags,
    consumesFood: spec.consumesFood,
    namesTextile: spec.namesTextile,
    visitorLine: spec.visitorLine,
    greetWrites: spec.greetWrites,
    arms: spec.arms,
    aligns: spec.aligns,
    namesCompanions: spec.namesCompanions,
  };
}

const floor: AnchorTag[] = ["floor"];
const wall: AnchorTag[] = ["wall"];
const table: AnchorTag[] = ["table", "shelf"];
const porch: AnchorTag[] = ["porch", "wall"];

export const CATALOG: CatalogItem[] = [
  item(
    1,
    "Rushlight prick",
    "lamp",
    "illumination",
    "A fatwood flare that shows the old crack in the hearth.",
    [
      "A split of fatwood in an iron prick. This is how the room first stayed awake.",
      "Hung above the hearth after lamps came. The prick still fits the crack in the stone.",
      "Nobody works by it now. The smell of fatwood is the whole story.",
    ],
    {
      eras: [S],
      anchorTags: ["hearth", "floor"],
      brightness: 1,
      reveal: { id: "hearth-crack", text: "The hearth stone is cracked where the prick stood." },
    },
  ),

  item(
    2,
    "Betty lamp",
    "lamp",
    "illumination",
    "A hanging lamp that picks out the flax caught on the work hook.",
    [
      "Grease in an open pan, a wick, a hook. The corner where hands work.",
      "Still the honest light over the bench, even after glass chimneys arrived.",
      "The pan is dry. What it shows is the thread the hook never gave back.",
    ],
    {
      eras: [S, H],
      anchorTags: ["hearth", "work", "table"],
      brightness: 2,
      rotatable: true,
      workLight: true,
      reveal: { id: "work-hook", text: "A thread of flax is caught on the work hook." },
    },
  ),

  item(
    3,
    "Tin barn lantern",
    "lamp",
    "illumination",
    "A pierced tin lantern that keeps the path to the door readable.",
    [
      "Not yet. The path was found with feet, not with tin.",
      "Punched tin, a wire bail, enough light to cross the yard without naming every stone.",
      "It remembers the paler board that boots wore smooth before any lantern did.",
    ],
    {
      eras: [H],
      anchorTags: ["floor", "porch"],
      brightness: 2,
      rotatable: true,
      stableInBreeze: true,
      reveal: { id: "exit-path", text: "The path to the door is a paler board." },
    },
  ),

  item(
    4,
    "Beeswax reading lamp",
    "lamp",
    "illumination",
    "A short beeswax flame that offers the margin note to the letters.",
    [
      "Beeswax was a visiting luxury. The room read by fatwood.",
      "A turned maple stick and a beeswax pillar. The margin note becomes readable.",
      "The wax is a memory of a thumb smoothing it flat so the letter would lie still.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      brightness: 2,
      rotatable: true,
      lettersOffer: "letter.ash-bend.margin",
      reveal: { id: "margin", text: "A margin note waits with the letters." },
    },
  ),

  item(
    5,
    "Kerosene table lamp",
    "lamp",
    "illumination",
    "A glass chimney Mara judges by how clean it is.",
    [
      "Kerosene has not come up the notch road.",
      "A chimney, a brass collar, a flame tall enough to eat supper by.",
      "The collar is tarnished where a hand turned it down each night.",
    ],
    {
      eras: [H],
      anchorTags: ["table"],
      requiresSupport: true,
      footprint: "medium",
      brightness: 3,
      rotatable: true,
      lightVisitorLine: "Mara says the chimney is clean, which is how she praises a house.",
    },
  ),

  item(
    6,
    "Pier-glass sconce",
    "lamp",
    "illumination",
    "A wall sconce whose mirror answers with the year you are in.",
    [
      "No pier glass yet. The wall was bare plaster and a nail.",
      "The sconce throws the room back at itself, a little kinder than it is.",
      "The mirror has lost a corner. It gives back the evening, not the furniture.",
    ],
    {
      eras: [H, M],
      anchorTags: wall,
      brightness: 1,
      revealByEra: {
        homestead: "The glass gives back a working room, apron and all.",
        memory: "The glass gives back the evening and refuses the rest.",
      },
    },
  ),

  item(
    7,
    "Hurricane lamp",
    "lamp",
    "illumination",
    "A sheltered flame that stays when the window is opened.",
    [
      "No hurricane glass. Wind was a reason to close the shutter.",
      "The chimney is tall so a draft from the door does not end supper.",
      "It is the lamp you trust when the rest of the room gutters.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      footprint: "medium",
      brightness: 2,
      rotatable: true,
      stableInBreeze: true,
    },
  ),

  item(
    8,
    "Chamberstick",
    "lamp",
    "illumination",
    "A handheld stick that names whatever is sharing its surface.",
    [
      "Carried from the fire to the bed. The thumb-rest is already dark.",
      "Set down where the work is. It introduces the things beside it.",
      "The rest is worn to the grain. It still points at what you put near it.",
    ],
    {
      eras: [S, H, M],
      anchorTags: ["table", "shelf", "hearth"],
      requiresSupport: true,
      brightness: 1,
      rotatable: true,
      namesCompanions: true,
    },
  ),

  item(
    9,
    "Night-oil cruse",
    "lamp",
    "illumination",
    "The low cruse E.H. left burning the night the road closed.",
    [
      "A clay cruse of oil. Someone meant to come back for it.",
      "Kept after better lamps, because of who had filled it.",
      "E.H. left this burning the night the notch road closed.",
    ],
    {
      eras: [M],
      anchorTags: ["hearth", "table"],
      brightness: 1,
      reveal: { id: "who-left-it", text: "E.H. left this burning the night the road closed." },
    },
  ),

  item(
    10,
    "Porch lantern",
    "lamp",
    "illumination",
    "The porch light Mara reads as permission to come up.",
    [
      "The porch was a step, not a lantern post.",
      "Iron and four panes. Lit, it means the house is receiving.",
      "The hook has rubbed the clapboard pale. That is how long it has meant come up.",
    ],
    {
      eras: [H, M],
      anchorTags: porch,
      footprint: "medium",
      brightness: 2,
      stableInBreeze: true,
      lightVisitorLine: "Mara knows this light. It is how she knows to come up.",
    },
  ),

  item(
    11,
    "Parlor fiddle",
    "instrument",
    "sound",
    "A brown parlor fiddle. One short reel, offered to the house music.",
    [
      "No parlor yet, and no fiddle on a peg.",
      "Varnish worn at the chin. It knows one reel and does not apologize.",
      "The bow hair is thin. The reel is how the room starts remembering aloud.",
    ],
    { eras: [H, M], anchorTags: floor, footprint: "medium", rotatable: true, motif: "fiddle-reel" },
  ),

  item(
    12,
    "Mountain dulcimer",
    "instrument",
    "sound",
    "A three-string dulcimer played on the lap, all drone and air.",
    [
      "Not in the first room. Hands were on other tools.",
      "Walnut, three strings, a noter stick. It fills a corner without a tune you could name.",
      "The sound holes have the shape of a leaf somebody loved once.",
    ],
    {
      eras: [H, M],
      anchorTags: floor,
      footprint: "medium",
      rotatable: true,
      motif: "dulcimer-drone",
    },
  ),

  item(
    13,
    "Penny whistle",
    "instrument",
    "sound",
    "A tin whistle that still has a high, short air in it.",
    [
      "Bought or traded. It lives in a pocket more than on a shelf.",
      "Six holes, a sweet top end, the kind of air you play while waiting on water to boil.",
      "The mouthpiece is dented. The air is intact.",
    ],
    { eras: [S, H, M], anchorTags: ["floor", "table"], motif: "whistle-air" },
  ),

  item(
    14,
    "Jaw harp",
    "instrument",
    "sound",
    "A iron jaw harp. The twang sits in the teeth, not in the room.",
    [
      "A horseshoe of iron and a spring. Settlement music that packs flat.",
      "Still in the tool drawer some years, because nobody agreed it was an instrument.",
      "The spring is tired. The twang is the joke it keeps telling.",
    ],
    { eras: [S, H], anchorTags: ["floor", "table"], motif: "jawharp-twang" },
  ),

  item(
    15,
    "Parlor upright",
    "instrument",
    "sound",
    "An upright piano. One chord, then it leaves the room alone.",
    [
      "Too large, too soon. The first room had no wall for it.",
      "A homely upright, one sticky key, a chord that makes the plaster answer.",
      "The lid sticks. The chord is enough.",
    ],
    {
      eras: [H, M],
      anchorTags: floor,
      footprint: "wide",
      rotatable: true,
      blocksExit: true,
      motif: "piano-chord",
    },
  ),

  item(
    16,
    "Bodhran",
    "instrument",
    "sound",
    "A frame drum. The pulse is a walk across the kitchen.",
    [
      "Hide and a hoop. It marks time while someone else sings.",
      "Hung on a nail when it isn't on a knee.",
      "The hide has gone soft. The pulse is still a walk, not a performance.",
    ],
    { eras: [S, H], anchorTags: floor, footprint: "medium", motif: "bodhran-pulse" },
  ),

  item(
    17,
    "Maple music box",
    "instrument",
    "sound",
    "A maple box with one clockwork phrase and a leaf on the lid.",
    [
      "Clockwork like this had not come into the house.",
      "Wind it once. It spends a small waltz and stops exactly.",
      "The leaf inlay is what you remember. The waltz is how you get there.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      rotatable: true,
      motif: "musicbox-waltz",
    },
  ),

  item(
    18,
    "Harmonica",
    "instrument",
    "sound",
    "A mouth harp that fogs, then gives back a low phrase.",
    [
      "Not yet a pocket habit.",
      "Ten holes, a dented cover, a phrase learned off someone at the store.",
      "It tastes like tin and winter. The phrase is shorter than it used to be.",
    ],
    { eras: [H, M], anchorTags: ["floor", "table"], motif: "harmonica-breath" },
  ),

  item(
    19,
    "Cedar tube chimes",
    "chime",
    "sound",
    "Cedar tubes that only speak when the window is open.",
    [
      "No chime. Wind was weather, not an instrument.",
      "Five tubes, uneven, hung where a person ducks.",
      "They keep the interval of the tree they were. They need the window.",
    ],
    {
      eras: [H, M],
      anchorTags: ["wall", "porch"],
      footprint: "medium",
      motif: "chime-cedar",
      needsBreeze: true,
    },
  ),

  item(
    20,
    "Spoon chimes",
    "chime",
    "sound",
    "Kitchen spoons on a ring. Mara laughs when they actually ring.",
    [
      "Spoons were for stirring, and every one was accounted for.",
      "Three worn spoons wired so the door's draft plays them.",
      "They embarrass the room a little. That is why they stay.",
    ],
    {
      eras: [H],
      anchorTags: wall,
      motif: "chime-spoon",
      needsBreeze: true,
      strikeVisitorLine: "Mara laughs once, the way a spoon rings.",
    },
  ),

  item(
    21,
    "Shell chimes",
    "chime",
    "sound",
    "Lake shells that click more than they ring.",
    [
      "The lake was a journey, not a hanging.",
      "A string of shells from a long day nobody wrote down.",
      "They click. The lake is in the click, not in a view.",
    ],
    { eras: [M], anchorTags: ["wall", "porch"], motif: "chime-shell", needsBreeze: true },
  ),

  item(
    22,
    "Bottle-glass chimes",
    "chime",
    "sound",
    "Shards of bottle glass, green and amber, hung out of reach.",
    [
      "Bottles were kept whole.",
      "Broken glass sanded safe and strung, because waste was a habit and beauty was the excuse.",
      "They flash before they sound. The sound is the smaller part.",
    ],
    {
      eras: [H, M],
      anchorTags: ["wall", "porch"],
      footprint: "medium",
      motif: "chime-glass",
      needsBreeze: true,
    },
  ),

  item(
    23,
    "Nail chimes",
    "chime",
    "sound",
    "Cut nails on a wire. Settlement metal, stark when the wind takes it.",
    [
      "Bent nails saved, then strung, because metal was the scarce music.",
      "Still by the back door, uglier than the cedar and harder to ignore.",
      "They belong to the first years. The room keeps them for the honesty.",
    ],
    { eras: [S, H], anchorTags: ["wall", "porch"], motif: "chime-nail", needsBreeze: true },
  ),

  item(
    24,
    "Door harp",
    "chime",
    "visitor",
    "A four-string harp on the jamb. It answers a knock, or a finger.",
    [
      "The door was a latch, not a greeting.",
      "Four strings and a wooden ball. Opening the door is already a note.",
      "Mara knows which string is hers. She pretends she doesn't.",
    ],
    {
      eras: [H, M],
      anchorTags: wall,
      motif: "door-harp",
      visitorLine:
        "Mara plucks the harp with one finger and says she only ever knocks with the other.",
    },
  ),

  item(
    25,
    "Maple tea tray",
    "tray",
    "serve",
    "An oval tray for the tea and maple cookies already in the pantry.",
    [
      "Tea was leaves in a pot, not a tray with a ceremony.",
      "Maple, oval, two cups that don't match. It carries what the pantry already has.",
      "The finish is cloudy where damp cups sat through a hundred visits.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      footprint: "medium",
      rotatable: true,
      foods: ["food.tea", "food.maple-cookies"],
    },
  ),

  item(
    26,
    "Bread peel",
    "tray",
    "serve",
    "A long peel that serves the brown bread, and only the bread.",
    [
      "Used to move loaves. Serving is just the last inch of the same gesture.",
      "Flour in the grain of the wood. It will not carry a pie and pretend.",
      "The handle is dark where it was pulled. The loaf is the point.",
    ],
    {
      eras: [S, H, M],
      anchorTags: ["table", "shelf", "work"],
      requiresSupport: true,
      footprint: "medium",
      rotatable: true,
      foods: ["food.bread"],
    },
  ),

  item(
    27,
    "Apple-butter board",
    "tray",
    "serve",
    "A small board for the crock of apple butter.",
    [
      "Apples were dried or sauced. The board comes later.",
      "A round board with a knife scar. It serves the butter, not a speech about apples.",
      "The scar is from a hasty supper. The smell is the memory.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      rotatable: true,
      foods: ["food.apple-butter"],
    },
  ),

  item(
    28,
    "Pie-safe tray",
    "tray",
    "serve",
    "A punched-tin tray that will hold a slice of windfall pie.",
    [
      "No pie safe yet. Windfalls were eaten standing.",
      "The tin is punched in a star so the slice can travel to a chair.",
      "The star is dull. The pie, if the pantry has it, is still the offer.",
    ],
    {
      eras: [H],
      anchorTags: table,
      requiresSupport: true,
      footprint: "medium",
      rotatable: true,
      foods: ["food.pie"],
    },
  ),

  item(
    29,
    "Biscuit plate",
    "tray",
    "serve",
    "A thick plate of biscuits that means more when Mara is here.",
    [
      "Biscuits were wrapped in a cloth, not plated for company.",
      "The rim is chipped toward the sink. Company gets the far side.",
      "It remembers being passed, not being displayed.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      rotatable: true,
      foods: ["food.biscuits"],
      serveVisitorLine: "Mara takes the edge biscuit and leaves the middle, which is manners here.",
    },
  ),

  item(
    30,
    "Milk trivet",
    "tray",
    "serve",
    "A cork trivet that keeps the morning milk off the bare table.",
    [
      "Milk went to the crock, not to a trivet.",
      "Cork and a tin ring. It serves milk and protects the finish.",
      "The cork is stained in a ring the size of the old pitcher.",
    ],
    { eras: [H], anchorTags: ["table"], requiresSupport: true, foods: ["food.milk"] },
  ),

  item(
    31,
    "Sugar trencher",
    "tray",
    "serve",
    "A wooden trencher for sugar-on-snow cakes.",
    [
      "Trenchers were everyday. Sweet on snow was a weather, not a dish you owned.",
      "Scored from knives. It carries the cakes if the pantry still has them.",
      "You can see where a child dragged a cake through the grain.",
    ],
    {
      eras: [S, H, M],
      anchorTags: table,
      requiresSupport: true,
      rotatable: true,
      foods: ["food.sugar-cakes"],
    },
  ),

  item(
    32,
    "Jam stand",
    "tray",
    "serve",
    "A little stand that lifts the raspberry jam to passing height.",
    [
      "Jam was a jar on a shelf, reached when wanted.",
      "The stand is foolish and loved. It serves jam and nothing smarter.",
      "The foot rocks. Someone still straightens it.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, foods: ["food.jam"] },
  ),

  item(
    33,
    "Recipe tin",
    "container",
    "organization",
    "A blue tin that only accepts slips — recipes, clippings, printed lines.",
    [
      "Recipes were in a head, or in the margin of a letter.",
      "The lid sticks. Slips go in. Spoons do not.",
      "The paint is a gray-blue that was brighter the year it was bought.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      accept: { tags: ["slip"], tokenTags: ["slip"] },
    },
  ),

  item(
    34,
    "Keepsake chest",
    "container",
    "organization",
    "A dome-top chest for mementos. The lid can hold a small thing.",
    [
      "A box, not yet a keepsake. It held nails and extra cloth.",
      "The iron latch is the sound of deciding to keep something.",
      "It smells like cedar and paper. It does not organize a life. It holds what you hand it.",
    ],
    {
      eras: [H, M],
      anchorTags: floor,
      footprint: "wide",
      rotatable: true,
      blocksExit: true,
      providesSupport: true,
      accept: { categories: ["memento"] },
    },
  ),

  item(
    35,
    "Sewing box",
    "container",
    "organization",
    "An oval box that takes thread, ribbon, and anything textile.",
    [
      "Needles lived in a cloth. The box is a later kindness.",
      "Spools, a needle case, room for a ribbon if you are done wearing it today.",
      "The lining is worn to the paste. It still knows cloth from everything else.",
    ],
    {
      eras: [H, M],
      anchorTags: ["shelf", "table", "floor"],
      accept: { tags: ["textile"], tokenTags: ["textile"] },
    },
  ),

  item(
    36,
    "Spice drawer",
    "container",
    "organization",
    "A shallow drawer that tucks jam, sugar cakes, or apple butter away.",
    [
      "Spices were a tin on a nail, if they were anything.",
      "The drawer swells in summer. It will hide a sweet and give it back.",
      "The knob is loose. The habit of putting the jar back is the whole lesson.",
    ],
    {
      eras: [H],
      anchorTags: ["shelf", "work"],
      requiresSupport: true,
      footprint: "medium",
      accept: { foods: ["food.jam", "food.sugar-cakes", "food.apple-butter"] },
    },
  ),

  item(
    37,
    "Letter caddy",
    "container",
    "organization",
    "A divided caddy for anything that is still, somehow, a letter.",
    [
      "Letters were stuck in the beam.",
      "Pigeonholes for paper that expects an answer, or has given up on one.",
      "One slot is burned at the edge where a lamp came too close.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, accept: { tags: ["letter"] } },
  ),

  item(
    38,
    "Button jar",
    "container",
    "organization",
    "A glass jar that takes the tiny things before they leave the house in a cuff.",
    [
      "Buttons were sewn back the same day. A jar is a luxury of later loss.",
      "Clear glass, a zinc lid, the sound of a marble if you are not careful.",
      "Shake it and you hear a century of cuffs.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, accept: { tags: ["tiny"] } },
  ),

  item(
    39,
    "Yarn basket",
    "container",
    "organization",
    "A splint basket for yarn, ribbon, and anything that used to be a sheep.",
    [
      "Wool was in a sack, and the sack was not decorative.",
      "Splint, a handle, room for a skein or a ribbon that has retired.",
      "The handle is polished by being moved, never by being emptied for good.",
    ],
    {
      eras: [H, M],
      anchorTags: ["floor", "shelf"],
      footprint: "medium",
      accept: { tags: ["textile"], tokenTags: ["textile"] },
    },
  ),

  item(
    40,
    "Tool caddy",
    "container",
    "organization",
    "A handled caddy that accepts tools and the mementos that used to be tools.",
    [
      "The honest container. Pins, pencils, stamps, nails.",
      "Divided poorly on purpose, so a hand can find a thing by feel.",
      "It rattles. The rattle is an inventory you don't have to read.",
    ],
    {
      eras: [S, H],
      anchorTags: ["floor", "work", "shelf"],
      footprint: "medium",
      accept: { tags: ["tool"] },
    },
  ),

  item(
    41,
    "Seed box",
    "container",
    "organization",
    "A flat box for seed envelopes and the clipping that promised them.",
    [
      "Seed was a fold of paper in a dry tin.",
      "Labeled by hand. It will take a clipping and keep it flat.",
      "The handwriting on the lid is faded to a habit.",
    ],
    {
      eras: [S, H],
      anchorTags: ["shelf", "work"],
      requiresSupport: true,
      accept: { tags: ["seed"] },
    },
  ),

  item(
    42,
    "Photograph folio",
    "container",
    "organization",
    "A tied folio that only accepts likenesses.",
    [
      "No photographs. Faces were described or kept in a locket, later.",
      "Likenesses were still mostly locks of hair and a locket.",
      "The tie is a shoe-string. Open it and you are looking, not filing.",
    ],
    {
      eras: [M],
      anchorTags: table,
      requiresSupport: true,
      footprint: "medium",
      accept: { tags: ["likeness"] },
    },
  ),

  item(
    43,
    "Flour crock",
    "container",
    "organization",
    "A heavy crock that can keep a portion of bread out of the way.",
    [
      "The crock was the pantry. Bread went under a cloth on top.",
      "It will take a loaf's worth and give it back. It will not take a fiddle.",
      "The glaze is crazed. The weight is the point.",
    ],
    {
      eras: [S, H, M],
      anchorTags: ["floor", "work"],
      footprint: "medium",
      accept: { foods: ["food.bread"] },
    },
  ),

  item(
    44,
    "Bandbox",
    "container",
    "organization",
    "A pasteboard bandbox for things worn: ribbon, specs, a collar, a fob.",
    [
      "Hats were hung. A bandbox is town talk.",
      "Oval, papered, surprisingly stern about what counts as wear.",
      "The lid's print has been loved off. It still holds what touched a wrist or a throat.",
    ],
    {
      eras: [H, M],
      anchorTags: ["floor", "shelf"],
      footprint: "medium",
      accept: { tags: ["wear"] },
    },
  ),

  item(
    45,
    "Mantel clock",
    "clock",
    "sound",
    "A dark clock you wind. It spends the hours one strike at a time.",
    [
      "Time was the light on the floor, not a case on the mantel.",
      "A round face, a stubborn tick, three strikes in a full wind.",
      "It keeps the house's idea of the hour, which was always a little kind.",
    ],
    {
      eras: [H, M],
      anchorTags: ["shelf", "wall", "table"],
      requiresSupport: true,
      rotatable: true,
      motif: "strike-mantel",
      windable: true,
    },
  ),

  item(
    46,
    "Schoolhouse regulator",
    "clock",
    "sound",
    "A regulator that runs fast. Mara will mention it if she hears it.",
    [
      "The schoolhouse was a walk, and it had no clock you could bring home.",
      "Long drop, serious face, always a little ahead of the mantel.",
      "It is here because someone was late too often and took the lesson personally.",
    ],
    {
      eras: [H],
      anchorTags: wall,
      footprint: "medium",
      motif: "strike-school",
      windable: true,
      strikeVisitorLine: "Mara says the regulator is fast and she is not.",
    },
  ),

  item(
    47,
    "Sun-mark board",
    "clock",
    "sound",
    "A board you align to the window. Settlement time, with no gears.",
    [
      "A scratch on a board and the window's bright edge. That was noon.",
      "Kept after clocks, the way you keep a first tool.",
      "The scratch is still true. The room is the thing that moved.",
    ],
    {
      eras: [S],
      anchorTags: ["wall", "hearth"],
      footprint: "medium",
      motif: "sunmark-tap",
      aligns: true,
    },
  ),

  item(
    48,
    "Memory glass clock",
    "clock",
    "sound",
    "A glass clock stopped at four. Winding it changes nothing.",
    [
      "Glass clocks are not of the first years.",
      "It would have run. It doesn't, in the remembering.",
      "Four. It will not be another hour, however kindly you turn the key.",
    ],
    { eras: [M], anchorTags: wall, motif: "strike-frozen", frozenHour: 4 },
  ),

  item(
    49,
    "Steeple repeater",
    "clock",
    "sound",
    "A small repeater that spends a steeple pattern when it is wound.",
    [
      "The steeple was a sound from down the road, not a box in the hand.",
      "Press it and it counts the way the bell did, softer, for one room.",
      "The pattern is the walk to meeting, compressed.",
    ],
    { eras: [H, M], anchorTags: ["wall", "shelf"], motif: "strike-steeple", windable: true },
  ),

  item(
    50,
    "Pocket watch",
    "clock",
    "sound",
    "A watch in a dish. It ticks, and it tells you the inscription instead of the time.",
    [
      "A watch was a man's coat, and the coat was for leaving.",
      "The dish keeps it from walking off the mantel. The tick is faint and well.",
      "Inside the cover: a date nobody in the room says aloud. The tick says it.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, motif: "tick-pocket" },
  ),

  item(
    51,
    "Water clock bowl",
    "clock",
    "sound",
    "A bowl that counts three drips and then considers its work done.",
    [
      "A bowl, a pin-hole, a drip on tin. Crude and sufficient.",
      "Children were warned off it, which meant they watched it.",
      "It will still count, if you ask, and then it stops on purpose.",
    ],
    {
      eras: [S, H],
      anchorTags: ["table", "hearth"],
      requiresSupport: true,
      motif: "drip-water",
      dripMax: 3,
    },
  ),

  item(
    52,
    "Alarm tin",
    "clock",
    "visitor",
    "A tin alarm you arm for company. It only rings if someone has come.",
    [
      "Nobody set an alarm. Morning was the animals.",
      "A round tin with a fierce little bell, armed when a visit was expected.",
      "The bell is cracked. Armed, it still means you are waiting on purpose.",
    ],
    {
      eras: [H],
      anchorTags: table,
      requiresSupport: true,
      motif: "ring-alarm",
      arms: true,
      visitorLine: "Mara says she heard it from the step, which means she was already there.",
    },
  ),

  item(
    53,
    "Quilt frame",
    "worksurface",
    "craft",
    "A frame that shows one stitch and leaves you a single square.",
    [
      "Quilts were lap work. A frame needs a room that can spare a wall.",
      "One demonstration stitch. The square is the souvenir, not a quota.",
      "The bars are polished where arms rested. One stitch is the whole lesson.",
    ],
    {
      eras: [H, M],
      anchorTags: ["work", "floor"],
      footprint: "wide",
      rotatable: true,
      blocksExit: true,
      yieldName: "Quilt square",
      yieldTags: ["textile"],
    },
  ),

  item(
    54,
    "Whittling bench",
    "worksurface",
    "craft",
    "A low bench. One cut becomes a wooden swallow, and the top can hold a dish.",
    [
      "The bench was a plank on stumps. The knife was the same knife.",
      "Curls of pine on the floor are the proof. You don't owe it a second bird.",
      "The swallow is a little wrong in the wing, which is how you know a person made it.",
    ],
    {
      eras: [S, H, M],
      anchorTags: ["work", "floor"],
      footprint: "wide",
      rotatable: true,
      blocksExit: true,
      providesSupport: true,
      yieldName: "Wooden swallow",
      yieldTags: ["tiny"],
    },
  ),

  item(
    55,
    "Spinning wheel",
    "worksurface",
    "craft",
    "One treadle, one length of worsted. Not a day's spinning.",
    [
      "The wheel came as soon as the flock could spare it.",
      "A single treadle, so the motion is remembered in the foot.",
      "The flyer ticks. The yarn is a sample of a life, not the life.",
    ],
    {
      eras: [H],
      anchorTags: ["floor", "work"],
      footprint: "medium",
      rotatable: true,
      yieldName: "Worsted yarn",
      yieldTags: ["textile"],
    },
  ),

  item(
    56,
    "Butter churn",
    "worksurface",
    "craft",
    "One dash of the churn. Butter only if the pantry already has milk.",
    [
      "Butter was a crock from a neighbor more often than a chore you can see.",
      "The dash is a demonstration. If there is milk, there is butter once. If not, the gesture still counts.",
      "The lid's rim is sour-sweet in the memory. No one is asked to fill it.",
    ],
    {
      eras: [H],
      anchorTags: ["floor", "work"],
      footprint: "medium",
      rotatable: true,
      blocksExit: true,
      yieldName: "Ash butter",
      yieldTags: ["kitchen"],
      consumesFood: "food.milk",
    },
  ),

  item(
    57,
    "Composing stick",
    "worksurface",
    "craft",
    "A stick of type that sets one line and gives you a printed slip.",
    [
      "Type was the newspaper down the road, not a stick in this room.",
      "You set one line. The slip can live in the recipe tin afterward.",
      "The letters are mixed. The line comes out anyway, which is the craft.",
    ],
    {
      eras: [H, M],
      anchorTags: ["work", "table"],
      requiresSupport: true,
      yieldName: "Printed slip",
      yieldTags: ["slip"],
    },
  ),

  item(
    58,
    "Candle-dipping rack",
    "worksurface",
    "craft",
    "A rack that dips one taper and stops. No afternoon of candles.",
    [
      "Tallow, a rack, the smell that meant winter was being planned.",
      "One dip, one taper. The rest of the craft is knowing when to stop.",
      "The rack still has a drip frozen on the lowest peg.",
    ],
    {
      eras: [S, H],
      anchorTags: ["work", "hearth"],
      footprint: "medium",
      yieldName: "Dipped taper",
      yieldTags: ["light"],
    },
  ),

  item(
    59,
    "Mending hoop",
    "worksurface",
    "craft",
    "A hoop that darns a scrap, and notices any textile already beside it.",
    [
      "Mending was done in the hand, close to the window.",
      "The hoop holds a scrap. If a ribbon or a sampler is sharing the table, it mentions it and does not take it.",
      "The screw is stiff. One darn is a kindness, not an assignment.",
    ],
    {
      eras: [H, M],
      anchorTags: ["table", "work"],
      requiresSupport: true,
      yieldName: "Darned scrap",
      yieldTags: ["textile"],
      namesTextile: true,
    },
  ),

  item(
    60,
    "Sap-arch model",
    "worksurface",
    "craft",
    "A tabletop arch. One boil, remembered as a slip, not as a sugar crop.",
    [
      "The real arch was in the yard. This small one is how you tell it.",
      "It does not ask for wood or a season. One gesture, one slip about first boil.",
      "The pan is blackened in miniature. That is the entire harvest.",
    ],
    {
      eras: [S, H],
      anchorTags: ["work", "hearth"],
      footprint: "medium",
      yieldName: "First-boil slip",
      yieldTags: ["slip"],
    },
  ),

  item(
    61,
    "Pressed-fern book",
    "memento",
    "history",
    "A cloth book with one fern still trying to leave the page.",
    [
      "The fern was outside, where it was useful as a sign of damp ground.",
      "Pressed on a sermon nobody finished. The fern outlasted the argument.",
      "The cloth is olive. Open it and the room smells briefly green.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["slip", "letter"] },
  ),

  item(
    62,
    "Surveyor's pin",
    "memento",
    "history",
    "An iron pin that once said where the dooryard ended.",
    [
      "Driven at the corner the first season, pulled, kept, because the ground was an argument.",
      "It lived in the tool caddy and sometimes on the map.",
      "The point is blunt. The line it made is still how the room thinks of outside.",
    ],
    { eras: [S, H, M], anchorTags: ["floor", "work", "shelf"], tags: ["tool"] },
  ),

  item(
    63,
    "Marble dish",
    "memento",
    "history",
    "Three glass marbles in a chipped clay dish.",
    [
      "Marbles were a pocket, not a dish on a mantel.",
      "The dish is chipped where it was set down hard by a small hand.",
      "They click if the mantel is bumped. Nobody plays for keeps.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["tiny"] },
  ),

  item(
    64,
    "Ferry ticket",
    "memento",
    "history",
    "One foot-passenger on the Ash Bend ferry, never punched.",
    [
      "The ferry was a fact. Tickets came when the road got opinions.",
      "Unpunched. Someone crossed and kept the proof instead of the landing.",
      "The paper is soft. The river is not named twice.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["slip", "letter"] },
  ),

  item(
    65,
    "Slate pencil",
    "memento",
    "history",
    "A slate pencil worn to a nub, still sharp enough to have been a tool.",
    [
      "School and kitchen sums. The nub is the record of both.",
      "It rolled into the tool caddy and was allowed to stay.",
      "The sound of it on slate is the sound of a child being careful.",
    ],
    {
      eras: [S, H],
      anchorTags: ["table", "shelf", "work"],
      requiresSupport: true,
      tags: ["tool", "tiny"],
    },
  ),

  item(
    66,
    "Bridge nail",
    "memento",
    "history",
    "A bent nail from the covered bridge, pulled rather than left.",
    [
      "The bridge was newer than the story people told about it.",
      "Bent when a plank was replaced. Kept because the bend looks like a decision.",
      "It is ugly and exact. The bridge can go on without it.",
    ],
    { eras: [H, M], anchorTags: ["shelf", "work", "floor"], tags: ["tool"] },
  ),

  item(
    67,
    "Wedding ribbon",
    "memento",
    "history",
    "A length of ribbon that has done its wedding and will do no more.",
    [
      "Ribbon was dear. A wedding might have been a sprig and a neighbor.",
      "Cut from a longer piece. The ends are sealed with a careful burn.",
      "It is not a relic you perform. It is cloth that was there.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["wear", "textile"] },
  ),

  item(
    68,
    "Herd stamp",
    "memento",
    "history",
    "A woodburned stamp, E.H., for a herd this room does not manage.",
    [
      "The mark of the animals, burned once into a handle so it would not be redrawn.",
      "Used until the herd was a neighbor's business. The stamp stayed.",
      "E.H. is initials, not a chore. The room does not owe anyone a count of cows.",
    ],
    { eras: [S, H], anchorTags: ["work", "shelf"], tags: ["tool"] },
  ),

  item(
    69,
    "Holed lake stone",
    "memento",
    "history",
    "A stone with a natural hole, carried back from the lake in a pocket.",
    [
      "The lake was far. A stone like this would have been a whole story.",
      "It sat in a dish of odds until it became the odds.",
      "Hold it to the window and the evening comes through a very small door.",
    ],
    { eras: [M], anchorTags: ["shelf", "table", "hearth"], tags: ["tiny"] },
  ),

  item(
    70,
    "Volunteer button",
    "memento",
    "history",
    "A coat button from a Vermont volunteer. The cloth is gone. The button stayed.",
    [
      "The war had not asked this house yet.",
      "Cut from a coat that did not come home. Kept without being pinned to a speech.",
      "It is brass, dented, and quiet. The room does not play soldier with it.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["tiny", "wear"] },
  ),

  item(
    71,
    "Seed clipping",
    "memento",
    "history",
    "A catalog clipping for a bean nobody in the room can still name.",
    [
      "Torn from a page that arrived before the beans did.",
      "Folded twice to fit a seed box. The promise outlived the crop.",
      "The type is fancy. The bean was ordinary, which is why it was wanted.",
    ],
    { eras: [S, H], anchorTags: table, requiresSupport: true, tags: ["seed", "slip"] },
  ),

  item(
    72,
    "Sampler scrap",
    "memento",
    "history",
    "A corner of a child's sampler. The alphabet stops at M on purpose.",
    [
      "The sampler was a lesson still being stitched.",
      "Cut from a larger square when the cloth was needed elsewhere. The letters stayed.",
      "M is as far as it goes. The room has decided that is complete.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["textile", "letter"] },
  ),

  item(
    73,
    "Notch-line fob",
    "memento",
    "history",
    "A watch fob from the fictional River & Notch line, the chain worn smooth.",
    [
      "The line had not been surveyed past the river.",
      "A gift or a find. The crest is invented by distance and rubbing.",
      "The chain remembers a pocket. The train is not coming through the dooryard.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["wear", "tiny"] },
  ),

  item(
    74,
    "Spectacles case",
    "memento",
    "history",
    "A pasteboard case, sprung, the spectacles themselves long misplaced.",
    [
      "Reading was done at arm's length, or not.",
      "The case snaps too loudly. People in the room learned to wince ahead of it.",
      "Empty, it still means someone was trying to see the small print.",
    ],
    { eras: [H, M], anchorTags: table, requiresSupport: true, tags: ["wear"] },
  ),

  item(
    75,
    "Maple-leaf press",
    "memento",
    "history",
    "A wooden press with one leaf in it, veins still raised.",
    [
      "Leaves were underfoot. Pressing one was a later, quieter habit.",
      "Two boards and a screw. The leaf is a sugar maple and it knows it.",
      "Loosen the screw and the leaf would die. Nobody loosens the screw.",
    ],
    { eras: [H, M], anchorTags: ["shelf", "table", "work"], requiresSupport: true, tags: ["slip"] },
  ),

  item(
    76,
    "Guest-book stub",
    "memento",
    "visitor",
    "A torn stub that will take Mara's name once, and not a second time.",
    [
      "Guests were fed, not recorded.",
      "A stub from a book that was mostly blank, which suited everybody.",
      "The line for a name is short. Mara's fits if she is actually here.",
    ],
    {
      eras: [H, M],
      anchorTags: table,
      requiresSupport: true,
      tags: ["letter"],
      visitorLine: "Mara writes her name small, as if the stub might be needed for something else.",
      greetWrites: "signature",
    },
  ),

  item(
    77,
    "Portrait locket",
    "memento",
    "visitor",
    "A closed locket. Mara recognizes the ribbon and does not ask it to open.",
    [
      "No portrait. Faces were remembered or they weren't.",
      "The locket exists and stays shut. That is already a kind of keeping.",
      "Mara knows the ribbon. She says the person would have hated being a story.",
    ],
    {
      eras: [M],
      anchorTags: table,
      requiresSupport: true,
      tags: ["likeness", "tiny", "wear"],
      visitorLine: "Mara touches the ribbon and says the person would have hated being a story.",
    },
  ),

  item(
    78,
    "Welcome slate",
    "memento",
    "visitor",
    "A slate by the door. If Mara is here, her name stays in chalk.",
    [
      "A slate for sums, not for greetings. The door had a voice of its own.",
      "Hung where a hand can reach without coming all the way in.",
      "Chalk dust in the frame. It will hold one line and no announcement.",
    ],
    {
      eras: [H, M],
      anchorTags: wall,
      tags: ["letter"],
      visitorLine: "Mara writes that she is still on the notch road, which the slate already knew.",
      greetWrites: "chalk",
    },
  ),

  item(
    79,
    "Bram's collar",
    "memento",
    "history",
    "A dog's collar. The dog was Bram. The room is not keeping a pet.",
    [
      "No collar yet. The dog, if he was, was a shape in the yard.",
      "Leather, a brass ring, the name Bram cut small on the inside.",
      "It hangs. It does not need walking, feeding, or a simulation of either.",
    ],
    { eras: [M], anchorTags: ["wall", "shelf"], tags: ["wear"] },
  ),

  item(
    80,
    "Threshold stone",
    "memento",
    "history",
    "A fragment of the threshold. It must never be set in the doorway.",
    [
      "The step itself, cracked off in a frost and kept because a house should know its own sill.",
      "Too heavy for a shelf. People step around it, which is the correct respect.",
      "Put it in the door and the house cannot leave. The room will not allow that.",
    ],
    {
      eras: [S, H, M],
      anchorTags: floor,
      footprint: "wide",
      rotatable: true,
      blocksExit: true,
      tags: ["tool"],
    },
  ),
];

const byId = new Map(CATALOG.map((item) => [item.id, item]));
const byN = new Map(CATALOG.map((item) => [item.n, item]));

export function getCatalogItem(id: string): CatalogItem | undefined {
  return byId.get(id);
}

export function getCatalogByNumber(n: number): CatalogItem | undefined {
  return byN.get(n);
}

export function mustCatalog(id: string): CatalogItem {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown household loot ${id}`);
  return item;
}

export function acceptsItem(container: CatalogItem, target: CatalogItem): boolean {
  if (!container.accept) return false;
  if (target.category === "container") return false;
  if (target.id === container.id) return false;
  const tags = container.accept.tags ?? [];
  const cats = container.accept.categories ?? [];
  if (tags.some((tag) => target.tags.includes(tag))) return true;
  if (cats.includes(target.category)) return true;
  return false;
}

export function acceptsFood(container: CatalogItem, foodId: string): boolean {
  return container.accept?.foods?.includes(foodId) ?? false;
}

export function acceptsTokenTags(container: CatalogItem, tags: string[]): boolean {
  const wanted = container.accept?.tokenTags ?? [];
  return wanted.some((tag) => tags.includes(tag));
}
