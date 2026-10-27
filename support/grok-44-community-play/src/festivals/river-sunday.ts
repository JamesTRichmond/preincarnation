import type { FestivalDef } from "../types.ts";

export const riverSunday: FestivalDef = {
  id: "river-sunday",
  name: "River Sunday",
  seasonLabel: "June",
  openWeek: 4,
  place: "The backwater below Harrowford",
  hostRivalId: "hollis-quinn",
  hostTitle: "Hollis",
  rivals: ["hollis-quinn", "lenny-voss", "pete-lang", "calder-brunt"],
  eraChanges: {
    "first-turning":
      "The backwater is high. Hollis posts nothing, but Lenny brings a scale and hollers weights at the bank. The boulder hop to the island is a real hop. Calder will dare it and will not enter the deep eddy.",
    "the-return":
      "The water is down a foot and the boulders are almost a stroll. Hollis tears the scale sheet off the maple before the first cast. Pete will not hop. The rope ferry is the route, and Lenny's stories have shrunk to the size of his hands.",
  },
  untold:
    "River Sunday has no Ellis in the ledger. Lenny later invented a trout to fill the gap, and Hollis tore that story off the tree with the others.",
  onDecline: [
    {
      rivalId: "hollis-quinn",
      delta: 0,
      line: "Hollis leaves the boat tied. He does not come to the house to ask why.",
    },
    {
      rivalId: "lenny-voss",
      delta: -1,
      line: "Lenny tells a short, annoyed version in which you were afraid of the water. It is not even a good lie.",
    },
  ],
  intro: {
    "first-turning": [
      { speaker: "Hollis", text: "I'll say where to cast. I'll also say I said it. If you need the help to be a secret, stay on the bank." },
      { speaker: "Lenny", text: "He's modest because he can afford it. The fish I'm thinking of is bigger than his honesty." },
      { speaker: "Pete", text: "The stones to the island are mine to show. Don't rename them if I show you." },
      { speaker: "Calder", text: "Hop it or don't. I'm not swimming anything, so don't make that the dare." },
      { speaker: "Hollis", text: "Eddy, shore lunch, the island, the bank. In that order. Weights are Lenny's hobby, not the day's." },
    ],
    "the-return": [
      { speaker: "Hollis", text: "If you came for a weight, the tree is bare. I tore the sheet. I'll row you anyway." },
      { speaker: "Lenny", text: "Hands apart. That's the fish. Don't look at me like you want the old width." },
      { speaker: "Pete", text: "The ferry is the way. The hop is a story about knees you may not have later." },
      { speaker: "Calder", text: "I'll ride. I'm done pretending the wet rocks are a personality." },
      { speaker: "Hollis", text: "Same four heats. The river is lower. The standard isn't." },
    ],
  },
  closing: {
    "first-turning": {
      warm: [
        { speaker: "Hollis", text: "You listened, and you let me say so. That's rarer than the fish." },
        { speaker: "Lenny", text: "I'll keep the short version in my pocket. Don't make me spend the long one." },
        { speaker: "Pete", text: "You can use the stones again. That's the whole compliment." },
        { speaker: "Calder", text: "You didn't try to put me in the deep water. I noticed. I'm not going to give a speech." },
      ],
      mixed: [
        { speaker: "Hollis", text: "Parts of you were on the river. Parts of you were in a story about the river." },
        { speaker: "Lenny", text: "I told it medium. Medium is me being good." },
        { speaker: "Pete", text: "Some of the stones are still a confidence. Don't inventory them out loud." },
        { speaker: "Calder", text: "We got there. Don't ask me to like how." },
      ],
      sour: [
        { speaker: "Hollis", text: "I won't row that version of you again this month." },
        { speaker: "Lenny", text: "You wanted a legend. The river gave you a wet sleeve. I'm not fixing the difference." },
        { speaker: "Pete", text: "I'm done showing you gaps in walls." },
        { speaker: "Calder", text: "Next time dare somebody who likes an audience." },
      ],
    },
    "the-return": {
      warm: [
        { speaker: "Hollis", text: "No sheet on the tree. A nail in your pocket if you need the island later. That's the day." },
        { speaker: "Lenny", text: "You let it stay the size it was. I can work with you." },
        { speaker: "Pete", text: "The ferry counted. I'm glad I didn't have to watch you prove a knee." },
        { speaker: "Calder", text: "You didn't narrate anybody's body. Keep that." },
      ],
      mixed: [
        { speaker: "Hollis", text: "I tore one sheet and you almost posted another. Almost is why I stay for the closing." },
        { speaker: "Lenny", text: "The story grew a little. I helped. I'm not proud of the help." },
        { speaker: "Pete", text: "You know the difference between a route and a performance. You didn't always choose it." },
        { speaker: "Calder", text: "We're even enough." },
      ],
      sour: [
        { speaker: "Hollis", text: "Bring a scale next time and don't bring yourself." },
        { speaker: "Lenny", text: "You stretched it. I stretched it. The fish stayed the same and now I don't want to talk." },
        { speaker: "Pete", text: "The map doesn't have your name on the stones. That was a choice." },
        { speaker: "Calder", text: "I don't owe you a dare or a rescue." },
      ],
    },
  },
  activities: [
    {
      id: "river-eddy",
      title: "Eddy hour",
      moduleId: "fishing",
      scene:
        "Hollis points at a seam under the alders with his chin. Lenny points at a brighter, worse piece of water and starts the story early.",
      accessible: {
        id: "bank-chair",
        label: "Fish from the bank chair. Hollis will say the seam. You do not have to stand in the boat.",
        why: "The hour is the read of the water, not a balance act in a skiff.",
      },
      decisions: [
        {
          id: "supper-cast",
          label: "Cast where Hollis said, and keep one fish for shore lunch",
          approach: "generous",
          detail: "You want the pot, and you let the help be public.",
          outcome: "excelled",
          narrative: "The seam gives up a trout the size of a hand. You keep one and stop.",
          flags: ["supper-fish"],
          effects: [
            {
              rivalId: "hollis-quinn",
              delta: 2,
              line: "Hollis says you listened, and he will say that to anyone who asks.",
            },
            {
              rivalId: "lenny-voss",
              delta: 1,
              flag: "supper-fish",
              line: "Lenny is annoyed, then he shows you the second seam because you are feeding people.",
            },
          ],
        },
        {
          id: "glory-cast",
          label: "Go after the size Lenny described",
          approach: "bold",
          detail: "The bright water photographs better and fishes worse.",
          outcome: "faltered",
          narrative: "You fish the story. The story does not fish back.",
          flags: ["glory-fish"],
          effects: [
            {
              rivalId: "lenny-voss",
              delta: 0,
              flag: "glory-fish",
              line: "Lenny talked you into the wrong water and looks sorry only at the end, and not much.",
            },
            {
              rivalId: "hollis-quinn",
              delta: -1,
              line: "Hollis rows you back without the lecture. The silence is the lecture.",
            },
          ],
        },
        {
          id: "invent-weight",
          label: "Release what you catch and tell it as a weight",
          approach: "withholding",
          detail: "A number, posted, for a fish that is already gone.",
          outcome: "faltered",
          narrative: "There is nothing to cook and a number nobody can check. Both guides hate it for different reasons.",
          effects: [
            {
              rivalId: "hollis-quinn",
              delta: -2,
              line: "Hollis will not repeat a weight he did not see on a scale he does not respect.",
            },
            {
              rivalId: "lenny-voss",
              delta: -1,
              line: "Lenny wanted a fish story, not a ghost with a measurement.",
            },
          ],
        },
      ],
    },
    {
      id: "river-lunch",
      title: "Shore lunch",
      moduleId: "cooking",
      scene:
        "The creel is what it is. Beans are in the box if the hour failed. Calder is loud and has not said he is hungry.",
      accessible: {
        id: "called-pot",
        label: "Call the pot from a seat: beans, fish, salt. Someone else lifts the pan.",
        why: "Lunch is the judgment of what you caught, not the grip on a hot handle.",
      },
      decisions: [
        {
          id: "cook-what-is",
          label: "Cook only what was caught, and beans if the creel is empty",
          approach: "careful",
          detail: "The pot matches the hour.",
          outcome: "excelled",
          narrative: "People eat what the river actually gave. Nobody improves the menu in the telling.",
          effects: [
            {
              rivalId: "hollis-quinn",
              delta: 1,
              line: "Hollis eats and says, 'That's the right size plate.'",
            },
            {
              rivalId: "lenny-voss",
              delta: 1,
              line: "Lenny starts a bigger version, then stops when he tastes how small and good it is.",
            },
          ],
        },
        {
          id: "feast-look",
          label: "Make it look like a feast anyway",
          approach: "bold",
          detail: "Extra plates, a garnish, a story on top of the beans.",
          outcome: "faltered",
          narrative: "It looks like a feast and eats like a costume. Lenny adds adjectives. Hollis eats half.",
          effects: [
            {
              rivalId: "lenny-voss",
              delta: 1,
              line: "Lenny is delighted to have props.",
            },
            {
              rivalId: "hollis-quinn",
              delta: -1,
              line: "Hollis says, 'We had beans,' and goes back to the rope.",
            },
          ],
        },
        {
          id: "feed-calder",
          label: "Give your portion to Calder without making him ask",
          approach: "generous",
          detail: "He will not say he is hungry. He will eat if the plate arrives unnamed.",
          outcome: "excelled",
          narrative: "Calder eats. He does not thank you. He stops daring you for the rest of the hour.",
          effects: [
            {
              rivalId: "calder-brunt",
              delta: 2,
              line: "He says, later, 'Don't tell them I was hungry.' It is the closest he comes.",
            },
          ],
        },
      ],
    },
    {
      id: "river-island",
      title: "To the island",
      moduleId: "traversal",
      scene:
        "The island sits in the backwater. Boulders show in a broken line. Hollis's rope ferry is the unglamorous way. Pete knows which stones are a confidence.",
      eraScene: {
        "the-return":
          "The hop is exposed and a little foolish. Pete's knee has made the ferry the authored route. Calder is already in the boat, daring no one.",
      },
      accessible: {
        id: "rope-ferry",
        label: "Ride the rope ferry. Hollis rows. You still count as having gone.",
        why: "Arrival is the heat. Wet footing is optional, and in the return it is mostly theater.",
        eraNote: {
          "the-return": "Pete mapped this as the route, not the consolation.",
        },
      },
      decisions: [
        {
          id: "ask-pete",
          label: "Ask Pete which stones are his, and step only where he nods",
          approach: "careful",
          detail: "You treat the line as a confidence.",
          outcome: "excelled",
          eraOutcome: { "the-return": "managed" },
          narrative: "Pete shows you three stones and withholds the fourth. You arrive without renaming any of them.",
          eraNarrative: {
            "the-return":
              "Pete would rather you had taken the ferry. He still shows you the safe stones, because you asked instead of performing.",
          },
          effects: [
            {
              rivalId: "pete-lang",
              delta: 2,
              line: "Pete says, 'Those stay named the way I named them.'",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "pete-lang",
                delta: 1,
                line: "Pete says the hop wasn't needed. He is glad you asked before you did it.",
              },
            ],
          },
        },
        {
          id: "race-calder",
          label: "Race Calder across the wet ones",
          approach: "bold",
          detail: "First to the island, no consultation.",
          outcome: "managed",
          eraOutcome: { "the-return": "faltered" },
          narrative: "You both arrive wet. Calder is delighted. Pete goes quiet in a way you will notice later.",
          flags: ["took-petes-wall"],
          effects: [
            {
              rivalId: "calder-brunt",
              delta: 1,
              line: "Calder laughs like the day finally started.",
            },
            {
              rivalId: "pete-lang",
              delta: -2,
              flag: "took-petes-wall",
              line: "Pete does not accuse you. He stops talking about walls.",
            },
          ],
        },
        {
          id: "long-shore",
          label: "Walk the long shore and arrive after the lunch is packed",
          approach: "generous",
          detail: "Late, dry, and not a story.",
          outcome: "managed",
          narrative: "You arrive last. The island does not care. Hollis does, a little, in your favor.",
          effects: [
            {
              rivalId: "hollis-quinn",
              delta: 1,
              line: "Hollis says late is a way of arriving.",
            },
            {
              rivalId: "calder-brunt",
              delta: -1,
              line: "Calder wanted a witness to the hop and you were on the shore path.",
            },
          ],
        },
      ],
    },
    {
      id: "river-sign",
      title: "Bank sign",
      moduleId: "tracking",
      scene:
        "Something moved along the mud under the alders last night. Five toes, paired. Lenny is already preparing an otter the size of a dog.",
      accessible: {
        id: "told-sign",
        label: "Have the sign described at the chair, then name it yourself.",
        why: "The heat is the naming and the restraint, not a scramble down the cut bank.",
      },
      decisions: [
        {
          id: "call-mink",
          label: "Call it a mink and stop there",
          approach: "careful",
          detail: "You do not follow it into the brush.",
          outcome: "excelled",
          narrative: "Mink. You say so, and you leave the bank. The story stays the size of the track.",
          effects: [
            {
              rivalId: "hollis-quinn",
              delta: 1,
              line: "Hollis says, 'You didn't need to catch it.'",
            },
            {
              rivalId: "lenny-voss",
              delta: 0,
              line: "Lenny's otter shrinks, reluctantly, into your mink.",
            },
          ],
        },
        {
          id: "otter-story",
          label: "Tell it as an otter the size of a dog",
          approach: "bold",
          detail: "The track can be stretched if the audience wants it.",
          outcome: "faltered",
          narrative: "The otter grows. The mud does not support it. People laugh, and then they are not sure.",
          effects: [
            {
              rivalId: "lenny-voss",
              delta: 1,
              line: "Lenny is grateful to have an accomplice.",
            },
            {
              rivalId: "hollis-quinn",
              delta: -1,
              line: "Hollis looks at the track, then at you, and lets the difference stand.",
            },
          ],
        },
        {
          id: "sketch-first",
          label: "Sketch the track and show the sketch before you name it",
          approach: "generous",
          detail: "Other people get to see the evidence, not just your noun.",
          outcome: "managed",
          narrative: "The sketch is plain and correct. The naming happens after, which costs you the drama and saves the fact.",
          effects: [
            {
              rivalId: "pete-lang",
              delta: 1,
              line: "Pete recognizes the habit. Show the thing, then say the thing.",
            },
          ],
        },
      ],
    },
  ],
  prizes: [
    {
      rewardId: "bent-nail",
      when: "activity",
      activityId: "river-island",
      outcomes: ["excelled", "managed", "accessible-complete"],
    },
    {
      rewardId: "letter-lenny",
      when: "activity",
      activityId: "river-eddy",
      outcomes: ["excelled", "managed", "accessible-complete"],
    },
    { rewardId: "island-stone", when: "tone-warm" },
    {
      rewardId: "sketch-mink",
      when: "activity",
      activityId: "river-sign",
      outcomes: ["excelled", "accessible-complete"],
    },
  ],
};
