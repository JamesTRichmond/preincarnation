/** The Bell Without a Clapper. Twelve chambers. The race wheel lifts the sluice. The clapper stays sealed. */
export const BELL_ENTRY = { x: 10, y: 28 };

/** Two rows, three tiles. A body fits. North of the gear gallery. */
export const BELL_SLUICE = [
  { x: 8, y: 15 },
  { x: 9, y: 15 },
  { x: 10, y: 15 },
  { x: 8, y: 16 },
  { x: 9, y: 16 },
  { x: 10, y: 16 },
] as const;

export const BELL_WHEEL = { x: 8, y: 23 };

export const BELL_ROOMS = [
  { id: "bell-intake", name: "Intake", x: 10, y: 28 },
  { id: "bell-race", name: "Creek race", x: 8, y: 23 },
  { id: "bell-gears", name: "Gear gallery", x: 10, y: 18 },
  { id: "bell-sluice", name: "Sluice", x: 10, y: 17 },
  { id: "bell-wheel", name: "Wheel chamber", x: 10, y: 13 },
  { id: "bell-span", name: "Platform span", x: 10, y: 8 },
  { id: "bell-weight", name: "Counterweight", x: 10, y: 3 },
  { id: "bell-well", name: "Bell well", x: 24, y: 3 },
  { id: "bell-walk", name: "Keeper's walk", x: 24, y: 8 },
  { id: "bell-loft", name: "Warning loft", x: 24, y: 13 },
  { id: "bell-gallery", name: "Vibration gallery", x: 24, y: 18 },
  { id: "bell-court", name: "Bellkeeper court", x: 26, y: 28 },
] as const;

export const BELL_SRC = [
  "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMvM",
  "MvMM===============================MvM",
  "MvMM===============================MvM",
  "MvMM=============MMM===============MvM",
  "MvMMMMMM===MMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMMMMMM===MMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMM=============MMM===============MvM",
  "MvMM=============MMM===============MvM",
  "MvMM=============MMM===============MvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMM=============MMM===============MvM",
  "MvMM=============MMM===============MvM",
  "MvMM=============MMM===============MvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMM=============MMM===============MvM",
  "MvMM=============MMM===============MvM",
  "MvMM=============MMM===============MvM",
  "MvMMMMMM===MMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMMMMMM===MMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMM=========~~~~MMM===============MvM",
  "MvMM=========~~~~MMM===============MvM",
  "MvMM=========~~~~MMM===============MvM",
  "MvMMMMMM===MMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMMMMMM===MMMMMMMMMMMMMMM===MMMMMMMvM",
  "MvMM=============MMM===============MvM",
  "MvMM======n======MMM======C===S====MvM",
  "MvMM======U======MMM===============MvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMvM",
  "MvMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMvM",
  "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
];
