import type {
  BodyId,
  CountsWhen,
  Discipline,
  FamilyDef,
  ItemDef,
  ModDraft,
  PieceSlot,
} from "./types.ts";
import { EQUIP_SLOTS, FAMILY_SIZE, fid } from "./types.ts";

const ALL: BodyId[] = ["wanderer", "smuggler", "officer", "embryo"];
const NO_EMBRYO: BodyId[] = ["wanderer", "smuggler", "officer"];
const NO_OFFICER: BodyId[] = ["wanderer", "smuggler", "embryo"];
const QUIET: BodyId[] = ["wanderer", "smuggler"];
const SOFT: BodyId[] = ["wanderer", "embryo"];

const add = (stat: ModDraft["stat"], value: number, tone: ModDraft["tone"] = "plain"): ModDraft => ({
  stat,
  mode: "add",
  value,
  tone,
});
const mul = (stat: ModDraft["stat"], value: number, tone: ModDraft["tone"] = "plain"): ModDraft => ({
  stat,
  mode: "mul",
  value,
  tone,
});
const cap = (stat: ModDraft["stat"], value: number, tone: ModDraft["tone"] = "plain"): ModDraft => ({
  stat,
  mode: "capMax",
  value,
  tone,
});

function item(
  n: number,
  familyId: string,
  name: string,
  slot: PieceSlot,
  countsWhen: CountsWhen,
  bodies: BodyId[],
  discipline: Discipline,
  solo: string,
  place: string,
  notice: string,
  take: string,
  mods: ModDraft[],
): ItemDef {
  if (countsWhen === "equipped" && (slot === "pack" || !EQUIP_SLOTS.includes(slot as (typeof EQUIP_SLOTS)[number]))) {
    throw new Error(`${name} counts when equipped but has no equip slot`);
  }
  if (countsWhen !== "equipped" && slot !== "pack") {
    throw new Error(`${name} is carried or used and must stay in the pack`);
  }
  return {
    id: fid(n),
    familyId,
    name,
    slot,
    countsWhen,
    bodies,
    discipline,
    solo,
    discovery: { place, notice, take },
    mods,
  };
}

export const ITEMS: ItemDef[] = [
  item(1, "floodkeepers", "Creek pike", "hand", "equipped", ALL, "stride", "A long push. Wet things give ground.", "Vergennes boathouse", "The floor is already wet and a pike leans in the corner, not hung for sale.", "Take it when the water is on the boards. The corner stays empty after.", [add("atk", 2), add("wetOut", 0.35)]),
  item(2, "floodkeepers", "Bail bucket", "y", "equipped", ALL, "vitality", "Spends a little breath to put blood back.", "Vergennes, behind the library", "A bucket hangs on a nail only when the river is up over the grass.", "Lift it off the nail. It is a tool, not a marker.", [add("sustain", 3), add("maxMp", 2)]),
  item(3, "floodkeepers", "Oilskin", "worn", "equipped", ALL, "vitality", "Turns the worst of a soaking.", "Ferrisburgh basin boathouse", "A yellowed coat on a peg, heavier than it looks, still beaded.", "Wear it out. The peg is just a peg.", [add("guard", 0.12), add("warmth", 2), add("soakVuln", -0.28)]),
  item(4, "floodkeepers", "Gauge stick", "pack", "carried", ALL, "sight", "Carried, not worn. The water's height stays honest.", "Middlebury bridge", "A staff is lashed to the pier. The lower stripe is under the river.", "Cut it free when the stripe is gone. Carrying it is enough. It never wants a slot.", [add("wetOut", 0.18), add("warmth", 0.4)]),
  item(5, "floodkeepers", "Sandbag fold", "pack", "used", ALL, "vitality", "One life, one fold. The water has to go around.", "Windsor town-office basement", "The stack against the boiler is one short of even.", "Take the odd fold and spend it. A second fold is just cloth.", [add("guard", 0.06)]),

  item(6, "quarry-night", "Slate peen", "hand", "equipped", ALL, "edge", "Cracks what the day crew left standing.", "Quarry night bench", "The peen is on the bench only after the day shift's lamps go out.", "Pick it up in the dark. The bench does not label it.", [add("atk", 3), add("chipOut", 1)]),
  item(7, "quarry-night", "Carbide lamp", "y", "equipped", ALL, "sight", "Real light. It drinks oil.", "Quarry niche", "A niche in the seam shows only when your own light is already poor.", "Take the lamp. It will not burn forever unless something else bargains for it.", [add("light", 2), add("oilDrain", 2)]),
  item(8, "quarry-night", "Slate apron", "worn", "equipped", ALL, "vitality", "Chips stop at the cloth.", "Quarry mouth", "A changing nail by the gate holds one apron after dusk.", "Put it on. The nail is bare in the morning.", [add("guard", 0.1), add("chipOut", 0.5)]),
  item(9, "quarry-night", "Shift whistle", "pack", "carried", ALL, "bond", "Carried. The night crew still answers the shape of it.", "Quarry gate hook", "The day crew's hook is empty. The night hook is not.", "Pocket the whistle. It is not a third weapon and not a worn coat.", [add("atk", 1)]),
  item(10, "quarry-night", "Chalk tally", "pack", "used", ALL, "sight", "Finish the unmarked line once. The seam remembers.", "Quarry office slate", "The tally board has one blank stroke at the bottom.", "Mark it. The stroke spends the chalk.", [add("chipOut", 0.45)]),

  item(11, "orchard-guardians", "Pruning hook", "hand", "equipped", ALL, "edge", "Short, mean, and good against things that live in rows.", "Shelburne wolf tree", "East of the village a hook sits in the crotch of a tree the rows grew around.", "Work it free. No one tagged the tree.", [add("atk", 2), add("beastOut", 0.45)]),
  item(12, "orchard-guardians", "Smoke pot", "y", "equipped", ALL, "shadow", "A low smoke. Beasts lose the row.", "Shelburne rows at dusk", "The pot is cold all afternoon. At dusk it has been lit and left.", "Take it while it still breathes. You had to be there at the hour.", [add("beastOut", 0.28), add("guard", 0.05)]),
  item(13, "orchard-guardians", "Bee veil", "worn", "equipped", ALL, "vitality", "The face stays yours.", "Farmstead porch", "A veil hangs off the porch nail, not in the house.", "Wear it. The nail does not restock.", [add("guard", 0.1), add("beastOut", 0.16)]),
  item(14, "orchard-guardians", "Grafting twine", "pack", "carried", ALL, "bond", "Carried twine knits a little blood back together.", "Bristol orchard shed", "A coil hangs on the grafting bench, waxed, not packaged.", "Pocket the coil. It counts in the pack.", [add("sustain", 2)]),
  item(15, "orchard-guardians", "Windfall apple", "pack", "used", ALL, "vitality", "Eat it once. The tree already let it go.", "Salisbury, after wind", "Under one tree the drops are bruised except a single sound apple.", "Eat that one. The rest are cider.", [add("maxHp", 6)]),

  item(16, "unnamed-witnesses", "Court penknife", "hand", "equipped", NO_EMBRYO, "edge", "A fast small cut. The embryo has no testimony to open.", "Middlebury courthouse window", "A knife wedges a sash that will not stay shut. The window ticks in the wind.", "Take the wedge. The window will have to be fixed some other way.", [add("atk", 1.4), add("burst", 0.35), add("opening", 0.2)]),
  item(17, "unnamed-witnesses", "Statement glass", "y", "equipped", NO_EMBRYO, "sight", "Turns a blow back a little. Not a speech.", "Witness bench", "A hand mirror lies face down on the bench inside the courthouse.", "Pick it up. Nobody calls your name.", [add("reflect", 4), add("guard", 0.06)]),
  item(18, "unnamed-witnesses", "Plain coat", "worn", "equipped", ALL, "shadow", "You are harder to pick out of a room.", "Courthouse rack", "One coat on the public rack is not the clerk's and not the bailiff's.", "Wear that one. Leave the named coats.", [add("guard", 0.1), add("burst", 0.08)]),
  item(19, "unnamed-witnesses", "Unlabeled photograph", "pack", "carried", ALL, "sight", "Carried. You see the tell before the swing.", "Vergennes notice board", "A photograph is slipped behind a notice. The back has no names.", "Slide it out and carry it. Do not pin it back up.", [add("opening", 0.28)]),
  item(20, "unnamed-witnesses", "Unsigned affidavit", "pack", "used", NO_EMBRYO, "bond", "Spend it once. A rumor loses a step. The embryo cannot sign.", "Clerk's office", "A form sits in the tray with the signature line still blank.", "Use it by leaving the line blank on purpose. The paper is spent.", [add("reflect", 2)]),

  item(21, "unmeasured-county", "Survey chain", "hand", "equipped", ALL, "stride", "Reach that does not trust the painted miles.", "Norwich road", "Where the paint stops, a chain lies in the tall grass between two posts.", "Coil it up. The posts stay unnumbered.", [add("atk", 1.6), add("haste", 0.04)]),
  item(22, "unmeasured-county", "Unmarked compass", "y", "equipped", ALL, "sight", "The rose is filed off. It still picks a direction you can live with.", "Woodstock survey drawer", "The drawer in the town office sticks. Inside, a compass with no rose.", "Take it. The drawer is not a chest reward.", [add("opening", 0.15), add("hearingOut", 0.1)]),
  item(23, "unmeasured-county", "County wool", "worn", "equipped", ALL, "vitality", "Warmth with no town's name in the collar.", "Ferrisburgh line fence", "A sweater is folded on the fence where two townships argue.", "Put it on. The fence does not grow another.", [add("warmth", 2), add("maxHp", 2)]),
  item(24, "unmeasured-county", "Blank plat", "pack", "carried", ALL, "sight", "Carried paper. You notice a seam the map refused.", "Chittenden map tube", "A tube in the town clerk's back room holds paper with no lines.", "Carry the blank. It does not draw a pin.", [add("chipOut", 0.2), add("wetOut", 0.08)]),
  item(25, "unmeasured-county", "Mile-stone chip", "pack", "used", ALL, "stride", "Spend the chip to keep one pace that is yours.", "Windsor road", "A milestone is broken. The mileage that remains is unreadable.", "Pocket one chip and spend it. You do not restore the number.", [add("haste", 0.05), add("opening", 0.1)]),

  item(26, "sugarbush-crew", "Tapping hatchet", "hand", "equipped", ALL, "edge", "A short hatchet that knows wood and will do flesh.", "Sugarhouse arch", "The hatchet is stuck in the splitting block while the pan is unattended.", "Work it loose when the sugarhouse is breathing steam.", [add("atk", 2.2)]),
  item(27, "sugarbush-crew", "Boiling pan", "y", "equipped", ALL, "vitality", "Heat you can carry. It makes you thirsty for calm.", "Sugarhouse arch", "The small pan, not the main arch, sits off the fire and still hot.", "Take the small one. The arch stays.", [add("atk", 0.8), add("burnVuln", 0.08)]),
  item(28, "sugarbush-crew", "Wool cap", "worn", "equipped", ALL, "vitality", "Keeps the steam out of your ears.", "Sugarhouse nail", "A cap, steamed flat, hangs where the boiler-man left it.", "Wear it. The nail is not a shop.", [add("warmth", 1.5), add("guard", 0.04)]),
  item(29, "sugarbush-crew", "Hydrometer", "pack", "carried", ALL, "sight", "Carried. You read how thick a thing is before you hit it.", "Sugarhouse bench", "The glass float lies beside a pencil, not in a case.", "Pocket it. You had to be in the sugarhouse while it worked.", [add("chipOut", 0.35), add("opening", 0.12)]),
  item(30, "sugarbush-crew", "First-boil tin", "pack", "used", ALL, "bond", "Drink once. The rush is real and then it is gone.", "Sugarhouse sill", "A tin cup of the first boil is still warm on the sill.", "Drink it. The cup goes empty for good.", [add("burst", 0.2), add("maxMp", 1)]),

  item(31, "ferry-bells", "Boathook", "hand", "equipped", ALL, "stride", "Pulls and pushes. Good on a wet deck.", "Burlington wharf at night", "A hook rests on an unmanned cleat. The ferry is dark.", "Take the hook. No bell rings to announce you.", [add("atk", 1.8), add("wetOut", 0.22)]),
  item(32, "ferry-bells", "Fog bell", "y", "equipped", ALL, "bond", "One hard note. A rush loses its shape.", "Ferry shed", "The big bell stays. A smaller bell sits under the bench in fog.", "Take the small bell when the air is already white.", [add("guard", 0.06), add("opening", 0.18)]),
  item(33, "ferry-bells", "Cork vest", "worn", "equipped", ALL, "vitality", "You go under slower.", "Burlington wharf bench", "A cork vest is stuffed under the bench, salt in the seams.", "Wear it. The bench is just a bench.", [add("guard", 0.08), add("soakVuln", -0.12), add("warmth", 1)]),
  item(34, "ferry-bells", "Tide card", "pack", "carried", ALL, "sight", "Carried. The printed times are wrong. The pencil is right.", "Ferry shed wall", "A card is nailed inside the shed. Departures are crossed out and rewritten.", "Take the card. Learn it by watching one boat, not by a pin.", [add("wetOut", 0.12)]),
  item(35, "ferry-bells", "Passenger stub", "pack", "used", ALL, "stride", "Spend a stub. One crossing's worth of nerve.", "Wharf fence", "A stub is stuck in the fence wire, face down.", "Use it. It is not a door to somewhere marked.", [add("haste", 0.04), add("maxHp", 2)]),

  item(36, "marble-masons", "Dressing chisel", "hand", "equipped", ALL, "edge", "Honest edge on stone and on anything as stubborn.", "Montpelier marble dock", "A chisel is left in a half-dressed block on the loading dock.", "Draw it out of the block. The block stays half done.", [add("atk", 2.4), add("chipOut", 0.6)]),
  item(37, "marble-masons", "Plumb bob", "y", "equipped", ALL, "sight", "A true line. Crooked swings meet it.", "Capitol basement", "A bob hangs from a string where the floor is being proved.", "Untie it. The string is not a quest ribbon.", [add("opening", 0.2), add("chipOut", 0.25)]),
  item(38, "marble-masons", "Dust mask", "worn", "equipped", ALL, "vitality", "The lungs stay out of the cut.", "Marble shed peg", "A mask on the peg, white at the edges, used today.", "Take it after the shed is quiet.", [add("guard", 0.08), add("maxHp", 2)]),
  item(39, "marble-masons", "Vein scrap", "pack", "carried", ALL, "sight", "Carried. You read the grain before the hit.", "Marble dust", "A scrap of paper in the dust draws a vein and no cross.", "Pocket the scrap. It does not mark a wall for you.", [add("chipOut", 0.4)]),
  item(40, "marble-masons", "Marble chip", "pack", "used", ALL, "bond", "Set the chip once. The seam takes the offering.", "Quarry temple ledge", "A pale chip sits on the old ledge, loose, not mortared.", "Spend it in a crack. You do not get a shrine menu.", [add("guard", 0.04), add("reflect", 1)]),

  item(41, "sheep-hill", "Shepherd crook", "hand", "equipped", ALL, "bond", "Catches a leg or a wrist. Keeps your distance.", "Hills above Middlebury", "A crook leans on a cedar above the pasture, no shepherd in sight.", "Take it. The cedar is only a tree.", [add("atk", 1.7), add("beastOut", 0.2)]),
  item(42, "sheep-hill", "Dog whistle", "y", "equipped", ALL, "bond", "A short call. Something hits that is not a second body.", "Farmstead porch", "An old collar hangs on the porch. The whistle is on the string. The dog is not home.", "Use the whistle as the Y tool. It does not add a companion slot.", [add("atk", 1.2), add("beastOut", 0.18)]),
  item(43, "sheep-hill", "Mud boots", "worn", "equipped", ALL, "stride", "The hill does not take your footing.", "Barn door", "A pair too muddy to be the house boots waits by the barn.", "Wear them. Wipe nothing.", [add("haste", 0.05), add("warmth", 1), add("guard", 0.04)]),
  item(44, "sheep-hill", "Bellwether bell", "pack", "carried", ALL, "bond", "Carried. The flock's bell steadies the next step.", "Pasture turn", "A bell lies in the grass where the animals turned, the strap broken.", "Carry it. You do not lead a visible herd.", [add("guard", 0.04), add("beastOut", 0.1)]),
  item(45, "sheep-hill", "Salt lick", "pack", "used", ALL, "vitality", "Take a piece, once. Not the whole stone.", "Sheep stone", "The lick is grooved by tongues. One corner is already cracked off.", "Use the cracked piece. The stone stays in the field.", [add("maxHp", 4), add("sustain", 1)]),

  item(46, "night-librarians", "Press bar", "hand", "equipped", ALL, "edge", "A flat bar from the stacks. Rude and accurate.", "College library after hours", "The bar that holds the closed-stacks door comes free when the building is shut.", "Take it from the door. The door stays a door.", [add("atk", 1.5), add("hearingOut", 0.15)]),
  item(47, "night-librarians", "Index lamp", "y", "equipped", ALL, "sight", "A reading light. It sips oil and shows the tell.", "Index table", "The lamp on the index table is left burning.", "Take it. You had to come after the lamps should be out.", [add("light", 1), add("oilDrain", 1), add("hearingOut", 0.2)]),
  item(48, "night-librarians", "Ink apron", "worn", "equipped", ALL, "shadow", "Dark cloth. Harder to single out.", "Bindery peg", "An ink-stained apron hangs in the bindery, still damp.", "Wear it. It is not armor from a chest.", [add("guard", 0.06), add("hearingOut", 0.1)]),
  item(49, "night-librarians", "Overdue slip", "pack", "carried", ALL, "sight", "Carried. A blank slip still notices who is late.", "A book that was never checked out", "The slip in the back is blank. The book is on the wrong shelf.", "Carry the slip. Do not start a quest log.", [add("opening", 0.16), add("hearingOut", 0.12)]),
  item(50, "night-librarians", "Marginalia", "pack", "used", ALL, "sight", "Read the loose strip once. The note spends itself.", "College stacks", "A margin continues onto a strip that is no longer attached.", "Read it. The strip does not survive the reading.", [add("hearingOut", 0.25), add("opening", 0.1)]),

  item(51, "ice-cutters", "Ice saw", "hand", "equipped", ALL, "edge", "A cold edge. Slow things hate it.", "Shelburne ice", "When the ice houses are out, a saw stands frozen in a block they did not finish.", "Free the saw. The block stays.", [add("atk", 2.2), add("frostOut", 0.55)]),
  item(52, "ice-cutters", "Ice tongs", "y", "equipped", ALL, "stride", "Grip and drag. The cold comes with them.", "On the ice", "Tongs lie where a hand just was. The handles are still warm.", "Take them before the warmth leaves.", [add("atk", 0.8), add("frostOut", 0.2)]),
  item(53, "ice-cutters", "Shearling", "worn", "equipped", ALL, "vitality", "The long cold has to get through the wool.", "Ice-house peg", "A shearling coat hangs inside the ice house, absurd and correct.", "Wear it out into the weather.", [add("warmth", 3.2), add("guard", 0.05)]),
  item(54, "ice-cutters", "Thickness auger", "pack", "carried", ALL, "sight", "Carried. You know the ice before you trust it.", "Beside the saw", "The auger lies next to the unfinished block, shavings still curled.", "Carry it. It is not a worn tool.", [add("frostOut", 0.15), add("opening", 0.08)]),
  item(55, "ice-cutters", "Sawdust pocket", "pack", "used", ALL, "stride", "Scatter it once. Your feet stay yours.", "Ice-house crate", "A crate holds dry sawdust, a pocket of it already scooped aside.", "Use that pocket for footing. The crate is not a shop.", [add("haste", 0.04), add("guard", 0.03)]),

  item(56, "section-gang", "Spike maul", "hand", "equipped", ALL, "edge", "Heavy and straight. Poor at turning.", "Rutland yard", "A maul rests on a tie that is already spiked.", "Lift it. The tie does not need you.", [add("atk", 2.6)]),
  item(57, "section-gang", "Track wrench", "y", "equipped", ALL, "edge", "Bolts and knuckles. A mean Y tool.", "Section shed", "The wrench is on the bench among others. Yours is the one with the fresh chew in the handle.", "Take that one.", [add("atk", 1.1), add("chipOut", 0.2)]),
  item(58, "section-gang", "Denim vest", "worn", "equipped", ALL, "vitality", "A little cloth between you and the yard.", "Section shed hook", "One vest on the hook is mended with rail wire.", "Wear the mended one.", [add("guard", 0.07), add("maxHp", 2)]),
  item(59, "section-gang", "Timetable", "pack", "carried", ALL, "sight", "Carried. The printed trains are lies. The pencil is the yard.", "Yard shed", "A timetable is penciled over. You can check it by watching one freight, not by a pin.", "Carry the card.", [add("opening", 0.14)]),
  item(60, "section-gang", "Fusee", "pack", "used", ALL, "sight", "Light it once. The yard sees, and so does everything else.", "Fog box", "A flare box by the switch is labeled for fog. One fusee is loose.", "Burn it. It is a single light, not a lamp you keep.", [add("light", 1), add("burst", 0.12)]),

  item(61, "innkeepers", "Tap handle", "hand", "equipped", ALL, "edge", "A bar weapon. Short, and everyone has seen one coming.", "Inn bar", "One handle on the tap pours nothing. It comes off in the hand.", "Take it after closing, when the inn is only a kitchen light.", [add("atk", 1.3), add("burst", 0.12)]),
  item(62, "innkeepers", "Kettle", "y", "equipped", ALL, "vitality", "Hot water. A little blood comes back if you have the breath.", "Inn kitchen", "The kettle is just off the boil and no one is tending it.", "Take it. Leave the pot on the stove.", [add("sustain", 2.5), add("maxMp", 2)]),
  item(63, "innkeepers", "Kitchen apron", "worn", "equipped", ALL, "bond", "You look like you work here. Blows hesitate.", "Kitchen door", "An apron on the peg by the door, flour still in the seam.", "Put it on.", [add("guard", 0.06), add("hearingOut", 0.08)]),
  item(64, "innkeepers", "Room keys", "pack", "carried", ALL, "bond", "Carried. Keys to rooms that are not on the board.", "Under the bar", "A ring hangs on a nail that is not the guest nail.", "Pocket the ring. It opens no map icon.", [add("guard", 0.03), add("maxHp", 2)]),
  item(65, "innkeepers", "Last pour", "pack", "used", ALL, "vitality", "Drink the last of it. The glass does not refill.", "The bar at closing", "One glass remains, an inch left, the room already dark.", "Drink it. That is the use.", [add("maxHp", 3), add("sustain", 1)]),

  item(66, "storm-roofers", "Shingle hatchet", "hand", "equipped", ALL, "edge", "A roof hatchet. Fine until the sky opens.", "Woodstock church hill", "A hatchet is stuck in a bundle of shingles on a roof you can step onto from the hill.", "Pull it free. The roof is not marked.", [add("atk", 2), add("guard", 0.02)]),
  item(67, "storm-roofers", "Pitch pot", "y", "equipped", ALL, "vitality", "Hot pitch. It seals and it hates rain.", "At the ladder", "A pot on the ground is still warm. The ladder is empty.", "Take the pot. You do not get a floating marker up the roof.", [add("atk", 0.7), add("guard", 0.04)]),
  item(68, "storm-roofers", "Nail apron", "worn", "equipped", ALL, "vitality", "Nails where a blade expects cloth.", "On the ladder", "The apron is hung on a rung, not on a person.", "Wear it down.", [add("guard", 0.09)]),
  item(69, "storm-roofers", "Chalk line", "pack", "carried", ALL, "sight", "Carried. A blue line already snapped, the reel in the gutter.", "Gutter", "The reel sits where the line ended. The line is the work, not a path for you.", "Pocket the reel.", [add("opening", 0.12), add("chipOut", 0.15)]),
  item(70, "storm-roofers", "Loose shingle", "pack", "used", ALL, "stride", "Throw it once. A rude interrupt.", "The bundle", "One shingle does not match the others.", "Throw that one. It does not come back.", [add("burst", 0.16), add("opening", 0.08)]),

  item(71, "border-pockets", "Boot dirk", "hand", "equipped", QUIET, "shadow", "The first inch is the whole argument. An officer will not pocket it.", "Windsor pull-off", "A boot sits by the county-line culvert, too big to be yours. The dirk is in it.", "Take the dirk. Leave the boot.", [add("atk", 3), add("burst", 0.45), add("opening", 0.25)]),
  item(72, "border-pockets", "False lantern", "y", "equipped", QUIET, "shadow", "Light that does not confess you. Officer and embryo cannot hold it.", "County-line culvert", "A lantern in the culvert throws a color that is wrong for flame.", "Only a wanderer or a smuggler can make a fist around it.", [add("light", 1), add("burst", 0.08)]),
  item(73, "border-pockets", "Quiet soles", "worn", "equipped", ALL, "stride", "The step is shorter and harder to hear.", "Under the culvert", "Shoes with wrapped soles are lined up where the water stays out.", "Wear them.", [add("haste", 0.08)]),
  item(74, "border-pockets", "Second pocket", "pack", "carried", ALL, "shadow", "Carried cloth. It is not a fourth equipment slot.", "Cut from a coat", "A pocket is sewn and then cut free, empty, left on a stone.", "Carry it. Your hand, Y, and worn stay three.", [add("burst", 0.15)]),
  item(75, "border-pockets", "Burned manifest", "pack", "used", QUIET, "shadow", "Read the route once. The paper dies. An officer will not.", "Culvert tin", "A tin holds a manifest burned down to a list.", "Use it by reading. The list does not become a marker.", [add("opening", 0.22)]),

  item(76, "other-voice", "Soft iron", "hand", "equipped", ALL, "edge", "A short blade, half-remembered, still cuts.", "Middlebury green at first light", "The morning after a death, before the town is up, a soft short blade is in the grass.", "Take it and do not wait for a prompt.", [add("atk", 1.2), add("reflect", 0.5)]),
  item(77, "other-voice", "Listening shell", "y", "equipped", SOFT, "bond", "You hear the blow coming. An officer has no ear for it.", "Otter Creek stones", "A shell sits in the creek stones, too far from any sea.", "A wanderer or an embryo can lift it. An officer's hand misses.", [add("reflect", 1.5), add("hearingOut", 0.15)]),
  item(78, "other-voice", "Second skin", "worn", "equipped", NO_OFFICER, "vitality", "A thin warm coat. It will not button under an officer's cloth.", "Under the shrine stone", "A folded skin of cloth, warm, is under the stone at the green.", "Wear it unless you are the officer.", [add("maxMp", 2), add("mpRegen", 0.15), add("guard", 0.04)]),
  item(79, "other-voice", "Unfinished name", "pack", "carried", ALL, "bond", "A rubbing of a name that stops halfway. Carried.", "Salisbury grass", "A stone in the grass is cut halfway. It is not on the grave list you already keep.", "Take a rubbing. The stone is not a destination pin.", [add("reflect", 0.8), add("maxMp", 1)]),
  item(80, "other-voice", "Kept breath", "pack", "used", SOFT, "vitality", "Breathe into it once. The fog spends. Officer and smuggler cannot.", "Creemee back shelf", "A bottle on the back shelf will not take syrup. The glass is already fogged.", "An embryo or a wanderer breathes in. The bottle goes clear and empty.", [add("mpRegen", 0.2), add("sustain", 1)]),
];

const byNum = new Map(ITEMS.map((entry) => [entry.id, entry]));

function ids(...nums: number[]): string[] {
  return nums.map((n) => fid(n));
}

function pair(id: string, name: string, note: string, a: number, b: number, mods: ModDraft[]): FamilyDef["pair"] {
  return { id, name, note, pieceIds: [fid(a), fid(b)], mods };
}

export const FAMILIES: FamilyDef[] = [
  {
    id: "floodkeepers",
    name: "Floodkeepers",
    identity: "People who meet the river when it is already in the street. They do not own the county. They own the next hour of water.",
    pieceIds: ids(1, 2, 3, 4, 5),
    pair: pair("push-the-water", "Push the water", "Pike and bucket together move a body instead of only hitting it.", 1, 2, [add("wetOut", 0.16)]),
    counts: [
      { at: 2, name: "High-water watch", note: "Two pieces, and the cold is less of a surprise.", mods: [add("warmth", 0.6)] },
      { at: 3, name: "Street is a creek", note: "Three pieces. You stand a little squarer in the push.", mods: [add("guard", 0.04)] },
    ],
    sidegrade: {
      name: "Stillwater",
      gives: "The soaking stops arguing with you.",
      costs: "You hit a ceiling, and you are slower than a mixed hand that never made the bargain.",
      mods: [add("guard", 0.08, "gift"), add("soakVuln", -0.55, "gift"), add("wetOut", 0.22, "gift"), mul("haste", 0.6, "cost"), cap("dmgCap", 9, "cost")],
    },
  },
  {
    id: "quarry-night",
    name: "Quarry night workers",
    identity: "The shift that starts when the marble goes black. Light is a fuel, not a mood.",
    pieceIds: ids(6, 7, 8, 9, 10),
    pair: pair("read-the-vein", "Read the vein", "Peen and lamp. The crack shows before you spend the swing.", 6, 7, [add("chipOut", 0.8), add("light", 0.4)]),
    counts: [
      { at: 2, name: "On the clock", note: "Two pieces of the night shift.", mods: [add("guard", 0.03)] },
      { at: 3, name: "Black lunch", note: "Three pieces. The arms remember the seam.", mods: [add("atk", 1)] },
    ],
    sidegrade: {
      name: "Black shift",
      gives: "The lamp stops drinking. The dark stays workable.",
      costs: "Water and weather punish you. A mixed lamp without this bargain keeps its warmth.",
      mods: [add("light", 1.5, "gift"), cap("oilDrain", 0, "gift"), add("soakVuln", 1, "cost"), add("warmth", -3, "cost")],
    },
  },
  {
    id: "orchard-guardians",
    name: "Orchard guardians",
    identity: "They keep the rows, not the town. Smoke, veil, and a hook. Beasts are the work.",
    pieceIds: ids(11, 12, 13, 14, 15),
    pair: pair("hornet-yard", "Hornet yard", "Hook and smoke. The row belongs to you for a minute.", 11, 12, [add("beastOut", 0.32)]),
    counts: [
      { at: 2, name: "Second bloom", note: "Two pieces. You are a little harder to put down.", mods: [add("maxHp", 3)] },
      { at: 3, name: "Closed row", note: "Three pieces. Stings and teeth lose a little.", mods: [add("guard", 0.04)] },
    ],
    sidegrade: {
      name: "Closed orchard",
      gives: "Beasts in the rows have a very bad evening.",
      costs: "Nothing knits you back together, and the cold finds the veil.",
      mods: [add("beastOut", 0.5, "gift"), add("guard", 0.06, "gift"), cap("sustain", 0, "cost"), add("warmth", -2.2, "cost")],
    },
  },
  {
    id: "unnamed-witnesses",
    name: "Unnamed witnesses",
    identity: "They were in the room. They are not on the form. The work is to be seen only as much as you choose.",
    pieceIds: ids(16, 17, 18, 19, 20),
    pair: pair("not-the-one", "Not the one", "Glass and coat. The blow looks for someone else and finds the glass.", 17, 18, [add("guard", 0.05), add("reflect", 1)]),
    counts: [
      { at: 2, name: "In the room", note: "Two pieces. You last a little longer in a story.", mods: [add("maxHp", 2)] },
      { at: 3, name: "Off the record", note: "Three pieces. More of the blow comes back.", mods: [add("reflect", 1)] },
    ],
    sidegrade: {
      name: "The record",
      gives: "Blows return themselves. You are difficult to finish with a rumor.",
      costs: "Your own damage is capped. A mixed dirk with no bargain ends a brawl faster.",
      mods: [add("reflect", 3, "gift"), add("guard", 0.06, "gift"), cap("dmgCap", 5.5, "cost"), mul("haste", 0.9, "cost")],
    },
  },
  {
    id: "unmeasured-county",
    name: "The unmeasured county",
    identity: "The miles between the signs. They trust a chain more than a painted number.",
    pieceIds: ids(21, 22, 23, 24, 25),
    pair: pair("no-rose", "No rose", "Chain and compass. You move before the county agrees that you did.", 21, 22, [add("haste", 0.04), add("opening", 0.08)]),
    counts: [
      { at: 2, name: "Between signs", note: "Two pieces. A little more air in the lungs.", mods: [add("maxHp", 2)] },
      { at: 3, name: "Unpainted", note: "Three pieces. The step is cleaner.", mods: [add("haste", 0.03)] },
    ],
    sidegrade: {
      name: "Outside the grid",
      gives: "You are quicker off the painted road.",
      costs: "The body that lives outside the grid is thinner. Other bargains do not stack their pride onto you.",
      mods: [add("haste", 0.12, "gift"), add("opening", 0.12, "gift"), mul("maxHp", 0.84, "cost"), mul("atk", 0.9, "cost")],
    },
  },
  {
    id: "sugarbush-crew",
    name: "Sugarbush crew",
    identity: "Steam, iron, and a short season. They are strong while the pan is hot and worse when it isn't.",
    pieceIds: ids(26, 27, 28, 29, 30),
    pair: pair("on-the-arch", "On the arch", "Hatchet and pan. Heat in the swing.", 26, 27, [add("atk", 0.8)]),
    counts: [
      { at: 2, name: "First steam", note: "Two pieces. The cold slips.", mods: [add("warmth", 0.8)] },
      { at: 3, name: "Boiling", note: "Three pieces. The arms stay in it.", mods: [add("atk", 0.6)] },
    ],
    sidegrade: {
      name: "Hard boil",
      gives: "The swing is heavier, like green wood.",
      costs: "You slow down. The house that makes sugar is a poor place to be quick.",
      mods: [add("atk", 2, "gift"), add("warmth", 1, "gift"), mul("haste", 0.74, "cost"), add("soakVuln", 0.35, "cost")],
    },
  },
  {
    id: "ferry-bells",
    name: "Ferry night bells",
    identity: "The dock after the last posted boat. Fog is a tool if you already live in it.",
    pieceIds: ids(31, 32, 33, 34, 35),
    pair: pair("fog-cleat", "Fog cleat", "Hook and bell. A rush on a wet deck loses its feet.", 31, 32, [add("wetOut", 0.14), add("guard", 0.03)]),
    counts: [
      { at: 2, name: "After the posting", note: "Two pieces. You ride a little lower and safer.", mods: [add("guard", 0.03)] },
      { at: 3, name: "Unscheduled", note: "Three pieces. The water helps.", mods: [add("wetOut", 0.1)] },
    ],
    sidegrade: {
      name: "Still bell",
      gives: "You are hard to knock off a wet footing.",
      costs: "The bell that saves you also makes you late.",
      mods: [add("guard", 0.12, "gift"), add("wetOut", 0.18, "gift"), mul("haste", 0.8, "cost"), cap("burst", 0.05, "cost")],
    },
  },
  {
    id: "marble-masons",
    name: "Marble temple masons",
    identity: "They dress stone for buildings that outlast a body. The work is straight lines and dust.",
    pieceIds: ids(36, 37, 38, 39, 40),
    pair: pair("true-line", "True line", "Chisel and bob. The hit lands where the stone is already weak.", 36, 37, [add("chipOut", 0.45)]),
    counts: [
      { at: 2, name: "Half dressed", note: "Two pieces. Dust does less.", mods: [add("guard", 0.03)] },
      { at: 3, name: "On the bed", note: "Three pieces. The edge finds grain.", mods: [add("chipOut", 0.25)] },
    ],
    sidegrade: {
      name: "True stone",
      gives: "You stand like dressed marble and cut like it.",
      costs: "You do not knit, and you do not hurry.",
      mods: [add("guard", 0.14, "gift"), add("chipOut", 0.45, "gift"), mul("haste", 0.78, "cost"), cap("sustain", 0, "cost")],
    },
  },
  {
    id: "sheep-hill",
    name: "Sheep hill",
    identity: "Crook, whistle, mud. The dog is a sound, not a second fighter you equip.",
    pieceIds: ids(41, 42, 43, 44, 45),
    pair: pair("come-by", "Come by", "Crook and whistle. The hit arrives from the side you aren't swinging.", 41, 42, [add("atk", 0.8), add("beastOut", 0.12)]),
    counts: [
      { at: 2, name: "On the hill", note: "Two pieces. Footing.", mods: [add("guard", 0.03)] },
      { at: 3, name: "The flock turns", note: "Three pieces. Beasts respect the noise.", mods: [add("beastOut", 0.12)] },
    ],
    sidegrade: {
      name: "The dog works",
      gives: "The whistle hits harder than your arm.",
      costs: "You are the one who is slow. The dog is not an extra slot.",
      mods: [add("atk", 2.4, "gift"), add("beastOut", 0.2, "gift"), mul("haste", 0.7, "cost"), cap("opening", 0.05, "cost")],
    },
  },
  {
    id: "night-librarians",
    name: "Night librarians",
    identity: "After hours in the stacks. They know people and paper. Beasts do not read.",
    pieceIds: ids(46, 47, 48, 49, 50),
    pair: pair("lamp-on-the-bar", "Lamp on the bar", "Bar and lamp. A named thing is easier to place.", 46, 47, [add("hearingOut", 0.2)]),
    counts: [
      { at: 2, name: "After hours", note: "Two pieces. You see the late tell.", mods: [add("opening", 0.08)] },
      { at: 3, name: "In the index", note: "Three pieces. Stories take more damage.", mods: [add("hearingOut", 0.12)] },
    ],
    sidegrade: {
      name: "Closed stacks",
      gives: "Rumors and rooms full of people unravel.",
      costs: "A beast is not a patron. The bargain makes you worse against it.",
      mods: [add("hearingOut", 0.7, "gift"), add("reflect", 1, "gift"), add("beastOut", -0.65, "cost"), add("warmth", -1, "cost")],
    },
  },
  {
    id: "ice-cutters",
    name: "Ice cutters",
    identity: "The lake when it will hold a house. They are rich in cold and poor in a thaw.",
    pieceIds: ids(51, 52, 53, 54, 55),
    pair: pair("block-and-tong", "Block and tong", "Saw and tongs. The cold stays in the wound.", 51, 52, [add("frostOut", 0.2)]),
    counts: [
      { at: 2, name: "On the ice", note: "Two pieces. You waste less heat.", mods: [add("warmth", 0.6)] },
      { at: 3, name: "House is out", note: "Three pieces. The edge is truer.", mods: [add("frostOut", 0.12)] },
    ],
    sidegrade: {
      name: "Black ice",
      gives: "The cold works for you, and the coat holds.",
      costs: "A thaw or a flood goes through you. Fire and high water are the tax.",
      mods: [add("frostOut", 0.55, "gift"), add("warmth", 1.5, "gift"), mul("haste", 0.82, "cost"), add("soakVuln", 0.6, "cost"), add("burnVuln", 0.45, "cost")],
    },
  },
  {
    id: "section-gang",
    name: "Rail section gang",
    identity: "Ties, spikes, and a straight job. They are worse the moment the fight starts to turn.",
    pieceIds: ids(56, 57, 58, 59, 60),
    pair: pair("on-the-tie", "On the tie", "Maul and wrench. A straight hit gets meaner.", 56, 57, [add("atk", 0.7)]),
    counts: [
      { at: 2, name: "Section", note: "Two pieces. A little more between you and the yard.", mods: [add("guard", 0.03)] },
      { at: 3, name: "Ballast", note: "Three pieces. The swing is heavier.", mods: [add("atk", 0.5)] },
    ],
    sidegrade: {
      name: "Straight rail",
      gives: "Down the line, you hit like a maul that has never missed.",
      costs: "Turning is expensive. A quicker mixed hand beats you in a short room.",
      mods: [add("atk", 2.2, "gift"), add("guard", 0.06, "gift"), mul("haste", 0.76, "cost"), cap("burst", 0.08, "cost")],
    },
  },
  {
    id: "innkeepers",
    name: "Innkeepers",
    identity: "They keep a room and a kettle. They outlast a grievance. They do not win the first punch.",
    pieceIds: ids(61, 62, 63, 64, 65),
    pair: pair("after-closing", "After closing", "Handle and kettle. The room becomes a long conversation.", 61, 62, [add("sustain", 0.8)]),
    counts: [
      { at: 2, name: "House rules", note: "Two pieces. You are mistaken for staff, which helps.", mods: [add("guard", 0.03)] },
      { at: 3, name: "Last call", note: "Three pieces. A little more left in the glass.", mods: [add("maxHp", 2)] },
    ],
    sidegrade: {
      name: "Hearth",
      gives: "You knit, and you have more to knit.",
      costs: "The hearth does not throw a hard punch. A burst from the road ends you before the kettle matters.",
      mods: [add("sustain", 2.5, "gift"), add("maxHp", 5, "gift"), cap("dmgCap", 7, "cost"), mul("haste", 0.86, "cost")],
    },
  },
  {
    id: "storm-roofers",
    name: "Storm roofers",
    identity: "They work before the rain and get mean if they are still up there when it starts.",
    pieceIds: ids(66, 67, 68, 69, 70),
    pair: pair("on-the-ladder", "On the ladder", "Hatchet and pitch. A dry fight favors the roof.", 66, 67, [add("guard", 0.04), add("atk", 0.4)]),
    counts: [
      { at: 2, name: "Bundled", note: "Two pieces. Nails in the way of a blade.", mods: [add("guard", 0.03)] },
      { at: 3, name: "Snapped line", note: "Three pieces. You see the next board.", mods: [add("opening", 0.08)] },
    ],
    sidegrade: {
      name: "Under the pitch",
      gives: "You are roofed. Ordinary blows shed.",
      costs: "Pitch and rain do not agree. High water is the bill.",
      mods: [add("guard", 0.14, "gift"), add("atk", 0.6, "gift"), add("soakVuln", 0.55, "cost"), mul("haste", 0.84, "cost")],
    },
  },
  {
    id: "border-pockets",
    name: "Border pockets",
    identity: "The culvert at the county line. The first lie is the weapon. Staying for the second is how they die.",
    pieceIds: ids(71, 72, 73, 74, 75),
    pair: pair("wrong-light", "Wrong light", "Dirk and false lantern. The first step is already a cut.", 71, 72, [add("burst", 0.12), add("opening", 0.1)]),
    counts: [
      { at: 2, name: "Culvert", note: "Two pieces. A little more speed in the dark.", mods: [add("burst", 0.05)] },
      { at: 3, name: "Empty pocket", note: "Three pieces. The arm is meaner. Still not a fourth slot.", mods: [add("atk", 0.5)] },
    ],
    sidegrade: {
      name: "First lie",
      gives: "The opening blow is ugly and fast.",
      costs: "You cannot be guarded after it. The body is thinner, and water finds the lie.",
      mods: [add("burst", 0.55, "gift"), add("opening", 0.4, "gift"), cap("guard", 0.02, "cost"), mul("maxHp", 0.86, "cost"), add("soakVuln", 0.3, "cost")],
    },
  },
  {
    id: "other-voice",
    name: "The other voice",
    identity: "What a body keeps that the county did not issue. Small, listening, and easy to overdraw.",
    pieceIds: ids(76, 77, 78, 79, 80),
    pair: pair("half-heard", "Half heard", "Soft iron and shell. You answer a blow that has not finished arriving.", 76, 77, [add("reflect", 0.8)]),
    counts: [
      { at: 2, name: "Still here", note: "Two pieces. A little more breath.", mods: [add("maxMp", 1)] },
      { at: 3, name: "Named halfway", note: "Three pieces. More comes back.", mods: [add("reflect", 0.6)] },
    ],
    sidegrade: {
      name: "Chorus",
      gives: "Breath returns, and blows echo.",
      costs: "The body that can hear all of it is smaller, and the arm is softer.",
      mods: [add("reflect", 2, "gift"), add("mpRegen", 0.45, "gift"), add("maxMp", 3, "gift"), cap("maxHp", 26, "cost"), mul("atk", 0.82, "cost")],
    },
  },
];

function assertCatalog(): void {
  if (ITEMS.length !== 80) throw new Error(`expected 80 items, saw ${ITEMS.length}`);
  if (FAMILIES.length !== 16) throw new Error(`expected 16 families, saw ${FAMILIES.length}`);
  const seen = new Set<string>();
  for (let n = 1; n <= 80; n += 1) {
    const id = fid(n);
    if (!byNum.has(id)) throw new Error(`missing ${id}`);
    seen.add(id);
  }
  if (seen.size !== 80) throw new Error("duplicate item ids");
  const familyIds = new Set<string>();
  for (const family of FAMILIES) {
    if (familyIds.has(family.id)) throw new Error(`duplicate family ${family.id}`);
    familyIds.add(family.id);
    if (family.pieceIds.length !== FAMILY_SIZE) throw new Error(`${family.id} is not five pieces`);
    const slots = new Set<string>();
    let equipped = 0;
    for (const id of family.pieceIds) {
      const piece = byNum.get(id);
      if (!piece) throw new Error(`${family.id} missing ${id}`);
      if (piece.familyId !== family.id) throw new Error(`${id} family mismatch`);
      if (piece.countsWhen === "equipped") {
        equipped += 1;
        if (slots.has(piece.slot)) throw new Error(`${family.id} repeats slot ${piece.slot}`);
        slots.add(piece.slot);
      }
    }
    if (equipped > EQUIP_SLOTS.length) throw new Error(`${family.id} needs more than three slots`);
    const gift = family.sidegrade.mods.some((mod) => mod.tone === "gift");
    const cost = family.sidegrade.mods.some((mod) => mod.tone === "cost");
    if (!gift || !cost) throw new Error(`${family.id} sidegrade is not a tradeoff`);
    const pairIds = new Set(family.pair.pieceIds);
    if (pairIds.size !== 2 || family.pair.pieceIds.some((id) => !family.pieceIds.includes(id))) {
      throw new Error(`${family.id} pair is not inside the family`);
    }
  }
  for (const piece of ITEMS) {
    if (!familyIds.has(piece.familyId)) throw new Error(`orphan ${piece.id}`);
  }
  void byNum;
}

assertCatalog();

export const ITEM_BY_ID = new Map(ITEMS.map((entry) => [entry.id, entry]));
export const FAMILY_BY_ID = new Map(FAMILIES.map((entry) => [entry.id, entry]));

export function itemById(id: string): ItemDef {
  const found = ITEM_BY_ID.get(id);
  if (!found) throw new Error(`unknown piece ${id}`);
  return found;
}

export function familyById(id: string): FamilyDef {
  const found = FAMILY_BY_ID.get(id);
  if (!found) throw new Error(`unknown family ${id}`);
  return found;
}
