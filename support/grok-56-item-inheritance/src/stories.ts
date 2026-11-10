import type { ItemStory, StoryArchetype, StoryBeat } from "./types.ts";
import { PLAYER_ID } from "./types.ts";

interface Person {
  id: string;
  name: string;
  lineage: string;
  generation: number;
}

function idOf(number: number, slug: string): string {
  return `story.${String(number).padStart(2, "0")}.${slug}`;
}

function npcBeat(year: number, person: Person, successorId: string | null): StoryBeat {
  return {
    atYear: year,
    action: {
      op: "ensure-npc",
      npcId: person.id,
      name: person.name,
      lineageId: person.lineage,
      generation: person.generation,
      successorId,
    },
  };
}

function deny(year: number, defId: string, sourceKey: string): StoryBeat {
  return {
    atYear: year,
    expectDenied: true,
    action: { op: "claim-again", defId, sourceKey, sourceKind: "found" },
  };
}

function donated(args: {
  n: number;
  slug: string;
  title: string;
  summary: string;
  defId: string;
  sourceKey: string;
  holder: Person;
  successor: Person;
  siteId: string;
  siteName: string;
  acquire: number;
  donate: number;
  death: number;
  useYear: number;
  useNote: string;
}): ItemStory {
  const storyId = idOf(args.n, args.slug);
  const instanceId = `inst:${storyId}`;
  const beats: StoryBeat[] = [
    npcBeat(args.acquire, args.holder, args.successor.id),
    npcBeat(args.acquire, args.successor, null),
    { atYear: args.acquire, action: { op: "ensure-site", siteId: args.siteId, name: args.siteName } },
    {
      atYear: args.acquire,
      action: {
        op: "claim",
        instanceId,
        defId: args.defId,
        sourceKey: args.sourceKey,
        sourceKind: "gift",
        custody: "carried",
      },
    },
    { atYear: args.donate, action: { op: "donate", instanceId, toId: args.holder.id, siteId: args.siteId } },
    { atYear: args.death, action: { op: "npc-dies", npcId: args.holder.id } },
    { atYear: args.useYear, action: { op: "resolve-succession" } },
    {
      atYear: args.useYear,
      action: { op: "successor-note", instanceId, byId: args.successor.id, note: args.useNote },
    },
    deny(args.useYear, args.defId, args.sourceKey),
  ];
  return {
    storyId,
    number: args.n,
    title: args.title,
    archetype: "donated-tool-successor",
    summary: args.summary,
    defId: args.defId,
    instanceId,
    sourceKey: args.sourceKey,
    finalOwnerId: args.successor.id,
    beats,
  };
}

function restored(args: {
  n: number;
  slug: string;
  title: string;
  summary: string;
  defId: string;
  sourceKey: string;
  heirId: string;
  heirKind: "npc" | "institution";
  heir?: Person;
  siteId: string;
  siteName: string;
  found: number;
  repaired: number;
  passed: number;
  repairNote: string;
  inheritNote: string;
}): ItemStory {
  const storyId = idOf(args.n, args.slug);
  const instanceId = `inst:${storyId}`;
  const beats: StoryBeat[] = [];
  if (args.heir) beats.push(npcBeat(args.found, args.heir, null));
  beats.push(
    { atYear: args.found, action: { op: "ensure-site", siteId: args.siteId, name: args.siteName } },
    {
      atYear: args.found,
      action: {
        op: "claim",
        instanceId,
        defId: args.defId,
        sourceKey: args.sourceKey,
        sourceKind: "found",
        condition: "broken",
        custody: "carried",
      },
    },
    {
      atYear: args.repaired,
      action: { op: "restore", instanceId, byId: PLAYER_ID, note: args.repairNote },
    },
    {
      atYear: args.passed,
      action: {
        op: "inherit",
        instanceId,
        heirId: args.heirId,
        heirKind: args.heirKind,
        siteId: args.siteId,
        note: args.inheritNote,
      },
    },
    deny(args.passed, args.defId, args.sourceKey),
  );
  return {
    storyId,
    number: args.n,
    title: args.title,
    archetype: "restored-instrument-inherited",
    summary: args.summary,
    defId: args.defId,
    instanceId,
    sourceKey: args.sourceKey,
    finalOwnerId: args.heirId,
    beats,
  };
}

function cache(args: {
  n: number;
  slug: string;
  title: string;
  summary: string;
  defId: string;
  sourceKey: string;
  siteId: string;
  siteName: string;
  year: number;
}): ItemStory {
  const storyId = idOf(args.n, args.slug);
  const instanceId = `inst:${storyId}`;
  return {
    storyId,
    number: args.n,
    title: args.title,
    archetype: "cache-exposed-by-land",
    summary: args.summary,
    defId: args.defId,
    instanceId,
    sourceKey: args.sourceKey,
    finalOwnerId: PLAYER_ID,
    beats: [
      { atYear: args.year, action: { op: "ensure-site", siteId: args.siteId, name: args.siteName } },
      {
        atYear: args.year,
        action: {
          op: "expose-cache",
          instanceId,
          defId: args.defId,
          sourceKey: args.sourceKey,
          siteId: args.siteId,
        },
      },
      deny(args.year, args.defId, args.sourceKey),
      { atYear: args.year, action: { op: "take-up", instanceId } },
    ],
  };
}

function family(args: {
  n: number;
  slug: string;
  title: string;
  summary: string;
  defId: string;
  sourceKey: string;
  custody: "carried" | "stored" | "displayed";
  siteId?: string;
  siteName?: string;
  witness: Person;
  found: number;
  recognized: number;
  note: string;
}): ItemStory {
  const storyId = idOf(args.n, args.slug);
  const instanceId = `inst:${storyId}`;
  const beats: StoryBeat[] = [npcBeat(args.found, args.witness, null)];
  if (args.siteId && args.siteName) {
    beats.push({ atYear: args.found, action: { op: "ensure-site", siteId: args.siteId, name: args.siteName } });
  }
  beats.push(
    {
      atYear: args.found,
      action: {
        op: "claim",
        instanceId,
        defId: args.defId,
        sourceKey: args.sourceKey,
        sourceKind: "inheritance",
        custody: args.custody,
        siteId: args.siteId ?? null,
      },
    },
    { atYear: args.recognized, action: { op: "recognize", instanceId, byId: args.witness.id, note: args.note } },
    deny(args.recognized, args.defId, args.sourceKey),
  );
  return {
    storyId,
    number: args.n,
    title: args.title,
    archetype: "family-object-recognized",
    summary: args.summary,
    defId: args.defId,
    instanceId,
    sourceKey: args.sourceKey,
    finalOwnerId: PLAYER_ID,
    beats,
  };
}

function historical(args: {
  n: number;
  slug: string;
  title: string;
  summary: string;
  defId: string;
  sourceKey: string;
  nodeKey: string;
  nodeInstanceId: string;
  witness: Person;
  found: number;
  marked: number;
  note: string;
}): ItemStory {
  const storyId = idOf(args.n, args.slug);
  const instanceId = `inst:${storyId}`;
  return {
    storyId,
    number: args.n,
    title: args.title,
    archetype: "ordinary-becomes-historical",
    summary: args.summary,
    defId: args.defId,
    instanceId,
    sourceKey: args.sourceKey,
    finalOwnerId: PLAYER_ID,
    beats: [
      npcBeat(args.found, args.witness, null),
      {
        atYear: args.found,
        action: {
          op: "claim",
          instanceId,
          defId: args.defId,
          sourceKey: args.sourceKey,
          sourceKind: "purchase",
          custody: "stored",
          containerId: "chest",
        },
      },
      { atYear: args.marked, action: { op: "historical-mark", instanceId, byId: args.witness.id, note: args.note } },
      {
        atYear: args.marked,
        action: {
          op: "renewable-claim",
          instanceId: args.nodeInstanceId,
          defId: args.defId,
          sourceKey: args.nodeKey,
        },
      },
      deny(args.marked, args.defId, args.sourceKey),
    ],
  };
}

const person = (id: string, name: string, lineage: string, generation: number): Person => ({
  id,
  name,
  lineage,
  generation,
});

export const STORIES: ItemStory[] = [
  donated({
    n: 1,
    slug: "plane-of-mara",
    title: "Mara's smoothing plane",
    summary:
      "Ellis gives Mara the smoothing plane in year 6. After Mara dies, her apprentice Lina is still using that same plane in year 20 — not a replacement from the shop wall.",
    defId: "def:tool.smoothing-plane",
    sourceKey: "heirloom:tool:smoothing-plane",
    holder: person("npc:mara", "Mara", "line:mara", 1),
    successor: person("npc:lina", "Lina", "line:mara", 2),
    siteId: "site:mara-shop",
    siteName: "Mara's shop",
    acquire: 2,
    donate: 6,
    death: 18,
    useYear: 20,
    useNote: "Lina dresses a pine sill with the plane Mara was given. The iron is the same iron.",
  }),
  donated({
    n: 2,
    slug: "billhook-of-bren",
    title: "Bren's billhook",
    summary:
      "The hedge billhook is donated to warden Bren and, years later, is in successor Cass's hand on the same hedge line.",
    defId: "def:tool.billhook",
    sourceKey: "heirloom:tool:billhook",
    holder: person("npc:bren", "Bren", "line:hedge", 1),
    successor: person("npc:cass", "Cass", "line:hedge", 2),
    siteId: "site:hedge-store",
    siteName: "Hedge store",
    acquire: 1,
    donate: 4,
    death: 22,
    useYear: 28,
    useNote: "Cass lays the billhook through the quickthorn. Bren's notch is still in the handle.",
  }),
  donated({
    n: 3,
    slug: "shuttle-of-nella",
    title: "Nella's shuttle",
    summary: "A loom shuttle given to weaver Nella is thrown by her successor Pio in the hall at year 42.",
    defId: "def:tool.loom-shuttle",
    sourceKey: "heirloom:tool:loom-shuttle",
    holder: person("npc:nella", "Nella", "line:weaving", 1),
    successor: person("npc:pio", "Pio", "line:weaving", 2),
    siteId: "site:weaving-hall",
    siteName: "Weaving hall",
    acquire: 3,
    donate: 8,
    death: 36,
    useYear: 42,
    useNote: "Pio throws Nella's shuttle through the same warp weights. No second shuttle was issued.",
  }),
  donated({
    n: 4,
    slug: "tongs-of-idris",
    title: "Idris's kiln tongs",
    summary: "Kiln tongs donated to potter Idris are the pair successor Sol uses when the kiln is drawn in year 56.",
    defId: "def:tool.kiln-tongs",
    sourceKey: "heirloom:tool:kiln-tongs",
    holder: person("npc:idris", "Idris", "line:kiln", 1),
    successor: person("npc:sol", "Sol", "line:kiln", 2),
    siteId: "site:kiln-yard",
    siteName: "Kiln yard",
    acquire: 2,
    donate: 5,
    death: 48,
    useYear: 56,
    useNote: "Sol draws the kiln with Idris's tongs. The bend in the left arm is the old bend.",
  }),
  donated({
    n: 5,
    slug: "chain-of-anwen",
    title: "Anwen's survey chain",
    summary: "The river survey chain given to Anwen is the chain successor Rhys stretches across the bend in year 70.",
    defId: "def:tool.survey-chain",
    sourceKey: "heirloom:tool:survey-chain",
    holder: person("npc:anwen", "Anwen", "line:survey", 1),
    successor: person("npc:rhys", "Rhys", "line:survey", 2),
    siteId: "site:survey-loft",
    siteName: "Survey loft",
    acquire: 4,
    donate: 10,
    death: 61,
    useYear: 70,
    useNote: "Rhys pins Anwen's chain at the old flood mark. The missing link was already missing.",
  }),
  donated({
    n: 6,
    slug: "key-of-odie",
    title: "Odie's chapel key",
    summary: "The chapel key donated to sexton Odie is the key successor Wen turns, well after year 70.",
    defId: "def:tool.chapel-key",
    sourceKey: "heirloom:tool:chapel-key",
    holder: person("npc:odie", "Odie", "line:chapel", 1),
    successor: person("npc:wen", "Wen", "line:chapel", 2),
    siteId: "site:chapel",
    siteName: "Chapel",
    acquire: 6,
    donate: 12,
    death: 77,
    useYear: 84,
    useNote: "Wen opens the side door with Odie's key. The ward was not recut.",
  }),
  donated({
    n: 7,
    slug: "bar-of-tam",
    title: "Tam's press bar",
    summary: "The cider press bar given to Tam is the bar successor Nell leans on when the orchard co-op presses in year 98.",
    defId: "def:tool.press-bar",
    sourceKey: "heirloom:tool:press-bar",
    holder: person("npc:tam", "Tam", "line:orchard", 1),
    successor: person("npc:nell", "Nell", "line:orchard", 2),
    siteId: "site:press-shed",
    siteName: "Press shed",
    acquire: 5,
    donate: 9,
    death: 88,
    useYear: 98,
    useNote: "Nell sets Tam's bar into the screw. The chew marks from the old press are still there.",
  }),
  donated({
    n: 8,
    slug: "needles-of-jos",
    title: "Jos's sail needles",
    summary: "Sail needles donated to ferryman Jos are the set successor Bram stitches with after the ferry changes hands.",
    defId: "def:tool.sail-needles",
    sourceKey: "heirloom:tool:sail-needles",
    holder: person("npc:jos", "Jos", "line:ferry", 1),
    successor: person("npc:bram", "Bram", "line:ferry", 2),
    siteId: "site:ferry-step",
    siteName: "Ferry step",
    acquire: 3,
    donate: 7,
    death: 33,
    useYear: 42,
    useNote: "Bram waxes Jos's needles for the lateen patch. The roll of cloth around them is the original roll.",
  }),
  restored({
    n: 9,
    slug: "fiddle-of-ash",
    title: "The ash fiddle",
    summary:
      "A cracked ash fiddle is repaired in Ellis's hands and later inherited by niece Sela. The repair is history on the same instrument, not a new fiddle.",
    defId: "def:instrument.ash-fiddle",
    sourceKey: "heirloom:instrument:ash-fiddle",
    heirId: "npc:sela",
    heirKind: "npc",
    heir: person("npc:sela", "Sela", "line:kin", 2),
    siteId: "site:kin-house",
    siteName: "Kin house",
    found: 11,
    repaired: 12,
    passed: 28,
    repairNote: "The soundpost is reset and the bass bar glued. This is the same ash body.",
    inheritNote: "Sela inherits the restored fiddle. Ellis does not keep a copy.",
  }),
  restored({
    n: 10,
    slug: "flute-of-reed",
    title: "The reed flute",
    summary: "A split reed flute is bound up and, years on, student Harl inherits that repaired flute.",
    defId: "def:instrument.reed-flute",
    sourceKey: "heirloom:instrument:reed-flute",
    heirId: "npc:harl",
    heirKind: "npc",
    heir: person("npc:harl", "Harl", "line:lesson", 2),
    siteId: "site:lesson-room",
    siteName: "Lesson room",
    found: 15,
    repaired: 16,
    passed: 42,
    repairNote: "The split is bound with waxed linen. The bore is not replaced.",
    inheritNote: "Harl inherits the flute he was taught on.",
  }),
  restored({
    n: 11,
    slug: "drum-of-the-chapel",
    title: "The processional drum",
    summary: "The processional drum is reheaded, then inherited by the chapel. The shell is the one that was cracked.",
    defId: "def:instrument.processional-drum",
    sourceKey: "heirloom:instrument:processional-drum",
    heirId: "inst:chapel",
    heirKind: "institution",
    siteId: "site:chapel-loft",
    siteName: "Chapel loft",
    found: 20,
    repaired: 22,
    passed: 56,
    repairNote: "A new head is tucked onto the old shell. The shell stays.",
    inheritNote: "The chapel inherits the drum for the procession. It is stewardship of one drum.",
  }),
  restored({
    n: 12,
    slug: "harp-of-the-house",
    title: "The lap harp",
    summary: "A lap harp is restrung after a fall and later inherited inside the house. The soundbox is unchanged.",
    defId: "def:instrument.lap-harp",
    sourceKey: "heirloom:instrument:lap-harp",
    heirId: "npc:house-heir",
    heirKind: "npc",
    heir: person("npc:house-heir", "Iona", "line:house", 3),
    siteId: "site:house-parlor",
    siteName: "House parlor",
    found: 30,
    repaired: 31,
    passed: 70,
    repairNote: "The strings are replaced. The soundbox, cracked and glued, is the same box.",
    inheritNote: "Iona inherits the parlor harp.",
  }),
  restored({
    n: 13,
    slug: "bell-of-the-tower",
    title: "The handbell",
    summary: "The handbell's clapper is reseated. Decades later the tower keeper inherits that bell, not a recast one.",
    defId: "def:instrument.handbell",
    sourceKey: "heirloom:instrument:handbell",
    heirId: "npc:tower-keeper",
    heirKind: "npc",
    heir: person("npc:tower-keeper", "Wes", "line:tower", 2),
    siteId: "site:bell-tower",
    siteName: "Bell tower",
    found: 40,
    repaired: 44,
    passed: 84,
    repairNote: "The clapper is reseated in the original crown. The bell is not melted.",
    inheritNote: "Wes inherits the handbell for the tower stair.",
  }),
  restored({
    n: 14,
    slug: "concertina-of-the-hall",
    title: "The concertina",
    summary: "New bellows go on an old concertina. The dance hall inherits that instrument long after year 70.",
    defId: "def:instrument.concertina",
    sourceKey: "heirloom:instrument:concertina",
    heirId: "inst:dance-hall",
    heirKind: "institution",
    siteId: "site:dance-hall",
    siteName: "Dance hall",
    found: 50,
    repaired: 52,
    passed: 98,
    repairNote: "The bellows are replaced. The reed pans stay the ones Ellis patched.",
    inheritNote: "The dance hall inherits the concertina for the Friday sets.",
  }),
  restored({
    n: 15,
    slug: "psaltery-of-the-school",
    title: "The school psaltery",
    summary: "A psaltery with a patched soundboard is left to the school. Pupils play the patched one.",
    defId: "def:instrument.psaltery",
    sourceKey: "heirloom:instrument:psaltery",
    heirId: "inst:school",
    heirKind: "institution",
    siteId: "site:school",
    siteName: "School",
    found: 18,
    repaired: 19,
    passed: 56,
    repairNote: "The soundboard crack is cleated from inside. The instrument is not retired.",
    inheritNote: "The school inherits the psaltery Ellis patched.",
  }),
  cache({
    n: 16,
    slug: "cache-of-the-bend",
    title: "The river-bend cache",
    summary: "The year-14 flood peels the bank and exposes one clay cache. The river bead inside can be taken up once. The bank does not restock it after a death.",
    defId: "def:relic.river-bead",
    sourceKey: "cache:river-bend:bead",
    siteId: "site:river-bend",
    siteName: "River bend",
    year: 14,
  }),
  cache({
    n: 17,
    slug: "cache-of-the-slip",
    title: "The quarry slip",
    summary: "A quarry slip in year 28 opens a mason's cache. The mark stone is one object. A second search of the slip finds nothing new.",
    defId: "def:relic.mason-mark",
    sourceKey: "cache:quarry-slip:mark",
    siteId: "site:quarry-slip",
    siteName: "Quarry slip",
    year: 28,
  }),
  cache({
    n: 18,
    slug: "cache-of-the-peat",
    title: "The peat bundle",
    summary: "Peat cutting in year 42 turns up a waxed packet. That packet is the find. Cutting the same face again does not mint another.",
    defId: "def:card.bog-packet",
    sourceKey: "cache:peat-cut:packet",
    siteId: "site:peat-cut",
    siteName: "Peat cut",
    year: 42,
  }),
  cache({
    n: 19,
    slug: "cache-of-the-root",
    title: "The orchard jar",
    summary: "When the old orchard is uprooted in year 56, a sealed jar comes up in the roots. It is food with a single origin, not a renewable pantry.",
    defId: "def:food.orchard-jar",
    sourceKey: "cache:orchard-root:jar",
    siteId: "site:orchard-root",
    siteName: "Uprooted orchard",
    year: 56,
  }),
  cache({
    n: 20,
    slug: "cache-of-the-niche",
    title: "The chapel niche",
    summary: "Subsidence in year 70 opens a sealed niche. The votive card inside is claimed once. The niche is not a grave to be re-looted each life.",
    defId: "def:card.votive",
    sourceKey: "cache:chapel-niche:votive",
    siteId: "site:chapel-niche",
    siteName: "Chapel niche",
    year: 70,
  }),
  cache({
    n: 21,
    slug: "cache-of-the-cut",
    title: "The road cut",
    summary: "The new road in year 84 slices a bank and shows a survey tin. The notes in it are one cache, still unique on a later return.",
    defId: "def:card.survey-notes",
    sourceKey: "cache:road-cut:notes",
    siteId: "site:road-cut",
    siteName: "Road cut",
    year: 84,
  }),
  cache({
    n: 22,
    slug: "cache-of-the-bar",
    title: "The tide-bar box",
    summary: "A shifted tide bar in year 98 uncovers the ferry strongbox token. Dying on that bar will not make a second token.",
    defId: "def:relic.ferry-strongbox",
    sourceKey: "cache:tide-bar:token",
    siteId: "site:tide-bar",
    siteName: "Tide bar",
    year: 98,
  }),
  family({
    n: 23,
    slug: "thimble-of-the-mother",
    title: "Mother's thimble",
    summary:
      "An ordinary thimble sits in storage until year 42, when neighbor Tess reads the hallmark and knows it was Ellis's mother's. It is the same thimble, still Ellis's.",
    defId: "def:inherited.mother-thimble",
    sourceKey: "heirloom:family:thimble",
    custody: "stored",
    witness: person("npc:tess", "Tess", "line:neighbors", 1),
    found: 0,
    recognized: 42,
    note: "Tess names the hallmark on the rim. The thimble is not replaced with a memorial copy.",
  }),
  family({
    n: 24,
    slug: "compass-of-the-father",
    title: "Father's compass",
    summary: "The compass Ellis carries is recognized in year 56 by a cousin who can still read the scratched initials.",
    defId: "def:inherited.father-compass",
    sourceKey: "heirloom:family:compass",
    custody: "carried",
    witness: person("npc:cousin-edal", "Edal", "line:kin", 2),
    found: 0,
    recognized: 56,
    note: "Edal reads the scratched initials and stops. The compass does not leave Ellis's pack.",
  }),
  family({
    n: 25,
    slug: "ribbon-of-the-sister",
    title: "Sister's ribbon",
    summary: "A ribbon on display is recognized in year 70 by the sister's child, who remembers the dye lot. Recognition does not confiscate it.",
    defId: "def:inherited.sister-ribbon",
    sourceKey: "heirloom:family:ribbon",
    custody: "displayed",
    siteId: "site:ribbon-shelf",
    siteName: "Ribbon shelf",
    witness: person("npc:sister-child", "Nia", "line:kin", 2),
    found: 1,
    recognized: 70,
    note: "Nia names the dye lot. The ribbon stays where it was displayed.",
  }),
  family({
    n: 26,
    slug: "pipe-of-the-uncle",
    title: "Uncle's pipe",
    summary: "A pipe kept in storage is recognized in year 84, long after the sixth principal era, by the bowl's plugged crack.",
    defId: "def:inherited.uncle-pipe",
    sourceKey: "heirloom:family:pipe",
    custody: "stored",
    witness: person("npc:old-neighbor", "Cal", "line:neighbors", 2),
    found: 2,
    recognized: 84,
    note: "Cal knows the plugged crack in the bowl. The pipe is still the stored one.",
  }),
  family({
    n: 27,
    slug: "spoon-of-the-gran",
    title: "Gran's spoon",
    summary: "A wooden spoon is recognized in year 28 by a neighbor who remembers the grain of Gran's carving.",
    defId: "def:inherited.gran-spoon",
    sourceKey: "heirloom:family:spoon",
    custody: "stored",
    witness: person("npc:gran-neighbor", "Moss", "line:neighbors", 1),
    found: 0,
    recognized: 28,
    note: "Moss names the grain direction on the handle. No commemorative spoon is carved.",
  }),
  family({
    n: 28,
    slug: "card-of-the-cousin",
    title: "The nicked heart",
    summary: "A playing card with a nicked corner is recognized in year 98 as the cousin's heart. The nick is the identity.",
    defId: "def:card.cousin-nick",
    sourceKey: "heirloom:family:cousin-card",
    custody: "carried",
    witness: person("npc:card-cousin", "Reed", "line:kin", 3),
    found: 4,
    recognized: 98,
    note: "Reed fits a thumb to the nick and laughs. The card is not a fresh deck.",
  }),
  family({
    n: 29,
    slug: "shawl-of-the-aunt",
    title: "Aunt's shawl",
    summary:
      "The shawl Ellis has kept on display is recognized in year 56 as the aunt's by its darned corner. Keeping it is not a ruin to be searched.",
    defId: "def:inherited.aunt-shawl",
    sourceKey: "heirloom:family:shawl",
    custody: "displayed",
    siteId: "site:shawl-peg",
    siteName: "Shawl peg",
    witness: person("npc:aunt-friend", "Hester", "line:neighbors", 1),
    found: 0,
    recognized: 56,
    note: "Hester knows the darn at the corner. The shawl remains on its peg.",
  }),
  historical({
    n: 30,
    slug: "token-of-the-famine",
    title: "The famine token",
    summary:
      "A market token Ellis used for bread is cited in the famine ledger in year 42. Day-tokens from the market node keep being ordinary. They are not this token.",
    defId: "def:card.market-token",
    sourceKey: "heirloom:card:famine-token",
    nodeKey: "node:market:day-token",
    nodeInstanceId: "inst:story.30.node",
    witness: person("npc:ledger-clerk", "Quill", "line:market", 2),
    found: 1,
    marked: 42,
    note: "Quill enters this token in the famine ledger. It is now historically marked and still the same disc.",
  }),
  historical({
    n: 31,
    slug: "stub-of-the-ferry",
    title: "The last ferry stub",
    summary:
      "A ferry stub from early on becomes, in year 70, the exhibit of the last pre-bridge crossing. New day-tickets do not become that stub.",
    defId: "def:card.ferry-ticket",
    sourceKey: "heirloom:card:last-ferry-stub",
    nodeKey: "node:ferry:day-ticket",
    nodeInstanceId: "inst:story.31.node",
    witness: person("npc:bridge-clerk", "Ann", "line:ferry", 2),
    found: 3,
    marked: 70,
    note: "Ann pins this stub as the last pre-bridge ticket. Later tickets are other instances.",
  }),
  historical({
    n: 32,
    slug: "slate-of-the-school",
    title: "The founding slate",
    summary: "A child's slate becomes the school's founding slate in year 56. Blank slates from the cupboard are not that slate.",
    defId: "def:equipment.school-slate",
    sourceKey: "heirloom:equipment:founding-slate",
    nodeKey: "node:school:blank-slate",
    nodeInstanceId: "inst:story.32.node",
    witness: person("npc:school-keeper", "Mab", "line:school", 1),
    found: 4,
    marked: 56,
    note: "Mab hangs this slate as the founding slate. The cupboard still issues blank ones.",
  }),
  historical({
    n: 33,
    slug: "lantern-of-the-flood",
    title: "The kitchen lantern",
    summary:
      "An ordinary kitchen lantern carried through a flood is called the flood lantern in year 28. It stays usable. The chandler's later lanterns are not it.",
    defId: "def:equipment.kitchen-lantern",
    sourceKey: "heirloom:equipment:flood-lantern",
    nodeKey: "node:chandler:lantern",
    nodeInstanceId: "inst:story.33.node",
    witness: person("npc:chandler", "Hob", "line:light", 1),
    found: 2,
    marked: 28,
    note: "Hob marks the kitchen lantern as the one that stayed lit in the flood. It is not retired and not copied.",
  }),
  historical({
    n: 34,
    slug: "stamp-of-the-coop",
    title: "The co-op stamp",
    summary: "A baker's ordinary stamp becomes the co-op's charter seal in year 84. A spare stamp from the shop is a different object.",
    defId: "def:tool.bread-stamp",
    sourceKey: "heirloom:tool:coop-stamp",
    nodeKey: "node:bakery:spare-stamp",
    nodeInstanceId: "inst:story.34.node",
    witness: person("npc:coop-clerk", "Bramble", "line:bakery", 2),
    found: 6,
    marked: 84,
    note: "Bramble adopts this stamp as the co-op seal. The spare in the drawer is not the seal.",
  }),
  historical({
    n: 35,
    slug: "bottle-of-the-treaty",
    title: "The treaty ink",
    summary: "A common ink bottle that held a treaty draft is marked in year 98. Stationer's ink bought later is not that bottle.",
    defId: "def:material.ink-bottle",
    sourceKey: "heirloom:material:treaty-ink",
    nodeKey: "node:stationer:ink",
    nodeInstanceId: "inst:story.35.node",
    witness: person("npc:clerk-of-treaty", "Ives", "line:clerks", 2),
    found: 8,
    marked: 98,
    note: "Ives identifies this bottle as the one that held the treaty draft. It is not emptied into a new story.",
  }),
  historical({
    n: 36,
    slug: "pouch-of-the-raising",
    title: "The raising pouch",
    summary:
      "The pouch from the first hall's raising becomes historically marked in year 42. Nails were ordinary and spent; a spare pouch from the smith is not this pouch.",
    defId: "def:inherited.nail-pouch",
    sourceKey: "heirloom:inherited:raising-pouch",
    nodeKey: "node:smith:spare-pouch",
    nodeInstanceId: "inst:story.36.node",
    witness: person("npc:hall-warden", "Stone", "line:hall", 1),
    found: 2,
    marked: 42,
    note: "Stone marks the pouch, not the nails that were already used, as the relic of the raising.",
  }),
];

export const STORY_ARCHETYPES: StoryArchetype[] = [
  "donated-tool-successor",
  "restored-instrument-inherited",
  "cache-exposed-by-land",
  "family-object-recognized",
  "ordinary-becomes-historical",
];

export function storiesByArchetype(archetype: StoryArchetype): ItemStory[] {
  return STORIES.filter((story) => story.archetype === archetype);
}
