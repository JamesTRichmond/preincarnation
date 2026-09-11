export type RelicId =
  | "shovel"
  | "hookshot"
  | "boots"
  | "flippers"
  | "lantern"
  | "hammer"
  | "net"
  | "mirror"
  | "cape"
  | "cane"
  | "bow"
  | "ipod"
  | "sword"
  | "bombs";

export type RelicDef = {
  id: RelicId;
  name: string;
  verb: string;
  slot: "Y" | "passive";
  ammo?: "arrows" | "bombs";
  desc: string;
};

export const RELICS: RelicDef[] = [
  { id: "sword", name: "Short iron", verb: "Slash / hold spin", slot: "passive", desc: "The blade you wake with. Hold to spin." },
  { id: "shovel", name: "Grave shovel", verb: "Dig", slot: "Y", desc: "Excavate a death site. Till a plot." },
  { id: "hookshot", name: "Sugar-line", verb: "Zip", slot: "Y", desc: "A grappling chain. Latch a post, a pot, a beast." },
  { id: "boots", name: "Gap boots", verb: "Dash", slot: "passive", desc: "Hold Shift. Vermont miles shorten." },
  { id: "flippers", name: "Creek fins", verb: "Swim", slot: "passive", desc: "Otter Creek will take you." },
  { id: "lantern", name: "Oil lamp", verb: "Light", slot: "Y", desc: "The quarry is dark without it." },
  { id: "hammer", name: "Marble hammer", verb: "Smash", slot: "Y", desc: "Cracked marble yields. The temple's gift." },
  { id: "net", name: "Bug net", verb: "Catch", slot: "Y", desc: "Crows, moths, the odd wandering light." },
  { id: "mirror", name: "Homestead glass", verb: "Return", slot: "Y", desc: "Walk home. The shrine remembers you." },
  { id: "cape", name: "Shadow cape", verb: "Phase", slot: "Y", desc: "A few steps through what would stop you." },
  { id: "cane", name: "Somaria rod", verb: "Block", slot: "Y", desc: "Raise a block. Spend mana." },
  { id: "bow", name: "Ash bow", verb: "Draw", slot: "Y", ammo: "arrows", desc: "Hold to draw, release to fire." },
  { id: "ipod", name: "Strange device", verb: "Play", slot: "Y", desc: "A pocket of other people's music. Yours, if you feed it." },
  { id: "bombs", name: "Powder kegs", verb: "Set", slot: "Y", ammo: "bombs", desc: "Crack a vein. Open a wall." },
];

export const RELIC_BY_ID = Object.fromEntries(RELICS.map((r) => [r.id, r])) as Record<RelicId, RelicDef>;

export type LifePath = "adventurer" | "farmer" | "tender" | "fisher" | "shepherd";

export const LIFE_PATHS: { id: LifePath; name: string; blurb: string }[] = [
  { id: "adventurer", name: "Keep walking", blurb: "The urge is loud. The quarry still waits." },
  { id: "farmer", name: "Work the land", blurb: "A plot, a season, a cellar. Bandits and blight still come." },
  { id: "tender", name: "Keep the inn", blurb: "Pour, listen, keep the peace. Nobles press the able-bodied." },
  { id: "fisher", name: "Work the creek", blurb: "Otter Creek feeds you if the ice doesn't." },
  { id: "shepherd", name: "Keep sheep", blurb: "The hills, the dogs, the cats that are not cats." },
];

export type Grave = {
  id: string;
  mapId: string;
  x: number;
  y: number;
  year: number;
  weapons: { id: string; name: string; magic: boolean; kind: string }[];
  relics: RelicId[];
  arrows: number;
  bombs: number;
  excavated: boolean;
};

export function erodeGrave(g: Grave, nowYear: number, rand: () => number = Math.random) {
  const years = Math.max(0, nowYear - g.year);
  const keptW = g.weapons.filter((w) => {
    if (w.magic) return true;
    if (g.excavated) return false;
    // climate + looters: mundane steel rarely lasts 14 winters in the open
    if (years >= 12) return rand() < 0.22;
    if (years >= 6) return rand() < 0.55;
    return rand() < 0.8;
  });
  const keptR = g.relics.filter((id) => {
    if (id === "sword" || id === "shovel") return years < 20;
    return true; // named relics persist if not looted
  });
  return { ...g, weapons: keptW, relics: keptR, arrows: years >= 8 ? 0 : Math.floor(g.arrows * 0.4), bombs: 0 };
}
