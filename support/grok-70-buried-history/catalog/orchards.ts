import { item } from "../define.ts";
import type { HistoryObject } from "../types.ts";

export const orchards: HistoryObject[] = [
  item(49, {
    name: "Erased-interval rod",
    siteKind: "former-orchard",
    site: "Cut-Bank root cellar",
    binding: "excavate",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Drawn out of the cellar fill beneath the orchard wall’s gap.",
      authored:
        "I scraped the fourteen-foot mark myself, because people were treating that width as a door into the year Ellis was gone. It is a width. Ellis is putting the stamp back with wax and graphite so the wall can be measured honestly. We are not walking into it.",
    },
    physical: {
      material: "Ash rod, stamped iron numerals, wax-graphite cake",
      dimensions: "Rod 5 m, folded in four",
      mass: "1.1 kg",
      condition: "The 14-foot numeral scraped off; other stamps sound",
      marks: "Scraped interval and a pencil warning",
    },
    evidence: {
      howRead: "Read the pencil along the scraped patch before filling it",
      readable: "Do not measure the wall.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Measure the wall gap",
      needsRestore: true,
      outcomeKey: "gap-fourteen",
      useRule: "idempotent",
      outcome:
        "With the fourteen-foot stamp filled back in, the gap in the orchard wall measures fourteen feet. It is a width. It is not a door, a year you can enter, or a path.",
    },
    restoration: {
      applies: true,
      method: "Fill the scraped numeral with the wax-graphite cake so the 14 matches the neighboring stamps.",
      result: "The interval is readable again. The pencil warning is still beside it.",
    },
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "I scraped it because people were treating fourteen feet as a door. It is a width. Put the mark back so the width stays honest, and do not walk into it as if it were a year.",
    },
    persistence: {
      holds: "The pencil warning stays even after the numeral is restored. The gap’s measure, once taken, stays fourteen feet.",
      shift: "Pre-absence the numeral is factory-cut. During the fourteen it is scraped. On return it can be filled and still must not be used as a threshold.",
      presentation: {
        "pre-absence": "All numerals present. No pencil warning. Wall not yet gapped.",
        "the-fourteen": "14 scraped. Warning written. Gap open in the wall.",
        return: "The width can be read again. It remains a width.",
      },
    },
  }),
  item(50, {
    name: "Bark knife",
    siteKind: "former-orchard",
    site: "Wren press barn, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken from the barn nail under the WREN brand.",
      authored:
        "The edge was dull from cutting twine. I honed it and scored the living trunk once, on the side that faces the well. Sap came, ordinary and sticky. The tree is alive. That was the question. I am not grafting a Vein variety into it.",
    },
    physical: {
      material: "Steel grafting knife, ash handle",
      dimensions: "Blade 6 cm",
      mass: "50 g",
      condition: "Edge dull until honed; brand burned deep",
      marks: "Handle brand",
    },
    evidence: {
      howRead: "Read the brand on the handle",
      readable: "WREN",
    },
    interaction: {
      kind: "practical",
      verb: "Score the living bark",
      needsRestore: true,
      outcomeKey: "bark-scored",
      useRule: "idempotent",
      outcome:
        "One score on the well-facing side of the remaining trunk draws ordinary sap. The tree is alive. No scion is set into the cut.",
    },
    restoration: {
      applies: true,
      method: "Hone the blade. Do not recut the brand.",
      result: "The edge scores bark. The brand stays as burned.",
    },
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "Score the side that faces the well. We are checking whether the tree is alive. It is.",
    },
    persistence: {
      holds: "The WREN brand remains the maker of the cut’s authority. The score, once made, weeps and then heals as bark.",
      shift: "Dull during the fourteen, keen on return, never a grafting campaign.",
      presentation: {
        "pre-absence": "Knife sharp, tree unscarred.",
        "the-fourteen": "Hung dull. Tree left untested.",
        return: "One score. Ordinary sap. Alive.",
      },
    },
  }),
  item(51, {
    name: "Apple screen",
    siteKind: "former-orchard",
    site: "Cut-Bank drying loft",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Lifted down from the drying loft after the mesh tore at one corner.",
      authored:
        "The stencil forbids dust and slices together. A later carve says dust only now. I wove the corner and set one marble-dust sample on one square. Isolation is the use. I did not lay a second sample beside it to see what they would do.",
    },
    physical: {
      material: "Wood frame, wire mesh, spare wire",
      dimensions: "40 cm square",
      mass: "500 g",
      condition: "One corner torn; stencil and carve both present",
      marks: "Stencil and a later knife carve",
    },
    evidence: {
      howRead: "Read the stencil, then the carve beneath it",
      readable: "DUST AND SLICES — NOT TOGETHER. Carve: dust only now.",
    },
    interaction: {
      kind: "practical",
      verb: "Set a dust sample on one square",
      needsRestore: true,
      outcomeKey: "dust-isolated",
      useRule: "idempotent",
      outcome:
        "One marble-dust sample sits on one square and does not mix with any second sample. The screen holds it. Nothing is sifted into the Vein to ‘see.’",
    },
    restoration: {
      applies: true,
      method: "Weave the included wire through the torn corner.",
      result: "The mesh holds powder. The lettering is not wired over.",
    },
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Isolation is the whole use. One sample, one square.",
    },
    persistence: {
      holds: "Both the stencil and the later carve remain visible.",
      shift: "Torn and leaking during the fourteen; holding a single sample after the weave.",
      presentation: {
        "pre-absence": "Mesh whole, stencil fresh, no carve.",
        "the-fourteen": "Torn. Carve added. Loft dry.",
        return: "One sample, isolated.",
      },
    },
  }),
  item(52, {
    name: "Branded ladder rung",
    siteKind: "former-orchard",
    site: "Cut-Bank ladder, orchard wall",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Found branded and loose beside the ladder with one broken step.",
      authored:
        "The brand is AY3, a thin year. The rung held pickers then. It can replace the broken step and hold a person. The bell higher up does not require this rung. I am saying that so nobody turns a step into an errand.",
    },
    physical: {
      material: "Ash rung",
      dimensions: "40 cm",
      mass: "280 g",
      condition: "Sound; brand burned dark",
      marks: "Year brand",
    },
    evidence: {
      howRead: "Read the brand on the top face",
      readable: "WREN — AY3",
    },
    interaction: {
      kind: "practical",
      verb: "Replace the broken step",
      needsRestore: false,
      outcomeKey: "step-holds",
      useRule: "idempotent",
      outcome:
        "The rung replaces the broken step and holds a person’s weight. Nothing above the step becomes newly reachable that was not already a place on the ladder. The bell is not gated behind it.",
    },
    restoration: null,
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "AY3 was a thin year. The rung held pickers then. It can hold you. The bell does not require it.",
    },
    persistence: {
      holds: "The AY3 brand remains the rung’s date.",
      shift: "Loose during the fourteen, load-bearing after it is pegged in. It does not become a key.",
      presentation: {
        "pre-absence": "Rung unbranded, ladder whole.",
        "the-fourteen": "Branded, loose, one step broken.",
        return: "It holds weight. It unlocks nothing.",
      },
    },
  }),
  item(53, {
    name: "Press screw",
    siteKind: "former-orchard",
    site: "Wren press barn, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Backed out of the seized press after the threads were oiled.",
      authored:
        "The tag says residue only. I will not invite anyone to drink what comes out. One turn gave a teaspoon of varnish-like residue, inert, and it darkened the screw’s own dry stamp enough to print WREN PRESS on a slip. A stain that prints a name. Not a vintage.",
    },
    physical: {
      material: "Iron screw, wooden hub",
      dimensions: "Screw 40 cm",
      mass: "3.2 kg",
      condition: "Threads seized until oiled; stamp inkless",
      marks: "Tag and a dry stamp on the hub",
    },
    evidence: {
      howRead: "Read the tag wired to the hub",
      readable: "Residue only — press is seized for fruit.",
    },
    interaction: {
      kind: "practical",
      verb: "Turn the press screw",
      needsRestore: true,
      outcomeKey: "residue-teaspoon",
      useRule: "idempotent",
      outcome:
        "One turn expresses a teaspoon of inert residue. The residue darkens the hub stamp so it prints WREN PRESS once. Nothing is bottled for drinking.",
    },
    restoration: {
      applies: true,
      method: "Oil the seized threads until the screw turns one revolution.",
      result: "The screw turns. The tag stays wired on.",
    },
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "Do not invite anyone to drink it. A teaspoon is a stain, and the stain prints the name.",
    },
    persistence: {
      holds: "The tag’s limit remains. The printed name is a copy of the hub, not a new orchard.",
      shift: "Seized through the fourteen; one teaspoon available on return; then the press is a screw again.",
      presentation: {
        "pre-absence": "Press working for fruit, tag absent.",
        "the-fourteen": "Seized. Tag written. Stamp dry.",
        return: "A teaspoon and a printed name. Not a drink.",
      },
    },
  }),
  item(54, {
    name: "Cellar smudge pot",
    siteKind: "former-orchard",
    site: "Cut-Bank root cellar",
    binding: "excavate",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Lifted from the cellar step, wick untrimmed, soot note on the lid.",
      authored:
        "The soot says the draft goes toward the well. I trimmed the wick and lit it. The smoke moved toward the well door and then pooled, as smoke does when air moves. I am writing ‘toward the well,’ not ‘the well inhales.’ Air is not a character.",
    },
    physical: {
      material: "Iron pot, oil, cotton wick",
      dimensions: "Pot 16 cm across",
      mass: "700 g",
      condition: "Wick untrimmed; lid sooted",
      marks: "Soot writing on the lid",
    },
    evidence: {
      howRead: "Read the soot on the lid before lighting",
      readable: "Draft goes toward the well.",
    },
    interaction: {
      kind: "practical",
      verb: "Light the smudge pot",
      needsRestore: true,
      outcomeKey: "draft-toward-well",
      useRule: "idempotent",
      outcome:
        "Smoke moves toward the well door and pools. The observation is airflow. It does not identify a breather, a voice, or a route.",
    },
    restoration: {
      applies: true,
      method: "Trim the wick and seat it so it takes the oil.",
      result: "The pot lights. The soot sentence is not wiped off as ‘ash.’",
    },
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Air moves. That is a cellar fact. Write ‘toward the well,’ not ‘the well inhales souls.’",
    },
    persistence: {
      holds: "The soot sentence remains the wording of the observation.",
      shift: "Unlit and sooted during the fourteen; smoky and specific on return; never promoted to a spirit.",
      presentation: {
        "pre-absence": "Pot for frost nights, lid clean.",
        "the-fourteen": "Wick dead. Sentence wiped on in soot.",
        return: "Smoke confirms the sentence and does not enlarge it.",
      },
    },
  }),
  item(55, {
    name: "Picker’s bell",
    siteKind: "former-orchard",
    site: "Cut-Bank orchard wall",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Lifted off the wall nail, name cast inside the lip.",
      authored:
        "The name inside is Sadie Quill. She was not born. I will not pretend I remember a sister. The bell rang once when I turned it, and the second time it stayed quiet. The name was already the inscription. Ringing did not add a life. I am registering the name and letting the bell go quiet.",
    },
    physical: {
      material: "Cast bell, iron nail",
      dimensions: "Bell 9 cm",
      mass: "240 g",
      condition: "Clapper free; interior cast sharp",
      marks: "Interior casting",
    },
    evidence: {
      howRead: "Tip the bell and read the casting inside the lip",
      readable: "UNLISTED — SADIE QUILL",
    },
    interaction: {
      kind: "supernatural",
      verb: "Ring the picker’s bell",
      needsRestore: false,
      outcomeKey: "bell-once",
      useRule: "bell-once",
      outcome:
        "The bell sounds once. The name Sadie Quill is already the inscription. A second ring is silence. Nothing is added to the name.",
    },
    restoration: null,
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Sadie was not born. The bell has her name because the Vein keeps unfinished lists. I will not pretend I remember her. Register the name and let the bell go quiet.",
    },
    persistence: {
      holds: "The cast name remains whether or not the bell is rung.",
      shift: "Able to ring once on return, then quiet in every later era. The quiet does not erase the casting.",
      presentation: {
        "pre-absence": "Bell plain, no interior name.",
        "the-fourteen": "Name cast. Bell hung. Unrung.",
        return: "One sound, then silence. The name stays in the metal.",
      },
    },
  }),
  item(56, {
    name: "Orchard saw",
    siteKind: "former-orchard",
    site: "Cut-Bank tool crib",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken from the crib with its tooth card still tied.",
      authored:
        "The card says suckers only. I cut one sucker from the well-tree. The tree is not a project. I am tired of projects that begin with a tool looking lonely.",
    },
    physical: {
      material: "Steel pruning saw",
      dimensions: "Blade 25 cm",
      mass: "180 g",
      condition: "Teeth sharp; card tied",
      marks: "Tooth card",
    },
    evidence: {
      howRead: "Read the card",
      readable: "Suckers only.",
    },
    interaction: {
      kind: "practical",
      verb: "Cut one sucker",
      needsRestore: false,
      outcomeKey: "sucker-cut",
      useRule: "idempotent",
      outcome:
        "One sucker is cut from the well-tree. The limb structure is otherwise untouched. The card remains tied.",
    },
    restoration: null,
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "One sucker. The tree is not a project.",
    },
    persistence: {
      holds: "The card continues to limit the saw to suckers.",
      shift: "The sucker is present during the fourteen and absent after the cut. No era turns the saw loose on the crown.",
      presentation: {
        "pre-absence": "Saw in the crib, card unwritten, tree pruned in season.",
        "the-fourteen": "Card tied. Sucker grown.",
        return: "One cut. Stop.",
      },
    },
  }),
  item(57, {
    name: "Pollen brush",
    siteKind: "former-orchard",
    site: "Vein-mouth well coping, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken from the coping where the hairs had bent in the damp.",
      authored:
        "The label says sweep, don’t scatter. I combed the hairs straight and swept one pass into the vial that lives in the handle. The vial is a sample. I am not founding a seed bank and I am not sowing the coping.",
    },
    physical: {
      material: "Badger hair, tin ferrule, glass vial in the handle",
      dimensions: "Brush 14 cm",
      mass: "30 g",
      condition: "Hairs bent until combed; vial empty",
      marks: "Paper label",
    },
    evidence: {
      howRead: "Read the label on the ferrule",
      readable: "VEIN-MOUTH — SWEEP, DON’T SCATTER.",
    },
    interaction: {
      kind: "practical",
      verb: "Sweep dust into the vial",
      needsRestore: true,
      outcomeKey: "vial-filled",
      useRule: "idempotent",
      outcome:
        "One pass fills the handle vial with well-coping dust. The dust is a sample. It is not sown, scattered, or divided into a second vial.",
    },
    restoration: {
      applies: true,
      method: "Comb the hairs straight with the fine comb in the cap.",
      result: "The brush sweeps instead of flicking. The label stays.",
    },
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "The vial is a sample, not a seed bank.",
    },
    persistence: {
      holds: "The label’s prohibition on scattering remains.",
      shift: "Vial empty before the sweep, capped and full after, in every subsequent era.",
      presentation: {
        "pre-absence": "Brush clean, label absent, vial not fitted.",
        "the-fourteen": "Label written. Hairs bent. Vial empty.",
        return: "One vial, filled, not a nursery.",
      },
    },
  }),
  item(58, {
    name: "Blaze paint",
    siteKind: "former-orchard",
    site: "Cut-Bank well path",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Dug the can out of the path-side cache, lid rusted shut.",
      authored:
        "I want a white blaze on the post so the living can walk back. I opened the lid and painted one blaze. Then I changed era on purpose. It was still paint. If the Vein had turned it into a sigil I would have sanded the post. It stayed paint. Good.",
    },
    physical: {
      material: "Whitewash in a tin, brush wired to the bail",
      dimensions: "Tin 10 cm",
      mass: "400 g",
      condition: "Lid rusted shut until opened",
      marks: "Printed label",
    },
    evidence: {
      howRead: "Read the label",
      readable: "WHITE — BLAZE THE WELL PATH.",
    },
    interaction: {
      kind: "practical",
      verb: "Paint one blaze",
      needsRestore: true,
      outcomeKey: "blaze-painted",
      useRule: "idempotent",
      outcome:
        "One white blaze is painted on the path post. Across era changes it remains paint, not a Vein mark and not a door.",
    },
    restoration: {
      applies: true,
      method: "Crack the rusted lid with the bail’s lever. Do not dilute the paint.",
      result: "The lid opens. The label is still glued on.",
    },
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "A blaze is for the living walk back. It is not a Vein mark. I want it to stay paint in every era, so we can trust paint.",
    },
    persistence: {
      holds: "The blaze, once painted, persists as paint. The label does not retitle itself.",
      shift: "No blaze before use. After use, ordinary white paint under every era’s light.",
      presentation: {
        "pre-absence": "Can full, post bare, path obvious.",
        "the-fourteen": "Lid seized. Path half lost. Label written.",
        return: "One blaze. Still paint after the era changes.",
      },
    },
  }),
  item(59, {
    name: "Bushel hoop",
    siteKind: "former-orchard",
    site: "Cut-Bank packing shed",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken off the shed wall where gauges are hung.",
      authored:
        "Stamped one bushel, Marrow. I put the shed’s basket through it. The basket passed, so it is a true bushel. The cooperative will not convert that volume into a count of unrealized pickers. A bushel is a volume.",
    },
    physical: {
      material: "Iron hoop",
      dimensions: "Standard bushel diameter",
      mass: "600 g",
      condition: "Round; stamp deep",
      marks: "Stamp",
    },
    evidence: {
      howRead: "Read the stamp",
      readable: "1 BUSHEL — MARROW.",
    },
    interaction: {
      kind: "practical",
      verb: "Gauge the basket",
      needsRestore: false,
      outcomeKey: "basket-gauged",
      useRule: "idempotent",
      outcome:
        "The shed basket passes the hoop. It is a true bushel. The measure is not converted into people.",
    },
    restoration: null,
    response: {
      who: "Cut-Bank Cooperative",
      kind: "institution",
      text: "A true bushel is a volume. We will not convert it into a count of unrealized pickers.",
    },
    persistence: {
      holds: "The stamp remains a volume and not a census.",
      shift: "The hoop is round in every era. Use does not teach it a second unit.",
      presentation: {
        "pre-absence": "Hoop in use on market days.",
        "the-fourteen": "Hung idle. Stamp still a volume.",
        return: "The basket passes. The cooperative refuses the metaphor.",
      },
    },
  }),
  item(60, {
    name: "Veil Pearmain tin",
    siteKind: "former-orchard",
    site: "Wren press barn, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken from the bud-wood drawer, label in Lottie’s hand, twig inside.",
      authored:
        "I made the name up on a hungry night. Then the tin kept a twig anyway. I tried, once, to set it in soil, because I had to know. It did not take. There is no parent tree to hunt. The label already says do not plant. I am glad the ground agreed.",
    },
    physical: {
      material: "Tin, paper label, one dormant twig",
      dimensions: "Tin 8 cm",
      mass: "40 g",
      condition: "Seal good; twig flexible, not potted",
      marks: "Handwritten label",
    },
    evidence: {
      howRead: "Read the label before opening",
      readable: "VEIL PEARMAIN — NOT RELEASED — DO NOT PLANT.",
    },
    interaction: {
      kind: "supernatural",
      verb: "Set the twig in soil",
      needsRestore: false,
      outcomeKey: "twig-refuses",
      useRule: "idempotent",
      outcome:
        "The twig does not take in soil. It remains in the tin, unlabeled by any new growth. There is no parent tree to find and no release to wait for.",
    },
    restoration: null,
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "I made the name up on a hungry night and then the tin kept the twig anyway. Do not plant it. Do not hunt the parent tree. There isn’t one.",
    },
    persistence: {
      holds: "The refusal on the label and the refusal of the twig stay in agreement.",
      shift: "The twig looks plantable in every era and takes in none of them.",
      presentation: {
        "pre-absence": "Tin empty, name not yet invented.",
        "the-fourteen": "Label written. Twig present. Drawer shut.",
        return: "Planting fails closed. The twig stays evidence, not an orchard.",
      },
    },
  }),
  item(61, {
    name: "Folding height stick",
    siteKind: "former-orchard",
    site: "Cut-Bank well-tree",
    binding: "recover",
    discovery: {
      author: "Bram Quill",
      finder: "Bram Quill",
      circumstance: "Unhooked from the well-tree, top section stuck.",
      authored:
        "The tag says the top stuck in AY11. I freed it and measured the well-tree at twenty-two feet. AY11 is when the section stuck. Twenty-two feet is a height. I am writing them as two facts so nobody adds them into a code.",
    },
    physical: {
      material: "Pine sections, brass slide",
      dimensions: "Folded 80 cm",
      mass: "450 g",
      condition: "Top section stuck until freed",
      marks: "Tag on the slide",
    },
    evidence: {
      howRead: "Read the tag",
      readable: "TOP STUCK — AY11.",
    },
    interaction: {
      kind: "practical",
      verb: "Extend the height stick",
      needsRestore: true,
      outcomeKey: "tree-height",
      useRule: "idempotent",
      outcome:
        "Extended, the stick measures the well-tree at 22 feet. AY11 remains the year the section stuck, not a term in the height.",
    },
    restoration: {
      applies: true,
      method: "Free the stuck section with a drop of oil on the slide. Do not force it past the stop.",
      result: "The stick extends to its marked length. The tag stays.",
    },
    response: {
      who: "Bram Quill",
      kind: "character",
      text: "Twenty-two feet is a height. AY11 is when the section stuck. Those are two facts.",
    },
    persistence: {
      holds: "The AY11 tag remains after the stick works again.",
      shift: "Stuck during the fourteen, readable as a height on return, never a sum of year and feet.",
      presentation: {
        "pre-absence": "Stick sliding freely, no tag.",
        "the-fourteen": "Top stuck. Tag written.",
        return: "22 feet. AY11 unchanged beside it.",
      },
    },
  }),
  item(62, {
    name: "Blank-back collar",
    siteKind: "former-orchard",
    site: "Cut-Bank packing shed",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken from a nail in the shed, plate stamped on one side.",
      authored:
        "The dog died of being old, before Ellis did. The blank side was for a second dog we did not get. The buckle still closes. I will not stamp a Vein name onto the blank to make the absence feel populated.",
    },
    physical: {
      material: "Leather collar, brass plate, brass buckle",
      dimensions: "Collar 40 cm",
      mass: "70 g",
      condition: "Leather supple; one side of the plate blank",
      marks: "One-sided stamp",
    },
    evidence: {
      howRead: "Read both sides of the plate",
      readable: "ORCHARD. The reverse is blank.",
    },
    interaction: {
      kind: "practical",
      verb: "Close the collar buckle",
      needsRestore: false,
      outcomeKey: "buckle-closes",
      useRule: "idempotent",
      outcome:
        "The buckle closes and opens. The blank side remains blank. No name is added.",
    },
    restoration: null,
    response: {
      who: "Lottie Wren",
      kind: "character",
      text: "The dog died of being old, before Ellis did. The blank side was for a second dog we did not get. Do not put a Vein name on it.",
    },
    persistence: {
      holds: "ORCHARD on one side, blank on the other, in every era after the plate was stamped.",
      shift: "The blank stays blank even if the buckle is worked.",
      presentation: {
        "pre-absence": "Collar on a living old dog, plate not yet blank-backed.",
        "the-fourteen": "Hung up. One side stamped. One side waiting and then no longer waiting.",
        return: "The buckle works. The blank is a decision, not a prompt.",
      },
    },
  }),
  item(63, {
    name: "Frost lantern",
    siteKind: "former-orchard",
    site: "Wren press barn, Cut-Bank",
    binding: "recover",
    discovery: {
      author: "Ione Calder",
      finder: "Ione Calder",
      circumstance: "Taken from the barn beam, mica cracked, spare chip under the oil cup.",
      authored:
        "The base card tells you where the spare mica is, which is honest. I replaced the cracked pane and lit the lantern. It is light for reading soot notes. It does not clarify people. I am keeping that sentence short on purpose.",
    },
    physical: {
      material: "Tin lantern, cracked mica, spare mica chip, oil",
      dimensions: "Lantern 20 cm",
      mass: "350 g",
      condition: "One pane cracked; spare stored dry",
      marks: "Base card",
    },
    evidence: {
      howRead: "Read the card under the oil cup",
      readable: "Spare mica under the oil cup.",
    },
    interaction: {
      kind: "practical",
      verb: "Light the frost lantern",
      needsRestore: true,
      outcomeKey: "lantern-lit",
      useRule: "idempotent",
      outcome:
        "The lantern lights. The light is enough to read a soot note at arm’s length. It does not reveal a figure, a name, or a revised memory.",
    },
    restoration: {
      applies: true,
      method: "Replace the cracked pane with the spare mica chip.",
      result: "The pane is whole enough to burn safely. The card stays in the base.",
    },
    response: {
      who: "Ione Calder",
      kind: "character",
      text: "Light is for reading soot notes. It does not clarify people.",
    },
    persistence: {
      holds: "The card remains the lantern’s evidence after the pane is replaced.",
      shift: "Cracked and dark during the fourteen; lit, and only lit, on return.",
      presentation: {
        "pre-absence": "Lantern used on frost nights, mica whole, no card.",
        "the-fourteen": "Cracked. Spare hidden. Card written.",
        return: "It lights. People stay as unclear as they were.",
      },
    },
  }),
  item(64, {
    name: "Picker’s punch",
    siteKind: "former-orchard",
    site: "Cut-Bank packing shed",
    binding: "recover",
    discovery: {
      author: "Lottie Wren",
      finder: "Lottie Wren",
      circumstance: "Taken from the shed drawer with a strip of tickets already punched.",
      authored:
        "The strip is punched for AY1 through AY14, header saying picked and no fruit recorded. That is unrealized labor, not a mystery crop. The die was clogged. I cleared it and punched the blank return stub with a star, so the strip has an end. I did not write fruit into the empty days.",
    },
    physical: {
      material: "Steel ticket punch, ticket strip, one blank stub",
      dimensions: "Punch 12 cm",
      mass: "160 g",
      condition: "Die clogged until cleared; strip complete through AY14",
      marks: "Printed header and punched dates",
    },
    evidence: {
      howRead: "Read the header, then the punched dates",
      readable: "PICKED — no fruit recorded. Dates AY1 through AY14.",
    },
    interaction: {
      kind: "practical",
      verb: "Punch the return stub",
      needsRestore: true,
      outcomeKey: "return-punched",
      useRule: "idempotent",
      outcome:
        "The blank stub marked RETURN receives one star punch. The AY1–AY14 strip is not altered and no fruit is entered.",
    },
    restoration: {
      applies: true,
      method: "Clear the clogged die with the pin in the punch’s handle.",
      result: "The die cuts a star. The old strip is not re-punched.",
    },
    response: {
      who: "Cut-Bank Cooperative",
      kind: "institution",
      text: "The strip claims picking with no fruit. That is unrealized labor. Punch the return stub so the strip has an end. Do not fill in fruit that was not picked.",
    },
    persistence: {
      holds: "The header and the fourteen empty punches remain unchanged by the return star.",
      shift: "The strip ends only when the return stub is punched. Earlier eras show it unended.",
      presentation: {
        "pre-absence": "Punch clean, no strip yet.",
        "the-fourteen": "Strip punched through AY14. Die clogged. Return stub blank.",
        return: "One star on RETURN. The empty days stay empty.",
      },
    },
  }),
];
