import { standalone, asStage } from "./questkit.mjs";
import { forkStage } from "./fork.mjs";
import { death, reward } from "./death.mjs";

const e0 = asStage(
  standalone({
    id: "st.bridge.e0",
    title: "The Pier and the Pencil",
    locationId: "loc.addison.bridge_abutment",
    eras: ["E0"],
    characters: ["p.cal_voss", "p.bram_voss"],
    summary:
      "Bram Voss has penciled the Vermont pier where the 1929 bridge powders under a thumb. Cal asks Ellis not to make the landing the county's problem before the hay is in.",
    discovery:
      "At low water the chalk dusts off the Vermont abutment if you drag a thumb. Bram is already there with the pencil behind his ear. No one posts a notice.",
    implications:
      "Testimony jackets the pier and keeps Bram alive into later seasons. Withholding keeps the summer's crossings and kills him on the repair in 1965. The plaque year and the closure year read this choice.",
    steps: [
      "At low water, stand on the Vermont abutment and read Bram's pencil ticks without taking them.",
      "Listen to Cal count the cost in hay and fares before you answer.",
      "Speak the testimony, or keep the season, in front of both brothers.",
    ],
    opening: {
      speakerId: "p.bram_voss",
      text: "I didn't paint a picture on this pier. I marked where the concrete powders under the thumb. Press. If you call that a feeling, give me your thumb and then tell my brother why his season matters more than the dust.",
      variant: {
        when: { ideal: "the_living_first" },
        text: "Cal is looking at the hay wagons, not the crack. If the living come first, you already know which brother you are about to disappoint, and Bram can see it in how you won't press.",
      },
    },
    branches: [
      {
        id: "br.bridge.testify",
        choiceId: "testify",
        choice: "Press the thumb to the tick and say you will testify this week.",
        middleSpeakerId: "p.cal_voss",
        middle:
          "Then we become the cracked bridge. Fares drop. The cut complains. I will stand in the room with you, and I will not pretend I like you for it. Bram stays off that pier. That is the whole good I can see.",
        endSpeakerId: "p.bram_voss",
        end: "Write it as dust, not as my fear. If they jacket it, I don't owe you a thanks. I owe the concrete a quieter week. The pencil stays in the crack so the next liar can find it.",
        flags: {
          "flags.bridge.testimony_given": true,
          "flags.bridge.pier_read": true,
          "flags.met.cal": true,
          "flags.stage.st.bridge.e0.done": true,
        },
        summary: "Ellis testifies. The pier is jacketed. Bram's death-clock stays the long one.",
      },
      {
        id: "br.bridge.withhold",
        choiceId: "withhold",
        choice: "Keep the season. Do not put the ticks into a public sentence.",
        middleSpeakerId: "p.cal_voss",
        middle:
          "Hay comes in. I will hate the quiet of that more than I hate you, if you are wrong. Bram will go up on it himself when the state finally blinks. Don't tell me you didn't know the order of those two facts.",
        endSpeakerId: "p.ida_voss",
        end: "The soup is the same either way. I will feed the men who cross. If my older boy falls because this week stayed profitable, I will remember who chose the week. Eat or don't. The log will not say your courage.",
        flags: {
          "flags.bridge.testimony_withheld": true,
          "flags.bridge.pier_read": true,
          "flags.met.cal": true,
          "flags.stage.st.bridge.e0.done": true,
        },
        summary: "Ellis keeps the landing's season. Bram dies on the unjacketed repair in 1965.",
      },
    ],
    rewards: [
      reward("knowledge", "reward.bridge.ticks", "Ellis can describe the 1952 pencil ticks as measurement, not mood."),
      reward("access", "reward.bridge.log", "Cal's landing log will open to this body's hands in a later season."),
    ],
    death: death({
      mid: "Rennet dies with the ticks unread in public. The pencil remains in the crack. Cal tells the story as unfinished, and Bram's death follows the withheld year.",
      carry: ["flags.bridge.pier_read"],
      unresolved: "No testimony was given. The pier stays a landing problem. Bram's fall in 1965 is not yet a fact Ellis owned, but the unresolved flag treats the season as broken.",
      resolved: "The testimony or the withholding is in the log. The jacket, or its absence, is the county's next fourteen years.",
      sets: {
        "flags.stage.st.bridge.e0.interrupted": true,
        "flags.bridge.unresolved": true,
        "flags.bridge.pier_read": true,
      },
    }),
    alt: {
      npcId: "p.cal_voss",
      surrogateId: "p.ida_voss",
      resolution: "If Cal is dead, Ida keeps the kitchen and the log and will not let Bram's pencil become a stranger's performance.",
      opening: {
        speakerId: "p.ida_voss",
        text: "Cal isn't here to count the hay against the crack. I am. The soup rule stands. You can still tell the truth into the log, or you can still be a coward with clean hands. Don't use his absence as a third door.",
      },
      branches: [
        {
          id: "br.bridge.testify.ida",
          choiceId: "ida_yes",
          choice: "Tell Ida to put the ticks in the log in Cal's absence.",
          endSpeakerId: "p.ida_voss",
          end: "Then I write it. I will not write your name as a hero. I will write the dust and the date. Bram can hate me for a week, which is better than the other week.",
          flags: {
            "flags.bridge.testimony_given": true,
            "flags.bridge.pier_read": true,
            "flags.met.cal": true,
            "flags.stage.st.bridge.e0.done": true,
          },
          summary: "Ida enters the testimony when Cal cannot.",
        },
        {
          id: "br.bridge.withhold.ida",
          choiceId: "ida_no",
          choice: "Tell her to keep the week and the soup, and leave the log thin.",
          endSpeakerId: "p.ida_voss",
          end: "Thin logs are how this landing stays fed. I know the price. I will not pretend you invented it. Go, before Bram asks me to be braver than I am.",
          flags: {
            "flags.bridge.testimony_withheld": true,
            "flags.bridge.pier_read": true,
            "flags.met.cal": true,
            "flags.stage.st.bridge.e0.done": true,
          },
          summary: "Ida keeps the season when Cal is gone.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.bram_voss",
        surrogateId: "p.cal_voss",
        resolution: "If Bram is already dead, Cal holds the pencil and the scene is grief, not a measurement lesson.",
        opening: {
          speakerId: "p.cal_voss",
          text: "Bram marked it and then he wasn't here to argue. I still have the pencil. If you testify, you testify for a man who can't correct your adjectives. If you don't, the pier remains his unfinished sentence.",
        },
        branches: [
          {
            id: "br.bridge.testify.nobram",
            choiceId: "nobram_yes",
            choice: "Testify using only what the pencil still shows.",
            endSpeakerId: "p.cal_voss",
            end: "Then say dust and place. Don't say he was brave. The jacket can happen without a eulogy. I'll stand in the room.",
            flags: {
              "flags.bridge.testimony_given": true,
              "flags.stage.st.bridge.e0.done": true,
              "flags.met.cal": true,
              "flags.bridge.pier_read": true,
            },
            summary: "Testimony proceeds from the pencil without Bram.",
          },
          {
            id: "br.bridge.withhold.nobram",
            choiceId: "nobram_no",
            choice: "Leave the unfinished sentence in the crack.",
            endSpeakerId: "p.cal_voss",
            end: "Then we're both late. I'll keep the pencil and I won't thank you for the company. The season can have what it wants.",
            flags: {
              "flags.bridge.testimony_withheld": true,
              "flags.stage.st.bridge.e0.done": true,
              "flags.met.cal": true,
              "flags.bridge.pier_read": true,
            },
            summary: "The season is kept over a dead brother's mark.",
          },
        ],
      },
    ],
  }),
  ["st.bridge.e1"],
);

const e1 = forkStage({
  id: "st.bridge.e1",
  title: "Say the Name Before Business",
  locationId: "loc.addison.bridge_abutment",
  eras: ["E1"],
  characters: ["p.cal_voss"],
  summary:
    "Ellis returns as Ada Smollet. Cal is not the young keeper who asked for a delay. If Bram fell, the first word allowed on the abutment is Bram's name. If the pier was jacketed, Cal refuses thanks and demands the exact scar.",
  discovery:
    "The 1966 toll shed is the same shed. Cal does not hail you. He waits to see whether the new face walks to the crack without being shown.",
  implications:
    "This is Cal's second-life change. Later plaque and closure scenes inherit either a named dead brother or a jacketed pier and a man who spent fourteen years being right in public.",
  prerequisites: {
    all: [{ flag: "flags.era.E1", eq: true }],
    any: [
      { flag: "flags.stage.st.bridge.e0.done", eq: true },
      { flag: "flags.stage.st.bridge.e0.interrupted", eq: true },
    ],
    none: [],
  },
  steps: [
    "Walk to the Vermont crack before you say your name.",
    "Let Cal set the first required sentence.",
    "Leave only after a name, a measurement, or a refusal to pretend you remember.",
  ],
  rewards: [
    reward("stance", "reward.bridge.cal_second", "Cal's stance is grief or hardened credit, not a repeated hello."),
    reward("record", "reward.bridge.second_line", "The landing log gains a 1966 line that matches the life Cal actually had."),
  ],
  death: death({
    mid: "If Ada dies on the abutment, Cal writes 'unfinished' and does not invent the sentence the new face failed to give.",
    unresolved: "The second meeting breaks. The plaque year will find Cal older and unreconciled.",
    resolved: "Whatever Ada said, or refused to say, is the tone of every later Voss scene.",
    sets: { "flags.stage.st.bridge.e1.interrupted": true },
  }),
  forkText:
    "Fourteen years of tolls have worn the same bowl-chip in Ida's kitchen and a different man at the rail. Ada's face is irrelevant until it proves it can find the crack.",
  forkVariant: {
    when: { bond: "voss_crossing" },
    text: "The landing is the bond you claimed at creation. Cal sees you choose the crack the way kin do, and he hates the resemblance before he hates the face.",
  },
  mode: "exactlyOne",
  partitionFlags: ["flags.bridge.testimony_given", "flags.bridge.testimony_withheld", "flags.bridge.unresolved"],
  secondLife: { npcId: "p.cal_voss", era: "E1" },
  nextStageIds: ["st.bridge.e3"],
  variants: [
    {
      id: "fell",
      flag: "flags.bridge.testimony_withheld",
      door: "There is no brother on the pier. Go to Cal before you say anything else.",
      beats: [
        {
          speakerId: "p.cal_voss",
          text: "Don't introduce yourself. Bram fell off the repair in the gap, on the pier your silence kept unjacketed. Stand on the crack and say Bram Voss. After that you can be Ada or anyone. Before that you are a person wasting the year I have left to hate usefully.",
        },
        {
          speakerId: "p.ida_voss",
          text: "I fed you once, or I fed the body before this one. The bowl is chipped in the same place. If his chair is empty, do not fill it with a schoolteacher's sympathy. Say the name or take the bowl outside and leave it.",
        },
        {
          speakerId: "p.cal_voss",
          text: "I am not asking you to remember a past life. I am asking you to pay the sentence you owe this abutment. The state jacketed nothing. My brother paid. Your new mouth is not a fresh start. It is a tool. Use it or get off my wood.",
        },
      ],
      endings: [
        {
          choiceId: "name",
          choice: "Say Bram Voss before any other word of business.",
          speakerId: "p.cal_voss",
          text: "Again. Bram Voss. That's enough for today. You don't get my thanks and you don't get the log. You get to have said it on the ground where he isn't. Come back when you can be useful without being forgiven.",
          flags: { "flags.bridge.bram_named": true, "flags.met.cal": true, "flags.stage.st.bridge.e1.done": true },
          summary: "The name is said on the abutment. Cal remains unforgiving and specific.",
          branchId: "br.bridge.named",
        },
        {
          choiceId: "refuse_name",
          choice: "Refuse the test. Offer your name instead.",
          speakerId: "p.cal_voss",
          text: "Then we have nothing. Ada Smollet can teach school and stay off my landing. I will not be a lesson in your second chance. Bram stays in my mouth because you wouldn't take him into yours.",
          flags: { "flags.met.cal": true, "flags.stage.st.bridge.e1.done": true },
          summary: "Ellis refuses the name. Cal closes the landing's confidence.",
          branchId: "br.bridge.unnamed",
        },
      ],
    },
    {
      id: "jacket",
      flag: "flags.bridge.testimony_given",
      door: "The pier wears a jacket of newer concrete. Cal is not smiling about it.",
      beats: [
        {
          speakerId: "p.cal_voss",
          text: "They jacketed it. I lost a season of fares and I kept a brother. Bram is alive and angry and not yours to collect. If you remember the pencil, say what the jacket covered, exactly, in inches of dust, or get off my abutment. I don't want your new face coming for thanks.",
        },
        {
          speakerId: "p.bram_voss",
          text: "I am alive. That is not a gift from a stranger. If you know where the ticks were, you stood here when I did, or someone coached you, and I don't care which. Don't make my not-dying into your credential.",
        },
        {
          speakerId: "p.cal_voss",
          text: "Fourteen years of being the man who forced a repair. People still blame the slow season on me. I would do it again and I will not be hugged for it. Say the measurement or admit you only have the story.",
        },
      ],
      endings: [
        {
          choiceId: "measure",
          choice: "Name the thumb-wide powder line the jacket covered, nothing sweeter.",
          speakerId: "p.bram_voss",
          text: "That's the line. You can go. I won't drink with you. The pencil is still in Cal's drawer if the state ever calls the jacket a decoration. Don't you call it one.",
          flags: { "flags.bridge.pier_read": true, "flags.met.cal": true, "flags.stage.st.bridge.e1.done": true },
          summary: "Ellis proves the memory as a measurement. Bram stays alive and ungrateful.",
          branchId: "br.bridge.measured",
        },
        {
          choiceId: "story",
          choice: "Admit you have the story of the jacket and not the inches.",
          speakerId: "p.cal_voss",
          text: "Then you're a person who heard a kitchen. Kitchens talk. The pier doesn't. I'll keep the fares I lost and the brother I kept, and you can be Ada in the road like anybody. Don't come for a share.",
          flags: { "flags.met.cal": true, "flags.stage.st.bridge.e1.done": true },
          summary: "Ellis cannot prove the ticks. Cal keeps the credit and the cost inside the family.",
          branchId: "br.bridge.unproven",
        },
      ],
    },
    {
      id: "open",
      flag: "flags.bridge.unresolved",
      door: "The pier is unjacketed and Bram is still alive. Nothing was finished.",
      beats: [
        {
          speakerId: "p.cal_voss",
          text: "Somebody started this and died or left. The pencil's still in the crack. I have had fourteen years of almost. If you're here to finish it, finish it today. If you're here to be mysterious, the toll is a dollar and the mystery is extra, and I don't take the extra.",
        },
        {
          speakerId: "p.bram_voss",
          text: "I've been waiting on a testimony that never arrived. My thumb still finds the powder. I am not a symbol. I am a man who didn't fall yet. That's not the same as safe.",
        },
        {
          speakerId: "p.cal_voss",
          text: "Ada, or whoever is using that mouth: the hay is in this year. You don't get my old speech about waiting. You get one chance to put the dust on paper before I decide the landing no longer hosts this argument.",
        },
      ],
      endings: [
        {
          choiceId: "finish",
          choice: "Finish it. Put the 1952 ticks on paper now.",
          speakerId: "p.bram_voss",
          text: "Late is a kind of true. I'll take late. Don't look at me like we embraced. Tell them the concrete powders. I'll stay off the top while they work.",
          flags: {
            "flags.bridge.testimony_given": true,
            "flags.met.cal": true,
            "flags.stage.st.bridge.e1.done": true,
          },
          summary: "The unresolved pier is testified in 1966. The mutex moves off unresolved.",
          branchId: "br.bridge.late_testimony",
        },
        {
          choiceId: "drop",
          choice: "Leave the argument. Pay the toll and be Ada only.",
          speakerId: "p.cal_voss",
          text: "Then the landing is a landing. I'll stop waiting on a sentence. Bram can risk himself like a grown man. You can teach spelling. We won't be each other's proof.",
          flags: { "flags.met.cal": true, "flags.stage.st.bridge.e1.done": true },
          summary: "Ellis drops the bridge argument. Cal stops waiting.",
          branchId: "br.bridge.dropped",
        },
      ],
    },
  ],
  alt: {
    npcId: "p.cal_voss",
    surrogateId: "p.ida_voss",
    resolution:
      "If Cal dies before this season's meeting, Ida forces the same first sentence without his logistics. The second life still is not a greeting.",
    opening: {
      speakerId: "p.ida_voss",
      text: "Cal is dead and the crack is not. I will not let a new face skip the hard word. If Bram is gone, you say him. If the jacket is on, you say what it covered. I don't do reunions. I do bowls and names.",
    },
    branches: [
      {
        id: "br.bridge.ida_name",
        choiceId: "ida_name",
        choice: "Say the name or the measurement, whichever the pier demands.",
        endSpeakerId: "p.ida_voss",
        end: "That's the word. You can eat. You cannot be comforted. Comfort is how people skip the next true thing.",
        flags: { "flags.bridge.bram_named": true, "flags.stage.st.bridge.e1.done": true },
        summary: "Ida extracts the hard word in Cal's absence.",
      },
      {
        id: "br.bridge.ida_skip",
        choiceId: "ida_skip",
        choice: "Refuse the word and leave the bowl.",
        endSpeakerId: "p.ida_voss",
        end: "Then go hungry off my landing. I have buried enough men to know a skipped name when I hear silence.",
        flags: { "flags.stage.st.bridge.e1.done": true },
        summary: "Ellis refuses Ida. The landing's confidence stays shut.",
      },
    ],
  },
});

function later(id, title, era, location, who, surrogate, extra, summary, discovery, implications, steps, opening, branches, rewards, deathSets, next, prereqFlags) {
  return asStage(
    standalone({
      id,
      title,
      locationId: location,
      eras: [era],
      characters: extra ? [who, extra.npc] : [who],
      summary,
      discovery,
      implications,
      prerequisites: {
        all: [{ flag: `flags.era.${era}`, eq: true }],
        any: prereqFlags.map((flag) => ({ flag, eq: true })),
        none: [],
      },
      steps,
      opening,
      branches,
      rewards,
      death: death({
        mid: deathSets.mid,
        unresolved: deathSets.unresolved,
        resolved: deathSets.resolved,
        sets: deathSets.sets,
      }),
      alt: {
        npcId: who,
        surrogateId: surrogate,
        resolution: deathSets.altResolution,
        opening: { speakerId: surrogate, text: deathSets.altOpen },
        branches: deathSets.altBranches,
      },
      extraAlts: extra ? [extra.alt] : undefined,
    }),
    next,
  );
}

const e3 = later(
  "st.bridge.e3",
  "The Plaque With the Wrong Names",
  "E3",
  "loc.addison.chimney_point",
  "p.cal_voss",
  "p.lena_voss",
  null,
  "Tolls have been gone since 1987. A plaque draft names a contractor and omits a painter who fell. Cal will not attend the unveiling unless the names are fixed. He keeps the log now because kindness failed.",
  "The plaque draft is tacked inside the toll shed that no longer takes tolls. You see it because you duck in out of the lake wind, not because a sign tells you to care.",
  "The names on the eventual plaque are this choice. A blank, a comfort, or a painter. The 2022 reading of the new bridge starts from this sentence.",
  [
    "Read the draft aloud, including the missing painter, before anyone makes a speech.",
    "Hear Cal refuse the suit and the ceremony.",
    "Change the draft, bless the comfort, or leave the plaque blank.",
  ],
  {
    speakerId: "p.cal_voss",
    text: "They took the tolls off and left the lying to a plaque. A contractor's name is in brass-to-be. The painter who fell is a blank. I will not stand in a suit while they forget him. Fix the names or unveil it to an empty rail. I am done being kind about records.",
    variant: {
      when: { ideal: "names_aloud" },
      text: "Names are the whole of your ideal, and Cal knows it. He slides the draft so the blank sits under your hand like a dare, not a courtesy.",
    },
    variants: [
      {
        when: { flags: ["flags.bridge.testimony_withheld"] },
        text: "You kept the season in 1952, and Bram fell off the unjacketed repair before Ada woke. Cal does not narrate it. He puts the plaque draft over the place in the log where Bram's name would have been a fare, not a eulogy. The blank is his brother. If you fix the names, you are late. If you comfort the plaque, you are insulting a fall you could have prevented.",
      },
      {
        when: { flags: ["flags.bridge.testimony_given"] },
        text: "You made them jacket the pier, and Bram lived long enough to be angry about it and then died of ordinary years. Cal will not let the plaque thank a stranger for that. The contractor's brass is already a lie. The painter is the smaller lie. He wants the draft to name the dust, not the mercy, because the mercy cost him a season of fares he has never stopped itemizing.",
      },
    ],
  },
  [
    {
      id: "br.plaque.true",
      choiceId: "true",
      choice: "Put the painter's name in and take the contractor off the honor line.",
      middleSpeakerId: "p.lena_voss",
      middle:
        "I'll copy it clean. Father won't come to the unveiling even then. He thinks ceremonies are how counties wash. The log will have the painter. That's the part I can promise.",
      endSpeakerId: "p.cal_voss",
      end: "Good. I still won't wear the suit. If they read it right, the lake can have the rest. Don't you add a sentence about brotherhood. One name. Then stop.",
      flags: { "flags.bridge.plaque_true": true, "flags.stage.st.bridge.e3.done": true, "flags.met.cal": true },
      summary: "The plaque will name the painter. Cal refuses the ceremony and accepts the sentence.",
    },
    {
      id: "br.plaque.comfort",
      choiceId: "comfort",
      choice: "Leave the contractor. Call the blank a mercy.",
      middleSpeakerId: "p.cal_voss",
      middle:
        "Mercy is the word people use when they want the dead to be decorative. I kept this log after kindness failed. You just voted for decoration. Lena will do what the town says. I will not be in the picture.",
      endSpeakerId: "p.lena_voss",
      end: "I'll file it as written. I won't lie to him at supper and say you were brave. The comfort will look like a bridge from the road. Up close it will look like a gap.",
      flags: { "flags.bridge.plaque_comfort": true, "flags.stage.st.bridge.e3.done": true },
      summary: "The plaque keeps the comfortable names. Cal withdraws from the unveiling.",
    },
    {
      id: "br.plaque.blank",
      choiceId: "blank",
      choice: "Strike every name. Leave the plaque blank rather than half-true.",
      middleSpeakerId: "p.lena_voss",
      middle:
        "A blank will make the selectboard furious and my father almost kind. Almost. He'll say a blank is honest and then he'll hate the honesty by Thursday. I can live with Thursday.",
      endSpeakerId: "p.cal_voss",
      end: "Blank is the only sentence I trust this year. If someone later carves a truth, they can earn it. I won't donate my brother's ghost to their brass.",
      flags: { "flags.bridge.plaque_blank": true, "flags.stage.st.bridge.e3.done": true, "flags.met.cal": true },
      summary: "The plaque stays blank. Cal trusts the blank more than a partial honor.",
    },
  ],
  [
    reward("record", "reward.bridge.plaque", "The plaque draft is settled as truth, comfort, or blank."),
    reward("stance", "reward.bridge.cal_old", "Cal in 1994 keeps records because kindness failed, not because he is gentle."),
  ],
  {
    mid: "If Hannah dies before the draft is touched, Lena files the town's comfort version and Cal does not attend.",
    unresolved: "An unresolved plaque becomes whatever the selectboard can afford to engrave.",
    resolved: "The chosen plaque-fact survives into the new span.",
    sets: { "flags.stage.st.bridge.e3.interrupted": true, "flags.bridge.plaque_blank": true },
    altResolution: "If Cal is dead by this unveiling, Lena holds the draft and will not let the town call absence agreement.",
    altOpen:
      "Father is not here to refuse the suit. I am. The blank where the painter should be is still blank. Tell me if I am copying a truth, a comfort, or nothing. I will not guess his virtue for you.",
    altBranches: [
      {
        id: "br.plaque.lena_true",
        choiceId: "lt",
        choice: "Tell Lena to put the painter in and strike the comfort.",
        endSpeakerId: "p.lena_voss",
        end: "Then that's the copy. I'll read it without a crowd if I have to. A name doesn't need a suit.",
        flags: { "flags.bridge.plaque_true": true, "flags.stage.st.bridge.e3.done": true },
        summary: "Lena makes the plaque true without Cal.",
      },
      {
        id: "br.plaque.lena_blank",
        choiceId: "lb",
        choice: "Tell her to file a blank and not invent his wish.",
        endSpeakerId: "p.lena_voss",
        end: "Blank. I can defend a blank at town meeting. I can't defend a guess about a dead man's taste.",
        flags: { "flags.bridge.plaque_blank": true, "flags.stage.st.bridge.e3.done": true },
        summary: "Lena files a blank rather than counterfeit Cal.",
      },
    ],
  },
  ["st.bridge.e4"],
  ["flags.stage.st.bridge.e1.done", "flags.stage.st.bridge.e1.interrupted"],
);

const e4 = later(
  "st.bridge.e4",
  "The Summer Before the Closure",
  "E4",
  "loc.addison.bridge_abutment",
  "p.lena_voss",
  "p.noah_voss",
  null,
  "It is 2008. The piers are dusting in a way that matches Bram's old pencil. Ellis, in Chris Dobbs, can force a plain warning at the Vermont landing or protect the last busy summer that feeds the Route 17 stand.",
  "Noah has a hand on the rail and is not performing awe. Lena has the old log open to a page that is not today's. The concrete under the jacket, where the jacket has cracked, powders if you touch it.",
  "A warning in 2008 makes the 2009 closure a choice the county had. Silence makes it a betrayal. The creemee stand's last summer is the living cost of the warning.",
  [
    "Press the cracked jacket until it powders and show Lena, not a crowd.",
    "Say whether the summer's traffic is worth a delayed sentence.",
    "Leave a warning in the log or leave the log ordinary.",
  ],
  {
    speakerId: "p.lena_voss",
    text: "My father died on this abutment in 2004 looking at a span he opened anyway. If you know something about the piers, this is the dull year to say it. Dull years are the only ones that count. The stand up Route 17 will hate you if you spook August. I will hate you if you don't.",
    variant: {
      when: { flaw: "spares_a_kind_lie" },
      text: "You spare kind lies, and August is full of them. Lena watches you almost choose the stand's feelings over the powder on your thumb.",
    },
    variants: [
      {
        when: { flags: ["flags.bridge.testimony_withheld"] },
        text: "The log still has the year you would not testify. Lena does not call you a killer. She shows you the cracked jacket and the blank where a warning should have been in 1952, and she says the dull year is the only year that ever counts. Pearl's stand will hate a spooked August. Lena will hate a second silence more, because the first one already took her uncle off this abutment.",
      },
      {
        when: { flags: ["flags.bridge.plaque_true"] },
        text: "The plaque at the landing already names the painter, because you refused the comfort version in 1994. Lena treats that as proof you can be dull in public. She wants the same dullness about the dust under the cracked jacket, not a speech about how honest the family has already been. Honesty in 1994 does not cash a check in 2008. The powder is new.",
      },
    ],
  },
  [
    {
      id: "br.warn.2008",
      choiceId: "warn",
      choice: "Put a plain warning in the log: the piers are dusting again.",
      middleSpeakerId: "p.noah_voss",
      middle:
        "People say it's fine because they need it. I pump gas. I hear the need. I don't hear the concrete. If you write it, write it dull. Heroic warnings get ignored on purpose.",
      endSpeakerId: "p.lena_voss",
      end: "Dull it is. I'll take it to the meeting on this shore. I won't promise they close anything in time. I will promise they don't get to say nobody told them. Pearl can survive a spooked August. A drop can not.",
      flags: { "flags.bridge.warned_2008": true, "flags.stage.st.bridge.e4.done": true },
      summary: "The 2008 warning is logged. The closure, when it comes, is not a surprise.",
    },
    {
      id: "br.season.2008",
      choiceId: "season",
      choice: "Keep August unfrightened. Leave the powder out of the log.",
      middleSpeakerId: "p.lena_voss",
      middle:
        "Then you chose the stand and the wages and you also chose to be a person who knew. I won't tattle. I will write, in the margin only I read, that Chris Dobbs touched the dust and shut up. Margins have a history in this county.",
      endSpeakerId: "p.noah_voss",
      end: "If it closes next year like a trick, I won't look at you for comfort. I'll look at the detour. Just so we're clear before the cones sell out.",
      flags: { "flags.bridge.season_protected": true, "flags.stage.st.bridge.e4.done": true },
      summary: "The busy summer is protected. Lena keeps a private margin that Ellis knew.",
    },
  ],
  [
    reward("record", "reward.bridge.2008", "Either a public warning or a private margin records what Chris's hands found."),
    reward("knowledge", "reward.bridge.dust_again", "Ellis knows the 1952 disease is back in the concrete."),
  ],
  {
    mid: "If Chris dies at the rail, the powder is on the thumb of a corpse and Lena will not launder it into a guess.",
    unresolved: "No 2008 sentence is logged. The closure arrives like weather.",
    resolved: "Warning or protection is the frame for 2009 and for Ivy's later meaning of last.",
    sets: { "flags.stage.st.bridge.e4.interrupted": true },
    altResolution: "If Lena is dead, Noah holds the log and will not be romantic about a bridge he uses.",
    altOpen:
      "Mom's not here to split the difference between a stand and a pier. I will write what you say and I will not add adjectives. Dull or nothing. Those are the choices I inherited.",
    altBranches: [
      {
        id: "br.warn.noah",
        choiceId: "nw",
        choice: "Tell Noah to write that the piers powder, and stop.",
        endSpeakerId: "p.noah_voss",
        end: "Written. If they ignore it, that's on them, and I will not add a sentence that makes the ignoring look like fate. If you wanted a speech, you picked the wrong Voss. The log has the dust. The stand can hate us in August. I can live with being hated by a pullout.",
        flags: { "flags.bridge.warned_2008": true, "flags.stage.st.bridge.e4.done": true },
        summary: "Noah logs the warning without Lena.",
      },
      {
        id: "br.season.noah",
        choiceId: "ns",
        choice: "Tell him to leave the page ordinary.",
        endSpeakerId: "p.noah_voss",
        end: "Ordinary. I'll remember you chose it, and I don't have her mercy about remembering. The page stays a page a stranger could trust. The dust stays on your thumb and in my head. If the span drops, don't come to the pump and ask me what we knew.",
        flags: { "flags.bridge.season_protected": true, "flags.stage.st.bridge.e4.done": true },
        summary: "Noah leaves the log ordinary and keeps the grudge.",
      },
    ],
  },
  ["st.bridge.e5"],
  ["flags.stage.st.bridge.e3.done", "flags.stage.st.bridge.e3.interrupted"],
);

const e5 = later(
  "st.bridge.e5",
  "What the Promise Was",
  "E5",
  "loc.addison.chimney_point",
  "p.lena_voss",
  "p.noah_voss",
  null,
  "The new bridge is up. It is a different span on the same Vermont ground. Lena asks whether the promise was the object or the sentence. The plaque, if any, is already in the world from 1994, and the warning, if any, was 2008.",
  "You are Rowan, standing on the Vermont approach of the replacement span. Traffic works. Noah has the old log and the new plaque side by side on the hood of a truck. Nobody is lost. That is the problem.",
  "The chain ends by deciding what was promised: a span, a true sentence, or nothing you are willing to anoint. This does not replace the county's ending. It tells the ending which bridge it means.",
  [
    "Read the plaque and the log side by side without a speech.",
    "Say which fact is the promise.",
    "Leave the landing without anointing the new steel, or anoint it in one dull line.",
  ],
  {
    speakerId: "p.lena_voss",
    text: "It is a different bridge and the same ground. I will not pretend those are one fact. The closure happened. The new span opened. People want me to feel finished. Tell me if the promise was the span or the sentence. If you don't know, say you don't know. I am too old for your mystery.",
    variant: {
      when: { ideal: "the_record_holds" },
      text: "You believe the record holds, so Lena puts the log on top of the plaque. She wants to see if your ideal survives a bridge that works.",
    },
    variants: [
      {
        when: { flags: ["flags.bridge.warned_2008"] },
        text: "You warned them in the dull year, and the closure still came. Lena will not let the new span turn that warning into a prophecy you get to enjoy. The promise, if it was a sentence, was the sentence you wrote while the stand still had traffic. She wants you to say whether the steel overhead fulfills it or merely replaces the thing that failed after it was told.",
      },
      {
        when: { flags: ["flags.bridge.season_protected"] },
        text: "You kept August unfrightened, and Lena's private margin says Chris Dobbs touched the dust and shut up. She has the margin on the hood next to the new plaque. She is not offering you a confession booth. She is asking whether a span that works is allowed to be the promise, after you already spent the warning on wages and cones.",
      },
    ],
  },
  [
    {
      id: "br.promise.sentence",
      choiceId: "sentence",
      choice: "The promise was the sentence, not the steel.",
      middleSpeakerId: "p.noah_voss",
      middle:
        "Then the log is the bridge and this thing overhead is a tool. I can work a tool. I won't call it a kept vow. Mom wants the word exact. I'm giving you the practical version.",
      endSpeakerId: "p.lena_voss",
      end: "Sentence. I'll write that in the back of the log where vows go to stay unperformed and honest. The steel can carry cars. It doesn't carry Bram, or my father, or you.",
      flags: { "flags.stage.st.bridge.e5.done": true, "flags.bridge.promise_sentence": true },
      summary: "The promise is named as the sentence. The new span is demoted to a tool.",
    },
    {
      id: "br.promise.span",
      choiceId: "span",
      choice: "The promise was that a span would be here, and it is.",
      middleSpeakerId: "p.lena_voss",
      middle:
        "Then all the names were maintenance. I don't agree. I will still write what you said, because the landing's job is not to win the argument. It is to show what was claimed.",
      endSpeakerId: "p.noah_voss",
      end: "Span's here. I'm not ungrateful to the engineers. I'm also not going to pretend the old pencil was about commuting. You picked commuting. Own it.",
      flags: { "flags.stage.st.bridge.e5.done": true, "flags.bridge.promise_span": true },
      summary: "Ellis calls the new span the kept promise. The Vosses record the claim without sharing it.",
    },
  ],
  [
    reward("knowledge", "reward.bridge.promise", "Ellis has said whether the promise was span or sentence."),
    reward("record", "reward.bridge.backlog", "Lena writes the claim in the back of the landing log."),
  ],
  {
    mid: "If Rowan dies on the approach, Noah writes 'unfinished' and does not pick the prettier noun.",
    unresolved: "The new bridge stays a bridge. The promise stays unspoken.",
    resolved: "The spoken noun, span or sentence, is what later tellings of this shore are allowed to repeat.",
    sets: { "flags.stage.st.bridge.e5.interrupted": true },
    altResolution: "If Lena is dead, Noah will not invent her noun. He asks once and then writes.",
    altOpen:
      "She's not here to be exact for both of us. I need the noun. Span or sentence. If you give me a paragraph I will keep the first noun and throw out the rest. That's the log I can stand.",
    altBranches: [
      {
        id: "br.promise.noah_sentence",
        choiceId: "nsent",
        choice: "Tell Noah: sentence.",
        endSpeakerId: "p.noah_voss",
        end: "Sentence. Written. I won't frame it. The truck hood is not an altar.",
        flags: { "flags.stage.st.bridge.e5.done": true, "flags.bridge.promise_sentence": true },
        summary: "Noah records the promise as the sentence.",
      },
      {
        id: "br.promise.noah_span",
        choiceId: "nspan",
        choice: "Tell Noah: span.",
        endSpeakerId: "p.noah_voss",
        end: "Span. Written. Don't ask me to feel finished. I have to open tomorrow.",
        flags: { "flags.stage.st.bridge.e5.done": true, "flags.bridge.promise_span": true },
        summary: "Noah records the promise as the span.",
      },
    ],
  },
  [],
  ["flags.stage.st.bridge.e4.done", "flags.stage.st.bridge.e4.interrupted"],
);

export const bridgeChain = {
  id: "q.chain.bridge",
  title: "The Bridge That Was Promised",
  kind: "chain",
  locationId: "loc.addison.chimney_point",
  eraEligibility: ["E0", "E1", "E3", "E4", "E5"],
  summary:
    "Across seventy years the Vermont landing of the Lake Champlain Bridge asks what was promised: a pier that would be told on, a brother who would be named, a plaque that would not comfort itself, a warning before the closure, and a sentence that outlives the steel.",
  endingImplications:
    "If the promise is named as a sentence, the new span cannot launder the wound. If it is named as a span, the county gets to feel finished. Neither replaces Ellis's ending. Both tell that ending whether the shore was honest.",
  secondLifeNpc: "p.cal_voss",
  chainStages: [e0, e1, e3, e4, e5],
};
