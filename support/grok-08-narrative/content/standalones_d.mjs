import { standalone } from "./questkit.mjs";
import { death, reward } from "./death.mjs";

export const quests = [
  standalone({
    id: "q.meal_for_christian",
    title: "Christian's Meal",
    locationId: "loc.orwell.quiet_house",
    eras: ["E4"],
    characters: ["p.miriam_waite", "p.joel_waite"],
    summary:
      "The Quiet Household has cooked the Thursday Christian Dobbs wrote down for himself, and Chris's hands expect it. Eating comforts the body. Leaving the plate keeps the food as leftovers. Cooking it wrong on purpose tells the truth and is a little cruel.",
    discovery:
      "You are in the Orwell kitchen because the plate is already on the table, not because anyone called you in from the road. Miriam Waite is failing and still standing at the stove. Joel Waite watches Chris's hands find the fork. The meal is hamburger, canned peas, and the heel of the store bread.",
    steps: [
      "Stand at the Quiet Household table and hear Christian's Thursday list read as groceries with a name, not as a rite.",
      "Decide whether Chris's hands get the meal they expect, whether the plate stays full, or whether the food is ruined on purpose.",
      "Say, in the kitchen, whether comfort was allowed, refused, or spoiled, and leave the fork where that decision puts it.",
    ],
    opening: {
      speakerId: "p.miriam_waite",
      text: "Christian wrote hamburger, canned peas, and the heel of the store bread on the fridge paper, and that is what is on the table. Chris's hands keep finding the fork. It is groceries with a name on them. I am too tired to pretend it is more, and too stubborn to pretend it is less.",
      variant: {
        when: {
          background: "intervale",
          bond: "waite_house",
          ideal: "the_living_first",
          flaw: "spares_a_kind_lie",
        },
        text: "You will want to feed those hands and call the feeding a kindness, and you will want the kindness to count as accurate. Christian's list is hamburger, canned peas, and the heel of the bread. Chris already believes the plate. If you spare him, say so. If you spare yourself, say that instead.",
      },
    },
    branches: [
      {
        id: "eaten",
        choiceId: "eat_the_thursday",
        choice: "Eat Christian's Thursday so the hands can stop looking for it.",
        middleSpeakerId: "p.joel_waite",
        middle: "The hands quit hunting once the peas were gone. That is the whole mercy and I am not going to sneer at a clean plate. Mother will not put the fork in a drawer and call it memory. It is a fork. You used it. The name was Christian and the food was food.",
        endSpeakerId: "p.miriam_waite",
        end: "You ate what Christian would have eaten, and the body is quieter for it. I am not going to thank you, and I am not going to save the plate. Joel can wash it with the others. If comfort was the true thing, then it has already happened, and this house can be ordinary for one Thursday.",
        flags: { "flags.meal.eaten": true },
        summary: "Ellis eats Christian Dobbs's meal. The body is comforted and the plate goes into the wash with the others.",
      },
      {
        id: "refused",
        choiceId: "leave_the_plate",
        choice: "Leave the plate where it is and do not feed the hands.",
        middleSpeakerId: "p.miriam_waite",
        middle: "Then it stays until the peas go dull. Chris's hands can be disappointed without this kitchen turning disappointment into a rule. I cooked what the paper said because the paper was his. You do not have to finish another man's Thursday to prove you saw his name.",
        endSpeakerId: "p.joel_waite",
        end: "I'll put it in the icebox, not on a shelf with a card under it. A plate you refused is leftovers, and leftovers are allowed to be thrown out on Friday. Mother can hate the waste. I can live with waste. I cannot live with a hamburger becoming a household job.",
        flags: { "flags.meal.refused": true },
        summary: "Ellis leaves Christian's plate. The food stays leftovers, and the hands do not get the comfort they expected.",
      },
      {
        id: "cooked_wrong",
        choiceId: "ruin_the_plate",
        choice: "Cook it wrong on purpose so the body is not comforted.",
        middleSpeakerId: "p.joel_waite",
        middle: "You put sugar on the peas and you did it where we could both see you. That is not a mistake and the hands know it, which is the point you wanted. The point is mean. It is also plain. Christian's list did not ask for a lesson, and you gave the body a bad plate instead of a lullaby.",
        endSpeakerId: "p.miriam_waite",
        end: "I understand why you spoiled it. A correct meal would have told Chris's hands they were still in Christian's Thursday, and you would not tell that lie. I do not admire the cruelty. Take the fork out of those hands. The groceries have done their honest work, and the honest work was to fail.",
        flags: { "flags.meal.cooked_wrong": true },
        summary: "Ellis cooks the meal wrong on purpose. The body is not comforted, and the household sees that the failure was chosen.",
      },
    ],
    rewards: [
      reward("stance", "reward.meal_for_christian.stance", "The household knows whether Ellis would comfort Chris's hands with Christian's own groceries."),
      reward("knowledge", "reward.meal_for_christian.knowledge", "Christian's Thursday was hamburger, canned peas, and the heel of the store bread, and the hands expected it."),
    ],
    death: death({
      mid: "Joel eats the hamburger, the peas, and the heel of bread himself at the kitchen table so the plate cannot be saved as a shrine. Ellis dies before the choice, and leftovers are easier to throw out than a story with a name on it.",
      unresolved: "The era turns with the plate undecided. Christian's list stays on the fridge, Chris's hands stay restless, and nobody writes down whether the body was allowed a comfort or refused one.",
      resolved: "The Thursday is over. The next wearing does not inherit a reheated argument about Christian Dobbs's plate, only the fact that the groceries were faced in the Orwell kitchen while Miriam was still alive.",
      sets: {},
    }),
    implications:
      "The Quiet Household either let a living body be comforted by a dead man's ordinary meal, left the food as leftovers, or spoiled it on purpose. None of those outcomes is a ceremony. The fork is just a fork afterward, and Christian's name stays attached to a Thursday rather than to a shrine.",
    alt: {
      npcId: "p.miriam_waite",
      surrogateId: "p.joel_waite",
      resolution:
        "Miriam is gone, so Joel cooks from the fridge paper himself and will not let Christian's list become a speech. He still offers the same three uses of the food, and he washes or ruins the plate without asking the house for a blessing.",
      opening: {
        speakerId: "p.joel_waite",
        text: "Mother is not here to stand at the stove and look stern about it. Christian's paper still says hamburger, canned peas, and the heel of the bread. I can feed Chris's hands, leave the plate, or ruin it on purpose so nobody calls leftovers a rite. Pick before it cools into a story.",
      },
      branches: [
        {
          id: "eaten_joel",
          choiceId: "eat_joel",
          choice: "Eat the Thursday Joel cooked from the paper.",
          endSpeakerId: "p.joel_waite",
          end: "All right. The hands stopped. I am washing this with the breakfast bowls and I am not keeping the recipe. Mother would have hated the waste of a speech more than the waste of peas. You ate. Christian's name got said once. That is the end of the groceries.",
          flags: { "flags.meal.eaten": true },
          summary: "With Miriam dead, Joel serves the meal and Ellis eats it. The plate is washed with the ordinary dishes.",
        },
        {
          id: "refused_joel",
          choiceId: "leave_joel",
          choice: "Leave Joel's plate in the icebox untouched.",
          endSpeakerId: "p.joel_waite",
          end: "Then the icebox gets it, and Friday gets the trash. I will not put a card under it because Mother is dead and I am not starting a new job in her place. The hands can be unhappy. Unhappy is not the same as a household rule about forks.",
          flags: { "flags.meal.refused": true },
          summary: "With Miriam dead, Ellis still refuses the meal. Joel treats it as leftovers and will not start a new practice.",
        },
        {
          id: "wrong_joel",
          choiceId: "ruin_joel",
          choice: "Spoil the peas on purpose and let Joel see it.",
          endSpeakerId: "p.joel_waite",
          end: "Sugar on the peas, in front of me. Fine. You wanted the hands to know they were not being tucked in. They know. I think it is a mean way to be honest and I will still eat the ruined plate myself later so it does not sit here looking like a moral. Not tonight. Tonight you said the thing.",
          flags: { "flags.meal.cooked_wrong": true },
          summary: "With Miriam dead, Ellis still ruins the meal on purpose. Joel sees the meanness and does not dress it up.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.joel_waite",
        surrogateId: "p.eden_waite",
        resolution:
          "Joel is gone, so Eden handles the plate without mocking the list he resented. Miriam may still be in the house, but the decision is Eden's to say in a whole sentence: eat, leave, or spoil, and then get on with the dishes.",
        opening: {
          speakerId: "p.eden_waite",
          text: "Joel is not here to resent the portion, and I am not going to do his resentment for him. Christian's list is still hamburger, canned peas, and the heel of the bread. Portion is groceries. I can give it to the hands, leave it, or cook it wrong. I will not make fun of the paper while I do it.",
        },
        branches: [
          {
            id: "eaten_eden",
            choiceId: "eat_eden",
            choice: "Eat, and let Eden clear the plate with the rest.",
            endSpeakerId: "p.miriam_waite",
            end: "Eden said portion and she was right. You ate the portion. My hands are not what they were, so she will wash, and I will not tell her to dry it as if Christian were still owed a towel. The body is quieter. That was the only use of the peas.",
            flags: { "flags.meal.eaten": true },
            summary: "With Joel dead, Eden names the meal as groceries and Ellis eats it. Miriam does not turn the plate into a keepsake.",
          },
          {
            id: "refused_eden",
            choiceId: "leave_eden",
            choice: "Leave the food and let Eden call it leftovers.",
            endSpeakerId: "p.eden_waite",
            end: "Then I put it away as leftovers and I say Christian's name once so we do not pretend we forgot who wrote the list. The hands do not get the comfort. I can live with that if we do not build a shelf for the refusal. Mother can be angry at the waste. Waste is cheaper than a rite.",
            flags: { "flags.meal.refused": true },
            summary: "With Joel dead, Ellis leaves the plate. Eden stores it as leftovers and says the name once without a shelf.",
          },
          {
            id: "wrong_eden",
            choiceId: "ruin_eden",
            choice: "Ruin the meal on purpose and let Eden watch.",
            endSpeakerId: "p.eden_waite",
            end: "You spoiled good food so the hands would not be lied to. I see it and I am not going to laugh, and I am not going to scold you into cooking it over. Honest and mean can sit in the same bowl. I'll dump it when you're done looking at it. The list can stay on the fridge as a list.",
            flags: { "flags.meal.cooked_wrong": true },
            summary: "With Joel dead, Ellis cooks the meal wrong. Eden lets the cruelty stay visible and then throws the food out.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.coat_at_basin",
    title: "Today's Coat",
    locationId: "loc.vergennes.falls",
    eras: ["E0"],
    characters: ["p.osier_rouleau", "p.marie_rouleau"],
    summary:
      "A coat turns in the eddy under the Vergennes falls. Osier Rouleau wants it to be the 1938 loss so he already knows the procedure. Marie Rouleau says the wool is wet from this week and belongs to somebody who is missing it today.",
    discovery:
      "You are on the basin rock because the falls are loud and the coat is already caught in the eddy. Osier has his old book open to a year he trusts. Marie is on the same rock with flour still on her cuff, and she is not letting him write the year down yet.",
    steps: [
      "Look at the coat in the eddy and hear Osier name 1938 while Marie names this week, without leaving the basin.",
      "Choose whether to shout for today's help from where you stand, or to let Osier file the coat under the old loss.",
      "Stay on the rock until the coat is either claimed as this week's or written into the procedure Osier already knows.",
    ],
    opening: {
      speakerId: "p.osier_rouleau",
      text: "Coat in the eddy, dark wool, one button gone. I have done this. Nineteen thirty-eight, we logged it, we named the year, we knew which hook to use. If it is that loss again, I know the work. Don't make me invent a new work while the water is this loud.",
      variant: {
        when: {
          background: "mill_race",
          bond: "unbound",
          ideal: "the_living_first",
          flaw: "cannot_leave_a_gate",
        },
        text: "You hate an unfinished count and I can see it in the way you look at the book. The coat is in the eddy now, this week, wet through. I would love to close it under 1938 because a closed year is a job I can finish. Marie says a living person is missing the wool. Pick the job you can stand to leave open.",
      },
    },
    branches: [
      {
        id: "today",
        choiceId: "shout_today",
        choice: "Shout for the day shift at the rail and call this coat this week's.",
        middleSpeakerId: "p.marie_rouleau",
        middle: "You shouted for the day shift and you did not climb off the rock to go find a clerk. I heard the names you used. Upper rail, night-kitchen door, whoever is short a work coat since Monday. That is a living errand done with your mouth. The wool is still in the eddy and it is not a relic.",
        endSpeakerId: "p.osier_rouleau",
        end: "All right. I shut the old page. The coat is today's, and the help you shouted for can claim it when they get to the basin edge. I do not get my procedure. Marie gets a wet coat with a chance of an owner. I will write the day of the week and nothing else, and I will hate how thin that looks.",
        flags: { "flags.coat.today": true },
        summary: "Ellis treats the coat as this week's loss and shouts for the day shift without leaving the basin. Osier closes the 1938 page.",
      },
      {
        id: "old_wound",
        choiceId: "file_1938",
        choice: "Let Osier enter the coat as the 1938 loss and use the old procedure.",
        middleSpeakerId: "p.osier_rouleau",
        middle: "Then I do the thing I know. Year first, then the hook, then the note that the basin has taken this kind of wool before. My hand is steady when the year is one I have already survived. You are giving me that steadiness. Marie is looking at me as if steadiness were a theft.",
        endSpeakerId: "p.marie_rouleau",
        end: "You let him write 1938 on a coat that was dry on somebody this morning. The procedure will be beautiful and the person missing the wool will not be in it. I am staying on this rock. I will not run your errand either. I will remember that you chose a year you could finish over a week you could not.",
        flags: { "flags.coat.old_wound": true },
        summary: "Ellis forces the coat into the 1938 story. Osier gets his procedure, and the person missing it this week is left out of the book.",
      },
    ],
    rewards: [
      reward("knowledge", "reward.coat_at_basin.knowledge", "The basin coat was wet from this week, whatever year Osier needed it to be."),
      reward("stance", "reward.coat_at_basin.stance", "Ellis either shouted for a living owner from the rock or gave Osier the 1938 procedure."),
    ],
    death: death({
      mid: "Marie hangs the coat on the basin nail where a living person can claim it, and she will not let Osier name the year. Ellis's shout dies with Ellis. The wool drips on the rock and the old page stays shut because she puts her hand on it.",
      unresolved: "The era moves on with the coat still unclaimed and the year unwritten. The falls keep the wool moving in the eddy, and neither the day shift nor the 1938 page is ever made to own it.",
      resolved: "The basin keeps the choice. Either a this-week shout went up from the rock, or the old procedure took the coat, and the next wearing does not get to reopen the wool as if nobody had spoken.",
      sets: {},
    }),
    implications:
      "Vergennes either treats the eddy coat as a loss from this week, with help shouted from the basin, or files it under 1938 so Osier can follow a procedure he already trusts. A living owner's chance and an old year's comfort do not both fit on the same line.",
    alt: {
      npcId: "p.osier_rouleau",
      surrogateId: "p.marie_rouleau",
      resolution:
        "Osier is dead, so Marie has the book and will not let a dead man's favorite year swallow a coat that is wet this week. She still forces Ellis to choose between a shout for the living and a page that knows its procedure.",
      opening: {
        speakerId: "p.marie_rouleau",
        text: "Osier is dead and his book is on the rock with the page he loved already marked. The coat in the eddy is wet from this week. I can shout for the day shift with you, or I can write the year he would have written. I will not pretend those are the same kindness. Say which one you will stand for.",
      },
      branches: [
        {
          id: "today_marie",
          choiceId: "shout_marie",
          choice: "Shout for the day shift and keep 1938 off the page.",
          endSpeakerId: "p.marie_rouleau",
          end: "Then I shout with you, from here, for the upper rail and the night-kitchen door. The coat stays today's. I will not walk it up to a desk. When the day shift comes to the edge they can claim the wool, and Osier's page can stay a page. I am not giving his death the button off this coat.",
          flags: { "flags.coat.today": true },
          summary: "With Osier dead, Marie and Ellis treat the coat as this week's and shout for the day shift from the basin.",
        },
        {
          id: "old_marie",
          choiceId: "year_marie",
          choice: "Tell Marie to enter the coat under 1938 anyway.",
          endSpeakerId: "p.marie_rouleau",
          end: "Then I write the year he wanted, and I hate my hand while it moves. The procedure gets finished. The person who wore this on Monday does not. You asked a dead man's habit to do the work of looking. I will hang the coat after, but the book will already have lied about when it got wet.",
          flags: { "flags.coat.old_wound": true },
          summary: "With Osier dead, Marie still files the coat as 1938 because Ellis asks her to finish his procedure.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.marie_rouleau",
        surrogateId: "p.osier_rouleau",
        resolution:
          "Marie is dead, so Osier is alone with the eddy and the temptation of a year he understands. He will still take a shouted name for this week if Ellis gives him one, and he will not invent Marie's objection in a softer voice.",
        opening: {
          speakerId: "p.osier_rouleau",
          text: "Marie is dead and the coat does not care. It is in the eddy, dark wool, one button gone. I want it to be 1938 because I know that page. She would have said it was wet this week. She is not here to say it. You say whether I shout for the day shift or whether I finish the old job.",
        },
        branches: [
          {
            id: "today_osier",
            choiceId: "shout_osier",
            choice: "Make Osier shout for the day shift and write this week.",
            endSpeakerId: "p.osier_rouleau",
            end: "I shouted. Upper rail, day shift, a coat short since Monday. I did not leave the rock and I did not open 1938. The page looks thin. Marie would have liked it thin. I will not like it. The wool can be claimed by somebody living, which is the trouble she would have insisted on.",
            flags: { "flags.coat.today": true },
            summary: "With Marie dead, Osier still abandons 1938 and shouts for this week's owner from the basin.",
          },
          {
            id: "old_osier",
            choiceId: "file_osier",
            choice: "Let Osier use the 1938 procedure with no one to stop him.",
            endSpeakerId: "p.osier_rouleau",
            end: "Then the year goes in, and the hook, and the note. I know this work and the knowing is a relief I am ashamed of, because she is dead and cannot slap the book. The coat becomes the old loss. If a living person is missing it, they will have to argue with a page that has already decided.",
            flags: { "flags.coat.old_wound": true },
            summary: "With Marie dead, Osier files the coat under 1938 and gets the procedure he wanted.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.sugarhouse_acres",
    title: "The Sugarhouse Acres",
    locationId: "loc.new_haven.sugarhouse",
    eras: ["E2"],
    characters: ["p.nell_harrow"],
    summary:
      "The sugarhouse ledger and the county map do not show the same maple acres. Fixing the number makes the Harrow homestead pay what it owes, and the bill will hurt. Leaving the wrong acres keeps a kind tax and a false map. Nell talks about the debt, not a verdict.",
    discovery:
      "The ledger is already open on the bench above the arch, and the county map is folded beside it with a pencil holding the crease. You are in the sugarhouse because the boil is going and Nell Harrow has both numbers in front of her. Nobody has to walk to a clerk for the argument to be real.",
    steps: [
      "Read the sugarhouse ledger against the county map while the boil is going, both of them already on the bench.",
      "Choose whether the homestead will pay the acres it owes or keep the kind, smaller number.",
      "Tell Nell which figure she is willing to be resented for, and leave the ledger as that choice makes it.",
    ],
    opening: {
      speakerId: "p.nell_harrow",
      text: "The sugarhouse book says forty-one acres in the maples. The county map says sixty-two. The difference is a kindness with a number on it. Fix it and we pay. Leave it and I read a lie every boil. I am not asking the row for a verdict. I am asking what we are willing to owe.",
      variant: {
        when: {
          background: "intervale",
          bond: "harrow_homestead",
          ideal: "the_record_holds",
          flaw: "spares_a_kind_lie",
        },
        text: "You like a page that tells the truth, and you also flinch when the truth sends a bill to a house you answer for. Forty-one in the ledger, sixty-two on the map. The kind number is the false one. If you spare us the tax, say you are sparing us. Don't call the forty-one a measurement.",
      },
    },
    branches: [
      {
        id: "fixed",
        choiceId: "fix_the_acres",
        choice: "Correct the ledger to the map and let the homestead pay.",
        middleSpeakerId: "p.nell_harrow",
        middle: "Then I strike forty-one and I write sixty-two, and I initial it so the clerk cannot pretend the sugarhouse disagreed with itself. The boil does not care. The tax will. Mother will hear the number and she will not call it poetry. Good. I don't want poetry in a ledger.",
        endSpeakerId: "p.nell_harrow",
        end: "It's fixed. We will pay what the maples actually cover, and we will feel it in a year when the syrup price is ordinary. Louis, if that is the name your mouth is using today, you don't get to comfort me about it. The row owed taxes. It did not owe us a softer acre.",
        flags: { "flags.sugar.fixed": true },
        summary: "Nell corrects the sugarhouse acres to the county map. The homestead will pay the harder, true bill.",
      },
      {
        id: "left",
        choiceId: "leave_the_acres",
        choice: "Leave the wrong acres so the kind tax stays in place.",
        middleSpeakerId: "p.nell_harrow",
        middle: "Then forty-one stays, and I do not initial a correction I am refusing to make. The map can be right in the drawer and wrong in the bill. That is a common arrangement in this county. I want you to hear me not dressing it up. I am choosing the cheaper lie because the cheaper lie pays for sugar wood.",
        endSpeakerId: "p.nell_harrow",
        end: "The book stays wrong. If anyone calls it mercy, they can do it outside this sugarhouse. I won't. We keep the kind tax and we keep a false map, and I will see both numbers every time I boil. That is the cost of not paying. It is not a verdict. It is an invoice we decided not to receive.",
        flags: { "flags.sugar.left": true },
        summary: "Nell leaves the ledger acres wrong. The tax stays kind, the map stays false, and she will not call that mercy.",
      },
    ],
    rewards: [
      reward("record", "reward.sugarhouse_acres.record", "The sugarhouse ledger either matches the county map or keeps the kind, wrong acreage on purpose."),
      reward("knowledge", "reward.sugarhouse_acres.knowledge", "The book said forty-one maple acres and the county map said sixty-two, and the gap was a tax."),
    ],
    death: death({
      mid: "The ledger stays wrong, forty-one where the map says sixty-two, and Nell does not call it mercy out loud. Ellis dies before the strike-through. She closes the book, keeps the kind tax, and refuses the softer word.",
      unresolved: "The era advances with both numbers still sitting on the bench in memory if not in fact. No one has initialed a correction, and the homestead has not admitted whether it meant to keep the kindness.",
      resolved: "The sugarhouse number is settled for this boil and the ones after it. Either the bill goes up because the acres were fixed, or the false ledger remains as a choice Nell will not prettify.",
      sets: {},
    }),
    implications:
      "The Harrow homestead either starts paying tax on the maple acres the county map already knew, or it keeps a kinder bill and a book Nell can see is false. The row is not forgiven or condemned. It is priced.",
    alt: {
      npcId: "p.nell_harrow",
      surrogateId: "p.maeve_harrow",
      resolution:
        "Nell is dead, so Maeve stands at the arch with her daughter's ledger and will not pretend the acreage is a family riddle. She can fix the tax or leave the kind number, and she will not call either choice a blessing on the row.",
      opening: {
        speakerId: "p.maeve_harrow",
        text: "Nell is dead. Her book says forty-one. The map says sixty-two. She would have talked taxes until the room behaved. I talk like the row has been lied about. I can still fix the number or leave the kindness. Don't ask me to sound like her. Choose the bill.",
      },
      branches: [
        {
          id: "fixed_maeve",
          choiceId: "fix_maeve",
          choice: "Have Maeve strike the kind acres and pay the true ones.",
          endSpeakerId: "p.maeve_harrow",
          end: "Sixty-two. I wrote it. The homestead will pay and the payment will hurt, which is how I know the number was late and not holy. Nell can be dead and still be right about the tax. I will not add a speech. The arch can finish the boil.",
          flags: { "flags.sugar.fixed": true },
          summary: "With Nell dead, Maeve corrects the acres. The homestead pays, and she refuses to turn the bill into a speech.",
        },
        {
          id: "left_maeve",
          choiceId: "leave_maeve",
          choice: "Tell Maeve to leave the ledger's forty-one acres in place.",
          endSpeakerId: "p.maeve_harrow",
          end: "Then the lie stays, and I will not call it mercy. Nell wouldn't have either. I am keeping a kind tax because the year is already expensive, and I am telling you that plainly. The map is in the drawer. Anyone who wants the truth can unfold it and then explain the money.",
          flags: { "flags.sugar.left": true },
          summary: "With Nell dead, Maeve leaves the wrong acres. She keeps the kind tax and will not call the lie a kindness out loud.",
        },
      ],
    },
  }),

  standalone({
    id: "q.scion_sale",
    title: "June's Wood",
    locationId: "loc.middlebury.exchange",
    eras: ["E1"],
    characters: ["p.kit_downing"],
    summary:
      "Kit Downing is selling scion wood from June Harrow's tree in the exchange yard. June would have given the sticks away. Maeve would keep them until they rotted into a principle. Kit is not gloating. He thinks wood should travel, and the sale can be stopped, paid for with the truth, or allowed.",
    discovery:
      "The sticks are already on a crate behind the feed store, mud on the twine, a paper tag in Kit's hand. You are in the Saturday yard because that is where the wood is. Ada's shoes are in the same mud. Nothing has to be carried anywhere for the sale to be real.",
    steps: [
      "Hear Kit say, in the exchange yard, that the sticks are June Harrow's scion wood and that he means to sell them cheap.",
      "Choose whether to expose the sale here, to speak the orchard stake truth as the price of stopping it, or to let the wood travel.",
      "Finish the talk before the sticks leave the crate or go back into the sack, with the yard still the whole scene.",
    ],
    opening: {
      speakerId: "p.kit_downing",
      text: "June would have given this wood away over a fence and been done. Maeve will keep it until it rots into a principle with her name on the rot. I am selling it cheap so it becomes a tree in somebody else's ground. Call that a theft if you need a short word. I need a longer one.",
      variant: {
        when: {
          background: "intervale",
          bond: "harrow_homestead",
          ideal: "names_aloud",
          flaw: "signs_unread",
        },
        text: "You get restless when a true thing is sitting unspoken next to a price. These sticks are June's. The tag does not say her name. I will sell them unless you say something in this yard that is heavier than the tag. I am not daring you. I am telling you the wood is about to move.",
      },
    },
    branches: [
      {
        id: "exposed",
        choiceId: "expose_sale",
        choice: "Say in the yard whose tree this wood was cut from.",
        middleSpeakerId: "p.kit_downing",
        middle: "You said June Harrow's name loud enough for the next crate to hear, and you said the sticks were not mine to price. The man who was reaching for his wallet put his hand back in his coat. That is as stopped as a yard sale gets. Nobody is going to write a notice. They just won't buy.",
        endSpeakerId: "p.kit_downing",
        end: "The sale is done here. I still think a tree in another dooryard would have been a better monument than a sack in Maeve's patience, but I am not going to hawk June's wood after you made the yard look at me. Take the sticks or leave them. I am not wrapping them for a stranger now.",
        flags: { "flags.scion.exposed": true },
        summary: "Ellis exposes the sale in the yard. Kit's buyers step back, and June's scion wood does not travel from this Saturday.",
      },
      {
        id: "traded",
        choiceId: "trade_the_stake",
        choice: "Trade the truth about the orchard stake, spoken here, to stop the sale.",
        middleSpeakerId: "speaker.ellis",
        middle: "Ivo Perch moved the iron stake. The south block is Harrow silt, not county timber. I am saying that in this yard as the price of the sticks staying unsold. You do not get June's wood and the secret both. The mud can hear it. I am not walking it up to a different office to make it cleaner.",
        endSpeakerId: "p.kit_downing",
        end: "Then I am not selling. The sticks go back in the sack. I wanted them to become a tree somewhere else, and you paid me a sentence about the stake instead. I am taking the sentence. Don't expect me to look holy. Maeve can still rot the wood into a principle if she gets the sack back. That is her trouble now, not mine.",
        flags: { "flags.scion.traded_truth": true, "flags.orchard.truth_told": true },
        summary: "Ellis speaks the orchard stake truth in the yard as the price of stopping Kit's sale. The wood does not travel, and the stake is no longer hidden.",
      },
      {
        id: "travel",
        choiceId: "let_wood_travel",
        choice: "Let Kit sell the wood and let it leave the yard.",
        middleSpeakerId: "p.kit_downing",
        middle: "Then I take the man's money and I give him two bundles, and I tell him to graft them where they will get sun and not a speech. June liked a graft that was allowed to fail in public. A tree in another town is public enough. You are letting it happen. I notice you not making a scene, and I am grateful without performing it.",
        endSpeakerId: "p.kit_downing",
        end: "The wood is traveling. I sold it as itself, not as a relic, and the buyer knows it came off a Harrow tree because I said so when you didn't stop me. Maeve will call this a loss of principle. I call it a tree that might take. If it fails, it fails somewhere the row does not have to watch.",
        flags: { "flags.scion.let_travel": true },
        summary: "Ellis lets June's scion wood travel. Kit sells it cheap so it can become a tree off the Harrow row.",
      },
    ],
    rewards: [
      reward("token", "reward.scion_sale.token", "A stick of June's scion wood either stays in the sack, goes back to the row, or leaves in a buyer's hand as proof of the yard's choice."),
      reward("stance", "reward.scion_sale.stance", "Ellis either exposed the sale, paid for stopping it with the stake truth, or let the wood travel."),
    ],
    death: death({
      mid: "Kit sells two sticks and keeps the rest in his pocket. Ellis dies before the yard can be made to look. The buyer gets a little wood. The sack is not a principle and not a gift. It is a pocket.",
      unresolved: "The Saturday ends with the sticks still on the crate and no one having said June's name, the stake, or a price that stuck. The wood is neither stopped nor truly sold. It is only waiting on the next hand.",
      resolved: "The yard has already done the thing. June's wood was exposed, bought off with the truth about the stake, or allowed to travel, and a later season does not get to pretend the crate was never there.",
      sets: {},
    }),
    implications:
      "June Harrow's scion wood either stops in the exchange yard because the sale was named, stops because Ellis spoke the stake truth as a price, or leaves to become a tree somewhere else. Maeve's principle and June's giving cannot both be obeyed.",
    alt: {
      npcId: "p.kit_downing",
      surrogateId: "p.nell_harrow",
      resolution:
        "Kit is dead, so Nell, twenty and already tired of principles, stands at his crate with the sticks. She can expose them, take the stake truth as a reason to hold them, or let the next buyer carry them off. She talks like a tax, not like a eulogy.",
      opening: {
        speakerId: "p.nell_harrow",
        text: "Kit is dead. His sticks are still on the crate and the man beside me will buy them if nobody speaks. Mother would keep them until they rot. June would have given them away. I am twenty. I want a result I can explain without a poem. Tell me which trouble you want in this mud.",
      },
      branches: [
        {
          id: "exposed_nell",
          choiceId: "expose_nell",
          choice: "Have Nell say June's name and stop the sale here.",
          endSpeakerId: "p.nell_harrow",
          end: "June Harrow. These are her sticks and they are not for sale this Saturday. I said it loud. The man's wallet stayed in his coat. I will take the sack back to the row and I will not promise Mother a principle. I promise her the wood is still wood. That is the tax I can stand.",
          flags: { "flags.scion.exposed": true },
          summary: "With Kit dead, Nell exposes the wood as June's and stops the sale in the yard.",
        },
        {
          id: "traded_nell",
          choiceId: "trade_nell",
          choice: "Speak the stake truth here and have Nell hold the wood.",
          endSpeakerId: "p.nell_harrow",
          end: "I heard you. Ivo moved the stake. The south block is our silt, not county timber. You said it in the yard, so the price is paid and I am not selling. The sticks go home in the sack. I don't know yet if that makes me Mother. I know it stops a sale. Don't ask me to look grateful for a secret.",
          flags: { "flags.scion.traded_truth": true, "flags.orchard.truth_told": true },
          summary: "With Kit dead, Ellis still speaks the stake truth in the yard. Nell stops the sale and keeps the wood.",
        },
        {
          id: "travel_nell",
          choiceId: "travel_nell",
          choice: "Tell Nell to let the next buyer take the sticks.",
          endSpeakerId: "p.nell_harrow",
          end: "Then they travel. I took his money and I told him the tree's name because I am not a sneak, only a person letting wood leave. Mother will hate the receipt. June might have hated the receipt too and still wanted the graft to happen somewhere. I can live with being hated for a tree.",
          flags: { "flags.scion.let_travel": true },
          summary: "With Kit dead, Nell lets the scion wood travel and says June's name without stopping the sale.",
        },
      ],
    },
  }),

  standalone({
    id: "q.intervale_cows",
    title: "The Cows' Path",
    locationId: "loc.new_haven.orchard",
    eras: ["E4"],
    characters: ["p.asa_harrow", "p.carl_abbott"],
    summary:
      "Carl Abbott's cows use a path across the Harrow intervale because the flood moved the fence and his family kept walking. Asa is thirty-seven and wants the grass decided without a legend. Possession is not pretty, and it is how pastures work.",
    discovery:
      "The cows are already on the intervale grass, and the fence that should have stopped them is lying where the high water left it. You are at the south block because Asa Harrow and Carl Abbott are both looking at the same hoof prints. The path is the argument. The paper that would describe it is not required for the grass to be decided.",
    steps: [
      "Walk the hoof-cut path only as far as the broken fence and hear how long the Abbotts have been using it.",
      "Choose whether the path stays with Asa and the cows are turned, or whether the cows keep the walking they already do.",
      "Say the decision where both men can hear it, and leave the fence for the season it was given.",
    ],
    opening: {
      speakerId: "p.asa_harrow",
      text: "The fence went with the high water. Carl's family kept walking the cows across our intervale because the grass was here and the wire wasn't. He is honest about it. Possession is how pastures work and it is not pretty. I am thirty-seven. I want the grass decided, not inherited as a mood.",
      variant: {
        when: {
          background: "intervale",
          bond: "harrow_homestead",
          ideal: "water_has_its_level",
          flaw: "spares_a_kind_lie",
        },
        text: "You don't like arguing with where water put a fence, and you also don't like correcting a habit that has been feeding somebody's cows. The wire is down. The path is worn. If you spare Carl a hard sentence, the grass stays his by use. If you spare me a false neighborliness, the cows get turned. Water already voted. You are the one left.",
      },
    },
    branches: [
      {
        id: "asa_path",
        choiceId: "turn_the_cows",
        choice: "Leave the path with Asa and turn Carl's cows back.",
        middleSpeakerId: "p.carl_abbott",
        middle: "Then I turn them. Not with a speech and not with a shove worth telling about. I walk the lead cow back to where the wire used to hold and the others follow because they are cows. I have been using your grass since the flood. You are taking the use back. I understand it. I don't have to enjoy it.",
        endSpeakerId: "p.asa_harrow",
        end: "The path stays ours and the cows are off it. I will mend what I can before the next rain and I will not tell a story about victory at supper. Carl was not a thief. He was a man whose animals kept eating. Chris, if the hands fixing that fence are yours, don't make them heroic. Wire is wire.",
        flags: { "flags.row.asa": true },
        summary: "The intervale path stays with Asa. Carl turns the cows back, and the use since the flood is ended without a speech.",
      },
      {
        id: "carl_path",
        choiceId: "leave_the_cows",
        choice: "Leave the path under Carl's cows and let them keep walking.",
        middleSpeakerId: "p.carl_abbott",
        middle: "Then they keep the path. I won't pretend the flood signed a paper. I will say we walked it every season the wire was down, and walking is the right I actually have. Asa can hate that and still be my neighbor. I would rather he hate a true use than like a fence I have not put back.",
        endSpeakerId: "p.asa_harrow",
        end: "The cows stay. I am not going to call it generosity. I am calling it the pasture as it is being used, which is Carl's sentence and also the ground. Possession isn't pretty. I will live beside it. If I change my mind I will change the wire, not the story, and I will say so before hay.",
        flags: { "flags.row.carl": true },
        summary: "The path stays with Carl's cows. Asa accepts the use without calling it a gift, and the fence is not made into a legend.",
      },
    ],
    rewards: [
      reward("stance", "reward.intervale_cows.stance", "Ellis stood where the flood left the fence and chose whose feet the intervale path belongs under."),
      reward("access", "reward.intervale_cows.access", "Either the Harrows have the path back or Carl's cows may keep walking it, and the other house knows which."),
    ],
    death: death({
      mid: "The cows keep walking, and Asa fixes the fence in the spring without a speech. Ellis dies before the path is given to either name. The wire goes back up later as work, not as a verdict delivered in the orchard.",
      unresolved: "The season ends with the fence still down and the cows still on the grass. No one has said whether the walking is a right or a habit that can be ended, and the intervale stays undecided under their hooves.",
      resolved: "The path has an owner in practice. Either Asa took it back and the cows were turned, or Carl's use was left in place, and the next year does not get to pretend the flood still needs a conversation.",
      sets: {},
    }),
    implications:
      "The Harrow intervale path either returns to Asa, with Carl's cows turned back to the old fence line, or stays under the Abbotts' use because they kept walking after the flood. The pasture is decided by that sentence and not by a prettier story about water.",
    alt: {
      npcId: "p.asa_harrow",
      surrogateId: "p.nell_harrow",
      resolution:
        "Asa is dead, so Nell stands on the intervale she thought she had handed on. She will turn the cows or leave them, and she will not let Carl's honesty become a eulogy for her son. The grass still needs a sentence.",
      opening: {
        speakerId: "p.nell_harrow",
        text: "Asa is dead and the cows did not notice. Carl is still walking them where the flood laid our fence down. I can turn them in my son's place or I can leave the use where it is. I will not call either choice a memorial. Tell me who has the path before I get too old to mean it.",
      },
      branches: [
        {
          id: "asa_nell",
          choiceId: "turn_nell",
          choice: "Have Nell turn the cows and keep the path Harrow.",
          endSpeakerId: "p.carl_abbott",
          end: "Nell said turn, so I turn them. Asa isn't here to watch me do it politely, and I will do it politely anyway because the cows shouldn't pay for a death. The path is Harrow again. I had the use of it. Use is not a deed. I know the difference. I don't have to like meeting it.",
          flags: { "flags.row.asa": true },
          summary: "With Asa dead, Nell takes the path back. Carl turns the cows and does not pretend use was a deed.",
        },
        {
          id: "carl_nell",
          choiceId: "keep_nell",
          choice: "Tell Nell to leave the walking cows where they are.",
          endSpeakerId: "p.nell_harrow",
          end: "Then Carl's cows keep it. I am not donating a path in Asa's name. I am refusing to move animals the flood already moved a fence for, and I am saying that without a ribbon on it. If the wire goes up later it will be a new decision. This one is: they walk.",
          flags: { "flags.row.carl": true },
          summary: "With Asa dead, Nell leaves the path to Carl's cows and refuses to call that a memorial gift.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.carl_abbott",
        surrogateId: "p.nina_abbott",
        resolution:
          "Carl is dead, so Nina answers for the cows without wanting the family to remain a boundary dispute. Asa is still on the grass. Between them the path can be taken back or left under the herd, and the hours of explaining it will belong to the living.",
        opening: {
          speakerId: "p.nina_abbott",
          text: "My father is dead and the cows still know the path. I mow what I'm given and I explain the rest at town meeting if you reopen it. Asa wants the grass decided. I want us to stop being a fence with opinions. Turn them or leave them, and bring the hours the choice will cost.",
        },
        branches: [
          {
            id: "asa_nina",
            choiceId: "turn_nina",
            choice: "Turn the cows with Nina and give the path back to Asa.",
            endSpeakerId: "p.asa_harrow",
            end: "Nina walked them back and did not make me a speech about her father. The path is ours again. I will fix the fence in the spring as work, not as a triumph over a dead neighbor. The flood moved the wire. We moved the cows. I can tell those apart.",
            flags: { "flags.row.asa": true },
            summary: "With Carl dead, Nina turns the cows. Asa keeps the path and treats the fence repair as work.",
          },
          {
            id: "carl_nina",
            choiceId: "keep_nina",
            choice: "Let Nina's cows keep the path they already walk.",
            endSpeakerId: "p.nina_abbott",
            end: "Then we keep walking them. I won't call it my father's victory. I'll call it the way the herd already goes, and I will say that at town meeting if someone with a form asks. Asa can put the wire up when he means a new thing. Today the hooves stay.",
            flags: { "flags.row.carl": true },
            summary: "With Carl dead, Nina keeps the cows on the path. The use continues without being called a victory.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.cousin_at_the_landing",
    title: "Peter's Other Shore",
    locationId: "loc.addison.chimney_point",
    eras: ["E4"],
    characters: ["p.irene_voss", "p.lena_voss"],
    summary:
      "Irene Voss has come only as far as the Vermont landing to ask whether Peter Voss can be named where his other people stand. Lena has to decide if the dead belong to the landing that watched the ice, or if the name can be released in a sentence toward the other shore.",
    discovery:
      "Irene is already on the Vermont side of Chimney Point with her coat buttoned and no bag packed for a crossing. Lena has the landing log on the rail. Cal is four years dead and not in this talk. The question is a sentence about Peter, and the lake stays where it is.",
    steps: [
      "Hear Irene ask, on the Vermont landing only, whether Peter can be named among his other people.",
      "Decide with Lena whether the log keeps Peter as this shore's dead or releases his name in a sentence.",
      "Speak the decision at the rail so the log can hold it, without anyone leaving the landing to perform it.",
    ],
    opening: {
      speakerId: "p.irene_voss",
      text: "I didn't come to take your bridge and I didn't come to be walked across the lake. I came to ask whether Peter can be named where his other people stand. You can refuse. Do it in a whole sentence. I have a memorial on the other shore and a cousin who will not let a blank become a kindness.",
      variant: {
        when: {
          background: "crossing",
          bond: "voss_crossing",
          ideal: "names_aloud",
          flaw: "keeps_a_second_copy",
        },
        text: "You keep two copies when one record feels like a loss, and I can see you wanting Peter written here and also over there. Lena will not love a double entry. I am asking for a release, not a second plaque. If the name is going to be said among his other people, somebody on this landing has to allow the sentence.",
      },
    },
    branches: [
      {
        id: "landing",
        choiceId: "keep_peter_here",
        choice: "Keep Peter as the landing's dead and say so in a whole sentence.",
        middleSpeakerId: "p.lena_voss",
        middle: "Then he stays in this log. My grandfather went through the ice on the Vermont side, and the landing watched it, and the watching is not nothing. Irene can be disappointed in a complete way. I will not smudge the line to make two shores feel fair. Fair is not a column I have.",
        endSpeakerId: "p.irene_voss",
        end: "All right. You refused in a whole sentence, which is what I asked, and I am not going to pretend it was a small refusal. Peter remains yours in the book. I will go home by the road I came, still on this side until the road takes me, and I will tell them the landing kept him. I won't invent a warmer answer.",
        flags: { "flags.cousin.landing": true },
        summary: "Peter stays the landing's dead. Irene's request is refused in a full sentence, and nobody crosses the lake to soften it.",
      },
      {
        id: "release",
        choiceId: "release_the_name",
        choice: "Release Peter's name toward the other shore, in a sentence, from here.",
        middleSpeakerId: "p.lena_voss",
        middle: "Then I say it here, and I do not get in a car. Peter Voss may be named where his other people stand. This landing watched him die and does not own the only mouth that can say him. I am writing that beside his line so the log is not blank and not a locked door. Irene, that is the release. It is not a trip.",
        endSpeakerId: "p.irene_voss",
        end: "I heard the sentence. I am not asking you to come with me, and I am not asking the bridge to do a ceremony. The name can be said on the other shore because you allowed it from this rail. I will still call this the place that watched. I just won't call it the only place allowed to speak.",
        flags: { "flags.cousin.ny": true },
        summary: "Lena releases Peter's name in a sentence from the Vermont landing. The other shore may say him, and no one makes a trip of it.",
      },
    ],
    rewards: [
      reward("record", "reward.cousin_at_the_landing.record", "The landing log either keeps Peter as this shore's dead or notes that his name was released toward the other memorial."),
      reward("stance", "reward.cousin_at_the_landing.stance", "Ellis stood at Chimney Point while Lena refused Irene or gave the name away in a sentence."),
    ],
    death: death({
      mid: "Lena keeps Peter's name in the landing log because a blank line frightens her more than Irene's disappointment. Ellis dies before a release can be said. Irene gets a whole sentence of refusal and the road home, not a crossing.",
      unresolved: "Irene leaves without an answer she can repeat, and the log stays as Cal left it. Peter is neither released nor freshly claimed. The landing simply has not decided whether a state line owns a dead man.",
      resolved: "The rail has a sentence in it now. Peter is either the landing's dead on purpose, or his name has been released toward the other shore without anyone leaving Vermont to prove it.",
      sets: {},
    }),
    implications:
      "Peter Voss is either kept as the Chimney Point dead, because the Vermont landing watched the ice, or his name is released in one sentence so his other people may say it. The lake is not crossed. The log is.",
    alt: {
      npcId: "p.irene_voss",
      surrogateId: "p.lena_voss",
      resolution:
        "Irene is dead, so the request arrives as a letter Lena will not treat as poetry and as a decision she still has to make. She can keep Peter in the landing log or release the name without an audience from the other shore.",
      opening: {
        speakerId: "p.lena_voss",
        text: "Irene is dead. Her question is not. She wanted Peter named where his other people stand, and she wanted the refusal, if I refused, to be a whole sentence. I can keep him as the landing's dead or I can release the name from this rail. I will not make the lake do the work.",
      },
      branches: [
        {
          id: "landing_lena",
          choiceId: "keep_lena",
          choice: "Keep Peter in the landing log and let Lena say the refusal.",
          endSpeakerId: "p.lena_voss",
          end: "He stays. I am sorry she is dead and I am not sorry enough to blank the line. The landing watched the ice. That is the claim. If her people say him anyway, they will be speaking over a book that did not release him. I can live with being the disappointing cousin in a sentence she asked for.",
          flags: { "flags.cousin.landing": true },
          summary: "With Irene dead, Lena still keeps Peter as the landing's dead and says the refusal without an audience.",
        },
        {
          id: "release_lena",
          choiceId: "release_lena",
          choice: "Have Lena release the name from the rail with Irene gone.",
          endSpeakerId: "p.lena_voss",
          end: "Peter Voss may be named where his other people stand. I am writing that, and I am not traveling to watch them do it. Irene is dead so she does not get to hear me. The log still hears me. A blank would have frightened me more than giving the name away. This is not a blank. This is a release.",
          flags: { "flags.cousin.ny": true },
          summary: "With Irene dead, Lena releases Peter's name in the log anyway, from the Vermont rail, and does not travel.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.lena_voss",
        surrogateId: "p.noah_voss",
        resolution:
          "Lena is dead, so Noah has the log and Irene still has the question. He will not poeticize his mother's book. He can keep Peter as the landing's dead or release the name in one plain sentence from the Vermont side.",
        opening: {
          speakerId: "p.noah_voss",
          text: "My mother is dead and the log is mine for this hour. Irene wants Peter said where his other people stand. I pump gas and I keep pages. I don't have a column for who owns a grandfather. Keep him here or release the name. Do it in words I can write without a poem.",
        },
        branches: [
          {
            id: "landing_noah",
            choiceId: "keep_noah",
            choice: "Tell Noah to keep Peter in the landing's dead.",
            endSpeakerId: "p.irene_voss",
            end: "Then the boy wrote it the way his mother would have, only shorter. Peter stays the landing's. I asked for a whole sentence and I got one. I am not going to punish a young man for inheriting a shore. I will tell the other people the book held. That is the disappointment, complete.",
            flags: { "flags.cousin.landing": true },
            summary: "With Lena dead, Noah keeps Peter in the landing log. Irene accepts the refusal without asking him to cross.",
          },
          {
            id: "release_noah",
            choiceId: "release_noah",
            choice: "Have Noah release Peter's name in one sentence from the rail.",
            endSpeakerId: "p.noah_voss",
            end: "I wrote it. Peter can be named on the other shore. I did not make it pretty and I am not driving anybody anywhere. The landing still watched the ice. Watching is not ownership. Irene can take the sentence. The log has it too, so we are not blank, which would have scared my mother worse than generosity.",
            flags: { "flags.cousin.ny": true },
            summary: "With Lena dead, Noah releases Peter's name from the Vermont landing in a plain sentence and does not make a trip of it.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.goshen_post",
    title: "One Foot of Dooryard",
    locationId: "loc.goshen.corner_post",
    eras: ["E5"],
    characters: ["p.alma_gray", "p.ned_seaver"],
    summary:
      "A corner post sits one foot inside the only flat place Alma Gray has for a chair, in Goshen. Moving it makes the line true and the dooryard cruel. Leaving it keeps the chair and makes the map a kindness that is also false. Ned hates both speeches and still wants one.",
    discovery:
      "The post is already in the dooryard, and the chair is already beside it because that is the only level ground. You are in Goshen because Alma lives here and Ned walked up with the measurement. There is no crowd. There is one foot, one chair, and two ways to be wrong.",
    steps: [
      "Stand in Alma Gray's dooryard and see the one foot between the corner post and a true line.",
      "Choose whether the post moves, and the chair goes to the slope, or the post stays and the map stays kind.",
      "Say the choice so Ned has the speech he hates and Alma has a place to sit or a reason to resent you.",
    ],
    opening: {
      speakerId: "p.alma_gray",
      text: "One foot. The post is in the only flat I have for a chair. Move it if the line is true and I will sit on the slope, and I will not forgive you out loud. Leave it if you want me comfortable and the map wrong. I have lived with worse wrongness. I would like the chair.",
      variant: {
        when: {
          background: "survey_desk",
          bond: "unbound",
          ideal: "the_record_holds",
          flaw: "spares_a_kind_lie",
        },
        text: "You want the post to tell the truth, and you also hate to take a chair from an old woman for the sake of a foot. Ned is waiting to hate whichever speech you pick. Alma has already said she would like to sit. If you spare her, the map stays false. If you spare the record, she sits on the slope. Don't call either one gentle.",
      },
    },
    branches: [
      {
        id: "moved",
        choiceId: "move_the_post",
        choice: "Move the post the one foot and let the chair lose its flat.",
        middleSpeakerId: "p.ned_seaver",
        middle: "Then we move it. I hate the speech where a chair is a crime against a measurement, and I am making that speech anyway because you picked it. One foot. The line gets true. Alma's flat place gets smaller. I will not add a proverb about Goshen. The post comes out of the ground and goes where the number says.",
        endSpeakerId: "p.alma_gray",
        end: "It's moved. I will put the chair on the slope and I will not forgive a survey out loud, even a true one. You can write the foot down as corrected. I will write nothing. When the next person with an instrument comes, they will find me uncomfortable and accurate. I suppose that is what you wanted. I wanted the chair.",
        flags: { "flags.goshen.moved": true },
        summary: "The Goshen post is moved one foot. Alma's dooryard is true and smaller, and she does not forgive it out loud.",
      },
      {
        id: "left",
        choiceId: "leave_the_post",
        choice: "Leave the post and let Alma keep the only flat chair.",
        middleSpeakerId: "p.ned_seaver",
        middle: "Then it stays, and I hate the speech where a foot of mercy is called a measurement. I am making it anyway. The map will be kind and false. Alma sits. The next kid with a better instrument will call her a thief unless somebody remembers we chose this. I am remembering it. I am not dressing it up.",
        endSpeakerId: "p.alma_gray",
        end: "Leave it. I will sit. I know the post is one foot inside my life and inside the line, and I am not confused about which of those I picked. You wanted me comfortable. I am comfortable and the map is wrong. If that eats at you, let it eat. I have the chair, which is the thing I asked for.",
        flags: { "flags.goshen.left": true },
        summary: "The post stays one foot inside Alma's flat. The map remains kind and false, and the chair stays usable.",
      },
    ],
    rewards: [
      reward("record", "reward.goshen_post.record", "The Goshen corner is either corrected by one foot or left knowingly wrong so a chair can stay level."),
      reward("stance", "reward.goshen_post.stance", "Ellis chose between a true line that shrinks Alma's dooryard and a kind map that keeps her chair."),
    ],
    death: death({
      mid: "The post stays, and Alma sets the chair on the flat and does not forgive a surveyor who never came. Ellis dies before the foot can be moved or defended. Ned has no speech to hate. The dooryard keeps its lie and its comfort.",
      unresolved: "The season ends with the post still one foot into the only level ground and nobody having chosen whether that foot is a theft or a mercy. Alma sits, but she sits in an argument that was never finished.",
      resolved: "Goshen has the foot decided. Either the post was moved and the chair went to the slope, or the post was left and the map stayed kindly false, and Alma knows which unforgiveness she is owed.",
      sets: {},
    }),
    implications:
      "Alma Gray's dooryard is either made true, and her only flat chair goes to the slope, or left one foot wrong so she can sit in comfort. Ned has the speech he hated. The corner will not pretend the choice was neutral.",
    alt: {
      npcId: "p.alma_gray",
      surrogateId: "p.ned_seaver",
      resolution:
        "Alma is dead, so Ned stands in a dooryard whose chair he does not get to use as an excuse. He still hates both speeches. He can move the post now that comfort has left, or leave the false foot because she asked for the chair and the chair is empty.",
      opening: {
        speakerId: "p.ned_seaver",
        text: "Alma is dead. The chair is still on the only flat, and the post is still one foot into it. I hate the speech where we call that mercy and I hate the speech where we call the chair a crime. She isn't here to want the seat. You are here. Make one anyway. I will write what you make.",
      },
      branches: [
        {
          id: "moved_ned",
          choiceId: "move_ned",
          choice: "Move the post now that Alma cannot sit in the argument.",
          endSpeakerId: "p.ned_seaver",
          end: "Moved. The line is true and the flat is smaller and the chair has nobody in it, which makes this feel cleaner than it is. She said she would not forgive it out loud. She can't. I won't pretend her silence is consent. I moved a post. The map matches the ground. That is the whole virtue, and it is small.",
          flags: { "flags.goshen.moved": true },
          summary: "With Alma dead, Ned moves the post. The line is true, and he does not treat her absence as consent.",
        },
        {
          id: "left_ned",
          choiceId: "leave_ned",
          choice: "Leave the false foot because Alma wanted the chair.",
          endSpeakerId: "p.ned_seaver",
          end: "It stays. She wanted the chair and the chair is empty and I am still leaving the lie because the request was about the flat, not about her pulse. The map is kind and false. I hate that sentence and it is the true one. The next instrument can call the dooryard a theft. They will be late.",
          flags: { "flags.goshen.left": true },
          summary: "With Alma dead, Ned leaves the post. The kind, false foot remains because she asked for the chair.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.ned_seaver",
        surrogateId: "p.alma_gray",
        resolution:
          "Ned is dead, so Alma has no one to hate the speeches for her. She can still move the post or keep the chair, and she will say which wrongness she is willing to live beside without borrowing a surveyor's anger.",
        opening: {
          speakerId: "p.alma_gray",
          text: "Ned is dead, so nobody is here to hate both sentences in advance. The post is one foot into my flat. I can have it moved and sit on the slope, or I can leave it and keep the chair and the false map. I know what I want. I am asking whether you will say the true part out loud with me.",
        },
        branches: [
          {
            id: "moved_alma",
            choiceId: "move_alma",
            choice: "Move the post with Alma and give up the flat.",
            endSpeakerId: "p.alma_gray",
            end: "We moved it. I will sit badly and I will not forgive the foot out loud, even though I agreed to lose it. Agreement is not comfort. The line is true. Ned would have hated the speech and made it anyway. I made it without him. The chair goes to the slope tonight, before I can change into a liar.",
            flags: { "flags.goshen.moved": true },
            summary: "With Ned dead, Alma moves the post herself. She keeps the chair's loss and does not forgive it out loud.",
          },
          {
            id: "left_alma",
            choiceId: "leave_alma",
            choice: "Leave the post and let Alma keep the level chair.",
            endSpeakerId: "p.alma_gray",
            end: "Then I sit. The map is wrong by a foot and I am comfortable, and I will say both halves when someone asks so they don't get to call me confused. Ned is not here to be angry at the paperwork. I can be plain without him. I would like the chair. I have it. The post stays in my life.",
            flags: { "flags.goshen.left": true },
            summary: "With Ned dead, Alma keeps the post and the chair. She states the false foot plainly and sits anyway.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.fourteen_winters",
    title: "Fourteen Winters of Mail",
    locationId: "loc.middlebury.survey_office",
    eras: ["E5"],
    characters: ["p.owen_perch"],
    summary:
      "A box on the survey desk holds fourteen winters of unopened mail addressed to Ellis's successive bodies. Owen Perch will not inherit the office. He brought the box so Ellis would not feel clean. One letter can be opened, all of them can be opened, or the box can burn sealed.",
    discovery:
      "The box is already on the desk in the rented room off Court Street, tape dull, fourteen winters of envelopes inside. Owen set it down and did not offer a key, because it was never locked. You are here because he is here. The mail is not somewhere else.",
    steps: [
      "Look at the unopened box already on the survey desk and hear Owen say he did not bring it so you could feel clean.",
      "Choose one letter, the whole box, or the stove, and do that choosing without sending anyone out for a missing envelope.",
      "Leave the desk with either two sentences heard, the body-names said aloud, or the ash of mail that stayed sealed.",
    ],
    opening: {
      speakerId: "p.owen_perch",
      text: "Fourteen winters. I counted the seasons, not the moral. The envelopes are addressed to the bodies in turn, and nobody opened them, and I will not inherit this office so don't offer me the habit. I brought the box so you would not feel clean. Open one, open all, or burn it sealed. The stove is in the corner.",
      variant: {
        when: {
          background: "survey_desk",
          bond: "unbound",
          ideal: "names_aloud",
          flaw: "keeps_a_second_copy",
        },
        text: "You will want a second copy of whatever is in there, a clean page and a dirty one, so you can feel thorough. I didn't carry this upstairs for your thoroughness. The mail is to Rennet and Ada and the ones after, still shut. Say a name, read a page, or burn the pile. Don't make a duplicate of a silence and call it care.",
      },
    },
    branches: [
      {
        id: "one",
        choiceId: "open_one_letter",
        choice: "Open one letter and have it read aloud in the office.",
        middleSpeakerId: "p.owen_perch",
        middle: "One. The envelope says Louis Pell and there is no return name, just a quarry hand that got tired of waiting at a rail. I am not opening a second to make you feel you were fair. You picked a single winter out of fourteen. I hope it sits badly. That was the point of bringing the box.",
        endSpeakerId: "p.owen_perch",
        end: "This is the letter, and I am saying it in my mouth so it cannot stay a relic. \"Louis, Thursday's envelope is still fat because the pot is the job, and I will not pay the drill for a disagreement in your hands. Come take the cash before Sunday or I will write the week as unpaid, and I will not call that a punishment.\" That's the two sentences. The rest of the box stays shut, which is not cleanliness. It is a limit.",
        flags: { "flags.mail.one": true },
        summary: "Owen opens one letter, to Louis Pell, and reads two sentences of it aloud. The rest of the fourteen winters stay sealed.",
      },
      {
        id: "all",
        choiceId: "open_all_mail",
        choice: "Open the whole box and say the addressees aloud.",
        middleSpeakerId: "p.owen_perch",
        middle: "All of them, then. I am cutting the tape and I am not sorting you a gentle order. Bills, a chair that was kept, a truck that was not yours, a spelling list, a compressor part. You wanted the pile. You don't get to feel clean at the bottom of it. I will say names before I say contents, because names are the part people skip.",
        endSpeakerId: "p.owen_perch",
        end: "I am saying them in this room. Rennet Moss. Ada Smollet. Those two first, out loud, before Louis Pell and Hannah Greer and Chris Dobbs and the one the certificate calls Rowan. Fourteen winters, six mouths the county thought were separate. You heard the names. The letters can be dull now. Dull is what you earned by opening them.",
        flags: { "flags.mail.all": true },
        summary: "Owen opens every letter and says the addressees aloud, Rennet Moss and Ada Smollet first, then the bodies after them.",
      },
      {
        id: "burned",
        choiceId: "burn_the_box",
        choice: "Burn the box in the office stove without opening it.",
        middleSpeakerId: "p.owen_perch",
        middle: "Sealed, then. The stove is lit and the box fits if I break the lid with my heel, which I am doing. You don't get a sentence from Louis or a name from Rennet. You also don't get to store the silence where it can make you feel careful. Ash is a decision. I want you to smell it so you don't call it abstract.",
        endSpeakerId: "p.owen_perch",
        end: "It's burned unopened. Fourteen winters went up in a rented room and the desk is clear in the ugly way. I brought the box so you would not feel clean, and burning is one way to stay unclean and also one way to tidy. I hate that both are true. The stranger who wants this office later will not inherit the envelopes. That part I accept.",
        flags: { "flags.mail.burned": true },
        summary: "The box is burned sealed in the survey office stove. No letter is read, and Owen refuses to call the ash a cleaning.",
      },
    ],
    rewards: [
      reward("record", "reward.fourteen_winters.record", "The survey desk either keeps one read letter, a fully opened box of body-mail, or the fact that the box was burned sealed."),
      reward("knowledge", "reward.fourteen_winters.knowledge", "Fourteen winters of mail were addressed to the successive bodies and had been left unopened on purpose."),
    ],
    death: death({
      mid: "Owen burns the box rather than leave it to a stranger. Ellis dies before choosing a letter. The stove takes fourteen winters sealed, and Owen does not read them to feel fair about the burning.",
      unresolved: "The box stays on the desk, tape intact, and the era turns. No letter is opened and no fire is lit. The next hands find fourteen winters of mail and the same temptation to feel clean.",
      resolved: "The mail has been faced. Either one letter was read aloud, every addressee was named, or the sealed box was burned, and the office does not get to call the pile unfinished business.",
      sets: {},
    }),
    implications:
      "The unopened body-mail is either tasted in a single letter, spoken as a list of names beginning with Rennet and Ada, or burned sealed so no stranger inherits it. Owen does not become surveyor. Ellis does not get to feel clean.",
    alt: {
      npcId: "p.owen_perch",
      surrogateId: "p.willa_seaver",
      resolution:
        "Owen is dead, so Willa has the box he refused to turn into an inheritance. She believes a clean page is a weapon. She will still open one letter, open all, or burn the pile, and she will not let the office feel orderly about any of the three.",
      opening: {
        speakerId: "p.willa_seaver",
        text: "Owen is dead and the box is on the desk anyway. Fourteen winters, addressed to the bodies, still shut. He brought it so you would not feel clean, and I am not going to finish his refusal by filing it. Open one, open all, or burn it in that stove. A clean drawer is how this office stays unaccountable.",
      },
      branches: [
        {
          id: "one_willa",
          choiceId: "open_willa",
          choice: "Have Willa open one letter and read it aloud.",
          endSpeakerId: "p.willa_seaver",
          end: "One envelope. Louis Pell. I am reading the only two sentences that matter and then I stop, because a sample is already a way of feeling prudent. \"Louis, Thursday's envelope is still fat because the pot is the job, and I will not pay the drill for a disagreement in your hands. Come take the cash before Sunday or I will write the week as unpaid, and I will not call that a punishment.\" The rest stays shut. Prudence is not innocence.",
          flags: { "flags.mail.one": true },
          summary: "With Owen dead, Willa reads the two sentences of the Louis Pell letter and leaves the rest sealed.",
        },
        {
          id: "all_willa",
          choiceId: "all_willa",
          choice: "Have Willa open the box and name Rennet and Ada aloud.",
          endSpeakerId: "p.willa_seaver",
          end: "Rennet Moss. Ada Smollet. I said those two first, in this room, and then the later names, because a pile of bodies is not a texture. You have the letters open. If you make a fair copy of them you will sand off the grease. I will not help you sand. The names were the point Owen would have grudged you. Have them.",
          flags: { "flags.mail.all": true },
          summary: "With Owen dead, Willa opens all the mail and names Rennet Moss and Ada Smollet aloud before the later bodies.",
        },
        {
          id: "burned_willa",
          choiceId: "burn_willa",
          choice: "Burn the sealed box and let Willa refuse to call it order.",
          endSpeakerId: "p.willa_seaver",
          end: "Burned, still sealed. The stove did the work and the desk looks managed, which I despise. Owen is dead so he doesn't get to hate it with me. I hate it enough. No stranger inherits the envelopes, and you don't inherit a quotation. If you wanted to feel careful, you failed. Good. Careful is too close to clean.",
          flags: { "flags.mail.burned": true },
          summary: "With Owen dead, Willa burns the sealed box and refuses to call the cleared desk a virtue.",
        },
      ],
    },
  }),

  standalone({
    id: "q.slick_rock",
    title: "The Slick Rock",
    locationId: "loc.vergennes.falls",
    eras: ["E0"],
    characters: ["p.osier_rouleau"],
    summary:
      "A stranger is on the slick rock at the Vergennes falls, and the coat-count is also Osier's job. He can climb or keep the numbers. He does not want a moral about water. He wants to know which job Ellis will shout.",
    discovery:
      "You are already at the basin lip where the count sheet is weighted with a stone. The stranger is on the slick rock in plain sight, not hidden and not a rumor. Osier Rouleau has the tally in his hand and the climb in his legs, and he is waiting for a shout rather than a lesson.",
    steps: [
      "See the stranger on the slick rock and the unfinished coat-count in Osier's hand at the same time.",
      "Shout either for the stranger to come down, so Osier climbs, or for the count to continue, so nobody climbs.",
      "Stay with the job you shouted until the stranger is on the gravel or the tally is finished without a rescue.",
    ],
    opening: {
      speakerId: "p.osier_rouleau",
      text: "Stranger on the slick rock, and I am halfway through the coat-count. I can climb or I can keep the numbers. Both are my job and I cannot do them with the same hands. Don't tell me water has a moral. Tell me which job you are going to shout. I will do the one you shout.",
      variant: {
        when: {
          background: "mill_race",
          bond: "unbound",
          ideal: "water_has_its_level",
          flaw: "cannot_leave_a_gate",
        },
        text: "You don't argue with where water wants a body, and you also can't stand a count left open. I am not interested in either of those as a sermon. The stranger is on the slick. The coats are half tallied. Shout the climb or shout the count. If you give me a proverb I will pretend the falls took it.",
      },
    },
    branches: [
      {
        id: "pulled",
        choiceId: "shout_the_climb",
        choice: "Shout the stranger down and send Osier onto the slick rock.",
        middleSpeakerId: "speaker.narration",
        middle: "The shout goes at the stranger, not at a moral, and Osier puts the count sheet under the stone and goes down the slick rock on his hands. The climb is the whole scene. He gets a grip on a wet sleeve, the stranger comes off the rock, and both of them hit the gravel coughing. Nobody produces a form. The count sheet stays where he left it.",
        endSpeakerId: "p.osier_rouleau",
        end: "He's on the gravel. I climbed because you shouted that job and not the other. The coat-count is short and it will stay short until I am dry enough to care, which is not this minute. Don't thank the water. The water did not climb. I did, and you pointed. That is the division of the work.",
        flags: { "flags.slick.pulled": true },
        summary: "Ellis shouts the stranger down. Osier climbs the slick rock, pulls the stranger onto the gravel, and drops the coat-count.",
      },
      {
        id: "counted",
        choiceId: "shout_the_count",
        choice: "Shout the coat-count and do not send anyone onto the rock.",
        middleSpeakerId: "p.osier_rouleau",
        middle: "Then I keep the numbers. You shouted the count, so I do not climb, and I do not ask the stranger to become a story while I am still missing three coats. The rock stays slick. The person stays on it. I am not going to look up between figures and call that looking a rescue. You picked the job. I am finishing it.",
        endSpeakerId: "p.osier_rouleau",
        end: "The count is done and I did not climb. If the stranger comes down, they come down without my hands. If they don't, the falls keep them and the sheet does not. I wanted to know which job you would shout. You shouted this one. I will not add a sentence about water to make the sheet feel kinder than a sheet.",
        flags: { "flags.slick.counted": true },
        summary: "Ellis shouts for the coat-count. Osier finishes the tally and does not climb, and the stranger is left on the slick rock.",
      },
    ],
    rewards: [
      reward("stance", "reward.slick_rock.stance", "Ellis shouted either the climb or the coat-count, and Osier did that job rather than a sermon about the falls."),
      reward("knowledge", "reward.slick_rock.knowledge", "The slick rock and the coat-count were both Osier's work, and they could not be done with the same hands."),
    ],
    death: death({
      mid: "Osier climbs because Ellis's shout dies in the noise of the falls, and he cannot tell which job was meant. He goes down the slick rock anyway. The stranger comes off. The coat-count is short one, and there is no one left to say which shortage was chosen.",
      unresolved: "The stranger is still on the rock and the count is still open when the era turns. No shout settled the job. The basin keeps both the unfinished tally and the person on the slick.",
      resolved: "The falls have a finished job. Either Osier climbed and the count went short, or the count was completed and the stranger was not pulled. The next body does not get to shout it over.",
      sets: {},
    }),
    implications:
      "At the Vergennes falls, Osier either climbs the slick rock because Ellis shouted that job, leaving the coat-count short, or he finishes the count and does not climb. Water is not given a moral. The shout is the assignment.",
    alt: {
      npcId: "p.osier_rouleau",
      surrogateId: "p.marie_rouleau",
      resolution:
        "Osier is dead, so Marie holds the count sheet at the basin and will not pretend she is him. A hand from the upper walk can go down for the stranger, or the tally can be finished and the rock left alone. She still wants Ellis to shout one job, not a lesson.",
      opening: {
        speakerId: "p.marie_rouleau",
        text: "Osier is dead and his sheet is in my hand. There is a stranger on the slick rock and the coat-count is unfinished. I will not pretend I am the man who climbs for a living. I can send a hand from the upper walk down, or I can finish the numbers and leave the rock. Which job are you shouting?",
      },
      branches: [
        {
          id: "pulled_marie",
          choiceId: "shout_marie_climb",
          choice: "Shout the stranger down and send the upper-walk hand.",
          endSpeakerId: "p.marie_rouleau",
          end: "I shouted your shout on, and the hand from the walk went down and brought the stranger onto the gravel. Osier is not here to be proud of the grip. The count is short. I will not pad the sheet to make a dead man's tally look finished. The person is off the rock. That is the job you picked.",
          flags: { "flags.slick.pulled": true },
          summary: "With Osier dead, Marie sends a hand from the upper walk. The stranger is pulled off the slick rock and the count stays short.",
        },
        {
          id: "counted_marie",
          choiceId: "shout_marie_count",
          choice: "Shout the count and leave the slick rock alone.",
          endSpeakerId: "p.marie_rouleau",
          end: "Then I finish his numbers and I do not send anyone down. The stranger stays on the slick. I hate the looks I will get and I will not soften them with a speech about the falls. You shouted the count. Osier asked for a job, even if he is dead and I am the one holding the pencil. The sheet is complete. The rock is not my errand.",
          flags: { "flags.slick.counted": true },
          summary: "With Osier dead, Marie finishes the coat-count and does not send anyone onto the slick rock.",
        },
      ],
    },
  }),

  standalone({
    id: "q.morgan_fence",
    title: "Invoice the Mare",
    locationId: "loc.weybridge.morgan_fence",
    eras: ["E2"],
    characters: ["p.cora_belden"],
    creatures: ["c.belden_mare"],
    summary:
      "Cora Belden promised the Morgan mare Invoice to a 4-H girl and also owes the feed man more than pride will cover. Ellis stands at the fence as witness, gets no share, and wears the blame of whichever way Cora goes. The choice is made here, not at the college farm.",
    discovery:
      "Invoice is already in the paddock on Cora's side of the neighbor fence, and the feed bill is already in Cora's coat pocket. The girl is not in the scene. You are at the rail because Cora asked for a witness. The college farm's office is not where this is decided.",
    steps: [
      "Stand at Cora Belden's fence, look at Invoice, and hear the promise and the feed bill as two real debts.",
      "Witness either the mare going to the girl or the mare being sold against the bill, decided without leaving the rail.",
      "Accept the blame of having stood there, and do not ask for a share of the horse or of the money.",
    ],
    opening: {
      speakerId: "p.cora_belden",
      text: "Her name is Invoice. I promised her to the girl who did the 4-H work, and I owe the feed man more than my pride will cover. If you witness, you don't get a share. You get the blame of whichever way I go, because you stood at this fence. We are not walking over to the college farm to make it official. Official is a word they use for rooms I don't owe.",
      variant: {
        when: {
          background: "roadside",
          bond: "unbound",
          ideal: "the_living_first",
          flaw: "signs_unread",
        },
        text: "You will sign a thing just to end the standing-still, and the girl is a living promise while the feed man is paper. Invoice doesn't care which of those you find more serious. I need you to witness, not to flinch into a signature that makes you feel finished. The girl or the bill. The fence is the whole courthouse.",
      },
    },
    branches: [
      {
        id: "girl",
        choiceId: "mare_to_girl",
        choice: "Witness the promise: Invoice goes to the girl.",
        middleSpeakerId: "p.cora_belden",
        middle: "Then the girl gets her. I will tell the feed man the mare is not his collateral and he can hate me in arithmetic. You stood here, so when people say I was soft you are in the sentence. I am soft about a promise and hard about not hiding. The horse does not become a lesson. She becomes the girl's horse.",
        endSpeakerId: "p.cora_belden",
        end: "Invoice goes to the girl. I will walk her as far as the girl's gate myself, later, not as a parade and not with you holding a rope for credit. You witnessed. The bill stays angry. I would rather an angry bill than a promise I broke at this fence and then blamed on a farm office I refused to enter.",
        flags: { "flags.mare.girl": true },
        summary: "Invoice goes to the 4-H girl. Cora keeps the feed bill angry, and Ellis is the witness who gets the blame and no share.",
      },
      {
        id: "bill",
        choiceId: "mare_to_bill",
        choice: "Witness the sale: Invoice goes against the feed bill.",
        middleSpeakerId: "p.cora_belden",
        middle: "Then I sell her against the bill, and I decide it here, not in an office with a brass plate. The feed man gets the money. The girl gets the truth from me, not from a rumor and not from you. You still get the blame of having stood at the rail while I said it. That was the wage of witnessing. There isn't another wage.",
        endSpeakerId: "p.cora_belden",
        end: "She's sold against the feed bill. I will tell the girl myself, in a yard, without a speech about how mares teach character. I broke a promise because hay is not a mood. You watched me break it. If the county wants a villain it can use both our names. It does not get a share, and neither do you.",
        flags: { "flags.mare.bill": true },
        summary: "Invoice is sold against the feed bill at the fence. Cora will tell the girl herself, and Ellis keeps only the blame.",
      },
    ],
    rewards: [
      reward("stance", "reward.morgan_fence.stance", "Ellis witnessed Cora's choice and took the blame of the fence without taking a share of the mare."),
      reward("knowledge", "reward.morgan_fence.knowledge", "Invoice was both a promise to a 4-H girl and a debt against the feed bill, and both were real at once."),
    ],
    death: death({
      mid: "Cora sells Invoice against the feed bill and tells the girl herself. Ellis dies before the witnessing can be shared, so the blame stays in Cora's mouth alone. She does not hide behind the college farm, and she does not send someone else to say the promise broke.",
      unresolved: "The mare is still in the paddock and both debts are still unpaid in the only way that matters. No one has witnessed a choice. The girl and the feed man are both still waiting on a sentence Cora has not said.",
      resolved: "The fence has a result. Invoice either goes to the girl, with the bill left angry, or is sold against the bill, with the girl told by Cora. Ellis remains the witness of whichever one happened.",
      sets: {},
    }),
    implications:
      "Invoice the mare either keeps Cora's promise to the 4-H girl or is sold at the fence against the feed bill. Ellis gets no share of the horse or the money, only the blame of having stood there. The college farm is not invited in.",
    alt: {
      npcId: "p.cora_belden",
      surrogateId: "p.ruth_demerritt",
      resolution:
        "Cora is dead, so Ruth stands at the neighbor fence with a mare she did not promise and a bill she did not run up. She will not inherit Cora's silence. The girl can still have Invoice, or the feed man can be paid, and Ruth will say the loss out loud.",
      opening: {
        speakerId: "p.ruth_demerritt",
        text: "Cora is dead. I am not a horse woman and I am not walking this over to the college farm to be helped. Invoice is in the paddock. The girl was promised her. The feed man is owed more than pride. I can give the mare away or sell her against the bill. Pick the loss you will say out loud. I will say it with you.",
      },
      branches: [
        {
          id: "girl_ruth",
          choiceId: "girl_ruth",
          choice: "Give Invoice to the girl and let Ruth say the bill stays angry.",
          endSpeakerId: "p.ruth_demerritt",
          end: "The girl gets the horse. I will tell the feed man the collateral died with the promise, not with Cora, and he can be angry at a living voice. I didn't make the promise. I am keeping it because breaking it in a dead woman's name would be a cheap kind of practical. You witnessed. Don't ask me for a share of anything with a mane.",
          flags: { "flags.mare.girl": true },
          summary: "With Cora dead, Ruth gives Invoice to the girl and tells the feed man himself that the bill stays unpaid by the mare.",
        },
        {
          id: "bill_ruth",
          choiceId: "bill_ruth",
          choice: "Sell Invoice against the bill and have Ruth face the girl.",
          endSpeakerId: "p.ruth_demerritt",
          end: "Sold. The feed man gets paid and I will tell the girl myself, because Cora said she would have, and I am not hiring a softer mouth. A promise lost to hay is still a loss. I am saying it at this fence. You stood here, so you are in the blame. You are not in the money. There is no money for you.",
          flags: { "flags.mare.bill": true },
          summary: "With Cora dead, Ruth sells Invoice against the feed bill and tells the girl herself at the fence.",
        },
      ],
    },
  }),

  standalone({
    id: "q.quiet_question",
    title: "A Renter for the East Room",
    locationId: "loc.orwell.east_room",
    eras: ["E5"],
    characters: ["p.eden_waite", "p.ben_keene"],
    summary:
      "Ben Keene needs a winter room that is not the Cornwall attic. The east room is where the Quiet Household has kept the displaced. Renting it to a living neighbor is ordinary life. Refusing keeps a memorial. Eden can end the practice without mocking it. This is a key and a stove, not a last ceremony.",
    discovery:
      "Ben is already in the east-room doorway with his coat on and no speech prepared. The bed is made because the house makes it, not because tonight is a rite. You are in Orwell because Eden asked the practical question out loud: a renter, or an empty room with a name in the drawer.",
    steps: [
      "Stand in the east-room doorway and hear Ben ask for a winter that is not the Cornwall attic.",
      "Choose whether a living neighbor rents the room or the household keeps it for the displaced.",
      "Let Eden say the ending of the practice, or the keeping of it, without turning the key into a rite.",
    ],
    opening: {
      speakerId: "p.eden_waite",
      text: "Ben needs a room with heat and a door that shuts. The Cornwall attic is damp and it isn't his. This room is where we kept the people the house would not let go. Renting it to him is ordinary life. Refusing him keeps a memorial. I can end a habit without making fun of my father. I am asking you which winter this bed is for.",
      variant: {
        when: {
          background: "intervale",
          bond: "waite_house",
          ideal: "the_living_first",
          flaw: "cannot_leave_a_gate",
        },
        text: "You hate a gate left open, and an empty east room is a gate this house has refused to shut for years. Ben is a living neighbor with a cold attic waiting for him in Cornwall. If you keep the room, you are keeping a practice. If you rent it, you are finishing one. Eden will not mock either ending. She wants the latch decided.",
      },
    },
    branches: [
      {
        id: "rented",
        choiceId: "rent_the_room",
        choice: "Rent the east room to Ben for the winter.",
        middleSpeakerId: "p.ben_keene",
        middle: "Then I'll take it. I can pay a winter's rent and I can keep the stove fed, and I will not ask what the drawer was for unless the drawer is in my way. I don't have a voice for a choir and I don't want one. I want a door. If that insults the house, the house can be insulted by a living tenant. I've been insulted by damp longer.",
        endSpeakerId: "p.eden_waite",
        end: "The room is rented. Ben gets the key and the heat, and the names don't get the bed. I am not going to mock the years we kept it empty. Father kept it because Mother asked. I am ending that because a neighbor needs a winter. Maren's certificate can stay in the kitchen drawer. It does not need a mattress to be true.",
        flags: { "flags.east.rented": true, "flags.household.room_rented": true },
        summary: "Eden rents the east room to Ben Keene. A living neighbor takes the bed, and the household practice loses the room without being mocked.",
      },
      {
        id: "kept",
        choiceId: "keep_the_room",
        choice: "Keep the east room and refuse Ben the winter in it.",
        middleSpeakerId: "p.ben_keene",
        middle: "Then I don't get it. I'll say that plainly so you don't have to make it soft. The attic will still be the attic. I asked for a room, not for a meaning, and the answer is no. I can be embarrassed later. Right now I just need to know where I am sleeping, and it isn't here. Thank you for not dressing the no up as concern about my character.",
        endSpeakerId: "p.eden_waite",
        end: "The room stays. Ben will find another winter and I will not pretend I saved him from something by refusing him. I kept a memorial because I am not ready to end it, and I am saying that without a joke. The bed remains for the displaced. A living neighbor was turned away. That is the cost, and it is ordinary and ugly, which is different from holy.",
        flags: { "flags.east.kept": true },
        summary: "Eden keeps the east room. Ben is refused a winter there, and the refusal is named as a memorial rather than as concern.",
      },
    ],
    rewards: [
      reward("access", "reward.quiet_question.access", "The east room is either Ben's rented winter or still closed to living neighbors."),
      reward("stance", "reward.quiet_question.stance", "Eden either ended the empty-room practice without mocking it or kept the memorial and said so plainly."),
    ],
    death: death({
      mid: "Eden refuses the renter because a dead Ellis cannot be asked twice. Ben does not get the east room. She would rather keep a memorial than invent a consent the body can no longer give, and she does not mock the habit she is unwilling to end alone.",
      unresolved: "The winter arrives with the east room still empty and Ben still in the Cornwall attic. Nobody has rented the bed and nobody has defended the emptiness. The practical question stays practical and unanswered.",
      resolved: "The east room has a winter assigned. Either Ben rents it as a living neighbor, or the household keeps it and says the keeping is a memorial. The plates are not the subject. The key is.",
      sets: {},
    }),
    implications:
      "The Orwell east room is either rented to Ben Keene for an ordinary winter, which ends the practice of keeping it for the displaced, or refused, which leaves the memorial in place. Eden does not turn the choice into a ceremony and does not sneer at the years before it.",
    alt: {
      npcId: "p.eden_waite",
      surrogateId: "p.joel_waite",
      resolution:
        "Eden is dead, so Joel has to answer Ben about the room he grew up resenting. He can rent it without making his daughter's ending into a joke, or he can keep it because she is not here to finish the practice for him.",
      opening: {
        speakerId: "p.joel_waite",
        text: "Eden is dead and Ben still needs a winter that isn't a damp attic in Cornwall. This is the east room. I kept it because my mother asked, which is not the same as believing it feeds anyone. I can rent it to him or I can refuse. I will not mock Eden's question by turning it into one of my old complaints.",
      },
      branches: [
        {
          id: "rented_joel",
          choiceId: "rent_joel",
          choice: "Have Joel rent the east room to Ben.",
          endSpeakerId: "p.ben_keene",
          end: "Joel gave me the key. I'll pay the winter and I'll keep my questions out of the drawers. Eden isn't here to say the ending, so I won't say it for her. I have a door that shuts. That was the ask. If the house feels thinner because a living person is in the bed, the house can feel thinner. I was cold.",
          flags: { "flags.east.rented": true, "flags.household.room_rented": true },
          summary: "With Eden dead, Joel rents the east room to Ben. The practice ends without Joel using the moment to mock it.",
        },
        {
          id: "kept_joel",
          choiceId: "keep_joel",
          choice: "Have Joel keep the room and send Ben back to the attic.",
          endSpeakerId: "p.joel_waite",
          end: "I'm keeping it. Eden might have ended this and I won't end it over her absence just to feel modern. Ben doesn't get the winter. I am sorry about the attic and I am not going to pretend sorry is a stove. The room stays for the names. That may be stubborn. It is not a joke. I know the difference. I grew up in it.",
          flags: { "flags.east.kept": true },
          summary: "With Eden dead, Joel keeps the east room. Ben is refused, and Joel does not pretend the refusal is modern or funny.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.ben_keene",
        surrogateId: "p.eden_waite",
        resolution:
          "Ben is dead, so the particular renter is gone and the practical question is not. Eden can still rent the east room to a living neighbor or keep it, and she will not use Ben's death as a reason to sneer at either choice.",
        opening: {
          speakerId: "p.eden_waite",
          text: "Ben is dead. The attic question came with him and a neighbor who works the plow shed asked this morning for the same winter, ordinary as a key. I can rent the east room to a living person or I can keep it. I will not mock the old practice, and I will not pretend Ben can be asked again. The bed is still a bed.",
        },
        branches: [
          {
            id: "rented_eden",
            choiceId: "rent_eden",
            choice: "Rent the room to the living neighbor anyway.",
            endSpeakerId: "p.eden_waite",
            end: "Then the plow-shed neighbor gets the key. Ben doesn't, because Ben can't. I am not replacing him with a symbol. I am heating a room. The names can live in the kitchen drawer without a mattress. Father kept this because he was asked. I am renting it because a living person was cold. That is the whole theology I am willing to have today.",
            flags: { "flags.east.rented": true, "flags.household.room_rented": true },
            summary: "With Ben dead, Eden rents the east room to another living neighbor. The practice ends as housing, not as a substitute rite.",
          },
          {
            id: "kept_eden",
            choiceId: "keep_eden",
            choice: "Keep the east room empty even with Ben gone.",
            endSpeakerId: "p.eden_waite",
            end: "I am keeping it. The neighbor can be disappointed in an ordinary way. I am not ready to end the room just because the first person who asked is dead. A memorial that collapses at the first absence was only waiting for an excuse. I don't have the excuse. The bed stays made. I won't call that holy. I'll call it not finished.",
            flags: { "flags.east.kept": true },
            summary: "With Ben dead, Eden still keeps the east room. She refuses a living renter and does not call the emptiness holy.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.drill_log",
    title: "Thursday or Wednesday",
    locationId: "loc.bristol.quarry_cut",
    eras: ["E3"],
    characters: ["p.gina_pellegrin", "p.marc_boucher"],
    summary:
      "Gina has Vito's drill log at the overhang. The paper says a man drilled on Thursday. The chalk says he was buried on Wednesday. Marc will not average those into a Friday. Ellis has to treat one of them as true and leave the other as a disagreement, not a blend.",
    discovery:
      "The log and the chalked note are already on the stone at the cut, and the jar for disagreements is already beside them. You are under the overhang because Gina and Marc are under it. Vito is not coming up to pick a column. The two days are the whole problem.",
    steps: [
      "Read the drill log and the chalk where they already sit on the stone, Thursday against Wednesday.",
      "Choose which day is treated as true, and refuse any blend that would invent a Friday for the sake of the pen.",
      "Leave the losing day in the jar as a disagreement Marc is willing to hate and unwilling to average.",
    ],
    opening: {
      speakerId: "p.gina_pellegrin",
      text: "Vito's log is on the stone. He is not coming up the cut to defend a column, so don't leave a silence for him to fill. The paper says the man drilled Thursday. The chalk says that man was buried Wednesday. Marc will not sand those into a Friday. You pick which one we treat as true. The other one goes in the jar as a disagreement.",
      variant: {
        when: {
          background: "quarry_cut",
          bond: "pellegrin_cut",
          ideal: "the_record_holds",
          flaw: "keeps_a_second_copy",
        },
        text: "You want both pages kept so you never have to stand on one. Marc's hand won't do that for you. Thursday is in the log. Wednesday is in the chalk. A second copy is not a third day. If the record is going to hold, it has to hold a single day, and the jar can hold the loser without pretending they agreed.",
      },
    },
    branches: [
      {
        id: "chalk",
        choiceId: "chalk_wins",
        choice: "Treat the chalk as true: he was buried Wednesday.",
        middleSpeakerId: "p.marc_boucher",
        middle: "Wednesday, then. I will not make the paper say a prettier neighbor to the chalk. If he was buried Wednesday he did not drill Thursday, and the log is wrong, and wrong can be written down as wrong. My hand hates a blank and it hates a blend more. Gina, the chalk wins. I am not averaging my pen into a Friday to keep the peace.",
        endSpeakerId: "p.gina_pellegrin",
        end: "Chalk wins. The man was buried Wednesday, and Thursday's drilling is a lie we are willing to store. The paper goes in the jar beside the note so nobody later says we lost it. We didn't lose it. We demoted it. Hannah, if your bookkeeper's mouth wants a balanced column, it doesn't get one. Disagreement is the balance.",
        flags: { "flags.drill.chalk_wins": true },
        summary: "The chalk is treated as true. The man was buried Wednesday, and the Thursday drilling stays in the jar as a lie they are keeping.",
      },
      {
        id: "paper",
        choiceId: "paper_wins",
        choice: "Treat the paper as true: he drilled on Thursday.",
        middleSpeakerId: "p.marc_boucher",
        middle: "Thursday, then. The log is the record I am willing to be hated for, and the chalk is what somebody needed to write when the week went bad. I will not scratch the chalk off. I will not add a Friday so the two can shake hands. Paper wins. The chalk remains as the disagreement it is. My handwriting is not a peace treaty.",
        endSpeakerId: "p.gina_pellegrin",
        end: "Paper wins. He drilled Thursday, and the burial-chalk is in the jar with the log's copy so the losing day is not scrubbed into good manners. I have more names in that jar than any stone will take. This one is a day, not a man we invented. Marc can stand it. I can stand it. A Friday would have been the part I could not.",
        flags: { "flags.drill.paper_wins": true },
        summary: "The drill log is treated as true. Thursday stands, and the Wednesday chalk is kept in the jar as disagreement rather than erased.",
      },
    ],
    rewards: [
      reward("record", "reward.drill_log.record", "The cut keeps one day as the true day, Thursday or Wednesday, and stores the other in the jar unblended."),
      reward("knowledge", "reward.drill_log.knowledge", "Vito's paper and the chalk named different days, and a Friday would have been an invention rather than a record."),
    ],
    death: death({
      mid: "Both the log and the chalk stay in the jar, and nobody averages them into a Friday. Ellis dies before the pick. Gina lids the disagreement. Marc puts the pen down rather than invent a day that would make his hand feel finished.",
      unresolved: "The overhang keeps two days and no decision. Thursday and Wednesday remain side by side, and the next season inherits the temptation to sand them into something a payroll could love.",
      resolved: "One day was treated as true and the other was jarred as a disagreement. The cut does not carry a blended Friday forward. Marc's refusal to average stands with whichever day won.",
      sets: {},
    }),
    implications:
      "At the Bristol cut, either the chalk is true and the man was buried Wednesday, or the drill log is true and he worked Thursday. The losing day stays in the jar. No one invents a Friday to spare the pen.",
    alt: {
      npcId: "p.gina_pellegrin",
      surrogateId: "p.paulette_boucher",
      resolution:
        "Gina is dead, so Paulette has the jar and will not write a blank day to make the selectboard feel tended. Marc still refuses a Friday. Between them the chalk or the paper can win, and the missing day stays missing.",
      opening: {
        speakerId: "p.paulette_boucher",
        text: "Gina is dead and I kept the jar. I didn't keep a job writing softness. The paper says Thursday. The chalk says Wednesday. Marc will not average them and neither will I. Pick the day you will stand next to. The other day stays missing on purpose. Missing is a truth. Don't ask me to sand it.",
      },
      branches: [
        {
          id: "chalk_paulette",
          choiceId: "chalk_paulette",
          choice: "Let the chalk win and have Paulette jar the paper.",
          endSpeakerId: "p.marc_boucher",
          end: "Wednesday. I wrote that the log is the disagreement, not the day. Paulette didn't ask me to make it beautiful and I didn't. Gina is dead so she doesn't get a vote from the chalk she kept. The chalk still wins because you said so. A Friday is not hiding in my pen. I checked.",
          flags: { "flags.drill.chalk_wins": true },
          summary: "With Gina dead, the chalk still wins. Paulette jars the Thursday paper and Marc refuses to invent a Friday.",
        },
        {
          id: "paper_paulette",
          choiceId: "paper_paulette",
          choice: "Let the paper win and keep the chalk as the missing day.",
          endSpeakerId: "p.paulette_boucher",
          end: "Thursday stands. The chalk goes in the jar as the day we are willing to call wrong, and I am not rewriting it into a gentler week. If a name is missing, the missing is the truth. Here a day is missing. Marc can live with his hand. I can live with the stone not getting a softened list. You picked. That's the record.",
          flags: { "flags.drill.paper_wins": true },
          summary: "With Gina dead, the paper wins. Paulette keeps Wednesday in the jar as a missing day and does not soften it.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.marc_boucher",
        surrogateId: "p.gina_pellegrin",
        resolution:
          "Marc is dead, so his refusal to average has to be kept by someone else's mouth. Gina will not invent the Friday he hated just because the pen is free. The chalk or the paper still has to win, and the jar still takes the loser.",
        opening: {
          speakerId: "p.gina_pellegrin",
          text: "Marc is dead. I will not average his refusal into a Friday just because nobody is here to hate my handwriting. The log says the man drilled Thursday. The chalk says he was buried Wednesday. I can treat the chalk as true or the paper as true. I cannot treat them as neighbors. You pick the day. I will put the other in the jar.",
        },
        branches: [
          {
            id: "chalk_gina",
            choiceId: "chalk_gina",
            choice: "Treat Wednesday's chalk as the true day.",
            endSpeakerId: "p.gina_pellegrin",
            end: "Chalk. He was buried Wednesday and the Thursday line is a mistake I am keeping in glass so we don't get praised for losing it. Marc would have refused the blend. I am refusing it without him. The cut can live with one true day. It has lived with worse disagreements, and none of them became kinder by being averaged.",
            flags: { "flags.drill.chalk_wins": true },
            summary: "With Marc dead, Gina lets the chalk win and jars Thursday. She keeps his refusal to average without inventing a new day.",
          },
          {
            id: "paper_gina",
            choiceId: "paper_gina",
            choice: "Treat Thursday's paper as the true day.",
            endSpeakerId: "p.gina_pellegrin",
            end: "Paper. He drilled Thursday, and the chalk is the disagreement, not the correction. I am saying that in the cut where Marc's hand isn't. The jar gets Wednesday. I don't feel clean. A single day is not cleanliness. It is a refusal to invent Friday for the comfort of a closed week. That was his standard. It can be mine for this stone.",
            flags: { "flags.drill.paper_wins": true },
            summary: "With Marc dead, Gina lets the paper win. Wednesday goes in the jar, and she does not invent a Friday to close the week.",
          },
        ],
      },
    ],
  }),

  standalone({
    id: "q.unsent_son",
    title: "The Letter Sylvia Hid",
    locationId: "loc.cornwall.keene_loft",
    eras: ["E1"],
    characters: ["p.sylvia_keene", "p.cal_voss"],
    summary:
      "Sylvia kept one letter out of the unsent sack because the envelope says Bram Voss, and she is a coward with good pitch. The letter can go into Cal's hand to hold, whether Bram is living or not. It can be read aloud in the loft, where he cannot answer. Or it can stay unopened.",
    discovery:
      "The envelope is already on the loft stove's cool edge, addressed to Bram and kept out of the sack on purpose. Cal is in the room because Sylvia finally could not keep the address to herself. You are above the Cornwall grange. Nobody has to carry the letter to a landing for the choice to count.",
    steps: [
      "Look at the envelope Sylvia held out of the sack and hear that the name on it is Bram Voss.",
      "Choose whether Cal holds it for Bram, whether it is read in the loft where Bram cannot answer, or whether it stays sealed.",
      "Leave the letter in a hand, in the air of the loft, or back in hiding, without taking it on a road.",
    ],
    opening: {
      speakerId: "p.sylvia_keene",
      text: "This one was never in the sack. I kept it out because the outside says Bram Voss, and the name might still be a living man, and I am a coward with good pitch. I can hear a true note and I still hid the paper. Cal is here. You can put it in his hand to hold, you can make me read it where Bram cannot answer, or you can let me keep it shut.",
      variant: {
        when: {
          background: "crossing",
          bond: "voss_crossing",
          ideal: "names_aloud",
          flaw: "cannot_leave_a_gate",
        },
        text: "You cannot stand a letter left half-decided, and you want Bram's name said rather than stored. Sylvia's pitch is good and her nerve is not. The envelope is already out. If you make her finish it, finish it in this loft. Cal can hold it. The air can hear it. The sack does not get to become a road.",
      },
    },
    branches: [
      {
        id: "held",
        choiceId: "cal_holds_it",
        choice: "Put the sealed letter in Cal's hand to hold for Bram.",
        middleSpeakerId: "p.cal_voss",
        middle: "I'll hold it. I will not promise you he is alive and I will not promise you he isn't. My hand is not a delivery and it is not a burial. If Bram can take it, he can take it from me. If he cannot, I still have the envelope and I have not invented a death to make the holding feel finished. Sylvia, you can stop clutching the air.",
        endSpeakerId: "p.sylvia_keene",
        end: "Then it leaves my loft in a living hand that knows his name. That is as brave as I am today, which is not very, and it is more than hiding. Cal has it sealed. Bram may be somewhere to receive it or he may not. I am not going to sing a guess. The pitch I trust is the one that says the letter is no longer only mine.",
        flags: { "flags.son_letter.delivered_living": true },
        summary: "Sylvia puts the sealed letter in Cal's hand to hold for Bram, living or not. The loft does not invent which of those he is.",
      },
      {
        id: "read",
        choiceId: "read_in_loft",
        choice: "Have Sylvia read the letter aloud in the loft.",
        middleSpeakerId: "p.cal_voss",
        middle: "If you read it, read it here. I am not taking you to a stone and I am not taking you to a landing to make the paper feel more serious. Bram is not in this loft. He cannot answer. I can stand that. I would rather hear the sentences than watch Sylvia decide they are too delicate for a room with a stove in it.",
        endSpeakerId: "p.sylvia_keene",
        end: "Then I open it, and these are the two sentences, and I will not add a harmony. \"Bram, the ice will sound like it is talking, and I want you to stay off it anyway, even when I have told the landing the opposite. Take the pencil out of the drawer and mark what you can stand on, and do not wait for me to become a careful man.\" He is not here to answer. The loft heard it. That is as far as the letter goes.",
        flags: { "flags.son_letter.read_at_grave": true },
        summary: "Sylvia reads two sentences of the letter aloud in the loft, where Bram cannot answer. The letter is not carried to a stone or a landing.",
      },
      {
        id: "kept",
        choiceId: "keep_sealed",
        choice: "Keep the letter unopened and do not put it in Cal's hand.",
        middleSpeakerId: "p.sylvia_keene",
        middle: "Then it stays mine and it stays shut. I am a coward with the address showing, which is a poor kind of courage. Cal has seen the name and not the sentences. I will not call that a kindness to Bram. I will call it fear of a true note I already recognized. The sack does not get this one back. Neither does the road.",
        endSpeakerId: "p.cal_voss",
        end: "You didn't tell me the sentence. I can live with not knowing what the ice-line said. I cannot live with you calling the hiding a protection if it was only your nerve failing. I know the letter exists. I don't have it. Bram, living or not, doesn't have it either. That is the choice. I will not steal it off the stove to improve you.",
        flags: { "flags.son_letter.kept": true },
        summary: "The letter stays unopened in the loft. Cal knows it exists and is not given the sentences or the envelope.",
      },
    ],
    rewards: [
      reward("record", "reward.unsent_son.record", "The letter to Bram is either in Cal's keeping, read into the loft, or still sealed in Sylvia's hiding."),
      reward("stance", "reward.unsent_son.stance", "Ellis made Sylvia finish, hand off, or keep the cowardice she already named, without sending the letter on a road."),
    ],
    death: death({
      mid: "Sylvia re-hides the letter and Cal is not told. Ellis dies before the envelope can be put in a hand or read aloud. The address stays Bram's, the sentences stay shut, and the loft goes back to looking like a sack and a stove and nothing withheld.",
      unresolved: "The letter remains on the edge of the decision, neither held nor read nor frankly kept. Sylvia's courage stays unfinished, and Cal leaves knowing only that she was afraid of a name.",
      resolved: "The hidden letter has a fate. Cal holds it for Bram, the loft has heard two sentences Bram cannot answer, or Sylvia keeps it sealed with Cal as witness to the withholding. The sack is not pretended to be the whole truth.",
      sets: {},
    }),
    implications:
      "The letter Sylvia hid from the unsent sack either rests in Cal's hand for Bram, living or not, or is read in the Cornwall loft where he cannot answer, or stays sealed because her nerve fails in front of a witness. No one carries it off to settle the question by travel.",
    alt: {
      npcId: "p.sylvia_keene",
      surrogateId: "p.walter_keene",
      resolution:
        "Sylvia is dead, so Walter has the letter she excepted from her own rule. He is afraid of ad-hoc mercy and will say so. Cal can still hold it, hear it, or watch it stay sealed. Walter will not pretend a feeling is a stamp.",
      opening: {
        speakerId: "p.walter_keene",
        text: "Sylvia is dead. This letter was never in the sack because the outside says Bram Voss and she was afraid of a living name. I don't like ad-hoc mercy. Undeliverable is a rule, and this envelope is a temptation to break it kindly. Cal is here. Hold it, read it in this loft, or leave it shut. I will hate the kindness and still do the one you pick.",
      },
      branches: [
        {
          id: "held_walter",
          choiceId: "hold_walter",
          choice: "Have Walter put the sealed letter in Cal's hand.",
          endSpeakerId: "p.cal_voss",
          end: "Walter gave it over like a man handing me a problem with the corners squared. I'll hold it for Bram. I am not announcing whether my brother can receive mail. Walter can keep his rule for the rest of the sack. This one is in my hand because Sylvia died still hiding it, and hiding is not the same as a regulation.",
          flags: { "flags.son_letter.delivered_living": true },
          summary: "With Sylvia dead, Walter gives Cal the sealed letter to hold for Bram and says the rest of the rule still stands.",
        },
        {
          id: "read_walter",
          choiceId: "read_walter",
          choice: "Have the letter read in the loft with Sylvia gone.",
          endSpeakerId: "p.walter_keene",
          end: "I read it, and I hate that reading feels like a kindness I didn't earn. Two sentences, then I stop. \"Bram, the ice will sound like it is talking, and I want you to stay off it anyway, even when I have told the landing the opposite. Take the pencil out of the drawer and mark what you can stand on, and do not wait for me to become a careful man.\" He is not in this loft to answer. The rule survived everything except this page.",
          flags: { "flags.son_letter.read_at_grave": true },
          summary: "With Sylvia dead, Walter reads the two sentences in the loft. Bram cannot answer, and Walter does not call the reading a rule.",
        },
        {
          id: "kept_walter",
          choiceId: "keep_walter",
          choice: "Leave the letter sealed and let Walter keep the rule.",
          endSpeakerId: "p.cal_voss",
          end: "Then it stays shut and I still know the name. Walter is relieved in a way he is trying not to enjoy. I won't steal it. Sylvia is dead and the cowardice outlived her, which is a miserable inheritance and an honest one. Bram gets nothing today. The loft gets a rule instead of a sentence. I can hate that without correcting it.",
          flags: { "flags.son_letter.kept": true },
          summary: "With Sylvia dead, the letter stays sealed. Walter keeps the rule, and Cal knows the name without the sentences.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.cal_voss",
        surrogateId: "p.ida_voss",
        resolution:
          "Cal is dead, so Ida stands in the loft with Sylvia and will not let the letter become a song about a son. She can hold it for Bram, hear it read, or watch Sylvia keep it, and she will feed the decision with names rather than with comfort.",
        opening: {
          speakerId: "p.ida_voss",
          text: "Cal is dead. I am not putting a bowl where he stood and calling that an answer. Sylvia kept a letter out because it says Bram. I can hold it for him, living or not. I can hear it read in this loft. Or I can watch her hide it again. Names are ingredients. Don't serve me a sauce. Serve me the paper's fate.",
        },
        branches: [
          {
            id: "held_ida",
            choiceId: "hold_ida",
            choice: "Put the sealed letter in Ida's hand to hold for Bram.",
            endSpeakerId: "p.sylvia_keene",
            end: "Ida has it, sealed, and she will not pretend she is Cal. Bram's name is in a living hand that fed him and will not invent whether he can still take a letter. I am still a coward. I am a coward who let go. The pitch of that is not pretty. It is accurate, which is the note I was afraid of hitting.",
            flags: { "flags.son_letter.delivered_living": true },
            summary: "With Cal dead, Ida holds the sealed letter for Bram. Sylvia lets it go without pretending Ida is a substitute son.",
          },
          {
            id: "read_ida",
            choiceId: "read_ida",
            choice: "Read the two sentences in the loft for Ida to hear.",
            endSpeakerId: "p.sylvia_keene",
            end: "Ida wanted the paper's fate, so here it is in the air. \"Bram, the ice will sound like it is talking, and I want you to stay off it anyway, even when I have told the landing the opposite. Take the pencil out of the drawer and mark what you can stand on, and do not wait for me to become a careful man.\" He cannot answer from this loft. I will not hum after it. The sentences are enough ingredient.",
            flags: { "flags.son_letter.read_at_grave": true },
            summary: "With Cal dead, Sylvia reads the two sentences in the loft. Ida hears them and Bram still cannot answer.",
          },
          {
            id: "kept_ida",
            choiceId: "keep_ida",
            choice: "Keep the letter sealed even with Ida in the room.",
            endSpeakerId: "p.ida_voss",
            end: "Then keep it, and don't ask me to call the keeping a meal. I know the name and not the inside. Cal is dead so he can't be disappointed for me. I am disappointed on my own account. Bram, wherever he is, is not fed by a hidden envelope. Sylvia's pitch is good. Her nerve is ordinary. Ordinary fear can stay in the loft. I won't steal it to improve her.",
            flags: { "flags.son_letter.kept": true },
            summary: "With Cal dead, Sylvia keeps the letter sealed. Ida names the fear as ordinary and does not take the envelope.",
          },
        ],
      },
    ],
  }),
];
