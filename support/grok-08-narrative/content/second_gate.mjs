import { forkStage } from "./fork.mjs";
import { death, reward } from "./death.mjs";

const done = { "flags.met.ansel": true };

export const secondGate = {
  ...forkStage({
    id: "q.the_second_gate",
    title: "The Second Gate",
    locationId: "loc.weybridge.pulp_mill",
    eras: ["E1"],
    characters: ["p.ansel_demerritt", "p.eli_demerritt"],
    summary:
      "Fourteen years after the night wheel, Ellis comes back in Ada Smollet's body and finds Ansel Demerritt already changed. The gate is either rebuilt against Ellis's hands, still protecting a lie, or unknown to this face.",
    discovery:
      "The race at the Weybridge pulp mill sounds different if you knew it in 1952. Nobody sends you. The pin is still on the left, and a younger woman is counting boards without looking up.",
    prerequisites: { all: [{ flag: "flags.era.E1", eq: true }], any: [], none: [] },
    steps: [
      "Stand at the lower gate until Ansel speaks first. Do not put a hand on the pin.",
      "Hear which fourteen years he actually lived before you answer.",
      "Leave the race with one clear fact: barred, complicit again, or still a stranger.",
    ],
    rewards: [
      reward("stance", "reward.second_gate.stance", "Ansel's stance toward Ellis is fixed by the life he lived, not by a new greeting."),
      reward("knowledge", "reward.second_gate.pin", "Ellis knows whether the pin was moved to pass more water, and whether Ada is allowed to touch it."),
    ],
    death: death({
      mid: "If Ada dies at the race, Ansel finishes the shift and does not learn the new face. The next body inherits the gate as rumor only.",
      unresolved: "An unfinished visit leaves the mill's story as it was. Eli's fate stays on the flag already set in 1952, or on the default if none was.",
      resolved: "The second-gate choice persists. Ruth, counting boards, remembers which side of the race the stranger was sent to.",
    }),
    implications:
      "The millwright's second meeting decides whether the office is allowed near the pin. Later water choices with Ruth inherit a barred gate, a renewed silence, or a man who was never confessed to.",
    forkText:
      "Ada Smollet's shoes are wrong for the race and the race does not care. Ansel Demerritt is fifty-six and the wheel is not the wheel from the first season. What he says depends on whether the meadow was told.",
    forkVariant: {
      when: { flaw: "cannot_leave_a_gate" },
      text: "The latch is half across. Ada's hand moves before Ellis agrees. Ansel sees the movement and his mouth changes before any introduction.",
    },
    mode: "oneOrNone",
    partitionFlags: ["flags.mill.downstream_told", "flags.mill.counsel_kept"],
    secondLife: { npcId: "p.ansel_demerritt", era: "E1" },
    variants: [
      {
        id: "told",
        flag: "flags.mill.downstream_told",
        door: "The timber is scarred where the old wheel came off. Walk to that scar.",
        beats: [
          {
            speakerId: "p.ansel_demerritt",
            text: "Don't introduce the schoolteacher. I repinned this after you opened your mouth to March. More water goes by. Henry's milk tastes like morning and my name is on a lawsuit that is at least about the right hours. You don't get to touch the new pin with a new set of hands and call it help.",
          },
          {
            speakerId: "p.eli_demerritt",
            text: "I'm in Waltham now. I came up because Ruth said a stranger was standing too near. I'm not your tragedy and I'm not your proof. I fix pumps. I sleep. If you want a tour of the scar, ask him, not me, and then let me go back to a porch.",
          },
          {
            speakerId: "p.ansel_demerritt",
            text: "Eli left because the truth had a morning. That was the cost. The gate passes water it didn't pass. I am proud and I am not grateful. Stand off the race or ask me something that isn't forgiveness.",
          },
        ],
        endings: [
          {
            choiceId: "off",
            choice: "Step off the race and leave the pin to the man who moved it.",
            speakerId: "p.ansel_demerritt",
            text: "Good. Watch from the bank if you must watch. The next time a body of yours reaches left out of habit, Ruth has my instructions. She is not sentimental about uncles or about ghosts.",
            flags: { ...done, "flags.mill.gate_repinned": true },
            summary: "Ellis is barred from the pin. The rebuilt gate stands as Ansel's work, not a reunion.",
            branchId: "br.gate.barred",
          },
          {
            choiceId: "ask",
            choice: "Ask what the downstream meadow sounds like from this bank now.",
            speakerId: "p.ansel_demerritt",
            text: "It sounds like a man who will not drink with me and a dairy that didn't fail. You don't get to taste it for him. If you go to Waltham, go as a person who already spent the apology in 1952. I won't write you a second one.",
            flags: { ...done, "flags.mill.gate_repinned": true },
            summary: "Ansel allows the knowledge of the meadow and still forbids Ellis's hands on the pin.",
            branchId: "br.gate.meadow",
          },
        ],
      },
      {
        id: "kept",
        flag: "flags.mill.counsel_kept",
        door: "He looks at Ada and uses a dead man's name. Stay for the correction.",
        beats: [
          {
            speakerId: "p.ansel_demerritt",
            text: "Ivo— damn it. You. The new one. Fourteen years of a lawsuit with my name on it and the farmers' anger and none of the night we kept. If you came to be forgiven, the wheel doesn't do that. Put your left hand in your pocket. I have called you by a dead surveyor's name and I will not do it twice.",
          },
          {
            speakerId: "p.eli_demerritt",
            text: "I'm still here. That's the whole speech. You didn't tell them. I didn't leave. The milk tastes like milk because we say it does. Don't look at me like you're about to become honest at my expense a decade late.",
          },
          {
            speakerId: "p.clarice_demerritt",
            text: "I wrote the night as day until the book believed me. If you break it now, you don't rescue my handwriting. You make me a liar in public after I already paid to be a liar in private. Choose knowing that.",
          },
        ],
        endings: [
          {
            choiceId: "pocket",
            choice: "Keep the left hand in the pocket and leave the counsel where it is.",
            speakerId: "p.ansel_demerritt",
            text: "Then we are the same cowards with better knees. Eli stays. Clarice's book stays neat. When you die again, don't send the next one to confess what you wouldn't.",
            flags: { ...done, "flags.mill.ada_kept": true },
            summary: "Ada keeps the mill's counsel. The lie gets another fourteen years of handwriting.",
            branchId: "br.gate.kept",
          },
          {
            choiceId: "late",
            choice: "Tell the truth now, late, and let Clarice hate the timing.",
            speakerId: "p.clarice_demerritt",
            text: "Late is still a word I can write. I won't thank you. I'll correct the book in the margin and I will not let you call the margin courage. Eli decides for himself whether the wheel still wants him.",
            flags: { ...done, "flags.mill.told_late": true },
            summary: "The counsel breaks in 1966, too late to be the original mercy and early enough to mark the book.",
            branchId: "br.gate.late",
          },
        ],
      },
      {
        id: "none",
        noneOf: ["flags.mill.downstream_told", "flags.mill.counsel_kept"],
        door: "No one at this race remembers a confession. Walk up as a stranger, because you are one.",
        beats: [
          {
            speakerId: "p.ansel_demerritt",
            text: "If you're the county, the hours are posted. If you're lost, the bridge is the other way. I don't know your face and I don't owe a schoolteacher a tour of my pin. State the errand in one sentence or get off the boards.",
          },
          {
            speakerId: "p.eli_demerritt",
            text: "Father's been waiting fourteen years for a person who never came back to finish a night. He won't say that to you. I'm saying it so you don't mistake his manners for peace. We run when the contract says. The meadow complains. We outlast the complaint.",
          },
          {
            speakerId: "p.ansel_demerritt",
            text: "You can leave as a stranger. That's a clean outcome. Or you can tell me why your eyes keep finding the left side of the gate. Strangers don't do that. Liars and old hands do.",
          },
        ],
        endings: [
          {
            choiceId: "stranger",
            choice: "Leave as a stranger. Do not explain the left hand.",
            speakerId: "p.eli_demerritt",
            text: "Good. We stay a family fact. If you were someone we owed, you missed the year for it. I'm still on the wheel. Remember that when you hear otherwise in some later season.",
            flags: { ...done, "flags.mill.unresolved": true },
            summary: "Ellis never finishes the night-wheel sentence. Ansel's life goes on unconfessed.",
            branchId: "br.gate.stranger",
          },
          {
            choiceId: "left",
            choice: "Say that the left side is where Ivo's hand went, and that you are late.",
            speakerId: "p.ansel_demerritt",
            text: "Then you're not a stranger and you're not in time. I won't rebuild my gate for a sentence that missed the lawsuit's birth. Come back when you can stand the meadow's name in your mouth without shaking.",
            flags: { ...done, "flags.mill.unresolved": true },
            summary: "Ansel hears the old hand in the new body and refuses a late rebuild.",
            branchId: "br.gate.recognized",
          },
        ],
      },
    ],
    alt: {
      npcId: "p.ansel_demerritt",
      surrogateId: "p.clarice_demerritt",
      resolution:
        "If Ansel is dead, Clarice keeps the wage book and will not let a new body inherit his grudges or his pin. She finishes the accounting without pretending the man is in the room.",
      opening: {
        speakerId: "p.clarice_demerritt",
        text: "Ansel is not here to misname you. I am. The book is what survived him. If you want the pin, the answer is no, because the answer was no when he had lungs. Speak to the page.",
      },
      branches: [
        {
          id: "br.gate.clarice_page",
          choiceId: "page",
          choice: "Ask her which hours she will correct, and accept no tour.",
          endSpeakerId: "p.clarice_demerritt",
          end: "I'll correct what I can bear to see in my own hand. I won't correct the night to soothe you. Take that as the whole inheritance.",
          flags: { "flags.met.ansel": true },
          summary: "Clarice settles the second gate as a page, not a reunion.",
        },
        {
          id: "br.gate.clarice_leave",
          choiceId: "leave",
          choice: "Leave the book with her and do not ask for the pin.",
          endSpeakerId: "p.clarice_demerritt",
          end: "Then go. Ruth knows the machine. I know the lie. Between us the county is already staffed.",
          flags: { "flags.met.ansel": true },
          summary: "Ellis leaves the dead millwright's gate to his wife and his niece.",
        },
      ],
    },
    extraAlts: [
      {
        npcId: "p.eli_demerritt",
        surrogateId: "p.ruth_demerritt",
        resolution:
          "If Eli is already dead, Ruth speaks for the wheel he left or died in. She will not let Ellis use his absence as a soft story.",
        opening: {
          speakerId: "p.ruth_demerritt",
          text: "Eli isn't here. If you came to be forgiven by a man the wheel took or the meadow took, you are late twice. I count boards. Tell me if you are here to change the count.",
        },
        branches: [
          {
            id: "br.gate.ruth_count",
            choiceId: "count",
            choice: "Ask Ruth for the count and do not ask for Eli's voice.",
            endSpeakerId: "p.ruth_demerritt",
            end: "The count is downstream short and upstream proud. I won't average it. That's the only sentence I owe a stranger.",
            flags: { "flags.met.ansel": true },
            summary: "Ruth gives the count in Eli's place and refuses comfort.",
          },
          {
            id: "br.gate.ruth_silence",
            choiceId: "silence",
            choice: "Say nothing about Eli and step off the boards.",
            endSpeakerId: "p.ruth_demerritt",
            end: "Silence is the first decent thing. Don't come back to spend it. The pin stays a family tool.",
            flags: { "flags.met.ansel": true },
            summary: "Ellis declines to spend Eli's death and leaves the race.",
          },
        ],
      },
    ],
    nextStageIds: [],
  }),
  kind: "standalone",
};
