import { standalone } from "./questkit.mjs";
import { death, reward } from "./death.mjs";

export const quests = [
  standalone({
    id: "q.marble_dust",
    title: "The Dust Counts",
    eras: ["E2"],
    locationId: "loc.bristol.quarry_cut",
    characters: ["p.vito_pellegrin", "p.gina_pellegrin"],
    summary:
      "At the limestone cut above Bristol, Vito Pellegrin holds dust counts the survey office has not posted. Louis Pell's body is known here as the cook's son. Posting lets the wives read the numbers, handing them only to the workers lets the paper be lost on purpose, and Norma Seaver's delay is the third sin.",
    discovery:
      "Louis Pell is at the overhang because this body comes from the Bristol cut, and Vito Pellegrin stops him under the face with a folded sheet. The counts are not a speech about powder. They are the week's dust, unposted, and Gina Pellegrin is already watching who will be allowed to see them.",
    steps: [
      "Stand under the Bristol overhang in Louis Pell's body and hear Vito Pellegrin separate a dust count from a figure of speech.",
      "Choose whether the wives can read the sheet, the workers alone hold it, or Norma Seaver's delay remains the office's answer.",
      "Leave the paper where that choice puts it, and let Gina Pellegrin hear which sin was picked at the cut.",
    ],
    opening: {
      speakerId: "p.vito_pellegrin",
      text:
        "These are counts, Louis, not a poem I am making about powder. The office has not posted them. Nail the sheet at this Bristol cut where the wives can read the dust, or hand it to the men and we can lose it on purpose. Norma Seaver says wait. Those are three different sins, and Gina is standing right there.",
      variant: {
        when: { ideal: "the_record_holds" },
        text:
          "You are the one who thinks a record should hold, Louis Pell, so do not look at me as if this sheet were weather. The Bristol cut has numbers the office has not posted. Gina Pellegrin can watch you choose the board, the pocket, or Norma Seaver's delay. I am not decorating the dust. I am counting it.",
      },
    },
    branches: [
      {
        id: "post",
        choiceId: "post",
        choice: "Post the dust counts where the wives can read them.",
        middleSpeakerId: "p.gina_pellegrin",
        middle:
          "Then it goes on the board by the shack door, Louis, where a wife walking up from Bristol can see the week's dust without asking a man to remember it. I will not pretty the nail. Vito Pellegrin means the numbers. Norma Seaver does not get to call this patience.",
        endSpeakerId: "p.vito_pellegrin",
        end:
          "Posted. The wives can see the dust counts, and I will not take the sheet down because the office is shy. Gina watched the nail go in. If Norma Seaver wants a delay, she can come to the Bristol cut and argue with a number that is already in the weather.",
        flags: { "flags.dust.posted": true },
        summary:
          "Ellis has the dust counts posted at the Bristol cut, where the wives can read them. Vito Pellegrin treats the sheet as exposure, not poetry, and Norma Seaver's delay does not cover the nail.",
      },
      {
        id: "hand",
        choiceId: "hand",
        choice: "Hand the counts to the workers and no one else.",
        middleSpeakerId: "p.gina_pellegrin",
        middle:
          "Then it lives in jackets, Louis. Vito Pellegrin already told you the men can lose a paper on purpose, and he was not making a riddle. The wives will not see this week's dust unless a cutter decides to be braver than the Bristol office.",
        endSpeakerId: "p.vito_pellegrin",
        end:
          "Handed, and not posted. The workers have the counts. We can fold them into a pocket and let the rain at the cut finish the argument. That is the sin you picked, Louis. Gina heard it. Do not tell me later you thought I was speaking in pictures about powder.",
        flags: { "flags.dust.handed": true },
        summary:
          "The dust counts are handed only to the workers at the Bristol cut. They are not posted, so they can be lost on purpose, and the wives do not get a look at the week's numbers.",
      },
      {
        id: "delay",
        choiceId: "delay",
        choice: "Obey Norma Seaver and leave the delay in place.",
        middleSpeakerId: "p.gina_pellegrin",
        middle:
          "Then Norma's delay is the fact, Louis. The sheet stays off the board and out of the men's hands, and the Bristol cut goes on breathing limestone while the office practices neatness. I chalk names. I cannot chalk a number nobody will hold still for.",
        endSpeakerId: "p.vito_pellegrin",
        end:
          "Delayed, then. Norma Seaver keeps her wait, and this paper does not meet a wife or a pocket today. I said the counts were counts. You picked the office's silence over either sin I offered. Gina can remember that Louis Pell stood here and let the delay stand.",
        flags: { "flags.dust.delayed": true },
        summary:
          "Norma Seaver's delay is obeyed. The dust counts stay unposted and are not handed to the workers, so neither the wives nor the cutters have the week's numbers from the Bristol cut.",
      },
    ],
    alt: {
      npcId: "p.vito_pellegrin",
      surrogateId: "p.gina_pellegrin",
      resolution:
        "If Vito Pellegrin is dead, Gina Pellegrin holds the unposted dust counts at the Bristol cut. The sheet is still numbers, not a poem about powder, and Louis Pell's body does not get to pretend the office already showed them.",
      opening: {
        speakerId: "p.gina_pellegrin",
        text:
          "Vito is not here to say it, so I will. These dust counts never got posted, Louis. The wives can read them on the board at the Bristol cut, or the workers can have them and lose them on purpose. I do not have his cough. I have his sheet. Norma Seaver is still waiting, and I will not call that a kindness by myself.",
      },
      branches: [
        {
          id: "vdead_post",
          choiceId: "vdead_post",
          choice: "Have Gina post the counts on the cut's board.",
          endSpeakerId: "p.gina_pellegrin",
          end:
            "Then I nail them. The wives coming up to this Bristol face can read the dust without a dead man's permission. Louis Pell, you did not make the numbers prettier by being the cook's son. You only stopped them staying in a pocket Vito cannot lose anymore.",
          flags: { "flags.dust.posted": true },
          summary:
            "With Vito Pellegrin dead, Gina Pellegrin posts the dust counts at the Bristol cut so the wives can read the week's exposure instead of inheriting a silence.",
        },
        {
          id: "vdead_hand",
          choiceId: "vdead_hand",
          choice: "Have Gina hand the sheet only to the workers.",
          endSpeakerId: "p.gina_pellegrin",
          end:
            "Then the men get it, and nobody nails it. They can lose it on purpose the way Vito said they might, and the wives of this cut will not see the week's dust. I will not tell Norma Seaver I was braver than I was. Louis, that pocket is a decision, not a draft.",
          flags: { "flags.dust.handed": true },
          summary:
            "With Vito dead, Gina hands the dust counts only to the workers. The sheet can be lost on purpose, and the wives never get the posted numbers at the Bristol cut.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.gina_pellegrin",
        surrogateId: "p.elena_pellegrin",
        resolution:
          "If Gina Pellegrin is dead, Elena Pellegrin stands in at the Bristol cut with the unposted counts. She will not let Louis Pell treat the sheet as supper talk, and she will not invent Gina's chalk as a substitute for a number.",
        opening: {
          speakerId: "p.elena_pellegrin",
          text:
            "Gina is not here to watch your face, Louis, so I will do it without her chalk. Vito Pellegrin's dust counts are still off the board. Post them where the wives can see, hand them to the cutters who can lose them, or bow to Norma Seaver's delay. I kept this shack's grace. I can keep a number honest too.",
        },
        branches: [
          {
            id: "gdead_post",
            choiceId: "gdead_post",
            choice: "Tell Elena to post the counts for the wives.",
            endSpeakerId: "p.elena_pellegrin",
            end:
              "Posted, then, and Gina does not have to be alive for a wife to read the dust. Vito's numbers go on the Bristol board. I will not mix them with a grace. Louis Pell, if you wanted a poem you came to the wrong woman in the wrong cut.",
            flags: { "flags.dust.posted": true },
            summary:
              "With Gina Pellegrin dead, Elena Pellegrin posts Vito's dust counts at the Bristol cut so the wives can read the exposure the office delayed.",
          },
          {
            id: "gdead_delay",
            choiceId: "gdead_delay",
            choice: "Tell Elena to leave Norma Seaver's delay alone.",
            endSpeakerId: "p.elena_pellegrin",
            end:
              "Then the delay stands, and I will not steal Norma's sin to make myself kind. The counts stay unposted, Louis, and the wives do not get a surprise board because Gina is dead. Vito can hate me for it. He already knew waiting was a choice with a body.",
            flags: { "flags.dust.delayed": true },
            summary:
              "With Gina dead, Elena leaves Norma Seaver's delay in place. The Bristol dust counts stay unposted, and neither the wives nor a memorial nail gets the week's sheet.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "record.dust_sheet",
        "The week's dust counts at the Bristol cut become a posted sheet, a workers' paper, or an office delay, and that status is the record.",
      ),
      reward(
        "knowledge",
        "knowledge.dust_is_count",
        "Vito Pellegrin's dust talk is exposure counted in the limestone cut, not a poetic name for powder, and Louis Pell's body already belongs to that work.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Louis Pell's body before the dust sheet is settled, the paper stays in a pocket at the Bristol cut. Vito Pellegrin does not get a witness, and the wives never see the counts Gina was watching.",
      unresolved:
        "The season turns with the dust counts still pocketed. Norma Seaver's delay becomes the habit, and no one at the Bristol overhang can point to a posting Louis Pell agreed to in the open.",
      resolved:
        "Louis Pell's death does not pull a settled sheet back into a pocket. Whether the Bristol counts were posted, handed to the workers, or left under Norma Seaver's delay, that choice stays after the body.",
      sets: {},
    }),
    implications:
      "The Bristol cut either shows its dust to the wives, trusts the workers with a paper they may destroy, or accepts Norma Seaver's delay. Later talk about lungs at this face has a sheet, a pocket, or an office silence behind it, and Louis Pell was standing there when it was chosen.",
  }),

  standalone({
    id: "q.powder_key",
    title: "The Powder Key",
    eras: ["E1"],
    locationId: "loc.bristol.powder_shack",
    characters: ["p.vito_pellegrin", "p.redmond_mahey"],
    summary:
      "The key to the powder shack above Bristol was in Rennet Moss's old coat, which came to Ada Smollet through Helen Perch's estate. Helen is dead and silent. Vito Pellegrin calls a key near powder a safety problem. Redmond Mahey has walked up from Shoreham with his tongs and can spoil the bit here.",
    discovery:
      "Ada Smollet is at the powder shack because the coat from Helen Perch's estate still has a key in it, and Vito Pellegrin will not talk about that key anywhere but here. Redmond Mahey is already on the hill with forge tongs, not waiting in Shoreham for a later errand.",
    steps: [
      "Stand at the Bristol powder shack in Ada Smollet's body with Rennet Moss's key and both men in earshot.",
      "Choose whether the key opens the shack, goes back to Vito unused, or is spoiled by Redmond Mahey's tongs on this hill.",
      "Leave the key used, returned, or ruined, and do not carry the argument down to Shoreham to finish it.",
    ],
    opening: {
      speakerId: "p.vito_pellegrin",
      text:
        "A key in a dead coat is a story, Ada, until it is a key beside powder. Helen Perch is not here to explain the estate, and I will not pretend this shack above Bristol is a parlor. Redmond Mahey came up from Shoreham with his tongs. Use it, give it back unused, or let him spoil it. I am talking about hands, not symbols.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text:
          "I know the look, Ada. An unturned key bothers you the way an open gate does. This is the powder shack, not a proverb. Rennet's coat put it in your hand through Helen's estate, and Redmond Mahey did not climb from Shoreham so you could stand here unfinished. Decide before the bit starts to feel like a duty.",
      },
    },
    branches: [
      {
        id: "use",
        choiceId: "use",
        choice: "Use the key and open the powder shack.",
        middleSpeakerId: "p.redmond_mahey",
        middle:
          "Then turn it while I am standing here, and do not ask me to bless the click. I brought tongs from Shoreham, not a speech. Vito Pellegrin is right that a key near powder is a safety problem. Using it once, in daylight, at this Bristol door, is still using it.",
        endSpeakerId: "p.vito_pellegrin",
        end:
          "Used. The shack is open, Ada, and the key from Rennet Moss's coat has done the thing I did not want a secret to do. Redmond can put his tongs down. I will lock up again with my own bit. Yours is no longer a mystery in Helen's cloth. It is a key that has met powder.",
        flags: { "flags.powder.used": true },
        summary:
          "Ada uses the powder-shack key in daylight at the Bristol door, with Vito Pellegrin and Redmond Mahey present. The key is no longer an unused secret from Helen Perch's estate.",
      },
      {
        id: "ret",
        choiceId: "ret",
        choice: "Return the key to Vito without using it.",
        middleSpeakerId: "p.redmond_mahey",
        middle:
          "Unused is a real word if you mean it. Give it to Vito and keep your hand off my tongs. I did not walk up from Shoreham to watch a ceremony. If the key goes back into his palm and never enters the Bristol lock, I will call that restraint. I will not call it my work.",
        endSpeakerId: "p.vito_pellegrin",
        end:
          "Returned, and unused. I have it, Ada. It will not go back into Rennet's coat, and it will not turn this lock today. Redmond Mahey can take his tongs home to Shoreham. A key near powder was the problem. In my hand, unused, it is not a temptation with your name on it.",
        flags: { "flags.powder.returned": true },
        summary:
          "The powder key is returned unused to Vito Pellegrin at the shack. It does not open the lock, and Redmond Mahey does not spoil it. The coat from Helen's estate is empty of that bit.",
      },
      {
        id: "spoil",
        choiceId: "spoil",
        choice: "Have Redmond spoil the key here with his tongs.",
        middleSpeakerId: "p.redmond_mahey",
        middle:
          "Say it plain, then. I spoil the bit here, at the shack, with the tongs I carried up. I am not dragging you back to the Shoreham forge to make a journey of it. Vito Pellegrin hears you. The key from that coat will not open anything when I am done, and the reason you were afraid can stay your own.",
        endSpeakerId: "p.redmond_mahey",
        end:
          "Agreed. It is spoiled. The bit is a twist of metal, Ada, and this Bristol door will not know it. Vito can stop imagining a coat pocket beside the powder. I am not sorry. Helen Perch's estate does not get a working key just because the cloth was careful. I came up the hill for this and I am finished.",
        flags: { "flags.powder.destroyed": true },
        summary:
          "Redmond Mahey spoils the powder key with his tongs at the Bristol shack, not back in Shoreham. Vito Pellegrin watches the bit die as a working key, and the door stays on Vito's own lock.",
      },
    ],
    alt: {
      npcId: "p.vito_pellegrin",
      surrogateId: "p.elena_pellegrin",
      resolution:
        "If Vito Pellegrin is dead, Elena Pellegrin meets Ada Smollet at the powder shack. She treats the key from Rennet Moss's coat as a safety matter the estate does not get to romanticize, and Redmond Mahey is still on the hill if the bit must die.",
      opening: {
        speakerId: "p.elena_pellegrin",
        text:
          "Vito is dead and the key is still in Rennet's coat, which is now your problem, Ada. I keep this shack's rules even when I am not the powder man. Helen does not get a vote from the grave. Use it on the Bristol door, put it in my hand unused, or let Redmond Mahey spoil it with those tongs. Pick before I decide you are decorating a danger.",
      },
      branches: [
        {
          id: "vdead_ret",
          choiceId: "vdead_ret",
          choice: "Give Elena the key, unused, for the shack.",
          endSpeakerId: "p.elena_pellegrin",
          end:
            "Unused, and mine. It does not go back into the coat, Ada, and it does not open this door in your hand. Redmond can walk down to Shoreham with cold tongs. I will not thank Helen's estate for a gift that could have met powder. Vito would have said the same without my manners.",
          flags: { "flags.powder.returned": true },
          summary:
            "With Vito dead, Ada returns the powder key unused to Elena Pellegrin at the shack. The bit is not turned in the lock and not spoiled on the hill.",
        },
        {
          id: "vdead_spoil",
          choiceId: "vdead_spoil",
          choice: "Let Redmond spoil it while Elena watches.",
          endSpeakerId: "p.elena_pellegrin",
          end:
            "Then it is ruined in front of me, and I will not ask Redmond Mahey to pretend the tongs were a prayer. The Bristol shack keeps Vito's lock. Ada, the coat can go back to being cloth. A spoiled key is quieter than a story about Helen Perch, and I prefer quiet near powder.",
          flags: { "flags.powder.destroyed": true },
          summary:
            "With Vito dead, Elena watches Redmond Mahey spoil the powder key at the shack. The estate's bit cannot open the Bristol door afterward.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.redmond_mahey",
        surrogateId: "p.vito_pellegrin",
        resolution:
          "If Redmond Mahey is dead, nobody has come up from Shoreham with tongs. Vito Pellegrin still treats the key as a safety problem at the powder shack, and the ruin of the bit, if it happens, is his decision on this hill rather than a smith's.",
        opening: {
          speakerId: "p.vito_pellegrin",
          text:
            "Redmond is dead, so do not look down the hill for Shoreham tongs, Ada. The key from Rennet Moss's coat is still next to my powder. Helen's estate is not a reason. Use it in front of me, return it unused, or let me ruin the bit myself on this Bristol sill. I will not make you a trip to a dead man's forge.",
        },
        branches: [
          {
            id: "rdead_use",
            choiceId: "rdead_use",
            choice: "Use the key once, with Vito watching the door.",
            endSpeakerId: "p.vito_pellegrin",
            end:
              "Used, and I saw it. The shack opened, Ada, which is the safety problem arriving on schedule. There is no Redmond to spoil it afterward. I will change my habit around this door. Do not tell me the coat was only memory. A memory did not turn the lock. Your hand did.",
            flags: { "flags.powder.used": true },
            summary:
              "With Redmond Mahey dead, Ada uses the powder key under Vito's eye at the Bristol shack. The door opens, and there is no smith left to unmake the bit.",
          },
          {
            id: "rdead_ret",
            choiceId: "rdead_ret",
            choice: "Return the unused key to Vito at the sill.",
            endSpeakerId: "p.vito_pellegrin",
            end:
              "Back in my hand, unused. Redmond's absence does not make the coat braver, Ada. The key stays out of the lock and out of Helen's story. I will keep it where powder is a procedure. You can go down the Bristol hill without a bit in Rennet Moss's pocket.",
            flags: { "flags.powder.returned": true },
            summary:
              "With Redmond dead, the key is returned unused to Vito at the powder shack. It never opens the Bristol door and is not left in the estate coat.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "token",
        "token.powder_key",
        "The powder-shack key from Rennet Moss's coat is used, returned unused to Vito, or spoiled, and that condition is the token of the hour.",
      ),
      reward(
        "knowledge",
        "knowledge.powder_safety",
        "A key beside powder at the Bristol shack is a safety problem Vito will not turn into a symbol, even when the bit arrived through Helen Perch's estate.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Ada Smollet's body before the choice, the key stays in Rennet Moss's coat. Vito Pellegrin finds no decision at the Bristol shack, and Redmond Mahey's tongs go home to Shoreham unused.",
      unresolved:
        "The season ends with the key still in the coat from Helen Perch's estate. The powder shack above Bristol keeps its own lock, and nobody can say the bit was used, returned, or spoiled.",
      resolved:
        "Ada's death does not put a settled key back into the coat. Used, returned unused, or spoiled by Redmond at the shack, the Bristol door remembers the choice and not the unfinished pocket.",
      sets: {},
    }),
    implications:
      "The powder shack above Bristol either has been opened by the estate key, holds that key unused in Vito Pellegrin's care, or is rid of the bit because Redmond Mahey spoiled it on the hill. Later safety talk at the cut has one of those three facts and not a story about Helen.",
  }),

  standalone({
    id: "q.college_cores",
    title: "The Face That Folds",
    eras: ["E2"],
    locationId: "loc.bristol.quarry_cut",
    characters: ["p.pauline_ester"],
    summary:
      "Pauline Ester is a geologist working the limestone cut above Bristol, not a visitor from a campus office. She wants a core from the face that shows the fold. That face has chalked names above it. She will move her bit if shown another face in plain stone language, without a ghost story.",
    discovery:
      "Louis Pell comes up under the overhang and finds Pauline Ester already set up at the named face, bit still packed until someone answers her. The chalk is Gina Pellegrin's habit even when Gina is not the one holding the drill, and Pauline is asking the cut, not a lecture hall.",
    steps: [
      "Meet Pauline Ester at the Bristol face she wants to core and look at the chalked names above the fold.",
      "Tell her a safe face in plain stone words, refuse the core, or allow the name-face, without making her a villain for asking.",
      "Leave her bit either moved, packed, or working under the names, and let the cut keep that answer.",
    ],
    opening: {
      speakerId: "p.pauline_ester",
      text:
        "I want the face that shows the fold, Louis, and I want you to hear me as a geologist standing in this Bristol cut, not as a thief from a college. The names in chalk are above the stone I need. Show me a different face that still has the turn in the beds, say it in rock and not in haunting, and I will move my bit. Or refuse me. Or allow this face. I can live with a clear no.",
      variant: {
        when: { ideal: "names_aloud" },
        text:
          "You keep looking at the chalk as if a name spoken were a wage, Louis Pell. I am not here to mock that. I am here for the fold in this Bristol limestone. If the names must stay unbored, say so, or show me another face in ordinary stone language. I will not drill through a sentence you are still trying to protect, and I will not pretend the fold is a soul.",
      },
    },
    branches: [
      {
        id: "safe",
        choiceId: "safe",
        choice: "Send her to the kinked beds with no chalk on them.",
        middleSpeakerId: "p.pauline_ester",
        middle:
          "Say it the way you just started to, in stone. If the east rib of this Bristol overhang shows the same fold and the chalk never climbed it, that is a face I can use. I do not need a story about who the names were. I need to know I am not coring a memorial by accident.",
        endSpeakerId: "p.pauline_ester",
        end:
          "Then I move. The east rib, where the beds kink and no chalk is written, is enough fold for my core. I am not insulted, Louis. You told me the difference without a ghost story, and my bit leaves the name-face alone. The limestone is still limestone. The names stay a reason to pick a hole, which is what I asked you for.",
        flags: { "flags.core.safe_face": true },
        summary:
          "Pauline Ester moves her bit to a Bristol face that shows the fold without chalked names above it. Ellis explains the difference in plain stone language, and the name-face is not cored.",
      },
      {
        id: "refuse",
        choiceId: "refuse",
        choice: "Refuse the core on every face of this cut.",
        middleSpeakerId: "p.pauline_ester",
        middle:
          "All right. Hear me answer without sulking. A refusal is cleaner than a mystical warning. If Louis Pell, standing in this cut that knows his body, says no core at all, I pack the bit. I will not sneak a hole on the fold because the chalk offended me, and I will not call you superstitious for a boundary.",
        endSpeakerId: "p.pauline_ester",
        end:
          "Packed. I am not coring the name-face and I am not coring a substitute. The fold can wait in the Bristol stone without my hole. You refused the work, Louis, and I am leaving the bit in the box so nobody later says the geologist took a silence for permission. The names are untouched because nothing was drilled.",
        flags: { "flags.core.refused": true },
        summary:
          "Coring is refused outright. Pauline Ester packs her bit and drills neither the chalked face nor another face at the Bristol cut. She accepts the no without being made a villain.",
      },
      {
        id: "allow",
        choiceId: "allow",
        choice: "Allow her to core the face under the chalked names.",
        middleSpeakerId: "p.pauline_ester",
        middle:
          "If you allow it, I will core the fold and I will not pretend the chalk is invisible. The names stay above the hole, Louis. I am not scraping Gina Pellegrin's work to make my sample polite. Say the allowance again if you mean it. I do not want a shrug that Bristol can reinterpret later.",
        endSpeakerId: "p.pauline_ester",
        end:
          "Allowed, then. I core the face that shows the fold, names in chalk above the bit, and I will log it as limestone with a marble temper, not as a haunting. You gave permission, Louis Pell. I am grateful and I am not smug. The hole is a fact under the names, and the names are still the reason this hole needed a witness.",
        flags: { "flags.core.allowed": true },
        summary:
          "Ellis allows Pauline Ester to core the name-face at the Bristol cut. The chalked names stay above the hole, and she treats the stone as stone without mocking the names.",
      },
    ],
    alt: {
      npcId: "p.pauline_ester",
      surrogateId: "p.gina_pellegrin",
      resolution:
        "If Pauline Ester is dead, no geologist is waiting with a bit. Gina Pellegrin, who chalks the names, decides whether any later core is invited onto a safe face or refused at the Bristol overhang.",
      opening: {
        speakerId: "p.gina_pellegrin",
        text:
          "Pauline Ester is dead, Louis, so the bit is not hers to aim. I chalked the names above the fold on this Bristol face. If some later hand wants stone, I can point them at beds that kink without my chalk, in plain words, or I can say this cut is not taking cores. I will not invent a ghost story to do either job.",
      },
      branches: [
        {
          id: "pdead_safe",
          choiceId: "pdead_safe",
          choice: "Have Gina name a face that is only stone.",
          endSpeakerId: "p.gina_pellegrin",
          end:
            "Then the safe face is the east rib, beds turned, no names. Anybody who comes after Pauline can core that and leave my chalk alone. I said it in stone, Louis, not in a haunting. The Bristol fold does not need a dead geologist to be real, and the names do not need a hole to stay true.",
          flags: { "flags.core.safe_face": true },
          summary:
            "With Pauline Ester dead, Gina Pellegrin points any future core to an unchalked face of the Bristol fold and keeps the name-face off the bit.",
        },
        {
          id: "pdead_refuse",
          choiceId: "pdead_refuse",
          choice: "Have Gina refuse cores at the named cut.",
          endSpeakerId: "p.gina_pellegrin",
          end:
            "Then no. The bit stays packed and I do not offer a substitute rib. Pauline is not here to be disappointed, Louis, and I will not core the names to feel scientific in her absence. The overhang keeps the fold and the chalk. Bristol can study both with its eyes.",
          flags: { "flags.core.refused": true },
          summary:
            "With Pauline dead, Gina refuses coring at the Bristol cut. No safe-face invitation is made, and the chalked names are left without a hole under them.",
        },
      ],
    },
    rewards: [
      reward(
        "knowledge",
        "knowledge.fold_face",
        "The fold Pauline Ester wants is a limestone fact at the Bristol cut, and it is not the same fact as the chalked names above one face.",
      ),
      reward(
        "stance",
        "stance.core_choice",
        "Ellis either shows a safe face in plain stone language, refuses the core, or allows the name-face, and Pauline is left a scientist rather than an enemy.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Louis Pell's body before answering, Pauline Ester's bit stays packed. She does not core the name-face on a silence, and the Bristol fold remains unsampled.",
      unresolved:
        "The season moves on with her bit still packed. No safe face was named and no permission was given, so the chalked names above the Bristol fold never share a hole with a core.",
      resolved:
        "Louis Pell's death does not unpack a refusal or move a bit that was already shifted. The Bristol face Pauline was allowed, or the east rib, or the packed box, stays the answer she heard.",
      sets: {},
    }),
    implications:
      "The Bristol cut either loses a core from an unchalked face, loses no core at all, or carries a hole under the names Pauline Ester was shown. She leaves without being the villain of the fold, and later geology of this stone has a witness for which face was touched.",
  }),

  standalone({
    id: "q.widow_envelopes",
    title: "The Extra Envelopes",
    eras: ["E1"],
    locationId: "loc.starksboro.pellegrin_porch",
    characters: ["p.celine_boucher", "p.marc_boucher"],
    summary:
      "On the Starksboro porch, Céline Boucher keeps envelopes for men the flood took before they could be hired, and a separate pile for a week last month when nobody worked. She will not mix the piles and smile. Marc Boucher's handwriting can make a lie look beautiful. Ada Smollet has to pick memorial or fraud.",
    discovery:
      "Ada Smollet is asked onto the Starksboro porch where the envelopes come when the Bristol shack is closed. Céline Boucher has two piles on the rail and will not blur them for company. Marc is there with the pen that makes wages look owed.",
    steps: [
      "Stand on the Starksboro porch and let Céline Boucher show the two piles without mixing them.",
      "Choose to keep the envelopes as memorial, or stop them as fraud before Marc's hand makes a week of no work look paid.",
      "Leave the piles in the category you defended, and do not ask either Boucher to smile over a blend.",
    ],
    opening: {
      speakerId: "p.celine_boucher",
      text:
        "These envelopes on the Starksboro rail are for men the flood took before they could be hired, Ada. This other pile is a week last month when nobody worked. I will not mix them in front of you and smile. Marc can write a name so beautifully it starts to look like a debt. Tell me whether you are here to keep a memorial or to stop a fraud. I will not do both with one face.",
      variant: {
        when: { flaw: "spares_a_kind_lie" },
        text:
          "You look ready to spare me a kind lie, Ada Smollet, and I am telling you not to. The Starksboro porch has a memorial pile and a week nobody worked. If you blur them so I can stay gentle, Marc's beautiful hand will finish the job. I would rather you be rude and clear than kind and mixed.",
      },
    },
    branches: [
      {
        id: "memorial",
        choiceId: "memorial",
        choice: "Keep the unhired dead as memorial, not as pay.",
        middleSpeakerId: "p.marc_boucher",
        middle:
          "Then I do not write the empty week as if it were owed. I can letter a memorial name without making it a wage, Ada, but only if my mother keeps the piles apart. Beautiful handwriting is how a fraud gets dressed. If this is memory, the Starksboro ink stays memory, and the week nobody worked stays blank.",
        endSpeakerId: "p.celine_boucher",
        end:
          "Memorial, then, and not a smile over a mixture. The flood's unhired men stay envelopes we do not cash, and last month's idle week is not paid in Marc's pretty hand. You picked a category, Ada. I can live in it. The porch will not pretend a memorial is payroll, and payroll will not borrow the dead to look generous.",
        flags: { "flags.envelopes.memorial": true },
        summary:
          "The extra envelopes on the Starksboro porch are kept as memorial for men the flood took before hiring. Marc does not beautify the unworked week into a wage, and the piles stay unmixed.",
      },
      {
        id: "fraud",
        choiceId: "fraud",
        choice: "Stop the envelopes before they become a fraud.",
        middleSpeakerId: "p.marc_boucher",
        middle:
          "Then the pen stops. I will not write a beautiful lie for a week nobody worked, and I will not let a memorial pile learn how to look like money. Ada, if you are stopping a fraud, say it so my mother hears the category. I am tired of being the hand that makes Starksboro feel generous.",
        endSpeakerId: "p.celine_boucher",
        end:
          "Stopped. I will not call you cruel for it, Ada, and I will not mix the piles now to soften the stopping. Marc's hand does not get to make the idle week beautiful, and the flood envelopes do not get to masquerade as wages either. Fraud is the word you picked. The drawer can hold paper. It will not hold a trick.",
        flags: { "flags.envelopes.fraud_stopped": true },
        summary:
          "Ellis stops the extra envelopes as fraud. Marc Boucher does not write the unworked week into a beautiful debt, and Céline does not keep a memorial that behaves like pay on the Starksboro porch.",
      },
    ],
    alt: {
      npcId: "p.celine_boucher",
      surrogateId: "p.marc_boucher",
      resolution:
        "If Céline Boucher is dead, Marc Boucher is left with both piles and the pen on the Starksboro porch. He knows his own handwriting can counterfeit a wage, and Ada has to choose the category without the widow's hard sorting.",
      opening: {
        speakerId: "p.marc_boucher",
        text:
          "My mother is dead and the piles are still on this Starksboro porch, Ada. One is men the flood took before a hiring. One is a week nobody worked. I can make either look beautiful, which is the danger. Keep them as memorial, unmixed and unpaid, or stop the whole habit as fraud. I will not smile and blend them just because she is gone.",
      },
      branches: [
        {
          id: "cdead_memorial",
          choiceId: "cdead_memorial",
          choice: "Tell Marc to keep the piles as unpaid memorial.",
          endSpeakerId: "p.marc_boucher",
          end:
            "Memorial, and my hand stays plain. The flood names are not wages, Ada, and the idle week is not a debt I will letter into beauty. Starksboro can remember them without cashing them. I will not mix the piles to feel like her. Céline hated that trick, and her absence does not license it.",
          flags: { "flags.envelopes.memorial": true },
          summary:
            "With Céline dead, Marc keeps the Starksboro envelopes as memorial. His handwriting does not turn the unworked week or the unhired dead into pay.",
        },
        {
          id: "cdead_fraud",
          choiceId: "cdead_fraud",
          choice: "Tell Marc to stop writing the extra envelopes.",
          endSpeakerId: "p.marc_boucher",
          end:
            "Then I stop. No beautiful fraud, no memorial that spends like a wage. The piles can sit until someone braver than a pen destroys the habit, but I will not add a name, Ada. Starksboro has had enough of my mother's categories filtered through my handwriting. Fraud is stopped where the ink would have begun.",
          flags: { "flags.envelopes.fraud_stopped": true },
          summary:
            "With Céline dead, Marc stops the envelope practice as fraud. He refuses to beautify either pile on the Starksboro porch into something that looks owed.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.marc_boucher",
        surrogateId: "p.celine_boucher",
        resolution:
          "If Marc Boucher is dead, the beautiful hand is gone. Céline Boucher still will not mix the piles on the Starksboro porch, and Ada's choice is memorial or fraud without a son to make the lie look like craftsmanship.",
        opening: {
          speakerId: "p.celine_boucher",
          text:
            "Marc is dead, so nobody here can write a lie prettier than my bookkeeping, Ada. The Starksboro piles remain what they were: flood dead who were never hired, and a week last month with no work in it. I will not mix them and smile to honor him. Memorial or fraud. Choose the word, and I will keep the drawer as blunt as his absence.",
        },
        branches: [
          {
            id: "mdead_memorial",
            choiceId: "mdead_memorial",
            choice: "Keep Céline's piles as memorial and unpaid.",
            endSpeakerId: "p.celine_boucher",
            end:
              "Memorial, without Marc's hand to decorate it. The unhired dead stay remembered, Ada, and the idle week stays a blank, not a wage. I will not mix the piles because grief is in the house. Starksboro can stand a plain envelope. It does not need a beautiful fraud to feel decent.",
            flags: { "flags.envelopes.memorial": true },
            summary:
              "With Marc dead, Céline keeps the envelopes as memorial on the Starksboro porch. The piles stay unmixed and unpaid, with no beautiful handwriting to disguise them.",
          },
          {
            id: "mdead_fraud",
            choiceId: "mdead_fraud",
            choice: "Have Céline stop the piles as fraud.",
            endSpeakerId: "p.celine_boucher",
            end:
              "Stopped, and I will not use my dead son as a reason to keep writing. The fraud was the risk that a memorial would learn to be pay. Ada, both piles come out of the wage habit. The Starksboro drawer can hold old paper. It will not hire a shadow, and it will not pay a week nobody worked.",
            flags: { "flags.envelopes.fraud_stopped": true },
            summary:
              "With Marc dead, Céline stops the extra envelopes as fraud. Neither the flood pile nor the unworked week continues as a thing that could be mistaken for wages.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "record.extra_envelopes",
        "The Starksboro envelopes are recorded either as memorial for the unhired flood dead or as a fraud that was stopped before it paid an idle week.",
      ),
      reward(
        "stance",
        "stance.envelope_category",
        "Ellis chooses a category Céline will not blur: memory that is not pay, or a stop that refuses Marc Boucher's beautiful lie.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Ada Smollet's body on the porch, the piles stay mixed in the drawer. Céline Boucher does not get a category, and Marc's hand is left with a beautiful ambiguity.",
      unresolved:
        "The season passes with the Starksboro piles mixed in the drawer. No one can say the flood envelopes were memorial only, and the unworked week is still close enough to a wage to be written pretty.",
      resolved:
        "Ada's death does not remix a choice already made. Memorial or fraud-stopped, the Starksboro drawer keeps the category Ellis spoke, and the piles are not blended back into a smile.",
      sets: {},
    }),
    implications:
      "Starksboro either keeps a memorial that is not payroll, or it stops the extra envelopes as fraud. Marc Boucher's handwriting is not allowed to make the idle week look owed, and later arguments about quarry mercy have to live inside the category that was picked on the porch.",
  }),

  standalone({
    id: "q.notch_slide",
    title: "The Notch Slide",
    eras: ["E3"],
    locationId: "loc.lincoln.notch_slide",
    characters: ["p.rita_cole"],
    summary:
      "A slide sits on the Lincoln gap approach where the school-bus road and the quarry lane diverge. Rita Cole has one loader window before the next rain. She does not want the flood book. She wants a minute of Hannah Greer's mouth: bus first, or the lane toward the Bristol cut first.",
    discovery:
      "Hannah Greer comes up into the Lincoln notch because the road is shut with mud and rock, not because a page sent her. Rita Cole is on the loader with one dry window of work, and the school-bus road and the quarry lane are both waiting on a sentence.",
    steps: [
      "Stand in the Lincoln slide with Rita Cole and look at the bus road and the quarry lane without opening the flood book.",
      "Use the minute of mouth to put the school bus first or the quarry lane first.",
      "Leave Rita the order she can drive, and do not stay to revise it into a lesson after the loader moves.",
    ],
    opening: {
      speakerId: "p.rita_cole",
      text:
        "Bus road or quarry lane, Hannah. This is the Lincoln gap, the slide is in both throats, and I have one loader window before the rain comes back. Your flood book is not on the machine. Your mouth is. Give me the order in the next minute. I have heard every speech about who matters. I need a road.",
      variant: {
        when: { ideal: "the_living_first" },
        text:
          "If the living come first with you, Hannah Greer, then say the school-bus road and stop circling the quarry lane as if Bristol stone could stand in the rain and argue. I still only have one loader window on this Lincoln slide. The book stays in your coat. The minute is the whole decision I can spend.",
      },
    },
    branches: [
      {
        id: "bus",
        choiceId: "bus",
        choice: "Clear the school-bus road before the quarry lane.",
        middleSpeakerId: "p.rita_cole",
        middle:
          "Bus first. Say it once more so the Lincoln hill hears a person and not a mood. I will take the loader to the school road and leave the quarry lane choked until the window is gone. The cut above Bristol can wait on stone. Children cannot wait on a speech I already refused to hear.",
        endSpeakerId: "p.rita_cole",
        end:
          "Bus road first. That is the minute, Hannah, and I am spending it. The quarry lane stays closed while I open the way the school bus uses. Do not hand me the flood book as a blessing. Lincoln will remember the order if the rain lets the work stand, and it will remember you said the children before the cut.",
        flags: { "flags.slide.bus_first": true },
        summary:
          "Rita Cole clears the school-bus road first at the Lincoln slide. The quarry lane toward the cut waits, and the flood book is not what decided that one opening of the loader.",
      },
      {
        id: "quarry",
        choiceId: "quarry",
        choice: "Clear the quarry lane before the school-bus road.",
        middleSpeakerId: "p.rita_cole",
        middle:
          "Quarry lane first, then. I hope you can hear how that sounds on a school morning in Lincoln. I will still do it if it is your minute. The loader window does not have room for both, and the Bristol cut's trucks do not become children because the stone is old. You said the lane. I am not translating it into kindness.",
        endSpeakerId: "p.rita_cole",
        end:
          "Quarry lane first. The school-bus road waits behind this slide while I open the way toward the cut. Hannah Greer, that was a mouth's decision, not a chapter. If Lincoln asks me why the bus sat, I will say you chose the lane in the minute you had. I will not invent a better reason after the rain.",
        flags: { "flags.slide.quarry_first": true },
        summary:
          "Rita Cole clears the quarry lane first. The Lincoln school-bus road stays blocked through the loader window, and Ellis owns that order in speech rather than in the flood book.",
      },
    ],
    alt: {
      npcId: "p.rita_cole",
      surrogateId: "p.gina_pellegrin",
      resolution:
        "If Rita Cole is dead, the loader window still exists and the Lincoln slide does not care. Gina Pellegrin, up from the Bristol cut, is the one left to hear Hannah choose bus road or quarry lane, and she will not accept the flood book as a substitute for the minute.",
      opening: {
        speakerId: "p.gina_pellegrin",
        text:
          "Rita is dead and the slide is not. Hannah, I am not the road crew, but the quarry lane runs toward my cut and the school-bus road runs toward Lincoln children. One window of work, then the rain. Do not read me the flood book. Say which throat gets the loader. I can carry a minute. I cannot carry a revised lesson.",
      },
      branches: [
        {
          id: "rdead_bus",
          choiceId: "rdead_bus",
          choice: "Tell Gina the school-bus road opens first.",
          endSpeakerId: "p.gina_pellegrin",
          end:
            "Bus first, even with the quarry lane pointing at Bristol. I will tell whoever still has the loader. Rita's absence does not make the cut more urgent, Hannah. Lincoln's school road gets the work. The stone can stay behind the slide until a second chance that may not come.",
          flags: { "flags.slide.bus_first": true },
          summary:
            "With Rita Cole dead, Gina carries Hannah's order that the Lincoln school-bus road is cleared before the quarry lane. The flood book stays out of the decision.",
        },
        {
          id: "rdead_quarry",
          choiceId: "rdead_quarry",
          choice: "Tell Gina the quarry lane opens first.",
          endSpeakerId: "p.gina_pellegrin",
          end:
            "Lane first, then, and I will not pretend I am happy because it serves the cut. You said it in the minute, Hannah. The school-bus road waits. If Lincoln hates that, they can hate a sentence instead of a shrug. I am not Rita, and I will not soften the order on the walk back to Bristol.",
          flags: { "flags.slide.quarry_first": true },
          summary:
            "With Rita dead, Gina carries the order to clear the quarry lane before the Lincoln school-bus road. She does not rewrite Hannah's minute into something kinder to the children.",
        },
      ],
    },
    rewards: [
      reward(
        "stance",
        "stance.slide_order",
        "Hannah Greer's minute at the Lincoln slide puts either the school-bus road or the quarry lane first, and that order is the stance Rita can drive.",
      ),
      reward(
        "knowledge",
        "knowledge.loader_window",
        "Rita Cole has one loader window before the next rain, and the flood book is not a tool that fits on the machine at the Lincoln gap.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Hannah Greer's body before the minute is used, Rita Cole clears whichever road is closer and does not record Ellis. The Lincoln slide gets work without a name attached to the order.",
      unresolved:
        "The rain returns with no order from Hannah. Rita clears whichever throat of the Lincoln slide is closer, and no record says Ellis chose the bus road or the quarry lane.",
      resolved:
        "Hannah's death does not erase the minute already spoken. Bus first or quarry lane first, Rita Cole keeps that order, and she does not need a later record of Ellis to know which Lincoln road she opened.",
      sets: {},
    }),
    implications:
      "The Lincoln gap remembers a first road: the school bus or the quarry lane toward the cut. Rita Cole spends her one loader window on that sentence, and the flood book stays out of the cab, so later blame has a mouth to point at instead of a weather story.",
  }),

  standalone({
    id: "q.supper_flinch",
    title: "Grace with a Wrong Name",
    eras: ["E0"],
    locationId: "loc.bristol.supper_hall",
    characters: ["p.elena_pellegrin", "p.marco_pellegrin"],
    summary:
      "In the Bristol supper hall, Elena Pellegrin says grace naming cutters who are not on the village monument and one name who never drew a wage. She is watching Rennet Moss's face. A flinch can be followed by the truth of which name Ellis knows. Holding still is not ignorance, and it has a cost.",
    discovery:
      "Rennet Moss is at the long tables because the cut feeds its people in this hall above Bristol, and Elena Pellegrin has already decided the grace will contain a test. Marco Pellegrin is seated where he can see a flinch without needing the monument out in the village to explain it.",
    steps: [
      "Sit through Elena Pellegrin's grace in the Bristol supper hall and hear the monument's missing cutters beside the unwaged name.",
      "Flinch and then say which name you know, or hold still through the grace without pretending you failed to recognize it.",
      "Leave the hall with the truth spoken or with the cost of stillness named, and do not ask Marco to sand the moment.",
    ],
    opening: {
      speakerId: "p.elena_pellegrin",
      text:
        "We thank the work of cutters who are not on the Bristol monument, and of one who never drew a wage. Rennet, I am watching your face, not your manners. Marco Pellegrin can see you as well as I can. If you know which name is the unwaged one, your mouth may follow your eyes. If you hold still, do not tell yourself later that stillness was the same as not knowing.",
      variant: {
        when: { flaw: "signs_unread" },
        text:
          "Your hand will sign a silence if I let it, Rennet, and I am not letting the Bristol hall pretend a flinch is private. The grace names cutters off the monument and one who never drew a wage. Marco is watching the same face I am. Speak the name you know, or hold still and pay for the holding. Do not doodle a kindness in the air and call it grace.",
      },
    },
    branches: [
      {
        id: "flinch",
        choiceId: "flinch",
        choice: "Flinch, then say which name you actually know.",
        middleSpeakerId: "p.marco_pellegrin",
        middle:
          "The hall saw it, Rennet. Elena does not need me to announce a flinch she built the grace to catch. If you know which name never drew a wage, say that one and leave the monument's missing cutters out of the fog. I drill. I do not enjoy a test. I enjoy a mouth that finishes what a face started.",
        endSpeakerId: "speaker.ellis",
        end:
          "I flinched, and I will not leave it on my face. The cutters missing from the Bristol monument are not the puzzle. The name in Elena's grace that never drew a wage is the chalk name on the overhang, the one payroll never opened an envelope for. That is the one I know. I will not pretend I know the rest by heart.",
        flags: { "flags.grace.flinched": true },
        summary:
          "Ellis flinches at the grace and then says the truth of the name he knows: the unwaged chalk name, not the paid cutters left off the Bristol monument. Marco Pellegrin sees the flinch become speech.",
      },
      {
        id: "held",
        choiceId: "held",
        choice: "Hold still through the grace, knowing the name.",
        middleSpeakerId: "p.marco_pellegrin",
        middle:
          "Still is not empty, Rennet. I have watched men go blank because they were lost, and this is not that. Elena Pellegrin set a name in the grace that never drew a wage, and you did not give the Bristol hall your eyes. If you are holding, you are spending something. Do not ask me to call it ignorance at this table.",
        endSpeakerId: "p.elena_pellegrin",
        end:
          "You held still, and it was not ignorance. I watched you know the unwaged name and spend nothing out loud. The cost is this hall: Marco will think the office can swallow a Bristol grace, and I will use that chalk name again because you would not break it open. Stillness kept the test alive. That is what it cost.",
        flags: { "flags.grace.held": true },
        summary:
          "Ellis holds still through Elena's grace while knowing the unwaged name. The stillness is not ignorance. It costs the hall a spoken distinction and leaves Elena free to use the test again.",
      },
    ],
    alt: {
      npcId: "p.elena_pellegrin",
      surrogateId: "p.marco_pellegrin",
      resolution:
        "If Elena Pellegrin is dead, Marco Pellegrin says the grace in the Bristol supper hall without her talent for a trap. He still names the monument's missing cutters and the unwaged chalk name, and he still watches whether Rennet flinches or holds.",
      opening: {
        speakerId: "p.marco_pellegrin",
        text:
          "Elena is not here to aim this, so I will say it blunt in her hall. We eat because cutters worked who are not on the Bristol monument, and because one chalk name never drew a wage. Rennet, I am not as patient as she was. Flinch and tell me which you know, or hold still and admit the holding is a choice. I will not call a blank face innocent.",
      },
      branches: [
        {
          id: "edead_flinch",
          choiceId: "edead_flinch",
          choice: "Flinch, and name the unwaged chalk name as the one you know.",
          endSpeakerId: "p.marco_pellegrin",
          end:
            "Good. The monument's missing men are a different wound. The name you know is the one that never drew a wage, the chalk on the overhang. Elena would have made you bleed longer for it. I only wanted the Bristol table to hear the difference before the soup went cold. Sit down. The grace is over.",
          flags: { "flags.grace.flinched": true },
          summary:
            "With Elena dead, Marco hears Rennet flinch and name the unwaged chalk name. The Bristol hall gets the distinction without Elena's longer test.",
        },
        {
          id: "edead_held",
          choiceId: "edead_held",
          choice: "Hold still, and let Marco name what the stillness costs.",
          endSpeakerId: "p.marco_pellegrin",
          end:
            "Then hold, and do not insult me by calling it confusion. You knew the unwaged name from the paid ones the monument skipped. The cost is that this Bristol hall learns a surveyor can sit through a wrong grace and leave the chalk unsaid. I will not repeat Elena's trap for sport. I will remember that you could have ended it.",
          flags: { "flags.grace.held": true },
          summary:
            "With Elena dead, Rennet holds still and Marco states the cost: the Bristol hall sees a knowing silence, not ignorance, and the unwaged name stays unspoken.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.marco_pellegrin",
        surrogateId: "p.elena_pellegrin",
        resolution:
          "If Marco Pellegrin is dead, Elena Pellegrin still says the grace and still watches Rennet's face. She loses the cutter who would have confirmed a flinch, so the cost of holding still lands on her alone in the Bristol hall.",
        opening: {
          speakerId: "p.elena_pellegrin",
          text:
            "Marco is dead, Rennet, so do not look sideways for a witness who drills. I will say the grace anyway. Cutters off the Bristol monument, and one name who never drew a wage. Your face is the only instrument I have left. Flinch and speak the one you know, or hold still and hear me price the stillness. I do not need his nod to see you.",
        },
        branches: [
          {
            id: "marcodead_flinch",
            choiceId: "marcodead_flinch",
            choice: "Flinch and speak the unwaged name without Marco there.",
            endSpeakerId: "p.elena_pellegrin",
            end:
              "You flinched, and then you said it. The chalk name, the one who never drew a wage, is the one you know. The monument's missing cutters are the other grief. Marco is not here to grunt and make it easier, Rennet. The Bristol hall still heard you. That is enough grace for one supper.",
            flags: { "flags.grace.flinched": true },
            summary:
              "With Marco dead, Elena still catches the flinch and hears Rennet name the unwaged chalk name in the Bristol supper hall.",
          },
          {
            id: "marcodead_held",
            choiceId: "marcodead_held",
            choice: "Hold still and let Elena say the cost alone.",
            endSpeakerId: "p.elena_pellegrin",
            end:
              "Held, and not because you were lost. The cost, without Marco to share it, is mine: I keep a test I could have retired, and the Bristol men at this table think the office can outlast a grace. You knew the unwaged name. Stillness spent that knowledge on nothing the hall can use. I will not comfort you for it.",
            flags: { "flags.grace.held": true },
            summary:
              "With Marco dead, Rennet's stillness still is not ignorance. Elena names the cost herself: the unwaged name stays a test, and the Bristol hall thinks the office can swallow it.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "stance",
        "stance.grace_face",
        "Rennet Moss either flinches into speech or holds still on purpose, and the Bristol supper hall has seen which stance the grace produced.",
      ),
      reward(
        "knowledge",
        "knowledge.unwaged_name",
        "The name in Elena's grace who never drew a wage is the chalk name, distinct from the paid cutters left off the Bristol monument.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Rennet Moss's body during the grace, the grace finishes without a verdict. Elena Pellegrin never gets the flinch or the stillness priced, and Marco eats in a Bristol hall that learned nothing.",
      unresolved:
        "The season leaves the grace unfinished as a test. No verdict sits on Rennet's face or mouth, so the unwaged name and the monument's missing cutters stay tangled in the Bristol hall.",
      resolved:
        "Rennet's death does not erase the verdict already given. Flinch-and-speech or a costly stillness, Elena Pellegrin keeps what the Bristol supper hall saw, and the grace does not get replayed as if no one answered.",
      sets: {},
    }),
    implications:
      "The Bristol supper hall either heard which name Rennet knew, or it watched him hold still at a cost Elena names. The unwaged chalk name is no longer interchangeable with the monument's missing cutters, unless the stillness left that distinction unsaid and armed.",
  }),

  standalone({
    id: "q.grange_in_a_storm",
    title: "The Grange in a Storm",
    eras: ["E1"],
    locationId: "loc.cornwall.keene_loft",
    characters: ["p.albert_keene", "p.nan_pettis"],
    summary:
      "During a storm, Nan Pettis is living in the Cornwall grange loft. Albert Keene wants that loft for feed and fears fire. Ada Smollet is on the stair between them. Nan refuses to be treated as a letter or a sack of grain. She stays the night, or she is turned out at the stair before the feed comes up.",
    discovery:
      "Ada Smollet comes into the Cornwall grange because the storm has already put Nan Pettis in the loft and Albert Keene at the foot of the stair. Nobody sent a sack or a letter to be sorted. The feed and the fire fear are in the room with a living person.",
    steps: [
      "Stand on the Cornwall loft stair in the storm and hear Albert Keene's feed and fire without turning Nan Pettis into cargo.",
      "Let Nan stay the night with the feed second, or turn her out at the stair before anyone moves grain up.",
      "Leave the loft decided in speech and in the body that stays or goes, not by carrying anyone to another town.",
    ],
    opening: {
      speakerId: "p.albert_keene",
      text:
        "A person is living up there, Ada, and I need the loft for feed before this Cornwall storm finishes the lower floor. I am also afraid of fire. I can be grange master or a man about it, not both in one night. Nan Pettis is not a letter in Sylvia's sack and she is not grain. Help me fail at the correct job, and do it on this stair.",
      variant: {
        when: { ideal: "the_living_first" },
        text:
          "If the living outrank the correct sentence, Ada, then say so before I move feed into a room that already has Nan Pettis in it. The Cornwall loft is a fire risk and a neighbor at the same time. I will not pretend those are one object. You care about the person first. Then tell the stair that, and let the grain be second or do not.",
      },
    },
    branches: [
      {
        id: "stay",
        choiceId: "stay",
        choice: "Let Nan stay the night and leave the feed below.",
        middleSpeakerId: "p.nan_pettis",
        middle:
          "If I stay, say it to me, not to the sack and not to the grain. I am Nan Pettis and I am already in this Cornwall loft. Albert can fear fire without making me the match. The feed comes second means the feed stays down tonight. I will hear the difference. I have heard boots decide things without my name.",
        endSpeakerId: "p.nan_pettis",
        end:
          "Then I stay the night, and the feed does not come up over me. Albert Keene can be afraid and still leave the loft as a room. Ada, you did not turn me into a letter or a sack. The storm can do what it wants to Cornwall. I will be here in the morning, and the grain will be where it was.",
        flags: { "flags.grange.sheltered": true },
        summary:
          "Nan Pettis stays the night in the Cornwall loft. The feed comes second and is not moved up over her, and she is not handled as a letter or a sack of grain.",
      },
      {
        id: "stair",
        choiceId: "stair",
        choice: "Turn Nan out at the stair before the feed comes up.",
        middleSpeakerId: "p.nan_pettis",
        middle:
          "Then do it here, at the stair, and do not dress it up as taking me somewhere kinder. I will not be walked like a delivery and I will not be stored like feed. Albert wants the loft. If you turn me out, Ada, the turning happens on these steps, in this storm, with my name still Nan Pettis and not a problem you solved off the property.",
        endSpeakerId: "p.albert_keene",
        end:
          "Down the stair, then, before I move the feed. I hate the sound of it and I am still the master of this Cornwall grange. Nan heard it from you, Ada, not from a rumor of boots after you left. The loft will take grain, and the fire I feared has a smaller chance. That is the job I failed correctly, if there is any correct left.",
        flags: { "flags.grange.turned_out": true },
        summary:
          "Nan Pettis is turned out at the Cornwall stair before the feed is moved up. The act is done in her hearing, not as a delivery to some other shelter, and Albert takes the loft for grain.",
      },
    ],
    alt: {
      npcId: "p.albert_keene",
      surrogateId: "p.sylvia_keene",
      resolution:
        "If Albert Keene is dead, Sylvia Keene has the loft in the storm and will not treat Nan Pettis as one of her unsent letters. The feed still wants the room. Ada's choice is shelter or the stair, spoken with the choir keeper rather than the grange master.",
      opening: {
        speakerId: "p.sylvia_keene",
        text:
          "Albert is dead, Ada, and I will not let this Cornwall loft pretend Nan is a letter I can bind or burn. She is a person in a storm. The feed still needs a dry place, and I still fear fire the way he did. Let her stay the night, grain second, or turn her out at this stair before anyone hauls sacks up. I sing. I do not deliver neighbors.",
      },
      branches: [
        {
          id: "adead_stay",
          choiceId: "adead_stay",
          choice: "Have Sylvia keep Nan in the loft for the night.",
          endSpeakerId: "p.sylvia_keene",
          end:
            "She stays, and the feed waits below. I will not file Nan Pettis among the unsent. Albert's death does not make the Cornwall loft a sack room tonight. Ada, you chose the living body over the grain. If the stove is careful, the fire he feared can be a rule instead of an eviction.",
          flags: { "flags.grange.sheltered": true },
          summary:
            "With Albert dead, Sylvia Keene lets Nan Pettis stay the storm in the loft. The feed remains below, and Nan is not folded into the choir's letters.",
        },
        {
          id: "adead_stair",
          choiceId: "adead_stair",
          choice: "Have Sylvia turn Nan out at the stair.",
          endSpeakerId: "p.sylvia_keene",
          end:
            "Then the stair, and no kinder trip afterward. I am not Albert, and I will not hide behind him. Nan Pettis goes down before the feed comes up, in this storm, in Cornwall. I refuse to call that a delivery or a letter returned. It is a person sent into weather so grain can have the loft. I will hear that sentence in my own mouth.",
          flags: { "flags.grange.turned_out": true },
          summary:
            "With Albert dead, Sylvia turns Nan out at the stair before the feed is moved up. She does not disguise the act as choir business or as carrying Nan elsewhere.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.nan_pettis",
        surrogateId: "p.sylvia_keene",
        resolution:
          "If Nan Pettis is dead, the loft is empty of her and Sylvia Keene will not invent her as a letter. Ada still chooses whether the Cornwall room stays a shelter for the next living person or becomes feed before the storm is over.",
        opening: {
          speakerId: "p.sylvia_keene",
          text:
            "Nan is dead, Ada, so do not let Albert's old fear turn her into a sack we can stack. The Cornwall loft is empty of her body and full of the question she hated. Leave it a shelter through this storm, feed second, or close it to the living and send the idea of her down the stair so the grain can come up. I will not sing her into grain.",
        },
        branches: [
          {
            id: "ndead_stay",
            choiceId: "ndead_stay",
            choice: "Keep the loft a shelter and hold the feed below.",
            endSpeakerId: "p.sylvia_keene",
            end:
              "Shelter, then, even with Nan Pettis gone. The feed stays down for this storm, and the Cornwall loft remains a place a living person could stand. I will not pretend she is in the room. I will also not pretend Albert's grain outranks the use she made of the boards. Ada, that is as much memorial as I will allow, and it is not a letter.",
            flags: { "flags.grange.sheltered": true },
            summary:
              "With Nan dead, Sylvia keeps the Cornwall loft as shelter through the storm and leaves the feed below. The room is not converted into storage in the same night.",
          },
          {
            id: "ndead_stair",
            choiceId: "ndead_stair",
            choice: "Close the loft to the living and bring the feed up.",
            endSpeakerId: "p.sylvia_keene",
            end:
              "Then the living are turned out of the idea of this room, at the stair, before the sacks come. Nan is not here to hear the boots, Ada, which is its own ugliness. The Cornwall loft takes feed. I will not call the grain a burial. I will call it what Albert wanted, done without the woman who refused to be grain.",
            flags: { "flags.grange.turned_out": true },
            summary:
              "With Nan dead, the loft is closed to shelter and given to feed. Sylvia marks the decision at the stair rather than pretending Nan was carried somewhere safer.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "stance",
        "stance.loft_night",
        "Ada either leaves Nan Pettis in the Cornwall loft for the night or turns her out at the stair, and the feed's rank is the stance.",
      ),
      reward(
        "access",
        "access.keene_loft",
        "The grange loft is either still a room a person may occupy through the storm or a feed room after the stair is used, and that is the access that remains.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Ada Smollet's body before the stair is answered, Albert Keene decides after Ellis is gone, and Nan Pettis hears the boots without a sentence she can answer.",
      unresolved:
        "The storm spends itself with no choice from Ada. Albert moves as master once the witness is gone, and Nan hears boots in the Cornwall loft instead of a decision made to her face.",
      resolved:
        "Ada's death does not rewind the stair. If Nan was sheltered, the feed stayed down. If she was turned out, she heard it herself. Albert does not get to restage the night as a choice made after Ellis left.",
      sets: {},
    }),
    implications:
      "The Cornwall loft either shelters Nan Pettis through the storm with feed second, or it is taken for grain after a turning-out at the stair. She is not converted into a letter or a sack, and later use of the grange has a night it can point to.",
  }),

  standalone({
    id: "q.postmistress_rule",
    title: "The Dead-Letter Rule",
    eras: ["E2"],
    locationId: "loc.cornwall.post_corner",
    characters: ["p.walter_keene"],
    summary:
      "A letter on Walter Keene's Cornwall counter is addressed to Ivo Perch, dead since 1938. Walter will not hand dead letters to whoever feels addressed. Ellis, wearing Louis Pell, is awkwardly continuous with that dead man. The letter is claimed here or it stays in the dead drawer. It is not carried off.",
    discovery:
      "Louis Pell is at the Cornwall post corner for ordinary business and finds a letter under Walter Keene's hand addressed to Ivo Perch. The rule is taped to the wood. The continuity Ellis feels is not a license Walter has agreed to honor.",
    steps: [
      "Stand at the Cornwall counter and read the address to Ivo Perch without picking the letter up to leave with it.",
      "Ask Walter to bend the rule and let the letter be claimed here, or let the rule hold and the letter stay in the dead drawer.",
      "Finish the matter on the counter, and do not walk the letter down the road in Louis Pell's coat.",
    ],
    opening: {
      speakerId: "p.walter_keene",
      text:
        "It is addressed to Ivo Perch, and Ivo Perch has been dead since nineteen thirty-eight. You may stand at this Cornwall counter looking claimed, Louis. The rule taped to the wood does not have a feeling about your look. I do not hand dead letters to whoever feels addressed. Bend the rule and read it here, or leave it in the dead drawer. You will not carry it out.",
      variant: {
        when: { ideal: "the_record_holds" },
        text:
          "You want the record to hold, Louis Pell, and the record on this Cornwall counter says the addressee died in nineteen thirty-eight. Ivo Perch is not a mood you can wear into my drawer. If I bend the rule, the bending happens here, in front of the tape. If I do not, the letter stays dead mail. Either way it does not leave in your hand.",
      },
    },
    branches: [
      {
        id: "bend",
        choiceId: "bend",
        choice: "Ask Walter to let the letter be claimed on this counter.",
        middleSpeakerId: "p.walter_keene",
        middle:
          "Claimed here means here, Louis. I can bend the rule far enough for you to hear Ivo Perch's mail on this wood, and not one step toward the door. If I do this, Cornwall will have a story about a dead letter that answered a living face. I dislike that story. I dislike refusing a man who is awkwardly continuous with the name even more, today.",
        endSpeakerId: "speaker.ellis",
        end:
          "Then I claim it here and I do not take it. The letter to Ivo Perch stays on Walter Keene's counter while I hear it, and it does not go into Louis Pell's coat or down the Cornwall road. The rule bends for this minute. It does not become a habit of handing the dead to anyone who flinches at a name.",
        flags: { "flags.post.rule_bent": true },
        summary:
          "Walter Keene bends the dead-letter rule so the letter to Ivo Perch can be claimed at the Cornwall counter. Ellis does not carry it away. The exception stays on the wood.",
      },
      {
        id: "hold",
        choiceId: "hold",
        choice: "Let the rule hold and leave the letter in the dead drawer.",
        middleSpeakerId: "p.walter_keene",
        middle:
          "Then the rule holds, and I am grateful you did not make me invent a feeling for it. Ivo Perch's letter goes in the dead drawer under the tape, Louis. Your continuity with him is not delivery instructions. Cornwall has buried enough ad-hoc mercy. You may stand there. You may not be the addressee just because the year inside you is older than Louis Pell.",
        endSpeakerId: "p.walter_keene",
        end:
          "In the drawer. The rule holds, and the letter to Ivo Perch stays dead mail on this counter's terms. I will not chase you with it later, and you will not walk it out now. If the office wants a ghost to receive post, it can come argue with the tape. I run a corner in Cornwall, not a séance with stamps.",
        flags: { "flags.post.rule_held": true },
        summary:
          "The dead-letter rule holds. The letter addressed to Ivo Perch stays in Walter Keene's dead drawer at the Cornwall counter, and Ellis does not carry it anywhere.",
      },
    ],
    alt: {
      npcId: "p.walter_keene",
      surrogateId: "p.faye_keene",
      resolution:
        "If Walter Keene is dead, his niece Faye Keene is at the Cornwall counter, old enough to read the tape and young enough to hate being the exception. She will not hand Ivo Perch's letter to a feeling, and she will not let Louis Pell walk off with it.",
      opening: {
        speakerId: "p.faye_keene",
        text:
          "Uncle Walter is dead and the tape is still on the wood, Louis. The letter says Ivo Perch, who died before I was born, which is not a riddle I asked for. I am not handing dead letters to whoever feels addressed, even if you wear the feeling very still. Claim it here if I bend, or it stays in the dead drawer. It does not leave Cornwall in your pocket.",
      },
      branches: [
        {
          id: "wdead_bend",
          choiceId: "wdead_bend",
          choice: "Ask Faye to bend the rule for a reading at the counter.",
          endSpeakerId: "p.faye_keene",
          end:
            "Bent, and only here. You can hear the letter to Ivo Perch on this counter, Louis, and then it goes back under the tape's idea of the dead even if the minute disagreed. I am sixteen and I am not a choir for your continuity. Cornwall gets one exception because you asked in front of me. It does not get a new custom.",
          flags: { "flags.post.rule_bent": true },
          summary:
            "With Walter dead, Faye Keene bends the rule once so the Ivo Perch letter can be claimed at the Cornwall counter. She does not let it leave the building.",
        },
        {
          id: "wdead_hold",
          choiceId: "wdead_hold",
          choice: "Tell Faye to keep the letter in the dead drawer.",
          endSpeakerId: "p.faye_keene",
          end:
            "Then it stays. I will not be the niece who opened the dead drawer because a man looked continuous. Ivo Perch's letter remains under the rule, Louis. You can be awkward at the counter as long as you like. Cornwall will not say I improved my uncle by being softer. The tape holds.",
          flags: { "flags.post.rule_held": true },
          summary:
            "With Walter dead, Faye holds the dead-letter rule. The letter to Ivo Perch stays in the drawer, and Louis Pell's continuity does not count as an address.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "record.ivo_letter",
        "The letter addressed to Ivo Perch is either claimed at the Cornwall counter under a bent rule or left in the dead drawer as the tape requires.",
      ),
      reward(
        "knowledge",
        "knowledge.dead_letter_rule",
        "Walter Keene's rule is that feeling addressed, even in a body awkwardly continuous with the dead, is not the same as being the addressee.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Louis Pell's body at the counter, the letter remains under the tape of the rule. Walter Keene does not bend for a corpse, and nobody carries Ivo Perch's mail away.",
      unresolved:
        "The season ends with the letter still under the tape. No claim was made at the Cornwall counter, and the dead drawer keeps Ivo Perch's name without Louis Pell's awkward continuity attached.",
      resolved:
        "Louis Pell's death does not smuggle a finished letter into a coat. If the rule bent, it bent on the counter. If it held, the letter remains under the tape. Neither outcome grows legs.",
      sets: {},
    }),
    implications:
      "Cornwall's post corner either has one witnessed exception, a dead letter claimed in place, or an unbroken rule with Ivo Perch's mail in the drawer. Ellis's continuity with the dead is not allowed to become a delivery route.",
  }),

  standalone({
    id: "q.one_voice_left",
    title: "One Voice at the Burial",
    eras: ["E3"],
    locationId: "loc.shoreham.larabee",
    characters: ["p.faye_keene", "p.gail_yorston"],
    summary:
      "At Larabee's Point in the week Gail Yorston can still be selfish, she may want her unsent line sung or an ordinary hymn. Faye Keene can sing and will not be turned into a choir. Hannah Greer is there to hear the choice while Gail can still make it. The burial is not a surprise sprung later.",
    discovery:
      "Hannah Greer comes to Larabee's Point because Gail Yorston asked, this week, while she can still be selfish about her own service. Faye Keene is the one voice on the dock. There is no choir waiting in the reeds to multiply her.",
    steps: [
      "Stand at Larabee's Point with Gail Yorston while she can still say what she wants sung.",
      "Ask Faye Keene for Gail's unsent line, or for an ordinary hymn with no private sentence in it.",
      "Leave the dock with one voice decided, and do not recruit a crowd to make the point sound fuller.",
    ],
    opening: {
      speakerId: "p.gail_yorston",
      text:
        "Ask me while I can still be selfish, Hannah. If they sing the line I never sent, they finish my argument without me, and I may want that. The line is this and nothing prettier: the landing fed you, and the cold was never polite. I may rather have the ordinary hymn. Faye can sing. She is one voice. Do not build a choir out of her on my dock at Larabee's Point.",
      variant: {
        when: { ideal: "names_aloud" },
        text:
          "You like a name said aloud, Hannah Greer, so you will be tempted by the sentence I never sent. Hear it anyway, and then choose: the landing fed you, and the cold was never polite. That is mine. The ordinary hymn is the point's, not mine. Faye Keene will not become a choir because you are devout about names. Larabee's Point gets one voice. Ask me which.",
      },
    },
    branches: [
      {
        id: "line",
        choiceId: "line",
        choice: "Ask Faye to sing Gail's unsent line, once.",
        middleSpeakerId: "p.faye_keene",
        middle:
          "Her line is good. That is not the same as permission, and you have something like permission because she is standing at Larabee's Point still able to be selfish. I can sing it once. I cannot be the choir. If you need Shoreham to sound crowded, you are in the wrong year and on the wrong dock.",
        endSpeakerId: "p.faye_keene",
        end:
          "Then once: the landing fed you, and the cold was never polite. That is Gail Yorston's unsent line, sung by me and not by a crowd I do not have. Hannah, I will not embroider it into a hymn the point already owns. She asked while she could. I answered with one voice. The lake does not get a chorus.",
        flags: { "flags.hymn.used_line": true },
        summary:
          "Faye Keene sings Gail Yorston's unsent line once at Larabee's Point: the landing fed you, and the cold was never polite. She remains one voice and is not turned into a choir.",
      },
      {
        id: "ordinary",
        choiceId: "ordinary",
        choice: "Ask for the ordinary hymn and leave the line unsent.",
        middleSpeakerId: "p.faye_keene",
        middle:
          "Ordinary is a mercy if it is chosen and a theft if it is cowardice. Gail is right here, Hannah. If she wants the hymn the landing already sings when the bell is done, I can do that without becoming a monument. I will not stuff her private line into a tune to make Shoreham feel depth it did not earn.",
        endSpeakerId: "p.gail_yorston",
        end:
          "The ordinary hymn, then. My line stays unsent, which is also a choice I got to make at Larabee's Point instead of a surprise made of me later. Faye sings what the dock already knows. Hannah, you did not turn her into a choir and you did not finish my argument for me. I can be selfish and still pick the plain song.",
        flags: { "flags.hymn.ordinary": true },
        summary:
          "An ordinary hymn is chosen while Gail Yorston can still be selfish. Her unsent line stays unsent, and Faye Keene sings as one voice at Larabee's Point rather than as a choir.",
      },
    ],
    alt: {
      npcId: "p.faye_keene",
      surrogateId: "p.pat_yorston",
      resolution:
        "If Faye Keene is dead, there is no outside voice to sing. Pat Yorston, who keeps the landing after the parents, will not invent a choir and will not invent a prettier line than the one Gail already said. The choice is still the unsent sentence or the ordinary hymn, said at Larabee's Point.",
      opening: {
        speakerId: "p.pat_yorston",
        text:
          "Faye is dead, so do not look at me as if I were a choir that learned her part. Mother is still selfish this week, which is a gift, and her line is the one she already spoke: the landing fed you, and the cold was never polite. I can say that at Larabee's Point, or I can keep to the ordinary hymn. I will not improve either.",
      },
      branches: [
        {
          id: "fdead_line",
          choiceId: "fdead_line",
          choice: "Have Pat speak Gail's unsent line at the landing.",
          endSpeakerId: "p.pat_yorston",
          end:
            "Then I say it, once, and not as music I do not have. The landing fed you, and the cold was never polite. That is Gail's, spoken at Larabee's Point while she can still hear the selfishness honored. Faye's absence does not let me hire a crowd. Hannah, one voice was the instruction. I am the voice that is left in the family.",
          flags: { "flags.hymn.used_line": true },
          summary:
            "With Faye dead, Pat Yorston speaks Gail's unsent line once at Larabee's Point. No choir is assembled to replace the missing singer.",
        },
        {
          id: "fdead_ordinary",
          choiceId: "fdead_ordinary",
          choice: "Have Pat keep the ordinary hymn and leave the line.",
          endSpeakerId: "p.pat_yorston",
          end:
            "Ordinary, then. I will not spend Mother's unsent line just because Faye is not here to sing it properly. The hymn the landing knows is enough for Larabee's Point. Hannah, I have heard enough good sentences that should have stayed pocketed. This one stays, because Gail can still nod and because I refuse to decorate a death in advance.",
          flags: { "flags.hymn.ordinary": true },
          summary:
            "With Faye dead, Pat keeps the ordinary hymn. Gail's unsent line is not spoken at Larabee's Point, and no substitute choir is invented.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.gail_yorston",
        surrogateId: "p.pat_yorston",
        resolution:
          "If Gail Yorston is already dead, the week of selfishness was missed. Pat Yorston will not invent what Gail wanted. Faye may still sing, but the default Pat will defend is the ordinary hymn unless a line Gail actually left is used without embroidery.",
        opening: {
          speakerId: "p.pat_yorston",
          text:
            "Mother is already dead, Hannah, so the week she could be selfish is gone. Do not ask me to guess a prettier want. Her line, if it is used, is only the one she said in the kitchen: the landing fed you, and the cold was never polite. Faye can sing that, or she can sing the ordinary hymn. I will not let either of you invent Gail for the dock.",
        },
        branches: [
          {
            id: "gdead_line",
            choiceId: "gdead_line",
            choice: "Use only the line Gail already left, sung once.",
            endSpeakerId: "p.pat_yorston",
            end:
              "Then that line and no invention. Faye sings it once at Larabee's Point, and I stand here so nobody adds a verse Mother did not leave. The landing fed you, and the cold was never polite. Hannah, that is as much of Gail as the living get. A choir would be a way of hiding that we missed her week.",
            flags: { "flags.hymn.used_line": true },
            summary:
              "With Gail already dead, the unsent line she actually left is sung once by Faye. Pat refuses any invented addition at Larabee's Point.",
          },
          {
            id: "gdead_ordinary",
            choiceId: "gdead_ordinary",
            choice: "Keep the ordinary hymn rather than invent Gail's want.",
            endSpeakerId: "p.pat_yorston",
            end:
              "Ordinary. I will not let Faye, or you, invent what Mother wanted once she cannot be selfish about it. The hymn Larabee's Point already knows is the honest limit. Her line can stay in the kitchen where she said it. Hannah, missing the week is the fact. Music will not repair the timing.",
            flags: { "flags.hymn.ordinary": true },
            summary:
              "With Gail already dead, Pat insists on the ordinary hymn. No one invents Gail's want, and the unsent line is not promoted into a burial song.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "knowledge",
        "knowledge.gail_line",
        "Gail Yorston's unsent line is a specific sentence, the landing fed you and the cold was never polite, and it is not an ordinary hymn.",
      ),
      reward(
        "stance",
        "stance.one_voice",
        "Faye Keene sings as one voice at Larabee's Point, either that line or the ordinary hymn, and is not expanded into a choir.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Hannah Greer's body before Gail answers, Faye Keene chooses the ordinary hymn rather than invent Gail's want. Larabee's Point does not get a guessed line.",
      unresolved:
        "The week of selfishness passes unused. Faye sings the ordinary hymn because no one will invent what Gail Yorston wanted, and the unsent line stays unsent at the landing.",
      resolved:
        "Hannah's death does not rewrite a choice Gail was alive to make. Used line or ordinary hymn, Faye's one voice at Larabee's Point keeps that instruction instead of inventing a better burial.",
      sets: {},
    }),
    implications:
      "Larabee's Point either hears Gail Yorston's unsent line from one voice or keeps the ordinary hymn. Faye is not made into a choir, and the burial is not a surprise cut from a week when Gail could still choose.",
  }),

  standalone({
    id: "q.ink_in_the_cold",
    title: "Ink in the Cold",
    eras: ["E0"],
    locationId: "loc.ripton.notch_turn",
    characters: ["p.norma_seaver"],
    summary:
      "At the Ripton road pull-off, Norma Seaver gives Rennet Moss a card and tells him not to lose it in the wind. The Voice dictates the certification, that the gate remained shut. The Other Voice dictates the margin, that it was opened late. Ellis writes one of those, or writes the weather instead.",
    discovery:
      "Rennet Moss is stopped at the notch turn on the Ripton road, not at a campus and not in the survey room, because Norma Seaver will only hand the card where the wind can take it. Two sentences are already arguing for the ink.",
    steps: [
      "Take Norma's card at the Ripton pull-off and keep it in the hand while the wind argues for it.",
      "Hear the certification and the margin, then write one of them, or write the weather and neither sentence they offer.",
      "Leave the card with the ink that actually dried, still at the notch, not carried off as a second secret copy.",
    ],
    opening: {
      speakerId: "p.norma_seaver",
      text:
        "Don't lose it in the wind, Rennet. This pull-off on the Ripton road will take a card out of a bare hand, and I am giving you the card anyway. Two sentences want the ink. I will not pick for the office while the notch is this loud. Pinch the card. Write what you can stand to have dried, and do not let the weather decide by theft.",
      variant: {
        when: { flaw: "keeps_a_second_copy" },
        text:
          "Don't lose it in the wind, and do not make me a second card, Rennet. The Ripton pull-off already eats paper. You keep copies the way other men keep kindling. One sentence on this one card is the whole mercy I am offering. If you write neither of theirs, write a real line of your own. A blank is just another way to start a duplicate later.",
      },
    },
    branches: [
      {
        id: "cert",
        choiceId: "cert",
        choice: "Write the certification: the gate remained shut.",
        middleSpeakerId: "speaker.voice",
        middle:
          "The gate remained shut. That is the certification, the record Ivo Perch attested, and it is the sentence your hand is putting on Norma's card at this Ripton pull-off. The lower works stay preserved because the page says so. Write it clean. The wind is not a coauthor.",
        endSpeakerId: "p.norma_seaver",
        end:
          "The certification is what dried. The gate remained shut, in your living hand, on a card I can take back to the office from this Ripton pull-off. I will not pretend the other sentence was not in the air. It is not in the ink. Rennet, that is a choice with a body attached, and I can file a body.",
        flags: { "flags.ink.wrote_cert": true },
        summary:
          "At the Ripton pull-off, Ellis writes the certification that the gate remained shut. The margin is heard and not inked. Norma's card leaves with the record's sentence.",
      },
      {
        id: "margin",
        choiceId: "margin",
        choice: "Write the margin: opened, late.",
        middleSpeakerId: "speaker.other_voice",
        middle:
          "Opened. Late. That is the margin, the hands, and it is the sentence going into the ink while the Ripton wind takes the fair sentence you were offered. Ivo Perch opened the gate. He was late. Write the lateness. Do not let Norma's card pretend the certification was the whole act.",
        endSpeakerId: "p.norma_seaver",
        end:
          "You wrote the margin. Opened, late, on a card I hoped would carry the shut gate. I will not scratch it out here at the notch. Rennet, the office will have to live beside your ink the way the county lived beside his hands. The Ripton wind did not write this. You did, and I watched.",
        flags: { "flags.ink.wrote_margin": true },
        summary:
          "Ellis writes the margin on Norma's card at the Ripton pull-off: opened, late. The certification is refused. The hands' account is the ink that dries.",
      },
      {
        id: "neither",
        choiceId: "neither",
        choice: "Write neither sentence. Write the weather instead.",
        middleSpeakerId: "p.norma_seaver",
        middle:
          "Your hand is refusing both sentences, Rennet, and I can see the refusal is not a freeze. The Ripton wind is getting a line of its own. If you will not certify and you will not margin, then the card still has to say something a person wrote. I will not accept a smudge and call it humility.",
        endSpeakerId: "speaker.ellis",
        end:
          "The card takes neither sentence they offered. In Rennet's hand at the Ripton pull-off the ink reads, \"Cold wind at the Ripton pull-off, and the card is still in the hand.\" Norma Seaver can file the weather. She does not get the gate, and the margin does not get to masquerade as the only honesty.",
        flags: { "flags.ink.wrote_neither": true },
        summary:
          "Ellis writes neither the certification nor the margin. The card at the Ripton pull-off carries a real weather sentence: cold wind at the pull-off, and the card still in the hand.",
      },
    ],
    alt: {
      npcId: "p.norma_seaver",
      surrogateId: "p.helen_perch",
      resolution:
        "If Norma Seaver is dead, Helen Perch has the card at the Ripton pull-off and is frightened of the mess either sentence makes. She still will not write it for Rennet. The Voice and the Other Voice remain the offerings. The ink is still his.",
      opening: {
        speakerId: "p.helen_perch",
        text:
          "Norma is dead and I wish the card had died with her errand, but it is in my hand at this Ripton pull-off, Rennet. Don't lose it in the wind. I am Ivo's sister and I am not his clerk. Write the shut gate, write the late opening, or write the weather and stop making me stand in a notch while two accounts fight over a dead man's courage.",
      },
      branches: [
        {
          id: "ndead_cert",
          choiceId: "ndead_cert",
          choice: "Write for Helen that the gate remained shut.",
          endSpeakerId: "p.helen_perch",
          end:
            "Then the card says the gate remained shut, and I can live with a sentence that sounds like care. I know the other voice is sulking in the Ripton wind. I will not invite it onto the paper. Rennet, Norma is not here to file you. I am here to stop the card blowing into a story worse than the certification.",
          flags: { "flags.ink.wrote_cert": true },
          summary:
            "With Norma dead, Helen Perch holds the card while Ellis writes the certification at the Ripton pull-off. The margin stays out of the ink.",
        },
        {
          id: "ndead_neither",
          choiceId: "ndead_neither",
          choice: "Write the weather for Helen and neither of their sentences.",
          endSpeakerId: "p.helen_perch",
          end:
            "Weather, then, and do not look proud. You wrote a real line and refused both of theirs, which is messier than I wanted and cleaner than a forged gate. The Ripton card will not certify Ivo and it will not confess him. I will keep it because Norma cannot. I will not love it.",
          flags: { "flags.ink.wrote_neither": true },
          summary:
            "With Norma dead, Ellis writes neither offered sentence. Helen keeps a card that records the Ripton weather instead of the gate.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "record.ripton_card",
        "Norma's card at the Ripton pull-off records the certification, the margin, or a weather sentence Ellis actually wrote in the cold.",
      ),
      reward(
        "knowledge",
        "knowledge.two_sentences",
        "The Voice's certification and the Other Voice's margin are two accounts of the same gate, and the ink can refuse both without refusing to write.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Rennet Moss's body before the ink dries, the card blows. Nothing is set on it. The Ripton wind takes the blank, and neither sentence gets a living hand.",
      unresolved:
        "The season leaves the notch with no card. The wind already took it, so the certification and the margin are both unwritten, and Norma Seaver has weather instead of ink.",
      resolved:
        "Rennet's death does not blow a card that already dried. Certification, margin, or the weather sentence, the Ripton ink remains what was written, and a later gust does not get to unchoose it.",
      sets: {},
    }),
    implications:
      "The office either receives a living hand's certification that the gate remained shut, a margin that it was opened late, or a weather sentence from the Ripton pull-off that refuses both. The card does not stay blank unless death takes it first.",
  }),

  standalone({
    id: "q.health_and_sister",
    title: "The Cooler and the Sister",
    eras: ["E3"],
    locationId: "loc.addison.creemee_stand",
    characters: ["p.louisa_garrett", "p.pearl_lamb"],
    summary:
      "Louisa Garrett inspects Lamb's Creemee on the Route 17 pullout in Addison. The cooler is wrong and she can close them today. Her sister loved maple-walnut and would have hated both the closing and the cooler. Louisa forbids using the sister as a bargain. The fix, if any, is a promise spoken, not a hunt for parts.",
    discovery:
      "Hannah Greer is at Lamb's because the cooler is already wrong on a day the Lake Champlain Bridge is feeding the pullout traffic. Louisa Garrett is the inspector in the doorway. Pearl Lamb is behind the machine, and the sister is not a lever sitting on the counter.",
    steps: [
      "Stand at Lamb's cooler with Louisa Garrett and Pearl Lamb and hear the sister named only as a fact, not as a bargain.",
      "Close the stand today, or keep it open and say out loud what will be fixed, without sending anyone after a part.",
      "Leave the pullout with the book closed or with a spoken promise Pearl and Louisa both heard.",
    ],
    opening: {
      speakerId: "p.louisa_garrett",
      text:
        "The cooler is wrong, and I can close Lamb's today. My sister loved maple-walnut and she would have hated the closing and hated this cooler more. Do not use her to bargain, Hannah. I am not a story you can lean on. Fix it in speech I can test, or hand me the spoon and the afternoon. Pearl is listening. Route 17 does not get a vote.",
      variant: {
        when: { ideal: "the_living_first" },
        text:
          "If the living come first with you, Hannah, remember my sister is not the living one in this doorway. Pearl Lamb is, and the cooler is still wrong. I can close this Addison pullout today. A kindness that leaves bad cream in the machine is not the living's victory. Say a fix I can hear, or let me close the book. Do not bargain with a dead appetite.",
      },
    },
    branches: [
      {
        id: "close",
        choiceId: "close",
        choice: "Close the stand today and do not bargain with the sister.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "If she closes us, she closes us, and I will not drag a dead woman's maple-walnut into the plea. The cooler is wrong. I know it. Lamb's lives on this pullout and on the bridge traffic, and a closed afternoon is a real loss. Hannah, if the book shuts, it shuts clean. Do not make Louisa's sister the reason I get to keep a bad machine running.",
        endSpeakerId: "p.louisa_garrett",
        end:
          "Closed. The book says so today, at Lamb's, on Route 17. I did not need your speech and I will not pretend my sister signed the page. Pearl heard the category. The cooler was wrong, the stand is shut, and Addison can buy its creemee somewhere that is not lying about the cold. I hate it and I will not unhate the machine to be loved.",
        flags: { "flags.inspect.closed": true },
        summary:
          "Louisa Garrett closes Lamb's Creemee the day of the inspection. The sister is not used as a bargain. Pearl hears the closing as a book, not as a story about maple-walnut.",
      },
      {
        id: "open",
        choiceId: "open",
        choice: "Keep Lamb's open and say aloud what will be fixed.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "Then say the fix in this doorway, Hannah, where I can repeat it and Louisa can test it. I am not sending you down Route 17 after a gasket, and I am not trading her sister for a stay of execution. The cooler has to be right before tomorrow's cream. If the promise is only a mood, I would rather she close me than let me lie to the bridge traffic.",
        endSpeakerId: "speaker.ellis",
        end:
          "The cooler will be at the temperature your book requires before tomorrow's cream at Lamb's, and I am saying that on this pullout, not sending anyone down the road for a part. Pearl Lamb hears it. Louisa Garrett can close us later if the speech was empty. The sister is not the bargain. The promise is the whole offer.",
        flags: { "flags.inspect.open": true },
        summary:
          "Lamb's stays open on a spoken promise: the cooler will be right before tomorrow's cream. No part is fetched, and Louisa's sister is not used to purchase the delay.",
      },
    ],
    alt: {
      npcId: "p.louisa_garrett",
      surrogateId: "p.pearl_lamb",
      resolution:
        "If Louisa Garrett is dead, no inspector is in the doorway, but the cooler is still wrong. Pearl Lamb applies the standard Louisa would have used and refuses to spend the sister as a charm. Hannah either closes the stand in speech or states the fix.",
      opening: {
        speakerId: "p.pearl_lamb",
        text:
          "Louisa is dead and the cooler is not. I will not use her sister, or mine, or anybody's maple-walnut, to bargain with a machine. Hannah, Lamb's can close today because the cold is wrong, or it can stay open if you say, here, what will be fixed before tomorrow's cream. I am not sending you after hardware. Route 17 can wait on a sentence.",
      },
      branches: [
        {
          id: "ldead_close",
          choiceId: "ldead_close",
          choice: "Tell Pearl to close Lamb's on the cooler's account.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "Closed, then, by me, because the inspector is dead and the standard is not. I will not keep Addison in bad cream to feel loyal. The sister stays out of it. Hannah, the book can say we shut ourselves. That is uglier than a fine and cleaner than a story. The pullout goes quiet until the cold is honest.",
          flags: { "flags.inspect.closed": true },
          summary:
            "With Louisa dead, Pearl closes Lamb's because the cooler is wrong. No sister is bargained, and the stand does not stay open on sentiment.",
        },
        {
          id: "ldead_open",
          choiceId: "ldead_open",
          choice: "Keep the stand open and speak the cooler promise to Pearl.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "I heard you. Before tomorrow's cream, the cooler matches the temperature Louisa would have written, and nobody is dispatched down Route 17 to make the promise look busy. Lamb's stays open, Hannah. If you were empty, I will close us myself in the morning. Her sister does not get a vote from the grave.",
          flags: { "flags.inspect.open": true },
          summary:
            "With Louisa dead, Pearl keeps Lamb's open on Hannah's spoken promise about the cooler. The fix is speech tested in the morning, not a run for parts.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.pearl_lamb",
        surrogateId: "p.randy_lamb",
        resolution:
          "If Pearl Lamb is dead, Randy Lamb has the stand and still cannot spend Louisa Garrett's sister as a bargain. He wants the pullout alive. The cooler is nevertheless wrong, and the choice is a closing or a spoken fix.",
        opening: {
          speakerId: "p.randy_lamb",
          text:
            "Pearl is dead and I still have a cooler that will not hold temperature, which is a rotten inheritance. Louisa Garrett can close Lamb's today. Her sister loved maple-walnut. If you use that on her, I will be ashamed of both of us. Hannah, shut the pullout, or say what gets fixed before tomorrow, in words, not in a parts run down Route 17.",
        },
        branches: [
          {
            id: "pdead_close",
            choiceId: "pdead_close",
            choice: "Let Louisa close the stand with Randy present.",
            endSpeakerId: "p.randy_lamb",
            end:
              "Then we are closed, and I will not rewrite it as the bridge's fault. Louisa did the book. The sister stayed out of the bargaining, Hannah. I hate a dark machine on this Addison pullout. I hate a liar's cooler more, today, because Pearl is not here to say it slower. The stand is shut.",
            flags: { "flags.inspect.closed": true },
            summary:
              "With Pearl dead, Louisa closes Lamb's in front of Randy. The sister is not a bargain, and the cooler failure is the reason on the book.",
          },
          {
            id: "pdead_open",
            choiceId: "pdead_open",
            choice: "Keep it open and speak the fix where Randy can repeat it.",
            endSpeakerId: "p.randy_lamb",
            end:
              "Open, on your sentence: right temperature before tomorrow's cream, no errand for a part, no sister in the trade. I can repeat that, Hannah. If the cooler is still wrong in the morning, Louisa can close us and I will hold the door. Lamb's does not get to be a feeling. It has to be cold enough.",
            flags: { "flags.inspect.open": true },
            summary:
              "With Pearl dead, Randy keeps the stand open on a spoken cooler promise. Louisa's sister is not exchanged for the extra day.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "stance",
        "stance.cooler_door",
        "Lamb's is either closed for a wrong cooler or left open on a spoken promise, and Louisa's sister is refused as the price of either stance.",
      ),
      reward(
        "record",
        "record.inspection_book",
        "The inspection day at the Addison pullout is recorded as a closing or as a promise about tomorrow's cream, not as a story about maple-walnut.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Hannah Greer's body before speaking, Louisa Garrett closes Lamb's on the book without Ellis's speech. The sister is not consulted, and Pearl does not get a promise to repeat.",
      unresolved:
        "The season keeps the closing Louisa wrote alone. No spoken fix exists, the cooler stays the reason, and Ellis's mouth is absent from the Addison book.",
      resolved:
        "Hannah's death does not reopen a book already closed, and it does not erase a promise Pearl heard. The inspection day at Lamb's stays the stance that was spoken while the cooler was wrong.",
      sets: {},
    }),
    implications:
      "Lamb's Creemee either loses the day to a rightful closing or keeps it on a promise about the cooler that anyone on the pullout could hear. The sister who loved maple-walnut remains a fact and not a tool, and Route 17 is not sent hunting hardware.",
  }),

  standalone({
    id: "q.offseason_glass",
    title: "The Boarded Window",
    eras: ["E5"],
    locationId: "loc.addison.creemee_stand",
    characters: ["p.ivy_lamb"],
    summary:
      "In 2022 Ivy Lamb is twenty-six at the Route 17 pullout, and Lamb's may already be closed. She refuses the word that would turn the stand into a product line. Last can mean the order book in her kitchen, or one night with the service window open that she will not call a business. Rowan Keel is the body in the lot.",
    discovery:
      "Rowan Keel comes to the Addison pullout because the boards are up or about to be, and Ivy Lamb is the one who can see the lot, the bridge traffic, and her own kitchen from the same gravel. Nothing past that gravel needs a decision she cannot see.",
    steps: [
      "Stand with Ivy Lamb at the boarded pullout and let her refuse any name for the stand that sounds like a product line.",
      "Open the service window for one night as a rite, or leave it shut and keep last as the order book in her kitchen.",
      "Leave the gravel with that meaning of last, and do not settle any business she cannot see from the pullout.",
    ],
    opening: {
      speakerId: "p.ivy_lamb",
      text:
        "Don't say brand. I am twenty-six, the stand may be done, and I can see Route 17 and the bridge traffic from this gravel without a sermon. Rowan, last can mean the order book is in my kitchen, or it can mean I open this window one night and refuse to call it a business. Those are the only lasts I can actually touch. Pick one. Leave the rest of the county's appetite alone.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text:
          "You hate an unfinished latch, Rowan, and a boarded service window will itch you. Don't say brand at me to scratch it. I am Ivy Lamb and this is the Addison pullout, not a gate on a creek. Open it one night as a rite I will not call a shop, or leave it shut and let the order book in my kitchen be the last. I will not invent a third door.",
      },
    },
    branches: [
      {
        id: "rite",
        choiceId: "rite",
        choice: "Open the service window for one night, and not as a business.",
        middleSpeakerId: "p.ivy_lamb",
        middle:
          "One night, then, and I will take the boards off this opening only. If you start talking about a season, I put them back. Rowan, the rite is that the window is a window and the book stays a book. I will not sell the idea of Lamb's to whoever is crossing from the bridge. I might hand a cone to someone already in the lot. That is different.",
        endSpeakerId: "p.ivy_lamb",
        end:
          "Open, for the one night, and I am not calling it a reopening. The order book still sleeps in my kitchen. Route 17 can look at a lit service window and not own it. Rowan Keel, you wanted a latch undone. I undid it as a rite. In the morning the boards can go back without a speech about revival. Last, tonight, means the glass was clear.",
        flags: { "flags.window.opened": true, "flags.creemee.window_rite": true },
        summary:
          "Ivy opens the boarded service window for one night as a rite, not a business. The order book stays in her kitchen, and the Addison pullout does not become a revival story.",
      },
      {
        id: "shut",
        choiceId: "shut",
        choice: "Leave the service window shut and keep the book at home.",
        middleSpeakerId: "p.ivy_lamb",
        middle:
          "Shut, then. Last is the order book in my kitchen, where Pearl can stop imagining the pullout as a duty. I will not open the glass to scratch your need for a finished gesture, Rowan. The bridge traffic can pass an Addison lot with boards on it. That is a true picture. It is not a tragedy I am required to correct before dark.",
        endSpeakerId: "p.ivy_lamb",
        end:
          "Left shut. The boards stay, the book stays home, and I did not let you turn a closed stand into a ceremony with better lighting. Rowan, last means I know where the orders are and I am not performing them for Route 17. If someone wants maple-walnut they can want it. I am not the county's unfinished latch.",
        flags: { "flags.window.shut": true, "flags.creemee.closed_kept": true },
        summary:
          "The service window stays shut. Ivy keeps the stand closed and the order book in her kitchen, and she refuses to treat the boards as a problem Rowan is required to solve.",
      },
    ],
    alt: {
      npcId: "p.ivy_lamb",
      surrogateId: "p.pearl_lamb",
      resolution:
        "If Ivy Lamb is dead, Pearl Lamb is the one at the boarded pullout with Rowan Keel. She will not nail Ellis's meaning onto the boards. The choice is still one open night that is not a business, or a shut window with the book kept.",
      opening: {
        speakerId: "p.pearl_lamb",
        text:
          "Ivy is dead and I am too old to let you rename this pullout into something a truck could carry. Don't say brand, Rowan. The boards are on Lamb's, the book can live in the kitchen, or the service window can open for one night that I will not call a shop. I can see the gravel and the bridge. I cannot see a future you invent past the lot line.",
      },
      branches: [
        {
          id: "idead_rite",
          choiceId: "idead_rite",
          choice: "Have Pearl open the window one night and call it a rite.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "One night, and I take the boards off this opening only. It is a rite because Ivy is not here to roll her eyes, and because I refuse the other words. The book stays in the kitchen. Rowan, Route 17 gets a lit window and no promise of tomorrow. In the morning I can board it again without nailing your meaning to the wood.",
          flags: { "flags.window.opened": true, "flags.creemee.window_rite": true },
          summary:
            "With Ivy dead, Pearl opens the service window for one night as a rite. She does not turn the Addison pullout back into a business or a slogan.",
        },
        {
          id: "idead_shut",
          choiceId: "idead_shut",
          choice: "Have Pearl leave the boards up and the book kept.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "Shut. I will not open the glass to give Rowan a completed feeling. The order book stays where Ivy would have put it, in the kitchen, and the boards stay on Lamb's. Closed and kept. If that is a smaller last than you wanted, the pullout is a small piece of gravel. I am not building past what I can see.",
          flags: { "flags.window.shut": true, "flags.creemee.closed_kept": true },
          summary:
            "With Ivy dead, Pearl leaves the window shut and keeps the order book. The stand stays closed, and she does not attach Ellis's meaning to the boards.",
        },
      ],
    },
    rewards: [
      reward(
        "token",
        "token.window_night",
        "The boarded service window either opens for one rite-night or stays shut, and that physical state is the token Ivy can point at from the gravel.",
      ),
      reward(
        "stance",
        "stance.last_creemee",
        "Last means either a night that is not a business or an order book kept at home, and Ivy refuses any larger name for Lamb's.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Rowan Keel's body before choosing, the boards stay and Pearl Lamb nails none of Ellis's meaning to them. The Addison window is not opened as a rite and not explained.",
      unresolved:
        "The season keeps the boards. No rite-night happens, the order book is simply wherever the house left it, and Pearl will not hammer Rowan Keel's unfinished sentence onto Lamb's.",
      resolved:
        "Rowan's death does not reopen a window that was left shut, and it does not cancel a rite already held. Pearl does not nail a later meaning onto the boards of the Addison pullout.",
      sets: {},
    }),
    implications:
      "Lamb's in 2022 either has one night of open glass that Ivy will not call a business, or it stays boarded with the order book in the kitchen. Nothing beyond the pullout, the bridge traffic she can see, and that book is decided.",
  }),

  standalone({
    id: "q.recipe_wage",
    title: "The Recipe's Wage",
    eras: ["E2"],
    locationId: "loc.addison.creemee_stand",
    characters: ["p.kitty_march", "p.pearl_lamb"],
    summary:
      "At Lamb's, Kitty March wants her mother Dolores March's name on the maple-walnut card. Pearl Lamb can keep the summer's profit. Kitty is not taking the machine. She is taking the sentence. Louis Pell is the body in the yard. The wage is public attribution and a season's cream acknowledged in speech, or the stand keeps the recipe as its own.",
    discovery:
      "Louis Pell is at the Addison pullout because the maple-walnut card is on the counter unsigned, and Kitty March has come up from Waltham to stand in the gravel with Pearl. The machine is not the argument. The sentence on the card is.",
    steps: [
      "Hear Kitty March separate Dolores's name from the machine, and hear Pearl separate the summer's profit from a romantic gesture.",
      "Put Dolores March on the card and acknowledge the season's cream in speech, or let Pearl keep the recipe as the stand's own label.",
      "Leave the card signed the way you chose, and do not turn the hour into an exchange of pots, parts, or labor.",
    ],
    opening: {
      speakerId: "p.kitty_march",
      text:
        "Pearl can keep the profit of the summer, Louis. She cannot keep my mother's name off the maple-walnut card. Dolores March made the order of it in Waltham, walnut then maple then cold, and this Addison pullout has been selling the sentence without the woman. I am not taking the machine. I am taking the words. Speak them in public or let the stand keep a theft that looks like a flavor.",
      variant: {
        when: { ideal: "names_aloud" },
        text:
          "You are the sort who thinks a name spoken is a wage, Louis Pell, so do not go shy at the counter. Dolores March is the name. Pearl Lamb can keep the cream money. I want the card at Lamb's to say my mother out loud in ink, and I want the summer's cream acknowledged in somebody's mouth, not paid to me in scoops. I am not here to haul the machine to Waltham.",
      },
    },
    branches: [
      {
        id: "paid",
        choiceId: "paid",
        choice: "Put Dolores's name on the card and say the summer aloud.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "Then I say it where the pullout can hear. The summer's cream paid the electric, and the method is Dolores March's, not a dairy's and not mine. Kitty is not getting the machine and she is not getting a bucket to carry home. Louis, if attribution is the wage, I can pay that wage with a mouth and a card. I will not pretend I invented walnut.",
        endSpeakerId: "p.kitty_march",
        end:
          "The card says Dolores March, and Pearl said the summer's cream out loud without handing me a tool or a tub. That is the wage, Louis. Lamb's keeps the profit. Waltham keeps the sentence. I am not owed a shop. I was owed a name on maple-walnut, and this Addison counter finally has it where a stranger can read it.",
        flags: { "flags.recipe.paid_kitty": true, "flags.creemee.recipe_waltham": true },
        summary:
          "The maple-walnut card publicly names Dolores March, and Pearl acknowledges the season's cream in speech. Kitty does not take the machine. The recipe stays attributed to the Waltham woman who made it.",
      },
      {
        id: "kept",
        choiceId: "kept",
        choice: "Let Pearl keep the recipe as the stand's own.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "Then the card stays a Lamb's card, and I will say that plainly so Kitty does not have to hear it from a shrug. The summer's profit stays here because the cream was sold here, Louis. I know Dolores March's order of operations. I am keeping the flavor as stand property, labeled as ours. That is a hard sentence. I would rather it be hard than half-said.",
        endSpeakerId: "p.pearl_lamb",
        end:
          "Kept. The maple-walnut card does not grow a Waltham name today. Kitty March heard me claim the recipe as Lamb's, on this pullout, with the machine still mine and the profit still the summer's. Louis, you chose the label over the mother. I will live with her anger. I will not live with a card that apologizes every time someone orders.",
        flags: { "flags.recipe.pearl_kept": true, "flags.creemee.recipe_labeled": true },
        summary:
          "Pearl keeps the maple-walnut recipe as stand property. The card is labeled as Lamb's, not as Dolores March's, and Kitty leaves without the machine and without the public sentence she wanted.",
      },
    ],
    alt: {
      npcId: "p.kitty_march",
      surrogateId: "p.pearl_lamb",
      resolution:
        "If Kitty March is dead, Pearl Lamb still has an unsigned maple-walnut card and the knowledge of Dolores. She can attribute the flavor to the Waltham kitchen in speech, or keep it as the stand's label, without a daughter there to take a machine nobody offered.",
      opening: {
        speakerId: "p.pearl_lamb",
        text:
          "Kitty is dead and the card is still unsigned, Louis. Dolores March made maple-walnut in Waltham. I sold it all summer at Lamb's and kept the electric paid. I can say her name on the card and say the season out loud, or I can keep the recipe as the stand's and stop pretending the silence is neutral. Nobody is taking the machine. The sentence is the whole fight.",
      },
      branches: [
        {
          id: "kdead_paid",
          choiceId: "kdead_paid",
          choice: "Have Pearl put Dolores March on the card anyway.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "Then the card says Dolores, and I say the summer's cream in the same breath, profit staying here, name going to Waltham. Kitty is not alive to hear the wage. That does not make the sentence cheaper, Louis. Lamb's keeps the machine. The pullout keeps a card a stranger can trust. I will not call that generosity. I will call it late accuracy.",
          flags: { "flags.recipe.paid_kitty": true, "flags.creemee.recipe_waltham": true },
          summary:
            "With Kitty dead, Pearl still attributes maple-walnut to Dolores March on the card and acknowledges the season in speech. The stand keeps the profit and the machine.",
        },
        {
          id: "kdead_kept",
          choiceId: "kdead_kept",
          choice: "Have Pearl label the flavor as the stand's alone.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "Kept, and I will not use Kitty's death as the soft reason. The card says Lamb's. The recipe is stand property. Dolores March remains a woman I could have named and did not, Louis. The summer's cream stays an Addison fact. If that is a theft, it is a theft I am signing, not a blank I am hoping will pass for peace.",
          flags: { "flags.recipe.pearl_kept": true, "flags.creemee.recipe_labeled": true },
          summary:
            "With Kitty dead, Pearl labels maple-walnut as Lamb's property. The card stays unsigned by any March name, and the stand keeps both profit and sentence.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.pearl_lamb",
        surrogateId: "p.kitty_march",
        resolution:
          "If Pearl Lamb is dead, Kitty March is left at the pullout with the machine she does not want and the card she does. She can put Dolores's name on it and acknowledge the season, or leave the stand's label untouched because the keeper is gone.",
        opening: {
          speakerId: "p.kitty_march",
          text:
            "Pearl is dead, Louis, and I still do not want the machine. I want Dolores March on the maple-walnut card at this Addison pullout. The summer's cream was theirs to keep and I can say that out loud without hauling a tub back to Waltham. Or the card can stay a stand label and my mother can stay a rumor. Choose. Grief is not a third recipe.",
        },
        branches: [
          {
            id: "pearldead_paid",
            choiceId: "pearldead_paid",
            choice: "Let Kitty sign Dolores onto the card in public.",
            endSpeakerId: "p.kitty_march",
            end:
              "Signed. Dolores March, and the season's cream acknowledged as Lamb's profit, not as a debt I am collecting in goods. Pearl's death does not make me owner of the pullout, Louis. It makes the sentence mine to finish. The machine stays. The card finally tells the truth a Waltham kitchen already knew.",
            flags: { "flags.recipe.paid_kitty": true, "flags.creemee.recipe_waltham": true },
            summary:
              "With Pearl dead, Kitty puts Dolores March's name on the maple-walnut card and states that the season's cream was the stand's. She does not take the machine.",
          },
          {
            id: "pearldead_kept",
            choiceId: "pearldead_kept",
            choice: "Leave the card as stand property even with Pearl gone.",
            endSpeakerId: "p.kitty_march",
            end:
              "Then it stays theirs, and I will not rob a dead keeper to feel faithful to my mother. The label remains Lamb's. Dolores stays off the card, Louis. I hate it and I agreed to it. The machine was never the wage. A sentence I refuse to steal is also a sentence. Waltham can keep the pot at home.",
            flags: { "flags.recipe.pearl_kept": true, "flags.creemee.recipe_labeled": true },
            summary:
              "With Pearl dead, Kitty leaves the recipe labeled as the stand's. Dolores March is not written onto the card, and the machine stays unclaimed.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "record.maple_card",
        "The maple-walnut card either names Dolores March of Waltham or labels the flavor as Lamb's property, and that ink is the record of the wage.",
      ),
      reward(
        "stance",
        "stance.recipe_sentence",
        "Kitty takes a sentence, not the machine, and the season's cream is either acknowledged in speech or kept inside the stand's own claim.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Louis Pell's body before the card is touched, the card stays unsigned. Kitty March does not get the sentence, and Pearl Lamb does not have to admit the Waltham pot.",
      unresolved:
        "The season ends with the maple-walnut card still unsigned. No public attribution and no honest stand-label choice was spoken, so the pullout keeps a blank where a wage should have been.",
      resolved:
        "Louis Pell's death does not unsign the card. Dolores March's name or Lamb's label, whichever was spoken, stays the maple-walnut record at the Addison stand.",
      sets: {},
    }),
    implications:
      "Lamb's either sells maple-walnut under Dolores March's name, with the summer's cream acknowledged and the profit kept, or it sells the flavor as stand property. Kitty never takes the machine. The sentence is the whole transfer.",
  }),

  standalone({
    id: "q.memorial_bench",
    title: "The Clear-Zone Bench",
    eras: ["E4"],
    locationId: "loc.ferrisburgh.bench_pullout",
    characters: ["p.allan_briggs", "p.pearl_lamb"],
    summary:
      "A memorial bench for Hugh Lamb sits in the state's clear zone on a Ferrisburgh pullout. Allan Briggs did not kill Hugh. He also cannot leave a memorial that becomes a crash. He wants a place, not a speech. Chris Dobbs is the body in the gravel. The bench moves, or it stays and Ellis accepts the argument Allan names.",
    discovery:
      "Chris Dobbs stops at the Ferrisburgh pullout because the bench is already in the clear zone and Allan Briggs is already measuring it without a funeral voice. Pearl Lamb is there because the name on the slats is Hugh, and the road does not care who is grieving.",
    steps: [
      "Stand at the Ferrisburgh bench with Allan Briggs and Pearl Lamb and hear the clear-zone argument without turning it into a eulogy.",
      "Give Allan a place to move the bench, or refuse and leave it, accepting the crash he names.",
      "Leave the pullout with the bench either shifted or knowingly left, and do not substitute a speech for the place.",
    ],
    opening: {
      speakerId: "p.allan_briggs",
      text:
        "The bench is in the clear zone, Chris. I did not kill Hugh Lamb, and I will not pretend this Ferrisburgh pullout is a church. I also cannot leave a memorial that becomes a crash when someone leaves the lane. Give me a place to put it that is not a speech. Pearl is here for the name. I am here for the distance off the travel lane. Those can both be true if you pick.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text:
          "You do not like leaving a hazard half-latched, Chris Dobbs, and a bench in the clear zone is that kind of unfinished. I am Allan Briggs. I did not put Hugh Lamb in the ground. I can move this Ferrisburgh seat back from the lane if you give me a place, or you can refuse and own the crash I am naming. Do not give me a eulogy. Give me a distance or a no.",
      },
    },
    branches: [
      {
        id: "moved",
        choiceId: "moved",
        choice: "Move the bench back from the lane, still on this pullout.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "If it moves, it still has to be a place a person can sit and know it is Hugh's, not a scrap you hid behind a sign. I am not asking Allan for a poem. I am asking you, Chris, not to solve Ferrisburgh by making the bench disappear into a yard we do not own. Back from the clear zone, on this gravel, where I can still find it without a speech.",
        endSpeakerId: "p.allan_briggs",
        end:
          "Moved. Back off the travel lane, still on the Ferrisburgh pullout, still Hugh Lamb's bench and not a slogan. You gave me a place, Chris, which is what I asked, and Pearl can see it from the same gravel. I did not kill him. I also will not leave a seat where a tired driver becomes the next name. That distance is the whole mercy I have.",
        flags: { "flags.bench.moved": true },
        summary:
          "The memorial bench is moved out of the clear zone but kept on the Ferrisburgh pullout, still findable as Hugh Lamb's. Allan gets a place rather than a speech, and Pearl witnesses the distance.",
      },
      {
        id: "stayed",
        choiceId: "stayed",
        choice: "Leave the bench and accept the crash he names.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "If it stays, say the risk out loud so I do not have to pretend you were only being tender about Hugh. Allan named a crash. The clear zone is not a mood. Chris, I loved the man who kept our machine, and I will not let that love counterfeit a road argument. Leave it if you will own the argument, not if you want the pullout to feel kind.",
        endSpeakerId: "p.allan_briggs",
        end:
          "Then it stays, and you are accepting the argument I named: a memorial in the clear zone can become a crash. I will write that you refused the move, Chris, not that Ferrisburgh forgot Hugh Lamb. Pearl heard you take the risk. I did not kill him. If someone else dies on this seat's account, the refusal is part of the record of the pullout.",
        flags: { "flags.bench.stayed": true },
        summary:
          "The bench stays in the clear zone because Ellis refuses the move and accepts Allan's crash argument. Hugh Lamb's memorial remains where it is, with the risk spoken and witnessed.",
      },
    ],
    alt: {
      npcId: "p.allan_briggs",
      surrogateId: "p.pearl_lamb",
      resolution:
        "If Allan Briggs is dead, another crew will eventually trust the manual without a witness. Pearl Lamb can still choose, with Chris Dobbs, whether Hugh's bench moves back on the Ferrisburgh pullout now or stays in the clear zone with the crash argument accepted.",
      opening: {
        speakerId: "p.pearl_lamb",
        text:
          "Allan is dead and the bench is still in the clear zone, Chris. I will not let a later crew move Hugh Lamb on a Tuesday with nobody who loved him in the gravel. Give this Ferrisburgh pullout a place back from the lane, or leave the seat and say you accept the crash a road man already named. I want a place. I do not want a eulogy from you.",
      },
      branches: [
        {
          id: "allandead_moved",
          choiceId: "allandead_moved",
          choice: "Have Pearl set the place back from the lane.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "Then we move it back, still on this pullout, still Hugh's. Allan is not here to measure, so I will trust the distance a driver needs and not a speech about grief. Chris, you gave me a place instead of a performance. If the state disagrees with the feet, they can argue with a bench they can see, not with a man already gone.",
          flags: { "flags.bench.moved": true },
          summary:
            "With Allan dead, Pearl moves Hugh Lamb's bench back from the clear zone while keeping it on the Ferrisburgh pullout. The move has a witness.",
        },
        {
          id: "allandead_stayed",
          choiceId: "allandead_stayed",
          choice: "Leave it, and accept the crash argument without Allan.",
          endSpeakerId: "p.pearl_lamb",
          end:
            "Stays, then. I hate it and I heard you accept the risk he used to name, even though he is dead and cannot repeat it. The Ferrisburgh bench remains in the clear zone, Hugh Lamb's name still facing the lane. Chris, if this becomes a crash, the refusal was ours. I will not pretend tenderness moved a single foot.",
          flags: { "flags.bench.stayed": true },
          summary:
            "With Allan dead, the bench stays in the clear zone. Pearl and Chris accept the crash argument in his absence rather than pretending love is a setback distance.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.pearl_lamb",
        surrogateId: "p.allan_briggs",
        resolution:
          "If Pearl Lamb is dead, no one from the stand is on the gravel to guard Hugh's name. Allan Briggs still needs a place rather than a speech, and Chris Dobbs either moves the bench with him or leaves it while accepting the crash.",
        opening: {
          speakerId: "p.allan_briggs",
          text:
            "Pearl is dead, so do not wait for the family to make this feel decent, Chris. Hugh Lamb's bench is in the clear zone on a Ferrisburgh pullout, and I did not kill him. I can move it if you give me a place back from the lane that is still a place. Or you refuse, and you accept the crash I am naming. I will not supply the eulogy you are missing.",
        },
        branches: [
          {
            id: "pearlbench_moved",
            choiceId: "pearlbench_moved",
            choice: "Move it with Allan to a place still on the pullout.",
            endSpeakerId: "p.allan_briggs",
            end:
              "Moved, without Pearl to bless it. Back from the lane, still on the Ferrisburgh gravel, still a bench with Hugh Lamb's name and not a speech tucked under the slats. Chris, you gave me a place. That is the whole transaction. If the family hates the feet, they can hate a living distance instead of a crash.",
            flags: { "flags.bench.moved": true },
            summary:
              "With Pearl dead, Allan and Chris move the bench out of the clear zone to a place still on the Ferrisburgh pullout. No eulogy stands in for the distance.",
          },
          {
            id: "pearlbench_stayed",
            choiceId: "pearlbench_stayed",
            choice: "Leave the bench and accept Allan's crash argument.",
            endSpeakerId: "p.allan_briggs",
            end:
              "It stays. You heard me name the crash and you refused the move anyway, with no Pearl here to soften either of us. The clear zone keeps Hugh Lamb's bench. I will note the refusal, Chris, because a memorial that kills somebody later should not get to claim it was never argued on this pullout.",
            flags: { "flags.bench.stayed": true },
            summary:
              "With Pearl dead, the bench stays in the clear zone. Chris accepts the crash Allan names, and the refusal is noted without a family witness.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "stance",
        "stance.clear_zone",
        "Ellis either gives Allan a place to move Hugh's bench or accepts, in speech, the crash a memorial in the clear zone can become.",
      ),
      reward(
        "token",
        "token.hugh_bench",
        "Hugh Lamb's bench is the token: shifted back on the Ferrisburgh pullout, or left in the clear zone with the risk acknowledged.",
      ),
    ],
    death: death({
      mid: "If Ellis dies in Chris Dobbs's body before the place is given or refused, Allan Briggs moves the bench on Tuesday without a witness. Pearl does not get to stand on the gravel for the distance.",
      unresolved:
        "Tuesday comes with no answer from Chris. Allan moves Hugh Lamb's bench out of the clear zone alone, and Ferrisburgh has no witness for where it sat or why it left.",
      resolved:
        "Chris Dobbs's death does not undo a move already made or a refusal already accepted. The Ferrisburgh bench stays where the pullout left it, and Allan does not need a quiet Tuesday to revise the witness.",
      sets: {},
    }),
    implications:
      "The Ferrisburgh pullout either keeps Hugh Lamb's bench out of the clear zone in a place people can still find, or it keeps the bench where it is because Ellis accepted the crash Allan Briggs named. The hour wanted a place, not a eulogy, and it got one or the other.",
  }),
];
