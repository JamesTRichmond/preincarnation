import { item } from "../define.ts";
import type { HistoryObject } from "../types.ts";

export const households: HistoryObject[] = [
  item(17, {
    name: "Two-lineage ladle",
    siteKind: "household",
    site: "Silt House hearth, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "June Pell",
      finder: "June Pell",
      circumstance: "Taken down from the hearth hook while Tomas Voss stood in the doorway and disagreed.",
      authored:
        "I wrote bean-pot on the tag. Tomas wrote apple butter under it before the ink dried. The cuts on the handle are a P and a V in the same place. The bowl will commit to one of us at a time. It will not make a third soup to keep the peace.",
    },
    physical: {
      material: "Maple bowl, iron handle",
      dimensions: "Bowl 10 cm; handle 22 cm",
      mass: "180 g",
      condition: "Bowl dented; handle cuts crossed",
      marks: "P cut over V, and a two-hand paper tag",
    },
    evidence: {
      howRead: "Read the crossed cuts, then both lines of the tag",
      readable: "Handle: P over V. Tag, June: bean-pot. Tag, Tomas: apple butter.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Set the ladle bowl",
      needsRestore: false,
      outcomeKey: "lineage-commit",
      useRule: "lineage-toggle",
      outcome:
        "The bowl commits to one lineage at a time and will not blend them. First setting: June Pell’s bean-pot herbs. Next setting: Tomas Voss’s apple butter. The tag keeps both lines either way.",
    },
    restoration: {
      applies: true,
      method: "Raise the dent with a spoon stake from the dresser. Do not file the handle cuts.",
      result: "The bowl sits flat. P over V remains.",
    },
    response: {
      who: "Marble Vein Conservancy",
      kind: "institution",
      text: "June Pell says bean-pot. Tomas Voss says apple butter. The contradiction is the evidence. Intake will not reconcile it into one family story.",
    },
    persistence: {
      holds: "Both names on the tag, and the crossed cuts, survive every setting of the bowl.",
      shift: "The bowl’s scent commits to whichever lineage was set last. The other lineage stays written.",
      presentation: {
        "pre-absence": "Uncut handle, one household, no tag.",
        "the-fourteen": "Cuts crossed. Tag written in two hands. Bowl empty.",
        return: "The bowl will hold one reading at a time and never a blend.",
      },
    },
  }),
  item(18, {
    name: "Chipped name cup",
    siteKind: "household",
    site: "Silt House dresser, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Taken from the dresser in Silt House, not from Seminary Cut.",
      authored:
        "The chip starts EL and stops. People will want it to be me. It is a child whose name was begun and abandoned. The cup holds water. I will not finish the letters.",
    },
    physical: {
      material: "Tin cup, rolled rim",
      dimensions: "7 cm tall",
      mass: "55 g",
      condition: "Rim chipped where letters start",
      marks: "Scratched letters, unfinished",
    },
    evidence: {
      howRead: "Read the rim scratch from the left",
      readable: "EL — and then the scratch stops.",
    },
    interaction: {
      kind: "practical",
      verb: "Fill the chipped cup",
      needsRestore: false,
      outcomeKey: "cup-holds",
      useRule: "idempotent",
      outcome:
        "The cup holds water. The unfinished letters stay unfinished. Nothing in the water completes them.",
    },
    restoration: null,
    response: {
      who: "Ellis",
      kind: "character",
      text: "Not mine. The letters stop where a parent lost heart. Drink if you are thirsty. Do not finish the name.",
    },
    persistence: {
      holds: "The stopped scratch remains exactly EL and no further.",
      shift: "The tin dulls across the fourteen. The letters do not advance in any era.",
      presentation: {
        "pre-absence": "Rim whole, no scratch.",
        "the-fourteen": "Scratch begun and stopped. Cup dry.",
        return: "It holds water. The name stays unfinished.",
      },
    },
  }),
  item(19, {
    name: "Unfinished ferry square",
    siteKind: "household",
    site: "Silt House sewing basket, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Lifted from the basket when the field cloth was being patched.",
      authored:
        "A child penciled a grid and wrote what the square was allowed to be. I freed the rusted needle and stitched the square to the field cloth. I did not put a passenger on the boat.",
    },
    physical: {
      material: "Cotton square, pencil grid, rusted needle, linen thread",
      dimensions: "Square 16 cm",
      mass: "12 g",
      condition: "Edges raw; needle stuck in the hem",
      marks: "Pencil grid and three words",
    },
    evidence: {
      howRead: "Read the pencil in the grid before stitching over the margin",
      readable: "Boat, not a face.",
    },
    interaction: {
      kind: "practical",
      verb: "Stitch the square to the field cloth",
      needsRestore: true,
      outcomeKey: "square-stitched",
      useRule: "idempotent",
      outcome:
        "The square is stitched to the field cloth along two edges. The boat grid remains visible. No face and no passenger are added.",
    },
    restoration: {
      applies: true,
      method: "Free the rusted needle with a drop of bench oil and wipe it dry.",
      result: "The needle passes cloth. The pencil sentence is untouched.",
    },
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "It is a ferry because the child saw one. Do not embroider a passenger.",
    },
    persistence: {
      holds: "The pencil sentence remains the limit on what the square depicts.",
      shift: "Unstitched through the fourteen; attached to the field cloth only if stitched on return.",
      presentation: {
        "pre-absence": "Blank square in the basket.",
        "the-fourteen": "Grid drawn, needle rusted in the hem.",
        return: "It can be stitched as a boat and not as a person.",
      },
    },
  }),
  item(20, {
    name: "Absence-address iron",
    siteKind: "household",
    site: "Seminary Cut kitchen, Ellis’s house",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken off the kitchen step where it had been left as if to hold a note down.",
      authored:
        "The sole is scratched with an address we already use. Cold, it still presses that address onto a blank slip and nothing else. I do not need the iron to tell me where Ellis lives. I need it not to invent a letter.",
    },
    physical: {
      material: "Cast-iron flatiron, no separate heater",
      dimensions: "15 cm sole",
      mass: "1.6 kg",
      condition: "Sole scratched; body cold",
      marks: "Address scratched into the sole",
    },
    evidence: {
      howRead: "Read the sole scratch in raking light",
      readable: "Seminary Cut — leave on the step.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Press the iron on a blank slip",
      needsRestore: false,
      outcomeKey: "address-pressed",
      useRule: "idempotent",
      outcome:
        "The cold iron presses ‘Seminary Cut’ onto a blank Conservancy slip in brown heat and no body text. The slip gains an address and not a correspondent.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "We already know the house. The pressing proves the sole, not a new resident.",
    },
    persistence: {
      holds: "The sole scratch remains the only sentence the iron can press.",
      shift: "Pre-absence the sole is smooth. Later it can press only that address. It never grows a letter.",
      presentation: {
        "pre-absence": "Smooth sole, used for cloth.",
        "the-fourteen": "Address scratched. Iron left on the step.",
        return: "It presses the address and stops.",
      },
    },
  }),
  item(21, {
    name: "Pound-notch paddle",
    siteKind: "household",
    site: "Silt House pantry, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Tomas Voss",
      finder: "Tomas Voss",
      circumstance: "Taken from the pantry nail during the ladle argument.",
      authored:
        "June’s mother called it a butter paddle. My uncle called it the apple paddle. The notch is a pound either way. I weighed marble dust because we were not going to settle supper. The notch balanced. The argument did not.",
    },
    physical: {
      material: "Maple paddle",
      dimensions: "30 cm",
      mass: "140 g",
      condition: "Notch cut and labeled; blade stained",
      marks: "Cut notch and an ink label",
    },
    evidence: {
      howRead: "Read the ink beside the notch",
      readable: "1 lb — Silt House.",
    },
    interaction: {
      kind: "practical",
      verb: "Balance a pound of marble dust",
      needsRestore: false,
      outcomeKey: "pound-balanced",
      useRule: "idempotent",
      outcome:
        "Hung against the pantry weight, the notch balances one pound of marble dust. It does not decide whether the house made butter or apple butter.",
    },
    restoration: null,
    response: {
      who: "June Pell",
      kind: "character",
      text: "My mother used it for butter. Tomas’s uncle says apples. The notch is a pound either way. Weigh something real.",
    },
    persistence: {
      holds: "The ‘1 lb — Silt House’ label remains the measure.",
      shift: "Stain color shifts with whoever last used it for food, but the notch’s weight does not.",
      presentation: {
        "pre-absence": "Unlabeled paddle, no notch.",
        "the-fourteen": "Notch cut and labeled while the two lineages argued.",
        return: "It balances a pound. It does not adjudicate the kitchen.",
      },
    },
  }),
  item(22, {
    name: "Rope-bed wrench",
    siteKind: "household",
    site: "Seminary Cut bedroom, Ellis’s house",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Found in the bed wrench’s own socket, lint packed around it.",
      authored:
        "Someone tightened this bed during the fourteen or wanted the rope to remember being tightened. I cleared the lint and gave it one flat. The bed is firmer. I am not sleeping in the file.",
    },
    physical: {
      material: "Iron bed wrench",
      dimensions: "18 cm",
      mass: "220 g",
      condition: "Socket packed with lint; shaft sound",
      marks: "Stamp and a chalk note",
    },
    evidence: {
      howRead: "Read the stamp, then the chalk on the grip",
      readable: "4 POSTS. Chalk: tightened through the fourteen.",
    },
    interaction: {
      kind: "practical",
      verb: "Turn the bed wrench one flat",
      needsRestore: true,
      outcomeKey: "bed-tightened",
      useRule: "idempotent",
      outcome:
        "One flat tightens the rope bed in the Absence Room. The ropes come even. The chalk sentence is not rubbed off to make the bed look merely old.",
    },
    restoration: {
      applies: true,
      method: "Pick the lint out of the socket with a dry splinter.",
      result: "The socket seats on the nut. The chalk remains.",
    },
    response: {
      who: "Ellis",
      kind: "character",
      text: "Someone slept here or wanted to. Tightening is maintenance, not an invitation to stay the night in the file.",
    },
    persistence: {
      holds: "The chalk note remains on the grip after the bed is tightened.",
      shift: "Ropes slacken through the fourteen and hold after one flat on return. The note does not become a guest list.",
      presentation: {
        "pre-absence": "Wrench in the drawer, ropes new, no chalk.",
        "the-fourteen": "Chalk written. Socket linted. Ropes slack.",
        return: "One flat evens the bed. The note stays.",
      },
    },
  }),
  item(23, {
    name: "Split-date spectacles",
    siteKind: "household",
    site: "Seminary Cut desk, Ellis’s house",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Recovered from Ellis’s desk, where Calder had left them on loan before the absence.",
      authored:
        "They are mine. The left lens cracked during the fourteen. Through the crack, a printed year reads fourteen years on. Through the clear lens it reads as printed. I tried them on the ferry ledger. I did not correct the ledger. The crack is not an editor.",
    },
    physical: {
      material: "Steel frame, one clear lens, one cracked lens",
      dimensions: "Frame 12 cm across",
      mass: "28 g",
      condition: "Left lens cracked; right lens clear; case stained",
      marks: "Temple engraving",
    },
    evidence: {
      howRead: "Read the engraving on the temple",
      readable: "I. Calder, loaned.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Read a printed date through each lens",
      needsRestore: false,
      outcomeKey: "date-split",
      useRule: "idempotent",
      outcome:
        "On the ferry ledger’s printed year, the clear lens reads the year as printed and the cracked lens reads it fourteen years later. Both readings are written down. The ledger is not altered.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "They are mine. The crack is not a license to correct dates in the register.",
    },
    persistence: {
      holds: "The loan engraving and the crack both remain. The ledger’s printed year is never ‘fixed.’",
      shift: "Pre-absence both lenses are clear and agree. After the crack they disagree by fourteen years and keep disagreeing.",
      presentation: {
        "pre-absence": "Both lenses clear. No disagreement.",
        "the-fourteen": "Left lens cracked in an empty house.",
        return: "Two readings, one page, no correction.",
      },
    },
  }),
  item(24, {
    name: "Three-match safe",
    siteKind: "household",
    site: "Silt House mantel, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Taken off the mantel after he was asked, wrongly, to light the lime kiln with it.",
      authored:
        "Three matches. The inside of the safe says kitchen, not the kiln. I struck none of them at Wick. They are for reading a label in a dark pantry. When they are gone they are gone.",
    },
    physical: {
      material: "Tin match safe, three wooden matches",
      dimensions: "Safe 5 cm",
      mass: "22 g",
      condition: "Hinge tight; matches dry",
      marks: "Interior scratch",
    },
    evidence: {
      howRead: "Open the safe and read the inside of the lid",
      readable: "Kitchen, not the kiln.",
    },
    interaction: {
      kind: "practical",
      verb: "Strike one match",
      needsRestore: false,
      outcomeKey: "match-lit",
      useRule: "matches-3",
      outcome:
        "A match strikes and burns long enough to read a label. Three matches, then the safe is empty. Emptiness is not a riddle. The scratch stays.",
    },
    restoration: null,
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "Three matches will not light Wick. Use them to read, then stop.",
    },
    persistence: {
      holds: "The interior scratch remains after the matches are spent.",
      shift: "The count of matches falls only when one is struck, and it does not refill in another era.",
      presentation: {
        "pre-absence": "Safe full, scratch absent.",
        "the-fourteen": "Three matches left. Scratch cut. Safe shut.",
        return: "Three lights at most. Then a readable empty tin.",
      },
    },
  }),
  item(25, {
    name: "Horn darning egg",
    siteKind: "household",
    site: "Wren cottage basket, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken from the mending basket with the gray sock it names.",
      authored:
        "The egg is horn, inked with the job it is for. I mended the heel. The person who wore the sock out was a picker who moved away. That is a fact of leaving, not a message from the Vein.",
    },
    physical: {
      material: "Horn egg",
      dimensions: "6 cm",
      mass: "30 g",
      condition: "Surface polished by use; ink intact",
      marks: "Ink label",
    },
    evidence: {
      howRead: "Read the ink around the middle",
      readable: "Heel of the gray sock — L. Wren.",
    },
    interaction: {
      kind: "practical",
      verb: "Mend the gray heel",
      needsRestore: false,
      outcomeKey: "heel-mended",
      useRule: "idempotent",
      outcome:
        "The egg supports a mend in the gray sock’s heel. The mend holds. No name is darned into the yarn.",
    },
    restoration: null,
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "Mend it. The person who wore it out is not a message.",
    },
    persistence: {
      holds: "The ink job-label stays readable after the mend.",
      shift: "The hole is open during the fourteen and closed after the mend. The label does not change jobs.",
      presentation: {
        "pre-absence": "Egg uninked, sock whole.",
        "the-fourteen": "Label written, heel worn through.",
        return: "The heel can be closed. The wearer stays a person who left.",
      },
    },
  }),
  item(26, {
    name: "Knife-tally lid",
    siteKind: "household",
    site: "Silt House pantry, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Tomas Voss",
      finder: "Tomas Voss",
      circumstance: "Taken off the bread crock, where it has been a board for years.",
      authored:
        "It was a chamber-pot lid. The underside is painted so nobody forgets that, and also so the Pells can say they never used it as a board while the cuts say someone did. I added one cut by slicing the dry roll. The paint is on the underside. I did not cut the paint.",
    },
    physical: {
      material: "Ceramic lid used as a board",
      dimensions: "18 cm across",
      mass: "240 g",
      condition: "Knife scars on the top; paint on the underside",
      marks: "Painted warning and a tally of cuts",
    },
    evidence: {
      howRead: "Turn the lid over and read the paint",
      readable: "Silt — bread, not night soil.",
    },
    interaction: {
      kind: "practical",
      verb: "Cut the dry roll",
      needsRestore: false,
      outcomeKey: "tally-cut",
      useRule: "idempotent",
      outcome:
        "One new knife scar joins the tally on the top face. The painted sentence on the underside is not cut, scraped, or softened.",
    },
    restoration: null,
    response: {
      who: "Tomas Voss",
      kind: "character",
      text: "We used it as a board. The Pells say they never did. The paint is the argument. Add a cut if you are hungry.",
    },
    persistence: {
      holds: "The underside paint remains the evidence, whatever the tally does.",
      shift: "The tally can gain a cut on return. The paint does not migrate to the other side to settle the argument.",
      presentation: {
        "pre-absence": "Lid in service, unpainted, unscarred.",
        "the-fourteen": "Painted and scarred, argument ongoing.",
        return: "One more scar is possible. The sentence stays underneath.",
      },
    },
  }),
  item(27, {
    name: "Four-note comb",
    siteKind: "household",
    site: "Wren cottage washstand, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken from the washstand with a slip of music paper caught in the teeth.",
      authored:
        "Four notes, labeled as not a hymn. I reseated the loose tooth and drew a nail across. The comb spoke those notes and no words. I will not add words because a room is quiet and people are suggestible.",
    },
    physical: {
      material: "Horn comb, one loose tooth, music-paper slip",
      dimensions: "12 cm",
      mass: "18 g",
      condition: "One tooth loose; others even",
      marks: "Slip caught in the teeth",
    },
    evidence: {
      howRead: "Read the slip before drawing a nail",
      readable: "A D F A — not a hymn.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Draw a nail across the teeth",
      needsRestore: true,
      outcomeKey: "four-notes",
      useRule: "idempotent",
      outcome:
        "The comb sounds A, D, F, A, in that order, in every era. No lyric arrives. A second pass repeats the same four notes.",
    },
    restoration: {
      applies: true,
      method: "Reseat the loose tooth with the spare pin kept in the slip’s fold.",
      result: "The run does not buzz. The slip’s sentence stays.",
    },
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Four notes are not a summons. Do not add words.",
    },
    persistence: {
      holds: "The written notes and the sounded notes remain the same four.",
      shift: "The loose tooth buzzes before it is reseated. Afterward the phrase is clean. It never grows a fifth note.",
      presentation: {
        "pre-absence": "Comb whole, no slip.",
        "the-fourteen": "Slip written and caught. One tooth loose.",
        return: "The same four notes, every era after the pin is seated.",
      },
    },
  }),
  item(28, {
    name: "Crackle basin",
    siteKind: "household",
    site: "Marrow Kiln cottage, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Nessa Ives",
      finder: "Nessa Ives",
      circumstance: "Taken from the cottage washstand after the kiln’s clay pit shut.",
      authored:
        "The maker’s mark admits the crack. I filled it with the slip that was fired into a cake in the soap dish. After that the basin held water and became ordinary, which is what I wanted. The Vein does not get to keep a washbasin.",
    },
    physical: {
      material: "Earthenware basin, kiln slip cake",
      dimensions: "28 cm across",
      mass: "900 g",
      condition: "Crack through the foot; mark intact",
      marks: "Painted maker’s mark",
    },
    evidence: {
      howRead: "Read the mark on the foot",
      readable: "MARROW KILN — crack acknowledged.",
    },
    interaction: {
      kind: "practical",
      verb: "Fill the basin",
      needsRestore: true,
      outcomeKey: "basin-holds",
      useRule: "idempotent",
      outcome:
        "After the crack is filled, the basin holds water. It does nothing else. The maker’s mark stays readable on the foot.",
    },
    restoration: {
      applies: true,
      method: "Rub the included slip cake into the crack and let it set.",
      result: "The crack is sealed. The mark is not overpainted.",
    },
    response: {
      who: "Nessa Ives",
      kind: "character",
      text: "Marrow Kiln closed when the clay pit sighed shut. The basin is ordinary once it holds. Let it be ordinary.",
    },
    persistence: {
      holds: "The mark, including the admission of the crack, remains.",
      shift: "Before the slip, water leaves. After, water stays. No era turns the basin into an oracle.",
      presentation: {
        "pre-absence": "Basin sound, mark not yet painted.",
        "the-fourteen": "Cracked and marked. Slip cake waiting in the soap dish.",
        return: "Filled, it is a basin again.",
      },
    },
  }),
  item(29, {
    name: "Quarry-nail opener",
    siteKind: "household",
    site: "Seminary Cut desk, Ellis’s house",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Taken from the desk tray with the survey envelope it was meant to open.",
      authored:
        "The nail head is Wick’s. The wax note limits the job to one envelope. I slit the flap without tearing the seal legend. Inside is a printed header and no assignment. I am relieved, and I am writing that down so nobody turns a header into work.",
    },
    physical: {
      material: "Quarry nail ground to an opener, waxed note",
      dimensions: "12 cm",
      mass: "25 g",
      condition: "Edge keen; stamp intact",
      marks: "Wick stamp and wax note",
    },
    evidence: {
      howRead: "Read the stamp, then the wax note",
      readable: "WICK. Wax: for the survey envelope only.",
    },
    interaction: {
      kind: "practical",
      verb: "Slit the survey envelope",
      needsRestore: false,
      outcomeKey: "envelope-slit",
      useRule: "idempotent",
      outcome:
        "The flap opens. The seal legend stays intact. Inside is a form whose only printing is the header UNFINISHED WORK — DO NOT COMPLETE. The form is not an assignment.",
    },
    restoration: null,
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "The form is a header. An empty form is not an assignment.",
    },
    persistence: {
      holds: "The wax limitation and the header both remain. The form does not fill itself in.",
      shift: "The envelope is sealed before the slit and open after. The header does not grow items.",
      presentation: {
        "pre-absence": "Nail still a nail. Envelope not yet addressed.",
        "the-fourteen": "Ground to an opener. Envelope sealed and waiting.",
        return: "One slit. One header. No task list.",
      },
    },
  }),
  item(30, {
    name: "Marble-heel sock",
    siteKind: "household",
    site: "Seminary Cut bedroom, Ellis’s house",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Found folded in the Absence Room, pebble darned into the heel.",
      authored:
        "I did not put the pebble there. The tag names the Vein mouth. Worn, the pebble warms, and my step on the tram scree goes steady for one crossing of that ground. It does not introduce me to anyone. It keeps my ankle mine.",
    },
    physical: {
      material: "Wool sock, marble pebble, darn thread, tag",
      dimensions: "Pebble 2 cm",
      mass: "Sock and pebble 48 g",
      condition: "Heel darned shut around the pebble",
      marks: "Tied tag",
    },
    evidence: {
      howRead: "Read the tag at the cuff",
      readable: "Pebble from the Vein mouth, keep in the heel.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Wear the sock across the scree",
      needsRestore: false,
      outcomeKey: "steady-step",
      useRule: "per-era",
      outcome:
        "The pebble warms. Ellis’s next crossing of the tram scree is steady. The effect is one crossing in the current era, then the pebble is only warm stone until the era changes.",
    },
    restoration: null,
    response: {
      who: "Ellis",
      kind: "character",
      text: "I did not put it there. I will wear it across the tram and that is all.",
    },
    persistence: {
      holds: "The tag and the pebble stay in the heel. The pebble is never ‘used up’ into a voice.",
      shift: "Warmth and the steady step refresh once per era and do not accumulate into a longer power.",
      presentation: {
        "pre-absence": "Sock undarned, no pebble.",
        "the-fourteen": "Pebble darned in. Tag tied. Sock unworn.",
        return: "One steady crossing in this era. Then it is a sock again.",
      },
    },
  }),
  item(31, {
    name: "Scratched recipe card",
    siteKind: "household",
    site: "Silt House recipe tin, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "June Pell",
      finder: "June Pell",
      circumstance: "Taken from the tin after Tomas identified the scratch as his aunt’s and June identified it as hers.",
      authored:
        "The card is shortbread. The fourth line is scratched out and still readable, which is the point of a bad scratch. It says to add marble dust and then tells you not to. I bake the uncrossed lines. I do not bake the dust. Tomas and I can fight about whose aunt later.",
    },
    physical: {
      material: "Grease-stained card",
      dimensions: "10 by 15 cm",
      mass: "2 g",
      condition: "Fourth line scratched, still legible",
      marks: "Scratch over a full line",
    },
    evidence: {
      howRead: "Read under the scratch with a low lamp; do not ink the line back in",
      readable: "Fourth line, scratched and still legible: a pinch of marble dust — do not.",
    },
    interaction: {
      kind: "practical",
      verb: "Bake the uncrossed lines",
      needsRestore: false,
      outcomeKey: "shortbread-made",
      useRule: "idempotent",
      outcome:
        "Shortbread is made from the uncrossed lines: flour, butter, sugar, a pinch of salt. The scratched line is not followed. No marble dust goes into the pan. The scratch stays readable.",
    },
    restoration: null,
    response: {
      who: "June Pell",
      kind: "character",
      text: "My aunt scratched it. Tomas says his aunt wrote it. Neither of us bakes the dust. Neither does Ellis.",
    },
    persistence: {
      holds: "The scratched prohibition stays legible and is never restored into an instruction.",
      shift: "Grease darkens. The words under the scratch do not fade into permission.",
      presentation: {
        "pre-absence": "Card unwritten.",
        "the-fourteen": "Recipe written, fourth line scratched and left readable.",
        return: "The bake follows the open lines only.",
      },
    },
  }),
  item(32, {
    name: "Seminary Cut key",
    siteKind: "household",
    site: "Seminary Cut latch, Ellis’s house",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Found hung on the latch it opens, slightly bent, with a paper bow.",
      authored:
        "SC-1. The paper says latch, not the desk. I straightened it and opened my own door. Calder’s desk in the same room did not answer it, which is correct. The house is mine. The register is not a drawer in it.",
    },
    physical: {
      material: "Iron key, paper label",
      dimensions: "8 cm",
      mass: "20 g",
      condition: "Bit slightly bent; bow stamped",
      marks: "Stamp and paper",
    },
    evidence: {
      howRead: "Read the bow stamp and the paper",
      readable: "SC-1. Paper: latch, not the desk.",
    },
    interaction: {
      kind: "practical",
      verb: "Turn the key in the latch",
      needsRestore: true,
      outcomeKey: "latch-open",
      useRule: "idempotent",
      outcome:
        "The Absence Room latch opens. The Conservancy desk in the same room does not. One key, one latch.",
    },
    restoration: {
      applies: true,
      method: "Straighten the bit in the vise with a leather wrap so the stamp is not crushed.",
      result: "The bit enters the latch. The paper stays on the bow.",
    },
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "The house is Ellis’s. The desk is the record we are keeping honest. One key, one latch.",
    },
    persistence: {
      holds: "The paper limitation stays on the bow. The key never learns the desk.",
      shift: "Bent through the fourteen, usable after straightening, still limited to the latch.",
      presentation: {
        "pre-absence": "Key in Ellis’s pocket, straight, no paper.",
        "the-fourteen": "Hung on the latch, bent, paper added.",
        return: "It opens the latch and refuses the desk.",
      },
    },
  }),
];
