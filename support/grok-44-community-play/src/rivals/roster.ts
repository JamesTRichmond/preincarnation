import type { RivalDef, RivalId } from "../types.ts";

export const ROSTER: Record<RivalId, RivalDef> = {
  "marigold-vesper": {
    id: "marigold-vesper",
    name: "Marigold Vesper",
    short: "Marigold",
    epithet: "Keeps the boil honest",
    wants: "Syrup that tastes like the year it was boiled, not like a prize.",
    voice: "Short sentences. Standards stated as weather, not as opinion.",
    competesOver: "The color and honesty of the first run",
    ties: [
      { rivalId: "agnes-crowell", nature: "Inherited Agnes's argument and is tired of inheriting it." },
      { rivalId: "ruth-bellamy", nature: "Trusts Ruth's labels and hates a label that flatters." },
    ],
    eras: {
      "first-turning": {
        age: 19,
        role: "Runs her uncle's sugarhouse and will not say so",
        behavior:
          "She times your pour and will not compliment a correct boil. An early pour ends the conversation. She is nineteen and already disappointed in shortcuts.",
        greeting: "Marigold nods at the pan, not at you. 'If it sheets, we talk.'",
      },
      "the-return": {
        age: 33,
        role: "Sugarhouse keeper, teaching the standard she used to wield",
        behavior:
          "She teaches the same standard and now says why. Plastic tubing offends her more than a novice does. She would rather a seated taster than a hero with a dark tin.",
        greeting: "Marigold sets out two spoons. 'Taste first. Winning is a rumor.'",
      },
    },
  },
  "calder-brunt": {
    id: "calder-brunt",
    name: "Calder Brunt",
    short: "Calder",
    epithet: "Turns a path into a dare",
    wants: "To be dared, and to have the dare mean he was brave rather than cornered.",
    voice: "Loud, then suddenly precise when he is afraid.",
    competesOver: "Who will take the worse footing",
    ties: [
      { rivalId: "pete-lang", nature: "Pete maps what Calder dares. They argue without raising this." },
      { rivalId: "hollis-quinn", nature: "Will not enter Hollis's deep eddy and will not explain." },
    ],
    eras: {
      "first-turning": {
        age: 21,
        role: "Logger's son, between the mill and the ridge",
        behavior:
          "He picks the worst footing and laughs if you do not follow. He will not go in deep water. The laugh is how he leaves a thing he will not do.",
        greeting: "Calder slaps the post. 'If you're coming, come where it's bad.'",
      },
      "the-return": {
        age: 35,
        role: "Mill hand with one good hand, author of the lower line",
        behavior:
          "A mill accident took the hand he used to point with. He walks a one-hand line and pretends it was always the line. He respects you if you take it without announcing the hand.",
        greeting: "Calder keeps the mitten on. 'Lower line's the line. Don't make a speech.'",
      },
    },
  },
  "inez-pell": {
    id: "inez-pell",
    name: "Inez Pell",
    short: "Inez",
    epithet: "Names the animal and leaves it",
    wants: "The creature left uncaught and correctly named.",
    voice: "Dry, field-exact, fond only after the book is shut.",
    competesOver: "Whether a sighting was a meeting or a trophy",
    ties: [
      { rivalId: "willa-crane", nature: "Willa is the student Inez did not ask for and will not abandon." },
      { rivalId: "ruth-bellamy", nature: "Ruth files what Inez refuses to turn into a total." },
    ],
    eras: {
      "first-turning": {
        age: 44,
        role: "Self-taught naturalist, no office, a full coat",
        behavior:
          "She scores you on whether you left the animal alone. A trophy story makes her close the book. Praise from her is a corrected noun.",
        greeting: "Inez does not offer her hand. 'Tell me what you will not follow.'",
      },
      "the-return": {
        age: 58,
        role: "Still walking, slower, correcting pretty drawings",
        behavior:
          "She asks you to correct Willa's pretty mistakes even when the pretty version would hang better in the parlor. She is kinder and less willing to be impressed.",
        greeting: "Inez taps the sketch. 'Willa draws a better lynx than the lynx. Don't prefer it.'",
      },
    },
  },
  "hollis-quinn": {
    id: "hollis-quinn",
    name: "Hollis Quinn",
    short: "Hollis",
    epithet: "Rows, and will not post a weight",
    wants: "The river trusted without a number nailed to a tree.",
    voice: "Patient to the point of insult. Calm that makes other people loud.",
    competesOver: "Whether help counts as your skill",
    ties: [
      { rivalId: "lenny-voss", nature: "Lenny resents that the town trusts Hollis for free." },
      { rivalId: "pete-lang", nature: "Pete knows the island stones. Hollis knows when not to step on them." },
    ],
    eras: {
      "first-turning": {
        age: 27,
        role: "River guide who will not take a fee from neighbors",
        behavior:
          "He lets you win the eddy if you listened, then tells the truth about the help. He thinks a secret assist is a lie you will repeat.",
        greeting: "Hollis holds the painter. 'I'll say where. I'll also say I said it.'",
      },
      "the-return": {
        age: 41,
        role: "Ferry keeper who tears scores off the trees",
        behavior:
          "He has stopped keeping score and he tears down the sheets other people post. He still rows. He is kinder, and he will not be your proof of anything.",
        greeting: "Hollis pockets a torn sheet. 'If you came for a weight, the tree is bare.'",
      },
    },
  },
  "juniper-hale": {
    id: "juniper-hale",
    name: "Juniper Hale",
    short: "June",
    epithet: "Feeds the person who lost",
    wants: "A meal that ends an argument instead of winning one.",
    voice: "Warm, domestic, and barbed if you brag at her table.",
    competesOver: "Who gets to call a supper a victory",
    ties: [
      { rivalId: "sable-okoye", nature: "June wants Sable's music at grace and will fight the room for it." },
      { rivalId: "theo-march", nature: "Theo does dishes. June considers that the honor, which confuses him." },
    ],
    eras: {
      "first-turning": {
        age: 28,
        role: "Church-kitchen cook with a private standard",
        behavior:
          "She runs the supper like a cockpit and insists it is not a contest. Bragging gets your beans salted. She watches to see if you mention the salt.",
        greeting: "June hands you a towel. 'Taste before you talk. Most people swap those.'",
      },
      "the-return": {
        age: 42,
        role: "Cooks outdoors since the grease fire she still misnames",
        behavior:
          "The kitchen fire was hers. She cooks in the orchard and wants the fire named correctly, not prettied into an act of God. She feeds whoever lost the heat, first.",
        greeting: "June nods at the soot scar. 'Say fire if you mean fire. Then wash your hands.'",
      },
    },
  },
  "theo-march": {
    id: "theo-march",
    name: "Theo March",
    short: "Theo",
    epithet: "Deals, and used to help the cards",
    wants: "To be liked without the cheat that liking tempts out of him.",
    voice: "Quick, joking, ashamed the moment he is seen.",
    competesOver: "The hand, and the story told about the hand afterward",
    ties: [
      { rivalId: "ruth-bellamy", nature: "Ruth wrote the cheat down. He has never fully forgiven the ink." },
      { rivalId: "sable-okoye", nature: "He is the one who requests her tunes by their real names." },
    ],
    eras: {
      "first-turning": {
        age: 16,
        role: "Ellis's age, the grange's unofficial dealer",
        behavior:
          "He cheats only when he is losing to someone he likes, and he finds that humiliating. An extra card, a joke over it, a hope you will not want the joke.",
        greeting: "Theo fans the deck. 'Sit where I can see you like me. That's the dangerous seat.'",
      },
      "the-return": {
        age: 30,
        role: "Town dealer who has stopped cheating and kept the name",
        behavior:
          "He deals clean. He is angry that people still call him a cheat, including anyone who only knows the story. He would like the first life to stop introducing him.",
        greeting: "Theo speaks before anyone else can. 'I deal square. Don't borrow a story about me.'",
      },
    },
  },
  "sable-okoye": {
    id: "sable-okoye",
    name: "Sable Okoye",
    short: "Sable",
    epithet: "Writes the tune and signs it",
    wants: "Her name left on her own music.",
    voice: "Plain, exact. Musical metaphors only when she is angry.",
    competesOver: "Authorship, not volume",
    ties: [
      { rivalId: "juniper-hale", nature: "June is the person who sets a place for the musician." },
      { rivalId: "theo-march", nature: "Theo says the titles correctly. She has not forgotten." },
    ],
    eras: {
      "first-turning": {
        age: 18,
        role: "New to the valley, mill family by way of Montreal",
        behavior:
          "She refuses the expected fiddle set. People say she does not belong at the fair. She built a seated rhythm so the dance is not the price of the music, and she is tired of being thanked as if that were a favor.",
        greeting: "Sable tunes down a step. 'If you know the old set, good. I'm not playing it.'",
      },
      "the-return": {
        age: 32,
        role: "The valley's working musician, often miscredited",
        behavior:
          "Her songs are remembered as Ellis's. She will not smile while you accept the credit. She still plays, and she still keeps the seated pattern, because the dance did not become kinder on its own.",
        greeting: "Sable sets the notebook down. 'My name is on the page. Say it or don't ask.'",
      },
    },
  },
  "ruth-bellamy": {
    id: "ruth-bellamy",
    name: "Ruth Bellamy",
    short: "Ruth",
    epithet: "Files what happened, including the doubt",
    wants: "A record that can survive a kind lie.",
    voice: "Clerical. Kindness lives in the footnotes, not the totals.",
    competesOver: "What is allowed to count as having happened",
    ties: [
      { rivalId: "theo-march", nature: "She preserved his worst hand because it was true." },
      { rivalId: "inez-pell", nature: "She wants Inez's sightings written; Inez wants them left in the woods." },
    ],
    eras: {
      "first-turning": {
        age: 22,
        role: "Clerk's daughter, unofficial ledger of the year",
        behavior:
          "If it is not written, she does not believe it happened. She is severe in the totals and unexpectedly kind in the margins. She will not round a result up to protect you.",
        greeting: "Ruth opens the book. 'Tell me the part you hope I won't enter.'",
      },
      "the-return": {
        age: 36,
        role: "Keeper of the ledgers she gave to the parlor",
        behavior:
          "She donated the ledgers and annotated your wins with doubts. She wants you to agree with the doubts where they are true. A parlor that only boasts is, to her, a kind of fire.",
        greeting: "Ruth rests a hand on the drawer. 'The room can keep a thing without agreeing with it.'",
      },
    },
  },
  "pete-lang": {
    id: "pete-lang",
    name: "Pete Lang",
    short: "Pete",
    epithet: "Shows a wall once",
    wants: "The stone walls he showed you to remain a confidence, not a shortcut in someone else's story.",
    voice: "Almost silent. Speaks in routes and stops when the route is stolen.",
    competesOver: "Who a path belongs to after it has been shared",
    ties: [
      { rivalId: "agnes-crowell", nature: "She scorned his lower path, then, years later, required it." },
      { rivalId: "calder-brunt", nature: "Calder treats Pete's careful line as a dare Pete did not offer." },
    ],
    eras: {
      "first-turning": {
        age: 17,
        role: "Farm kid who knows every wall on the ridge",
        behavior:
          "He does not talk during a route. If you take a shortcut he showed you and tell it as your own, he does not accuse you. He stops showing you walls.",
        greeting: "Pete tips his chin at a gap in the wall. 'That one I showed you. Don't rename it.'",
      },
      "the-return": {
        age: 31,
        role: "Mapper of the lower ridge, after the knee",
        behavior:
          "The knee went. He mapped the accessible ridge path and is prouder of the map than of any win. If you take the hard line to impress him, he is disappointed, not flattered.",
        greeting: "Pete unfolds a pencil map. 'The lower wall is the route. The ridge is weather.'",
      },
    },
  },
  "agnes-crowell": {
    id: "agnes-crowell",
    name: "Agnes Crowell",
    short: "Agnes",
    epithet: "Decides what counts as finishing",
    wants: "A gathering a real body can finish, including hers.",
    voice: "Old authority, no decoration. Later, shorter, because shame does not get a speech.",
    competesOver: "Whether an alternative is an insult or an invitation",
    ties: [
      { rivalId: "marigold-vesper", nature: "Marigold got her standards. Agnes is revising the ones that were cruel." },
      { rivalId: "pete-lang", nature: "She once told Pete to stay home. She uses his path now." },
    ],
    eras: {
      "first-turning": {
        age: 64,
        role: "Elder of the boil and the ridge",
        behavior:
          "She believes you do the thing or you stay home. A seated version or a lower path is, to her, a polite refusal. She will say so once and then treat it as law.",
        greeting: "Agnes looks you over. 'If you came to sit, you can sit at home.'",
      },
      "the-return": {
        age: 78,
        role: "Still opening the gatherings, on the condition they include a way",
        behavior:
          "After a winter she could not walk the ridge, she will not attend a posting that lacks a seated or lower way. She is ashamed of her first-life self and will say so once. Then she assumes you heard.",
        greeting: "Agnes points at the bench. 'The way includes the bench. I was wrong when it didn't.'",
      },
    },
  },
  "lenny-voss": {
    id: "lenny-voss",
    name: "Lenny Voss",
    short: "Lenny",
    epithet: "Sizes the story to the fish",
    wants: "A story the right size for the fish, and to be the one who tells it.",
    voice: "Expansive, then suddenly literal if someone measures the tale.",
    competesOver: "Glory against supper",
    ties: [
      { rivalId: "hollis-quinn", nature: "Envies Hollis the trust, and will still get in his boat." },
      { rivalId: "juniper-hale", nature: "Brings fish to June and inflates them until she stares." },
    ],
    eras: {
      "first-turning": {
        age: 30,
        role: "Guide-for-hire who mocks catch-and-release",
        behavior:
          "He gives bad water if he thinks you want glory, and the right eddy if you want supper. He mocks a fish returned to the river. The story is always one size up.",
        greeting: "Lenny spreads his hands a foot too wide. 'That big. You'll see. Or you won't.'",
      },
      "the-return": {
        age: 44,
        role: "Still guiding, on a lower river, with smaller stories",
        behavior:
          "The water is down. His stories got smaller and truer, and he hates that you like the small ones better. He keeps offering them anyway. Glory advice is still a trap.",
        greeting: "Lenny holds his hands a trout apart. 'That's the size. Don't make me stretch it.'",
      },
    },
  },
  "willa-crane": {
    id: "willa-crane",
    name: "Willa Crane",
    short: "Willa",
    epithet: "Draws it better and wants you to have seen it",
    wants: "To have seen the animal first, and for that to stay true after her drawing improves on it.",
    voice: "Eager, visual, defensive when corrected in public.",
    competesOver: "Who saw it, and whose picture the valley keeps",
    ties: [
      { rivalId: "inez-pell", nature: "Wants Inez's praise and cannot bear Inez's corrections." },
      { rivalId: "ruth-bellamy", nature: "Ruth files the drawing people prefer, which is not always the true one." },
    ],
    eras: {
      "first-turning": {
        age: 15,
        role: "Draws from a glance and hates being corrected",
        behavior:
          "She sketches an animal after one look and will not be told the ear is wrong in front of anyone. She is jealous of anyone Inez praises, especially if they saw the lynx and did not brag.",
        greeting: "Willa already has the pencil out. 'Don't say what it was until I've drawn it.'",
      },
      "the-return": {
        age: 29,
        role: "The valley illustrator, guilty of becoming the canon",
        behavior:
          "She redrew your sketches cleaner. Descendants prefer hers. She wants you to remain the one who saw the lynx, and she is angry at herself when the prettier sheet wins.",
        greeting: "Willa will not show you the redraw first. 'Yours was wrong in the ear. Yours was there.'",
      },
    },
  },
};

export const RIVALS: RivalDef[] = Object.values(ROSTER);

export function rivalById(id: RivalId): RivalDef {
  return ROSTER[id];
}
