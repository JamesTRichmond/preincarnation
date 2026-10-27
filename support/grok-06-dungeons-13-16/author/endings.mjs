/** Playable ending sequences. Text is diegetic. 'unknown' means no mapped record, not a missing asset. */

function decisionVignette(ending, domain, title, spawn, lines, input, result) {
  return {
    id: `${ending}.${domain}`,
    domain,
    title,
    spawn,
    observe: lines,
    action: { input, result },
    next: null,
  };
}

function scene(ending, id, title, spawn, text, input, result, variants = []) {
  return {
    id: `${ending}.${id}`,
    domain: null,
    title,
    spawn,
    observe: text,
    variants,
    action: { input, result },
  };
}

const KEEP = "keep";
const CLOSE = "close";
const DIST = "distribute";
const REFUSE = "refuse";

const keepFarm = {
  prepared: "The gate you mended still latches. One unlisted furrow keeps producing because the seam stays open in your keeping, and the farm does not ask the office before it cuts that furrow.",
  neglected: "The lane is thistled. The open seam drafts through a field you did not help, and the draft is not weather. Nothing here knows how to hold what you kept.",
  opposed: "You sided with the office against these acres. They stay fenced to the survey. The seam you kept does not cross that fence.",
  unknown: "No record says you helped this farm. The lane is only a lane. The open seam is elsewhere.",
};
const keepMill = {
  prepared: "The race you helped clear still feeds the wheel. The mill keeps a second, unlisted turning for the seam you held, and it grinds that grain apart from the office books.",
  neglected: "The wheel turns when the creek says so. An open seam adds a shiver to the shaft that the miller cannot use.",
  opposed: "The mill you opposed runs only the hours the office posted. Your open seam is not allowed on the race.",
  unknown: "The mill has no record of you. It runs. It does not answer the seam.",
};
const keepCross = {
  prepared: "The ford you helped keep still takes a cart. The tender knows the seam is open and still decides, alone, when the scow goes.",
  neglected: "The crossing is a rumor of stones. Keeping the seam did not build a way over.",
  opposed: "The crossing is posted shut in your hand as much as the office's. An open seam does not erase the posting.",
  unknown: "No one at the ford remembers your help. Travelers cross or they don't. The seam is not their business.",
};
const keepFamily = {
  reunited: "The kitchen you helped bring back to one table sets a place for the body you still change out of. They do not manage the seam. They know you kept it.",
  scattered: "The household is in more than one house. Keeping the seam gives them no table to put a share on.",
  estranged: "The chairs still face the walls. An open seam in your keeping does not turn them.",
  unknown: "The family has no record of a mending. Supper is ordinary. You are not in it.",
};

const closeFarm = {
  prepared: "The gate you mended still latches. The unlisted furrow is gone. What you helped them grow is only what can be written down, and the books are now complete.",
  neglected: "The thistles remain, and nothing uncanny moves them. Closing the seam made this field ordinary, which is not the same as tended.",
  opposed: "The office fence you backed is the only fence. With the seam shut there is no acre left that the survey failed to name.",
  unknown: "The farm does not remember you. It also does not remember a crack in the air. Both absences look like peace from the road.",
};
const closeMill = {
  prepared: "The race runs true and only true. The second turning you had made room for does not spin. The miller keeps the settlement and loses the unlisted grain.",
  neglected: "The wheel is as you left it. Shutting the seam did not repair a race.",
  opposed: "The posted hours are the only hours. The office gets the county it measured, including this wheel.",
  unknown: "The mill grinds what the creek brings. No one mentions you, or a seam.",
};
const closeCross = {
  prepared: "The scow you helped keep still crosses. It crosses a finished lake. The tender's judgment is ordinary judgment now.",
  neglected: "The ford is as poor as you left it. Closing the seam did not lay stones.",
  opposed: "The posted closure holds. There is no other shore arguing with it anymore.",
  unknown: "Travelers use the crossing or they don't. The water is only water.",
};
const closeFamily = {
  reunited: "The table you helped pull back together stays set. No extra place appears for a life that was not poured. They live in the one county.",
  scattered: "The houses stay separate. A shut seam does not gather them.",
  estranged: "The turned chairs stay turned. Nothing from the vein sits down.",
  unknown: "Supper happens without a record of you. The room is only a room.",
};

const distFarm = {
  prepared: "The gate you mended is a holder. The unlisted furrow remains, and the farm, not you, decides when it is cut. A share of the seam is in soil you helped make ready.",
  neglected: "The field socket stays empty. You left this farm to the season, and the socket says so: a season is not a holder.",
  opposed: "The field socket stays empty. You sided with the office against these acres, and the socket will not put a share in a fence you helped close.",
  unknown: "The field socket stays empty. Nothing at the farm was recorded, so the socket has no institution to wake.",
};
const distMill = {
  prepared: "The wheel you helped keep takes a thread of the seam on its shaft. The miller chooses the extra hour. The office can watch the race and cannot stop it.",
  neglected: "The mill socket stays empty. The race was not made ready, and the socket will not tie a thread to a wheel you did not help.",
  opposed: "The mill socket stays empty. You stood with the office against the mill, and the socket refuses that partnership.",
  unknown: "The mill socket stays empty. No settlement was recorded. The wheel is not a holder.",
};
const distCross = {
  prepared: "The crossing you helped keep holds a thread. The tender says when a life may cross. The seam is in the ford, not in your pocket.",
  neglected: "The ford socket stays empty. You did not help the crossing hold, and the socket will not invent a tender.",
  opposed: "The ford socket stays empty. The closure you backed is not a holder. The socket says the posting out loud and takes nothing.",
  unknown: "The ford socket stays empty. No preparation was recorded. The water is not an institution.",
};
const distFamily = {
  reunited: "The household you helped reunite keeps one thread at the table. They decide which unrealized life gets a chair. You do not.",
  scattered: "The table socket stays empty. A household in more than one house cannot hold one share, and the socket does not pretend.",
  estranged: "The table socket stays empty. The chairs face the walls. The socket will not hand a life to a room that will not look at itself.",
  unknown: "The table socket stays empty. No family preparation was recorded, so there is no table to wake.",
};

const refuseFarm = {
  prepared: "The gate you mended still latches. You gave the farm no thread, because you would not sign the form that makes holders. The field is a field. It is not the office's.",
  neglected: "The thistles are still yours to have ignored. Refusing the seam's menu did not plow them, and it did not hand them to the survey.",
  opposed: "The fence you backed for the office is still there. Refusing the form does not unbuild it. It only means the seam was not the office's prize either.",
  unknown: "The farm has no record of you. After the refusal it also has no new master.",
};
const refuseMill = {
  prepared: "The race you cleared runs. No thread was tied to the shaft. The miller keeps the settlement you helped and does not become a minister of futures.",
  neglected: "The mill runs or sticks as the creek decides. You refused the menu. You did not repair the race.",
  opposed: "The posted hours remain a thing you did. The refusal does not launder them. It does keep the seam off the office's mill.",
  unknown: "No mill record, no new authority. The wheel is a wheel.",
};
const refuseCross = {
  prepared: "The ford you helped keep still answers to its tender. You did not make the tender a holder of the seam. Travel stays local.",
  neglected: "The poor crossing stays poor. Refusal is not a bridge.",
  opposed: "The closure you posted is still paper on a tree. The seam is not the office's consolation for that.",
  unknown: "The ford remembers weather, not you. It does not remember a new rule.",
};
const refuseFamily = {
  reunited: "The table you helped reunite stays a table. You did not set a thread between the bowls. They are together, which is a different fact from being an institution of the vein.",
  scattered: "They are still in more than one house. The refusal did not gather them and did not file them.",
  estranged: "The chairs stay turned. You did not use the seam to force a reconciliation, and you did not give the office that power either.",
  unknown: "The family has no record of you. The refusal adds none.",
};

function pack(ending, farm, mill, cross, family, office, shore, erased, quiet) {
  const vignettes = [
    decisionVignette(ending, "farm", "The lane past the cedars", "Addison flats, a cedar lane, a gate.", farm, "open-gate", "The gate moves. The lane has been witnessed."),
    decisionVignette(ending, "mill", "The race", "Otter Creek, the mill race, the near wheel.", mill, "touch-wheel", "The wheel answers the hand or it doesn't. The scene releases."),
    decisionVignette(ending, "crossing", "The ford", "The creek crossing, stones or scow as the record allows.", cross, "step-ford", "You step the near stone and step back. The crossing is witnessed."),
    decisionVignette(ending, "family", "The kitchen", "A kitchen on a town road. Bowls. Chairs.", family, "stand-at-the-door", "You do not sit as a ruler. The kitchen is witnessed."),
    scene(ending, "office", "The town office", "The office the empty mayor left.", office.text, "read-minute", office.result, office.variants),
    scene(ending, "shore", "The lake cut", "The Champlain cut, after the other shore was named.", shore.text, "look-out", shore.result, shore.variants),
    scene(ending, "erased", "The gouged names", "The bridge timber where the night shift was cut out.", erased.text, erased.input, erased.result, erased.variants),
    scene(ending, "quiet", "The unmapped kitchen", "A house the grand list skipped. Three bowls.", quiet.text, quiet.input, quiet.result, quiet.variants),
  ];
  vignettes.forEach((v, i) => {
    v.next = i < vignettes.length - 1 ? vignettes[i + 1].id : `${ending}.credits`;
  });
  return vignettes;
}

const officeKeep = {
  text: "The minute book shows an adjournment. The chair is empty. The county goes on with a keeper who is not the chair.",
  result: "You close the minute. The office does not follow you out.",
  variants: [
    { ifFlag: "dg13.mayorSealedVacant", text: "The ordinance is sealed vacant. The office likes the stamp more than it likes you." },
    { ifFlag: "dg13.mayorWrittenVacant", text: "The ordinance is written vacant in the field book. The office has no stamp to hide behind." },
  ],
};
const officeClose = {
  text: "The minute book closes with the seam. The empty chair stays empty and will not be argued with again.",
  result: "You leave the minute shut.",
  variants: [{ ifFlag: "dg15.falseCharter", text: "The false charter you stamped at the foundry is in the drawer, and it looks like foresight now." }],
};
const officeDist = {
  text: "The minute book records holders: farm, mill, crossing, household. The chair is still empty. The office is a witness, not the key.",
  result: "You leave the minute where the holders can read it.",
  variants: [],
};
const officeRefuse = {
  text: "The minute book is open to a form with three lines. None of them is signed. The chair is empty because you would not complete the form.",
  result: "You leave the form unsigned.",
  variants: [{ ifFlag: "disc.surveyor.objectionFiled", text: "Your objection from the ordering room is pinned under the form, older than the refusal and the same shape." }],
};

const shoreKeep = {
  text: "The other shore stays other. Water is crossable by the unfinished life, because you kept that crossing possible.",
  result: "You look and do not rename it.",
  variants: [],
};
const shoreClose = {
  text: "The other shore is a story that no longer has a door. The lake is a lake. Snow does not fall upward.",
  result: "You look at finished water.",
  variants: [],
};
const shoreDist = {
  text: "The other shore stays other. The people who hold the seam may still need a boat. The lake is not yours to police.",
  result: "You leave the cut to its tenders.",
  variants: [{ ifFlag: "dg14.usedPreparedCrossing", text: "The scow you launched under the ice is beached here, ordinary, ready." }],
};
const shoreRefuse = {
  text: "The other shore stays other. No one was appointed to explain it. The water does not become a doctrine.",
  result: "You look, and you do not found a rule.",
  variants: [],
};

const erasedKeep = {
  text: "The gouges are still gouges. Keeping the seam did not write the night shift back onto the list. You can read them. You are not their clerk.",
  input: "read-gouges",
  result: "You read the names that the lamp already showed you. You add no title.",
  variants: [],
};
const erasedClose = {
  text: "The chalk will not take. A closed seam does not restore a line the list refused. The gouges remain as damage, not as a gate.",
  input: "try-chalk",
  result: "The chalk dusts off. The names stay gouged.",
  variants: [],
};
const erasedDist = {
  text: "The holders have copied the gouged names onto their own board, not the office's. The shift is still not a future the foundry poured. It is at least no longer only a hole.",
  input: "read-board",
  result: "You read their board and do not correct it.",
  variants: [],
};
const erasedRefuse = {
  text: "You chalk the names yourself, on the timber, without a form. The night shift is visible to anyone who crosses. No institution was paid with the seam to do it.",
  input: "chalk-names",
  result: "The chalk holds. You do not sign a title under it.",
  variants: [{ ifFlag: "disc.erased.winterBoard", text: "The winter board's sentence is among the names, because you lit that stove." }],
};

const quietKeep = {
  text: "The unmapped kitchen is still unmapped. Three bowls. You kept the seam and did not appoint the household to anything.",
  input: "look-in",
  result: "You look. You do not give them a plate on the office wall.",
  variants: [{ ifFlag: "disc.quiet.unappointedPlaque", text: "You remember the roof plaque: the house that was never appointed. This is that house." }],
};
const quietClose = {
  text: "With the seam shut, the kitchen is a kitchen the list skipped. It does not become mythical. It also does not get its nail back from history, because history already seated it.",
  input: "look-in",
  result: "You look. The bowls are bowls. The county is finished around them.",
  variants: [],
};
const quietDist = {
  text: "The holders know the kitchen exists. They do not get to pour it into a future. Distribution stopped at the four institutions you actually prepared.",
  input: "look-in",
  result: "You look. The household is not a fifth socket.",
  variants: [],
};
const quietRefuse = {
  text: "The kitchen is on a real road now, not as a charter but because you would not leave it only inside the vein. Three bowls. No mayor. No survey nail in the door.",
  input: "set-nothing",
  result: "You set nothing down. The nail stayed in the history board. The house does not need a second one.",
  variants: [],
};

function ending(id, title, selection, world, finalCard, vignettes) {
  return {
    id,
    title,
    mappingStatus: "PENDING",
    eligibilityRef: "systems/eligibility.json",
    selection,
    worldRules: world,
    vignettes,
    credits: {
      id: `${id}.credits`,
      beats: [
        { beats: 4, text: "PREINCARNATION" },
        { beats: 4, text: "Addison County" },
        { beats: 4, text: "Ellis Perch" },
        { beats: 5, text: "Offices, lake, foundry, vein" },
        { beats: 6, text: finalCard },
      ],
      afterLastBeat: "finish-credits",
    },
    postCompletion: {
      save: {
        "campaign.ending": id,
        "meta.terminal": true,
        "meta.yearFrozen": true,
        "meta.deathEnabled": false,
        "meta.lecternLocked": true,
        "meta.dungeonReentry": "museum",
        "meta.bossesRespawn": false,
        "meta.toolsPreserved": true,
      },
      loadSpawn: { room: "EPILOGUE.PORCH", x: 9, y: 7 },
      newGame: "separate-slot-only",
      completedSlot: "The completed slot loads the porch. The lectern does not offer the four choices again. Bosses do not respawn. Dungeons can be walked as quiet rooms. Death does not run. Year does not advance. Tools remain. A new game is another slot and does not clear this one.",
      world: world,
    },
  };
}

const keepSel = [
  { event: "write-line", line: "keep", note: "Write the lectern's keep line: The seam stays open in my keeping." },
  { event: "hang-coat", note: "Hang the current coat on the seam peg." },
  { event: "place-needle", note: "Lay the marble needle on the crack." },
  { event: "confirm-keep", note: "Confirm. campaign.ending becomes keep." },
];
const closeSel = [
  { event: "write-line", line: "close", note: "Write the lectern's close line." },
  { event: "stamp-seal", note: "Stamp the crack with the office seal." },
  { event: "latch-chain", note: "Latch the field chain across the crack and leave it." },
  { event: "confirm-close", note: "Confirm. campaign.ending becomes close." },
];
const distSel = [
  { event: "fill-socket", which: "farm", note: "Seat the farm socket. Fails aloud if the farm was not prepared." },
  { event: "fill-socket", which: "mill", note: "Seat the mill socket." },
  { event: "fill-socket", which: "crossing", note: "Seat the crossing socket." },
  { event: "fill-socket", which: "family", note: "Seat the family socket. Only reunited fits." },
  { event: "ring-bell", note: "Ring once at the center." },
  { event: "write-line", line: "distribute", note: "Write the lectern's distribute line." },
  { event: "place-needle", note: "Lay the needle across the four threads." },
  { event: "confirm-distribute", note: "Confirm. campaign.ending becomes distribute." },
];
const refuseSel = [
  { event: "jam-nail", note: "Put the unmapped nail into the lectern hinge. The three lines cannot be signed." },
  { event: "read-pages", note: "Read the erased pages already in the field book." },
  { event: "enter-embryonic", note: "Enter the unfinished form. Coat on, needle and lead in hand, no seal on the crack." },
  { event: "cross-lintel", note: "Cross the crack and do not take a lectern choice with you." },
];

export const endings = [
  ending(
    KEEP,
    "Keep the Seam",
    keepSel,
    {
      seamOpen: true,
      fourteenYearDeathContinues: true,
      holder: "ellis",
      administered: true,
      deathIsFinal: false,
    },
    "The seam stays open in Ellis's keeping.",
    pack(KEEP, keepFarm, keepMill, keepCross, keepFamily, officeKeep, shoreKeep, erasedKeep, quietKeep),
  ),
  ending(
    CLOSE,
    "Close the Seam",
    closeSel,
    {
      seamOpen: false,
      fourteenYearDeathContinues: false,
      holder: "none",
      administered: true,
      deathIsFinal: true,
    },
    "The seam is shut. The next death is only a death.",
    pack(CLOSE, closeFarm, closeMill, closeCross, closeFamily, officeClose, shoreClose, erasedClose, quietClose),
  ),
  ending(
    DIST,
    "Distribute the Seam",
    distSel,
    {
      seamOpen: true,
      fourteenYearDeathContinues: true,
      holder: "institutions",
      administered: true,
      deathIsFinal: false,
      newLifeAssignedBy: "prepared-institutions",
    },
    "Farm, mill, crossing, and household hold the seam. Ellis does not.",
    pack(DIST, distFarm, distMill, distCross, distFamily, officeDist, shoreDist, erasedDist, quietDist),
  ),
  ending(
    REFUSE,
    "Refuse the Given Choices",
    refuseSel,
    {
      seamOpen: true,
      fourteenYearDeathContinues: false,
      holder: "none",
      administered: false,
      deathIsFinal: false,
    },
    "The form was not signed. The vein stays, unadministered.",
    pack(REFUSE, refuseFarm, refuseMill, refuseCross, refuseFamily, officeRefuse, shoreRefuse, erasedRefuse, quietRefuse),
  ),
];

export const porch = {
  id: "EPILOGUE.PORCH",
  dungeon: "EPILOGUE",
  name: "Epilogue Porch",
  environment: null,
  region: "epilogue",
  checkpoint: true,
  purpose: "Where a completed save wakes. No lectern. No boss. The county is the one the ending already walked.",
  layoutNote: "A porch, three steps, a view of a road. No exits back into the seam.",
  tileset: "county-porch",
  bounds: { w: 18, h: 11 },
  walls: [{ x: 4, y: 3, w: 10, h: 1 }],
  tiles: [],
  exits: [],
  actors: [
    {
      id: "porch-post",
      name: "Porch post",
      kind: "fixture",
      pos: { x: 6, y: 6 },
      solid: true,
      joinsParty: false,
      dialogue: [{ id: "porch-post.line1", text: "The choice is already in the wood. Sitting here does not reopen it." }],
      onDeathReset: "return-to-start",
      start: { x: 6, y: 6 },
    },
  ],
  objects: [
    {
      id: "road-view",
      name: "Road view",
      kind: "view",
      pos: { x: 12, y: 7 },
      blocksMovement: false,
      tool: null,
      inscription: "ADDISON COUNTY, AFTER.",
      text: null,
      textByDecision: null,
      note: null,
    },
  ],
  transitions: [],
  persistence: {
    visitedFlag: "visited.EPILOGUE.PORCH",
    survivesDeath: [],
    resetsOnDeath: [],
    checkpoint: true,
    region: "epilogue",
    onLeave: [],
    note: "Death is disabled after credits. This room is a spawn, not a dungeon.",
  },
  solution: {
    id: "main",
    when: { op: "always" },
    steps: [],
  },
  alternates: [],
  solutionTrace: [
    "1. The completed save places you here. There is no puzzle and no return to the lectern.",
  ],
  death: { hazards: [] },
  orderPuzzle: null,
  produces: [],
  exemptFromGraph: true,
};
