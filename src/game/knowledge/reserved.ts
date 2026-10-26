/** Names treated as already in the host game. The live catalog was not mounted. */

export const RESERVED_CARDS = [
  "Hearthstone",
  "Ration Tin",
  "Wool Cloak",
  "Kindling",
  "Snow Blind",
  "First Frost",
  "Last Frost",
  "Cellar Key",
  "Birch Tea",
  "Bone Needle",
  "Winter Coat",
  "Storm Lantern",
  "Dry Ration",
  "Firewood",
  "Ice Fishing",
  "Snowshoes",
  "Cabin Fever",
  "Blizzard",
  "Evergreen",
  "Flint and Steel",
  "Wool Blanket",
  "Soup Stone",
  "Red Scarf",
];

export const RESERVED_SONGS = [
  "Hearth Hum",
  "Night Watch",
  "Thaw Bell",
  "Sugar Reel",
  "Wolf Interval",
  "Amazing Grace",
  "Twinkle Twinkle",
  "Ode to Joy",
  "Mary Had a Little Lamb",
  "Silent Night",
  "Jingle Bells",
  "Greensleeves",
  "Scarborough Fair",
];

export const RESERVED_PUZZLES = ["First Wick", "Pantry Loop", "Window Frost", "Sugar House"];

export const RESERVED_RECIPES = [
  "Birch Tea",
  "Hardtack",
  "Pine Pitch Salve",
  "Render Tallow",
  "Salt Pork",
  "Spruce Needle Tea",
  "Ash Lye",
  "Bannock",
  "Berry Leather",
  "Bone Broth",
  "Maple Syrup",
  "Pemmican",
  "Johnnycake",
  "Succotash",
];

/** Relative pitch prefixes (first pitch subtracted) that this pack must not open with. */
export const BANNED_PITCH_PREFIXES: number[][] = [
  [0, 0, 7, 7, 9, 9, 7],
  [0, 0, 1, 2, 2, 1, 0, -1],
  [0, -1, -2, -1, 0, 0, 0],
  [0, 0, 7, 7, 9, 9, 7, 7],
  [0, 2, 4, 5, 7, 7, 4],
  [0, -2, -4, -5, -7, -5, -4],
];

export function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
