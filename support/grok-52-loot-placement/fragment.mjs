import { anchors } from "./fragment-map.mjs";

const NOTE =
  "Anchor only. The Lemon Fair Bend grid belongs to grok-52-loot-placement as a demo. Copy this anchor id onto map/shoreham-orchards; do not replace that map.";

function at(id) {
  const a = anchors[id];
  if (!a) throw new Error(`missing anchor ${id}`);
  return {
    session: "map/shoreham-orchards",
    layer: "world",
    anchor: `anchor.${id}`,
    local: { x: a.x, y: a.y },
    note: NOTE,
  };
}

function base(id, extra) {
  return {
    id,
    districtId: "shoreham-orchards",
    siteId: "lemon-fair-bend",
    dungeonId: null,
    playableInFragment: true,
    mapRef: at(id),
    grants: { both: [], before: [], return: [] },
    prerequisites: [],
    special: null,
    branches: null,
    ...extra,
    persistence: {
      respawn: "never",
      fixture: false,
      questLock: false,
      ...(extra.persistence || {}),
      key: `loot:${id}`,
    },
  };
}

const item = (p) => ({
  qty: 1,
  unique: true,
  obtainable: true,
  requiresPrior: false,
  eraAvailable: ["before", "return"],
  questProtected: false,
  blurb: p.blurb,
  ...p,
});

export const fragmentSituations = [
  base("lfb-mudroom-boots", {
    title: "Wet-lane boots",
    venue: "home",
    presentation: { kind: "world-pickup", prop: "a pair of patched rubber boots under the mudroom bench, toes still wet" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "none", room: "hale-mudroom" },
    contents: [item({ itemId: "hale-mud-boots", name: "Hale mud boots", kind: "ordinary", blurb: "Patched at the left ankle. The slate by the door says the lane pair is for anyone walking the wet." })],
    clue: { text: "A slate screwed to the mudroom wall reads: lane boots — wet days — put back. The pair under the bench is that pair, not the Sunday shoes.", sourceId: "lfb-mudroom-boots", honest: true },
    interaction: {
      verb: "Take",
      successCopy: "You take the lane boots. The slate already gave leave, and the bench keeps the shape of them.",
      blockedCopy: "The Sunday shoes are on the high peg. These are not those.",
      examinedCopy: "The bench is bare where the lane boots stood. A ring of mud is still drying.",
    },
    era: {
      before: { state: "The boots are damp. Someone walked the lane this morning.", available: true },
      return: { state: "The boots are cracked at the flex and full of seed heads.", available: true, change: "No one has put them back in fourteen years. The leave on the slate still holds." },
    },
    persistence: { note: "One pair. Taken in either year, they are gone from the bench in both. They do not respawn with the weather." },
    environmentalStory: "The mudroom smells of milk and wet wool. A slate, a bootjack, and a single child's mitten nailed up so it will not be lost again. The boots are the working pair, set where a person can find them in the dark.",
  }),

  base("lfb-parlor-clover", {
    title: "Clover in the parlor Bible",
    venue: "home",
    presentation: { kind: "container", prop: "a family Bible on the parlor stand, a green shadow in the page gutter" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "none", room: "hale-parlor" },
    contents: [item({ itemId: "parlor-clover", name: "Pressed four-leaf clover", kind: "collectible", blurb: "Pressed at Ruth's wedding year. The margin beside it is the real find." })],
    clue: { text: "The Bible is open to a page that will not quite close. A clover thickens the gutter, and the margin is written in a small hand.", sourceId: "lfb-parlor-clover", honest: true },
    interaction: {
      verb: "Take the clover",
      successCopy: "You lift the clover. In the margin, beside it: Mother's face is behind the proud board in the sideboard. Not the linen.",
      blockedCopy: "The Bible is shut with a ribbon. Nothing asks to be forced.",
      examinedCopy: "The margin stays readable. The gutter where the clover was is a pale green scar.",
    },
    era: {
      before: { state: "The parlor is swept. The Bible is the only thing left askew, on purpose.", available: true },
      return: { state: "Dust films the stand. The ribbon has faded from red to the color of tea.", available: true, change: "The margin has not been scraped. Whoever was meant to read it still can." },
    },
    persistence: { note: "The clover is one press. Reading the margin marks the sideboard clue for both years. The Bible itself stays on the stand." },
    environmentalStory: "The parlor is for the minister and for not touching the good chairs. The Bible is the exception: it is used. A pencil lives in the stand's drawer, and the margin is written in that same soft lead, the letters pressed hard where the writer was angry or sure.",
  }),

  base("lfb-kitchen-crock", {
    title: "Kitchen apple crock",
    venue: "home",
    presentation: { kind: "container", prop: "a grey crock under the dry sink, lid weighted with a flat iron" },
    ownership: {
      ownerId: "ruth-hale",
      ownerName: "Ruth Hale",
      claim: "household",
      presentIn: ["before"],
      posture: "refuses",
      room: "hale-kitchen",
      consequenceFlag: "hale.stores",
    },
    contents: [
      item({
        itemId: "hale-winter-apples",
        name: "Winter apples",
        kind: "provision",
        eraAvailable: ["before"],
        obtainable: false,
        unavailableReason: "Ruth is at the kitchen table in the first life. The crock is her winter stores. There is no authored bypass: the apples are eaten across the fourteen years instead of stolen.",
        blurb: "Dried apples for the winter. They are not offered.",
      }),
      item({
        itemId: "hale-recipe-card",
        name: "Ruth's apple-card",
        kind: "collectible",
        eraAvailable: ["return"],
        blurb: "A recipe card that outlasted the apples: windfalls, clove, and a line about the proud board.",
      }),
    ],
    clue: { text: "The crock is under the dry sink, iron on the lid, where a kitchen keeps what it means to eat in March.", sourceId: "lfb-kitchen-crock", honest: true },
    interaction: {
      verb: "Open the crock",
      successCopy: "The apples are gone. A card remains, clove-stained: windfalls, not the numbered tree. And: the proud board was never for guests.",
      blockedCopy: "The iron on the lid is warm from the stove. This is not an unattended crock.",
      examinedCopy: "The crock holds a mouse nest and the smell of clove. You already have the card.",
      ownedRefusalCopy: "Ruth sets the flat iron back on the lid. 'That's the winter. Guests get what I put on the table.'",
      refusalRepeatCopy: "She has already said the crock is the winter. She will not say it twice kindly.",
    },
    era: {
      before: { state: "The crock is full. The kitchen is in use. Ruth is at the table.", available: true },
      return: { state: "The iron is rusted to a ring. The apples were eaten or spoiled years ago.", available: true, change: "What remains is the card, which the mice did not want. Taking it is not taking her winter." },
    },
    persistence: { note: "The apples cannot be taken while Ruth stands in the kitchen, and they do not survive as loot into the return. The card is the return yield, once." },
    environmentalStory: "The kitchen is a working room: soot on the kettle, a towel stiff with flour, the iron used as a weight because the lid warped. This is not a chest. It is how a house gets through March.",
  }),

  base("lfb-sideboard-locket", {
    title: "Locket behind the proud board",
    venue: "home",
    presentation: { kind: "hidden-compartment", prop: "the sideboard's back board, proud of the carcass by a finger's width", host: "kitchen sideboard" },
    ownership: {
      ownerId: "ruth-hale",
      ownerName: "Ruth Hale",
      claim: "household",
      presentIn: ["before"],
      posture: "refuses",
      room: "hale-kitchen",
      consequenceFlag: "hale.wary",
    },
    contents: [item({ itemId: "hale-locket", name: "Hale mother's locket", kind: "relic", eraAvailable: ["return"], blurb: "A closed locket. The hair inside is grey. The hinge is worn bright." })],
    clue: { text: "The parlor Bible's margin names it: Mother's face is behind the proud board in the sideboard. Not the linen.", sourceId: "lfb-parlor-clover", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-parlor-clover", note: "The proud board means nothing until the margin names it.", failCopy: "The sideboard holds folded linen. One back board sits proud of the others, and you do not yet know the reason." }],
    interaction: {
      verb: "Ease the board",
      successCopy: "The board comes free in your hands. The locket is in a nest of thread, no note with it. She meant the margin to be enough.",
      blockedCopy: "Linen, and a board that does not sit flush. Guessing at it would split the carcass.",
      examinedCopy: "The proud board is out. The thread nest is empty.",
      ownedRefusalCopy: "Ruth puts her hand flat on the sideboard. 'That was my mother's. Guests do not open it.'",
      refusalRepeatCopy: "Her hand stays on the wood. The answer has not changed.",
      heldCopy: "The board is not yours to ease while the house is still hers.",
    },
    era: {
      before: { state: "Ruth works at the table. The sideboard is in her sight and in her claim.", available: true },
      return: { state: "The kitchen is cold. The proud board has cupped a little further in the dry years.", available: true, change: "She is not here to refuse. The locket was not moved. Taking it is recorded as a grief, not as a theft from a living hand." },
    },
    persistence: { note: "The locket is unique. It cannot be taken in the first life while Ruth is in the kitchen. In the return it can be taken once, and then it is gone from both years." },
    environmentalStory: "The sideboard is older than the house's paint. The linen is everyday. The proud board is a cabinetmaker's mistake that a later hand learned to use: the nails are short, meant to pull.",
  }),

  base("lfb-attic-letter", {
    title: "Unsent letter in the attic trunk",
    venue: "home",
    presentation: { kind: "container", prop: "a hide trunk under the attic eave, strapped, the strap chewed at one hole" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "none", room: "hale-attic" },
    contents: [item({ itemId: "unsent-letter", name: "Unsent letter", kind: "collectible", eraAvailable: ["return"], questProtected: true, blurb: "Addressed only: for the one who comes back. The seal is her thumb in wax." })],
    clue: { text: "The trunk's strap is chewed at one hole, as if someone meant to open it often and did not. The direction on the top sheet, visible at the gap: for the one who comes back.", sourceId: "lfb-attic-letter", honest: true },
    interaction: {
      verb: "Take the letter",
      successCopy: "You break nothing that was not already meant to be broken. The letter is for the one who comes back, and the house has decided that is you.",
      blockedCopy: "The strap holds. Forcing it would tear the hide for a letter that names its reader.",
      examinedCopy: "The trunk is open. The place where the letter lay is a cleaner rectangle in the dust.",
      heldCopy: "The letter is addressed to the one who comes back. The seal is whole. It is not yours while she is still alive downstairs, keeping the winter.",
    },
    persistence: { questLock: true, note: "Quest-held through the first life: a living woman's unsent letter. The lock releases only in the return, when the address is finally true. It is never duplicated." },
    quest: { id: "unsent-return", release: { era: "return" } },
    era: {
      before: { state: "The letter waits in a house that is still lived in. Taking it would be reading ahead of a life.", available: true },
      return: { state: "The strap has let go on its own. The wax is crazed.", available: true, change: "Fourteen years make the address true. The quest releases. The letter can be taken once." },
    },
    environmentalStory: "The attic is apple crates and a dress form and the trunk. Nothing glows. The letter is paper a person could not send because the person it needed did not exist yet. The chew on the strap is mouse, not mystery.",
  }),

  base("lfb-attic-marble", {
    title: "Marble in the child's coat",
    venue: "home",
    presentation: { kind: "on-character", prop: "a child's coat on a nail, one pocket heavier than the wool accounts for", bearer: "the coat, not a body" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "none", room: "hale-attic" },
    contents: [item({ itemId: "childs-marble", name: "Child's clay marble", kind: "collectible", blurb: "A clay marble, blue under the dirt. Pocketed, not buried with anyone." })],
    clue: { text: "The coat on the attic nail hangs wrong on the left side. The pocket, not the hem, has the weight.", sourceId: "lfb-attic-marble", honest: true },
    interaction: {
      verb: "Take the marble",
      successCopy: "The marble is clay, chipped, warm from a pocket that has been empty of a child for longer than one winter. Downstairs, Ruth will know the shape of it.",
      blockedCopy: "The coat is only wool until you are close enough to feel the pocket.",
      examinedCopy: "The coat hangs even now. The pocket is soft and empty.",
    },
    era: {
      before: { state: "The coat is kept. The child is not in the attic. Ruth is in the kitchen.", available: true },
      return: { state: "Moths have mapped the sleeves. The pocket still holds.", available: true, change: "If you already took it in the first life, the pocket is empty and Ruth's silence already happened. If not, it is still here, and she is not downstairs to see." },
    },
    persistence: { note: "One marble. Taking it in the first life sets no constable on you. It sets Ruth's silence the moment you carry it into her kitchen. In the return the consequence is only the empty pocket." },
    environmentalStory: "Someone could not throw the coat away and could not wear it. The nail is at a child's reach. The marble is the kind won at a fair and lost in a pocket on purpose, to be found again by the owner. You are not the owner.",
  }),

  base("lfb-barn-halter", {
    title: "Halter on the barn peg",
    venue: "farm",
    presentation: { kind: "world-pickup", prop: "a worn halter on the third peg, noseband dark with use" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "none", room: "barn" },
    contents: [item({ itemId: "worn-halter", name: "Worn halter", kind: "ordinary", blurb: "Sized for the driving mare. The keeper is tied with wire." })],
    clue: { text: "The third peg is the only one polished by a hand. The halter there is the one that gets used, not the show strap on the nail above.", sourceId: "lfb-barn-halter", honest: true },
    interaction: {
      verb: "Take",
      successCopy: "You lift the halter. The peg under it is pale. The mare is not in the stall to argue.",
      blockedCopy: "The show strap is stiff with oil and not yours to straighten.",
      examinedCopy: "The third peg is pale and empty. Straw has not been swept against it in a long time, or else just today.",
    },
    era: {
      before: { state: "The stall is bedded. The mare is out. The halter is the working one.", available: true },
      return: { state: "The stall is storage: hurdles, a broken sled, no animal smell left.", available: true, change: "No one is keeping a mare. The halter is leftover tack, not a theft from a working barn." },
    },
    persistence: { note: "One halter, one peg. It does not return because a new horse arrived. The barn's later life is storage." },
    environmentalStory: "The barn is in order in the first life and in honest disorder after: harness oil, a curry comb, a board of nail sizes. The halter is evidence of a specific animal, not a pile of generic tack.",
  }),

  base("lfb-barn-lantern", {
    title: "Lantern on the tie-beam",
    venue: "farm",
    presentation: { kind: "world-pickup", prop: "a tin lantern hung from a nail in the tie-beam, glass smoked on one side" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "none", room: "barn" },
    contents: [item({ itemId: "barn-lantern", name: "Smoked barn lantern", kind: "equipment", blurb: "Burns clean if you wipe the glass. The soot is on the side that faced the hay." })],
    clue: { text: "Soot feathers the tie-beam above the nail and nowhere else. The lantern lives there because the haymow is where a light is needed and feared.", sourceId: "lfb-barn-lantern", honest: true },
    interaction: {
      verb: "Take",
      successCopy: "You unhook the lantern. The nail is warm from nothing but your hand. The soot tells you which way the hay was.",
      blockedCopy: "There is a lamp in the house. This one is the barn's, and it is still on its nail until you choose it.",
      examinedCopy: "The nail in the tie-beam is empty. The soot-feather remains, a record of evenings.",
    },
    era: {
      before: { state: "Oil in the font, wick trimmed, ready for chores.", available: true },
      return: { state: "The font is dry. The glass is intact.", available: true, change: "It still lights if you have oil from somewhere else. The barn no longer keeps any." },
    },
    persistence: { note: "One lantern. Taken once, the nail stays empty in both years. It is equipment, not a respawning light." },
    environmentalStory: "Hay dust, a ladder with a missing rung replaced by a sapling, and the soot mark. Someone was careful: the lantern hangs where it cannot swing into the hay.",
  }),

  base("lfb-barn-trowel", {
    title: "Grafting trowel",
    venue: "farm",
    presentation: { kind: "world-pickup", prop: "a narrow grafting trowel on the bench beside a coil of raffia" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "borrow", room: "barn" },
    contents: [item({ itemId: "grafting-trowel", name: "Grafting trowel", kind: "equipment", tool: "trowel", blurb: "Narrow blade, nicked. For roots and for jars that were buried with more hope than depth." })],
    clue: { text: "Raffia, wax crumbs, and a trowel too narrow for a post hole. The bench is the grafting bench, moved into the barn for winter.", sourceId: "lfb-barn-trowel", honest: true },
    interaction: {
      verb: "Borrow",
      successCopy: "You take the grafting trowel. A slate on the bench says tools go back by dark. You will not make dark. In the later year the chalk will still be asking.",
      blockedCopy: "The manure fork is for the stall. The trowel is the narrow one, and it is still on the bench.",
      examinedCopy: "The raffia coil remains. The trowel's outline in the dust, or in later chalk, says it went out and did not come home.",
    },
    era: {
      before: { state: "The grafting bench is in the barn until the ground thaws. The trowel is part of that work.", available: true },
      return: { state: "The raffia has yellowed. If the trowel is still here, no one needed a graft.", available: true, change: "Borrowing it in the first life leaves a chalk tick in the return: still out — R. The tool does not duplicate." },
    },
    persistence: { note: "Borrowed, not bought. One trowel. The authored consequence is the chalk and the journal, not a pursuit. It stays in your kit if you carry it across the years." },
    environmentalStory: "This bench is not a tool dump. Raffia, wax, a pencil, and labels cut from a tin. The orchard is managed by this room in winter. The trowel is the piece that also happens to dig a jar.",
  }),

  base("lfb-orchard-notebook", {
    title: "Notebook in the picker's coat",
    venue: "orchard",
    presentation: { kind: "on-character", prop: "a canvas coat over the orchard fence, notebook string dangling from the pocket", bearer: "a seasonal picker's coat, owner gone to the ridge" },
    ownership: { ownerId: null, ownerName: "the ridge crew", claim: "abandoned", presentIn: [], posture: "none", room: "orchard" },
    contents: [item({ itemId: "graft-notebook", name: "Graft notebook", kind: "collectible", blurb: "Row numbers, a blaze count, and a warning about the milepost hollow." })],
    clue: { text: "The coat on the fence is not Hale clothing. The pocket string is a notebook tie, waxed so the rain will not take the lead.", sourceId: "lfb-orchard-notebook", honest: true },
    interaction: {
      verb: "Take the notebook",
      successCopy: "The notebook is the crew's. The last page: cache under the blazed oak, three in from the fair, not the numbered row. The milepost knot is a hollow, and it is the surveyor's, not ours.",
      blockedCopy: "The coat has apples in the other pocket, bruised, not worth a theft.",
      examinedCopy: "The coat remains for a picker who did not come down from the ridge. The notebook string is gone.",
    },
    era: {
      before: { state: "The crew is up on Larrabee ridge. This coat was left at the fence at noon.", available: true },
      return: { state: "The canvas has rotted at the shoulders. The pocket still keeps paper better than cloth.", available: true, change: "No crew returns for it. The notes are still accurate: the blaze was cut into living bark and the tree kept them." },
    },
    persistence: { note: "One notebook. Reading it is what makes the blaze and the milepost fair to open. It does not respawn if the fence is checked twice." },
    environmentalStory: "A working coat, not a corpse and not a costume. Bruised apples, a stub pencil, and a page that distinguishes the numbered mother-tree from the blazed oak so a careful person will not dig in the wrong row.",
  }),

  base("lfb-orchard-tag", {
    title: "Seek-No-Further, tree twelve",
    venue: "orchard",
    presentation: { kind: "world-pickup", prop: "a zinc tag wired to the twelfth tree of the north row, letters punched" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "public-offering", presentIn: [], posture: "none", room: "orchard" },
    contents: [item({ itemId: "seek-no-further-tag", name: "Seek-No-Further tag", kind: "collectible", blurb: "Punched zinc: SEEK-NO-FURTHER / 12. The mother tree of the commercial row." })],
    clue: { text: "The ladder leaned in the north row is numbered in paint, and the twelfth trunk wears a zinc tag. That is the mother tree, not a cache.", sourceId: "lfb-orchard-tag", honest: true },
    interaction: {
      verb: "Take the tag",
      successCopy: "You untwist the wire. The tag names the tree the crew is proud of. It is not a mark to dig under. The notebook, if you have it, says the same by saying otherwise.",
      blockedCopy: "Green fruit is not ripe, and the tag is still wired down.",
      examinedCopy: "Tree twelve is untagged. The paint number remains on the ladder, which nobody moved.",
    },
    era: {
      before: { state: "The row is tended. Twelve is the tree they show buyers.", available: true },
      return: { state: "Twelve still fruits, untended, and the zinc has gone dull.", available: true, change: "The tag survives because zinc does. The tree is not a secret." },
    },
    persistence: { note: "One tag on one mother tree. Taking it does not reveal a jar. It is the honest labeled thing, so the blaze can be the other thing." },
    environmentalStory: "The north row is straight, which cost someone years. Paint numbers on the ladder, zinc on the trunk, a graft scar at knee height. Pride, not treasure.",
  }),

  base("lfb-orchard-windfalls", {
    title: "Basket of windfalls",
    venue: "orchard",
    presentation: { kind: "world-pickup", prop: "a split-oak basket of windfalls at the end of the cleared row" },
    ownership: { ownerId: null, ownerName: "the ridge crew", claim: "public-offering", presentIn: [], posture: "none", room: "orchard" },
    contents: [
      item({
        itemId: "fair-windfalls",
        name: "Fair windfalls",
        kind: "provision",
        eraAvailable: ["before"],
        blurb: "Bruised Seek-No-Furthers, still sound at the core.",
        spoilsOnReturn: {
          itemId: "fair-windfalls-leather",
          name: "Leather windfalls",
          kind: "provision",
          blurb: "The same apples, fourteen years in a pocket of time. Leather, clove, and memory.",
          note: "The windfalls you carried have dried to leather. They were never going to stay fruit.",
        },
      }),
      item({ itemId: "fair-windfalls-leather", name: "Leather windfalls", kind: "provision", eraAvailable: ["return"], blurb: "The basket sat. The fruit dried in place instead of being eaten." }),
    ],
    clue: { text: "Windfalls are gathered at the end of the cleared row, in the crew's basket, free to a walker who is not stripping the trees.", sourceId: "lfb-orchard-windfalls", honest: true },
    interaction: {
      verb: "Take the fruit",
      successCopy: "You take the windfalls and leave the basket tipped, so the crew can see it was a person and not a deer. In the later year this same fruit would have been leather.",
      blockedCopy: "The trees are not a free orchard. The basket is the offered part.",
      examinedCopy: "The basket lies on its side, empty. Whatever the year, this particular gathering is gone.",
    },
    era: {
      before: { state: "Fresh bruises, today's drops, offered by being gathered and left.", available: true },
      return: { state: "The same basket, the fruit dried to leather by summers nobody picked.", available: true, change: "If you already took them, the basket is empty and what you carried has dried in your pocket. If you waited, the leather is here and the fresh fruit is not." },
    },
    persistence: { note: "One gathering. The first year you take it decides the form. It does not restock each visit. Carrying fresh fruit across the fourteen years spoils it into the leather the ground would have made." },
    environmentalStory: "The basket is split oak, mended with a strip of tin. Deer have nosed it and been disappointed by the handle. Offering, not abandonment: it sits in the open on purpose.",
  }),

  base("lfb-orchard-wax", {
    title: "Grafting wax on the ladder",
    venue: "orchard",
    presentation: { kind: "world-pickup", prop: "a tin of grafting wax wedged on the ladder's second rung" },
    ownership: { ownerId: "ruth-hale", ownerName: "Ruth Hale", claim: "household", presentIn: [], posture: "borrow", room: "orchard" },
    contents: [item({ itemId: "graft-wax", name: "Tin of grafting wax", kind: "ordinary", blurb: "Beeswax and resin. Softens in a pocket." })],
    clue: { text: "The ladder's second rung is sticky. The tin is wedged there so a grafter's hands find it without a pocket search.", sourceId: "lfb-orchard-wax", honest: true },
    interaction: {
      verb: "Take the tin",
      successCopy: "The wax tin comes free with a sound like a kiss. Your fingers smell of resin. It will not seal a grate. It will tell you who worked this row.",
      blockedCopy: "Green wood is not wax, and the tin is still wedged.",
      examinedCopy: "The second rung is still sticky. The tin is gone.",
    },
    era: {
      before: { state: "Soft wax, this season's mix.", available: true },
      return: { state: "The tin has bloomed white. The wax inside is still wax.", available: true, change: "Resin does not care about fourteen years. The grafter does, and is gone." },
    },
    persistence: { note: "One tin. Borrowed from a rung, not a shop counter. It does not refill." },
    environmentalStory: "Grafting is visible: scars, raffia ghosts, a ladder that lives in the row. The wax is the material of that work, left at hand height.",
  }),

  base("lfb-blaze-cache", {
    title: "Jar under the blazed oak",
    venue: "cache",
    presentation: { kind: "buried-cache", prop: "three axe blazes on the oak three trees in from the fair, jar under the duff", marker: "the blazed oak" },
    ownership: { ownerId: null, ownerName: "the ridge crew", claim: "cache", presentIn: [], posture: "none", room: "orchard" },
    contents: [
      item({ itemId: "blaze-jar-coins", name: "Jar of half-dimes", kind: "relic", blurb: "Silver half-dimes in a mason jar, lid waxed. Crew savings, not a dragon's hoard." }),
      item({ itemId: "orchard-map-scrap", name: "Scrap of the ridge map", kind: "collectible", blurb: "A torn corner showing Larrabee ridge and a second blaze you cannot walk to from this bend." }),
    ],
    clue: { text: "The picker's notebook says: cache under the blazed oak, three in from the fair, not the numbered row. Tree twelve is the mother tree. This oak is the other mark.", sourceId: "lfb-orchard-notebook", honest: true },
    prerequisites: [
      { type: "clue-read", id: "lfb-orchard-notebook", note: "A blaze without the notebook is one mark among many.", failCopy: "An old blaze, three cuts, on the oak. The orchard is full of marks. Digging here would be a guess, and the notebook has not yet told you to." },
      { type: "tool", id: "trowel", note: "The jar is under roots. Hands will not do.", failCopy: "The notebook is right about this oak. The duff is root-bound. You want the grafting trowel from the barn, not your fingers." },
    ],
    interaction: {
      verb: "Dig",
      successCopy: "The trowel ticks glass. The jar is half-dimes and a torn corner of a ridge map. The crew trusted the blaze more than a bank in town.",
      blockedCopy: "Duff, roots, and a mark you have not earned the meaning of.",
      examinedCopy: "The hole is a shallow mouth, already filling with leaves. The jar is with you.",
    },
    era: {
      before: { state: "The blazes are bright in the bark. The crew is alive and elsewhere.", available: true },
      return: { state: "The blazes have stretched with the trunk and gone grey.", available: true, change: "Nobody came back for the jar. Silver does not spoil. The map corner is the part that still points past this fragment." },
    },
    persistence: { note: "One jar. It stays buried until the notebook and the trowel agree. It does not respawn, and it is not a random chest under a random tree." },
    environmentalStory: "The oak is older than the rows. Three cuts, healed at the lips, the lowest at a kneeling height. The fair side of the orchard is the river side. 'Three in' is a count you can do with a hand on the trunks.",
  }),

  base("lfb-cooper-bung", {
    title: "Branded bung",
    venue: "workshop",
    presentation: { kind: "world-pickup", prop: "a finished barrel head on the shop floor, bung branded with a circled nail" },
    ownership: { ownerId: "cooper-vellum", ownerName: "Cooper Vellum", claim: "trade", presentIn: [], posture: "none", room: "workshop" },
    contents: [item({ itemId: "branded-bung", name: "Branded bung", kind: "collectible", blurb: "A bung branded with a nail bent into a circle. Proof the shop finished at least one barrel." })],
    clue: { text: "The barrel head on the floor is the only finished thing in a shop of shavings. The bung carries the brand; the loose iron does not, yet.", sourceId: "lfb-cooper-bung", honest: true },
    interaction: {
      verb: "Take the bung",
      successCopy: "You work the bung free. The brand is a nail bent to a circle, burned in, not painted. The shop did make it to the end of at least one piece.",
      blockedCopy: "Shavings are not a take. The bung is still seated.",
      examinedCopy: "The barrel head gapes where the bung was. The brand's ghost is scorched around the hole.",
    },
    era: {
      before: { state: "The shop is closed for a delivery, not abandoned. The hasp outside is clasped, not locked.", available: true },
      return: { state: "The hasp has rusted open. The barrel head is still the cleanest object in the room.", available: true, change: "Vellum did not come back from the falls. The finished bung is the evidence of the last good day." },
    },
    persistence: { note: "One bung from the one finished head. The shop is entered by lifting a clasp, not by a glowing lock. The bung does not respawn." },
    environmentalStory: "Shavings to the ankle, a drawknife on the bench, a horse, a spike of invoices, and one finished head. The door is clasped because he meant to return this afternoon. The work in the room tells you the trade before any item does.",
  }),

  base("lfb-cooper-drawknife", {
    title: "Drawknife on the bench",
    venue: "workshop",
    presentation: { kind: "world-pickup", prop: "a drawknife laid across the bench, edge oiled, handles sweat-dark" },
    ownership: { ownerId: "cooper-vellum", ownerName: "Cooper Vellum", claim: "trade", presentIn: [], posture: "none", room: "workshop" },
    contents: [item({ itemId: "cooper-drawknife", name: "Cooper's drawknife", kind: "equipment", blurb: "Oiled edge. The handles know one span of hand." })],
    clue: { text: "The bench is cleared in a stripe the width of a drawknife. The tool is in that stripe, edge toward the wall, the way a careful worker sets it down.", sourceId: "lfb-cooper-drawknife", honest: true },
    interaction: {
      verb: "Take",
      successCopy: "You take the drawknife. The stripe on the bench is the only clean wood in the shop. He set it down meaning to pick it up before the kettle.",
      blockedCopy: "The froe on the wall is cracked. This is the knife he trusted, and it is still in its stripe.",
      examinedCopy: "The clean stripe on the bench is filling with dust, or was never used again.",
    },
    era: {
      before: { state: "Oiled today. The shop expects him back from the falls with an empty wagon.", available: true },
      return: { state: "The oil has gummed. The edge is still honest under it.", available: true, change: "Fourteen years of a tool set down for a moment. No apprentice took it up." },
    },
    persistence: { note: "One drawknife. The shop does not grow a new one. Clasp, stripe, oil: the placement is the work, paused." },
    environmentalStory: "A cooper's bench is a map of motions. The stripe is where the knife lives so it will not take a knee in the dark. Shavings curl in the bin, still springy in the first life, flat as paper after.",
  }),

  base("lfb-cooper-invoice", {
    title: "Invoice spike",
    venue: "workshop",
    presentation: { kind: "container", prop: "a nail driven into the post, invoices stabbed on it in date order" },
    ownership: { ownerId: "cooper-vellum", ownerName: "Cooper Vellum", claim: "trade", presentIn: [], posture: "none", room: "workshop" },
    contents: [
      item({
        itemId: "invoice-rubbing",
        name: "Rubbing of Vellum's invoices",
        kind: "collectible",
        onEnterReturnGrant: "cooper.order-closed",
        onEnterReturnNote: "The invoice's last line, carried through the years, has darkened into sense. Paid. The yard is closed.",
        blurb: "A charcoal rubbing. Three barrels open in the first life. A last line waits.",
      }),
    ],
    grants: { both: [], before: [], return: ["cooper.order-closed"] },
    clue: { text: "The spike by the door is where a one-man shop keeps what is owed. The top sheet is the quarry's name and a barrel count.", sourceId: "lfb-cooper-invoice", honest: true },
    interaction: {
      verb: "Read the spike",
      successCopy: "You rub the top sheet. Pell's spare grate-key hangs in Bascom's scoop tin. Hodge's pay is uncollected at the drill-steel stake; he went to Vergennes on the third and did not draw it. Three barrels are still open on Vellum's own account.",
      blockedCopy: "The spike is a nail and a stack of paper. The top sheet is the one that matters, and you have not read it.",
      examinedCopy: "The spike still holds the paper. Your rubbing is the copy that travels.",
      rereadCopy: "You read the spike in this year. The last line has come clear: paid, yard closed. The brand is no longer holding a live order.",
    },
    persistence: {
      fixture: true,
      note: "The invoices stay nailed. You carry a rubbing, not the shop's only file. Reading them in the return, or carrying the rubbing across, closes Vellum's order and releases the brand-iron. The rubbing is unique and is not given twice.",
    },
    era: {
      before: { state: "The top sheet is wet with fresh ink at the barrel count. The order is open.", available: true },
      return: { state: "Ink has browned. A last line, faint before, reads as paid.", available: true, change: "The same sheets age into the release condition for the brand. This is why the spike can be read again after fourteen years." },
    },
    environmentalStory: "A spike is a filing system for a man who will not buy a cabinet. Dates run downward into older, softer paper. The quarry, the sugarhouse, and his own unfinished count are all on the top two sheets, which is as much map as the county needs.",
  }),

  base("lfb-cooper-brand", {
    title: "Brand-iron in the horse's stile",
    venue: "workshop",
    presentation: { kind: "hidden-compartment", prop: "the shaving horse's stile, end-grain scorched in a circle the size of a bung", host: "shaving horse" },
    ownership: { ownerId: "cooper-vellum", ownerName: "Cooper Vellum", claim: "quest-held", presentIn: [], posture: "none", room: "workshop" },
    contents: [item({ itemId: "cooper-brand-iron", name: "Vellum's brand-iron", kind: "relic", eraAvailable: ["return"], questProtected: true, blurb: "A nail bent to a circle and hafted. The fourteen-nail mark, still his until the order closes." })],
    clue: { text: "The burn is on the stile of the horse, a circle the size of the bung, not on the tool wall. The iron lives in the cut that made the mark. The invoice says whether the work is finished.", sourceId: "lfb-cooper-bung", honest: true },
    interaction: {
      verb: "Take the brand",
      successCopy: "The order is closed. You draw the brand-iron out of the stile. It is a bent nail with a handle, and it is the shop's signature, finally without a barrel owed.",
      blockedCopy: "The stile is scorched. Prying it without knowing the mark would splinter a tool that still has a job.",
      examinedCopy: "The stile's slot is empty. The scorch remains around it like a mouth.",
      heldCopy: "The brand sits in the stile, and the invoice still has barrels open. Vellum's mark is not a souvenir while the work is open. Read the spike again when the years have closed it.",
    },
    persistence: {
      questLock: true,
      note: "Quest-held by the open order. The release is the flag cooper.order-closed, granted by reading the spike in the return or by carrying the rubbing across the fourteen years. One iron. It does not appear in the first life as takeable loot.",
    },
    quest: { id: "fourteen-nails", release: { flag: "cooper.order-closed" } },
    era: {
      before: { state: "The iron is in the stile and the order is alive. Looking is fair. Taking is not.", available: true },
      return: { state: "The same slot. The paper on the spike has aged into a closed account.", available: true, change: "The quest releases only when that account is read as closed. The iron does not rust into a different, free copy." },
    },
    environmentalStory: "The shaving horse is scarred where a hot iron was laid to test the circle. The tool wall has froes and a crooked saw, none of them branded. The signature is hidden in the work, which is where a cooper who disliked display would keep it.",
  }),

  base("lfb-skiff-satchel", {
    title: "Satchel under the skiff's thwart",
    venue: "boat",
    presentation: { kind: "on-character", prop: "a waxed satchel wedged under the skiff's thwart", bearer: "Eli Hale's skiff" },
    ownership: {
      ownerId: "eli-hale",
      ownerName: "Eli Hale",
      claim: "household",
      presentIn: ["before"],
      posture: "refuses",
      room: "boathouse",
      consequenceFlag: "eli.sharp",
    },
    contents: [
      item({ itemId: "river-chart", name: "Lemon Fair chart", kind: "collectible", eraAvailable: ["return"], blurb: "A penciled chart. The snag with the boot is marked. The adit is not." }),
      item({ itemId: "waxed-matches", name: "Waxed matches", kind: "ordinary", eraAvailable: ["return"], blurb: "A tin of matches, waxed, still willing after the damp years." }),
    ],
    clue: { text: "The skiff's thwart throws a shadow that is too square. Eli's satchel lives under it when he is mending and does not want the wax in the sun.", sourceId: "lfb-skiff-satchel", honest: true },
    interaction: {
      verb: "Free the satchel",
      successCopy: "The skiff is half-sunk and Eli is not on the dock. The satchel gives you a chart that marks the boot in the snag, and matches that still strike.",
      blockedCopy: "The thwart is a seat. The shadow under it is not yours to name while the boatman is ten feet away.",
      examinedCopy: "The thwart is bare underneath. The skiff holds rain.",
      ownedRefusalCopy: "Eli puts a boot on the thwart. 'That's my dry kit. The river is not a cupboard.'",
      refusalRepeatCopy: "He is still on the dock. The satchel is still his.",
    },
    era: {
      before: { state: "Eli mends net on the dock. The skiff is afloat. The satchel is his dry kit.", available: true },
      return: { state: "The skiff is half-sunk on the cradle. The satchel's wax held.", available: true, change: "He is not here to refuse. The chart's pencil has run, but the X on the snag survived." },
    },
    persistence: { note: "Refused in the first life by the man standing on the dock. No fight, no constable: he says no, and the no holds until the return, when the boat is a wreck and the kit is salvage, once." },
    environmentalStory: "Net needle stuck in the wall, oakum, a bailer, and a man who is working. The satchel is placed where splash will not reach it. In the return the same cradle holds a boat that lost an argument with fourteen winters.",
  }),

  base("lfb-net-locker", {
    title: "Net locker",
    venue: "boat",
    presentation: { kind: "container", prop: "a locker under the dock bench, cut from one log, lid a scrap of boat" },
    ownership: {
      ownerId: "eli-hale",
      ownerName: "Eli Hale",
      claim: "trade",
      presentIn: ["before"],
      posture: "refuses",
      room: "boathouse",
    },
    contents: [
      item({
        itemId: "eli-cider-flask",
        name: "Eli's cider flask",
        kind: "provision",
        eraAvailable: ["before"],
        obtainable: false,
        unavailableReason: "Eli is on the dock. The flask is his lunch. It is not obtainable in the first life, and by the return it has become vinegar in the locker rather than a prize for insisting.",
        blurb: "Sweet cider, his, for the midday mend.",
      }),
      item({ itemId: "cider-vinegar", name: "Flask of vinegar", kind: "provision", eraAvailable: ["return"], blurb: "The same flask. The cider went to vinegar and stayed drinkable in the way vinegar is." }),
      item({ itemId: "net-weights", name: "Bundle of net weights", kind: "ordinary", eraAvailable: ["return"], blurb: "Lead weights, hand-rolled. The net they belonged to is a rag." }),
    ],
    clue: { text: "The dock bench is hollow because the front board is a locker face. Net weights clink if you tap it. The flask shape is beside them in the sound.", sourceId: "lfb-net-locker", honest: true },
    interaction: {
      verb: "Open the locker",
      successCopy: "The locker opens on a dry click. The cider is vinegar. The weights remain, rolled by his hand, heavier than they look.",
      blockedCopy: "The bench is a bench until you know it is a locker, and even then the man may be sitting on the answer.",
      examinedCopy: "The locker is empty of anything but scale and a smell of vinegar.",
      ownedRefusalCopy: "Eli taps the bench with the net needle. 'Weights and my flask. You can watch the mend. You cannot shop it.'",
      refusalRepeatCopy: "He goes back to the mesh. The bench is not a counter.",
    },
    era: {
      before: { state: "Lunch flask, working weights, a man between you and the lid.", available: true },
      return: { state: "The lid has shrunk and fits loose. What was cider is vinegar. The lead did not care.", available: true, change: "Provisions spoil into a different authored yield. The weights, being lead, are the part that time does not edit." },
    },
    persistence: { note: "The flask cannot be stolen at lunch. In the return the vinegar and the weights are one take. They do not restock." },
    environmentalStory: "A boatman's bench is furniture and inventory at once. Scale glitter in the cracks. The needle in the wall is threaded with a color of linen you can still match to the rag of net.",
  }),

  base("lfb-plank-key", {
    title: "Key under the walkway plank",
    venue: "boat",
    presentation: { kind: "hidden-compartment", prop: "a walkway plank with a knot knocked out and stopped with oakum", host: "boathouse walkway" },
    ownership: {
      ownerId: "eli-hale",
      ownerName: "Eli Hale",
      claim: "trade",
      presentIn: ["before"],
      posture: "refuses",
      room: "boathouse",
    },
    contents: [item({ itemId: "eli-grate-key", name: "Eli's grate key", kind: "equipment", eraAvailable: ["return"], opens: ["quarry-grate"], blurb: "A key filed from a nail. It turns the adit grate. Pell kept the spare." })],
    clue: { text: "Oakum in a knot-hole is not how a plank is repaired. It is how a plank is kept quiet. The invoice names Eli's copy under the boathouse walkway, and Pell's spare in the scoop tin.", sourceId: "lfb-cooper-invoice", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-cooper-invoice", note: "The oakum is visible, but pulling it without the invoice is vandalism of a working dock.", failCopy: "A plank stopped with oakum. It might be a repair. You do not yet have a reason to pull a working dock apart." }],
    interaction: {
      verb: "Pull the oakum",
      successCopy: "The oakum comes in one greasy plug. Eli's key is a filed nail on a leather lace. The grate at the adit will know it.",
      blockedCopy: "Oakum in a knot. On a dock, that is usually just oakum.",
      examinedCopy: "The knot-hole is open. The lace is gone.",
      ownedRefusalCopy: "Eli steps onto the plank so it sits down hard. 'That stops the drip. Leave it stopping the drip.'",
      refusalRepeatCopy: "He is standing on the answer. It will not be pulled while he is.",
    },
    era: {
      before: { state: "Eli uses this walkway all day. The key is his and the plank is doing a job.", available: true },
      return: { state: "The oakum has dried and shrunk. The drip it stopped is a stain.", available: true, change: "His refusal ends with his absence. Pell's spare in the sugarhouse is the first-life way into the adit; this key is the return's." },
    },
    persistence: { note: "One key, Eli's. Not a duplicate of Pell's spare: both open the same grate and both are unique objects. Eli's cannot be taken out from under his boots." },
    environmentalStory: "The walkway is three planks wide, silvered, with one knot that a casual eye calls a patch. Oakum is boat work used on a floor, which is the tell, once a paper has told you to believe it.",
  }),

  base("lfb-scoop", {
    title: "Copper scoop by the arch",
    venue: "farm",
    presentation: { kind: "world-pickup", prop: "a copper scoop hanging on the sugar arch, bowl green in the seams" },
    ownership: { ownerId: "bascom", ownerName: "Bascom", claim: "trade", presentIn: [], posture: "borrow", room: "sugarhouse" },
    contents: [item({ itemId: "copper-scoop", name: "Copper sugar scoop", kind: "equipment", blurb: "Dented bowl. Smells faintly of sap even when dry." })],
    clue: { text: "The slate on the arch says the scoop stays by the arch. It is on the nail the slate can see.", sourceId: "lfb-sap-spile", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-sap-spile", note: "The slate is the sugarhouse's voice, and it is in the same room.", failCopy: "A copper scoop on a nail. The slate beside it has not been read, and sugarhouses are particular." }],
    interaction: {
      verb: "Borrow the scoop",
      successCopy: "You lift the scoop. The slate permitted the borrowing and asked for it back at dark. Dark, again, is fourteen years away.",
      blockedCopy: "The arch is cold. The scoop stays until the slate is part of the decision.",
      examinedCopy: "The nail on the arch is empty. Verdigris outlines a bowl.",
    },
    era: {
      before: { state: "Bascom is at the falls with the syrup, as the slate says. The arch is cold but kept.", available: true },
      return: { state: "A sheet of tin has slid off the roof and leans on the arch. The scoop is still on its nail if you did not borrow it.", available: true, change: "Borrowing leaves the nail empty in both years. The tin sheet is the return's weather, not a second scoop." },
    },
    persistence: { note: "One scoop, borrowed under a written leave. No one chases you to the lane. The chalk habit of this county is the consequence." },
    environmentalStory: "The arch is brick, the pan is gone to the vault or to pawn, and the scoop remains because it was on a nail and not in a pocket. Sap varnish stripes the brick. This room boiled.",
  }),

  base("lfb-tin-ledger", {
    title: "Scoop tin and the spare key",
    venue: "farm",
    presentation: { kind: "container", prop: "a dented scoop tin on the sugarhouse shelf, used as a box once the scoops were hung" },
    ownership: { ownerId: "bascom", ownerName: "Bascom", claim: "trade", presentIn: [], posture: "none", room: "sugarhouse" },
    contents: [
      item({ itemId: "pell-spare-key", name: "Pell's spare grate key", kind: "equipment", opens: ["quarry-grate"], blurb: "The spare, tagged with a drill-steel shaving. Opens the adit while Eli is still on his plank." }),
      item({ itemId: "sap-ledger-leaf", name: "Pressed sap-ledger leaf", kind: "collectible", blurb: "A ledger page and a maple leaf pressed in the same fold. Debts to the quarry run down the margin." }),
    ],
    clue: { text: "Vellum's invoice says Pell's spare grate-key hangs in Bascom's scoop tin. The tin is on the sugarhouse shelf, too small for syrup and too carefully shut.", sourceId: "lfb-cooper-invoice", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-cooper-invoice", note: "The tin is a tin. The invoice makes it a key box.", failCopy: "A dented tin on a shelf of dents. It could be nails. You have no reason yet to treat it as a key." }],
    interaction: {
      verb: "Open the tin",
      successCopy: "The tin holds Pell's spare key, tagged with a curl of steel, and a ledger leaf pressed with a maple leaf. The margin owes the quarry for a grate that was never billed twice.",
      blockedCopy: "The shelf is a row of ordinary tins. This one stays shut until you know it is the spare's house.",
      examinedCopy: "The tin is empty, the leaf-shape still pressed into a film of sugar dust.",
    },
    era: {
      before: { state: "Bascom is at the falls. The tin is unattended because the slate says so, and the arch is cold.", available: true },
      return: { state: "Sugar dust has cemented the lid. It still opens.", available: true, change: "The spare key is the first-life way through the grate. It is not Eli's key and does not replace that story." },
    },
    persistence: { note: "One spare key and one leaf. Opening the tin once gives both. They are not random shop stock." },
    environmentalStory: "A sugarhouse shelf collects tins the way a river collects wood. This one is shut with a twist of wire that a syrup-maker uses on everything. Inside, paper and iron, which do not belong with sap, which is how you know the invoice was telling the truth.",
  }),

  base("lfb-sap-spile", {
    title: "Spile on the slate ledge",
    venue: "farm",
    presentation: { kind: "world-pickup", prop: "a cedar spile on the slate's ledge, dark with old sap" },
    ownership: { ownerId: "bascom", ownerName: "Bascom", claim: "trade", presentIn: [], posture: "none", room: "sugarhouse" },
    contents: [item({ itemId: "sap-spile", name: "Cedar spile", kind: "ordinary", blurb: "One spile, the sample he kept to show the grain. Not a bucket of them." })],
    clue: { text: "The slate ledge holds one spile so a visitor can see the bore. The slate itself says Bascom is at the falls with the syrup, and that the scoop stays by the arch.", sourceId: "lfb-sap-spile", honest: true },
    interaction: {
      verb: "Take the spile",
      successCopy: "You take the sample spile. The slate has done its other job: Bascom is away, the scoop may be borrowed, and the arch is meant to be cold today.",
      blockedCopy: "The slate is a slate. The spile is still the sample on the ledge.",
      examinedCopy: "The ledge is sticky and empty. The slate's words remain.",
    },
    era: {
      before: { state: "The slate is freshly written. The absence is intentional and posted.", available: true },
      return: { state: "The chalk has been rewritten by weather into a ghost. The words are still the words.", available: true, change: "A posted absence is not a riddle. It is how this room gives leave without a person in it." },
    },
    persistence: { note: "Reading the slate is this take. The spile is the physical yield, once. The leave it records is what makes the scoop a borrowing." },
    environmentalStory: "Chalk, a ledge at hand height, one spile dark at the tip. The room explains itself to a neighbor. That is the opposite of a locked chest in an empty cellar.",
  }),

  base("lfb-chapel-niche", {
    title: "Offering niche in the chapel footing",
    venue: "ruin",
    presentation: { kind: "container", prop: "a niche in the footing course, river side, holding one worn coin" },
    ownership: { ownerId: null, ownerName: "the habit of the lane", claim: "public-offering", presentIn: [], posture: "offering", room: "chapel" },
    contents: [
      item({ itemId: "chapel-coin", name: "Lane offering coin", kind: "collectible", blurb: "A worn cent left in the footing. Taking it is allowed and remembered." }),
      item({ itemId: "chapel-second-coin", name: "Second offering coin", kind: "collectible", eraAvailable: ["return"], requiresPrior: "left", blurb: "Someone, or the years, matched your coin." }),
      item({ itemId: "chapel-token", name: "Chapel token", kind: "relic", eraAvailable: ["return"], requiresPrior: "left", blurb: "A punched tin token the lane leaves for a person who left the coin alone." }),
      item({ itemId: "chapel-note", name: "Note in the niche", kind: "collectible", eraAvailable: ["return"], requiresPrior: "took", blurb: "For the one who took the cent. It did not buy what you hoped." }),
    ],
    clue: { text: "The river-side footing has a niche at knee height, the mortar scooped by fingers over years. A coin sits in it the way coins sit in places that are not shops.", sourceId: "lfb-chapel-niche", honest: true },
    interaction: {
      verb: "Take the coin",
      successCopy: "You take the cent. The niche looks smaller without it, which is the whole of the punishment.",
      blockedCopy: "The niche is a habit, not a drawer you have failed to open.",
      examinedCopy: "The niche has already given you what your choice earned. It does not refill.",
    },
    special: "chapel-offering",
    branches: {
      takeBefore: { items: ["chapel-coin"], copy: "You take the cent out of a niche that was not a shop. The lane will still be here in fourteen years, and it will have noticed." },
      leaveBefore: { items: [], copy: "You leave the cent. Your hand knows it was there. That is the whole ceremony, and it is enough." },
      returnAfterLeft: { items: ["chapel-token", "chapel-second-coin"], copy: "Two coins now, and a punched tin token under them. The lane matched what you left and added a thanks that is not money." },
      returnAfterTook: { items: ["chapel-note"], copy: "The cent is not back. A note is, penciled on the back of a hymn strip: for the one who took it. It did not buy what you hoped." },
      returnFresh: { items: ["chapel-coin"], copy: "You never stood here in the first life. The cent is still in the niche, patient and unimproved. You may take it once." },
    },
    era: {
      before: { state: "One coin, recently bright. The footing is used as a chapel by people who will not rebuild the walls.", available: true },
      return: { state: "The niche holds whatever your earlier hand earned: a matching gift, a rebuke, or the original cent if you never chose.", available: true, change: "Era behavior here is authored consequence, not a restock. Leave, take, or arrive late: three different niches, one history." },
    },
    persistence: { note: "The niche remembers the first-life choice across the fourteen years. It does not reset on leaving the map. Tokens and the rebuke are prior-choice yields and are not lying around for a fresh return." },
    environmentalStory: "No roof, no door, a footing course and a view of the fair. People still put a coin where the door would have been. The mortar is scooped. That is the whole architecture, and it is enough to hold a moral.",
  }),

  base("lfb-chapel-lintel", {
    title: "Lintel that names the seventh",
    venue: "ruin",
    presentation: { kind: "world-pickup", prop: "a fallen lintel stone, letters cut shallow: the seventh weeps when the river is loud" },
    ownership: { ownerId: null, ownerName: "the chapel footing", claim: "civic", presentIn: [], posture: "none", room: "chapel" },
    contents: [item({ itemId: "lintel-rubbing", name: "Rubbing of the lintel", kind: "collectible", blurb: "Charcoal on a hymn-strip: the seventh weeps when the river is loud." })],
    clue: { text: "The fallen lintel faces the river on purpose, letters up, kept clean by rain. It is the chapel's only sentence.", sourceId: "lfb-chapel-lintel", honest: true },
    interaction: {
      verb: "Take a rubbing",
      successCopy: "You rub the sentence onto a hymn-strip. The seventh stone of the river course is the one that weeps. Count from the water, not from the road.",
      blockedCopy: "The stone is a stone until you stop and read the cuts.",
      examinedCopy: "The lintel keeps its sentence. Your rubbing is the copy.",
    },
    era: {
      before: { state: "The cuts are sharp. Someone recut them in living memory.", available: true },
      return: { state: "Lichen is in the letters and not quite winning.", available: true, change: "The instruction does not rot. The seventh stone is still the seventh." },
    },
    persistence: { note: "The lintel stays. The rubbing is unique. Reading it is the prerequisite for the nail in the river course, so the nail is inference and not a sparkling loose brick." },
    environmentalStory: "A lintel on the ground is a failure of a building and a success of a message. Someone turned the letters up and recut them. The river is loud at this bend all spring, which is why the sentence could not be only poetry.",
  }),

  base("lfb-chapel-nail", {
    title: "Seventh stone of the river course",
    venue: "ruin",
    presentation: { kind: "hidden-compartment", prop: "the seventh footing stone counting from the water, a weep-hole darkened by damp", host: "river course of the footing" },
    ownership: { ownerId: null, ownerName: "the chapel footing", claim: "civic", presentIn: [], posture: "none", room: "chapel" },
    contents: [item({ itemId: "seventh-nail", name: "Seventh roof nail", kind: "relic", blurb: "A hand-forged nail from the lost roof, hidden in the stone that weeps. One of the fourteen, not the brand." })],
    clue: { text: "The lintel says the seventh weeps when the river is loud. Count the footing stones from the water. The seventh has a weep-hole that is dark when the others are dry.", sourceId: "lfb-chapel-lintel", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-chapel-lintel", note: "Any loose stone would be vandalism. The sentence picks the seventh.", failCopy: "The footing is a row of stones, some damp. You do not yet know which one is allowed to be opened." }],
    interaction: {
      verb: "Ease the seventh",
      successCopy: "The seventh stone shifts. In the weep-hole, wrapped in oiled cloth, is a roof nail with a forged head. The roof is gone. The nail was kept where the sentence said.",
      blockedCopy: "Prying a random footing stone would drop what little chapel is left.",
      examinedCopy: "The seventh stone sits back, a little proud. The cloth is empty.",
    },
    era: {
      before: { state: "The weep-hole is wet even in a dry hour, which is the tell once you can count.", available: true },
      return: { state: "The same hole, the same damp, the cloth stiffer.", available: true, change: "The nail does not become the brand-iron. It is a sibling relic, takeable in either year, once." },
    },
    persistence: { note: "One nail in one numbered stone. The lintel is the clue and it is true. No second nail spawns in the sixth to reward impatience." },
    environmentalStory: "The river course is the footing's wet side. Stones are countable. One of them drinks. The oiled cloth is the human part: somebody wrapped a nail as if it were a relic, because in this county a nail from a lost roof is starting to be one.",
  }),

  base("lfb-powder-niche", {
    title: "Powder niche, cleared",
    venue: "dungeon",
    dungeonId: "lemon-fair-adit",
    presentation: { kind: "container", prop: "a niche cut in the adit wall, salted and empty of powder, a peg in the back" },
    ownership: { ownerId: "pell", ownerName: "Pell", claim: "trade", presentIn: [], posture: "none", room: "quarry-adit" },
    contents: [
      item({ itemId: "slow-match", name: "Coil of slow-match", kind: "equipment", blurb: "A coil of match cord, dry, hung where powder used to be and is not." }),
      item({ itemId: "tally-stone", name: "Adit tally stone", kind: "collectible", blurb: "A slate tally of shots that were not fired. The last line is a zero." }),
    ],
    clue: { text: "The grate is drill steel, locked, not rusted. Pell's spare is in the sugarhouse tin; Eli's copy is under the boathouse plank. The niche inside was cleared of powder on purpose: the tally says zero, and the peg holds match, not a keg.", sourceId: "lfb-tin-ledger", honest: true },
    prerequisites: [{ type: "gate", id: "quarry-grate", note: "The adit is not a ruin you stroll into. The grate is a decision.", failCopy: "A grate of drill steel. Pell's spare key is in the sugarhouse tin. Eli's is under the boathouse plank, and he may be standing on it." }],
    interaction: {
      verb: "Search the niche",
      successCopy: "The niche smells of old saltpeter and of nothing that can burn. On the peg: a coil of slow-match. In the dust: a tally stone whose last line is a careful zero. They did not leave you a bomb.",
      blockedCopy: "The grate is shut. The niche is a rumor on the far side of it.",
      examinedCopy: "The peg is empty. The zero on the tally is still the point of the room.",
    },
    era: {
      before: { state: "The grate is locked because the adit is still a workplace, even with the powder gone.", available: true },
      return: { state: "The grate locks the same way. The smell of powder is finally gone.", available: true, change: "Time does not restock a keg. The authored contents were never powder." },
    },
    persistence: { note: "Reachable only through the grate, which either unique key opens. The niche can be searched once. Empty of powder on purpose, so a dungeon does not become a munitions pile." },
    environmentalStory: "Salt crust, a peg, a tally written by a person who wanted the next person to see the zero first. The adit drips. Drill holes spiral into the dark and stop. This is a mouth of a workplace, not a treasure room.",
  }),

  base("lfb-pay-stake", {
    title: "Hodge's pay under the drill steel",
    venue: "cache",
    presentation: { kind: "buried-cache", prop: "a drill steel driven into the waste gravel as a stake, rag tied under the head", marker: "the drill-steel stake" },
    ownership: { ownerId: "hodge", ownerName: "Hodge", claim: "trade", presentIn: [], posture: "none", room: "quarry-yard" },
    contents: [
      item({ itemId: "pell-pay-envelope", name: "Hodge's pay envelope", kind: "collectible", blurb: "Wages never drawn. The invoice says he left for Vergennes on the third." }),
      item({ itemId: "adit-quartz", name: "Adit quartz", kind: "relic", blurb: "A quartz point from the vein that pinched out. He kept it as a paperweight on his pay." }),
    ],
    clue: { text: "Vellum's invoice says Hodge's pay is uncollected at the drill-steel stake; he went to Vergennes on the third and did not draw it. The stake is the rag-tied steel in the waste gravel, outside the grate.", sourceId: "lfb-cooper-invoice", honest: true },
    prerequisites: [
      { type: "clue-read", id: "lfb-cooper-invoice", note: "A stake in a quarry yard is a marker for holes, not automatically for pay.", failCopy: "A drill steel stands in the waste gravel, a rag at the head. Men mark holes this way. You do not yet know this one marks pay." },
      { type: "tool", id: "trowel", note: "The envelope is under gravel and roots of burdock.", failCopy: "The invoice names this stake. The gravel is tight with burdock. The grafting trowel will lift it; your hands will not." },
    ],
    interaction: {
      verb: "Dig at the stake",
      successCopy: "Under the steel, a waxed envelope and a quartz point used as a weight. Hodge's pay, uncollected because he left. You are not taking it off a man who is coming up the adit today.",
      blockedCopy: "The stake marks something. Until the invoice or the trowel, it does not mark a taking.",
      examinedCopy: "The steel still stands. The hollow under it is a fist-sized nothing.",
    },
    era: {
      before: { state: "The rag is new. Hodge is already gone, if you have read the date. If you have not, he might be underground.", available: true },
      return: { state: "The rag is a thread. The steel has not walked off.", available: true, change: "Fourteen years only confirm the invoice. The envelope was never collected by him or by the company. Quartz does not spoil; the paper is mice-chewed at the corner and still whole enough to read." },
    },
    persistence: { note: "One envelope, one crystal. The dig is legal only after the invoice proves the owner has left, and only with the trowel. It is outside the grate so the proof, not the key, is the gate." },
    environmentalStory: "Quarry waste is a language: fresh chips, old grassed-over piles, a steel driven where no hole was drilled. The rag is the human comma. Burdock grew because the gravel was disturbed once and then left.",
  }),

  base("lfb-snag-boot", {
    title: "Boot in the beached snag",
    venue: "boat",
    presentation: { kind: "world-pickup", prop: "a single boot caught in a beached snag, dry, a token knotted in the lace" },
    ownership: { ownerId: null, ownerName: "the river", claim: "abandoned", presentIn: [], posture: "none", room: "riverbank" },
    contents: [item({ itemId: "ferry-token", name: "Orwell ferry token", kind: "collectible", eraAvailable: ["return"], blurb: "A punched ferry token knotted into a bootlace. The boot is not on a body. The snag is on the bank." })],
    clue: { text: "Eli's chart, when you have it, marks a snag on the bank with a small boot drawn beside it. The snag is beached. You do not have to swim.", sourceId: "lfb-skiff-satchel", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-skiff-satchel", note: "The bank has more than one snag. The chart picks this one.", failCopy: "Driftwood along the fair. One snag holds a boot, which is a bad surprise until a chart tells you it was left as a mark and not as a drowning." }],
    interaction: {
      verb: "Untie the token",
      successCopy: "The boot is one boot, dry, stuffed with moss by a person, not by a current. The lace holds an Orwell ferry token. Someone wanted the mark found from the bank.",
      blockedCopy: "You are not pulling boots out of snags for luck.",
      examinedCopy: "The boot remains, a mark with its message removed. It is not attached to anyone.",
    },
    era: {
      before: { state: "The snag is silvered and recent. The boot is a left boot, men's, unrotted.", available: true },
      return: { state: "The snag has sunk a little into the bank. The boot is still a boot.", available: true, change: "The token does not wash away because it was knotted by a hand and the snag is not in the channel." },
    },
    persistence: { note: "The token is unique. The boot stays in the world as the container you do not need to carry. Reachable on foot along the bank in both years, once the chart is read. In the return the chart is available; in the first life Eli refuses the satchel, so this waits." },
    environmentalStory: "A beached snag, moss stuffed in a boot to keep its shape, a knot a ferryman would recognize. No body, no gothic pile of bones. The river delivers what people tie to it.",
  }),

  base("lfb-milepost-nail", {
    title: "Survey nail in the milepost",
    venue: "cache",
    presentation: { kind: "hidden-compartment", prop: "the county milepost, a knot at hand height that is not a knot", host: "milepost" },
    ownership: { ownerId: null, ownerName: "the previous surveyor", claim: "cache", presentIn: [], posture: "none", room: "lane" },
    contents: [item({ itemId: "survey-nail", name: "Survey nail", kind: "relic", blurb: "A copper nail from the last survey of the bend. The hollow is the post's, and the post is where the years turn." })],
    clue: { text: "The picker's notebook says the milepost knot is a hollow, and it is the surveyor's, not the crew's. The post stands on the lane where you began.", sourceId: "lfb-orchard-notebook", honest: true },
    prerequisites: [{ type: "clue-read", id: "lfb-orchard-notebook", note: "Mileposts are public. Prying one without cause is not the same as finding a cache.", failCopy: "The milepost has a knot at hand height. It might be a hollow. It might be a knot. The crew's notebook is the permission, and you have not read it." }],
    interaction: {
      verb: "Open the knot",
      successCopy: "The knot is a plug. Inside, wrapped in oilcloth, a copper survey nail. The post is also where the bend remembers: you can stand here and step fourteen years either way.",
      blockedCopy: "It is a milepost. The county still uses it. You need a better reason than curiosity to pull a knot out of a public mark.",
      examinedCopy: "The plug sits back in the knot. The nail is with you. The post still turns the years.",
    },
    era: {
      before: { state: "Painted numbers, fresh. The plug fits tight.", available: true },
      return: { state: "The numbers are ghosts. The plug has shrunk and ticks when the wind is right.", available: true, change: "The nail is the surveyor's signature on this fragment. Standing at the post is how a life changes era. The nail itself is taken only once." },
    },
    persistence: { note: "One nail. The post remains the era landmark even after the hollow is empty, so the mechanism of the fourteen years is not consumed as loot." },
    environmentalStory: "A milepost is a civic object, painted, kicked by wagons, used by this story as a memory-nail. The plug is tight cedar in a pine post, different grain, which is the physical tell once the notebook has given you the right to touch it.",
  }),
];
