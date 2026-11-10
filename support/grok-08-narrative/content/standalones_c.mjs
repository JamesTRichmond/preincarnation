import { standalone } from "./questkit.mjs";
import { death, reward } from "./death.mjs";

export const quests = [
  standalone({
    id: "q.till_wrapper",
    title: "The Coin Wrapper",
    eras: ["E2"],
    locationId: "loc.addison.creemee_stand",
    characters: ["p.hugh_lamb", "p.pearl_lamb"],
    summary:
      "In 1980 at Lamb's Creemee, Hugh Lamb is ill and still alive, and his till holds a 1938 coin wrapper labeled Ivo. Louis Pell can open it and read a dead man's amount aloud, or leave the rattle in the drawer for Hugh to die with.",
    discovery:
      "Hugh Lamb sets the coin wrapper on the counter at the Addison pullout and tells Louis Pell the pencil says 1938 and Ivo. Pearl Lamb watches the till and does not reach. Nobody sent anyone. The drawer is open because Hugh opened it.",
    implications:
      "Opening the wrapper makes Ivo Perch's amount a spoken fact of the stand while Hugh Lamb can still hear it. Leaving it keeps the rattle private, and Hugh will die with that noise in the drawer, a confession never made.",
    steps: [
      "Hear Hugh Lamb name the 1938 wrapper in the till and say that opening it confesses for a dead man.",
      "Choose whether Louis Pell reads the amount aloud at the counter or leaves the wrapper shut in the drawer.",
      "Stay with Hugh Lamb and Pearl Lamb until the till either gives up the number or keeps the rattle.",
    ],
    opening: {
      speakerId: "p.hugh_lamb",
      text: "Hugh Lamb sets a coin wrapper on the counter at Lamb's Creemee and keeps two fingers on it. The pencil says 1938, and under the year the name Ivo. He looks at Louis Pell, not at Pearl Lamb. Open that and you are confessing for a dead man. Leave it and I die with a rattle in the drawer. I know what I prefer. I am not sure the till gives me the vote.",
      variant: {
        when: { flaw: "spares_a_kind_lie" },
        text: "Louis Pell's hand stops over the wrapper because a closed mercy is still a mercy, even when the mercy is inaccurate. Hugh Lamb sees the stop. Pearl Lamb says nothing. The band still reads 1938 and Ivo, and the kindness would be to let a sick man at Lamb's Creemee keep his rattle unsaid.",
      },
    },
    branches: [
      {
        id: "opened",
        choiceId: "till_open",
        choice: "Open the wrapper here and read Ivo's amount aloud.",
        middleSpeakerId: "p.pearl_lamb",
        middle:
          "Pearl Lamb watches the paper come apart and does not look away. Hugh Lamb's mouth moves as if he might stop Louis Pell, then he does not. The halves inside are ordinary money from 1938 and nobody reaches to spend them. The number on the inside of the band is the confession, and Pearl waits for it to be said in the stand.",
        endSpeakerId: "p.hugh_lamb",
        end: "Hugh Lamb repeats it once, so Lamb's Creemee has heard it: thirty-six dollars, Ivo Perch, 1938. He will not spend the halves. He puts the broken band in the till where the rattle was. That is the confession. Don't make it a flavor, and don't make it a story you tell better than I heard it.",
        flags: { "flags.till.opened": true },
        summary:
          "Louis Pell opens the 1938 wrapper at Lamb's Creemee and reads Ivo Perch's amount aloud, so the confession is spoken while Hugh Lamb is still alive to hear the number.",
      },
      {
        id: "left",
        choiceId: "till_leave",
        choice: "Leave the wrapper shut in Hugh Lamb's till.",
        middleSpeakerId: "p.hugh_lamb",
        middle:
          "Hugh Lamb nods as if Louis Pell has handed him something heavier than agreement. He slides the 1938 wrapper back under the coin tray, and the paper ticks once against the metal. Pearl Lamb hears the tick and does not name it. Then it dies with me. If she finds it later, that is her trouble, not yours.",
        endSpeakerId: "p.pearl_lamb",
        end: "Pearl Lamb closes the till with the flat of her hand. I heard you leave it. When Father is gone I will know there is a rattle, and I will not hang it on Louis Pell. Ivo Perch can stay a pencil mark. We sell creemees at this pullout. We do not sell a dead man's amount.",
        flags: { "flags.till.left": true },
        summary:
          "The 1938 wrapper stays shut in Hugh Lamb's till, and Pearl Lamb hears Louis Pell leave the rattle for a dying man rather than confess Ivo Perch's amount.",
      },
    ],
    alt: {
      npcId: "p.hugh_lamb",
      surrogateId: "p.pearl_lamb",
      resolution:
        "If Hugh Lamb is already dead, Pearl Lamb has the till and the wrapper. She will not pretend her father is in the room to cast the vote he wasn't sure he had. Louis Pell still opens the band or leaves the rattle.",
      opening: {
        speakerId: "p.pearl_lamb",
        text: "Pearl Lamb has the coin wrapper on the closed machine, not in a living man's hand. Father died in the spring. This was in the drawer, dated 1938, labeled Ivo. He told me opening it would confess for a dead man. He is dead. Ivo Perch is dead. You are here, Louis. I am not doing this in the back room.",
      },
      branches: [
        {
          id: "opened_pearl",
          choiceId: "till_open_pearl",
          choice: "Open Ivo's wrapper with Pearl and read the amount.",
          endSpeakerId: "p.pearl_lamb",
          end: "Pearl Lamb listens to thirty-six dollars and writes nothing down. All right. It was said at Lamb's Creemee, not in a parlor and not in a will. I will not spend it, and I will not tell a customer it was Father's secret saint. It was a wrapper. Now it is a number we both heard.",
          flags: { "flags.till.opened": true },
          summary:
            "With Hugh Lamb already dead, Pearl Lamb hears Louis Pell read the 1938 amount aloud at the stand and refuses to spend it or sanctify it.",
        },
        {
          id: "left_pearl",
          choiceId: "till_leave_pearl",
          choice: "Leave the wrapper shut and let Pearl keep the rattle.",
          endSpeakerId: "p.pearl_lamb",
          end: "Pearl Lamb puts the 1938 band back under the tray and shuts the till hard enough to hear the tick. Then I keep a noise. I will not name it after Louis Pell, and I will not name it as a debt. Ivo can stay pencil. When I die, the next hands can decide what a rattle is worth.",
          flags: { "flags.till.left": true },
          summary:
            "Pearl Lamb keeps the unopened 1938 wrapper in the till after Hugh Lamb's death, and Louis Pell does not turn the rattle into a confession.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.pearl_lamb",
        surrogateId: "p.hugh_lamb",
        resolution:
          "If Pearl Lamb is already dead, Hugh Lamb is alone with the till and the illness. No daughter will find the wrapper later and rename it. He still asks Louis Pell to open it or leave it while he can hear.",
        opening: {
          speakerId: "p.hugh_lamb",
          text: "Hugh Lamb is at the machine without Pearl Lamb, and he does not fill the absence with talk. The wrapper sits where she used to count. 1938. Ivo. She is not going to find this after me, because she went first. Open it in front of me, Louis, or leave it and let the rattle be mine alone.",
        },
        branches: [
          {
            id: "opened_hugh",
            choiceId: "till_open_hugh",
            choice: "Read the amount aloud so Hugh hears it without Pearl.",
            endSpeakerId: "p.hugh_lamb",
            end: "Hugh Lamb hears thirty-six dollars and closes his eyes, not as a prayer, as a man checking he is still in the room. Good. It was said to me, not to a story about me. Put the paper back in the till. I am not spending Ivo Perch's halves on a cone at Lamb's Creemee.",
            flags: { "flags.till.opened": true },
            summary:
              "Hugh Lamb, alone because Pearl Lamb is dead, hears Louis Pell read Ivo Perch's thirty-six dollars and puts the wrapper back unspent.",
          },
          {
            id: "left_hugh",
            choiceId: "till_leave_hugh",
            choice: "Leave the wrapper in the till with Hugh alone.",
            endSpeakerId: "p.hugh_lamb",
            end: "Hugh Lamb slides the band under the tray and coughs once, which is not the rattle and not a speech. Then it stays. Pearl is not here to rename it. If I die this year, Louis, the next hands can call it trash. I will not be at Lamb's Creemee to correct them.",
            flags: { "flags.till.left": true },
            summary:
              "The wrapper stays in Hugh Lamb's till with no Pearl Lamb to find it, and Louis Pell leaves the 1938 rattle unopened.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "token",
        "reward.till.wrapper",
        "The 1938 coin wrapper from Hugh Lamb's till, labeled Ivo, kept as paper and not spent at the stand.",
      ),
      reward(
        "knowledge",
        "reward.till.amount",
        "Louis Pell knows whether Ivo Perch's thirty-six dollars were spoken at Lamb's Creemee or left as a rattle.",
      ),
    ],
    death: death({
      mid: "Louis Pell dies at the counter before the wrapper is dealt with. Pearl Lamb finds it later in Hugh Lamb's drawer and does not call it Ellis's. She calls it her father's paper and leaves the amount unread.",
      unresolved:
        "The season turns without a choice. Hugh Lamb dies with the rattle still in the drawer. Pearl Lamb finds the 1938 wrapper afterward and does not attach the paper to Ellis.",
      resolved:
        "Whatever Louis Pell did with the wrapper remains the stand's fact. Pearl Lamb does not rewrite the opened or unopened band as Ellis's property when the next season comes.",
    }),
  }),

  standalone({
    id: "q.banding_name",
    title: "Lula's Name on the Permit",
    eras: ["E3"],
    locationId: "loc.panton.dead_creek",
    characters: ["p.lula_pike"],
    creatures: ["c.queen"],
    summary:
      "In 1994 at Dead Creek, Lula Pike's name is on a banding permit whose last paragraph she did not write. Hannah Greer can witness a withdrawal that will look like superstition, or witness the name left on, which will look like ambition. Queen is a turtle, not a god.",
    discovery:
      "Lula Pike meets Hannah Greer at the Dead Creek log with the permit unfolded. Queen is hauled out on the sunning log, notched the way Ivo Perch notched her as a juvenile. Lula asks for one witness before the paragraph goes out under her name.",
    implications:
      "If the name comes off, the permit goes forward without Lula Pike and people will call the withdrawal superstition. If the name stays, the page shows ambition, and Hannah Greer will have been the witness Lula asked for rather than a crowd.",
    steps: [
      "Read the last paragraph of the banding permit with Lula Pike at Dead Creek and see that the hand is not hers.",
      "Choose whether Hannah Greer witnesses Lula Pike withdraw her name or witnesses the name left on the page.",
      "Stay until Lula Pike has a witness in the open, with Queen still a snapping turtle and not a verdict.",
    ],
    opening: {
      speakerId: "p.lula_pike",
      text: "My name is on this permit and I did not write the last paragraph. You can see the hand change, Hannah. Withdraw it and I look superstitious in every office that already thinks Panton is a mood. Leave it and I look ambitious, like I meant to speak for the creek. I need a witness, not a crowd. Queen is on the log. She is notched. She is not a magistrate. Don't you start.",
      variant: {
        when: { ideal: "names_aloud" },
        text: "If you are going to witness, Hannah Greer, witness the sentence I did not write, not the pretty part with my name typeset at the top. A name on a page is a wage. I would like to know which wage I am paying at Dead Creek. Queen will not say it. The notch Ivo Perch gave her is not a signature.",
      },
    },
    branches: [
      {
        id: "withdrawn",
        choiceId: "band_withdraw",
        choice: "Withdraw Lula Pike's name from the banding permit.",
        middleSpeakerId: "p.lula_pike",
        middle:
          "I'll strike the name and not the paragraph, so the paragraph stays somebody else's and the signature does not. Say what you saw, Hannah Greer. I took Lula Pike off the page. I did not take Dead Creek off, and I did not ask Queen to bless the pen. She can keep the sun. The notch is a boy's old cut, not a doctrine.",
        endSpeakerId: "speaker.narration",
        end: "Hannah Greer says, in ordinary words, that she watched Lula Pike withdraw her name at Dead Creek. The permit will go out looking thinner. People who wanted a biologist's ambition will call it superstition. Queen stays on the log, a snapping turtle with Ivo Perch's notch, eating nothing that means a moral.",
        flags: { "flags.band.withdrawn": true },
        summary:
          "Lula Pike withdraws her name from the banding permit at Dead Creek, and Hannah Greer stands as the witness so the act is not a private flinch.",
      },
      {
        id: "left_on",
        choiceId: "band_leave",
        choice: "Leave Lula Pike's name on the permit as written.",
        middleSpeakerId: "p.lula_pike",
        middle:
          "Then I own the paragraph I didn't write. That is ambition if they need a short word for a woman who wanted the data and also wanted the animal left alone. You were here, Hannah. If I start sounding like I speak for Queen, stop me. She has a notch from Ivo Perch. She does not have a church, and I don't either.",
        endSpeakerId: "speaker.narration",
        end: "The permit leaves Dead Creek with Lula Pike's name still on it. Hannah Greer is listed in no blank, only in Lula's memory of one witness. Queen slips at the edge of the log and does not perform a sign. The last paragraph goes out as written, ambition and all, under a name that agreed to carry it.",
        flags: { "flags.band.left_on_permit": true },
        summary:
          "Lula Pike's name stays on the banding permit, including the paragraph she did not write, and Hannah Greer remains the witness to that ambition.",
      },
    ],
    alt: {
      npcId: "p.lula_pike",
      surrogateId: "p.vernon_pike",
      resolution:
        "If Lula Pike is already dead, Vernon Pike has the permit with her name still on the last page. He will not make Queen into a reason. He wants Hannah Greer to say whether the name comes off or stays.",
      opening: {
        speakerId: "p.vernon_pike",
        text: "Lula's name. Last paragraph isn't hers. She's not here to be superstitious or ambitious, so I look like both if I choose alone at Dead Creek. Queen is on the log. She's a turtle. I hunt here. I know a notch from a sermon. Tell me the name comes off or it doesn't, Hannah. I don't want a crowd either.",
      },
      branches: [
        {
          id: "withdrawn_vernon",
          choiceId: "band_withdraw_vernon",
          choice: "Take Lula Pike's name off the permit while Vernon watches.",
          endSpeakerId: "p.vernon_pike",
          end: "Vernon Pike watches the line go through Lula Pike's name and grunts, which is not a prayer. Good. I won't tell the marsh she was afraid of a paragraph. I'll tell them her people watched it come off. Queen didn't vote. A snapping turtle doesn't get a column on a permit, notched or not.",
          flags: { "flags.band.withdrawn": true },
          summary:
            "Vernon Pike watches Lula Pike's name come off the banding permit and refuses to call the withdrawal Queen's will or a superstition he invented.",
        },
        {
          id: "left_vernon",
          choiceId: "band_leave_vernon",
          choice: "Leave Lula's name on the page and say so to Vernon.",
          endSpeakerId: "p.vernon_pike",
          end: "Vernon Pike folds the permit into his coat. Then her name goes out. I'll look like I wanted the credit for a dead woman. I can live with looking that way. I can't live with pretending the turtle told me. Queen stays on the log. Hannah Greer, you said leave it. That's the witness I had.",
          flags: { "flags.band.left_on_permit": true },
          summary:
            "Lula Pike's name stays on the permit after her death because Vernon Pike and Hannah Greer leave it there without asking Queen to decide.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "reward.band.permit",
        "The banding permit goes out either without Lula Pike's name or with it, and the difference is written, not felt.",
      ),
      reward(
        "stance",
        "reward.band.witness",
        "Hannah Greer stood as the witness Lula Pike asked for, on withdrawal or on leaving the name, and did not call Queen a god.",
      ),
    ],
    death: death({
      mid: "Hannah Greer dies at the log before she can speak as witness. The permit goes out with Lula Pike's name on the paragraph she did not write, and there is no witness to the choice.",
      unresolved:
        "The season ends with the permit unchosen. It goes out with Lula Pike's name and no witness, and Queen remains a notched snapping turtle on the Dead Creek log.",
      resolved:
        "The witnessed choice stands on the permit after the season. Lula Pike is not left to look superstitious or ambitious with nobody beside her. Hannah Greer's presence is the difference.",
    }),
  }),

  standalone({
    id: "q.wrong_stake_marsh",
    title: "The Wrong Stake",
    eras: ["E1"],
    locationId: "loc.panton.dead_creek",
    characters: ["p.earl_pike", "p.hada_pike"],
    summary:
      "In 1966 at Dead Creek, Ivo Perch's old boundary stake puts a hunting blind on the refuge side. Ada Smollet can pull it and reset the line in the mud, and be called a meddler, or leave the wrong stake and be a person who knew.",
    discovery:
      "Earl Pike shows Ada Smollet the iron stake and the blind it excuses. Hada Pike stands off the boards. The flood book in Middlebury still reads as if this line were settled, and correcting the iron may cost that belief.",
    implications:
      "A stake pulled and reset makes Ada Smollet a meddler in Panton and may cost belief in the flood book. A stake left wrong means she knew the refuge line and let the blind stay. Earl Pike will tell it as weather only if she never chooses.",
    steps: [
      "Stand with Earl Pike at the wrong stake and see how the hunting blind sits on the refuge side of Dead Creek.",
      "Choose whether Ada Smollet pulls Ivo Perch's stake and resets it now, or leaves the wrong iron where it is.",
      "Hear Earl Pike or Hada Pike name the cost in belief, and do not postpone the iron to another day.",
    ],
    opening: {
      speakerId: "p.earl_pike",
      text: "Somebody's stake, the office's stake, puts my cousin's blind on the refuge side of Dead Creek. Correct it, Ada, and they will call you a meddler. Leave it and you are a person who knew the line. The flood book still sounds sure of itself back in Middlebury. I am not sure. Hada won't pretty it up for you. I asked her not to.",
      variant: {
        when: { ideal: "the_record_holds" },
        text: "You keep looking at the iron like the flood book's sentence is standing in the mud, and the sentence is wrong. If the record holds, Ada Smollet, it has to hold here at Dead Creek, not only on the page that taught people to trust Ivo Perch's stake. Hada is waiting. So is the blind. I don't enjoy being the man who forces a book to flinch.",
      },
    },
    branches: [
      {
        id: "corrected",
        choiceId: "stake_correct",
        choice: "Pull the stake now and reset it on the refuge line.",
        middleSpeakerId: "p.hada_pike",
        middle:
          "You pulled Ivo Perch's stake in front of us, so the blind is suddenly on the wrong side of a corrected line. They will call you a meddler in every kitchen that liked the old certainty. The flood book may go with the certainty. I won't lie for the book, Ada Smollet. I also won't clap. Earl can move the lumber. I will watch him do it without a hymn.",
        endSpeakerId: "p.earl_pike",
        end: "Done in the mud, not in a letter. I'll move the blind off the refuge side. If the county says the flood book was holy, I'll tell them the book was comfortable. Don't expect me to be sweet about the difference, Ada. Hada already spent her decency on not cheering. That's enough sweetness for Dead Creek.",
        flags: { "flags.stake.corrected": true },
        summary:
          "Ada Smollet pulls Ivo Perch's stake and resets the refuge line at Dead Creek, accepting the name of meddler and the risk to belief in the flood book.",
      },
      {
        id: "left_wrong",
        choiceId: "stake_leave",
        choice: "Leave Ivo's stake wrong where the blind already sits.",
        middleSpeakerId: "p.earl_pike",
        middle:
          "Then you knew. I can use a person who knew and didn't perform a correction. I can also be ashamed of her. The blind stays on the refuge side. If the flood book is believed because this iron was never touched, that belief is on your hands, Ada Smollet, not on the weather and not on Hada. I won't tell it as rain. Not unless you die and leave me the easy word.",
        endSpeakerId: "p.hada_pike",
        end: "I will not tell this as a flood. I will tell it as a choice if anyone asks. Earl may not. You knew the line, Ada Smollet, and the hunting blind is still on the refuge side of Dead Creek. I have no interest in making the iron into a fable. Knowing was the whole event. You leave it knowing.",
        flags: { "flags.stake.left_wrong": true },
        summary:
          "Ada Smollet leaves Ivo Perch's stake wrong, so the hunting blind stays on the refuge side and she remains a person who knew the line.",
      },
    ],
    alt: {
      npcId: "p.earl_pike",
      surrogateId: "p.hada_pike",
      resolution:
        "If Earl Pike is already dead, Hada Pike still knows which side of the refuge the blind occupies. She will not let Ada Smollet treat a dead man's practicality as permission to skip the stake.",
      opening: {
        speakerId: "p.hada_pike",
        text: "Earl is dead and the blind is not. Ivo Perch's iron still puts that lumber on the refuge side of Dead Creek. Correct it and Middlebury will call you a meddler, and people may stop believing the flood book. Leave it and you knew, Ada Smollet. I don't have his boot to make the pointing look casual. I have the fact.",
      },
      branches: [
        {
          id: "corrected_hada",
          choiceId: "stake_correct_hada",
          choice: "Pull the wrong stake and reset the line while Hada watches.",
          endSpeakerId: "p.hada_pike",
          end: "I'll move the blind. Earl would have complained and done it. I'll do it and I won't tell it as weather. The flood book can survive a true line or it can't. You were a meddler today, Ada Smollet, in the useful sense. I am decent about it. I am not cheerful. Dead Creek doesn't require cheer.",
          flags: { "flags.stake.corrected": true },
          summary:
            "With Earl Pike dead, Hada Pike watches Ada Smollet reset the stake and agrees to move the blind without calling the correction weather.",
        },
        {
          id: "left_hada",
          choiceId: "stake_leave_hada",
          choice: "Leave the stake wrong and say plainly that Ada knew.",
          endSpeakerId: "p.hada_pike",
          end: "Then the knowing is the record. I won't dress it up for a kitchen. When people praise the flood book, I will remember that Ada Smollet saw this stake at Dead Creek and left it. Earl isn't here to call that neighborly. I won't call it neighborly either. I'll call it a choice.",
          flags: { "flags.stake.left_wrong": true },
          summary:
            "Hada Pike lets the wrong stake stand after Earl Pike's death, and Ada Smollet's knowing is left on the record without a weather story.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.hada_pike",
        surrogateId: "p.earl_pike",
        resolution:
          "If Hada Pike is already dead, Earl Pike has no one to refuse him a gentle version. He still wants the stake decided before someone else calls the blind legal by habit.",
        opening: {
          speakerId: "p.earl_pike",
          text: "Hada Pike's gone. I'm not. This stake is still wrong, and the blind is still on the refuge side of Dead Creek. Pull it if you can stand being called a meddler, Ada Smollet. Leave it if you can stand having known. I don't have her to make either choice gentle, and I don't want the flood book used as a blanket.",
        },
        branches: [
          {
            id: "corrected_earl",
            choiceId: "stake_correct_earl",
            choice: "Reset the stake with only Earl Pike as witness.",
            endSpeakerId: "p.earl_pike",
            end: "Witnessed. I'll say you meddled, if they ask, and I'll say the blind moved off the refuge. I won't say the creek did it and I won't say Hada approved from a grave. The iron is where the line actually is. Ada Smollet, that's the whole improvement. Don't add a moral the mud didn't ask for.",
            flags: { "flags.stake.corrected": true },
            summary:
              "Earl Pike witnesses the stake reset alone, moves the blind, and will not blame the creek or Hada Pike for Ada Smollet's correction.",
          },
          {
            id: "left_earl",
            choiceId: "stake_leave_earl",
            choice: "Leave the wrong stake and let Earl keep the blind.",
            endSpeakerId: "p.earl_pike",
            end: "All right. I keep the blind and you keep the knowing. If the flood book stays believed, it stays believed because Ada Smollet did not touch this iron. I'll remember which of us benefited. Hada isn't here to be disappointed in a more educated way. I can be disappointed in the plain way.",
            flags: { "flags.stake.left_wrong": true },
            summary:
              "The wrong stake stays, Earl Pike keeps the blind on the refuge side, and Ada Smollet's knowledge of the line is the unpaid part.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.stake.line",
        "The Dead Creek boundary stake is either corrected in the mud or left wrong, and the blind's side of the refuge is no longer an accident.",
      ),
      reward(
        "knowledge",
        "reward.stake.book",
        "Ada Smollet knows the flood book's easy certainty stood on Ivo Perch's bad iron, and knows whether she spent that certainty.",
      ),
    ],
    death: death({
      mid: "Ada Smollet dies before the stake is touched. The iron stays wrong. Earl Pike tells it later as weather, not as a choice Ellis failed to finish in the mud at Dead Creek.",
      unresolved:
        "No one pulls the stake. The hunting blind remains on the refuge side, and when the season turns Earl Pike tells the line as weather.",
      resolved:
        "The stake's correction or its deliberate wrongness remains after the season. Earl Pike does not get to rename the choice as weather. Believers in the flood book can take the cost or keep the comfort.",
    }),
  }),

  standalone({
    id: "q.heronry",
    title: "The Heronry",
    eras: ["E4"],
    locationId: "loc.panton.dead_creek",
    characters: ["p.lula_pike"],
    summary:
      "In 2008 Lula Pike knows a heronry in the cottonwoods a planned pullout at Dead Creek would take. Chris Dobbs can reveal it and end the secret, conceal it and lose the trees, or spend the truth that the 1929 bridge will not carry the traffic the pullout assumes.",
    discovery:
      "Lula Pike walks Chris Dobbs off the log road into cottonwoods at Dead Creek and shows the nests without letting the road crew see her do it. She asks for a third way, or for someone to stand still while she hates both silences.",
    implications:
      "Revealing the heronry saves the cottonwoods and ends them as a secret. Concealing them lets the pullout take the trees. Giving the bridge-traffic truth instead spends the unsafe 1929 span to stop the pullout without naming the birds.",
    steps: [
      "Walk with Lula Pike into the cottonwoods at Dead Creek and see the heronry the pullout would take.",
      "Choose whether Chris Dobbs reveals the nests, conceals them, or tells the road men the bridge will fail the traffic.",
      "Leave Lula Pike with one silence broken and the other named, not with a promise to come back later.",
    ],
    opening: {
      speakerId: "p.lula_pike",
      text: "If I show them the heronry, I save the nests and end them as a secret. If I don't, the pullout takes these cottonwoods. The road men are at the gravel with a drawing that assumes bridge traffic forever. Bring me a third way, Chris Dobbs, or stand still while I hate both. I will not enjoy either silence. I asked you because I am tired of being the only one who knows.",
      variant: {
        when: { ideal: "the_living_first" },
        text: "I can see you counting the birds ahead of the secret, Chris Dobbs. Living first is not the same as telling everybody with a gravel truck. The herons are alive. The quiet is also how they stay that way. Don't you rush me because a living nest feels simpler than a secret. Dead Creek has already had helpful men.",
      },
    },
    branches: [
      {
        id: "revealed",
        choiceId: "heron_reveal",
        choice: "Tell the road men about the heronry and save the cottonwoods.",
        middleSpeakerId: "p.lula_pike",
        middle:
          "Then the secret is over. I would rather the cottonwoods stood. I will hate the end of the quiet while I am glad the nests remain. Stay beside me, Chris, so I don't make the heronry sound like a permit application. Say 'nests' if I start saying 'resource.' I have heard myself do that. I don't want it at Dead Creek today.",
        endSpeakerId: "speaker.narration",
        end: "The road men hear Lula Pike name the heronry. The pullout drawing loses the cottonwoods at Dead Creek. What was a private stand of nests becomes a fact with listeners. Chris Dobbs does not add a speech. The trees remain, and they are no longer only Lula's to keep.",
        flags: { "flags.heron.revealed": true },
        summary:
          "Lula Pike reveals the heronry to the road men, the pullout loses the cottonwoods, and the nests are saved at the cost of the secret.",
      },
      {
        id: "concealed",
        choiceId: "heron_conceal",
        choice: "Say nothing about the nests and let the pullout proceed.",
        middleSpeakerId: "p.lula_pike",
        middle:
          "Then I concealed it. Write that on me if you keep a book, Chris Dobbs. The cottonwoods will come down for a pullout, and I will have kept a secret that cannot live without the trees. I don't want comfort. I wanted a witness to the losing, so I don't get to tell myself later that nobody stood here and agreed.",
        endSpeakerId: "speaker.narration",
        end: "Chris Dobbs walks back toward the gravel with Lula Pike, and neither of them names the heronry. The pullout keeps its drawing. The cottonwoods at Dead Creek are priced as shade and shoulder, not as nests. The secret holds for as long as the trees do, which is not long.",
        flags: { "flags.heron.concealed": true },
        summary:
          "The heronry stays concealed, Lula Pike keeps the secret, and the planned pullout is left to take the cottonwoods at Dead Creek.",
      },
      {
        id: "traffic",
        choiceId: "heron_traffic",
        choice: "Tell the road men the 1929 bridge will not carry that traffic.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "The 1929 bridge at Addison is about to be found unsafe. It will not feed this pullout the traffic the drawing assumes. That is the true sentence. I am not here to name nests, and I am not here to name Lula Pike. If the gravel count depends on a span that will not carry the cars, the count is already wrong. Write that down or don't. The birds are not in this sentence.",
        endSpeakerId: "p.lula_pike",
        end: "You spent the bridge to save a secret. The pullout dies of a true thing, and the heronry stays mine a while longer. I won't thank you as if you invented a kindness, Chris Dobbs. I will remember which truth you used. The 1929 span was going to fail whether or not I had nests. You chose to spend it here.",
        flags: { "flags.heron.traffic_truth": true },
        summary:
          "Chris Dobbs tells the road men the 1929 bridge will not carry the traffic, so the pullout fails without the heronry being revealed.",
      },
    ],
    alt: {
      npcId: "p.lula_pike",
      surrogateId: "p.nina_abbott",
      resolution:
        "If Lula Pike is already dead, Nina Abbott is the one who was told once about the cottonwoods and told not to be heroic. She will reveal the heronry or stand by while Chris Dobbs spends the bridge truth. She will not offer concealment as a third kindness.",
      opening: {
        speakerId: "p.nina_abbott",
        text: "Lula told me about the heronry and told me not to make it a story at the grave. She's dead. The pullout isn't. I can show the nests, Chris Dobbs, or I can stand here while you tell them the 1929 bridge will not carry the traffic. I won't do the quiet option. Quiet is how the cottonwoods lose. I mow in Whiting. I can also do this once at Dead Creek.",
      },
      branches: [
        {
          id: "revealed_nina",
          choiceId: "heron_reveal_nina",
          choice: "Show the road men the heronry with Nina Abbott beside you.",
          endSpeakerId: "p.nina_abbott",
          end: "There. The secret is over and the trees have a chance. If Lula Pike wanted a better heir she should have stayed alive to be one. I can mow a family plot in Whiting. I can also walk a crew to a nest once. Don't you ask me to feel clean, Chris. Clean is not what I came here for.",
          flags: { "flags.heron.revealed": true },
          summary:
            "Nina Abbott reveals the heronry Lula Pike can no longer protect, and the cottonwoods get a chance at the cost of the secret.",
        },
        {
          id: "traffic_nina",
          choiceId: "heron_traffic_nina",
          choice: "Spend the 1929 bridge truth and leave the nests unnamed.",
          endSpeakerId: "p.nina_abbott",
          end: "All right. I didn't reveal her birds. I also didn't bury them under a pullout. You told the road men the bridge won't carry the cars, Chris Dobbs, and that was true before we walked in here. Don't ask me to feel clean. Whiting is enough cleanliness for one family. The heronry stays unsaid.",
          flags: { "flags.heron.traffic_truth": true },
          summary:
            "Nina Abbott lets Chris Dobbs spend the unsafe 1929 bridge instead of naming the heronry, and the nests stay a secret.",
        },
      ],
    },
    rewards: [
      reward(
        "knowledge",
        "reward.heron.nests",
        "Chris Dobbs knows where the heronry is, and knows whether that knowledge stayed secret, became a report, or was spared by the bridge.",
      ),
      reward(
        "stance",
        "reward.heron.third",
        "Lula Pike's two hated silences were answered by a revelation, a concealment, or by spending the unsafe 1929 bridge instead of the birds.",
      ),
    ],
    death: death({
      mid: "Chris Dobbs dies before any of the three sentences is spoken. Lula Pike says nothing to the road men and hates both silences, the one that saves nothing and the one that would have ended the secret.",
      unresolved:
        "The pullout's drawing advances with no choice made. Lula Pike says nothing about the heronry and nothing about the 1929 bridge, and she hates both silences into the next season.",
      resolved:
        "Revelation, concealment, or the bridge-traffic truth remains the witnessed fact. Lula Pike is not left hating two unused silences. The cottonwoods' fate matches what Chris Dobbs actually said at Dead Creek.",
    }),
  }),

  standalone({
    id: "q.cow_at_the_gate",
    title: "The Cow at the Old Gate",
    eras: ["E0"],
    locationId: "loc.waltham.river_meadow",
    characters: ["p.henry_march", "p.dolores_march"],
    creatures: ["c.march_cow"],
    summary:
      "In 1952 the March cow walks to the old grease-salt in the Waltham meadow where a gate used to be. Henry March wants her butchered before she teaches the others. Dolores March says the cow is readable, not holy. Rennet Moss must say which, in the meadow.",
    discovery:
      "The March cow is at the grease-dark patch by the river meadow, nosing salt a gate left in the ground. Henry March is already talking about the knife. Dolores March is talking about reading an animal without a poem and without holiness.",
    implications:
      "Keeping the March cow lets a readable animal teach the others where the old gate was. Butchering her is spoken in the meadow, not handed off, and ends that lesson because Henry March asked for an ending. Neither choice makes her holy.",
    steps: [
      "Walk out to the grease-salt in the Waltham meadow and see the March cow standing where the gate was.",
      "Hear Henry March ask for the butcher and Dolores March refuse both holiness and a poem.",
      "Say, in the meadow, whether the cow is kept or butchered, and do not leave the sentence for a later hour.",
    ],
    opening: {
      speakerId: "p.henry_march",
      text: "The March cow walks here because a gate used to be here, in the Waltham meadow. Grease and salt. She'll teach the others, and then I have a herd that remembers a hole in the ground. I want her butchered before that lesson sticks. Say it out here, Rennet Moss, where we can see her. I won't have it decided in Dolores March's kitchen and called the same thing.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text: "You're staring at the place the latch was, Rennet Moss, like you mean to finish a gate that isn't here. Finish your looking before you finish the cow. Dolores says she's readable, not holy, and I say she's instructive in a way I don't want. The old gate is not coming back because you stand on the grease. Speak anyway.",
      },
    },
    branches: [
      {
        id: "kept",
        choiceId: "cow_keep",
        choice: "Keep the March cow and say so in the meadow.",
        middleSpeakerId: "p.dolores_march",
        middle:
          "Readable is not holy. I wouldn't kill the March cow for walking to salt, and I wouldn't write a poem about her either. If she teaches the others, they learn where grease was in Henry March's meadow. That is a small lesson, Rennet Moss. Let it be small. Henry asked for a knife because lessons annoy him. Annoyance is not a reason I will dress up.",
        endSpeakerId: "p.henry_march",
        end: "Then she stays, and if the herd learns the spot I will blame you in a practical way, not a haunted one. You said it in the meadow, Rennet Moss. I heard you. Dolores heard you. I won't pretend tomorrow that I didn't ask for the butcher and get a no. The cow is not a sign. She's a cow that found salt.",
        flags: { "flags.cow.kept": true },
        summary:
          "Rennet Moss says in the Waltham meadow that the March cow is kept, and Henry March accepts a lesson he wanted ended with a knife.",
      },
      {
        id: "butchered",
        choiceId: "cow_butcher",
        choice: "Say in the meadow that Henry should butcher the cow.",
        middleSpeakerId: "p.henry_march",
        middle:
          "All right. I'll do it. Not as a rite and not as a job I can postpone until someone else is holding the rope. As a dairyman who doesn't want the herd learning a ghost gate. You said butcher in the meadow, Rennet Moss, with the March cow in front of us. Stay until I'm sure you said it. Dolores March can hate the sentence. She already told me she would.",
        endSpeakerId: "p.dolores_march",
        end: "You didn't make her holy by killing her, and you didn't make her a poem by sparing the poem. Henry March will butcher the March cow because you said so here, in Waltham, not in a note. I wouldn't have. I am not going to decorate your reasons, Rennet Moss. Salt was the whole mystery. You spent the animal on it.",
        flags: { "flags.cow.butchered": true },
        summary:
          "The butcher is spoken in the meadow, beside the March cow, and Henry March will kill her before she teaches the herd the grease-salt.",
      },
    ],
    alt: {
      npcId: "p.henry_march",
      surrogateId: "p.dolores_march",
      resolution:
        "If Henry March is already dead, Dolores March will not butcher the cow to honor a request she disagreed with unless Rennet Moss says the sentence in the meadow. She still refuses holiness and a poem.",
      opening: {
        speakerId: "p.dolores_march",
        text: "Henry wanted the March cow butchered before she taught the others where the grease-salt is. He's dead, so his want is a sentence I can repeat and still refuse. She is readable. She is not holy. I will not write a poem to get out of the choice. Tell me here, Rennet Moss, in the meadow, not in a note I can lose.",
      },
      branches: [
        {
          id: "kept_dolores",
          choiceId: "cow_keep_dolores",
          choice: "Tell Dolores to keep the cow despite Henry's want.",
          endSpeakerId: "p.dolores_march",
          end: "Kept. I won't write it up. If the others learn the salt, they learn salt. Henry March can be wrong and dead at the same time. Those are allowed together in Waltham. The cow is not a relic of him. She's an animal with a nose. Rennet, you said keep. I was already willing. Now it's said.",
          flags: { "flags.cow.kept": true },
          summary:
            "Dolores March keeps the March cow after Henry March's death, and Rennet Moss says the keeping in the meadow rather than letting a dead wish decide.",
        },
        {
          id: "butchered_dolores",
          choiceId: "cow_butcher_dolores",
          choice: "Tell Dolores the cow should be butchered, spoken here.",
          endSpeakerId: "p.dolores_march",
          end: "Then I'll have it done, because you said it in the meadow and not as a chore you handed to a man down the road. I won't pretend I agree with Henry's reason. I also won't pretend you whispered, Rennet Moss. The March cow is not a hymn. She'll be meat because a sentence was finished here.",
          flags: { "flags.cow.butchered": true },
          summary:
            "Dolores March accepts a butcher she does not like because Rennet Moss speaks it beside the March cow, not as a task sent away.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.dolores_march",
        surrogateId: "p.henry_march",
        resolution:
          "If Dolores March is already dead, Henry March has no one to call the cow readable instead of holy. He still wants the decision spoken in the meadow before he butchers her on his own clock.",
        opening: {
          speakerId: "p.henry_march",
          text: "Dolores would have said the March cow is readable and not a poem. She isn't here to say it. I still want this animal butchered before she teaches the others the grease-salt where the gate was. Say keep or say butcher, Rennet Moss, while we can both see her. I won't wait for a kinder witness. I had one.",
        },
        branches: [
          {
            id: "kept_henry",
            choiceId: "cow_keep_henry",
            choice: "Keep the cow even though Dolores is not here to argue it.",
            endSpeakerId: "p.henry_march",
            end: "Kept, then. I'll hate the lesson she teaches and I won't call it fate. Dolores March would have liked the outcome and disliked my reasons. That's as close as I get in this meadow. Rennet, you said it where the cow is. Don't you come back tomorrow and soften it into her idea.",
            flags: { "flags.cow.kept": true },
            summary:
              "Henry March keeps the March cow without Dolores March to argue for keeping her, and the decision is still spoken in the meadow.",
          },
          {
            id: "butchered_henry",
            choiceId: "cow_butcher_henry",
            choice: "Agree to the butcher, spoken beside the cow.",
            endSpeakerId: "p.henry_march",
            end: "Said in the meadow. I'll butcher her before the others learn the spot. I won't wait for a better witness. Dolores is the witness I wanted, and she's already gone. You don't get to call this a ceremony, Rennet Moss. It's a knife and a reason. The reason is teaching. I don't want the class.",
            flags: { "flags.cow.butchered": true },
            summary:
              "Henry March will butcher the March cow because the decision was spoken beside her, and he will not wait for Dolores March or a later body.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "stance",
        "reward.cow.side",
        "Rennet Moss took a side in the meadow between Henry March's knife and Dolores March's refusal to make the cow holy.",
      ),
      reward(
        "knowledge",
        "reward.cow.salt",
        "The March cow walks to old grease-salt because a gate used to be there, and Rennet knows whether that lesson continues.",
      ),
    ],
    death: death({
      mid: "Rennet Moss dies in the meadow before the sentence is finished. Henry March butchers the March cow and does not wait for a second opinion or for another body to come argue.",
      unresolved:
        "No one says the keeping. Henry March butchers the cow on his own schedule and does not wait for Rennet Moss to return to the grease-salt in Waltham.",
      resolved:
        "The meadow already heard keep or butcher. Henry March does not get to redo the sentence as if it were unspoken. The cow's lesson either continues on purpose or it was ended on purpose.",
    }),
  }),

  standalone({
    id: "q.landing_dog",
    title: "Bramble in the Log",
    eras: ["E3"],
    locationId: "loc.addison.chimney_point",
    characters: ["p.cal_voss", "p.lena_voss"],
    creatures: ["c.bramble"],
    summary:
      "In 1994 at Chimney Point, Bramble is eleven and recognizes Hannah Greer's stance at the rail the way Peter Voss used to stand. The recognition is unwanted. Cal Voss can rage, laugh, or write the dog into the landing log. The dog dies this year no matter what.",
    discovery:
      "Bramble meets Hannah Greer at the Vermont rail and goes still in a way Cal Voss has only known from stories of his father, Peter Voss. Lena Voss has the landing log open. Nobody asked the dog to remember a posture, and nobody offers a welcome.",
    implications:
      "Rage keeps the log about crossings and spends Cal Voss's anger. Laughter refuses the omen without pretending the stance was nothing. Writing Bramble in as a witness means Cal has become the book. The dog still dies in 1994.",
    steps: [
      "Stand at the Chimney Point rail until Bramble has made his unwanted recognition of Hannah Greer's stance.",
      "Hear Cal Voss name Peter Voss without greeting Hannah Greer as a returned friend.",
      "Choose rage, laughter, or a log line that records the dog, and stay for the absurdity of the one you pick.",
    ],
    opening: {
      speakerId: "p.cal_voss",
      text: "Don't say hello like you know us. Bramble is eleven. He just planted himself because you are standing the way Peter Voss stood, and I did not ask him to. The dog is wrong, or the dog is rude, or I am about to become a fool. Lena has the landing log. I don't want a reunion at Chimney Point. I want a decision I can live with after he's dead, which is this year, whatever we write.",
      variant: {
        when: { flaw: "keeps_a_second_copy" },
        text: "Don't you look at the log like one record of a crossing isn't enough and a dog could be the second. I see your eyes, Hannah Greer. Bramble is a dog. Peter Voss is dead. You are a problem with a familiar stance, not a cousin and not a punch line I agreed to. Lena, if she reaches for a second page, shut the book.",
      },
    },
    branches: [
      {
        id: "raged",
        choiceId: "dog_rage",
        choice: "Let Cal Voss rage, and keep the landing log ordinary.",
        middleSpeakerId: "p.cal_voss",
        middle:
          "Get off that stance. I don't care if you meant it. My father went through the ice in a thaw he called safe, and I will not have Bramble audition you for Peter Voss. The dog dies when he dies. He does not get to hire a ghost at Chimney Point. Hannah Greer, we are not acquainted. Lena, the log stays crossings. Loads, hours, people who paid.",
        endSpeakerId: "p.lena_voss",
        end: "He raged. I heard it. I am not writing Bramble in to soften Cal Voss. If you stand like Peter Voss again, Hannah, do it where the dog isn't working. The landing log stays a book of crossings. The recognition happened and we refused to promote it. That is the whole entry: none.",
        flags: { "flags.dog.raged": true },
        summary:
          "Cal Voss rages at Bramble's recognition of Peter Voss's stance, and Lena Voss keeps the Chimney Point log to crossings only.",
      },
      {
        id: "laughed",
        choiceId: "dog_laugh",
        choice: "Laugh at the dog's recognition and let Cal laugh too.",
        middleSpeakerId: "p.lena_voss",
        middle:
          "He's eleven. He recognizes a lean. Father will call it nothing if I laugh first, and he will be half right. Bramble is not a bell, Hannah Greer. Peter Voss does not get a second dock out of a dog's eyes. I'm laughing because the alternative is a scene I won't host at Chimney Point. Don't you join it like we're friends. Join it like the posture was ridiculous.",
        endSpeakerId: "p.cal_voss",
        end: "All right. It's funny. It's also the last funny thing I'll say about it. The log stays crossings. The dog can be wrong in public. Hannah, we are not acquainted just because Bramble is an old fool with a good eye. Lena laughed first. I laughed second. Neither laugh is a welcome.",
        flags: { "flags.dog.laughed": true },
        summary:
          "Cal Voss laughs at the unwanted recognition, Lena Voss laughs first, and Bramble is not entered in the landing log as a witness.",
      },
      {
        id: "logged",
        choiceId: "dog_log",
        choice: "Write Bramble into the landing log as a witness.",
        middleSpeakerId: "p.cal_voss",
        middle:
          "A witness. A dog. I know what I sound like, and I am writing it anyway: Bramble recognized a stance at this rail, Hannah Greer was the stance, Peter Voss was the memory, and I am the fool who thought the landing log could hold that. If I do this I have become the book. Say so, or take Lena's pen back before I finish the line.",
        endSpeakerId: "p.lena_voss",
        end: "I'll read it so it can't hide. Bramble, witness, stance, Hannah Greer, the rail at Chimney Point. It's absurd and it's in ink. Father knows it. The dog will die this year anyway. The log is no longer only crossings. That was the cost of telling a true foolish thing in the wrong column. I won't erase it to restore his dignity.",
        flags: { "flags.dog.logged": true },
        summary:
          "Cal Voss writes Bramble into the landing log as a witness to the stance, knowing he has become the book, and Lena Voss reads the line aloud.",
      },
    ],
    alt: {
      npcId: "p.cal_voss",
      surrogateId: "p.lena_voss",
      resolution:
        "If Cal Voss is already dead, Lena Voss keeps the log and will not let Bramble's recognition become a reunion with Peter Voss. She can laugh it off or write the dog in. She will not perform her father's rage for him.",
      opening: {
        speakerId: "p.lena_voss",
        text: "My father is dead. The dog is not, yet. Bramble just did the thing with your stance, the Peter Voss thing, and I hated it, Hannah Greer. I can laugh, or I can become the book and write him in. I won't rage on Cal's behalf. That was his mouth, and Chimney Point doesn't get it from me as an impression. The dog dies this year either way.",
      },
      branches: [
        {
          id: "laughed_lena",
          choiceId: "dog_laugh_lena",
          choice: "Laugh with Lena and leave Bramble out of the log.",
          endSpeakerId: "p.lena_voss",
          end: "Funny, then. Not holy. Bramble recognized a posture and we did not promote him. When he dies this year the landing log will not pretend he was a witness. Chimney Point stays a landing. Hannah Greer, you don't get a family greeting out of a dog's good eye. Cal Voss would have raged. I laughed. That's the difference a death makes.",
          flags: { "flags.dog.laughed": true },
          summary:
            "Lena Voss laughs off Bramble's recognition after Cal Voss's death and leaves the landing log as a record of crossings only.",
        },
        {
          id: "logged_lena",
          choiceId: "dog_log_lena",
          choice: "Let Lena write the dog into the log as a witness.",
          endSpeakerId: "p.lena_voss",
          end: "There. Bramble, witness. I have become the book my father was afraid of becoming, and I did it in a smaller hand than Cal Voss would have used. Hannah Greer, don't thank me. The dog still dies this year. The column is the only change at Chimney Point. Peter Voss stays dead. The stance stays unwanted.",
          flags: { "flags.dog.logged": true },
          summary:
            "Lena Voss enters Bramble as a witness in the landing log, knowing the entry is absurd, because Cal Voss is not alive to refuse the book.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.lena_voss",
        surrogateId: "p.pat_yorston",
        resolution:
          "If Lena Voss is already dead, Pat Yorston has come to the Vermont landing because the log cannot be left to a joke. Pat will not greet Hannah as kin. The choices are to rage at the recognition or to enter the dog.",
        opening: {
          speakerId: "p.pat_yorston",
          text: "Lena is dead, so somebody from the other shore had to stand at Chimney Point without turning it into a visit. Bramble looked at Hannah Greer and went still, the way people say Peter Voss stood. I can be angry in the log's defense, or I can write the dog down and admit the book has room for a foolish true thing. I didn't come to shake hands.",
        },
        branches: [
          {
            id: "raged_pat",
            choiceId: "dog_rage_pat",
            choice: "Tell Pat to refuse the dog a line and keep the anger.",
            endSpeakerId: "p.pat_yorston",
            end: "No. Bramble doesn't get a line. Hannah Greer doesn't get a welcome. I am angry that a dog can do this to a rail, and I will spend the anger here so it doesn't become folklore on the ferry. Crossings only. Cal Voss can call that his kind of ruling if he hears it later. I don't need the credit. I need the book plain.",
            flags: { "flags.dog.raged": true },
            summary:
              "Pat Yorston rages at the recognition in Lena Voss's absence and keeps the Chimney Point log to crossings, with no welcome for Hannah Greer.",
          },
          {
            id: "logged_pat",
            choiceId: "dog_log_pat",
            choice: "Have Pat enter Bramble in the log as a witness.",
            endSpeakerId: "p.pat_yorston",
            end: "I'll write it and I'll hate the poetry of it while I write. Bramble, witness, stance, this rail. Lena isn't here to protect the columns, and I won't pretend a landing log is only holy when it's dull. Hannah Greer, the recognition was unwanted. The line says so. The dog still dies this year. That part is not a metaphor.",
            flags: { "flags.dog.logged": true },
            summary:
              "Pat Yorston writes Bramble into the landing log as an unwanted witness after Lena Voss's death, and does not turn the line into a greeting.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.dog.log",
        "The Chimney Point landing log either stayed a book of crossings or gained a line naming Bramble as a witness to a stance.",
      ),
      reward(
        "stance",
        "reward.dog.unwanted",
        "The recognition was met with rage, laughter, or a foolish true entry, and Hannah Greer was not greeted as a friend returned.",
      ),
    ],
    death: death({
      mid: "Hannah Greer dies at the rail before Cal Voss chooses. Bramble dies this year anyway, and the landing log stays about crossings only, with no witness line and no reunion.",
      unresolved:
        "No one rages, laughs, or writes the dog in. Bramble dies, and the log stays about crossings only, with Peter Voss's stance unrecorded at Chimney Point.",
      resolved:
        "The rage, the laugh, or the logged witness remains after the season. Bramble's death in 1994 is not changed by it. The landing log is whatever was actually done with the recognition.",
    }),
  }),

  standalone({
    id: "q.deputy_kindness",
    title: "Ten Feet of Kindness",
    eras: ["E2"],
    locationId: "loc.leicester.burnham_garden",
    characters: ["p.norma_seaver", "p.sadie_burnham"],
    summary:
      "In 1980 Norma Seaver gave Sadie Burnham ten feet of garden after a funeral because the neighbor is a bully. The ten feet are the neighbor's. Sadie is grateful and uneasy. Louis Pell can correct the survey before she plants, and must stay to say it was not her greed, or leave the kind wrong line.",
    discovery:
      "Norma Seaver walks Louis Pell along the Leicester garden and shows the extra ten feet without a performance. Sadie Burnham has string ready and has not planted. The neighbor's silence is already the loudest fact on the line.",
    implications:
      "Correcting the ten feet returns them to the neighbor and costs Sadie Burnham a kindness she was ready to plant, but only if Louis Pell stays to say it was not her greed. Leaving them keeps Norma's mercy and the neighbor's silence.",
    steps: [
      "Walk the ten feet with Norma Seaver and Sadie Burnham before any seed goes into the gifted ground.",
      "Choose whether Louis Pell corrects the line or leaves the kind wrong survey standing in the garden.",
      "If you correct it, stay and say it was not Sadie Burnham's greed. If you leave it, stay to hear the silence.",
    ],
    opening: {
      speakerId: "p.norma_seaver",
      text: "I gave Sadie ten feet after the funeral because the neighbor is a bully and I was tired of bullies winning on paper in Leicester. The ten feet are his. She is grateful and she is uneasy, which means she is paying attention. Correct me if you have the spine, Louis. Do it before she plants. Bring a straight sentence. I already spent the kindness.",
      variant: {
        when: { flaw: "spares_a_kind_lie" },
        text: "That face is how kind wrong surveys survive. You don't want to correct a mercy, Louis Pell, even when the mercy is inaccurate. Sadie Burnham looks almost hopeful, and I don't blame her. The neighbor is still a bully. The feet are still his. Leicester has had enough of my soft lines. Say so or don't, but don't call the stopping principle.",
      },
    },
    branches: [
      {
        id: "corrected",
        choiceId: "garden_correct",
        choice: "Correct the ten feet before Sadie plants, and stay.",
        middleSpeakerId: "p.sadie_burnham",
        middle:
          "Do it before I plant, then. And stay, Louis. If you leave in the same hour I will look like I grabbed and got caught. Say it was a correction. Say it was not my greed. I have to church with that man. Norma Seaver was kind on a bad week. I can survive the kindness being wrong. I can't survive being the thief in the story.",
        endSpeakerId: "p.norma_seaver",
        end: "You said it in the garden, not from the road: the ten feet were a correction, not Sadie Burnham's greed. Good. I was kind and I was wrong. The neighbor can have his silence back or not. The line in Leicester is true now. I won't ask you to comfort me, Louis Pell. Comfort is how I made the error.",
        flags: { "flags.garden.corrected": true },
        summary:
          "Louis Pell corrects the ten feet before Sadie Burnham plants and stays to say the change was a survey correction, not her greed.",
      },
      {
        id: "kind",
        choiceId: "garden_kind",
        choice: "Leave the kind wrong survey and the ten feet with Sadie.",
        middleSpeakerId: "p.norma_seaver",
        middle:
          "Then the bully loses ten feet and the widow plants them. I know whose land it is in Leicester. I am choosing the living woman over the clean line, and I am using your silence to do it, Louis Pell. Sadie Burnham, plant if you can stand the quiet from next door. I will not come back and remeasure unless someone makes me. Kind and wrong can be the record.",
        endSpeakerId: "p.sadie_burnham",
        end: "I'll plant tomorrow. Tonight I have to live with the neighbor not speaking. You left it kind, Louis Pell. I am grateful. I am still uneasy. Don't come back in a month and call this my idea. Norma Seaver measured a gift. You let the gift stay. The ten feet are still his, and now they are also mine, and I know both.",
        flags: { "flags.garden.kind": true },
        summary:
          "The kind wrong survey stays, Sadie Burnham keeps the ten feet, and the neighbor's silence remains the price of Norma Seaver's mercy.",
      },
    ],
    alt: {
      npcId: "p.norma_seaver",
      surrogateId: "p.sadie_burnham",
      resolution:
        "If Norma Seaver is already dead, Sadie Burnham still has the ten feet and the unease. She asks Louis Pell to correct them before she plants, or to leave them and share the neighbor's silence. No deputy is left to be magnificent.",
      opening: {
        speakerId: "p.sadie_burnham",
        text: "Norma Seaver gave me this strip after the funeral and then she died, which is a hard way to make a gift permanent. The neighbor hasn't spoken. The feet are his, Louis Pell, not mine. Correct it before I plant, and stay to say it isn't my greed. Or leave it and be kind the way she was. I can bear either. I can't bear a rumor in Leicester.",
      },
      branches: [
        {
          id: "corrected_sadie",
          choiceId: "garden_correct_sadie",
          choice: "Correct the ten feet and stay to clear Sadie's name.",
          endSpeakerId: "p.sadie_burnham",
          end: "All right. I don't get the feet. I also don't get called a thief at church. Norma Seaver can have been kind. The ground in Leicester can be true after her. You stayed, Louis Pell, and you said correction. That was the part I needed. The neighbor can speak or keep not speaking. I can plant the rightful row.",
          flags: { "flags.garden.corrected": true },
          summary:
            "Sadie Burnham gives the ten feet back after Norma Seaver's death, and Louis Pell stays long enough to name it a correction rather than greed.",
        },
        {
          id: "kind_sadie",
          choiceId: "garden_kind_sadie",
          choice: "Leave the kind wrong survey in Sadie's garden.",
          endSpeakerId: "p.sadie_burnham",
          end: "Then I plant, and the silence stays his and mine. I won't blame Norma out loud. She was good to me on a bad week. You let the goodness stay wrong, Louis Pell. I noticed. Leicester will have a garden ten feet too kind, and I will weed it knowing whose dirt it was. Don't you tidy me into innocence later.",
          flags: { "flags.garden.kind": true },
          summary:
            "The ten feet stay Sadie Burnham's by a dead deputy's kindness, and Louis Pell leaves the wrong survey in place with the neighbor still silent.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.sadie_burnham",
        surrogateId: "p.clark_seaver",
        resolution:
          "If Sadie Burnham is already dead, Clark Seaver has his mother's survey and no patience for a kindness that will not insure. He will correct the ten feet or keep them as a labeled error, in the garden, not in a letter.",
        opening: {
          speakerId: "p.clark_seaver",
          text: "Sadie's dead. The ten feet my mother gave her are still in the ground in Leicester, and the neighbor is still not speaking. I can put the line back and call it a correction, or I can leave a kind error that some later policy will trip on. Pick, Louis. I don't do handkerchiefs. I do records that don't ambush a cellar.",
        },
        branches: [
          {
            id: "corrected_clark",
            choiceId: "garden_correct_clark",
            choice: "Put the ten feet back and call it a correction, not greed.",
            endSpeakerId: "p.clark_seaver",
            end: "Done. Sadie Burnham isn't here to be accused. The neighbor can speak or not. I won't build a culvert story out of my mother's mercy, and I won't leave a wrong ten feet for the next clerk to call kindness. Louis Pell, you said correction. I wrote correction. Norma Seaver can be loved and wrong.",
            flags: { "flags.garden.corrected": true },
            summary:
              "Clark Seaver corrects Norma Seaver's ten feet after Sadie Burnham's death and records it as a correction, not as a widow's grab.",
          },
          {
            id: "kind_clark",
            choiceId: "garden_kind_clark",
            choice: "Leave Norma's kind survey in place after Sadie's death.",
            endSpeakerId: "p.clark_seaver",
            end: "Then the error stays, and I'll label it as my mother's, not as Sadie Burnham's grab. If the neighbor stays silent, that is not a legal description. It is a mood. Moods don't move lines. This one did, Louis, and you let it. I hate a file that tells the truth about a kindness. I'll keep it anyway.",
            flags: { "flags.garden.kind": true },
            summary:
              "Clark Seaver leaves the kind wrong survey on the books after Sadie's death, labeled as Norma Seaver's mercy rather than a theft.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.garden.feet",
        "The Leicester garden line is either corrected back to the neighbor's ten feet or left as Norma Seaver's kind wrong survey.",
      ),
      reward(
        "stance",
        "reward.garden.stay",
        "Louis Pell either stayed to say the correction was not Sadie Burnham's greed, or stood beside a mercy he knew was inaccurate.",
      ),
    ],
    death: death({
      mid: "Louis Pell dies before the garden is corrected. The ten feet stay where Norma Seaver put them, and the neighbor's silence stays with them. The kindness is never renamed as a correction.",
      unresolved:
        "No one takes the ten feet back. The garden keeps them through the next season, and the neighbor's silence continues as if it were a boundary in Leicester.",
      resolved:
        "The correction or the kept kindness remains the garden's true story. Norma Seaver's mercy is not reclassified by time into accuracy. Sadie Burnham's unease, if she lived with it, stays part of the line.",
    }),
  }),

  standalone({
    id: "q.whiting_grave",
    title: "The Line and the Grave",
    eras: ["E2"],
    locationId: "loc.whiting.abbott_grave",
    characters: ["p.bea_abbott", "p.carl_abbott"],
    summary:
      "In 1980 a fair line between Whiting and Orwell would move Frank Abbott's grave into a clerk's mouth as an Orwell man. Frank never sat in Orwell's town meeting. Bea Abbott will not accept a correction that improves a map and insults a body. Carl Abbott will dig before hay.",
    discovery:
      "Bea Abbott meets Louis Pell at the family plot with the proposed line in a roll she will not spread on the grave. Carl Abbott has a shovel he has not used. Frank Abbott is dead and is not a voice in the yard, only the body the paper would redraw.",
    implications:
      "If the line moves on paper, Frank Abbott becomes an Orwell man without having attended that town's meeting. If the line stays, the map remains the worse drawing and the grave remains in Whiting. Carl digs the new mark only if the paper moves, and only before hay.",
    steps: [
      "Stand at the Abbott plot in Whiting and hear what the moved line would call Frank Abbott in a clerk's mouth.",
      "Choose whether the town line moves on paper or stays so the grave remains in Whiting.",
      "Let Bea Abbott and Carl Abbott answer before anyone digs, and do not leave the answer for after hay.",
    ],
    opening: {
      speakerId: "p.bea_abbott",
      text: "Move the line and my husband becomes an Orwell man in a clerk's mouth. Frank never set foot in their town meeting. He farmed Whiting and he is buried in Whiting. I will not accept a correction that improves a map and insults a body. Carl will dig if you make him, before hay, and he will resent you after. I won't help him dig. Louis, keep that roll off the grave.",
      variant: {
        when: { ideal: "the_living_first" },
        text: "If the living come first, I am the living one on this path, Louis Pell. Frank Abbott is the body. Orwell can keep its improved line in a drawer in Middlebury. Don't you look at Carl's shovel as if hay were a moral. He will dig where we say before the weather turns the ground. I am telling you the paper is the insult, not the clover.",
      },
    },
    branches: [
      {
        id: "moves",
        choiceId: "grave_move",
        choice: "Allow the line to move on paper, and say so before hay.",
        middleSpeakerId: "p.carl_abbott",
        middle:
          "Before hay, you said it, so I'll dig the new line where the paper will put it. After hay I would have resented you longer than a map lasts. I still will, some. Frank stays in the ground he has. The clerk can have the word Orwell. I hate that part, Louis. Mother will not forgive it, and she is right to withhold that. I'll dig anyway.",
        endSpeakerId: "p.bea_abbott",
        end: "You improved a map and insulted a body. I heard you choose it. I will not help Carl dig, and I will not tell Frank Abbott's name in Orwell's meeting because a line moved. He never sat there. Louis Pell, take your roll off my path. Whiting kept him while he farmed. Your clerk can have the lie of a better drawing.",
        flags: { "flags.grave.line_moves": true },
        summary:
          "The town line moves on paper, Frank Abbott becomes an Orwell man in the clerk's mouth, and Carl Abbott will dig the new mark before hay.",
      },
      {
        id: "stays",
        choiceId: "grave_stay",
        choice: "Leave the line so Frank Abbott's grave stays in Whiting.",
        middleSpeakerId: "p.bea_abbott",
        middle:
          "Then he remains a Whiting man, which is what he was when he was alive and particular about meetings. The map stays wrong in whatever way your office fears. I have lived with wrong maps. I will not live with a corrected mouth. Carl, put the shovel down. Louis Pell, you may be disliked in Middlebury for this. I can bear your being disliked.",
        endSpeakerId: "p.carl_abbott",
        end: "No dig before hay. I'll resent the wasted afternoon less than I'd have resented a new line through my father's name. The grave stays in Whiting. If the county asks, Louis, you can tell them I was willing and Bea Abbott was right. Frank never sat Orwell's town meeting. I won't dig a sentence he didn't live.",
        flags: { "flags.grave.line_stays": true },
        summary:
          "The line stays, Frank Abbott's grave remains in Whiting on the page and in the ground, and Carl Abbott puts the shovel down before hay.",
      },
    ],
    alt: {
      npcId: "p.bea_abbott",
      surrogateId: "p.carl_abbott",
      resolution:
        "If Bea Abbott is already dead, Carl Abbott still has the shovel and the hay deadline. He will not insult his father's body to neaten a clerk's sentence unless Louis Pell says the line moves. He resents both the asking and the clock.",
      opening: {
        speakerId: "p.carl_abbott",
        text: "Bea's dead. Frank's still in Whiting ground. Your paper would make him an Orwell man, and he never sat their meeting. I'll dig before hay if you say the line moves, Louis, and I'll resent it after. Or leave it, and I'll resent the trip and not the grave. I don't have her politeness. I have the same no, if you want it.",
      },
      branches: [
        {
          id: "moves_carl",
          choiceId: "grave_move_carl",
          choice: "Move the line on paper and let Carl dig the mark before hay.",
          endSpeakerId: "p.carl_abbott",
          end: "Moved, on paper. I'll dig before hay. Frank Abbott becomes an Orwell word in a clerk's mouth. Mother would have barred you from the path. She's not here. I am, Louis Pell, and I will resent this after the hay is in. The body doesn't move. The word does. I know which one you bought.",
          flags: { "flags.grave.line_moves": true },
          summary:
            "Carl Abbott lets the line move on paper after Bea Abbott's death and digs the new mark before hay, resenting the clerk's word Orwell.",
        },
        {
          id: "stays_carl",
          choiceId: "grave_stay_carl",
          choice: "Leave the line and keep the grave in Whiting.",
          endSpeakerId: "p.carl_abbott",
          end: "Stays. He farmed here and he can stay here on the page too. I won't dig a correction through a dead man's town. Tell Middlebury the map lost, Louis. I have hay, and I had a mother who already said this better than I can. Frank Abbott never sat Orwell's meeting. That fact doesn't need a shovel.",
          flags: { "flags.grave.line_stays": true },
          summary:
            "Carl Abbott leaves the line alone so Frank Abbott's grave stays in Whiting, and he does not dig a correction his mother would have refused.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.carl_abbott",
        surrogateId: "p.bea_abbott",
        resolution:
          "If Carl Abbott is already dead, Bea Abbott has no son to dig before hay. She will still refuse a paper correction that turns Frank Abbott into an Orwell man, or she will hear Louis insist and let the paper move without her hands.",
        opening: {
          speakerId: "p.bea_abbott",
          text: "Carl is dead, and I will not hire a stranger to dig his father's town out from under him. The line you brought would make Frank an Orwell man. He never sat their meeting. Carl would have dug and hated you. I will not dig. I will hear you, Louis Pell. Then the paper moves without me, or it doesn't. Those are the only courtesies left.",
        },
        branches: [
          {
            id: "moves_bea",
            choiceId: "grave_move_bea",
            choice: "Let the line move on paper even though Bea will not dig.",
            endSpeakerId: "p.bea_abbott",
            end: "Then the paper moves without my hands. Frank Abbott becomes an Orwell man in a mouth he never voted in. Carl is not here to resent you on a schedule, so I will resent you without a season, Louis Pell. Get off the plot. The ground does not move. Your clerk will pretend it did. I will not help the pretense.",
            flags: { "flags.grave.line_moves": true },
            summary:
              "Bea Abbott will not dig, but the line still moves on paper, and Frank Abbott is renamed an Orwell man without his son's shovel or his consent.",
          },
          {
            id: "stays_bea",
            choiceId: "grave_stay_bea",
            choice: "Leave the line so the grave stays in Whiting on the page.",
            endSpeakerId: "p.bea_abbott",
            end: "Then we are done. Whiting keeps him. I will not thank you for declining to insult a body. Thanks would make it sound like a favor, Louis Pell, and it was a minimum. Carl isn't here to put a shovel down. I put the idea down. Frank Abbott stays what he was. Take the roll back to Middlebury.",
            flags: { "flags.grave.line_stays": true },
            summary:
              "With Carl Abbott dead, Bea Abbott still keeps the line from moving, and Frank Abbott's grave stays in Whiting without a performance of thanks.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.grave.line",
        "The town line either moves Frank Abbott's grave on paper into Orwell or stays, leaving the grave in Whiting.",
      ),
      reward(
        "stance",
        "reward.grave.body",
        "Louis Pell chose between a cleaner map and Bea Abbott's refusal to let a clerk redraw a man who never sat Orwell's town meeting.",
      ),
    ],
    death: death({
      mid: "Louis Pell dies on the path to the plot. Bea Abbott refuses the surveyor entry after that, and the line stays by default, with Frank Abbott still a Whiting man in every mouth that knew him.",
      unresolved:
        "No choice is recorded. Bea Abbott refuses the surveyor entry when the season turns, and the line stays by default rather than by a spoken mercy.",
      resolved:
        "The paper line has either moved or stayed, and that choice is not reopened as a default. Frank Abbott's town is the one the living actually accepted, not the one a later clerk prefers.",
    }),
  }),

  standalone({
    id: "q.pencil_oath",
    title: "Two Oaths",
    eras: ["E3"],
    locationId: "loc.middlebury.survey_office",
    characters: ["p.norma_seaver", "p.willa_seaver"],
    summary:
      "In 1994, in the rented survey room in Middlebury, Hannah Greer is asked to swear the surveyor's oath. Norma Seaver offers the clean oath and a private chest. Willa Seaver offers both sentences. Refusing the office is the third way, and it is not an acceptance.",
    discovery:
      "Two cards sit on the table off Court Street. Norma Seaver's card is one clean sentence. Willa Seaver's card holds the certification and the late opening together. Hannah Greer is expected to swear before anyone calls the office hers.",
    implications:
      "The clean oath accepts the office and leaves the contradiction private. The oath with both sentences accepts the office and makes the contradiction public. Refusal leaves the office unaccepted and unsworn. Hannah Greer is never both sworn and refused.",
    steps: [
      "Read both oath cards in the Middlebury survey room before agreeing to either sentence.",
      "Choose the clean oath, the oath that includes the contradiction, or a refusal of the office.",
      "Let Norma Seaver or Willa Seaver hear the choice so a chest is not confused with a public page.",
    ],
    opening: {
      speakerId: "p.norma_seaver",
      text: "Swear the clean card, Hannah Greer. The gate remained shut. The works were preserved. The surveyor attests. The contradiction can live in your chest. Chests are not public documents. Willa Seaver wants both sentences in the mouth, the shut gate and the late opening. I want this county to stop cutting itself on one page in Middlebury. The office is the oath, not the desk we rent.",
      variant: {
        when: { ideal: "the_record_holds" },
        text: "If the record holds, Hannah Greer, let it hold a sentence strangers can use without a ghost story in a rented room. I can see you refusing the clean card because it omits the pencil. A private truth is not a record. It is a stomach. Willa Seaver will offer you the stain in public. I am offering you a county that can fund a culvert. Choose like an adult.",
      },
    },
    branches: [
      {
        id: "clean",
        choiceId: "oath_clean",
        choice: "Swear Norma's clean oath and accept the office.",
        middleSpeakerId: "p.willa_seaver",
        middle:
          "You accepted the office. You left the opened gate in your chest. I hope the chest is more honest than this room has been, Hannah Greer. I don't believe it is. Norma does. You are sworn, and you are incomplete. A clean oath is how this office stays inherited. I said the other card was here. You looked at it and picked the neat one.",
        endSpeakerId: "p.norma_seaver",
        end: "The office is accepted. I won't apologize for a mercy that lets Middlebury function. If you bleed the other sentence later, do it where it cannot unfund a culvert. You swore the clean oath, Hannah. Stand by the page strangers will actually see. Willa can keep her disappointment. It is well made and it is not the record.",
        flags: { "flags.oath.clean": true, "flags.office.accepted": true },
        summary:
          "Hannah Greer swears Norma Seaver's clean oath, accepts the surveyor's office, and leaves the contradiction in the chest rather than on the page.",
      },
      {
        id: "contradiction",
        choiceId: "oath_both",
        choice: "Swear both sentences and accept the office anyway.",
        middleSpeakerId: "p.willa_seaver",
        middle:
          "Say the shut gate and say the late opening. They are letting you, because I am in the room and I brought a second mouth. Accept the office with the stain showing, Hannah Greer. A clean oath is how this desk stays inherited and unaccountable. Norma will survive the insult. The meadow will survive the truth better than it survives another neat man.",
        endSpeakerId: "p.norma_seaver",
        end: "Then you are sworn, and you have made my mercy look like a cover. The office is accepted. I will not tear Willa's card up. I will have to live next to it in this rented room. Hannah Greer, don't expect me to call this bravery. I call it a public wound. Middlebury will bleed on it and call the bleeding honesty. I have seen that play.",
        flags: { "flags.oath.contradiction": true, "flags.office.accepted": true },
        summary:
          "Hannah Greer swears the oath that includes both sentences, accepts the office, and makes the contradiction a public record instead of a private chest.",
      },
      {
        id: "refuse",
        choiceId: "oath_refuse",
        choice: "Refuse the surveyor's office and swear neither oath.",
        middleSpeakerId: "p.norma_seaver",
        middle:
          "Then the office stays unsworn. I offered you a way to carry the contradiction without a performance. You chose neither sentence, Hannah. Willa will call that integrity. I call it leaving the culverts to people who will swear anything. Don't dress the refusal as a cleaner oath. It is a refusal. The chair in Middlebury remains empty of you.",
        endSpeakerId: "p.willa_seaver",
        end: "Unsworn, then. Not accepted. I would rather an empty chair than a clean inheritance. If they ask who refused, say Hannah Greer, not Willa Seaver. I offered the contradiction. You declined the office. Those are different courages, and only one of them happened. I will not file you as sworn because I liked your no.",
        flags: { "flags.oath.refused": true, "flags.office.refused": true },
        summary:
          "Hannah Greer refuses both oaths and does not accept the surveyor's office, so the chair stays unsworn rather than neatly inherited.",
      },
    ],
    alt: {
      npcId: "p.norma_seaver",
      surrogateId: "p.willa_seaver",
      resolution:
        "If Norma Seaver is already dead, the clean oath has no advocate in the room. Willa Seaver will let Hannah Greer swear both sentences and accept the office, or refuse and leave it unsworn. She will not invent a neat chest.",
      opening: {
        speakerId: "p.willa_seaver",
        text: "Norma is dead. I will not swear her clean sentence for her, and I will not offer it to you as kindness, Hannah Greer. You can swear both lines, the shut gate and the late opening, and accept this office. Or you can refuse it. A chest is not a public document. Neither is a grave in place of a deputy. The rented room still wants a mouth.",
      },
      branches: [
        {
          id: "contradiction_willa",
          choiceId: "oath_both_willa",
          choice: "Swear both sentences and accept the office without Norma.",
          endSpeakerId: "p.willa_seaver",
          end: "Accepted, with the contradiction in the oath and not in a dead woman's advice. The office is yours, Hannah Greer. I won't neaten it next year into Norma's card. If you get tired, resign in ink. Don't fair-copy yourself backward and call it rest. Middlebury heard both sentences. That was the point of staying in the room.",
          flags: { "flags.oath.contradiction": true, "flags.office.accepted": true },
          summary:
            "With Norma Seaver dead, Hannah Greer still swears both sentences and accepts the office, and Willa Seaver will not neaten the oath later.",
        },
        {
          id: "refuse_willa",
          choiceId: "oath_refuse_willa",
          choice: "Refuse the office and leave both cards with Willa.",
          endSpeakerId: "p.willa_seaver",
          end: "Refused. Unsworn. I will tell anyone who asks that the office remained empty because Hannah Greer would not inherit it clean or dirty. That is a complete record. Go be a person outside this room. I will not promote your refusal into a secret swearing. Norma is dead and the clean card stays facedown.",
          flags: { "flags.oath.refused": true, "flags.office.refused": true },
          summary:
            "Hannah Greer refuses the office after Norma Seaver's death, and Willa Seaver records the chair as unsworn rather than quietly accepted.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.willa_seaver",
        surrogateId: "p.owen_perch",
        resolution:
          "If Willa Seaver is already dead, Owen Perch will not be talked into the chair. He puts the contradiction on the table as a thing he refuses for himself, and he tells Hannah Greer to swear both lines or to refuse the office. He will not praise a clean chest.",
        opening: {
          speakerId: "p.owen_perch",
          text: "Willa kept the second sentence and now she's dead, and I am not your deputy, Hannah Greer. Norma would offer you a clean chest. I won't. Swear both lines and take the office, or refuse it. I work a life that does not need this key. You don't get to hand the key to me on your way out of Middlebury. Say the choice so I can leave the rented room.",
        },
        branches: [
          {
            id: "contradiction_owen",
            choiceId: "oath_both_owen",
            choice: "Swear both sentences and accept the office in front of Owen.",
            endSpeakerId: "p.owen_perch",
            end: "Then it's accepted, and it's not mine. Both sentences are in the room, the shut gate and the opening that came late. I won't congratulate you, Hannah Greer. I also won't pretend the clean oath is still on offer just because it would be easier to live beside. Willa isn't here to smile. I don't smile for desks.",
            flags: { "flags.oath.contradiction": true, "flags.office.accepted": true },
            summary:
              "Owen Perch hears Hannah Greer swear both sentences and accept the office, and he refuses both the congratulations and the job.",
          },
          {
            id: "refuse_owen",
            choiceId: "oath_refuse_owen",
            choice: "Refuse the office and leave Owen out of the inheritance.",
            endSpeakerId: "p.owen_perch",
            end: "Refused. Good. The office stayed unsworn. Don't come by later and ask me to be proud of you, Hannah Greer. I am relieved. Those are different, and relief doesn't make me your witness for a promotion. Willa Seaver offered a harder oath. You offered nothing to the chair. I can live with nothing. I prefer it.",
            flags: { "flags.oath.refused": true, "flags.office.refused": true },
            summary:
              "Hannah Greer refuses the office in front of Owen Perch, the chair stays unsworn, and Owen does not inherit the key by her refusal.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.oath.card",
        "The surveyor's oath is either the clean sentence, both sentences, or no sentence, and the office's acceptance matches that page.",
      ),
      reward(
        "stance",
        "reward.oath.chest",
        "Hannah Greer either kept the contradiction in a chest, spoke it in the oath, or refused the office rather than inherit it clean.",
      ),
    ],
    death: death({
      mid: "Hannah Greer dies in the survey room before any oath is finished. The office remained unsworn. Nobody records an acceptance. Both cards stay on the table in Middlebury, unused.",
      unresolved:
        "The season ends without a swearing. The office remained unsworn, and neither Norma Seaver's clean sentence nor Willa Seaver's two sentences became Hannah Greer's oath.",
      resolved:
        "If she refused, the office remained unsworn and stays that way. If she accepted, the acceptance is not undone by the next season, and the card she swore is the one the room keeps.",
      sets: { "flags.oath.refused": true, "flags.office.refused": true },
    }),
  }),

  standalone({
    id: "q.marginalia_living",
    title: "The Margin Names Helen",
    eras: ["E0"],
    locationId: "loc.middlebury.survey_office",
    characters: ["p.helen_perch", "p.gordon_perch"],
    summary:
      "In 1952 a pencil margin in the flood book names Helen Perch as the person who told Ivo to keep the gate shut. She is alive, in the rented survey room, not in her parlor. Gordon Perch thinks a second face knowing the note is a con, not a soul. Rennet Moss can confront her, spare her, or ask Gordon.",
    discovery:
      "The flood book is open on the Court Street table. Helen Perch has come to the office. The pencil names her. Gordon Perch stands between Rennet Moss and the sentence as if the sentence were a trick with a procedure.",
    implications:
      "Confronting Helen Perch makes the margin a spoken fact she can answer. Sparing her leaves the note unread to the person it names. Asking Gordon Perch instead lets a son decide whether his mother's sentence is a con. The book's pencil does not move.",
    steps: [
      "See the pencil margin name Helen Perch while she is in the survey room and still able to be told.",
      "Choose to confront Helen, to leave the margin unread to her, or to ask Gordon Perch instead.",
      "Finish the choice in the office where the book is, and do not move the talk to Helen Perch's parlor.",
    ],
    opening: {
      speakerId: "p.helen_perch",
      text: "If you brought me to this rented room to inherit Ivo's tools, they were sold. If you brought me to look at his book, Gordon can look. I don't like pencil. Pencil is how people avoid ink and still feel brave. I have not read your page, Rennet Moss. I came because you asked, not because I owe the office a scene. Say what the book is for, or we are done.",
      variant: {
        when: { flaw: "signs_unread" },
        text: "Your hand is already moving, Rennet. Gordon sees it and so do I. That reach is the con he warned me about, a new face treating Ivo Perch's pencil like a cue. If you mean to use my name, Helen Perch, use it in a sentence. Don't hover over the margin in a rented room and call the hovering manners. I am not a parlor trick.",
      },
    },
    branches: [
      {
        id: "confronted",
        choiceId: "helen_confront",
        choice: "Confront Helen Perch with the margin that names her.",
        middleSpeakerId: "p.helen_perch",
        middle:
          "I told Ivo to keep the gate shut. I did not tell him to write me into the margin like a woman who enjoys being evidence. He certified it shut and he opened it late, and both of those were his hands, Rennet Moss. You have the smaller confession. I was afraid. I am still afraid. I am not your key to the flood book, and Gordon does not get to be proud of this.",
        endSpeakerId: "p.gordon_perch",
        end: "A second face knowing the note is still a con until proven otherwise. You proved you can read, Rennet Moss. You also proved you will spend my mother in a rented room off Court Street. Helen Perch, we're going. The book stays. I don't worship it and I don't forgive it. Fear is not a soul. It's a reason she gave Ivo Perch, and I will not dress it up.",
        flags: { "flags.helen.confronted": true },
        summary:
          "Rennet Moss confronts Helen Perch with the margin, she admits she told Ivo to keep the gate shut, and Gordon Perch calls the knowing a spent confidence.",
      },
      {
        id: "spared",
        choiceId: "helen_spare",
        choice: "Spare Helen and leave the margin unread to her.",
        middleSpeakerId: "p.gordon_perch",
        middle:
          "You closed it. Good. If you had a trick, you declined to spring it on her. That doesn't make you my uncle's ghost, Rennet Moss. It makes you a man who can leave a sentence alone. She told Ivo something. You don't get it from me as a prize for behaving. Helen Perch walks home with her gloves. That's the mercy. Don't bill us for it.",
        endSpeakerId: "p.helen_perch",
        end: "Then we are done. Gordon Perch will make a sermon on the walk home. I will not. Rennet Moss, if the pencil says something I would hate, I am choosing not to hear it today in this office. Don't you mail it to the parlor later and call that mercy. A spared sentence that arrives on Tuesday is just a delayed unkindness.",
        flags: { "flags.helen.spared": true },
        summary:
          "The margin naming Helen Perch is left unread to her, Gordon Perch does not treat the spare as proof of a soul, and the book stays shut on that line.",
      },
      {
        id: "asked",
        choiceId: "helen_ask_gordon",
        choice: "Ask Gordon Perch about the margin instead of Helen.",
        middleSpeakerId: "p.gordon_perch",
        middle:
          "Ask me, then. She told Ivo to keep it shut. He wrote it in pencil because ink would have made her a public cause in Middlebury. A second face knowing that is a con, not a soul. If you want the family shame, Rennet Moss, you can have it from the son and leave the sister her gloves. Helen can hear me. That is not the same as you shoving the book at her.",
        endSpeakerId: "speaker.narration",
        end: "Rennet Moss does not make Helen Perch read her own name. Gordon Perch says the sentence in the survey room, ugly and exact, and Helen hears her son say it, which is not the same as being shown the pencil. The margin stays in the flood book. She puts her gloves in her pocket and does not thank anyone for the route the truth took.",
        flags: { "flags.helen.asked_gordon": true },
        summary:
          "Gordon Perch, not the pencil, tells the room that Helen told Ivo to keep the gate shut, and Helen Perch is not made to read her own name.",
      },
    ],
    alt: {
      npcId: "p.helen_perch",
      surrogateId: "p.gordon_perch",
      resolution:
        "If Helen Perch is already dead, the margin still names her and she cannot be confronted. Gordon Perch can be asked, or the note can be left unread even to him. Rennet Moss does not get to perform the accusation at a grave.",
      opening: {
        speakerId: "p.gordon_perch",
        text: "Helen Perch is dead. The margin still says she told Ivo Perch to keep the gate shut. You can ask me, Rennet Moss, and I will call it a con that you know it. Or you can shut the flood book and spare a dead woman a second hearing. Don't ask me to supply her voice. She had one. It stopped. This is a rented room in Middlebury, not a parlor.",
      },
      branches: [
        {
          id: "asked_gordon_dead",
          choiceId: "helen_ask_dead",
          choice: "Ask Gordon what the margin means now that Helen is dead.",
          endSpeakerId: "p.gordon_perch",
          end: "She told him to keep the gate shut. He shut it on the page and opened it late in the dark. Knowing that does not make you family, Rennet Moss. It makes you a man who read a private fear. I have answered. The book stays here. Her name stays pencil. I won't walk you to the parlor to feel the lack of her.",
          flags: { "flags.helen.asked_gordon": true },
          summary:
            "With Helen Perch dead, Gordon Perch answers the margin himself and still calls Rennet Moss's knowledge a con rather than a soul.",
        },
        {
          id: "spared_gordon_dead",
          choiceId: "helen_spare_dead",
          choice: "Spare the margin and do not make Gordon recite it.",
          endSpeakerId: "p.gordon_perch",
          end: "Spared, then. Even me. I won't call that holiness. I'll call it the first time a stranger declined to spend Helen Perch. If you read it anyway when I leave the survey room, Rennet, you are the con I thought you were. The pencil can stay unread. Dead women don't get extra hearings from me.",
          flags: { "flags.helen.spared": true },
          summary:
            "Gordon Perch is not made to recite the margin after Helen's death, and the pencil note stays unread in the flood book.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.gordon_perch",
        surrogateId: "p.helen_perch",
        resolution:
          "If Gordon Perch is already dead, Helen Perch has no son between her and the pencil. Rennet Moss can confront her with the margin or spare her and leave it unread. There is no third person in the office to ask.",
        opening: {
          speakerId: "p.helen_perch",
          text: "My son is dead and you still asked me to come see a book. If this is about Ivo, say it, Rennet Moss. I am tired of parlor manners in a rented office. I told that man things when we were both alive enough to be cowards. Gordon is not here to call you a con. You will have to risk the sentence without his sneer to hide in.",
        },
        branches: [
          {
            id: "confronted_helen_alone",
            choiceId: "helen_confront_alone",
            choice: "Show Helen the margin and confront her with her name.",
            endSpeakerId: "p.helen_perch",
            end: "Yes. I told Ivo to keep the gate shut. He should not have written me down, and he should not have opened it late after promising me the shut version. Gordon is not here to call you a con, Rennet Moss. I am here. I was afraid. That is the whole confession I have. Don't you promote it into a haunting. It was a sister, scared.",
            flags: { "flags.helen.confronted": true },
            summary:
              "Helen Perch, without Gordon, reads the margin and admits she told Ivo to keep the gate shut, and she refuses to call the fear a ghost.",
          },
          {
            id: "spared_helen_alone",
            choiceId: "helen_spare_alone",
            choice: "Spare Helen and close the book without showing her name.",
            endSpeakerId: "p.helen_perch",
            end: "Then I will not know which sentence you spared me. I will suspect it on the walk home from Court Street. That is the cost of your mercy, Rennet Moss. Gordon would have forced it. He is dead, so your sparing gets to stand. I don't thank you. I leave the survey room with my gloves still a kind of armor.",
            flags: { "flags.helen.spared": true },
            summary:
              "Helen Perch is spared the margin after Gordon Perch's death, and she leaves the survey room suspecting the mercy without being shown the pencil.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "knowledge",
        "reward.helen.margin",
        "Rennet Moss knows the margin names Helen Perch as the one who told Ivo to keep the gate shut, and knows whether she was told.",
      ),
      reward(
        "stance",
        "reward.helen.living",
        "The living sister was confronted, spared, or answered through Gordon Perch, and the choice treated her as a person rather than proof of a soul.",
      ),
    ],
    death: death({
      mid: "Rennet Moss dies in the survey room before Helen Perch is shown the pencil. The margin stays in the flood book, and Helen is not told by Ellis what it says about her and the gate.",
      unresolved:
        "The book is closed with the choice unmade. The margin stays in the flood book, and Helen Perch is not told by Ellis that the pencil names her fear.",
      resolved:
        "Whether Helen Perch was confronted, spared, or answered by Gordon Perch remains what the office remembers. A later season does not pretend Ellis told her if Ellis did not.",
    }),
  }),

  standalone({
    id: "q.wet_wage_book",
    title: "The Wet Wage Book",
    eras: ["E2"],
    locationId: "loc.weybridge.pulp_mill",
    characters: ["p.clarice_demerritt", "p.ruth_demerritt"],
    summary:
      "In 1980 at the Weybridge pulp mill the wage book got wet. It is not the flood book. One side will smear, the night crew or the day crew. Clarice Demerritt says drying the binding is not fairness. Ruth Demerritt will not inherit silence. Louis Pell chooses which ink survives.",
    discovery:
      "Clarice Demerritt has the wet wage book open on the lower-gate table, night on one side and day on the other. Ruth Demerritt is counting boards and will not look away. Louis Pell is asked to put a hand on a page, not to dry the spine and call the loss even.",
    implications:
      "Saving the night numbers smears the day crew's pay into unread ink. Saving the day numbers does the same to the night. Clarice will not call either choice fair. Ruth will say the lost count aloud so the mill does not inherit silence in place of hours.",
    steps: [
      "Look at the wet wage book at the pulp mill and see which pages are the night crew and which are the day.",
      "Choose which side Louis Pell saves, knowing the other side of the wage book will smear.",
      "Hear Ruth Demerritt say the count she will not let become silence after the ink fails.",
    ],
    opening: {
      speakerId: "p.clarice_demerritt",
      text: "This is the wage book, Louis Pell, not the flood book. Don't you mix them because both have been wet in this county. Night crew on the left, day crew on the right. One side will smear. You don't get to dry the binding and call that fairness. Put your hand on a page. Ruth Demerritt counts boards. I count the lie we are about to make legible at Weybridge. Choose.",
      variant: {
        when: { ideal: "water_has_its_level" },
        text: "The water already picked a level in the gutter between night and day. I am not interested in a proverb about creeks, Louis Pell. The creek had its say at the Weybridge race. This is the part where a person picks who gets paid in ink. Ruth Demerritt will not be quiet for you. I won't call the spine a judge. Hands.",
      },
    },
    branches: [
      {
        id: "night",
        choiceId: "wages_night",
        choice: "Save the night crew's numbers and let the day side smear.",
        middleSpeakerId: "p.ruth_demerritt",
        middle:
          "Night, then. The night is the hours this mill pretends are day when it wants to be proud. I won't inherit that silence, Louis. I'll say the day count out loud while it smears, so Clarice Demerritt's book isn't the only memory at the pulp mill. You picked a page. I pick a mouth. Ansel's peace is not a wage. I don't want his peace.",
        endSpeakerId: "p.clarice_demerritt",
        end: "Night survives. Day smears. I will not call it fair and I will not let you call it fate. The binding is dry enough to close. The fairness was never in the binding, Louis Pell. Ruth has the spoken count. I have the ink. Those are the two records. Weybridge can live with two. It cannot live with a pretend evenness.",
        flags: { "flags.wages.night_saved": true },
        summary:
          "Louis Pell saves the night crew's ink in the wet wage book, the day side smears, and Ruth Demerritt speaks the lost count rather than inherit silence.",
      },
      {
        id: "day",
        choiceId: "wages_day",
        choice: "Save the day crew's numbers and let the night side smear.",
        middleSpeakerId: "p.clarice_demerritt",
        middle:
          "Day, then. You are saving the hours the county already believes. The night will smear, and Clarice Demerritt will have to remember without a page. I can do it, Louis Pell. I don't forgive the choice just because I can. Ruth Demerritt will make it worse by being brave out loud. Let her. The wage book is not the flood book, and this smear is not a symbol. It's pay.",
        endSpeakerId: "p.ruth_demerritt",
        end: "Silence is what this mill offers people who want peace. I won't inherit it. The day page is saved. The night is in my mouth now, Louis Pell, name by name, while Clarice watches the ink feather. If you wanted only one record, you don't get your wish. You get two, and one of them is me at the lower gate.",
        flags: { "flags.wages.day_saved": true },
        summary:
          "The day crew's numbers are saved, the night side of the wage book smears, and Ruth Demerritt keeps the night hours in her mouth instead of in ink.",
      },
    ],
    alt: {
      npcId: "p.clarice_demerritt",
      surrogateId: "p.ruth_demerritt",
      resolution:
        "If Clarice Demerritt is already dead, Ruth Demerritt holds the wet wage book and will not dry the binding into a performance of fairness. She still makes Louis Pell choose which crew's ink survives, and she speaks the side that smears.",
      opening: {
        speakerId: "p.ruth_demerritt",
        text: "She's dead and the book is wet anyway. This is wages, Louis, not the flood book, so don't you console me with the wrong volume. Night or day. I count boards. I will not inherit a silence just because Clarice Demerritt is gone. Pick a side. The other side I will say out loud at the Weybridge gate until it embarrasses you.",
      },
      branches: [
        {
          id: "night_ruth",
          choiceId: "wages_night_ruth",
          choice: "Save the night numbers with Ruth watching the book.",
          endSpeakerId: "p.ruth_demerritt",
          end: "Night ink, day mouth. Clarice would have hated the split and understood it. I am not her. I am the millwright now. This is the count, Louis Pell. Don't you call the spine fair on your way off the race. The day crew's smear is my speech. The night crew's numbers get to stay written. That is the whole fairness I can stand.",
          flags: { "flags.wages.night_saved": true },
          summary:
            "Ruth Demerritt saves the night side of the wage book after Clarice's death and speaks the smeared day count so it does not vanish into manners.",
        },
        {
          id: "day_ruth",
          choiceId: "wages_day_ruth",
          choice: "Save the day numbers and make Ruth carry the night aloud.",
          endSpeakerId: "p.ruth_demerritt",
          end: "Day page lives because you said so. Night page is my problem, and I will recite it until the recital is ugly with specifics. Their hours exist without Clarice Demerritt's hand. I will not be quiet about it, Louis. If the wage book looks even, the wage book is lying. I don't lie for a binding at this mill.",
          flags: { "flags.wages.day_saved": true },
          summary:
            "The day numbers survive in Ruth Demerritt's hands, and she refuses to let the smeared night crew become a silence she inherited.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.ruth_demerritt",
        surrogateId: "p.denis_rouleau",
        resolution:
          "If Ruth Demerritt is already dead, Denis Rouleau will not let the wet wage book become a speech about loss. He will make Louis Pell pick night or day, then repeat the smeared count so it is not only Clarice Demerritt's private ink.",
        opening: {
          speakerId: "p.denis_rouleau",
          text: "Ruth Demerritt is dead, so somebody who still eats with the crew had to touch this. Clarice Demerritt says you don't dry the binding and call it fair. She's right, and this is still the wage book, not the flood book. Night or day, Louis Pell. I won't inherit Ruth's silence. She didn't get to have one. Pick a page at the lower gate in Weybridge.",
        },
        branches: [
          {
            id: "night_denis",
            choiceId: "wages_night_denis",
            choice: "Save the night crew's page while Denis holds the book.",
            endSpeakerId: "p.denis_rouleau",
            end: "Saved the hours they hide. Lost the hours they brag about. I'll repeat the smeared day names at the kitchen until they stick, Louis Pell. Clarice Demerritt can hate the method. The crew will know which side you picked. I don't do dignity speeches. I do counts. Weybridge already has enough dignity to drown in.",
            flags: { "flags.wages.night_saved": true },
            summary:
              "Denis Rouleau keeps the night ink after Ruth Demerritt's death and repeats the smeared day count where the crew eats, not as a eulogy.",
          },
          {
            id: "day_denis",
            choiceId: "wages_day_denis",
            choice: "Save the day crew's page and let Denis speak the night.",
            endSpeakerId: "p.denis_rouleau",
            end: "Day page lives. Night page is my problem now. I'll say it at the falls and at the kitchen, and I won't let it become a story about how hard we tried. Louis Pell, you chose the tidy side of the wage book. I chose not to shut up. Ruth would have been louder. I can be plain. Plain is enough to keep a silence from winning.",
            flags: { "flags.wages.day_saved": true },
            summary:
              "Denis Rouleau saves the day numbers and carries the night crew's smeared hours in speech, refusing to turn the loss into a soft story.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.wages.ink",
        "The wage book keeps either the night crew's numbers or the day crew's, and the other side is a smear, not a fair blank.",
      ),
      reward(
        "knowledge",
        "reward.wages.which",
        "Louis Pell knows which crew's hours survived in ink at the Weybridge mill, and that drying the binding was never fairness.",
      ),
    ],
    death: death({
      mid: "Louis Pell dies before a hand chooses a page. Both sides of the wage book smear. Ruth Demerritt keeps a spoken count, because she will not inherit silence from a wet book and a dead visitor.",
      unresolved:
        "The wage book dries without a choice. Both sides smear. Ruth Demerritt keeps a spoken count of the hours and repeats it so the mill does not get peace instead of pay.",
      resolved:
        "The saved side remains ink and the lost side remains what was said aloud. The next season does not dry the story into fairness. Clarice Demerritt's book stays partial on purpose.",
    }),
  }),

  standalone({
    id: "q.fair_copy_for_a_stranger",
    title: "A Copy for a Stranger",
    eras: ["E5"],
    locationId: "loc.middlebury.survey_office",
    characters: ["p.willa_seaver", "p.ned_seaver"],
    summary:
      "In 2022 Willa Seaver has a private copy of the contradictory flood page for a student who wants a clean story. Rowan Keel can give him the contradiction, knowing it may become content, or refuse, and let Norma Seaver's neatness win from the grave. Ned Seaver hates the paperwork.",
    discovery:
      "The private copy sits in the rented survey room, both sentences visible, the shut gate and the late opening. Willa Seaver has not decided whether a student should hold it. Ned Seaver wants the paper out of the talk. The student is not given a name or a chair in the record.",
    implications:
      "Giving the contradictory copy may turn Ivo Perch's two sentences into something a stranger can pass around. Refusing it keeps the clean story in circulation and lets Norma's neatness win from the grave. Willa will not burn the page to escape the choice.",
    steps: [
      "Look at Willa Seaver's private copy of the contradictory flood page in the Middlebury survey room.",
      "Choose whether Rowan Keel gives that copy to the student or refuses to let it leave.",
      "Hear Ned Seaver hate the paperwork out loud so the choice is not only Willa Seaver's private taste.",
    ],
    opening: {
      speakerId: "p.willa_seaver",
      text: "He wants a clean story for a class. I want him to feel the smear on this private copy, the shut gate and the opening that came late. If I give him the contradiction he may turn it into content. If I don't, Norma wins from the grave. Ned would rather we ate the paper. I won't burn it, Rowan Keel. Pick the harm you can stand. The student is not a parishioner. He's a stranger.",
      variant: {
        when: { flaw: "keeps_a_second_copy" },
        text: "No. I see your hands wanting another copy because two records feel like a quarrel and a quarrel feels unfinished. One private copy is already the problem I chose, Rowan. You don't get to solve Willa Seaver's problem by making a third page. Give this one to the student or refuse it. Ned, if you say burn, I will put you in the hall of this rented room.",
      },
    },
    branches: [
      {
        id: "given",
        choiceId: "copy_give",
        choice: "Give the student the contradictory copy, smear and all.",
        middleSpeakerId: "p.ned_seaver",
        middle:
          "Paperwork. A student. A second sentence nobody asked the meadow about. Give it to him, then, and don't ask me to feel historic, Rowan Keel. I'll walk him to the door so Willa doesn't add a speech. If this becomes a poster, that's on the giving, not on the creek. I hate this desk. I will hate it in the stairwell too. That's consistency.",
        endSpeakerId: "p.willa_seaver",
        end: "Given. He may turn it into content. He may also, for one afternoon, feel why a clean story is a weapon. Norma Seaver does not get to win this one from the grave. I can live with the risk better than I can live with her neatness. Rowan, don't you follow him to explain Ivo Perch. The page has to do it or fail.",
        flags: { "flags.copy.given": true },
        summary:
          "Rowan Keel gives the student Willa Seaver's contradictory copy, accepting that the two sentences may become content rather than let Norma win from the grave.",
      },
      {
        id: "refused",
        choiceId: "copy_refuse",
        choice: "Refuse the student the contradictory copy.",
        middleSpeakerId: "p.willa_seaver",
        middle:
          "Then she wins from the grave. The clean story goes to class, and the smear stays in a drawer with me. I will not pretend refusal is purity, Rowan Keel. It is a choice to keep a weapon unloaded. Ned can be relieved. I am not. Norma Seaver's neatness was always going to outlive her if somebody loved a simple page. Today that somebody is us.",
        endSpeakerId: "p.ned_seaver",
        end: "Good. Less paper in a stranger's bag. I hate this desk and I hate the performance of a careful no. You refused, Rowan Keel. Willa Seaver will sulk at Norma Seaver for a month, which is her right. The student gets whatever clean account the town already tells. I can live with that. Ned Seaver lives with worse paperwork by leaving it alone.",
        flags: { "flags.copy.refused": true },
        summary:
          "The contradictory copy stays in the survey room, the student does not get it, and Norma Seaver's clean story keeps its advantage from the grave.",
      },
    ],
    alt: {
      npcId: "p.willa_seaver",
      surrogateId: "p.ned_seaver",
      resolution:
        "If Willa Seaver is already dead, Ned Seaver has the private copy and hates it more, not less. He will not burn it, because she would not, and he asks Rowan Keel to give the contradiction to the student or to refuse. He will not become the explainer.",
      opening: {
        speakerId: "p.ned_seaver",
        text: "Willa's dead and this is still here, both sentences, shut and opened late. A student wants the clean one. I hate paperwork, Rowan Keel. I won't burn her page and I won't lecture him into being a better person. Give it or refuse it. Then I'm done being in this rented room. Norma can win or not. I just won't be the priest of the drawer.",
      },
      branches: [
        {
          id: "given_ned",
          choiceId: "copy_give_ned",
          choice: "Give the student Willa's contradictory copy.",
          endSpeakerId: "p.ned_seaver",
          end: "Given. If he makes it content, I don't want to hear the content. Willa Seaver wanted the smear felt. I wanted the desk clear. You picked her, Rowan. Fine. I'm leaving the building. The flood page is his problem now, and I will not chase it to add a warning label. Warnings are more paperwork.",
          flags: { "flags.copy.given": true },
          summary:
            "Ned Seaver hands over Willa's contradictory copy after her death and leaves before he can be turned into a guide for the student.",
        },
        {
          id: "refused_ned",
          choiceId: "copy_refuse_ned",
          choice: "Refuse, and leave the copy in the survey room.",
          endSpeakerId: "p.ned_seaver",
          end: "Refused. Norma gets the clean story, wherever she is. I won't call that a victory. I'll call it less paper in a backpack. Rowan Keel, don't you ask me to reopen the drawer for a better speech. Willa didn't burn it. I didn't burn it. The student leaves with the easy version. I can stand that better than a performance.",
          flags: { "flags.copy.refused": true },
          summary:
            "Ned Seaver refuses the student the private copy, leaves it in the drawer, and will not burn it or explain it into a cleaner lesson.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.ned_seaver",
        surrogateId: "p.owen_perch",
        resolution:
          "If Ned Seaver is already dead, Owen Perch will not caress the paperwork. Willa Seaver's copy is on the table. He tells Rowan Keel to give the contradiction or refuse it, and he will not stay to watch a student be improved.",
        opening: {
          speakerId: "p.owen_perch",
          text: "Ned's dead, so you don't get his complaining, you get mine. Willa still thinks a stranger should feel the smear. Norma still wins if he doesn't. I refuse this desk as a life, Rowan Keel. I don't refuse your choice. Give the page or don't. Say it so I can go back to work that isn't a private copy of somebody's contradiction.",
        },
        branches: [
          {
            id: "given_owen",
            choiceId: "copy_give_owen",
            choice: "Give the contradictory copy and let Owen leave.",
            endSpeakerId: "p.owen_perch",
            end: "Given. I hope the student is bored by it. Boredom would be safer than content. Willa Seaver gets her risk. I get to leave Middlebury's rented room. Don't you offer me a copy of my own, Rowan. I have practiced refusing keys, chairs, and pages. The flood's two sentences are not my craft. They're yours for the afternoon.",
            flags: { "flags.copy.given": true },
            summary:
              "Owen Perch watches the contradictory copy go to the student and leaves, refusing a personal copy and any role as keeper of the smear.",
          },
          {
            id: "refused_owen",
            choiceId: "copy_refuse_owen",
            choice: "Refuse the copy and send Owen out with an empty hand.",
            endSpeakerId: "p.owen_perch",
            end: "Refused. The clean story keeps its advantage. I won't pretend that's brave. Ned Seaver would have hated the meeting and agreed with the no. That's the only remark I have for him. The page stays in the drawer, Rowan Keel. Norma wins this round from the grave. I am not staying to argue with a dead woman's neatness.",
            flags: { "flags.copy.refused": true },
            summary:
              "Owen Perch leaves with empty hands after Rowan refuses the student, and Willa's copy stays in the drawer where Norma's neatness still wins.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.copy.page",
        "A private copy of the contradictory flood page was either given to a student or kept back in the Middlebury survey room.",
      ),
      reward(
        "knowledge",
        "reward.copy.norma",
        "Rowan Keel knows the clean story is Norma's weapon from the grave, and knows whether the contradiction was risked as something a stranger can repeat.",
      ),
    ],
    death: death({
      mid: "Rowan Keel dies before the copy is given or refused. Willa Seaver burns neither the page nor the decision. She decides alone, later, without a witness from this season in the survey room.",
      unresolved:
        "The student leaves without an answer. Willa Seaver burns neither the contradictory copy nor a clean substitute. She decides alone after the season turns.",
      resolved:
        "The gift or the refusal remains what happened to the private copy. Willa Seaver does not get a later fire to undo it. Norma Seaver's neatness either lost this round or kept it.",
    }),
  }),

  standalone({
    id: "q.school_slate",
    title: "The Slate",
    eras: ["E1"],
    locationId: "loc.orwell.quiet_house",
    characters: ["p.constance_daly", "p.miriam_waite"],
    summary:
      "In 1966 Constance Daly has walked to the Waite house in Orwell for Cress Moss's slate. Joel, fourteen, wrote over the handwriting without knowing. Constance wants a penmanship lesson. Miriam Waite wants the slate back. Ada Smollet sends it to the school or keeps it at the house.",
    discovery:
      "On the Orwell house step, Constance Daly waits with a teacher's certainty and Miriam Waite holds the slate against her skirt. Joel's writing is on top. Under it, where the cloth rubbed, Cress Moss's hand still shows. Ada is not invited in as if the house were glad.",
    implications:
      "If the slate goes to the school, children learn a beautiful hand and the house loses a private ordinary thing. If it stays, Constance Daly returns it and thinks the household is hoarding a lesson. Miriam can live with that opinion. She will not add thanks.",
    steps: [
      "Meet Constance Daly on the step of the Waite house and look at the slate Joel wrote over.",
      "Choose whether the slate goes to the Orwell school or stays at the Quiet Household.",
      "Say the choice so Miriam Waite and Constance Daly both hear it, and do not send the boy to carry it.",
    ],
    opening: {
      speakerId: "p.constance_daly",
      text: "The hand underneath is beautiful. Children can learn from a beautiful hand. Joel wrote over it. He is fourteen and he did not know he was covering Cress Moss's last ordinary lines. If you tell me the slate is private, Ada Smollet, I will return it on this step. I will also think the house is hoarding a lesson. I can live with your opinion. Miriam already thinks I can live with too much.",
      variant: {
        when: { ideal: "names_aloud" },
        text: "Say the name before the slate moves, if you are going to say anything, Ada. An unspoken name is how a lesson steals a person. Miriam Waite will tell you not to make the boy say it. She is right about that. The name is Cress Moss. I am Constance Daly, and I walked here from the school because the hand is worth learning. The house can still refuse me.",
      },
    },
    branches: [
      {
        id: "school",
        choiceId: "slate_school",
        choice: "Let the slate go to the school as a penmanship lesson.",
        middleSpeakerId: "p.miriam_waite",
        middle:
          "Take it, then. Joel does not get a speech and he does not get to undo the writing. Cress had a day that was ordinary. You are about to make it instructive, Constance. Ada Smollet, if you call this a kindness to the dead, I will correct you on this step. It is a loss I am allowing. The Quiet Household does not applaud its losses.",
        endSpeakerId: "p.constance_daly",
        end: "The school will use the hand, and I will say the name Cress Moss once, so it is not only pretty loops. I think the house is poorer for agreeing. I also think the children in Orwell are richer. Those can both be true, Miriam. I won't gloat on your step. Ada, you chose a lesson. I will try not to waste the hand you gave up.",
        flags: { "flags.slate.school": true },
        summary:
          "The slate goes to the Orwell school as a penmanship lesson, Constance Daly will say Cress Moss's name once, and Miriam Waite allows the loss without calling it kindness.",
      },
      {
        id: "house",
        choiceId: "slate_house",
        choice: "Keep the slate at the house and tell Constance it is private.",
        middleSpeakerId: "p.constance_daly",
        middle:
          "Private, then. I return it, as I said I would. I think the Quiet Household is hoarding a lesson, and I think the lines Joel wrote over Cress Moss are not a shrine. They are a boy's work on a used slate. Ada Smollet, you may keep your reasons. I have a class that will use a lesser example and will not be ruined. Miriam, your opinion of me is already priced in.",
        endSpeakerId: "p.miriam_waite",
        end: "It stays. I don't need Constance Daly to approve, and I don't need you to comfort the boy. He wrote over Cress without knowing. The correction is that we stop passing her around Orwell. Ada, that is the whole thanks you are not getting. The slate goes back inside the door. The step is done being a school.",
        flags: { "flags.slate.house": true },
        summary:
          "The slate stays at the Waite house, Constance Daly returns it and thinks the household is hoarding a lesson, and Miriam Waite does not offer thanks.",
      },
    ],
    alt: {
      npcId: "p.constance_daly",
      surrogateId: "p.miriam_waite",
      resolution:
        "If Constance Daly is already dead, Miriam Waite still has to decide whether Cress Moss's slate leaves the house for the school or stays. She will not make Joel the spokesman. Ada Smollet's choice is the outside mouth she will accept.",
      opening: {
        speakerId: "p.miriam_waite",
        text: "Constance is dead. The school will send someone eventually, and they will be less honest than she was. Joel wrote over Cress Moss and he is not coming out to perform regret. Tell me the slate goes to Orwell's school, Ada Smollet, or tell me it stays. Do it on this step. I will not make a fourteen-year-old into the voice of a handwriting.",
      },
      branches: [
        {
          id: "school_miriam",
          choiceId: "slate_school_miriam",
          choice: "Send the slate to the school even without Constance to carry it.",
          endSpeakerId: "p.miriam_waite",
          end: "Then it goes, and I will hate the wrapping. Cress Moss becomes a lesson without the woman who at least would have said her name on the step. Ada Smollet, walk it as far as the road. I won't thank you. Joel stays inside. The Quiet Household keeps the loss and not the slate. That is the arithmetic I agreed to.",
          flags: { "flags.slate.school": true },
          summary:
            "With Constance Daly dead, Miriam Waite still lets the slate go to the school and refuses both thanks and the boy's performance of regret.",
        },
        {
          id: "house_miriam",
          choiceId: "slate_house_miriam",
          choice: "Keep the slate at the house with Constance gone.",
          endSpeakerId: "p.miriam_waite",
          end: "It stays. The school can think we hoard. Constance Daly already would have thought that, and she would have returned it anyway if we called it private. I am returning it to the house. You don't get gratitude for agreeing with me, Ada Smollet. Joel does not come to the door. Cress's hand stays an ordinary thing.",
          flags: { "flags.slate.house": true },
          summary:
            "Miriam Waite keeps Cress Moss's slate at the house after Constance Daly's death, and Ada Smollet is not thanked for agreeing.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.miriam_waite",
        surrogateId: "p.joel_waite",
        resolution:
          "If Miriam Waite is already dead, the slate is still at the Orwell house and Constance Daly is still on the step. Joel is fourteen and is not made to speak for the handwriting he covered. Ada Smollet decides whether the lesson leaves or the house keeps it.",
        opening: {
          speakerId: "p.constance_daly",
          text: "Miriam is dead, and the slate is in the hall where she left it. I still want it for penmanship, Ada Smollet. I will return it if you tell me Cress Moss's hand is private, and I will think the house is hoarding a lesson. The boy is inside. Don't you put Joel in the doorway to settle this. He wrote over her without knowing. That is not a speech.",
        },
        branches: [
          {
            id: "school_constance",
            choiceId: "slate_school_constance",
            choice: "Give Constance the slate for the Orwell school.",
            endSpeakerId: "speaker.narration",
            end: "Ada Smollet puts the slate in Constance Daly's hands on the step of the Waite house. Joel stays unseen and unasked. The overwritten lines and Cress Moss's hand go to the Orwell school together. There is no Miriam Waite in the doorway to withhold thanks, so the thanks simply do not happen. Constance says the name once and leaves.",
            flags: { "flags.slate.school": true },
            summary:
              "The slate goes to the school from the step after Miriam Waite's death, Joel is not brought out to speak, and no one supplies the thanks she would have withheld.",
          },
          {
            id: "house_constance",
            choiceId: "slate_house_constance",
            choice: "Keep the slate in the house and call Cress's hand private.",
            endSpeakerId: "p.constance_daly",
            end: "Private, then, and the keeper who would have agreed with you is dead. I return a thing I was never quite given. I think you are hoarding a lesson, Ada Smollet. Joel did not ask to be a memorial, and I did not ask him to be one. I can live with your opinion. I can walk back to the Orwell school without the slate.",
            flags: { "flags.slate.house": true },
            summary:
              "Constance Daly leaves the slate at the house as a private thing, thinks the household is hoarding a lesson, and does not put Joel in the doorway.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "token",
        "reward.slate.board",
        "Cress Moss's slate, overwritten by a fourteen-year-old's hand, either carried to the Orwell school or kept in the Quiet Household.",
      ),
      reward(
        "stance",
        "reward.slate.private",
        "Ada Smollet chose whether a beautiful hand was a lesson or a private ordinary thing, and did not make Joel speak for the dead lines.",
      ),
    ],
    death: death({
      mid: "Ada Smollet dies on the step before the slate moves. Miriam Waite keeps it in the house and does not thank Ellis, because there is no one left in the doorway worth thanking.",
      unresolved:
        "The slate is never decided. Miriam Waite keeps it at the Quiet Household, and she does not thank Ellis for a choice that was never finished on the step.",
      resolved:
        "The slate is at the Orwell school or at the house, as chosen. Miriam Waite's lack of thanks, if she withheld it, stays withheld. The season does not add a gratitude she refused.",
    }),
  }),

  standalone({
    id: "q.stopped_clock",
    title: "The Stopped Minute",
    eras: ["E2"],
    locationId: "loc.orwell.quiet_house",
    characters: ["p.joel_waite", "p.miriam_waite"],
    summary:
      "In 1980 Joel Waite is old enough to wind the hall clock past the minute Harold stopped, the minute before Ellis woke in Rennet. Winding kills a minute the house worships. Not winding means living in a stopped house. Miriam Waite tells Louis Pell not to help, only to witness.",
    discovery:
      "The hall clock at the Waite house in Orwell stands at the old minute. Joel Waite has the key. Miriam Waite stands where she can see both the clock and Louis Pell's hands, and she has already forbidden help. Harold Waite is dead and is not a voice in the hall.",
    implications:
      "If Joel winds the clock, the house loses the minute it has treated as honest since 1952. If the clock stays stopped, he keeps living inside Harold's refusal. Louis Pell's part is witness, not a hand on the key. Either outcome is a household fact.",
    steps: [
      "Stand in the hall where the stopped minute is visible and Joel Waite can see that your hands are empty.",
      "Hear Miriam Waite forbid help and require Louis Pell to witness whatever her son does with the key.",
      "Witness Joel wind the clock or witness the clock left stopped, without putting a hand on the case.",
    ],
    opening: {
      speakerId: "p.miriam_waite",
      text: "Joel is old enough to wind it. I am old enough to stop pretending my hand is the only honest one. Harold stopped this clock at the minute before you woke in Rennet, and Harold is dead. Don't help, Louis Pell. Witness. If Joel winds it, a worshipped minute dies. If he doesn't, he lives in a stopped house. I will not make the choice for him to keep my own hands clean.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text: "No. I see you lean toward the case, Louis. That want is a latch you do not get to finish. Joel Waite decides. You witness. Harold's minute is not your repair and not your gate. Hands off the glass. The Quiet Household has had enough people who cannot leave a thing half done. Today the half-done thing has a son.",
      },
    },
    branches: [
      {
        id: "wound",
        choiceId: "clock_wind",
        choice: "Witness Joel Waite wind the clock past the stopped minute.",
        middleSpeakerId: "p.joel_waite",
        middle:
          "If I wind it, I am killing a minute you all worship. I know. I have lived next to it since the year I was born. Move your hands where I can see them, Louis Pell. I want the witness and I don't want the help. Mother said her hand is not the only honest one. She can watch me prove it. Harold is dead. The minute doesn't get a vote.",
        endSpeakerId: "p.miriam_waite",
        end: "Wound. The house can tell the time that continued, which it did, for everyone who was not displaced that morning and not Harold. Louis, you witnessed. You didn't help. I won't thank you for obedience. I will remember that Joel Waite's hand was the one on the key. The worshipped minute is over. Orwell can have a ticking hall.",
        flags: { "flags.clock.wound": true },
        summary:
          "Joel Waite winds the hall clock past Harold's stopped minute while Louis Pell only witnesses, and Miriam Waite does not pretend her hand was required.",
      },
      {
        id: "left",
        choiceId: "clock_leave",
        choice: "Witness the choice to leave Harold's clock stopped.",
        middleSpeakerId: "p.miriam_waite",
        middle:
          "Then say it, Joel, so the witness hears a sentence and not a mood. I am not touching the case. That was the promise I made to myself when I said my hand would not be the only honest one. Louis Pell, keep your hands where we can both see them. The minute before Rennet woke is still the minute on the face. It can stay if my son says stay.",
        endSpeakerId: "p.joel_waite",
        end: "It stays stopped. I am choosing the stopped house with my eyes open, not because Mother's hand is the only honest one. Louis, you saw me not wind it. Don't you come back and call that fate. Harold Waite is dead. I am not. The clock is a decision now, which is more than it was when it was only his habit. I can live in the minute. I just did.",
        flags: { "flags.clock.left": true },
        summary:
          "Joel Waite leaves Harold's clock stopped on purpose, Louis Pell witnesses without helping, and the house keeps the minute before Rennet woke.",
      },
    ],
    alt: {
      npcId: "p.joel_waite",
      surrogateId: "p.miriam_waite",
      resolution:
        "If Joel Waite is already dead, Miriam Waite is returned to the only honest hand, the role she refused. She will wind Harold's clock herself or leave it stopped, and Louis Pell still only witnesses. She will not pretend the son is in the hall.",
      opening: {
        speakerId: "p.miriam_waite",
        text: "Joel is dead. I said I would not be the only honest hand. Death doesn't negotiate with a sentence I liked. Harold's minute is still stopped, the minute before Rennet woke. I can wind it, Louis Pell, or I can leave this house stopped. You witness. You do not help. I will not make his absence pretty, and I will not ask the clock to be a memorial with better manners.",
      },
      branches: [
        {
          id: "wound_miriam",
          choiceId: "clock_wind_miriam",
          choice: "Witness Miriam wind the clock because Joel cannot.",
          endSpeakerId: "p.miriam_waite",
          end: "Wound, by the wrong person. The worshipped minute is dead. Louis Pell, you saw that I did it and that I didn't want to. Don't you write that Joel Waite would have agreed. He isn't in this hall to agree. Harold stopped it. I started it. The Quiet Household can tell ordinary time now, and I am angry at the ordinary.",
          flags: { "flags.clock.wound": true },
          summary:
            "Miriam Waite winds the clock herself after Joel's death, hating that she is again the only hand, while Louis Pell only witnesses.",
        },
        {
          id: "left_miriam",
          choiceId: "clock_leave_miriam",
          choice: "Witness Miriam leave the clock stopped.",
          endSpeakerId: "p.miriam_waite",
          end: "Stopped, then. I live in Harold's minute because the son who could have ended it is dead, and I will not spend Joel Waite's death as my courage. You witnessed a refusal, Louis Pell. It is a poorer refusal than the one I wanted, which was his. The case stays untouched. That is the only honesty I have left in this hall.",
          flags: { "flags.clock.left": true },
          summary:
            "Miriam Waite leaves the clock stopped after Joel's death and will not use his absence as the courage to wind Harold's minute.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.miriam_waite",
        surrogateId: "p.joel_waite",
        resolution:
          "If Miriam Waite is already dead, Joel Waite still has the key and no mother to forbid help. He tells Louis Pell to witness anyway, because that was her sentence, and he will wind the clock or leave it without a second hand on the case.",
        opening: {
          speakerId: "p.joel_waite",
          text: "She said don't help, witness. She's dead, so the order has to come from me. I'll wind Harold's minute out of this house, Louis Pell, or I'll leave us stopped. Hands off the case. I want one witness who isn't a parent and isn't a speech. The Quiet Household can tick or not. It cannot have your fingers on the glass and call that my decision.",
        },
        branches: [
          {
            id: "wound_joel",
            choiceId: "clock_wind_joel",
            choice: "Witness Joel wind the clock with no one to stop him.",
            endSpeakerId: "p.joel_waite",
            end: "Done. The house can keep time like other houses in Orwell. I won't call it an insult to Harold Waite. I'll call it a decision I made while you watched and didn't help. That was her term, Louis. I kept the term. Mother isn't here to see the minute die. I saw it. The key worked. The worshipped stop is over.",
            flags: { "flags.clock.wound": true },
            summary:
              "Joel Waite winds the clock after Miriam's death, keeps her rule that Louis Pell only witness, and ends the minute Harold stopped.",
          },
          {
            id: "left_joel",
            choiceId: "clock_leave_joel",
            choice: "Leave the clock stopped and say why, without Miriam there.",
            endSpeakerId: "p.joel_waite",
            end: "Stopped. Not because she was watching. Because I still think a worshipped minute is truer than a tidy hall, and I am willing to live in it. Louis Pell, you witnessed. Don't help it later when I'm out of the room. Harold Waite stopped it for a reason I didn't choose. I am choosing it now. That's different, and it's mine.",
            flags: { "flags.clock.left": true },
            summary:
              "Joel Waite leaves the hall clock stopped of his own accord after Miriam Waite's death, and Louis Pell's hands stay off the case.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "knowledge",
        "reward.clock.minute",
        "Louis Pell knows the hall clock was stopped at the minute before Rennet Moss woke, and knows whether that minute was moved.",
      ),
      reward(
        "stance",
        "reward.clock.witness",
        "Louis Pell witnessed and did not help, which is the only stance Miriam Waite was willing to allow beside Harold's clock.",
      ),
    ],
    death: death({
      mid: "Louis Pell dies in the hall before the key turns or is refused. The clock stays stopped, because nobody would wind it over a body in the hall.",
      unresolved:
        "No one winds the clock. It stays stopped, and the reason people repeat is the hard one: nobody would wind it over a body in the hall, or over a decision that never got said.",
      resolved:
        "The clock is wound or it is not, as the Waite who held the key decided in front of a witness. A later season does not put Harold's minute back as if the hall had been empty of choice.",
    }),
  }),
];






