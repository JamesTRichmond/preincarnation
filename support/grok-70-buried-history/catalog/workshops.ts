import { item } from "../define.ts";
import type { HistoryObject } from "../types.ts";

export const workshops: HistoryObject[] = [
  item(1, {
    name: "Unfinished smoothing plane",
    siteKind: "workshop",
    site: "Hale & Bramble bench, Marrow Notch",
    binding: "excavate",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Lifted from curl-packed dust under the bench in the first week of Return Autumn.",
      authored:
        "I cleared the curls with my hands. The plane sat mid-cheek, iron proud, as if the push had stopped and the stop had lasted the whole fourteen years. I am writing this before I push it.",
    },
    physical: {
      material: "Beech stock, forged iron, horn insert in the tote",
      dimensions: "22 cm long; iron 4.5 cm wide",
      mass: "780 g",
      condition: "Cheek unfinished; bevel dull; stamp face bright",
      marks: "Owner’s mark cut into the iron during the absence, not on the bevel",
    },
    evidence: {
      howRead: "Raking lamp across the iron face",
      readable: "E.L. — finish the cheek when you are back. AY6.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Push the plane along the unfinished cheek",
      needsRestore: true,
      outcomeKey: "absence-shaving",
      useRule: "idempotent",
      outcome:
        "One shaving lifts. Caught in it is bench dust from the years the shop stood shut. The cheek is no more finished than it was. The shaving is a sample, not a completed plane.",
    },
    restoration: {
      applies: true,
      method: "Hone the iron on the stone still in the till.",
      result: "The edge cuts. The AY6 mark is off the bevel and stays.",
    },
    response: {
      who: "Harlan Bramble",
      kind: "character",
      text: "That mark was not on the iron the morning Ellis died. I will not plane it off, and I will not ask Ellis to finish my bench.",
    },
    persistence: {
      holds: "The E.L. mark and the AY6 date stay on the iron in every era.",
      shift: "Only the presence of the shaving changes. The interrupted cheek does not become a finished tool.",
      presentation: {
        "pre-absence": "Bare cheek, no mark yet, iron still bright from the grind that morning.",
        "the-fourteen": "A dry shaving already sits in the throat. The mark is there. No one is at the bench.",
        return: "The mark is warm in Ellis’s hand. One new shaving can be lifted. The cheek stays unfinished.",
      },
    },
  }),
  item(2, {
    name: "Pitch-handled awl",
    siteKind: "workshop",
    site: "Hale & Bramble scrap bin, Marrow Notch",
    binding: "excavate",
    discovery: {
      author: "Portia Hale",
      finder: "Portia Hale",
      circumstance: "Screened from the bin after the bench was opened, same week.",
      authored:
        "The handle is a knob of pitch poured around the tang after a burn. I almost called it trash. The stamp survived in the metal, so the burn is part of the record and the point still punches.",
    },
    physical: {
      material: "Steel awl, pitch handle, cotton wick frozen in the pitch",
      dimensions: "11 cm overall; point 3 cm",
      mass: "40 g",
      condition: "Point bright; pitch crazed but solid",
      marks: "Heat-warped shop stamp on the tang",
    },
    evidence: {
      howRead: "Magnifier on the tang, pitch pushed aside with a thumbnail",
      readable: "HB-4",
    },
    interaction: {
      kind: "practical",
      verb: "Punch a registration hole",
      needsRestore: false,
      outcomeKey: "tag-hole",
      useRule: "idempotent",
      outcome:
        "The point punches a clean round hole in a leather evidence tag. The tag can take a ring. The HB-4 stamp is not heated, scraped, or improved.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Holes are how tags stay on the ring. Do not melt the pitch to make the stamp prettier. HB-4 is readable as it is.",
    },
    persistence: {
      holds: "The warped HB-4 stamp remains the identity of the awl.",
      shift: "Pitch darkens a shade during the fourteen and lightens again with handling on return. The punch still cuts a round hole.",
      presentation: {
        "pre-absence": "Plain wooden handle, stamp crisp, no pitch yet.",
        "the-fourteen": "Handle burned off. Someone poured pitch so the tool would not be thrown away.",
        return: "Pitch crazed. Point still punches a tag.",
      },
    },
  }),
  item(3, {
    name: "Half-set dovetail saw",
    siteKind: "workshop",
    site: "Hale & Bramble saw till, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Taken from the saw till while the bench dust was still being screened.",
      authored:
        "Third saw from the left. One tooth bent into its neighbor. A card is tied on with waxed thread. The offcut in the vise matches a drawer front I have already measured in the Absence Room. I am not starting a second carcass.",
    },
    physical: {
      material: "Spring-steel plate, beech handle, brass nuts",
      dimensions: "Plate 20 cm; 15 tpi",
      mass: "210 g",
      condition: "One tooth bent; plate lightly rusted at the toe",
      marks: "Waxed card tied through the handle",
    },
    evidence: {
      howRead: "Untie nothing — the card faces out",
      readable: "Joint 3 stopped at the pin.",
    },
    interaction: {
      kind: "practical",
      verb: "Cut the remaining dovetail pin",
      needsRestore: true,
      outcomeKey: "pin-cut",
      useRule: "idempotent",
      outcome:
        "With the bent tooth set back, the saw finishes the single pin on the pine offcut already in the vise. The joint fits that offcut and no other work is opened.",
    },
    restoration: {
      applies: true,
      method: "Set the bent tooth back in line with the saw-wrest in the till.",
      result: "The plate tracks. The card stays tied on.",
    },
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "The offcut matches the Absence Room drawer. File the fit. Do not start a second carcass.",
    },
    persistence: {
      holds: "The card’s sentence stays tied to the handle.",
      shift: "Pre-absence the tooth is straight and the card is absent. Later the bend and the card are both present. The cut, once made on return, does not uncut itself.",
      presentation: {
        "pre-absence": "Saw sharp, no card, joint 3 not yet started.",
        "the-fourteen": "Bent tooth, card tied, offcut drying in the vise.",
        return: "The pin can be finished. The card still says the joint stopped.",
      },
    },
  }),
  item(4, {
    name: "Skinned glue pot",
    siteKind: "workshop",
    site: "Hale & Bramble stove ledge, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Harlan Bramble",
      finder: "Harlan Bramble",
      circumstance: "Retrieved from the cold stove the day Ellis asked which pots were documents and which were glue.",
      authored:
        "I wrote the collar myself so nobody would paint this onto a page. The skin is the ordinary skin of hide glue left to cool. Under it the glue is still glue. It will bond a split tag. It will not be brushed across writing.",
    },
    physical: {
      material: "Cast-iron pot, hide glue, paper collar",
      dimensions: "Pot 9 cm across, 7 cm tall",
      mass: "640 g with glue",
      condition: "Glue skinned; collar stained; pot sound",
      marks: "Ink collar in Harlan’s hand",
    },
    evidence: {
      howRead: "Read the collar before the skin is lifted",
      readable: "Hide glue — not for documents.",
    },
    interaction: {
      kind: "practical",
      verb: "Warm and bond a split tag",
      needsRestore: true,
      outcomeKey: "tag-bonded",
      useRule: "idempotent",
      outcome:
        "Warmed glue bonds the split in a leather tag along the flesh side. No glue crosses the written face. The collar sentence remains fully readable.",
    },
    restoration: {
      applies: true,
      method: "Lift the skin and warm the pot in the stove’s water jacket until the glue strings.",
      result: "The glue is workable. The collar is kept dry and facing out.",
    },
    response: {
      who: "Marble Vein Conservancy",
      kind: "institution",
      text: "Glue is for wood and for the flesh side of tags. It is never drawn across an inscription. Intake will refuse a tag whose writing has been varnished shut.",
    },
    persistence: {
      holds: "The collar warning remains the pot’s evidence.",
      shift: "The skin thickens through the fourteen and is liftable again on return. The sentence does not sink into the glue.",
      presentation: {
        "pre-absence": "Pot warm, glue open, collar not yet written.",
        "the-fourteen": "Skin hard as horn. Collar in place. Stove cold.",
        return: "Skin can be lifted. The warning is still the first thing to read.",
      },
    },
  }),
  item(5, {
    name: "Heat-bent try square",
    siteKind: "workshop",
    site: "Hale & Bramble bench, Marrow Notch",
    binding: "excavate",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Found under the same curls as the plane, blade down, stock scorched.",
      authored:
        "The stock is blistered over the three-inch mark. If I put it to a finished corner of this shop it lies. If I put it to the penciled corner Harlan never cut, it sits true. I am not bending it back.",
    },
    physical: {
      material: "Rosewood stock, blued steel blade",
      dimensions: "Stock 12 cm; blade 18 cm",
      mass: "190 g",
      condition: "Blade sprung a few degrees by heat; blister over the 3-inch stamp",
      marks: "Shop stamp and a burn blister",
    },
    evidence: {
      howRead: "Read the stamp beside the blister; do not scrape the blister",
      readable: "BRAMBLE — blister covers the 3.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Square the penciled corner",
      needsRestore: false,
      outcomeKey: "unrealized-square",
      useRule: "idempotent",
      outcome:
        "On the penciled corner that was never cut, the bent square reads ninety degrees. On the shop’s finished corners it reads as bent. The unrealized corner is not cut. It is only confirmed as the corner the square still recognizes.",
    },
    restoration: null,
    response: {
      who: "Harlan Bramble",
      kind: "character",
      text: "Leave the arm bent. The bend is the record of the kiln flash. A true square would lie about that morning.",
    },
    persistence: {
      holds: "The bend and the blistered 3 remain. The square is never straightened.",
      shift: "Pre-absence it is true and unburned. After the flash it only agrees with the uncut corner.",
      presentation: {
        "pre-absence": "Square and unburned. The penciled corner is not on the bench yet.",
        "the-fourteen": "Bent, blistered, lying where it fell.",
        return: "Still bent. True only against the corner that was never built.",
      },
    },
  }),
  item(6, {
    name: "Bramble pencil stub",
    siteKind: "workshop",
    site: "Hale & Bramble pencil tray, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Portia Hale",
      finder: "Portia Hale",
      circumstance: "Taken from the tray after the curls were bagged.",
      authored:
        "Half the gold stamp is sanded off from being carried in a pocket with nails. It still writes. I tried it on the dust paper Quill uses for marble notes. The line is ordinary graphite. That is the virtue.",
    },
    physical: {
      material: "Cedar, graphite, leftover gold stamp",
      dimensions: "6 cm remaining",
      mass: "4 g",
      condition: "Point short; stamp half-sanded",
      marks: "Partial gold stamp",
    },
    evidence: {
      howRead: "Turn the stub until the gold catches",
      readable: "BRAMBLE",
    },
    interaction: {
      kind: "practical",
      verb: "Write a catalog number on dust paper",
      needsRestore: false,
      outcomeKey: "dust-note",
      useRule: "idempotent",
      outcome:
        "The stub writes a working catalog number on marble-dust paper. The graphite is ordinary and rain can take it. It does not add a word to the gold stamp.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Graphite on dust paper is a working note. The register is the copy that survives rain. Do not trace the gold stamp over to ‘repair’ it.",
    },
    persistence: {
      holds: "What remains of the gold BRAMBLE stamp is the evidence, sanded edge included.",
      shift: "The stub shortens by ordinary use and no other way. The stamp does not grow back.",
      presentation: {
        "pre-absence": "A longer pencil, stamp complete.",
        "the-fourteen": "Pocket-sanded to this length, lying in the tray.",
        return: "Writes one clear line on dust paper, then is itself again.",
      },
    },
  }),
  item(7, {
    name: "Replaced-handle mallet",
    siteKind: "workshop",
    site: "Hale & Bramble bench, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Ellis",
      finder: "Ellis",
      circumstance: "Hung on the bench hook, handle newer than the head, taken down on return.",
      authored:
        "The head is Harlan’s. The handle is not the one I knew. It is branded with a year from inside the fourteen, when I was not here to fit a handle. I tapped the unfinished bench once. It ticked, dry, the way empty wood ticks. I did not tap twice.",
    },
    physical: {
      material: "Lignum head, hickory handle fitted later",
      dimensions: "Head 12 cm; handle 28 cm",
      mass: "900 g",
      condition: "Head checked with age; handle fresh and branded",
      marks: "Brand on the grip",
    },
    evidence: {
      howRead: "Read the brand on the grip; the head has no new stamp",
      readable: "AY9",
    },
    interaction: {
      kind: "supernatural",
      verb: "Tap the abandoned bench",
      needsRestore: false,
      outcomeKey: "abandon-tick",
      useRule: "idempotent",
      outcome:
        "One tap on the unfinished bench sounds a dry tick, which this mallet gives only for work that was left. A finished joint in the same shop answers with a dull thud. The tick is a diagnosis. It is not an instruction to finish the work.",
    },
    restoration: null,
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Tick means stop. We are not here to finish their furniture.",
    },
    persistence: {
      holds: "The AY9 brand stays on the replacement handle.",
      shift: "Pre-absence the mallet has its old handle and no brand. During the fourteen the new handle appears. On return the tick still means abandoned, not haunted.",
      presentation: {
        "pre-absence": "Original handle, darkened, no AY9 brand.",
        "the-fourteen": "New handle fitted by someone who did not sign a name, only a year.",
        return: "The tick still sorts abandoned work from finished work.",
      },
    },
  }),
  item(8, {
    name: "Overwritten linseed can",
    siteKind: "workshop",
    site: "Hale & Bramble oil shelf, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Harlan Bramble",
      finder: "Harlan Bramble",
      circumstance: "Brought down from the oil shelf after Ellis mistook it for thinner.",
      authored:
        "I pasted the new label over the stencil so the night shift would not drink it or thin paint with it. The stencil still reads at the seam if you tip the can. The oil inside is bench oil. The bail has my carved E, for Ellis, from before. Oiling the bail darkens the wood around that E. It does not invent a second letter.",
    },
    physical: {
      material: "Tin can, linseed oil, paper label over a stencil, wooden bail",
      dimensions: "Can 14 cm tall",
      mass: "480 g",
      condition: "Cap crusted; label wrinkled at the seam; bail dry",
      marks: "False label, true stencil, carved E on the bail",
    },
    evidence: {
      howRead: "Tip the can and read the stencil at the label’s seam, then the carved E",
      readable: "Under-stencil: H. BRAMBLE — BENCH OIL. Bail: E.",
    },
    interaction: {
      kind: "practical",
      verb: "Oil the can’s wire-and-wood bail",
      needsRestore: true,
      outcomeKey: "bail-oiled",
      useRule: "idempotent",
      outcome:
        "Oil darkens the dry bail so the carved E is easy to see in ordinary light. The letter was already there. The false label is left in place over the stencil, seam still readable.",
    },
    restoration: {
      applies: true,
      method: "Crack the crusted cap with the pot lifter. Do not pour the oil out.",
      result: "The cap turns. The oil is reachable by a rag, not by dumping.",
    },
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Thinner would have stripped the stencil. Someone relabeled the can to save the oil. Keep both names. Darken the bail if you need the E. Do not soak the label.",
    },
    persistence: {
      holds: "Both the false label and the under-stencil remain legible at the seam.",
      shift: "The bail’s E is pale before oiling and dark after. The words do not change.",
      presentation: {
        "pre-absence": "Stencil bare, no false label yet, bail uncarved.",
        "the-fourteen": "Label pasted. E carved. Cap crusting shut.",
        return: "Seam still tells the truth. Oiling only darkens the existing E.",
      },
    },
  }),
  item(9, {
    name: "Nicked spokeshave",
    siteKind: "workshop",
    site: "Moth & Ives pattern loft, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Nessa Ives",
      finder: "Nessa Ives",
      circumstance: "Taken from the pattern-loft rack when the loft was opened for the survey.",
      authored:
        "The iron is punched MI. The nick is drawn in the shop book, so I will not grind it out. There is a splintered survey staff in the same rack. Rounding that splinter is the use. The nick stays in the iron and in the drawing.",
    },
    physical: {
      material: "Beech body, steel iron",
      dimensions: "25 cm across",
      mass: "320 g",
      condition: "Edge nicked; body sound",
      marks: "MI punch on the iron",
    },
    evidence: {
      howRead: "Read the punch on the iron face",
      readable: "MI",
    },
    interaction: {
      kind: "practical",
      verb: "Round the splintered staff end",
      needsRestore: true,
      outcomeKey: "staff-rounded",
      useRule: "idempotent",
      outcome:
        "The shave rounds the splintered end of the survey staff stored with it. The nick remains and still matches the shop drawing. No other shaft is touched.",
    },
    restoration: {
      applies: true,
      method: "Hone beside the nick. Do not grind the nick out.",
      result: "The edge cuts wood and the nick is still a notch you can feel.",
    },
    response: {
      who: "Nessa Ives",
      kind: "character",
      text: "The nick stays in the record drawing. Round only the splinters. If you grind the iron clean you have falsified the tool.",
    },
    persistence: {
      holds: "The MI punch and the nick remain paired.",
      shift: "The staff’s splinter is sharp during the fourteen and safe to handle only after the return rounding.",
      presentation: {
        "pre-absence": "Iron un-nicked, staff not yet in the rack.",
        "the-fourteen": "Nick present, staff splintered, both waiting.",
        return: "Splinter can be rounded. Nick stays.",
      },
    },
  }),
  item(10, {
    name: "Cooper’s croze",
    siteKind: "workshop",
    site: "Otter cooperage stall, Marrow Notch",
    binding: "excavate",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Dug from the stall floor where a barrel had collapsed into its own staves.",
      authored:
        "The croze was under a stave. The stave is sound. The stamp says the cooperage and the last count. I can cut the croze groove so this one stave will hold a cup of water. I will not recruit a debtor for an unpaid barrel.",
    },
    physical: {
      material: "Steel croze iron, ash handle",
      dimensions: "Iron 16 cm",
      mass: "260 g",
      condition: "Edge dull but continuous; handle oily",
      marks: "Stamp and a scratched count",
    },
    evidence: {
      howRead: "Read the stamp, then the scratch beneath it",
      readable: "OTTER COOPERAGE — stave count 14 — last barrel unpaid.",
    },
    interaction: {
      kind: "practical",
      verb: "Cut a croze in the loose stave",
      needsRestore: false,
      outcomeKey: "croze-cut",
      useRule: "idempotent",
      outcome:
        "The iron cuts a croze in the one loose stave. Seated in a hoop, that stave holds a cup of water. The unpaid count is not converted into a bill.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "The unpaid barrel is not a debt we will invent a collector for. Cut the croze if you need the stave to hold water. Stop there.",
    },
    persistence: {
      holds: "The unpaid count remains scratched under the stamp.",
      shift: "Pre-absence the count is absent and the barrel is still a barrel. Later it is staves, and the croze can make one of them hold water again.",
      presentation: {
        "pre-absence": "Croze hung up, barrel intact, no scratched count.",
        "the-fourteen": "Barrel collapsed. Count scratched. Croze on the floor.",
        return: "One groove makes one stave hold a cup. The count stays unpaid and uncollected.",
      },
    },
  }),
  item(11, {
    name: "Bushing reamer",
    siteKind: "workshop",
    site: "Moth & Ives clock bench, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Nessa Ives",
      finder: "Nessa Ives",
      circumstance: "Recovered with the stopped survey watch it was wrapped to serve.",
      authored:
        "The tag says not to scrap the watch. The reamer’s handle is cracked, so I wrapped it before I cleared the bushing. When the watch started it showed an hour from the absence and then it simply ticked. I wrote the hour down. I did not set it to the county clock to make it polite.",
    },
    physical: {
      material: "Steel reamer, cracked rosewood handle, cotton wrap, with a stopped survey watch",
      dimensions: "Reamer 9 cm; watch 4 cm",
      mass: "70 g together",
      condition: "Handle cracked; watch bushing packed with dust",
      marks: "Paper tag on the reamer",
    },
    evidence: {
      howRead: "Read the tag before unwrapping the handle",
      readable: "Survey watch — do not scrap.",
    },
    interaction: {
      kind: "practical",
      verb: "Clear the survey-watch bushing",
      needsRestore: true,
      outcomeKey: "watch-ticks",
      useRule: "idempotent",
      outcome:
        "The reamer clears the bushing. The watch ticks, first showing an absence-hour, then keeping ordinary time. The hour is logged. The watch is not a way back.",
    },
    restoration: {
      applies: true,
      method: "Bind the cracked handle with the waxed thread stored in the wrap.",
      result: "The handle can be turned without splitting. The tag stays on.",
    },
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "If it ticks, log the hour it first showed. Do not set it to the county clock to make it polite.",
    },
    persistence: {
      holds: "The ‘do not scrap’ tag remains on the reamer.",
      shift: "The watch is stopped before the bushing is cleared and ticking after. The first hour it shows is recorded and does not keep changing.",
      presentation: {
        "pre-absence": "Watch running, reamer handle whole, no tag.",
        "the-fourteen": "Watch stopped, tag tied, handle cracked.",
        return: "Once cleared, it ticks in ordinary time after one logged absence-hour.",
      },
    },
  }),
  item(12, {
    name: "Job-shop type stick",
    siteKind: "workshop",
    site: "Moth & Ives job case, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Lifted from the job case, line still locked, when the mill loft was inventoried.",
      authored:
        "The stick was left locked. I proofed one slip and stopped. The line is not a notice I will post in town. It is type, and type stays locked until the register has its copy. I will not distribute the sentence as if the ferry had published it.",
    },
    physical: {
      material: "Steel stick, lead type, locked quoins",
      dimensions: "Stick 18 cm",
      mass: "410 g",
      condition: "Line locked and printable; type a little oxidized",
      marks: "Locked line of type",
    },
    evidence: {
      howRead: "Read the locked line from the face of the type; do not dump the stick",
      readable: "GLASS FERRY — LAST BOAT UNRUN",
    },
    interaction: {
      kind: "practical",
      verb: "Pull a proof of the locked line",
      needsRestore: false,
      outcomeKey: "proof-slip",
      useRule: "idempotent",
      outcome:
        "A single proof slip takes the line. The type stays locked in the stick. The slip is a copy for the working file, not a public notice, and it does not replace the register.",
    },
    restoration: null,
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Proofs are copies. The stick is the object. Do not distribute the line as a public notice.",
    },
    persistence: {
      holds: "The locked line remains the readable evidence. Proofing does not unlock it.",
      shift: "Pre-absence the stick is empty. During the fourteen the line is composed and abandoned. On return it can be proofed once without being posted.",
      presentation: {
        "pre-absence": "Empty stick on the case.",
        "the-fourteen": "Line locked and left.",
        return: "One proof, then the stick still holds the type.",
      },
    },
  }),
  item(13, {
    name: "Waxed harness awl",
    siteKind: "workshop",
    site: "Marrow Notch harness loft",
    binding: "recover",
    discovery: {
      author: "Portia Hale",
      finder: "Portia Hale",
      circumstance: "Taken from the loft peg beside a torn ferry satchel.",
      authored:
        "The thread card is explicit. I stitched the satchel flap and I did not stitch a horse, because there is no horse in this loft, only a name people keep adding. The awl is for the satchel.",
    },
    physical: {
      material: "Steel awl, waxed linen on a card",
      dimensions: "Awl 10 cm; card 6 cm",
      mass: "35 g",
      condition: "Point sharp; thread sufficient for one flap",
      marks: "Ink on the thread card",
    },
    evidence: {
      howRead: "Read the card wound with the thread",
      readable: "For the satchel, not the horse.",
    },
    interaction: {
      kind: "practical",
      verb: "Stitch the satchel flap",
      needsRestore: false,
      outcomeKey: "satchel-stitched",
      useRule: "idempotent",
      outcome:
        "The flap of the ferry satchel found with the awl is stitched closed along the tear. The stitch holds. No harness is fitted to an animal, because none is here.",
    },
    restoration: null,
    response: {
      who: "Otter Cutoff Trustees",
      kind: "institution",
      text: "The horse is not in this record. Stitch the satchel and stop.",
    },
    persistence: {
      holds: "The card’s refusal stays tied to the thread.",
      shift: "The satchel is torn through the fourteen and closed after the stitch. The card does not change to permit a horse.",
      presentation: {
        "pre-absence": "Awl on the peg, satchel not yet torn, card unwritten.",
        "the-fourteen": "Tear open, card written, both waiting.",
        return: "One flap can be closed. The sentence stands.",
      },
    },
  }),
  item(14, {
    name: "Vitrified kiln poker",
    siteKind: "workshop",
    site: "Marrow lime kiln shed",
    binding: "excavate",
    discovery: {
      author: "Ade Nye",
      finder: "Ade Nye",
      circumstance: "Pulled from the cold ash bed of the kiln that supplies Wick’s lime, not from a fired charge.",
      authored:
        "The tip is glass. I did not make that glass with a fire I lit. Under quarry light the tiny strokes on the glass are readable. They name a fire that was not lit. I want that kept more than I want the poker pretty.",
    },
    physical: {
      material: "Iron rod, vitrified tip",
      dimensions: "Rod 85 cm",
      mass: "1.4 kg",
      condition: "Tip glassed; shaft sooted; strokes clogged with ash until wiped",
      marks: "Paint strokes fired into the glass tip",
    },
    evidence: {
      howRead: "After the ash is wiped, hold the tip to quarry light and read the strokes",
      readable: "Fire not lit — Wick, night shift.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Hold the glass tip to quarry light",
      needsRestore: true,
      outcomeKey: "unlit-color",
      useRule: "idempotent",
      outcome:
        "In quarry light the tip shows a green no lime fire makes. A second look shows the same green. It does not become a flame, a map, or a date beyond the strokes already read.",
    },
    restoration: {
      applies: true,
      method: "Wipe the ash crust off the glass with a dry rag. Do not chip the tip.",
      result: "The strokes are visible. The glass is intact.",
    },
    response: {
      who: "Ade Nye",
      kind: "character",
      text: "We did not light that kiln. If the glass says so, believe the glass before the rumor.",
    },
    persistence: {
      holds: "The strokes and the green stay paired. The kiln is not retroactively lit.",
      shift: "Pre-absence the tip is iron. After the unlit night it is glass. The color does not escalate on later viewings.",
      presentation: {
        "pre-absence": "Ordinary iron poker, no glass.",
        "the-fourteen": "Tip vitrified in a kiln whose charge book says unlit.",
        return: "One green, every time, and the same sentence.",
      },
    },
  }),
  item(15, {
    name: "Pattern-maker’s shrink rule",
    siteKind: "workshop",
    site: "Moth & Ives pattern loft, Marrow Notch",
    binding: "recover",
    discovery: {
      author: "Nessa Ives",
      finder: "Nessa Ives",
      circumstance: "Taken from the pattern drawer beside a green maple blank.",
      authored:
        "The rule is an ordinary shrink rule, one-eighth inch to the foot, for green maple. The pencil note names a stool that was not built. I measured the blank. I did not cut the stool. The note is not an order, even if the blank is the right wood.",
    },
    physical: {
      material: "Boxwood rule, brass tips",
      dimensions: "Folded 15 cm; open 30 cm",
      mass: "45 g",
      condition: "Hinge tight; figures readable",
      marks: "Burned scale title and a pencil note",
    },
    evidence: {
      howRead: "Open the rule and read the burned title, then the pencil at the end",
      readable: "1/8 IN PER FT — GREEN MAPLE. Pencil: Absence Room stool, unbuilt.",
    },
    interaction: {
      kind: "practical",
      verb: "Measure the green maple blank",
      needsRestore: false,
      outcomeKey: "shrink-measure",
      useRule: "idempotent",
      outcome:
        "The rule gives the blank’s finished length after shrinkage: 42 cm from a present 43.3 cm. The number is a length. The stool is not begun.",
    },
    restoration: null,
    response: {
      who: "Nessa Ives",
      kind: "character",
      text: "Measure it. Do not build the stool unless Ellis asks. The note is not an order.",
    },
    persistence: {
      holds: "The burned scale and the ‘unbuilt’ pencil note both remain.",
      shift: "The blank dries a little across the fourteen. The rule’s finished-length reading stays the figure to trust, and the stool stays unbuilt.",
      presentation: {
        "pre-absence": "Rule in the drawer, no pencil note, blank not yet set aside.",
        "the-fourteen": "Note written. Blank stickered and left.",
        return: "The measure can be taken. The stool is still unbuilt.",
      },
    },
  }),
  item(16, {
    name: "Filed bench dog",
    siteKind: "workshop",
    site: "Hale & Bramble bench, Marrow Notch",
    binding: "excavate",
    discovery: {
      author: "Harlan Bramble",
      finder: "Harlan Bramble",
      circumstance: "Raked out of the dog hole that had been drilled in the wrong place.",
      authored:
        "I drilled the hole wrong the week Ellis died and then I could not stand to drill another. I filed the dog’s ear until it held in the wrong hole. The wrong hole is the true record. The dog is the apology. It still pins a board.",
    },
    physical: {
      material: "Maple dog, one ear filed",
      dimensions: "10 cm tall",
      mass: "60 g",
      condition: "Ear reduced; shaft fits the mis-drilled hole",
      marks: "File facets and a punch",
    },
    evidence: {
      howRead: "Read the punch on the filed ear",
      readable: "Hole was drilled wrong — dog filed to fit.",
    },
    interaction: {
      kind: "practical",
      verb: "Pin the board over the wrong hole",
      needsRestore: false,
      outcomeKey: "board-pinned",
      useRule: "idempotent",
      outcome:
        "The dog pins a board in the mis-drilled hole. The board holds for planing. No second hole is drilled.",
    },
    restoration: null,
    response: {
      who: "Harlan Bramble",
      kind: "character",
      text: "The wrong hole stays. The dog is the apology.",
    },
    persistence: {
      holds: "The filed ear and the punch sentence stay. The wrong hole is not corrected.",
      shift: "Pre-absence the dog is unfiled and the hole is not yet drilled. Afterward the mismatch is the stable fact.",
      presentation: {
        "pre-absence": "Dog with both ears, bench undrilled at that spot.",
        "the-fourteen": "Hole wrong, dog filed, board unpinned.",
        return: "The board can be pinned. The hole stays wrong.",
      },
    },
  }),
];
