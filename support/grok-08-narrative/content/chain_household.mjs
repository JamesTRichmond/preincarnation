import { duo, chain } from "./duo.mjs";
import { reward } from "./death.mjs";

const prev = (era, id) => ({
  all: [{ flag: `flags.era.${era}`, eq: true }],
  any: [
    { flag: `flags.stage.${id}.done`, eq: true },
    { flag: `flags.stage.${id}.interrupted`, eq: true },
  ],
  none: [],
});

const done = (id, extra) => ({ [`flags.stage.${id}.done`]: true, ...extra });

const e0 = duo({
  id: "st.house.e0",
  era: "E0",
  title: "The Plate That Is Not a Trick",
  locationId: "loc.orwell.quiet_house",
  characters: ["p.esther_waite", "p.harold_waite"],
  summary:
    "In 1952 the Waite kitchen in Orwell has already set a plate for Cress Moss, the life that stopped the morning Ellis woke in Rennet. Esther offers two kindnesses and will not call either a homecoming. Harold will not let the clock be recruited.",
  discovery:
    "Rennet's feet take the Orwell road without a summons. The Waite door is unlatched because Esther cooks with it open, not because anyone is expected. A plate is served. The hall clock is stopped. No one at the table calls it a welcome.",
  implications:
    "Eating ends the plate tomorrow and lets Cress's morning be finished in the house's practice. Leaving the plate makes Esther set it until she dies. Later keepers inherit a stopped kindness or a fed one, and they do not get to pretend the choice was weather.",
  steps: [
    "Enter the Orwell kitchen and look at the plate before anyone explains it.",
    "Hear Esther name the two kindnesses, and hear Harold refuse to start the clock as part of the bargain.",
    "Eat Cress's plate or leave it, and stay long enough for the house to say which practice dies.",
  ],
  opening: {
    speakerId: "p.esther_waite",
    text: "Cress Moss had a morning. You are standing in what is left of it, and I am not going to guess your name to make the table easier. The plate is onions and a life that did not sit down. Eat, and I stop setting it tomorrow. Leave it, and I set it until I die. Harold has already decided the clock. I am deciding the stove. Neither of us is offering you a homecoming in Orwell.",
    variant: {
      when: { bond: "waite_house" },
      text: "You are bound to this house, so Esther does not ask whether the plate matters. She sets the spoon where your hand will find it and says the kindnesses as house rules, not as news. Eat, and the plate ends tomorrow. Leave it, and she keeps Cress's place until her own death. The clock stays Harold's and stays stopped.",
    },
  },
  branches: [
    {
      id: "br.house.ate",
      choiceId: "eat_the_plate",
      choice: "Eat the plate, and let tomorrow's place be empty.",
      middleSpeakerId: "p.harold_waite",
      middle:
        "Harold Waite does not sit. He watches the first bite as if it were a measurement. The clock stays at the minute he chose. Eating does not wind it. If she stops the plate tomorrow, she is telling the truth about a finished morning. Don't you thank the clock for agreeing. It isn't.",
      endSpeakerId: "p.esther_waite",
      end: "Tomorrow the place is empty. I will not praise you for finishing Cress Moss's breakfast, and I will not set it again to punish you for having a mouth. You ate. The practice ends. Harold can keep his minute. I keep my word. If you call this a homecoming on the Orwell road, you will be lying, and I will correct you in front of whoever is left.",
      flags: { "flags.household.ate": true },
      summary: "Ellis eats the plate set for Cress. Esther ends the practice the next day and refuses the word homecoming.",
    },
    {
      id: "br.house.left",
      choiceId: "leave_the_plate",
      choice: "Leave the plate. Let Esther set it until she dies.",
      middleSpeakerId: "p.harold_waite",
      middle:
        "Harold nods once, which is not approval. The food will go to the hens or the cold, and the clock will not be asked to bless the waste. Leaving is a sentence. It is not a prayer. He will not say Cress's name a second time to decorate it.",
      endSpeakerId: "p.esther_waite",
      end: "Then I set it until I die. That is the kindness you chose, and it is mine to pay for, not yours to visit. Don't stand in the doorway and look fed by the gesture. You are not. The plate stays Cress Moss's until my hands stop. Harold's minute and my place setting are now both refusals. I can live in a house with two of them.",
      flags: { "flags.household.left_plate": true },
      summary: "The plate is left. Esther will set Cress's place until her own death, and she will not let the gesture feed Ellis.",
    },
  ],
  rewards: [
    reward("stance", "reward.house.e0.stance", "The Orwell house records whether Cress's plate was eaten or kept as a practice, and Esther will not rename either one a welcome."),
    reward("knowledge", "reward.house.e0.know", "Ellis knows the stopped clock and the plate are different refusals, and that only the plate was offered as a choice."),
  ],
  deathMid:
    "Rennet dies in the Orwell kitchen before the plate is eaten or left. Esther scrapes it into the hens' pail and does not decide the practice on a dead guest's behalf. Harold does not wind the clock to mark the death.",
  deathOpen:
    "The season turns with the plate untouched and uneaten. Esther keeps setting it, but she will not claim Ellis chose the practice. The choice stays unfinished and the clock stays stopped.",
  deathShut:
    "The eaten plate or the lasting place setting remains what the house does. The next body is not greeted as if the 1952 kindness were still negotiable.",
  alt: {
    npcId: "p.esther_waite",
    surrogateId: "p.harold_waite",
    resolution:
      "If Esther is already dead, Harold will not inherit her hospitality. He states the plate as her unfinished practice and makes Ellis choose without a warm voice in the room.",
    opening: {
      speakerId: "p.harold_waite",
      text: "Esther is dead. The plate was hers. I stopped the clock and I am not starting it to bury her. Eat, and nobody in this house sets Cress Moss a place tomorrow, because I won't. Leave it, and the cold food is a fact I will look at until I follow her. I don't do kindness. I do the minute and the question she left.",
    },
    branches: [
      {
        id: "br.house.ate_harold",
        choiceId: "eat_without_esther",
        choice: "Eat, so Harold can stop the place setting.",
        endSpeakerId: "p.harold_waite",
        end: "Eaten. Tomorrow the table has one less lie. I will not thank you, and I will not wind the clock because a plate is finished. Cress Moss stays a morning that stopped. That is all the Orwell kitchen is getting from me.",
        flags: { "flags.household.ate": true },
        summary: "With Esther dead, Harold lets the plate be eaten and ends the setting without turning it into care.",
      },
      {
        id: "br.house.left_harold",
        choiceId: "leave_without_esther",
        choice: "Leave the plate in the dead woman's kitchen.",
        endSpeakerId: "p.harold_waite",
        end: "Left. Then it sits until it spoils, and I look at it. Don't call that Esther's kindness continuing. She isn't here to pay it. I'm here to refuse a prettier ending. The clock stays stopped.",
        flags: { "flags.household.left_plate": true },
        summary: "Harold keeps the uneaten plate as a hard fact after Esther's death and will not rename it her kindness.",
      },
    ],
  },
  extraAlts: [
    {
      npcId: "p.harold_waite",
      surrogateId: "p.esther_waite",
      resolution:
        "If Harold is already dead, Esther still offers the plate, and she will not pretend the stopped clock needs his voice to remain stopped. The choice is still eat or leave.",
      opening: {
        speakerId: "p.esther_waite",
        text: "Harold died with the clock already stopped. I am not asking you to wind it in his place. The plate is mine. Cress Moss does not get a eulogy from a man who isn't in the hall. Eat, and I stop setting it tomorrow. Leave it, and I set it until I die. That was the offer before he went, and death didn't improve it.",
      },
      branches: [
        {
          id: "br.house.ate_esther",
          choiceId: "eat_esther_alone",
          choice: "Eat the plate with only Esther left to witness it.",
          endSpeakerId: "p.esther_waite",
          end: "Tomorrow it is empty. I don't need Harold to ratify an empty place. You ate Cress Moss's breakfast in a house that will not call you home. The clock can stay his, stopped, without an audience.",
          flags: done("st.house.e0", { "flags.household.ate": true }),
          summary: "Esther, alone because Harold is dead, ends the plate after it is eaten and leaves the clock untouched.",
        },
        {
          id: "br.house.left_esther",
          choiceId: "leave_esther_alone",
          choice: "Leave the plate, and let Esther carry the practice alone.",
          endSpeakerId: "p.esther_waite",
          end: "Then I carry it. No clock-keeper, no chorus. A plate until I die. If that looks like grief from the road, the road is wrong. It is a practice. You chose the long one.",
          flags: done("st.house.e0", { "flags.household.left_plate": true }),
          summary: "Esther keeps Cress's place until her death without Harold, and she names it a practice rather than grief.",
        },
      ],
    },
  ],
  next: ["st.house.e1"],
});

const e1 = duo({
  id: "st.house.e1",
  era: "E1",
  title: "One Inconvenient Want",
  locationId: "loc.orwell.quiet_house",
  characters: ["p.esther_waite", "p.clara_waite"],
  summary:
    "In 1966 Esther asks Ada Smollet for one thing Adah wanted that Ellis will not perform. Clara is in the kitchen to catch a pretty want. The house will write a true inconvenience or it will catch Ellis using the ink.",
  discovery:
    "The second plate is already a problem when Ada reaches the Orwell house. Esther has the book open to a blank line and Clara has the pen uncapped, as if they argued about the pen before the door. Nobody sent for a teacher. The damper in the school's story is not yet a sentence.",
  implications:
    "A true want gives the household one fact about Adah they can be rude toward: the stove, the refusal of public thanks. A pretty want is heard by Clara and stains the book. Later keepers can trust the line or know it was performed.",
  prerequisites: prev("E1", "st.house.e0"),
  steps: [
    "Stand at the kitchen table until Esther asks for a want, and do not offer a speech before she asks.",
    "Say either the damper and the refused thanks, or a want that would look kind in a book.",
    "Let Clara accept the inconvenience or throw the pretty sentence back.",
  ],
  opening: {
    speakerId: "p.esther_waite",
    text: "Fourteen years and a new face, and I still don't want your biography. Tell me one thing Adah Smollet wanted that you, in that body, will not do. Not a pretty want. A small, inconvenient, real one. I will write it. Then this house can be rude in the correct direction. Clara is here because she thinks I am too ready to be moved. She is right to watch the ink.",
    variant: {
      when: { flaw: "spares_a_kind_lie" },
      text: "Esther sees the kindness rising in Ada's mouth and puts her hand on the book. Clara already has the sentence you would spare them. A kind lie about Adah would be easy and inaccurate. Esther wants the damper, or she wants you to admit you are about to decorate a dead plan. The Orwell kitchen will not help you be gentle.",
    },
    variants: [
      {
        when: { flags: ["flags.household.ate"] },
        text: "You ate Cress's plate, and Esther stopped setting it the next day, as she promised. The stove has been ordinary for fourteen years. She is not reopening that kindness. Adah is a different displaced life, and Esther wants one inconvenient want, not a second plate. Clara is watching because a person who will eat a ghost's supper might also invent a pretty future for the next ghost.",
      },
      {
        when: { flags: ["flags.household.left_plate"] },
        text: "You left Cress's plate, and Esther has set it ever since, through her aging and into this second face at her table. She is tired in a way she earned. The want she is asking about Adah is not a new place setting unless you make it one. Clara thinks the kitchen has become a diet of absence. Esther still wants the damper, not a legend, and she will write only what you will not perform.",
      },
    ],
  },
  branches: [
    {
      id: "br.house.true_want",
      choiceId: "say_the_damper",
      choice: "Say Adah wanted the school damper fixed, and no thanks in front of the children.",
      middleSpeakerId: "p.clara_waite",
      middle:
        "Clara waits for the ornament and does not get it. She caps the pen only after the damper is the whole story. No one thanked. That is usable. A house can fail to thank someone. A house cannot live up to a legend without lying before supper.",
      endSpeakerId: "p.esther_waite",
      end: "Written. The damper, and no public thanks. I will not send you to fix it in her place. You said you won't, and I am holding you to the won't. Clara can sneer at me for collecting inconveniences. She can't sneer at this one for being pretty. Adah stays a person who wanted a stove to draw. That is enough line for one life.",
      flags: { "flags.household.true_want": true },
      summary: "Ellis gives Adah's real want. The household writes the damper and the refused thanks, and does not ask Ellis to perform it.",
    },
    {
      id: "br.house.pretty",
      choiceId: "say_the_pretty",
      choice: "Say Adah wanted to be remembered as the teacher who saved the county's handwriting.",
      middleSpeakerId: "p.clara_waite",
      middle:
        "Clara laughs once, short, and not kindly. That want is from a book you read, not from a woman who complained about soot. She pushes the book back toward Esther. If you write that, you are feeding us. I live here. I don't eat memorials.",
      endSpeakerId: "p.esther_waite",
      end: "I heard the pretty want and I heard my daughter. I will not write it. You offered a legend because a legend is easier than a damper. Clara caught it. The line stays blank, and the blank is now held against you, Ada, not against Adah. Don't try a second, better performance. The kitchen has had its one.",
      flags: { "flags.household.pretty_lie": true },
      summary: "Clara catches the pretty want. Esther leaves the line blank and the household holds the performance against Ellis.",
    },
  ],
  rewards: [
    reward("record", "reward.house.e1.line", "The household book either holds Adah's damper and her refusal of thanks, or a blank where a pretty want was refused."),
    reward("knowledge", "reward.house.e1.clara", "Ellis knows Clara will punish a decorative sentence about the displaced, and that Esther wanted an inconvenience she could aim."),
  ],
  deathMid:
    "Ada dies at the Orwell table before the want is said. Clara caps the pen. Esther does not invent Adah's sentence to finish a dead visitor's errand. The line stays blank and unblamed.",
  deathOpen:
    "The season turns with the line unwritten. Esther will not fill it from rumor. Clara remembers that Ellis was asked and did not answer, which is not the same as a pretty lie and not the same as a fact.",
  deathShut:
    "The damper is in the book, or the pretty want is a known refusal. The next body does not get to re-audition Adah's desire in this kitchen.",
  alt: {
    npcId: "p.esther_waite",
    surrogateId: "p.clara_waite",
    resolution:
      "If Esther is already dead, Clara keeps the book and is less willing to be moved. She still demands one real want or she will throw a pretty one out of the house.",
    opening: {
      speakerId: "p.clara_waite",
      text: "Mother is dead and the book is mine now, which she would hate and which is true. I don't want your biography, Ada. One thing Adah wanted that you will not do. If you give me a legend about handwriting, I will not write it and I will not forgive the attempt just because Esther isn't here to be gentler.",
    },
    branches: [
      {
        id: "br.house.true_clara",
        choiceId: "damper_to_clara",
        choice: "Tell Clara about the damper and the refused thanks.",
        endSpeakerId: "p.clara_waite",
        end: "That's a want. Soot and no applause. I'll write it because it can be failed. I will not send you to the school to become Adah for an afternoon. You don't get credit for a stove you won't touch.",
        flags: { "flags.household.true_want": true },
        summary: "Clara, keeping the book after Esther's death, writes the damper and refuses Ellis any errand that would perform it.",
      },
      {
        id: "br.house.pretty_clara",
        choiceId: "pretty_to_clara",
        choice: "Offer Clara the legend of the saving teacher.",
        endSpeakerId: "p.clara_waite",
        end: "No. That's a speech for a dead woman who complained about the damper. The line stays blank. You can leave Orwell with the legend still in your mouth. It doesn't get to live in this book.",
        flags: { "flags.household.pretty_lie": true },
        summary: "Clara refuses the pretty want outright and leaves Adah's line blank rather than let a legend into the house book.",
      },
    ],
  },
  extraAlts: [
    {
      npcId: "p.clara_waite",
      surrogateId: "p.miriam_waite",
      resolution:
        "If Clara is already dead, Miriam watches the ink in her sister's place. She is less amused and just as unwilling to let a pretty want become housekeeping.",
      opening: {
        speakerId: "p.miriam_waite",
        text: "Clara is dead, so you don't get the laugh. You get me. Mother wants one inconvenient true thing Adah wanted, and she wants it in the book. I want to hear whether you are about to make our dead into a lesson. Speak the want, Ada. I will say if it is food.",
      },
      branches: [
        {
          id: "br.house.true_miriam",
          choiceId: "damper_to_miriam",
          choice: "Say the damper and the private thanks, with Miriam listening.",
          endSpeakerId: "p.miriam_waite",
          end: "Write it, Mother. A damper and no scene in front of children. That can be true without feeding us. Ada, you don't fix it. You already said you won't. Good. A want is not a chore you inherit with the face.",
          flags: done("st.house.e1", { "flags.household.true_want": true }),
          summary: "Miriam lets the true want into the book and blocks any attempt to turn it into Ada's chore.",
        },
        {
          id: "br.house.pretty_miriam",
          choiceId: "pretty_to_miriam",
          choice: "Say the saving-teacher legend while Miriam holds the book.",
          endSpeakerId: "p.miriam_waite",
          end: "That's food. Don't write it. Adah is not a county lesson and you don't get to be moved by her in our kitchen. The line stays blank. Clara would have been louder. I am only finished.",
          flags: done("st.house.e1", { "flags.household.pretty_lie": true }),
          summary: "Miriam rejects the pretty want after Clara's death and leaves the household line blank.",
        },
      ],
    },
  ],
  next: ["st.house.e3"],
});

const e3 = duo({
  id: "st.house.e3",
  era: "E3",
  title: "Measurements or Housekeeping",
  locationId: "loc.orwell.quiet_house",
  characters: ["p.miriam_waite", "p.joel_waite"],
  summary:
    "In 1994 Miriam is failing the argument she has had with herself for decades. The cloth book of displaced names can go to the survey office and become measurements, or stay in the house and make Joel the heir of strange housekeeping. Hannah Greer is not offered a third, cleaner book.",
  discovery:
    "The book is on the kitchen table in Orwell because Miriam took it out of the drawer before Hannah arrived. Joel has not sat down. The office is not in the room. The choice is visible as cloth, names, and two pairs of hands that disagree about what a record is for.",
  implications:
    "If the book goes to the office, the displaced become lines a survey can cite, including this house's private accuracies. If it stays, Joel inherits a practice he resents and the office does not get to measure Cress, Adah, Lou, and Nan. The ending may mention the names only in the form this choice allowed.",
  prerequisites: prev("E3", "st.house.e1"),
  steps: [
    "Read no farther than Miriam lets the book fall open. The names are not a pile to be taken.",
    "Hear Joel say which inheritance he can stand, without agreeing in order to soothe him.",
    "Leave the book in his hands or carry it toward the office, and let Miriam say which one she can forgive.",
  ],
  opening: {
    speakerId: "p.miriam_waite",
    text: "Hannah, or whoever is using the year: this is not the flood book and you will not merge them to feel tidy. These are the names this house kept because the office would have kept them wrong. Take it to Middlebury and you make them measurements. Leave it and my son inherits strange housekeeping. I know which one I can forgive. I am asking you which one you can carry without calling yourself kind.",
    variant: {
      when: { ideal: "the_record_holds" },
      text: "You want the book where a record lives, and Miriam sees that hunger before you speak. She does not argue that the office is evil. She argues that a measurement is a different act from a plate. Joel will not rescue you from the distinction. The cloth book stays on the Orwell table until you pick a harm.",
    },
  },
  branches: [
    {
      id: "br.house.office",
      choiceId: "carry_the_book",
      choice: "Carry the household book to the survey office.",
      middleSpeakerId: "p.joel_waite",
      middle:
        "Joel does not grab it back. He says, then it's your craft and not my cupboard. I'll hate the citation more than I hate the plates, and I already hate the plates. If a name gets read aloud in a rented room as evidence, don't tell me I consented. I consented to not being the only one who knows.",
      endSpeakerId: "p.miriam_waite",
      end: "Take it. I won't forgive it, and I said that before you chose. Joel gets a cleaner cupboard and a worse county. When they measure Cress and Adah and Lou and Nan, they will sound accurate. Accuracy was not the thing I was keeping them from. I was keeping them from being useful. You are useful, Hannah. That is not a compliment tonight.",
      flags: { "flags.household.book_to_office": true },
      summary: "The household book goes to the survey office. Miriam does not forgive the usefulness. Joel is left with a cleaner cupboard.",
    },
    {
      id: "br.house.stays",
      choiceId: "leave_the_book",
      choice: "Leave the book in the house, with Joel.",
      middleSpeakerId: "p.joel_waite",
      middle:
        "Then it's mine when she's done saying so. I don't want it. I want the wanting to be over. I'll keep it because she asked, and I will not pretend keeping is the same as believing the plates feed anyone but us. Don't you visit to check on my belief.",
      endSpeakerId: "p.miriam_waite",
      end: "Good. Strange housekeeping is the one I can forgive. The office can live without these names. Joel can live with them, angrily, which is a kind of accuracy I trust more than a fair copy. Hannah, you don't get a key to the drawer. You already have a life that wasn't going to be yours.",
      flags: { "flags.household.book_stays": true },
      summary: "The book stays in the house. Joel inherits it as strange housekeeping, not as a belief, and the office does not get the names.",
    },
  ],
  rewards: [
    reward("record", "reward.house.e3.book", "The cloth book of displaced names is either a survey holding or still a household drawer, and that difference is public inside the family."),
    reward("stance", "reward.house.e3.forgive", "Miriam's forgiveness, or the refusal of it, is attached to the book's location and will not be re-litigated as manners."),
  ],
  deathMid:
    "Hannah dies before the book moves. Miriam puts it back in the drawer herself and tells Joel the choice was interrupted, not inherited. The office does not receive a dead woman's errand.",
  deathOpen:
    "The book remains on the table through the turn of the season and then goes back to the drawer undecided. Joel does not inherit a verdict. Miriam does not pretend the office won by silence.",
  deathShut:
    "The book's place, office or house, remains the 1994 fact. A later body does not get to move it back under the name of kindness.",
  alt: {
    npcId: "p.miriam_waite",
    surrogateId: "p.joel_waite",
    resolution:
      "If Miriam is already dead, Joel has the book and the resentment without her forgiveness to aim at. He still asks Hannah to choose office or house, because leaving it unchosen was her last unfinished demand.",
    opening: {
      speakerId: "p.joel_waite",
      text: "She's dead and the book is in my hands, which is not the same as a decision. Take it to the office and the names become measurements. Leave it and I keep a cupboard I resent. I won't perform her speech. I will make you pick, Hannah, so I don't get to say the year decided for me.",
    },
    branches: [
      {
        id: "br.house.office_joel",
        choiceId: "office_after_miriam",
        choice: "Take the book to the office now that Miriam cannot forbid it.",
        endSpeakerId: "p.joel_waite",
        end: "Then go. I won't walk with you. If they cite my mother's handwriting, that's the harm you picked. I'll hate it plainly. Don't come back for a blessing the dead woman already refused you.",
        flags: { "flags.household.book_to_office": true },
        summary: "Joel releases the book to the office after Miriam's death and withholds any blessing she would not have given.",
      },
      {
        id: "br.house.stays_joel",
        choiceId: "stays_after_miriam",
        choice: "Leave the book with Joel and do not make it evidence.",
        endSpeakerId: "p.joel_waite",
        end: "Then it stays. I'll keep it the way I keep tools I don't love. Not as a shrine. If you tell the office we have a secret book, you will be making measurements out of a cupboard. Don't.",
        flags: { "flags.household.book_stays": true },
        summary: "Joel keeps the book as an unloved tool after Miriam's death, and forbids Ellis from describing it to the office.",
      },
    ],
  },
  extraAlts: [
    {
      npcId: "p.joel_waite",
      surrogateId: "p.eden_waite",
      resolution:
        "If Joel is already dead, Eden is old enough in this telling to hear the stakes, and Miriam will not use her granddaughter as a soft reason. The book still moves or stays.",
      opening: {
        speakerId: "p.miriam_waite",
        text: "Joel is dead. I will not hand this to Eden as if a child could absolve a record. Hannah, the choice got worse and didn't change. Office, and they become measurements. House, and I keep strange housekeeping with one less son. Say which harm. She can hear it. She is not the judge.",
      },
      branches: [
        {
          id: "br.house.office_eden",
          choiceId: "office_eden_hears",
          choice: "Send the book to the office while Eden hears the refusal.",
          endSpeakerId: "p.miriam_waite",
          end: "Take it. Eden, remember that I did not forgive this. Remember it as a fact, not as a story you have to repair. The names will be useful now. Usefulness is the injury.",
          flags: done("st.house.e3", { "flags.household.book_to_office": true }),
          summary: "Miriam lets the book go to the office with Eden as witness and names usefulness as the injury.",
        },
        {
          id: "br.house.stays_eden",
          choiceId: "stays_eden_hears",
          choice: "Keep the book in the house, and do not make Eden its reason.",
          endSpeakerId: "p.miriam_waite",
          end: "It stays. Not because she is young and kind. Because the office does not get these names. Eden can hate the drawer later. That is allowed. Hannah, you don't get a copy to feel responsible.",
          flags: done("st.house.e3", { "flags.household.book_stays": true }),
          summary: "The book stays, not as Eden's inheritance of sweetness, and Miriam refuses Hannah a copy.",
        },
      ],
    },
  ],
  next: ["st.house.e4"],
});

const e4 = duo({
  id: "st.house.e4",
  era: "E4",
  title: "The Bed Made for Someone Else",
  locationId: "loc.orwell.east_room",
  characters: ["p.miriam_waite", "p.eden_waite"],
  summary:
    "In 2008 the east room is made up for a life that is not going to sleep there. Christian Dobbs was going to stay a mechanic. Chris is in the doorway. Miriam is a year from dying and will not run the night. Eden, twenty-eight, wants the groceries of the thing discussed, not its portion of memory.",
  discovery:
    "The east-room lamp is already lit when Chris comes up from the kitchen. The bed is made with hospital corners that predate the visit. Eden is sitting on the trunk so the bed cannot be casually used. Miriam is in the chair because standing is expensive. Nobody offered a tour.",
  implications:
    "Sleeping in the bed uses the displaced life as lodging. Stripping it ends the hospitality without a speech. Sitting the night up refuses both use and demolition. Eden remembers which one happened when she later decides whether a living person may rent the room.",
  prerequisites: prev("E4", "st.house.e3"),
  steps: [
    "Stop in the doorway of the east room and do not sit until the bed has been spoken about.",
    "Hear Eden separate groceries from memory, and hear Miriam refuse to adjudicate from the chair.",
    "Sleep in the bed, strip it, or sit the night up without using it.",
  ],
  opening: {
    speakerId: "p.eden_waite",
    text: "Christian's plate downstairs is too much food. I said portion is groceries. They said portion is memory. This bed is the same argument with sheets. You can sleep in it and make the room a lodging. You can strip it and make the room honest and a little cruel. You can sit up and be useless on purpose. Grandmother is not going to pick. She has spent the year dying on a schedule and she is off duty. Chris, the bed was not made for you. That's the only courtesy I have.",
    variant: {
      when: { ideal: "the_living_first" },
      text: "You are inclined to ask what the living in the room need, and Eden is the living one on the trunk. She does not want your sympathy for Christian turned into a night's sleep. Miriam will not choose. The sheets are a decision about use, waste, or refusal, and the east room will show it in the morning.",
    },
  },
  branches: [
    {
      id: "br.house.slept",
      choiceId: "sleep_in_the_bed",
      choice: "Sleep in the bed the house made for the displaced life.",
      middleSpeakerId: "p.miriam_waite",
      middle:
        "Miriam watches Eden stand up off the trunk and does not stop her or help her. From the chair she says, then it's lodging. I won't call it desecration. I also won't call it care. Christian isn't warmed by it. You are. In the morning the sheets will say someone used the room. That is a true sentence. It isn't a kind one.",
      endSpeakerId: "p.eden_waite",
      end: "You slept. I'll change the sheets because I live here, not because you earned a turn-down. Don't tell anyone in Orwell you kept a vigil. You kept warm. Grandmother can forgive a truth faster than a vigil. I can forgive neither tonight, and I don't have to. The bed was used. That's the record.",
      flags: { "flags.household.slept_east": true },
      summary: "Chris sleeps in the east-room bed. Eden calls it warmth, not a vigil, and Miriam lets the sheets be a true sentence.",
    },
    {
      id: "br.house.stripped",
      choiceId: "strip_the_bed",
      choice: "Strip the bed so it cannot host a ghost or a guest.",
      middleSpeakerId: "p.eden_waite",
      middle:
        "Eden takes the pillow before being asked and stacks it on the trunk. She wanted this and is angry that wanting it feels like a win. Stripping is not an insult she gets to enjoy. It is laundry. Christian doesn't feel the laundry. The room feels less like a dare.",
      endSpeakerId: "p.miriam_waite",
      end: "Bare mattress. Good. I am too tired to love the gesture and too honest to call it violent. The room can be a room. Eden, don't gloat on the landing. Chris, don't apologize to the sheets. A practice can end in laundry without a hymn. I won't start one from this chair.",
      flags: { "flags.household.stripped_bed": true },
      summary: "The east-room bed is stripped. Miriam refuses both hymn and apology, and the room becomes a room by laundry.",
    },
    {
      id: "br.house.sat",
      choiceId: "sit_the_night",
      choice: "Sit the night up. Do not use the bed and do not strip it.",
      middleSpeakerId: "p.miriam_waite",
      middle:
        "Miriam almost smiles and doesn't. Sitting up is the choice of a person who cannot leave a gate and cannot bear to close it. She recognizes the type and does not reward it. The bed stays made. The body stays uncomfortable. Nobody is improved.",
      endSpeakerId: "p.eden_waite",
      end: "Then we all lose a night and the bed stays a dare. I'll allow it. I won't admire it. In the morning the sheets are still smooth and you are useless, which you chose, and Grandmother gets to say she didn't spend her last year commanding guests. Chris, when you leave, leave the lamp. I'll put it out. That's house work, not your symbol.",
      flags: { "flags.household.sat_up": true },
      summary: "Chris sits the night without using or stripping the bed. Eden allows the unfinished room and refuses to admire it.",
    },
  ],
  rewards: [
    reward("stance", "reward.house.e4.bed", "The east room in 2008 records use, laundry, or a night sat up, and Eden will not translate any of the three into a vigil."),
    reward("knowledge", "reward.house.e4.eden", "Ellis knows Eden separates groceries from memory, and that Miriam has refused to adjudicate the bed."),
  ],
  deathMid:
    "Chris dies in the east room before the bed is used, stripped, or sat with. Eden strips it in the morning as housework after a death, and she does not record the stripping as Ellis's choice.",
  deathOpen:
    "The night ends with the bed still made and unused because no one chose. Eden does not upgrade indecision into a vigil. Miriam does not choose from the chair after the season turns.",
  deathShut:
    "Use, laundry, or the sat night remains what the room did. A later renter, if one comes, inherits sheets with that history and not a blank rite.",
  alt: {
    npcId: "p.miriam_waite",
    surrogateId: "p.eden_waite",
    resolution:
      "If Miriam is already dead, Eden will not borrow her grandmother's chair or her authority. She still makes Chris choose what the made bed is for, and she will not supply a vigil.",
    opening: {
      speakerId: "p.eden_waite",
      text: "Grandmother is dead and the bed is still made, because the house makes it. I am not her. Sleep in it, strip it, or sit up. I won't call any of those a tribute. Christian isn't here and neither is she. Chris, pick a way for the sheets to look in the morning.",
    },
    branches: [
      {
        id: "br.house.slept_eden",
        choiceId: "sleep_eden_only",
        choice: "Sleep in the bed, with only Eden to name it.",
        endSpeakerId: "p.eden_waite",
        end: "You slept. I'll say warmth if anyone in Orwell asks, and I'll say it without the story. Change is my job in the morning. Don't help. Helping would make it a scene.",
        flags: { "flags.household.slept_east": true },
        summary: "With Miriam dead, Eden lets Chris sleep and names it warmth, then refuses help that would turn the morning into a scene.",
      },
      {
        id: "br.house.stripped_eden",
        choiceId: "strip_eden_only",
        choice: "Strip the bed with Eden and leave the mattress bare.",
        endSpeakerId: "p.eden_waite",
        end: "Bare. Good. I wanted this and I'm not going to enjoy it in the hallway. The room is a room. If I rent it someday, I won't pretend the sheets were sacred first.",
        flags: { "flags.household.stripped_bed": true },
        summary: "Eden strips the bed after Miriam's death and keeps the act from becoming either a victory or a sacrilege.",
      },
    ],
  },
  extraAlts: [
    {
      npcId: "p.eden_waite",
      surrogateId: "p.joel_waite",
      resolution:
        "If Eden is already dead, Joel will not let the bed become his mother's religion or his daughter's. He asks Chris to use it, strip it, or sit, and he will resent all three without forbidding them.",
      opening: {
        speakerId: "p.joel_waite",
        text: "Eden's dead. Don't you look for her on the trunk. Mother is in the chair and off duty, which means I say the practical part. Sleep, strip, or sit. I hated the extra plate my whole life. I won't pretend a mattress is wiser than I am. Choose, Chris. Then live with me hating it quietly.",
      },
      branches: [
        {
          id: "br.house.slept_joel",
          choiceId: "sleep_joel_hears",
          choice: "Sleep in the bed while Joel stays in the hall.",
          endSpeakerId: "p.joel_waite",
          end: "Fine. Warmth. I'll hate the poetry if you add any at breakfast. The sheets got used. Mother can call that true. I call it a bed doing a bed's job in a house that over-explains itself.",
          flags: done("st.house.e4", { "flags.household.slept_east": true }),
          summary: "Joel lets the bed be used and forbids any breakfast poetry about the night.",
        },
        {
          id: "br.house.sat_joel",
          choiceId: "sit_joel_hears",
          choice: "Sit the night up, and let Joel call it unfinished.",
          endSpeakerId: "p.joel_waite",
          end: "Sitting up. Of course. The house specialty. I'll leave the lamp and I won't admire you. In the morning the bed is still a dare and you are tired. That's an honest ugly outcome. I'll take it over a speech.",
          flags: done("st.house.e4", { "flags.household.sat_up": true }),
          summary: "Joel accepts a night sat up as the house's ugly honesty and refuses to admire it.",
        },
      ],
    },
  ],
  next: ["st.house.e5"],
});

const e5 = duo({
  id: "st.house.e5",
  era: "E5",
  title: "Say Them Once and Dry the Plates",
  locationId: "loc.orwell.quiet_house",
  characters: ["p.eden_waite", "p.joel_waite"],
  summary:
    "In 2022 Eden can keep setting places for people the returns push out, or she can say the names once at the water below the pasture and dry the plates. Joel kept the practice because Miriam asked. Rowan is not asked to become Maren. The certificate stays or is spoken.",
  discovery:
    "Eden has the plates in the rack, not on the table, and Joel has said out loud that keeping them was obedience. The drawer is open to Maren Keel's certificate. The pasture below the house runs to a ditch that counts as water in a dry week. No one is invited to a ceremony. The rack is simply not empty yet.",
  implications:
    "Dried plates end the household's feeding of the returns. The names, spoken once at the ditch, are not a choir and not a filing. Kept plates mean the kitchen continues to spend food on lives that will not sit down. The ending of Ellis's story can mention this house only in the mode the plates were left.",
  prerequisites: prev("E5", "st.house.e4"),
  steps: [
    "Look at the rack and the open drawer before agreeing to walk anywhere.",
    "Walk with them only as far as the ditch below the Waite pasture, still on their land in Orwell.",
    "Say the names once and dry the plates, or leave the places set and Maren's certificate unspoken as a performance.",
  ],
  opening: {
    speakerId: "p.eden_waite",
    text: "I can keep setting places for people the returns push out, or I can say the names once at the ditch and dry the plates. I can't stop you coming back, Rowan. I can stop feeding it a house. Father kept this because Grandmother asked. That is not a belief I have to inherit. Maren's certificate is in the drawer. You don't get to do her life. You only get to hear whether this kitchen stays in the business of extra food.",
    variant: {
      when: { bond: "waite_house", ideal: "names_aloud" },
      text: "You are bound to the house and you want names said aloud, which Eden already intends to spend carefully. One saying at the ditch is not a life of plates. She will not let your bond turn a single speaking into a permanent supper. Joel is here so obedience can be distinguished from belief.",
    },
    variants: [
      {
        when: { flags: ["flags.household.book_to_office"] },
        text: "The cloth book is already in Middlebury, because you made the names measurements. Eden cannot unmeasurement them by drying a plate. She can stop feeding the practice that remained in the kitchen after the book left. If you say the names at the ditch, you are speaking a list the office also holds, and she wants that doubleness admitted. If you keep the plates, you are feeding a house that no longer even has its own book.",
      },
      {
        when: { flags: ["flags.household.book_stays"] },
        text: "The book stayed in the house, strange housekeeping and all, because you would not make the names a survey. Eden has inherited that decision as a weight, not as a romance. Drying the plates does not throw the book away. It stops the food. She will not let you treat the book and the plates as one sacred object. Joel kept both because Miriam asked. Eden is allowed to split them.",
      },
      {
        when: { flags: ["flags.household.slept_east"] },
        text: "You slept in the east-room bed in the closure year, and the sheets have been ordinary ever since, which Joel still resents and Eden does not. The bed being used is not a reason to keep setting extra food. She is asking about plates, not about whether a mattress can be a person. Maren's certificate is paper. The night you slept there does not make you the life the bed was dressed for.",
      },
    ],
  },
  branches: [
    {
      id: "br.house.released",
      choiceId: "say_and_dry",
      choice: "Say the names once at the ditch, then dry the plates for good.",
      middleSpeakerId: "p.joel_waite",
      middle:
        "Joel says the first names because he is the one who resented them and they should not only be loved out loud. Cress. Adah. Lou. Nan. Christian. He stops before Maren and looks at Rowan, not for permission, for a limit. He will say Maren if Eden says the list includes the life standing in the yard wearing a different plan.",
      endSpeakerId: "p.eden_waite",
      end: "Maren Keel. There. Six names, once, at a ditch that isn't holy. I'm drying the plates. If you come back in some other year, Rowan, you don't get a setting here. Father's obedience is finished because I finished it, not because it aged into wisdom. The certificate goes back in the drawer as paper. The food stops.",
      flags: { "flags.household.names_released": true },
      summary: "The names are spoken once at the ditch, including Maren, and Eden dries the plates. The kitchen leaves the business of extra food.",
    },
    {
      id: "br.house.kept",
      choiceId: "keep_setting",
      choice: "Keep setting the places. Do not make Rowan perform the names.",
      middleSpeakerId: "p.joel_waite",
      middle:
        "Joel swears once, tired, and picks up a plate as if it were heavier than ceramic. Then I keep spending groceries on a belief I don't have. Mother asked. Eden is allowed to refuse and she isn't refusing. Don't you thank me. Thank is how this house gets trapped for another generation.",
      endSpeakerId: "p.eden_waite",
      end: "The places stay set. I am choosing the food, not the sermon. Maren's certificate stays in the drawer and you will not read it out to prove you can be decent. Rowan, if you eat here, you eat a person's portion, not a symbol's. Father, we reassess when the money fails, not when a visitor feels symbolic. That's the rule now.",
      flags: { "flags.household.names_kept": true },
      summary: "The plates continue. Joel spends groceries without belief, Maren is not performed, and Eden sets a money-rule rather than a rite.",
    },
  ],
  rewards: [
    reward("stance", "reward.house.e5.plates", "The Quiet Household either leaves the business of extra food or continues it as groceries with a money-rule, not as a sermon."),
    reward("knowledge", "reward.house.e5.maren", "Rowan hears whether Maren's name was said once at the ditch or left as a certificate, and knows the house will not ask for a performance of her life."),
  ],
  deathMid:
    "Rowan dies in the yard before the ditch or the rack is decided. Eden dries nothing in tribute. Joel puts the certificate back and will not say the names to an empty body.",
  deathOpen:
    "The season ends with the plates still in the rack and the certificate still in the drawer. Eden does not upgrade delay into a rite. The next keeper, if different, inherits an unfinished rack.",
  deathShut:
    "Dried plates or continued settings remain the kitchen's rule. A later telling of Ellis's returns may mention this house only in that mode, and may not add a choir the ditch did not hold.",
  alt: {
    npcId: "p.eden_waite",
    surrogateId: "p.joel_waite",
    resolution:
      "If Eden is already dead, Joel will not let the last question become a eulogy for his child. He can still say the names once and dry the plates, or keep setting them out of the obedience he already resents.",
    opening: {
      speakerId: "p.joel_waite",
      text: "Eden is dead. I won't use her sentence as a haunting. I know it anyway. Say the names once at the ditch and dry the plates, or keep setting them because my mother asked and I never stopped. Rowan, you don't become Maren to help me decide. You stand there and pick a cost I can actually pay.",
    },
    branches: [
      {
        id: "br.house.released_joel",
        choiceId: "dry_with_joel",
        choice: "Say the names with Joel and dry the plates.",
        endSpeakerId: "p.joel_waite",
        end: "Once. Cress, Adah, Lou, Nan, Christian, Maren. I hated every extra plate and I said them anyway. The rack dries. If that's Eden's line without Eden, it's also just the end of a grocery. Don't visit the ditch again. Once is the whole design.",
        flags: { "flags.household.names_released": true },
        summary: "Joel says the six names once after Eden's death and dries the plates, forbidding a return visit to the ditch.",
      },
      {
        id: "br.house.kept_joel",
        choiceId: "keep_with_joel",
        choice: "Keep the settings, and do not make a ditch-speech.",
        endSpeakerId: "p.joel_waite",
        end: "Then I keep spending. Obedience outlived the woman I was obeying and the daughter who could have stopped it. I won't dress that up. The certificate stays paper. You stay Rowan. Supper is food. That's the whole remaining doctrine.",
        flags: { "flags.household.names_kept": true },
        summary: "Joel keeps the settings as spending, not doctrine, after Eden's death, and leaves Maren unread.",
      },
    ],
  },
  extraAlts: [
    {
      npcId: "p.joel_waite",
      surrogateId: "p.eden_waite",
      resolution:
        "If Joel is already dead, Eden cannot use his resentment as a witness. She still chooses the ditch or the plates, and she will not invent his blessing.",
      opening: {
        speakerId: "p.eden_waite",
        text: "Father is dead, so you don't get his complaint as a counterweight. I can still say the names once and dry the plates, or I can keep feeding a practice he kept from obedience. I won't pretend he'd bless either. Rowan, Maren stays unperformed either way. Choose the kitchen.",
      },
      branches: [
        {
          id: "br.house.released_eden",
          choiceId: "dry_eden_alone",
          choice: "Say the names at the ditch and dry the plates without Joel.",
          endSpeakerId: "p.eden_waite",
          end: "Said. Dried. I won't quote my father and I won't quote my grandmother. Six names at a ditch, then ordinary plates for the living. If the house feels thinner, good. Thin was the point. Maren's paper goes back in the drawer.",
          flags: done("st.house.e5", { "flags.household.names_released": true }),
          summary: "Eden speaks the names and dries the plates without Joel's witness, and she refuses to quote the dead as blessing.",
        },
        {
          id: "br.house.kept_eden",
          choiceId: "keep_eden_alone",
          choice: "Keep setting places, without calling it Joel's obedience.",
          endSpeakerId: "p.eden_waite",
          end: "They stay set, and not because he would have. He's dead. I am choosing groceries for absent lives with my eyes open. You don't read Maren aloud to make me feel accompanied. Accompaniment isn't on the menu.",
          flags: done("st.house.e5", { "flags.household.names_kept": true }),
          summary: "Eden keeps the plates by her own choice after Joel's death and will not have Maren read for comfort.",
        },
      ],
    },
  ],
  next: [],
});

export const householdChain = chain(
  {
    id: "q.chain.household",
    title: "The Quiet Household",
    locationId: "loc.orwell.quiet_house",
    eraEligibility: ["E0", "E1", "E3", "E4", "E5"],
    summary:
      "The Waite house in Orwell keeps plates, a stopped clock, a cloth book, and an east-room bed for lives displaced when Ellis wakes in a body. Across five seasons the house decides whether to feed that fact, write it truly, surrender it to the office, use the bed, and finally dry the plates or keep spending groceries.",
    endingImplications:
      "A dried rack means the returns no longer get a kitchen. A continued setting means the cost stays edible and local. A book in the office means the names can be cited; a book in the drawer means they stay housekeeping. The bed's use, laundry, or refusal is a 2008 fact Eden can remember without turning it into a vigil. None of these are a romance and none of them crown Ellis. They change what a final account is allowed to do with Orwell.",
  },
  [e0, e1, e3, e4, e5],
);
