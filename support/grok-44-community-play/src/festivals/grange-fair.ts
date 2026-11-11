import type { FestivalDef } from "../types.ts";

export const grangeFair: FestivalDef = {
  id: "grange-fair",
  name: "Grange Fair",
  seasonLabel: "August",
  openWeek: 8,
  place: "Harrowford Grange",
  hostRivalId: "ruth-bellamy",
  hostTitle: "Ruth",
  rivals: ["ruth-bellamy", "theo-march", "juniper-hale", "sable-okoye", "inez-pell", "willa-crane"],
  eraChanges: {
    "first-turning":
      "Theo deals and still moves a card when he likes the person across from him. Inez has hijacked the children's animal table into an ethics test. Sable's set is last and contested. The ribbon Ruth files will say what happened, not what would flatter the hall.",
    "the-return":
      "Theo deals clean and is angry that the cheat survived the habit. Inez's station is still hers; Willa runs a prettier sheet beside it and hates that the prettier sheet wins. The ribbon says 'as played,' not 'as won.' Sable's tunes are already being called old.",
  },
  untold:
    "The grange fair went on without Ellis. Theo's name is still in the margin from other years. Nobody wrote a substitute Ellis into the hall.",
  onDecline: [
    {
      rivalId: "ruth-bellamy",
      delta: 0,
      line: "Ruth writes 'did not enter' and leaves the rest of the line empty on purpose.",
    },
    {
      rivalId: "theo-march",
      delta: -1,
      line: "Theo saved you a seat and then had to look like he hadn't.",
    },
    {
      rivalId: "sable-okoye",
      delta: 0,
      line: "Sable notes the empty chair in the last set and does not romanticize it.",
    },
  ],
  intro: {
    "first-turning": [
      { speaker: "Ruth", text: "I am clerk of the day. The ribbon is a filing, not a coronation." },
      { speaker: "Theo", text: "Sit where I can see you like me. That's the dangerous seat. I'll deal until Ruth takes the deck." },
      { speaker: "June", text: "The pie bench is not a contest. If you announce that it is, I will adjust your slice." },
      { speaker: "Sable", text: "The last set is mine or it is empty. The old medley can find another hall." },
      { speaker: "Inez", text: "The animal table is not for children only. Tell me what you will not follow." },
      { speaker: "Willa", text: "Don't name it until I've drawn it. Inez can wait one minute." },
    ],
    "the-return": [
      { speaker: "Ruth", text: "The ribbon says 'as played.' If you want 'as won,' you can write it on something that is not my book." },
      { speaker: "Theo", text: "I deal square. If you only know the cheat, you don't know me. Don't perform the introduction." },
      { speaker: "June", text: "Same pies. I salt a brag whether the kitchen is indoors or not." },
      { speaker: "Sable", text: "They are already calling two of my tunes traditional. You can be accurate or you can be easy." },
      { speaker: "Inez", text: "Willa draws a better lynx than the lynx. Don't prefer it." },
      { speaker: "Willa", text: "Yours was wrong in the ear, if you were here before. Yours was there. Let me be proud without being the canon." },
    ],
  },
  closing: {
    "first-turning": {
      warm: [
        { speaker: "Ruth", text: "I can file this without protecting you from it. That is the compliment." },
        { speaker: "Theo", text: "The last hand was clean. I'm going to try to remember the feeling instead of the trick." },
        { speaker: "June", text: "You tasted before you talked. The bench survived you." },
        { speaker: "Sable", text: "The set stayed mine. You can hum it. You cannot adopt it." },
        { speaker: "Inez", text: "You left it alone. The book stays open." },
      ],
      mixed: [
        { speaker: "Ruth", text: "Middle of the page. The hall prefers a champion. I don't." },
        { speaker: "Theo", text: "Some of that was friendship and some of it was a game. I know which part I'm ashamed of." },
        { speaker: "June", text: "You were half a guest and half an announcement." },
        { speaker: "Sable", text: "The tune is intact. The credit is a little smudged." },
        { speaker: "Willa", text: "Someone liked my drawing more than the animal. I wanted that and I feel sick." },
      ],
      sour: [
        { speaker: "Ruth", text: "Attended. I will not write honored, and I will not let you say I did." },
        { speaker: "Theo", text: "If you came to catch me in public, you got your afternoon. Don't expect the dangerous seat again." },
        { speaker: "June", text: "I salted it. You earned the salt." },
        { speaker: "Sable", text: "Take the tune home if you must. Take your own name off it before you do." },
        { speaker: "Inez", text: "The book is shut." },
      ],
    },
    "the-return": {
      warm: [
        { speaker: "Ruth", text: "As played. I can live with the margin." },
        { speaker: "Theo", text: "You didn't introduce me as a story. That's a better prize than the hand." },
        { speaker: "Sable", text: "You said the name. The hall heard it. I'll take that over applause." },
        { speaker: "Inez", text: "You refused the prettier lynx. Willa will forgive you later than I will." },
        { speaker: "Willa", text: "Keep the first sheet. Let mine be what it is, which is skill, not witness." },
      ],
      mixed: [
        { speaker: "Ruth", text: "The doubts are in the margin where I said they would be. Read them." },
        { speaker: "Theo", text: "Clean deal. Mixed day. I'm not the only one who used to be a rumor." },
        { speaker: "Sable", text: "Half the room still thinks the tune grew out of the floorboards." },
        { speaker: "Willa", text: "I don't know whether I wanted you to prefer me. I know I wanted you to have seen it." },
      ],
      sour: [
        { speaker: "Ruth", text: "I will file the day and I will not walk you to the parlor to celebrate it." },
        { speaker: "Theo", text: "You used the old story because it was easy. I'm done being easy material." },
        { speaker: "Sable", text: "Don't hum it in the road under your name. I live on that road." },
        { speaker: "Inez", text: "You chose the picture over the animal. I have nothing more to teach you today." },
      ],
    },
  },
  activities: [
    {
      id: "fair-cards",
      title: "The long table",
      moduleId: "cards",
      scene:
        "Theo deals at the long table. Ruth watches the shuffle the way other people watch a pan. In the first life, an extra card wants to move when he likes you.",
      eraScene: {
        "the-return":
          "The shuffle is square. Theo is waiting to see whether you will tell the old cheat as a joke before the first hand.",
      },
      accessible: {
        id: "large-called-hand",
        label: "Large cards, Ruth calling the count aloud.",
        why: "The heat is the choice you make about Theo, not the speed of your eye.",
      },
      decisions: [
        {
          id: "play-dealt",
          label: "Play the hand you were dealt",
          approach: "careful",
          detail: "No accusation, no collusion, no speech.",
          outcome: "excelled",
          narrative: "The hand finishes clean. Theo loses a little and looks relieved that nothing else happened.",
          effects: [
            {
              rivalId: "theo-march",
              delta: 1,
              line: "Theo says, 'That one I'll keep.' He means the losing.",
            },
          ],
        },
        {
          id: "return-the-card",
          label: "Put the extra card back without a speech",
          approach: "generous",
          detail: "You saw it. You do not invite the hall in.",
          outcome: "excelled",
          eraOutcome: { "the-return": "managed" },
          narrative: "You slide the card back. Theo goes red and deals the next hand as if it were a confession.",
          eraNarrative: {
            "the-return":
              "There is no extra card. Bringing the old one up, even kindly, makes Theo deal the next hand very carefully and not look at you.",
          },
          flags: ["called-theo"],
          effects: [
            {
              rivalId: "theo-march",
              delta: 2,
              flag: "called-theo",
              line: "He is ashamed and grateful, and he will not say the grateful part where Ruth can file it.",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "theo-march",
                delta: -1,
                flag: "called-theo",
                line: "Theo says, 'That was fourteen years ago. Don't deal it back to me as a kindness.'",
              },
            ],
          },
        },
        {
          id: "name-the-cheat",
          label: "Call him a cheat to the table",
          approach: "bold",
          detail: "Right, public, and pleased about it.",
          outcome: "faltered",
          narrative: "The table turns. You were not wrong about the card. You were wrong about the use of it.",
          effects: [
            {
              rivalId: "theo-march",
              delta: -2,
              line: "Theo finishes the hand because Ruth is watching, and he will not sit with you after.",
            },
            {
              rivalId: "ruth-bellamy",
              delta: 1,
              line: "Ruth writes the word you used. She does not write that you enjoyed it. She thinks it.",
            },
          ],
        },
      ],
    },
    {
      id: "fair-pie",
      title: "Pie and pickle bench",
      moduleId: "cooking",
      scene:
        "June has pies, pickles, and a rule she pretends is not a rule. Sable is outside because the doorway got crowded with opinions.",
      accessible: {
        id: "taste-bench",
        label: "Taste at the seated bench. You do not have to work the hot line.",
        why: "The heat is whether you turn supper into a contest, not whether you can stand at a stove.",
      },
      decisions: [
        {
          id: "season-and-stop",
          label: "Season it and stop talking",
          approach: "careful",
          detail: "Salt, taste, silence.",
          outcome: "excelled",
          narrative: "June watches you not announce yourself. She cuts you a fair slice.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: 2,
              line: "June says, 'You can come back to a kitchen.'",
            },
          ],
        },
        {
          id: "announce-best",
          label: "Announce it is the best pie in the hall",
          approach: "bold",
          detail: "A compliment shaped like a trophy.",
          outcome: "faltered",
          narrative: "She salts the slice she hands you and watches to see if you will mention it.",
          flags: ["salted-by-june"],
          effects: [
            {
              rivalId: "juniper-hale",
              delta: -2,
              flag: "salted-by-june",
              line: "June says, 'Tell them it's the best now.'",
            },
          ],
        },
        {
          id: "slice-to-door",
          label: "Send an extra slice to the door, where Sable is",
          approach: "generous",
          detail: "You spend your moment on the person the hall left outside.",
          outcome: "managed",
          narrative: "The slice goes out. Sable eats it on the step. The bench loses a little theater and gains a person.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: 1,
              line: "June nods. The invitation is the point of the slice.",
            },
            {
              rivalId: "sable-okoye",
              delta: 1,
              line: "Sable says, 'Next time set a chair, not just a plate.' She eats it anyway.",
            },
          ],
        },
      ],
    },
    {
      id: "fair-set",
      title: "The last set",
      moduleId: "music",
      scene:
        "The hall wants the medley it knows. Sable has tuned away from it. The last set is either hers or a fight that pretends to be nostalgia.",
      accessible: {
        id: "seated-rhythm",
        label: "Keep time from a chair, on the pattern Sable wrote so the dance is not the price.",
        why: "Music is the heat. A contradance is not an entrance fee.",
      },
      decisions: [
        {
          id: "give-the-set",
          label: "Give Sable the last set and sit the rhythm with her",
          approach: "generous",
          detail: "You spend whatever favor you have so the set is not taken.",
          outcome: "excelled",
          narrative: "The medley does not happen. Her tune does. You keep time and you say her name when the clapping starts.",
          flags: ["defended-sable"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 2,
              flag: "defended-sable",
              line: "Sable says, 'That's the set.' She does not thank you for permission.",
            },
          ],
        },
        {
          id: "expected-medley",
          label: "Play the tune the grange expects and apologize later",
          approach: "withholding",
          detail: "You keep the room comfortable and hope she will understand.",
          outcome: "managed",
          narrative: "The hall is happy. The apology is real. The set is already gone.",
          effects: [
            {
              rivalId: "sable-okoye",
              delta: -1,
              line: "Sable hears the apology and does not return the set to you.",
            },
          ],
        },
        {
          id: "take-credit",
          label: "Let the room call the tune yours",
          approach: "bold",
          detail: "The clapping is aimed at you. You do not move it.",
          outcome: "faltered",
          narrative: "You stand in the noise. Sable writes her name on the music and leaves it on your chair.",
          flags: ["accepted-sable-credit"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: -2,
              flag: "accepted-sable-credit",
              line: "She does not make a scene. The page on your chair is the scene.",
            },
          ],
        },
      ],
    },
    {
      id: "fair-lynx",
      title: "Inez's table",
      moduleId: "tracking",
      scene:
        "A plaster cast of prints sits between the pickle jars. Larger than a house cat, no claw marks. Willa has already drawn a lynx that looks at the viewer. Inez has not said the word yet.",
      accessible: {
        id: "table-cast",
        label: "Read the cast on the table. You do not have to walk out to the wall.",
        why: "The heat is what you do with a true name, not a hike behind the hall.",
      },
      decisions: [
        {
          id: "name-and-leave",
          label: "Name the lynx and say you will not go find it",
          approach: "careful",
          detail: "The noun, then the restraint.",
          outcome: "excelled",
          narrative: "You say lynx. You say you will not follow it. Inez leaves the book open.",
          flags: ["left-the-lynx"],
          effects: [
            {
              rivalId: "inez-pell",
              delta: 2,
              flag: "left-the-lynx",
              line: "Inez says, 'Good. Don't improve it on the way home.'",
            },
            {
              rivalId: "willa-crane",
              delta: 0,
              line: "Willa wanted the sighting. She got a refusal, which is not the same as an insult, and she knows it.",
            },
          ],
        },
        {
          id: "correct-willa",
          label: "Correct Willa's ear in front of the table",
          approach: "bold",
          detail: "The drawing is wrong. The audience is unnecessary.",
          outcome: "managed",
          narrative: "The ear is corrected. Inez agrees with the fact and hates the audience. Willa packs the pencil.",
          flags: ["corrected-willa"],
          effects: [
            {
              rivalId: "inez-pell",
              delta: 1,
              line: "Inez says, 'Right, and cruel. Learn the difference.'",
            },
            {
              rivalId: "willa-crane",
              delta: -1,
              flag: "corrected-willa",
              line: "Willa says, 'You could have told me after.' She is not wrong.",
            },
          ],
        },
        {
          id: "prefer-pretty",
          label: "Let Willa's prettier lynx stand as the record",
          approach: "generous",
          detail: "You choose her feelings and the hall's taste over the cast.",
          outcome: "managed",
          narrative: "The pretty lynx wins the table. Willa looks victorious and then unwell. Inez closes the book.",
          flags: ["preferred-willa"],
          effects: [
            {
              rivalId: "willa-crane",
              delta: 2,
              flag: "preferred-willa",
              line: "Willa thanks you and immediately asks if you think the ear was actually fine.",
            },
            {
              rivalId: "inez-pell",
              delta: -1,
              line: "Inez closes the book. 'Preference is not a sighting.'",
            },
          ],
        },
      ],
    },
  ],
  prizes: [
    { rewardId: "filed-ribbon", when: "finish" },
    { rewardId: "tune-last-set", when: "flag", flag: "defended-sable" },
    { rewardId: "sketch-lynx", when: "flag", flag: "left-the-lynx" },
    {
      rewardId: "letter-theo",
      when: "activity",
      activityId: "fair-cards",
      outcomes: ["excelled", "managed", "accessible-complete", "faltered"],
    },
  ],
};
