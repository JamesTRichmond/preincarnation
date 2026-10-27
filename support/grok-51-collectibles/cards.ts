import type { Affinity, CardDef, CardType, Effect, Rarity } from "./types.ts";

/**
 * The printed Seventy-Two. This file is the card law other rooms must import.
 * Do not keep a second list, and do not rewrite costs in the UI.
 */

const draw = (n: number): Effect => ({ op: "draw", n });
const mend = (n: number): Effect => ({ op: "mend", n });
const ease = (n: number): Effect => ({ op: "ease", n });
const stores = (n: number): Effect => ({ op: "stores", n });
const well = (n: number): Effect => ({ op: "well", n });
const search = (n: number): Effect => ({ op: "search", n });
const shield: Effect = { op: "shield" };
const tax = (n: number): Effect => ({ op: "tax", n });
const bond = (n: number): Effect => ({ op: "bond", n });
const recall: Effect = { op: "recall" };

type Draft = Omit<CardDef, "id">;

function d(
  name: string,
  affinity: Affinity,
  type: CardType,
  rarity: Rarity,
  cost: number,
  kindling: number,
  effects: Effect[],
  year: number,
  then: string,
  later?: { year: number; text: string },
): Draft {
  return { name, affinity, type, rarity, cost, kindling, effects, year, then, later };
}

const DRAFTS: Draft[] = [
  // Hearth — fw-001..012
  d("Youngest at the Grate", "hearth", "kin", "common", 1, 1, [], 1994, "Nell feeds splits no thicker than her wrist and is praised for staying awake."),
  d("The Sister Who Stays", "hearth", "kin", "common", 2, 2, [draw(1)], 1998, "Ruth keeps the kettle moving so nobody has to say they are afraid."),
  d("Uncle with the Bad Knee", "hearth", "kin", "uncommon", 2, 2, [mend(1)], 1988, "Harris claims the knee is weather. It is the mill injury, and he still comes to split wood."),
  d(
    "Grandmother Hearth",
    "hearth",
    "kin",
    "rare",
    3,
    3,
    [shield],
    1979,
    "Ida is the fire. While she is in the chair the winter cannot take a hearth.",
    {
      year: 2005,
      text: "Nell understands Ida was not the fire. She was the person who decided, every night, that the house would continue, and the shield was that decision.",
    },
  ),
  d("Dry Sink", "hearth", "place", "common", 1, 1, [well(1)], 1972, "The slate sink stays cold on purpose so milk and salve survive the night."),
  d("Keeping Room", "hearth", "place", "uncommon", 2, 2, [well(1)], 1970, "One room is heated. Everyone's winter happens inside it, politely or not."),
  d("Bank the Coals", "hearth", "memory", "common", 1, 2, [], 1986, "Ash over the red, so morning still has a coal to wake."),
  d("Split the Night Wood", "hearth", "memory", "common", 1, 1, [stores(2)], 1991, "What you split after dark is tomorrow's stores, not tonight's glory."),
  d("Butter on the Card", "hearth", "memory", "uncommon", 1, 1, [search(3)], 1983, "Ida's recipe card is stained because she cooked from it, then you look deeper in the drawer."),
  d("Cast-Iron Spider", "hearth", "heirloom", "uncommon", 1, 0, [bond(2)], 1958, "The skillet legs stand in the coals. Whoever holds the spider feeds the kin they stand beside."),
  d(
    "Wool Blanket, Mended",
    "hearth",
    "heirloom",
    "rare",
    2,
    0,
    [bond(3)],
    1964,
    "The blanket is heavy enough to count as another person in the bed.",
    {
      year: 2009,
      text: "The darns are Ida's, then Ruth's, then Nell's. It is not warmth that stacks. It is three women refusing to throw out a winter.",
    },
  ),
  d("Chimney Wind", "hearth", "weather", "common", 1, 0, [tax(1), draw(1)], 1996, "The flue coughs smoke into the room. You endure a harder night and see one card further."),

  // Trail — fw-013..024
  d("Boy with the Sled", "trail", "kin", "common", 1, 1, [], 1995, "Jonah takes the sled for kindling because the truck will not start."),
  d("Mail Carrier", "trail", "kin", "common", 2, 1, [draw(2)], 1984, "The mail still comes up the unplowed notch. Two new pieces of news, wanted or not."),
  d("The One Who Walks Out", "trail", "kin", "uncommon", 3, 3, [ease(1)], 1992, "Lena walks out in any blow to check the sap lines, and the burden eases because someone looked."),
  d(
    "Warden of the Notch",
    "trail",
    "kin",
    "rare",
    4,
    4,
    [shield],
    1976,
    "The warden knows which drifts are lies and will not let the line step on them.",
    {
      year: 2002,
      text: "The warden was Eli on a town contract, not a stranger. The shield was him walking ahead of his own children.",
    },
  ),
  d("Sap House", "trail", "place", "common", 1, 1, [well(1)], 1968, "Steam, a tin roof, and a barrel that means the winter has a sweet end."),
  d("High Pasture Gate", "trail", "place", "uncommon", 2, 2, [well(1)], 1971, "Shut, the gate keeps the heifers honest. Open, it is only a story about summer."),
  d("Break the Track", "trail", "memory", "common", 1, 1, [ease(1)], 1989, "The first person through the snow makes the burden smaller for everyone behind."),
  d("Cache the Turnips", "trail", "memory", "common", 1, 2, [], 1980, "Buried right, a turnip is kindling of a sort: it keeps a body stoked."),
  d("Blaze the Hemlock", "trail", "memory", "uncommon", 2, 1, [search(3)], 1977, "Eli's blazes are shallow on purpose. You search the top of the deck the way you search a marked tree."),
  d("Snowshoes, Left", "trail", "heirloom", "uncommon", 1, 0, [bond(2)], 1974, "The left shoe is mended with lamp wire. It makes the kin who wears it surer."),
  d(
    "The Notched Axe",
    "trail",
    "heirloom",
    "rare",
    2,
    0,
    [bond(3)],
    1961,
    "One notch per winter Eli did not buy a new handle.",
    {
      year: 1998,
      text: "Lena counts the notches and gets seventeen, not fourteen. He was already notching before the family started calling the hard years a set.",
    },
  ),
  d("Whiteout", "trail", "weather", "common", 1, 0, [tax(2), draw(2)], 1993, "You cannot see the fence. The burden swells, and so does the hand, if you stand still and listen."),

  // Chapel — fw-025..036
  d("Choir Aunt", "chapel", "kin", "common", 1, 1, [], 1982, "Ada's sister holds the alto line when the stove fails and the hymn still has a verse."),
  d("Sexton", "chapel", "kin", "common", 2, 2, [stores(1)], 1986, "Mr. Pell unlocks, sweeps, and somehow leaves you with one more store than you brought."),
  d("The Minister's Widow", "chapel", "kin", "uncommon", 2, 2, [ease(1)], 1987, "Ada sits where her husband sat and the room expects less of everyone."),
  d(
    "Bell-Ringer Child",
    "chapel",
    "kin",
    "rare",
    3,
    2,
    [mend(1), draw(1)],
    1986,
    "Jonah can put the bell through a whole Sunday, including the crack.",
    {
      year: 2001,
      text: "He did not ring it wrong. Frost had opened the crack, and he finished it by yanking a frozen rope. The mend on this card is the confession, not the repair.",
    },
  ),
  d("Horse Shed", "chapel", "place", "common", 1, 1, [well(1)], 1955, "The horses are gone. The shed still counts as shelter on the way up the hill."),
  d("Vestry Stove", "chapel", "place", "uncommon", 2, 2, [well(2)], 1960, "A low stove that outlasts sermons. Two extra stores of heat if you sit near the pipe."),
  d("Hymn in the Pocket", "chapel", "memory", "common", 0, 1, [], 1990, "Folded small, it still stokes one. You do not need a book to keep a verse."),
  d("Name the Dead", "chapel", "memory", "common", 1, 1, [mend(1)], 1978, "Saying the name aloud puts a hearth back. Forgetting it is how lines end."),
  d("Pledge the Pew", "chapel", "memory", "uncommon", 2, 1, [shield], 1981, "Ada pledges the family pew for the winter oil. The shield is a debt with a hymn number."),
  d("Pew Key", "chapel", "heirloom", "uncommon", 1, 0, [bond(1), draw(1)], 1948, "The key is brass and small. The kin who holds it draws one more name into the room."),
  d(
    "Offering Plate",
    "chapel",
    "heirloom",
    "rare",
    2,
    0,
    [bond(2), mend(1)],
    1952,
    "What goes in the plate comes back as heat, or is supposed to.",
    {
      year: 2000,
      text: "Nell finds Ida's grocery list under the felt. The plate fed the stove more often than the diocese. The mend was groceries.",
    },
  ),
  d("Funeral Weather", "chapel", "weather", "common", 0, 1, [tax(1), shield], 1985, "A bright hard day. The burden ticks up. You also learn, once, how not to lose the hearth."),

  // River — fw-037..048
  d("Ice Fisher", "river", "kin", "common", 1, 2, [], 1997, "Harris on a bucket over the black ice, stoking twice what he admits."),
  d("Ferry Daughter", "river", "kin", "common", 2, 2, [draw(1)], 1988, "Before the bridge, someone rowed. The daughter still knows the eddy and draws the next card clean."),
  d("The Man at the Boom", "river", "kin", "uncommon", 2, 2, [stores(2)], 1975, "Eli's brother tended the log boom and kept two stores of slack line for other people."),
  d(
    "River Warden",
    "river",
    "kin",
    "rare",
    3,
    3,
    [ease(2)],
    1969,
    "The warden reads the flood stakes the way other people read a clock.",
    {
      year: 1998,
      text: "There was no warden. It was Mae, seventeen, painting the stakes herself so the town would believe a man had measured them.",
    },
  ),
  d("Covered Bridge", "river", "place", "common", 1, 1, [well(1)], 1936, "Dark inside, always dripping, still the surest dry in a January rain."),
  d("Mill Race", "river", "place", "uncommon", 2, 1, [well(2)], 1928, "The race keeps a thread of open water. Two stores, if you do not fall in proving it."),
  d("Cut the Ice", "river", "memory", "common", 1, 2, [], 1994, "A rectangle of black water is a winter's meat if your arm is long."),
  d("Set the Eel Trap", "river", "memory", "common", 1, 1, [search(3)], 1973, "You do not see what the trap did until you search. Top three, keep the one that feeds."),
  d("Night Line", "river", "memory", "uncommon", 1, 1, [draw(2)], 1982, "Set at dusk, pulled at dawn. Two cards, like two fish you did not watch bite."),
  d("Cedar Paddle", "river", "heirloom", "uncommon", 1, 0, [bond(2)], 1959, "The blade is chewed at the tip. It makes a kin steadier in a current of any kind."),
  d(
    "The Flood Mark Staff",
    "river",
    "heirloom",
    "rare",
    2,
    0,
    [bond(2), ease(1)],
    1927,
    "Notches from the flood that moved the houses. Holding it eases a winter by one.",
    {
      year: 2012,
      text: "The highest notch is not 1927. Mae cut it in 1998 the night she buried the seed, so the river would look like the reason if anyone asked.",
    },
  ),
  d("Ice Out", "river", "weather", "common", 1, 0, [tax(1), stores(3)], 1999, "The river breaks. One more burden, and three stores of open water if you are quick."),

  // Night — fw-049..060
  d("Child Who Doesn't Sleep", "night", "kin", "common", 1, 1, [draw(1)], 1996, "Nell listens to the latch and draws whatever the dark is holding."),
  d("Barn Owl's Person", "night", "kin", "common", 1, 2, [], 1981, "Somebody walks the tie-up at 3 a.m. The cows know the coat. Two kindling, no speech."),
  d("The Cousin from Away", "night", "kin", "uncommon", 2, 2, [search(3)], 1998, "Harris arrives after midnight and goes through the top of your business like a drawer."),
  d(
    "Midwife of the Ridge",
    "night",
    "kin",
    "rare",
    3,
    2,
    [mend(1), shield],
    1966,
    "She comes when the road is closed. One hearth mended, and the next loss refused.",
    {
      year: 2004,
      text: "The midwife was Ida's sister, unpaid, and the shield was her staying until morning even when the baby was already loud. Nell had not known she was kin.",
    },
  ),
  d("Root Cellar", "night", "place", "common", 1, 1, [well(1)], 1910, "Under the boards the air is the same in July and January. One sure store."),
  d("Unlit Parlor", "night", "place", "uncommon", 2, 2, [well(1)], 1932, "Shut off to save coal. What you keep in a dark room still counts if you remember it is there."),
  d("Listen at the Latch", "night", "memory", "common", 0, 1, [], 1997, "You hear the difference between wind and a hand. That is one kindling."),
  d("Hide the Silver", "night", "memory", "common", 1, 1, [shield], 1944, "Wrapped, boxed, pushed behind the jam. A shield you hope not to need."),
  d("Count the Breaths", "night", "memory", "uncommon", 2, 2, [ease(1)], 2000, "Ruth counts for a sick child. The winter's burden drops by the size of one panic."),
  d("Tin Lantern", "night", "heirloom", "uncommon", 1, 0, [bond(2)], 1950, "Punch-tin, a candle, a small honest circle. The kin inside it works twice as sure."),
  d(
    "Mother's Shears",
    "night",
    "heirloom",
    "rare",
    2,
    0,
    [bond(3)],
    1962,
    "Ida cut hair, cloth, and twine with the same shears. They bond hard to whoever is working.",
    {
      year: 2016,
      text: "Nell finds a lock of Cal's hair in the hinge, kept after the photograph was cropped. The shears knew the brother the picture was not allowed to keep.",
    },
  ),
  d("Aurora That Lied", "night", "weather", "common", 1, 1, [tax(2), draw(1)], 2001, "The sky promised a mild night and did not mean it. Burden plus two. You still draw what the light showed."),

  // Generation — counts as the declared bond. fw-061..072
  d("The Heir", "generation", "kin", "common", 1, 1, [], 2008, "Whoever is youngest in the heated room is the heir, until they aren't."),
  d("The One Who Returns", "generation", "kin", "common", 2, 2, [draw(1)], 2010, "Coming back up the driveway counts. You draw a card because the house makes room."),
  d("Second Cousin", "generation", "kin", "uncommon", 2, 2, [stores(1)], 1999, "Not close enough for a bedroom, close enough to leave one store of wood."),
  d(
    "The Last to Remember the Name",
    "generation",
    "kin",
    "rare",
    3,
    3,
    [mend(1)],
    2012,
    "If one person still says the name, the hearth can be mended.",
    {
      year: 2026,
      text: "Nell is that person now, and the name is Cal's. Remembering him does not fix the crop. It stops the family from calling the absence a smudge on the lens.",
    },
  ),
  d("The Dooryard", "generation", "place", "common", 1, 1, [well(1)], 1900, "Every winter crosses the same packed snow between car and latch."),
  d("Family Plot", "generation", "place", "uncommon", 2, 2, [well(1)], 1860, "The stones face the road. The plot gives one store of continuance, which is not the same as comfort."),
  d("Tell It Again", "generation", "memory", "common", 1, 1, [recall], 2004, "A story told twice returns a kept memory to the hand. If nothing was kept, you draw."),
  d("What the Photograph Cropped", "generation", "memory", "common", 1, 2, [], 1974, "The missing edge still stokes. People feel a gap even when they cannot name the boy."),
  d("Fourteen Lines on the Flyleaf", "generation", "memory", "uncommon", 2, 1, [search(4)], 2012, "Ruth wrote one line each hard winter. You search four deep, which is more honesty than most drawers hold."),
  d(
    "The Unsent Letter",
    "generation",
    "memory",
    "rare",
    2,
    1,
    [shield, draw(1)],
    1998,
    "Mae's letter stays in the book. Unsent, it still shields, and you draw the reply you did not get.",
    {
      year: 2012,
      text: "Harris would have answered kindly. The shield was not secrecy. It was Mae deciding the lot could be planted without a witness.",
    },
  ),
  d(
    "House Key on a String",
    "generation",
    "heirloom",
    "rare",
    1,
    0,
    [bond(2)],
    1946,
    "Worn under a shirt so it is not lost in a snowbank. It bonds to the kin who can get back in.",
    {
      year: 2020,
      text: "The string is new. The key is the same. Nell wears it because Ruth's hands stopped managing the latch, not because the house changed owners.",
    },
  ),
  d(
    "The Long January",
    "generation",
    "weather",
    "uncommon",
    2,
    0,
    [tax(1), ease(2), draw(1)],
    2011,
    "A January that refuses to be a month. It taxes, then eases harder, and you draw the thaw.",
    {
      year: 2026,
      text: "They called fifteen hard winters 'fourteen' because the first one was before Nell was born and Ida would not count a winter the child did not see.",
    },
  ),
];

export const CARDS: CardDef[] = DRAFTS.map((draft, index) => ({
  id: `fw-${String(index + 1).padStart(3, "0")}`,
  ...draft,
}));

const byId = new Map(CARDS.map((card) => [card.id, card]));

export function getCard(id: string): CardDef | undefined {
  return byId.get(id);
}

export function mustCard(id: string): CardDef {
  const card = byId.get(id);
  if (!card) throw new Error(`Unknown card ${id}`);
  return card;
}

export const COPY_LIMIT: Record<Rarity, number> = {
  common: 3,
  uncommon: 2,
  rare: 1,
};

export function copyLimit(card: CardDef): number {
  return COPY_LIMIT[card.rarity];
}

export function countsAsBond(card: CardDef, bond: Affinity): boolean {
  return card.affinity === bond || card.affinity === "generation";
}

export function effectN(card: CardDef, op: Effect["op"]): number {
  const found = card.effects.find((effect) => effect.op === op);
  if (!found) return 0;
  if (found.op === "shield" || found.op === "recall") return 1;
  return found.n;
}

export function hasEffect(card: CardDef, op: Effect["op"]): boolean {
  return card.effects.some((effect) => effect.op === op);
}
