import { duo } from "./duo.mjs";
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

export const floodEarly = [
  duo({
    id: "st.flood.e0",
    era: "E0",
    title: "The Page That Hurts",
    locationId: "loc.middlebury.survey_office",
    characters: ["p.norma_seaver", "p.gordon_perch"],
    summary:
      "In 1952 the flood book lies open in the rented survey room because a thaw drip reached the cabinet. The certification says the gate stayed shut. Ivo's margin says it was opened late. Norma wants a fair copy. Gordon wants the mess called a fraud or left ugly. Rennet does not get to be Ivo.",
    discovery:
      "You are in the Court Street room because the door is propped with a brick and the page is already drying on a towel. Nobody sent a rodman. Norma is ashamed of the towel. Gordon is ashamed of you. The two sentences are visible without a request.",
    implications:
      "Keeping both sentences in the official book forces every later reader to hurt. A fair copy lets the county quote a shut gate. A private card hides the margin and makes the book look settled. The 2022 signing speaks into whichever page this choice left.",
    steps: [
      "Read both sentences on the towel before agreeing with either person in the room.",
      "Hear Norma defend neatness as mercy and Gordon defend mess as the only procedure he trusts.",
      "Leave both sentences in the book, make the fair copy, or move the margin onto a private card.",
    ],
    opening: {
      speakerId: "p.norma_seaver",
      text: "Don't tell me your name yet. The certification says the gate remained shut and the lower works were preserved. The pencil in the margin says opened, late, both mercies missed. One of those makes the other look like panic or like a lie. A fair copy could let this county stop bleeding on a single page. I am not ashamed of wanting that. I am ashamed of the towel. Gordon thinks shame is a method. It isn't. Choose the page strangers will be allowed to see.",
      variant: {
        when: { ideal: "the_record_holds" },
        text: "You want the written thing to be the thing that happened, and Norma sees the hunger. She will not let you call both sentences a record until you say which strangers may hold them. Gordon will call any answer a confidence game. The towel under the flood book is not a metaphor. It is wet.",
      },
    },
    branches: [
      {
        id: "br.flood.margin",
        choiceId: "keep_both",
        choice: "Keep the certification and the margin in the official book.",
        middleSpeakerId: "p.gordon_perch",
        middle:
          "Gordon laughs without pleasure. Then every clerk in Middlebury gets to feel haunted, which you will enjoy, and every cellar gets a proverb instead of a gate. Fine. Leave it ugly. Ugliness at least has a procedure: you read it and you don't get to feel finished. Don't thank me. I wanted you to be a fraud I could file.",
        endSpeakerId: "p.norma_seaver",
        end: "Both, then. I will hate the fights this page starts and I will not sand them down after you leave. If a later deputy fair-copies it, she will be undoing you, not me. Gordon, you don't get to tell the selectboard I lost my nerve. I lost an argument. The book keeps the hurt. That is a decision, not a stain I forgot.",
        flags: { "flags.floodbook.margin_kept": true },
        summary: "The official flood book keeps both the certification and Ivo's margin. Norma accepts the fights. Gordon refuses to call it holiness.",
      },
      {
        id: "br.flood.fair",
        choiceId: "fair_copy",
        choice: "Make the fair copy. Leave the margin out of the official book.",
        middleSpeakerId: "p.norma_seaver",
        middle:
          "Norma already has the clean sheet in the drawer, which is its own confession. She does not pretend she decided this morning. The shut gate can be what the county quotes. The pencil can live in a folder marked private, where panic goes when a deputy is kind. She asks you to watch her copy the attestation and stop her if your mouth can't stand the omission.",
        endSpeakerId: "p.gordon_perch",
        end: "There. A clean lie with good handwriting. When a cellar floods, they'll read Norma and feel governed. I hope the folder burns. I won't burn it. Burning would make me the kind of man who believes in relics. Rennet, or whoever you are, you helped her sand my uncle into a public servant. Enjoy the quiet. It won't last in the basements.",
        flags: { "flags.floodbook.fair_copy": true },
        summary: "A fair copy becomes the book the county may quote. The margin leaves the official page. Gordon names it a clean lie and does not burn the folder.",
      },
      {
        id: "br.flood.card",
        choiceId: "private_card",
        choice: "Copy the margin onto a private card and leave the book looking settled.",
        middleSpeakerId: "p.gordon_perch",
        middle:
          "A card is a relic you can lose in a coat. Gordon hates it more than the fair copy, because a card lets you feel honest without letting the town argue. He says so. He also does not take the card. Taking it would mean he agrees to be its priest. He won't.",
        endSpeakerId: "p.norma_seaver",
        end: "The book looks settled. The card does not. I will not file the card, and I will not pretend I don't know which coat it's in. If you die, Rennet, that card is not a will. It is a panic someone might mistake for instructions. Gordon won't carry it. I won't index it. You are inventing a third problem because two sentences were too loud.",
        flags: { "flags.floodbook.private_card": true },
        summary: "The official book looks settled. The margin lives on a private card nobody will index. Norma calls it a third problem.",
      },
    ],
    rewards: [
      reward("record", "reward.flood.e0.page", "The 1952 flood book is either a double sentence, a fair copy, or a settled book with a card in a coat."),
      reward("knowledge", "reward.flood.e0.hurt", "Ellis knows Norma thinks neatness prevents fights and Gordon thinks neatness is how a cellar gets a proverb."),
    ],
    deathMid:
      "Rennet dies in the survey room before the page is chosen. Norma blots the towel and does not fair-copy a dead visitor's silence. Gordon tells the selectboard nothing useful.",
    deathOpen:
      "The season turns with both sentences still on the damp page and no copy made. Later readers inherit an accident, not a decision, and Norma will not pretend the towel was policy.",
    deathShut:
      "Margin, fair copy, or card remains the form of the book. A later body does not get to call the 1952 choice unfinished if it was finished over the towel.",
    alt: {
      npcId: "p.norma_seaver",
      surrogateId: "p.gordon_perch",
      resolution:
        "If Norma is already dead, Gordon has the book and no deputy to make neatness sound like care. He still demands a choice, because a dead woman's drawer is not a decision.",
      opening: {
        speakerId: "p.gordon_perch",
        text: "Norma's dead and the page is still wet enough to smear. I won't fair-copy it to honor her. I also won't leave it to mildew and call mildew honesty. Keep both sentences, make the clean page she wanted, or put the pencil on a card and feel secretly good. I hate all three. Pick, so I can hate a specific one.",
      },
      branches: [
        {
          id: "br.flood.margin_gordon",
          choiceId: "both_gordon",
          choice: "Keep both sentences in the book Norma isn't here to sand.",
          endSpeakerId: "p.gordon_perch",
          end: "Ugly, then. I'll put it back in the cabinet and I won't write a note that explains you. Explanation is how this office becomes a church. The hurt stays on the page. That's the whole favor.",
          flags: { "flags.floodbook.margin_kept": true },
          summary: "Gordon keeps both sentences after Norma's death and refuses to explain them into a church.",
        },
        {
          id: "br.flood.fair_gordon",
          choiceId: "fair_gordon",
          choice: "Make the fair copy even though Gordon is the only witness.",
          endSpeakerId: "p.gordon_perch",
          end: "Clean. I'll hate you in a specific way now, which is restful. The county gets a shut gate and a dead deputy's wish. Don't ask me to be moved. I'm filing my disgust under ordinary mail.",
          flags: { "flags.floodbook.fair_copy": true },
          summary: "Gordon witnesses the fair copy after Norma's death and files his disgust as ordinary, not sacred.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.gordon_perch",
        surrogateId: "p.helen_perch",
        resolution:
          "If Gordon is already dead, Helen comes as far as the survey-room door and will not be made to sermonize. She still knows the margin names a shut gate she once wanted.",
        opening: {
          speakerId: "p.helen_perch",
          text: "Gordon isn't here to make a sermon, and I won't supply one. I told Ivo to keep the gate shut. The pencil says he didn't, or says he did it late. Norma wants the public page kind. I want to leave this doorway. Tell her whether strangers read both lines or one. Then I'm going home.",
        },
        branches: [
          {
            id: "br.flood.margin_helen",
            choiceId: "both_helen",
            choice: "Let strangers read both lines. Helen may leave.",
            endSpeakerId: "p.helen_perch",
            end: "Both, then. I won't stand here while they call me the mercy or the panic. The page can hurt without my commentary. Norma, blot it. I'm finished being a margin.",
            flags: done("st.flood.e0", { "flags.floodbook.margin_kept": true }),
            summary: "Helen refuses to stay as commentary. Both lines remain for strangers, and she leaves the doorway.",
          },
          {
            id: "br.flood.card_helen",
            choiceId: "card_helen",
            choice: "Put the margin on a card so Helen is not read in public.",
            endSpeakerId: "p.helen_perch",
            end: "A card. Cowardly, and I'll take it. I don't want my sentence in a clerk's mouth. If that makes the book look settled, the book can lie by omission. I am going home before anyone asks me to feel noble about it.",
            flags: done("st.flood.e0", { "flags.floodbook.private_card": true }),
            summary: "Helen accepts the private card so she is not read aloud, and she calls the omission a lie she will live with.",
          },
        ],
      },
    ],
    next: ["st.flood.e1"],
  }),

  duo({
    id: "st.flood.e1",
    era: "E1",
    title: "Which Ink Dries",
    locationId: "loc.middlebury.survey_office",
    characters: ["p.norma_seaver", "p.clark_seaver"],
    summary:
      "In 1966 the cabinet leaks again. Clark says a hearing will read whatever dries. Norma has one blotter and two inks. Ada's face will move if the margin is the survivor. The choice is which sentence the room will be able to say aloud.",
    discovery:
      "The smell of wet paper is in the stair before anyone speaks. Clark has the blotter in his hand and has not used it. The hearing is an hour off, which is why he is sweating and why Norma has not yet performed calm. You walked in because the brick was in the door again.",
    implications:
      "If the margin dries, the hearing must hear lateness. If the certification dries, the hearing gets a shut gate and the pencil becomes a smear. Clark's later requests for precedent grow from whichever sentence survived the blotter.",
    prerequisites: prev("E1", "st.flood.e0"),
    steps: [
      "Look at which sentence the water is taking before you touch the blotter.",
      "Let Clark admit he wants a face that will not flinch in the hearing.",
      "Save the margin or save the certification, and do not pretend the blotter can save both.",
    ],
    opening: {
      speakerId: "p.clark_seaver",
      text: "One blotter. Two inks. If you hesitate, the page chooses by gravity and I won't let gravity be my policy. The hearing will read whatever we save. If your face moves on the pencil, the room will see it, Ada. Decide whether we are walking in with a shut gate or with a late opening. Mother wants both and the water doesn't.",
      variant: {
        when: { flaw: "keeps_a_second_copy" },
        text: "Your hands want a second sheet before the blotter commits. Clark sees it and puts his palm on the dry drawer. A second copy is how this office starts to feel innocent. There is one wet page and one hour. Ada does not get to duplicate her way out of which ink dies.",
      },
      variants: [
        {
          when: { flags: ["flags.floodbook.margin_kept"] },
          text: "You kept both sentences in the official book, and the wet is now choosing between them with gravity. Clark is furious that a policy you already made can be undone by a leak. Saving the margin continues 1952. Saving the certification lets the hearing walk out with the shut gate and lets your earlier courage smear into a stain. He will not call either of those an accident.",
        },
        {
          when: { flags: ["flags.floodbook.fair_copy"] },
          text: "A fair copy already cleaned the margin, and the official page is the kind one. The wet is threatening the only public sentence the county has agreed to trust. Clark wants that sentence to survive because culverts and hearings need it. The pencil, if it still exists, is on a private card and is not what the room will read. He is asking you whether to spend the blotter on the page strangers actually hold.",
        },
        {
          when: { flags: ["flags.floodbook.private_card"] },
          text: "The margin lives on a card in a drawer, and the book on the table looks settled. Water is about to make the settled look true by destroying the argument. Clark knows the card is not the hearing's page. If you save the certification, the card becomes the only dissent and it can be lost in a pocket. If you somehow save a pencil that isn't on this sheet, you are performing a rescue the blotter cannot do. He wants you to admit which object is actually wet.",
        },
      ],
    },
    branches: [
      {
        id: "br.flood.wet_margin",
        choiceId: "save_margin",
        choice: "Blot so the margin dries and the certification smears.",
        middleSpeakerId: "p.norma_seaver",
        middle:
          "Norma does not grab the blotter. She says the hearing will call it panic and they will not be entirely wrong. Panic is still a report. A shut gate that didn't stay shut is not a kindness she can hear read aloud without wanting to correct the reader. She will sit in the hearing and not correct. That is the cost she is naming, not a blessing.",
        endSpeakerId: "p.clark_seaver",
        end: "Pencil, then. I'll walk in with a page that makes my mother look indulgent and my office look late. If your face moves, Ada, I'll say you have a draft in the room and I'll be lying. Don't make me invent a draft. The margin is what dried. We will be hated for a sentence that at least happened.",
        flags: { "flags.floodbook.wet_saved_margin": true },
        summary: "The margin is the ink that dries. Clark takes lateness into the hearing and refuses to invent a draft to explain Ada's face.",
      },
      {
        id: "br.flood.wet_cert",
        choiceId: "save_cert",
        choice: "Blot so the certification dries and the margin smears.",
        middleSpeakerId: "p.norma_seaver",
        middle:
          "Norma exhales like someone who has been holding a broom over a spill for fourteen years. The shut gate will be readable. The pencil will be a gray thumb. She does not call the thumb an accident. She calls it the choice you just made with a blotter, so that later nobody can say the water was the deputy.",
        endSpeakerId: "p.clark_seaver",
        end: "Readable mercy. I'll take it into the hearing and I won't wink. If someone asks about the gray thumb, I'll say the cabinet leaked and a person chose. I won't say the person was a ghost. Ada, keep your face still or don't come in. Stillness is the rest of this decision.",
        flags: { "flags.floodbook.wet_saved_cert": true },
        summary: "The certification dries. Clark will tell the hearing a person chose, and he will not wink the margin back into existence.",
      },
    ],
    rewards: [
      reward("record", "reward.flood.e1.ink", "The 1966 hearing received either the dried margin or the dried certification, and the other ink is a smear a person chose."),
      reward("knowledge", "reward.flood.e1.face", "Ellis knows Clark will not invent a draft to cover a flinch, and that the blotter could not save both sentences."),
    ],
    deathMid:
      "Ada dies before the blotter is used. Clark blots the certification because he will not let a corpse's silence choose the pencil, and he writes that the choice was his.",
    deathOpen:
      "The water takes both inks unevenly and nobody claims the smear. The hearing reads a wreck. Norma will not testify that wreck into a policy after the season turns.",
    deathShut:
      "Whichever sentence dried remains the sentence Clark is willing to read. The smear is not restored by a later, drier conscience.",
    alt: {
      npcId: "p.norma_seaver",
      surrogateId: "p.clark_seaver",
      resolution:
        "If Norma is already dead, Clark still has one blotter and a hearing. He will not perform her kindness. He asks Ada which ink the room is allowed to say.",
      opening: {
        speakerId: "p.clark_seaver",
        text: "Mother's dead and the cabinet still leaks, which is the least poetic fact in Middlebury. One blotter. The hearing is today. Save the pencil or save the attestation. I won't do both with a speech. Ada, your face is not evidence. The ink is. Choose the ink.",
      },
      branches: [
        {
          id: "br.flood.wet_margin_clark",
          choiceId: "margin_clark_only",
          choice: "Save the margin, with only Clark to carry it.",
          endSpeakerId: "p.clark_seaver",
          end: "Pencil. I'll be the one they call indulgent, not her. If that feels like revenge on a dead deputy, it isn't. It's a wet page and a clock. Come in only if you can keep still.",
          flags: { "flags.floodbook.wet_saved_margin": true },
          summary: "Clark carries the dried margin into the hearing after Norma's death and refuses to frame it as revenge.",
        },
        {
          id: "br.flood.wet_cert_clark",
          choiceId: "cert_clark_only",
          choice: "Save the certification and leave the pencil as a smear.",
          endSpeakerId: "p.clark_seaver",
          end: "Attestation. I'll say a person chose. I won't say which person, if you stay in the hall. The gray thumb can be weather to them and a decision to me. That's as split as I'm willing to be.",
          flags: { "flags.floodbook.wet_saved_cert": true },
          summary: "Clark saves the certification alone and keeps the smear as his decision, not the room's rumor.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.clark_seaver",
        surrogateId: "p.gordon_perch",
        resolution:
          "If Clark is already dead, Gordon is old enough to still be angry in the doorway. He will not attend the hearing. He will say which ink he is willing to watch dry.",
        opening: {
          speakerId: "p.gordon_perch",
          text: "Clark's dead and I'm not becoming the son of the office to replace him. Norma can blot. I'll only say this from the door: save the pencil and the hearing hates you honestly, or save the shut gate and the hearing feels governed. I won't walk in. Pick the hate you can stand to hear about later.",
        },
        branches: [
          {
            id: "br.flood.wet_margin_gordon",
            choiceId: "margin_gordon_door",
            choice: "Save the margin while Gordon stays in the doorway.",
            endSpeakerId: "p.gordon_perch",
            end: "Honest hate. Good. I'll hear about it from a clerk and I'll say I told you the door was as far as I go. Don't send me the minutes. Minutes are how hate gets neat.",
            flags: done("st.flood.e1", { "flags.floodbook.wet_saved_margin": true }),
            summary: "Gordon stays out of the hearing. The margin dries, and he refuses the minutes that would neaten it.",
          },
          {
            id: "br.flood.wet_cert_gordon",
            choiceId: "cert_gordon_door",
            choice: "Save the certification. Let Gordon leave without the minutes.",
            endSpeakerId: "p.gordon_perch",
            end: "Governed. They'll feel better and the cellars won't. I said my piece from the door. Norma, blot your mercy. I'm going to lunch, which is not a protest. It's lunch.",
            flags: done("st.flood.e1", { "flags.floodbook.wet_saved_cert": true }),
            summary: "Gordon lets the certification dry and leaves for lunch rather than staging a protest.",
          },
        ],
      },
    ],
    next: ["st.flood.e2"],
  }),

  duo({
    id: "st.flood.e2",
    era: "E2",
    title: "A Smaller Gate",
    locationId: "loc.middlebury.survey_office",
    characters: ["p.clark_seaver", "p.ruth_demerritt"],
    summary:
      "In 1980 Clark wants the flood book to justify a smaller gate: predictable water, a fundable culvert, a precedent that loves the town by repeating the wound at a reduced scale. Ruth counts what the extra water would do to the race. Louis is asked to let the book be used or to refuse it.",
    discovery:
      "Clark has the book open to the dry sentence and a culvert sketch beside it, unasked. Ruth is in the room because she followed the sketch, not because anyone called a meeting. The brick is in the door. The sketch is the discovery.",
    implications:
      "Using the book as precedent lets a new gate wear Ivo's sentence. Refusing it leaves the culvert unfunded by this page and leaves Ruth's count as the objection that stood. Later signatures cannot pretend the book was never offered as a tool.",
    prerequisites: prev("E2", "st.flood.e1"),
    steps: [
      "Read the culvert sketch beside the flood book before you touch either.",
      "Hear Ruth's count of the race, and do not translate it into a proverb.",
      "Let the book justify the gate, or refuse the precedent and leave the sketch unfunded by this page.",
    ],
    opening: {
      speakerId: "p.clark_seaver",
      text: "This is a smaller gate and a louder selectboard. I am not Ivo and I am not asking you to be him, Louis. I am asking the dry sentence to do work: a culvert, a predictable hour of water, fewer cellars. If you stop me, don't offer a proverb. Offer what the flooded cellar gets instead. Ruth thinks the race pays. She came up the hill with the sketch in her head. Let her count, then let the book work or don't.",
      variant: {
        when: { ideal: "water_has_its_level" },
        text: "You don't argue with where water wants to go, and Clark is hoping that sounds like agreement. It isn't. Ruth is the one who will say which bank takes the extra hour. The book can be a precedent or it can stay a page. Water will not read it either way. People will.",
      },
      variants: [
        {
          when: { flags: ["flags.floodbook.wet_saved_margin"] },
          text: "In the thaw you saved the pencil and let the certification smear. Clark has been carrying a page that makes him look like a man who prefers panic to policy. He wants this smaller gate to rehabilitate the book by putting it to work. If you refuse, the margin you rescued stays a mood. If you allow the precedent, you spend the rescued pencil on a culvert and Ruth will say which hour of water that costs.",
        },
        {
          when: { flags: ["flags.floodbook.wet_saved_cert"] },
          text: "You let the margin drown and kept the shut-gate sentence. Clark treats that as the adult book, finally. The sketch in his hand is just the sentence doing the job it was cleaned for. Ruth did not come to admire adulthood. She came to count. Louis, the precedent is easy today because you already chose the easy ink. Clark should not get to pretend this is the first time.",
        },
      ],
    },
    branches: [
      {
        id: "br.flood.refused",
        choiceId: "refuse_precedent",
        choice: "Refuse. The flood book does not justify this gate.",
        middleSpeakerId: "p.ruth_demerritt",
        middle:
          "Ruth nods like a count coming out even. Then the race doesn't inherit his uncle's hour. I'll tell Ansel's memory, or the wheel, nothing romantic. I'll say the book stayed a book. Clark can find another sentence to fund a culvert. He won't like how ordinary the next sentence is. Ordinary is what I trust.",
        endSpeakerId: "p.clark_seaver",
        end: "Refused. I'll tell the selectboard the page is not a tool, and they will hear superstition. I'll correct them once: it is a decision to not repeat a wound at a smaller scale. The cellar still needs a pipe. I'll go find a pipe that doesn't wear Ivo's name. Ruth, your count stands. I won't forge a proverb over it.",
        flags: { "flags.floodbook.precedent_refused": true },
        summary: "The flood book is refused as precedent. Clark must fund the culvert without Ivo's sentence. Ruth's count stands.",
      },
      {
        id: "br.flood.used",
        choiceId: "use_precedent",
        choice: "Let the dry sentence justify the smaller gate.",
        middleSpeakerId: "p.ruth_demerritt",
        middle:
          "Then the race takes an hour it didn't agree to, and I'll write the hour in the mill book as theft with a citation. I won't shout. Shouting is how men turn a count into weather. Louis, if you think a funded culvert loves a town, love it down here where the boards are. I'll still be counting after your meeting adjourns.",
        endSpeakerId: "p.clark_seaver",
        end: "Used. I'll cite the page and I'll cite Ruth's objection in the same paragraph, so nobody later can say the race was a surprise. Precedent is how I love a place: water that arrives when I said it would. You can call that a smaller wound. I'll call it a culvert. Both can be true without becoming friends.",
        flags: { "flags.floodbook.precedent_used": true },
        summary: "The flood book is cited to justify a smaller gate. Clark records Ruth's objection in the same paragraph and does not call the race a surprise.",
      },
    ],
    rewards: [
      reward("stance", "reward.flood.e2.precedent", "The flood book either stayed a page or became a citation for a smaller gate, and Ruth's count is attached either way."),
      reward("knowledge", "reward.flood.e2.count", "Ellis knows Clark will not cover a refusal with a proverb, and knows the race's hour was the objection."),
    ],
    deathMid:
      "Louis dies between the sketch and the choice. Clark does not cite a dead man's silence as precedent. Ruth takes the sketch back down the hill and writes nothing romantic.",
    deathOpen:
      "The sketch stays beside the book and neither use nor refusal is spoken. Clark will not tell the selectboard that hesitation was a yes. Ruth's count remains oral until someone chooses.",
    deathShut:
      "Refusal or citation remains what the 1980 book was for. A later gate cannot be called the first time anyone thought to use the page.",
    alt: {
      npcId: "p.clark_seaver",
      surrogateId: "p.ruth_demerritt",
      resolution:
        "If Clark is already dead, Ruth still has the sketch and will not let the book volunteer itself. She asks Louis to refuse the precedent or to admit the citation, without Clark's smoothness.",
      opening: {
        speakerId: "p.ruth_demerritt",
        text: "Clark's dead and his sketch isn't. I won't read it in his voice. The book is on the table. If you let it justify a gate, say so, and I'll write the hour as a citation. If you refuse, say so, and I'll take the sketch off this desk. I don't do proverbs. Louis, the race is not a metaphor. Pick.",
      },
      branches: [
        {
          id: "br.flood.refused_ruth",
          choiceId: "refuse_ruth",
          choice: "Refuse the precedent. Let Ruth take the sketch.",
          endSpeakerId: "p.ruth_demerritt",
          end: "Off the desk. Good. The book stays a book. I'll tell the wheel nothing poetic. If the selectboard wants a culvert they can want it in sentences that aren't a dead surveyor's panic. I can live with unfunded. I can't live with haunted plumbing.",
          flags: { "flags.floodbook.precedent_refused": true },
          summary: "Ruth removes the sketch after Clark's death. The flood book is not allowed to become haunted plumbing.",
        },
        {
          id: "br.flood.used_ruth",
          choiceId: "use_ruth",
          choice: "Admit the citation. Let Ruth write the hour down.",
          endSpeakerId: "p.ruth_demerritt",
          end: "Cited. I'll write the hour and your name in the mill book, small, so it doesn't become a speech. The race pays. You said it could. Don't visit the wheel to feel complicated about it. Complicated is not a measurement.",
          flags: { "flags.floodbook.precedent_used": true },
          summary: "Ruth records the citation and the hour in the mill book, small, and will not host a complicated visit.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.ruth_demerritt",
        surrogateId: "p.norma_seaver",
        resolution:
          "If Ruth is already dead, Norma will not pretend to count the race. She will say whether she can bear the book being used as a tool, which is a different pain from neatness.",
        opening: {
          speakerId: "p.norma_seaver",
          text: "Ruth isn't here to count, and I won't fake her numbers. Clark wants the dry sentence to fund a culvert. I have spent my life making pages that prevent fights. A tool is not a fair copy. Louis, tell me if I am supposed to watch this book go to work, or if I am supposed to shut it and be called precious.",
        },
        branches: [
          {
            id: "br.flood.refused_norma",
            choiceId: "refuse_norma",
            choice: "Shut the book. Do not let Norma watch it go to work.",
            endSpeakerId: "p.norma_seaver",
            end: "Shut. I'll be called precious by men who own dry shoes. I have been called worse by basements. The page stays a page. Clark can find a culvert sentence that didn't fail anyone in 1938. I won't lend him this one.",
            flags: done("st.flood.e2", { "flags.floodbook.precedent_refused": true }),
            summary: "Norma shuts the book rather than watch it become a tool, and she accepts being called precious.",
          },
          {
            id: "br.flood.used_norma",
            choiceId: "use_norma",
            choice: "Let the book work, and let Norma say she hates the use.",
            endSpeakerId: "p.norma_seaver",
            end: "Then it works, and I hate it in the minutes so the hate is not a mood. Write that the deputy objected and the page was used anyway. If a cellar stays dry, I won't spit on the dry. I also won't pretend the citation was kind.",
            flags: done("st.flood.e2", { "flags.floodbook.precedent_used": true }),
            summary: "Norma lets the book be used and insists her objection sit in the minutes beside the citation.",
          },
        ],
      },
    ],
    next: ["st.flood.e4"],
  }),

  duo({
    id: "st.flood.e4",
    era: "E4",
    title: "The Outlet Copy",
    locationId: "loc.salisbury.outlet_shed",
    characters: ["p.willa_seaver", "p.clark_seaver"],
    summary:
      "In 2008 Middlebury's basement is wet again and the bridge season is making everyone want a clean story. Willa wants a working copy in the Salisbury outlet shed, high and dry. Clark says a second copy is how his mother's neatness began. Chris has to leave one book or two.",
    discovery:
      "The shed smells like dry cedar and lake outlet, not like a shrine. Willa has the flood book in a waxed cloth on a crate. Clark drove because the Court Street cellar is ankle-wet. Nobody posted a notice. The crate is the whole invitation.",
    implications:
      "A shed copy means a later stranger can meet the page without Middlebury's permission, and Norma's neatness has a spare. A single book means the page can still be lost to a wet cellar, and Willa does not get to feel safe. The 2022 signing happens to whatever this choice preserved.",
    prerequisites: prev("E4", "st.flood.e2"),
    steps: [
      "Stand in the outlet shed until you know whether the waxed cloth is one book or the start of two.",
      "Hear Clark name his mother's neatness without letting him win by tone.",
      "Leave a working copy on the crate, or refuse the second copy and carry the one book back.",
    ],
    opening: {
      speakerId: "p.willa_seaver",
      text: "The Court Street cellar is wet and the selectboard wants a story that ends. I want a working copy here, where the outlet stays cooler than a basement and nobody's rug is involved. Father says a second page is how Mother started sanding the hurt. He is not wrong about the method. He is wrong that one book in a wet building is bravery. Chris, bravery isn't the choice. Loss is. Leave a copy on this crate or don't.",
      variant: {
        when: { flaw: "keeps_a_second_copy" },
        text: "You are already relieved by the idea of two, and Willa sees the relief and does not let it count as a reason. A second copy soothes you. It does not answer Clark. The shed will keep whatever you leave, including your habit. Decide as if the habit were the danger, because Clark is not inventing that danger.",
      },
    },
    branches: [
      {
        id: "br.flood.shed",
        choiceId: "leave_the_copy",
        choice: "Leave a working copy in the outlet shed.",
        middleSpeakerId: "p.clark_seaver",
        middle:
          "Clark sets his keys down so he won't gesture with them. Then a stranger in Salisbury can meet my mother's problem without earning it. Maybe that's democracy. Maybe it's how a panic becomes a handout. I'll write on the cloth that the copy is not the certification. If you won't let me write that, you're not storing a book. You're ordaining one.",
        endSpeakerId: "p.willa_seaver",
        end: "Leave the note, Father. I want the note. A copy that pretends to be the only page is the neatness you're afraid of. This one is labeled spare. If the cellar takes the original, we are not virtuous, we are merely not stupid. Chris, don't come back to check on it. Checking is how a shed becomes an altar. The crate is enough.",
        flags: { "flags.floodbook.shed_held": true },
        summary: "A labeled spare of the flood book stays in the Salisbury shed. Clark's note says it is not the certification. Willa forbids altar-visits.",
      },
      {
        id: "br.flood.single",
        choiceId: "carry_one_book",
        choice: "Refuse the second copy. Carry the one book.",
        middleSpeakerId: "p.clark_seaver",
        middle:
          "He looks older than the argument and not triumphant. One book can still drown, and I will hate the drowning if it comes. I would rather hate a drowning than inherit a drawer of kinder pages. Mother's kindness was real. It was also a solvent. Thank you for not mixing another bottle of it in a shed.",
        endSpeakerId: "p.willa_seaver",
        end: "Then we can lose it. I want that said in this shed, not later as a surprise. Chris, you carry it. Father, you don't get to call the refusal your victory over me. I wanted the spare because I have seen what wet paper does. I am accepting the risk. Acceptance is not agreement, and I won't smile on the drive back to Middlebury.",
        flags: { "flags.floodbook.single_book": true },
        summary: "No spare is made. Willa accepts the risk of one book and will not smile as if Clark had won a family argument.",
      },
    ],
    rewards: [
      reward("record", "reward.flood.e4.shed", "Either a labeled spare sits in the Salisbury outlet shed, or the flood book remains one object that can still be lost to wet."),
      reward("knowledge", "reward.flood.e4.solvent", "Ellis has heard Clark call Norma's kindness a solvent, and has heard Willa separate acceptance from agreement."),
    ],
    deathMid:
      "Chris dies on the outlet road before the cloth is opened or refused. Willa does not make the spare over a death. Clark drives the book back to the wet cellar and writes nothing triumphant.",
    deathOpen:
      "The book sits on the crate through the season and then goes back to Middlebury undecided. Willa will not claim a spare was blessed by delay. The shed stays a shed.",
    deathShut:
      "Spare or single book remains the 2008 fact. The later signing does not conjure a copy this shed was denied, and does not throw out a spare that was labeled.",
    alt: {
      npcId: "p.willa_seaver",
      surrogateId: "p.clark_seaver",
      resolution:
        "If Willa is already dead, Clark will not use her absence to win the argument about his mother. He still asks Chris whether the shed gets a spare.",
      opening: {
        speakerId: "p.clark_seaver",
        text: "Willa's dead and I don't get to be right in her place. The cellar is wet. A spare in this shed might be prudence. It might be the solvent starting again. I have wanted both, which is not a decision. Chris, leave a copy with a note that it isn't the certification, or carry the one book and let me hate the risk honestly.",
      },
      branches: [
        {
          id: "br.flood.shed_clark",
          choiceId: "spare_clark",
          choice: "Leave the labeled spare, without Willa to guard it.",
          endSpeakerId: "p.clark_seaver",
          end: "Labeled. I'll say the word spare until it sticks. If I start visiting this crate, tell whoever you are next to stop me. Visiting is the altar. I can be precise about my own weakness. The book can have a twin. I won't light anything beside it.",
          flags: { "flags.floodbook.shed_held": true },
          summary: "Clark leaves a labeled spare after Willa's death and names his own urge to visit the crate as the danger.",
        },
        {
          id: "br.flood.single_clark",
          choiceId: "single_clark",
          choice: "Carry the one book back, and let Clark hate the risk.",
          endSpeakerId: "p.clark_seaver",
          end: "One book. I'll hate the wet in advance so it doesn't get to surprise me into a speech. Willa wanted the spare. I won't call this her defeat. She's dead. It's a risk. Drive. I won't talk about Mother on the way unless the road floods, and then I'll talk about the road.",
          flags: { "flags.floodbook.single_book": true },
          summary: "Clark carries the single book after Willa's death and refuses to turn the risk into a story about his mother.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.clark_seaver",
        surrogateId: "p.owen_perch",
        resolution:
          "If Clark is already dead, Owen will not take the office and will not take the argument about neatness as his inheritance. He still wants the shed decided so he can go back to feed.",
        opening: {
          speakerId: "p.owen_perch",
          text: "Clark's dead. I'm not the deputy and I'm not the son. Willa wants a spare where it's dry. I want to sell feed before six. A second copy feels like a church to me and like a cellar's insurance to her. Chris, pick. I'll carry whichever you don't leave, and I won't stay to consecrate the crate.",
        },
        branches: [
          {
            id: "br.flood.shed_owen",
            choiceId: "spare_owen",
            choice: "Leave the spare. Let Owen go back to the feed store.",
            endSpeakerId: "p.owen_perch",
            end: "Left. I'll tell anyone who asks that it's a spare and a fire risk and not a relic. Then I'm done. Willa can label it. I won't visit. Feed has hours. The book having a twin doesn't make me a surveyor.",
            flags: done("st.flood.e4", { "flags.floodbook.shed_held": true }),
            summary: "Owen lets the spare stay, calls it a fire risk rather than a relic, and returns to the feed store.",
          },
          {
            id: "br.flood.single_owen",
            choiceId: "single_owen",
            choice: "Carry the one book. Owen takes it only as far as the truck.",
            endSpeakerId: "p.owen_perch",
            end: "One. I'll put it on the seat and I won't buckle it in like a child. If the cellar eats it, that's a wet fact, not a moral. Chris, don't ask me to feel the moral on the drive. I came to end an errand, not to join an office.",
            flags: done("st.flood.e4", { "flags.floodbook.single_book": true }),
            summary: "Owen carries the single book as far as the truck and refuses to join the office the errand belongs to.",
          },
        ],
      },
    ],
    next: ["st.flood.e5"],
  }),
];
