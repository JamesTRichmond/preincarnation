import type { FestivalDef } from "../types.ts";

export const frostWalk: FestivalDef = {
  id: "frost-walk",
  name: "Frost Walk",
  seasonLabel: "January",
  openWeek: 20,
  place: "The ridge above the intervale",
  hostRivalId: "agnes-crowell",
  hostTitle: "Agnes",
  rivals: ["agnes-crowell", "pete-lang", "calder-brunt", "inez-pell"],
  eraChanges: {
    "first-turning":
      "Agnes opens the ridge as the thing itself. A lower wall is a way to stay home. Calder dares the worst footing. The halt, if you call one, sounds to Agnes like softness.",
    "the-return":
      "Agnes still speaks first, and she requires Pete's lower line. Calder's one-hand route is that line, and he will not have it announced as injury. The old ridge is labeled weather, not heroism. The halt is now part of finishing.",
  },
  untold:
    "The frost walk is a blank in the first life. Descendants say Ellis was wise to stay by the stove. Pete's map does not confirm wisdom. It confirms absence.",
  onDecline: [
    {
      rivalId: "agnes-crowell",
      delta: -1,
      line: "Agnes says, 'Then stay home,' and in the first life she means it as the whole moral.",
    },
    {
      rivalId: "pete-lang",
      delta: 0,
      line: "Pete folds the map. A route you did not ask for is not a route you stole.",
    },
  ],
  intro: {
    "first-turning": [
      { speaker: "Agnes", text: "The ridge is the walk. If you came to sit, you can sit at home." },
      { speaker: "Pete", text: "There's a lower wall. I'm not offering it as a dare. I'm offering it as a wall." },
      { speaker: "Calder", text: "If you're coming, come where it's bad. I'll be there, except the places that are water." },
      { speaker: "Inez", text: "Anything you flush for an audience, you can explain to me at the stove. I will not enjoy it." },
      { speaker: "Agnes", text: "Ridge, snow sign, the question of a halt, then cards at the remnant stove. Finish or don't narrate it." },
    ],
    "the-return": [
      { speaker: "Agnes", text: "The way includes the bench and Pete's lower wall. I was wrong when it didn't. I will say that once." },
      { speaker: "Pete", text: "The lower wall is the route. The ridge is weather. Don't climb weather to impress me." },
      { speaker: "Calder", text: "Lower line's the line. Don't make a speech about my hand. Walk it or don't." },
      { speaker: "Inez", text: "The hare's bed is not a performance. If it is still there, leave it still." },
      { speaker: "Agnes", text: "Same order as the old walk. The meanings are not the same. Try to notice." },
    ],
  },
  closing: {
    "first-turning": {
      warm: [
        { speaker: "Agnes", text: "You finished a thing I recognize. I'm not interested in how it felt." },
        { speaker: "Pete", text: "The walls I showed you are still a confidence. Keep them that way." },
        { speaker: "Calder", text: "I take the dare back. That's what I can give you. Don't frame it." },
        { speaker: "Inez", text: "The snow is as you found it. Good." },
      ],
      mixed: [
        { speaker: "Agnes", text: "You were on the hill. Don't ask me for a blessing about the style." },
        { speaker: "Pete", text: "Some of the route is still yours to be trusted with. Not all of it." },
        { speaker: "Calder", text: "We both showed off a little. I'm only annoyed at my half." },
        { speaker: "Inez", text: "You saw something and you also disturbed something. Those are different verbs." },
      ],
      sour: [
        { speaker: "Agnes", text: "That was not the walk. That was being seen on a hill." },
        { speaker: "Pete", text: "Don't ask me for another gap." },
        { speaker: "Calder", text: "You turned a dare into a show. I already regret inventing it." },
        { speaker: "Inez", text: "The bed is kicked apart. I don't want the story of the hare." },
      ],
    },
    "the-return": {
      warm: [
        { speaker: "Agnes", text: "You finished by the standard I have now. I will not pretend I always had it." },
        { speaker: "Pete", text: "The map worked. That's the win I wanted. You didn't have to add one." },
        { speaker: "Calder", text: "You walked the line and left my hand out of the sentence. The dare is withdrawn." },
        { speaker: "Inez", text: "Nothing was flushed for the view. I can drink the tea." },
      ],
      mixed: [
        { speaker: "Agnes", text: "You still like the old ridge more than you admit. I understand the liking. I don't sponsor it." },
        { speaker: "Pete", text: "The lower path held. The story around it got heavier than the snow." },
        { speaker: "Calder", text: "We're all right. Don't add my name to a legend on the way down." },
        { speaker: "Inez", text: "Most of the sign is intact." },
      ],
      sour: [
        { speaker: "Agnes", text: "You did the first-life version in the return. I have already apologized for that version." },
        { speaker: "Pete", text: "You wanted the hard line so someone would tell it. I won't." },
        { speaker: "Calder", text: "If you mentioned the hand, we're done for the winter." },
        { speaker: "Inez", text: "Bring me a sighting that isn't a trophy or don't bring it down the hill." },
      ],
    },
  },
  activities: [
    {
      id: "frost-ridge",
      title: "The ridge",
      moduleId: "traversal",
      scene:
        "Two lines leave the sugarhouse remnant. One takes the ridge. One follows the stone wall Pete trusts. Calder is already daring the icy bit with his chin.",
      eraScene: {
        "the-return":
          "The lower wall is Calder's one-hand line and Pete's map, the same ground for different reasons. The ridge is still there, labeled by Agnes as weather.",
      },
      accessible: {
        id: "lower-wall",
        label: "Take Pete's lower stone-wall loop. It is a full finish.",
        why: "The gathering is the line staying together, not the exposure. In the return, this is the route Calder walks and will not narrate.",
        eraNote: {
          "first-turning": "Agnes hears this as staying home.",
          "the-return": "Agnes requires it. Calder considers a speech about his hand a second, worse ridge.",
        },
      },
      decisions: [
        {
          id: "set-pace",
          label: "Set a pace so the line can see each other",
          approach: "careful",
          detail: "Nobody strings out. Nobody arrives as a hero.",
          outcome: "excelled",
          narrative: "The line stays in sight. It is not impressive. It is a way to still have everyone at the stove.",
          effects: [
            {
              rivalId: "pete-lang",
              delta: 2,
              line: "Pete says, 'That's how a wall is walked.'",
            },
            {
              rivalId: "agnes-crowell",
              delta: 0,
              line: "Agnes does not praise the pace. She also does not lose anyone, which she notices.",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "pete-lang",
                delta: 2,
                line: "Pete marks a small peg where you held the line. He does not call it a summit.",
              },
              {
                rivalId: "agnes-crowell",
                delta: 1,
                line: "Agnes says, 'Yes. That. Not the other thing.'",
              },
            ],
          },
        },
        {
          id: "break-alone",
          label: "Break trail alone to be first at the stove",
          approach: "bold",
          detail: "The story is the arrival.",
          outcome: "faltered",
          eraOutcome: { "first-turning": "managed" },
          narrative: "You are first. The line behind you has a gap Agnes can see from the remnant.",
          eraNarrative: {
            "first-turning":
              "Agnes likes that you suffered the ridge and dislikes that you did it to be seen. She files both without a smile.",
          },
          effects: [
            {
              rivalId: "calder-brunt",
              delta: 1,
              line: "Calder respects the speed and is annoyed you didn't wait to be dared.",
            },
            {
              rivalId: "pete-lang",
              delta: -1,
              line: "Pete says nothing, which is the reprimand.",
            },
          ],
        },
        {
          id: "match-calder",
          label: "Match Calder, including the places he is proving something",
          approach: "withholding",
          detail: "You keep up and you do not name what he is proving.",
          outcome: "managed",
          narrative: "You match him. You do not announce the reason the footing changed. He looks sideways, once, like a thanks.",
          flags: ["calder-unannounced"],
          effects: [
            {
              rivalId: "calder-brunt",
              delta: 2,
              flag: "calder-unannounced",
              line: "Calder says, 'Don't tell it.' He means the whole shape of the walk, not only the ice.",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "calder-brunt",
                delta: 2,
                flag: "calder-unannounced",
                line: "You take the one-hand line and do not say hand. Calder withdraws the dare on the spot.",
              },
            ],
          },
        },
      ],
    },
    {
      id: "frost-sign",
      title: "Snow sign",
      moduleId: "tracking",
      scene:
        "Under a spruce, a hare has packed a bed. Entries, no exit. Calder would like it flushed so the line has something to shout about. Inez is already standing where she can see your feet.",
      accessible: {
        id: "called-bed",
        label: "Have the bed described, then decide. You need not break trail to the spruce.",
        why: "The choice is whether the bed stays a bed.",
      },
      decisions: [
        {
          id: "leave-bed",
          label: "Read the hare and leave the bed undisturbed",
          approach: "careful",
          detail: "You name it and you back out on your own footprints.",
          outcome: "excelled",
          narrative: "Snowshoe hare. The warmth in the snow stays. Inez's shoulders drop a fraction.",
          effects: [
            {
              rivalId: "inez-pell",
              delta: 2,
              line: "Inez says, 'You can sketch it from the track. You cannot improve the animal.'",
            },
          ],
        },
        {
          id: "kick-bed",
          label: "Kick the bed so Calder can say you flushed it",
          approach: "bold",
          detail: "The line gets a leap. The bed is gone.",
          outcome: "faltered",
          narrative: "The hare goes. The shout is thin in the cold. Inez looks at the ruined snow and not at you.",
          effects: [
            {
              rivalId: "inez-pell",
              delta: -2,
              line: "Inez says, 'That was for them. Don't bring it to me as natural history.'",
            },
            {
              rivalId: "calder-brunt",
              delta: 1,
              line: "Calder whoops, then sees Inez, and the whoop dies.",
            },
          ],
        },
        {
          id: "borrow-inez",
          label: "Ask Inez to read it and only repeat what she says",
          approach: "generous",
          detail: "You give her the noun.",
          outcome: "managed",
          narrative: "She wanted you to see it, not to borrow her eyes. She lets it pass, barely.",
          effects: [
            {
              rivalId: "inez-pell",
              delta: 1,
              line: "Inez says, 'Next time your eyes. This time, adequate.'",
            },
          ],
        },
      ],
    },
    {
      id: "frost-halt",
      title: "The halt",
      moduleId: "music",
      scene:
        "The line can string out on the last pitch. A halt is a song or a call that makes everyone stop and see each other. Agnes, in the first life, thinks stopping is how you fail a walk.",
      accessible: {
        id: "halt-from-bench",
        label: "Call the halt from the lower bench, on Sable's seated pattern, though she is not on the ridge.",
        why: "Holding the line is the heat. You do not have to be the highest body to start it.",
      },
      decisions: [
        {
          id: "sing-halt",
          label: "Stop the line and sing the halt",
          approach: "generous",
          detail: "Everyone waits. The fast ones hate it for a minute.",
          outcome: "managed",
          eraOutcome: { "the-return": "excelled" },
          narrative: "You stop them. The gap closes. Agnes calls it soft and does not lose a person.",
          eraNarrative: {
            "the-return":
              "You stop them. Agnes, who once hated a halt, is the reason this one exists. She will not say she was wrong in those words. She waits until the last person is in sight.",
          },
          flags: ["halt-called"],
          effects: [
            {
              rivalId: "agnes-crowell",
              delta: -1,
              line: "Agnes says halts are for people who did not train. She says it, and then she counts heads.",
            },
            {
              rivalId: "pete-lang",
              delta: 1,
              line: "Pete remembers the place. He will pencil it if the day allows.",
            },
          ],
          eraEffects: {
            "the-return": [
              {
                rivalId: "agnes-crowell",
                delta: 2,
                line: "Agnes says, 'Hold there.' It is an order and an apology sharing a sentence.",
              },
              {
                rivalId: "pete-lang",
                delta: 1,
                line: "Pete names the peg Ellis's Halt, small, so it will not become a peak.",
              },
            ],
          },
        },
        {
          id: "trust-the-fast",
          label: "Keep walking and trust the fast ones to notice a gap",
          approach: "withholding",
          detail: "You assume competence will look back.",
          outcome: "faltered",
          narrative: "The fast ones do not look back. Someone arrives late and angry and cold.",
          effects: [
            {
              rivalId: "agnes-crowell",
              delta: -1,
              line: "Agnes says, 'A line is not a race with spectators.'",
            },
          ],
        },
        {
          id: "whistle-pattern",
          label: "Whistle the seated pattern and let whoever needs the halt take it",
          approach: "careful",
          detail: "You start the figure. You don't own the stop.",
          outcome: "managed",
          narrative: "The pattern is enough. People stop without being told they are failing.",
          flags: ["halt-called"],
          effects: [
            {
              rivalId: "pete-lang",
              delta: 1,
              line: "Pete says, 'That's a fair call.'",
            },
          ],
        },
      ],
    },
    {
      id: "frost-cards",
      title: "Stove cribbage",
      moduleId: "cards",
      scene:
        "The remnant stove is the whole prize: the warm seat beside it. Calder pretends the game is a dare. Agnes is pretending she does not care who sits down.",
      accessible: {
        id: "stove-counts",
        label: "The stove hand counts as finishing the walk if you cannot take the pitch.",
        why: "In the return Agnes says so outright. In the first life the option exists and she resents it.",
        eraNote: {
          "the-return": "Agnes will say the stove counts before anyone asks.",
        },
      },
      decisions: [
        {
          id: "give-the-seat",
          label: "Play for the warm seat and give it up if you win",
          approach: "generous",
          detail: "Calder gets the chair. You do not narrate the gift.",
          outcome: "excelled",
          narrative: "You win the seat and you stand. Calder sits and pretends he beat you. Everyone allows the pretense except Ruth, who is not here.",
          flags: ["dare-withdrawn"],
          effects: [
            {
              rivalId: "calder-brunt",
              delta: 2,
              flag: "dare-withdrawn",
              line: "Calder takes the chair and, quieter, takes the dare back.",
            },
          ],
        },
        {
          id: "dare-money",
          label: "Play as if there is dare-money on the hand",
          approach: "withholding",
          detail: "You invent a stake.",
          outcome: "faltered",
          narrative: "There was no money. Calder is offended you thought the dare was a purse.",
          effects: [
            {
              rivalId: "calder-brunt",
              delta: -2,
              line: "Calder says, 'I don't sell them,' and will not play the second hand.",
            },
          ],
        },
        {
          id: "let-agnes",
          label: "Let Agnes win the hand she will not admit she wants",
          approach: "careful",
          detail: "You miss a trick you saw.",
          outcome: "managed",
          narrative: "Agnes sits. She does not thank you. She looks warmer, which is the point, and a little suspicious.",
          effects: [
            {
              rivalId: "agnes-crowell",
              delta: 1,
              line: "Agnes says, 'Don't miss a trick and call it virtue.' She stays seated anyway.",
            },
          ],
        },
      ],
    },
  ],
  prizes: [
    {
      rewardId: "halt-marker",
      when: "flag",
      flag: "halt-called",
    },
    { rewardId: "tune-halt", when: "flag", flag: "halt-called" },
    { rewardId: "dare-withdrawn", when: "flag", flag: "dare-withdrawn" },
    {
      rewardId: "sketch-hare",
      when: "activity",
      activityId: "frost-sign",
      outcomes: ["excelled", "accessible-complete"],
    },
    { rewardId: "letter-agnes", when: "finish" },
  ],
};
