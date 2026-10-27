import type { StallDef } from "./types.ts";

const plain = (reason: string) => ({ multiplier: 0.6, reason });

export const STALLS: StallDef[] = [
  {
    id: "quill",
    place: "Ferrisburgh landing",
    open: { from: "1774", until: "2026" },
    purse: 42,
    purseCap: 64,
    income: 8,
    replenish:
      "Each season the loft refills a few marks and the nets on the board, up to the posted count. Fiber she has already bought stays bought until next season. She never restocks a deed, a spoon, or a bell.",
    defaultBuy: plain(
      "Anything that is not fiber, at sixty percent of county value. The fiber rate is the one above, and it does not change when you look away.",
    ),
    interests: [
      {
        id: "fiber",
        tag: "fiber",
        multiplier: 1.45,
        seasonLimit: 8,
        demandLabel: "Flax tow, nettle bast, hemp, milkweed floss, or cotton twine",
        reason:
          "This will hold a knot. The netmaker's rate, not the junk rate — and it is the same rate whether or not you studied the stall.",
      },
    ],
    barters: [
      {
        id: "tie-net",
        name: "Tie a seine",
        detail:
          "Two flax tow and one nettle bast become a seine. Selling the fiber to her pays more marks. Tie the net if you want the net.",
        inputs: [
          { itemId: "flax-tow", qty: 2 },
          { itemId: "nettle-bast", qty: 1 },
        ],
        outputs: [{ itemId: "seine-net", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "dress-net",
        name: "Dress a net",
        detail: "Three marks. She dresses a seine you already carry. The net stays yours. Once a season.",
        marks: 3,
        seasonLimit: 1,
        inputs: [{ itemId: "seine-net", qty: 1, hold: true }],
        shoreCraft: true,
        journal: "The net is dressed for the water. The knowledge stays with you.",
      },
    ],
    stock: [{ itemId: "seine-net", condition: "sound", qty: 1, markup: 1.3, target: 1, step: 1 }],
    faces: [
      {
        fromEra: "1774",
        name: "Hester Quill",
        role: "Netmaker",
        greet:
          "I can tell a fiber from the doorway. The rate is on the board — I don't keep a second price in my head.",
        seeing: "That bundle will hold a knot. You get the netmaker's rate, beside the county value.",
        refuse: "I won't take a family's paper, or a bell, or something I can't put in a net.",
      },
      {
        fromEra: "1828",
        name: "Ada Quill",
        role: "Netmaker",
        greet: "Grandmother's board, my handwriting. Flax, nettle, hemp, cotton twine — the rate didn't get clever.",
        seeing: "Same rate Hester posted. I didn't inherit a trick.",
        refuse: "Paper, bells, and other people's silver go home. Not into my loft.",
      },
      {
        fromEra: "1976",
        name: "June Quill",
        role: "Netmaker",
        greet: "The loft still mends nets for the lake. The fiber rate is posted where you can read it standing up.",
        seeing: "Fiber is fiber. The board is the whole policy.",
        refuse: "I don't buy protected paper. I don't buy a bell to melt.",
      },
    ],
  },
  {
    id: "wicker",
    place: "Forge lane, Middlebury",
    open: { from: "1774", until: "2026" },
    purse: 36,
    purseCap: 64,
    income: 8,
    replenish:
      "The yard restocks strap iron and a mended hoe up to the posted counts, and a few marks. Scrap you sold them is not reprinted. Named things they bought stay bought — they are not minted again next season.",
    defaultBuy: plain("Ordinary goods at sixty percent. Metal has its own scrap rate, printed under the specialty line."),
    interests: [
      {
        id: "spoon",
        itemId: "button-spoon",
        multiplier: 0.4,
        demandLabel: "The Button spoon, as melt",
        reason:
          "Melt value only. The Button farm pays for the name. Both numbers are on the book this year — I am not going to pretend the spoon is anonymous.",
      },
      {
        id: "metal",
        tag: "metal",
        multiplier: 0.5,
        demandLabel: "Scrap iron, broken tools, and other unnamed metal",
        reason: "Scrap rate. I say so before it goes in the book. It is not a penalty for failing a quiz.",
      },
    ],
    barters: [
      {
        id: "forge-strap",
        name: "Forge a strap",
        detail: "Two scrap iron become one strap. You are paying in metal for a tool, not hunting a margin.",
        inputs: [{ itemId: "scrap-iron", qty: 2 }],
        outputs: [{ itemId: "strap-iron", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "mend-hoe",
        name: "Mend the hoe",
        detail: "Four marks. The broken hoe becomes a mended hoe in your pack. Cancel if you'd rather take scrap.",
        marks: 4,
        inputs: [{ itemId: "broken-hoe", qty: 1, become: { itemId: "mended-hoe", condition: "sound" } }],
        journal: "The hoe will turn soil again. That is what the four marks bought.",
      },
    ],
    stock: [
      { itemId: "strap-iron", condition: "sound", qty: 2, markup: 1.25, target: 2, step: 1 },
      { itemId: "mended-hoe", condition: "sound", qty: 1, markup: 1.25, target: 1, step: 1 },
      { itemId: "cut-nails", condition: "sound", qty: 3, markup: 1.2, target: 3, step: 1 },
    ],
    faces: [
      {
        fromEra: "1774",
        name: "Silas Wicker",
        role: "Scrap and smith",
        greet: "Iron, broken tools, nails. If it has a family's name on it, don't expect a family's price from me.",
        seeing: "I'll pay what's printed. If the Buttons are open, their number is higher, and I'll say that out loud.",
        refuse: "The deed is not iron. I won't touch it.",
      },
      {
        fromEra: "1891",
        name: "Ruth Wicker",
        role: "Scrap and smith",
        greet: "The yard is mine. Scrap is still scrap. I say the number before it goes in the book.",
        seeing: "Melt is melt. A name is somebody else's board.",
        refuse: "Protected paper does not go in the heap.",
      },
      {
        fromEra: "2026",
        name: "Len Wicker",
        role: "Salvage",
        greet: "Salvage, not a pawn shop for heirlooms. The melt price is the melt price.",
        seeing: "You can read the Button number beside mine. I don't hide the gap.",
        refuse: "I don't take deeds. I don't take the bell to melt unless you already know it's a bad sale.",
      },
    ],
  },
  {
    id: "button",
    place: "Cornwall flats",
    open: { from: "1774", until: "2026" },
    purse: 48,
    purseCap: 72,
    income: 8,
    replenish:
      "The kitchen restocks loaves up to the posted count and a little of the book. The spoon, once it comes home, stays in the house. It is never put back on a board and never duplicated.",
    defaultBuy: plain("We are not dealers. Ordinary goods at sixty percent, said plainly."),
    interests: [
      {
        id: "spoon",
        itemId: "button-spoon",
        multiplier: 2,
        keepsake: true,
        demandLabel: "The Button spoon",
        reason: "Our spoon. We pay for the name, not the silver. It will not be sold on again.",
      },
    ],
    barters: [
      {
        id: "neighbor-loaf",
        name: "Neighbor's loaf",
        detail: "One maple sugar for one loaf. Same county value. You can also just buy the loaf.",
        inputs: [{ itemId: "maple-sugar", qty: 1 }],
        outputs: [{ itemId: "farm-loaf", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "board",
        name: "A night's board",
        detail: "Four marks. Supper at the table, eaten here, not packed as goods to flip.",
        marks: 4,
        meal: true,
        inputs: [],
        journal: "You ate at the Button table. The marks bought the meal, not a bundle.",
      },
    ],
    stock: [{ itemId: "farm-loaf", condition: "sound", qty: 4, markup: 1.15, target: 4, step: 2 }],
    faces: [
      {
        fromEra: "1774",
        name: "Eunice Button",
        role: "The farm kitchen",
        greet: "A loaf, a night's board, and a spoon if it is ours. We are not bargaining against a scrap man.",
        seeing: "If that is our spoon, the price is the price of it being ours. The yard will tell you the melt price themselves.",
        refuse: "The deed already lives with the person holding this book. I won't take it and I won't mislay it.",
      },
      {
        fromEra: "1891",
        name: "Caleb Button",
        role: "The farm kitchen",
        greet: "Eunice's book, still. A loaf, a bed, and anything with our name.",
        seeing: "The name is the whole premium. It is printed, not whispered.",
        refuse: "I won't take the deed off you. It doesn't go missing between generations.",
      },
      {
        fromEra: "1976",
        name: "Mara Button",
        role: "The farm kitchen",
        greet: "The kitchen is open. Named things are not scrap here. The salvage yard will say the same.",
        seeing: "Bring the spoon home or don't. You can see both offers before you choose.",
        refuse: "Protected paper stays in the pack. That is not a favor. It is the rule.",
      },
    ],
  },
  {
    id: "masta",
    place: "Cedar swamp, Ferrisburgh",
    open: { from: "1774", until: "2026" },
    purse: 36,
    purseCap: 60,
    income: 8,
    replenish:
      "Baskets and snowshoes return up to the posted counts. Ash and sweetgrass she bought are not reprinted. She does not stock anyone's deed, spoon, or bell.",
    defaultBuy: plain("If it isn't ash or sweetgrass, sixty percent, and I'll tell you which stall actually wants it."),
    interests: [
      {
        id: "ash",
        tag: "ash",
        multiplier: 1.3,
        seasonLimit: 6,
        demandLabel: "Ash splints and sweetgrass",
        reason: "Good material. The posted rate — I am not going to flatter you with a riddle.",
      },
    ],
    barters: [
      {
        id: "make-basket",
        name: "Make a basket",
        detail:
          "One ash and one sweetgrass become a basket you keep. Selling her the materials pays more marks than the basket will.",
        inputs: [
          { itemId: "ash-splints", qty: 1 },
          { itemId: "sweetgrass", qty: 1 },
        ],
        outputs: [{ itemId: "basket", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "mend-basket",
        name: "Mend a basket",
        detail: "Three marks. A worn basket you own is made sound. It stays yours.",
        marks: 3,
        inputs: [{ itemId: "basket", qty: 1, condition: "worn", become: { condition: "sound" } }],
        journal: "The basket will carry again.",
      },
    ],
    stock: [
      { itemId: "basket", condition: "sound", qty: 2, markup: 1.25, target: 2, step: 1 },
      { itemId: "snowshoes", condition: "sound", qty: 1, markup: 1.3, target: 1, step: 1 },
    ],
    faces: [
      {
        fromEra: "1774",
        name: "Molly Masta",
        role: "Basketmaker",
        greet:
          "Baskets I made. I'll buy ash and sweetgrass at the posted rate. I don't buy deeds, bells, or another family's silver.",
        seeing: "Good splints. The rate is what the board says.",
        refuse: "That paper isn't stock. Neither is a bell, or the Buttons' spoon.",
      },
      {
        fromEra: "1891",
        name: "Elspeth Masta",
        role: "Basketmaker",
        greet: "Molly taught me the sizes. I sell what I carry. The old stories are not on the board.",
        seeing: "Ash or sweetgrass, posted rate, same as hers.",
        refuse: "I don't take protected things to complete a trade.",
      },
      {
        fromEra: "2026",
        name: "Anna Masta",
        role: "Basketmaker",
        greet: "Saturday market, same work. Ash and sweetgrass, posted. Ask about a basket.",
        seeing: "The rate didn't grow a second meaning while you weren't looking.",
        refuse: "No deeds. No heirlooms that aren't mine to mend.",
      },
    ],
  },
  {
    id: "hale",
    place: "Inn kitchen, Middlebury",
    open: { from: "1828", until: "2026" },
    purse: 40,
    purseCap: 64,
    income: 8,
    replenish:
      "Pies and covered suppers come back up to the posted counts. She does not restock your ingredients. A season's buying limit, if she has one, resets; the rate does not quietly fall.",
    defaultBuy: plain("Not food I can cook: sixty percent, and the slate says so."),
    interests: [
      {
        id: "sweetener",
        tag: "sweetener",
        multiplier: 1,
        demandLabel: "Maple sugar or cane sugar — the same rate",
        reason: "Maple or cane, the pot doesn't care. County value, not a discount for the substitute.",
      },
      {
        id: "fruit",
        tag: "fruit",
        multiplier: 1,
        demandLabel: "Dried apple or raisins — the same rate",
        reason: "Dried apple or raisins. A useful stand-in, full credit, posted before you hand it over.",
      },
      {
        id: "food",
        tag: "food",
        multiplier: 0.95,
        demandLabel: "Other food she can cook",
        reason: "Food I can use, just under county value. The gap is on the slate, not in a back room.",
      },
    ],
    barters: [
      {
        id: "pie",
        name: "Make the pie",
        detail:
          "A sweetener and a fruit become a pie. Maple or cane. Dried apple or raisins. Same pie. It is for eating — she pays as much or more for the pieces.",
        inputs: [
          { itemId: "maple-sugar", qty: 1, alternatives: ["cane-sugar"], altLabel: "cane sugar" },
          { itemId: "dried-apple", qty: 1, alternatives: ["raisin"], altLabel: "raisins" },
        ],
        outputs: [{ itemId: "inn-pie", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "supper",
        name: "Sit for supper",
        detail: "Six marks. You eat at the inn. Nothing is added to your pack to resell.",
        marks: 6,
        meal: true,
        inputs: [],
        journal: "Supper at the inn. The bowl was the point.",
      },
    ],
    stock: [
      { itemId: "inn-pie", condition: "sound", qty: 3, markup: 1.2, target: 3, step: 2 },
      { itemId: "inn-supper", condition: "sound", qty: 2, markup: 1.2, target: 2, step: 1 },
    ],
    faces: [
      {
        fromEra: "1828",
        name: "Cora Hale",
        role: "Cook",
        greet:
          "Maple or cane, the pie doesn't care. Dried apple stands for raisin. I'll point at the swap before you hand anything over.",
        seeing: "I can use that. The rate is next to the county value — cooking is not a trick on the hungry.",
        refuse: "I don't buy paper, bells, or a family's silver. I buy food, and I say which food.",
      },
      {
        fromEra: "1934",
        name: "Nell Hale",
        role: "Cook",
        greet: "Thinner larder, same rule. If a substitute works, it works at the posted rate, not a punishment rate.",
        seeing: "Useful is useful. I don't dock you for bringing the other jar.",
        refuse: "The deed is not an ingredient.",
      },
      {
        fromEra: "1976",
        name: "Sam Hale",
        role: "Baker",
        greet: "The bakery kept the board. Sweeteners substitute. Fruit substitutes. You will see both names.",
        seeing: "Same pie. I say the stand-in out loud.",
        refuse: "I won't take protected things to balance a bill.",
      },
    ],
  },
  {
    id: "fenn",
    place: "Meetinghouse, Middlebury",
    open: { from: "1828", until: "2026" },
    purse: 70,
    purseCap: 90,
    income: 8,
    replenish:
      "Strings and ballads restock. The bell, if you sell it, goes to the meetinghouse and is not put back for sale, and a second bell is never made.",
    defaultBuy: plain("Not music and not the bell: sixty percent, posted."),
    interests: [
      {
        id: "bell-restored",
        itemId: "meetinghouse-bell",
        condition: "restored",
        multiplier: 1.45,
        keepsake: true,
        seasonLimit: 1,
        demandLabel: "The meetinghouse bell, restored",
        reason: "Restored. I pay for the note, not the brass. It stays in the tower. You may keep it and sound it instead.",
      },
      {
        id: "bell-cracked",
        itemId: "meetinghouse-bell",
        condition: "cracked",
        multiplier: 0.45,
        keepsake: true,
        demandLabel: "The meetinghouse bell, still cracked",
        reason:
          "Cracked. Weight price only. Restoration is on the board at a posted fee. I will not blur the two rates to buy it cheap.",
      },
      {
        id: "music",
        tag: "music",
        multiplier: 1.1,
        demandLabel: "Strings and ballad sheets",
        reason: "A small music premium, posted. Not a mystery for people who didn't talk to me first.",
      },
    ],
    barters: [
      {
        id: "string-ballad",
        name: "A string for a sheet",
        detail: "One fiddle string becomes a ballad sheet. A swap of tunes, not a margin.",
        inputs: [{ itemId: "fiddle-string", qty: 1 }],
        outputs: [{ itemId: "ballad-sheet", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "restore-bell",
        name: "Restore the bell",
        detail:
          "Ten marks. The cracked bell becomes restored in your pack. After that you can sell the note, or keep it and sound it at dusk.",
        marks: 10,
        inputs: [
          {
            itemId: "meetinghouse-bell",
            qty: 1,
            condition: "cracked",
            become: { condition: "restored" },
          },
        ],
        journal: "The crack is closed. The bell has a note again. Selling it and sounding it are both on the board.",
      },
      {
        id: "recital",
        name: "Sound the bell at dusk",
        detail: "No fee. You keep the restored bell. Once a season. This is the use that is not a sale.",
        marks: 0,
        seasonLimit: 1,
        recital: true,
        inputs: [{ itemId: "meetinghouse-bell", qty: 1, condition: "restored", hold: true }],
        journal: "The bell was sounded at dusk. You still have it.",
      },
    ],
    stock: [
      { itemId: "fiddle-string", condition: "sound", qty: 4, markup: 1.2, target: 4, step: 2 },
      { itemId: "ballad-sheet", condition: "sound", qty: 3, markup: 1.2, target: 3, step: 1 },
    ],
    faces: [
      {
        fromEra: "1828",
        name: "Ira Fenn",
        role: "Musician and ringer",
        greet:
          "A cracked bell is weight. A restored bell has a note. I pay for what I can hear, and both numbers are on the board.",
        seeing: "I know which bell this is. Read the rate before you decide — you can also keep it.",
        refuse: "I don't buy the deed, and I don't buy a named spoon.",
      },
      {
        fromEra: "1934",
        name: "Lila Fenn",
        role: "Musician",
        greet: "Ira's ear, my fiddle. The bell rule didn't change when the hall got a dance floor.",
        seeing: "Restored is one price. Cracked is another. I won't average them.",
        refuse: "Protected paper is not an instrument.",
      },
      {
        fromEra: "1976",
        name: "Chris Fenn",
        role: "Musician",
        greet: "We still tune by that bell. Restored is restored. Cracked is cracked. I won't blur it to buy cheap.",
        seeing: "The note has a posted price. So does keeping it.",
        refuse: "I won't take an essential paper to close a sale.",
      },
    ],
  },
  {
    id: "phelps",
    place: "Main street, Vergennes",
    open: { from: "1828", until: "2026" },
    purse: 54,
    purseCap: 80,
    income: 10,
    replenish:
      "The slate restocks salt, sugar, fruit, vinegar, seeds, paper, and ink up to the posted counts. The margin does not widen after you buy. The book refills a little, not enough to fund a circle of resale.",
    defaultBuy: plain(
      "If I don't stock it, sixty percent of county value. If I do stock it, buy it off the board. I don't run a flip, and I don't hide the margin.",
    ),
    interests: [
      {
        id: "pantry",
        tag: "pantry",
        multiplier: 0.7,
        demandLabel: "Salt and vinegar you sell back",
        reason:
          "A bit under county value. These are on my board too — read that price before you sell them to me.",
      },
    ],
    barters: [
      {
        id: "paper-ink",
        name: "Paper and ink, even",
        detail: "Two sheets of rag paper for one ink. A store swap at posted goods, not a discount trick.",
        inputs: [{ itemId: "rag-paper", qty: 2 }],
        outputs: [{ itemId: "ink", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "wrap",
        name: "Have it wrapped",
        detail: "One mark. Nothing in the pack changes hands. You leave with the errand done.",
        marks: 1,
        seasonLimit: 4,
        inputs: [],
        journal: "Phelps wrapped the parcel. One mark, posted, no extras.",
      },
    ],
    stock: [
      { itemId: "salt", condition: "sound", qty: 5, markup: 1.15, target: 5, step: 2 },
      { itemId: "cane-sugar", condition: "sound", qty: 4, markup: 1.15, target: 4, step: 2 },
      { itemId: "raisin", condition: "sound", qty: 4, markup: 1.35, target: 4, step: 2 },
      { itemId: "cider-vinegar", condition: "sound", qty: 3, markup: 1.15, target: 3, step: 1 },
      { itemId: "seed-packet", condition: "sound", qty: 4, markup: 1.15, target: 4, step: 2 },
      { itemId: "rag-paper", condition: "sound", qty: 4, markup: 1.15, target: 4, step: 2 },
      { itemId: "ink", condition: "sound", qty: 3, markup: 1.15, target: 3, step: 1 },
    ],
    faces: [
      {
        fromEra: "1828",
        name: "Micah Phelps",
        role: "General store",
        greet:
          "County value on the left, my price on the right. The difference is my margin. It is not a secret and it is not a punishment.",
        seeing: "If someone else posts a better rate for that, it will show beside mine. I don't fake a specialty.",
        refuse: "I won't take the deed into the till. I won't take the bell as scrap.",
      },
      {
        fromEra: "1891",
        name: "Ada Phelps",
        role: "General store",
        greet: "Father's slate. I sell a little above county value and I buy surplus I don't stock at sixty percent.",
        seeing: "Both numbers are on the slate before you agree.",
        refuse: "Protected things are not general goods.",
      },
      {
        fromEra: "1976",
        name: "Owen Phelps",
        role: "Market",
        greet: "The market still posts both numbers. Supper ingredients, seeds, paper, salt — slate price.",
        seeing: "Read the county value. My margin is the gap, and it stays small.",
        refuse: "No deed. No named spoon in the grocery till.",
      },
    ],
  },
  {
    id: "peck",
    place: "Dispensary, Vergennes",
    open: { from: "1891", until: "2026" },
    purse: 40,
    purseCap: 64,
    income: 8,
    replenish:
      "Salve returns to the posted count. Yarrow she buys is not grown back onto the board. The dressing fee does not rise because you asked what it costs.",
    defaultBuy: plain("Not an herb I can use: sixty percent. Yarrow has its own posted line."),
    interests: [
      {
        id: "yarrow",
        itemId: "yarrow",
        multiplier: 1.25,
        seasonLimit: 4,
        demandLabel: "Yarrow",
        reason: "I can use this in the stillroom. Above county value, and the slate says so before you sell.",
      },
    ],
    barters: [
      {
        id: "salve-swap",
        name: "Yarrow for salve",
        detail: "Two yarrow become one salve. You are trading the herb for the care it makes, not for a markup.",
        inputs: [{ itemId: "yarrow", qty: 2 }],
        outputs: [{ itemId: "salve", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "dressing",
        name: "A dressing and tea",
        detail: "Four marks. Care, posted. You do not have to be bleeding to sit down. Twice a season.",
        marks: 4,
        seasonLimit: 2,
        dressing: true,
        inputs: [],
        journal: "A clean dressing and tea. The fee was on the card.",
      },
    ],
    stock: [{ itemId: "salve", condition: "sound", qty: 3, markup: 1.2, target: 3, step: 1 }],
    faces: [
      {
        fromEra: "1891",
        name: "Annabelle Peck",
        role: "Dispensary",
        greet:
          "Salve and a dressing, priced where you can see them. Yarrow I pay above county value because I use it. That sentence is the whole policy.",
        seeing: "Yarrow. The premium is printed. It is not a reward for saying the right sentence first.",
        refuse: "I don't buy deeds, bells, or family silver.",
      },
      {
        fromEra: "1934",
        name: "Edie Vorse",
        role: "Cottage hospital",
        greet: "The hospital kept her slate. Care is a posted fee, not a favor with a hidden bill.",
        seeing: "If it's yarrow, the rate is the rate on the card.",
        refuse: "Essential papers are not tender.",
      },
      {
        fromEra: "1976",
        name: "Helen Cho",
        role: "Clinic",
        greet: "Clinic hours. The dressing has a fee. Herbs I can use are marked. Nothing here is a mystery charge.",
        seeing: "Yarrow, posted premium. You can sell or keep it for the salve swap.",
        refuse: "I won't take a protected item in payment.",
      },
    ],
  },
  {
    id: "march",
    place: "Marble works, Middlebury",
    open: { from: "1891", until: "2026" },
    purse: 44,
    purseCap: 70,
    income: 8,
    replenish:
      "Wax tins return to the posted count. Dust and black he has bought are not shoveled back into stock. The fee to recut a name stays the fee.",
    defaultBuy: plain("Not dust and not black: sixty percent. I sell wax; I don't pretend to crave it."),
    interests: [
      {
        id: "pigment",
        tag: "pigment",
        multiplier: 1.2,
        demandLabel: "Lampblack",
        reason: "I use black when I recut a letter. A craftsman's rate, posted.",
      },
      {
        id: "dust",
        tag: "dust",
        multiplier: 1.2,
        demandLabel: "Limestone dust",
        reason: "Dust I can use. Small money, said in advance, above the county value by the posted bit.",
      },
    ],
    barters: [
      {
        id: "wax-dust",
        name: "Dust and black for wax",
        detail: "One limestone dust and one lampblack for a tin of wax. A shop swap, posted.",
        inputs: [
          { itemId: "limestone-dust", qty: 1 },
          { itemId: "lampblack", qty: 1 },
        ],
        outputs: [{ itemId: "beeswax", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "recut",
        name: "Recut a name",
        detail: "Eight marks. A name goes back into stone. You take no trophy item — the work is the point. You can walk away first.",
        marks: 8,
        inputs: [],
        journal: "A name sits clean in the stone. The fee was eight marks, said before the chisel moved.",
      },
    ],
    stock: [{ itemId: "beeswax", condition: "sound", qty: 2, markup: 1.3, target: 2, step: 1 }],
    faces: [
      {
        fromEra: "1891",
        name: "Theo March",
        role: "Stone restorer",
        greet: "I clean stone and recut a name. Wax I sell. Black and dust I buy, at a posted craftsman's rate.",
        seeing: "If it's black or dust, the rate is already on the card. You don't have to guess.",
        refuse: "I don't carve a deed into the till. I don't take the bell.",
      },
      {
        fromEra: "1934",
        name: "Inez March",
        role: "Stone restorer",
        greet: "Theo's chisels. A name on a stone has a fee. I say it before I start, and you can walk away.",
        seeing: "Posted rate. No apprentice discount hiding under it.",
        refuse: "Protected things are not payment.",
      },
      {
        fromEra: "1976",
        name: "Paul March",
        role: "Studio",
        greet: "The studio still does one thing well: put a name back. The fee is on the card.",
        seeing: "Black and dust, still the craftsman's rate.",
        refuse: "I won't accept an essential item. Cancel is free.",
      },
    ],
  },
  {
    id: "otis",
    place: "Shoreham creamery",
    open: { from: "1891", until: "2026" },
    purse: 46,
    purseCap: 72,
    income: 8,
    replenish:
      "Wheels, butter, and rennet return to the posted counts. Milk you bring is pressed or paid for; it is not duplicated. Vinegar remains a full substitute for rennet.",
    defaultBuy: plain("Not dairy: sixty percent. Dairy I use is at county value, on the board."),
    interests: [
      {
        id: "dairy",
        tag: "dairy",
        multiplier: 1,
        demandLabel: "Milk, rennet, cheese, butter",
        reason: "Dairy I can press or sell, at county value. Not a haircut for showing up uninformed.",
      },
    ],
    barters: [
      {
        id: "press",
        name: "Press a wheel",
        detail:
          "Milk, salt, and rennet become a cheddar wheel. Cider vinegar stands in for rennet — same wheel, not a sharper punishment price.",
        inputs: [
          { itemId: "milk", qty: 1 },
          { itemId: "salt", qty: 1 },
          { itemId: "rennet", qty: 1, alternatives: ["cider-vinegar"], altLabel: "cider vinegar" },
        ],
        outputs: [{ itemId: "cheddar", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "taste",
        name: "Taste the wheel",
        detail: "Two marks. A slice at the counter. You are not sold a second, secret cheese.",
        marks: 2,
        meal: true,
        inputs: [],
        journal: "You tasted the wheel at the creamery. Two marks, and lunch enough.",
      },
    ],
    stock: [
      { itemId: "cheddar", condition: "sound", qty: 2, markup: 1.2, target: 2, step: 1 },
      { itemId: "butter", condition: "sound", qty: 3, markup: 1.2, target: 3, step: 1 },
      { itemId: "rennet", condition: "sound", qty: 3, markup: 1.3, target: 3, step: 1 },
    ],
    faces: [
      {
        fromEra: "1891",
        name: "Pearl Otis",
        role: "Creamery",
        greet:
          "Milk, salt, and rennet make a wheel. Vinegar can stand in for rennet — same wheel, and the board says so. I don't dock you for being practical.",
        seeing: "Dairy at county value. If you sell it instead of pressing it, you can see that number too.",
        refuse: "The deed doesn't age into cheese. I won't take it.",
      },
      {
        fromEra: "1934",
        name: "Walt Otis",
        role: "Creamery",
        greet: "The cooperative kept Pearl's rule. Substitutes are posted. The wheel on the board sits next to county value.",
        seeing: "Full credit for a useful stand-in. I say which jar.",
        refuse: "No protected paper in the press.",
      },
      {
        fromEra: "2026",
        name: "Rae Otis",
        role: "Creamery",
        greet: "Creamery's open. Bring milk if you kept it, or buy the wheel. I won't sell you a puzzle.",
        seeing: "County value for dairy. The substitute is written on the press card.",
        refuse: "Essential things are not ingredients.",
      },
    ],
  },
  {
    id: "calder",
    place: "New Haven Grange",
    open: { from: "1934", until: "2026" },
    purse: 32,
    purseCap: 52,
    income: 6,
    replenish:
      "Soles return to the posted count. Food taken in barter is eaten by the bench, not resold. The fee and the food-swap stay side by side on one card.",
    defaultBuy: plain("We're a bench, not a buyer of everything. Sixty percent if we take it at all, and we'd rather mend."),
    interests: [
      {
        id: "food",
        tag: "food",
        multiplier: 0.9,
        demandLabel: "Food for the table",
        reason: "The bench eats. A little under county value, printed, not sprung on you.",
      },
    ],
    barters: [
      {
        id: "cobble-food",
        name: "Cobble for a meal",
        detail:
          "A boot sole and something for the table: a loaf, a pie, a covered supper, a wheel, or butter. No marks. The sole is the work; the food is the wage.",
        inputs: [
          { itemId: "boot-sole", qty: 1 },
          {
            itemId: "farm-loaf",
            qty: 1,
            alternatives: ["inn-pie", "inn-supper", "cheddar", "butter"],
            altLabel: "pie, supper, cheese, or butter",
          },
        ],
        outputs: [],
      },
    ],
    services: [
      {
        id: "cobble-fee",
        name: "Cobble for marks",
        detail: "Three marks and a sole. Same mend as the food swap. Pick the wage you can spare.",
        marks: 3,
        dryFeet: true,
        inputs: [{ itemId: "boot-sole", qty: 1 }],
        journal: "Boots cobbled for the posted fee. Dry feet, no extras.",
      },
    ],
    stock: [{ itemId: "boot-sole", condition: "sound", qty: 3, markup: 1.25, target: 3, step: 1 }],
    faces: [
      {
        fromEra: "1934",
        name: "Hank and Inez Calder",
        role: "Mending bench",
        greet:
          "We mend. A sole and something for the table, or a few marks. Both deals are on the same card. Cancel if you don't like either.",
        seeing: "If it's food, the rate is a little under county value and it says why: the bench eats.",
        refuse: "We don't take the deed as a deposit. We don't take the bell.",
      },
      {
        fromEra: "1976",
        name: "Dot Calder",
        role: "Repair bench",
        greet: "Repair bench. Grandmother's barter still stands: food and a sole, or the posted fee. No surprise extras.",
        seeing: "Posted either way. You can back out before anything leaves your pack.",
        refuse: "Protected things don't pay for soles.",
      },
    ],
  },
  {
    id: "boudreau",
    place: "Printer's alley, Middlebury",
    open: { from: "1976", until: "2026" },
    purse: 36,
    purseCap: 60,
    income: 8,
    replenish:
      "Seed packets return to the posted count. A broadside you printed is not copied by the shop next season. The print fee stays higher than the sheet's resale, on purpose.",
    defaultBuy: plain(
      "Paper I didn't print, at sixty percent. A broadside you printed will not make you money. It was for keeping.",
    ),
    interests: [
      {
        id: "expression",
        tag: "expression",
        multiplier: 0.5,
        demandLabel: "A broadside, if you insist on selling it",
        reason:
          "Half the county value, said now. Printing was for the wall. Selling the sheet back is a poor trade and the card admits it.",
      },
    ],
    barters: [
      {
        id: "seed-swap",
        name: "Paper for seeds",
        detail: "Two rag paper for one seed packet. A small bed, not a crate.",
        inputs: [{ itemId: "rag-paper", qty: 2 }],
        outputs: [{ itemId: "seed-packet", qty: 1, condition: "sound" }],
      },
    ],
    services: [
      {
        id: "print",
        name: "Print a sentence",
        detail:
          "Two marks, one rag paper, one ink. You choose the sentence. The broadside is worth less on the board than this fee. Keep it.",
        marks: 2,
        inputs: [
          { itemId: "rag-paper", qty: 1 },
          { itemId: "ink", qty: 1 },
        ],
        outputs: [{ itemId: "broadside", qty: 1, condition: "sound", inscription: true }],
        lines: ["The lake kept the name.", "We ate, and it was enough.", "The bell was restored."],
        journal: "The press pulled a sentence. It is for keeping.",
      },
    ],
    stock: [{ itemId: "seed-packet", condition: "sound", qty: 4, markup: 1.2, target: 4, step: 2 }],
    faces: [
      {
        fromEra: "1976",
        name: "Nia Boudreau",
        role: "Printer and farmstand",
        greet:
          "Seeds, and a broadside if you want a sentence kept. Printing costs more than the paper will sell for. That's on purpose.",
        seeing: "If this is a sheet you printed, I'll buy it low and I'll tell you to keep it instead.",
        refuse: "I don't buy the deed to decorate a broadside. I don't buy the bell.",
      },
      {
        fromEra: "2026",
        name: "Sol Boudreau",
        role: "Printer and farmstand",
        greet: "The press is mine this year. Same fee, same seeds. A sentence you print is for the wall, not for a flip.",
        seeing: "The resale number is ugly on purpose. The fee bought the sentence.",
        refuse: "Protected paper is not stock.",
      },
    ],
  },
];

export const STALL_BY_ID: Record<string, StallDef> = Object.fromEntries(STALLS.map((stall) => [stall.id, stall]));

export function stallDef(id: string): StallDef {
  const found = STALL_BY_ID[id];
  if (!found) throw new Error(`Unknown stall ${id}`);
  return found;
}
