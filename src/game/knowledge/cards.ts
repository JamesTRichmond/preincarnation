import { lootId } from "./ids.ts";
import type { Card } from "./types.ts";

const c = (
  n: number,
  name: string,
  suit: Card["suit"],
  type: Card["type"],
  timing: Card["timing"],
  winterLearned: number,
  cost: [number, number, number],
  effects: Card["effects"],
  flavor: string,
): Card => ({
  id: lootId(n),
  name,
  suit,
  type,
  timing,
  winterLearned,
  cost: { heat: cost[0], ration: cost[1], ink: cost[2] },
  effects,
  flavor,
});

export const CARDS: Card[] = [
  c(1, "Sap Ladder", "sap", "tool", "dawn", 1, [0, 2, 1], [
    { op: "shelter", n: 2 },
    { op: "scout", puzzleId: lootId(41) },
  ], "A notched pole left in the maple lane, still tacky with last March."),
  c(2, "Night Pitch Cup", "sap", "provision", "dawn", 2, [2, 0, 1], [
    { op: "gain", ration: 2 },
    { op: "revealRecipe", recipeId: "recipe.knowledge.pitch-lamp" },
  ], "The cup is pine pitch and a stolen thread, and it beats the dark."),
  c(3, "Ink of Gall", "gall", "lesson", "day", 3, [1, 1, 0], [
    { op: "inscribe", manualId: lootId(62) },
    { op: "gain", ink: 1 },
  ], "Gall and iron remember the tree longer than the leaf does."),
  c(4, "Cedar Coal", "ember", "craft", "day", 4, [0, 2, 0], [
    { op: "kindle" },
    { op: "inscribe", manualId: lootId(63) },
  ], "Cedar coal holds a low red that does not ask to be seen."),
  c(5, "Thaw Interval", "frost", "omen", "dusk", 5, [0, 0, 2], [
    { op: "playMusic", pieceId: lootId(21) },
    { op: "shelter", n: 1 },
  ], "The river answers in one interval when the ice lets go."),
  c(6, "Marrow Wick", "bone", "tool", "day", 6, [1, 1, 0], [
    { op: "mend", n: 1 },
    { op: "inscribe", manualId: lootId(67) },
  ], "Wick of marrow-fat thread, for a split that must hold till morning."),
  c(7, "Second Bark", "sap", "provision", "dawn", 7, [1, 1, 1], [
    { op: "gain", heat: 2 },
    { op: "inscribe", manualId: lootId(71) },
  ], "The second bark peels in curls the color of paper and bread."),
  c(8, "Print in Snow", "gall", "lesson", "day", 8, [0, 1, 1], [
    { op: "scout", puzzleId: lootId(45) },
    { op: "inscribe", manualId: lootId(65) },
  ], "A fox crossed the yard; the snow kept the sentence."),
  c(9, "Boil Stone", "ember", "craft", "day", 9, [2, 0, 0], [
    { op: "revealRecipe", recipeId: "recipe.knowledge.first-boil" },
    { op: "gain", ration: 1 },
  ], "The stone in the pan keeps the boil honest."),
  c(10, "Owl's Measure", "frost", "omen", "dusk", 10, [1, 0, 1], [
    { op: "shelter", n: 1 },
    { op: "scout", puzzleId: lootId(42) },
  ], "The owl's two notes are a measuring rod you can trust."),
  c(11, "Splint of Ash", "bone", "tool", "dawn", 11, [2, 1, 0], [
    { op: "mend", n: 2 },
    { op: "playMusic", pieceId: lootId(30) },
  ], "Ash splint, wet, then bound, then left alone."),
  c(12, "Gall Cake", "gall", "lesson", "any", 12, [1, 0, 1], [
    { op: "inscribe", manualId: lootId(76) },
    { op: "gain", ink: 1 },
  ], "The cake of ink dries darker than the liquid you trusted."),
  c(13, "River Blind", "frost", "omen", "dusk", 13, [1, 0, 1], [
    { op: "shelter", n: 1 },
    { op: "playMusic", pieceId: lootId(33) },
  ], "Snow glare teaches the hand to find the path without the eye."),
  c(14, "Sugar Cloth", "sap", "provision", "dawn", 14, [0, 1, 1], [
    { op: "gain", ration: 1 },
    { op: "inscribe", manualId: lootId(79) },
  ], "Cloth that has held sugar will draw a clean line through sap."),
  c(15, "Frame Peg", "bone", "tool", "day", 3, [0, 1, 1], [
    { op: "playMusic", pieceId: lootId(28) },
    { op: "store", n: 2 },
  ], "One peg, a quarter turn, and the string tells the truth."),
  c(16, "Resin Thread", "ember", "craft", "day", 6, [1, 0, 1], [
    { op: "revealRecipe", recipeId: "recipe.knowledge.resin-wrap" },
    { op: "mend", n: 1 },
  ], "Resin pulled to a thread will close a handle crack."),
  c(17, "Fourteen Notch", "gall", "lesson", "day", 9, [0, 1, 2], [
    { op: "draw", n: 2 },
    { op: "inscribe", manualId: lootId(77) },
  ], "Fourteen notches on the door, one for each winter you meant to keep."),
  c(18, "Hearth Lattice", "frost", "craft", "day", 11, [2, 1, 0], [
    { op: "shelter", n: 1 },
    { op: "inscribe", manualId: lootId(72) },
  ], "A lattice of green wood over the coals stops the hearth eating itself."),
  c(19, "Deer Path Note", "bone", "omen", "dusk", 13, [0, 1, 1], [
    { op: "playMusic", pieceId: lootId(36) },
    { op: "scout", puzzleId: lootId(50) },
  ], "Deer write a narrow grammar in the crust, and then the night."),
  c(20, "Crock of Salt", "sap", "provision", "dawn", 14, [1, 1, 1], [
    { op: "store", n: 2 },
    { op: "revealRecipe", recipeId: "recipe.knowledge.salt-draw" },
  ], "Salt in a crock does the night work while you sleep."),
];

export const CARDS_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
