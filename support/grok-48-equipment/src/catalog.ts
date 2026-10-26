import { lootId } from "./ids.ts";
import type { BodySlot, Category, ItemDef, Mastery, Silhouette, ToolId } from "./types.ts";

interface Seed {
  n: number;
  name: string;
  mastery: Mastery;
  category: Category;
  slot: BodySlot | "attachment";
  hands: 0 | 1 | 2;
  silhouette: Silhouette;
  purpose: string;
  channels?: readonly string[];
  bonusKey?: string;
  chargeMax?: number;
  attachesTo?: ToolId;
  claimsOffHand?: boolean;
  freesTwoHand?: boolean;
  suppressedBy?: readonly string[];
  incorporealOk?: boolean;
  spotlight?: boolean;
}

function suppressedFor(seed: Seed): readonly string[] {
  if (seed.suppressedBy) return seed.suppressedBy;
  if (seed.category === "toolAttachment") return [];
  if (seed.category === "utility") {
    if (seed.n === 110 || seed.n === 112 || seed.n === 120) return [];
    return ["incorporeal"];
  }
  if (seed.category === "trinket") {
    return seed.mastery === "hollow" ? [] : ["incorporeal"];
  }
  const tags: string[] = [];
  if (seed.slot === "cloak") tags.push("no-cloak");
  if (seed.slot === "feet") tags.push("no-feet");
  if (seed.slot === "head") tags.push("no-head");
  if (seed.slot === "hands" || seed.category === "mainHand") tags.push("no-hands");
  const body = seed.category === "wearable" || seed.category === "mainHand";
  if (body && !(seed.incorporealOk || (seed.category === "mainHand" && seed.mastery === "hollow"))) {
    tags.push("incorporeal");
  }
  return tags;
}

function item(seed: Seed): ItemDef {
  return {
    id: lootId(seed.n),
    index: seed.n,
    name: seed.name,
    category: seed.category,
    slot: seed.slot,
    hands: seed.hands,
    mastery: seed.mastery,
    silhouette: seed.silhouette,
    mark: String(seed.n).padStart(3, "0"),
    purpose: seed.purpose,
    channels: seed.channels ?? [],
    bonusKey: seed.bonusKey ?? null,
    chargeMax: seed.chargeMax ?? null,
    attachesTo: seed.attachesTo ?? null,
    claimsOffHand: seed.claimsOffHand ?? false,
    freesTwoHand: seed.freesTwoHand ?? false,
    suppressedBy: suppressedFor(seed),
    spotlight: seed.spotlight ?? false,
  };
}

const SEEDS: Seed[] = [
  { n: 1, name: "Faultline Saber", mastery: "quarry", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", channels: ["ash-ink"], spotlight: true, purpose: "A precisely timed counter opens a short fault line. A late counter does not hit harder — it simply fails to open the stone." },
  { n: 2, name: "Creek Draw", mastery: "creek", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "Pulls a foe along an existing creek flow. It does not create water where there is none." },
  { n: 3, name: "Sugar Kiss", mastery: "sugar", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "Sticks a light foe or a loose shot in place for a beat. Quarry masses are too heavy to glue." },
  { n: 4, name: "Soot Knife", mastery: "ash", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "Smothers an adjacent mundane flame and records the direction that flame last leaned. It will not touch a lantern wick." },
  { n: 5, name: "Lantern Bill", mastery: "lantern", category: "mainHand", slot: "mainHand", hands: 2, silhouette: "long", spotlight: true, purpose: "While the lantern tool is lit, its reveal runs as a corridor along the bill. Without that tool the bill is only a long reach." },
  { n: 6, name: "Hollow Needle", mastery: "hollow", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", incorporealOk: true, purpose: "Listens one tile through a thin wall and reports occupancy. It does not damage or open the wall." },
  { n: 7, name: "Grain Hammer", mastery: "quarry", category: "mainHand", slot: "mainHand", hands: 2, silhouette: "blunt", bonusKey: "grain-slide", spotlight: true, purpose: "A blow drives a movable object along its grain instead of tumbling it. It is not the quarry maul tool and will not break a face that tool must break." },
  { n: 8, name: "Ledge Flail", mastery: "quarry", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blunt", purpose: "The head can be thrown to snag a ledge hook within three paces, then reeled back. It is not a climb that skips a mandatory route." },
  { n: 9, name: "Reed Sheath", mastery: "creek", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "Drawing underwater does not splash an alert. The same draw on dry ground is loud." },
  { n: 10, name: "Pane Knife", mastery: "sugar", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "Shatters brittle sugar-glass and lantern panes, and refuses to break a glass charm." },
  { n: 11, name: "Turnveil Knife", mastery: "hollow", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", incorporealOk: true, purpose: "If you turn during the windup, the strike still leaves from the facing you started with." },
  { n: 12, name: "Seam Pick", mastery: "quarry", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "hook", purpose: "Widens a seam the wedge tool has already opened so a crate can pass. A sealed mandatory seam stays sealed." },
  { n: 13, name: "Censer Spike", mastery: "ash", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", chargeMax: 1, purpose: "Planted, it spends one warmth charge to strip the homing from a single projectile. Rest warms it again; it does not break." },
  { n: 14, name: "Tide Fork", mastery: "creek", category: "mainHand", slot: "mainHand", hands: 2, silhouette: "long", spotlight: true, purpose: "Catches flowing debris and can set it down downstream. Hostile bolts glance off the tines." },
  { n: 15, name: "Lure Spoon", mastery: "sugar", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "hook", purpose: "Draws one curious non-hostile to a placed point. Hostiles ignore the scent, and no lock cares about it." },
  { n: 16, name: "Echo Mallet", mastery: "hollow", category: "mainHand", slot: "mainHand", hands: 2, silhouette: "blunt", incorporealOk: true, purpose: "A second tap on the same surface returns what that surface is made of. The first tap only sets the listen." },
  { n: 17, name: "Warmth Glaive", mastery: "lantern", category: "mainHand", slot: "mainHand", hands: 2, silhouette: "long", purpose: "While the lantern tool is present the edge dries one soaked fuse. With no lantern the metal is cold and the fuse stays wet." },
  { n: 18, name: "Fault Compass", mastery: "quarry", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "long", purpose: "Points out the grain a fault line would run. It does not cut the fault; it only names the direction." },
  { n: 19, name: "Snuff Fan", mastery: "ash", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "fan", purpose: "Pushes smoke one tile and can snuff a mundane torch. It will not put out the lantern tool." },
  { n: 20, name: "Pocket Pry", mastery: "quarry", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "hook", purpose: "Improves the angle of a pry tool you already own. Without that tool the bar does not move a brace." },
  { n: 21, name: "Current Needle", mastery: "creek", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "Stitches a temporary thread across a flow that a light step can use. A heavy mass snaps it, and it is not a channel-staff crossing." },
  { n: 22, name: "Preservation Knife", mastery: "sugar", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "blade", purpose: "A cut sample of organic matter stops decaying for the scene. It does not heal the one who cut it." },
  { n: 23, name: "Moth Hook", mastery: "lantern", category: "mainHand", slot: "mainHand", hands: 1, silhouette: "hook", purpose: "Moves one lamp-spark from one existing lamp to another. The spark never becomes room light." },
  { n: 24, name: "Quiet Bell Hammer", mastery: "hollow", category: "mainHand", slot: "mainHand", hands: 2, silhouette: "blunt", incorporealOk: true, purpose: "Striking the clapper delays the bell by one beat. Striking the bell itself still rings, and a keyed ward is never silenced." },

  { n: 25, name: "Catchcoat", mastery: "hollow", category: "wearable", slot: "torso", hands: 0, silhouette: "cloth", channels: ["sugar-glaze"], spotlight: true, purpose: "Stores exactly one projectile you blocked, and releases it only when you mean to. A second block does not overwrite the first." },
  { n: 26, name: "Quarry Belt", mastery: "quarry", category: "wearable", slot: "waist", hands: 0, silhouette: "band", channels: ["quarry-weight"], bonusKey: "grain-slide", spotlight: true, purpose: "Changes how every movable object answers an impact: they slide on the belt's grain instead of tumbling. This is not a harder shove." },
  { n: 27, name: "Creek Waders", mastery: "creek", category: "wearable", slot: "feet", hands: 0, silhouette: "foot", purpose: "Flow does not sweep you, and a step reads the depth. A sluice that requires the channel tool still requires it." },
  { n: 28, name: "Sugar Gloves", mastery: "sugar", category: "wearable", slot: "hands", hands: 0, silhouette: "hand", purpose: "Let you handle hot sugar and a stuck foe without gluing yourself, and pass that stick onto a surface." },
  { n: 29, name: "Ash Hood", mastery: "ash", category: "wearable", slot: "head", hands: 0, silhouette: "head", purpose: "Falling ash does not mark you, and ash marks left by others stay readable." },
  { n: 30, name: "Lantern Collar", mastery: "lantern", category: "wearable", slot: "cloak", hands: 0, silhouette: "band", spotlight: true, purpose: "Clips the lantern tool to the chest so both hands stay free. It emits nothing if the lantern tool is absent." },
  { n: 31, name: "Hollow Cloak", mastery: "hollow", category: "wearable", slot: "cloak", hands: 0, silhouette: "cloth", purpose: "Hides one worn trinket from a pat-down or echo scan. Keys remain visible to any check that asks for them." },
  { n: 32, name: "Fault Boots", mastery: "quarry", category: "wearable", slot: "feet", hands: 0, silhouette: "foot", purpose: "Standing on a fault does not trigger it, and the sole reports which way the fault wants to split." },
  { n: 33, name: "Reed Mantle", mastery: "creek", category: "wearable", slot: "torso", hands: 0, silhouette: "cloth", purpose: "Underwater your outline reads as reeds. On land the same mantle is bright and easier to spot." },
  { n: 34, name: "Glass Sash", mastery: "lantern", category: "wearable", slot: "waist", hands: 0, silhouette: "band", purpose: "Rings a moment before a hit if a glass charm has a safe mark. It never pulls you back to that mark." },
  { n: 35, name: "Cinder Apron", mastery: "ash", category: "wearable", slot: "torso", hands: 0, silhouette: "cloth", purpose: "Pockets one smothered ember that can relight a mundane torch, never the lantern tool's own wick." },
  { n: 36, name: "Current Sash", mastery: "creek", category: "wearable", slot: "waist", hands: 0, silhouette: "band", purpose: "When a stored projectile is released, it leaves along the local flow instead of your facing." },
  { n: 37, name: "Listening Cap", mastery: "hollow", category: "wearable", slot: "head", hands: 0, silhouette: "head", purpose: "With the echo mallet, a returned material includes thickness. Without it, the cap only hears occupancy when pressed to a wall." },
  { n: 38, name: "Prism Veil", mastery: "lantern", category: "wearable", slot: "head", hands: 0, silhouette: "head", purpose: "Splits the lantern tool's reveal into two dimmer lobes so a corner can be checked without walking it. No lantern, no lobes." },
  { n: 39, name: "Sticky Sleeves", mastery: "sugar", category: "wearable", slot: "hands", hands: 0, silhouette: "hand", purpose: "Catch a thrown jar or rope. Bolts still pass; those need a coat or a net." },
  { n: 40, name: "Weight Vest", mastery: "quarry", category: "wearable", slot: "torso", hands: 0, silhouette: "cloth", purpose: "Your shove counts as a heavy mass, and creek current pulls you harder. It does not add a second slide on top of a grain shove." },
  { n: 41, name: "Snuff Scarf", mastery: "ash", category: "wearable", slot: "head", hands: 0, silhouette: "head", purpose: "You can breathe smoke without a cough that gives you away. It does not put fires out." },
  { n: 42, name: "Ledger Boots", mastery: "quarry", category: "wearable", slot: "feet", hands: 0, silhouette: "foot", purpose: "Each safe step scratches a faint trail you can follow back. The trail is not a teleport." },
  { n: 43, name: "Bell Muffler", mastery: "hollow", category: "wearable", slot: "hands", hands: 0, silhouette: "hand", purpose: "Lets you lift the clapper of a bell you are carrying. It does not silence a ward." },
  { n: 44, name: "Tide Skirt", mastery: "creek", category: "wearable", slot: "torso", hands: 0, silhouette: "cloth", purpose: "While you stand in the creek, the hem turns low flowing debris. Bolts ignore it, and it does not store what it turns." },
  { n: 45, name: "Ember Cowl", mastery: "lantern", category: "wearable", slot: "cloak", hands: 0, silhouette: "cloth", purpose: "Aims lantern-tool light down at the floor so the horizon stays dark. Without the lantern tool the cowl is only cloth." },
  { n: 46, name: "Hollow Socks", mastery: "hollow", category: "wearable", slot: "feet", hands: 0, silhouette: "foot", purpose: "Footsteps return no echo to a hollow listener, and your own floor-taps come back dulled." },
  { n: 47, name: "Preservation Wrap", mastery: "sugar", category: "wearable", slot: "torso", hands: 0, silhouette: "cloth", purpose: "A sample tucked in the wrap survives a roll that would otherwise crush it." },
  { n: 48, name: "Seam Harness", mastery: "quarry", category: "wearable", slot: "waist", hands: 0, silhouette: "band", purpose: "Keeps a wedge tool owned and on the hip while both hands are full. The harness never swings the wedge for you." },

  { n: 49, name: "Glass Charm", mastery: "lantern", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", spotlight: true, purpose: "Marks the last position that was actually safe. It will not mark during hitstun, and it never carries you back." },
  { n: 50, name: "Fault Bead", mastery: "quarry", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Vibrates when a fault line would pass through you. It does not cut that line." },
  { n: 51, name: "Creek Pearl", mastery: "creek", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Hums the depth of the water you are about to step into, without changing the flow." },
  { n: 52, name: "Sugar Seal", mastery: "sugar", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Takes one sugar-stick off a glued target and onto the seal, freeing the weapon. Wash it to clear the stick." },
  { n: 53, name: "Ash Lozenge", mastery: "ash", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Crushed, it leaves an ally ash-mark other ash-readers can see. It is not a disguise that skips a key." },
  { n: 54, name: "Wick Thread", mastery: "lantern", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Splices the lantern tool's wick when you have that tool. It does not light a room by itself." },
  { n: 55, name: "Echo Marble", mastery: "hollow", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Rolled into a hollow, it returns the shape of the path it took, including a bend. It does not open the hollow." },
  { n: 56, name: "Keybell", mastery: "hollow", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", spotlight: true, purpose: "Rings when you face a locked door without its key. The ring never turns the lock." },
  { n: 57, name: "Safe Twin", mastery: "lantern", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Shows the distance between where you stand and the glass charm's stored mark, even after the charm is put away." },
  { n: 58, name: "Quarry Knot", mastery: "quarry", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", chargeMax: 1, purpose: "Tied to a movable object, the next impact stops instead of tumbling or sliding. Rest reties it; the cord is not destroyed." },
  { n: 59, name: "Flow Cork", mastery: "creek", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Plugs one small leak. A sluice that requires the channel tool keeps requiring it." },
  { n: 60, name: "Moth Glass", mastery: "lantern", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Carries one relocated spark in the hand at no room radius, so it survives between lamps." },
  { n: 61, name: "Snuff Bead", mastery: "ash", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", chargeMax: 1, purpose: "Crushes to put out mundane flames in the room and leaves any mandatory lantern burning. Rest reforms the bead." },
  { n: 62, name: "Counter Thread", mastery: "quarry", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", chargeMax: 1, purpose: "For one fight, widens only the Faultline Saber's timing window. It does nothing on another weapon, and it does not stack past the wider of the two windows." },
  { n: 63, name: "Patdown Nail", mastery: "hollow", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Pricks when an echo-scan passes over you, so you know you were read." },
  { n: 64, name: "Ledger Nail", mastery: "quarry", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Pins a ledger-boot trail so it does not fade for the rest of the scene." },
  { n: 65, name: "Clapper Pin", mastery: "hollow", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Pins a clapper up so the bell stays quiet until you pull the pin. The bell is not broken." },
  { n: 66, name: "Warmth Stone", mastery: "lantern", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Holds heat after you have stood with the lantern tool, then dries one fuse away from that lantern. It gives no light." },
  { n: 67, name: "Seam Thread", mastery: "quarry", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Marks a seam that was already widened so you can find it after leaving. It does not widen anything." },
  { n: 68, name: "Preservation Bead", mastery: "sugar", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", purpose: "Tags a sample so a rest will not consume it." },
  { n: 69, name: "Weight Charm", mastery: "quarry", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", channels: ["light", "heavy"], purpose: "Reclasses one object's weight as light or heavy. A light thread bridge breaks under the heavy setting." },
  { n: 70, name: "Veil Chip", mastery: "hollow", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", chargeMax: 1, purpose: "Cancels a single hollow-listener ping. Rest returns the charge; the chip is not spent forever." },
  { n: 71, name: "Collar Hook", mastery: "lantern", category: "trinket", slot: "trinket", hands: 0, silhouette: "hook", purpose: "Lets the lantern collar sit on the waist instead of the cloak, so the cloak slot stays free." },
  { n: 72, name: "Return Spool", mastery: "creek", category: "trinket", slot: "trinket", hands: 0, silhouette: "charm", chargeMax: 1, purpose: "If a released coat-shot misses, the spool rewinds it into the coat once. Rest rewinds the spool itself." },

  { n: 73, name: "Net Mouth", mastery: "creek", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "mesh", attachesTo: "tool.creek.net", spotlight: true, purpose: "Changes the creek net so it can hold barbed heads, and so plain bolts and glass fall through." },
  { n: 74, name: "Fine Mesh", mastery: "creek", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "mesh", attachesTo: "tool.creek.net", purpose: "Changes the creek net so it holds glass, motes, sparks and debris, and lets barbs and bolts escape." },
  { n: 75, name: "Wedge Cheek", mastery: "quarry", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.quarry.wedge", spotlight: true, purpose: "Lets the wedge bite a slanted seam, and blocks the mandatory square seam until the cheek is taken off." },
  { n: 76, name: "Wedge Feather", mastery: "quarry", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.quarry.wedge", purpose: "Drives the same wedge in quietly and more slowly, including on a mandatory square seam." },
  { n: 77, name: "Pry Bite", mastery: "quarry", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.quarry.pry", purpose: "Lets the pry tool catch a rounded lip. A brace that still requires the pry does not move without it, and a keyed brace never moves." },
  { n: 78, name: "Pry Wrap", mastery: "quarry", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "band", attachesTo: "tool.quarry.pry", purpose: "Pads the pry tool so a nearby glass pane is not chipped when the brace shifts." },
  { n: 79, name: "Maul Sleeve", mastery: "quarry", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "band", attachesTo: "tool.quarry.maul", purpose: "Sends a legal blow of the maul tool along the grain. An illegal face still does not break." },
  { n: 80, name: "Maul Bell", mastery: "quarry", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "charm", attachesTo: "tool.quarry.maul", purpose: "Rings when the face under the maul tool is not a legal break, so the swing is checked." },
  { n: 81, name: "Channel Lip", mastery: "creek", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.creek.channel", purpose: "Turns flow from the channel tool ninety degrees. The sluice still cannot be set without that tool." },
  { n: 82, name: "Channel Cork", mastery: "creek", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "kit", attachesTo: "tool.creek.channel", purpose: "Pauses the channel tool's flow for one beat. It does not replace the tool on a mandatory sluice." },
  { n: 83, name: "Staff Shoe", mastery: "creek", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "foot", attachesTo: "tool.creek.staff", purpose: "Plants the creek staff in silt so a sounding stays put. Deep water still refuses you without the staff." },
  { n: 84, name: "Staff Bell", mastery: "creek", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "charm", attachesTo: "tool.creek.staff", purpose: "Sounds a warning at the depth where waders stop being enough. The warning is not permission to cross." },
  { n: 85, name: "Brush Comb", mastery: "sugar", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.sugar.brush", purpose: "Lays the sugar brush's glaze as a line instead of a blob, which a thread bridge can use." },
  { n: 86, name: "Brush Cap", mastery: "sugar", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "kit", attachesTo: "tool.sugar.brush", purpose: "Stops glaze from dripping onto keys, so a key is not glued shut." },
  { n: 87, name: "Hook Barb", mastery: "sugar", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.sugar.hook", purpose: "Extends the sugar hook one pace, but only onto something a sugar kiss has already stuck." },
  { n: 88, name: "Hook Felt", mastery: "sugar", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "band", attachesTo: "tool.sugar.hook", purpose: "Lets the sugar hook draw glass panes and charms without cracking them." },
  { n: 89, name: "Jar Baffle", mastery: "sugar", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "kit", attachesTo: "tool.sugar.jar", purpose: "A sample kept in the sugar jar survives being submerged. The jar is still what holds a mandatory sample." },
  { n: 90, name: "Jar Lens", mastery: "sugar", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "charm", attachesTo: "tool.sugar.jar", purpose: "Shows the decay stage of a jarred sample without opening the jar and ruining it." },
  { n: 91, name: "Scoop Skirt", mastery: "ash", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "cloth", attachesTo: "tool.ash.scoop", purpose: "Lets the ash scoop carry a pile without leaving a trail another ash-reader could follow." },
  { n: 92, name: "Mirror Louver", mastery: "lantern", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "board", attachesTo: "tool.lantern.mirror", purpose: "Narrows the lantern mirror's redirected beam into a slit. No mirror, or no lantern tool, and the louver is dark." },
  { n: 93, name: "Censer Cone", mastery: "ash", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "kit", attachesTo: "tool.ash.censer", purpose: "Stacks the censer's smoke into a column that can reach a high vent. The rite still needs the censer." },
  { n: 94, name: "Horn Cup", mastery: "hollow", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "hook", attachesTo: "tool.hollow.horn", purpose: "Narrows the hollow horn to a single crack. A hollow door that requires the horn still requires the horn." },
  { n: 95, name: "Veil Hem", mastery: "hollow", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "cloth", attachesTo: "tool.hollow.veil", purpose: "Keeps a cloak from snagging while the hollow veil is used. The hem does not pass a thin place on its own." },
  { n: 96, name: "Wick Sleeve", mastery: "lantern", category: "toolAttachment", slot: "attachment", hands: 0, silhouette: "band", attachesTo: "tool.lantern.wick", purpose: "Keeps a spare lantern wick dry in the creek. The sleeve does not illuminate anything." },

  { n: 97, name: "Release Hook", mastery: "hollow", category: "utility", slot: "utility", hands: 0, silhouette: "hook", spotlight: true, purpose: "A thumb hook that fires the catchcoat's stored projectile on purpose, so a block cannot release it by accident." },
  { n: 98, name: "Grain Pins", mastery: "quarry", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Record the quarry belt's current grain so the same axis can be pinned again after the belt comes off." },
  { n: 99, name: "Depth Line", mastery: "creek", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Lowers a measured line and returns a depth number. It does not grant a deep crossing that requires the creek staff." },
  { n: 100, name: "Sample Board", mastery: "sugar", category: "utility", slot: "utility", hands: 0, silhouette: "board", purpose: "Pins an ordinary sample for short work, and refuses a sample that the jar tool is required to hold." },
  { n: 101, name: "Mark Chalk", mastery: "hollow", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Writes a chalk mark that a hollow echo returns as chalk, so your marks are distinct from the structure. It opens nothing." },
  { n: 102, name: "Fault Tape", mastery: "quarry", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Tapes a fault so a fault-line strike stops at the tape instead of running its full short length." },
  { n: 103, name: "Spark Cage", mastery: "lantern", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Sets a spark down in a room at no light radius, so it can wait between lamps. The cage is not a lantern." },
  { n: 104, name: "Clapper Case", mastery: "hollow", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Carries a removed clapper so the bell stays silent, and lets you put the clapper back." },
  { n: 105, name: "Dry Bag", mastery: "creek", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "Keeps one fuse, wick or stick of chalk dry inside the bag. The room itself stays wet." },
  { n: 106, name: "Shove Block", mastery: "quarry", category: "utility", slot: "utility", hands: 0, silhouette: "board", purpose: "Lets you shove a crate without a weapon. The crate still tumbles unless a quarry belt is setting the grain." },
  { n: 107, name: "Slit Frame", mastery: "lantern", category: "utility", slot: "utility", hands: 0, silhouette: "board", purpose: "Holds a mirror louver's slit at a fixed angle while you move. Without the louver the frame does nothing." },
  { n: 108, name: "Echo Putty", mastery: "hollow", category: "utility", slot: "utility", hands: 0, silhouette: "kit", purpose: "With the horn, widens a listen by one adjacent crack. Without the horn it only plugs a small whistle, not a door." },
  { n: 109, name: "Study Board", mastery: "quarry", category: "utility", slot: "utility", hands: 0, silhouette: "board", purpose: "Holds a disarmed mechanism off the door so you can read how two of them differ. The door stays locked." },
  { n: 110, name: "Rest Cradle", mastery: "ash", category: "utility", slot: "utility", hands: 0, silhouette: "kit", spotlight: true, purpose: "At a rest, refills spent charges — spike warmth, knot, spool, thread, bead. Nothing here has durability to repair." },
  { n: 111, name: "Two-hand Sling", mastery: "quarry", category: "utility", slot: "utility", hands: 0, silhouette: "band", freesTwoHand: true, spotlight: true, purpose: "Carries a two-handed weapon on the back so the hands are free, and keeps that weapon from striking until it is unslung." },
  { n: 112, name: "Form Buckle", mastery: "hollow", category: "utility", slot: "utility", hands: 0, silhouette: "band", purpose: "When a form cannot wear a piece, the buckle stows it into the pack instead of letting it vanish. You put it back on by hand." },
  { n: 113, name: "Compare Lens", mastery: "lantern", category: "utility", slot: "utility", hands: 0, silhouette: "charm", purpose: "Reads the difference between two nearby mechanisms, such as a square seam against a slanted one. It does not operate either." },
  { n: 114, name: "Catch Filter Card", mastery: "creek", category: "utility", slot: "utility", hands: 0, silhouette: "board", channels: ["bolt", "glass", "barbed"], purpose: "Slotted into a net attachment, puts back one projectile kind that attachment had given up. The net tool is still required." },
  { n: 115, name: "Lantern Stake", mastery: "lantern", category: "utility", slot: "utility", hands: 0, silhouette: "stake", spotlight: true, purpose: "Plants the lantern tool in a room so the light stays when you leave. Removing the lantern body brings the dark back." },
  { n: 116, name: "Ash Tray", mastery: "ash", category: "utility", slot: "utility", hands: 0, silhouette: "board", purpose: "Carries ash the scoop tool has already freed. A mandatory ash pile that has not been scooped will not lift." },
  { n: 117, name: "Sugar Thread Spool", mastery: "sugar", category: "utility", slot: "utility", hands: 0, silhouette: "kit", chargeMax: 1, purpose: "Holds one length of sugar thread for the current needle or a combed glaze line. Rest replaces the length." },
  { n: 118, name: "Safe Flag", mastery: "lantern", category: "utility", slot: "utility", hands: 0, silhouette: "stake", purpose: "Plants the only tile the glass charm will accept as safe during a fight. Outside combat the charm does not need it." },
  { n: 119, name: "Hand Reserve", mastery: "quarry", category: "utility", slot: "utility", hands: 0, silhouette: "band", claimsOffHand: true, spotlight: true, purpose: "Keeps the off-hand reserved for the pry tool, and refuses a two-handed weapon while that reservation stands." },
  { n: 120, name: "Reincarnation Packet", mastery: "hollow", category: "utility", slot: "utility", hands: 0, silhouette: "kit", spotlight: true, purpose: "On death, pieces in the hands stay equipped. Without it they are set down into the pack, never destroyed, and the rest of the kit does not drop." },
];

export const CATALOG: ItemDef[] = SEEDS.map(item);

export const CHARGE_MAX: Record<string, number> = Object.fromEntries(
  CATALOG.filter((d) => d.chargeMax != null).map((d) => [d.id, d.chargeMax as number]),
);

const BY_ID = new Map(CATALOG.map((d) => [d.id, d]));

export function getItem(id: string): ItemDef | undefined {
  return BY_ID.get(id);
}

export function mustItem(id: string): ItemDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`unknown equipment ${id}`);
  return def;
}
