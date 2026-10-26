import type {
  CacheDef,
  Catalog,
  Category,
  EffectName,
  ItemDef,
  Recipe,
  Slot,
  Source,
  StatName,
  UseSpec,
} from "./types.ts";

export const CATALOG_VERSION = "grok-57-candidate-1";
export const CANDIDATE_PACK = "grok-57-candidate";
export const TARGET_DEFINITIONS = 768;

export const MATERIAL_VALUE: Record<string, number> = {
  scrap: 1,
  fiber: 1,
  wax: 2,
  brass: 2,
  timber: 1,
  stone: 1,
  cloth: 2,
  shard: 1,
  herb: 2,
  salt: 2,
  ink: 2,
  sugar: 2,
};

export const SITES = [
  { id: "middlebury-green", name: "Middlebury Green" },
  { id: "vergennes-wharf", name: "Vergennes Wharf" },
  { id: "bristol-notch", name: "Bristol Notch" },
  { id: "cornwall-orchard", name: "Cornwall Orchard" },
  { id: "ferrisburgh-dock", name: "Ferrisburgh Dock" },
  { id: "goshen-bog", name: "Goshen Bog" },
  { id: "lincoln-gap", name: "Lincoln Gap" },
  { id: "monkton-ridge", name: "Monkton Ridge" },
  { id: "new-haven-mill", name: "New Haven Mill" },
  { id: "orwell-ledge", name: "Orwell Ledge" },
  { id: "panton-ferry", name: "Panton Ferry" },
  { id: "ripton-notch", name: "Ripton Notch" },
  { id: "shoreham-cove", name: "Shoreham Cove" },
  { id: "starksboro-sugarhouse", name: "Starksboro Sugarhouse" },
  { id: "waltham-meadow", name: "Waltham Meadow" },
  { id: "weybridge-falls", name: "Weybridge Falls" },
] as const;

export const TOWNS = [
  "Middlebury",
  "Vergennes",
  "Bristol",
  "Cornwall",
  "Ferrisburgh",
  "Goshen",
  "Lincoln",
  "Monkton",
  "New Haven",
  "Orwell",
  "Panton",
  "Ripton",
  "Shoreham",
  "Starksboro",
  "Waltham",
  "Weybridge",
] as const;

export const START_SITE = "middlebury-green";
export const HOME_SITE = "ripton-notch";
export const STORE_SITE = "vergennes-wharf";

export function siteName(id: string): string {
  return SITES.find((s) => s.id === id)?.name ?? id;
}

export function letterSiteId(index: number): string {
  return SITES[(index + 5) % SITES.length]!.id;
}

export function cacheSiteId(index: number): string {
  return SITES[(index + 15) % SITES.length]!.id;
}

interface Family {
  key: string;
  noun: string;
  value: number;
  small?: boolean;
  useA: (variant: number) => UseSpec;
  salvage: Record<string, number>;
}

const FAMILIES: Family[] = [
  {
    key: "nail",
    noun: "cut nail",
    value: 4,
    small: true,
    useA: () => ({ op: "repair", amount: 20, slot: "hands" }),
    salvage: { scrap: 2 },
  },
  {
    key: "cord",
    noun: "hemp cord",
    value: 4,
    useA: (v) => ({ op: "bind", cacheId: `cache.${v}` }),
    salvage: { fiber: 2 },
  },
  {
    key: "tinder",
    noun: "tinder tin",
    value: 5,
    useA: () => ({ op: "light", turns: 4 }),
    salvage: { wax: 1 },
  },
  {
    key: "tin",
    noun: "biscuit tin",
    value: 6,
    useA: () => ({ op: "store" }),
    salvage: { scrap: 1 },
  },
  {
    key: "key",
    noun: "ward key",
    value: 8,
    small: true,
    useA: (v) => ({ op: "unlock", lockId: `lock.${v}` }),
    salvage: { brass: 1 },
  },
  {
    key: "pencil",
    noun: "ledger pencil",
    value: 3,
    small: true,
    useA: () => ({ op: "annotate" }),
    salvage: { timber: 1 },
  },
  {
    key: "compass",
    noun: "survey compass",
    value: 9,
    useA: (v) => ({ op: "survey", siteId: SITES[v]!.id }),
    salvage: { brass: 1 },
  },
  {
    key: "press",
    noun: "press stone",
    value: 5,
    useA: () => ({ op: "press" }),
    salvage: { stone: 2 },
  },
  {
    key: "knife",
    noun: "pocket knife",
    value: 7,
    useA: () => ({ op: "cut" }),
    salvage: { scrap: 1 },
  },
  {
    key: "linen",
    noun: "linen strip",
    value: 4,
    small: true,
    useA: () => ({ op: "bandage", amount: 8 }),
    salvage: { cloth: 1 },
  },
  {
    key: "glass",
    noun: "signal glass",
    value: 5,
    useA: (v) => ({ op: "signal", siteId: SITES[v]!.id }),
    salvage: { shard: 2 },
  },
  {
    key: "wedge",
    noun: "slate wedge",
    value: 3,
    useA: (v) => ({ op: "wedge", stuckId: `stuck.${v}` }),
    salvage: { stone: 1 },
  },
];

export const FAMILY_KEYS = FAMILIES.map((f) => f.key);

const SLOT_META: Record<Slot, { noun: string; stat: EffectName; inputs: Record<string, number> }> =
  {
    hands: { noun: "work gloves", stat: "grip", inputs: { scrap: 2, fiber: 1 } },
    feet: { noun: "mud boots", stat: "trail", inputs: { cloth: 2, fiber: 1 } },
    head: { noun: "barn lamp", stat: "night", inputs: { scrap: 1, wax: 1 } },
    body: { noun: "wool coat", stat: "cold", inputs: { cloth: 2, fiber: 2 } },
    tool: { noun: "chapel chisel", stat: "chapel", inputs: { scrap: 2, brass: 1 } },
    pack: { noun: "market pack", stat: "carry", inputs: { cloth: 1, fiber: 2 } },
  };

const CLOTHS = ["oiled", "patched", "chapel", "barn", "ferry", "slate", "wool", "copper"];

const PROVISIONS: { key: string; noun: string; stat: StatName; amount: number; value: number }[] = [
  { key: "oil", noun: "lamp oil", stat: "light", amount: 6, value: 6 },
  { key: "salt", noun: "dairy salt", stat: "warmth", amount: 4, value: 5 },
  { key: "tonic", noun: "switchel tonic", stat: "health", amount: 7, value: 8 },
  { key: "fodder", noun: "oat fodder", stat: "satiation", amount: 5, value: 4 },
  { key: "char", noun: "char cloth", stat: "warmth", amount: 3, value: 4 },
  { key: "wick", noun: "cotton wick", stat: "light", amount: 4, value: 4 },
  { key: "salve", noun: "pine salve", stat: "health", amount: 5, value: 6 },
  { key: "meal", noun: "johnnycake meal", stat: "satiation", amount: 8, value: 7 },
];

const SUITS: { key: string; stat: StatName; label: string }[] = [
  { key: "stone", stat: "guard", label: "Stone" },
  { key: "river", stat: "clue", label: "River" },
  { key: "orchard", stat: "satiation", label: "Orchard" },
  { key: "chapel", stat: "memory", label: "Chapel" },
];

const FOODS = [
  "sheepnose apple",
  "sage cheddar",
  "rye loaf",
  "soldier bean",
  "maple sugar",
  "russet cider",
  "oat cake",
  "brook trout",
  "butternut pie",
  "new milk",
  "pickle spear",
  "honeycomb",
  "boiled egg",
  "venison strip",
  "corn grits",
  "plum butter",
  "onion roll",
  "cabbage soup",
  "pear slice",
  "walnut meat",
  "carrot coin",
  "berry jam",
  "potato cake",
  "clam fritter",
  "squash bread",
  "cream cheese",
  "barley stew",
  "smelt fry",
  "molasses cookie",
  "cider doughnut",
  "turnip mash",
  "bacon end",
  "parsnip coin",
  "currant bun",
  "mutton hash",
  "pumpkin custard",
  "leek pie",
  "chestnut",
  "radish",
  "broth cube",
];

const DECOR = [
  "parlor quilt",
  "cross-stitch sampler",
  "tin weathervane",
  "stoneware crock",
  "oil portrait",
  "sleigh bell",
  "tavern sign",
  "dried wreath",
  "shelf clock",
  "foxed mirror",
  "milking stool",
  "rag rug",
  "glass lamp",
  "ash basket",
  "iron andiron",
  "county map",
  "duck decoy",
  "raw snowshoe",
  "ox yoke",
  "butter churn",
];

const RELIC_BASES = [
  "Otter Creek reliquary",
  "shard-barn nail",
  "ferry token",
  "sugarhouse dipper",
  "slate heart",
  "chapel key-saint",
  "millstone chip",
  "copper thimble",
  "ledger clasp",
  "widow's locket",
  "ice-harvest hook",
  "school bell clapper",
  "marble oddment",
  "sheep-bell",
  "survey chain link",
  "mourning brooch",
];

const TOPICS = [
  "the wall cache",
  "a missing deed",
  "the mill fire",
  "winter stores",
  "a drowned skiff",
  "the chapel plate",
  "boundary oaks",
  "an unpaid note",
];

function yieldValue(yields: Record<string, number>): number {
  let n = 0;
  for (const [mat, qty] of Object.entries(yields)) n += (MATERIAL_VALUE[mat] ?? 0) * qty;
  return n;
}

function objectSource(familyIndex: number, variant: number): Source {
  if (variant <= 9) return { kind: "site", siteId: SITES[variant]!.id };
  if (variant <= 13) return { kind: "merchant" };
  const k = familyIndex * 2 + (variant - 14);
  return { kind: "cache", cacheId: `cache.${24 + k}` };
}

function cacheRewardId(cacheIndex: number): string {
  if (cacheIndex < 24) return `rel.${24 + cacheIndex}`;
  const k = cacheIndex - 24;
  const familyIndex = Math.floor(k / 2);
  const variant = 14 + (k % 2);
  return `obj.${FAMILIES[familyIndex]!.key}.${variant}`;
}

function blurb(name: string, line: string): string {
  return `${name}. ${line}`;
}

export function matValue(yields: Record<string, number>): number {
  return yieldValue(yields);
}

function build(): Catalog {
  const items: ItemDef[] = [];
  const recipes: Recipe[] = [];
  const caches: CacheDef[] = [];

  for (let c = 0; c < 48; c++) {
    caches.push({
      id: `cache.${c}`,
      siteId: cacheSiteId(c),
      rewardDefId: cacheRewardId(c),
      primaryLetterId: `evi.${c}`,
      corroboratingLetterId: `evi.${48 + c}`,
    });
  }

  FAMILIES.forEach((fam, familyIndex) => {
    for (let variant = 0; variant < 16; variant++) {
      const id = `obj.${fam.key}.${variant}`;
      const source = objectSource(familyIndex, variant);
      const salvageValue = yieldValue(fam.salvage);
      if (salvageValue > fam.value) {
        throw new Error(`salvage exceeds value for ${id}`);
      }
      const useA = fam.useA(variant);
      const refs = [id];
      if (source.kind === "site") refs.push(source.siteId);
      if (source.kind === "cache")
        refs.push(source.cacheId, `evi.${source.cacheId.slice("cache.".length)}`);
      if (useA.op === "bind") refs.push(useA.cacheId);
      if (useA.op === "unlock") refs.push(useA.lockId);
      if (useA.op === "survey" || useA.op === "signal") refs.push(useA.siteId);
      if (useA.op === "wedge") refs.push(useA.stuckId);
      items.push({
        id,
        name: `${TOWNS[variant]} ${fam.noun}`,
        category: "object",
        pack: CANDIDATE_PACK,
        blurb: blurb(
          `${TOWNS[variant]} ${fam.noun}`,
          `Two working uses: ${useA.op}, then salvage into ${Object.keys(fam.salvage).join("/")}.`,
        ),
        value: fam.value,
        tags: fam.small ? ["small", fam.key] : [fam.key],
        uses: [useA, { op: "salvage", yields: { ...fam.salvage } }],
        source,
        refs,
        small: Boolean(fam.small),
      });
    }
  });

  const slots: Slot[] = ["hands", "feet", "head", "body", "tool", "pack"];
  for (const slot of slots) {
    const meta = SLOT_META[slot];
    for (let i = 0; i < 16; i++) {
      const id = `eq.${slot}.${i}`;
      const amt = 10 + (i % 4);
      const recipeId = `recipe.eq.${slot}.${i}`;
      const fromRecipe = i % 2 === 1;
      if (fromRecipe) {
        recipes.push({ id: recipeId, outputDefId: id, inputs: { ...meta.inputs }, kind: "craft" });
      }
      const value = yieldValue(meta.inputs);
      const cloth = CLOTHS[i % CLOTHS.length]!;
      const source: Source = fromRecipe
        ? { kind: "recipe", recipeId }
        : { kind: "site", siteId: SITES[i % SITES.length]!.id };
      items.push({
        id,
        name: `${TOWNS[i]} ${cloth} ${meta.noun}`,
        category: "equipment",
        pack: CANDIDATE_PACK,
        blurb: blurb(
          `${TOWNS[i]} ${cloth} ${meta.noun}`,
          `Equipped, it raises ${meta.stat} by ${amt}. The gate ${meta.stat} needs 10.`,
        ),
        value,
        tags: [slot, meta.stat],
        uses: [{ op: "equip" }, { op: "salvage", yields: { ...meta.inputs } }],
        source,
        refs: [slot, meta.stat, ...(fromRecipe ? [recipeId] : [SITES[i % SITES.length]!.id])],
        slot,
        effectStat: meta.stat,
        effectAmt: amt,
      });
    }
  }

  for (let i = 0; i < 48; i++) {
    const id = `rel.${i}`;
    const broken = i >= 12 && i < 24;
    const fromCache = i >= 24;
    const base = RELIC_BASES[i % RELIC_BASES.length]!;
    const town = TOWNS[i % TOWNS.length]!;
    let source: Source;
    if (fromCache) source = { kind: "cache", cacheId: `cache.${i - 24}` };
    else if (i === 12) source = { kind: "site", siteId: START_SITE };
    else source = { kind: "site", siteId: SITES[i % SITES.length]!.id };
    const uses: UseSpec[] = broken
      ? [{ op: "restore" }, { op: "display" }]
      : [{ op: "attest" }, { op: "display" }];
    items.push({
      id,
      name: `${town} ${base}`,
      category: "relic",
      pack: CANDIDATE_PACK,
      blurb: broken
        ? blurb(
            `${town} ${base}`,
            "Broken. Restore with scrap and brass, then set it on a mantel. Restoration binds it across death.",
          )
        : blurb(
            `${town} ${base}`,
            "Attest it, then display it. Attested relics return with the same identity after fourteen years.",
          ),
      value: 8,
      tags: broken ? ["relic", "broken"] : ["relic", "intact"],
      uses,
      source,
      refs: fromCache
        ? [`cache.${i - 24}`, `evi.${i - 24}`]
        : [source.kind === "site" ? source.siteId : id],
      broken,
    });
  }

  for (let i = 0; i < 80; i++) {
    const kind = PROVISIONS[i % PROVISIONS.length]!;
    const town = TOWNS[i % TOWNS.length]!;
    const id = `pro.${i}`;
    const merchant = i % 2 === 1;
    items.push({
      id,
      name: `${town} ${kind.noun}`,
      category: "provision",
      pack: CANDIDATE_PACK,
      blurb: blurb(
        `${town} ${kind.noun}`,
        `Consume to raise ${kind.stat} by ${kind.amount}, or stoke a lit fire.`,
      ),
      value: kind.value,
      tags: ["provision", kind.key],
      uses: [
        { op: "consume", stat: kind.stat, amount: kind.amount },
        { op: "stoke", turns: 2 },
      ],
      source: merchant
        ? { kind: "merchant" }
        : { kind: "site", siteId: SITES[i % SITES.length]!.id },
      refs: [kind.stat],
    });
  }

  for (const suit of SUITS) {
    for (let rank = 1; rank <= 12; rank++) {
      for (const edition of [0, 1] as const) {
        const id = `card.${suit.key}.${rank}.${edition}`;
        const editionName = edition === 0 ? "road" : "attic";
        const playAmt = rank + edition;
        items.push({
          id,
          name: `${editionName} ${suit.label} ${rank}`,
          category: "card",
          pack: CANDIDATE_PACK,
          blurb: blurb(
            `${editionName} ${suit.label} ${rank}`,
            `Add it to a deck, then play it. Playing raises ${suit.stat} by ${playAmt}.`,
          ),
          value: rank,
          tags: ["card", suit.key, editionName],
          uses: [{ op: "deck-add" }, { op: "deck-play" }],
          source: { kind: "site", siteId: HOME_SITE },
          refs: [suit.stat, HOME_SITE],
          suit: suit.key,
          rank,
          edition,
          playStat: suit.stat,
          playAmt,
        });
      }
    }
  }

  for (let i = 0; i < 40; i++) {
    const rawId = `food.raw.${i}`;
    const cookedId = `food.cooked.${i}`;
    const recipeId = `recipe.cook.${i}`;
    const town = TOWNS[i % TOWNS.length]!;
    const dish = FOODS[i]!;
    recipes.push({ id: recipeId, outputDefId: cookedId, inputs: {}, kind: "cook" });
    const eatRaw = 3 + (i % 4);
    const eatCooked = 5 + (i % 4);
    items.push({
      id: rawId,
      name: `${town} ${dish}`,
      category: "food",
      pack: CANDIDATE_PACK,
      blurb: blurb(`${town} ${dish}`, `Eat it for ${eatRaw} satiation, or cook it on a lit fire.`),
      value: 4,
      tags: ["food", "raw"],
      uses: [{ op: "eat", amount: eatRaw }, { op: "cook" }],
      source: { kind: "site", siteId: SITES[i % SITES.length]!.id },
      refs: [recipeId, cookedId, SITES[i % SITES.length]!.id],
      cooksTo: cookedId,
    });
    items.push({
      id: cookedId,
      name: `skillet ${dish}`,
      category: "food",
      pack: CANDIDATE_PACK,
      blurb: blurb(
        `skillet ${dish}`,
        `Eat it for ${eatCooked} satiation, or compost it into herb.`,
      ),
      value: 4,
      tags: ["food", "cooked"],
      uses: [
        { op: "eat", amount: eatCooked },
        { op: "compost", mat: "herb", qty: 1 },
      ],
      source: { kind: "cook", recipeId, rawId },
      refs: [recipeId, rawId],
      cookedFrom: rawId,
    });
  }

  const placeSlots = ["mantel", "wall", "table", "yard"] as const;
  for (let i = 0; i < 80; i++) {
    const id = `dec.${i}`;
    const merchant = i % 5 === 0;
    const base = DECOR[i % DECOR.length]!;
    const town = TOWNS[i % TOWNS.length]!;
    const placeSlot = placeSlots[i % placeSlots.length]!;
    items.push({
      id,
      name: `${town} ${base}`,
      category: "decoration",
      pack: CANDIDATE_PACK,
      blurb: blurb(
        `${town} ${base}`,
        `Place it on a ${placeSlot}. Take it back down. Placed pieces stay through a death.`,
      ),
      value: 6,
      tags: ["decoration", placeSlot],
      uses: [{ op: "place" }, { op: "unplace" }],
      source: merchant
        ? { kind: "merchant" }
        : { kind: "site", siteId: SITES[i % SITES.length]!.id },
      refs: [placeSlot],
      placeSlot,
    });
  }

  for (let i = 0; i < 96; i++) {
    const primary = i < 48;
    const cacheIndex = primary ? i : i - 48;
    const id = `evi.${i}`;
    const town = TOWNS[cacheIndex % TOWNS.length]!;
    const topic = TOPICS[cacheIndex % TOPICS.length]!;
    const role = primary ? "primary" : "corroborating";
    items.push({
      id,
      name: primary ? `Letter — ${town} ${topic}` : `Margin note — ${town} ${topic}`,
      category: "evidence",
      pack: CANDIDATE_PACK,
      blurb: primary
        ? `Filed at ${siteName(letterSiteId(i))}. Read it, then present it at ${siteName(cacheSiteId(cacheIndex))} to open ${`cache.${cacheIndex}`}.`
        : `Corroborates cache.${cacheIndex}. Read it, then present it at the cache to mark the find confirmed. It does not open the cache alone.`,
      value: 2,
      tags: ["evidence", role],
      uses: [{ op: "read" }, { op: "present" }],
      source: { kind: "site", siteId: letterSiteId(i) },
      refs: [`cache.${cacheIndex}`, cacheSiteId(cacheIndex), letterSiteId(i)],
      cacheId: `cache.${cacheIndex}`,
      letterRole: role,
    });
  }

  if (items.length !== TARGET_DEFINITIONS) {
    const by = new Map<string, number>();
    for (const item of items) by.set(item.category, (by.get(item.category) ?? 0) + 1);
    throw new Error(
      `expected 768 items, got ${items.length} ${JSON.stringify(Object.fromEntries(by))}`,
    );
  }

  const byId = new Map<string, ItemDef>();
  for (const item of items) {
    if (byId.has(item.id)) throw new Error(`duplicate id ${item.id}`);
    byId.set(item.id, item);
  }

  for (const cache of caches) {
    if (!byId.has(cache.rewardDefId)) throw new Error(`cache reward missing ${cache.rewardDefId}`);
    if (!byId.has(cache.primaryLetterId) || !byId.has(cache.corroboratingLetterId)) {
      throw new Error(`cache letters missing ${cache.id}`);
    }
  }

  for (const item of items) {
    if (item.source.kind === "cache") {
      const cacheId = item.source.cacheId;
      const cache = caches.find((c) => c.id === cacheId);
      if (!cache || cache.rewardDefId !== item.id) {
        throw new Error(`cache source mismatch ${item.id}`);
      }
    }
    if (item.source.kind === "recipe") {
      const recipe = recipes.find((r) => r.id === item.source.kind && false);
      void recipe;
      const found = recipes.find((r) => r.id === (item.source as { recipeId: string }).recipeId);
      if (!found || found.outputDefId !== item.id) throw new Error(`recipe mismatch ${item.id}`);
      if (yieldValue(found.inputs) !== item.value)
        throw new Error(`craft value mismatch ${item.id}`);
    }
    if (item.source.kind === "cook") {
      const raw = byId.get(item.cookedFrom ?? "");
      if (!raw || raw.cooksTo !== item.id) throw new Error(`cook mismatch ${item.id}`);
      if (raw.value < item.value) throw new Error(`cook value up ${item.id}`);
    }
    for (const use of item.uses) {
      if (use.op === "salvage" && yieldValue(use.yields) > item.value) {
        throw new Error(`salvage value up ${item.id}`);
      }
      if (use.op === "compost" && (MATERIAL_VALUE[use.mat] ?? 99) * use.qty > item.value) {
        throw new Error(`compost value up ${item.id}`);
      }
    }
  }

  const idsByCategory = {
    object: [],
    equipment: [],
    relic: [],
    provision: [],
    card: [],
    food: [],
    decoration: [],
    evidence: [],
  } as Record<Category, string[]>;
  for (const item of items) idsByCategory[item.category].push(item.id);

  const merchantDefIds = items.filter((i) => i.source.kind === "merchant").map((i) => i.id);

  return {
    version: CATALOG_VERSION,
    items,
    byId,
    recipes,
    recipeById: new Map(recipes.map((r) => [r.id, r])),
    recipeByOutput: new Map(recipes.map((r) => [r.outputDefId, r])),
    caches,
    cacheById: new Map(caches.map((c) => [c.id, c])),
    cacheByReward: new Map(caches.map((c) => [c.rewardDefId, c])),
    merchantDefIds,
    idsByCategory,
  };
}

export const catalog: Catalog = build();

export function defOf(id: string): ItemDef {
  const def = catalog.byId.get(id);
  if (!def) throw new Error(`unknown def ${id}`);
  return def;
}
