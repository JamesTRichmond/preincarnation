/** Ten hubs. Not counted as overworld screens.
 * Rooms are floor rectangles on a wall field. Doors sit inside rooms.
 * The south entrance returns to the overworld screen `from`.
 */
export const HUBS = [
  {
    id: "HUB-MID-VILLAGE",
    name: "Middlebury village green",
    from: "9,6",
    blurb: "Green and merchant row of the shire town. The Ledger Key is in records.",
    rooms: [
      [1, 1, 8, 6],
      [21, 1, 8, 6],
      [1, 11, 8, 6],
      [21, 11, 8, 6],
      [11, 1, 8, 5],
    ],
    doors: [
      ["INT-MID-INN", 3, 3],
      ["INT-MID-BAKERY", 23, 3],
      ["INT-MID-BOOK", 3, 13],
      ["INT-MID-TAVERN", 23, 13],
      ["INT-MID-RECORDS", 14, 3],
    ],
  },
  {
    id: "HUB-MID-COLLEGE",
    name: "College terrace quad",
    from: "10,4",
    blurb: "A quad above the river. Not a full campus map.",
    rooms: [
      [1, 1, 8, 7],
      [21, 1, 8, 7],
      [8, 1, 14, 4],
    ],
    doors: [
      ["INT-COL-LIBRARY", 3, 3],
      ["INT-COL-CHAPEL", 23, 3],
      ["INT-COL-DORM", 14, 2],
    ],
  },
  {
    id: "HUB-VER-FALLS",
    name: "Vergennes falls green",
    from: "3,5",
    blurb: "City green beside Otter Creek Falls.",
    rooms: [
      [1, 1, 7, 6],
      [22, 1, 7, 6],
      [1, 11, 7, 6],
      [22, 11, 7, 6],
    ],
    doors: [
      ["INT-VER-CLERK", 3, 3],
      ["INT-VER-LOFT", 24, 3],
      ["INT-VER-CAFE", 3, 13],
      ["INT-VER-CATWALK", 24, 13],
    ],
  },
  {
    id: "HUB-BRI-PARK",
    name: "Bristol park",
    from: "11,2",
    blurb: "Village park and the buildings on it.",
    rooms: [
      [1, 1, 8, 6],
      [21, 1, 8, 6],
      [1, 11, 8, 6],
      [21, 11, 8, 6],
    ],
    doors: [
      ["INT-BRI-CAFE", 3, 3],
      ["INT-BRI-HALL", 24, 3],
      ["INT-BRI-POTTERY", 3, 13],
      ["INT-BRI-GENERAL", 24, 13],
    ],
  },
  {
    id: "HUB-FER-BASIN",
    name: "Basin Harbor green",
    from: "2,2",
    blurb: "Harbor green. Masts, not a menu.",
    rooms: [
      [1, 1, 8, 7],
      [21, 1, 8, 7],
      [11, 1, 8, 5],
    ],
    doors: [
      ["INT-FER-INN", 3, 3],
      ["INT-FER-GENERAL", 24, 3],
      ["INT-FER-FARM", 14, 3],
    ],
  },
  {
    id: "HUB-SAL-LANDING",
    name: "Dunmore landing",
    from: "11,8",
    blurb: "Landing on Lake Dunmore, in Salisbury.",
    rooms: [
      [1, 1, 9, 7],
      [20, 1, 9, 7],
    ],
    doors: [
      ["INT-SAL-STORE", 3, 3],
      ["INT-SAL-MEETING", 23, 3],
    ],
  },
  {
    id: "HUB-RIP-BREADLOAF",
    name: "Bread Loaf meadow",
    from: "14,5",
    blurb: "Meadow west of Middlebury Gap. A compressed public green.",
    rooms: [
      [1, 1, 9, 7],
      [20, 1, 9, 7],
    ],
    doors: [
      ["INT-RIP-INN", 3, 3],
      ["INT-RIP-BARN-CLASS", 23, 3],
    ],
  },
  {
    id: "HUB-LIN-GENERAL",
    name: "Lincoln corner",
    from: "15,1",
    blurb: "General, meeting room, and kitchen at the village corner.",
    rooms: [
      [1, 1, 8, 7],
      [21, 1, 8, 7],
      [11, 11, 8, 5],
    ],
    doors: [
      ["INT-LIN-GENERAL", 3, 3],
      ["INT-LIN-MEETING", 24, 3],
      ["INT-LIN-KITCHEN", 14, 13],
    ],
  },
  {
    id: "HUB-SHO-CREAMERY",
    name: "Shoreham creamery square",
    from: "3,9",
    blurb: "Creamery square. Year 42 moves loading talk to the east door, outside.",
    rooms: [
      [1, 1, 10, 7],
      [19, 1, 10, 7],
    ],
    doors: [
      ["INT-SHO-CREAMERY", 3, 3],
      ["INT-SHO-CHURCH", 22, 3],
    ],
  },
  {
    id: "HUB-ORW-COMMON",
    name: "Orwell common",
    from: "6,11",
    blurb: "Southern common. The county ends south of the farms, not here.",
    rooms: [
      [1, 1, 9, 7],
      [20, 1, 9, 7],
    ],
    doors: [
      ["INT-ORW-TAVERN", 3, 3],
      ["INT-ORW-HALL", 23, 3],
    ],
  },
];

export const HUB_W = 30;
export const HUB_H = 18;
