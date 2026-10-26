import type { Camp, InstrumentId, ItemStack, SupportedAction } from "./types.ts";

export const ITEM_LABELS: Record<string, string> = {
  "spruce-resin": "spruce resin",
  "wick-fiber": "wick fiber",
  "heat-charge": "heat charge",
  "oak-gall": "oak gall",
  "iron-flake": "iron flake",
  water: "water",
  "cedar-sprig": "cedar sprig",
  "maple-sap": "maple sap",
  "snow-tray": "snow tray",
  "bone-flute": "bone flute",
  fiber: "fiber",
  "beech-ash": "beech ash",
  "deer-fat": "deer fat",
  "spruce-needle": "spruce needle",
  "paper-bark": "paper bark",
  hide: "hide",
  "drum-head": "drum head",
  salt: "salt",
  berry: "berry",
  coal: "coal",
  sinew: "sinew",
  lyre: "lyre",
  "lamp-hours": "lamp hours",
  "ink-vial": "ink vial",
  "steam-mend": "steam mend",
  "sugar-cake": "sugar cake",
  "candle-hours": "candle hours",
  "chest-rub": "chest rub",
  kindling: "kindling",
  "smoked-hide": "smoked hide",
  "preserved-berry": "preserved berry",
  "ink-cake": "ink cake",
  "mend-kit": "mend kit",
  "lye-wash": "lye wash",
};

const FRESH_PANTRY: Record<string, number> = {
  "spruce-resin": 4,
  "wick-fiber": 4,
  "heat-charge": 8,
  "oak-gall": 2,
  "iron-flake": 2,
  water: 8,
  "cedar-sprig": 2,
  "maple-sap": 4,
  "snow-tray": 2,
  "bone-flute": 1,
  fiber: 6,
  "beech-ash": 3,
  "deer-fat": 3,
  "spruce-needle": 2,
  "paper-bark": 2,
  hide: 2,
  "drum-head": 1,
  salt: 2,
  berry: 2,
  coal: 2,
  sinew: 2,
  lyre: 1,
  "ink-vial": 1,
};

export function freshCamp(): Camp {
  return {
    pantry: { ...FRESH_PANTRY },
    tuningCents: {},
    drumDamp: false,
    notebook: [],
    hintCharges: 0,
    frostWard: 0,
    shelterToken: 0,
    bankedHeat: 0,
    mendBonus: 0,
    rationBonus: 0,
    inkPages: 0,
  };
}

export function campBonuses(camp: Camp): {
  frostWard: number;
  shelterToken: number;
  bankedHeat: number;
  mend: number;
  ration: number;
  hintCharges: number;
} {
  return {
    frostWard: camp.frostWard,
    shelterToken: camp.shelterToken,
    bankedHeat: camp.bankedHeat,
    mend: camp.mendBonus,
    ration: camp.rationBonus,
    hintCharges: camp.hintCharges,
  };
}

function clone(camp: Camp): Camp {
  return {
    ...camp,
    pantry: { ...camp.pantry },
    tuningCents: { ...camp.tuningCents },
    notebook: [...camp.notebook],
  };
}

function stocked(camp: Camp, inputs: ItemStack[], tools: string[]): boolean {
  for (const input of inputs) if ((camp.pantry[input.id] ?? 0) < input.n) return false;
  for (const tool of tools) if ((camp.pantry[tool] ?? 0) < 1) return false;
  return true;
}

function craft(opts: {
  id: string;
  kind: SupportedAction["kind"];
  name: string;
  station: string;
  inputs?: ItemStack[];
  tools?: string[];
  outputs?: ItemStack[];
  resultPhrase: string;
  apply?: (camp: Camp) => void;
}): SupportedAction {
  const inputs = opts.inputs ?? [];
  const tools = opts.tools ?? [];
  const outputs = opts.outputs ?? [];
  return {
    id: opts.id,
    kind: opts.kind,
    name: opts.name,
    station: opts.station,
    inputs,
    tools,
    outputs,
    resultPhrase: opts.resultPhrase,
    perform(camp) {
      const next = clone(camp);
      if (!stocked(next, inputs, tools)) return camp;
      for (const input of inputs) next.pantry[input.id] -= input.n;
      for (const output of outputs) next.pantry[output.id] = (next.pantry[output.id] ?? 0) + output.n;
      opts.apply?.(next);
      return next;
    },
  };
}

function tune(id: InstrumentId, cents: number) {
  return (camp: Camp) => {
    camp.tuningCents[id] = cents;
  };
}

export const ACTIONS: SupportedAction[] = [
  craft({
    id: "recipe.knowledge.pitch-lamp",
    kind: "recipe",
    name: "Pitch Lamp",
    station: "hearth",
    inputs: [
      { id: "spruce-resin", n: 1 },
      { id: "wick-fiber", n: 1 },
      { id: "heat-charge", n: 1 },
    ],
    outputs: [{ id: "lamp-hours", n: 6 }],
    resultPhrase: "the cup holds six lamp hours",
  }),
  craft({
    id: "recipe.knowledge.iron-gall",
    kind: "recipe",
    name: "Iron Gall Ink",
    station: "ink bench",
    inputs: [
      { id: "oak-gall", n: 1 },
      { id: "iron-flake", n: 1 },
      { id: "water", n: 1 },
    ],
    outputs: [{ id: "ink-vial", n: 1 }],
    resultPhrase: "the water has turned to an ink vial",
  }),
  craft({
    id: "recipe.knowledge.cedar-steam",
    kind: "recipe",
    name: "Cedar Steam",
    station: "hearth",
    inputs: [
      { id: "cedar-sprig", n: 1 },
      { id: "water", n: 1 },
      { id: "heat-charge", n: 1 },
    ],
    outputs: [{ id: "steam-mend", n: 1 }],
    resultPhrase: "you have a steam mend and one mend for the next match",
    apply: (camp) => {
      camp.mendBonus += 1;
    },
  }),
  craft({
    id: "recipe.knowledge.first-boil",
    kind: "recipe",
    name: "First Boil",
    station: "boil pan",
    inputs: [
      { id: "maple-sap", n: 2 },
      { id: "heat-charge", n: 1 },
    ],
    outputs: [{ id: "sugar-cake", n: 1 }],
    resultPhrase: "the pan leaves one sugar cake",
  }),
  craft({
    id: "interaction.knowledge.snow-print",
    kind: "notebook",
    name: "Snow Print",
    station: "yard",
    inputs: [{ id: "snow-tray", n: 1 }],
    resultPhrase: "a fox print is in the notebook and you hold one sugar-line hint",
    apply: (camp) => {
      camp.notebook.push("print: small oval, four toes, no claw — fox");
      camp.hintCharges += 1;
    },
  }),
  craft({
    id: "interaction.knowledge.tune-flute",
    kind: "instrument",
    name: "Flute Tuning",
    station: "instrument bench",
    tools: ["bone-flute"],
    resultPhrase: "the bone flute sits ten cents flat of the bench pitch",
    apply: tune("bone-flute", -10),
  }),
  craft({
    id: "recipe.knowledge.wick-braid",
    kind: "recipe",
    name: "Wick Braid",
    station: "fiber bench",
    inputs: [{ id: "fiber", n: 3 }],
    outputs: [{ id: "wick-fiber", n: 1 }],
    resultPhrase: "three strands have become one wick fiber",
  }),
  craft({
    id: "recipe.knowledge.beech-wash",
    kind: "recipe",
    name: "Beech Ash Wash",
    station: "wash bench",
    inputs: [
      { id: "beech-ash", n: 1 },
      { id: "water", n: 1 },
    ],
    outputs: [{ id: "lye-wash", n: 1 }],
    resultPhrase: "the cloth yields one lye wash",
  }),
  craft({
    id: "recipe.knowledge.deer-dip",
    kind: "recipe",
    name: "Deer-Fat Dip",
    station: "hearth",
    inputs: [
      { id: "deer-fat", n: 1 },
      { id: "wick-fiber", n: 1 },
      { id: "heat-charge", n: 1 },
    ],
    outputs: [{ id: "candle-hours", n: 4 }],
    resultPhrase: "the dip leaves four candle hours",
  }),
  craft({
    id: "recipe.knowledge.needle-rub",
    kind: "recipe",
    name: "Needle Rub",
    station: "work board",
    inputs: [
      { id: "spruce-needle", n: 1 },
      { id: "deer-fat", n: 1 },
    ],
    outputs: [{ id: "chest-rub", n: 1 }],
    resultPhrase: "you have a chest rub and one mend for the next match",
    apply: (camp) => {
      camp.mendBonus += 1;
    },
  }),
  craft({
    id: "recipe.knowledge.birch-peel",
    kind: "recipe",
    name: "Birch Peel",
    station: "wood yard",
    inputs: [{ id: "paper-bark", n: 1 }],
    outputs: [{ id: "kindling", n: 2 }],
    resultPhrase: "the peel gives kindling and one banked heat",
    apply: (camp) => {
      camp.bankedHeat += 1;
    },
  }),
  craft({
    id: "recipe.knowledge.hide-smoke",
    kind: "recipe",
    name: "Hide Smoke",
    station: "smoke rack",
    inputs: [
      { id: "hide", n: 1 },
      { id: "heat-charge", n: 1 },
    ],
    outputs: [{ id: "smoked-hide", n: 1 }],
    resultPhrase: "the smoked hide adds one shelter token to every night of the next match",
    apply: (camp) => {
      camp.shelterToken += 1;
    },
  }),
  craft({
    id: "interaction.knowledge.damp-drum",
    kind: "instrument",
    name: "Drum Damp",
    station: "instrument bench",
    tools: ["drum-head"],
    resultPhrase: "the frame drum is damp and speaks shorter",
    apply: (camp) => {
      camp.drumDamp = true;
    },
  }),
  craft({
    id: "recipe.knowledge.salt-draw",
    kind: "recipe",
    name: "Salt Draw",
    station: "cellar",
    inputs: [
      { id: "salt", n: 1 },
      { id: "berry", n: 1 },
    ],
    outputs: [{ id: "preserved-berry", n: 1 }],
    resultPhrase: "the crock gives one preserved berry and one ration in the next match",
    apply: (camp) => {
      camp.rationBonus += 1;
    },
  }),
  craft({
    id: "interaction.knowledge.coal-bank",
    kind: "camp",
    name: "Coal Bank",
    station: "hearth",
    inputs: [
      { id: "coal", n: 1 },
      { id: "beech-ash", n: 1 },
    ],
    resultPhrase: "two heat are banked for the next match",
    apply: (camp) => {
      camp.bankedHeat += 2;
    },
  }),
  craft({
    id: "recipe.knowledge.ink-press",
    kind: "recipe",
    name: "Ink Press",
    station: "ink bench",
    inputs: [
      { id: "ink-vial", n: 1 },
      { id: "heat-charge", n: 1 },
    ],
    outputs: [{ id: "ink-cake", n: 1 }],
    resultPhrase: "the press leaves an ink cake and a notebook page",
    apply: (camp) => {
      camp.inkPages += 1;
    },
  }),
  craft({
    id: "interaction.knowledge.thaw-watch",
    kind: "notebook",
    name: "Thaw Watch",
    station: "door",
    resultPhrase: "the next winter match opens under a frost ward",
    apply: (camp) => {
      camp.frostWard += 1;
      camp.notebook.push("thaw watch: notch cut at dawn, icicle shorter than yesterday");
    },
  }),
  craft({
    id: "interaction.knowledge.lyre-peg",
    kind: "instrument",
    name: "Lyre Peg",
    station: "instrument bench",
    tools: ["lyre"],
    resultPhrase: "the lyre sits eight cents sharp",
    apply: tune("lyre", 8),
  }),
  craft({
    id: "interaction.knowledge.sap-knot",
    kind: "sugarline",
    name: "Sap Knot",
    station: "maple lane",
    resultPhrase: "you can mark two sugar cells on a line",
    apply: (camp) => {
      camp.hintCharges += 2;
    },
  }),
  craft({
    id: "recipe.knowledge.resin-wrap",
    kind: "recipe",
    name: "Resin Wrap",
    station: "work board",
    inputs: [
      { id: "spruce-resin", n: 1 },
      { id: "sinew", n: 1 },
    ],
    outputs: [{ id: "mend-kit", n: 1 }],
    resultPhrase: "the wrap is a mend kit and one mend for the next match",
    apply: (camp) => {
      camp.mendBonus += 1;
    },
  }),
];

export const ACTIONS_BY_ID = new Map(ACTIONS.map((action) => [action.id, action]));

export function canRun(action: SupportedAction, camp: Camp): boolean {
  return stocked(camp, action.inputs, action.tools);
}
