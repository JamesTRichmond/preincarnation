import { anim, finish, forms, life, tools } from "./author.js";

/**
 * Twenty-four minibosses. Not inflated ordinary enemies.
 * Each rite is a gate: Embryonic God damage is banked until the gate opens,
 * and several gates never open for a spinning god at all.
 * Coordinates are the reference contract (tile 16, origin top-left, y down).
 */

const BOSS_AT = { x: 120, y: 24 };
const FAIR = { x: 120, y: 152 };
const SOUTH = { x: 120, y: 168 };
const EAST = { x: 168, y: 152 };
const FOOL_POCKET = { x: 40, y: 88 };

const TOOL_KEYS = [
  "shovel",
  "sugar_line",
  "boots",
  "fins",
  "lamp",
  "hammer",
  "net",
  "homestead_glass",
  "cape",
  "block_rod",
  "ash_bow",
  "powder_keg",
];

function paint(marks) {
  const rows = Array.from({ length: 13 }, () => Array(15).fill("."));
  for (let x = 0; x < 15; x++) {
    rows[0][x] = "#";
    rows[12][x] = "#";
  }
  for (let y = 0; y < 13; y++) {
    rows[y][0] = "#";
    rows[y][14] = "#";
  }
  rows[1][7] = "X";
  rows[9][7] = "E";
  for (const [ch, tx, ty] of marks) {
    if (rows[ty][tx] === "X" || rows[ty][tx] === "E" || rows[ty][tx] === "#") {
      throw new Error(`Arena mark ${ch} hit a reserved cell ${tx},${ty}`);
    }
    rows[ty][tx] = ch;
  }
  return rows.map((row) => row.join("")).join("\n");
}

function sideRect(salt) {
  return {
    x: 24 + (salt % 3) * 8,
    y: 36 + (salt % 4) * 4,
    w: 36,
    h: 22,
  };
}

function bandDanger(id, name) {
  return {
    id: `${id}_${name}`,
    t: 90,
    tell: 48,
    active: 16,
    damage: 1,
    rect: { x: 16, y: 144, w: 208, h: 16 },
  };
}

function barDanger(id, name) {
  return {
    id: `${id}_${name}`,
    t: 90,
    tell: 48,
    active: 16,
    damage: 1,
    rect: { x: 112, y: 136, w: 16, h: 24 },
  };
}

function pocketDanger(id, name) {
  return {
    id: `${id}_${name}`,
    t: 90,
    tell: 48,
    active: 18,
    damage: 1,
    rect: { x: 24, y: 72, w: 40, h: 32 },
  };
}

function sideDanger(id, name, salt) {
  return {
    id: `${id}_${name}`,
    t: 210,
    tell: 48,
    active: 16,
    damage: 1,
    rect: sideRect(salt),
  };
}

const SPECS = [
  {
    id: "keyblock_choir",
    name: "Keyblock Choir",
    family: "quarry",
    county: "Bristol quarry gallery",
    noun: "the choir",
    hp: 6,
    layout: "tool-h",
    tool: "hammer",
    summary:
      "Three keyblocks sing a lane across the gallery. The song is not hit points. Hammer the dark block only while the lane is down.",
    arena_concept:
      "A Bristol gallery aisle. The choir occupies the north sill. A hammer socket is the south mercy tile. The song paints one full-width band, then a side crack.",
    read: "Three leaning keyblocks with open mouths, a dark one in the middle.",
    palette: "violet-gray, choir mica",
    marks: [
      ["=", 3, 3],
      ["=", 4, 3],
      ["=", 5, 3],
      ["=", 9, 4],
      ["s", 7, 10],
    ],
    beats: [
      "The mica mouths open together. The band is the song, not a grab.",
      "Ellis leaves the band for the south socket.",
      "A side crack answers in the northwest. It does not reach the socket.",
      "The hammer on the dark block, after the earliest beat, ends the choir.",
    ],
    mercy: "Hammer the dark keyblock. Breaking all three is how the gallery forgets the song.",
    home: "gallery_sill",
    terrain:
      "The band is floor. The socket is a worked mercy tile. They will not be knocked into the side crack.",
    god: "God-blows bank on the mica and do not silence the choir. The hammer does.",
    drop: "choir_chip",
  },
  {
    id: "silo_psalm",
    name: "Silo Psalm",
    family: "agricultural",
    county: "Weybridge dairy",
    noun: "the silo psalm",
    hp: 5,
    layout: "tiles",
    tiles: ["verse", "loft", "door"],
    summary:
      "The silo sings three verses. Each verse is a tile. Standing on them in order keeps the door from biting. Damage does not learn the psalm.",
    arena_concept:
      "Weybridge silo floor. Verse tile center-north, loft tile east, door tile southeast. A fool pocket west holds the bite.",
    read: "A round door with stave-mouths and three chalk verses on the floor.",
    palette: "cream staves, chalk white",
    marks: [
      ["s", 7, 6],
      ["r", 10, 6],
      ["s", 10, 10],
      ["m", 2, 5],
    ],
    beats: [
      "Verse one chalks itself at the center.",
      "The loft mark lights to the east.",
      "The door mark is last. The west bite is for someone who never moved.",
      "The psalm completes on the clock, not on the silo's wounds.",
    ],
    mercy: "Walk the three chalks. The silo was a building with a memory of hymns.",
    home: "silo_floor",
    terrain: "Mud in the fool pocket. The chalks are floor. No plunge.",
    god: "A spin does not know the second verse. The chalks stay mandatory.",
    drop: "psalm_chalk",
  },
  {
    id: "unblinking_reed",
    name: "Unblinking Reed",
    family: "water",
    county: "Dead Creek marsh",
    noun: "the reed",
    hp: 4,
    layout: "sheathe-v",
    summary:
      "A reed-heron that strikes the blade, not the person. Sheathe at the east lee and let the beak finish its count.",
    arena_concept:
      "Dead Creek reed room. The heron is the north perch. A vertical beak owns the south center. The lee is east, off the beak.",
    read: "One too-tall reed with a heron skull worked into the tuft.",
    palette: "marsh olive, bone beak",
    marks: [
      ["~", 2, 8],
      ["~", 3, 8],
      ["L", 11, 9],
      ["f", 4, 7],
    ],
    beats: [
      "The beak paints a vertical tell on Ellis's south tile.",
      "Step east into the lee. The blade stays down.",
      "A side splash answers in the shallows and does not reach the lee.",
      "The rite is the sheathed wait, not a kill.",
    ],
    mercy: "Sheathe. The reed is guarding a nest line, not a hoard.",
    home: "reed_perch",
    terrain:
      "Shallow water west. Fins if you step in. The lee is dry. Knockback stops at the water.",
    god: "Divinity reads as a drawn blade. The reed does not bow, and the spin does not complete the lee.",
    drop: "reed_whistle",
  },
  {
    id: "sag_keeper",
    name: "Sag Keeper",
    family: "water",
    county: "Basin Harbor cable",
    noun: "the sag keeper",
    hp: 6,
    layout: "tool-h",
    tool: "sugar_line",
    summary:
      "The old ferry cable sags and snaps a band. Sugar-line from the south bank steals the sag. Cutting the keeper skips nothing.",
    arena_concept:
      "Basin Harbor bank. Cable runs the north sill. Snap band across the south. Sugar-line socket on the mercy plank.",
    read: "A braided eel in a slack cable, copper ferrule at the dip.",
    palette: "tar, copper, harbor gray",
    marks: [
      ["=", 2, 2],
      ["=", 3, 2],
      ["=", 4, 2],
      ["=", 10, 2],
      ["b", 6, 10],
      ["s", 8, 10],
    ],
    beats: [
      "The sag paints the snap band.",
      "Ellis is already walking to the bank socket.",
      "A side splash stays in the northwest shallows.",
      "The line, taken after the beat, steals the sag.",
    ],
    mercy: "Steal the sag. The keeper is the cable's memory of a ferry.",
    home: "cable_sill",
    terrain: "Bank tile south. Water does not own the socket. The snap does not plunge.",
    god: "God-weight on the eel does not tighten the cable. The sugar-line does.",
    drop: "slack_ferrule",
  },
  {
    id: "four_year_field",
    name: "Four-Year Field",
    family: "memory",
    county: "Cornwall meadow",
    noun: "the four-year field",
    hp: 5,
    layout: "tiles",
    tiles: ["year_one", "year_two", "year_four"],
    summary:
      "A meadow that charges on the missing years. Visit the three year-stones. The fourteenth year is not a health bar. Killing the field empties it.",
    arena_concept:
      "Cornwall wall gap. Year-stones at center, east, and southeast. The west mud is the fool who stands in the missing year.",
    read: "Four posts, one of them only a shadow, and a bell with no cow.",
    palette: "dun grass, iron bell",
    marks: [
      ["s", 7, 6],
      ["s", 10, 6],
      ["s", 10, 10],
      ["m", 2, 5],
      ["g", 12, 8],
    ],
    beats: [
      "Year one rings at the center stone.",
      "Year two is east, off the mud.",
      "The fourth year is the southeast stone. There is no third stone. That absence is the tell.",
      "The field lies down when the stones are walked, on its own clock.",
    ],
    mercy: "Walk the years. A kill forfeits the meadow for this incarnation.",
    home: "meadow_wall",
    terrain: "Verge east. Mud west. The stones are floor. No forced plunge.",
    god: "Memory damage is halved and still banked. The stones do not care.",
    drop: "year_bell",
    forfeit: "field_years_lost",
  },
  {
    id: "vixen_of_lost_tools",
    name: "Vixen of Lost Tools",
    family: "memory",
    county: "Middlebury covered bridge",
    noun: "the vixen",
    hp: 4,
    layout: "tiles",
    tiles: ["shovel_scrap", "glass_scrap", "net_scrap"],
    summary:
      "She has already stolen three tools and laid them on the bridge. Pick them up in the order she cached them. A kill loses the map scrap she was carrying.",
    arena_concept:
      "Covered-bridge boards. Three scrap tiles. She sits the north rafter, untouchable until the scraps are walked. A west shadow is the fool.",
    read: "A rust fox with three tools in a fan, none of them weapons.",
    palette: "rust, ledger cream, bridge oak",
    marks: [
      ["c", 7, 6],
      ["c", 10, 6],
      ["c", 10, 10],
      ["P", 3, 4],
    ],
    beats: [
      "The shovel scrap glints center.",
      "The glass scrap is east, under a rafter.",
      "The net scrap is southeast. The west shadow bites if you never bend down.",
      "She drops the map when the third scrap is touched, not when she is cut.",
    ],
    mercy: "Recover the tools. She is a memory of a bridge, like the ledger fox, and not a purse.",
    home: "bridge_rafter",
    terrain: "Boards. She will not be knocked into the creek. The shadow pocket is still floor.",
    god: "Halved god-blows bank. The scraps remain on the boards.",
    drop: "map_scrap",
    forfeit: "bridge_map_lost",
  },
  {
    id: "the_closer",
    name: "The Closer",
    family: "surveyor",
    county: "Vergennes green",
    noun: "the closer",
    hp: 6,
    layout: "tiles",
    tiles: ["first_gap", "second_gap", "last_gap"],
    summary:
      "A surveyor who closes the green by measurements. Three gaps stay open if you stand in them before the chain finishes. Hitting the closer does not reopen a gap.",
    arena_concept:
      "Vergennes green at dusk. Measured gaps are three tiles. The chain's fool pocket is west of the first gap.",
    read: "A long coat and a chain that shortens itself, no tripod.",
    palette: "ink blue, chalk gap",
    marks: [
      ["s", 7, 6],
      ["s", 10, 6],
      ["s", 10, 10],
      ["=", 2, 4],
      ["=", 3, 4],
    ],
    beats: [
      "The first gap is chalked under Ellis's route north.",
      "The second gap opens east as the chain ticks.",
      "The last gap is southeast. Standing in the west chain is the error.",
      "The green stays open when the third gap is occupied at the gate.",
    ],
    mercy: "Occupy the gaps. The closer is a person finishing someone else's map.",
    home: "green_edge",
    terrain: "Lawn. The chain marks are floor. No pit opens under a legal gap.",
    god: "The chain is not impressed. Gaps close on the clock if you only spin.",
    drop: "open_plot",
  },
  {
    id: "gunters_procession",
    name: "Gunter's Procession",
    family: "surveyor",
    county: "Chimney Point lane",
    noun: "the procession",
    hp: 6,
    layout: "tool-v",
    tool: "hammer",
    summary:
      "Rods walk in a file and only the lit rod is a stake. Hammer that rod from the east lee. The file does not have a shared health pool.",
    arena_concept:
      "Chimney Point lane. A vertical file owns the south center. The lit rod's socket is east. Northwest pins are the second tell.",
    read: "Five rod silhouettes, one of them bright at the tip.",
    palette: "oak rods, white tip",
    marks: [
      ["=", 6, 4],
      ["=", 6, 5],
      ["=", 6, 6],
      ["=", 8, 5],
      ["s", 10, 9],
    ],
    beats: [
      "The file paints a vertical tell.",
      "Step east. The lit tip is the only socket.",
      "Side pins fall in the northwest and miss the lee.",
      "Hammer the lit rod after the beat. The dark rods are decoys.",
    ],
    mercy: "Pull the lit rod. The procession is a tool lost from a real survey.",
    home: "baseline",
    terrain: "Lane is floor. Pins do not open pits. Knockback stops at the wall.",
    god: "Spinning the file banks on every rod and pulls none of them.",
    drop: "lit_pin",
  },
  {
    id: "bell_that_didnt_ring",
    name: "Bell That Didn't Ring",
    family: "unrealized",
    county: "Shoreham schoolyard",
    noun: "the unringed bell",
    hp: 4,
    layout: "sheathe-h",
    summary:
      "A school bell that never rang for a child who was not born into this span. Three rings are tells. Sheathe through them. A swing answers the bell in kind and forfeits the name.",
    arena_concept:
      "Shoreham yard. The bell is the north cupola. Rings cross the south as a band. The south step is where you wait with the blade down.",
    read: "A small bell, no clapper, a chalk name under it.",
    palette: "schoolhouse brick, mute brass",
    marks: [
      ["s", 7, 3],
      ["s", 6, 10],
      ["s", 8, 10],
      ["P", 2, 6],
    ],
    beats: [
      "The first ring is a band, not a touch.",
      "Wait on the south step, blade sheathed.",
      "A pocket of chalk dust stirs northwest and does not reach the step.",
      "The name stays if you are still sheathed when the gate opens.",
    ],
    mercy: "Let it ring. The child is an unrealized life, not an enemy.",
    home: "cupola",
    terrain: "Yard. The pocket is floor. The band does not push you into a road.",
    god: "Holy noise is still a swing. The bell forfeits if you will not sheathe, and the damage is halved until you do.",
    drop: "mute_clapper",
    forfeit: "name_unlearned",
  },
  {
    id: "echo_mason",
    name: "Echo Mason",
    family: "quarry",
    county: "Middlebury marble works",
    noun: "the echo mason",
    hp: 5,
    layout: "endure-h",
    summary:
      "The works cough your last step back at you one beat late. The lee is the south step. Enduring three echoes, not cracking the lung early, finishes the shift.",
    arena_concept:
      "Marble-works floor. Echo band across the south. Lee is the south step, outside the band. The mason's body is the north pier and is not a shortcut.",
    read: "A dust torso with a chisel that copies the last direction.",
    palette: "flour dust, chisel steel",
    marks: [
      ["L", 7, 10],
      ["c", 4, 4],
      ["c", 10, 4],
      ["m", 2, 7],
    ],
    beats: [
      "The echo band copies the aisle.",
      "The lee is one step south of the band.",
      "A side cough stays in the northwest dust.",
      "The shift ends when the clock says the third echo has passed and Ellis was not in it.",
    ],
    mercy: "Finish the shift in the lee. The mason is dust and habit.",
    home: "pier",
    terrain: "Dust on stone. The lee is marked. No water.",
    god: "Cracking the pier early banks. The echo still has to finish.",
    drop: "echo_chip",
  },
  {
    id: "evaporator_queen",
    name: "Evaporator Queen",
    family: "insect",
    county: "Lincoln sugarhouse",
    noun: "the queen",
    hp: 6,
    layout: "tool-h",
    tool: "powder_keg",
    summary:
      "A horntail queen over the sugar pan. The pan is the hazard. The valve is the socket. A keg on the valve drops the boil. The queen is not the target.",
    arena_concept:
      "Lincoln sugarhouse. Pan band across the south boards. Valve socket on the south mercy plank. Queen on the north beam.",
    read: "A long horntail over copper, wings echoing the pan's steam.",
    palette: "copper, amber steam, black wing",
    marks: [
      ["=", 3, 8],
      ["=", 4, 8],
      ["=", 10, 8],
      ["s", 7, 10],
      ["P", 2, 3],
    ],
    beats: [
      "Steam marks the pan band.",
      "Step to the valve.",
      "A wing-shadow falls northwest, off the valve.",
      "The keg, after the beat, is the only thing the boil respects.",
    ],
    mercy: "Vent the pan. Burning the queen burns the sugarhouse memory.",
    home: "pan_beam",
    terrain:
      "Boards. The pan is a tell, not a pit. Boots do not cross steam faster than the tell allows.",
    god: "God-fire is not a vent. The valve stays shut and the damage banks.",
    drop: "vented_pan",
  },
  {
    id: "foreman_of_lights",
    name: "Foreman of Lights",
    family: "insect",
    county: "Otter Creek dusk",
    noun: "the foreman",
    hp: 4,
    layout: "tiles",
    tiles: ["dim", "brighter", "noon"],
    summary:
      "Mayflies rank themselves by brightness. Net-route the three brightnesses in order. Clearing them with a spin resets nothing because the rank was never hit points.",
    arena_concept:
      "Creek dusk room. Dim light center, brighter east, noon southeast. A dark fool pocket west is where the swarm bites.",
    read: "A ring of mayflies with one brighter body acting as foreman.",
    palette: "dusk blue, three yellows",
    marks: [
      ["n", 7, 6],
      ["n", 10, 6],
      ["n", 10, 10],
      ["P", 2, 5],
    ],
    beats: [
      "Dim is the first legal light.",
      "Brighter is east.",
      "Noon is last. The west dark is illegal and bites.",
      "The foreman bows when noon is visited and the clock agrees.",
    ],
    mercy: "Walk the brightness. A net is the story; the tiles are the proof.",
    home: "creek_dusk",
    terrain: "Bank. The dark pocket is floor. They do not pull you into the creek.",
    god: "A spin through the ring banks light and does not learn the order.",
    drop: "noon_fly",
  },
  {
    id: "veil_that_knows_breath",
    name: "Veil That Knows Breath",
    family: "insect",
    county: "Snake Mountain switchback",
    noun: "the veil",
    hp: 5,
    layout: "endure-v",
    summary:
      "Blackflies tighten when you thrash. The vertical column is the inhale. The east lee is the exhale. Three breaths, endured, part the veil. A keg or a spin is thrash.",
    arena_concept:
      "Switchback landing. Column on the south center. Lee to the east. Veil mass on the north rock.",
    read: "A standing column of flies with a human-sized hole that is not yet safe.",
    palette: "black fly, granite",
    marks: [
      ["L", 11, 9],
      ["^", 6, 5],
      ["^", 8, 5],
      ["m", 3, 7],
    ],
    beats: [
      "The inhale paints a vertical column.",
      "The lee is east. Hold the route.",
      "A side boil of flies stays west and low.",
      "The veil parts when the breaths have been counted, if you were in the lee.",
    ],
    mercy: "Endure the breaths. The veil is a season, not a duel.",
    home: "switchback",
    terrain: "Stone and a mud seep. The lee is rock. No plunge off the shoulder.",
    god: "Thrashing banks in the column. The count does not speed up.",
    drop: "parted_veil",
  },
  {
    id: "three_beetles_and_a_debt",
    name: "Three Beetles and a Debt",
    family: "insect",
    county: "Addison plot",
    noun: "the debt",
    hp: 5,
    layout: "tool-h",
    tool: "shovel",
    summary:
      "Pallbearer beetles carry a debt-clock across the plot. Shovel the clock into the south socket. Killing a beetle does not pay the debt and wakes the plot.",
    arena_concept:
      "Addison plot. Debt band across the south path. Clock socket on the south mercy earth. Beetles cross the north stones.",
    read: "Three beetles under a little clock, not under a body.",
    palette: "iron clock, green shell",
    marks: [
      ["s", 7, 10],
      ["n", 4, 3],
      ["n", 7, 3],
      ["n", 10, 3],
      ["m", 2, 6],
    ],
    beats: [
      "The clock throws a band down the path.",
      "The shovel socket is south of the band.",
      "A side grave-itch stays northwest.",
      "Burying the clock, after the beat, pays the debt.",
    ],
    mercy: "Bury the clock. The beetles are working a funeral that is not yours to win.",
    home: "plot_north",
    terrain: "Soft earth. The band is a tell. Shovel does not open a pit under Ellis.",
    god: "Splitting a beetle banks. The clock keeps walking.",
    drop: "paid_clock",
  },
  {
    id: "bridge_contract",
    name: "Bridge Contract",
    family: "human",
    county: "Otter Creek footbridge",
    noun: "the contract",
    hp: 4,
    layout: "tiles",
    tiles: ["name", "wait", "glass"],
    summary:
      "The toll is a contract, not a child to beat. Stand the name, the wait, and the glass. Drawing on the toll youth breaks the contract for fourteen years.",
    arena_concept:
      "Footbridge planks. Three toll marks. The youth waits north. A west plank is the fool who pays nothing and gets the rock.",
    read: "The same youth as the ordinary toll, now with a paper and three chalk marks.",
    palette: "wool, creek gray, chalk",
    marks: [
      ["s", 7, 6],
      ["s", 10, 6],
      ["s", 10, 10],
      ["b", 2, 8],
      ["b", 3, 8],
    ],
    beats: [
      "Put your name on the center plank.",
      "Wait is the east plank.",
      "Glass is southeast, the apology. The west plank is where a thrown rock lives.",
      "The contract holds when all three marks are stood and the clock finishes.",
    ],
    mercy:
      "Sign with your feet. They are a person. The rock is a warning, not a boss attack you must trade.",
    home: "bridge_north",
    terrain: "Planks and bank. You are not thrown into the creek.",
    god: "A god who will not stand the marks does not get the bridge. Damage is not a signature.",
    drop: "bridge_pass",
  },
  {
    id: "shift_boss_marlow",
    name: "Shift-Boss Marlow",
    family: "human",
    county: "Button Bay ice",
    noun: "Marlow",
    hp: 6,
    layout: "tool-v",
    tool: "block_rod",
    summary:
      "Marlow runs the ice shift. The third saw is a vertical tell. The block rod at the east lee catches it and ends the shift. Superarmor on the saw is why you do not trade.",
    arena_concept:
      "Button Bay work ice. Saw column on the south center. East lee is the rod's socket. Marlow stands the north ice.",
    read: "Broader than the ordinary cutter, a whistle, a saw with a chalk '3' on the blade.",
    palette: "navy wool, bay ice, steel",
    marks: [
      ["i", 4, 6],
      ["i", 5, 6],
      ["i", 9, 6],
      ["L", 11, 9],
      ["s", 10, 9],
    ],
    beats: [
      "The third saw telegraphs down the center.",
      "The lee is east. The rod is already in hand for the fair route.",
      "A side skate of ice-chips stays northwest.",
      "Blocking at the socket after the beat ends the shift without a grave.",
    ],
    mercy:
      "Catch the third saw. Marlow is a shift boss. The ordinary halt still exists for the officer in the small fight; this one is the rod.",
    home: "work_ice",
    terrain:
      "Ice. The saw does not push you into open water. There is no water tile under the lee.",
    god: "Marlow does not respect the form. The saw's timing does. Spins bank on the coat.",
    drop: "shift_whistle",
  },
  {
    id: "warden_holt",
    name: "Warden Holt",
    family: "human",
    county: "Ripton burn scar",
    noun: "Holt",
    hp: 5,
    layout: "sheathe-h",
    summary:
      "Holt walks the scar. A lit lamp or a drawn blade is a fire to smother. Sheathe on the south step and leave the lamp dark. The smother-band is the warning.",
    arena_concept:
      "Ripton firebreak. Smother band across the south. Holt on the north break. South step is the legal wait, lamp dark, blade down.",
    read: "The warden, older, with the same brass badge and a longer shovel.",
    palette: "forest green, ash",
    marks: [
      ["L", 7, 10],
      ["m", 3, 7],
      ["m", 11, 7],
      ["P", 2, 4],
    ],
    beats: [
      "The smother band marks the illegal fire.",
      "South step, sheathed, lamp cold.",
      "Ash stirs northwest and misses the step.",
      "Holt nods when the wait and the sheath agree with the clock.",
    ],
    mercy: "Stow the flame and the blade. Holt is the trail's warden, not a duel.",
    home: "firebreak",
    terrain: "Ash and dirt. The band is a tell. You are not walked into the brook.",
    god: "Holy fire is fire. Holt smothers it. The gate stays a sheath.",
    drop: "escort_scar",
  },
  {
    id: "aunt_cass_glass_trees",
    name: "Aunt Cass of the Glass Trees",
    family: "agricultural",
    county: "Shoreham orchard",
    noun: "Aunt Cass",
    hp: 4,
    layout: "tool-h",
    tool: "homestead_glass",
    summary:
      "Cass tends trees that throw windfall if you come as a thief. The glass at the south socket shows the real tree. Decoy lanes are the band and the side crack.",
    arena_concept:
      "Shoreham row at night. Windfall band across the south. Real tree's socket on the mercy tile. Cass waits north with a lantern she does not swing.",
    read: "An older picker, a basket, three trees, only one with a glass-bright trunk.",
    palette: "wool, apple red, glass white",
    marks: [
      ["n", 4, 3],
      ["n", 7, 3],
      ["n", 10, 3],
      ["s", 7, 10],
      ["c", 2, 6],
    ],
    beats: [
      "Windfall telegraphs the band. It is apples, slow and readable.",
      "The socket is south, glass already raised on the fair route.",
      "A decoy rustle stays northwest.",
      "The glass, after the beat, makes Cass lower the basket.",
    ],
    mercy: "Show the glass. Cass is a neighbor. The trees are not a boss with a core.",
    home: "orchard_north",
    terrain: "Rows. Mud does not hide the real trunk. Apples do not push you into a ditch.",
    god: "A divine thief is still a thief. The glass is the apology. Damage banks on the basket.",
    drop: "orchard_peace",
  },
  {
    id: "lenswright",
    name: "Lenswright",
    family: "surveyor",
    county: "Snake Mountain shoulder",
    noun: "the lenswright",
    hp: 6,
    layout: "tiles",
    tiles: ["low_lock", "level", "summit"],
    summary:
      "An alidade that locks three angles. Stand the locks in order. Blocking is the story of the ordinary eye; here the mountain itself is the lock path. Burning the lens early blinds the shoulder and does not open the path.",
    arena_concept:
      "Shoulder stones. Three lock tiles climbing center, east, southeast. A west burn pocket is the fool's angle.",
    read: "A tripod grown into the stone, three lenses, one lit at a time.",
    palette: "brass, white beam, granite",
    marks: [
      ["s", 7, 6],
      ["s", 10, 6],
      ["s", 10, 10],
      ["^", 2, 5],
      ["^", 3, 4],
    ],
    beats: [
      "Low lock chalks at the center stone.",
      "Level is east.",
      "Summit is southeast. The west beam is the wrong angle and burns.",
      "The shoulder opens when the third lock has been stood and the beat arrives.",
    ],
    mercy: "Stand the locks. The lenswright is an instrument that outlived its surveyor.",
    home: "shoulder",
    terrain: "Stone. The burn pocket is still floor, not a cliff. No plunge.",
    god: "The beam does not blink for a god. Locks are places, not hit points.",
    drop: "open_shoulder",
  },
  {
    id: "the_raising",
    name: "The Raising",
    family: "agricultural",
    county: "Weybridge barn",
    noun: "the raising",
    hp: 5,
    layout: "tiles",
    tiles: ["sill", "bent", "ridge"],
    summary:
      "A barn is going up wrong. Stand the sill, the bent, and the ridge so the frame doesn't drop. There is no creature to inflate. The hazard is the fall of timber.",
    arena_concept:
      "Barn floor during a raising. Three frame marks. A west timber pocket drops early on anyone who never takes a post.",
    read: "Three timbers in the air, ropes, no villain, a calf penned north out of the fall.",
    palette: "oak, rope hemp, barn red",
    marks: [
      ["r", 7, 6],
      ["r", 10, 6],
      ["r", 10, 10],
      ["k", 7, 2],
      ["m", 2, 5],
    ],
    beats: [
      "The sill mark is the first post.",
      "The bent is east.",
      "The ridge is southeast. The west pocket is a timber that already slipped.",
      "The frame sits when the three posts are stood. The calf was never the target.",
    ],
    mercy: "Hold the frame. Killing is not on offer. Leaving is how a barn fails.",
    home: "barn_floor",
    terrain: "Floor and a mud seep west. Timbers do not sweep you into a mow pit.",
    god: "Strength does not replace the third post. Blows bank on the rope and the ridge still falls in the model if you skip.",
    drop: "raised_frame",
  },
  {
    id: "lung_of_the_mill",
    name: "Lung of the Mill",
    family: "quarry",
    county: "Middlebury mill yard",
    noun: "the mill lung",
    hp: 6,
    layout: "endure-v",
    summary:
      "The mill inhales the yard and coughs one column. The east lee is the only air. Endure the coughs. Cracking the lung before the shift ends just moves the dust.",
    arena_concept:
      "Mill yard. Cough column on the south center. East lee behind a low wall of marble offcuts. Lung sac north.",
    read: "Larger than the ordinary dust lung, braced with mill iron.",
    palette: "flour dust, mill iron",
    marks: [
      ["L", 11, 9],
      ["c", 11, 8],
      ["c", 12, 9],
      ["m", 3, 6],
    ],
    beats: [
      "The column is the cough. It is vertical and slow.",
      "East lee. Do not stand in the iron mouth.",
      "A side seep of dust stays northwest.",
      "The shift ends on the clock if the lee held.",
    ],
    mercy: "Finish the shift. The lung is a mill's bad air, not a person.",
    home: "mill_north",
    terrain: "Stone yard. Dust does not become a pit. The lee is floor.",
    god: "Blowing the sac open banks dust and does not end the shift early.",
    drop: "quiet_yard",
  },
  {
    id: "ellis_not_taken",
    name: "Ellis Not Taken",
    family: "unrealized",
    county: "Cornwall creek font",
    noun: "the other draft",
    hp: 4,
    layout: "sheathe-h",
    summary:
      "A draft of Ellis that lived the other choices. It copies a drawn blade onto the band. Sheathe at the south font and the draft has nothing to copy. Killing your unrealized self forfeits the font.",
    arena_concept:
      "Creek font. Copy-band across the south. The font step is the mercy tile. The draft stands north, same height as Ellis, wrong coat.",
    read: "Ellis's silhouette with the coat turned, blade already a drawing, not a hitbox until the band.",
    palette: "creek gray, unfinished ink",
    marks: [
      ["s", 7, 10],
      ["~", 2, 8],
      ["~", 3, 8],
      ["f", 4, 8],
      ["P", 11, 4],
    ],
    beats: [
      "The copy band is your blade, delayed.",
      "Sheathe on the font step.",
      "A side ripple stays northwest, in the shallows' tell, not under the font.",
      "The draft closes its book when the sheath has lasted to the gate.",
    ],
    mercy: "Sheathe. This is an unrealized life. The font is the mercy, and a kill loses it.",
    home: "font_north",
    terrain: "Stone and a west seep. Fins are for the seep, not required on the font. No plunge.",
    god: "The god-form is the loudest blade. The draft copies it. Only a sheath resolves, and memory-like unrealized damage is halved while it banks.",
    drop: "font_quiet",
    forfeit: "font_lost",
  },
  {
    id: "bob_and_the_beat",
    name: "Bob and the Beat",
    family: "surveyor",
    county: "Vergennes wheelhouse",
    noun: "the bob",
    hp: 5,
    layout: "tool-v",
    tool: "hammer",
    summary:
      "The plumb bob swings on a counted beat. The vertical tell is the swing. Hammer the pivot from the east lee between beats. Grabbing the bob while it moves is how the wheelhouse keeps you.",
    arena_concept:
      "Wheelhouse floor. Swing column south-center. Pivot socket east. Bob hangs from the north beam.",
    read: "A heavier bob than the ordinary pendulum, a painted beat on the floor.",
    palette: "iron bob, wheelhouse brick, chalk beat",
    marks: [
      ["s", 10, 9],
      ["=", 7, 2],
      ["=", 7, 3],
      ["c", 4, 5],
      ["c", 10, 5],
    ],
    beats: [
      "The beat paints the column. Count it.",
      "East lee, hammer ready, not under the iron.",
      "A side weight clinks northwest, off the lee.",
      "The hammer on the pivot after the gate beat stops the wheel.",
    ],
    mercy: "Pin the pivot. The bob is an instrument. Stopping it is the job.",
    home: "wheel_beam",
    terrain: "Brick. The swing is a tell. You are not thrown into the gears; there is no pit.",
    god: "Catching the bob in a spin banks bruises on the iron and the beat continues.",
    drop: "pinned_pivot",
  },
  {
    id: "captain_vesper",
    name: "Captain Vesper",
    family: "water",
    county: "Basin Harbor, dusk",
    noun: "Captain Vesper",
    hp: 5,
    layout: "tiles",
    tiles: ["near_bank", "rung", "far_deck"],
    summary:
      "The last ferry wants the legal path: near bank, rung, far deck. Vesper does not fight. The cable's fool pocket does. Skipping the water with a spin leaves you on the wrong bank forever in this model.",
    arena_concept:
      "Dusk ferry. Three legal tiles from the near bank to the far deck. West water and a snap pocket for anyone who stands in the sag. Vesper is a lantern on the north deck, not a duelist.",
    read: "A harbor coat, a lantern, a gangplank with one rung missing a board and marked.",
    palette: "harbor blue, lantern gold, dusk",
    marks: [
      ["b", 7, 6],
      ["r", 10, 6],
      ["s", 10, 10],
      ["~", 2, 7],
      ["~", 2, 8],
      ["~", 3, 8],
      ["f", 3, 7],
    ],
    beats: [
      "Near bank is the first legal board.",
      "The rung is east, over the gap you do not fall through because the tile is floor.",
      "Far deck is southeast. The west sag bites the fool who waits in the water's tell.",
      "Vesper lowers the lantern when the deck is reached and the clock finishes the crossing.",
    ],
    mercy: "Cross. Vesper is a person ending a shift. There is no health-bar ferry.",
    home: "north_deck",
    terrain:
      "Water west stops knockback. The rung and decks are floor. Fins are for a mistake, not the legal path.",
    god: "You cannot spin across a ferry that is a sequence of boards. The damage banks on the lantern post.",
    drop: "dusk_passage",
  },
];

function layoutOf(spec) {
  const id = spec.id;
  if (spec.layout === "tiles") {
    const points = [
      { id: spec.tiles[0], x: 120, y: 112 },
      { id: spec.tiles[1], x: 176, y: 112 },
      { id: spec.tiles[2], x: 176, y: 72 },
    ];
    return {
      gate: "tiles",
      win: "mechanic",
      earliest: 480,
      tiles: spec.tiles,
      fairStart: FAIR,
      foolStart: FOOL_POCKET,
      checkpoints: points,
      dangers: [
        bandDanger(id, "verse"),
        pocketDanger(id, "fool"),
        sideDanger(id, "side", spec.salt),
      ],
    };
  }
  if (spec.layout === "tool-h" || spec.layout === "sheathe-h" || spec.layout === "endure-h") {
    const gate =
      spec.layout === "tool-h" ? "tool" : spec.layout === "sheathe-h" ? "sheathe" : "endure";
    return {
      gate,
      win: gate === "endure" ? "endure" : "mechanic",
      earliest: 360,
      fairStart: FAIR,
      foolStart: FAIR,
      checkpoints: [SOUTH],
      dangers: [bandDanger(id, "band"), sideDanger(id, "side", spec.salt)],
    };
  }
  const gate =
    spec.layout === "tool-v" ? "tool" : spec.layout === "sheathe-v" ? "sheathe" : "endure";
  return {
    gate,
    win: gate === "endure" ? "endure" : "mechanic",
    earliest: 360,
    fairStart: FAIR,
    foolStart: FAIR,
    checkpoints: [EAST],
    dangers: [barDanger(id, "bar"), sideDanger(id, "side", spec.salt)],
  };
}

function toolNotes(spec) {
  const noun = spec.noun;
  const base = {
    shovel: `The shovel finds no lip on ${noun} except where the rite says so.`,
    sugar_line: `The sugar-line does not hitch ${noun} unless the rite is the line.`,
    boots: `Boots do not shorten ${noun}'s tell.`,
    fins: `Fins are for a mistake in the water, not a skip of ${noun}.`,
    lamp: `A lamp does not resolve ${noun}.`,
    hammer: `The hammer is not the rite for ${noun} unless the socket says so.`,
    net: `The net cannot pocket ${noun}.`,
    homestead_glass: `The glass does not apologize to ${noun} unless the rite is the glass.`,
    cape: `The cape's i-frames cover one mistaken step, not the gate.`,
    block_rod: `The rod can catch one frontal tell. It resolves ${noun} only if the rite is the rod.`,
    ash_bow: `An arrow is a poor answer to ${noun}.`,
    powder_keg: `A keg scars the ground and does not open ${noun}'s gate unless the rite is the valve.`,
  };
  if (spec.tool) {
    base[spec.tool] = {
      effect: "rite",
      states: ["gate"],
      flag: "gate_open",
      range: 18,
      note: spec.mercy,
    };
  }
  const out = {};
  for (const key of TOOL_KEYS) out[key] = base[key];
  return tools(out);
}

function compileBoss(spec, index) {
  const shaped = layoutOf({ ...spec, salt: index });
  const states = [
    {
      id: "entrance",
      kind: "idle",
      frames: 20,
      anim: "entrance",
      on_done: `${shaped.dangers[0].id}_tell`,
    },
  ];
  shaped.dangers.forEach((danger, dangerIndex) => {
    const next = shaped.dangers[dangerIndex + 1]
      ? `${shaped.dangers[dangerIndex + 1].id}_tell`
      : "gate";
    states.push({
      id: `${danger.id}_tell`,
      kind: "telegraph",
      frames: danger.tell,
      attack: danger.id,
      anim: `${danger.id}_tell`,
      on_done: `${danger.id}_active`,
    });
    states.push({
      id: `${danger.id}_active`,
      kind: "active",
      frames: danger.active,
      attack: danger.id,
      anim: `${danger.id}_active`,
      on_done: `${danger.id}_recover`,
    });
    states.push({
      id: `${danger.id}_recover`,
      kind: "recover",
      frames: 24,
      anim: `${danger.id}_recover`,
      on_done: next,
    });
  });
  states.push({ id: "gate", kind: "idle", frames: null, anim: "gate", set_flag: "gate_open" });

  const attacks = {};
  for (const danger of shaped.dangers) {
    attacks[danger.id] = {
      kind: "scripted",
      damage: danger.damage,
      active: danger.active,
      blockable: spec.tool === "block_rod",
      shape: { absolute: true, ...danger.rect },
    };
  }

  const animations = [
    anim("entrance", 8, `${spec.name} has not started the rite.`, true),
    anim("gate", 8, spec.mercy, true),
    anim("hyperarmor", 6, "Banked blows do not stagger the rite.", true),
    anim("death", 8, `A kill here is the wrong ending for ${spec.name}.`),
    anim("spare", 8, spec.mercy, true),
  ];
  for (const danger of shaped.dangers) {
    animations.push(anim(`${danger.id}_tell`, danger.tell, spec.beats[0]));
    animations.push(anim(`${danger.id}_active`, danger.active, `Committed ${danger.id}.`));
    animations.push(anim(`${danger.id}_recover`, 8, "The tell has passed.", true));
  }

  return finish({
    id: spec.id,
    name: spec.name,
    family: spec.family,
    county_anchor: spec.county,
    summary: spec.summary,
    arena_concept: spec.arena_concept,
    encounter_script: spec.beats,
    god_may_shorten: false,
    objective: shaped.gate,
    gate: shaped.gate,
    win: shaped.win,
    earliest: shaped.earliest,
    hp: spec.hp,
    tool: spec.tool || null,
    socket: spec.layout.includes("v") ? EAST : SOUTH,
    window: 200,
    sheatheFrames: 36,
    tiles: shaped.tiles || [],
    bossAt: BOSS_AT,
    fairStart: shaped.fairStart,
    foolStart: shaped.foolStart,
    checkpoints: shaped.checkpoints,
    dangers: shaped.dangers,
    arena: paint(spec.marks),
    not_a_dungeon_boss: true,
    silhouette: {
      footprint_px: [16, 16],
      read: spec.read,
      palette: spec.palette,
      must_read_distance_px: 64,
      animations,
    },
    stats: { hp: spec.hp, knockback_px: 8, weight: "boss", speed: 0, contact_damage: 0 },
    detection: { sight_px: 160, arc_deg: 360, initial: "entrance", aggro: "script" },
    return_state: "entrance",
    attacks,
    states,
    defeat: { windows: ["gate"], block_goto: spec.tool === "block_rod" ? "gate" : null },
    mercy: {
      available: true,
      method: spec.mercy,
      ready: { no_blade: true, idle: 0 },
      reason: spec.mercy,
    },
    tools: toolNotes(spec),
    forms: forms({
      mortal: `Mortal Ellis walks ${spec.noun}'s rite at the recorded speed. The gate does not ask for a faster body.`,
      smuggler: `The smuggler is quicker around ${spec.noun} and is not required. The tells stay.`,
      officer: `The officer is the fairness walk. ${spec.noun} is timed for 0.85 px per frame.`,
      god: spec.god,
    }),
    terrain: {
      home: spec.home,
      enters: ["floor", "mercy", "lee", "cover", "pocket", "rail", "ice", "bank", "rung", "verge"],
      refuses: ["pit"],
      on_ice: spec.terrain,
      on_mud: spec.terrain,
      on_water: spec.terrain,
      forced_plunge: false,
    },
    lifecycle: life({
      death: {
        persist: "this_life",
        remnant: `${spec.id}_killed`,
        drop: null,
        forfeit: spec.forfeit || null,
      },
      spare: {
        persist: "fourteen_years",
        remnant: `${spec.id}_resolved`,
        drop: spec.drop,
        flag: "rite_kept",
      },
      ages: 1,
    }),
    facing: "S",
  });
}

export const minibosses = SPECS.map((spec, index) => compileBoss(spec, index));

export function minibossById(id) {
  const found = minibosses.find((boss) => boss.id === id);
  if (!found) throw new Error(`No miniboss ${id}`);
  return found;
}
