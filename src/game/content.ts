import type { DialogueNode, IncarnationId, Upgrades } from "./types.ts";

export const INCARNATIONS: Record<
  IncarnationId,
  {
    name: string;
    title: string;
    blurb: string;
    hp: number;
    speed: number;
    damage: number;
    sheet: string;
    unlock: string;
  }
> = {
  wanderer: {
    name: "Mortal Wanderer",
    title: "First skin",
    blurb: "A farmhand of Addison County. Slow to glory, honest with a short iron blade.",
    hp: 3,
    speed: 76,
    damage: 1,
    sheet: "/game/wanderer-walk/sheet.png",
    unlock: "Always available.",
  },
  smuggler: {
    name: "Otter Creek Smuggler",
    title: "Second skin",
    blurb: "Runs the back roads at night. Faster, carries bombs, owes everyone a favor.",
    hp: 3,
    speed: 96,
    damage: 1,
    sheet: "/game/smuggler-walk/sheet.png",
    unlock: "Complete one cycle.",
  },
  officer: {
    name: "Rutland Officer",
    title: "Civic skin",
    blurb: "Keeps the square. Heavier coat, heavier heart, a stronger cut.",
    hp: 5,
    speed: 70,
    damage: 1.35,
    sheet: "/game/officer-walk/sheet.png",
    unlock: "Complete one cycle and speak with the Mayor.",
  },
  embryo: {
    name: "Embryonic God",
    title: "Unborn cosmos",
    blurb: "A universe folding itself. Walks water and void. Death, at last, is a door.",
    hp: 6,
    speed: 82,
    damage: 2,
    sheet: "/game/embryo-walk/sheet.png",
    unlock: "Earn two Heavenly Crowns, or complete two cycles.",
  },
};

export type UpgradeDef = {
  key: keyof Upgrades;
  name: string;
  blurb: string;
  cost: number;
  polarity: "light" | "shadow" | "crown";
  max: number;
};

export const LIMBO_UPGRADES: UpgradeDef[] = [
  { key: "vitality", name: "Spare Heart", blurb: "One more chamber in the ribcage.", cost: 8, polarity: "light", max: 3 },
  { key: "edge", name: "Keen Edge", blurb: "The iron remembers every cut. Extra slash in the combo.", cost: 10, polarity: "light", max: 3 },
  { key: "stride", name: "Long Stride", blurb: "Vermont miles shorten.", cost: 8, polarity: "light", max: 3 },
  { key: "sight", name: "Open Sight", blurb: "Secrets shimmer through grass and stone.", cost: 6, polarity: "light", max: 1 },
  { key: "shadowStep", name: "Shadow Step", blurb: "A dash through the seam of a moment.", cost: 8, polarity: "shadow", max: 1 },
  { key: "wraithBond", name: "Wraith Bond", blurb: "Spirits hesitate before they strike.", cost: 10, polarity: "shadow", max: 1 },
  { key: "echo", name: "Karmic Echo", blurb: "Your feats ring louder in the next world.", cost: 1, polarity: "crown", max: 1 },
  { key: "soloverseKey", name: "Soloverse Key", blurb: "Unlocks the spherical spectrum after the third death. You keep walking.", cost: 1, polarity: "crown", max: 1 },
];

export const DIALOGUE: Record<string, DialogueNode> = {
  elder_1: {
    id: "elder_1",
    speaker: "Maeve Holloway",
    text: "{name}. You woke on the Green because the Marble Vein went quiet. That is the job. Otter Creek is west. The Vein is east in the pines. Walk into any house. Take the shovel by the stone. You will die. They will send you back until it is done. Fourteen winters pass each time. The body you leave is still on the ground.",
    entropy: 0.42,
    choices: [
      { label: "How do I leave this life?", next: "elder_how" },
      { label: "Who are you?", next: "elder_who" },
      { label: "I will walk.", next: "end" },
    ],
  },
  elder_bond: {
    id: "elder_bond",
    speaker: "Maeve Holloway",
    text: "{name}. I kept the lantern for you. You remember that, even if the county does not. The Vein is still the job. East. The shovel is by the stone. I am older than I look. You will be too.",
    entropy: 0.38,
    choices: [
      { label: "I remember the light.", next: "elder_how" },
      { label: "I will walk.", next: "end" },
    ],
  },
  elder_return: {
    id: "elder_return",
    speaker: "Maeve Holloway",
    text: "{name}. {year}. I watched the last body go cold. Fourteen winters is a long time to leave a friend in the dirt. Dig when you can bear it. The Vein still sleeps. Same job. East.",
    entropy: 0.44,
    choices: [
      { label: "I came back.", next: "end" },
      { label: "How do I leave this life?", next: "elder_how" },
    ],
  },
  elder_how: {
    id: "elder_how",
    speaker: "Maeve Holloway",
    text: "Hearts are a courtesy. Empty them, or hold Release at the shrine. Space cuts now — mash it, or hold for a spin. Q cycles the tool in your off hand. Minus zooms out; you can see the whole town. You will die. The Voice — or the Other, if your hands are dirty — will send you back as yourself. Spend the points they give you. Fourteen winters pass. The gear you drop stays where you fall. Bring a shovel.",
    entropy: 0.48,
    choices: [
      { label: "Help her pass. (Fate)", karma: 4, crowns: 1, flag: { elderFate: "release" }, next: "elder_release", note: "Heavenly Crown" },
      { label: "Bind her here. (Fate)", karma: -6, flag: { elderFate: "bind" }, next: "elder_bind" },
      { label: "Not yet.", next: "end" },
    ],
  },
  elder_who: {
    id: "elder_who",
    speaker: "Maeve Holloway",
    text: "I have been a mill girl, a widow, a warden of this green. Entropy in my chest is loud today. Decide my fate when you can bear it — Arbiter work pays in Crowns. Spend them when they send you back.",
    entropy: 0.55,
    choices: [{ label: "I understand.", next: "end" }],
  },
  elder_release: {
    id: "elder_release",
    speaker: "Maeve Holloway",
    text: "Thank you. The next town will remember a lantern in the square. Take the Crown; spend it before you are born again.",
    entropy: 0.12,
    choices: [{ label: "Rest well.", next: "end" }],
  },
  elder_bind: {
    id: "elder_bind",
    speaker: "Maeve Holloway",
    text: "Then I stay. The square will grow colder. I will be here. I may not be kind.",
    entropy: 0.81,
    choices: [{ label: "So be it.", next: "end" }],
  },
  farmer_1: {
    id: "farmer_1",
    speaker: "Cal Perch",
    text: "{name}. Sheep bolted into the north pines. Bring her home and I'll see the field bloom. Barn loft's got a .30-06 if the bears come down from Salisbury — most kitchens in this county keep one. Walk in. Take it. That's Vermont.",
    entropy: 0.33,
    choices: [
      { label: "I'll find her.", next: "end" },
      { label: "Not my problem.", karma: -2, next: "end" },
    ],
  },
  farmer_bond: {
    id: "farmer_bond",
    speaker: "Cal Perch",
    text: "{name}. You ate at my table through a winter. The ewe is still family. North pines. Bring her home. Then the field is yours to have blessed.",
    entropy: 0.28,
    choices: [
      { label: "I'll find her.", next: "end" },
      { label: "Not tonight.", next: "end" },
    ],
  },
  farmer_return: {
    id: "farmer_return",
    speaker: "Cal Perch",
    text: "{year}. You left a body in my county, {name}. Crops remember. People do too. The ewe is still missing if you still care.",
    entropy: 0.36,
    choices: [{ label: "I still care.", next: "end" }],
  },
  farmer_sheep: {
    id: "farmer_sheep",
    speaker: "Cal Perch",
    text: "There she is. Field's yours to have blessed. Next life, this farm will already be growing when you open your eyes.",
    entropy: 0.18,
    choices: [{ label: "Glad she's safe.", karma: 6, flag: { farmerHelped: true }, next: "end", note: "Persistent feat" }],
  },
  farmer_done: {
    id: "farmer_done",
    speaker: "Cal Perch",
    text: "Crops remember you even when the town forgets the face.",
    entropy: 0.2,
    choices: [{ label: "Nod.", next: "end" }],
  },
  mayor_1: {
    id: "mayor_1",
    speaker: "Mayor Voss",
    text: "{name}. The mill is a dying animal. Spare it, and the green holds. Condemn it, and gravel eats the square — ugly, rich, useful. An Arbiter chooses. A Crown waits on the answer.",
    entropy: 0.61,
    choices: [
      { label: "Spare the mill. (Fate)", karma: 5, crowns: 1, flag: { millFate: "spare" }, next: "mayor_spare", note: "Heavenly Crown" },
      { label: "Condemn it. (Fate)", karma: -5, crowns: 1, flag: { millFate: "condemn" }, next: "mayor_condemn", note: "Heavenly Crown" },
      { label: "Not my square.", next: "end" },
    ],
  },
  mayor_return: {
    id: "mayor_return",
    speaker: "Mayor Voss",
    text: "The square kept your name on a lip, {name}. {year}. The mill is still a dying animal. You already know the question.",
    entropy: 0.5,
    choices: [
      { label: "Spare the mill. (Fate)", karma: 5, crowns: 1, flag: { millFate: "spare" }, next: "mayor_spare", note: "Heavenly Crown" },
      { label: "Condemn it. (Fate)", karma: -5, crowns: 1, flag: { millFate: "condemn" }, next: "mayor_condemn", note: "Heavenly Crown" },
      { label: "Not yet.", next: "end" },
    ],
  },
  mayor_spare: {
    id: "mayor_spare",
    speaker: "Mayor Voss",
    text: "Then the bricks stay kind. When they send you back the square will still be arguing, not paved.",
    entropy: 0.22,
    choices: [{ label: "Good.", next: "end" }],
  },
  mayor_condemn: {
    id: "mayor_condemn",
    speaker: "Mayor Voss",
    text: "Gravel, then. Useful. Ugly. The quarry vein may open sooner.",
    entropy: 0.7,
    choices: [{ label: "So it is.", next: "end" }],
  },
  shop_1: {
    id: "shop_1",
    speaker: "Tilda Wren",
    text: "Bombs for cracked marble. Four Karma. Also: if you find a cache — barn lofts, sugarhouses, the college stacks — take the weapon. They come blessed, cursed, or merely Vermont. Walk through my door; the rifle over the register is not decoration.",
    entropy: 0.29,
    choices: [
      { label: "Buy bombs. (−4 karma)", karma: -4, flag: { bombs: 3 }, next: "shop_buy" },
      { label: "Just browsing.", next: "end" },
    ],
  },
  shop_buy: {
    id: "shop_buy",
    speaker: "Tilda Wren",
    text: "Three charges. The marble remembers dynamite fondly.",
    entropy: 0.25,
    choices: [{ label: "Thanks.", next: "end" }],
  },
  sheep_1: {
    id: "sheep_1",
    speaker: "The Ewe",
    text: "She stamps, unimpressed with cosmology. Take her home to Cal.",
    entropy: 0.05,
    choices: [{ label: "Come on.", flag: { sheepFound: true }, next: "end" }],
  },
  shrine_1: {
    id: "shrine_1",
    speaker: "Stone Circle",
    text: "Hold Release here if you want the skin off. Or fall in the woods. Either way you see the Voice — or the Other — and they send you back to finish the job. There is no credits sequence that owns you.",
    entropy: 0.5,
    choices: [{ label: "Not yet.", next: "end" }],
  },
  sugar_1: {
    id: "sugar_1",
    speaker: "June Cabot",
    text: "Grade A dark. In this county syrup is a secret potion — drink it and the blood remembers sugar. Take a tin. That's a red bottle, if you were raised on a different myth.",
    entropy: 0.27,
    choices: [{ label: "I'll take a tin.", flag: { syrupStash: true }, karma: 2, next: "sugar_tin" }],
  },
  sugar_tin: {
    id: "sugar_tin",
    speaker: "June Cabot",
    text: "Boil it longer next life. The trees will know your name.",
    entropy: 0.16,
    choices: [{ label: "Save it for later.", next: "end" }],
  },
  sentinel_1: {
    id: "sentinel_1",
    speaker: "The Sentinel",
    text: "Marble that learned a heartbeat. I am the quarry's opinion of forever. Release me, or crown me as a tool. Either pays.",
    entropy: 0.66,
    choices: [
      { label: "Release. (Fate)", karma: 6, crowns: 1, flag: { sentinelFate: "release" }, next: "sentinel_release", note: "Heavenly Crown" },
      { label: "Bind as Crown. (Fate)", karma: -8, crowns: 1, flag: { sentinelFate: "crown" }, next: "sentinel_crown", note: "Heavenly Crown" },
    ],
  },
  sentinel_release: {
    id: "sentinel_release",
    speaker: "The Sentinel",
    text: "Then I am weather. The pit stays open. Walk.",
    entropy: 0.1,
    choices: [{ label: "Go.", next: "end" }],
  },
  sentinel_crown: {
    id: "sentinel_crown",
    speaker: "The Sentinel",
    text: "Then I am furniture in your next empire. Heavy. Useful.",
    entropy: 0.88,
    choices: [{ label: "Mine, then.", next: "end" }],
  },
  resident_1: {
    id: "resident_1",
    speaker: "The Resident",
    text: "I am the life being lived at these coordinates — the house, the weather, the unwashed mug. Spare me, and this address stays a house. Bind me, and you wear the lot like a Crown. I am the end of this town because you are standing in it. The rifle is on the parlor wall. That is not a metaphor.",
    entropy: 0.58,
    choices: [
      { label: "Release the household. (Fate)", karma: 6, crowns: 1, flag: { residentFate: "release" }, next: "resident_release", note: "Town clears" },
      { label: "Bind the lot. (Fate)", karma: -8, crowns: 1, flag: { residentFate: "bind" }, next: "resident_bind", note: "Heavenly Crown" },
      { label: "Not yet.", next: "end" },
    ],
  },
  resident_release: {
    id: "resident_release",
    speaker: "The Resident",
    text: "Then the kettle sings for someone else. The county road is open. Walk it.",
    entropy: 0.12,
    choices: [{ label: "Go in peace.", next: "end" }],
  },
  resident_bind: {
    id: "resident_bind",
    speaker: "The Resident",
    text: "Then I am furniture in your next skin. The county still opens. You will find me in the walls.",
    entropy: 0.84,
    choices: [{ label: "I can live with that.", next: "end" }],
  },
  rock_1: {
    id: "rock_1",
    speaker: "Lord's Prayer Rock",
    text: "A teamster asked God to slow the wagons on this grade. Someone with a chisel obliged. Slow down. The gap does not.",
    entropy: 0.08,
    choices: [{ label: "Amen.", karma: 1, next: "end" }],
  },
  hunter: {
    id: "hunter",
    speaker: "Len Fiske",
    text: "Everyone's got a hunting rifle. Mine's in the loft. Fishercats in the cedar swamp will go for a cat, a chicken, and you if you look small. Bears want the bird feeder. Give them room.",
    entropy: 0.31,
    choices: [{ label: "I'll keep the iron handy.", next: "end" }],
  },
  ferry: {
    id: "ferry",
    speaker: "Cap Stannard",
    text: "Basin Harbor's that way. Champlain doesn't care about your cycle. The farmhouse by the hayfield keeps a 12-gauge — lake weather makes people practical.",
    entropy: 0.24,
    choices: [{ label: "I'll take the shore road.", next: "end" }],
  },
  rokeby: {
    id: "rokeby",
    speaker: "Rokeby House",
    text: "This house hid people who were not supposed to be property. Karma here is old and specific. If you bind what should be free, the lake will remember.",
    entropy: 0.41,
    choices: [{ label: "I hear it.", karma: 2, next: "end" }],
  },
  camper: {
    id: "camper",
    speaker: "June-from-Quebec",
    text: "Came for the swimming. Staying for the cosmology. There's a rifle in the lean-to because of course there is.",
    entropy: 0.19,
    choices: [{ label: "Of course.", next: "end" }],
  },
  conductor: {
    id: "conductor",
    speaker: "Yardmaster Cole",
    text: "White River meets the Connecticut under the yards. Trains still argue about Boston. The mallet in the switch house has cracked more than spikes.",
    entropy: 0.36,
    choices: [{ label: "I'll walk the ties.", next: "end" }],
  },
  cartog: {
    id: "cartog",
    speaker: "The Cartographer",
    text: "This overworld is the county as the satellite sees it: Otter Creek, US-7, Champlain, the Gap. Towns are doors. Your GPS is the spawn. Walk north for Chittenden. South for Rutland. East for the mountains.",
    entropy: 0.2,
    choices: [{ label: "I have the map.", next: "end" }],
  },
  creemee: {
    id: "creemee",
    speaker: "Al's Window",
    text: "Maple creemee. Extra fat, because this is Vermont and we do not apologize. That's a green bottle — mana, if you were raised on a different myth. One swirl and the bar fills. V to drink later.",
    entropy: 0.11,
    choices: [{ label: "I'll take a large.", karma: 1, next: "end" }],
  },
  prof: {
    id: "prof",
    speaker: "Professor Ellison",
    text: "The college sits on the west bank because the falls made a mill, and the mill made a school. Walk inside. Even the faculty lounge keeps a rifle. I wish I were joking.",
    entropy: 0.34,
    choices: [{ label: "I'll audit the parlor.", next: "end" }],
  },
  bud: {
    id: "bud",
    speaker: "Kipp",
    text: "Legal. Taxed. The wraiths hate the smell. If you need something kinder than a .30-06, the back shelf has it.",
    entropy: 0.28,
    choices: [{ label: "Maybe later.", next: "end" }],
  },
  hippie: {
    id: "hippie",
    speaker: "River",
    text: "Bristol's the gap town. Lord's Prayer Rock on the way in. If you're going to reincarnate, reincarnate with better boots.",
    entropy: 0.22,
    choices: [{ label: "Noted.", flag: { hippieMet: true }, next: "end" }],
  },
  artist: {
    id: "artist",
    speaker: "Nessa",
    text: "I paint the same barn until it becomes a universe. You're doing that with counties. Respect.",
    entropy: 0.18,
    choices: [{ label: "Keep painting.", karma: 1, next: "end" }],
  },
  ranger: {
    id: "ranger",
    speaker: "Ranger Holt",
    text: "Moosalamoo. Bears on the Dunmore side. If you hear a fisher scream, it is not a woman and it is not your problem unless you look like a chicken.",
    entropy: 0.3,
    choices: [{ label: "I'll give them room.", next: "end" }],
  },
  vmayor: {
    id: "vmayor",
    speaker: "Vergennes Clerk",
    text: "Smallest city in the republic. We were carved from three towns to sit on the falls. The millwright still thinks he runs it.",
    entropy: 0.26,
    choices: [{ label: "I'll see the falls.", next: "end" }],
  },
  millwright: {
    id: "millwright",
    speaker: "Millwright Page",
    text: "Otter Creek does the work. I just keep the gears from becoming philosophy.",
    entropy: 0.35,
    choices: [{ label: "Keep them honest.", next: "end" }],
  },
  lockkeep: {
    id: "lockkeep",
    speaker: "Lock-Keeper",
    text: "The basin used to lift boats. Now it lifts weather. North is Ferrisburgh. South is you.",
    entropy: 0.21,
    choices: [{ label: "I'll take the lock road.", next: "end" }],
  },
  legislator: {
    id: "legislator",
    speaker: "Rep. Ault",
    text: "Smallest capital. Largest opinions. The dome is gold because marble wasn't extra enough. Walk in. Even here, a rifle.",
    entropy: 0.4,
    choices: [{ label: "Civic duty.", next: "end" }],
  },
  intern: {
    id: "intern",
    speaker: "Page",
    text: "If you see the Governor, I didn't. If you see a wraith in Hubbard Park, I did.",
    entropy: 0.17,
    choices: [{ label: "Good luck.", next: "end" }],
  },
  coolidge: {
    id: "coolidge",
    speaker: "Hotel Coolidge",
    text: "The rooms remember traveling salesmen and derailed saints. Stay if you want. The rifle is in 214.",
    entropy: 0.33,
    choices: [{ label: "Maybe one night.", next: "end" }],
  },
  heart_1: {
    id: "heart_1",
    speaker: "Heart of the Spectrum",
    text: "Four rooms. One sphere. Fact is the county as the satellite still insists. Fiction is the hill with a mouth. History is every grave you left. Imagination is the rest of you. You are the weather system now. An Arbiter still chooses.",
    entropy: 0.5,
    choices: [
      { label: "How did Vermont become a sphere?", next: "heart_how" },
      { label: "Release the universe. (Fate)", karma: 8, crowns: 1, flag: { spectrumFate: "release" }, next: "heart_release", note: "Heavenly Crown" },
      { label: "Bind it as a Crown. (Fate)", karma: -8, crowns: 1, flag: { spectrumFate: "bind" }, next: "heart_bind", note: "Heavenly Crown" },
      { label: "Just walk.", next: "end" },
    ],
  },
  heart_how: {
    id: "heart_how",
    speaker: "Heart of the Spectrum",
    text: "You died enough times that the map could no longer pretend to be flat. West-north is fact — a Green that still thinks it is Middlebury. East is fiction, a cave the way a child draws one. South-west is history; your last skins wait in the dirt. South-east is imagination, which does not apologize for the void. The seam on the Green still opens back.",
    entropy: 0.44,
    choices: [{ label: "I have the map.", next: "end" }],
  },
  heart_release: {
    id: "heart_release",
    speaker: "Heart of the Spectrum",
    text: "Then the sphere breathes. Towns will keep their names. You may still walk them, louder. There is no last life.",
    entropy: 0.11,
    choices: [{ label: "Keep walking.", next: "end" }],
  },
  heart_bind: {
    id: "heart_bind",
    speaker: "Heart of the Spectrum",
    text: "Then Vermont is furniture in your next empire. Useful. Heavy. The rooms stay open because you are standing in them.",
    entropy: 0.86,
    choices: [{ label: "Mine, then.", next: "end" }],
  },
  spectrum_1: {
    id: "spectrum_1",
    speaker: "A hill that learned to speak",
    text: "This quadrant is fiction. The cave is the way a myth remembers a mouth in a green hill. Walk in. The fins wait in the dark — Otter Creek will take you after.",
    entropy: 0.29,
    choices: [{ label: "I'll take the hill.", next: "end" }],
  },
  echo_elder: {
    id: "echo_elder",
    speaker: "Maeve, again",
    text: "History keeps a copy. You decided my fate in a town that still exists as a room on this sphere. I am weather now. That is not a complaint.",
    entropy: 0.37,
    choices: [{ label: "I remember.", karma: 2, next: "end" }],
  },
  echo_sentinel: {
    id: "echo_sentinel",
    speaker: "The Sentinel, again",
    text: "Marble that learned a heartbeat, then learned a sky. Imagination is a quarry with no ceiling. I am still the county's opinion of forever.",
    entropy: 0.52,
    choices: [{ label: "Stand, then.", next: "end" }],
  },
  echo_resident: {
    id: "echo_resident",
    speaker: "The Resident, again",
    text: "The house followed you. Coordinates are a courtesy. I am the life being lived at the center of a universe that used to be a parlor.",
    entropy: 0.4,
    choices: [{ label: "Make tea.", karma: 1, next: "end" }],
  },
  echo_mayor: {
    id: "echo_mayor",
    speaker: "Mayor Voss, again",
    text: "The mill is a dying animal, even here. You already chose. Fact remembers the gravel, or the bricks. I am the square arguing with itself.",
    entropy: 0.46,
    choices: [{ label: "The square holds.", next: "end" }],
  },
};

export const OBJECTIVES = {
  job: "THE JOB — Wake the Marble Vein east of the Green.",
  start: "Talk to Maeve on the Green — she has the first step.",
  sheep: "A ewe is missing in the north pines — if you still care to look.",
  home: "Your homestead is a shrine. Rest there. The temple is the real work.",
  quarry: "THE JOB — East road out of Middlebury. The Marble Vein: lamp, key, hammer, Sentinel.",
  sentinel: "THE JOB — Smash the cracked marble. Face the Sentinel in the north pit.",
  county: "The Vein is quiet. The job is done, for now. Walk Addison. Death still sends you back.",
  ready: "Release at the shrine, or fall. They will send you back. Fourteen years will pass.",
  limbo: "Spend what you were given. Then go back and finish the job.",
  ending: "There is no ending. Walk.",
  spectrum: "Four rooms, one sphere. Fact north-west. Fiction the cave. History the graves. Imagination the void. The Heart is the middle.",
  seam: "A seam on the Green. The spectrum is thin until you die louder.",
};

export type TraitOpt = { id: string; name: string; blurb: string };

export const BACKGROUNDS: TraitOpt[] = [
  { id: "farmhand", name: "Farmhand", blurb: "Addison dirt under the nails. You know a field by the way it smells before rain." },
  { id: "mill_hand", name: "Mill hand", blurb: "Otter Creek paid you in noise. The mill is dying and you still hear it." },
  { id: "sexton", name: "Sexton", blurb: "You dug the holes. You know how long a body keeps a secret." },
  { id: "clerk", name: "Town clerk", blurb: "Ledgers, licenses, the square's small lies. You can read a town by its paper." },
];

export const BONDS: TraitOpt[] = [
  { id: "maeve", name: "Maeve's lantern", blurb: "Maeve Holloway kept a light for you once. Die, and the lamp is in your off-hand — not in the grass." },
  { id: "perch", name: "Cal's farm", blurb: "Cal Perch's farm fed you through a winter. His ewe is still family." },
  { id: "the_grade", name: "The Prayer Rock", blurb: "Someone cut a prayer into stone so wagons would slow. You are that someone, later." },
  { id: "the_unburied", name: "An open grave", blurb: "A hole you meant to fill is still open. You will not leave it." },
];

export const IDEALS: TraitOpt[] = [
  { id: "the_job", name: "Finish it", blurb: "A thing begun is a thing finished. Even if the thing is a county." },
  { id: "mercy", name: "Mercy", blurb: "Release is cheaper than a Crown. People are not furniture." },
  { id: "the_land", name: "The land", blurb: "The map is the land. If Vermont folds, you folded it." },
  { id: "no_witness", name: "No witness", blurb: "What you do in the dark still happens. You just don't have to watch." },
];

export const FLAWS: TraitOpt[] = [
  { id: "cannot_rest", name: "Cannot rest", blurb: "Fourteen winters is not enough. You walk before the grave is cold." },
  { id: "the_blade", name: "The blade first", blurb: "Space first, talk later. You have buried people you meant to ask." },
  { id: "pride", name: "Will not settle", blurb: "The county can break. You will not farm. You will not stay." },
  { id: "the_other_voice", name: "The other voice", blurb: "When the job is ugly you already know who you will meet." },
];

export const SKILL_TRAITS = LIMBO_UPGRADES.filter((u) => u.polarity !== "crown");

export function traitById(list: TraitOpt[], id: string): TraitOpt {
  return list.find((t) => t.id === id) ?? list[0];
}

export const INTRO_BEATS: { kicker: string; title: string; body: string }[] = [
  {
    kicker: "Addison County · 2026",
    title: "The Green still thinks it is a town",
    body: "Middlebury. Otter Creek west, the Gap east. Houses leave their doors unlatched. A rifle on a parlor wall is not a metaphor. This is Vermont, compressed the way a myth compresses a kingdom.",
  },
  {
    kicker: "You",
    title: "{name}",
    body: "{background} Bond: {bond} Ideal: {ideal} Flaw: {flaw}",
  },
  {
    kicker: "The job",
    title: "The Marble Vein has gone quiet",
    body: "East of the Green, in the pines, the county's temple stopped answering. If it dies, Vermont folds — fact, fiction, history, imagination — into a sphere that does not care what you were. Maeve on the Green knows the first step. The shovel by the stone is the second. East is the rest.",
  },
  {
    kicker: "The rule",
    title: "You will die. That is not the problem.",
    body: "The Voice that kept the wagons from the grade will send you back. If your hands are dirty, the Other Voice will send you back too. Both of them say the same sentence. Fourteen winters pass on the body you leave.",
  },
  {
    kicker: "Finish it",
    title: "Speak with Maeve. Take the shovel. Walk east.",
    body: "Hearts are a courtesy. Space cuts. E talks. The line at the bottom of the world is the job. There is no credits sequence that owns you.",
  },
];

export function fillIntroBeat(
  beat: { kicker: string; title: string; body: string },
  name: string,
  background: TraitOpt,
  bond: TraitOpt,
  ideal: TraitOpt,
  flaw: TraitOpt,
) {
  const title = beat.title.replace("{name}", name);
  if (!beat.body.includes("{background}")) return { ...beat, title };
  const body = `${background.blurb} ${bond.blurb} You believe this: ${ideal.blurb} You cannot shake this: ${flaw.blurb}`;
  return { kicker: beat.kicker, title, body };
}

export function afterlifeCopy(
  host: "god" | "devil",
  name: string,
  year: number,
  lastDeed = "",
  flaw = "",
) {
  const deed = lastDeed ? lastDeed : "You died with the Vein still quiet";
  if (host === "devil") {
    return {
      kicker: "The Other Voice",
      title: "I like the mess. I still need the Vein.",
      body: `${deed}, ${name}. A folded county is boring. ${year} on the ground you left.${flaw ? " I know your flaw: " + flaw + "." : ""} Spend what you were given. Go back. Finish the job. We'll settle the rest when the marble answers.`,
      action: "Finish the job",
    };
  }
  return {
    kicker: "The Voice",
    title: "I did not take you.",
    body: `The Vein still sleeps, ${name}. ${year}. ${deed}. Fourteen winters on the body you left.${flaw ? " You still carry this: " + flaw + "." : ""} Spend what you were given. Then go back and finish the job.`,
    action: "Finish the job",
  };
}

export const ENDING_LINES = [
  "You die on purpose, and the county folds like a map.",
  "Addison's hills become vertebrae. Rutland's square, a pupil.",
  "Every farmhand, mill, ewe, and wraith you touched is still here — a weather system.",
  "The embryo inhales. Galaxies are a habit. Entropy is a lullaby.",
  "You are a universe that remembers being a person in Vermont.",
  "PREINCARNATION. The Soloverse is yours to walk. There is no last life.",
];

export const NPC_NODE: Record<string, string> = {
  elder: "elder_1",
  farmer: "farmer_1",
  mayor: "mayor_1",
  shop: "shop_1",
  sentinel: "sentinel_1",
  resident: "resident_1",
  sugar: "sugar_1",
  hunter: "hunter",
  ferry: "ferry",
  rokeby: "rokeby",
  camper: "camper",
  conductor: "conductor",
  cartog: "cartog",
  creemee: "creemee",
  prof: "prof",
  bud: "bud",
  hippie: "hippie",
  artist: "artist",
  ranger: "ranger",
  vmayor: "vmayor",
  millwright: "millwright",
  lockkeep: "lockkeep",
  legislator: "legislator",
  intern: "intern",
  coolidge: "coolidge",
  heart: "heart_1",
  spectrum: "spectrum_1",
  echo_elder: "echo_elder",
  echo_sentinel: "echo_sentinel",
  echo_resident: "echo_resident",
  echo_mayor: "echo_mayor",
};
