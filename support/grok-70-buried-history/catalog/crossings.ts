import { item } from "../define.ts";
import type { HistoryObject } from "../types.ts";

export const crossings: HistoryObject[] = [
  item(33, {
    name: "Glass Ferry token",
    siteKind: "vanished-crossing",
    site: "Glass Ferry stones, Otter cutoff",
    binding: "excavate",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Sifted from the stones where the bend used to take a boat, now orchard grass.",
      authored:
        "The token says it is good until the bend remains. The bend does not remain. I presented it at the Conservancy bell-gate anyway. The landing bell, which is uphill now, rang once. I was not moved to another shore. A passage was logged for a crossing that is a sentence, not a river.",
    },
    physical: {
      material: "Brass token",
      dimensions: "3 cm",
      mass: "12 g",
      condition: "Rim worn; face stamped deep",
      marks: "Full face stamp",
    },
    evidence: {
      howRead: "Read the face in daylight",
      readable: "GLASS FERRY — ONE CROSSING — GOOD UNTIL THE BEND REMAINS.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Present the token at the bell-gate",
      needsRestore: false,
      outcomeKey: "bell-passage",
      useRule: "idempotent",
      outcome:
        "The landing bell rings once. A passage is logged. Ellis does not change shores. No channel is dug back into the orchard.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "The bend is orchard now. The token is valid and the water is not there. Log the passage. Do not dig a canal.",
    },
    persistence: {
      holds: "The token’s condition of validity stays stamped, even though the bend is gone.",
      shift: "Pre-absence the token would have bought a wet crossing. Later it buys only a logged ring.",
      presentation: {
        "pre-absence": "Token in a pocket, bend still a ferry landing.",
        "the-fourteen": "Token in the stones, landing already gone.",
        return: "Valid as a ring and a log line. Not as a boat.",
      },
    },
  }),
  item(34, {
    name: "Baggage token",
    siteKind: "vanished-crossing",
    site: "Glass Ferry intake cage, Conservancy",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Recovered from the intake cage, punched, tied to a claim wire.",
      authored:
        "Bag 14 is a satchel of dry clothes. The punch matches the claim wire. I am recording the redemption as clothes, because someone will want it to be letters from the unrealized daughter of the landing. It is clothes.",
    },
    physical: {
      material: "Punched brass token, claim wire",
      dimensions: "3 cm",
      mass: "14 g",
      condition: "Punch clean; wire intact",
      marks: "Punch and stamp",
    },
    evidence: {
      howRead: "Read the stamp around the punch",
      readable: "BAG 14 — GLASS FERRY.",
    },
    interaction: {
      kind: "practical",
      verb: "Redeem bag 14",
      needsRestore: false,
      outcomeKey: "satchel-claimed",
      useRule: "idempotent",
      outcome:
        "The cage releases one satchel of dry clothes. There is no second bag and no packet of letters.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "Bag 14 is a satchel of dry clothes. Claim it. There is no second bag.",
    },
    persistence: {
      holds: "The punch and the bag number remain the claim.",
      shift: "Unclaimed during the fourteen, claimed only when redeemed. The contents do not change into documents.",
      presentation: {
        "pre-absence": "Token unpunched at the landing.",
        "the-fourteen": "Punched and waiting on the claim wire.",
        return: "One satchel, clothes, nothing secreted inside the lining.",
      },
    },
  }),
  item(35, {
    name: "Torn oarlock",
    siteKind: "vanished-crossing",
    site: "Glass Ferry stones, Otter cutoff",
    binding: "excavate",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Dug from the mud with a curl of green-and-white gunwale paint still on the bronze.",
      authored:
        "The screws are bent. I straightened them and mounted the lock on the remaining thwart. The punt does not float. The oar now has a place to rest that is not the mud. That is the whole repair I am willing to mean.",
    },
    physical: {
      material: "Bronze oarlock, two bent screws",
      dimensions: "Lock 8 cm",
      mass: "180 g",
      condition: "Torn from a gunwale; paint line preserved",
      marks: "Paint line green over white",
    },
    evidence: {
      howRead: "Read the paint layers on the bronze cheek",
      readable: "GREEN / WHITE",
    },
    interaction: {
      kind: "practical",
      verb: "Mount the oarlock",
      needsRestore: true,
      outcomeKey: "oarlock-mounted",
      useRule: "idempotent",
      outcome:
        "The lock mounts on the remaining thwart. An oar can sit in it. The punt does not float and is not asked to.",
    },
    restoration: {
      applies: true,
      method: "Straighten the two screws on a block. Do not scrape the paint line.",
      result: "The screws turn. The paint layers stay.",
    },
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "Mount it so the oar has a place. We are not refloating the punt.",
    },
    persistence: {
      holds: "The green-over-white paint remains the evidence of which boat it left.",
      shift: "Unmounted and bent during the fourteen; mounted on return; the boat stays a thwart and not a ferry.",
      presentation: {
        "pre-absence": "Fastened to a floating punt.",
        "the-fourteen": "Torn off and buried with the paint still on it.",
        return: "Mounted to a thwart that does not float.",
      },
    },
  }),
  item(36, {
    name: "Horn reed",
    siteKind: "vanished-crossing",
    site: "Glass Ferry horn box, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken from the horn box that was carried uphill with the bell.",
      authored:
        "The pitch mark says to call the bank, not a boat. I closed the split with the band and sounded it. The note is low and correct. No crew answered, because the rule and the crew are not the same thing. I am not writing that the quarry answered. Sound does not owe us a correspondence.",
    },
    physical: {
      material: "Cane reed, pitch-marked collar, brass band",
      dimensions: "Reed 7 cm",
      mass: "6 g",
      condition: "Split at the tip until banded",
      marks: "Ink pitch mark",
    },
    evidence: {
      howRead: "Read the collar before sounding",
      readable: "LOW — CALL THE BANK, NOT A BOAT.",
    },
    interaction: {
      kind: "practical",
      verb: "Sound the reed",
      needsRestore: true,
      outcomeKey: "low-note",
      useRule: "idempotent",
      outcome:
        "The reed sounds the low note its mark names. No boat and no crew arrive. The note matches the mark and then stops.",
    },
    restoration: {
      applies: true,
      method: "Pinch the split shut with the included brass band.",
      result: "The tip is closed enough to speak. The ink mark is not covered.",
    },
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "Landing rule, copied into our book: the horn calls the bank crew. There is no crew. The note is still the correct note.",
    },
    persistence: {
      holds: "The pitch mark remains the instruction and the limit.",
      shift: "Split and silent before banding; low and correct after. It never learns a second call.",
      presentation: {
        "pre-absence": "Reed whole, in a horn that called a living crew.",
        "the-fourteen": "Split, boxed, carried uphill.",
        return: "One low note. No answer required.",
      },
    },
  }),
  item(37, {
    name: "Lifted ledger page",
    siteKind: "vanished-crossing",
    site: "Glass Ferry stones, Otter cutoff",
    binding: "excavate",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Peeled from the mud where the fare desk had stood.",
      authored:
        "The page is cockled. Pressed, the pencil fares are readable. Bramble, Wren, one unnamed, and a passage refused. I filed the totals. I did not sell the refused seat backward into the past.",
    },
    physical: {
      material: "Ledger paper, pencil",
      dimensions: "18 by 24 cm",
      mass: "6 g",
      condition: "Cockled, water-lifted, not holed",
      marks: "Pencil fare lines",
    },
    evidence: {
      howRead: "Press flat, then read the pencil; do not ink over it",
      readable: "H. Bramble. L. Wren. One unnamed. Passage refused.",
    },
    interaction: {
      kind: "practical",
      verb: "File the fare totals",
      needsRestore: true,
      outcomeKey: "fares-filed",
      useRule: "idempotent",
      outcome:
        "The totals are copied into the working file. The page stays intact, pencil uninked. The refused passage remains refused.",
    },
    restoration: {
      applies: true,
      method: "Press the page between dry boards until it lies flat.",
      result: "The pencil can be read without cracking the sheet.",
    },
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "Refused passage stays refused. Do not sell the seat retroactively.",
    },
    persistence: {
      holds: "The four fare lines, including the refusal, remain on the page.",
      shift: "Illegible while cockled, readable when pressed, never rewritten as a full boat.",
      presentation: {
        "pre-absence": "Page in a book at the landing, not yet these lines.",
        "the-fourteen": "Lifted, cockled, in the mud.",
        return: "Pressed and filed. Refusal kept.",
      },
    },
  }),
  item(38, {
    name: "Stamped chain link",
    siteKind: "vanished-crossing",
    site: "Glass Ferry guide-chain end, Otter cutoff",
    binding: "excavate",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Cut free of the last buried meter of guide-chain, with a wax rubbing of a token rim in the same clod.",
      authored:
        "The link’s edge carries a twin-hatch. The rubbing, made before the token went to intake, carries the same hatch. I compared them. They match. That confirms the link and the token were issued together. It does not confirm that a boat is owed.",
    },
    physical: {
      material: "Iron link, wax rubbing folded in oiled paper",
      dimensions: "Link 8 cm",
      mass: "140 g",
      condition: "Stamp worn but matched by the rubbing",
      marks: "Twin-hatch on the edge",
    },
    evidence: {
      howRead: "Compare the edge stamp to the rubbing included with the link",
      readable: "Twin-hatch mark.",
    },
    interaction: {
      kind: "practical",
      verb: "Compare the link to its rubbing",
      needsRestore: false,
      outcomeKey: "hatch-confirmed",
      useRule: "idempotent",
      outcome:
        "The link and the rubbing match. Issuance together is confirmed. No boat is implied, summoned, or promised.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "A match confirms the token and the chain were issued together. It does not confirm the boat.",
    },
    persistence: {
      holds: "The twin-hatch and the rubbing remain a pair.",
      shift: "Buried during the fourteen, comparable on return. The match does not strengthen into a summons if repeated.",
      presentation: {
        "pre-absence": "Link in a chain that still guided a boat.",
        "the-fourteen": "Buried at the chain’s end with the rubbing.",
        return: "A match, and nothing that follows from it but the match.",
      },
    },
  }),
  item(39, {
    name: "River hood",
    siteKind: "vanished-crossing",
    site: "Glass Ferry stones, Otter cutoff",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Pulled off a stake where someone had left it to keep a plank’s pencil from the rain.",
      authored:
        "The brim says to wear it to read the wet plank. I wore it. The plank’s pencil, which beads and blurs without the hood, reads BELL MOVED UPHILL. I already half-knew that. The hood did not add a direction beyond the plank.",
    },
    physical: {
      material: "Oilskin hood",
      dimensions: "Hood for one head",
      mass: "180 g",
      condition: "Seams tarred; brim penciled",
      marks: "Brim pencil",
    },
    evidence: {
      howRead: "Read the pencil on the brim",
      readable: "Wear to read the wet plank.",
    },
    interaction: {
      kind: "practical",
      verb: "Read the wet plank while wearing the hood",
      needsRestore: false,
      outcomeKey: "plank-read",
      useRule: "idempotent",
      outcome:
        "While the hood is worn, the rain-blurred pencil on the landing plank reads: BELL MOVED UPHILL. Without the hood the plank beads and will not be read. The plank is not a new object and not a route.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "The bell was moved uphill to the Conservancy hook. Knowing that is not a task. Do not carry it back down to make the landing true again.",
    },
    persistence: {
      holds: "The brim instruction remains. The plank sentence does not change.",
      shift: "The plank is readable only under the hood, in every era after the pencil was written. The bell stays uphill.",
      presentation: {
        "pre-absence": "Hood on a peg, plank unpenciled, bell at the landing.",
        "the-fourteen": "Hood on the stake, plank written, bell already moved.",
        return: "The hood makes one sentence readable. The sentence is a fact already true.",
      },
    },
  }),
  item(40, {
    name: "Fourteen-click whistle",
    siteKind: "vanished-crossing",
    site: "Otter ice road, cutoff",
    binding: "excavate",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Thawed out of the ice-road gravel with its lanyard still on.",
      authored:
        "The pea was stuck. I freed it and blew once. Fourteen clicks, then silence. No voice. Fourteen is how long I was gone, which Calder already counts on a better tool than a whistle. I will not blow it until a fifteenth appears. A fifteenth is not coming.",
    },
    physical: {
      material: "Tin whistle, cotton lanyard",
      dimensions: "6 cm",
      mass: "15 g",
      condition: "Pea stuck until freed; engraving sharp",
      marks: "Engraved line",
    },
    evidence: {
      howRead: "Read the engraving along the barrel",
      readable: "LAST BOAT — COUNT THE HOUR.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Blow the lanyard whistle",
      needsRestore: true,
      outcomeKey: "fourteen-clicks",
      useRule: "idempotent",
      outcome:
        "One blast becomes fourteen clicks and stops. There is no voice and no fifteenth click. A second blast repeats the same count.",
    },
    restoration: {
      applies: true,
      method: "Free the pea with a dry grass stem. Do not wash the engraving.",
      result: "The pea moves. The engraving stays.",
    },
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Fourteen is the length of the absence, which we already count. The whistle confirms the landing’s habit of counting. It does not name a fifteenth.",
    },
    persistence: {
      holds: "The engraved order to count, and the count of fourteen, do not drift.",
      shift: "Silent while the pea is stuck; fourteen clicks after. The count does not grow if Ellis stays longer.",
      presentation: {
        "pre-absence": "Whistle used for boats, pea free, no engraving.",
        "the-fourteen": "Engraved and frozen into the ice road.",
        return: "Fourteen clicks. Stop.",
      },
    },
  }),
  item(41, {
    name: "Fare-box key",
    siteKind: "vanished-crossing",
    site: "Glass Ferry fare box, Conservancy store",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Recovered on the ring with the fare box itself, brought uphill unopened.",
      authored:
        "The tag says the specie stays in the box. I opened it, counted three landing tokens in place, and closed it. Taking them would make the record lighter in the hand and poorer in the file. The lock on the coins is the same lock as on evidence.",
    },
    physical: {
      material: "Iron key, paper tag, with the fare box",
      dimensions: "Key 6 cm",
      mass: "18 g",
      condition: "Key turns; box intact",
      marks: "Tag on the bow",
    },
    evidence: {
      howRead: "Read the tag before turning the key",
      readable: "Specie stays in the box.",
    },
    interaction: {
      kind: "practical",
      verb: "Open the fare box",
      needsRestore: false,
      outcomeKey: "box-opened-specie-locked",
      useRule: "idempotent",
      outcome:
        "The box opens. Three landing tokens are counted in place and cannot be removed. Closing the box does not erase the count.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "Count them in place. Removing specie from a vanished fare box is how records go missing. The lock on the coins is the same lock as on evidence.",
    },
    persistence: {
      holds: "The tag and the three tokens remain together. The tokens cannot be spent or discarded.",
      shift: "The box is shut through the fourteen and countable on return. The count stays three.",
      presentation: {
        "pre-absence": "Box on the landing, taking fares.",
        "the-fourteen": "Carried uphill shut, tag written.",
        return: "Opened, counted, not emptied.",
      },
    },
  }),
  item(42, {
    name: "Marline hank",
    siteKind: "vanished-crossing",
    site: "Lantern Crossing pier, north plank",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Hung on the north plank’s nail, tarred and tagged.",
      authored:
        "The tag names the plank. I lashed the loose board so a person would not put a foot through. I did not extend the lashing toward the far bank. There is no far bank structure left to meet.",
    },
    physical: {
      material: "Tarred marline",
      dimensions: "Hank of about 4 m",
      mass: "90 g",
      condition: "Tar flexible; tag readable",
      marks: "Tied tag",
    },
    evidence: {
      howRead: "Read the tag at the hank’s throat",
      readable: "Pier plank, north.",
    },
    interaction: {
      kind: "practical",
      verb: "Lash the north plank",
      needsRestore: false,
      outcomeKey: "plank-lashed",
      useRule: "idempotent",
      outcome:
        "The loose north plank is lashed to the pier frame. It holds a person’s weight. The lashing does not reach a vanished farther shore.",
    },
    restoration: null,
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Lash it so no one falls. The plank is not a bridge back.",
    },
    persistence: {
      holds: "The tag continues to name the north plank and no other timber.",
      shift: "The plank is loose during the fourteen and secure after the lashing. It never becomes a span.",
      presentation: {
        "pre-absence": "Hank in a locker, plank fast.",
        "the-fourteen": "Hank tagged and hung. Plank loose.",
        return: "One plank made safe. Not a crossing.",
      },
    },
  }),
  item(43, {
    name: "Landing clapper",
    siteKind: "vanished-crossing",
    site: "Conservancy bell hook, uphill from Glass Ferry",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken from a coat pocket in the store, where it spent the fourteen.",
      authored:
        "Cast letters: GLASS. In the hand it is silent, which is correct for a clapper with nothing to strike. Hung on our hook, it rings when a vanished-crossing inscription is in the register — its own inscription counts. It does not ring for workshops or orchards. I will not cast a new bell around it.",
    },
    physical: {
      material: "Cast bronze clapper",
      dimensions: "14 cm",
      mass: "320 g",
      condition: "Crown eye intact; letters sharp",
      marks: "Cast letters",
    },
    evidence: {
      howRead: "Read the letters cast into the waist",
      readable: "GLASS",
    },
    interaction: {
      kind: "supernatural",
      verb: "Hang the clapper on the hook",
      needsRestore: false,
      outcomeKey: "clapper-rings",
      useRule: "idempotent",
      outcome:
        "If a vanished-crossing inscription is already in the register, the clapper rings once when hung. If none is registered, it hangs silent until one is. Its own registered inscription is enough. It does not call a boat.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "The clapper was carried uphill in a coat pocket during the fourteen. Hang it. Do not cast a new bell.",
    },
    persistence: {
      holds: "The cast word GLASS remains the condition of the ring.",
      shift: "Silent in a pocket through the fourteen; able to ring on return only against registered crossing evidence.",
      presentation: {
        "pre-absence": "In the landing bell, ringing for boats.",
        "the-fourteen": "In a coat pocket, silent.",
        return: "Rings once for a registered crossing inscription. Then it is bronze again.",
      },
    },
  }),
  item(44, {
    name: "Passage chalk",
    siteKind: "vanished-crossing",
    site: "Lantern Crossing pier",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Picked off the pier cap beside the safe plank.",
      authored:
        "Half a stick, banded. I marked a white bar on the safe plank. When I shifted era the bar was still chalk. That is the test Calder asked for. Not a vision. Chalk.",
    },
    physical: {
      material: "White chalk, paper band",
      dimensions: "4 cm remaining",
      mass: "8 g",
      condition: "Half consumed; band intact",
      marks: "Printed band",
    },
    evidence: {
      howRead: "Read the band",
      readable: "Mark the safe plank.",
    },
    interaction: {
      kind: "practical",
      verb: "Chalk a bar on the safe plank",
      needsRestore: false,
      outcomeKey: "chalk-bar",
      useRule: "idempotent",
      outcome:
        "A white chalk bar marks the safe plank. Across era changes it remains chalk, not a glow and not a ghost of a bar.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Chalk is a working mark. When you change eras it is still chalk. That is the test.",
    },
    persistence: {
      holds: "The bar, once drawn, persists as chalk in every era. The band’s instruction does not rewrite itself.",
      shift: "No mark before use. After use, ordinary chalk in pre-absence light, in the fourteen’s damp, and in return sun.",
      presentation: {
        "pre-absence": "Full stick in a pocket, plank unmarked.",
        "the-fourteen": "Half a stick, banded, waiting.",
        return: "One bar. It survives the era switch as chalk.",
      },
    },
  }),
  item(45, {
    name: "Rope-haired cleat",
    siteKind: "vanished-crossing",
    site: "Glass Ferry stones, Otter cutoff",
    binding: "excavate",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Pried from a buried stringer, one horn bent, rope hairs caught in the casting.",
      authored:
        "Stamped GF-2. I straightened the horn and belayed the oar so it would hang rather than lie in the mud. There is no passenger to hand down into a boat. The cleat’s job is the oar.",
    },
    physical: {
      material: "Iron cleat",
      dimensions: "12 cm",
      mass: "260 g",
      condition: "One horn bent; rope hairs in the grain of the rust",
      marks: "Stamp GF-2",
    },
    evidence: {
      howRead: "Read the stamp on the base",
      readable: "GF-2",
    },
    interaction: {
      kind: "practical",
      verb: "Belay the oar",
      needsRestore: true,
      outcomeKey: "line-belayed",
      useRule: "idempotent",
      outcome:
        "A line on the cleat holds the oar off the mud. No passenger is belayed, because none is there.",
    },
    restoration: {
      applies: true,
      method: "Straighten the bent horn cold. Do not wire-brush the rope hairs off.",
      result: "The horn will take a turn. The hairs remain as evidence of old rope.",
    },
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "Belay the oar. There is no passenger.",
    },
    persistence: {
      holds: "The GF-2 stamp and the rope hairs remain.",
      shift: "Bent and buried during the fourteen; able to hold a line on return; never assigned a passenger.",
      presentation: {
        "pre-absence": "Fast on a stringer, holding working lines.",
        "the-fourteen": "Buried, horn bent, hairs trapped in rust.",
        return: "Holds an oar off the mud. That is the load.",
      },
    },
  }),
  item(46, {
    name: "Otter stage stick",
    siteKind: "vanished-crossing",
    site: "Lantern Crossing pier",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Leaned in the pier crib, bands overpainted.",
      authored:
        "The bands read cutoff dry, knee, and gunwale. One older band was painted out. I read the stain first: knee. Then I lifted the overpaint and the old band says BEND. I am keeping both. Averaging them would donate the landing a depth it does not have.",
    },
    physical: {
      material: "Painted pine pole",
      dimensions: "160 cm",
      mass: "700 g",
      condition: "One band overpainted; others clear",
      marks: "Three stage names and a hidden fourth",
    },
    evidence: {
      howRead: "Read the open bands before lifting paint",
      readable: "CUTOFF DRY / KNEE / GUNWALE.",
    },
    interaction: {
      kind: "practical",
      verb: "Read the stage against the stain",
      needsRestore: false,
      outcomeKey: "stage-read",
      useRule: "idempotent",
      outcome:
        "Against today’s stain the stick reads KNEE.",
      outcomeIfRestored:
        "The lifted band BEND is visible beside KNEE. The stain still reads KNEE. Both readings stay. They are not averaged.",
    },
    restoration: {
      applies: true,
      method: "Lift the overpaint with a dry scalpel along the old band only.",
      result: "BEND is visible. The three newer bands are not scraped off.",
    },
    priorPhysical: "Before lifting: overpaint hides a band. Open bands read CUTOFF DRY / KNEE / GUNWALE.",
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Knee is the stain today. Bend is the band they hid. Record both. Do not average them.",
    },
    persistence: {
      holds: "KNEE remains the stain reading even after BEND is revealed.",
      shift: "The hidden band is part of the stick in every era; only attention changes. The water stain does not jump to match the hidden band.",
      presentation: {
        "pre-absence": "Bands fresh, BEND not yet painted out, landing still a bend.",
        "the-fourteen": "BEND overpainted. Stick left in the crib.",
        return: "Stain says KNEE. Lifted paint can also say BEND. Both are kept.",
      },
    },
  }),
  item(47, {
    name: "Clenched boat nail",
    siteKind: "vanished-crossing",
    site: "Glass Ferry stones, Otter cutoff",
    binding: "excavate",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Lifted from the stones with a splinter still clenched under the head.",
      authored:
        "The tag warns me to register before I pull. I am not going to pull. The splinter is from a boat that was only a plan. Tightening the clench keeps the splinter in the record. Drawing it is the destroyer’s move, and the desk will not do it.",
    },
    physical: {
      material: "Iron nail, clenched over a splinter",
      dimensions: "Nail 6 cm",
      mass: "15 g",
      condition: "Clench tight; splinter sound",
      marks: "Tied tag",
    },
    evidence: {
      howRead: "Read the tag",
      readable: "Splinter is from a boat never built — register before you pull.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Tighten the clenched nail",
      needsRestore: false,
      outcomeKey: "clench-tight",
      useRule: "idempotent",
      outcome:
        "A tap tightens the clench. The splinter stays. The nail will not draw, registered or not. The unrealized boat remains a splinter and not a keel.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "The splinter is evidence of a boat that was only a plan. Tightening keeps it. Drawing it is what discard already may not do.",
    },
    persistence: {
      holds: "The splinter remains under the clench in every era after the nail is found.",
      shift: "Loose in the plan-stage, clenched during the fourteen, tighter if tapped on return. Never withdrawn.",
      presentation: {
        "pre-absence": "Nail in a keg, splinter not yet caught.",
        "the-fourteen": "Clenched over the plan-splinter and buried.",
        return: "It can be tightened. It cannot be pulled.",
      },
    },
  }),
  item(48, {
    name: "River-polished lens",
    siteKind: "vanished-crossing",
    site: "Lantern Crossing pier",
    binding: "excavate",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Sifted from the pier gravel, rim scratched, glass polished by the creek.",
      authored:
        "The rim says it is for wet stone. Focused through a lamp, the stone at the chain’s end reads CHAIN ENDS HERE. I wanted it to say something I could walk toward. It says the chain ends. I am leaving that as the reading.",
    },
    physical: {
      material: "Glass lens, scratched metal rim",
      dimensions: "6 cm",
      mass: "40 g",
      condition: "Glass clear; rim scratch shallow",
      marks: "Rim scratch",
    },
    evidence: {
      howRead: "Read the scratch on the rim",
      readable: "For wet stone.",
    },
    interaction: {
      kind: "practical",
      verb: "Focus the lamp through the lens",
      needsRestore: false,
      outcomeKey: "stone-read",
      useRule: "idempotent",
      outcome:
        "The wet stone at the chain’s end becomes readable: CHAIN ENDS HERE. The lens does not show a continuation, a tunnel, or a further inscription.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "The chain ended. The lens does not extend it.",
    },
    persistence: {
      holds: "The rim’s job description and the stone’s four words remain the whole reading.",
      shift: "The stone is illegible without the lens and exact with it, in every era after the scratch was cut.",
      presentation: {
        "pre-absence": "Lens in a lantern on a living crossing.",
        "the-fourteen": "In the gravel, polished, rim scratched.",
        return: "It reads an ending. Not a next page.",
      },
    },
  }),
];
