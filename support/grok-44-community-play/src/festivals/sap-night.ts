import type { FestivalDef } from "../types.ts";

export const sapNight: FestivalDef = {
  id: "sap-night",
  name: "Sap Night",
  seasonLabel: "Late March",
  openWeek: 0,
  place: "The sugar bush above the junction",
  hostRivalId: "marigold-vesper",
  hostTitle: "Marigold",
  rivals: ["marigold-vesper", "agnes-crowell", "ruth-bellamy", "sable-okoye"],
  eraChanges: {
    "first-turning":
      "Buckets and a team. Marigold runs her uncle's pans and will not call herself keeper. Agnes treats a seated boil-watch as staying home. The tubing has not arrived.",
    "the-return":
      "Plastic tubing has come up the hill. Marigold hates it and has left the missed trees on purpose. Agnes now requires a seated watch if the night is to count. The same standard, said out loud.",
  },
  untold:
    "No one kept a record of Ellis at Sap Night. A cousin later said the syrup was thin. Ruth's ledger has a blank line, and she will not fill it.",
  onDecline: [
    {
      rivalId: "marigold-vesper",
      delta: -1,
      line: "Marigold does not knock. She leaves an unlabeled tin on the step, which for her is a speech.",
    },
    {
      rivalId: "ruth-bellamy",
      delta: 0,
      line: "Ruth writes 'absent' and does not embellish it.",
    },
  ],
  intro: {
    "first-turning": [
      { speaker: "Marigold", text: "If it sheets, we talk. If you darken it to look like a winner, we don't." },
      { speaker: "Agnes", text: "The bush is walked. Sitting by the pan is not the night." },
      { speaker: "Sable", text: "I'll keep the watch awake. The tune is mine. Don't thank me for letting you hear it." },
      { speaker: "Ruth", text: "I have a line for each of you. Tell me the part you hope I will round off." },
      { speaker: "Marigold", text: "Four heats. The pour, the lines, the watch, the last jar. None of them makes you keeper." },
    ],
    "the-return": [
      { speaker: "Marigold", text: "Taste first. The tubing misses trees. That is the work, not a race against plastic." },
      { speaker: "Agnes", text: "There is a chair at the pan. I was wrong to call the chair a refusal. The chair counts." },
      { speaker: "Sable", text: "Same tune as the first life. If the cousins call it a folk song, you can correct them or you can keep the credit. I'll hear which." },
      { speaker: "Ruth", text: "I still have the blank labels. An honest tin does not say champion." },
      { speaker: "Marigold", text: "We do the night in the same order. I will explain the standard. I will not lower it." },
    ],
  },
  closing: {
    "first-turning": {
      warm: [
        { speaker: "Marigold", text: "It sheeted. You waited. That is the whole of what I wanted said." },
        { speaker: "Ruth", text: "I can file the tin without a footnote I would be ashamed of." },
        { speaker: "Sable", text: "The night-watch page is in your book. My name is on it. Leave it there." },
        { speaker: "Agnes", text: "You finished. Good. Don't make a proverb out of a boil." },
      ],
      mixed: [
        { speaker: "Marigold", text: "Parts of the night were honest. I will not say which parts in public." },
        { speaker: "Ruth", text: "I filed it in the middle of the page, which is where mixed things go." },
        { speaker: "Sable", text: "You can keep the tune if you don't tell it as a victory lap." },
        { speaker: "Agnes", text: "The bush is still there. So are you. That is the report." },
      ],
      sour: [
        { speaker: "Marigold", text: "I will not put my name near that color." },
        { speaker: "Ruth", text: "Present. Unsatisfactory. I wrote both, and I underlined neither into kindness." },
        { speaker: "Sable", text: "I played anyway. The boil did not earn the song, and the song is not your prize." },
        { speaker: "Agnes", text: "Come back when you mean to do it, or don't come back up this hill." },
      ],
    },
    "the-return": {
      warm: [
        { speaker: "Marigold", text: "You tasted before you performed. I'll tell the cousins that, if they ask me and not the tin." },
        { speaker: "Agnes", text: "The chair was used or the reason for it was respected. I can live with this night." },
        { speaker: "Sable", text: "Say my name when they hum it. That's the whole request." },
        { speaker: "Ruth", text: "The label matches the syrup. I don't get to write that often." },
      ],
      mixed: [
        { speaker: "Marigold", text: "You understand the standard and you broke a piece of it. Both can be filed." },
        { speaker: "Agnes", text: "I am not grading you against the woman I was. Don't you do it either." },
        { speaker: "Sable", text: "The tune stays. The credit is still a little slippery." },
        { speaker: "Ruth", text: "Middle of the page again. Fourteen years did not invent a new shelf for almost." },
      ],
      sour: [
        { speaker: "Marigold", text: "Tubing would have been more honest than what you did to that pan." },
        { speaker: "Agnes", text: "If you came to be seen on the hill, the hill noticed, and so did I." },
        { speaker: "Sable", text: "Don't hum it under your name. I will hear the hum from the road." },
        { speaker: "Ruth", text: "I kept the record. I did not keep a compliment inside it." },
      ],
    },
  },
  activities: [
    {
      id: "sap-pour",
      title: "Sugar on snow",
      moduleId: "cooking",
      scene:
        "The pan is ready and the snow is clean. Marigold has a spoon and will not narrate the sheet test for you. Children are already holding plates.",
      eraScene: {
        "the-return":
          "Marigold sets two spoons down and tells you, once, what sheeting looks like. She still will not pour for you. The children of the first life's children are holding plates.",
      },
      accessible: {
        id: "seated-boil-watch",
        label: "Sit the boil and call the sheet from the spoon, without walking the pans.",
        why: "The heat is the sugar, not a shift on your feet. A seated watch still tastes, times, and decides.",
        eraNote: {
          "first-turning": "Agnes does not consider this the night.",
          "the-return": "Agnes will not count a Sap Night that lacks this chair.",
        },
      },
      decisions: [
        {
          id: "wait-for-sheet",
          label: "Wait until it sheets off the spoon",
          approach: "careful",
          detail: "You hold the pour until the syrup leaves the spoon in a sheet, not a thread.",
          outcome: "excelled",
          narrative: "It sheets. You pour. The snow takes it without a sugar crust of boast.",
          flags: ["honest-boil"],
          effects: [
            {
              rivalId: "marigold-vesper",
              delta: 2,
              flag: "honest-boil",
              line: "Marigold says nothing. She sets a second tin beside yours.",
            },
          ],
        },
        {
          id: "pour-for-children",
          label: "Pour while it is thin so the children get the first snow",
          approach: "generous",
          detail: "The sheet test is not finished. The plates are.",
          outcome: "managed",
          narrative: "The children are fed early. The syrup is a little thin and completely gone.",
          effects: [
            {
              rivalId: "marigold-vesper",
              delta: -1,
              line: "Marigold calls it early and stops the conversation there.",
            },
            {
              rivalId: "sable-okoye",
              delta: 1,
              line: "Sable passes cups without making a speech about your kindness.",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "marigold-vesper",
                delta: 1,
                line: "Marigold says she would pour it early now, and she tells you why without apologizing for 1959.",
              },
              {
                rivalId: "sable-okoye",
                delta: 1,
                line: "Sable passes cups. She does not thank you for including the children. They were already included.",
              },
            ],
          },
        },
        {
          id: "darken-it",
          label: "Hold it on the fire until it darkens and looks like a winner",
          approach: "bold",
          detail: "A darker tin reads as richer from across the sugarhouse.",
          outcome: "faltered",
          narrative: "The color is a performance. The taste is the year after a scorch.",
          flags: ["darkened-syrup"],
          effects: [
            {
              rivalId: "marigold-vesper",
              delta: -2,
              flag: "darkened-syrup",
              line: "Marigold will not put her name near that color.",
            },
            {
              rivalId: "ruth-bellamy",
              delta: 1,
              line: "Ruth writes 'darkened on purpose' and underlines purpose.",
            },
          ],
        },
      ],
    },
    {
      id: "sap-lines",
      title: "The lines in the bush",
      moduleId: "tracking",
      scene:
        "The bush is a set of paths between buckets. Doubling a tap wastes a tree. Missing a line wastes a night.",
      eraScene: {
        "the-return":
          "The tubing runs where it wants. Marigold wants the trees it skipped, found on foot, and not tapped twice.",
      },
      accessible: {
        id: "large-print-tally",
        label: "Work the large-print tally at the arch and send a walker with your marks.",
        why: "Reading the bush can be done from the tally board if the walking is the part that fails you.",
      },
      decisions: [
        {
          id: "no-double",
          label: "Mark every missed tree and refuse a second tap",
          approach: "careful",
          detail: "You go slow enough to see which trunks already shine.",
          outcome: "excelled",
          narrative: "The missed trees are found. Nothing is tapped twice. Marigold checks one and stops checking.",
          effects: [
            {
              rivalId: "marigold-vesper",
              delta: 2,
              line: "She gives you the nail from a tap she pulled. 'That's a marker, not a medal.'",
            },
          ],
        },
        {
          id: "fast-line",
          label: "Run the obvious line and call the bush done",
          approach: "bold",
          detail: "Speed looks like knowing the hill.",
          outcome: "faltered",
          narrative: "You double two maples and miss the hollow where the snow hid a bucket.",
          effects: [
            {
              rivalId: "marigold-vesper",
              delta: -1,
              line: "Marigold pulls your extra taps herself and does not ask you to watch.",
            },
            {
              rivalId: "agnes-crowell",
              delta: 0,
              line: "Agnes says hurrying is not the same as doing the thing.",
            },
          ],
        },
        {
          id: "share-marks",
          label: "Give your marks to Sable's cousin on the far line",
          approach: "generous",
          detail: "You will not be the one who comes back first.",
          outcome: "managed",
          narrative: "The far line finishes because you handed the marks over. Your own line is only half famous.",
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 1,
              line: "Sable says, 'Good. Don't tell it as if the hill was yours.'",
            },
            {
              rivalId: "ruth-bellamy",
              delta: 1,
              line: "Ruth notes the handoff, which is the kind of fact she likes.",
            },
          ],
        },
      ],
    },
    {
      id: "sap-music",
      title: "Night watch song",
      moduleId: "music",
      scene:
        "Past midnight the arch empties and people drift. Sable has a tune that keeps the watch from stringing out. It is not the one the uncles requested.",
      accessible: {
        id: "seated-rhythm",
        label: "Keep her seated rhythm on a box instead of walking a beat between the pans.",
        why: "Sable built the pattern so the music does not require a dance or a patrol.",
      },
      decisions: [
        {
          id: "keep-her-name",
          label: "Keep the watch and say Sable's name when someone calls it an old song",
          approach: "generous",
          detail: "You stay, and you do not let the tune become weather.",
          outcome: "excelled",
          narrative: "The watch holds. When an uncle says he has always known the tune, you say her name.",
          flags: ["defended-sable"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 2,
              flag: "defended-sable",
              line: "Sable nods once. 'Leave it on the page that way.'",
            },
          ],
        },
        {
          id: "let-it-be-old",
          label: "Let the uncles call it traditional so the night stays easy",
          approach: "withholding",
          detail: "Correcting them would cool the sugarhouse.",
          outcome: "faltered",
          narrative: "The tune works. The credit slides off her and onto nobody, which is how theft looks when it is polite.",
          flags: ["accepted-sable-credit"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: -2,
              flag: "accepted-sable-credit",
              line: "She finishes the tune and does not start another.",
            },
          ],
        },
        {
          id: "hum-quietly",
          label: "Hum with her and refuse requests for the old set",
          approach: "careful",
          detail: "You support the piece without making yourself the reason it was played.",
          outcome: "managed",
          narrative: "You hum. You do not announce. The uncles get bored and go back to the fire.",
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 1,
              line: "Sable says, 'That's enough. Don't add a speech to it.'",
            },
          ],
        },
      ],
    },
    {
      id: "sap-cards",
      title: "Last jar cribbage",
      moduleId: "cards",
      scene:
        "The last jar sits on the crib board. Ruth deals because she does not trust a festive shuffle. The jar is not money. It is the right to say you took it.",
      accessible: {
        id: "large-cards",
        label: "Play with Ruth's large cards and a called count.",
        why: "The jar is a decision about the hand, not about eyesight or a fast peg.",
      },
      decisions: [
        {
          id: "play-the-hand",
          label: "Play the hand you were dealt and let the jar go where it goes",
          approach: "careful",
          detail: "No stake talk. No performance for Agnes.",
          outcome: "excelled",
          narrative: "The hand ends clean. Whoever takes the jar does not make a speech. Ruth looks almost pleased.",
          effects: [
            {
              rivalId: "ruth-bellamy",
              delta: 2,
              line: "Ruth writes the winner's name small, which is her courtesy.",
            },
          ],
        },
        {
          id: "boast-the-jar",
          label: "Take the jar and tell the bush you won the night",
          approach: "bold",
          detail: "One hand, narrated as the whole boil.",
          outcome: "faltered",
          narrative: "You may have the jar. You do not have the night. The narration makes Marigold put her spoon down.",
          effects: [
            {
              rivalId: "marigold-vesper",
              delta: -1,
              line: "Marigold says, 'That was cribbage.'",
            },
            {
              rivalId: "ruth-bellamy",
              delta: 1,
              line: "Ruth records the boast separately from the score.",
            },
          ],
        },
        {
          id: "give-jar",
          label: "If you peg out, give the jar to the person who walked the far line",
          approach: "generous",
          detail: "The jar becomes a delivery, not a title.",
          outcome: "managed",
          narrative: "The jar leaves the board and goes down the hill. Ruth has to decide whether generosity is a result.",
          effects: [
            {
              rivalId: "ruth-bellamy",
              delta: 1,
              line: "She writes 'given' and, after a pause, does not add a moral.",
            },
            {
              rivalId: "agnes-crowell",
              delta: 0,
              line: "Agnes grunts. She wanted the jar to mean the walk. Giving it away confuses her, which she dislikes.",
            },
          ],
        },
      ],
    },
  ],
  prizes: [
    { rewardId: "maple-tin", when: "tone-not-sour" },
    {
      rewardId: "tune-sap-watch",
      when: "activity",
      activityId: "sap-music",
      outcomes: ["excelled", "accessible-complete", "managed"],
    },
    { rewardId: "letter-marigold", when: "finish" },
    {
      rewardId: "tap-nail",
      when: "activity",
      activityId: "sap-lines",
      outcomes: ["excelled", "accessible-complete"],
    },
  ],
};
