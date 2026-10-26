import { choose, no, ok, plate, sketch } from "./build.ts";
import type { Creature } from "./types.ts";

/** Lantern Meadow — the playable outing. Fourteen complete encounters. */
export const MEADOW: Creature[] = [
  {
    id: "monarch",
    commonName: "Monarch",
    scientificName: "Danaus plexippus",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "Vermont is breeding ground, not a wintering site. Caterpillars feed on milkweed (Asclepias), and the cardenolides stay in the body, which is why most birds spit one out after a taste. Late-summer adults are the generation that turns south. The wings really are orange fields, black veins, and a white-spotted black border.",
    habitatId: "lantern-meadow",
    station: "milkweed",
    siteLabel: "Milkweed verge",
    behavior:
      "It works one flower head, lifts, and settles again. The pause on the bloom is the tell. A fast step sends it over the goldenrod.",
    discoveryClue: "Orange, black veins, on the milkweed in the warm part of the day. Green Crown or Amber Gate.",
    hints: [
      "Orange, black veins, on the milkweed in the warm part of the day. Green Crown or Amber Gate.",
      "Milkweed verge, morning or noon, in Green Crown or Amber Gate. It is a migrant here, not a pet.",
      "Creep. Ink the veins and the spotted border, not a swallowtail's tails. Net it only when it pauses on a bloom.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon"],
          stations: ["milkweed"],
        },
      ],
    },
    approachSummary: "Slow down, name the real marks, and net the pause — then let the migration go.",
    steps: [
      choose("pace", "It is on the milkweed. How do you close?", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry", { type: "pace", pace: "hurry" }, "You crossed the verge too fast. It went up and over."),
        no(
          "ordinary",
          "Keep an ordinary pace",
          { type: "pace", pace: "ordinary" },
          "Ordinary is still too much. It left the flower.",
        ),
      ]),
      sketch(
        "Ink only the marks that are actually on it.",
        "That mark is not on this butterfly. Look at the wing again.",
      ),
      choose("net", "It pauses on a bloom. The net is a real net.", [
        ok("on-tell", "Sweep when it settles", { type: "tool", tool: "net", timing: "on-tell" }),
        no(
          "early",
          "Sweep while it is still flying",
          { type: "tool", tool: "net", timing: "early" },
          "The mesh crossed empty air. It is gone for this quarter-hour.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["veins", "Black veins across an orange field", true],
      ["border", "White spots in the black border", true],
      ["tails", "Long hindwing tails", false],
      ["eyespots", "Large hindwing eyespots", false],
    ]),
    notebookEntry:
      "Orange field, black veins, white spots in the border. It worked the milkweed and did not hurry. Adults in this valley belong to the generation that turns south. I did not keep it.",
    releaseLabel: "Open the net and let the flight go",
    keepLabel: "Keep it",
    canKeep: false,
    keepRefusal: "This generation is already pointed south. The book will not take one as a specimen.",
    releaseText: "The migration was not interrupted. The milkweed will have others.",
    keepText: "Refused.",
    rewards: [
      {
        id: "monarch-flight",
        label: "Migration left intact",
        channel: "notebook",
        on: "release",
        once: true,
      },
    ],
    links: [],
    signature: "migrant milkweed butterfly; net the pause; keeping refused",
    plate: "/art/monarch.jpg",
  },
  {
    id: "bumblebee",
    commonName: "Common eastern bumblebee",
    scientificName: "Bombus impatiens",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "A common eastern bumblebee. Workers carry pollen in a smooth basket (the corbicula) on the hind leg, not loose all over the body. They are foraging livestock of the meadow, not an ingredient. Males have no stinger; you do not need to sex this one to leave it alone.",
    habitatId: "lantern-meadow",
    station: "goldenrod",
    siteLabel: "Goldenrod bank",
    behavior:
      "A worker moves flower to flower with a loaded hind leg. It ignores you if you are quiet. A net is an insult, not a method.",
    discoveryClue: "A low hum in the goldenrod, morning or noon, with yellow pollen packed on a hind leg.",
    hints: [
      "A low hum in the goldenrod, morning or noon, with yellow pollen packed on a hind leg.",
      "Goldenrod bank in Green Crown or Amber Gate. Mara Vint at the creamery wants a report, not a corpse.",
      "Be quiet. Ink the pollen basket. Use your eyes. The net ends the visit.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon"],
          stations: ["goldenrod"],
        },
      ],
    },
    approachSummary: "Quiet observation. The reward is a report to the creamery, never the bee.",
    steps: [
      choose("quiet", "The hum is right at the flower. What do you do with sound?", [
        ok("quiet", "Keep quiet", { type: "sound", sound: "quiet" }),
        no("clap", "Clap", { type: "sound", sound: "clap" }, "The clap emptied the goldenrod."),
      ]),
      sketch("Ink the working marks, not a story about honey from a single bee.", "That is not what this worker is showing you."),
      choose("eyes", "How do you finish the note?", [
        ok("eyes", "Only look, and leave it working", { type: "tool", tool: "eyes", timing: "hold" }),
        no(
          "net",
          "Net the worker",
          { type: "tool", tool: "net", timing: "on-tell" },
          "The mesh took the bee off the flower. There is no honest report in that.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["basket", "A packed pollen basket on the hind leg", true],
      ["pile", "Yellow-and-black pile, not a wasp's bare waist", true],
      ["honey", "A comb you could lift into a pan", false],
    ]),
    notebookEntry:
      "Worker of the common eastern bumblebee, pollen basket bright, still on the goldenrod. I left it. Mara can have the report.",
    releaseLabel: "Leave it to the flowers",
    keepLabel: "Pocket the bee",
    canKeep: false,
    keepRefusal: "Mara will not trade for a dead bee, and the meadow did not offer one.",
    releaseText: "The worker stayed. The report is enough for the creamery.",
    keepText: "Refused.",
    rewards: [
      {
        id: "mara-report",
        label: "Mara Vint's meadow report",
        channel: "character",
        on: "release",
        once: true,
      },
      {
        id: "meadow-butter",
        label: "Creamery meadow butter",
        channel: "cooking",
        on: "release",
        once: true,
      },
    ],
    links: [
      {
        channel: "character",
        who: "Mara Vint",
        text: "Mara at the Weybridge creamery trades a meadow note — butter, not the bee — if the colony is still working.",
      },
      {
        channel: "cooking",
        who: "Mara Vint",
        text: "The butter is a gift for the report. Nothing in the pan is an insect.",
      },
    ],
    signature: "pollen-basket report to Mara; eyes only; cooking is butter not the bee",
  },
  {
    id: "meadow-katydid",
    commonName: "Short-winged meadow katydid",
    scientificName: "Conocephalus brevipennis",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "A small meadow katydid of eastern North America, including New England fields. The song in this outing is a dry tick, the right kind of sound for Conocephalus, not the loud 'katy-did' phrase. That phrase belongs to the true katydid, Pterophylla, a canopy insect this far north is the wrong animal to claim.",
    habitatId: "lantern-meadow",
    station: "goldenrod",
    siteLabel: "Goldenrod bank",
    behavior: "It ticks from a stem, then stops when a foot breaks the grass. The song is the map.",
    discoveryClue: "A dry tick in the goldenrod at noon or dusk. Not a katy-did shouted from a tree.",
    hints: [
      "A dry tick in the goldenrod at noon or dusk. Not a katy-did shouted from a tree.",
      "Same bank as the bees, but later: noon or dusk, Green Crown or Amber Gate.",
      "Match the tick. Then creep. Net from the side once it is silent on the stem.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["noon", "dusk"],
          stations: ["goldenrod"],
        },
      ],
    },
    approachSummary: "Match its tick, approach on a creep, net from the side.",
    steps: [
      choose("song", "The tick is three short marks and a wait. Answer it or spoil it.", [
        ok("match", "Match the tick", { type: "sound", sound: "match-tick" }),
        no("clap", "Clap over it", { type: "sound", sound: "clap" }, "The clap replaced the song. It dropped into the stems."),
        no(
          "whistle",
          "Whistle",
          { type: "sound", sound: "whistle" },
          "A whistle is the wrong instrument. The stem is empty.",
        ),
      ]),
      choose("pace", "Now cross the grass.", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry", { type: "pace", pace: "hurry" }, "The stems knocked together. It is gone."),
      ]),
      sketch("Ink the singer you actually found.", "That is a different insect's reputation, not this stem."),
      choose("net", "It is quiet on the stem.", [
        ok("side", "Net from the side", { type: "tool", tool: "net", timing: "from-side" }),
        no(
          "early",
          "Chop down on the stem",
          { type: "tool", tool: "net", timing: "early" },
          "The stem sprang and the katydid went with the bounce.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["tick", "A dry tick, not a shouted katy-did", true],
      ["short", "Short wings, a small body in the goldenrod", true],
      ["tree", "A great green singer in the maple crown", false],
    ]),
    notebookEntry:
      "Short-winged meadow katydid in the goldenrod. The song was a tick. I matched it, came in slowly, and did not pretend it was the southern true katydid.",
    releaseLabel: "Tip it back onto the stem",
    keepLabel: "Keep the singer",
    canKeep: false,
    keepRefusal: "A song in a pocket is just a dead tick. Let it back.",
    releaseText: "It took the stem again. The bank still has its clock.",
    keepText: "Refused.",
    rewards: [
      {
        id: "katydid-song",
        label: "The bank's tick, named correctly",
        channel: "notebook",
        on: "release",
        once: true,
      },
    ],
    links: [],
    signature: "match-the-tick meadow katydid; not Pterophylla; side net",
  },
  {
    id: "ebony-jewelwing",
    commonName: "Ebony jewelwing",
    scientificName: "Calopteryx maculata",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "A broad-winged damselfly of shaded, slow streams. The wings are black, not the clear panes of most damselflies, and the body is metallic green or blue. It is a common sight on Vermont brooks in summer. It perches; it does not need a lantern.",
    habitatId: "lantern-meadow",
    station: "creek",
    siteLabel: "Creek bend",
    behavior: "It flutters off a leaf, shows those black wings, and lands again closer than you expect. The landing is the tell.",
    discoveryClue: "Black wings and a green body on the shaded lip of the creek, morning or noon.",
    hints: [
      "Black wings and a green body on the shaded lip of the creek, morning or noon.",
      "Creek bend, Green Crown or Amber Gate. Leave the lantern dark. This is daylight work.",
      "Creep. Ink the black wings. Sweep only when it has perched, not while it flutters.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon"],
          stations: ["creek"],
        },
      ],
    },
    approachSummary: "Lantern dark, creep, net the perch.",
    steps: [
      choose("light", "The bend is already lit by the day.", [
        ok("off", "Keep the lantern dark", { type: "light", light: "off" }),
        no(
          "warm",
          "Raise a warm lantern",
          { type: "light", light: "warm" },
          "The extra light sent it upstream.",
        ),
      ]),
      choose("pace", "Move along the lip.", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry the bank", { type: "pace", pace: "hurry" }, "Your shadow crossed the leaf. It lifted for good."),
      ]),
      sketch("Ink what makes it a jewelwing and not a clear-winged damselfly.", "Those are not this insect's wings."),
      choose("net", "It has perched.", [
        ok("tell", "Sweep on the perch", { type: "tool", tool: "net", timing: "on-tell" }),
        no(
          "early",
          "Sweep the flutter",
          { type: "tool", tool: "net", timing: "early" },
          "You netted the space it had just left.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["black", "Broad black wings", true],
      ["metal", "A metallic green body", true],
      ["clear", "Clear wings with a tiny stigma only", false],
    ]),
    notebookEntry:
      "Ebony jewelwing on the creek lip. Black wings, metallic body, no lantern involved. Caught on the perch and let go over the same leaf.",
    releaseLabel: "Let it back to the leaf",
    keepLabel: "Keep the damselfly",
    canKeep: false,
    keepRefusal: "The wings dry wrong in a pocket. This one goes back to the lip.",
    releaseText: "It took the leaf as if the net had been a breeze.",
    keepText: "Refused.",
    rewards: [
      {
        id: "jewelwing-leaf",
        label: "The black-winged perch",
        channel: "notebook",
        on: "release",
        once: true,
      },
    ],
    links: [],
    signature: "black-winged stream damselfly; lantern must stay off; net the perch",
  },
  {
    id: "fishing-spider",
    commonName: "Dark fishing spider",
    scientificName: "Dolomedes tenebrosus",
    nameRank: "species",
    tier: "unusual",
    fictional: false,
    naturalHistory:
      "Fishing spiders in Dolomedes do not build a web to catch prey. They run on the surface film and can go under. Dolomedes tenebrosus, the dark fishing spider, is widespread in the east, Vermont included. A similar species can share a bank; the behavior in this entry is the genus, and the field name is the dark one. A slap-net on the water is how you lose it.",
    habitatId: "lantern-meadow",
    station: "creek",
    siteLabel: "Creek bend",
    behavior:
      "It rests with the hind legs on the film, then rows without breaking the surface. Stillness keeps it. A clap or a slapped net does not.",
    discoveryClue: "A long-legged spider rowing the creek film, morning or dusk. No web.",
    hints: [
      "A long-legged spider rowing the creek film, morning or dusk. No web.",
      "Creek bend, Green Crown or Amber Gate. Look at the surface, not the grass.",
      "Hold still. Ink the film-running, not a web. Cup it from the side. Do not slap a net down.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "dusk"],
          stations: ["creek"],
        },
      ],
    },
    approachSummary: "Hold still, then cup from the side. The net slaps the film and fails.",
    steps: [
      choose("still", "It is on the film. Your body is the problem.", [
        ok("still", "Hold still", { type: "still" }),
        no("hurry", "Shift and hurry", { type: "pace", pace: "hurry" }, "The film shook. It went under and did not come back."),
        no("clap", "Clap", { type: "sound", sound: "clap" }, "The clap was enough. The film is empty."),
      ]),
      sketch("Ink how it hunts.", "That is a different kind of spider."),
      choose("cup", "Take it up without breaking the film more than you must.", [
        ok("cup", "Cup it from the side", { type: "tool", tool: "cup", timing: "from-side" }),
        no(
          "net",
          "Slap the net on the water",
          { type: "tool", tool: "net", timing: "early" },
          "The mesh hit the film. The spider is gone under the bend.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["film", "Runs on the surface film, no prey web", true],
      ["legs", "Long legs, body held off the water", true],
      ["orb", "A round web in the goldenrod", false],
    ]),
    notebookEntry:
      "Dark fishing spider on the creek film. No web. I waited, cupped it from the side, and put it back on the water it uses as a floor.",
    releaseLabel: "Set it back on the film",
    keepLabel: "Keep the spider",
    canKeep: false,
    keepRefusal: "It hunts a surface you cannot fold into a pocket.",
    releaseText: "It took the film again and did not row away at once. That is as close as thanks gets.",
    keepText: "Refused.",
    rewards: [
      {
        id: "spider-film",
        label: "The creek's floor, understood",
        channel: "notebook",
        on: "release",
        once: true,
      },
    ],
    links: [],
    signature: "web-less fishing spider; stillness then a side cup; net fails",
  },
  {
    id: "clearwater-crayfish",
    commonName: "Northern clearwater crayfish",
    scientificName: "Faxonius propinquus",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "Treated here as the northern clearwater crayfish, a native Faxonius in Vermont. Crayfish hybridize and a sure name can need a specialist. The teaching mark in this outing is the absence of rust-red side patches. Warden Pym wants this one back under the stone. The pot is for the rusty invader, not for this animal.",
    habitatId: "lantern-meadow",
    station: "creek",
    siteLabel: "Creek bend",
    behavior: "Under a flat stone, claws tucked, no rust patches on the carapace. It backs when the light hits, then holds.",
    discoveryClue: "A claw-click under the flat stones. Turn one slowly, morning or noon, and look for an unmarked shell.",
    hints: [
      "A claw-click under the flat stones. Turn one slowly, morning or noon, and look for an unmarked shell.",
      "Creek bend, Green Crown or Amber Gate, after a stone is turned. No rust on the sides means native.",
      "Ink the plain carapace. Lift it in your hands. Putting it in the pot disappoints Pym.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon"],
          stations: ["creek"],
          preps: ["turn-stone"],
        },
      ],
    },
    approachSummary: "Turn a stone first. Hands, not a crushing net. Release is the warden's nod.",
    steps: [
      sketch("Which animal is under the stone?", "If you ink the rust, you have the wrong crayfish."),
      choose("hands", "It is small and native. How do you lift it?", [
        ok("hands", "Lift it in wet hands", { type: "tool", tool: "hands", timing: "hold" }),
        no(
          "net",
          "Rake it with the net",
          { type: "tool", tool: "net", timing: "early" },
          "The mesh folded a claw. It kicked free and backed into the dark.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["plain", "No rust-red patches on the sides of the shell", true],
      ["native", "A native clearwater, not the invader", true],
      ["rust", "Rust-red spots on either side of the carapace", false],
      ["bands", "Black bands at the claw tips", false],
    ]),
    notebookEntry:
      "Northern clearwater crayfish under a turned stone. No rust patches. I lifted it and put it back. Pym's pot does not get this one.",
    releaseLabel: "Put it back under the stone",
    keepLabel: "Keep it for the pot",
    canKeep: true,
    releaseText: "Back under the stone. Warden Pym would call that the whole job.",
    keepText: "You kept a native. The pot is not proud of it, and Pym will say so. The bend still has others next quarter-hour.",
    rewards: [
      {
        id: "pym-release-native",
        label: "Warden Pym's nod",
        channel: "character",
        on: "release",
        once: true,
      },
      {
        id: "pym-keep-native",
        label: "Pym's disappointment",
        channel: "character",
        on: "keep",
        once: true,
      },
    ],
    links: [
      {
        channel: "character",
        who: "Warden Pym",
        text: "Pym wants native crayfish returned. The meal is the rusty one, if you can tell them apart.",
      },
    ],
    signature: "native crayfish; no rust; release pleases Pym; keep does not cook",
  },
  {
    id: "rusty-crayfish",
    commonName: "Rusty crayfish",
    scientificName: "Faxonius rusticus",
    nameRank: "species",
    tier: "unusual",
    fictional: false,
    naturalHistory:
      "Rusty crayfish are invasive in Vermont. The field marks used here are the rust-red patches on either side of the carapace and dark bands at the claw tips. Hybrids exist, so a kitchen is not a museum. Warden Pym would rather this one go to the pot than back under the stone. That is a management story, not a claim that every rust-colored crayfish in New England has been surveyed.",
    habitatId: "lantern-meadow",
    station: "creek",
    siteLabel: "Creek bend",
    behavior: "Bigger than the native under the same stones. Rust patches show when it squares up. Claw tips look banded.",
    discoveryClue: "Turn the same flat stones. A rust patch on each side of the shell means the invader, morning or noon.",
    hints: [
      "Turn the same flat stones. A rust patch on each side of the shell means the invader, morning or noon.",
      "Creek bend, Green Crown or Amber Gate, stone turned. Do not confuse it with the plain native.",
      "Ink the rust and the claw bands. Hands. Keeping it is the boil Pym allows. Releasing it is the worse kindness.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon"],
          stations: ["creek"],
          preps: ["turn-stone"],
        },
      ],
    },
    approachSummary: "Same stone as the native, different marks. The pot is the justified keep.",
    steps: [
      sketch("Ink the invader, not its neighbor.", "Those marks belong to the native, or to neither."),
      choose("hands", "It will pinch if you rake it.", [
        ok("hands", "Take it behind the claws", { type: "tool", tool: "hands", timing: "hold" }),
        no(
          "net",
          "Scoop blind",
          { type: "tool", tool: "net", timing: "early" },
          "It backed out of the mesh and under a second stone.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["rust", "Rust-red patches on either side of the carapace", true],
      ["bands", "Dark bands at the claw tips", true],
      ["plain", "A plain shell with no rust at all", false],
    ]),
    notebookEntry:
      "Rusty crayfish, invasive, rust patches and banded claw tips. Pym's rule: this one may feed someone. The native under the next stone may not.",
    releaseLabel: "Put the invader back anyway",
    keepLabel: "Keep it for the boil",
    canKeep: true,
    releaseText: "You put an invader back. Pym will not thank you. The creek still has the problem, and another quarter-hour.",
    keepText: "Into the pot. One boil, not a second recipe every time you find another.",
    rewards: [
      {
        id: "invasive-boil",
        label: "Invasive boil",
        channel: "cooking",
        on: "keep",
        once: true,
      },
      {
        id: "pym-keep-rust",
        label: "Pym approves the pot",
        channel: "character",
        on: "keep",
        once: true,
      },
      {
        id: "pym-release-rust",
        label: "Pym would rather it had been eaten",
        channel: "character",
        on: "release",
        once: true,
      },
    ],
    links: [
      {
        channel: "cooking",
        who: "Warden Pym",
        text: "The invasive boil is a real supper and a management favor. It does not stack into a second recipe.",
      },
      {
        channel: "character",
        who: "Warden Pym",
        text: "Pym cares which crayfish you mean. Native goes back. Rusty may go to the pot.",
      },
    ],
    signature: "invasive rusty crayfish; rust patches; keep cooks once; release annoys Pym",
  },
  {
    id: "woolly-bear",
    commonName: "Woolly bear",
    scientificName: "Pyrrharctia isabella",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "The caterpillar of the Isabella tiger moth. Black at both ends, rust in the middle, dense bristles. The folk rule that the rust band forecasts the coming winter is not a forecast. Band width tracks the caterpillar's age, its molts, and the season it has already lived. Ellis Quill at the wall believes the myth. The notebook does not.",
    habitatId: "lantern-meadow",
    station: "wall",
    siteLabel: "Stone wall",
    behavior: "It crosses the capstone in a hurry of its own, then curls if you loom. Amber Gate is the crossing. Locked Snow, it is tucked at the wall's foot.",
    discoveryClue: "A black-rust-black bristle crossing the wall in Amber Gate, or curled at the foot of it in Locked Snow.",
    hints: [
      "A black-rust-black bristle crossing the wall in Amber Gate, or curled at the foot of it in Locked Snow.",
      "Stone wall. Morning or noon. Ellis will tell you the band predicts winter. It does not.",
      "Creep. Ink the colors, and do not ink the forecast. A gentle hand. Releasing it teaches Ellis; pocketing it only disappoints him.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["amber-gate"],
          beats: ["morning", "noon"],
          stations: ["wall"],
        },
        {
          eras: ["locked-snow"],
          beats: ["morning", "noon"],
          stations: ["wall"],
        },
      ],
    },
    approachSummary: "Creep, refuse the weather myth on the plate, lift gently. Release is Ellis's lesson.",
    steps: [
      choose("pace", "It is on the stone. Ellis is watching from the end of the wall.", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry", { type: "pace", pace: "hurry" }, "It curled and rolled into a crack. Ellis says you scared the winter."),
      ]),
      sketch("Ink the animal. Do not ink the folklore.", "The plate would be repeating a forecast the caterpillar cannot make."),
      choose("hands", "It is bristly, not dangerous. Be gentle.", [
        ok("hands", "Lift it in a loose hand", { type: "tool", tool: "hands", timing: "hold" }),
        no(
          "net",
          "Sweep it off the wall",
          { type: "tool", tool: "net", timing: "early" },
          "The mesh bounced it into the grass on the far side. Ellis lost sight of it.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["band", "Black ends and a rust middle", true],
      ["bristle", "Dense bristles, a caterpillar not a moth yet", true],
      ["forecast", "The rust band's width predicts the coming winter", false],
    ]),
    notebookEntry:
      "Woolly bear on the wall. Black, rust, black. The band is a life already lived, not a prophecy. Ellis was told so, if I let the caterpillar go.",
    releaseLabel: "Set it back on the stone for Ellis to see",
    keepLabel: "Pocket it",
    canKeep: true,
    releaseText: "Ellis watched it uncurl and go. He has not given up the myth entirely, but the notebook has, and he heard you.",
    keepText: "A caterpillar in a pocket tries to pupate badly. Ellis is disappointed. The wall will have another when the quarter-hour turns.",
    rewards: [
      {
        id: "ellis-lesson",
        label: "Ellis Quill hears the myth corrected",
        channel: "character",
        on: "release",
        once: true,
      },
      {
        id: "woolly-pocket",
        label: "A woolly bear in the pocket",
        channel: "specimen",
        on: "keep",
        once: true,
      },
    ],
    links: [
      {
        channel: "character",
        who: "Ellis Quill",
        text: "Ellis at the wall wants the winter story. Letting the caterpillar go is how the correction lands. Keeping it is just a sulk.",
      },
    ],
    signature: "woolly bear; folklore mark is the wrong ink; Ellis learns only on release",
    plate: "/art/woolly.jpg",
  },
  {
    id: "red-backed-salamander",
    commonName: "Red-backed salamander",
    scientificName: "Plethodon cinereus",
    nameRank: "species",
    tier: "unusual",
    fictional: false,
    naturalHistory:
      "Lungless. It breathes through wet skin, so a dry pocket kills it. Two common looks share the log: a red stripe down the back, and the all-gray lead-back morph. Both are this species. It lives under wood in Vermont woods and damp meadows and does not need a pond. After rain, wet hands are optional; in clear weather, wet them.",
    habitatId: "lantern-meadow",
    station: "log",
    siteLabel: "Old log",
    behavior: "Still under the log, then a quick writhe if the air hits dry skin. It does not perform. It endures.",
    discoveryClue:
      "Under the old log, morning or dusk. After rain or mist, turning the log is enough. In clear weather, wet your hands too.",
    hints: [
      "Under the old log, morning or dusk. After rain or mist, turning the log is enough. In clear weather, wet your hands too.",
      "Mudlight, Green Crown, or Amber Gate. Not the winter, when it is below frost and not for us.",
      "Turn the log, keep the skin wet, ink the lungless fact, and put it back. A pocket is a death.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["mudlight", "green-crown", "amber-gate"],
          beats: ["morning", "dusk"],
          stations: ["log"],
          weathers: ["after-rain", "mist"],
          preps: ["turn-log"],
        },
        {
          eras: ["mudlight", "green-crown", "amber-gate"],
          beats: ["morning", "dusk"],
          stations: ["log"],
          weathers: ["clear"],
          preps: ["turn-log", "palm-water"],
        },
      ],
    },
    approachSummary: "Turn the log, respect moisture, sketch the lungless life, return it.",
    steps: [
      choose("still", "The log is up. It is exposed.", [
        ok("still", "Hold still and keep your shadow off it", { type: "still" }),
        no("hurry", "Grab at once", { type: "pace", pace: "hurry" }, "It shot into the grass crack and the log's lesson ended."),
      ]),
      sketch("Ink the true life, including either color morph.", "A yellow-spotted salamander is a different night, and lungs are the wrong organ."),
      choose("hands", "Your hands are the whole tool.", [
        ok("hands", "Lift it with wet hands and a short hold", { type: "tool", tool: "hands", timing: "hold" }),
        no(
          "net",
          "Rake the net under the log",
          { type: "tool", tool: "net", timing: "early" },
          "The mesh dried and tangled it. It was gone before you could apologize.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["skin", "Breathes through wet skin; no lungs", true],
      ["morph", "A red stripe, or the gray lead-back morph", true],
      ["spots", "Large yellow spots, a mole salamander", false],
      ["dry", "Happy to dry out in a pocket", false],
    ]),
    notebookEntry:
      "Red-backed salamander under the log. Lungless, either morph. Wet hands, short look, back into the dark. The log is not empty forever if I fail one; it is empty of the one I dried.",
    releaseLabel: "Return it to the log's underside",
    keepLabel: "Pocket it",
    canKeep: true,
    releaseText: "Back under the log, skin still wet. That is the whole success.",
    keepText:
      "The pocket dried it. One salamander, not the species. The next quarter-hour can still have another under the log, and the notebook will not call that a trophy.",
    rewards: [
      {
        id: "salamander-returned",
        label: "The log's underside restored",
        channel: "notebook",
        on: "release",
        once: true,
      },
      {
        id: "salamander-dried",
        label: "A dried salamander, and no pride in it",
        channel: "specimen",
        on: "keep",
        once: true,
      },
    ],
    links: [],
    signature: "lungless salamander; rain or wet hands; keep dries one animal and does not extinct the log",
  },
  {
    id: "baltimore-checkerspot",
    commonName: "Baltimore checkerspot",
    scientificName: "Euphydryas phaeton",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "Resident in Vermont and locally common where its colony holds, ranked S4 by the Vermont Atlas of Life. The usual host is white turtlehead (Chelone glabra); larvae also use plants such as English plantain. Adults fly in one brood, roughly June into August. The orange clubs on the antennae are a fair field mark. Caterpillars take up chemicals from turtlehead that make them unpleasant to eat. A local colony is not a jar.",
    habitatId: "lantern-meadow",
    station: "turtlehead",
    siteLabel: "Turtlehead pocket",
    behavior: "It sits low, wings partly open, antennae tipped orange. It does not patrol like a darner. It belongs to this scrape.",
    discoveryClue: "Checkers of orange, black, and white on the turtlehead, morning or noon, with orange clubs on the antennae.",
    hints: [
      "Checkers of orange, black, and white on the turtlehead, morning or noon, with orange clubs on the antennae.",
      "The wet pocket, not the milkweed. Green Crown or the early part of Amber Gate.",
      "Creep. Ink the orange antennal clubs. Do not net it — count the colony and leave it.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon"],
          stations: ["turtlehead"],
        },
      ],
    },
    approachSummary: "Creep and record. This one is eyes-only because the colony is local.",
    steps: [
      choose("pace", "The scrape is small. Your pace fills it.", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry", { type: "pace", pace: "hurry" }, "It left the turtlehead for the taller grass. The colony is still here; this look is over."),
      ]),
      sketch("Ink the checkerspot, not a monarch and not a rumor about milkweed as the host.", "The plate has the wrong insect, or the wrong plant."),
      choose("eyes", "The colony is the point.", [
        ok("eyes", "Watch and do not net", { type: "tool", tool: "eyes", timing: "hold" }),
        no(
          "net",
          "Net a breeding adult",
          { type: "tool", tool: "net", timing: "on-tell" },
          "You took one off a small colony. The outing calls that a miss, and the butterfly is gone for this quarter-hour only.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["clubs", "Orange clubs on the antennae", true],
      ["check", "Orange, black, and white checkers", true],
      ["milkweed", "A caterpillar that can only live on milkweed", false],
      ["tails", "Swallowtail tails", false],
    ]),
    notebookEntry:
      "Baltimore checkerspot in the turtlehead pocket. Orange antennal clubs, checkerboard wings. Host is turtlehead first, not milkweed. I watched and left the colony its adult.",
    releaseLabel: "Close the note and leave the scrape",
    keepLabel: "Keep a breeding adult",
    canKeep: false,
    keepRefusal: "A local colony does not owe the book a body.",
    releaseText: "The scrape kept its checkerspot. That is the entry.",
    keepText: "Refused.",
    rewards: [
      {
        id: "checkerspot-colony",
        label: "The turtlehead colony, left intact",
        channel: "notebook",
        on: "release",
        once: true,
      },
    ],
    links: [],
    signature: "turtlehead checkerspot; eyes only; orange antennal clubs; colony not collected",
  },
  {
    id: "brook-trout",
    commonName: "Brook trout",
    scientificName: "Salvelinus fontinalis",
    nameRank: "species",
    tier: "ordinary",
    fictional: false,
    naturalHistory:
      "A char, native to Vermont's cold water. The main Otter is often too warm in summer; this fish is in the spring channel, which stays colder. Fair marks: pale wormlike vermiculations on a dark back, red spots with blue halos, and white leading edges on the lower fins. A pink stripe down the side is a rainbow trout, not this fish. A real creek has a season and a limit. The pan in this outing is a story reward, granted once, and it does not forbid another fish later.",
    habitatId: "lantern-meadow",
    station: "spring",
    siteLabel: "Spring channel",
    behavior: "It holds over gravel in the thin water, nose into the thread, and sips. A warm lantern on the water ends the sip.",
    discoveryClue: "In the cold spring channel at dawn or morning, not in the warm bend. Look for wormlike marks on a dark back.",
    hints: [
      "In the cold spring channel at dawn or morning, not in the warm bend. Look for wormlike marks on a dark back.",
      "Mudlight, Green Crown, or Amber Gate. Locked Snow has shut the channel. Keep the lantern off.",
      "Lantern dark, then creep. Ink vermiculations and white fin edges, not a rainbow's pink stripe. Net when it noses the cress.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["mudlight", "green-crown", "amber-gate"],
          beats: ["dawn", "morning"],
          stations: ["spring"],
        },
      ],
    },
    approachSummary: "Dark lantern, creep, true marks, one net on the sip. Keep cooks once. Release is also complete.",
    steps: [
      choose("light", "The channel is a hand deep. Light is a stone thrown in.", [
        ok("off", "Keep the lantern dark", { type: "light", light: "off" }),
        no("warm", "Wash it with a warm lantern", { type: "light", light: "warm" }, "The fish left the shallow and will not sip again this quarter-hour."),
      ]),
      choose("pace", "Come up the gravel.", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry", { type: "pace", pace: "hurry" }, "Your boot-shock ran ahead of you. The channel is empty."),
      ]),
      sketch("Ink a brook trout, not a rainbow.", "That mark is the other fish."),
      choose("net", "It noses the cress.", [
        ok("tell", "Set the net as it sips", { type: "tool", tool: "net", timing: "on-tell" }),
        no(
          "early",
          "Slap the net early",
          { type: "tool", tool: "net", timing: "early" },
          "The mesh hit gravel. The trout sulks for this quarter-hour, not for the rest of the campaign.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["verm", "Pale wormlike marks on a dark back", true],
      ["white", "White leading edges on the lower fins", true],
      ["pink", "A pink stripe down the side", false],
    ]),
    notebookEntry:
      "Brook trout in the spring channel. Vermiculations, white fin edges, cold water. The pan, if I kept one, is a single recipe. The seep is not used up.",
    releaseLabel: "Tip it back into the thread",
    keepLabel: "Keep one for the pan",
    canKeep: true,
    releaseText: "The seep still holds fish. Letting this one go does not spend the recipe.",
    keepText: "Creek breakfast is known now. Another fish later is only another fish, not a second recipe.",
    rewards: [
      {
        id: "creek-breakfast",
        label: "Creek breakfast",
        channel: "cooking",
        on: "keep",
        once: true,
      },
      {
        id: "trout-returned",
        label: "The seep still holds fish",
        channel: "notebook",
        on: "release",
        once: false,
      },
    ],
    links: [
      {
        channel: "cooking",
        text: "Creek breakfast is one recipe, unlocked by keeping a brook trout. Later keeps do not mint it again. A real season and creel still exist outside this outing.",
      },
    ],
    signature: "native char in the cold seep; keep grants one recipe; release can repeat the note",
    plate: "/art/trout.jpg",
  },
  {
    id: "year-moth",
    commonName: "Year-moth",
    scientificName: "Irrealis lucerna",
    nameRank: "species",
    tier: "vein",
    fictional: true,
    naturalHistory:
      "Fictional. Not a luna, not a real genus, and not a species to report to any atlas. It is a Vein invention of this outing: cream wings, no tails, a crack-like vein, and a habit of showing dates that were never lived. The Moth Infirmary's concern — living light and unrealized years — is the fiction. Do not treat the plate as natural history.",
    habitatId: "lantern-meadow",
    station: "lantern",
    siteLabel: "Lantern circle",
    behavior:
      "It comes to a dimmed lantern, or to Vein Night itself, and holds still as if the year were a page. A warm blaze washes it out. A pulse invites the wrong answer.",
    discoveryClue:
      "Cream, no tails, a dark crack in the wing. Vein Night at the lantern circle, any quarter-hour — or Amber Gate at dusk if you dim the lantern.",
    hints: [
      "Cream, no tails, a dark crack in the wing. Vein Night at the lantern circle, any quarter-hour — or Amber Gate at dusk if you dim the lantern.",
      "Two windows, both real in the fiction: the Vein's own night, or a dimmed lantern at Amber dusk. Not a one-time spawn.",
      "Dim the light. Ink the crack and the lack of tails. Cup it. Sister Halve wants it living, not pocketed.",
    ],
    presence: {
      anyOf: [
        { eras: ["vein-night"], stations: ["lantern"] },
        {
          eras: ["amber-gate"],
          beats: ["dusk"],
          stations: ["lantern"],
          lights: ["dim"],
        },
      ],
    },
    approachSummary: "Two authored windows. Dim light, true marks, a cup. Release returns living light.",
    steps: [
      choose("light", "It will not sit in a blaze.", [
        ok("dim", "Dim the lantern", { type: "light", light: "dim" }),
        no("warm", "Leave it warm and close", { type: "light", light: "warm" }, "The blaze washed the crack out. It left the circle."),
        no(
          "pulse",
          "Pulse the lantern",
          { type: "light", light: "pulse" },
          "A pulse is a question it does not answer. The circle is empty.",
        ),
      ]),
      sketch("Ink the Vein moth, not a luna and not a readable calendar.", "The plate has borrowed a real moth, or tried to letter a date that should stay unwritten."),
      choose("cup", "It is still. The net would powder the wing.", [
        ok("cup", "Cup it over the crack of light", { type: "tool", tool: "cup", timing: "hold" }),
        no(
          "net",
          "Sweep it with the net",
          { type: "tool", tool: "net", timing: "on-tell" },
          "Scales and the unrealized shine came off in the mesh. It is gone for this quarter-hour.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["crack", "A dark crack across a cream wing", true],
      ["notail", "No long tails, and not green", true],
      ["luna", "Pale green wings and long hindwing tails", false],
      ["date", "A printed year you could file in a drawer", false],
    ]),
    notebookEntry:
      "Year-moth, fictional, at the lantern circle. Cream, a crack, no tails. If I released it, Sister Halve has the living light back. If I kept it, an unrealized year is in a jar, and the meadow can still show another when the window returns.",
    releaseLabel: "Carry it living to the Infirmary",
    keepLabel: "Keep the year in a jar",
    canKeep: true,
    releaseText: "Sister Halve takes it as living light returned. The jar stays empty. This does not have to happen twice to count.",
    keepText: "An unrealized year is pocketed. The Infirmary does not thank you. The circle is not sealed forever — the next window can still bring one.",
    rewards: [
      {
        id: "infirmary-light",
        label: "Living light returned",
        channel: "infirmary",
        on: "release",
        once: true,
      },
      {
        id: "year-pocketed",
        label: "An unrealized year in the jar",
        channel: "specimen",
        on: "keep",
        once: true,
      },
    ],
    links: [
      {
        channel: "infirmary",
        who: "Sister Halve",
        text: "Sister Halve at the Moth Infirmary takes a released year-moth as living light. Keeping it spends a year the book can name only once.",
      },
    ],
    signature: "fictional cream crack-moth; two windows; infirmary on release only",
    plate: "/art/year-moth.jpg",
  },
  {
    id: "ledger-snail",
    commonName: "Ledger snail",
    scientificName: "Scripta fenestrae",
    nameRank: "species",
    tier: "vein",
    fictional: true,
    naturalHistory:
      "Fictional. Not Cepaea, not a Vermont record. The shell carries a line of handwriting that is not a pigment band. Real banded snails exist and are a different fact. This one is a Vein animal of the wall: the line changes if you return it, and stops if you pocket it.",
    habitatId: "lantern-meadow",
    station: "wall",
    siteLabel: "Stone wall",
    behavior: "After rain it writes by moving. In clear weather it will do the same if you wet the capstone. It is slow, which is not the same as tame.",
    discoveryClue:
      "A shell on the wall with a line that is not a band. After rain, or if you wet the stone, morning through dusk, Green Crown or Amber Gate.",
    hints: [
      "A shell on the wall with a line that is not a band. After rain, or if you wet the stone, morning through dusk, Green Crown or Amber Gate.",
      "Stone wall. Two ways in: the weather, or your own wet hand. Neither is a single chance.",
      "Creep. Ink the script, not a garden snail's stripes. Hands. Releasing lets the line turn kinder.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon", "dusk"],
          weathers: ["after-rain"],
          stations: ["wall"],
        },
        {
          eras: ["green-crown", "amber-gate"],
          beats: ["morning", "noon", "dusk"],
          weathers: ["clear", "mist"],
          stations: ["wall"],
          preps: ["palm-water"],
        },
      ],
    },
    approachSummary: "Rain or wet the stone. Creep, ink the script, hands. Release rewrites the line.",
    steps: [
      choose("pace", "It is writing. Your pace smudges it.", [
        ok("creep", "Creep", { type: "pace", pace: "creep" }),
        no("hurry", "Hurry", { type: "pace", pace: "hurry" }, "The line broke off. The snail left the capstone."),
      ]),
      sketch("Ink the fiction you can actually see.", "A banded garden snail is a real animal and the wrong plate."),
      choose("hands", "The shell is not a stone to rap.", [
        ok("hands", "Lift it in a damp hand", { type: "tool", tool: "hands", timing: "hold" }),
        no(
          "net",
          "Knock it into the net",
          { type: "tool", tool: "net", timing: "early" },
          "The shell clicked off the wall and the line stopped mid-word.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["script", "A line of handwriting, not a shell band", true],
      ["slow", "A whole shell, moving only after water", true],
      ["cepaea", "Ordinary brown bands and nothing else", false],
    ]),
    notebookEntry:
      "Ledger snail, fictional, on the wall. The line is Vein-work, not a species for a checklist. Returned, the sentence softens. Pocketed, it stops.",
    releaseLabel: "Set it back and let the line finish",
    keepLabel: "Pocket the shell",
    canKeep: true,
    releaseText: "The line turns kinder and then dries. It will not pay that sentence twice.",
    keepText: "The script stops in the pocket. You have a shell, not a second miracle, and the wall can write again later.",
    rewards: [
      {
        id: "kinder-line",
        label: "The shell's line turns kinder",
        channel: "notebook",
        on: "release",
        once: true,
      },
      {
        id: "stopped-script",
        label: "A shell whose writing stopped",
        channel: "specimen",
        on: "keep",
        once: true,
      },
    ],
    links: [],
    signature: "fictional writing snail; rain or wet stone; release changes the line once",
  },
  {
    id: "unspent-firefly",
    commonName: "Unspent firefly",
    scientificName: "Inconsulta flamma",
    nameRank: "species",
    tier: "vein",
    fictional: true,
    naturalHistory:
      "Fictional. Not Photinus pyralis and not a species on the Vermont lampyrid checklist. Real fireflies here include day-active kinds and night-flashing kinds that need a local survey before a species name. This one is a Vein flash: the color of a choice not taken. It will not come to a lantern. Pulsing at it is how you answer, and answering is how you miss.",
    habitatId: "lantern-meadow",
    station: "goldenrod",
    siteLabel: "Goldenrod bank",
    behavior: "A single flash in the goldenrod at dusk or true dark, the wrong color for any honest Photinus code. Then a long dark. It leaves if you reply.",
    discoveryClue:
      "Dusk or true dark in the goldenrod, lantern fully dark, Green Crown, Amber Gate, or Vein Night. One flash of a color you cannot name, and no answer expected.",
    hints: [
      "Dusk or true dark in the goldenrod, lantern fully dark, Green Crown, Amber Gate, or Vein Night. One flash of a color you cannot name, and no answer expected.",
      "Three seasons, two ends of the day. If the lantern is warm or dim or pulsing, it is simply not there.",
      "Stay quiet. Do not pulse back. Ink the unnamed color. Use only your eyes. A jar puts the flash out.",
    ],
    presence: {
      anyOf: [
        {
          eras: ["green-crown", "amber-gate", "vein-night"],
          beats: ["dusk", "true-dark"],
          stations: ["goldenrod"],
          lights: ["off"],
        },
      ],
    },
    approachSummary: "Lantern off is the door. Quiet, no reply, eyes only. Several nights of the book qualify.",
    steps: [
      choose("quiet", "It has flashed once. The dark is the rest of the sentence.", [
        ok("quiet", "Stay quiet and do not answer", { type: "sound", sound: "quiet" }),
        no("clap", "Clap", { type: "sound", sound: "clap" }, "The clap ended it."),
        no(
          "pulse",
          "Pulse the lantern back",
          { type: "light", light: "pulse" },
          "You answered. The flash was an unspent choice, and it is spent.",
        ),
      ]),
      sketch("Ink the fiction without giving it a real species' code.", "That is a field-guide flash you were told not to claim."),
      choose("eyes", "How do you keep the note honest?", [
        ok("eyes", "Only look", { type: "tool", tool: "eyes", timing: "hold" }),
        no(
          "cup",
          "Jar it",
          { type: "tool", tool: "cup", timing: "hold" },
          "The jar lit and then went ordinary. The color is gone for this quarter-hour.",
        ),
      ]),
    ],
    sketchMarks: plate([
      ["color", "A flash the color of a road not taken", true],
      ["dark", "It refuses every lantern", true],
      ["pyralis", "The common big-dipper code, species confirmed for this county", false],
    ]),
    notebookEntry:
      "Unspent firefly, fictional, in the dark goldenrod. I did not answer and I did not jar it. The Vermont checklist was not asked to absorb a Vein color.",
    releaseLabel: "Leave the flash in the dark",
    keepLabel: "Try to keep it anyway",
    canKeep: true,
    releaseText: "The dark kept the color. The note is enough, and it does not brighten twice as a prize.",
    keepText: "The jar goes dull. You have a dark insect and a specimen line, not a lamp. The bank can flash again another dusk.",
    rewards: [
      {
        id: "unspent-left",
        label: "The unspent flash, left dark",
        channel: "notebook",
        on: "release",
        once: true,
      },
      {
        id: "unspent-jar",
        label: "A dull jar",
        channel: "specimen",
        on: "keep",
        once: true,
      },
    ],
    links: [],
    signature: "fictional non-reply firefly; lantern must be off; pulsing is a miss; not a real Photinus",
  },
];
