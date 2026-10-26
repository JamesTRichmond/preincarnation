import type { DiscoveryScene } from "./types.ts";

/** Twelve discovery scenes. Twenty representative objects. Not side quests. */
export const SCENES: readonly DiscoveryScene[] = [
  {
    id: "scene.history.01",
    index: 1,
    title: "The unfinished bench",
    place: "Hale & Bramble, Marrow Notch",
    siteKind: "workshop",
    prose:
      "Harlan’s bench is still mid-stroke. Curls pack the tray. Ellis is back, and the shop did not finish itself during the fourteen years. Two tools in the dust are enough to know the work was left, not completed by another life.",
    objectIds: ["loot.expansion.history.001", "loot.expansion.history.005"],
  },
  {
    id: "scene.history.02",
    index: 2,
    title: "Silt House hearth",
    place: "Silt House, Otter cutoff",
    siteKind: "household",
    prose:
      "June Pell and Tomas Voss will not agree what this kitchen cooked. The house kept both versions. The desk does not merge them. A ladle and a match safe are the finds: one refuses a blended memory, the other refuses the kiln.",
    objectIds: ["loot.expansion.history.017", "loot.expansion.history.024"],
  },
  {
    id: "scene.history.03",
    index: 3,
    title: "Glass Ferry stones",
    place: "Former bend, now orchard grass",
    siteKind: "vanished-crossing",
    prose:
      "The crossing is gone. The stones remember a fare desk. Ellis can log a passage the water will not honor, and Quill can press a page that still contains a refusal. Neither act puts a boat back on the creek.",
    objectIds: ["loot.expansion.history.033", "loot.expansion.history.037"],
  },
  {
    id: "scene.history.04",
    index: 4,
    title: "Cut-Bank root cellar",
    place: "Former orchard, Cut-Bank",
    siteKind: "former-orchard",
    prose:
      "The cellar draft moves, and the wall above has a gap Lottie scraped a measure out of defending. Restoring the number makes the gap a width again. The smudge pot only shows where the air goes.",
    objectIds: ["loot.expansion.history.049", "loot.expansion.history.054"],
  },
  {
    id: "scene.history.05",
    index: 5,
    title: "Wick powder shed",
    place: "Wick Quarry",
    siteKind: "quarry",
    prose:
      "Ade Nye left a count of a charge that was never set, and a pail with a stone biscuit from a joke that soured. Read the slate. Open the pail. Do not wipe, and do not eat.",
    objectIds: ["loot.expansion.history.065", "loot.expansion.history.072"],
  },
  {
    id: "scene.history.06",
    index: 6,
    title: "Lantern Crossing pier",
    place: "North of the cutoff",
    siteKind: "vanished-crossing",
    prose:
      "The pier keeps one lens the creek polished. Focused, it reads the end of the guide-chain and not a continuation. The crossing stays vanished.",
    objectIds: ["loot.expansion.history.048"],
  },
  {
    id: "scene.history.07",
    index: 7,
    title: "Wren press barn",
    place: "Cut-Bank",
    siteKind: "former-orchard",
    prose:
      "Lottie’s barn still smells of residue and lamp oil. The knife can prove the well-tree is alive. The frost lantern can make a soot note readable. Neither one opens a season.",
    objectIds: ["loot.expansion.history.050", "loot.expansion.history.063"],
  },
  {
    id: "scene.history.08",
    index: 8,
    title: "The Absence Room",
    place: "Seminary Cut, Ellis’s house",
    siteKind: "household",
    prose:
      "Fourteen years of a house that was not quite empty. Calder’s cracked spectacles disagree with themselves about dates. Ellis’s key opens the latch and not the record desk. The room can be entered without being solved.",
    objectIds: ["loot.expansion.history.023", "loot.expansion.history.032"],
  },
  {
    id: "scene.history.09",
    index: 9,
    title: "Tram terminus",
    place: "Wick Quarry",
    siteKind: "quarry",
    prose:
      "Spoil at the end of the tram still holds an incomplete plug-and-feather set. The pair that remains will split a small block. The feather in the adit is not a reason to go looking.",
    objectIds: ["loot.expansion.history.068"],
  },
  {
    id: "scene.history.10",
    index: 10,
    title: "Pattern loft",
    place: "Moth & Ives, Marrow Notch",
    siteKind: "workshop",
    prose:
      "Nessa Ives kept a line of type locked and a shrink rule honest. Proof the line if you need a copy. Measure the maple if you need a length. Do not build the stool the pencil mentions, and do not post the ferry line in town.",
    objectIds: ["loot.expansion.history.012", "loot.expansion.history.015"],
  },
  {
    id: "scene.history.11",
    index: 11,
    title: "Otter ice road",
    place: "Creek cutoff",
    siteKind: "vanished-crossing",
    prose:
      "Gravel where a winter road used to take people across the cutoff. A whistle in it counts fourteen and stops. Calder already counts fourteen. The whistle does not get a fifteenth click.",
    objectIds: ["loot.expansion.history.040"],
  },
  {
    id: "scene.history.12",
    index: 12,
    title: "Vein-mouth well",
    place: "Cut-Bank, where the quarry bed surfaces",
    siteKind: "quarry",
    prose:
      "The orchard well is cut into the same marble Wick worked. A core with a scraped depth seats on the hairline once the number is written back beside the words that survived. Same bed. Not a rite.",
    objectIds: ["loot.expansion.history.071"],
  },
];

export const FEATURED_IDS: readonly string[] = SCENES.flatMap((scene) => [...scene.objectIds]);
