import { standalone, asStage } from "./questkit.mjs";
import { forkStage } from "./fork.mjs";
import { death, reward } from "./death.mjs";

const done = (id, extra) => ({ [`flags.stage.${id}.done`]: true, ...extra });

const e0 = asStage(
  standalone({
    id: "st.orchard.e0",
    title: "The Stake in the South Block",
    locationId: "loc.new_haven.orchard",
    eras: ["E0"],
    characters: ["p.maeve_harrow"],
    summary:
      "An iron stake in the third row is not where the flood left the silt. Maeve wants the sentence. Samuel wants the trees without paper. Ellis either tells her Ivo moved it or drives it deeper.",
    discovery:
      "After a rain the south block shows a cleaner line of trunks than the silt would have planted. The stake is cold under your hand before Maeve speaks.",
    implications:
      "Truth gives Maeve fourteen years of grafting under her own name. Hiding the stake gives her fourteen years of fighting the county. The second life is that life, not a new hello.",
    steps: [
      "Find the stake in the third row and do not pull it yet.",
      "Hear Maeve refuse the story that the creek did this alone.",
      "Tell her the stake was moved, or drive it deeper and leave.",
    ],
    opening: {
      speakerId: "p.maeve_harrow",
      text: "Don't tell me the creek did this by itself. Creeks don't carry iron stakes. Men do. If you are only Rennet the rodman, say so and hold still. If you know whose hand moved it after the silt, use a sentence, not a mood.",
      variant: {
        when: { bond: "harrow_homestead" },
        text: "You are bound to this house, so she does not bother with the stranger's version. She puts your hand on the stake as if you already owe the row a confession.",
      },
    },
    branches: [
      {
        id: "br.orchard.truth",
        choiceId: "truth",
        choice: "Tell her Ivo moved the stake. The silt line is Harrow.",
        middleSpeakerId: "p.lottie_harrow",
        middle:
          "Then we write it. Not a poem. The row, the year, the hand. Samuel will hate the paper and he will keep the trees. I can live with his hate. I cannot live with a county smile.",
        endSpeakerId: "p.maeve_harrow",
        end: "All right. It's said. I'll graft under my name and not under a rumor. Don't come back to watch me be grateful. Gratitude is not a crop.",
        flags: done("st.orchard.e0", { "flags.orchard.truth_told": true, "flags.met.maeve": true }),
        summary: "Maeve is told the truth. The south block will be named as hers.",
      },
      {
        id: "br.orchard.hide",
        choiceId: "hide",
        choice: "Drive the stake deeper and leave the county line looking honest.",
        middleSpeakerId: "p.samuel_harrow",
        middle:
          "Good. Paper is how they take a row. You can be a coward for us if you want the nicer word. I won't thank you in front of her. I'll thank you by still having the trees next year.",
        endSpeakerId: "p.maeve_harrow",
        end: "You just decided I will fight the county without a fact. Remember that when I don't know your next face. The gate is that way. Use it.",
        flags: done("st.orchard.e0", { "flags.orchard.stake_hidden": true, "flags.met.maeve": true }),
        summary: "The stake is hidden. Maeve is left to fight a lie.",
      },
    ],
    rewards: [
      reward("knowledge", "reward.orchard.stake", "Ellis knows the stake is a moved thing, not a flood relic."),
      reward("stance", "reward.orchard.maeve0", "Maeve's stance is either coworker-in-a-debt or enemy-at-the-gate, and it will not reset."),
    ],
    death: death({
      mid: "Rennet dies with the stake unsaid. Maeve keeps a rumor and no sentence.",
      unresolved: "The second life begins with Maeve unsure, not with a greeting.",
      resolved: "Truth or concealment is the soil of every later Harrow scene.",
      sets: { "flags.stage.st.orchard.e0.interrupted": true, "flags.orchard.unresolved": true },
    }),
    alt: {
      npcId: "p.maeve_harrow",
      surrogateId: "p.lottie_harrow",
      resolution: "If Maeve is dead, Lottie still wants the number and will not let Samuel's fear of paper be the only vote.",
      opening: {
        speakerId: "p.lottie_harrow",
        text: "Maeve isn't here to be fierce about it. I am here to count. The stake is in the wrong row. Tell me the hand that moved it or drive it down and be the kind of man this family already knows.",
      },
      branches: [
        {
          id: "br.orchard.truth.lottie",
          choiceId: "lt",
          choice: "Tell Lottie the hand was Ivo's.",
          endSpeakerId: "p.lottie_harrow",
          end: "Then the book gets a row and a year. I'll fight Samuel for the paper. You don't get to call that love. You get to call it accurate.",
          flags: done("st.orchard.e0", { "flags.orchard.truth_told": true, "flags.met.maeve": true }),
          summary: "Lottie records the truth in Maeve's absence.",
        },
        {
          id: "br.orchard.hide.lottie",
          choiceId: "lh",
          choice: "Drive it deeper anyway.",
          endSpeakerId: "p.lottie_harrow",
          end: "Then I have a number I won't write. That is its own lie. Don't ask me to bless it. Go off the row.",
          flags: done("st.orchard.e0", { "flags.orchard.stake_hidden": true, "flags.met.maeve": true }),
          summary: "The stake is hidden over Lottie's objection.",
        },
      ],
    },
  }),
  ["st.orchard.e1"],
);

const e1 = forkStage({
  id: "st.orchard.e1",
  title: "The Row She Already Lived",
  locationId: "loc.new_haven.orchard",
  eras: ["E1"],
  characters: ["p.maeve_harrow"],
  summary:
    "Ada Smollet meets Maeve inside the life the stake already made. If the truth was told, Maeve asks which of June's trees comes out. If the stake was hidden, Maeve meets the office at the gate and will not let it in. If nothing was finished, she does not know this face.",
  discovery:
    "The south block in 1966 is either labeled in Maeve's hand on the end posts, or it is posted with a county notice she has torn and nailed back up, angry, more than once. You see the posts before you see her.",
  implications:
    "June's tree kept or removed becomes Nell's inheritance problem. A gate refused becomes Nell's lawsuit. An unrecognized Ada can still choose to speak.",
  prerequisites: {
    all: [{ flag: "flags.era.E1", eq: true }],
    any: [
      { flag: "flags.stage.st.orchard.e0.done", eq: true },
      { flag: "flags.stage.st.orchard.e0.interrupted", eq: true },
    ],
    none: [],
  },
  steps: [
    "Read the end post before you announce yourself.",
    "Let Maeve speak from the life she has been living, not from your memory of her.",
    "Choose the tree, the trespass, or the first true sentence.",
  ],
  rewards: [
    reward("stance", "reward.orchard.second", "Maeve's second-life stance is a worked life, not a swapped greeting."),
    reward("token", "reward.orchard.knife", "The graft knife is either put in your hand or kept on her side of the gate."),
  ],
  death: death({
    mid: "If Ada dies in the row, Maeve finishes the day's grafting alone and does not record a stranger's opinion.",
    unresolved: "June's tree stays an argument Nell will have to finish without a sentence from this season.",
    resolved: "The tree or the gate is settled enough for the cider year to inherit.",
    sets: { "flags.stage.st.orchard.e1.interrupted": true },
  }),
  forkText:
    "Maeve is forty-two. The row has had fourteen seasons without your face. Ada's shoes are a schoolteacher's. The posts say whether that matters.",
  forkVariant: {
    when: { flaw: "spares_a_kind_lie" },
    text: "You spare kind lies, and the row is full of them if the stake was hidden. Maeve watches your mouth soften and trusts it less.",
  },
  mode: "exactlyOne",
  partitionFlags: ["flags.orchard.truth_told", "flags.orchard.stake_hidden", "flags.orchard.unresolved"],
  secondLife: { npcId: "p.maeve_harrow", era: "E1" },
  nextStageIds: ["st.orchard.e2"],
  variants: [
    {
      id: "truth",
      flag: "flags.orchard.truth_told",
      door: "Her name is on the end posts. Walk into the row. You are not a stranger here.",
      beats: [
        {
          speakerId: "p.maeve_harrow",
          text: "You don't get to be a stranger on this row. I spent fourteen years grafting under my own name because someone finally said the silt was ours. Put the knife in the right hand or don't pick it up. June's tree is failing in the third row. It spoils the line. It is also the last thing my sister planted.",
        },
        {
          speakerId: "p.nell_harrow",
          text: "Mother talks like the row owes her a verdict. I talk like it owes taxes. If you take June's tree out, say so like a person who will still be here when the bill comes. If you keep it, don't call it sacred. Call it a cost.",
        },
        {
          speakerId: "p.maeve_harrow",
          text: "I am not asking the creek. I am asking you, because you are the mouth that made this name legal, whatever face you're wearing. Take June out or keep her and live with a crooked row. Those are the only respects I have left.",
        },
      ],
      endings: [
        {
          choiceId: "out",
          choice: "Take June's tree out. Say it is a cost, not a sacrament.",
          speakerId: "p.maeve_harrow",
          text: "Then we do it before the sap rises far enough to make us feel holy. Nell will write the loss. I will not cry for you. I already cried in years you didn't attend.",
          flags: done("st.orchard.e1", { "flags.orchard.june_tree_out": true, "flags.met.maeve": true }),
          summary: "June's tree comes out. The row is straight and poorer.",
          branchId: "br.orchard.june_out",
        },
        {
          choiceId: "keep",
          choice: "Keep June's tree and accept the crooked row.",
          speakerId: "p.nell_harrow",
          text: "Then the tax man and the fungus get a vote forever. I'll note it. Mother will pretend the note is a kindness. It isn't. It's a bill we agreed to.",
          flags: done("st.orchard.e1", { "flags.orchard.june_tree_kept": true, "flags.met.maeve": true }),
          summary: "June's tree stays. The inheritance includes a crooked, living cost.",
          branchId: "br.orchard.june_kept",
        },
      ],
    },
    {
      id: "hidden",
      flag: "flags.orchard.stake_hidden",
      door: "A county notice is nailed to the gate, torn, nailed again. Stop at the gate.",
      beats: [
        {
          speakerId: "p.maeve_harrow",
          text: "The county has been in my trees since the stake went quiet. I don't know your face. I know the office in a person's pocket. If you're Ada the teacher, teach somewhere else. If you're the office's new hands, you can read the notice from that side of the gate. You don't come in.",
        },
        {
          speakerId: "p.lottie_harrow",
          text: "I have counted this row for fourteen years of a fight I didn't choose. If you have the fact we were denied, say it now or stop pretending your silence was ever neutral. I am old. I am not confused about which one of those you are doing.",
        },
        {
          speakerId: "p.maeve_harrow",
          text: "Trespass, and I will have you walked out and I will be right. Tell the truth from the road, and I may open the latch. Stay charming, and I will remember the charm as another county tool.",
        },
      ],
      endings: [
        {
          choiceId: "road",
          choice: "From the road, say Ivo moved the stake. Do not step in.",
          speakerId: "p.maeve_harrow",
          text: "Late. Still a fact. I'll take the latch off tomorrow, not tonight. Don't look warmed. Lottie will write it. I will check her numbers because I don't trust relief.",
          flags: done("st.orchard.e1", { "flags.orchard.truth_told": true, "flags.met.maeve": true }),
          summary: "The hidden stake is confessed from the road. The fight turns into a document.",
          branchId: "br.orchard.confess_road",
        },
        {
          choiceId: "leave",
          choice: "Leave the gate shut. Do not add a new charm to her war.",
          speakerId: "p.maeve_harrow",
          text: "Good. Stay unknown. I have enough known enemies. Nell will inherit a lawsuit and a straight back. If your next face comes with a map, I will know the map before I know you.",
          flags: done("st.orchard.e1", { "flags.met.maeve": true }),
          summary: "Ellis leaves Maeve's war intact and does not enter.",
          branchId: "br.orchard.gate_shut",
        },
      ],
    },
    {
      id: "unsure",
      flag: "flags.orchard.unresolved",
      door: "The posts are unlabeled. She is pruning and does not look up.",
      beats: [
        {
          speakerId: "p.maeve_harrow",
          text: "If you want apples, the stand is in Addison. If you want a row explained, I don't explain it to people who start with their names. State the tree or go back to the road. I have work that doesn't include your mystery.",
        },
        {
          speakerId: "p.nell_harrow",
          text: "She says that to surveyors and to cousins and to God. I'm Nell. If you actually know why the third row is too straight, say it to me, because she will turn it into weather if you let her.",
        },
        {
          speakerId: "p.maeve_harrow",
          text: "Nell talks too much to strangers. You can still be one. Or you can tell me whose hand moved iron in my silt. I don't promise belief. I promise I will not help you perform it.",
        },
      ],
      endings: [
        {
          choiceId: "say",
          choice: "Tell her Ivo moved it, and that you are late by a death.",
          speakerId: "p.maeve_harrow",
          text: "Late is not innocent. I'll graft under my name starting this week, and I'll spend the next years angry that the week wasn't earlier. Nell, write it. Don't decorate it.",
          flags: done("st.orchard.e1", { "flags.orchard.truth_told": true, "flags.met.maeve": true }),
          summary: "The unresolved stake is finally spoken. Maeve starts the work late.",
          branchId: "br.orchard.late_truth",
        },
        {
          choiceId: "weather",
          choice: "Let her call it weather. Leave the row.",
          speakerId: "p.nell_harrow",
          text: "Then she'll call it weather until she dies, and I'll inherit the weather. Thanks for the help. The road is behind you.",
          flags: done("st.orchard.e1", { "flags.met.maeve": true }),
          summary: "Ellis lets the orchard stay unexplained. Nell inherits the weather.",
          branchId: "br.orchard.weather",
        },
      ],
    },
  ],
  alt: {
    npcId: "p.maeve_harrow",
    surrogateId: "p.nell_harrow",
    resolution: "If Maeve has died before 1966, which she has not by the default calendar, Nell already holds the knife and will not perform her mother's unfinished greeting.",
    opening: {
      speakerId: "p.nell_harrow",
      text: "Mother is not here to make this a test of reverence. I have the knife and the tax bill. If you know the stake, say the stake. If you don't, buy apples in Addison like a person.",
    },
    branches: [
      {
        id: "br.orchard.nell_truth",
        choiceId: "nt",
        choice: "Tell Nell the stake was moved.",
        endSpeakerId: "p.nell_harrow",
        end: "Then I write it without her blessing. That's finer. Blessings muddy the acres.",
        flags: done("st.orchard.e1", { "flags.orchard.truth_told": true }),
        summary: "Nell records the stake without Maeve.",
      },
      {
        id: "br.orchard.nell_leave",
        choiceId: "nl",
        choice: "Buy nothing. Leave the bill and the knife with her.",
        endSpeakerId: "p.nell_harrow",
        end: "Good. I have enough helpers who want a feeling. The row will outlast your visit.",
        flags: done("st.orchard.e1", {}),
        summary: "Nell keeps the orchard question and Ellis leaves.",
      },
    ],
  },
});

function plain(partial, next) {
  return asStage(standalone(partial), next);
}

const e2 = plain(
  {
    id: "st.orchard.e2",
    title: "Cider and the Buyer",
    locationId: "loc.new_haven.orchard",
    eras: ["E2"],
    characters: ["p.nell_harrow", "p.maeve_harrow"],
    summary:
      "A broker wants the south block for houses. Maeve is fifty-six and tired. The press is running. Nell can inherit trees or a fight, and those are not the same will.",
    discovery:
      "The cider smell reaches the road before the offer does. Kit Downing's car is pointed at the south block as if the block were already a lot.",
    implications:
      "Sold land ends the graft. Kept land hands Nell the trees and the bill. Asa's later question about stopping depends on whether there is a row left.",
    steps: [
      "Stand at the press and read the offer before anyone summarizes it for you.",
      "Hear Maeve separate a lawsuit from an orchard.",
      "Tell Nell which will she is being handed.",
    ],
    opening: {
      speakerId: "p.maeve_harrow",
      text: "Nell can inherit a lawsuit or an orchard. I am too tired to pretend those are the same will. Kit has a number. The number is not a home. Louis, or whoever you are, choose with me, not for me, and don't you dare say the creek would have wanted houses.",
      variant: {
        when: { ideal: "the_living_first" },
        text: "The living come first for you, and the living in this yard are tired. Maeve sees you about to soothe Kit instead of her, and she puts the dipper down so you have to speak without a prop.",
      },
      variants: [
        {
          when: { flags: ["flags.orchard.truth_told"] },
          text: "Fourteen years ago you said the stake was moved, and Maeve has spent those years grafting under her own name. She does not thank you for arriving in time to watch a buyer. The silt is already a sentence in this yard. Kit's number is the new threat, not the old secret. Louis, she says, don't you spend the truth we already paid for on a softer noun.",
        },
        {
          when: { flags: ["flags.orchard.stake_hidden"] },
          text: "You drove the stake down and left the county line looking honest. Maeve has been poor in her own trees for fourteen years and she still does not have the sentence. She looks at Kit's offer as if it might be the only way to stop bleeding for a lie you protected. If you sell, she says, you will not get to call the hidden stake a mercy twice.",
        },
      ],
    },
    branches: [
      {
        id: "br.orchard.keep",
        choiceId: "keep",
        choice: "Tell Nell the will is the trees, and send Kit off the row.",
        middleSpeakerId: "p.nell_harrow",
        middle:
          "Then I take the taxes and the fungus and June's crookedness if it's still here. Kit can eat his number. Mother gets to be tired without being overruled by a lot line.",
        endSpeakerId: "p.kit_downing",
        end: "I'll tell the buyer the block isn't a lot. I won't tell him you were noble. Noble is how sellers change their minds in August. If you change it, don't call me.",
        flags: done("st.orchard.e2", { "flags.orchard.nell_keeps": true, "flags.met.maeve": true }),
        summary: "Nell keeps the trees. The south block is not sold.",
      },
      {
        id: "br.orchard.sell",
        choiceId: "sell",
        choice: "Say the fight has eaten them, and let the block be sold.",
        middleSpeakerId: "p.nell_harrow",
        middle:
          "Then I inherit money and a hole. Don't dress it as mercy to her. She can hear mercy. It sounds like people leaving. Kit, write it so the silt line is at least named in the deed.",
        endSpeakerId: "p.maeve_harrow",
        end: "Do it before I have to watch another season of being right and poor. I won't move into one of the houses. I'll die on the acre we keep for the sugarhouse, if you leave me that. Leave me that.",
        flags: done("st.orchard.e2", { "flags.orchard.sold_south": true, "flags.met.maeve": true }),
        summary: "The south block is sold. Maeve keeps the sugarhouse acre only if the deed says so.",
      },
    ],
    rewards: [
      reward("record", "reward.orchard.will", "Nell's inheritance is named as trees or as a sale."),
      reward("stance", "reward.orchard.tired", "Maeve's tiredness is on the record, not smoothed into dignity."),
    ],
    death: death({
      mid: "If Louis dies at the press, Kit leaves the offer on the bench and Nell decides alone after the cider is racked.",
      unresolved: "The offer remains a rumor with a car pointed at the row.",
      resolved: "Sale or keeping is the ground Asa walks into, and it is not reopened as a mood.",
      sets: { "flags.stage.st.orchard.e2.interrupted": true },
    }),
    alt: {
      npcId: "p.nell_harrow",
      surrogateId: "p.maeve_harrow",
      resolution: "If Nell is dead, Maeve will not let Kit narrate the daughter's absence into a sale.",
      opening: {
        speakerId: "p.maeve_harrow",
        text: "Nell isn't here to be practical for me. I can still say no. I can still say yes and hate you. Don't use her death as the reason the houses are kind.",
      },
      branches: [
        {
          id: "br.orchard.keep.maeve",
          choiceId: "km",
          choice: "Tell Maeve to keep the row and send Kit away.",
          endSpeakerId: "p.maeve_harrow",
          end: "Then the row stays. I'll be tired on it. That's allowed. Kit can find another intervale to flatter.",
          flags: done("st.orchard.e2", { "flags.orchard.nell_keeps": true }),
          summary: "Maeve keeps the block without Nell.",
        },
        {
          id: "br.orchard.sell.maeve",
          choiceId: "sm",
          choice: "Tell her the sale is allowed, and the sugarhouse acre stays.",
          endSpeakerId: "p.maeve_harrow",
          end: "Write the acre in. If it isn't in, there is no sale. I will burn the offer before I lose the arch.",
          flags: done("st.orchard.e2", { "flags.orchard.sold_south": true }),
          summary: "The sale proceeds only with the sugarhouse acre reserved.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.maeve_harrow",
        surrogateId: "p.nell_harrow",
        resolution: "If Maeve dies before the pressing, Nell refuses to let grief be the broker's lever.",
        opening: {
          speakerId: "p.nell_harrow",
          text: "She's dead and the offer got braver. I can smell that. Tell me if I'm keeping trees or selling a hole. Don't tell me what she would have wanted. I heard her when she could talk.",
        },
        branches: [
          {
            id: "br.orchard.keep.nonmaeve",
            choiceId: "kn",
            choice: "Keep the trees.",
            endSpeakerId: "p.nell_harrow",
            end: "Trees. I'll pay the bill. Kit can leave before the cider turns.",
            flags: done("st.orchard.e2", { "flags.orchard.nell_keeps": true }),
            summary: "Nell keeps the orchard after Maeve.",
          },
          {
            id: "br.orchard.sell.nonmaeve",
            choiceId: "sn",
            choice: "Sell, and make him write the silt into the deed.",
            endSpeakerId: "p.nell_harrow",
            end: "He writes it or he doesn't buy it. I'm not handing him a blank pastoral.",
            flags: done("st.orchard.e2", { "flags.orchard.sold_south": true }),
            summary: "Nell sells with the silt named.",
          },
        ],
      },
    ],
  },
  ["st.orchard.e3"],
);

const e3 = plain(
  {
    id: "st.orchard.e3",
    title: "Two Maps in the Attic",
    locationId: "loc.new_haven.homestead",
    eras: ["E3"],
    characters: ["p.nell_harrow"],
    summary:
      "Maeve died in 1991. Nell has two maps in the attic. One is a kindness. She asks which one Ellis is willing to be hated for, not which one is metaphysically true.",
    discovery:
      "The attic smell is cedar and old apples. Nell has the maps open on the floor because the table is too honest. You climbed because the hatch was already up.",
    implications:
      "The map Nell files is the one Asa will defend or abandon. A kindness map keeps peace and a false row. The harsh map costs the homestead at town meeting.",
    steps: [
      "Read both maps without saying which feels like Maeve.",
      "Let Nell refuse the question of abstract truth.",
      "Choose the map you will be hated for, and sign nothing you did not read.",
    ],
    opening: {
      speakerId: "p.nell_harrow",
      text: "There are two maps and one of them is a kindness. I am not asking you which is true. I am asking which one you are willing to be hated for. Mother is three years dead. The attic doesn't care which body you brought. I care which enemy you can stand to make.",
      variant: {
        when: { flaw: "signs_unread" },
        text: "Your flaw is signing unread. Nell sees your hand twitch toward the kinder map and puts a boot on it until you have said, aloud, what the legend means.",
      },
    },
    branches: [
      {
        id: "br.maps.kind",
        choiceId: "kind",
        choice: "File the kind map. Accept the peace and the false row.",
        middleSpeakerId: "p.nell_harrow",
        middle:
          "Then town meeting stays dull and my son inherits a courtesy. I'll hate you a little and I'll sleep. Don't call it what Mother would have wanted. She wanted the fight on Tuesdays and the trees on Wednesdays.",
        endSpeakerId: "speaker.ellis",
        end: "I file the kind one. If Asa hates me for it, he can hate a person who chose sleep over a cleaner wound. I won't pretend the row matches the silt.",
        flags: done("st.orchard.e3", { "flags.orchard.stake_hidden": true }),
        summary: "The kind map is filed. Peace is purchased with a false row.",
      },
      {
        id: "br.maps.harsh",
        choiceId: "harsh",
        choice: "File the harsh map. Be hated at town meeting.",
        middleSpeakerId: "p.nell_harrow",
        middle:
          "Then I'll stand next to you while they call it a haunting or a grudge. I prefer grudge. Grudges have acreage. Bring a coat. The meeting hall is mean in March.",
        endSpeakerId: "speaker.ellis",
        end: "File the harsh one. I'll be hated in my own voice, not in Maeve's. If the bill comes, it comes to this body and the next one can inherit the receipt.",
        flags: done("st.orchard.e3", { "flags.orchard.truth_told": true }),
        summary: "The harsh map is filed. Nell and Ellis accept the grudge.",
      },
    ],
    rewards: [
      reward("record", "reward.orchard.map", "One attic map becomes the filed map."),
      reward("knowledge", "reward.orchard.hate", "Ellis knows which enemies the filing makes."),
    ],
    death: death({
      mid: "If Hannah dies in the attic, Nell files nothing that week and the kind map stays on top because it is lighter.",
      unresolved: "Both maps remain in the attic, and Asa inherits the unfinished argument with the dust.",
      resolved: "The filed map is what the intervale argues from.",
      sets: { "flags.stage.st.orchard.e3.interrupted": true },
    }),
    prerequisites: {
      all: [{ flag: "flags.era.E3", eq: true }],
      any: [
        { flag: "flags.stage.st.orchard.e2.done", eq: true },
        { flag: "flags.stage.st.orchard.e2.interrupted", eq: true },
      ],
      none: [],
    },
    alt: {
      npcId: "p.nell_harrow",
      surrogateId: "p.asa_harrow",
      resolution: "If Nell is dead, Asa at twenty-three will not let a stranger pick a parent's kindness for him without saying the cost.",
      opening: {
        speakerId: "p.asa_harrow",
        text: "Both maps. I was born in a dry year. Don't give me a flood feeling. Tell me which enemies you can stand, and I'll tell you if I'm willing to share them.",
      },
      branches: [
        {
          id: "br.maps.asa_kind",
          choiceId: "ak",
          choice: "Choose the kind map and name the falsehood.",
          endSpeakerId: "p.asa_harrow",
          end: "Kind, and false. I'll file it and I won't thank you. Sleep is a reason. It's not a virtue.",
          flags: done("st.orchard.e3", { "flags.orchard.stake_hidden": true }),
          summary: "Asa files the kind map knowing it is false.",
        },
        {
          id: "br.maps.asa_harsh",
          choiceId: "ah",
          choice: "Choose the harsh map and go to the meeting.",
          endSpeakerId: "p.asa_harrow",
          end: "Harsh. I'll go. If they laugh, they laugh at acreage, not at a ghost story. Sit where I can see you.",
          flags: done("st.orchard.e3", { "flags.orchard.truth_told": true }),
          summary: "Asa files the harsh map and attends the meeting.",
        },
      ],
    },
  },
  ["st.orchard.e5"],
);

const e5 = plain(
  {
    id: "st.orchard.e5",
    title: "Stop Grafting",
    locationId: "loc.new_haven.orchard",
    eras: ["E5"],
    characters: ["p.asa_harrow"],
    summary:
      "Maeve and Nell are dead. Asa is good at grafting and asks Rowan, of all people, whether skill is a reason to keep putting lives into a row that already has too many.",
    discovery:
      "The knife is on the ladder, not offered. Asa is already in the third row. He does not call you over. The work is audible.",
    implications:
      "If Asa stops, the orchard ceases to be a machine for inheriting the wound. If he continues, the row outlives the household's plates as another way of keeping people. The ending of the county can use either fact.",
    steps: [
      "Watch one graft before you speak.",
      "Answer his question about skill without flattering the row.",
      "Leave the knife in his hand or take the day's wood down and stop.",
    ],
    opening: {
      speakerId: "p.asa_harrow",
      text: "I can graft. I am good at it. I am asking you, of all the mouths that have stood here, whether good at it is a reason to keep doing it to a row that already has too many lives in it. Don't say Maeve. I knew her answer. I am asking for mine.",
      variant: {
        when: { ideal: "water_has_its_level" },
        text: "You think water has its level. Asa points at the silt line, still visible if you know to look, and waits to see if you will use the creek as an excuse to keep cutting.",
      },
      variants: [
        {
          when: { flags: ["flags.orchard.june_tree_kept"] },
          text: "June's tree is still in the row, spoiling the line, because someone in your will refused to take it out. Asa has pruned around it his whole working life. He is not asking you to eulogize it. He is asking whether a row that already keeps a dead girl's failure needs another generation of grafts on top of the failure.",
        },
        {
          when: { flags: ["flags.orchard.sold_south"] },
          text: "The south block is houses now, except the acre the deed kept. Asa grafts on a remnant and is good at it, which embarrasses him. He wants to know if skill on a leftover is a reason, or if the sale already answered the question and the knife is just a habit with a sharp edge.",
        },
      ],
    },
    prerequisites: {
      all: [{ flag: "flags.era.E5", eq: true }],
      any: [
        { flag: "flags.stage.st.orchard.e3.done", eq: true },
        { flag: "flags.stage.st.orchard.e3.interrupted", eq: true },
      ],
      none: [],
    },
    branches: [
      {
        id: "br.orchard.stop",
        choiceId: "stop",
        choice: "Tell him to stop. Skill is not a reason to continue the row.",
        middleSpeakerId: "p.asa_harrow",
        middle:
          "Then the knife goes in the house. The trees that are here can finish their own lives. I will feel useless in March. Useless is not the same as wrong. I wanted someone who has worn too many hands to say it.",
        endSpeakerId: "speaker.ellis",
        end: "Stop. Let the row be a place, not a device. If the silt wants a moral it can keep wanting. You don't owe it another scion.",
        flags: done("st.orchard.e5", { "flags.orchard.asa_stops": true }),
        summary: "Asa stops grafting. The orchard is allowed to be finite.",
      },
      {
        id: "br.orchard.continue",
        choiceId: "go",
        choice: "Tell him the skill is a way of staying, and to keep the knife.",
        middleSpeakerId: "p.asa_harrow",
        middle:
          "Then I stay. I won't call it destiny. I'll call it Tuesdays. If the row is a device, it's my device now, and you don't get to be tragic about it from the ladder.",
        endSpeakerId: "speaker.ellis",
        end: "Keep the knife. Do it as work. The moment it becomes a ceremony for the dead, put it down. I'll know if you don't. So will the wood.",
        flags: done("st.orchard.e5", { "flags.orchard.nell_keeps": true }),
        summary: "Asa keeps grafting as work, with a limit against ceremony.",
      },
    ],
    rewards: [
      reward("stance", "reward.orchard.asa", "Asa either stops or continues as labor, not as myth."),
      reward("knowledge", "reward.orchard.finite", "Ellis has said whether the row should remain a device."),
    ],
    death: death({
      mid: "If Rowan dies on the ladder, Asa puts the knife in the house for the rest of the week and decides alone.",
      unresolved: "The grafting continues by habit, and no one this season said whether habit was a reason.",
      resolved: "Stop or continue is visible in whether March has a knife on the ladder.",
      sets: { "flags.stage.st.orchard.e5.interrupted": true },
    }),
    alt: {
      npcId: "p.asa_harrow",
      surrogateId: "p.nina_abbott",
      resolution: "If Asa is dead, Nina Abbott from the line farm will not graft and will not let the row be romanticized by a neighbor's absence.",
      opening: {
        speakerId: "p.nina_abbott",
        text: "Asa isn't here to be good at this. I mow the edge and I don't graft. Tell me if the row is a device you're still feeding. I won't feed it. I will tell you if you're being decorative.",
      },
      branches: [
        {
          id: "br.orchard.stop.nina",
          choiceId: "nina_stop",
          choice: "Say the row should stop being fed.",
          endSpeakerId: "p.nina_abbott",
          end: "Then leave the knife. I'll tell whoever inherits the ladder. I won't make it a speech at town meeting.",
          flags: done("st.orchard.e5", { "flags.orchard.asa_stops": true }),
          summary: "The row stops without Asa.",
        },
        {
          id: "br.orchard.go.nina",
          choiceId: "nina_go",
          choice: "Say the work can continue if someone wants the Tuesdays.",
          endSpeakerId: "p.nina_abbott",
          end: "Tuesdays aren't mine. If a Harrow cousin wants them, they can have the knife. I won't sanctify it.",
          flags: done("st.orchard.e5", { "flags.orchard.nell_keeps": true }),
          summary: "The knife stays available as work, unsanctified.",
        },
      ],
    },
  },
  [],
);

export const orchardChain = {
  id: "q.chain.orchard",
  title: "The Orchard Inheritance",
  kind: "chain",
  locationId: "loc.new_haven.orchard",
  eraEligibility: ["E0", "E1", "E2", "E3", "E5"],
  summary:
    "The south-block orchard is the silt Ivo sent onto Harrow ground. Maeve's second life is the fourteen years that choice built. Nell inherits trees or a fight. Asa asks whether grafting itself should end.",
  endingImplications:
    "A stopped row lets the ending of the county be about a place that is finished. A continued row lets the ending admit that skill keeps the wound horticultural. Neither is absolution.",
  secondLifeNpc: "p.maeve_harrow",
  chainStages: [e0, e1, e2, e3, e5],
};
