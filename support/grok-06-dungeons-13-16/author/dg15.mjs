import { actor, N, obj, room, S, step } from "./lib.mjs";

const surveyorScript = [
  { event: "step-off", note: "Step off the dais. The poured copies start walking." },
  { event: "pull-ladle", tool: "field-chain", note: "Pull the ladle off its mark with the chain." },
  { event: "record-overflow", tool: "field-book", note: "The glass shows the plot overflowing the county. Record that." },
  { event: "lamp-ticks", tool: "office-lamp", note: "The lamp shows the overflow ticks on the floor." },
  { event: "stand-outside", note: "Stand on the tick outside the seal." },
  { event: "leave-unfinished", note: "Leave the poured Ellis unfinished. The drain opens." },
];

const stampScript = [
  { event: "step-off", note: "Step off the dais." },
  { event: "pull-ladle", tool: "field-chain", note: "Pull the ladle." },
  { event: "stamp-as-drawn", tool: "office-seal", note: "Mistake: stamp the plot as drawn." },
  { event: "plumb-crack", tool: "plumb-bob", note: "The plumb cracks the false boundary." },
  { event: "leave-unfinished", note: "Leave the pouring unfinished." },
];

export const dg15 = [
  room({
    id: "DG15.R01",
    dungeon: "DG15",
    name: "Charterless Gate",
    region: "dg15.foundry",
    checkpoint: true,
    purpose: "There is no charter. Cut the latch. Stamping a false charter also opens it and is remembered.",
    layoutNote: "A gatehouse. The latch is east. The charter nail is empty.",
    tileset: "foundry-brick",
    walls: [{ x: 2, y: 4, w: 4, h: 1 }],
    exits: [S("DG14.R17"), N("DG15.R02", ["dg15.entered"])],
    actors: [actor("gate-clerk", "No clerk", 14, 8, "fixture", ["The nail is empty. That is the charter."], { solid: false })],
    objects: [obj("latch", "Gate latch", 13, 4, "latch", { inscription: "NO CHARTER ON THE NAIL." })],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "latch",
          tool: "field-knife",
          note: "Cut the latch.",
          sets: [
            { flag: "dg15.entered", value: true },
            { flag: "dg15.cutLatch", value: true },
          ],
        }),
        step({ action: "traverse", exit: "north", note: "Enter the foundry.", requires: ["dg15.entered"] }),
      ],
    },
    alternates: [
      {
        id: "false-charter",
        when: { op: "always" },
        steps: [
          step({
            action: "use-tool",
            target: "latch",
            tool: "office-seal",
            note: "Stamp a false charter. The gate accepts the office and remembers it.",
            sets: [
              { flag: "dg15.entered", value: true },
              { flag: "dg15.falseCharter", value: true },
            ],
          }),
          step({ action: "traverse", exit: "north", note: "Enter.", requires: ["dg15.entered"] }),
        ],
      },
    ],
  }),
  room({
    id: "DG15.R02",
    dungeon: "DG15",
    name: "Intake of Years",
    region: "dg15.foundry",
    purpose: "Cast blocks of fourteen years. Jam the press with the rod. Riding a block is a stated hazard, not the path.",
    layoutNote: "A press occupies the west. The aisle is east of it. Blocks are marked on the floor.",
    walls: [{ x: 2, y: 3, w: 4, h: 3 }],
    tiles: [
      { x: 12, y: 4, tile: "+" },
      { x: 13, y: 4, tile: "+" },
      { x: 14, y: 4, tile: "+" },
    ],
    exits: [S("DG15.R01"), N("DG15.R03", ["dg15.pressJammed"])],
    actors: [actor("press-boss", "Press", 14, 8, "fixture", ["Each block is fourteen years. The rod in the socket stops the ram."], { solid: false })],
    objects: [
      obj("press-socket", "Press socket", 6, 7, "socket"),
      obj("year-blocks", "Year blocks", 13, 6, "blocks", { inscription: "14 / 14 / 14" }),
    ],
    death: {
      hazards: [
        {
          id: "ram",
          tiles: [
            { x: 12, y: 4 },
            { x: 13, y: 4 },
            { x: 14, y: 4 },
          ],
          tell: "year-blocks",
          fatal: true,
          effect: "crushed",
          unless: "dg15.pressJammed",
        },
      ],
    },
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "press-socket",
          tool: "range-rod",
          note: "Jam the ram. The blocks stop.",
          sets: ["dg15.pressJammed"],
        }),
        step({ action: "traverse", exit: "north", note: "Walk the stilled aisle.", requires: ["dg15.pressJammed"] }),
      ],
    },
  }),
  room({
    id: "DG15.R03",
    dungeon: "DG15",
    name: "Mold of Bodies",
    region: "dg15.foundry",
    purpose: "Coats on forms. The needle spins because too many futures are present. Reading the mold tags is the door.",
    layoutNote: "Three forms west. The aisle is clear. Tags hang on the east.",
    walls: [
      { x: 2, y: 3, w: 3, h: 1 },
      { x: 2, y: 6, w: 3, h: 1 },
    ],
    exits: [S("DG15.R02"), N("DG15.R04", ["dg15.moldsRead"])],
    actors: [actor("forms", "Unpoured forms", 4, 4, "fixture", ["We are sizes, not people."], { solid: false })],
    objects: [
      obj("mold-tags", "Mold tags", 13, 4, "tags", { inscription: "COAT, COAT, COAT. NO NAMES." }),
      obj("needle-hook", "Needle hook", 14, 7, "hook"),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "needle-hook",
          tool: "marble-needle",
          note: "Hang the needle. It spins and does not point.",
          sets: ["dg15.needleSpun"],
        }),
        step({
          action: "use-tool",
          target: "mold-tags",
          tool: "field-book",
          note: "Copy the tags.",
          requires: ["dg15.needleSpun"],
          sets: ["dg15.moldsRead"],
        }),
        step({ action: "traverse", exit: "north", note: "Leave the molds.", requires: ["dg15.moldsRead"] }),
      ],
    },
  }),
  room({
    id: "DG15.R04",
    dungeon: "DG15",
    name: "Pipe Valves",
    region: "dg15.foundry",
    purpose: "Open the valves in the order on the work ticket. A wrong valve vents steam. Three vents kill.",
    layoutNote: "Three valves along the west. The ticket is posted east. Steam grates are tiles.",
    walls: [{ x: 12, y: 6, w: 3, h: 1 }],
    tiles: [
      { x: 4, y: 5, tile: "+" },
      { x: 7, y: 5, tile: "+" },
    ],
    exits: [S("DG15.R03"), N("DG15.R05", ["dg15.valvesOpen"])],
    actors: [actor("pipe", "Pipe", 14, 8, "fixture", ["The ticket is the order. Steam is the correction."], { solid: false })],
    objects: [
      obj("ticket", "Work ticket", 13, 3, "ticket", { inscription: "ORDER: VALVE 1, VALVE 2, VALVE 3." }),
      obj("valve-1", "Valve 1", 4, 3, "valve"),
      obj("valve-2", "Valve 2", 7, 3, "valve"),
      obj("valve-3", "Valve 3", 4, 7, "valve"),
    ],
    orderPuzzle: {
      id: "valves",
      sequence: ["valve-1", "valve-2", "valve-3"],
      completeFlag: "dg15.valvesOpen",
      resetOnMismatch: true,
      deathAt: 3,
    },
    death: {
      hazards: [
        {
          id: "steam",
          tiles: [
            { x: 4, y: 5 },
            { x: 7, y: 5 },
          ],
          tell: "ticket",
          fatal: false,
          effect: "steam-strike",
          note: "The third steam strike is fatal. Fatal threshold lives on the order puzzle.",
        },
      ],
    },
    solution: {
      when: { op: "always" },
      steps: [
        step({ action: "interact", target: "ticket", note: "Read the order.", sets: ["dg15.ticketRead"] }),
        step({
          action: "use-tool",
          target: "valve-1",
          tool: "county-bell",
          note: "Ring valve 1. The bell is how a valve is called in this room.",
          requires: ["dg15.ticketRead"],
          sets: ["dg15.valve1"],
        }),
        step({
          action: "use-tool",
          target: "valve-2",
          tool: "county-bell",
          note: "Ring valve 2.",
          requires: ["dg15.valve1"],
          sets: ["dg15.valve2"],
        }),
        step({
          action: "use-tool",
          target: "valve-3",
          tool: "county-bell",
          note: "Ring valve 3. The steam settles and the door opens.",
          requires: ["dg15.valve2"],
          sets: ["dg15.valvesOpen"],
        }),
        step({ action: "traverse", exit: "north", note: "Go on.", requires: ["dg15.valvesOpen"] }),
      ],
    },
  }),
  room({
    id: "DG15.R05",
    dungeon: "DG15",
    name: "Blueprint Gallery",
    region: "dg15.foundry",
    purpose: "The glass clicks only on the station whose number is also painted on the floor. You match what you see.",
    layoutNote: "Three stations. The floor paint is an object you read. The matching station is marked 4, same as the paint.",
    walls: [{ x: 2, y: 6, w: 4, h: 1 }],
    exits: [S("DG15.R04"), N("DG15.R06", ["dg15.blueprintAligned"])],
    actors: [actor("drawer", "Drawer", 14, 8, "npc", ["Don't remember a number from town. Read the floor."])],
    objects: [
      obj("floor-paint", "Floor paint", 4, 4, "paint", { inscription: "STATION 4" }),
      obj("station-2", "Station 2", 12, 3, "station", { inscription: "2" }),
      obj("station-4", "Station 4", 14, 3, "station", { inscription: "4" }),
      obj("station-7", "Station 7", 13, 6, "station", { inscription: "7" }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({ action: "interact", target: "floor-paint", note: "Read the floor. It says station 4.", sets: ["dg15.floor4"] }),
        step({
          action: "use-tool",
          target: "station-4",
          tool: "transit-glass",
          note: "Sight station 4. The glass clicks and the blueprint seats.",
          requires: ["dg15.floor4"],
          sets: ["dg15.blueprintAligned"],
        }),
        step({ action: "traverse", exit: "north", note: "Leave the gallery.", requires: ["dg15.blueprintAligned"] }),
      ],
    },
  }),
  room({
    id: "DG15.R06",
    dungeon: "DG15",
    name: "Punch Clock",
    region: "dg15.foundry",
    purpose: "Critical witness. Moving the clock off the door exposes the names burned inside the glass.",
    layoutNote: "The clock stands in front of the north approach, on a floor tile beside the aisle, not on the door.",
    walls: [{ x: 3, y: 4, w: 4, h: 1 }],
    exits: [S("DG15.R05"), N("DG15.R07", ["disc.erased.foundryClock"])],
    actors: [actor("clock-hand", "Minute hand", 4, 8, "fixture", ["I was filed as a hand. Move the case."], { solid: false })],
    objects: [
      obj("punch-clock", "Punch clock", 13, 4, "clock", {
        inscription: "INSIDE THE GLASS, AFTER IT MOVES: NAMES WITH NO CARDS.",
      }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "interact",
          target: "punch-clock",
          note: "Shove the clock off the door. The names inside the glass are copied into the book.",
          sets: ["disc.erased.foundryClock", "dg15.clockMoved"],
        }),
        step({ action: "traverse", exit: "north", note: "Pass where the clock stood.", requires: ["disc.erased.foundryClock"] }),
      ],
    },
  }),
  room({
    id: "DG15.R07",
    dungeon: "DG15",
    name: "Rejected Pattern",
    region: "dg15.foundry",
    purpose: "Critical witness of the Quiet Household. The pattern is stamped NOT A FUTURE. Copying the rejection slip opens the next door.",
    layoutNote: "A mold no machine will pour: three bowl-shapes in the floor paint, and a slip on a nail.",
    walls: [{ x: 2, y: 6, w: 5, h: 1 }],
    tiles: [
      { x: 4, y: 4, tile: "+" },
      { x: 6, y: 4, tile: "+" },
      { x: 8, y: 4, tile: "+" },
    ],
    exits: [S("DG15.R06"), N("DG15.R08", ["disc.quiet.rejectedPattern"])],
    actors: [actor("pattern", "Rejected pattern", 14, 8, "fixture", ["We are not a future the foundry will pour."], { solid: false })],
    objects: [
      obj("rejection-slip", "Rejection slip", 13, 4, "slip", {
        inscription: "NOT A FUTURE. THREE BOWLS. DO NOT POUR.",
      }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "rejection-slip",
          tool: "field-book",
          note: "Copy the rejection slip. It is not a loot key. The door reads the book.",
          sets: ["disc.quiet.rejectedPattern"],
        }),
        step({ action: "traverse", exit: "north", note: "The next door opens.", requires: ["disc.quiet.rejectedPattern"] }),
      ],
    },
  }),
  room({
    id: "DG15.R08",
    dungeon: "DG15",
    name: "Family Molds",
    region: "dg15.foundry",
    purpose: "Three molds echo the family decision. The catwalk is broken for everyone and the chain repairs it.",
    layoutNote: "Three molds off the aisle. A gap in the catwalk is a void tile at x=12,y=5, with posts on either side.",
    walls: [{ x: 2, y: 3, w: 3, h: 3 }],
    tiles: [{ x: 12, y: 5, tile: "V" }],
    exits: [S("DG15.R07"), N("DG15.R09", ["dg15.familyArchPassed"])],
    actors: [actor("molds", "Family molds", 4, 7, "fixture", ["Warm or cold is not the door. The gap is the door."], { solid: false })],
    objects: [
      obj("mold-row", "Mold row", 4, 8, "molds", {
        textByDecision: {
          domain: "family",
          reunited: "The reunited mold is warm. The other two are cold.",
          scattered: "All three molds are half-poured and cooling.",
          estranged: "The molds face away from each other.",
          unknown: "The molds have no tags from your household.",
        },
      }),
      obj("catwalk-post", "Catwalk post", 11, 6, "post"),
    ],
    death: {
      hazards: [
        {
          id: "catwalk-gap",
          tiles: [{ x: 12, y: 5 }],
          tell: "mold-row",
          fatal: true,
          effect: "fall",
          unless: "dg15.familyArchPassed",
        },
      ],
    },
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "catwalk-post",
          tool: "field-chain",
          note: "Bridge the catwalk gap. The painted length on the post is 2 links.",
          sets: ["dg15.familyArchPassed"],
        }),
        step({ action: "traverse", exit: "north", note: "Cross.", requires: ["dg15.familyArchPassed"] }),
      ],
    },
  }),
  room({
    id: "DG15.R09",
    dungeon: "DG15",
    name: "Tray Fields",
    region: "dg15.foundry",
    purpose: "Future fields in trays. The lamp shows the safe catwalk. The farm decision changes which tray is green.",
    layoutNote: "Trays west. Catwalk stations east. Steam tiles between.",
    walls: [{ x: 2, y: 4, w: 3, h: 2 }],
    tiles: [
      { x: 8, y: 5, tile: "+" },
      { x: 10, y: 6, tile: "+" },
    ],
    exits: [S("DG15.R08"), N("DG15.R10", ["dg15.traysPassed"])],
    actors: [actor("tray-hand", "Tray hand", 14, 8, "npc", ["Green is not safe. Lit is safe."])],
    objects: [
      obj("trays", "Field trays", 4, 7, "trays", {
        textByDecision: {
          domain: "farm",
          prepared: "The tray you helped the farm keep is the one with a real fence.",
          neglected: "Every tray is the same thin green.",
          opposed: "The fenced tray is marked OFFICE.",
          unknown: "The trays are unlabeled.",
        },
      }),
      obj("lit-catwalk", "Lit catwalk", 13, 4, "catwalk", { note: "The lamp makes this rail visible." }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "lit-catwalk",
          tool: "office-lamp",
          note: "Light the catwalk and walk it.",
          sets: ["dg15.traysPassed"],
        }),
        step({ action: "traverse", exit: "north", note: "Leave the trays.", requires: ["dg15.traysPassed"] }),
      ],
    },
  }),
  room({
    id: "DG15.R10",
    dungeon: "DG15",
    name: "Uncoupled Wheels",
    region: "dg15.foundry",
    purpose: "Two wheels with no water. The chain couples them. A prepared mill has a side gate; it is a shortcut, not the only path.",
    layoutNote: "Two wheel pits west and east, shown as floor hooks. A side gate is north-east as an object.",
    walls: [
      { x: 3, y: 3, w: 2, h: 2 },
      { x: 13, y: 3, w: 2, h: 2 },
    ],
    exits: [S("DG15.R09"), N("DG15.R11", ["dg15.wheelsCoupled"])],
    actors: [actor("wheel-note", "Wheel note", 7, 8, "fixture", ["Couple them. Water is not coming."], { solid: false })],
    objects: [
      obj("wheel-a", "West wheel", 6, 4, "wheel"),
      obj("wheel-b", "East wheel", 12, 6, "wheel"),
      obj("mill-gate", "Prepared gate", 14, 7, "gate", {
        textByDecision: {
          domain: "mill",
          prepared: "The gate you helped the mill keep is already unlatched.",
          neglected: "The side gate is latched and has no mill behind it.",
          opposed: "The side gate is nailed by the office.",
          unknown: "The side gate has no record.",
        },
      }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "wheel-a",
          tool: "field-chain",
          note: "Couple west wheel to east wheel.",
          sets: ["dg15.wheelsCoupled"],
        }),
        step({ action: "traverse", exit: "north", note: "The coupled wheels lift the north door.", requires: ["dg15.wheelsCoupled"] }),
      ],
    },
    alternates: [
      {
        id: "prepared-gate",
        when: { op: "decision", decision: "mill", in: ["prepared"] },
        steps: [
          step({
            action: "interact",
            target: "mill-gate",
            note: "Take the already unlatched mill gate.",
            sets: ["dg15.wheelsCoupled", "dg15.usedPreparedMill"],
          }),
          step({ action: "traverse", exit: "north", note: "Go through.", requires: ["dg15.wheelsCoupled"] }),
        ],
      },
    ],
  }),
  room({
    id: "DG15.R11",
    dungeon: "DG15",
    name: "Cooling Ferry",
    region: "dg15.foundry",
    purpose: "A ferry is cooling. The walkway always passes. If the crossing was prepared, you may take the casting; Distribute does not require the casting.",
    layoutNote: "A mold of a scow in the west pit. A walkway of bridge tiles runs east of the aisle.",
    walls: [{ x: 2, y: 3, w: 4, h: 3 }],
    tiles: [
      { x: 12, y: 4, tile: ":" },
      { x: 13, y: 4, tile: ":" },
      { x: 14, y: 4, tile: ":" },
    ],
    exits: [S("DG15.R10"), N("DG15.R12", ["dg15.ferryFloorPassed"])],
    actors: [actor("cooler", "Cooler", 14, 8, "npc", ["The walkway is poured solid. The scow is optional."])],
    objects: [
      obj("walkway", "Solid walkway", 14, 6, "walk"),
      obj("ferry-casting", "Ferry casting", 6, 7, "casting", {
        textByDecision: {
          domain: "crossing",
          prepared: "The casting will hold if you take it. The crossing you helped can use it later.",
          neglected: "The casting cracks if you lift it. Leave it.",
          opposed: "The casting is stamped OFFICE and will not leave the pit.",
          unknown: "The casting has no crossing to belong to.",
        },
      }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({ action: "interact", target: "walkway", note: "Take the solid walkway.", sets: ["dg15.ferryFloorPassed"] }),
        step({ action: "traverse", exit: "north", note: "Go on.", requires: ["dg15.ferryFloorPassed"] }),
      ],
    },
    alternates: [
      {
        id: "take-casting",
        when: { op: "decision", decision: "crossing", in: ["prepared"] },
        steps: [
          step({
            action: "interact",
            target: "ferry-casting",
            note: "Take the casting. It is a diegetic proof, not a Distribute requirement.",
            sets: ["item.preparedFerryCasting", "dg15.ferryFloorPassed"],
          }),
          step({ action: "traverse", exit: "north", note: "Leave with or without using it yet.", requires: ["dg15.ferryFloorPassed"] }),
        ],
      },
    ],
  }),
  room({
    id: "DG15.R12",
    dungeon: "DG15",
    name: "Unlicensed Stack",
    region: "dg15.foundry",
    purpose: "The plumb shows the vein under the stack. The rod bridges a two-tile gap whose length is painted on the rim.",
    layoutNote: "A shaft rail. Void at (12,5). Rim paint at the south of the shaft.",
    walls: [{ x: 3, y: 3, w: 2, h: 5 }],
    tiles: [
      { x: 12, y: 5, tile: "V" },
      { x: 13, y: 5, tile: "V" },
    ],
    exits: [S("DG15.R11"), N("DG15.R13", ["dg15.stackCrossed"])],
    actors: [actor("stack", "Stack", 14, 8, "fixture", ["Two tiles. The paint says so. The bob only looks down."], { solid: false })],
    objects: [
      obj("rim-paint", "Rim paint", 6, 4, "paint", { inscription: "GAP 2" }),
      obj("stack-rim", "Stack rim", 11, 6, "rim"),
    ],
    death: {
      hazards: [
        {
          id: "stack-gap",
          tiles: [
            { x: 12, y: 5 },
            { x: 13, y: 5 },
          ],
          tell: "rim-paint",
          fatal: true,
          effect: "fall",
          unless: "dg15.stackCrossed",
        },
      ],
    },
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "stack-rim",
          tool: "plumb-bob",
          note: "The bob shows a vein under the county, not a second world.",
          sets: ["dg15.stackSounded"],
        }),
        step({
          action: "use-tool",
          target: "stack-rim",
          tool: "range-rod",
          note: "Bridge the painted gap of 2.",
          requires: ["dg15.stackSounded"],
          sets: ["dg15.stackCrossed"],
        }),
        step({ action: "traverse", exit: "north", note: "Cross the rim.", requires: ["dg15.stackCrossed"] }),
      ],
    },
  }),
  room({
    id: "DG15.R13",
    dungeon: "DG15",
    name: "Ordering Room",
    region: "dg15.foundry",
    purpose: "The work order says: manufacture one Ellis. Write an objection or stamp the order. Either opens the cooling floor. Neither locks an ending.",
    layoutNote: "A row of desks. The order is on the center desk, off the aisle.",
    walls: [{ x: 2, y: 4, w: 5, h: 1 }],
    exits: [S("DG15.R12"), N("DG15.R14", ["dg15.orderAddressed"])],
    actors: [actor("order-clerk", "Order clerk", 14, 8, "npc", ["The form has two answers I will file. It does not have your ending."])],
    objects: [obj("work-order", "Work order", 12, 4, "order", { inscription: "MANUFACTURE ONE ELLIS." })],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "work-order",
          tool: "field-book",
          note: "Write the objection in the book and file it on the order.",
          sets: ["dg15.orderAddressed", "disc.surveyor.objectionFiled"],
        }),
        step({ action: "traverse", exit: "north", note: "The cooling floor opens.", requires: ["dg15.orderAddressed"] }),
      ],
    },
    alternates: [
      {
        id: "stamp-order",
        when: { op: "always" },
        steps: [
          step({
            action: "use-tool",
            target: "work-order",
            tool: "office-seal",
            note: "Stamp the order. This does not select Keep, Close, or Distribute.",
            sets: ["dg15.orderAddressed", "dg15.authorizedManufacture"],
          }),
          step({ action: "traverse", exit: "north", note: "Go on.", requires: ["dg15.orderAddressed"] }),
        ],
      },
    ],
  }),
  room({
    id: "DG15.R14",
    dungeon: "DG15",
    name: "Unpoured Floor",
    region: "dg15.foundry",
    purpose: "Void of unpoured metal. Cross it embryonic. The coat anchors on the near lip.",
    layoutNote: "A lip of floor, then void, then a far lip. Door landings stay floor.",
    walls: [{ x: 2, y: 7, w: 4, h: 1 }],
    tiles: [
      { x: 7, y: 5, tile: "V" },
      { x: 8, y: 5, tile: "V" },
      { x: 10, y: 5, tile: "V" },
      { x: 11, y: 5, tile: "V" },
    ],
    exits: [S("DG15.R13"), N("DG15.R15", ["dg15.unpouredCrossed"])],
    actors: [actor("lip-sign", "Lip sign", 14, 8, "fixture", ["Anchor. Needle. Lead. Then the coat comes back."], { solid: false })],
    objects: [
      obj("near-lip", "Near lip peg", 4, 4, "peg"),
      obj("far-lip", "Far lip", 14, 4, "station"),
    ],
    death: {
      hazards: [
        {
          id: "unpoured",
          tiles: [
            { x: 7, y: 5 },
            { x: 8, y: 5 },
            { x: 10, y: 5 },
            { x: 11, y: 5 },
          ],
          tell: "near-lip",
          fatal: true,
          unless: "meta.embryonic",
          effect: "sink",
        },
      ],
    },
    solution: {
      when: { op: "always" },
      steps: [
        step({ action: "use-tool", target: "near-lip", tool: "borrowed-coat", note: "Anchor the coat.", sets: ["dg15.lipAnchor"] }),
        step({
          action: "use-tool",
          target: "far-lip",
          tool: "marble-needle",
          note: "Enter the form and start across.",
          requires: ["dg15.lipAnchor"],
          sets: ["dg15.lipNeedle", "meta.embryonic"],
        }),
        step({
          action: "use-tool",
          target: "far-lip",
          tool: "sounding-lead",
          note: "Sound the far lip. It holds.",
          requires: ["dg15.lipNeedle"],
          sets: ["dg15.unpouredCrossed"],
        }),
        step({
          action: "interact",
          target: "near-lip",
          note: "Take the coat. End the form.",
          requires: ["dg15.unpouredCrossed"],
          sets: ["dg15.lipCoatBack"],
          clears: ["meta.embryonic"],
        }),
        step({ action: "traverse", exit: "north", note: "Enter the antechamber.", requires: ["dg15.unpouredCrossed"] }),
      ],
    },
  }),
  room({
    id: "DG15.R15",
    dungeon: "DG15",
    name: "Antechamber of One Ellis",
    region: "dg15.foundry",
    checkpoint: true,
    purpose: "The plaques say what the foundry will try to do. Reading them opens the floor. They do not choose your ending.",
    layoutNote: "Three plaques on the west wall. Open floor to the north door.",
    walls: [{ x: 2, y: 3, w: 1, h: 5 }],
    exits: [S("DG15.R14"), N("DG15.R16", ["dg15.anteReady"])],
    actors: [actor("plaque-voice", "Plaque voice", 14, 8, "fixture", ["One body, filed. That is the offer on the other side of the door."], { solid: false })],
    objects: [
      obj("plaque-keepish", "Plaque", 4, 3, "plaque", { inscription: "A LIFE CAN BE KEPT OPEN." }),
      obj("plaque-closeish", "Plaque", 4, 5, "plaque", { inscription: "A LIFE CAN BE CLOSED." }),
      obj("plaque-dist", "Plaque", 4, 7, "plaque", { inscription: "A LIFE CAN BE HANDED TO WHAT WAS PREPARED." }),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({ action: "interact", target: "plaque-keepish", note: "Read the first plaque.", sets: ["dg15.plaque1"] }),
        step({ action: "interact", target: "plaque-closeish", note: "Read the second.", requires: ["dg15.plaque1"], sets: ["dg15.plaque2"] }),
        step({
          action: "interact",
          target: "plaque-dist",
          note: "Read the third. The floor door opens. You have not chosen.",
          requires: ["dg15.plaque2"],
          sets: ["dg15.anteReady"],
        }),
        step({ action: "traverse", exit: "north", note: "Enter the Surveyor's floor.", requires: ["dg15.anteReady"] }),
      ],
    },
  }),
  room({
    id: "DG15.R16",
    dungeon: "DG15",
    name: "Floor of the Surveyor",
    region: "dg15.foundry",
    purpose: "Boss. Stop the pour and leave it unfinished.",
    layoutNote: "A dais, a ladle rail, and a ring of floor ticks. The Surveyor stands off the aisle.",
    walls: [
      { x: 3, y: 6, w: 4, h: 1 },
      { x: 12, y: 6, w: 3, h: 1 },
    ],
    exits: [S("DG15.R15"), N("DG15.R17", ["dg15.surveyorUnfinished"])],
    actors: [
      actor("surveyor", "The Surveyor of Ellis", 13, 4, "boss", [
        "The county will fit you if you stop changing.",
        "I poured a life the office can file.",
        "Keep it, close it, or hand it to what you have prepared. Those are the words on my form.",
      ]),
    ],
    objects: [
      obj("ladle", "Ladle", 4, 4, "ladle"),
      obj("plot", "Plot marks", 6, 4, "plot", { inscription: "THE GLASS SHOWS THIS PLOT PAST THE COUNTY LINE." }),
      obj("ticks", "Overflow ticks", 12, 4, "ticks"),
    ],
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "boss",
          target: "surveyor",
          machine: "boss.surveyor-of-ellis",
          script: surveyorScript,
          note: "Leave the Surveyor of Ellis unfinished.",
          sets: ["dg15.surveyorUnfinished"],
        }),
        step({ action: "traverse", exit: "north", note: "The drain is open.", requires: ["dg15.surveyorUnfinished"] }),
      ],
    },
    alternates: [
      {
        id: "stamp-then-plumb",
        when: { op: "always" },
        steps: [
          step({
            action: "boss",
            target: "surveyor",
            machine: "boss.surveyor-of-ellis",
            script: stampScript,
            note: "Recover from stamping the plot by cracking it with the plumb.",
          }),
          step({ action: "traverse", exit: "north", note: "Leave.", requires: ["dg15.surveyorUnfinished"] }),
        ],
      },
    ],
  }),
  room({
    id: "DG15.R17",
    dungeon: "DG15",
    name: "The Drain",
    region: "dg15.foundry",
    purpose: "The foundry drains into the Marble Vein. The needle points down. This is not a new mythology. It is the unfinished county under the surveyed one.",
    layoutNote: "A sloping floor. A round drain off the aisle. The north door is the drop into the hub, represented as a door.",
    walls: [{ x: 4, y: 3, w: 3, h: 1 }],
    tiles: [{ x: 13, y: 6, tile: "V" }],
    exits: [S("DG15.R16"), N("DG16.HUB", ["dg15.surveyorUnfinished"])],
    actors: [actor("drain-voice", "Drain", 4, 8, "fixture", ["Below this is not a god's country. It is the lives the list did not pour."], { solid: false })],
    objects: [obj("drain-rim", "Drain rim", 12, 4, "rim", { inscription: "THE NEEDLE POINTS DOWN." })],
    death: {
      hazards: [
        {
          id: "open-drain",
          tiles: [{ x: 13, y: 6 }],
          tell: "drain-rim",
          fatal: true,
          effect: "fall",
          note: "The door is the way down. The void tile is not.",
        },
      ],
    },
    solution: {
      when: { op: "always" },
      steps: [
        step({
          action: "use-tool",
          target: "drain-rim",
          tool: "marble-needle",
          note: "The needle points down, toward the vein.",
          sets: ["dg15.needleDown"],
        }),
        step({ action: "traverse", exit: "north", note: "Descend to the threshold well.", requires: ["dg15.surveyorUnfinished"] }),
      ],
    },
  }),
];
