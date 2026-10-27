import type { FestivalDef } from "../types.ts";

export const harvestSupper: FestivalDef = {
  id: "harvest-supper",
  name: "Harvest Supper",
  seasonLabel: "October",
  openWeek: 12,
  place: "Hale orchard",
  hostRivalId: "juniper-hale",
  hostTitle: "June",
  rivals: ["juniper-hale", "sable-okoye", "theo-march", "lenny-voss", "ruth-bellamy"],
  eraChanges: {
    "first-turning":
      "The supper is still in the church kitchen's shadow, though June has moved the long table under the trees for the night. The fish under the bridge are a tradition, not a scarcity. The letter she writes you will be folded shut.",
    "the-return":
      "The kitchen wall wears the soot scar. June cooks outside because the fire was hers, and she wants it named. The trout run is thin. The folded letter can be opened. A place at the sideboard is not a title.",
  },
  untold:
    "Harvest supper was eaten without Ellis. June did not set the extra plate, and she did not explain the gap to the cousins who asked.",
  onDecline: [
    {
      rivalId: "juniper-hale",
      delta: -1,
      line: "June feeds the people who came and does not send a portion to the house. Absence is not an insult. It is an empty chair she notices.",
    },
    {
      rivalId: "ruth-bellamy",
      delta: 0,
      line: "Ruth writes 'supper, not present' and does not invent a dish you brought.",
    },
  ],
  intro: {
    "first-turning": [
      { speaker: "June", text: "Taste before you talk. The order of the dishes is the recipe. Bragging is a seasoning I don't serve." },
      { speaker: "Sable", text: "Grace is not a hymn tonight. If you need a hymn, have it before you sit." },
      { speaker: "Theo", text: "The loser does the dishes. June says that's the honor. I'm still working out whether she's mocking me." },
      { speaker: "Lenny", text: "I brought fish. They're bigger in the walk from the bridge. I'll try to shrink them before the pan." },
      { speaker: "Ruth", text: "I am not scoring the supper. I am writing down who pretends I am." },
      { speaker: "June", text: "Three dishes, the grace, the pans, the bridge. If you turn any of them into a ribbon, I will salt you." },
    ],
    "the-return": [
      { speaker: "June", text: "Say fire if you mean fire. The soot is mine. Then wash your hands and cook in the order on the card." },
      { speaker: "Sable", text: "The grace is the one I wrote for this table. It is not a prelude to anyone's hymn." },
      { speaker: "Theo", text: "I'll deal the dish-hand clean. Losing on purpose is still a cousin of cheating." },
      { speaker: "Lenny", text: "The run is thin. If you stay late to improve it, you'll improve a lie." },
      { speaker: "Ruth", text: "The folded letter is allowed open. Read it before you let a cousin tell you the fire was weather." },
      { speaker: "June", text: "Same supper. Fewer walls. Don't pretty the reason." },
    ],
  },
  closing: {
    "first-turning": {
      warm: [
        { speaker: "June", text: "You ate like a person and not like a winner. There's a plate in the sideboard. The name is on the underside." },
        { speaker: "Sable", text: "Grace held. Don't file it under hymns." },
        { speaker: "Theo", text: "You did the pans without making a moral out of missing a trick. I can respect that." },
        { speaker: "Lenny", text: "The fish stayed a fish. I'll write it that way if you don't get to it first." },
        { speaker: "Ruth", text: "I have nothing in the margin I need to apologize for." },
      ],
      mixed: [
        { speaker: "June", text: "Parts of the meal were a meal. Parts were a little speech. I fed you anyway." },
        { speaker: "Sable", text: "The tune survived the table. Barely, in places." },
        { speaker: "Theo", text: "Dishes got done. The reasons were uneven." },
        { speaker: "Ruth", text: "Middle of the page. Supper is allowed to be middle." },
      ],
      sour: [
        { speaker: "June", text: "You brought a contest to a table. The salt was instructional." },
        { speaker: "Sable", text: "I played over you. I would rather have played with the room." },
        { speaker: "Lenny", text: "You wanted the run to be a story. The bridge is not a stage." },
        { speaker: "Ruth", text: "I wrote the supper down. I did not write you a compliment inside it." },
      ],
    },
    "the-return": {
      warm: [
        { speaker: "June", text: "You named the fire and you followed the card. The plate stays in the sideboard." },
        { speaker: "Sable", text: "Grace, not a hymn. The orchard can keep that straight if you do." },
        { speaker: "Theo", text: "Clean hand, clean pans. I'm less interested in which of us won." },
        { speaker: "Lenny", text: "Thin run, true pot. I'll take that year." },
        { speaker: "Ruth", text: "Open the letter. Then decide what the cousins are allowed to say." },
      ],
      mixed: [
        { speaker: "June", text: "You fed people and you also decorated the truth a little. The scar is still on the wall for a reason." },
        { speaker: "Sable", text: "The grace was played. Someone will still call it a hymn. Correct them if you want the tune to last." },
        { speaker: "Lenny", text: "We almost stretched it. Thanks for only almost." },
      ],
      sour: [
        { speaker: "June", text: "You prettied the fire or you prettied the food. I don't cook for that." },
        { speaker: "Sable", text: "Don't ask me back to accompany a version of this night." },
        { speaker: "Ruth", text: "The letter is open. Whether you deserved the opening is a separate line." },
      ],
    },
  },
  activities: [
    {
      id: "harvest-cook",
      title: "Three dishes",
      moduleId: "cooking",
      scene:
        "Beans, fish, apple. June has an order. The apple last is not a whim. Starting with the apple is how a supper becomes a picture.",
      eraScene: {
        "the-return":
          "The card is propped on a crate. The soot scar is behind June when she watches to see if you will improve her order.",
      },
      accessible: {
        id: "called-order",
        label: "Call the order from a seat. The mise is pre-cut. You do not have to lift the pots.",
        why: "The heat is the sequence and the not-bragging. Hands on a stove are not the supper.",
      },
      decisions: [
        {
          id: "beans-fish-apple",
          label: "Beans, then fish, then the apple last",
          approach: "careful",
          detail: "You follow the card even where you could show off.",
          outcome: "excelled",
          narrative: "The table understands the order without being told it is understanding something. June's shoulders drop.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: 2,
              line: "June says, 'The order is the recipe.' She means you can come back.",
            },
          ],
        },
        {
          id: "apple-first",
          label: "Start with the apple because it looks like the supper",
          approach: "bold",
          detail: "A photograph of abundance, before anyone is fed.",
          outcome: "faltered",
          narrative: "The apple leads. The beans arrive like an apology. June does not apologize.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: -2,
              line: "June says, 'You cooked a picture.' In the return she looks at the scar when she says it.",
            },
          ],
        },
        {
          id: "unnamed-fish",
          label: "Cook the fish Lenny brought and put your name on none of it",
          approach: "generous",
          detail: "The pot is for the table. The credit can die in the steam.",
          outcome: "excelled",
          narrative: "Lenny's fish, June's fire, no speech from you. People eat.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: 1,
              line: "June sets a plate aside for you without announcing why.",
            },
            {
              rivalId: "lenny-voss",
              delta: 1,
              line: "Lenny tries to say they were bigger, then doesn't.",
            },
          ],
        },
      ],
    },
    {
      id: "harvest-grace",
      title: "Orchard grace",
      moduleId: "music",
      scene:
        "Sable has the piece. A few people are waiting for it to end so a hymn can begin. June is waiting to see whose side the table picks.",
      accessible: {
        id: "seated-grace",
        label: "Sit the grace. Sable's pattern does not ask you to stand or turn.",
        why: "Grace is listening and not renaming the piece.",
      },
      decisions: [
        {
          id: "not-a-hymn",
          label: "Ask Sable to play and do not call it a hymn",
          approach: "generous",
          detail: "You introduce it with her name and no church word.",
          outcome: "excelled",
          narrative: "She plays. You do not follow it with the expected verse. The table eats while the last note is still in the trees.",
          flags: ["defended-sable"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 2,
              flag: "defended-sable",
              line: "Sable says, 'That's the grace.' She starts her plate.",
            },
            {
              rivalId: "juniper-hale",
              delta: 1,
              line: "June says, 'Good. Sit.'",
            },
          ],
        },
        {
          id: "offer-hymn",
          label: "Offer a hymn because a few people expect one",
          approach: "withholding",
          detail: "You try to please the uneasy chairs.",
          outcome: "managed",
          narrative: "June doesn't mind the hymn. Sable minds being the prelude to it.",
          effects: [
            {
              rivalId: "sable-okoye",
              delta: -1,
              line: "Sable packs the extra page away. 'Next time invite a hymn. Don't use me as the door.'",
            },
          ],
        },
        {
          id: "talk-over",
          label: "Talk over the music with the fire story you heard secondhand",
          approach: "bold",
          detail: "You fill her notes with a version of the kitchen you did not see.",
          outcome: "faltered",
          narrative: "The story lands on the tune and dents it. In the return, the story is also a lie about whose fire it was.",
          flags: ["june-fire-prettied"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: -1,
              line: "Sable stops. Not dramatically. She stops.",
            },
            {
              rivalId: "juniper-hale",
              delta: -1,
              line: "June says, 'Not while she plays.'",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "sable-okoye",
                delta: -1,
                line: "Sable stops. The orchard is quiet enough to hear the lie.",
              },
              {
                rivalId: "juniper-hale",
                delta: -2,
                flag: "june-fire-prettied",
                line: "June says, 'It was grease. It was mine. Don't accompany that with her music.'",
              },
            ],
          },
        },
      ],
    },
    {
      id: "harvest-dishes",
      title: "Who does the dishes",
      moduleId: "cards",
      scene:
        "Theo deals one hand. The custom says the loser scrubs. June says the scrubbing is the honor, which makes the custom wobble. Drying counts. Leaving does not.",
      accessible: {
        id: "drying",
        label: "Take drying, not scrubbing, if that is the work your hands can do.",
        why: "The honor is staying with the pans, not a particular grip.",
      },
      decisions: [
        {
          id: "win-and-wash",
          label: "Win and do the dishes anyway",
          approach: "careful",
          detail: "The hand is real. The pans are not a punishment you dodge.",
          outcome: "excelled",
          narrative: "You win and you wash. June looks at Theo as if to say: that is the honor. He understands it a little more.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: 2,
              line: "June says, 'The honor was never the losing.'",
            },
            {
              rivalId: "theo-march",
              delta: 1,
              line: "Theo dries. 'All right. Not a trick. A chore.'",
            },
          ],
        },
        {
          id: "lose-on-purpose",
          label: "Miss tricks so you can be the noble loser",
          approach: "generous",
          detail: "You arrange the virtue.",
          outcome: "managed",
          narrative: "Theo sees the miss. He lets you wash and he will not call it goodness.",
          effects: [
            {
              rivalId: "theo-march",
              delta: 0,
              line: "Theo says, 'Do the dishes if you want. Don't miss a trick and call it virtue.'",
            },
            {
              rivalId: "juniper-hale",
              delta: 0,
              line: "June is glad the pans are done and uninterested in the performance.",
            },
          ],
        },
        {
          id: "leave-pans",
          label: "Win and leave the pans for the custom",
          approach: "withholding",
          detail: "You take the rule as written and go sit.",
          outcome: "faltered",
          narrative: "The pans wait. June does them with her mouth in a line. The honor, unused, turns into work she did not ask to demonstrate.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: -2,
              line: "June says, 'The custom was an excuse to stay. You found the excuse.'",
            },
          ],
        },
      ],
    },
    {
      id: "harvest-bridge",
      title: "Under the bridge",
      moduleId: "fishing",
      scene:
        "After the plates, a short walk to the bridge. One trout for a late pot is plenty. Staying until the story improves is how Lenny gets into trouble, and how he invites you in.",
      eraScene: {
        "the-return":
          "The run is thin. Lenny says so before you cast, as if daring you to disagree with the river.",
      },
      accessible: {
        id: "bridge-rail",
        label: "Fish from the rail with a rest, or call the eddy and let Lenny row the last cast.",
        why: "The heat is knowing when to stop, not wading the dark.",
      },
      decisions: [
        {
          id: "one-trout",
          label: "Take one small trout for the pot and stop",
          approach: "generous",
          detail: "Supper, not a weigh-in.",
          outcome: "excelled",
          narrative: "One fish, honest size, back before anyone can build a crowd.",
          flags: ["supper-fish"],
          effects: [
            {
              rivalId: "lenny-voss",
              delta: 2,
              flag: "supper-fish",
              line: "Lenny says, 'That's the size,' and sounds almost relieved.",
            },
          ],
        },
        {
          id: "stay-to-brag",
          label: "Stay until you can brag",
          approach: "bold",
          detail: "The run can be bullied into a better ending.",
          outcome: "faltered",
          narrative: "You stay. The story gets bigger than the basket. June has already banked the fire.",
          flags: ["glory-fish"],
          effects: [
            {
              rivalId: "lenny-voss",
              delta: -1,
              flag: "glory-fish",
              line: "Lenny helped you wait for a bigger lie, and he goes home angry at both of you.",
            },
          ],
        },
        {
          id: "name-the-thin",
          label: "Quit when it thins and say so",
          approach: "careful",
          detail: "You report the river instead of repairing it.",
          outcome: "managed",
          eraOutcome: { "the-return": "excelled" },
          narrative: "You quit. In the first life Lenny is impatient. The truth is still the better guest.",
          eraNarrative: {
            "the-return": "You say the run is thin. Lenny looks like someone finally repeated his sermon back to him without mockery.",
          },
          effects: [
            {
              rivalId: "lenny-voss",
              delta: 0,
              line: "Lenny says, 'We could have stayed.' He does not sound sure.",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "lenny-voss",
                delta: 2,
                flag: "supper-fish",
                line: "Lenny says, 'Yes. Thin.' He does not stretch his hands.",
              },
            ],
          },
        },
      ],
    },
  ],
  prizes: [
    {
      rewardId: "named-plate",
      when: "activity",
      activityId: "harvest-cook",
      outcomes: ["excelled", "managed", "accessible-complete"],
    },
    { rewardId: "letter-june", when: "finish" },
    {
      rewardId: "tune-orchard",
      when: "activity",
      activityId: "harvest-grace",
      outcomes: ["excelled", "managed", "accessible-complete"],
    },
    { rewardId: "sideboard-seat", when: "tone-warm" },
  ],
};
