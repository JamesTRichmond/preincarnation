/**
 * Deliberate take for a county chest, cache, or rifle.
 * Opening selects nothing and takes nothing.
 * A take never equips, consumes, or dismantles.
 * Ordinary unowned supplies can be swept only when collectOrdinary is on.
 * The Vesting Hall is not part of this county. The Marble Vein stays the plot.
 */

export type Rarity = "common" | "rare" | "unique";

export type OfferKind = "supply" | "treasure" | "evidence" | "weapon" | "heart" | "karma";

export type Stat = { label: string; value: number };

export type LootOffer = {
  id: string;
  name: string;
  blurb: string;
  qty: number;
  stackLimit: number;
  kind: OfferKind;
  rarity: Rarity;
  sealed: boolean;
  owner: string;
  ordinary: boolean;
  fresh: boolean;
  compareGroup: string | null;
  stats: Stat[];
};

export type PackSlot = {
  id: string;
  name: string;
  qty: number;
  owner: string;
  compareGroup: string | null;
  stats: Stat[];
};

export type LootView = {
  offers: LootOffer[];
  selected: number | null;
  capacity: number;
  pack: PackSlot[];
  collectOrdinary: boolean;
};

export type VerbId = "take-one" | "take-stack" | "take-eligible" | "inspect" | "compare" | "leave";

export type VerbState = {
  id: VerbId;
  label: string;
  enabled: boolean;
  primary: boolean;
  reason?: string;
};

export type LootAct =
  | { kind: "idle" }
  | { kind: "leave" }
  | { kind: "inspect"; lines: string[] }
  | { kind: "compare"; lines: string[] }
  | {
      kind: "take";
      taken: LootOffer[];
      equip: false;
      consume: false;
      dismantle: false;
      tone: "celebrate" | "quiet";
    };

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Quarry hearts stay hearts. Every other chest is stable for its id. */
export function chestGrant(id: string): "heart" | "karma" {
  if (id.includes("quarry")) return "heart";
  return hash(id) % 2 === 0 ? "heart" : "karma";
}

export function chestOffer(id: string, fresh: boolean): LootOffer {
  if (chestGrant(id) === "heart") {
    return {
      id,
      name: "Spare heart",
      blurb: "A spare heart, hidden in the county.",
      qty: 1,
      stackLimit: 1,
      kind: "heart",
      rarity: "rare",
      sealed: false,
      owner: "",
      ordinary: false,
      fresh,
      compareGroup: null,
      stats: [],
    };
  }
  return {
    id,
    name: "Stored merit",
    blurb: "A knot of stored merit.",
    qty: 1,
    stackLimit: 1,
    kind: "karma",
    rarity: "common",
    sealed: false,
    owner: "",
    ordinary: false,
    fresh,
    compareGroup: null,
    stats: [{ label: "Karma", value: 5 }],
  };
}

export function weaponOffer(input: {
  id: string;
  name: string;
  blurb: string;
  dmg: number;
  reach: number;
  ammo?: number;
  rare: boolean;
  fresh: boolean;
}): LootOffer {
  const rounds = input.ammo ? ` ${input.ammo} rounds.` : "";
  return {
    id: input.id,
    name: input.name,
    blurb: input.blurb + rounds,
    qty: 1,
    stackLimit: 1,
    kind: "weapon",
    rarity: input.rare ? "rare" : "common",
    sealed: false,
    owner: "",
    ordinary: false,
    fresh: input.fresh,
    compareGroup: "weapon",
    stats: [
      { label: "Edge", value: Math.round(input.dmg * 10) },
      { label: "Reach", value: Math.round(input.reach) },
    ],
  };
}

/** Houses kept one, two, or three rounds. The count does not change if you shut the door. */
export function stableRifleRounds(id: string, cycle: number): number {
  return 1 + (hash(id + ":" + cycle + ":rounds") % 3);
}

export function liveView(offers: LootOffer[], pack: PackSlot[]): LootView {
  return {
    offers,
    selected: null,
    capacity: Number.POSITIVE_INFINITY,
    pack,
    collectOrdinary: false,
  };
}

function isSealed(offer: LootOffer): boolean {
  return offer.sealed || offer.kind === "evidence";
}

/** Sweep only. A deliberate Take is a separate verb. */
export function isSweepEligible(offer: LootOffer, collectOrdinary: boolean): boolean {
  if (!collectOrdinary) return false;
  if (isSealed(offer)) return false;
  if (offer.kind !== "supply") return false;
  if (!offer.ordinary) return false;
  if (offer.rarity !== "common") return false;
  if (offer.owner !== "") return false;
  return true;
}

export function displayMark(offer: LootOffer): string | null {
  if (offer.fresh) return "New";
  if (isSealed(offer)) return "Sealed";
  if (offer.owner) return offer.owner;
  if (offer.rarity === "rare") return "Rare";
  if (offer.rarity === "unique") return "Unique";
  return null;
}

function roomFor(view: LootView, offer: LootOffer): number {
  const existing = view.pack.find((slot) => slot.id === offer.id && slot.owner === offer.owner);
  let room = 0;
  if (existing) room += Math.max(0, offer.stackLimit - existing.qty);
  if (view.pack.length < view.capacity) room += offer.stackLimit;
  return room;
}

export function resolveVerbs(view: LootView): VerbState[] {
  const selected = view.selected == null ? null : (view.offers[view.selected] ?? null);
  const sealed = selected ? isSealed(selected) : false;
  const qty = selected?.qty ?? 0;
  const fitOne = selected ? roomFor(view, selected) >= 1 : false;
  const eligible = view.offers.filter((offer) => isSweepEligible(offer, view.collectOrdinary));

  const takeOne: VerbState = {
    id: "take-one",
    label: qty <= 1 ? "Take" : "Take one",
    enabled: Boolean(selected) && !sealed && fitOne,
    primary: false,
  };
  if (!selected) takeOne.reason = "Choose an item";
  else if (sealed) takeOne.reason = "Sealed";
  else if (!fitOne) takeOne.reason = "Pack full";

  const takeStack: VerbState = {
    id: "take-stack",
    label: "Take stack",
    enabled: Boolean(selected) && !sealed && qty > 1 && fitOne,
    primary: false,
  };
  if (!selected) takeStack.reason = "Choose an item";
  else if (sealed) takeStack.reason = "Sealed";
  else if (qty <= 1) takeStack.reason = "Single item";
  else if (!fitOne) takeStack.reason = "Pack full";

  const takeEligible: VerbState = {
    id: "take-eligible",
    label: "Take eligible",
    enabled: eligible.some((offer) => roomFor(view, offer) >= 1),
    primary: false,
  };
  if (!eligible.length) takeEligible.reason = "Nothing eligible";
  else if (!takeEligible.enabled) takeEligible.reason = "Pack full";

  const inspect: VerbState = {
    id: "inspect",
    label: "Inspect",
    enabled: Boolean(selected),
    primary: false,
  };
  if (!selected) inspect.reason = "Choose an item";

  const compare: VerbState = {
    id: "compare",
    label: "Compare",
    enabled: Boolean(selected?.compareGroup),
    primary: false,
  };
  if (!selected) compare.reason = "Choose an item";
  else if (!selected.compareGroup) compare.reason = "Nothing alike";

  const leave: VerbState = { id: "leave", label: "Leave", enabled: true, primary: false };
  const primaryId = !selected
    ? null
    : sealed
      ? "inspect"
      : takeOne.enabled
        ? "take-one"
        : inspect.enabled
          ? "inspect"
          : null;
  for (const verb of [takeOne, takeStack, takeEligible, inspect, compare, leave]) {
    verb.primary = verb.id === primaryId && verb.enabled;
  }
  return [takeOne, takeStack, takeEligible, inspect, compare, leave];
}

export function primaryVerb(verbs: VerbState[]): VerbState | null {
  return verbs.find((verb) => verb.primary) ?? null;
}

export function moveSelection(view: LootView, dir: -1 | 1): LootView {
  if (!view.offers.length) return view;
  if (view.selected == null) return { ...view, selected: 0 };
  const count = view.offers.length;
  return { ...view, selected: (view.selected + dir + count) % count };
}

export function inspectLines(offer: LootOffer): string[] {
  const lines = [
    offer.blurb,
    offer.rarity === "common" ? null : offer.rarity[0]!.toUpperCase() + offer.rarity.slice(1),
    offer.owner ? offer.owner : "Unowned",
    isSealed(offer) ? "Protected — it stays" : null,
  ];
  return lines.filter((line): line is string => Boolean(line));
}

function statTotal(stats: Stat[]): number {
  return stats.reduce((sum, stat) => sum + stat.value, 0);
}

export function compareLines(view: LootView, offer: LootOffer): string[] {
  if (!offer.compareGroup) return ["Nothing alike in the pack."];
  const carried = view.pack.filter(
    (slot) => slot.compareGroup === offer.compareGroup && slot.id !== offer.id,
  );
  const same = view.pack.find((slot) => slot.id === offer.id);
  if (!carried.length && same) return [`You already carry ${offer.name}. Nothing else matches.`];
  if (!carried.length) return [`No other ${offer.compareGroup} in the pack.`];
  const best = carried.slice().sort((a, b) => statTotal(b.stats) - statTotal(a.stats))[0]!;
  const lines = [`Against ${best.name}`];
  const labels = new Set([...offer.stats.map((s) => s.label), ...best.stats.map((s) => s.label)]);
  for (const label of labels) {
    const here = offer.stats.find((s) => s.label === label)?.value ?? 0;
    const there = best.stats.find((s) => s.label === label)?.value ?? 0;
    const delta = here - there;
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    lines.push(`${label} ${there} → ${here} (${sign})`);
  }
  return lines;
}

function cloneOffer(offer: LootOffer): LootOffer {
  return { ...offer, stats: offer.stats.map((stat) => ({ ...stat })) };
}

function insert(
  pack: PackSlot[],
  offer: LootOffer,
  qty: number,
  capacity: number,
): { pack: PackSlot[]; taken: number } {
  const next = pack.map((slot) => ({ ...slot, stats: slot.stats.map((stat) => ({ ...stat })) }));
  let remaining = qty;
  let taken = 0;
  const existing = next.find((slot) => slot.id === offer.id && slot.owner === offer.owner);
  if (existing) {
    const add = Math.min(Math.max(0, offer.stackLimit - existing.qty), remaining);
    existing.qty += add;
    taken += add;
    remaining -= add;
  }
  if (remaining > 0 && next.length < capacity) {
    const add = Math.min(offer.stackLimit, remaining);
    next.push({
      id: offer.id,
      name: offer.name,
      qty: add,
      owner: offer.owner,
      compareGroup: offer.compareGroup,
      stats: offer.stats.map((stat) => ({ ...stat })),
    });
    taken += add;
  }
  return { pack: next, taken };
}

function toneOf(taken: LootOffer[]): "celebrate" | "quiet" {
  const treasure = taken.some((offer) => offer.kind !== "supply" || offer.rarity !== "common");
  return treasure ? "celebrate" : "quiet";
}

function idle(view: LootView): { view: LootView; act: LootAct } {
  return { view, act: { kind: "idle" } };
}

export function act(view: LootView, verb: VerbId): { view: LootView; act: LootAct } {
  const verbs = resolveVerbs(view);
  const state = verbs.find((item) => item.id === verb);
  if (!state?.enabled) return idle(view);
  if (verb === "leave") return { view, act: { kind: "leave" } };
  const selected = view.selected == null ? null : (view.offers[view.selected] ?? null);
  if (verb === "inspect") {
    if (!selected) return idle(view);
    return { view, act: { kind: "inspect", lines: inspectLines(selected) } };
  }
  if (verb === "compare") {
    if (!selected) return idle(view);
    return { view, act: { kind: "compare", lines: compareLines(view, selected) } };
  }

  const offers = view.offers.map(cloneOffer);
  let pack = view.pack;
  const taken: LootOffer[] = [];
  const pull = (index: number, qty: number) => {
    const offer = offers[index];
    if (!offer) return;
    const ins = insert(pack, offer, qty, view.capacity);
    if (ins.taken <= 0) return;
    pack = ins.pack;
    offer.qty -= ins.taken;
    taken.push({ ...cloneOffer(offer), qty: ins.taken });
  };

  if (verb === "take-one" && view.selected != null) pull(view.selected, 1);
  if (verb === "take-stack" && view.selected != null && selected) pull(view.selected, selected.qty);
  if (verb === "take-eligible") {
    offers.forEach((offer, index) => {
      if (isSweepEligible(offer, view.collectOrdinary)) pull(index, offer.qty);
    });
  }
  if (!taken.length) return idle(view);
  const remaining = offers.filter((offer) => offer.qty > 0);
  let nextSelected = view.selected;
  if (nextSelected != null && !remaining[nextSelected]) nextSelected = remaining.length ? 0 : null;
  return {
    view: { ...view, offers: remaining, pack, selected: nextSelected },
    act: {
      kind: "take",
      taken,
      equip: false,
      consume: false,
      dismantle: false,
      tone: toneOf(taken),
    },
  };
}

export function panelCopy(
  label: string,
  view: LootView,
  note: string | null,
): { heading: string; line: string; detail: string; foot: string } {
  const selected = view.selected == null ? null : (view.offers[view.selected] ?? null);
  const primary = primaryVerb(resolveVerbs(view));
  const chip = selected ? displayMark(selected) : null;
  let foot =
    selected == null
      ? "W/S choose  Esc leaves it"
      : primary
        ? `E ${primary.label}  Y look  Q compare  Esc leave`
        : "Y look  Q compare  Esc leave";
  if (foot.length > 46 && primary) foot = `E ${primary.label}  Y look  Esc leave`;
  return {
    heading: `${label.toUpperCase()} — nothing taken`,
    line: selected ? selected.name + (chip ? "  " + chip : "") : "Nothing chosen",
    detail: note?.trim() || selected?.blurb || "It is still where you found it.",
    foot,
  };
}
