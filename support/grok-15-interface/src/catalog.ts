import type {
  BottleDef,
  CharacterDef,
  EndingDef,
  EraDef,
  EvidenceDef,
  GameCatalog,
  KeyDef,
  PlaceDef,
  ToolDef,
  UpgradeDef,
} from "./types.ts";

/**
 * Development register for Ashwick County.
 * Labeled fixture content. An engine catalog with the same shape replaces it at runtime.
 * Lives, places, and tools are records — not a route the player is told to follow.
 */

export const DEV_SOURCE_LABEL =
  "Sample register — development fixture, not engine data.";

const tools: ToolDef[] = [
  {
    id: "lantern",
    name: "Wick lantern",
    icon: "lantern",
    blurb: "Lights the room you are already standing in.",
  },
  {
    id: "hook",
    name: "Grapple hook",
    icon: "hook",
    blurb: "Catches a ring or a beam within arm's reach of the throw.",
  },
  {
    id: "chisel",
    name: "Mason chisel",
    icon: "chisel",
    blurb: "Cuts soft stone and leaves your mark in it.",
  },
  {
    id: "spade",
    name: "Folding spade",
    icon: "spade",
    blurb: "Opens soft ground at your feet.",
  },
  {
    id: "lens",
    name: "Reading lens",
    icon: "lens",
    blurb: "Makes a trace on a surface you can already touch large enough to read.",
  },
  {
    id: "whistle",
    name: "Bone whistle",
    icon: "whistle",
    blurb: "A note for calling, warning, or drawing something off.",
  },
  {
    id: "coil",
    name: "Silk coil",
    icon: "coil",
    blurb: "Lowers you, or binds what is already in hand.",
  },
  {
    id: "bellows",
    name: "Hand bellows",
    icon: "bellows",
    blurb: "Pushes ash, dust, and low smoke out of the air in front of you.",
  },
  {
    id: "hammer",
    name: "Iron hammer",
    icon: "hammer",
    blurb: "Strikes a plate, a nail, or a stuck shutter.",
  },
  {
    id: "shears",
    name: "Hedge shears",
    icon: "shears",
    blurb: "Cuts cord, briar, and cloth that is already against the blade.",
  },
  {
    id: "fork",
    name: "Tuning fork",
    icon: "fork",
    blurb: "Rings a mechanism that answers this tone.",
  },
  {
    id: "shard",
    name: "Mirror shard",
    icon: "shard",
    blurb: "Shows a faint earlier self on the ground you already stand on. It does not point.",
  },
];

const bottles: BottleDef[] = [
  {
    id: "spring",
    name: "Spring water",
    icon: "bottle",
    blurb: "Cold. One sip steadies one heart.",
    heal: 1,
  },
  {
    id: "oil",
    name: "Lamp oil",
    icon: "bottle",
    blurb: "Feeds the wick. It is not for drinking.",
    heal: 0,
  },
  {
    id: "tincture",
    name: "Rowan tincture",
    icon: "bottle",
    blurb: "Bitter. Two hearts, then the bottle is finished.",
    heal: 2,
  },
  {
    id: "smoke",
    name: "Smoke vial",
    icon: "bottle",
    blurb: "Breaks into a low cloud at your feet.",
    heal: 0,
  },
  {
    id: "ink",
    name: "Archive ink",
    icon: "bottle",
    blurb: "Sets a loose note into the journal.",
    heal: 0,
  },
  {
    id: "empty",
    name: "Empty bottle",
    icon: "bottle",
    blurb: "The brace is carrying glass and nothing else.",
    heal: 0,
  },
];

const upgrades: UpgradeDef[] = [
  {
    id: "heart-vessel",
    name: "Heart vessel",
    icon: "heart",
    blurb: "One more heart came back with you and stayed.",
  },
  {
    id: "deep-pocket",
    name: "Deep pocket",
    icon: "bottle",
    blurb: "The brace holds one bottle more than a new life does.",
  },
  {
    id: "steady-wick",
    name: "Steady wick",
    icon: "lantern",
    blurb: "The lantern does not gutter when the wind comes off the water.",
  },
  {
    id: "long-coil",
    name: "Long coil",
    icon: "coil",
    blurb: "The silk reaches one span farther than it did.",
  },
  {
    id: "quiet-return",
    name: "Quiet return",
    icon: "foot",
    blurb: "The quick belt is still buckled the way you left it.",
  },
  {
    id: "true-lens",
    name: "True lens",
    icon: "lens",
    blurb: "The lens shows the whole trace, not a clipped one.",
  },
];

const places: PlaceDef[] = [
  {
    id: "ferry",
    name: "Lark Ferry",
    memory: "You woke on the near bank. The bell rope was already in reach.",
  },
  {
    id: "millrace",
    name: "Millrace",
    memory: "Ice, then open water, then ice again. The wheel remembers each of them.",
  },
  {
    id: "railcut",
    name: "Rail Cut",
    memory: "The summer the stone was split. Tar and hot iron still sit in the gravel.",
  },
  {
    id: "chapel",
    name: "Flood Chapel",
    memory: "The water wrote a dark line across the plaster and then left.",
  },
  {
    id: "glassworks",
    name: "Glassworks",
    memory: "A cold furnace and a floor of swept green glass.",
  },
  {
    id: "orchard",
    name: "Orchard Wall",
    memory: "The wall holds heat after dark. Someone has been pruning.",
  },
  {
    id: "archive",
    name: "County Archive",
    memory: "The side room smells of ink and dry plaster. The pages are not in year order.",
  },
];

const eras: EraDef[] = [
  {
    id: "frost",
    name: "First Frost",
    blurb: "The winter the mill froze and the ferry kept a lane by pole.",
  },
  {
    id: "rail",
    name: "Rail Summer",
    blurb: "The summer the cut went through the ridge and the county got louder.",
  },
  {
    id: "flood",
    name: "Flood Year",
    blurb: "The year the river took the low doors and left them on the chapel steps.",
  },
  {
    id: "quiet",
    name: "Quiet Present",
    blurb: "The years with no new name for the weather. The same coat on the hook.",
  },
];

const endings: EndingDef[] = [
  {
    id: "kept-name",
    name: "The Kept Name",
    epitaph:
      "Ivo stayed. The ferry bell was recast in the same bronze. Elspeth's coat was mended in the same green. The county did not become gentle, but the doors that had been opened still shut against the weather, and the name on the page was allowed to remain.",
  },
  {
    id: "open-gate",
    name: "The Open Gate",
    epitaph:
      "Ivo set the lantern on the bank and did not pick it up again. The river offered another morning. They declined it. What they had mended stayed mended without them walking it each year.",
  },
  {
    id: "shared-hearth",
    name: "The Shared Hearth",
    epitaph:
      "Elspeth kept a second cup. Not as a prize and not as a bargain — as a place at the table in every era the coat still fitted. Ivo sat. The county went on outside the window.",
  },
  {
    id: "unlit-road",
    name: "The Unlit Road",
    epitaph:
      "The flaw was believed all the way down. An unfinished sentence was followed into the water, and the water finished it. The tools were found hung in order. Nobody had been asked to come looking.",
  },
];

const evidence: EvidenceDef[] = [
  {
    id: "ticket",
    title: "Torn ferry ticket",
    placeId: "ferry",
    body: "Two dates on one scrap, pressed so hard the pencil nearly crossed the paper. The earlier date is in a hand you know from a life you have already set down. The later date is today, in this era, and the fare is still unpaid. The scrap does not say where to go. It only says you have stood on this plank before.",
  },
  {
    id: "chisel-marks",
    title: "Matching chisel marks",
    placeId: "millrace",
    body: "Three cuts in the mill stone, the same angle, the same dull corner on the blade. One cut is old enough to hold lichen. One is bright. You are carrying the chisel that fits them. The stone is not asking for a fourth.",
  },
  {
    id: "flood-line",
    title: "Flood line in the plaster",
    placeId: "chapel",
    body: "A brown rule at chest height. Nails were driven along it to hold a count of days, then drawn out. The holes remain. You can put a finger in them. That is the whole of what the wall kept.",
  },
  {
    id: "coat-thread",
    title: "Green thread on the bell rope",
    placeId: "ferry",
    body: "A twist of green wool caught in the ferry rope, the same dye Elspeth uses on the coat that keeps changing its buttons and never its color. In First Frost the thread is new. In Rail Summer it is sun-bleached. In Flood Year it is damp and still holds. In the Quiet Present it is mended with a paler green, as if someone refused to throw the original away.\n\nYou have pulled this thread free in more than one life and watched your own hand do it, a moment late, in the mirror shard. It is not a direction. It is a person, standing where they always stand when the bell needs a rope.",
  },
  {
    id: "shelf",
    title: "Shelf number, not yet inked",
    placeId: "archive",
    body: "You read a shelf number off the end of a case and did not write it down. It is still in your mouth if you want the ink. Nothing about the number tells you to fetch a different page.",
  },
];

const keys: KeyDef[] = [
  {
    id: "ferry-key",
    name: "Ferry key",
    icon: "key",
    answers: "Cut for the boathouse lock.",
    lockId: "ferry-boathouse",
  },
  {
    id: "archive-key",
    name: "Archive key",
    icon: "key",
    answers: "Cut for the archive side door.",
    lockId: "archive-side",
  },
  {
    id: "chapel-key",
    name: "Chapel key",
    icon: "key",
    answers: "Cut for the vestry chest.",
    lockId: "chapel-vestry",
  },
  {
    id: "glass-key",
    name: "Glass key",
    icon: "key",
    answers: "Cut for the anneal-room grate.",
    lockId: "glass-anneal",
  },
];

const character: CharacterDef = {
  name: "Ivo Lark",
  epithet: "The one the river keeps returning",
  background:
    "Born to the millwright at Lark Ferry in First Frost, Ivo drowned under the millrace ice and woke on the same bank with the day's work still in their hands. Each life begins near water. The county is never quite the county they left. The tools that matter are the ones that come back in the hands, not a tally kept somewhere else.",
  bondName: "Elspeth Rowe",
  bondTitle: "Keeper of the ferry",
  bond: "Elspeth knows Ivo before a sentence is finished. In Rail Summer she wears a clerk's visor over the same eyes. In Flood Year she keeps the chapel lamp. In the Quiet Present she mends the green coat and does not pretend it is new. This is not a task. It is the person on the near bank.",
  ideal: "Leave every door you opened in a better state than you found it.",
  flaw: "Ivo will not abandon a half-told story. A sentence left open is, to them, a door left on a sleeping child. They will stand in the millrace until the page drowns to learn how a stranger's letter ended, and they will call the drowning devotion. The habit is not curiosity. Curiosity can be set down. This cannot. In Rail Summer they missed the last car because a porter had not finished saying his name. In Flood Year they climbed back into the chapel after the bell, to hear the end of a hymn nobody else stayed for. Elspeth has pulled them off a roof for less. If you are holding this page in a later life: the story is not owed the rest of you. The county can keep a sentence unfinished and still be loved. Leaving a line mid-word is allowed. It has always been allowed. Ivo has never believed that, and the water has always been patient enough to wait for the belief to crack.",
};

export const DEV_CATALOG: GameCatalog = {
  title: "Preincarnation",
  county: "Ashwick County",
  tools,
  bottles,
  upgrades,
  places,
  eras,
  endings,
  evidence,
  keys,
  character,
};

export const QUICK_SLOT_COUNT = 4;
export const PAGE_SIZE = 280;

export function pageCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / PAGE_SIZE));
}

export function pageSlice(text: string, page: number): string {
  const start = Math.max(0, page) * PAGE_SIZE;
  return text.slice(start, start + PAGE_SIZE);
}

export function findById<T extends { id: string }>(rows: T[], id: string): T | undefined {
  return rows.find((row) => row.id === id);
}
