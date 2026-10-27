import type { FestivalDef } from "../types.ts";

export const solsticeHearth: FestivalDef = {
  id: "solstice-hearth",
  name: "Solstice Hearth",
  seasonLabel: "December",
  openWeek: 16,
  place: "The homestead parlor",
  hostRivalId: "ruth-bellamy",
  hostTitle: "Ruth, for the house",
  rivals: ["ruth-bellamy", "willa-crane", "inez-pell", "sable-okoye", "juniper-hale"],
  eraChanges: {
    "first-turning":
      "The parlor is only a parlor: nails in the plaster, no captions, no cousins yet. Ruth reads for the house. The prize of the night is what you choose to leave on a nail, not a title to the farm.",
    "the-return":
      "The nails already hold whatever the first life kept. Cousins have written captions, some fair, some swollen, some simply wrong. You may leave a caption, amend it, or take it down. The gathering is the interpretation, and it still will not plow a field.",
  },
  untold:
    "Solstice passed with the oven dark. Descendants invented a mild night and a person who kept to the road. The nails stayed empty, which Ruth prefers to a made-up trophy.",
  onDecline: [
    {
      rivalId: "ruth-bellamy",
      delta: 0,
      line: "Ruth leaves the parlor lamps low. An empty nail is a record. She does not hammer a substitute into it.",
    },
    {
      rivalId: "sable-okoye",
      delta: 0,
      line: "Sable does not play the midnight piece to an empty room and then credit the absence.",
    },
  ],
  intro: {
    "first-turning": [
      { speaker: "Ruth", text: "The house is not keeping score. I am keeping a record, which is colder and more useful." },
      { speaker: "Sable", text: "If you want a piece for this room, ask for mine and say so. The walls are listening for a name." },
      { speaker: "Inez", text: "The woodlot is not a hunt. A window count can be true. A trophy story cannot." },
      { speaker: "Willa", text: "I'll pin what you actually saw. Don't ask me to draw a better witness than you were." },
      { speaker: "June", text: "The bread card is on the table. Follow it. The second loaf leaves the house." },
      { speaker: "Ruth", text: "Music, the edge of the trees, a hand you play in order to give the prize away, then the bread. Nothing here is a deed." },
    ],
    "the-return": [
      { speaker: "Ruth", text: "The cousins have been busy. Some of the cards are fair. Some are hungry. You can leave them, amend them, or take them down." },
      { speaker: "Sable", text: "If Midnight Bread is humming around the valley as yours, tonight is a good night to be boringly accurate." },
      { speaker: "Inez", text: "Willa's fisher looks into the house. The fisher did not. Say so even if the drawing is loved." },
      { speaker: "Willa", text: "I made it better and I made it less true. Don't comfort me with the better one." },
      { speaker: "June", text: "Same card as the first loaf. Don't enrich it. Enrichment is how a recipe becomes a lie." },
      { speaker: "Ruth", text: "We do the night in the old order. After, the parlor is still not a farm. It is where the record sits until someone corrects it." },
    ],
  },
  closing: {
    "first-turning": {
      warm: [
        { speaker: "Ruth", text: "The nails can hold this. I don't need them to prove you were the valley's best anything." },
        { speaker: "Sable", text: "The piece stays in the stool with my name. Play it here or don't play it." },
        { speaker: "Inez", text: "You came back to the oven. That is the correct ending of a track." },
        { speaker: "Willa", text: "I'll pin the plain version. I already want to improve it. I won't, tonight." },
        { speaker: "June", text: "The second loaf went out. That's the recipe finished." },
      ],
      mixed: [
        { speaker: "Ruth", text: "Some of what we'll hang is true. I'll leave space in the margin for the rest." },
        { speaker: "Sable", text: "The music happened. The credit is not settled, and I don't like that it needs settling." },
        { speaker: "Willa", text: "I drew what I could stand. Tell me later if I sweetened it." },
        { speaker: "June", text: "The house smells like bread. It also smells a little like a performance. Air it." },
      ],
      sour: [
        { speaker: "Ruth", text: "I will not hang a boast just because the night is long." },
        { speaker: "Sable", text: "Don't put that piece on the stool under your hand." },
        { speaker: "Inez", text: "You brought the woodlot indoors as a trophy. Open a window and let the idea out." },
        { speaker: "June", text: "The card was clear. The loaf was not. I'm taking the second one back." },
      ],
    },
    "the-return": {
      warm: [
        { speaker: "Ruth", text: "Amend what is swollen. Leave what is fair. Take down what is a lie. I'll write which you chose." },
        { speaker: "Sable", text: "You said the name in the room where the wrong caption lives. That's the repair." },
        { speaker: "Inez", text: "The fisher stayed a crossing. Good. The parlor does not need a familiar." },
        { speaker: "Willa", text: "Keep my redraw if you want the skill. Keep your note if you want the night. They are not the same sheet." },
        { speaker: "June", text: "Bread, as written. The house can have a solstice without inheriting a legend." },
      ],
      mixed: [
        { speaker: "Ruth", text: "The captions are now partly yours, which means the remaining mistakes are also yours." },
        { speaker: "Sable", text: "Some of the humming will still be wrong. You made it harder to be wrong. That's not nothing." },
        { speaker: "Willa", text: "I can live with a mixed wall. I can't live with being told the pretty one is the witness." },
      ],
      sour: [
        { speaker: "Ruth", text: "You let the hungry captions stand, or you wrote new ones. The drawer knows." },
        { speaker: "Sable", text: "The stool can stay empty. I won't decorate a theft." },
        { speaker: "Inez", text: "Come back when you can count a track without owning it." },
        { speaker: "June", text: "Even the bread got improved. I'm tired." },
      ],
    },
  },
  activities: [
    {
      id: "solstice-music",
      title: "The piece you keep",
      moduleId: "music",
      scene:
        "The parlor will remember one piece from tonight. Sable has several. The halt is in the book too, sparse enough for a small room. What you ask for, and whose name you attach, is the heat.",
      accessible: {
        id: "seated-piece",
        label: "Sit the rhythm or ask her to play while you keep the page turned.",
        why: "Keeping a piece is attention and attribution, not a dance in a parlor.",
      },
      decisions: [
        {
          id: "say-her-name",
          label: "Ask Sable to play hers and say her name before the first note",
          approach: "generous",
          detail: "The room hears the attribution while it is still easy to be accurate.",
          outcome: "excelled",
          narrative: "She plays. You said the name. Ruth writes it above the stave so a cousin will have to cross it out on purpose.",
          flags: ["named-sable", "defended-sable"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 2,
              flag: "defended-sable",
              line: "Sable says, 'Good. Leave the page in the stool.'",
            },
            {
              rivalId: "ruth-bellamy",
              delta: 1,
              line: "Ruth writes the name in a hand large enough for a later reader.",
            },
          ],
        },
        {
          id: "let-it-be-yours",
          label: "Play what you remember and let the room call it yours",
          approach: "bold",
          detail: "Memory is fuzzy. Credit is convenient.",
          outcome: "faltered",
          narrative: "The room is pleased to have a song it can hang on the returned Ellis. Sable hears the hanging.",
          flags: ["accepted-sable-credit"],
          effects: [
            {
              rivalId: "sable-okoye",
              delta: -2,
              flag: "accepted-sable-credit",
              line: "Sable closes the book. 'You remember the notes and forgot the person.'",
            },
          ],
        },
        {
          id: "ask-the-halt",
          label: "Ask for the halt, and leave silence after it",
          approach: "careful",
          detail: "A sparse piece. No encore. No claim.",
          outcome: "managed",
          narrative: "The halt fits the room. Nobody applauds over the silence, because you don't start them.",
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 1,
              line: "Sable says, 'That one is mine too. Smaller. Still mine.'",
            },
            {
              rivalId: "inez-pell",
              delta: 1,
              line: "Inez prefers the silence after. She treats it as a kind of field manners.",
            },
          ],
        },
      ],
    },
    {
      id: "solstice-woodlot",
      title: "What still lives in the woodlot",
      moduleId: "tracking",
      scene:
        "Past the orchard edge, something crossed after dark. Two and two, a bound. Inez will accept a true window count. She will not accept a familiar in the doorway.",
      accessible: {
        id: "window-count",
        label: "Count from the window. Only swear to what you can see.",
        why: "Inez accepts a window. The night woodlot is not a test of courage.",
      },
      decisions: [
        {
          id: "name-and-return",
          label: "Go to the edge, name what crossed, and do not follow",
          approach: "careful",
          detail: "A fisher, a bound, then the oven.",
          outcome: "excelled",
          narrative: "Fisher. You say it at the door and you do not make it a companion. The bread is not ruined by a story.",
          effects: [
            {
              rivalId: "inez-pell",
              delta: 2,
              line: "Inez says, 'A crossing. Not a relationship. Remember the difference when they draw it.'",
            },
          ],
        },
        {
          id: "trophy-story",
          label: "Bring back a trophy story for the wall",
          approach: "bold",
          detail: "The parlor likes a night encounter more than a track.",
          outcome: "faltered",
          narrative: "You give them a fisher in the doorway. Willa's hand itches. Inez looks at the actual dark, which contains no such meeting.",
          effects: [
            {
              rivalId: "inez-pell",
              delta: -2,
              line: "Inez says, 'You wanted a familiar. The woodlot does not owe you one.'",
            },
            {
              rivalId: "willa-crane",
              delta: 1,
              line: "Willa wants the story and wants you not to have needed it. Both are visible on her face.",
            },
          ],
        },
        {
          id: "swear-the-glass",
          label: "Stay at the glass and count only what you can swear to",
          approach: "generous",
          detail: "A smaller truth, offered before anyone asks for a braver one.",
          outcome: "managed",
          narrative: "You report less than a hero would. Inez calls it adequate. In her mouth this is nearly warm.",
          effects: [
            {
              rivalId: "inez-pell",
              delta: 1,
              line: "Inez says, 'A window is not a woodlot. It is also not a lie.'",
            },
          ],
        },
      ],
    },
    {
      id: "solstice-gift",
      title: "The gift cut",
      moduleId: "cards",
      scene:
        "One hand. The point of winning is to give the prize away. Ruth watches what you call a gift. A gift you arranged is still a direction.",
      accessible: {
        id: "called-cut",
        label: "Ruth calls the cards. You choose who receives.",
        why: "The heat is the giving, not the handling of the deck.",
      },
      decisions: [
        {
          id: "give-ruth",
          label: "Win and give it to the ledger, for paper and ink",
          approach: "careful",
          detail: "The prize keeps the record fed.",
          outcome: "excelled",
          narrative: "Ruth does not gush. She does sharpen a pencil that was already sharp, which is her version of pleased.",
          effects: [
            {
              rivalId: "ruth-bellamy",
              delta: 2,
              line: "Ruth says, 'Ink is a decent gift. Boasts are not.'",
            },
          ],
        },
        {
          id: "give-willa",
          label: "Win and give it to Willa's sketch of someone else's sighting",
          approach: "generous",
          detail: "You fund the drawing, not the claim that she was there.",
          outcome: "managed",
          narrative: "Willa takes it and immediately asks whether you think the sheet is the sighting. You have made her question, which she half wanted.",
          effects: [
            {
              rivalId: "willa-crane",
              delta: 1,
              line: "Willa says, 'This buys paper. It doesn't make me the one who saw it.'",
            },
            {
              rivalId: "ruth-bellamy",
              delta: 0,
              line: "Ruth writes 'given to the drawer, not to the claim.'",
            },
          ],
        },
        {
          id: "keep-symbolic",
          label: "Keep the trick and call the keeping symbolic",
          approach: "withholding",
          detail: "A gift night, interrupted by a souvenir.",
          outcome: "faltered",
          narrative: "You keep it. The symbolism is thin. Ruth writes a short word.",
          effects: [
            {
              rivalId: "ruth-bellamy",
              delta: -1,
              line: "Ruth writes 'kept.' She does not add a speech.",
            },
            {
              rivalId: "sable-okoye",
              delta: -1,
              line: "Sable says a gift you arranged and then held is just a direction you liked.",
            },
          ],
        },
      ],
    },
    {
      id: "solstice-bread",
      title: "Midnight bread",
      moduleId: "cooking",
      scene:
        "June's card is explicit. The crumb does not need to look richer. The second loaf leaves with whoever is still owed a kindness. Often that is Sable, who is not always fed by the halls she plays.",
      accessible: {
        id: "directed-loaf",
        label: "Direct the loaf from a chair. The card is read aloud. Shaping is optional.",
        why: "The heat is following the card and sending the second loaf out, not a test of hands in dough.",
      },
      decisions: [
        {
          id: "follow-card",
          label: "Follow June's card even though she is not standing over you",
          approach: "careful",
          detail: "No improvement. No signature crust.",
          outcome: "excelled",
          narrative: "The loaf is as written. The house smells like a recipe instead of a reputation.",
          flags: ["june-fire-named"],
          effects: [
            {
              rivalId: "juniper-hale",
              delta: 2,
              flag: "june-fire-named",
              line: "June says, 'You didn't improve me. Good.'",
            },
          ],
        },
        {
          id: "richer-crumb",
          label: "Change it so the crumb looks richer",
          approach: "bold",
          detail: "A better-looking bread for a holy night.",
          outcome: "faltered",
          narrative: "It looks richer and tastes like someone else's anxiety. June knows the difference with the first bite.",
          effects: [
            {
              rivalId: "juniper-hale",
              delta: -2,
              line: "June says, 'That is not the card.'",
            },
          ],
        },
        {
          id: "second-loaf",
          label: "Bake two, and the second leaves with Sable",
          approach: "generous",
          detail: "The house keeps one. The player of the night does not go home empty.",
          outcome: "excelled",
          narrative: "Two loaves. Sable takes the tin. Nobody makes a speech about generosity in the doorway.",
          effects: [
            {
              rivalId: "sable-okoye",
              delta: 1,
              line: "Sable says, 'This is the right kind of encore.'",
            },
            {
              rivalId: "juniper-hale",
              delta: 1,
              line: "June wrote 'the second leaves' on the card. She is glad you can read.",
            },
          ],
        },
      ],
    },
  ],
  prizes: [
    {
      rewardId: "tune-midnight",
      when: "activity",
      activityId: "solstice-music",
      outcomes: ["excelled", "accessible-complete"],
    },
    {
      rewardId: "tune-midnight",
      when: "activity",
      activityId: "solstice-bread",
      outcomes: ["excelled", "accessible-complete"],
    },
    { rewardId: "letter-ruth", when: "finish" },
    {
      rewardId: "sketch-woodlot",
      when: "activity",
      activityId: "solstice-woodlot",
      outcomes: ["excelled", "managed", "accessible-complete"],
    },
    { rewardId: "hearth-nail", when: "finish" },
    {
      rewardId: "bread-tin",
      when: "activity",
      activityId: "solstice-bread",
      outcomes: ["excelled", "managed", "accessible-complete"],
    },
  ],
};
