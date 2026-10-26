/**
 * Source of the provision catalog. Run: node support/grok-50-provisions/generate.mjs
 * Writes catalog.ts. Do not hand-edit that file.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const pid = (n) => `loot.provision.${String(n).padStart(3, "0")}`;
const did = (n) => `cook.dish.${String(n).padStart(3, "0")}`;

const ALL = ["sugaring", "spring", "summer", "autumn", "deer", "ice"];

/** @type {any[]} */
const items = [];
function add(n, name, o) {
  if (n !== items.length + 1) throw new Error(`id gap at ${n} ${name}`);
  items.push({ n, name, ...o });
}

const farm = (extra) => ({
  method: "farm",
  mapId: "ferrisburgh",
  place: "Ferrisburgh dairy road",
  x: 8,
  y: 11,
  seasons: ALL,
  baseYield: 4,
  era: "stable",
  eraNote: "The herds change hands. Milk, eggs, and lard are still a farm problem, not a century problem.",
  naturalHistory: "verified",
  rarity: "common",
  kind: "ingredient",
  bin: "cellar",
  spoilsNote: "Cellar stock. It keeps across a death. There is no rot timer.",
  safeRaw: false,
  meat: false,
  fish: false,
  demo: false,
  misreadAs: null,
  bait: null,
  field: [],
  subs: [],
  ...extra,
});

add(1, "Jersey milk", farm({
  place: "Weybridge Jersey barn", mapId: "addison", x: 22, y: 18, stack: 4, trade: 2, safeRaw: true,
  look: "Yellow-white, sweet, still warm if you are standing in the barn.",
  tell: "Farm milk. Boil it if you do not know the cow.",
  availability: "Any season at a dairy that is still milking.",
  reference: "Verified: Addison County dairy farms and Jersey herds. Not a named farm's milk.",
  storage: "A jar in the cellar. Death does not sour it on a clock.",
}));
add(2, "Cultured butter", farm({
  stack: 6, trade: 3, safeRaw: true, baseYield: 3,
  look: "Pale, salted, wrapped in paper.",
  tell: "It smells like cream, not like the quarry.",
  availability: "Churned when the barn is working.",
  reference: "Verified: farm butter is ordinary county food.",
}));
add(3, "Bandaged cheddar", farm({
  place: "New Haven farmstead", mapId: "addison", x: 18, y: 14, stack: 4, trade: 6, safeRaw: true, rarity: "uncommon", baseYield: 2,
  look: "A cloth-bound wheel, amber at the cut.",
  tell: "Sharp, not waxy. This is not a brand name.",
  availability: "Aged wheels when the farm will sell one.",
  reference: "Verified: Addison County farmstead cheddar exists. This is not a creamery's recipe.",
}));
add(4, "Hen egg", farm({
  stack: 8, trade: 1, baseYield: 6,
  look: "Brown, dull, a bit of straw.",
  tell: "A yard egg. Cook it.",
  availability: "While the hens are laying. Winter slows them; the dial still allows a box at the farm.",
  reference: "Verified: yard flocks. Availability through deep winter is simplified.",
}));
add(5, "Storage potato", farm({
  place: "Shoreham cellars", mapId: "addison", x: 12, y: 30, stack: 10, trade: 1, baseYield: 8,
  look: "Dusty, eyes quiet, not green.",
  tell: "If the skin is green, it is not this potato.",
  availability: "Dug in autumn, eaten all year from the cellar.",
  reference: "Verified: storage potatoes. Green skin means solanine; those are not stocked.",
}));
add(6, "Carrot", farm({
  place: "Shoreham gardens", mapId: "addison", x: 13, y: 28, stack: 10, trade: 1, baseYield: 6, safeRaw: true,
  look: "Orange, soil in the cracks.",
  tell: "A garden carrot, not wild carrot. Wild carrot has a hairy stem and a dangerous cousin.",
  availability: "Summer into cellar winter.",
  reference: "Verified crop. Queen Anne's lace is not included; poison hemlock is not this.",
}));
add(7, "Soldier bean", farm({
  place: "Shoreham dry shed", mapId: "addison", x: 14, y: 27, stack: 12, trade: 2, baseYield: 6, rarity: "uncommon",
  look: "White bean with a caramel eye.",
  tell: "The eye is the mark. They still need a long simmer.",
  availability: "Dried, so the season dial does not lock the sack.",
  reference: "Verified: the soldier bean is a Vermont heirloom. No tribal recipe is claimed.",
}));
add(8, "Yellow onion", farm({
  place: "Shoreham gardens", mapId: "addison", x: 15, y: 28, stack: 8, trade: 1, baseYield: 6,
  look: "Papery gold.",
  tell: "A storage onion. It does not sprout on a timer here.",
  availability: "Cured in the fall, held after.",
  reference: "Verified storage crop.",
}));
add(9, "Wheat flour", farm({
  method: "buy", place: "Otter Creek mill", mapId: "middlebury", x: 10, y: 12, stack: 8, trade: 2, baseYield: 4,
  look: "Soft, off-white, in a cloth sack.",
  tell: "Mill flour. It is not cornmeal.",
  availability: "The mill sells it in every season the wheel turns.",
  reference: "Verified: Otter Creek powered mills at Middlebury. The sack is generic.",
}));
add(10, "Cornmeal", farm({
  method: "buy", place: "Otter Creek mill", mapId: "middlebury", x: 11, y: 12, stack: 8, trade: 2, baseYield: 4,
  look: "Coarse, yellow, gritty.",
  tell: "Stone meal. Johnnycake wants this, not the wheat sack.",
  availability: "Milled and stacked. Not a season lock.",
  reference: "Verified: cornmeal is the New England camp staple.",
}));
add(11, "Coarse salt", farm({
  method: "buy", place: "Middlebury mercantile", mapId: "middlebury", x: 16, y: 9, stack: 20, trade: 1, baseYield: 8, safeRaw: true, kind: "field", demo: true,
  look: "Gray-white crystals, big enough to see.",
  tell: "It tastes like salt. Quarry dust does not. Dust is gritty and dead on the tongue.",
  availability: "A barrel good. Always the cheap thing.",
  reference: "Verified commodity. The cure is a tag, not a spoilage system.",
  field: [{ op: "cure", intent: "cure", consumes: true, label: "Cure meat or fish", note: "One salt marks one fish or meat stack cured and worth a little more. Nothing starts rotting." }],
}));
add(12, "Wildflower honey", farm({
  place: "Cornwall bee yard", mapId: "addison", x: 20, y: 22, stack: 6, trade: 5, baseYield: 3, safeRaw: true, rarity: "uncommon", kind: "ingredient",
  look: "Dark gold, slow.",
  tell: "Flower honey, not syrup. It smells like the field, not the sugarhouse.",
  availability: "Pulled after the summer flow, then it just sits.",
  reference: "Verified: county apiaries. Not a medical claim.",
  field: [{ op: "spoon", intent: "spoon", consumes: true, label: "Take a spoon", note: "A small calm. Not a dose.", effect: fx("honey-calm", "Spoon of honey", "calm", 1, 2, 0.5, false) }],
}));
add(13, "Cider vinegar", farm({
  place: "Cornwall orchard press", mapId: "addison", x: 19, y: 24, stack: 4, trade: 2, baseYield: 3,
  look: "Pale brown, sharp.",
  tell: "The mother may cloud it. That is the vinegar, not mold you must manage.",
  availability: "Pressed apples, then the crock. Season does not expire it.",
  reference: "Verified cider vinegar.",
  field: [{ op: "cure", intent: "cure", consumes: true, label: "Pickle a fish or a cut", note: "Same cured tag as salt. One vinegar, one stack. Nothing starts a rot clock." }],
}));
add(14, "Lard", farm({
  stack: 4, trade: 2, baseYield: 3,
  look: "White, soft, in a crock.",
  tell: "Rendered pig. It can stand in for butter in a fry, poorer.",
  availability: "Butcher day, then the crock keeps.",
  reference: "Verified cooking fat.",
  subs: [[2, 0.65]],
}));
add(15, "Baking powder", farm({
  method: "buy", place: "Middlebury mercantile", mapId: "middlebury", x: 17, y: 9, stack: 6, trade: 2, baseYield: 3, rarity: "common",
  look: "A bright tin, fine white powder.",
  tell: "It is not flour and not quarry dust. This tin is printed.",
  availability: "A modern leavening. The year starts at 2026 and only moves forward.",
  eraNote: "Verified from the mid-19th century onward. Fourteen-year jumps do not send you back before the tin existed.",
  reference: "Verified grocery leavening for the years this life visits.",
  field: [{ op: "biscuit", intent: "biscuit", consumes: true, label: "Raise a biscuit", note: "Spends one powder, one flour, and one butter. A small warmth. Skip it and the county does not mind." }],
}));
add(16, "Lamp oil", farm({
  method: "buy", place: "Middlebury mercantile", mapId: "middlebury", x: 18, y: 8, stack: 6, trade: 3, baseYield: 4, kind: "field", bin: "pouch", demo: true,
  look: "Clear, thin, a metal flask.",
  tell: "It smells like a lamp, not like syrup.",
  availability: "Bought. The quarry is dark without a light.",
  reference: "Verified field supply. The light is a courtesy, not a hunger mechanic.",
  spoilsNote: "Flask in the pouch. If you die it falls with the pouch. It does not evaporate by year.",
  field: [
    { op: "light", intent: "light", consumes: true, label: "Fill the lamp", note: "A steady light. One flask, one life, until you fall.", effect: fx("lamp-light", "Lamp light", "light", 2, 1, 1, true) },
    { op: "smoke", intent: "smoke", consumes: true, label: "Smoke a fish or a cut", note: "Uses oil as fuel. Marks one meat or fish cured. Same tag as salt, different work." },
  ],
}));

add(17, "Ostrich fiddlehead", forage({
  n: 17, place: "New Haven riverbank", mapId: "bristol", x: 14, y: 6, seasons: ["spring"], stack: 8, trade: 3, baseYield: 4, demo: true, rarity: "seasonal",
  look: "A tight green coil, a paper-brown scale, a deep groove in the smooth stem.",
  tell: "Ostrich fern. The groove is the mark. Bracken is fuzzy and wants no place on this fire.",
  availability: "A short spring. Miss the coil and the fern is a leaf.",
  reference: "Verified: Matteuccia struthiopteris. Cook it. Raw is refused.",
  extraNode: { id: "node-017b", place: "Lincoln Gap seep", mapId: "addison", x: 28, y: 10, baseYield: 3 },
}));
add(18, "Ramp leaf", forage({
  place: "Bristol hardwoods", mapId: "bristol", x: 12, y: 5, seasons: ["spring"], stack: 8, trade: 4, baseYield: 4, demo: true, rarity: "seasonal", safeRaw: true,
  look: "Two smooth green leaves, a purple stem, onion on the fingers.",
  tell: "Allium tricoccum. Lily-of-the-valley has no onion smell. Trust the smell.",
  availability: "Spring, and only while the leaves are up.",
  reference: "Verified. The leaf comes back sooner than a dug bulb. Do not strip a patch.",
}));
add(19, "Ramp bulb", forage({
  place: "Bristol hardwoods", mapId: "bristol", x: 13, y: 5, seasons: ["spring"], stack: 4, trade: 6, baseYield: 1, rarity: "uncommon", safeRaw: true,
  look: "A small white bulb, red at the shoulder.",
  tell: "The bulb is the plant. Taking it is the slow harm.",
  availability: "Same weeks as the leaf. The ground only gives one.",
  reference: "Verified same species as the leaf. Yield is deliberately small.",
  subs: [[18, 0.9]],
}));
add(20, "Stinging nettle", forage({
  place: "Cornwall damp ditch", mapId: "addison", x: 21, y: 20, seasons: ["spring", "summer"], stack: 8, trade: 1, baseYield: 5,
  look: "Dark leaves, hairs that burn the wrist.",
  tell: "Urtica. The sting dies in the pot. Mint does not sting.",
  availability: "Spring flush and a second cut if the ditch is wet.",
  reference: "Verified edible when cooked. The sting is real.",
}));
add(21, "Dandelion crown", forage({
  place: "Middlebury Green edge", mapId: "middlebury", x: 18, y: 7, seasons: ["spring", "summer"], stack: 8, trade: 1, baseYield: 6, safeRaw: true,
  look: "A pale heart of jagged leaves at the root.",
  tell: "The bitter one everyone already knows. Not a rare herb.",
  availability: "Yards and edges, spring into summer.",
  reference: "Verified common green.",
}));
add(22, "Spruce tip", forage({
  place: "Goshen spruce", mapId: "addison", x: 30, y: 16, seasons: ["spring"], stack: 8, trade: 2, baseYield: 4, safeRaw: true, rarity: "seasonal",
  look: "Soft bright tips, needles still pale.",
  tell: "Picea, short and sharp when mature, soft only at the tip. Not the parsley-looking poison hemlock. Hemlock the tree is also not this.",
  availability: "The week the tips are soft.",
  reference: "Verified forage. Poison hemlock (Conium) is a different plant and is not stocked.",
}));
add(23, "Maple sap", forage({
  place: "Ripton sugar bush", mapId: "addison", x: 32, y: 12, seasons: ["sugaring"], stack: 8, trade: 2, baseYield: 6, demo: true, safeRaw: true, rarity: "seasonal",
  look: "Clear, faintly sweet, a bucket.",
  tell: "Sap is not syrup. It is almost water.",
  availability: "Sugaring weather. Freeze at night, thaw by day. The dial calls that week sugaring.",
  reference: "Verified Acer saccharum sap. The season is compressed onto the dial.",
}));
add(24, "Golden delicate syrup", forage({
  method: "buy", place: "Ripton sugarhouse", mapId: "addison", x: 33, y: 12, seasons: ["sugaring", "spring"], stack: 6, trade: 6, baseYield: 3, demo: true, rarity: "seasonal", safeRaw: true, bin: "cellar",
  look: "Pale amber, pours clean.",
  tell: "Vermont golden / delicate. The old Grade A name is retired.",
  availability: "Early boil. The sugarhouse keeps some after the week ends.",
  reference: "Verified: Vermont maple grades since 2015 — Golden, Amber, Dark, Very Dark.",
}));
add(25, "Dark robust syrup", forage({
  method: "buy", place: "Ripton sugarhouse", mapId: "addison", x: 33, y: 13, seasons: ["sugaring", "spring"], stack: 6, trade: 6, baseYield: 3, rarity: "seasonal", safeRaw: true, bin: "cellar",
  look: "Dark amber, heavier nose.",
  tell: "Dark / robust. It may stand in for golden. Very dark may stand in for this.",
  availability: "Later in the boil.",
  reference: "Verified grade. Substitution runs darker toward lighter, never in a loop back.",
  subs: [[24, 0.9]],
}));
add(26, "Very dark syrup", forage({
  method: "buy", place: "Ripton sugarhouse", mapId: "addison", x: 34, y: 13, seasons: ["sugaring"], stack: 4, trade: 5, baseYield: 2, rarity: "uncommon", safeRaw: true, bin: "cellar",
  look: "Almost coffee. Strong.",
  tell: "Very dark / strong. End of the season.",
  availability: "Last boils.",
  reference: "Verified grade.",
  subs: [[25, 0.85]],
}));
add(27, "Clean sugar snow", forage({
  place: "Ripton yard", mapId: "addison", x: 32, y: 14, seasons: ["sugaring", "ice"], stack: 6, trade: 0, baseYield: 4, demo: true, rarity: "seasonal", kind: "ingredient", bin: "pouch",
  look: "New snow, no tracks, no road salt.",
  tell: "If it is gray it is the road. Do not eat the road.",
  availability: "Sugaring and deep ice, when the snow is fresh.",
  reference: "Verified: sugar-on-snow wants clean snow. Trade is zero; it is weather.",
  spoilsNote: "It is weather in a pail. The pail does not melt on a clock in this camp.",
}));
add(28, "Birch sap", forage({
  place: "Goshen birch", mapId: "addison", x: 29, y: 15, seasons: ["sugaring", "spring"], stack: 6, trade: 2, baseYield: 3, safeRaw: true, rarity: "uncommon",
  look: "Clear, thinner than maple, a wintergreen whisper.",
  tell: "Betula. It can stand in for maple sap and the pot will be weaker.",
  availability: "Same thaw window, less often tapped.",
  reference: "Verified birch sap. Weaker sugar than maple is the point of the substitution.",
  subs: [[23, 0.45]],
}));
add(29, "Chaga", forage({
  place: "Goshen birch scar", mapId: "addison", x: 29, y: 17, seasons: ALL, stack: 3, trade: 7, baseYield: 2, demo: true, rarity: "uncommon", era: "scarcens",
  look: "A black cinder on a birch, orange-brown inside.",
  tell: "Inonotus obliquus. The inside is the mark. A burl is smooth wood.",
  availability: "Any season you find the scar. Later lives find fewer.",
  eraNote: "Verified fungus on birch. The dwindling after each fourteen years is fictionalized pressure, not a measured forecast.",
  reference: "Verified organism. The tea is traditional. It is not medicine in this camp.",
  field: [{ op: "steep", intent: "steep", consumes: true, label: "Steep a tea", note: "A camp tea. Calm, not a cure.", effect: fx("chaga-calm", "Chaga tea", "calm", 1, 2, 0.5, false) }],
}));
add(30, "Cattail shoot", forage({
  place: "Cornwall marsh", mapId: "addison", x: 22, y: 21, seasons: ["spring"], stack: 6, trade: 1, baseYield: 4, safeRaw: true, rarity: "seasonal",
  look: "A pale core pulled from a green blade.",
  tell: "Typha. Iris is flat and will hurt you. Cattail leaves are spongy and rounder at the base.",
  availability: "Spring, standing water.",
  reference: "Verified. Iris is the lookalike and is not stocked as food.",
}));
add(31, "Marsh marigold", forage({
  place: "Cornwall marsh", mapId: "addison", x: 23, y: 21, seasons: ["spring"], stack: 4, trade: 1, baseYield: 2, rarity: "seasonal",
  look: "Yellow buttercup flowers, succulent leaves, wet feet.",
  tell: "Caltha palustris. Cook it hard. Raw is refused.",
  availability: "Spring seeps.",
  reference: "Verified with a caution: raw plants are toxic. The pot is the point.",
  subs: [[20, 0.5]],
}));
add(32, "Knotweed shoot", forage({
  place: "US-7 verge", mapId: "addison", x: 24, y: 19, seasons: ["spring"], stack: 8, trade: 1, baseYield: 3, rarity: "seasonal", era: "spreads",
  look: "Speckled cane, hollow, a young shoot like awkward asparagus.",
  tell: "Japanese knotweed. Invasive. A young shoot only. Do not plant it. Do not move the root.",
  availability: "Spring. Each generation the verge has more.",
  eraNote: "Verified invasive (Reynoutria japonica). Spread across fourteen-year jumps matches how it actually behaves.",
  reference: "Verified edible young shoot. Moving it would be a mistake the game will not reward.",
  subs: [[43, 0.45]],
}));

add(33, "Lamb's quarter", forage({
  place: "Shoreham garden edge", mapId: "addison", x: 12, y: 29, seasons: ["summer"], stack: 8, trade: 1, baseYield: 5, safeRaw: true,
  look: "Dusty gray-green, diamond leaves.",
  tell: "Chenopodium. The meal on the leaf is the mark.",
  availability: "Summer gardens and turned soil.",
  reference: "Verified common green.",
}));
add(34, "Purslane", forage({
  place: "Middlebury path crack", mapId: "middlebury", x: 19, y: 10, seasons: ["summer"], stack: 8, trade: 1, baseYield: 4, safeRaw: true,
  look: "Succulent red stems, paddle leaves.",
  tell: "Portulaca. Spurge bleeds white latex. This does not.",
  availability: "Hot weeks in packed dirt.",
  reference: "Verified. Prostrate spurge is the lookalike and is not stocked.",
}));
add(35, "Wood sorrel", forage({
  place: "Ripton path", mapId: "addison", x: 31, y: 13, seasons: ["spring", "summer"], stack: 6, trade: 1, baseYield: 3, safeRaw: true,
  look: "Clover-like, sour, heart-shaped leaflets.",
  tell: "Oxalis. A nibble is sour. A bowl would be too much oxalic acid, so the stack stays modest.",
  availability: "Shady paths.",
  reference: "Verified. The small stack is the caution.",
}));
add(36, "Wild strawberry", forage({
  place: "Snake Mountain meadow", mapId: "addison", x: 16, y: 26, seasons: ["summer"], stack: 12, trade: 3, baseYield: 5, demo: true, safeRaw: true, rarity: "seasonal",
  look: "Tiny, red, seeds on the outside, perfume.",
  tell: "Fragaria virginiana. If it smells like nothing, it is a mock strawberry.",
  availability: "Early summer meadows.",
  reference: "Verified. Potentilla indica (mock) is the scentless lookalike.",
}));
add(37, "Lowbush blueberry", forage({
  place: "Moosalamoo ledge", mapId: "salisbury", x: 20, y: 8, seasons: ["summer"], stack: 12, trade: 3, baseYield: 6, demo: true, safeRaw: true, rarity: "seasonal",
  look: "Dusty blue, a crown at the blossom end.",
  tell: "Lowbush on the ledge. Not the buckthorn berry.",
  availability: "High summer on dry ground.",
  reference: "Verified Vaccinium angustifolium on Green Mountain ledges.",
}));
add(38, "Black raspberry", forage({
  place: "Ferrisburgh hedgerow", mapId: "ferrisburgh", x: 9, y: 8, seasons: ["summer"], stack: 12, trade: 2, baseYield: 5, safeRaw: true, rarity: "seasonal",
  look: "Hollow cap, purple-black, arching cane with a white bloom.",
  tell: "Rubus occidentalis. The hollow center is the mark. It may stand in for blueberry.",
  availability: "July hedgerows.",
  reference: "Verified.",
  subs: [[37, 0.8]],
}));
add(39, "Blackberry", forage({
  place: "Ferrisburgh hedgerow", mapId: "ferrisburgh", x: 10, y: 8, seasons: ["summer"], stack: 12, trade: 2, baseYield: 5, safeRaw: true, rarity: "seasonal",
  look: "Glossy, the core stays in the fruit.",
  tell: "The core stays. Black raspberry leaves a hollow. Blackberry can stand in for blueberry, not the other way.",
  availability: "Late summer canes.",
  reference: "Verified. One-way substitution avoids a loop.",
  subs: [[37, 0.75]],
}));
add(40, "Elderberry cluster", forage({
  place: "Dead Creek thicket", mapId: "ferrisburgh", x: 6, y: 14, seasons: ["autumn"], stack: 8, trade: 3, baseYield: 4, demo: true, rarity: "seasonal",
  look: "Flat purple-black clusters on red stems.",
  tell: "Sambucus canadensis. Cook it. Raw is refused. Red-berried elder is not this.",
  availability: "Early autumn thickets.",
  reference: "Verified. Raw fruit and other Sambucus species are the hazard. Only the cooked plate is allowed.",
}));
add(41, "Chokecherry", forage({
  place: "Addison fencerow", mapId: "addison", x: 15, y: 25, seasons: ["autumn"], stack: 8, trade: 2, baseYield: 4, rarity: "seasonal",
  look: "Dark fruit in a long raceme, astringent.",
  tell: "Prunus virginiana. The pit is the problem. Cook the pulp. Do not nibble.",
  availability: "Late summer into autumn. Dialed as autumn.",
  reference: "Verified. Seeds and wilted leaves carry cyanogenic glycosides. The jelly uses cooked pulp.",
}));
add(42, "Staghorn sumac bob", forage({
  place: "Bristol ledge", mapId: "bristol", x: 16, y: 4, seasons: ["summer", "autumn"], stack: 8, trade: 2, baseYield: 4, demo: true, safeRaw: false, rarity: "seasonal",
  look: "A red fuzzy cone, upright.",
  tell: "Rhus typhina. Red and fuzzy. Poison sumac has white drooping berries and likes a swamp. Not this.",
  availability: "The bob holds on the cane into autumn.",
  reference: "Verified identification against Toxicodendron vernix, which is not stocked.",
  field: [{ op: "steep", intent: "steep", consumes: true, label: "Steep a cooler", note: "Cold water, not a boil. A tart drink.", effect: fx("sumac-focus", "Sumac cooler", "focus", 1, 2, 0.5, false) }],
}));
add(43, "Wild apple", forage({
  place: "Cornwall wilding", mapId: "addison", x: 18, y: 23, seasons: ["autumn"], stack: 8, trade: 2, baseYield: 5, safeRaw: true, rarity: "seasonal",
  look: "Small, lopsided, a real blossom end.",
  tell: "A feral apple. Crab is smaller and meaner and may stand in.",
  availability: "Autumn wildings along old walls.",
  reference: "Verified feral Malus.",
}));
add(44, "Crabapple", forage({
  place: "Cornwall wilding", mapId: "addison", x: 17, y: 23, seasons: ["autumn"], stack: 8, trade: 1, baseYield: 4, safeRaw: true, rarity: "seasonal",
  look: "Marble-sized, sour enough to pull the mouth.",
  tell: "It can stand in for a wild apple. The pie will be sharper.",
  availability: "Autumn.",
  reference: "Verified.",
  subs: [[43, 0.8]],
}));
add(45, "Butternut", forage({
  place: "Snake Mountain hardwood", mapId: "addison", x: 14, y: 24, seasons: ["autumn"], stack: 4, trade: 14, baseYield: 2, demo: true, rarity: "rare", era: "scarcens", bin: "cellar",
  look: "Oblong, sticky green husk, a deep carved shell.",
  tell: "Juglans cinerea. Not the squash with the same first name. Not a planted black walnut.",
  availability: "Mast years under a living tree. The canker takes trees. Later lives may find none.",
  eraNote: "Verified: butternut canker (Ophiognomonia clavigignenti-juglandacearum) has collapsed the species. Yield falling off after each death is the era rule.",
  reference: "Verified native tree, now uncommon. The nut unlocks a milk, not a sharper knife.",
}));
add(46, "Red oak acorn", forage({
  place: "Ripton oak", mapId: "addison", x: 31, y: 11, seasons: ["autumn"], stack: 10, trade: 1, baseYield: 6,
  look: "Acorn with a shallow cap, bitter.",
  tell: "Red oak is the bitter one. The camp cake assumes you leached them. The game does not make you run the rinse.",
  availability: "Autumn mast.",
  reference: "Verified. Tannins are real. The leach is compressed, and the record says so.",
}));
add(47, "Beechnut", forage({
  place: "Goshen beech", mapId: "addison", x: 30, y: 14, seasons: ["autumn"], stack: 8, trade: 4, baseYield: 3, rarity: "uncommon", safeRaw: true,
  look: "A small three-sided nut in a prickly husk.",
  tell: "Fagus grandifolia. Sweet. It may stand in for acorn in the cake, and the cake gets better.",
  availability: "Mast years. Not every autumn is one; the node is a good year.",
  reference: "Verified. Beech bark disease is real; this node does not model it beyond being uncommon.",
  subs: [[46, 0.85]],
}));
add(48, "Milkweed bud", forage({
  place: "Dead Creek meadow", mapId: "ferrisburgh", x: 7, y: 13, seasons: ["summer"], stack: 6, trade: 2, baseYield: 3, rarity: "seasonal",
  look: "Tight green broccoli-like bud, thick white sap if you break the plant.",
  tell: "Asclepias syriaca. Cook thoroughly. The sap is the mark. Dogbane is branched and meaner.",
  availability: "Early summer, before the flower opens.",
  reference: "Verified cooked. Raw is refused. Leave most of the patch for the insects.",
  subs: [[20, 0.55]],
}));
add(49, "Burdock root", forage({
  place: "Vergennes waste ground", mapId: "vergennes", x: 8, y: 10, seasons: ["autumn", "spring"], stack: 4, trade: 2, baseYield: 3,
  look: "A long brown root, a thistle of burrs above if you dig in autumn.",
  tell: "Arctium. First-year root is the one. The burrs tell you the patch.",
  availability: "Spring or autumn dig.",
  reference: "Verified root vegetable of roadsides.",
}));
add(50, "Daylily bud", forage({
  place: "Ferrisburgh dooryard", mapId: "ferrisburgh", x: 11, y: 9, seasons: ["summer"], stack: 6, trade: 1, baseYield: 3, rarity: "seasonal",
  look: "A smooth green bud on a leafless scape, orange daylily nearby.",
  tell: "Hemerocallis fulva, the escaped tawny daylily. Not a true lily. True lilies are not food.",
  availability: "Summer buds.",
  reference: "Verified as an introduced plant people cook. True Lilium is not stocked.",
  subs: [[18, 0.6]],
}));
add(51, "Garlic mustard", forage({
  place: "US-7 woods edge", mapId: "addison", x: 25, y: 18, seasons: ["spring"], stack: 8, trade: 1, baseYield: 4, era: "spreads", safeRaw: true,
  look: "Heart leaves, then a white four-petal cross, garlic on the crush.",
  tell: "Alliaria petiolata. Invasive. Eat the invader, do not sow it.",
  availability: "Spring. More of it after each generation.",
  eraNote: "Verified invasive. Spread on the fourteen-year step is fair.",
  reference: "Verified edible invasive. Pulling it is the real civic act; the pot is optional.",
}));
add(52, "River grape", forage({
  place: "Otter Creek bank", mapId: "middlebury", x: 8, y: 14, seasons: ["autumn"], stack: 8, trade: 2, baseYield: 4, safeRaw: true, rarity: "seasonal",
  look: "Small blue grapes, a sour skin, a forked tendril.",
  tell: "Vitis riparia. Moonseed is a lookalike without the forked tendril and is poisonous. Forked tendril or it is not this.",
  availability: "Autumn along the creek.",
  reference: "Verified. Menispermum (moonseed) is the hazard and is not stocked.",
}));
add(53, "Serviceberry", forage({
  place: "Bristol edge", mapId: "bristol", x: 15, y: 7, seasons: ["summer"], stack: 10, trade: 2, baseYield: 4, safeRaw: true, rarity: "seasonal",
  look: "Red to purple, a little crown, almond in the seed if you bite wrong.",
  tell: "Amelanchier. Spit the seed. The flesh is the food.",
  availability: "June, dialed as summer. Locals say shadblow.",
  reference: "Verified. The June timing is compressed onto the summer notch.",
  subs: [[37, 0.7]],
}));
add(54, "Butternut squash", farm({
  place: "Shoreham field", mapId: "addison", x: 13, y: 31, stack: 4, trade: 2, baseYield: 3, seasons: ["autumn"], rarity: "seasonal", bin: "cellar",
  look: "A tan squash, bottle-necked, smooth.",
  tell: "The vegetable. It is not the tree nut. Do not substitute one for the other.",
  availability: "Cured in autumn, then the cellar.",
  reference: "Verified crop. Name collision with the tree is the identification lesson.",
  subs: [[5, 0.7]],
}));
add(55, "Flint corn", farm({
  place: "Shoreham field", mapId: "addison", x: 11, y: 31, stack: 10, trade: 2, baseYield: 5, seasons: ["autumn"], bin: "cellar",
  look: "Hard kernels, deep color, a short ear.",
  tell: "Flint, not sweet corn. It wants a grind or a long pot.",
  availability: "Dried, so it waits.",
  reference: "Verified historic crop in Vermont. This is not a specific Indigenous recipe.",
  bait: { rigs: ["still"], species: [pid(71), pid(75), pid(80)] },
}));

// fungi 56-67
add(56, "Golden chanterelle", fungi({
  place: "Moosalamoo moss", mapId: "salisbury", x: 18, y: 6, seasons: ["summer", "autumn"], stack: 4, trade: 8, baseYield: 3, demo: true, rarity: "uncommon",
  look: "Gold, ridges not gills, a forked vein running down the stem, fruit from the soil.",
  tell: "Ridges, not true gills. Apricot smell. The jack-o'-lantern grows on wood, has true gills, and glows faintly in the dark. That one is stocked only as a warning.",
  availability: "After summer rain into autumn.",
  reference: "Verified Cantharellus. The jack-o'-lantern (Omphalotus) is the hazard.",
}));
add(57, "Black trumpet", fungi({
  place: "Ripton moss", mapId: "addison", x: 32, y: 11, seasons: ["summer", "autumn"], stack: 4, trade: 9, baseYield: 2, rarity: "uncommon",
  look: "A black funnel, fragrant, easy to miss in leaf litter.",
  tell: "Craterellus. Hollow, thin flesh, not a rotten chanterelle.",
  availability: "Same wet weeks, harder to see.",
  reference: "Verified Craterellus fallax in the east.",
}));
add(58, "Yellow morel", fungi({
  place: "Ripton old orchard", mapId: "addison", x: 33, y: 10, seasons: ["spring"], stack: 2, trade: 12, baseYield: 2, demo: true, rarity: "rare",
  look: "A honeycombed cap, hollow all the way down when you split it.",
  tell: "Morchella. Hollow. A brain-like false morel is not hollow and is not stocked. The ghost morel is a fiction and will not cook as this.",
  availability: "Spring, often near old apples and dying elms.",
  reference: "Verified. Must be cooked. False morels (Gyromitra) are not stocked.",
}));
add(59, "Hen of the woods", fungi({
  place: "Ripton oak base", mapId: "addison", x: 31, y: 10, seasons: ["autumn"], stack: 2, trade: 8, baseYield: 1, rarity: "uncommon",
  look: "A bouquet of gray-brown fronds at the foot of an oak.",
  tell: "Grifola frondosa. At the base, not up the trunk. Chicken of the woods is orange and shelfed.",
  availability: "Autumn at the same oaks, if they are still standing.",
  reference: "Verified.",
}));
add(60, "Chicken of the woods", fungi({
  place: "Weybridge hardwood stub", mapId: "addison", x: 23, y: 16, seasons: ["summer", "autumn"], stack: 3, trade: 4, baseYield: 2, rarity: "uncommon",
  look: "Orange shelves, yellow pores, on hardwood.",
  tell: "Laetiporus on hardwood. Some stomachs refuse it. Cook it. Conifer shelves are not taken.",
  availability: "Summer and autumn on dead hardwood.",
  reference: "Verified with a caution. Softwood Laetiporus is avoided and not stocked.",
  subs: [[61, 0.65]],
}));
add(61, "Oyster mushroom", fungi({
  place: "Cornwall dead poplar", mapId: "addison", x: 20, y: 22, seasons: ["spring", "autumn"], stack: 4, trade: 3, baseYield: 3,
  look: "Gray cap, white gills running down a short stem, on wood.",
  tell: "Pleurotus. On wood, anise or just mushroom. Angel wings on conifers are not taken.",
  availability: "Cool wet weeks.",
  reference: "Verified. Pleurocybella (angel wing) is not stocked.",
}));
add(62, "Lobster mushroom", fungi({
  place: "Salisbury hemlock edge", mapId: "salisbury", x: 16, y: 9, seasons: ["summer", "autumn"], stack: 2, trade: 10, baseYield: 1, rarity: "rare",
  look: "A deformed mushroom crusted orange-red, firm, seafood smell.",
  tell: "Hypomyces lactifluorum parasitizing a white russula or lactarius. The color is the crust, not a dye.",
  availability: "Uncommon. A good week, not a promise.",
  reference: "Verified parasite. Identification still matters underneath the crust.",
  subs: [[56, 0.95]],
}));
add(63, "Bear's head", fungi({
  place: "Goshen beech scar", mapId: "addison", x: 30, y: 15, seasons: ["autumn"], stack: 2, trade: 11, baseYield: 1, rarity: "rare",
  look: "White icicles of teeth on a branch.",
  tell: "Hericium. Teeth, not gills. Cook it.",
  availability: "Autumn on hardwood.",
  reference: "Verified Hericium americanum group.",
  subs: [[61, 0.9]],
}));
add(64, "Giant puffball", fungi({
  place: "Addison pasture", mapId: "addison", x: 16, y: 27, seasons: ["summer", "autumn"], stack: 1, trade: 3, baseYield: 1, rarity: "uncommon",
  look: "A white soccer ball in the grass.",
  tell: "Only if the inside is pure white cheese. Any gills or a stain and it is not food. The node only spawns the white ones.",
  availability: "Late summer pastures.",
  reference: "Verified Calvatia gigantea rule: pure white interior or leave it.",
  subs: [[61, 0.7]],
}));
add(65, "King bolete", fungi({
  place: "Moosalamoo spruce edge", mapId: "salisbury", x: 19, y: 5, seasons: ["summer", "autumn"], stack: 2, trade: 12, baseYield: 1, rarity: "rare",
  look: "Brown cap, white pores, a clubbed stem, no red.",
  tell: "Boletus edulis group. Blue stain or red pores and it is not this. Those are not stocked.",
  availability: "A careful find. Not a basket promise.",
  reference: "Verified group, with the bitter and blue-staining boletes excluded from loot.",
  subs: [[56, 0.95]],
}));
add(66, "Shaggy mane", fungi({
  place: "Vergennes roadside", mapId: "vergennes", x: 9, y: 11, seasons: ["autumn"], stack: 3, trade: 2, baseYield: 2,
  look: "A white cylinder, shaggy, gills that melt to ink.",
  tell: "Coprinus comatus. The alcohol-ink cap is a different, grayer mushroom and is not stocked.",
  availability: "Autumn disturbed ground.",
  reference: "Verified. Coprinopsis atramentaria is the alcohol interaction and is not this item.",
  subs: [[61, 0.7]],
}));
add(67, "Jack-o'-lantern", fungi({
  kind: "hazard", place: "Weybridge stump", mapId: "addison", x: 24, y: 16, seasons: ["summer", "autumn"], stack: 2, trade: 0, baseYield: 2, rarity: "uncommon",
  look: "Bright orange, true gills, a cluster on wood.",
  tell: "Omphalotus illudens. Not a chanterelle. Gills, wood, and a faint green glow in the dark. Studying it teaches the ridges.",
  availability: "The woods will hand you this if you grab every orange thing.",
  reference: "Verified toxic. It cannot be cooked, nibbled, or substituted for a chanterelle.",
  misreadAs: 56,
  field: [{ op: "study", intent: "study", consumes: false, label: "Study the gills", note: "Learns the difference. Spends nothing. The mushroom stays a warning in the pouch." }],
}));

// fish 68-83
const fishSeasons = {
  trout: ["spring", "summer", "autumn"],
  perch: ["summer", "autumn", "ice"],
  cold: ["spring", "autumn", "ice"],
  smelt: ["sugaring", "ice"],
  warm: ["summer", "autumn"],
};
function fish(n, name, o) {
  add(n, name, {
    kind: "ingredient", rarity: "seasonal", method: "fish", bin: "creel", stack: 4, trade: 5,
    baseYield: 2, era: "stable", eraNote: "The water is still the water after fourteen years, unless a record says otherwise.", naturalHistory: "verified", safeRaw: false, meat: false, fish: true,
    demo: false, misreadAs: null, bait: null, field: [], subs: [], spoilsNote: "The creel holds them. They do not rot on a clock. Salt or smoke if you want the cured tag.",
    ...o,
  });
}
fish(68, "Brook trout", {
  place: "New Haven River", mapId: "bristol", x: 14, y: 8, seasons: fishSeasons.trout, demo: true, trade: 6,
  look: "Dark back, red spots in blue halos, pale belly.",
  tell: "Salvelinus fontinalis. The halos are the mark. Native.",
  availability: "Cold water. Spring through autumn on the dial.",
  reference: "Verified native char. Often called a trout.",
  eraNote: "Stable in the headwaters. A fourteen-year jump does not invent a fish kill.",
});
fish(69, "Brown trout", {
  place: "Otter Creek", mapId: "middlebury", x: 7, y: 13, seasons: fishSeasons.trout, trade: 5,
  look: "Butter belly, black and red spots, no blue halo.",
  tell: "Salmo trutta. Introduced. It may stand in for brook in the butter pan.",
  availability: "Otter Creek and the slower cold water.",
  reference: "Verified introduced species, well established.",
  subs: [[68, 0.85]],
});
fish(70, "Rainbow trout", {
  place: "New Haven River", mapId: "bristol", x: 15, y: 8, seasons: fishSeasons.trout,
  look: "A pink stripe, black spots on the tail.",
  tell: "Oncorhynchus mykiss. Introduced. It may stand in for brook, a step poorer than brown.",
  availability: "Stocked and wild-reproducing water. The node is the river, not a hatchery truck.",
  reference: "Verified introduced trout.",
  subs: [[68, 0.8]],
});
fish(71, "Yellow perch", {
  place: "Lake Dunmore", mapId: "salisbury", x: 14, y: 12, seasons: fishSeasons.perch, demo: true, trade: 3,
  look: "Gold bars, orange fins.",
  tell: "Perca flavescens. The bars are the mark.",
  availability: "Dunmore and the lake. Ice is a fair notch.",
  reference: "Verified.",
});
fish(72, "Walleye", {
  place: "Champlain, Panton shore", mapId: "addison", x: 6, y: 24, seasons: fishSeasons.cold, trade: 7, rarity: "uncommon",
  look: "Olive, a white tip on the lower tail, glassy eye.",
  tell: "Sander vitreus. The white tail tip helps at the cleaning table.",
  availability: "Champlain. Spring, autumn, ice.",
  reference: "Verified Lake Champlain population.",
});
fish(73, "Northern pike", {
  place: "Champlain shallows", mapId: "addison", x: 5, y: 23, seasons: ["spring", "summer", "autumn"], trade: 6,
  look: "Long duck-bill, light bean spots on a dark side.",
  tell: "Esox lucius. Teeth. Not a pickerel from a postcard.",
  availability: "Weedy Champlain edges.",
  reference: "Verified.",
});
fish(74, "Smallmouth bass", {
  place: "Otter Creek rock", mapId: "middlebury", x: 8, y: 15, seasons: fishSeasons.warm, trade: 4,
  look: "Bronze, a jaw that does not pass the eye.",
  tell: "Micropterus dolomieu. Jaw ends at the eye. Largemouth passes it.",
  availability: "Summer rock and cooler autumn.",
  reference: "Verified.",
  subs: [[71, 0.7]],
});
fish(75, "Pumpkinseed", {
  place: "Lake Dunmore cove", mapId: "salisbury", x: 15, y: 13, seasons: fishSeasons.warm, trade: 2,
  look: "A round sunfish, red ear spot, wavy blue cheek.",
  tell: "Lepomis gibbosus. The ear spot is the mark.",
  availability: "Warm coves.",
  reference: "Verified.",
  subs: [[71, 0.75]],
});
fish(76, "Lake trout", {
  place: "Champlain deep", mapId: "addison", x: 4, y: 22, seasons: ["spring", "autumn", "ice"], trade: 8, rarity: "uncommon",
  look: "Gray, a forked tail, light spots, a deep-water fish.",
  tell: "Salvelinus namaycush. Not a brook trout. The tail is deeply forked.",
  availability: "The lake, not the creek. Ice and the cold notches.",
  reference: "Verified Lake Champlain lake trout.",
});
fish(77, "Landlocked salmon", {
  place: "Champlain shore", mapId: "addison", x: 5, y: 21, seasons: ["spring", "autumn"], trade: 9, rarity: "rare", baseYield: 1,
  look: "Silver, black spots on the gill cover, a bit of a wrist before the tail.",
  tell: "Atlantic salmon from the Champlain restoration. A shore catch is a kindness the lake does not owe you.",
  availability: "Rare on this shore. The node is a maybe.",
  eraNote: "Verified: Lake Champlain Atlantic salmon restoration. The bank-catch rate is fictionalized.",
  reference: "Species program is real. Finding one on a worm from Panton is the fiction in the yield.",
});
fish(78, "Rainbow smelt", {
  place: "Champlain ice", mapId: "addison", x: 6, y: 22, seasons: fishSeasons.smelt, demo: true, trade: 3, stack: 8, baseYield: 4,
  look: "A finger of silver, cucumber smell.",
  tell: "Osmerus mordax. The smell is the mark.",
  availability: "Ice and the late winter sugaring notch. Runs are a real thing.",
  reference: "Verified in Champlain. Also a problem when dumped into inland ponds. This camp does not move them.",
});
fish(79, "White perch", {
  place: "Champlain bay", mapId: "addison", x: 7, y: 23, seasons: fishSeasons.perch, trade: 2,
  look: "Silver, no gold bars, a deeper body than a bass.",
  tell: "Morone americana. It may stand in for yellow perch in the fry pan.",
  availability: "Bays.",
  reference: "Verified.",
  subs: [[71, 0.8]],
});
fish(80, "Brown bullhead", {
  place: "Dunmore mud", mapId: "salisbury", x: 13, y: 14, seasons: ["summer", "autumn"], trade: 2,
  look: "A whiskered catfish, mottled brown, small.",
  tell: "Ameiurus nebulosus. The whiskers are the mark. Skin it or accept the fry.",
  availability: "Warm mud.",
  reference: "Verified.",
});
fish(81, "Creek chub", {
  place: "New Haven pocket", mapId: "bristol", x: 13, y: 9, seasons: fishSeasons.trout, trade: 1, stack: 6,
  look: "A minnow with a dark shoulder spot, a big mouth for its size.",
  tell: "Semotilus atromaculatus. Bony. Food if you are stubborn, bait if you are not.",
  availability: "Small water.",
  reference: "Verified.",
  bait: { rigs: ["current", "champlain"], species: [pid(72), pid(73), pid(74)] },
});
fish(82, "White sucker", {
  place: "Otter Creek flat", mapId: "middlebury", x: 6, y: 14, seasons: ["spring", "summer"], trade: 1,
  look: "A round mouth underneath, big scales, a poor man's fish.",
  tell: "Catostomus commersonii. Bones everywhere. A spring run fish.",
  availability: "Spring run into summer.",
  reference: "Verified. Historically eaten, not prized.",
  subs: [[80, 0.6]],
});
fish(83, "Alewife", {
  place: "Champlain tributary mouth", mapId: "addison", x: 6, y: 20, seasons: ["spring"], trade: 1, stack: 8, baseYield: 4,
  look: "A saw-belly herring, silver, big eye.",
  tell: "Alosa pseudoharengus. Better bait than supper. Do not dump the bucket in a pond.",
  availability: "Spring near the lake.",
  reference: "Verified in Lake Champlain. Moving bait fish is how inland lakes get ruined.",
  bait: { rigs: ["champlain"], species: [pid(72), pid(73), pid(76), pid(77)] },
});

// game 84-93
function gameMeat(n, name, o) {
  add(n, name, {
    kind: "ingredient", method: "hunt", bin: "creel", stack: 4, safeRaw: false, meat: true, fish: false,
    demo: false, misreadAs: null, bait: null, field: [], subs: [], naturalHistory: "verified",
    era: "stable",
    eraNote: "Hunting is optional. Fourteen years do not delete the animal. The dial is the season, not a statute book.",
    spoilsNote: "Hunting is optional. The meat waits. It does not rot, and nothing in the county goes hungry if you skip it.",
    ...o,
  });
}
gameMeat(84, "Venison", {
  place: "Snake Mountain hardwood", mapId: "addison", x: 15, y: 24, seasons: ["deer"], rarity: "seasonal", trade: 8, baseYield: 2, demo: true, era: "stable",
  look: "Dark red, fine grain, almost no fat.",
  tell: "White-tailed deer. A legal season compressed onto the deer notch.",
  availability: "The deer notch only. Walk past it if you do not hunt.",
  reference: "Verified Odocoileus virginianus. Season dates are simplified to the dial.",
  eraNote: "Deer remain common across these jumps.",
});
gameMeat(85, "Wild turkey", {
  place: "Addison oak ridge", mapId: "addison", x: 17, y: 26, seasons: ["spring", "autumn"], rarity: "seasonal", trade: 6, baseYield: 1,
  look: "Dark meat, a bronze feather if you are honest about where it came from.",
  tell: "Meleagris gallopavo. Back in Vermont after a long absence. That return is real.",
  availability: "Spring or autumn notch.",
  reference: "Verified restored population.",
});
gameMeat(86, "Ruffed grouse", {
  place: "Goshen popple", mapId: "addison", x: 29, y: 16, seasons: ["autumn"], rarity: "uncommon", trade: 5, baseYield: 1,
  look: "Small, reddish meat, a fan of a tail if you saw the bird.",
  tell: "Bonasa umbellus. The drummer of popple stands.",
  availability: "Autumn.",
  reference: "Verified.",
});
gameMeat(87, "Snowshoe hare", {
  place: "Goshen softwood", mapId: "addison", x: 28, y: 17, seasons: ["autumn", "deer", "ice"], rarity: "uncommon", trade: 4, baseYield: 1,
  look: "Pale meat, big feet on the animal, dark eye.",
  tell: "Lepus americanus. Not the cottontail of the valley farms.",
  availability: "Cold notches, higher ground.",
  reference: "Verified. Coat color shifts with snow; the camp does not require the coat.",
});
gameMeat(88, "Eastern cottontail", {
  place: "Ferrisburgh brush", mapId: "ferrisburgh", x: 12, y: 12, seasons: ["autumn", "deer"], rarity: "uncommon", trade: 3, baseYield: 1,
  look: "Small rabbit, a white tail, valley brush.",
  tell: "Sylvilagus floridanus. New England cottontail is the rarer one and is not this node.",
  availability: "Valley brush in the hunting notches.",
  reference: "Verified. Sylvilagus transitionalis is not stocked.",
  subs: [[87, 0.85]],
});
gameMeat(89, "Gray squirrel", {
  place: "Middlebury hardwood lot", mapId: "middlebury", x: 20, y: 11, seasons: ["autumn", "deer"], rarity: "common", trade: 2, baseYield: 2,
  look: "Small, pink, a lot of work for a little meat.",
  tell: "Sciurus carolinensis. A hardwood animal.",
  availability: "Autumn and deer notch.",
  reference: "Verified.",
});
gameMeat(90, "Mallard", {
  place: "Dead Creek", mapId: "ferrisburgh", x: 5, y: 14, seasons: ["autumn"], rarity: "seasonal", trade: 4, baseYield: 1,
  look: "Dark duck meat. The green head is the bird, not the skillet.",
  tell: "Anas platyrhynchos.",
  availability: "Autumn waterfowl.",
  reference: "Verified.",
  subs: [[92, 0.8]],
});
gameMeat(91, "Canada goose", {
  place: "Dead Creek", mapId: "ferrisburgh", x: 5, y: 15, seasons: ["autumn", "spring"], rarity: "seasonal", trade: 5, baseYield: 1,
  look: "Dark, fatty, a big bird.",
  tell: "Branta canadensis. Common. Sometimes a nuisance in the fields.",
  availability: "Migration notches: spring and autumn.",
  reference: "Verified and abundant.",
});
gameMeat(92, "Wood duck", {
  place: "Cornwall swamp", mapId: "addison", x: 22, y: 20, seasons: ["autumn"], rarity: "uncommon", trade: 5, baseYield: 1,
  look: "Small duck, rich meat.",
  tell: "Aix sponsa. A swamp bird. The paint on the drake is not in the pot.",
  availability: "Autumn swamp.",
  reference: "Verified.",
});
gameMeat(93, "Snow goose", {
  place: "Dead Creek flats", mapId: "ferrisburgh", x: 4, y: 15, seasons: ["autumn"], rarity: "seasonal", trade: 6, baseYield: 1,
  look: "Dark meat under a white bird.",
  tell: "Anser caerulescens. Dead Creek is famous for the migration.",
  availability: "Autumn, when the flats go white with them.",
  reference: "Verified concentration at Dead Creek Wildlife Management Area.",
  subs: [[91, 0.9]],
});

// bait 94-108
function bait(n, name, o) {
  add(n, name, {
    kind: "bait", method: "gather", bin: "pouch", safeRaw: false, meat: false, fish: false,
    demo: false, field: [], subs: [], era: "stable",
    eraNote: "Bait does not change century unless the record says it spreads.",
    naturalHistory: "verified", rarity: "common",
    spoilsNote: "Bait stays bait. It is not on a rot clock.",
    ...o,
  });
}
bait(94, "Nightcrawler", {
  place: "Middlebury night grass", mapId: "middlebury", x: 18, y: 12, seasons: ["spring", "summer", "autumn"], stack: 16, trade: 1, baseYield: 8, demo: true,
  look: "A long banding worm, mucus and patience.",
  tell: "Lumbricus terrestris. Introduced, everywhere, the standard worm.",
  availability: "Wet nights, three seasons. Winter they are deep; the dial agrees.",
  reference: "Verified naturalized earthworm. A glacier-scraped place originally had fewer.",
  bait: { rigs: ["current", "still", "champlain"], species: [pid(68), pid(69), pid(70), pid(71), pid(74), pid(75), pid(80), pid(72), pid(78)] },
});
bait(95, "Red wiggler", {
  place: "Farm compost", mapId: "ferrisburgh", x: 8, y: 10, seasons: ALL, stack: 16, trade: 1, baseYield: 8,
  look: "Small, red, busy in the compost.",
  tell: "Eisenia fetida. A compost worm. It may stand in for a nightcrawler.",
  availability: "Any week the pile is alive.",
  reference: "Verified compost species.",
  bait: { rigs: ["still", "current"], species: [pid(71), pid(75), pid(80), pid(68)] },
  subs: [[94, 0.8]],
});
bait(96, "Hellgrammite", {
  place: "New Haven rock", mapId: "bristol", x: 14, y: 7, seasons: ["spring", "summer"], stack: 6, trade: 3, baseYield: 3, demo: true, rarity: "uncommon",
  look: "A dark larva, pincers, a lot of legs, under a rock in the current.",
  tell: "Dobsonfly larva. Pinch. Clean water. A serious bait.",
  availability: "Warm months under stones.",
  reference: "Verified. Their presence is a clean-water sign, not a stat.",
  bait: { rigs: ["current"], species: [pid(68), pid(70), pid(74)] },
});
bait(97, "Grasshopper", {
  place: "Addison meadow", mapId: "addison", x: 16, y: 28, seasons: ["summer", "autumn"], stack: 10, trade: 1, baseYield: 5,
  look: "Dry, long legs, a meadow insect.",
  tell: "A hopper. Still water and the edges.",
  availability: "High summer into early autumn.",
  reference: "Verified as bait.",
  bait: { rigs: ["still"], species: [pid(71), pid(75), pid(74), pid(80)] },
});
bait(98, "Cricket", {
  place: "Barn floor", mapId: "ferrisburgh", x: 9, y: 11, seasons: ["summer", "autumn"], stack: 10, trade: 1, baseYield: 5,
  look: "Black, a cellar singer.",
  tell: "A cricket. Panfish know it.",
  availability: "Warm months around buildings.",
  reference: "Verified as bait.",
  bait: { rigs: ["still"], species: [pid(71), pid(75), pid(80)] },
});
bait(99, "Caddisfly larva", {
  place: "Otter Creek stone", mapId: "middlebury", x: 7, y: 14, seasons: ["spring", "summer"], stack: 8, trade: 2, baseYield: 4, rarity: "uncommon",
  look: "A pebble case, a soft insect inside.",
  tell: "The case is the mark. Trout eat the tenant.",
  availability: "Cold current.",
  reference: "Verified trout food.",
  bait: { rigs: ["current"], species: [pid(68), pid(69), pid(70)] },
});
bait(100, "Stonefly nymph", {
  place: "New Haven stone", mapId: "bristol", x: 15, y: 7, seasons: ["spring", "sugaring"], stack: 6, trade: 2, baseYield: 3, rarity: "uncommon",
  look: "Two tails, a flat body, clinging under a stone.",
  tell: "Stonefly. Two tails. Mayfly nymphs usually show three. Trout care more than you do.",
  availability: "Cold months into spring.",
  reference: "Verified. Tail count is the simple field mark.",
  bait: { rigs: ["current"], species: [pid(68), pid(70)] },
});
bait(101, "Golden shiner", {
  method: "fish", place: "Dunmore cove", mapId: "salisbury", x: 14, y: 13, seasons: ["summer", "autumn"], stack: 8, trade: 2, baseYield: 4, bin: "creel",
  look: "A bright minnow, a gold side, a deep body.",
  tell: "Notemigonus crysoleucas. Bait. Do not dump shiners into a pond that does not have them.",
  availability: "Warm water. Often regulated as bait. This camp does not truck them.",
  reference: "Verified bait fish. Transport rules are real; the camp only uses what it caught here.",
  bait: { rigs: ["champlain", "still"], species: [pid(72), pid(73), pid(74), pid(76)] },
});
bait(102, "Native crayfish", {
  place: "Otter Creek rock", mapId: "middlebury", x: 8, y: 16, seasons: ["summer", "autumn"], stack: 4, trade: 3, baseYield: 2, rarity: "uncommon", kind: "ingredient",
  look: "A small brown crayfish, no rusty patches on the side.",
  tell: "A native. Rusty crayfish wear rust-red patches and are the invader. Do not move either one.",
  availability: "Warm rocks.",
  reference: "Verified that Vermont has native crayfish and a rusty-crayfish problem. Species-level split on a creek rock is simplified.",
  bait: { rigs: ["current", "still"], species: [pid(74), pid(68), pid(71)] },
});
bait(103, "Rusty crayfish", {
  place: "Otter Creek rock", mapId: "middlebury", x: 9, y: 16, seasons: ["summer", "autumn"], stack: 6, trade: 1, baseYield: 2, rarity: "uncommon", era: "spreads", kind: "ingredient",
  look: "Rust-red patches on the sides, black bands on the claw tips, aggressive.",
  tell: "Faxonius rusticus. Invasive. It may stand in for the native in a boil. Kill it. Do not bucket it to another water.",
  availability: "Where it has arrived. More after each generation.",
  eraNote: "Verified invasive. The spread on death-jumps is the era rule.",
  reference: "Verified. Substitution into the native boil is one-way.",
  subs: [[102, 0.7]],
  bait: { rigs: ["current", "still"], species: [pid(74), pid(71)] },
});
bait(104, "Cheese nub", {
  method: "camp", place: "The rind you already cut", mapId: "middlebury", x: 16, y: 10, seasons: ALL, stack: 8, trade: 1, baseYield: 4, bin: "pouch",
  look: "A dry corner of cheddar.",
  tell: "Panfish bait in warm water. A camp use for a rind, not a secret weapon.",
  availability: "Whenever the wheel has a heel.",
  reference: "Verified as a panfish bait in warm water. Fictionalized only as a guaranteed Middlebury scrap.",
  bait: { rigs: ["still"], species: [pid(71), pid(75), pid(80)] },
});
bait(105, "Marsh worm", {
  place: "Cornwall mud", mapId: "addison", x: 21, y: 21, seasons: ["spring", "summer", "autumn"], stack: 12, trade: 1, baseYield: 5,
  look: "Shorter than a nightcrawler, redder, in black mud.",
  tell: "A marsh worm. It may stand in for a nightcrawler at a discount.",
  availability: "Soft mud, three seasons.",
  reference: "Verified as a generic muck worm. Not a species monograph.",
  bait: { rigs: ["still", "current"], species: [pid(71), pid(80), pid(82)] },
  subs: [[94, 0.7]],
});
add(106, "Quarry marble dust", {
  n: 106, name: "Quarry marble dust",
  kind: "field", rarity: "rare", method: "quarry", mapId: "quarry", place: "Marble Vein ledge", x: 16, y: 13,
  seasons: ALL, baseYield: 1, stack: 4, trade: 3, demo: true, safeRaw: false, meat: false, fish: false,
  era: "stable", naturalHistory: "fictionalized", misreadAs: 11, bin: "pouch", bait: null, subs: [],
  look: "White, dry, a little sparkle, no crystal bite.",
  tell: "Not salt. Gritty, dead on the tongue, no sea. The Vein's dust. A fiction.",
  availability: "Rare, on the ledge, any season you are allowed in the dark.",
  eraNote: "The Vein does not care about fourteen winters. The dust is still a story.",
  reference: "Fictionalized. Marble is real in the county. Eating it is not a tradition.",
  spoilsNote: "A paper twist in the pouch. It does not expire.",
  field: [{ op: "pinch", intent: "pinch", consumes: true, label: "Pinch of dust", note: "Opens the ear for the Vein. Not a sharper blade. Once a life.", effect: fx("dust-pinch", "Vein pinch", "listen", 1, 1, 1, true, "vein-ear", true) }],
});
bait(107, "Mealworm", {
  method: "buy", place: "Middlebury mercantile", mapId: "middlebury", x: 17, y: 8, seasons: ALL, stack: 12, trade: 1, baseYield: 6,
  look: "A yellow larva in a tin.",
  tell: "A bought bait. Honest about being bought.",
  availability: "The mercantile, any week.",
  reference: "Verified commercial bait.",
  bait: { rigs: ["still"], species: [pid(71), pid(75), pid(80)] },
});
add(108, "Ghost morel", {
  kind: "ingredient", rarity: "rare", method: "gather", mapId: "addison", place: "Pines after a death", x: 34, y: 9,
  seasons: ["spring"], baseYield: 1, stack: 1, trade: 0, demo: true, safeRaw: false, meat: false, fish: false,
  era: "after-death", naturalHistory: "fictionalized", misreadAs: 58, bin: "pouch", bait: null, subs: [],
  look: "A morel shape, translucent, cold, not hollow so much as absent.",
  tell: "A fiction. A real morel is opaque and hollow when split. This one will not cook as a morel. It listens.",
  availability: "Hidden until you have died once. Then a single spring node.",
  eraNote: "Fictionalized. It does not exist in the woods. It exists after the fourteen years.",
  reference: "Fictionalized. Do not hunt a translucent morel.",
  spoilsNote: "It does not rot. It also does not sell.",
  field: [{ op: "listen", intent: "listen", consumes: true, label: "Listen before you cook", note: "Spends the ghost. Tells which stove plates the camp can finish. Once a life. Not damage.", effect: fx("morel-listen", "The listen", "listen", 1, 1, 1, true, "listen", true) }],
});

// tackle and field 109-120
function tool(n, name, o) {
  add(n, name, {
    kind: "field", method: "buy", mapId: "middlebury", place: "Middlebury mercantile", x: 16, y: 8,
    seasons: ALL, baseYield: 1, stack: 1, trade: 3, rarity: "common", era: "stable",
    naturalHistory: "verified", safeRaw: false, meat: false, fish: false, demo: false,
    misreadAs: null, bait: null, field: [], subs: [], bin: "pouch",
    spoilsNote: "A tool. It does not wear out on a clock.",
    eraNote: "Gear of this century. Deaths do not uninvent it.",
    ...o,
  });
}
tool(109, "Snelled hook", {
  baseYield: 2, stack: 6, trade: 2,
  look: "A hook on a short gut or nylon, already tied.",
  tell: "Without it the line is a theory.",
  availability: "The mercantile.",
  reference: "Verified tackle.",
});
tool(110, "Split shot", {
  stack: 8, baseYield: 4, trade: 1,
  look: "Small lead or tin shot, split.",
  tell: "Pinches on the line. Current rigs want it. It is not spent when you cast.",
  availability: "A tin of them.",
  reference: "Verified. Modern non-lead shot exists; the camp does not split that hair.",
});
tool(111, "Linen line", {
  look: "A spool, pale, waxed if you have bothered.",
  tell: "The line. Beeswax dresses it. The dress is a flag, not a new line.",
  availability: "One spool is enough.",
  reference: "Verified. Linen is the old material; nylon would also be fair. The spool is linen on purpose.",
});
tool(112, "Cork bobber", {
  look: "A cork, a pin through it.",
  tell: "Still water wants it. Twine can lash a stand-in once.",
  availability: "The mercantile.",
  reference: "Verified tackle.",
});
tool(113, "Twine", {
  stack: 8, baseYield: 4, trade: 1, demo: true,
  look: "Brown jute, a ball.",
  tell: "Several jobs. None of them are a weapon upgrade.",
  availability: "Cheap, always.",
  reference: "Verified field supply.",
  field: [
    { op: "snare", intent: "snare", consumes: true, label: "Set a snare", note: "Autumn, deer, or ice, in hare or rabbit country. One animal. Optional." },
    { op: "pack", intent: "pack", consumes: true, label: "Pack the pouch into the cellar", note: "Moves food home. Tools stay. Spends twine only if something moved." },
    { op: "lash", intent: "lash", consumes: true, label: "Lash a bobber", note: "One still-water cast without the cork." },
  ],
});
tool(114, "Beeswax", {
  place: "Cornwall bee yard", mapId: "addison", x: 20, y: 23, method: "farm", stack: 4, baseYield: 2, trade: 3, rarity: "uncommon",
  look: "A yellow cake, honey in the nose.",
  tell: "Wax. Dress the line or seal a tin.",
  availability: "When the yard renders wax.",
  reference: "Verified.",
  field: [
    { op: "dress", intent: "dress", consumes: true, label: "Dress the line", note: "A flag on the spool. The next trout does not get heavier. The line just behaves." },
    { op: "seal", intent: "seal", consumes: true, label: "Seal a stack into the tin", note: "Moves one pouch stack into the tin if there is room." },
  ],
});
tool(115, "Tin box", {
  stack: 2, baseYield: 1, trade: 4,
  look: "A hinged tin, tight lid.",
  tell: "Use it to widen the tin bin. The bin is what survives a fall.",
  availability: "Bought.",
  reference: "Verified container. Survival across death is the game rule, not a magic tin.",
  field: [{ op: "tin-slots", intent: "tin-slots", consumes: true, label: "Add the tin to the camp", note: "Two more tin slots, up to eight." }],
});
tool(116, "Birch bark curl", {
  method: "gather", place: "Goshen blowdown", mapId: "addison", x: 28, y: 15, seasons: ["all-handled"], stack: 6, baseYield: 3, trade: 1,
  look: "A loose curl on the ground, white outside, tan inside.",
  tell: "Fallen bark. Do not strip a living birch. The node is blowdown.",
  availability: "On the ground.",
  reference: "Verified firestarter. Harvest of live bark is not what this node is.",
  field: [{ op: "light", intent: "light", consumes: true, label: "Catch a light", note: "A small light, shorter than oil.", effect: fx("bark-light", "Bark light", "light", 1, 1, 1, true) }],
});
// fix seasons for bark - I used invalid season. I'll override after if needed.
tool(117, "Char cloth", {
  method: "camp", place: "The fire you already had", stack: 6, baseYield: 2, trade: 1,
  look: "Black cloth that takes a spark.",
  tell: "A camp fire tool. Not food.",
  availability: "Made at camp.",
  reference: "Verified historical tinder.",
  field: [{ op: "light", intent: "light", consumes: true, label: "Strike a light", note: "Same small light as bark.", effect: fx("bark-light", "Struck light", "light", 1, 1, 1, true) }],
});
tool(118, "Snare wire", {
  stack: 4, baseYield: 2, trade: 2,
  look: "Fine brass or steel wire, a loop.",
  tell: "A snare that is not twine. Same job, holds better in the record.",
  availability: "Bought.",
  reference: "Verified trapping hardware. Optional. Regulated in life; here it is one hare.",
  field: [{ op: "snare", intent: "snare", consumes: true, label: "Wire snare", note: "Same as twine. One small animal in the right season and country." }],
});
tool(119, "Cotton bandage", {
  stack: 6, baseYield: 3, trade: 2,
  look: "A rolled cloth.",
  tell: "A courtesy for a scrape. Not food. Not required before anything.",
  availability: "The mercantile.",
  reference: "Verified field supply.",
  field: [{ op: "staunch", intent: "staunch", consumes: true, label: "Staunch", note: "A little less frayed. Courtesy, capped, optional.", effect: fx("bandage", "Staunched", "courtesy", 1, 2, 0.5, false) }],
});
tool(120, "Needle and thread", {
  look: "A needle in a card, black thread.",
  tell: "Mends. Widens a creel once. Does not add an edge to a blade.",
  availability: "One card.",
  reference: "Verified.",
  field: [
    { op: "mend", intent: "mend", consumes: false, label: "Mend a tear", note: "Once a life. A small calm. The needle stays." , effect: fx("mend-calm", "Mended", "calm", 1, 1, 1, true) },
    { op: "creel-slot", intent: "creel-slot", consumes: false, label: "Stitch the creel", note: "One extra creel slot, once. The needle stays." },
  ],
});

// Birch bark seasons fix
items[115].seasons = ALL;

function fx(id, name, kind, magnitude, cap, falloff, exclusive, distinctive, fictional) {
  return {
    id, name, kind, magnitude, cap, falloff, exclusive,
    ...(distinctive ? { distinctive } : {}),
    fictional: Boolean(fictional),
  };
}
function forage(o) {
  return {
    kind: "ingredient", method: "gather", bin: "pouch", rarity: "common", era: "stable",
    naturalHistory: "verified", safeRaw: false, meat: false, fish: false, demo: false,
    misreadAs: null, bait: null, field: [], subs: [], stack: 8, trade: 2, baseYield: 3,
    spoilsNote: "Forage does not spoil on a clock. Dry it, tin it, or carry it.",
    eraNote: "The plant is still the plant after fourteen years, unless the era line says otherwise.",
    ...o,
  };
}
function fungi(o) {
  return forage({ rarity: "uncommon", bin: "pouch", ...o });
}

// The helpers forage/fungi/fx are used before initialization in the calls above.
// I called add() before function declarations... wait, function declarations are hoisted
// for `function forage` but I used forage() inside add() calls that happen at runtime
// AFTER the whole module is evaluated. Function declarations are hoisted. Good.
// BUT forage is defined AFTER the add() calls in source order. Function declarations
// are hoisted to the top of the module scope. Yes that works in JS.
// fx() is also a function declaration? I used `function fx` later. Hoisted. Good.
// Wait I wrote `function fx` AFTER it was called in field arrays during add().
// Those run at runtime after hoisting. OK.

if (items.length !== 120) {
  throw new Error(`expected 120 provisions, got ${items.length}`);
}

// Fix invalid: tool 116 seasons were overwritten. Check all seasons.
const seasonSet = new Set(ALL);
for (const it of items) {
  for (const s of it.seasons) {
    if (!seasonSet.has(s)) throw new Error(`bad season ${s} on ${it.n}`);
  }
}

const warmth = (mag, fictional = false) => fx("warmth", "Warmth", "warmth", mag, 3, 0.5, false, undefined, fictional);
const focus = (mag) => fx("focus", "Focus", "focus", mag, 2, 0.5, false);
const stride = (mag) => fx("stride", "Stride", "stride", mag, 2, 0.5, false);
const courtesy = (mag) => fx("courtesy", "Courtesy", "courtesy", mag, 2, 0.5, false);
const calm = (mag) => fx("calm", "Calm", "calm", mag, 2, 0.5, false);
const quiet = (mag) => fx("quiet", "Quiet", "quiet", mag, 2, 0.5, false);

const need = (n, qty, allow = true, cured = false) => ({
  provisionId: pid(n),
  qty,
  allowSubstitution: allow,
  ...(cured ? { cured: true } : {}),
});

const dishes = [
  d(1, "Maple creemee", "Milk and golden syrup, spun. The county's soft-serve word.", true, "verified", "Verified: creemee is the Vermont word for soft-serve. The camp spins it without a machine minigame.", [need(1, 1, false), need(24, 1)], [focus(2)]),
  d(2, "Deluxe creemee", "The same, with a crushed berry.", false, "verified", "Verified plate. A berry on a creemee is ordinary.", [need(1, 1, false), need(25, 1), need(36, 1)], [focus(2), calm(1)]),
  d(3, "Sugar on snow", "Hot dark syrup on clean snow. A sugaring-party plate.", true, "verified", "Verified sugaring-party food.", [need(27, 1, false), need(25, 1)], [warmth(2)]),
  d(4, "Johnnycake", "Cornmeal, salt, butter. A hearth bread.", false, "verified", "Verified New England cornmeal bread. Regional, not sacred.", [need(10, 2), need(11, 1), need(2, 1)], [warmth(1)]),
  d(5, "Maple baked beans", "Soldier beans, onion, dark syrup, salt.", false, "verified", "Verified New England baked-bean pot with maple. Long simmer compressed.", [need(7, 2), need(8, 1), need(25, 1), need(11, 1)], [warmth(2), courtesy(1)]),
  d(6, "Fiddlehead sauté", "Ostrich fern coils in butter. Spring, cooked.", true, "verified", "Verified cooked fiddleheads. Raw is not this plate.", [need(17, 2, false), need(2, 1)], [stride(2)]),
  d(7, "Ramp butter", "Ramp leaves driven into butter.", false, "verified", "Verified way to keep a ramp. The bulb is not required.", [need(18, 2), need(2, 1)], [stride(1), warmth(1)]),
  d(8, "Nettle soup", "Stung leaves, milk, salt. The sting is gone.", false, "verified", "Verified cooked nettle soup.", [need(20, 2, false), need(1, 1), need(11, 1)], [courtesy(1)]),
  d(9, "Dandelion wilt", "Crowns wilted in cider vinegar.", false, "verified", "Verified bitter green with vinegar.", [need(21, 2), need(13, 1)], [calm(1)]),
  d(10, "Spruce-tip syrup", "Soft tips in golden syrup.", false, "verified", "Verified forage syrup. Not a medicine.", [need(22, 2, false), need(24, 1)], [focus(1)]),
  d(11, "Cattail cakes", "Shoots, cornmeal, egg.", false, "verified", "Verified cattail shoot, camp cakes.", [need(30, 2), need(10, 1), need(4, 1)], [warmth(1)]),
  d(12, "Sumac cooler", "Red bobs and honey in cold water, then a warm-up if you must.", false, "verified", "Verified staghorn sumac drink. Not poison sumac.", [need(42, 2, false), need(12, 1)], [focus(1), calm(1)]),
  d(13, "Elderberry rob", "Cooked elderberries and honey. A dark spoonful.", false, "verified", "Verified only as a cooked syrup. Not a cure.", [need(40, 2, false), need(12, 1, false)], [courtesy(1)]),
  d(14, "Chokecherry jelly", "Cooked pulp, apple, honey. Pits stay out.", false, "verified", "Verified cooked jelly. The seed is not eaten.", [need(41, 2, false), need(43, 1), need(12, 1)], [warmth(1)]),
  d(15, "Strawberry slump", "Wild strawberries under a dough lid.", false, "verified", "Verified fruit slump.", [need(36, 2), need(9, 1), need(2, 1)], [focus(1)]),
  d(16, "Blueberry grunt", "Lowbush berries, flour, butter.", true, "verified", "Verified grunt. A dumpling on fruit.", [need(37, 2), need(9, 1), need(2, 1)], [calm(1)]),
  d(17, "Blackberry johnnycake", "Cornmeal bread with blackberries.", false, "verified", "Verified camp bread.", [need(39, 2), need(10, 2), need(2, 1)], [warmth(1)]),
  d(18, "Apple slump", "Wild apples, flour, butter, a thread of golden syrup.", false, "verified", "Verified apple pudding.", [need(43, 2), need(9, 1), need(2, 1), need(24, 1)], [warmth(2)]),
  d(19, "Cheddar soup", "Bandaged cheddar, milk, butter, flour.", false, "verified", "Verified farm soup. Not a named creamery recipe.", [need(3, 1, false), need(1, 1), need(2, 1), need(9, 1)], [courtesy(1), warmth(1)]),
  d(20, "Corn chowder", "Flint corn, milk, potato, salt.", false, "verified", "Verified chowder. Flint corn, not a can.", [need(55, 2), need(1, 1), need(5, 1), need(11, 1)], [warmth(2)]),
  d(21, "Succotash", "Flint corn and soldier beans in butter.", false, "verified", "Verified New England dish with Indigenous roots. This is a camp pot, not a rite.", [need(7, 1), need(55, 1), need(2, 1)], [warmth(1)]),
  d(22, "Trout in butter", "Brook trout, butter. Brown or rainbow can stand in.", true, "verified", "Verified pan. Substitutes are the other trout, one way.", [need(68, 1), need(2, 1)], [quiet(2)]),
  d(23, "Perch fry", "Yellow perch, cornmeal, salt.", true, "verified", "Verified shore supper.", [need(71, 1), need(10, 1), need(11, 1)], [warmth(2)]),
  d(24, "Walleye with ramps", "Walleye, ramp leaf, butter.", false, "verified", "Verified fish and a spring allium. Not a restaurant's dish.", [need(72, 1, false), need(18, 1), need(2, 1)], [quiet(1), stride(1)]),
  d(25, "Pike chowder", "Pike, potato, milk, salt.", false, "verified", "Verified bony-fish chowder. The Y-bones are compressed away.", [need(73, 1), need(5, 1), need(1, 1), need(11, 1)], [warmth(2)]),
  d(26, "Smelt fry", "Whole smelt, cornmeal.", true, "verified", "Verified ice-fishing supper.", [need(78, 2), need(10, 1)], [stride(1)]),
  d(27, "Bullhead fry", "Bullhead, cornmeal, salt.", false, "verified", "Verified. Skinning is assumed.", [need(80, 1), need(10, 1), need(11, 1)], [warmth(1)]),
  d(28, "Salmon cakes", "Landlocked salmon, egg, cornmeal.", false, "verified", "The fish program is real. Making a cake on this shore is a rare plate.", [need(77, 1, false), need(4, 1), need(10, 1)], [focus(1), courtesy(1)]),
  d(29, "Lake trout chowder", "Lake trout, milk, potato.", false, "verified", "Verified lake fish in a pot.", [need(76, 1), need(1, 1), need(5, 1)], [quiet(1), warmth(1)]),
  d(30, "Crayfish boil", "Native crayfish and salt. Rusty may stand in.", false, "verified", "Verified as food. Do not move the animals. Rusty is the one-way substitute.", [need(102, 2), need(11, 1)], [warmth(1)]),
  d(31, "Venison stew", "Venison, burdock, potato, salt. Comfort, not a damage roll.", true, "verified", "Verified hunter's pot. Optional hunt. No boss is waiting on it.", [need(84, 1), need(49, 1), need(5, 1), need(11, 1)], [courtesy(2)]),
  d(32, "Turkey pot pie", "Turkey, flour, butter, carrot.", false, "verified", "Verified pot pie.", [need(85, 1), need(9, 1), need(2, 1), need(6, 1)], [courtesy(1), warmth(1)]),
  d(33, "Grouse roast", "Grouse, apple, butter.", false, "verified", "Verified small-game roast.", [need(86, 1), need(43, 1), need(2, 1)], [quiet(1), warmth(1)]),
  d(34, "Hare stew", "Snowshoe hare, burdock, salt.", false, "verified", "Verified. Snare or hunt, still optional.", [need(87, 1), need(49, 1), need(11, 1)], [warmth(2)]),
  d(35, "Squirrel gravy", "Gray squirrel, flour, milk.", false, "verified", "Verified camp gravy. A lot of work.", [need(89, 1), need(9, 1), need(1, 1)], [warmth(1)]),
  d(36, "Goose roast", "Canada goose, apple, salt.", false, "verified", "Verified. Fatty. Dead Creek has the birds.", [need(91, 1), need(43, 1), need(11, 1)], [warmth(2), courtesy(1)]),
  d(37, "Duck with sumac", "Wood duck, sumac, honey. A mallard can stand in.", false, "verified", "A real bird and a real sour. The pairing is a camp plate on real parts.", [need(92, 1), need(42, 1), need(12, 1)], [focus(1)]),
  d(38, "Morel cream", "Yellow morels, milk, butter. The ghost will not do.", true, "verified", "Verified way to eat morels. The cache-glow gift is fictionalized.", [need(58, 1, false), need(1, 1), need(2, 1)], [fx("cache-glow", "Ground memory", "sight", 2, 1, 1, true, "cache-glow", true)]),
  d(39, "Chanterelle toast", "Chanterelles, butter, salt. A lobster mushroom or king bolete may stand in. The jack may not.", false, "verified", "Verified. The jack-o'-lantern is not on the substitution list.", [need(56, 1), need(2, 1), need(11, 1)], [calm(1), warmth(1)]),
  d(40, "Black trumpet butter", "Trumpets folded into butter.", false, "verified", "Verified keeping method.", [need(57, 1, false), need(2, 1)], [quiet(2)]),
  d(41, "Hen roast", "Hen of the woods, salt, butter.", false, "verified", "Verified. The hen is a mushroom.", [need(59, 1, false), need(11, 1), need(2, 1)], [warmth(2)]),
  d(42, "Oyster toast", "Oyster mushrooms, butter, flour.", false, "verified", "Verified. Not a shellfish oyster.", [need(61, 1), need(2, 1), need(9, 1)], [calm(1)]),
  d(43, "Chaga tea", "A chunk, simmered. Not a prescription.", true, "verified", "Verified traditional tea. Game calm is not a health claim.", [need(29, 1, false)], [calm(2)]),
  d(44, "Butternut milk", "The tree nut, ground into milk. Not the squash.", true, "verified", "Nut milk is a fair plate. The old-orchard trade gift is fictionalized.", [need(45, 1, false), need(1, 1, false)], [fx("old-orchard", "Old orchard", "memory", 1, 1, 1, true, "old-orchard", true)]),
  d(45, "Acorn cake", "Leached red-oak acorn, flour, salt, honey. Beechnut may stand in.", false, "verified", "Verified that acorns are food after leaching. The leach is compressed into the recipe, not a minigame.", [need(46, 2), need(9, 1), need(11, 1), need(12, 1)], [warmth(1)]),
  d(46, "Marble custard", "Milk, honey, and a pinch of Vein dust.", true, "fictionalized", "Fictionalized. Marble dust is not a food. The plate opens an ear, not an edge.", [need(1, 1, false), need(12, 1), need(106, 1, false)], [fx("vein-ear", "Vein ear", "listen", 2, 1, 1, true, "vein-ear", true)]),
  d(47, "Fourteen-winter hash", "Cured venison, potato, onion. The taste is allowed to outlive the body.", true, "fictionalized", "Hash is real. Remembering it across a death is fictionalized. Venison must already be cured.", [need(84, 1, false, true), need(5, 1), need(8, 1)], [fx("palate", "The palate", "memory", 1, 1, 1, true, "palate", true)]),
  d(48, "Soloverse broth", "Ghost morel, birch sap, marble dust. A story, not a species.", false, "fictionalized", "Fictionalized entirely. It does not teach you to eat a real mushroom.", [need(108, 1, false), need(28, 1), need(106, 1, false)], [fx("soloverse", "Soloverse broth", "listen", 1, 1, 1, true, "soloverse", true)]),
];

function d(n, name, blurb, stove, naturalHistory, reference, needs, effects) {
  return { n, id: did(n), name, blurb, stove, naturalHistory, reference, needs, effects };
}

if (dishes.length !== 48) throw new Error(`dishes ${dishes.length}`);

const nodes = [];
for (const it of items) {
  nodes.push({
    id: `node-${String(it.n).padStart(3, "0")}`,
    provisionId: pid(it.n),
    mapId: it.mapId,
    place: it.place,
    x: it.x,
    y: it.y,
    seasons: it.seasons,
    baseYield: it.baseYield,
  });
  if (it.extraNode) {
    nodes.push({
      id: it.extraNode.id,
      provisionId: pid(it.n),
      mapId: it.extraNode.mapId,
      place: it.extraNode.place,
      x: it.extraNode.x,
      y: it.extraNode.y,
      seasons: it.seasons,
      baseYield: it.extraNode.baseYield,
    });
  }
}
nodes.push({
  id: "node-cache",
  provisionId: pid(47),
  mapId: "addison",
  place: "Ripton cache under the beech",
  x: 30,
  y: 13,
  seasons: ["autumn"],
  baseYield: 2,
  hiddenUntil: "cacheGlow",
});

const waters = [
  { id: "new-haven", name: "New Haven River", mapId: "bristol", place: "Bristol Gap", rig: "current", species: [pid(68), pid(70)] },
  { id: "otter", name: "Otter Creek", mapId: "middlebury", place: "Middlebury falls", rig: "current", species: [pid(68), pid(69), pid(74), pid(82), pid(81)] },
  { id: "dunmore", name: "Lake Dunmore", mapId: "salisbury", place: "Salisbury shore", rig: "still", species: [pid(71), pid(75), pid(80), pid(74), pid(101)] },
  { id: "champlain", name: "Champlain shore", mapId: "addison", place: "Panton", rig: "champlain", species: [pid(72), pid(73), pid(76), pid(77), pid(78), pid(79), pid(83)] },
];

const provisions = items.map((it) => ({
  id: pid(it.n),
  n: it.n,
  name: it.name,
  kind: it.kind,
  rarity: it.rarity,
  method: it.method,
  place: it.place,
  mapId: it.mapId,
  x: it.x,
  y: it.y,
  seasons: it.seasons,
  baseYield: it.baseYield,
  availability: it.availability,
  look: it.look,
  tell: it.tell,
  misreadAs: it.misreadAs ? pid(it.misreadAs) : null,
  storage: { bin: it.bin, stackMax: it.stack, spoils: false, note: it.spoilsNote },
  bait: it.bait,
  field: it.field ?? [],
  substitutions: (it.subs ?? []).map(([forN, quality]) => ({ forId: pid(forN), quality })),
  fieldEffect: null,
  trade: it.trade,
  era: it.era,
  eraNote: it.eraNote,
  naturalHistory: it.naturalHistory,
  reference: it.reference,
  safeRaw: it.safeRaw,
  demo: it.demo,
  meat: it.meat,
  fish: it.fish,
}));

const demoCount = provisions.filter((p) => p.demo).length;
if (demoCount !== 24) throw new Error(`demo ${demoCount}`);

const body = `/* Generated by generate.mjs. Do not hand-edit. */
import type { Dish, Provision, SourceNode, Water } from "./types.ts";

export const PROVISIONS: Provision[] = ${JSON.stringify(provisions, null, 2)};

export const DISHES: Dish[] = ${JSON.stringify(dishes, null, 2)};

export const NODES: SourceNode[] = ${JSON.stringify(nodes, null, 2)};

export const WATERS: Water[] = ${JSON.stringify(waters, null, 2)};

export const PROVISION_BY_ID: Record<string, Provision> = Object.fromEntries(
  PROVISIONS.map((p) => [p.id, p]),
);

export const DISH_BY_ID: Record<string, Dish> = Object.fromEntries(DISHES.map((d) => [d.id, d]));
`;

writeFileSync(join(dir, "catalog.ts"), body);
console.log(`wrote ${provisions.length} provisions, ${dishes.length} dishes, ${nodes.length} nodes`);
