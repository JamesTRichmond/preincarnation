import type { HuntDef, HuntNode } from "./types.ts";

function n(id: string, name: string, look: string, refusal: string, neighbors: string[]): HuntNode {
  return { id, name, look, refusal, neighbors };
}

/**
 * Three hunts, two maps each. Both maps walk fair landmarks to the same cache.
 * Nothing in this data is an objective pin. The cache is a place you can stand.
 */
export const HUNTS: HuntDef[] = [
  {
    id: "hunt-sugar",
    title: "The sugar ridge tin",
    start: "trailhead",
    cache: "third-capstone",
    cacheLook:
      "The third capstone sits proud of the brook. The frost under its lip has been turned once, a long time ago, and then fitted back.",
    cacheVoice: {
      speaker: "Eli",
      text: "If you counted, you were meant to have it. If you guessed, put it back. I am not there to scold you either way.",
    },
    maps: [
      {
        docId: "doc-01",
        path: [
          "trailhead",
          "sugarhouse-door",
          "west-stone-wall",
          "lightning-oak",
          "first-capstone",
          "second-capstone",
          "third-capstone",
        ],
      },
      {
        docId: "doc-02",
        path: [
          "trailhead",
          "new-cupola",
          "steel-gate",
          "oak-stump",
          "first-capstone",
          "second-capstone",
          "third-capstone",
        ],
      },
    ],
    grants: ["dec-11", "dec-05", "doc-23", "doc-14"],
    nodes: [
      n(
        "trailhead",
        "ridge trailhead",
        "The tote road ends at a board nailed to a post. Sugaring tracks and deer tracks argue in the snow.",
        "The post has no hollow and no tin. It is only where the walking starts.",
        ["sugarhouse-door", "new-cupola", "brook-path"],
      ),
      n(
        "sugarhouse-door",
        "sugarhouse door",
        "The sugarhouse door is latched with a stick. Steam-ghost still stains the lintel from a boil years back.",
        "You search the sill and the woodpile. No tin. The door faces the wall, which is the point of standing here.",
        ["trailhead", "west-stone-wall"],
      ),
      n(
        "west-stone-wall",
        "west stone wall",
        "A low wall of fieldstone runs west, capstones uneven, brook noise on the far side.",
        "The wall is a road, not a hiding place. Nothing is tucked between these stones.",
        ["sugarhouse-door", "lightning-oak"],
      ),
      n(
        "lightning-oak",
        "lightning oak",
        "The oak is split and blackened down one side and still leafs on the other. From here the brook-side stones begin.",
        "You look in the split. Squirrel work, no tin. The capstones start if you step brook-side.",
        ["west-stone-wall", "first-capstone", "oak-stump"],
      ),
      n(
        "first-capstone",
        "first capstone",
        "The first capstone is bare, flat enough to sit, with snow blown clear off the top.",
        "Bare stone. This is the first capstone. Nothing is tucked under it.",
        ["lightning-oak", "second-capstone", "oak-stump", "brook-path"],
      ),
      n(
        "second-capstone",
        "second capstone",
        "The second capstone is cracked across the middle. Ice sits in the crack and shines.",
        "Cracked, and empty. This is the second capstone.",
        ["first-capstone", "third-capstone"],
      ),
      n(
        "third-capstone",
        "third capstone",
        "The third capstone is darker, brook-stained, and sits a little proud of the wall.",
        "The ground here has already given up what it had.",
        ["second-capstone", "oak-stump"],
      ),
      n(
        "new-cupola",
        "new cupola",
        "A later cupola, shingles still pale, looks over the ridge from the sugarhouse roof. You can stand under it without going in.",
        "The cupola is a landmark, not a box. The wind keeps it empty.",
        ["trailhead", "steel-gate"],
      ),
      n(
        "steel-gate",
        "steel gate",
        "A steel gate closes what used to be the end of the stone wall. The hinge is newer than the posts.",
        "You check the latch and the post hole. No tin. The gate only tells you the wall's old end.",
        ["new-cupola", "oak-stump"],
      ),
      n(
        "oak-stump",
        "oak stump",
        "The lightning oak is a stump now, pale wood still showing where the last of it came down. Brook-side, the capstones have not moved.",
        "The stump is hollow an inch deep with rot, not with a tin. The stones are the brook-side ones.",
        ["steel-gate", "first-capstone", "third-capstone", "lightning-oak"],
      ),
      n(
        "brook-path",
        "brook path",
        "A deer path follows the brook, softer snow, alder scratching at your sleeves.",
        "Only alder and ice. The path meets the capstones if you stay with it, and it hides nothing by itself.",
        ["trailhead", "first-capstone"],
      ),
    ],
  },
  {
    id: "hunt-chapel",
    title: "The chapel ledge box",
    start: "parish-steps",
    cache: "east-loose-slate",
    cacheLook:
      "The east loose slate rings when you tap it, a short bell note. Under it the dirt is dry, which the rest of the ledge is not.",
    cacheVoice: {
      speaker: "Jonah",
      text: "I put it where the slate rings so I would have to hear a bell to take it back. I never could.",
    },
    maps: [
      {
        docId: "doc-03",
        path: ["parish-steps", "horse-shed", "cedar-line", "ledge", "east-loose-slate"],
      },
      {
        docId: "doc-04",
        path: ["parish-steps", "new-ramp", "memorial-bench", "ledge", "east-loose-slate"],
      },
    ],
    grants: ["dec-34", "doc-20"],
    nodes: [
      n(
        "parish-steps",
        "parish steps",
        "The chapel steps are scraped down to stone. A rope scar marks the door frame where the bell rope used to be brought inside to thaw.",
        "The steps have been swept for decades. There is no box under them.",
        ["horse-shed", "new-ramp", "cemetery-gate"],
      ),
      n(
        "horse-shed",
        "horse shed",
        "The horse shed smells of old hay and cold iron. No horses. A window looks uphill at the cedars.",
        "You shift the hay with a boot. Mice, and a harness buckle, and no box.",
        ["parish-steps", "cedar-line"],
      ),
      n(
        "cedar-line",
        "cedar line",
        "Cedars planted in a file go uphill until the sky breaks on a stone ledge.",
        "The duff under the cedars is deep and empty. The line is only a way of walking.",
        ["horse-shed", "ledge", "cemetery-gate"],
      ),
      n(
        "ledge",
        "ledge",
        "The ledge breaks the sky. Slates lie along the east end, one of them seated less honestly than the others.",
        "The honest slates are frozen down. The one that sits proud is the east one, if you mean to tap.",
        ["cedar-line", "east-loose-slate", "memorial-bench"],
      ),
      n(
        "east-loose-slate",
        "east loose slate",
        "This slate tips when you put weight on the outer corner. Tap it and it rings.",
        "You already lifted what rang.",
        ["ledge"],
      ),
      n(
        "new-ramp",
        "new ramp",
        "A poured ramp covers the old side path. Boot grit and salt stain the concrete.",
        "There is no joint wide enough for a box. The ramp only replaces the walk beside the shed.",
        ["parish-steps", "memorial-bench"],
      ),
      n(
        "memorial-bench",
        "memorial bench",
        "A bench faces the valley where the first cedar stood. The plaque is Ada's husband's, not the boy's.",
        "You look under the bench. A candy wrapper and last year's leaves. No box.",
        ["new-ramp", "ledge"],
      ),
      n(
        "cemetery-gate",
        "cemetery gate",
        "The iron gate to the small yard sticks halfway. Stones inside face the road.",
        "The gate post is solid. This is not the ledge, and nothing is buried in the track.",
        ["parish-steps", "cedar-line"],
      ),
    ],
  },
  {
    id: "hunt-river",
    title: "The river lot jar",
    start: "landing",
    cache: "third-flood-stake",
    cacheLook:
      "The third flood stake is unpainted and sound. The hollow under the cut is packed with river gravel that a hand, not the current, put back.",
    cacheVoice: {
      speaker: "Mae",
      text: "Count downstream of the willow, not downstream of your fear. The painted one is a liar. I made it a liar.",
    },
    maps: [
      {
        docId: "doc-05",
        path: ["landing", "log-boom", "leaning-willow", "painted-stake", "bent-stake", "third-flood-stake"],
      },
      {
        docId: "doc-06",
        path: ["landing", "boat-ramp", "culvert", "willow-stump", "painted-stake", "bent-stake", "third-flood-stake"],
      },
    ],
    grants: ["dec-36", "doc-17"],
    nodes: [
      n(
        "landing",
        "landing",
        "The landing is a shelf of gravel where the boats used to take the eddy. Ice shelves the slow water.",
        "Gravel and a rusted ring bolt. No jar. The lot is downstream of here.",
        ["log-boom", "boat-ramp", "sandbar"],
      ),
      n(
        "log-boom",
        "log boom",
        "A few boom logs still chain to a pin, half sunk, collecting leaves and ice.",
        "You work a hand under the chain. Cold, and a sunk branch, and no jar.",
        ["landing", "leaning-willow"],
      ),
      n(
        "leaning-willow",
        "leaning willow",
        "What is left of the willow leans over the lot, branches sweeping the stakes downstream.",
        "The roots are a roomy tangle and hold only silt. The stakes start downstream of the trunk.",
        ["log-boom", "painted-stake", "willow-stump"],
      ),
      n(
        "painted-stake",
        "painted stake",
        "The first stake downstream is painted white, brighter than any flood crew would bother with now.",
        "The paint is a house paint. The hollow under it is empty on purpose. This is the painted stake, the liar.",
        ["leaning-willow", "bent-stake", "willow-stump"],
      ),
      n(
        "bent-stake",
        "bent stake",
        "The next stake leans, bent by ice, unpainted, split at the top.",
        "Split wood, no hollow that goes anywhere. This is the bent stake. Empty.",
        ["painted-stake", "third-flood-stake"],
      ),
      n(
        "third-flood-stake",
        "third flood stake",
        "The third flood stake is straight, unpainted, and cut flat. Gravel at its foot looks placed.",
        "The gravel has already been lifted once.",
        ["bent-stake", "willow-stump"],
      ),
      n(
        "boat-ramp",
        "boat ramp",
        "A newer ramp of crushed stone comes down to the water where the eddy used to be worked by hand.",
        "The ramp is loose stone all the way through. A jar would have shown. It does not.",
        ["landing", "culvert"],
      ),
      n(
        "culvert",
        "culvert",
        "A culvert mouths under the ramp road. Pale wood lies just downstream of it.",
        "The culvert runs clean and cold. Nothing is wedged but a stick.",
        ["boat-ramp", "willow-stump"],
      ),
      n(
        "willow-stump",
        "willow stump",
        "The willow snapped. The stump is pale and still wet at the heartwood. Downstream, the stakes have not been renumbered.",
        "Rot and high-water grit. No jar in the stump. The stakes below it are the count.",
        ["culvert", "leaning-willow", "painted-stake", "third-flood-stake"],
      ),
      n(
        "sandbar",
        "sandbar",
        "A sandbar puts its back into the current. Clam shells and a piece of blue cup that is not yours.",
        "Only sand and clam shells. The lot is not this bar.",
        ["landing"],
      ),
    ],
  },
];

const byId = new Map(HUNTS.map((hunt) => [hunt.id, hunt]));

export function getHunt(id: string): HuntDef | undefined {
  return byId.get(id);
}

export function mustHunt(id: string): HuntDef {
  const hunt = byId.get(id);
  if (!hunt) throw new Error(`Unknown hunt ${id}`);
  return hunt;
}

export function huntNode(hunt: HuntDef, nodeId: string): HuntNode | undefined {
  return hunt.nodes.find((node) => node.id === nodeId);
}

export function pathWalks(hunt: HuntDef, path: readonly string[]): boolean {
  if (path.length < 2) return false;
  if (path[0] !== hunt.start) return false;
  if (path[path.length - 1] !== hunt.cache) return false;
  for (let i = 0; i < path.length - 1; i += 1) {
    const node = huntNode(hunt, path[i] as string);
    const next = path[i + 1] as string;
    if (!node || !node.neighbors.includes(next)) return false;
  }
  return true;
}

/** Every landmark can be walked to from the start. No stranded cache. */
export function reachableFromStart(hunt: HuntDef): string[] {
  const seen = new Set<string>([hunt.start]);
  const queue = [hunt.start];
  while (queue.length) {
    const id = queue.shift() as string;
    const node = huntNode(hunt, id);
    if (!node) continue;
    for (const next of node.neighbors) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return [...seen];
}

export function namesInOrder(body: string, names: readonly string[]): boolean {
  let at = 0;
  const hay = body.toLowerCase();
  for (const name of names) {
    const i = hay.indexOf(name.toLowerCase(), at);
    if (i < 0) return false;
    at = i + name.length;
  }
  return true;
}
