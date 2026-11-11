import { item } from "../define.ts";
import type { HistoryObject } from "../types.ts";

export const quarries: HistoryObject[] = [
  item(65, {
    name: "Unexploded tally",
    siteKind: "quarry",
    site: "Wick powder shed",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken from the powder-shed nail, chalk still on the slate.",
      authored:
        "We counted a charge we did not set. Charges set: zero. Charges counted: one. The foot of the slate says do not wipe. I will read it aloud into the register. Wiping is how crews get killed in stories. This crew will not be a story.",
    },
    physical: {
      material: "Slate, chalk",
      dimensions: "20 by 15 cm",
      mass: "400 g",
      condition: "Chalk fresh enough to read; slate unwashed",
      marks: "Three chalk lines",
    },
    evidence: {
      howRead: "Read the chalk in place; do not wet the slate",
      readable: "CHARGES SET: 0 / CHARGES COUNTED: 1 / DO NOT WIPE.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Read the tally aloud",
      needsRestore: false,
      outcomeKey: "tally-spoken",
      useRule: "idempotent",
      outcome:
        "The count is spoken into the log: zero set, one counted. The chalk is not wiped. The spoken copy does not become permission to place a charge.",
    },
    restoration: null,
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "We counted a charge we did not set. I want that mistake spoken and kept. Wiping it is how crews get killed in stories. This crew will not be a story.",
    },
    persistence: {
      holds: "The chalk lines remain through era changes. Wipe attempts do not clear them.",
      shift: "The words are already on the slate before anyone speaks them. Speaking adds a log line and removes nothing.",
      presentation: {
        "pre-absence": "Slate blank, used for ordinary shift counts.",
        "the-fourteen": "The mistaken count written and left.",
        return: "It can be spoken. It cannot be cleaned into innocence.",
      },
    },
  }),
  item(66, {
    name: "Three-note shift whistle",
    siteKind: "quarry",
    site: "Wick rim clock house",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken from the clock-house peg with its pattern card.",
      authored:
        "Start, break, end. I blew the pattern. The cooperative clock stamped SHIFT CLOSED. Nobody came up the tram. There is no pay window. The whistle still does its old job, which is to mark time, not to raise the dead shift.",
    },
    physical: {
      material: "Tin whistle, pattern card",
      dimensions: "Whistle 8 cm",
      mass: "20 g",
      condition: "Sounding; card legible",
      marks: "Ink card",
    },
    evidence: {
      howRead: "Read the card tied to the ring",
      readable: "Start, break, end.",
    },
    interaction: {
      kind: "practical",
      verb: "Blow the shift pattern",
      needsRestore: false,
      outcomeKey: "shift-stamped",
      useRule: "idempotent",
      outcome:
        "The clock house stamps a slip: SHIFT CLOSED. NO PAY WINDOW. NO CREW CALL. No one arrives.",
    },
    restoration: null,
    response: {
      who: "Wick Quarry Cooperative",
      kind: "institution",
      text: "SHIFT CLOSED. NO PAY WINDOW. NO CREW CALL. The cooperative is dissolved. The stamp is the institution speaking. It will not reopen for a whistle.",
    },
    persistence: {
      holds: "The pattern card remains three notes and not a muster roll.",
      shift: "The stamp can be pulled on return. It always says closed. Earlier eras show the peg empty of any answering crew.",
      presentation: {
        "pre-absence": "Whistle calling a living shift.",
        "the-fourteen": "Hung up. Card written. Clock stopped.",
        return: "The pattern closes a shift that will not assemble.",
      },
    },
  }),
  item(67, {
    name: "Mushroomed dressing hammer",
    siteKind: "quarry",
    site: "Wick dressing floor",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken off the dressing floor, handle wedge loose, face painted.",
      authored:
        "The face is mushroomed from honest work. The paint says dress edge only. I seated the wedge and struck the sample block once. The edge came square. I did not start a monument. A sample is allowed to look finished on one edge and nowhere else.",
    },
    physical: {
      material: "Steel hammer, hickory handle",
      dimensions: "Handle 28 cm",
      mass: "900 g",
      condition: "Face mushroomed; wedge loose until seated",
      marks: "Paint on the face",
    },
    evidence: {
      howRead: "Read the paint on the striking face",
      readable: "DRESS EDGE ONLY.",
    },
    interaction: {
      kind: "practical",
      verb: "Dress the sample edge",
      needsRestore: true,
      outcomeKey: "edge-dressed",
      useRule: "idempotent",
      outcome:
        "One square strike dresses a single edge of the sample block. No second face is started. The paint remains on the hammer.",
    },
    restoration: {
      applies: true,
      method: "Seat the loose handle wedge with a tap from a second, smaller hammer in the crib. Do not grind the mushroomed face.",
      result: "The head is safe to swing. The mushrooming stays as the history of the face.",
    },
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "One strike. The block is a sample, not a monument.",
    },
    persistence: {
      holds: "The painted limit and the mushroomed face both remain after the strike.",
      shift: "Loose and idle during the fourteen; one dressed edge on return; never a courthouse step.",
      presentation: {
        "pre-absence": "Face less mushroomed, paint absent, floor busy.",
        "the-fourteen": "Painted. Wedge loose. Block untouched.",
        return: "One edge, square. Stop.",
      },
    },
  }),
  item(68, {
    name: "Incomplete plug set",
    siteKind: "quarry",
    site: "Wick tram terminus",
    binding: "excavate",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Dug from the spoil at the tram terminus, one feather missing.",
      authored:
        "The tag says the lost feather is in the adit and is not to be replaced with a nail. I used the pair I have. The small block split along the vein. A nail would have shattered the face. The lost feather stays lost.",
    },
    physical: {
      material: "Two iron feathers and one plug; the third feather absent",
      dimensions: "Plug 12 cm",
      mass: "350 g",
      condition: "Pair usable; set incomplete",
      marks: "Wired tag",
    },
    evidence: {
      howRead: "Read the tag",
      readable: "One feather lost in the adit — do not replace with a nail.",
    },
    interaction: {
      kind: "practical",
      verb: "Split the small block",
      needsRestore: false,
      outcomeKey: "block-split",
      useRule: "idempotent",
      outcome:
        "The remaining pair splits a small block along the green hairline. The face is clean. No nail is substituted. The lost feather is not searched out as a quest.",
    },
    restoration: null,
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "A nail would have shattered the face. You used the pair. Good. Leave the lost feather lost.",
    },
    persistence: {
      holds: "The set remains one feather short in every era after the loss.",
      shift: "The split face exists only after use. The missing feather does not reappear in another era to tempt a search.",
      presentation: {
        "pre-absence": "Full set of three in the crib.",
        "the-fourteen": "One feather lost. Tag written. Set in the spoil.",
        return: "The pair splits one small block. The adit keeps the rest.",
      },
    },
  }),
  item(69, {
    name: "Drip lamp",
    siteKind: "quarry",
    site: "Wick adit mouth",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken from the adit nail, drip valve stuck, wall pencil behind it.",
      authored:
        "The scratch says white flame for pencil. I freed the drip and lit it. The wall pencil reads TRAM STOPS AT 14. Ade says fourteen there is a depth in rods, and also the absence, and he is tired of the coincidence. I logged it as depth. The lamp does not get to interpret.",
    },
    physical: {
      material: "Brass carbide lamp",
      dimensions: "Lamp 10 cm",
      mass: "220 g",
      condition: "Drip valve stuck until freed",
      marks: "Scratch on the reflector",
    },
    evidence: {
      howRead: "Read the scratch on the reflector",
      readable: "White flame for pencil.",
    },
    interaction: {
      kind: "practical",
      verb: "Light the carbide lamp",
      needsRestore: true,
      outcomeKey: "white-flame",
      useRule: "idempotent",
      outcome:
        "A white flame makes the adit pencil readable: TRAM STOPS AT 14. Logged as depth in rods. The coincidence with the absence is noted as a coincidence and not a code.",
    },
    restoration: {
      applies: true,
      method: "Free the drip valve with a drop of oil. Do not enlarge the jet.",
      result: "The lamp lights white. The scratch stays.",
    },
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "Fourteen on that wall is a depth in rods, and also the absence, and I am tired of the coincidence. Log it as depth. The lamp does not interpret.",
    },
    persistence: {
      holds: "The scratch remains a lighting instruction. The wall pencil remains a depth.",
      shift: "Dark until the valve is freed; then a white flame and the same four words. No era turns 14 into a summons.",
      presentation: {
        "pre-absence": "Lamp in use, wall unpenciled.",
        "the-fourteen": "Valve stuck. Scratch cut. Pencil written in the dark.",
        return: "Depth, logged. Coincidence refused as a code.",
      },
    },
  }),
  item(70, {
    name: "Rim cup",
    siteKind: "quarry",
    site: "Wick rim",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Unbolted from the broken rim anemometer, bearing dry.",
      authored:
        "The arm is stamped WICK RIM. I oiled the bearing and let the cup spin. It gave six, from the north cut. That is weather. It can sit beside the cellar smoke note if someone wants two observations. Neither one needs the other to be true.",
    },
    physical: {
      material: "Aluminum cup, stamped arm",
      dimensions: "Cup 8 cm",
      mass: "60 g",
      condition: "Bearing dry until oiled",
      marks: "Arm stamp",
    },
    evidence: {
      howRead: "Read the stamp on the arm",
      readable: "WICK RIM",
    },
    interaction: {
      kind: "practical",
      verb: "Spin the rim cup",
      needsRestore: true,
      outcomeKey: "wind-number",
      useRule: "idempotent",
      outcome:
        "The cup spins and gives a reading: 6, from the north cut. The number is weather. It does not corroborate a spirit and does not require the cellar pot.",
    },
    restoration: {
      applies: true,
      method: "Oil the dry bearing.",
      result: "The cup spins freely. The stamp stays.",
    },
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Six from the north cut is weather. File it beside the smudge pot if you want. Neither one needs the other.",
    },
    persistence: {
      holds: "The WICK RIM stamp remains the instrument’s name.",
      shift: "Stuck during the fourteen, spinning on return, always a weather number rather than a direction to walk.",
      presentation: {
        "pre-absence": "Cup on a working anemometer.",
        "the-fourteen": "Broken off. Bearing dry. Stamp still true.",
        return: "A six from the north cut. Weather.",
      },
    },
  }),
  item(71, {
    name: "Scraped-depth core",
    siteKind: "quarry",
    site: "Vein-mouth well, Cut-Bank",
    binding: "excavate",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Lifted from the well coping where the quarry bed surfaces in the orchard ground.",
      authored:
        "The label’s depth was scraped. What remains is bed 4 and a green hairline. I restored the numerals — forty feet — and seated the core on the hairline in the coping stone. They clicked. Same bed. That is geology we are allowing to be strange. I will not promote it to a religion.",
    },
    physical: {
      material: "Marble core, paper label",
      dimensions: "Core 18 cm long, 4 cm across",
      mass: "620 g",
      condition: "Depth numerals scraped; hairline vivid",
      marks: "Partial label",
    },
    evidence: {
      howRead: "Read what the scrape left, before restoring numerals",
      readable: "BED 4 — green hairline.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Seat the core on the hairline",
      needsRestore: true,
      outcomeKey: "bed-seated",
      useRule: "idempotent",
      outcome:
        "With the depth restored to 40 ft, the core seats on the coping’s green hairline and clicks. Same bed. No rite follows the click.",
    },
    restoration: {
      applies: true,
      method: "Rewrite the scraped depth as 40 ft in the same ink, beside the surviving words, not over them.",
      result: "Both the surviving words and the restored depth are readable.",
    },
    priorPhysical: "Before restoration the depth numerals are scraped. Surviving label: BED 4 — green hairline.",
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Same bed. That is geology we are allowing to be strange. Do not promote it to a religion.",
    },
    persistence: {
      holds: "BED 4 and the green hairline remain even after the depth is rewritten beside them.",
      shift: "Unseated and unlabeled-as-to-depth during the fourteen; seated on return; the click does not repeat as a summons.",
      presentation: {
        "pre-absence": "Core in the quarry rack, depth printed, not yet carried to the well.",
        "the-fourteen": "Depth scraped. Core left on the orchard coping.",
        return: "It seats. Same bed. Geology, not worship.",
      },
    },
  }),
  item(72, {
    name: "Shift pail",
    siteKind: "quarry",
    site: "Wick powder shed",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken off the shed bench, latch stuck, note inside.",
      authored:
        "AY7, someone swapped my biscuit for a marble one. I kept it because it was funny and then it was not. The note says do not eat stones. I opened the latch, read the note, and left the biscuit in the pail. It is not food and not a relic you lick to see a shift.",
    },
    physical: {
      material: "Tin pail, paper note, marble biscuit",
      dimensions: "Pail 15 cm",
      mass: "380 g",
      condition: "Latch stuck until freed; biscuit stone",
      marks: "Note folded under the biscuit",
    },
    evidence: {
      howRead: "Open the pail and read the note; do not bite the biscuit",
      readable: "Biscuit is a joke from AY7 — do not eat stones.",
    },
    interaction: {
      kind: "practical",
      verb: "Open the pail",
      needsRestore: true,
      outcomeKey: "pail-open",
      useRule: "idempotent",
      outcome:
        "The latch opens. The note is readable and stays in the pail with the marble biscuit. The biscuit is not eaten and not removed.",
    },
    restoration: {
      applies: true,
      method: "Free the latch with a drop of oil. Do not pry the hinge off.",
      result: "The lid opens. The note is uncreased only enough to read.",
    },
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "AY7, someone swapped my biscuit for a marble one. I kept it because it was funny and then it was not. Leave it in the pail.",
    },
    persistence: {
      holds: "The note and the uneaten stone biscuit remain together.",
      shift: "Shut during the fourteen, openable on return, never converted into a meal or a vision.",
      presentation: {
        "pre-absence": "Pail with a real biscuit.",
        "the-fourteen": "Stone biscuit. Note written. Latch stuck.",
        return: "Opened, read, left as a joke that stopped being one.",
      },
    },
  }),
  item(73, {
    name: "Boot caulk",
    siteKind: "quarry",
    site: "Wick clay room",
    binding: "excavate",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Sifted from the clay beside the print people had been calling a bare foot.",
      authored:
        "The tag says the print is this boot. I pressed the caulk beside it. The hob pattern matches. It was my boot, kicked off. Not a bare foot and not a specter. I am dropping the argument in writing so it does not get picked up again.",
    },
    physical: {
      material: "Iron hobnail caulk",
      dimensions: "2 cm",
      mass: "8 g",
      condition: "Pattern sharp; tag tied",
      marks: "Tied tag",
    },
    evidence: {
      howRead: "Read the tag, then compare to the print",
      readable: "Print in the clay room is this boot.",
    },
    interaction: {
      kind: "practical",
      verb: "Press the caulk beside the print",
      needsRestore: false,
      outcomeKey: "print-matched",
      useRule: "idempotent",
      outcome:
        "The hob pattern matches the clay print. The print is Ade Nye’s boot, kicked off. It is not an extra foot.",
    },
    restoration: null,
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "We kept arguing it was a bare foot. It was my boot, kicked off. Match it and drop the argument.",
    },
    persistence: {
      holds: "The tag’s identification remains after the match.",
      shift: "The print and the caulk agree in every era once compared. The story of a bare foot does not regrow.",
      presentation: {
        "pre-absence": "Caulk in a boot on a living shift.",
        "the-fourteen": "Boot kicked off. Caulk in the clay. Argument begun.",
        return: "A match. The argument is over.",
      },
    },
  }),
  item(74, {
    name: "Do-not-return stencil",
    siteKind: "quarry",
    site: "Wick crate yard",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken from the crate yard bench, ink dry at the edges.",
      authored:
        "Returned crates were how we lost count of blocks. The stencil says do not return to sender. I moistened one pass and printed a slip for the file. I did not restart the route. One print. The cooperative is not back in business.",
    },
    physical: {
      material: "Oiled board stencil, dry ink dab",
      dimensions: "Board 25 cm",
      mass: "180 g",
      condition: "Ink dry at the edges; letters cut clean",
      marks: "The cut letters are the text",
    },
    evidence: {
      howRead: "Read the cut letters",
      readable: "WICK — DO NOT RETURN TO SENDER.",
    },
    interaction: {
      kind: "practical",
      verb: "Print the stencil once",
      needsRestore: true,
      outcomeKey: "stencil-printed",
      useRule: "idempotent",
      outcome:
        "One slip takes the sentence. The route is not restarted. The stencil is not put back into crate service.",
    },
    restoration: {
      applies: true,
      method: "Moisten the included ink dab for a single pass.",
      result: "One print is possible. The dab is then dry again.",
    },
    response: {
      who: "Wick Quarry Cooperative",
      kind: "institution",
      text: "Returned crates were how we lost count of blocks. One print for the file. Do not restart the route.",
    },
    persistence: {
      holds: "The cut sentence remains a prohibition after it has been copied once.",
      shift: "Unprinted during the fourteen, printed once on return, never a shipping desk.",
      presentation: {
        "pre-absence": "Stencil in daily use, ink wet.",
        "the-fourteen": "Dry. Left on the bench. Route already dead.",
        return: "One file copy. The yard stays closed.",
      },
    },
  }),
  item(75, {
    name: "Offset zero chain",
    siteKind: "quarry",
    site: "Wick survey reel",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Unreeled on the dressing floor, zero-mark replaced.",
      authored:
        "The tag says the zero is a palm short. I measured once before I seated the spare link, and wrote palm-short. Then I seated the original zero and measured again, and wrote the true length. If you skip the first writing you donate a palm of land to nobody. Keep both readings.",
    },
    physical: {
      material: "Surveyor’s chain, spare zero link in the reel",
      dimensions: "Standard chain, zero replaced",
      mass: "1.8 kg",
      condition: "Replacement zero offset by a palm until the spare is seated",
      marks: "Tag on the reel",
    },
    evidence: {
      howRead: "Read the tag before trusting a length",
      readable: "0-mark replaced — palm short.",
    },
    interaction: {
      kind: "practical",
      verb: "Measure with the chain",
      needsRestore: false,
      outcomeKey: "chain-measured",
      useRule: "idempotent",
      outcome:
        "Before the original zero is seated, the chain measures one palm short. The reading is written as palm-short.",
      outcomeIfRestored:
        "With the original zero seated, the same span reads true. The palm-short reading remains in the log beside it. Neither erases the other.",
    },
    restoration: {
      applies: true,
      method: "Seat the spare original zero from the reel in place of the offset mark.",
      result: "The zero is true. The tag about the replacement stays on the reel.",
    },
    priorPhysical: "Zero-mark is the replacement, one palm short, spare original still in the reel.",
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "If you measure before you seat the zero, write ‘palm short’ or you will donate a palm of land to nobody. After, write the true length. Keep both readings.",
    },
    persistence: {
      holds: "The tag remains after the zero is seated, so the error stays documented.",
      shift: "Offset during the fourteen; true after seating; both readings kept once measured.",
      presentation: {
        "pre-absence": "Chain true, no tag.",
        "the-fourteen": "Zero replaced. Tag written. Spare waiting in the reel.",
        return: "Two readings if you are careful. One lie if you are not.",
      },
    },
  }),
  item(76, {
    name: "Small-hand bottle",
    siteKind: "quarry",
    site: "Wick shift bench",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken from the bench where the dent had been left as a curiosity.",
      authored:
        "The dent fits no glove on the shift list. Filling the bottle eases it outward into an ordinary thumb dent. I will not let that change eat the description. The first dent is copied into the register before the metal moves. Ease it if you need a bottle. The record of the small hand stays.",
    },
    physical: {
      material: "Aluminum bottle",
      dimensions: "18 cm",
      mass: "80 g empty",
      condition: "Dented inward by a hand smaller than the crew’s gloves",
      marks: "Tied tag",
    },
    evidence: {
      howRead: "Read the tag before filling",
      readable: "Dent recorded AY12 — hand smaller than any crew glove.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Fill the dented bottle",
      needsRestore: false,
      outcomeKey: "dent-eased",
      useRule: "ease-dent",
      outcome:
        "Filled, the small dent eases into an ordinary thumb dent. The first description is already in the register and does not update away. The bottle becomes usable. The small hand does not appear.",
    },
    restoration: null,
    priorPhysical:
      "Dent as found: a hollow the size of a hand smaller than any crew glove, recorded AY12.",
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Ease it if you need the bottle. The first dent is already copied. I will not let a change eat a description.",
    },
    persistence: {
      holds: "The tag and the registered first dent remain after the metal eases.",
      shift: "The hollow is deep during the fourteen and ordinary after filling. The register keeps the deep state.",
      presentation: {
        "pre-absence": "Bottle round, no tag.",
        "the-fourteen": "Small dent. Tag written. Unfilled.",
        return: "The metal can ease. The description cannot.",
      },
    },
  }),
  item(77, {
    name: "Shift pencil",
    siteKind: "quarry",
    site: "Wick powder shed",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken from behind his ear in the shed portrait and then, actually, from the ledge under it.",
      authored:
        "The pencil is stamped NYE. That stamp is not pencil. I wrote RETURN on the slate as a working mark. Rain can take RETURN. Rain cannot take the stamp, and rain cannot take a registered copy. Write if you must. Do not confuse the mark with the evidence.",
    },
    physical: {
      material: "Red pencil, stamped ferrule",
      dimensions: "12 cm",
      mass: "6 g",
      condition: "Point short; stamp crisp",
      marks: "Ferrule stamp",
    },
    evidence: {
      howRead: "Read the ferrule stamp",
      readable: "NYE",
    },
    interaction: {
      kind: "practical",
      verb: "Write RETURN on the slate",
      needsRestore: false,
      outcomeKey: "slate-marked",
      useRule: "ephemeral-mark",
      outcome:
        "The pencil writes RETURN on the working slate. The mark is ephemeral: a later erase clears it. The ferrule stamp NYE is not pencil and is not cleared with it.",
    },
    restoration: null,
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "Write RETURN if you must. Rain owns pencil. The register owns anything we mean to keep. My name on the pencil is not pencil.",
    },
    persistence: {
      holds: "The NYE stamp survives any erasing of the working mark.",
      shift: "The word RETURN exists only as a working mark and can be lost. The stamp does not.",
      presentation: {
        "pre-absence": "Pencil in Ade’s pocket, stamp already his.",
        "the-fourteen": "Left on the ledge. Slate blank.",
        return: "RETURN can be written and can be lost. NYE cannot.",
      },
    },
  }),
  item(78, {
    name: "Door wedge",
    siteKind: "quarry",
    site: "Wick tram door",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Picked up off the tram sill, crayon still on the marble.",
      authored:
        "The crayon says keep the tram door open while the cage is down. I wedged it. The door stayed open. The wedge is so a hand is not shut on. It is not a key to the cage. The cage stays down. I am not raising it.",
    },
    physical: {
      material: "Marble wedge",
      dimensions: "10 cm",
      mass: "400 g",
      condition: "Edge chipped; crayon readable",
      marks: "Crayon sentence",
    },
    evidence: {
      howRead: "Read the crayon on the top face",
      readable: "Tram door — keep open while the cage is down.",
    },
    interaction: {
      kind: "practical",
      verb: "Wedge the tram door",
      needsRestore: false,
      outcomeKey: "door-wedged",
      useRule: "idempotent",
      outcome:
        "The tram door stays open. The cage remains down. The wedge does not raise it and does not open a second door.",
    },
    restoration: null,
    response: {
      who: "Wick Quarry Cooperative",
      kind: "institution",
      text: "The wedge is so the door does not shut on a hand. It is not a key to the cage.",
    },
    persistence: {
      holds: "The crayon instruction remains the limit on what the wedge is for.",
      shift: "Door free to slam during the fourteen; held open on return; cage unmoved.",
      presentation: {
        "pre-absence": "Wedge in the sill of a working tram.",
        "the-fourteen": "Crayon written. Wedge on the ground. Door swinging.",
        return: "One door held. The cage stays down.",
      },
    },
  }),
  item(79, {
    name: "Cracked ear protectors",
    siteKind: "quarry",
    site: "Wick tram terminus",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken off the terminus hook, left cup cracked.",
      authored:
        "I cracked the left on a chain. The ink says the left is dead and the right still good. If you mend the left you mend away which ear went deaf to the squeal first. I wore the right. The wheel-squeal dropped. The left stayed cracked. Restoration is refused, and that refusal is the conservation.",
    },
    physical: {
      material: "Leather and fiber ear cups, one cracked",
      dimensions: "Band 30 cm",
      mass: "140 g",
      condition: "Left cup cracked; right cup sound",
      marks: "Ink on the band",
    },
    evidence: {
      howRead: "Read the ink on the band",
      readable: "Left cup dead — right still good.",
    },
    interaction: {
      kind: "practical",
      verb: "Wear the protectors",
      needsRestore: false,
      outcomeKey: "squeal-muffled",
      useRule: "idempotent",
      outcome:
        "The right cup muffles the tram wheel-squeal. The left cup does not become whole. The crack remains the record of which side failed first.",
    },
    restoration: {
      applies: false,
      method: "A mend is possible and is refused.",
      result: "The crack stays. Mending it would erase which cup died.",
    },
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "I cracked the left on a chain. If you mend it, you mend away which ear went deaf to the squeal first. Wear the right. Leave the left.",
    },
    persistence: {
      holds: "The ink and the cracked left cup remain a pair. Restoration does not apply.",
      shift: "The right cup muffles in every era after the crack. The left does not heal when the era changes.",
      presentation: {
        "pre-absence": "Both cups whole.",
        "the-fourteen": "Left cracked. Ink written. Hung on the hook.",
        return: "Wear the right. The left stays the record.",
      },
    },
  }),
  item(80, {
    name: "Unrealized wage chit",
    siteKind: "quarry",
    site: "Wick clock house",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Found clipped to the stopped clock, made out for shifts during the fourteen, unsigned.",
      authored:
        "It pays me for shifts I did not work, because I was dead. I initialed it. It warmed and did not become money. Calder, for the dissolved cooperative, says they cannot pay and will not destroy the chit. I want my initials on the refusal, in my hand, and I want the refusal kept.",
    },
    physical: {
      material: "Paper wage chit, clipped",
      dimensions: "12 by 8 cm",
      mass: "2 g",
      condition: "Unsigned until initialed; paper sound",
      marks: "Printed claim and a blank signature line",
    },
    evidence: {
      howRead: "Read the printed lines before signing anything",
      readable: "ELLIS — SHIFTS AY1–AY14 — UNSIGNED — NOT PAYABLE.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Initial the wage chit",
      needsRestore: false,
      outcomeKey: "chit-initialed",
      useRule: "initial-persist",
      outcome:
        "Ellis initials the chit. It warms and does not become payable. The initials persist across era changes. The cooperative still cannot pay, and still will not destroy the paper.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "For the dissolved Wick cooperative: it cannot pay. It will not destroy the chit. Initial it if you want your name on the refusal, in your own hand, and we will keep the refusal.",
    },
    persistence: {
      holds: "NOT PAYABLE remains printed after the initials are added.",
      shift: "Unsigned during the fourteen; initialed on return; the initials are still there if the era is turned back, because the hand that signed is the returned hand and the register keeps the act.",
      presentation: {
        "pre-absence": "No chit. Ellis alive and unpaid only in ordinary ways.",
        "the-fourteen": "Chit written for shifts that had no body to work them. Unsigned.",
        return: "Initials can be set. The paper warms. It is still not money.",
      },
    },
  }),
];
