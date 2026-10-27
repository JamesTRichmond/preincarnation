import { standalone } from "./questkit.mjs";
import { death } from "./death.mjs";
import { reward } from "./death.mjs";

export const quests = [
  standalone({
    id: "q.frost_cistern",
    title: "Frost on the Cistern",
    eras: ["E0"],
    locationId: "loc.new_haven.cistern",
    characters: ["p.lottie_harrow", "p.maeve_harrow"],
    summary:
      "At dawn Lottie Harrow holds a tin cup over the New Haven cistern and will not drink the frost ring she says is 1927 silt. Maeve Harrow wants no poem. Lottie wants a number. Rennet Moss's hands have to seal it, taste it, or spoon it toward the survey record.",
    discovery:
      "The frost on the homestead cistern between the New Haven house and the orchard has drawn a ring that is older than this morning. Lottie has the cup ready and Maeve is already impatient with anything that sounds like weather dressed up as feeling.",
    implications:
      "The cistern is either closed, tasted and named, or carried as a spoon of silt toward the record. Maeve has been met at the stone either way, and the next argument about the south block cannot pretend this ring was only dirt.",
    steps: [
      "Stand at the New Haven cistern at dawn and look at the frost ring with Lottie Harrow.",
      "Hear Lottie name the ring as 1927 silt while Maeve Harrow refuses a poem about the cup.",
      "Choose at the stone to seal the cistern, drink and name the taste, or take a spoon toward the record.",
    ],
    opening: {
      speakerId: "p.lottie_harrow",
      text:
        "The frost on this New Haven cistern drew a ring that is not this year's dirt. I am Lottie Harrow. I have the tin cup and I will not drink. Maeve Harrow can stand there and hate a poem. I want the year. Nineteen twenty-seven. Write it or seal it or taste it, Rennet, but do not leave it pretty.",
      variant: {
        when: { ideal: "the_record_holds" },
        text:
          "You look at the New Haven cistern as if the frost already belongs in a book. Lottie Harrow sees that and keeps the tin cup off her mouth. Maeve Harrow says a record is not a verse. The ring is still 1927 silt, and the page will be wrong if nobody counts it before the sun takes the proof.",
      },
    },
    branches: [
      {
        id: "br.seal",
        choiceId: "ch.seal",
        choice: "Seal the cistern and leave the cup undrunk.",
        middleSpeakerId: "p.maeve_harrow",
        middle:
          "Maeve Harrow puts the cover on the New Haven cistern herself and will not dress it up. The frost ring is 1927 silt. Lottie Harrow still has the tin cup. Maeve says a lid is a fact. A poem would be a way to own the trees without counting them. She does not want the poem.",
        endSpeakerId: "p.lottie_harrow",
        end:
          "Lottie Harrow sets the tin cup on the stone of the New Haven cistern and says the number out loud so it cannot be smiled off. Sealed. Nineteen twenty-seven. Maeve Harrow has heard it and does not add a line. The cup stays empty. The silt stays under the lid, counted.",
        flags: { "flags.cistern.sealed": true, "flags.met.maeve": true },
        summary:
          "The New Haven cistern is sealed with the 1927 silt under the lid. Lottie Harrow has her number. Maeve Harrow has been met and has refused to turn the frost into a poem.",
      },
      {
        id: "br.drink",
        choiceId: "ch.drink",
        choice: "Drink from the cup and name the taste.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "Ellis drinks from Lottie Harrow's tin cup at the New Haven cistern and says the taste before anyone can make it lovely. Cold. Iron. Old flood. Not a story. Maeve Harrow watches the mouth, not the sky. The frost ring breaks where the cup disturbed it. The silt is 1927 and now it has been in a living throat.",
        endSpeakerId: "p.lottie_harrow",
        end:
          "Lottie Harrow takes the cup back at the New Haven cistern and repeats the taste as if it were a figure. Iron, cold, flood year. Maeve Harrow says that is still not a poem, and she will not write one. The drink is done. The number sits beside it. Nineteen twenty-seven has been in Rennet's mouth.",
        flags: { "flags.cistern.drunk": true, "flags.met.maeve": true },
        summary:
          "Ellis drank the cistern at New Haven and named the taste in front of Lottie Harrow and Maeve Harrow. The frost ring is no longer an unnamed mark. Maeve still got no poem.",
      },
      {
        id: "br.spoon",
        choiceId: "ch.spoon",
        choice: "Take a spoon of silt toward the record.",
        middleSpeakerId: "p.lottie_harrow",
        middle:
          "Lottie Harrow scrapes one spoon of the dark ring from the New Haven cistern and holds it level. She does not hand Ellis a journey. She hands the spoon and the year. Maeve Harrow says if this leaves the stone it is a sample, not a verse. The survey record can have the silt. The cup still does not get drunk.",
        endSpeakerId: "p.maeve_harrow",
        end:
          "Maeve Harrow looks at the spoon and not at Rennet's face. The New Haven cistern keeps the rest of its frost. Lottie Harrow has the number she wanted, and the spoon is for the record, not for a story about daughters and floods. Maeve says take it as dirt. She has been here. That is the whole meeting.",
        flags: { "flags.cistern.spooned": true, "flags.met.maeve": true },
        summary:
          "A spoon of 1927 silt leaves the New Haven cistern toward the survey record. Lottie Harrow counted it. Maeve Harrow allowed the sample and refused the poem.",
      },
    ],
    alt: {
      npcId: "p.lottie_harrow",
      surrogateId: "p.maeve_harrow",
      resolution:
        "Lottie Harrow is gone, so the tin cup has no reckoner. Maeve Harrow stands at the New Haven cistern and will close it or taste it without turning 1927 silt into a poem for the orchard.",
      opening: {
        speakerId: "p.maeve_harrow",
        text:
          "Lottie is not here to count. I am Maeve Harrow. The tin cup is on the New Haven cistern stone and the frost ring is still the old silt. I will not make a poem so the county can clap. Seal it or drink it and say the taste in plain words. I do not want a third pretty choice.",
      },
      branches: [
        {
          id: "br.seal.lottie",
          choiceId: "ch.seal.lottie",
          choice: "Seal the cistern with Maeve watching.",
          endSpeakerId: "p.maeve_harrow",
          end:
            "Maeve Harrow sets the lid on the New Haven cistern and leaves Lottie's tin cup empty on the stone. The frost is 1927 silt and it does not need a line of verse. She says the lid is the number. Rennet can remember a cover. Maeve has been met. She will not garnish it.",
          flags: { "flags.cistern.sealed": true, "flags.met.maeve": true },
          summary:
            "With Lottie Harrow dead, Maeve Harrow seals the New Haven cistern herself. The cup stays empty. The silt is covered, not sung, and Maeve has been met at the stone.",
        },
        {
          id: "br.drink.lottie",
          choiceId: "ch.drink.lottie",
          choice: "Drink and name the taste without a poem.",
          endSpeakerId: "p.maeve_harrow",
          end:
            "Maeve Harrow lets the cup reach Rennet's mouth at the New Haven cistern and then takes it back. She repeats only the words that were dirt: cold, iron, flood. She says that is not a poem and she will not add one for Lottie's sake. The taste has been said. The meeting is done.",
          flags: { "flags.cistern.drunk": true, "flags.met.maeve": true },
          summary:
            "Maeve Harrow, standing in for Lottie, lets the New Haven cistern be drunk and named. She keeps the words plain. The frost ring is tasted, not versed.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.maeve_harrow",
        surrogateId: "p.lottie_harrow",
        resolution:
          "Maeve Harrow is not at the stone to forbid a poem. Lottie Harrow still wants a number for the New Haven cistern, so the cup is either sealed as a count or spooned toward the survey record.",
        opening: {
          speakerId: "p.lottie_harrow",
          text:
            "Maeve is not here to scold the language. I am Lottie Harrow, and the New Haven cistern still has her frost ring of 1927 silt. The tin cup is in my hand. I do not need a mood. I need the year put somewhere a smile cannot erase. Seal it as a count, or spoon it for the record.",
        },
        branches: [
          {
            id: "br.seal.maeve",
            choiceId: "ch.seal.maeve",
            choice: "Seal the cistern and say the year.",
            endSpeakerId: "p.lottie_harrow",
            end:
              "Lottie Harrow covers the New Haven cistern and says nineteen twenty-seven once, the way she says a row count. Maeve is not there to call it a poem or to stop her. The tin cup goes on the stone empty. The number is the seal. That is the record Lottie would trust.",
            flags: { "flags.cistern.sealed": true },
            summary:
              "With Maeve Harrow gone, Lottie Harrow seals the New Haven cistern and speaks the year as a count. The cup stays empty. The silt is closed under a number.",
          },
          {
            id: "br.spoon.maeve",
            choiceId: "ch.spoon.maeve",
            choice: "Spoon the silt toward the survey record.",
            endSpeakerId: "p.lottie_harrow",
            end:
              "Lottie Harrow lifts one spoon of silt off the New Haven cistern and does not make Ellis walk it anywhere in this hour. The decision is the spoon. It goes toward the survey record with the year attached. Maeve cannot refuse a poem because Maeve is not here. Lottie refuses the poem herself by counting.",
            flags: { "flags.cistern.spooned": true },
            summary:
              "Lottie Harrow takes a spoon of 1927 silt from the New Haven cistern for the survey record. Maeve is already gone. The sample is a number, not a verse.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.cistern.seal",
        "The New Haven cistern's 1927 silt is entered as a seal, a named taste, or a spoon, and not left as unnamed frost.",
      ),
      reward(
        "knowledge",
        "reward.cistern.silt",
        "Ellis knows the dawn ring on the Harrow cistern is flood silt from 1927, whether the cup was drunk or the lid went on.",
      ),
    ],
    death: death({
      mid:
        "The tin cup stays on the stone of the New Haven cistern. Ellis dies in Rennet Moss's body before Lottie Harrow or Maeve Harrow gets a seal, a taste, or a spoon. The next body is not told which choice was unfinished.",
      unresolved:
        "The following wearing finds no sentence about the Harrow cistern. The cup may still be on the stone and the 1927 ring has gone back to looking like weather. Nobody wrote which act was left half done.",
      resolved:
        "If the cistern was already sealed, drunk, or spooned, that fact holds for the next body. The New Haven stone does not reopen the cup so a later mouth can pick a kinder unfinished version.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.wrong_boots",
    title: "Wrong Boots",
    eras: ["E0"],
    locationId: "loc.new_haven.homestead",
    characters: ["p.samuel_harrow"],
    summary:
      "Ivo Perch's last boots are in the Harrow homestead boot room. Samuel Harrow watched Rennet Moss's hands find the loose peg. The boots can be worn, wrapped for Helen Perch, or burned in the kitchen stove, and the whole decision ends in the house.",
    discovery:
      "The boot room still smells of wet wool and orchard mud. One pair is not Samuel's and not this year's hire. The left peg is loose in a way Rennet's hand knows before the eye does, and Samuel has already seen that.",
    implications:
      "Ivo's boots leave the peg as a wearing, a parcel decided for Helen Perch, or ash in the homestead stove. Samuel has his answer in the boot room. Nothing is carried out as an errand for later credit.",
    steps: [
      "Step into the Harrow homestead boot room and look at Ivo Perch's last boots on the peg.",
      "Let Samuel Harrow watch Rennet Moss's hands find the loose peg without explaining it away.",
      "Wear the boots, have Samuel wrap them for Helen Perch, or burn them in the kitchen stove.",
    ],
    opening: {
      speakerId: "p.samuel_harrow",
      text:
        "Those are Ivo Perch's last boots in my boot room, not yours. I am Samuel Harrow. I watched your hands, Rennet Moss, go to the loose peg before you had a reason you would say. Helen Perch is in Middlebury. You can wear them, I can wrap them for her from here, or the kitchen stove can have them. Decide in this house.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text:
          "Samuel Harrow sees Rennet Moss already halfway to finishing the peg, the way an unlatched thing gets finished. Ivo Perch's boots are in the New Haven homestead boot room. Samuel says do not tidy a dead man's leather out of nerves. Wear them, wrap them for Helen, or burn them. Do not hover.",
      },
    },
    branches: [
      {
        id: "br.wear",
        choiceId: "ch.wear",
        choice: "Wear Ivo Perch's boots in the boot room.",
        middleSpeakerId: "p.samuel_harrow",
        middle:
          "Samuel Harrow watches Rennet Moss pull Ivo Perch's boots on in the homestead boot room and does not bless it. The loose peg swings. The leather is dry at the ankle and dark at the toe. Samuel says the feet are Rennet's today and the habit in the hands is older. He will not call that holy. He calls it wearing.",
        endSpeakerId: "p.samuel_harrow",
        end:
          "The boots are on. Samuel Harrow nods once at the New Haven boot room floor, not at a sermon. Ivo Perch's last pair leaves the peg on a living body and stays in this house for the day's work. Helen Perch is not summoned. The stove is not opened. Samuel has seen the choice and he is finished looking.",
        flags: { "flags.boots.worn": true },
        summary:
          "Rennet Moss wears Ivo Perch's last boots out of the Harrow boot room peg. Samuel Harrow watched the hands and let the wearing stand without sending the boots anywhere else.",
      },
      {
        id: "br.return",
        choiceId: "ch.return",
        choice: "Have Samuel wrap them for Helen Perch.",
        middleSpeakerId: "p.samuel_harrow",
        middle:
          "Samuel Harrow takes Ivo Perch's boots off the loose peg in the New Haven boot room and wraps them in clean feed paper on the bench. He says Helen Perch can have them in Middlebury because that is her dead. He does not hand Rennet a trip. The wrapping is the return. The scene does not grow a road.",
        endSpeakerId: "p.samuel_harrow",
        end:
          "The parcel sits on the boot room bench, tied, with Helen Perch's name said once by Samuel Harrow. Ivo's boots are returned by that decision, here, not by a walk Ellis gets to perform. Rennet's hands stay off the peg. Samuel dusts his palms. The kitchen stove stays shut. The house is done with the leather.",
        flags: { "flags.boots.returned": true },
        summary:
          "Samuel Harrow wraps Ivo Perch's boots in the New Haven boot room and the return to Helen Perch is decided there. No delivery is played. The peg is empty by a sentence, not an errand.",
      },
      {
        id: "br.burn",
        choiceId: "ch.burn",
        choice: "Burn the boots in the kitchen stove.",
        middleSpeakerId: "speaker.narration",
        middle:
          "In the Harrow homestead kitchen the stove takes Ivo Perch's boots in two feeds, leather curling, peg-memory gone to smoke. Samuel Harrow stands in the doorway from the boot room and does not look away. Rennet Moss has nothing in the hands that found the loose peg. The house smells of burned hide, not of a rite.",
        endSpeakerId: "p.samuel_harrow",
        end:
          "Samuel Harrow shuts the stove draft and says the boots are burned, which is a plain result in a New Haven kitchen. Ivo Perch will not be walked around the orchard in someone else's stride, and Helen Perch will not be handed a parcel. The loose peg is empty. Samuel is not grateful. He is finished.",
        flags: { "flags.boots.burned": true },
        summary:
          "Ivo Perch's last boots are burned in the Harrow kitchen stove. Samuel Harrow witnessed it from the boot room door. Nothing of the leather is left to wear or to return.",
      },
    ],
    alt: {
      npcId: "p.samuel_harrow",
      surrogateId: "p.lottie_harrow",
      resolution:
        "Samuel Harrow is not in the boot room to watch the hands. Lottie Harrow counts Ivo Perch's boots as objects with an owner, and she will wrap them for Helen or burn them rather than leave them half-decided on the peg.",
      opening: {
        speakerId: "p.lottie_harrow",
        text:
          "Samuel is not here to study your hands. I am Lottie Harrow. Ivo Perch's last boots are on the loose peg in this New Haven homestead boot room. I can count them onto Helen Perch by wrapping them here, or I can count them into the kitchen stove. I will not leave a dead man's pair as a maybe.",
      },
      branches: [
        {
          id: "br.return.samuel",
          choiceId: "ch.return.samuel",
          choice: "Wrap the boots here for Helen Perch.",
          endSpeakerId: "p.lottie_harrow",
          end:
            "Lottie Harrow wraps Ivo Perch's boots on the boot room bench and says Helen Perch's name as the count. The New Haven homestead does not send Rennet down the road. The return is the paper and the knot. Samuel is not watching. Lottie ties the string twice and calls the peg clear.",
          flags: { "flags.boots.returned": true },
          summary:
            "Lottie Harrow, with Samuel gone, wraps Ivo's boots in the homestead boot room for Helen Perch. The return is finished on the bench. The peg is cleared by a count.",
        },
        {
          id: "br.burn.samuel",
          choiceId: "ch.burn.samuel",
          choice: "Burn Ivo's boots in the kitchen stove.",
          endSpeakerId: "p.lottie_harrow",
          end:
            "Lottie Harrow puts Ivo Perch's boots into the homestead kitchen stove and waits until the leather stops making a shape. She says burned, one pair, New Haven, this morning. Samuel cannot nod from the doorway. The loose peg stays empty. Lottie washes the soot off her thumb and does not eulogize the smoke.",
          flags: { "flags.boots.burned": true },
          summary:
            "With Samuel Harrow dead, Lottie Harrow burns Ivo Perch's boots in the kitchen stove and counts them finished. The boot room peg is empty. No parcel goes to Helen.",
        },
      ],
    },
    rewards: [
      reward(
        "token",
        "reward.boots.peg",
        "Ivo Perch's last boots are no longer an untouched pair on the loose peg in the Harrow boot room.",
      ),
      reward(
        "stance",
        "reward.boots.hands",
        "Samuel Harrow or his absence has been answered: the boots were worn, wrapped for Helen, or burned, without a speech about fate.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies in the Harrow boot room with Ivo Perch's boots still on the loose peg. Samuel Harrow has seen the hands and has not been given a wearing, a wrap, or a fire. Nothing is carried forward in the fists.",
      unresolved:
        "The next body inherits no decision about those boots. The New Haven peg may still hold Ivo's leather, and Helen Perch is not owed a story about a choice that never landed.",
      resolved:
        "If the boots were already worn, wrapped for Helen, or burned, the next wearing does not put them back on the peg to try again. Samuel's room keeps the finished fact and carries nothing extra.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.neighbor_milk",
    title: "Downstream Milk",
    eras: ["E0"],
    locationId: "loc.waltham.river_meadow",
    characters: ["p.henry_march", "p.dolores_march"],
    summary:
      "Henry March's morning milk in the Waltham meadow is warm. He would rather blame his cooler than be a victim of the night wheel upstream. Dolores March says the cow and the milk are not the same argument. Ellis either names the wheel or lets the cooler stand.",
    discovery:
      "The cans in Henry March's meadow shed are warm in a way a March morning in Waltham should not allow. He has his hand on the cooler latch. Dolores is in the doorway with the cow still in her sentence, refusing to let the milk become the whole animal.",
    implications:
      "Either the night wheel's hours are put into the meadow's mouth, or Henry keeps the dignity of a failed cooler. Those mill truths cannot both be the record. Dolores's split between cow and milk remains the correction, said or ignored.",
    steps: [
      "Stand in Henry March's Waltham meadow shed and feel that the morning milk is already warm.",
      "Listen to Henry defend his cooler and to Dolores March separate the cow from the milk.",
      "Tell him the upstream night wheel changed the hours, or let him keep the blame on the cooler.",
    ],
    opening: {
      speakerId: "p.henry_march",
      text:
        "The milk is warm and I am not a man who got robbed in a story. I am Henry March. This is my meadow in Waltham. The cooler is the thing I own, so the cooler can be the failure. Dolores March will tell you the cow is a different argument. If you know a night wheel upstream, say it plain. Do not build me a compromise that tastes like both.",
      variant: {
        when: { flaw: "spares_a_kind_lie" },
        text:
          "Henry March watches Rennet Moss almost let the cooler stay guilty, which would be the kinder inaccuracy. The Waltham meadow milk is warm. Dolores March has her arms folded and will not let a mercy rename the cow. Henry says if you are sparing me, spare me with silence or with the truth. Not with a soft machine.",
      },
    },
    branches: [
      {
        id: "br.hours",
        choiceId: "ch.hours",
        choice: "Tell Henry the night wheel warmed the milk.",
        middleSpeakerId: "p.dolores_march",
        middle:
          "Dolores March speaks before Henry can turn the news into shame. The cow in the Waltham meadow walked where she walked. The milk is warm because the night wheel upstream changed the water's hours. Those are not one argument. She will not let Ellis drown the animal in the can. Henry March hears the split and still has to hear the wheel.",
        endSpeakerId: "p.henry_march",
        end:
          "Henry March takes his hand off the cooler latch. He says the night wheel, then, and not his own tin. The Waltham morning is altered in his mouth now. He will not perform being a victim, and he will not thank the messenger. Dolores has kept the cow out of the sentence. The hours are told. The counsel is not kept.",
        flags: { "flags.milk.hours_changed": true, "flags.mill.downstream_told": true },
        summary:
          "Ellis told Henry March that the night wheel changed the hours of his Waltham milk. The cooler is spared a false blame. The downstream telling is now a fact, and the mill's counsel is not.",
      },
      {
        id: "br.cooler",
        choiceId: "ch.cooler",
        choice: "Let Henry blame the cooler, not the wheel.",
        middleSpeakerId: "p.dolores_march",
        middle:
          "Dolores March hears the silence that leaves the cooler guilty and she corrects only her half. In the Waltham meadow the cow is not the milk. She will not make Henry March a poem or a fool. She also will not say the night wheel if Ellis will not. The can is warm. The animal is separate. She sets that down and steps back.",
        endSpeakerId: "p.henry_march",
        end:
          "Henry March nods at his own cooler as if dignity lived in the latch. The Waltham milk stays a private failure. Nobody in the shed has said the night wheel. Dolores March has kept the cow out of it and lost the rest. Ellis keeps the mill's counsel by letting a farmer blame a machine he can bear to own.",
        flags: { "flags.milk.farmer_blamed": true, "flags.mill.counsel_kept": true },
        summary:
          "Henry March is left blaming his cooler for the warm milk in Waltham. The night wheel is not said. The mill's counsel holds, and Dolores's distinction does not become the accusation.",
      },
    ],
    alt: {
      npcId: "p.henry_march",
      surrogateId: "p.dolores_march",
      resolution:
        "Henry March is dead and cannot choose his own dignity. Dolores March keeps the cow and the milk as separate facts in the Waltham meadow, and she will either say the night wheel or let the cooler wear the blame.",
      opening: {
        speakerId: "p.dolores_march",
        text:
          "Henry is not here to prefer his cooler. I am Dolores March. The milk in this Waltham meadow is warm and the cow is not the milk. Do not hand me a poem about either. If the night wheel upstream did this, say the wheel. If you want the cooler to keep the blame, say that. I will not stir them into one story.",
      },
      branches: [
        {
          id: "br.hours.henry",
          choiceId: "ch.hours.henry",
          choice: "Say the night wheel, not the cow.",
          endSpeakerId: "p.dolores_march",
          end:
            "Dolores March repeats it in order. The cow. Then the milk. Then the night wheel that changed the hours. The Waltham cooler stays a cooler. Henry cannot be spared because Henry is gone, and she will not spare the truth in his place. The meadow has the hours in its mouth. That is the telling.",
          flags: { "flags.milk.hours_changed": true, "flags.mill.downstream_told": true },
          summary:
            "Dolores March, with Henry gone, puts the night wheel into the Waltham meadow's account and refuses to confuse it with the cow. The downstream hours are told.",
        },
        {
          id: "br.cooler.henry",
          choiceId: "ch.cooler.henry",
          choice: "Leave the blame on the cooler.",
          endSpeakerId: "p.dolores_march",
          end:
            "Dolores March lets the cooler keep the blame and says she is doing it with her eyes open. The Waltham milk is warm. The cow remains a cow. The night wheel is not spoken. She will not pretend that silence is the same as innocence. Henry is not here to want it. The mill's counsel is what Ellis kept.",
          flags: { "flags.milk.farmer_blamed": true, "flags.mill.counsel_kept": true },
          summary:
            "With Henry March dead, Dolores still lets the cooler carry the warm milk. The night wheel stays unsaid in Waltham. Counsel is kept, and she does not call that kindness clean.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.dolores_march",
        surrogateId: "p.henry_march",
        resolution:
          "Dolores March is not in the doorway to split the cow from the milk. Henry March still wants the failure to be his cooler unless Ellis names the night wheel in the Waltham meadow without a compromise.",
        opening: {
          speakerId: "p.henry_march",
          text:
            "Dolores is not here to separate my sentences for me. I am Henry March. The milk is warm in this Waltham meadow and I would rather the cooler failed than a man upstream made me a victim. Say the night wheel if that is the cause. Say the cooler if you will let me keep my own machine. Do not say both.",
        },
        branches: [
          {
            id: "br.hours.dolores",
            choiceId: "ch.hours.dolores",
            choice: "Name the night wheel as the cause.",
            endSpeakerId: "p.henry_march",
            end:
              "Henry March says the night wheel once and lets the cooler off the hook. There is no Dolores in the Waltham doorway to keep the cow out of it, so he does that himself in fewer words. The hours are in the meadow's mouth. He will live with the neighbor he may lose. He will not live with a blended excuse.",
            flags: { "flags.milk.hours_changed": true, "flags.mill.downstream_told": true },
            summary:
              "Henry March hears the night wheel without Dolores there to split the argument. The Waltham milk's hours are told downstream. His cooler is not the story he keeps.",
          },
          {
            id: "br.cooler.dolores",
            choiceId: "ch.cooler.dolores",
            choice: "Let the cooler stay the failure.",
            endSpeakerId: "p.henry_march",
            end:
              "Henry March puts the blame back on the cooler and looks relieved in a narrow way. The Waltham meadow does not receive the night wheel. Dolores cannot object. Ellis keeps the mill's counsel, and Henry keeps a failure he can fix with his own hands. He calls that preferable. He does not call it proven.",
            flags: { "flags.milk.farmer_blamed": true, "flags.mill.counsel_kept": true },
            summary:
              "Without Dolores, Henry March is allowed to blame his cooler for the warm Waltham milk. The night wheel is unspoken. The mill counsel holds in the shed.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "knowledge",
        "reward.milk.warm",
        "Ellis knows Henry March's warm morning milk in Waltham can be the night wheel's hours or a cooler he would rather own.",
      ),
      reward(
        "stance",
        "reward.milk.mouth",
        "The meadow either received the night hours in plain speech or was left with Henry's machine as the blame he could stand.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies in the Waltham meadow shed with the warm milk unjudged. Henry March still has his hand on the cooler. Dolores March has not been given a finished split. The night wheel is neither told nor kept on purpose.",
      unresolved:
        "The next body does not inherit a meadow sentence. Henry's cans may still go warm, and no one wrote whether the wheel or the cooler was chosen. The mill question stays open because this death did not close it.",
      resolved:
        "If the hours were already told or the cooler already blamed, the Waltham morning keeps that one cause. A later body does not get to blend them into the compromise Henry refused.",
      carry: [],
      lose: [],
      sets: { "flags.mill.unresolved": true },
    }),
  }),

  standalone({
    id: "q.lambing_shut_road",
    title: "The Shut Road",
    eras: ["E0"],
    locationId: "loc.weybridge.hill_barns",
    characters: ["p.arthur_iles"],
    summary:
      "Mud has shut the town road under the Weybridge hill barns. Arthur Iles can reach one barn before his hands shake. The upper barn has more animals. The lower has the one ewe they cannot replace. He will not let the two barns become one ethical object.",
    discovery:
      "The town road is a trench of mud. Arthur's bag is already in his fist and his other hand has the tremor he trusts more than speeches. Two barns sit on the Weybridge hill, and only one of them can be the trip.",
    implications:
      "One barn gets the vet and the other waits. The upper count and the lower ewe are not reconciled. Ellis pointed, and the pointing is the whole credit. The shut road does not reopen for a second philosophy.",
    steps: [
      "Stop with Arthur Iles where the mud has shut the town road below the Weybridge hill.",
      "Hear the upper barn's count of animals and the lower barn's one ewe that cannot be replaced.",
      "Point him to the upper barn or the lower barn before his hands shake, without joining them.",
    ],
    opening: {
      speakerId: "p.arthur_iles",
      text:
        "The town road is shut with mud and I can do one barn before my hands shake. I am Arthur Iles. Upper barn on this Weybridge hill has more animals. Lower has the ewe they cannot replace. If you make those one noble problem I will leave you in the mud. Point. I am the vet. You are the mouth. Use it short.",
      variant: {
        when: { ideal: "the_living_first" },
        text:
          "Arthur Iles sees Rennet Moss about to pick the living inconvenience over the cleaner loss, and he still wants a point, not a creed. The Weybridge road is mud. Upper barn, more animals. Lower barn, the ewe. He says the living are in both. That does not make them one object. Point before I shake.",
      },
    },
    branches: [
      {
        id: "br.upper",
        choiceId: "ch.upper",
        choice: "Send Arthur Iles to the upper barn.",
        middleSpeakerId: "p.arthur_iles",
        middle:
          "Arthur Iles turns his boots toward the upper barn on the Weybridge hill and does not look back for comfort. More animals. That is the reason he heard. The lower ewe stays where she is, unrepaired by a speech. His hands are already less steady. He says the road is shut, so this is the one walk. He starts it.",
        endSpeakerId: "p.arthur_iles",
        end:
          "The vet is committed to the upper barn. Arthur Iles says it aloud so the mud road cannot be retold later as a balanced care. Weybridge gets the larger count tonight. The ewe they cannot replace does not become a symbol he carries uphill. Ellis pointed. Arthur walks. There is no thanks for the ethics.",
        flags: { "flags.lambing.vet_to_upper": true },
        summary:
          "Arthur Iles goes to the upper Weybridge barn because it holds more animals. The lower ewe is left. He refused to glue the two barns into one moral object, and Ellis only pointed.",
      },
      {
        id: "br.lower",
        choiceId: "ch.lower",
        choice: "Send Arthur Iles to the lower barn.",
        middleSpeakerId: "p.arthur_iles",
        middle:
          "Arthur Iles takes the lower track. The ewe they cannot replace is the reason, and he will not inflate it into a lesson about all sheep. The upper barn's larger count waits on the Weybridge hill without a consoling sentence. Mud holds the town road shut. His hands have one job left in them. He spends it downslope.",
        endSpeakerId: "p.arthur_iles",
        end:
          "Lower barn. Arthur Iles says the words like a dose. The irreplaceable ewe gets the vet. The upper animals do not get a promise that the road will open in time. Ellis does not get to stand in the mud and unify them. The pointing is done. Weybridge will live with the barn that was not chosen.",
        flags: { "flags.lambing.vet_to_lower": true },
        summary:
          "Arthur Iles goes to the lower Weybridge barn for the ewe they cannot replace. The upper barn's greater number waits. The two barns stay two decisions, and only one was walked.",
      },
    ],
    alt: {
      npcId: "p.arthur_iles",
      surrogateId: "p.cora_belden",
      resolution:
        "Arthur Iles is not on the shut road to spend his hands. Cora Belden is the one left at the Weybridge hill barns, and she will still name one barn rather than make the upper count and the lower ewe into a single lesson.",
      opening: {
        speakerId: "p.cora_belden",
        text:
          "Arthur Iles is not coming up. I am Cora Belden. The town road is still mud and the Weybridge hill still has two barns. Upper has more animals. Lower has the ewe they cannot replace. I will not say those are one sadness. Tell me which barn gets the help that can still walk. I am not the vet. I am the mouth that remains.",
      },
      branches: [
        {
          id: "br.upper.arthur",
          choiceId: "ch.upper.arthur",
          choice: "Name the upper barn for the help.",
          endSpeakerId: "p.cora_belden",
          end:
            "Cora Belden says upper, and she does not soften it for the lower ewe. The Weybridge hill hears a child of the horse fence speak like a gate list. More animals. That is the route. Arthur cannot walk it. The record of the shut road still takes the upper barn, and Cora will not join the barns to feel kinder.",
          flags: { "flags.lambing.vet_to_upper": true },
          summary:
            "With Arthur Iles dead, Cora Belden names the upper Weybridge barn. The larger count gets the remaining help. The lower ewe is not folded into a speech that makes the loss even.",
        },
        {
          id: "br.lower.arthur",
          choiceId: "ch.lower.arthur",
          choice: "Name the lower barn for the ewe.",
          endSpeakerId: "p.cora_belden",
          end:
            "Cora Belden says lower. The ewe they cannot replace is the reason, said once, on the mud below the Weybridge barns. She does not add that the upper animals will understand. They will not. Arthur Iles is not here to resent the philosophy, so she does not offer one. The barn is named. She is done pointing.",
          flags: { "flags.lambing.vet_to_lower": true },
          summary:
            "Cora Belden sends the remaining help to the lower Weybridge barn for the ewe. Arthur is gone. The upper barn is left as its own unvisited count, not as a moral balance.",
        },
      ],
    },
    rewards: [
      reward(
        "stance",
        "reward.lambing.point",
        "A single barn on the Weybridge hill was named before the hands gave out, and the other barn was left outside the sentence.",
      ),
      reward(
        "knowledge",
        "reward.lambing.barns",
        "Ellis knows the shut town road allows one visit: more animals uphill, one irreplaceable ewe below, and no honest merger.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies in the mud before the point is made. Arthur Iles chooses a Weybridge barn alone. The credit does not attach to Rennet's mouth. The shut road keeps whichever walk the vet spent his shaking hands on.",
      unresolved:
        "The next body is not told which barn was owed the pointing. Arthur's choice, if he made one after the death, is his. Ellis does not inherit credit for a hill that was never answered in time.",
      resolved:
        "If the upper or lower barn was already named, that pointing stands. A later wearing does not return to the Weybridge mud to steal the credit Arthur refused to make into a speech.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.hired_man_name",
    title: "The Hired Man's Name",
    eras: ["E0"],
    locationId: "loc.new_haven.homestead",
    characters: ["p.evan_dunn"],
    summary:
      "Evan Dunn is using a dead Bristol cutter's name because it gets him hired for the Harrow hay. Stripping it makes the hay late and has to be told to Samuel in the yard. Keeping it leaves a dead man's wage-name on a living back.",
    discovery:
      "The hire sheet in the New Haven yard does not say Evan Dunn. It says a cutter who is already dead in Bristol, and the man answering to it is alive, ashamed, and practical about the weather window on the hay.",
    implications:
      "The yard either loses a borrowed name and gains a late haying with the reason said to Samuel, or it keeps the wage-name on Evan through the season. The dead cutter is not hired back. The living back is.",
    steps: [
      "Face Evan Dunn in the New Haven homestead yard while the borrowed name is still the one on the hire.",
      "Hear him say the dead Bristol cutter's name is what gets him the hay work, and his own opens nothing.",
      "Strip the name and tell Samuel Harrow in the yard why the hay is late, or leave the borrowed name in use.",
    ],
    opening: {
      speakerId: "p.evan_dunn",
      text:
        "The name on the sheet is a dead Bristol cutter's, and it is why I am hired. I am Evan Dunn, in this New Haven yard, wearing it on a living back. Strip it and the hay is late. Then you stay and tell Samuel Harrow why, here, not as a purity you walk away from. Keep it and the dead man draws my wage in their mouths. Choose.",
      variant: {
        when: { ideal: "names_aloud" },
        text:
          "Evan Dunn hears the urge to say the true name out loud and he flinches like a man who has already priced it. The New Haven homestead yard will lose time if the Bristol cutter's name comes off. Samuel Harrow is within earshot of the fence. Evan says if you speak me, stay for the lateness. A name unpaid is still a wage he needs.",
      },
    },
    branches: [
      {
        id: "br.strip",
        choiceId: "ch.strip",
        choice: "Strip the name and tell Samuel in the yard.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "Ellis says Evan Dunn's own name in the New Haven yard, loud enough for Samuel Harrow at the fence, and then says the hay will be late because the dead Bristol cutter's name was the hire. It is not a second errand. Samuel is already here. The sheet is wrong. The back is alive. The cutter stays dead. The afternoon changes.",
        endSpeakerId: "p.evan_dunn",
        end:
          "Evan Dunn stands without the borrowed name and does not thank anyone. Samuel Harrow has heard why the New Haven hay slips. The dead man's wage-name is off a living back. Evan says he will work as himself if there is still work after the weather. He asked for the telling. He got it in the yard. He is done asking.",
        flags: { "flags.hired.name_stripped": true },
        summary:
          "The dead Bristol cutter's name is stripped off Evan Dunn in the New Haven yard, and Samuel Harrow is told there why the hay will be late. The telling is not a later errand.",
      },
      {
        id: "br.keep",
        choiceId: "ch.keep",
        choice: "Leave the borrowed name in use.",
        middleSpeakerId: "p.evan_dunn",
        middle:
          "Evan Dunn hears the name left on him and his shoulders drop in a way that is not peace. The New Haven hay can start. Samuel Harrow does not get a confession at the fence. A dead Bristol cutter keeps earning in the crew's mouth. Evan says he will answer to it until the weather breaks. He is ashamed and he is hired.",
        endSpeakerId: "p.evan_dunn",
        end:
          "The borrowed name stays. Evan Dunn turns back to the wagon in the homestead yard and does not make Ellis repeat the mercy. The hay will not be late for honesty's sake. The dead cutter's wage-name rides a living back through this season. Samuel is not told. Evan asked for a choice and he can live inside the one he was given.",
        flags: { "flags.hired.name_kept": true },
        summary:
          "Evan Dunn keeps the dead Bristol cutter's name so the New Haven hay is not late. Samuel Harrow is not given the reason. A dead man's wage-name remains on a living back.",
      },
    ],
    alt: {
      npcId: "p.evan_dunn",
      surrogateId: "p.samuel_harrow",
      resolution:
        "Evan Dunn is dead and cannot bargain with the weather. Samuel Harrow has the hire sheet in the New Haven yard, and he will either strike the borrowed name and accept the late hay or leave the dead cutter's name working.",
      opening: {
        speakerId: "p.samuel_harrow",
        text:
          "Evan is not in this yard to be ashamed in person. I am Samuel Harrow. The New Haven hire sheet still carries a dead Bristol cutter's name, and the man who wore it is gone too. I can strip it and eat a late haying, or I can leave the name in use because the grass does not care who is honest. Tell me which injury you will stand next to.",
      },
      branches: [
        {
          id: "br.strip.evan",
          choiceId: "ch.strip.evan",
          choice: "Strip the name and accept the late hay.",
          endSpeakerId: "p.samuel_harrow",
          end:
            "Samuel Harrow crosses the borrowed name off the sheet in the New Haven yard and says the hay will be late for a reason he can now say himself. Evan Dunn is not here to hear it. The dead Bristol cutter stops drawing a wage in a living season. Samuel folds the paper. He does not call the lateness pure. He calls it decided.",
          flags: { "flags.hired.name_stripped": true },
          summary:
            "Samuel Harrow strips the dead cutter's name after Evan Dunn is gone. The New Haven hay runs late, and the reason is said in the yard by the man who owns the sheet.",
        },
        {
          id: "br.keep.evan",
          choiceId: "ch.keep.evan",
          choice: "Leave the dead cutter's name on the hire.",
          endSpeakerId: "p.samuel_harrow",
          end:
            "Samuel Harrow leaves the name on the New Haven sheet. The hay crew will still answer it. Evan cannot wear it, so the name works without the back, which is a different wrong and still a hire. Samuel says the grass is ready and the correction can wait on a living man who is not here. The borrowed name stays for the work.",
          flags: { "flags.hired.name_kept": true },
          summary:
            "With Evan dead, Samuel Harrow leaves the Bristol cutter's name in use so the hay is not late. The wage-name outlives both the cutter and the man who borrowed it.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "reward.hired.sheet",
        "The New Haven hire sheet either loses the dead Bristol cutter's name or keeps it as the name the hay will answer to.",
      ),
      reward(
        "stance",
        "reward.hired.back",
        "Ellis chose whether a living back may carry a dead man's wage-name, and whether Samuel hears the lateness in the yard.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies in the New Haven yard before the name is stripped or kept on purpose. Evan Dunn still wears the dead Bristol cutter through the season. Samuel Harrow is not told a finished reason. The hay proceeds under the borrowed mouth.",
      unresolved:
        "The next body finds the hired name still in use if nobody else struck it. The season kept the dead cutter's wage-name. No later wearing is owed a scene where the honesty arrives in time for the grass.",
      resolved:
        "If the name was already stripped and told, or already left, that yard fact holds. The next body does not reopen Evan Dunn's hire to make the hay both on time and clean.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.untolled_night",
    title: "The Untolled Night",
    eras: ["E0"],
    locationId: "loc.addison.chimney_point",
    characters: ["p.cal_voss", "p.ida_voss"],
    summary:
      "Someone crossed the Vermont landing at Chimney Point without the log. Ida Voss fed them. Cal Voss wants the book honest and the night kind. Ellis can write the crossing in, leave it out, or close the landing until morning. The bridge in view is the 1929 span's Vermont abutment only.",
    discovery:
      "The log on the Addison shore is short a crossing that the bowls in Ida's kitchen already know about. Cal has the book open on the Vermont landing. The far shore is not the work. The abutment and the page are.",
    implications:
      "The Chimney Point log either gains the untolled names as a crossing, keeps a kindness by omission, or loses the night's traffic because the landing shut. Cal has been met. Nothing about the pier is settled by this page.",
    steps: [
      "Come onto the Vermont landing at Chimney Point and look at the log that missed a crossing.",
      "See that Ida Voss already fed the people and that Cal Voss wants both honesty and a kind night.",
      "Write the crossing in, leave it out of the book, or close the landing until morning.",
    ],
    opening: {
      speakerId: "p.cal_voss",
      text:
        "Somebody crossed this Vermont landing and the log does not know them. I am Cal Voss. Ida Voss fed them in the Chimney Point kitchen because they were here and hungry. I want the book honest and I want the night kind. Those can fight. Write them in, leave them out, or I close this shore till morning. New York is not your stage.",
      variant: {
        when: { flaw: "signs_unread" },
        text:
          "Cal Voss sees Rennet Moss's hand already looking for a pen, ready to end a silence by signing. The Chimney Point log is open on the Vermont side of the 1929 bridge. Ida Voss has fed the crossers. Cal says a signature is not kindness by itself. Write, omit, or close. Do it on this abutment's shore only.",
      },
    },
    branches: [
      {
        id: "br.log",
        choiceId: "ch.log",
        choice: "Write the untolled crossing into the log.",
        middleSpeakerId: "p.ida_voss",
        middle:
          "Ida Voss sets the pen down beside the bowls' memory and does not take the food back. They ate at Chimney Point. Cal Voss wants them in the book. She says a fed person can still be a written person. The Vermont landing does not have to lie to be kind. She will not invent a prettier reason they crossed. The page can have the fact.",
        endSpeakerId: "p.cal_voss",
        end:
          "Cal Voss watches the line go into the log and nods like a man whose night got heavier and cleaner. The crossing is no longer untolled. Ida's feeding stands. The Vermont abutment of the old bridge keeps its own book, and nothing is claimed about the pier or the other state. Ellis has stood on Cal's landing. The ink is dry enough.",
        flags: { "flags.crossing.logged": true, "flags.met.cal": true },
        summary:
          "The untolled crossing is written into the Chimney Point log. Ida Voss's feeding remains kind, and Cal Voss gets an honest book. The Vermont landing has been met. The pier is untouched.",
      },
      {
        id: "br.omit",
        choiceId: "ch.omit",
        choice: "Leave the crossing out of the log.",
        middleSpeakerId: "p.ida_voss",
        middle:
          "Ida Voss does not smile, but she lets the omission stand next to the meal she already gave. Chimney Point fed them. The log will not. She says kindness can be a blank if Cal Voss can bear the blank. She will not call the blank a better history. She calls it the night they chose. The bowls are washed either way.",
        endSpeakerId: "p.cal_voss",
        end:
          "Cal Voss closes the log on a page that stays short. He says the night was kind and the book was not honest, and he will live with that because he asked for both and could not have them. The Vermont landing at Chimney Point keeps the secret of a crossing. Ida fed it. Ellis met Cal here. The pier is not in this decision.",
        flags: { "flags.crossing.unlogged": true, "flags.met.cal": true },
        summary:
          "The crossing stays out of the Chimney Point log. Ida Voss's feeding is the kindness that replaced the line. Cal Voss accepts a book that is short, and he has been met on the Vermont shore.",
      },
      {
        id: "br.close",
        choiceId: "ch.close",
        choice: "Close the Vermont landing for the night.",
        middleSpeakerId: "p.cal_voss",
        middle:
          "Cal Voss puts the chain mindset on the landing without a speech about the whole lake. Chimney Point, Vermont side, is closed till morning. Ida Voss can still have fed the ones who already ate. No new crossing gets a bowl or a line. He says this is not a judgment of the bridge pier. It is a shut book and a shut hour.",
        endSpeakerId: "p.ida_voss",
        end:
          "Ida Voss banks the kitchen fire at Chimney Point and does not argue the chain. The night is closed. The people she fed are not unfed by the closing. Cal Voss has his landing quiet and his log unfinished on purpose. Ellis has met him. The 1929 abutment stays Vermont's problem and nobody's pier diagnosis.",
        flags: { "flags.crossing.night_closed": true, "flags.met.cal": true },
        summary:
          "Cal Voss closes the Chimney Point landing for the night. The log is not completed and not lied in. Ida keeps the feeding she already did. The pier is not judged.",
      },
    ],
    alt: {
      npcId: "p.cal_voss",
      surrogateId: "p.ida_voss",
      resolution:
        "Cal Voss is dead and the landing's conscience is the woman who fed the crossers. Ida Voss will write them into the Chimney Point log or leave them out. She does not pretend the Vermont night needs a pier.",
      opening: {
        speakerId: "p.ida_voss",
        text:
          "Cal is not here to want the book and the kindness in one breath. I am Ida Voss. I fed them at Chimney Point on the Vermont landing. The log does not have them. I can write the crossing or leave the page short. I will not close a shore to feel like him. The bridge abutment is ours. The other state is not the meal.",
      },
      branches: [
        {
          id: "br.log.cal",
          choiceId: "ch.log.cal",
          choice: "Write them in after the meal.",
          endSpeakerId: "p.ida_voss",
          end:
            "Ida Voss writes the crossing herself in the Chimney Point log, plain as a second helping. They ate. They crossed the Vermont landing. The line does not make them wicked and the blank was not protecting them anymore. Cal cannot sign it. She signs the fact. She does not write a word about the pier.",
          flags: { "flags.crossing.logged": true },
          summary:
            "Ida Voss enters the untolled crossing in the Chimney Point log after Cal is gone. The feeding and the writing both stand. Nothing is decided about the pier.",
        },
        {
          id: "br.omit.cal",
          choiceId: "ch.omit.cal",
          choice: "Leave the fed crossing out of the book.",
          endSpeakerId: "p.ida_voss",
          end:
            "Ida Voss leaves the log short and says the bowls were the record she could stand. Chimney Point fed a crossing the book will not own. She does not call that Cal's honesty. She calls it her kitchen. The Vermont landing stays open. The omission is chosen. The pier is nobody's sentence tonight.",
          flags: { "flags.crossing.unlogged": true },
          summary:
            "With Cal Voss dead, Ida Voss leaves the crossing out of the log. Her feeding at Chimney Point is the kindness she keeps. The book stays short on purpose.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.ida_voss",
        surrogateId: "p.cal_voss",
        resolution:
          "Ida Voss is dead, so the meal is not hers to repeat. Cal Voss still wants the Chimney Point book honest, and without her he will either write the crossing or close the Vermont landing rather than pretend the night fed itself.",
        opening: {
          speakerId: "p.cal_voss",
          text:
            "Ida is not in the kitchen. I am Cal Voss. Someone still crossed this Vermont landing at Chimney Point without the log, and the person who would have fed them is gone. I will not perform her kindness badly. Write them in, or I close the landing for the night. The pier is not the question. The page is.",
        },
        branches: [
          {
            id: "br.log.ida",
            choiceId: "ch.log.ida",
            choice: "Write the crossing without Ida's meal.",
            endSpeakerId: "p.cal_voss",
            end:
              "Cal Voss writes the crossing into the Chimney Point log and does not invent a bowl to go with it. The Vermont landing gets an honest line and a harder night. Ida cannot feed them now. He says the book can be true without being gentle. Ellis has met him on the abutment shore. He does not mention the pier.",
            flags: { "flags.crossing.logged": true, "flags.met.cal": true },
            summary:
              "Cal Voss logs the crossing at Chimney Point without Ida alive to feed anyone. The book is honest. The night is not kind in her way. The pier stays out of it.",
          },
          {
            id: "br.close.ida",
            choiceId: "ch.close.ida",
            choice: "Close the landing until morning.",
            endSpeakerId: "p.cal_voss",
            end:
              "Cal Voss closes the Chimney Point landing. No more untolled feet on the Vermont shore tonight, and no fake supper in Ida's place. The log stays as it was, missing a crossing he will not copy into kindness. He has been met. The 1929 bridge's Vermont abutment is simply shut for the dark. The pier is unmentioned.",
            flags: { "flags.crossing.night_closed": true, "flags.met.cal": true },
            summary:
              "Without Ida, Cal Voss closes the Vermont landing at Chimney Point for the night. He does not counterfeit her feeding. The crossing stays unlogged by shutdown, not by a lie.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "access",
        "reward.crossing.book",
        "The Chimney Point log on the Vermont landing will take Ellis's hand for a crossing, a blank, or a night that is shut.",
      ),
      reward(
        "stance",
        "reward.crossing.kind",
        "Cal and Ida have an answer about the untolled night: written, omitted, or closed, and the pier was not used as the excuse.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies on the Vermont landing with the Chimney Point log still unresolved. Ida Voss's bowls and Cal Voss's book do not receive a last instruction. Nothing is set about the pier. The night keeps its own unfinished kindness.",
      unresolved:
        "The next body is not told whether the crossing was written, omitted, or the landing closed. The abutment keeps the rumor of an untolled night. No pier fact rides along with the death.",
      resolved:
        "If the log was already written, left short, or the landing already shut, that shore fact remains. A later wearing does not open the pier as a way to revise Chimney Point's page.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.ice_judgment",
    title: "Ice Judgment",
    eras: ["E1"],
    locationId: "loc.addison.chimney_point",
    characters: ["p.cal_voss"],
    summary:
      "In 1966 Cal Voss is fourteen years harder and does not greet Ada Smollet as an old friend. From the Vermont shore at Chimney Point, people talk of crossing ice toward the channel. Peter Voss died through that ice in 1948 after calling it safe. Ellis can warn or refuse to judge.",
    discovery:
      "The talk on the Addison shore is about ice, not about a reunion. Cal is older in the face and in the patience. The 1929 bridge's Vermont side is the only ground in play. The channel is a rumor with a dead man already in it.",
    implications:
      "Either the Vermont shore hears that the ice is unsafe, in the shadow of Peter Voss, or Ellis refuses the judgment and the rumor stays the shore's own. Cal is met and does not perform gratitude or memory.",
    steps: [
      "Stand on the Vermont shore at Chimney Point while people talk about crossing the ice toward the channel.",
      "Let Cal Voss look at Ada Smollet without a reunion and with Peter Voss's bad ice still in the family mouth.",
      "Say the ice is unsafe, or refuse to judge it, and leave the other state out of the sentence.",
    ],
    opening: {
      speakerId: "p.cal_voss",
      text:
        "Do not greet me. I am Cal Voss, and you are a face on my Vermont shore at Chimney Point, whatever Ada Smollet is to you. People want to cross the ice toward the channel. My father Peter Voss called ice safe in forty-eight and died through it on this side. Say it is unsafe or refuse the judgment. I will not do a reunion.",
      variant: {
        when: { ideal: "water_has_its_level" },
        text:
          "Cal Voss watches Ada Smollet measure the ice the way some people measure a level that does not care about them. Chimney Point is talking about a crossing toward the channel, Vermont feet only. Peter Voss was wrong in 1948. Cal says the water has a level and a dead man. Warn them or shrug. Do not come here to be known.",
      },
    },
    branches: [
      {
        id: "br.warn",
        choiceId: "ch.warn",
        choice: "Say the ice toward the channel is unsafe.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "Ellis says, in Ada Smollet's mouth, that the ice is unsafe. The words stay on the Vermont shore at Chimney Point. They do not borrow New York. They do not borrow Peter's confidence. Cal Voss hears a judgment and not a family scene. The people who were talking have a sentence they can repeat without a myth attached.",
        endSpeakerId: "p.cal_voss",
        end:
          "Cal Voss repeats it once, flat. Unsafe. He does not thank Ada and he does not say he remembers a younger ask. Peter Voss called it safe and was wrong. The Vermont shore at Chimney Point will not be invited to try the channel on talk. Ellis has met Cal. The warning is the whole meeting. The abutment does not become a stage.",
        flags: { "flags.ice.warned": true, "flags.met.cal": true },
        summary:
          "Ellis told the Vermont shore at Chimney Point that the ice toward the channel is unsafe. Cal Voss let the warning stand without a reunion. Peter Voss's old confidence is the contrast, not the script.",
      },
      {
        id: "br.shrug",
        choiceId: "ch.shrug",
        choice: "Refuse to judge the ice at all.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "Ellis refuses the judgment out loud. Ada Smollet's mouth says it is not this body's ice to call. The Vermont shore at Chimney Point keeps its talk. Cal Voss does not fill the refusal with an old friendship. Peter Voss already used certainty once. Ellis will not use a counterfeit certainty to look brave.",
        endSpeakerId: "p.cal_voss",
        end:
          "Cal Voss says then the shore keeps its own rumor. He will not drag a reunion out of a shrug, and he will not pretend Peter Voss's death makes every visitor an expert. Chimney Point has no new warning. Ellis met him and left the ice unjudged. The channel talk goes on without a surveyor's blessing.",
        flags: { "flags.ice.shrugged": true, "flags.met.cal": true },
        summary:
          "Ellis refused to judge the ice at Chimney Point. Cal Voss did not turn the refusal into a reunion. The Vermont shore keeps the rumor of a crossing, and no warning was added.",
      },
    ],
    alt: {
      npcId: "p.cal_voss",
      surrogateId: "p.lena_voss",
      resolution:
        "Cal Voss is dead, so the harder man is not on the shore to forbid a reunion. Lena Voss, who grew up on Peter's ice story, will take the warning or the refusal without turning Chimney Point into a welcome.",
      opening: {
        speakerId: "p.lena_voss",
        text:
          "My father is not here to be hard at you. I am Lena Voss. This is the Vermont shore at Chimney Point, and people are talking about ice toward the channel. Peter Voss called ice safe and died through it in forty-eight, on this side. I am not your old friend either. Say it is unsafe, or say you will not judge it.",
      },
      branches: [
        {
          id: "br.warn.cal",
          choiceId: "ch.warn.cal",
          choice: "Tell Lena the ice is unsafe.",
          endSpeakerId: "p.lena_voss",
          end:
            "Lena Voss carries the word unsafe back toward the talkers on the Vermont shore. She does not add a family greeting. Chimney Point gets a judgment Peter Voss did not give himself. Cal cannot withhold the reunion because Cal is already absent. Lena says the channel is not a dare she will cosign. The warning is in a living mouth.",
          flags: { "flags.ice.warned": true },
          summary:
            "With Cal gone, Lena Voss takes Ellis's warning that the Chimney Point ice is unsafe. The Vermont shore gets the sentence. No reunion is performed over Peter Voss's death.",
        },
        {
          id: "br.shrug.cal",
          choiceId: "ch.shrug.cal",
          choice: "Refuse to judge the ice for her.",
          endSpeakerId: "p.lena_voss",
          end:
            "Lena Voss accepts the refusal without coaxing a braver line out of Ada Smollet. The Vermont shore at Chimney Point keeps its rumor. Peter Voss was sure, and sure killed him. Lena says she will not pretend a stranger's shrug is the same as a warning. The ice stays unjudged. She goes back to the log, not to a reunion.",
          flags: { "flags.ice.shrugged": true },
          summary:
            "Lena Voss hears Ellis refuse to judge the ice. Cal is not there to scorn a reunion. The Chimney Point shore keeps its own talk, and no safety is promised.",
        },
      ],
    },
    rewards: [
      reward(
        "knowledge",
        "reward.ice.channel",
        "Ellis knows the 1966 talk at Chimney Point is a Vermont-shore ice crossing toward the channel, haunted by Peter Voss's wrong call.",
      ),
      reward(
        "stance",
        "reward.ice.mouth",
        "Ada Smollet's mouth either warned that the ice was unsafe or refused the judgment, and Cal Voss did not get a reunion scene.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies on the Vermont shore before the ice is called. The warning is unsaid. Cal Voss does not inherit a reunion, and Chimney Point keeps its own rumor about the channel. Ada Smollet's mouth took no position.",
      unresolved:
        "The next body is not told whether anyone warned the shore. The ice talk remains a local rumor. Peter's death is still a fact, and Ellis's silence does not become advice after the fact.",
      resolved:
        "If the ice was already called unsafe or already left unjudged, that stance stays. A later wearing does not return to Chimney Point to collect Cal's recognition for a sentence already finished.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.ferry_bell",
    title: "The Ferry Bell",
    eras: ["E0"],
    locationId: "loc.shoreham.larabee",
    characters: ["p.tom_yorston", "p.gail_yorston"],
    summary:
      "Tom Yorston rings the bell at Larabee's Point for the dead, including Peter Voss, who is not his cousin. Gail Yorston lets him because quiet would pretend the lake is only scenery. Ellis can stop it, ring once for a name said on the dock, or move the bell into the kitchen by a decision made there.",
    discovery:
      "The rope is in Tom's hand on the Shoreham landing. The bell is not a church and not a marker. Gail is on the dock with a kitchen behind her and a reason she has already chosen not to hush him.",
    implications:
      "The Larabee bell is stopped, shared for one named dead, or shifted into the kitchen by an act finished on the dock. The lake does not get to become mere scenery unless the rope is abandoned on purpose.",
    steps: [
      "Stand on the dock at Larabee's Point while Tom Yorston holds the bell rope.",
      "Hear Gail Yorston say she lets him ring because quiet would make the lake only scenery.",
      "Stop the practice, ring once for a name you say there, or move the bell into the kitchen from the dock.",
    ],
    opening: {
      speakerId: "p.tom_yorston",
      text:
        "The bell is not a church. I am Tom Yorston. I ring it at Larabee's Point for the dead, and Peter Voss is one of them, though he is not my cousin. Gail Yorston lets it happen. Quiet would pretend the lake is scenery. Stop me, ring it with me once for a name you will say here, or we move the bell into the kitchen. Decide on this dock.",
      variant: {
        when: { ideal: "names_aloud" },
        text:
          "Tom Yorston waits as if the next thing out of Rennet Moss must be a name or a refusal of names. The rope hangs at Larabee's Point. Gail Yorston has her reason ready: silence would make the lake a view. Peter Voss is already on Tom's list. Speak a name and ring, or stop the practice, or take the bell indoors. Do not study the rope.",
      },
    },
    branches: [
      {
        id: "br.stop",
        choiceId: "ch.stop",
        choice: "Stop Tom ringing the bell for the dead.",
        middleSpeakerId: "p.gail_yorston",
        middle:
          "Gail Yorston puts a hand near the rope and does not romanticize the stop. If Tom Yorston quits ringing at Larabee's Point, the dock gets quieter and the lake gets easier to treat as scenery. She has been against that. She will still let the choice stand. Peter Voss will not be in the air today. She says so without decorating it.",
        endSpeakerId: "p.tom_yorston",
        end:
          "Tom Yorston lets the rope go. The bell at Larabee's Point stays still. He does not argue Gail into a compromise. The practice is stopped. Peter Voss is not rung, and neither is anyone else. The dock has ordinary wind. Tom says that is what was asked. He coils nothing into a lesson. He is finished.",
        flags: { "flags.bell.stopped": true },
        summary:
          "Tom Yorston stops ringing the Larabee's Point bell for the dead. Gail Yorston lets the quiet happen even though she thinks it turns the lake into scenery. Peter Voss is not named in the air.",
      },
      {
        id: "br.join",
        choiceId: "ch.join",
        choice: "Ring the bell once and say Peter Voss.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "Ellis takes the rope with Tom Yorston and says the name on the dock before the clapper moves. Peter Voss. Not a cousin of this landing, and still a man the Vermont air can hold. One ring at Larabee's Point. Gail Yorston hears the name and does not add a speech. The lake is not scenery for that second. Then the rope is a rope again.",
        endSpeakerId: "p.tom_yorston",
        end:
          "Tom Yorston says the ring was enough. He does not recruit Rennet into a weekly office. Gail Yorston looks satisfied that the quiet did not win by default. Peter Voss has been in the air at Larabee's Point once, by a living mouth beside Tom's. The practice continues because it was joined, not because it was studied.",
        flags: { "flags.bell.joined": true },
        summary:
          "Ellis rang the Larabee bell once with Tom Yorston and said Peter Voss on the dock. Gail allowed the sound. The practice was joined for a named dead man, not turned into a study.",
      },
      {
        id: "br.move",
        choiceId: "ch.move",
        choice: "Move the bell off the landing into the kitchen.",
        middleSpeakerId: "p.gail_yorston",
        middle:
          "Gail Yorston says the kitchen, and Tom Yorston unhooks the bell on the dock as the decision, not as a haul Ellis must finish later. Larabee's Point loses the outdoor ring. The kitchen will have it. She says quiet on the landing will risk scenery, and indoors the names can still be struck where supper is honest. The act is done where the rope was.",
        endSpeakerId: "p.tom_yorston",
        end:
          "The bell is off the landing. Tom Yorston states it like a finished chore. Gail Yorston's kitchen at Larabee's Point is where the dead get rung now, including Peter Voss if Tom still means him. Nobody is sent down a path with a treasure. The dock is bare of the practice. The move was decided and done in the same minute.",
        flags: { "flags.bell.moved": true },
        summary:
          "The bell leaves the Larabee's Point landing for Gail Yorston's kitchen by a decision finished on the dock. Tom Yorston accepts the move. The dead are not rung over open water anymore.",
      },
    ],
    alt: {
      npcId: "p.tom_yorston",
      surrogateId: "p.gail_yorston",
      resolution:
        "Tom Yorston is dead and the rope has no regular hand. Gail Yorston will either stop the Larabee practice or take the bell into the kitchen. She will not pretend the lake is only scenery while she decides.",
      opening: {
        speakerId: "p.gail_yorston",
        text:
          "Tom is not here to ring. I am Gail Yorston. The bell is still at Larabee's Point, and Peter Voss is still one of the dead Tom put in the air, cousin or not. If I leave it, quiet starts, and quiet pretends the lake is scenery. Stop the practice, or we move the bell into the kitchen now, on this dock, as a finished thing.",
      },
      branches: [
        {
          id: "br.stop.tom",
          choiceId: "ch.stop.tom",
          choice: "Stop the bell now that Tom is gone.",
          endSpeakerId: "p.gail_yorston",
          end:
            "Gail Yorston ties the rope off and says the practice is stopped. Larabee's Point goes quiet. She knows what she thinks quiet does to a lake, and she chooses it anyway because Tom Yorston is not alive to mean the sound. Peter Voss will not be rung by a widow's imitation. The dock keeps a still bell. She can live with the scenery risk.",
          flags: { "flags.bell.stopped": true },
          summary:
            "Gail Yorston stops the Larabee bell after Tom's death. She accepts the quiet she distrusts rather than counterfeit his ringing. Peter Voss is not sounded by habit.",
        },
        {
          id: "br.move.tom",
          choiceId: "ch.move.tom",
          choice: "Take the bell into the kitchen from the dock.",
          endSpeakerId: "p.gail_yorston",
          end:
            "Gail Yorston has the bell unhooked before the sentence cools. The move into the Larabee kitchen is done from the dock, not left as a chore. Tom Yorston's outdoor roll of the dead, Peter Voss included, becomes an indoor strike she can still refuse to call scenery. The landing itself goes quiet on purpose, with the metal relocated.",
          flags: { "flags.bell.moved": true },
          summary:
            "With Tom gone, Gail moves the bell from the Larabee landing into the kitchen as a dock decision. The practice leaves the open shore. She does not leave the dead in a view.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.gail_yorston",
        surrogateId: "p.tom_yorston",
        resolution:
          "Gail Yorston is dead, so the kitchen reason has no speaker of its own. Tom Yorston will either stop ringing or ring once with Ellis for a name said at Larabee's Point. He will not relocate a bell into an empty kindness.",
        opening: {
          speakerId: "p.tom_yorston",
          text:
            "Gail is not here to let me. I am Tom Yorston. The bell is on the Larabee's Point dock and the lake will turn into scenery if I stop, which is what she hated. Peter Voss is not my cousin and I have rung him. Stop the practice, or take the rope with me and say a name. I will not move her bell into a kitchen she is not in.",
        },
        branches: [
          {
            id: "br.stop.gail",
            choiceId: "ch.stop.gail",
            choice: "Stop the ringing without Gail's leave.",
            endSpeakerId: "p.tom_yorston",
            end:
              "Tom Yorston drops the practice. The Larabee bell stays unring. He says Gail Yorston would have hated the quiet and she is not here to cast the other vote. Peter Voss stays out of the air. The dock becomes closer to scenery, which he names so it cannot sneak. The rope hangs. He is done.",
            flags: { "flags.bell.stopped": true },
            summary:
              "Tom Yorston stops the Larabee bell without Gail alive to defend the sound. He admits the lake gets easier to treat as scenery. The dead, Peter included, are not rung.",
          },
          {
            id: "br.join.gail",
            choiceId: "ch.join.gail",
            choice: "Ring once with him for Peter Voss.",
            endSpeakerId: "p.tom_yorston",
            end:
              "Tom Yorston rings once after Peter Voss is said on the dock. Gail Yorston cannot nod from the doorway, so the joining stands without her permission and without her objection. Larabee's Point gets one name in the air. Tom does not expand it into a new religion of the ferry. He says that was the ask. The rope goes still.",
            flags: { "flags.bell.joined": true },
            summary:
              "Ellis and Tom Yorston ring Peter Voss once at Larabee's Point after Gail is gone. The practice is joined for a single named dead man. The bell stays on the dock.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "token",
        "reward.bell.rope",
        "The Larabee's Point rope was stopped, pulled once for Peter Voss, or taken with the bell off the open dock.",
      ),
      reward(
        "stance",
        "reward.bell.quiet",
        "Ellis chose whether quiet at the landing may pretend the lake is scenery, with Tom and Gail's practice ended, joined, or moved indoors.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies on the Larabee dock before the rope is judged. The bell stays where Tom Yorston left it. Gail Yorston does not get a last instruction. Peter Voss is neither newly rung nor struck from the habit by this death.",
      unresolved:
        "The next body finds the bell still at the landing unless someone else moved it. No finished stop, joining, or kitchen move rides forward. The rope remains Tom's unfinished gesture.",
      resolved:
        "If the bell was already stopped, rung once with a name, or moved into the kitchen, that dock fact holds. A later wearing does not put the rope back in Tom's hand to restage it.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.apple_crate",
    title: "The Unowned Crate",
    eras: ["E2"],
    locationId: "loc.addison.chimney_point",
    characters: ["p.lena_voss"],
    summary:
      "In 1980 a crate of Harrow apples sits on the Vermont landing at Chimney Point with a bill of sale that uses the county stake as if the south block were not Harrow. Lena Voss will log a crate and will not log a haunting. Louis Pell can destroy the bill, honor it, or set it aside for Nell without leaving.",
    discovery:
      "The slats smell like a cold orchard and the paper on them is trying to be a county fact. Lena has the log open and her patience limited to objects. The south block's stake is being used as a seller's manners. She will not haunt the page.",
    implications:
      "The bill is destroyed, honored as a sale, or set aside for Nell Harrow by a decision that never leaves Chimney Point. Lena logs fruit or a sale. She does not log a ghost of the stake. The crate's ownership stops being a shrug.",
    steps: [
      "Stand at the Chimney Point landing in 1980 beside the crate of Harrow apples and its bill.",
      "Read that the bill uses the county stake as if the south block were not Harrow land.",
      "Destroy the bill, honor it as a sale, or set it aside for Nell Harrow without leaving the landing.",
    ],
    opening: {
      speakerId: "p.lena_voss",
      text:
        "I can log a crate. I cannot log a haunting. I am Lena Voss, and this is the Vermont landing at Chimney Point. The apples are Harrow apples. The bill of sale talks like the county stake owns the south block and the Harrows do not. You are Louis Pell today. Destroy the bill here, honor it as a sale, or set it aside for Nell Harrow. We are not walking it anywhere.",
      variant: {
        when: { flaw: "keeps_a_second_copy" },
        text:
          "Lena Voss sees Louis Pell wanting a second paper so nobody has to destroy or honor the first. The Harrow crate is on the Chimney Point landing. The bill already misuses the county stake against the south block. She says a copy is how a haunting gets stationery. Destroy it, honor it, or set this one sheet aside for Nell. No extra page.",
      },
    },
    branches: [
      {
        id: "br.destroy",
        choiceId: "ch.destroy",
        choice: "Destroy the bill of sale on the landing.",
        middleSpeakerId: "speaker.ellis",
        middle:
          "Ellis tears the bill on the Chimney Point landing, in Louis Pell's hands, where Lena Voss can see the pieces. The county stake does not get to sell the south block by stationery. The Harrow apples remain a crate, not a haunting. Nell Harrow is not handed a puzzle. The paper is dead on the Vermont shore before it can become a second record.",
        endSpeakerId: "p.lena_voss",
        end:
          "Lena Voss logs a crate and does not log a bill. She says the south block is not transferred by a lie she watched get torn up. Chimney Point keeps the apples as objects until a true owner speaks. The stake stays a stake, not a vendor. Louis has destroyed the paper here. She will not haunted-footnote the log.",
        flags: { "flags.apples.bill_destroyed": true },
        summary:
          "The false bill on the Harrow apple crate is destroyed at Chimney Point. Lena Voss logs a crate and refuses a haunting. The county stake is not allowed to act like a seller of the south block.",
      },
      {
        id: "br.honor",
        choiceId: "ch.honor",
        choice: "Honor the bill as a real sale.",
        middleSpeakerId: "p.lena_voss",
        middle:
          "Lena Voss reads the bill again with a harder mouth. If Louis Pell says it is a sale, Chimney Point will log a sale. She will write the crate of Harrow apples as sold under the paper in front of her, even though the paper uses the county stake as if the south block were not Harrow. She will not add a ghost note to rescue anyone's feelings.",
        endSpeakerId: "p.lena_voss",
        end:
          "The bill is honored. Lena Voss enters the sale in the landing log and says the words she hates: sold as written. The Vermont shore at Chimney Point now treats the crate as transferred. Nell Harrow is not secretly reserved a veto. The stake's misuse is inside a record Lena agreed to keep plain. She logs the sale. She does not log a haunting.",
        flags: { "flags.apples.bill_honored": true },
        summary:
          "Lena Voss honors the bill and logs the Harrow apples as a sale at Chimney Point. The county stake's claim on the south block is accepted as paper, not decorated into a ghost story.",
      },
      {
        id: "br.nell",
        choiceId: "ch.nell",
        choice: "Set the bill aside for Nell, still here.",
        middleSpeakerId: "p.lena_voss",
        middle:
          "Lena Voss slides the bill off the crate and names Nell Harrow as the person it waits for. Nobody leaves the Chimney Point landing. The decision is the setting aside. The apples stay Harrow apples in the log as a crate, not as a finished sale and not as a torn lie. She says Nell can hate the stake language herself. Lena will not pre-hate it into ash or into honor.",
        endSpeakerId: "p.lena_voss",
        end:
          "The bill sits aside for Nell Harrow, unhonored and undestroyed, on the Vermont landing. Lena Voss has logged a crate and a held paper. Louis Pell is not dispatched down the county. Chimney Point is where the choice ended. The south block's stake is a problem Nell can read, not a haunting Lena agreed to enter.",
        flags: { "flags.apples.bill_to_nell": true },
        summary:
          "The bill is set aside for Nell Harrow without anyone leaving Chimney Point. Lena logs the crate and the hold. The sale is neither honored nor destroyed.",
      },
    ],
    alt: {
      npcId: "p.lena_voss",
      surrogateId: "p.cal_voss",
      resolution:
        "Lena Voss is dead and the log has fallen back to Cal Voss, who will not keep a maybe. At Chimney Point he will destroy the bill or honor it as a sale. He will not log a haunting of the Harrow stake.",
      opening: {
        speakerId: "p.cal_voss",
        text:
          "Lena is not here to keep the log this tidy. I am Cal Voss. There is a crate of Harrow apples on the Vermont landing at Chimney Point, and the bill uses the county stake as if the south block were not theirs. I will not log a haunting and I will not set a riddle aside. Destroy the bill or honor the sale. Say which.",
      },
      branches: [
        {
          id: "br.destroy.lena",
          choiceId: "ch.destroy.lena",
          choice: "Destroy the bill in front of Cal.",
          endSpeakerId: "p.cal_voss",
          end:
            "Cal Voss watches the bill come apart and logs a crate only. Chimney Point does not inherit a ghost of the county stake. The Harrow apples sit untransferred. He says Lena would have wanted the object clean, and he can do that much without her. The south block is not sold by shreds. He is too old to enjoy the tearing. He allows it.",
          flags: { "flags.apples.bill_destroyed": true },
          summary:
            "Cal Voss, keeping the log in Lena's absence, lets the bill be destroyed at Chimney Point. He records a crate of Harrow apples and refuses to record a haunting.",
        },
        {
          id: "br.honor.lena",
          choiceId: "ch.honor.lena",
          choice: "Honor the bill as the sale written.",
          endSpeakerId: "p.cal_voss",
          end:
            "Cal Voss honors the paper because he was told it was a sale, not because he likes the stake. The Chimney Point log gets the crate of Harrow apples as transferred. He will not footnote a haunting to comfort the south block. Nell is not reserved a whisper. The Vermont landing keeps an ugly true line if the bill is taken as true.",
          flags: { "flags.apples.bill_honored": true },
          summary:
            "With Lena gone, Cal Voss logs the bill as a real sale of the Harrow apples. He does not soften the county stake into folklore. The landing record is plain and hard.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "reward.apples.bill",
        "The Chimney Point landing has a record of the Harrow crate's bill as destroyed, honored, or held for Nell Harrow.",
      ),
      reward(
        "knowledge",
        "reward.apples.crate",
        "Ellis knows Lena Voss will log apples and will not log a haunting when a bill misuses the county stake against the south block.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies on the Vermont landing before the bill is touched. The crate of Harrow apples begins to rot at Chimney Point. The paper goes unread. Lena Voss is left with an object and no instruction, and she will not invent a haunting to finish it.",
      unresolved:
        "The next body inherits a rotted chance. The bill was never destroyed, honored, or set aside for Nell. The south block's stake remains a rumor on a landing that did not get a decision.",
      resolved:
        "If the bill was already destroyed, honored, or held for Nell, the landing keeps that record. A later wearing does not unread it in order to haunt the crate differently.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.night_wheel",
    title: "The Night Wheel",
    eras: ["E0"],
    locationId: "loc.weybridge.pulp_mill",
    characters: ["p.ansel_demerritt", "p.eli_demerritt"],
    summary:
      "Ansel Demerritt wants the Weybridge wheel run at night to keep a contract. By morning Henry March's milk in Waltham will show it. Eli will have to pack like a man if the truth is said. Clarice must write the night or become a neat liar. The pin is on the left. This is not Ivo's speech repeated.",
    discovery:
      "The lower gate at the pulp mill is already set for a dark run. Ansel talks to the wheel as a witness. Eli is young and awake past his own morning. The left-hand pin is the fact under their hands, not a relic Ellis gets to preach.",
    implications:
      "Either the Waltham meadow is told and Eli leaves because the truth was said, or the mill's counsel is kept and the night stays a family fact. Clarice's book will have to match. Both mill truths are not kept together.",
    steps: [
      "Stand at the left-hand pin of the lower gate in the Weybridge pulp mill with Ansel and Eli.",
      "Hear Ansel demand the night run for the contract, and hear Eli say he will pack if the meadow is told.",
      "Tell Henry March's meadow the truth, or keep the mill's counsel, and do not invent a rinsing third way.",
    ],
    opening: {
      speakerId: "p.ansel_demerritt",
      text:
        "The pin is on the left. I am Ansel Demerritt. If this Weybridge wheel runs tonight, Henry March's milk in Waltham shows it by morning. Tell the meadow and you spend my contract and my son's place. Keep counsel and you stand here and be useful. Eli Demerritt will have to pack like a man if you talk. Clarice must write the night or become a neat liar. Do not give me Ivo's speech.",
      variant: {
        when: { flaw: "cannot_leave_a_gate" },
        text:
          "Ansel Demerritt sees the old trouble in Rennet's hands: a gate that will not be left half shut. The Weybridge pin is on the left, and it is not an invitation to finish 1938 out loud. Eli Demerritt is listening for a reason to pack. Clarice's book is waiting. Tell the Waltham meadow or keep the counsel. Do not complete a wound for show.",
      },
    },
    branches: [
      {
        id: "br.tell",
        choiceId: "ch.tell",
        choice: "Tell the meadow and let Eli pack.",
        middleSpeakerId: "p.eli_demerritt",
        middle:
          "Eli Demerritt says his own name so he can pack like a man and not like a scandal. The Weybridge wheel will not be his night. Henry March's meadow will hear the hours. He looks at the left pin once and does not touch it. Clarice Demerritt will have to write the night as a night, he says, or her neatness will be a lie he refuses to help.",
        endSpeakerId: "p.ansel_demerritt",
        end:
          "Ansel Demerritt hears the meadow chosen and does not offer a cleaner third. The contract takes the hit. Eli is leaving because the truth was said at this gate. Clarice must write what happened. Ellis has stood at Ansel's pin and did not repeat Ivo Perch's certification. The downstream telling is the act. The counsel is broken on purpose.",
        flags: {
          "flags.mill.downstream_told": true,
          "flags.mill.eli_left": true,
          "flags.met.ansel": true,
        },
        summary:
          "The night wheel is told to the downstream meadow. Eli Demerritt leaves the Weybridge gate because the truth was said. Ansel is met. Clarice is left to write the night instead of a neat lie.",
      },
      {
        id: "br.counsel",
        choiceId: "ch.counsel",
        choice: "Keep the mill's counsel at the pin.",
        middleSpeakerId: "p.ansel_demerritt",
        middle:
          "Ansel Demerritt takes the counsel as usefulness and sets his left hand near the pin without inviting Rennet's. The Weybridge wheel can run. Henry March's morning is not given a sentence. Eli Demerritt stays, which is a schedule and not a destiny. Ansel says Clarice will have to write the night or smear her book into a lie. He will not do that writing for her.",
        endSpeakerId: "p.eli_demerritt",
        end:
          "Eli Demerritt says he is still here, then, and the milk can taste like milk to anyone who is not told. He does not pack. The Waltham meadow is not informed. Ansel Demerritt has his contract and his witness at the left pin. Ellis met him and kept the mill's counsel. Clarice's neatness is now her problem, named and not solved by a speech.",
        flags: { "flags.mill.counsel_kept": true, "flags.met.ansel": true },
        summary:
          "Ellis keeps the Demerritt counsel. The Weybridge night wheel is not told to Henry March. Eli stays. Ansel has been met at the left pin, and Clarice must still face her book.",
      },
    ],
    alt: {
      npcId: "p.ansel_demerritt",
      surrogateId: "p.clarice_demerritt",
      resolution:
        "Ansel Demerritt is dead. Clarice Demerritt is the wage book that remains, but she is not called in to speak a third scene. Eli Demerritt stands at the left pin and will either tell the meadow and pack, or keep a counsel his father can no longer defend.",
      opening: {
        speakerId: "p.eli_demerritt",
        text:
          "Father is not here to forbid a third way. I am Eli Demerritt. The pin is still on the left at this Weybridge gate. If we run tonight, Henry March's milk shows it. Clarice will have to write the night or turn neat and false, and I will not put her in the doorway to say it for me. Tell the meadow and I pack. Keep the counsel and I stay. No old speech.",
      },
      branches: [
        {
          id: "br.tell.ansel",
          choiceId: "ch.tell.ansel",
          choice: "Tell the meadow so Eli can leave.",
          endSpeakerId: "p.eli_demerritt",
          end:
            "Eli Demerritt says the meadow gets the truth and he gets to pack like a man. The Weybridge wheel loses him. Clarice Demerritt's book will have a night in it if she is honest, and he has said so without dragging her out as a voice. Ansel is not alive to rage. The downstream telling stands. The left pin is unpreached.",
          flags: {
            "flags.mill.downstream_told": true,
            "flags.mill.eli_left": true,
            "flags.met.ansel": true,
          },
          summary:
            "With Ansel dead, Eli himself sends the night wheel's truth downstream and leaves the gate. Clarice is named as the writer, not used as a speaker. The counsel does not hold.",
        },
        {
          id: "br.counsel.ansel",
          choiceId: "ch.counsel.ansel",
          choice: "Keep counsel and stay at the wheel.",
          endSpeakerId: "p.eli_demerritt",
          end:
            "Eli Demerritt keeps the counsel and stays. Henry March will taste a morning nobody explained. The Weybridge pin remains a family fact. Clarice must still write the night or lie neatly, and Eli says that burden without making her perform it. Ansel cannot call it usefulness. Eli calls it staying. He does not repeat a dead surveyor's mercy.",
          flags: { "flags.mill.counsel_kept": true, "flags.met.ansel": true },
          summary:
            "Eli keeps the mill's counsel after Ansel's death and stays at the Weybridge wheel. The meadow is not told. Clarice's ink is acknowledged and not spoken by her.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.eli_demerritt",
        surrogateId: "p.clarice_demerritt",
        resolution:
          "Eli Demerritt is already gone from the living gate, so he cannot pack. Ansel Demerritt still chooses whether Henry March's meadow hears the night wheel. Clarice is the book in the background, not a speaker brought on to launder it.",
        opening: {
          speakerId: "p.ansel_demerritt",
          text:
            "Eli is not here to pack or to stay. I am Ansel Demerritt. The left pin at the Weybridge mill is mine to point at, not yours to sermonize. A night run still shows in Henry March's milk. Clarice will write it or she will lie with a tidy hand. I will not call her out here to be my better self. Tell the meadow or keep the counsel.",
        },
        branches: [
          {
            id: "br.tell.eli",
            choiceId: "ch.tell.eli",
            choice: "Tell the meadow without Eli to send.",
            endSpeakerId: "p.ansel_demerritt",
            end:
              "Ansel Demerritt lets the downstream truth go out. There is no Eli in the race to leave like a man, so the telling does not pretend that departure. The Weybridge contract takes the stain anyway. Clarice Demerritt must write a night that happened. Ansel says do not add Ivo Perch's late mercy on top. The meadow is told. That is the whole cut.",
            flags: { "flags.mill.downstream_told": true, "flags.met.ansel": true },
            summary:
              "Ansel tells the meadow the night wheel with Eli already dead and unable to pack. Counsel breaks. Clarice is left the writing. No second mill flag is piled on to invent Eli's exit.",
          },
          {
            id: "br.counsel.eli",
            choiceId: "ch.counsel.eli",
            choice: "Keep the counsel with Eli already gone.",
            endSpeakerId: "p.ansel_demerritt",
            end:
              "Ansel Demerritt keeps the counsel. The Waltham milk will complain without a named cause. Eli cannot be saved by silence because Eli is not in the mill. Clarice still has to write or lie. Ansel puts his left hand near the pin and tells Rennet not to finish an older gate for him. The family fact holds. The meadow stays uninformed.",
            flags: { "flags.mill.counsel_kept": true, "flags.met.ansel": true },
            summary:
              "Ansel keeps the mill's counsel though Eli is already dead. The night wheel is not told downstream. Clarice's choice to write or lie is named and not performed by her.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "record",
        "reward.wheel.hours",
        "The Weybridge night is either a downstream fact in Henry March's morning or a counsel the Demerritt wheel kept off the meadow's page.",
      ),
      reward(
        "stance",
        "reward.wheel.pin",
        "Ellis stood at the left-hand pin and chose the meadow or the contract without repeating Ivo's certification as a speech.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies at the Weybridge pin before the meadow is told or the counsel kept. Ansel Demerritt does not get a third rinsing, and Eli Demerritt is not given a packing order. The night wheel was seen and not answered.",
      unresolved:
        "The next body inherits an unanswered wheel. Henry March's milk may show a night nobody claimed. Clarice's book is uninstructed by Ellis. The mill stays unresolved because death took the mouth that was supposed to choose.",
      resolved:
        "If the meadow was already told or the counsel already kept, that single mill fact stands. A later body does not set the other truth on top of it and call the pin rinsed.",
      carry: [],
      lose: [],
      sets: { "flags.mill.unresolved": true },
    }),
  }),

  standalone({
    id: "q.flour_and_marble",
    title: "Flour and Marble",
    eras: ["E0"],
    locationId: "loc.middlebury.marble_works",
    characters: ["p.agnes_holt"],
    summary:
      "Agnes Holt lives above a damp room in the Middlebury Marble Works. When the race opens at night her floor sweats and her boy coughs. She wants the damp on the third step surveyed, not the proud wheel. The race hour goes to her floor or stays with the wheel. Ansel is not called in to speak.",
    discovery:
      "The third step above the race is dark at the edges and damp in the middle of a dry evening. Agnes talks about rent, dust, and a cough. She is not a figure for marble. She is a tenant who can point at a board.",
    implications:
      "The night hour of the race is either given to Agnes Holt's floor or kept with the wheel. The third step becomes a surveyed fact or stays a private wetness. No proud machine gets to be the only mouth.",
    steps: [
      "Climb to Agnes Holt's third step above the Marble Works race and feel the damp in the board.",
      "Hear that a night opening sweats her floor and starts her boy's cough, and that she wants that surveyed.",
      "Give the race hour to her floor, or keep it with the wheel, without calling Ansel up to argue.",
    ],
    opening: {
      speakerId: "p.agnes_holt",
      text:
        "When they open the race at night, this floor sweats and my boy coughs. I am Agnes Holt. You are on the third step of my stair in the Marble Works, not on a proud wheel. Survey the damp. I do not need Ansel Demerritt in the doorway to call it a contract. Give the hour to this floor or keep it with the wheel. Say it here, where the water actually arrives.",
      variant: {
        when: { ideal: "water_has_its_level" },
        text:
          "Agnes Holt watches Rennet Moss respect the level of the water more than the pride of the machine, and she wants that respect aimed at a step. The Marble Works race will open or it will not. Her floor in Middlebury sweats either way it is told. The boy coughs. Give the hour to the tenant or keep it on the wheel. Do not admire the stone.",
      },
    },
    branches: [
      {
        id: "br.floor",
        choiceId: "ch.floor",
        choice: "Give the race hour to Agnes's floor.",
        middleSpeakerId: "p.agnes_holt",
        middle:
          "Agnes Holt puts her palm on the third step and says this is the survey, then. The Marble Works race does not get the night hour. Her floor stops being a side effect. The boy's cough is not a mood the wheel may outvote. She does not ask Ellis to drag Ansel Demerritt up the stair to be shamed. The hour is given. The damp is the witness.",
        endSpeakerId: "p.agnes_holt",
        end:
          "The race hour belongs to the tenant. Agnes Holt says it in the stairwell so the Marble Works cannot rewrite it as a mechanical necessity she failed to understand. Middlebury still has a wheel. It does not have this night. The third step is the place that was surveyed. She will remember who stood on it. She does not offer gratitude as rent.",
        flags: { "flags.marble.water_to_tenant": true },
        summary:
          "The night hour of the Marble Works race is given to Agnes Holt's floor. The third step is surveyed instead of the proud wheel. Her boy's cough is treated as the reason, not the poetry.",
      },
      {
        id: "br.wheel",
        choiceId: "ch.wheel",
        choice: "Keep the race hour with the wheel.",
        middleSpeakerId: "p.agnes_holt",
        middle:
          "Agnes Holt hears the hour stay with the wheel and takes her hand off the step as if the board had lied. The Marble Works race will open at night. Her floor will sweat. The boy will cough. She says she asked for a survey of the damp and got a preference for the machine. Ansel is not summoned to gloat. She will not give him the scene.",
        endSpeakerId: "p.agnes_holt",
        end:
          "The wheel keeps the hour. Agnes Holt states the consequence without a speech about marble's dignity. The third step in the Marble Works stays wet and unofficial. Ellis chose the race. She will pay her rent and hear the cough and know the survey stood on her stair and sided elsewhere. That is the record she is left holding in her own mouth.",
        flags: { "flags.marble.water_to_wheel": true },
        summary:
          "The race hour stays with the wheel. Agnes Holt's damp third step in the Marble Works is seen and not given the night. The proud machine keeps the water. Ansel never speaks.",
      },
    ],
    alt: {
      npcId: "p.agnes_holt",
      surrogateId: "p.marie_rouleau",
      resolution:
        "Agnes Holt is dead and the stair still sweats. Marie Rouleau, who knows a night kitchen's version of other people's hours, stands on the third step and will give the race to the floor or leave it on the wheel.",
      opening: {
        speakerId: "p.marie_rouleau",
        text:
          "Agnes is not on this stair. I am Marie Rouleau, and I know what a night hour costs a room that is trying to sleep. The Marble Works floor still sweats when the race opens, and the boy still coughs in a room she paid for. Do not parade the proud wheel in here as a guest. Give the hour to this third step or keep it with the machine.",
      },
      branches: [
        {
          id: "br.floor.agnes",
          choiceId: "ch.floor.agnes",
          choice: "Give the hour to the damp step.",
          endSpeakerId: "p.marie_rouleau",
          end:
            "Marie Rouleau gives the night to the third step and not to the wheel. The Marble Works race can be proud in daylight. Agnes Holt is not alive to hear the cough ease, so Marie says the ease anyway, as a schedule, not as a memorial. The tenant's floor gets the hour. She will not let the stone have the last word.",
          flags: { "flags.marble.water_to_tenant": true },
          summary:
            "Marie Rouleau assigns the Marble Works night hour to Agnes's floor after Agnes is gone. The damp step outranks the wheel. The decision is a schedule, not a eulogy.",
        },
        {
          id: "br.wheel.agnes",
          choiceId: "ch.wheel.agnes",
          choice: "Leave the hour on the wheel.",
          endSpeakerId: "p.marie_rouleau",
          end:
            "Marie Rouleau leaves the hour with the wheel and does not pretend Agnes Holt would have blessed it. The third step in the Marble Works stays wet. The cough keeps its nights. She says a kitchen woman can recognize a theft of sleep without stopping every theft. The machine keeps the water. The stair stays a private dampness.",
          flags: { "flags.marble.water_to_wheel": true },
          summary:
            "With Agnes dead, Marie still lets the wheel keep the race hour. The Marble Works stair remains wet and unpromoted. She names the cost and does not reverse it.",
        },
      ],
    },
    rewards: [
      reward(
        "access",
        "reward.marble.step",
        "Agnes Holt's third step in the Marble Works is a place the race hour can be spoken, not only the wheel below it.",
      ),
      reward(
        "knowledge",
        "reward.marble.damp",
        "Ellis knows a night opening of the Middlebury race sweats the tenant's floor and starts the boy's cough.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies on the third step before the hour is given or kept. Agnes Holt's stair stays wet and unlogged. The Marble Works wheel is not instructed. The boy's cough has no survey attached to it by this death.",
      unresolved:
        "The next body finds the damp still unofficial. Nobody recorded whether the race night belonged to the tenant or the wheel. The Marble Works keeps a wet step and an unanswered hour.",
      resolved:
        "If the hour was already given to the floor or kept with the wheel, that choice stays logged in the living memory of the stair. A later body does not re-survey it into a softer machine.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.eel_passage",
    title: "The Eel Passage",
    eras: ["E2"],
    locationId: "loc.weybridge.pulp_mill",
    characters: ["p.ruth_demerritt"],
    summary:
      "In 1980 Ruth Demerritt is the millwright at the Weybridge gate, not Ansel. Cutting an eel passage costs her head of water. Keeping the head costs the creek a generation. She is not Ellis's penance. Louis Pell can tell her to cut or to keep. The pin stays hers.",
    discovery:
      "The gate is pinned the way Ruth pinned it. Eels are a generation in the creek, not a symbol of anyone's grandfather. She talks like a person who inherited a machine and a lawsuit and will not inherit a silence.",
    implications:
      "The Weybridge gate either spends Ruth's head of water on an eel passage or keeps the head and spends the creek's next generation. The loss is said out loud. It is not filed as Ellis's apology for an older gate.",
    steps: [
      "Meet Ruth Demerritt at the Weybridge pulp mill gate in 1980 and look at the pin she set.",
      "Hear the head of water she would lose to an eel passage and the generation the creek would lose without one.",
      "Tell her to cut the passage or keep the head, and do not offer Louis Pell's hands as penance.",
    ],
    opening: {
      speakerId: "p.ruth_demerritt",
      text:
        "I am Ruth Demerritt, not Ansel, and not your penance. This is the Weybridge gate in 1980, and you are Louis Pell with empty hands. An eel passage costs me head. A kept head costs the creek a generation. I will say the loss out loud either way. Choose the cut or the head. Do not touch the pin and call it inheritance.",
      variant: {
        when: { ideal: "the_living_first" },
        text:
          "Ruth Demerritt hears Louis Pell lean toward whatever is alive in the creek and she stops it from becoming a sermon. The Weybridge mill still needs head. The eels are a generation, not a moral costume. She says the living are on both sides of the gate, including her. Cut the passage or keep the head. Leave the penance in your pocket.",
      },
    },
    branches: [
      {
        id: "br.cut",
        choiceId: "ch.cut",
        choice: "Cut the eel passage and spend the head.",
        middleSpeakerId: "p.ruth_demerritt",
        middle:
          "Ruth Demerritt names the loss before she moves the gate. Head of water, gone to an eel passage, at the Weybridge mill, by her hand and not by Louis Pell's guilt. The creek gets a generation's road. The wheel gets less. She says it out loud so it cannot return later as Ellis's private apology. The pin will sit differently because she says so.",
        endSpeakerId: "p.ruth_demerritt",
        end:
          "The passage is cut. Ruth Demerritt states the new lack of head as a millwright's fact, not as a redemption. Weybridge keeps a wheel that gives something up. The eels are not thanked and not mythologized. Louis does not get to have fixed a grandfather by sponsoring a fish. The loss was said. The gate is hers, altered.",
        flags: { "flags.eel.passage_cut": true },
        summary:
          "Ruth Demerritt cuts an eel passage at the Weybridge gate and spends her head of water. She says the loss aloud. The act is not accepted as Ellis's penance for an older pin.",
      },
      {
        id: "br.head",
        choiceId: "ch.head",
        choice: "Keep the head and spend the generation.",
        middleSpeakerId: "p.ruth_demerritt",
        middle:
          "Ruth Demerritt keeps the head and does not hide the other price. The creek loses a generation of eels. The Weybridge wheel keeps its water. She says that sentence without asking Louis Pell to look ashamed enough to share it. Ansel is not the author of this refusal. She is. The pin stays where she set it.",
        endSpeakerId: "p.ruth_demerritt",
        end:
          "Head kept. Ruth Demerritt repeats it so the mill cannot call the choice weather. The eel passage is not cut. A generation in the creek is the cost she agreed to say at the Weybridge gate. Ellis is not forgiven and not condemned into a role. Louis's hands stay off the pin. The record is her refusal, spoken once and enough.",
        flags: { "flags.eel.head_kept": true },
        summary:
          "Ruth keeps the head of water at the Weybridge mill. The eel passage is not cut. She names the creek's lost generation herself and does not hand the guilt to Ellis.",
      },
    ],
    alt: {
      npcId: "p.ruth_demerritt",
      surrogateId: "p.denis_rouleau",
      resolution:
        "Ruth Demerritt is dead and the gate is still pinned as she left it. Denis Rouleau will not turn the eel choice into Ellis's penance. He will cut the passage or keep the head as a loss somebody says aloud at Weybridge.",
      opening: {
        speakerId: "p.denis_rouleau",
        text:
          "Ruth is not here to refuse being your penance. I am Denis Rouleau, and I will refuse it for the room. The Weybridge gate is pinned the way she pinned it. An eel passage still costs head. Keeping the head still costs the creek a generation. You are Louis Pell. Do not touch that pin to feel historic. Cut, or keep. Say the loss.",
      },
      branches: [
        {
          id: "br.cut.ruth",
          choiceId: "ch.cut.ruth",
          choice: "Cut the passage in Ruth's absence.",
          endSpeakerId: "p.denis_rouleau",
          end:
            "Denis Rouleau says the passage gets cut and the head gets spent. He does not dedicate it to Ruth Demerritt's memory or to Ellis's old hands. The Weybridge creek gets a road for eels. The wheel gets less water. The loss is said on the gate she pinned, by a man who will not let a surveyor wear it home as absolution.",
          flags: { "flags.eel.passage_cut": true },
          summary:
            "Denis Rouleau cuts the eel passage after Ruth is gone, and he spends the head without making it Ellis's penance. The Weybridge gate changes by a spoken loss, not by inheritance.",
        },
        {
          id: "br.head.ruth",
          choiceId: "ch.head.ruth",
          choice: "Keep the head Ruth pinned in place.",
          endSpeakerId: "p.denis_rouleau",
          end:
            "Denis Rouleau keeps the head. The eel passage stays uncut. He says the creek loses a generation and that this is not Louis Pell paying a family debt. Ruth Demerritt's pin remains the pin. Weybridge does not get a softer legend. The water stays with the wheel because someone admitted the animal cost and still chose the head.",
          flags: { "flags.eel.head_kept": true },
          summary:
            "With Ruth dead, Denis keeps the head of water at the Weybridge gate. The passage is not cut. He states the generational cost and refuses to call the choice penance.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "reward.eel.gate",
        "The 1980 Weybridge gate has a record of either an eel passage cut or a head of water kept, spoken as Ruth's loss or her surrogate's.",
      ),
      reward(
        "knowledge",
        "reward.eel.cost",
        "Ellis knows the passage spends Ruth Demerritt's head and the closed gate spends a generation of the creek, and neither is a personal absolution.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies at the Weybridge gate before the cut or the keep. The pin stays as Ruth Demerritt set it. Louis Pell's hands do not become a penance and do not become a tool. The eel passage is unchosen.",
      unresolved:
        "The next body finds Ruth's pin unrevised. No passage was cut and no head was newly justified. The creek's generation and the mill's water remain an argument Ellis did not finish.",
      resolved:
        "If the passage was already cut or the head already kept, the gate holds that loss. A later wearing does not unpin it to make Ellis feel squared with an older mill.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.strike_soup",
    title: "Strike Soup",
    eras: ["E1"],
    locationId: "loc.vergennes.night_kitchen",
    characters: ["p.marie_rouleau", "p.denis_rouleau"],
    summary:
      "A wage fight in 1966. Upstairs the Vergennes office is writing night hours out of the book. Downstairs Marie Rouleau's kitchen is eating them. Denis Rouleau says if you eat with the crew, stay for the bitter part. Ada Smollet chooses a table from the kitchen, not by running an errand.",
    discovery:
      "The night kitchen on South Water Street is loud with spoons and quiet about the office above. Marie ladles as an argument. Denis watches who will leave before the soup turns honest. The body in the doorway is Ada's, and the hours are the real wage.",
    implications:
      "Ellis is counted in the kitchen with the crew or counted with the office upstairs. The night hours stay eaten or stay erased, and the doorway decision is the whole allegiance. No second visit repairs the table.",
    steps: [
      "Enter Marie Rouleau's Vergennes night kitchen while the wage fight is still in the bowls.",
      "Hear Denis Rouleau say the crew's soup includes the bitter part, and see the office writing night hours out.",
      "Eat in the kitchen, or from the doorway choose the upstairs table, and do not come back down for comfort.",
    ],
    opening: {
      speakerId: "p.marie_rouleau",
      text:
        "Upstairs they are writing the night hours out of the book. Down here we are eating them. I am Marie Rouleau. This is my kitchen in Vergennes, and you are Ada Smollet if that is the mouth you brought. Denis Rouleau says if you eat with the crew you stay for the bitter part. Take a bowl in the room you are willing to be counted in. The doorway is as far as the other choice needs to travel.",
      variant: {
        when: { flaw: "signs_unread" },
        text:
          "Marie Rouleau sees Ada Smollet ready to sign the office's cleanliness by sitting near it. The Vergennes kitchen is eating the night hours the upstairs book is erasing. Denis Rouleau will not let a signature happen by accident. Eat here and stay bitter, or say the upstairs table from this doorway. Do not drift into a cleaner page.",
      },
    },
    branches: [
      {
        id: "br.kitchen",
        choiceId: "ch.kitchen",
        choice: "Eat in the kitchen and stay for the bitter part.",
        middleSpeakerId: "p.denis_rouleau",
        middle:
          "Denis Rouleau puts the bitter part in front of Ada Smollet before the bread can make a conscience. The Vergennes crew is eating hours the office is writing out. He says staying is the point. Marie Rouleau ladles like a count. If Ellis wanted the good feeling without the aftertaste, the kitchen is the wrong room. He watches to see the spoon come back up.",
        endSpeakerId: "p.marie_rouleau",
        end:
          "Marie Rouleau counts Ada in the kitchen. The night hours are eaten where they are lived, not erased upstairs. Denis Rouleau got the bitter part witnessed. The doorway was not used as an exit. Vergennes has one more body on the crew's side of the wage fight, and the bowl is not a souvenir. It is the table Ellis claimed.",
        flags: { "flags.soup.kitchen": true },
        summary:
          "Ellis eats in Marie Rouleau's Vergennes kitchen and stays for the bitter part Denis required. The night hours are counted with the crew. The office does not get this bowl.",
      },
      {
        id: "br.upstairs",
        choiceId: "ch.upstairs",
        choice: "From the doorway, choose the office table.",
        middleSpeakerId: "p.denis_rouleau",
        middle:
          "Denis Rouleau hears the upstairs choice spoken from the kitchen doorway and blocks the sentimental return in advance. Vergennes does not need Ada Smollet to climb as an errand inside this scene. The decision is the sentence. He says do not come down after for the good conscience. Marie Rouleau holds the ladle still. The office is writing the night hours out. That is the table just chosen.",
        endSpeakerId: "p.marie_rouleau",
        end:
          "Marie Rouleau says the office, then, and turns the next bowl away from the doorway. Ellis is counted upstairs with the people erasing the night hours. The kitchen does not keep a chair warm. Denis Rouleau's warning stands. The wage fight has Ada's absence in it, decided without a trip, in the Vergennes doorway, where both rooms could hear.",
        flags: { "flags.soup.upstairs": true },
        summary:
          "From Marie's kitchen doorway Ellis chooses the upstairs office table. Denis forbids a later return for conscience. The night hours being written out are the side Ada is counted on.",
      },
    ],
    alt: {
      npcId: "p.marie_rouleau",
      surrogateId: "p.denis_rouleau",
      resolution:
        "Marie Rouleau is dead and the ladle has no owner. Denis Rouleau keeps the Vergennes kitchen open for the bitter part of the wage fight, and he will hear a doorway choice for upstairs without allowing a later rinse.",
      opening: {
        speakerId: "p.denis_rouleau",
        text:
          "Marie is not here to ladle the argument. I am Denis Rouleau. The Vergennes kitchen is still eating the night hours the office is writing out. If you sit with the crew, Ada, you stay when it turns bitter. If you want the upstairs table, say it from this doorway. Do not come back down to be forgiven by a dead woman's soup.",
      },
      branches: [
        {
          id: "br.kitchen.marie",
          choiceId: "ch.kitchen.marie",
          choice: "Sit with the crew for the bitter part.",
          endSpeakerId: "p.denis_rouleau",
          end:
            "Denis Rouleau lets Ada Smollet sit and then he does not sweeten the second half. The Vergennes crew keeps the night hours in their mouths. The office does not get this body. Marie cannot nod. Denis says the staying is the count. The bowl is claimed by the kitchen. He will remember if Ellis tries to narrate it later as a visit.",
          flags: { "flags.soup.kitchen": true },
          summary:
            "Denis seats Ellis with the Vergennes crew after Marie is gone and keeps the bitter part in the meal. The kitchen table is the wage allegiance. Upstairs does not get the bowl.",
        },
        {
          id: "br.upstairs.marie",
          choiceId: "ch.upstairs.marie",
          choice: "Choose the office aloud from the doorway.",
          endSpeakerId: "p.denis_rouleau",
          end:
            "Denis Rouleau takes the doorway sentence as final. Ada Smollet is with the office that writes the night hours out. The Vergennes kitchen does not save a bowl. Marie Rouleau is not alive to be disappointed in person, so Denis does the disappointment without theater. He says do not return. The upstairs table is the one that was chosen.",
          flags: { "flags.soup.upstairs": true },
          summary:
            "With Marie dead, Denis hears Ellis choose the upstairs office from the kitchen doorway. No errand is run. The crew's bitter part is refused, and the return is closed.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.denis_rouleau",
        surrogateId: "p.marie_rouleau",
        resolution:
          "Denis Rouleau is dead and cannot police the aftertaste. Marie Rouleau still makes Ada Smollet pick a table in the Vergennes kitchen: eat the night hours with the crew, or say the office from the doorway and lose the bowl.",
        opening: {
          speakerId: "p.marie_rouleau",
          text:
            "Denis is not here to warn you about the bitter part. I am Marie Rouleau, so I will say it shorter. This Vergennes kitchen is eating the hours upstairs is writing out. Sit and be counted with the crew, Ada Smollet, or stand in that doorway and choose the office. I will not hold a bowl for a person who wants both rooms.",
        },
        branches: [
          {
            id: "br.kitchen.denis",
            choiceId: "ch.kitchen.denis",
            choice: "Take the kitchen bowl and be counted.",
            endSpeakerId: "p.marie_rouleau",
            end:
              "Marie Rouleau puts the bowl down and leaves it bitter on purpose, since Denis is not alive to insist. Ada Smollet is counted in the Vergennes kitchen. The night hours stay in the crew's supper. The office can erase paper. It does not erase this spoon. She says the table is chosen. She means the room, not a mood.",
            flags: { "flags.soup.kitchen": true },
            summary:
              "Marie counts Ellis at the kitchen table without Denis alive to demand the bitter part. She serves it anyway. The Vergennes crew keeps the night hours in the meal.",
          },
          {
            id: "br.upstairs.denis",
            choiceId: "ch.upstairs.denis",
            choice: "Choose upstairs from the kitchen doorway.",
            endSpeakerId: "p.marie_rouleau",
            end:
              "Marie Rouleau hears the office chosen in the doorway and clears the unused bowl. There is no walk to perform. Ada Smollet is counted upstairs, where the night hours leave the book. Denis cannot forbid the return, so Marie forbids it herself. The Vergennes kitchen does not keep a conscience warm. The wage table is the one above.",
            flags: { "flags.soup.upstairs": true },
            summary:
              "Marie hears the upstairs choice from her own doorway after Denis is gone. The bowl is not held. Ellis is counted with the office writing the night hours out.",
          },
        ],
      },
    ],
    rewards: [
      reward(
        "stance",
        "reward.soup.table",
        "Ada Smollet was counted either in Marie Rouleau's kitchen with the crew or with the office upstairs, by a doorway decision.",
      ),
      reward(
        "knowledge",
        "reward.soup.hours",
        "Ellis knows the 1966 wage fight is night hours written out of the book above and eaten in the Vergennes kitchen below.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies in the Vergennes doorway before a table is claimed. Marie Rouleau clears the bowl. Denis Rouleau does not get a witness for the bitter part. No room counts Ada Smollet among its eaters.",
      unresolved:
        "The next body is not claimed by the kitchen or the office. The wage fight continues, and the night hours stay a meal or an erasure without Ellis's name attached to either.",
      resolved:
        "If a table was already chosen, the count holds. A later wearing does not sit the other seat to balance Marie's kitchen against the upstairs book.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),

  standalone({
    id: "q.clark_promotion",
    title: "Clark's Signature",
    eras: ["E3"],
    locationId: "loc.middlebury.survey_office",
    characters: ["p.clark_seaver"],
    summary:
      "In 1994 Clark Seaver wants Hannah Greer's living hand to re-sign Ivo Perch's clean certification so a Leicester culvert becomes fundable. He says moods do not move water. Willa is not in the room. This is his promotion and a smaller gate, not the whole flood book.",
    discovery:
      "The survey room off Court Street has one signature line and a culvert estimate, not a theology. Clark is smooth and specific. The clean certification is a tool he can spend on Leicester if Hannah's hand agrees.",
    implications:
      "The living hand either repeats the clean certification and the Leicester culvert becomes fundable, or the line stays refused. Clark will call a refusal a mood. The office's smaller gate is answered without a full sermon of the flood.",
    steps: [
      "Sit at the Middlebury survey table while Clark Seaver lays out Ivo's clean certification and a Leicester culvert.",
      "Hear him say Hannah Greer's living signature would move the funding, and that moods do not move water.",
      "Sign the clean line in Hannah's hand, or refuse it, without preaching the whole flood book.",
    ],
    opening: {
      speakerId: "p.clark_seaver",
      text:
        "Re-sign the clean certification in your living hand and the Leicester culvert becomes fundable. I am Clark Seaver. This is the survey office in Middlebury, and you are Hannah Greer today, not a mood from 1938. Ivo Perch's clean line is the one I need. Refuse and you are protecting a feeling. Moods do not move water. Culverts do. This is a smaller gate. Leave the whole flood out of it.",
      variant: {
        when: { ideal: "the_record_holds" },
        text:
          "Clark Seaver sees Hannah Greer treat the clean certification as the record that will have to hold. He wants that instinct spent on a Leicester culvert, here in the Middlebury survey office. He says a held record that never signs is just a delay with better posture. Sign, or refuse. Leave the old margin theology in the drawer.",
      },
    },
    branches: [
      {
        id: "br.sign",
        choiceId: "ch.sign",
        choice: "Sign the clean certification in Hannah's hand.",
        middleSpeakerId: "p.clark_seaver",
        middle:
          "Clark Seaver turns the page so the signature line is the only thing alive on it. Hannah Greer's hand is the promotion's instrument. The Leicester culvert gets a fundable sentence because the clean certification is repeated. He does not ask for a speech about Ivo Perch's mercy or failure. Middlebury's office gets a smaller gate moved by ink. He watches the hand, not the conscience.",
        endSpeakerId: "p.clark_seaver",
        end:
          "Signed. Clark Seaver says the culvert can be asked for now, which was the point. The clean certification has a living hand under Ivo's old cleanliness. Hannah Greer will be the name on the ask. He does not call it courage. He calls it water moving because a paper moved. The survey office has its promotion piece. The larger flood is not re-argued.",
        flags: { "flags.clark.signed": true },
        summary:
          "Hannah Greer's living hand re-signs the clean certification. Clark Seaver's Leicester culvert becomes fundable. The Middlebury office gets the smaller gate it asked for, without a flood-book sermon.",
      },
      {
        id: "br.refuse",
        choiceId: "ch.refuse",
        choice: "Refuse to re-sign the clean line.",
        middleSpeakerId: "p.clark_seaver",
        middle:
          "Clark Seaver hears the refusal and does not reach for the flood story to punish it. He says the Leicester culvert stays unfunded because Hannah Greer would not put a living hand on a clean line. Moods do not move water. He believes he has just watched a mood. The Middlebury table keeps a blank. He will not supply a kinder interpretation to help the office feel serious.",
        endSpeakerId: "p.clark_seaver",
        end:
          "Refused. Clark Seaver leaves the signature line blank and says he will call it fear if anyone asks, because fear is a mood and moods do not dig a culvert. The promotion does not get its paper. Hannah's hand stays off Ivo's cleanliness. The smaller gate in Leicester is not opened by this room today. He does not require the rest of the book to be angry.",
        flags: { "flags.clark.refused": true },
        summary:
          "Ellis refuses Clark Seaver's re-signature. The Leicester culvert is not fundable by Hannah's hand. Clark keeps the blank and is prepared to call the refusal fear. The flood book stays unpreached.",
      },
    ],
    alt: {
      npcId: "p.clark_seaver",
      surrogateId: "p.willa_seaver",
      resolution:
        "Clark Seaver is dead and cannot call a blank fear in person. Willa Seaver puts the same clean line on the Middlebury table and says a clean signature is how the office stays unaccountable. Hannah can still sign or refuse the smaller Leicester gate.",
      opening: {
        speakerId: "p.willa_seaver",
        text:
          "Clark is not here to say moods do not move water. I am Willa Seaver. The clean certification is on this Middlebury table, and he wanted Hannah Greer's living hand on it so a Leicester culvert could be funded. I think a clean signature is how this office stays inherited and unaccountable. Sign it if you mean that. Refuse it if you mean the blank. This is still a smaller gate.",
      },
      branches: [
        {
          id: "br.sign.clark",
          choiceId: "ch.sign.clark",
          choice: "Sign the clean line in front of Willa.",
          endSpeakerId: "p.willa_seaver",
          end:
            "Willa Seaver watches Hannah Greer sign and does not congratulate the culvert. The Leicester paper becomes fundable by a cleanliness she distrusts. The Middlebury office stays able to inherit itself. She says Clark would have called this water moving. She calls it unaccountable ink. The signature is done. She will not enlarge it into the whole flood.",
          flags: { "flags.clark.signed": true },
          summary:
            "Hannah signs the clean certification with Willa Seaver watching, after Clark is gone. The Leicester culvert can be funded. Willa names the signature as the office avoiding account, not as plumbing heroism.",
        },
        {
          id: "br.refuse.clark",
          choiceId: "ch.refuse.clark",
          choice: "Leave the signature line blank.",
          endSpeakerId: "p.willa_seaver",
          end:
            "Willa Seaver leaves the line blank with Hannah's refusal and does not let it be renamed fear in Clark Seaver's absence. The Leicester culvert stays unasked by this hand. She says a blank is not yet accountability, but a clean signature would have been the wrong certainty. The Middlebury table keeps the smaller gate shut. She files nothing pretty over the empty line.",
          flags: { "flags.clark.refused": true },
          summary:
            "Willa Seaver records Hannah's refusal without Clark alive to call it fear. The clean certification stays unsigned. The Leicester culvert is not fundable from this smaller gate.",
        },
      ],
    },
    rewards: [
      reward(
        "record",
        "reward.clark.line",
        "The Middlebury survey office has Hannah Greer's signature on the clean certification, or it has a blank Clark can call fear.",
      ),
      reward(
        "stance",
        "reward.clark.culvert",
        "Ellis answered a promotion and a Leicester culvert, a smaller gate than the flood, with a living hand or a refusal.",
      ),
    ],
    death: death({
      mid:
        "Ellis dies at the Middlebury table before Hannah Greer's hand signs or refuses. The signature line stays blank. Clark Seaver will call the blank fear. The Leicester culvert is not funded by a death, and the flood book is not given a new sermon.",
      unresolved:
        "The next body finds the clean line still unsigned and Clark's word for it already waiting. No promotion was completed. The smaller gate stays a blank that fear is allowed to explain.",
      resolved:
        "If the certification was already signed or already refused, the survey office keeps that hand's act. A later wearing does not reopen the Leicester culvert to launder Clark's promotion.",
      carry: [],
      lose: [],
      sets: {},
    }),
  }),
];
