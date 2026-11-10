/** Sixty interiors. Not overworld screens.
 * Parent is a hub id or a cartogram coordinate.
 * Props are stamped on a 14×9 room. South door returns to the parent.
 */
export const INTERIORS = [
  room("INT-MID-INN", "Stone Mill Inn room", "hub", "HUB-MID-VILLAGE", "The bed is made in a name Ellis has already died out of.", "B1,1,5,2 S8,2 S12,1"),
  room("INT-MID-BAKERY", "Otter bakery", "hub", "HUB-MID-VILLAGE", "The ovens are warm. Nothing is for sale; this is not a shop economy.", "B1,1,3,2 B5,1,3,2 S10,3 S2,5"),
  room("INT-MID-BOOK", "Green bookstore", "hub", "HUB-MID-VILLAGE", "Shelves face the green. One spine is blank every time Ellis returns.", "B1,1,2,6 B11,1,2,6 S6,3"),
  room("INT-MID-TAVERN", "South-street tavern", "hub", "HUB-MID-VILLAGE", "The bar keeps a stool empty without calling it a shrine.", "B1,1,8,1 S3,4 S6,4 S9,5"),
  room("INT-MID-RECORDS", "Shire records", "hub", "HUB-MID-VILLAGE", "The Ledger Key is in the open minute-book. It opens civic doors, not a shop.", "B2,1,4,2 S8,1 S10,4 S4,5"),
  room("INT-COL-LIBRARY", "Library stair", "hub", "HUB-MID-COLLEGE", "A public stair, not a staff office. The lower door is the stacks mouth outside.", "B1,1,3,6 S6,2 S8,2 S10,2"),
  room("INT-COL-CHAPEL", "Chapel nave", "hub", "HUB-MID-COLLEGE", "Benches and a quiet that does not ask you to pray.", "B2,2,1,4 B10,2,1,4 S6,1"),
  room("INT-COL-DORM", "Dorm hall", "hub", "HUB-MID-COLLEGE", "Closed doors along a hall. You do not enter the rooms. The hall itself is the interior.", "B1,1,2,2 B4,1,2,2 B7,1,2,2 B10,1,2,2"),
  room("INT-MID-FALLS-STAIR", "Falls stair", "screen", "10,5", "Spray on the steps under the footbridge. A place to stand, not a shortcut.", "S2,2 S6,2 S10,2 B4,5,4,1"),
  room("INT-MID-BRIDGE-WATCH", "Bridge watch", "screen", "8,5", "A fictional watch room on the Middlebury bank of the Pulp Mill bridge.", "B1,1,3,2 S8,2 S11,4"),
  room("INT-COL-OBSERVATORY", "Knoll observatory", "screen", "9,4", "A small dome on the construction hill. The warp of year 70 is outside, on the grass.", "B5,1,4,3 S2,5 S11,5"),
  room("INT-VER-CLERK", "City clerk", "hub", "HUB-VER-FALLS", "Counter, bell, a clock that gains fourteen years when you look away.", "B1,1,6,2 S8,4 S3,4"),
  room("INT-VER-LOFT", "Shipyard loft", "hub", "HUB-VER-FALLS", "Fictional loft above the landing. The city's shipyard years are the subject, not a copied museum.", "B1,1,4,1 B1,3,2,3 S9,2"),
  room("INT-VER-CAFE", "Falls cafe", "hub", "HUB-VER-FALLS", "Two tables and the sound of the falls through the wall.", "B2,2,3,2 B8,2,3,2 S5,5"),
  room("INT-VER-CATWALK", "Catwalk booth", "hub", "HUB-VER-FALLS", "A booth that looks at the race. After year 56 the window shows a gap.", "B1,1,4,2 S10,2 S10,4"),
  room("INT-VER-MILL-OFFICE", "Mill office", "screen", "5,6", "Ledgers of water, not of money you can spend.", "B1,1,5,2 S8,3 S4,5"),
  room("INT-VER-BOATHOUSE", "City boathouse", "screen", "2,6", "Oars on pegs that are not the Void Oar. Creek Boots are not here.", "B1,1,1,5 B12,1,1,5 S6,3"),
  room("INT-BRI-CAFE", "Park cafe", "hub", "HUB-BRI-PARK", "Counter toward the park. You can sit. You cannot buy a craft.", "B1,1,4,2 S7,3 S10,3"),
  room("INT-BRI-HALL", "Town hall lobby", "hub", "HUB-BRI-PARK", "A lobby and a closed meeting door. The lobby is as far as the building goes.", "B8,1,4,3 S2,3 S2,5"),
  room("INT-BRI-POTTERY", "Pottery showroom", "hub", "HUB-BRI-PARK", "Shelves of bowls. They are not components.", "B1,1,2,5 B11,1,2,5 S6,4"),
  room("INT-BRI-GENERAL", "Bristol general", "hub", "HUB-BRI-PARK", "Aisles you can walk. Nothing transfers into an inventory economy.", "B1,2,8,1 S2,4 S6,4 S10,4"),
  room("INT-BRI-SHELTER", "Bartlett shelter", "screen", "12,1", "Three walls and a view of the gorge. The line is cached on the rim, not in here.", "B1,1,4,2 S8,2 S11,5"),
  room("INT-NHV-DEPOT", "Junction depot", "screen", "7,0", "Benches and a board. In year 56 the board is blank.", "B1,3,3,2 B10,3,3,2 S6,1"),
  room("INT-NHV-MILL", "New Haven mill floor", "screen", "7,2", "The stone is still. Flour smell, no wheel.", "B1,1,3,3 B8,4,4,2 S5,2"),
  room("INT-FER-INN", "Harbor inn taproom", "hub", "HUB-FER-BASIN", "A low room, lake light, no quest board.", "B1,1,6,1 S3,3 S8,3"),
  room("INT-FER-GENERAL", "Ferrisburgh general", "hub", "HUB-FER-BASIN", "Nails, rope, and nothing you combine.", "B1,1,3,2 B5,1,3,2 S10,4"),
  room("INT-FER-FARM", "Basin farm kitchen", "hub", "HUB-FER-BASIN", "A kitchen that feeds the people who live there. You may stand in it.", "B1,1,4,2 S8,2 S6,5"),
  room("INT-FER-BOATSHED", "Marsh boatshed", "screen", "3,2", "Creek Boots hang on a peg above the dry floor, off the rotten boardwalk.", "B10,1,2,4 S3,2 S3,4"),
  room("INT-FER-BLIND", "Marsh blind", "screen", "3,1", "A wildlife blind. The slot frames reeds. An encounter does not live here; the thicket does.", "B1,1,12,1 S6,4"),
  room("INT-SAL-STORE", "Landing store", "hub", "HUB-SAL-LANDING", "Bait coolers and a bell. Not a market system.", "B1,1,5,2 S8,3 S4,5"),
  room("INT-SAL-MEETING", "Lake meeting room", "hub", "HUB-SAL-LANDING", "Folding chairs and a map of the shore that does not include the glass.", "B2,2,2,2 B8,2,2,2 S5,5"),
  room("INT-SAL-BOAT", "Dunmore boathouse", "screen", "11,8", "The keeper is present until year 70, then absent. The door still opens.", "B1,1,3,2 B10,1,3,2 S6,4"),
  room("INT-SAL-CABIN", "West cabin", "screen", "9,8", "A cabin above the road that does not flood. The shore below does.", "B1,1,4,2 S9,3 S4,5"),
  room("INT-SAL-GLASS-CHAPEL", "Cove glass chapel", "screen", "10,11", "Fictional. Glass in the walls shows the year you are not in.", "B5,1,4,2 S2,4 S11,4"),
  room("INT-RIP-INN", "Ripton inn", "hub", "HUB-RIP-BREADLOAF", "A small inn room off the meadow, west of the gap.", "B1,1,5,2 S9,2 S9,5"),
  room("INT-RIP-BARN-CLASS", "Meadow barn classroom", "hub", "HUB-RIP-BREADLOAF", "Benches in a barn. It is not a copy of a campus interior.", "B2,2,1,4 B6,2,1,4 B10,2,1,4"),
  room("INT-RIP-NOTCH-CABIN", "Notch cabin", "screen", "12,6", "Frost Notch hangs by the door, on the village side of the windwall.", "B1,1,4,2 S8,2 S11,5"),
  room("INT-RIP-SHELTER", "Falls road shelter", "screen", "13,7", "A shelter west of the windwall, before Texas Falls.", "B1,1,5,2 S9,4"),
  room("INT-RIP-HANCOCK-STORE", "Hancock store", "screen", "15,6", "A counter east of the gap. You only reach it through the windwall.", "B1,1,6,2 S8,4 S4,5"),
  room("INT-LIN-GENERAL", "Lincoln general", "hub", "HUB-LIN-GENERAL", "The corner store. The warp is outside.", "B1,1,4,2 B8,1,4,1 S5,4"),
  room("INT-LIN-MEETING", "Lincoln meeting room", "hub", "HUB-LIN-GENERAL", "Benches and a stove. Town business you can overhear and not join.", "B2,1,2,2 S6,3 S9,3"),
  room("INT-LIN-KITCHEN", "Farm kitchen", "hub", "HUB-LIN-GENERAL", "A kitchen behind the general. Bread, not a recipe system.", "B1,1,3,2 S7,2 S10,4"),
  room("INT-LIN-SUGARHOUSE", "Sugarhouse", "screen", "16,1", "The Sugar Tap is on the evaporator. The lane is north of the washout.", "B1,2,8,2 S10,2 S4,5"),
  room("INT-LIN-FLUME-SHED", "Flume shed", "screen", "14,2", "Tools for the flume. The dungeon mouth is outside, on the walk.", "B1,1,3,3 S8,2 S11,5"),
  room("INT-SHO-CREAMERY", "Creamery floor", "hub", "HUB-SHO-CREAMERY", "Vats and a board. Year 42 the board lists members instead of hours.", "B1,1,3,3 B5,1,3,3 S10,4"),
  room("INT-SHO-CHURCH", "Orchard church hall", "hub", "HUB-SHO-CREAMERY", "A hall, not a dungeon. Hymnals that do not mention the void.", "B2,2,1,3 B10,2,1,3 S6,1"),
  room("INT-SHO-BARN", "Packing barn", "screen", "2,10", "The Orchard Ladder is on the north wall, above crates that are not loot.", "B1,4,6,2 S8,1 S11,1"),
  room("INT-SHO-HOUSE", "Orchard house", "screen", "2,12", "A kitchen window onto rows. The rows are the puzzle, outside.", "B1,1,4,2 S9,3 S6,5"),
  room("INT-SHO-POINT-COTTAGE", "Point cottage", "screen", "1,12", "A cottage at Larrabee's Point. The far shore is not a door.", "B1,1,4,2 S9,2 S9,4"),
  room("INT-ORW-TAVERN", "Common tavern", "hub", "HUB-ORW-COMMON", "A bar toward the common. The empty stool is a habit, not a quest.", "B1,1,7,1 S3,3 S8,4"),
  room("INT-ORW-HALL", "Orwell hall", "hub", "HUB-ORW-COMMON", "A hall with a map that stops at the county line.", "B1,1,4,3 S8,2 S8,4"),
  room("INT-ORW-FARM", "South farmhouse", "screen", "6,12", "Mud room and table. The bluff is outside.", "B1,1,3,2 S7,3 S10,5"),
  room("INT-ORW-VISITOR", "Independence shed", "screen", "4,12", "A fictional shed at the historic gate. It does not reproduce a museum. The tunnels open in year 56, outside.", "B1,1,5,2 S8,3 S4,5"),
  room("INT-ORW-BARN", "Creek barn", "screen", "6,13", "A barn on the way back up from the one-way bluff.", "B1,1,2,5 B11,1,2,5 S6,3"),
  room("INT-QRY-LIME-OFFICE", "Lime office", "screen", "6,6", "A desk of weigh tickets. The lamp is outside on the yard table.", "B1,1,5,2 S8,3 S4,5"),
  room("INT-QRY-TACK", "Morgan gate tack shed", "screen", "6,5", "Fictional shed at the farm gate. The working barns are not entered.", "B1,1,3,3 S8,2 S11,4"),
  room("INT-QRY-BRIDGE-WATCH", "Pulp Mill watch", "screen", "7,5", "The Weybridge side of the covered bridge. You can hear traffic until year 56, then hammers.", "B1,1,4,2 S8,2 S8,5"),
  room("INT-QRY-CUT-SHACK", "Cut shack", "screen", "7,6", "A shack at the dark cut. The lamp is next door in the kiln yard, not locked in here.", "B1,1,3,2 S8,3 S5,5"),
  room("INT-WLS-BLIND", "Goose blind", "screen", "0,9", "A blind on the flats. Quiet is the use of the screen.", "B1,1,12,1 S6,4"),
  room("INT-WLS-KEEPER", "Chimney Point keeper cottage", "screen", "0,10", "The Void Oar is on the table. The bridge outside leaves the county and is not a path.", "B4,1,5,2 S2,4 S11,4"),
].map(parseRoom);

function room(id, name, kind, parent, purpose, props) {
  return { id, name, kind, parent, purpose, props };
}

function parseRoom(row) {
  const props = row.props.split(/\s+/).filter(Boolean).map(parseProp);
  return {
    id: row.id,
    name: row.name,
    parent: row.kind === "hub" ? { kind: "hub", id: row.parent } : { kind: "screen", at: row.parent },
    purpose: row.purpose,
    props,
  };
}

function parseProp(token) {
  const t = token[0];
  const rest = token.slice(1).split(",").map(Number);
  if (rest.length === 4) return { tile: t, x: rest[0], y: rest[1], w: rest[2], h: rest[3] };
  return { tile: t, x: rest[0], y: rest[1], w: 1, h: 1 };
}
