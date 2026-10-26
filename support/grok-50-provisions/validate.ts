import { DISHES, NODES, PROVISIONS } from "./catalog.ts";
import {
  ageStores,
  castLine,
  cook,
  destinationsOf,
  die,
  digGrave,
  gather,
  hydrate,
  initialState,
  pid,
  selectBait,
  serialize,
  setSeason,
  setWater,
  substitutionCycle,
  totals,
  tryGive,
  useField as fieldUse,
  qtyOf,
} from "./engine.ts";
import type { Dish, KitState, Provision } from "./types.ts";

export type Check = { name: string; pass: boolean; detail: string };

function check(name: string, pass: boolean, detail: string): Check {
  return { name, pass, detail };
}

function sum(map: Record<string, number>) {
  return Object.values(map).reduce((a, b) => a + b, 0);
}

function withStacks(base: KitState, rows: { id: string; qty: number; cured?: boolean }[]) {
  let state = base;
  for (const row of rows) {
    const next = tryGive(state, row.id, row.qty, !!row.cured);
    if (!next) throw new Error(`could not stage ${row.id}`);
    state = next;
  }
  return state;
}

export function runValidation(): Check[] {
  const out: Check[] = [];
  const ids = new Set(PROVISIONS.map((p) => p.id));
  const names = new Set<string>();
  let unique = true;
  for (const item of PROVISIONS) {
    if (names.has(item.name) || !/^loot\.provision\.\d{3}$/.test(item.id)) unique = false;
    names.add(item.name);
  }
  out.push(
    check(
      "catalog range",
      PROVISIONS.length === 120 &&
        DISHES.length === 48 &&
        PROVISIONS.every((p, i) => p.n === i + 1) &&
        DISHES.every((d, i) => d.n === i + 1 && d.id === `cook.dish.${String(i + 1).padStart(3, "0")}`) &&
        unique,
      "120 provisions loot.provision.001–120 and 48 cook.dish plates, unique names.",
    ),
  );
  const dishNames = new Set(DISHES.map((d) => d.name));
  out.push(
    check(
      "namespace",
      PROVISIONS.every((p) => !dishNames.has(p.name) && !p.id.startsWith("cook.dish.")) &&
        DISHES.every((d) => !ids.has(d.id)),
      "Dishes are not refiled as provisions.",
    ),
  );
  out.push(
    check(
      "no spoilage clock",
      PROVISIONS.every((p) => p.storage.spoils === false) &&
        qtyOf(ageStores(initialState(), 40), pid(11)) === qtyOf(initialState(), pid(11)),
      "ageStores is identity. spoils is false on every record.",
    ),
  );
  out.push(
    check(
      "natural history marked",
      PROVISIONS.every((p) => p.naturalHistory === "verified" || p.naturalHistory === "fictionalized") &&
        DISHES.every((d) => d.naturalHistory === "verified" || d.naturalHistory === "fictionalized"),
      `Fictionalized items: ${PROVISIONS.filter((p) => p.naturalHistory === "fictionalized")
        .map((p) => p.name)
        .join(", ")}. Fictionalized plates: ${DISHES.filter((d) => d.naturalHistory === "fictionalized")
        .map((d) => d.name)
        .join(", ")}.`,
    ),
  );
  const kinds = new Set(DISHES.flatMap((d) => d.effects.map((e) => e.kind)));
  out.push(
    check(
      "no damage multiplier",
      ![...kinds].some((k) => /damage|attack|weapon/i.test(k)) &&
        DISHES.filter((d) => d.effects.some((e) => e.distinctive)).every((d) =>
          d.effects.every((e) => e.kind !== "warmth" || e.distinctive == null),
        ),
      "Effects are warmth, quiet, stride, sight, courtesy, focus, calm, memory, light, listen.",
    ),
  );
  const common = [pid(11), pid(113), pid(12), pid(16), pid(10), pid(9)];
  const destFail = common.filter((id) => destinationsOf(PROVISION_BY_ID(id)).length < 3);
  const orphans = PROVISIONS.filter((p) => destinationsOf(p).length < 1).map((p) => p.name);
  out.push(
    check(
      "destinations",
      destFail.length === 0 && orphans.length === 0,
      orphans.length ? `No destination: ${orphans.join(", ")}` : "Common supplies have three or more uses. Every record has at least one.",
    ),
  );
  out.push(
    check(
      "substitution loops",
      substitutionCycle() === null && injectedCycleRefuses(),
      "The live graph is acyclic. A planted loop refuses the cook and spends nothing.",
    ),
  );
  out.push(check("ingredient conservation", conservation(), "Cooked inputs equal leftovers plus what the pot took."));
  out.push(check("duplicate consumption", !doubleSalt(), "Salt listed twice is aggregated, then drawn once."));
  out.push(check("full inventory", fullBins(), "A full camp refuses the pick and leaves the node."));
  out.push(check("save/load", roundTrip(), "Serialize and hydrate match. Bad saves do not throw."));
  out.push(check("death", deathKeepsCellar(), "Fourteen years. Pouch and creel drop. Cellar, tin, and palate stay. Effects end."));
  out.push(check("effect stacking", stackWarmth(), "Warmth stacks with falloff, then refuses without spending."));
  out.push(check("missing recipes", missing(), "Unknown plate and empty effect spend nothing."));
  out.push(check("hazard and raw", hazardAndRaw(), "Jack-o'-lantern and raw fiddleheads do not enter a body."));
  out.push(check("ghost is not a morel", ghostRefused(), "The fiction will not satisfy a real morel plate."));
  out.push(check("cured hash", hashNeedsCure(), "Fourteen-winter hash wants cured venison and remembers past death."));
  out.push(check("bait cast", baitOnce(), "A matching cast spends one bait. A wrong rig spends none."));
  out.push(check("dig does not duplicate", digConserves(), "The grave cache moves. It does not copy."));
  out.push(check("no hunger", !hasKey(initialState(), "hunger"), "The kit has no hunger field."));
  return out;
}

function PROVISION_BY_ID(id: string) {
  const item = PROVISIONS.find((p) => p.id === id);
  if (!item) throw new Error(id);
  return item;
}

function injectedCycleRefuses() {
  const list: Provision[] = PROVISIONS.map((p) => ({ ...p, substitutions: p.substitutions.map((s) => ({ ...s })) }));
  const salt = list.find((p) => p.n === 11)!;
  const dust = list.find((p) => p.n === 106)!;
  salt.substitutions = [...salt.substitutions, { forId: dust.id, quality: 0.5 }];
  dust.substitutions = [...dust.substitutions, { forId: salt.id, quality: 0.5 }];
  const before = initialState();
  const result = cook(before, "cook.dish.003", { provisions: list });
  return !result.ok && result.reason === "substitution-cycle" && result.state === before;
}

function conservation() {
  let state = setSeason(initialState(), "sugaring");
  state = withStacks(state, [
    { id: pid(27), qty: 2 },
    { id: pid(25), qty: 2 },
  ]);
  const before = totals(state);
  const result = cook(state, "cook.dish.003");
  if (!result.ok || !result.consumed) return false;
  const after = totals(result.state);
  const consumed: Record<string, number> = {};
  for (const row of result.consumed) consumed[row.provisionId] = (consumed[row.provisionId] ?? 0) + row.qty;
  const ids = new Set([...Object.keys(before), ...Object.keys(after), ...Object.keys(consumed)]);
  for (const id of ids) {
    if ((before[id] ?? 0) !== (after[id] ?? 0) + (consumed[id] ?? 0)) return false;
  }
  return (consumed[pid(27)] ?? 0) === 1 && (consumed[pid(25)] ?? 0) === 1;
}

function doubleSalt() {
  const dish: Dish = {
    id: "cook.dish.901",
    n: 901,
    name: "Salt twice",
    blurb: "test",
    stove: false,
    naturalHistory: "fictionalized",
    reference: "test",
    needs: [
      { provisionId: pid(11), qty: 1, allowSubstitution: false },
      { provisionId: pid(11), qty: 1, allowSubstitution: false },
    ],
    effects: [{ id: "warmth", name: "Warmth", kind: "warmth", magnitude: 1, cap: 3, falloff: 0.5, exclusive: false, fictional: false }],
  };
  const state = initialState();
  const saltBefore = qtyOf(state, pid(11));
  const result = cook(state, dish.id, { port: { owner: "test", dishes: [dish] } });
  if (!result.ok) return true;
  const spent = saltBefore - qtyOf(result.state, pid(11));
  return spent !== 2;
}

function fullBins() {
  const state = initialState();
  const filler = PROVISIONS.filter((p) => p.kind === "field").slice(0, 12);
  state.bins.pouch = filler.map((p) => ({ provisionId: p.id, qty: 1 }));
  state.bins.creel = PROVISIONS.slice(20, 28).map((p) => ({ provisionId: p.id, qty: 1 }));
  state.bins.cellar = PROVISIONS.slice(28, 52).map((p) => ({ provisionId: p.id, qty: 1 }));
  state.bins.tin = PROVISIONS.slice(52, 56).map((p) => ({ provisionId: p.id, qty: 1 }));
  state.creelSlots = 8;
  state.tinSlots = 4;
  const node = NODES.find((n) => n.id === "node-017")!;
  const beforeTaken = state.taken[node.id] ?? 0;
  const before = JSON.stringify(state.bins);
  const result = gather({ ...state, season: "spring" }, node.id);
  return !result.ok && result.reason === "full" && (result.state.taken[node.id] ?? 0) === beforeTaken && JSON.stringify(result.state.bins) === before;
}

function roundTrip() {
  const state = initialState();
  state.barter = 7;
  state.flags.palate = true;
  const raw = serialize(state);
  const loaded = hydrate(raw);
  const bad = hydrate("{");
  const odd = hydrate(JSON.stringify({ version: 9 }));
  return loaded.ok && JSON.stringify(loaded.state) === JSON.stringify(state) && !bad.ok && !odd.ok;
}

function deathKeepsCellar() {
  let staged = initialState();
  staged = withStacks(staged, [
    { id: pid(84), qty: 1 },
    { id: pid(5), qty: 2 },
    { id: pid(8), qty: 2 },
  ]);
  const cured = fieldUse(staged, pid(11), "cure");
  const hashed = cook(cured.state, "cook.dish.047");
  if (!hashed.ok || !hashed.state.flags.palate) return false;
  const cellarBefore = qtyOf(hashed.state, pid(1));
  const fallen = die(hashed.state, "Middlebury Green");
  const dug = digGrave(fallen, 0);
  return (
    fallen.year === 2040 &&
    fallen.life === 1 &&
    fallen.effects.length === 0 &&
    fallen.flags.palate &&
    fallen.bins.pouch.length === 0 &&
    qtyOf(fallen, pid(1)) === cellarBefore &&
    sum(totals(fallen)) === sum(totals(hashed.state)) &&
    dug.ok
  );
}

function stackWarmth() {
  let state = setSeason(initialState(), "sugaring");
  state = withStacks(state, [
    { id: pid(27), qty: 4 },
    { id: pid(25), qty: 4 },
  ]);
  const mags: number[] = [];
  for (let i = 0; i < 3; i++) {
    const result = cook(state, "cook.dish.003");
    if (!result.ok) return false;
    state = result.state;
    mags.push(state.effects.find((e) => e.id === "warmth")?.magnitude ?? 0);
  }
  const snow = qtyOf(state, pid(27));
  const refused = cook(state, "cook.dish.003");
  return mags[0] === 2 && mags[1] === 3 && mags[2] === 3.5 && !refused.ok && refused.reason === "at-cap" && qtyOf(refused.state, pid(27)) === snow && refused.state === state;
}

function missing() {
  const state = initialState();
  const gone = cook(state, "cook.dish.999");
  const empty: Dish = {
    ...DISHES[0],
    id: "cook.dish.902",
    effects: [],
  };
  const blank = cook(state, empty.id, { port: { owner: "test", dishes: [empty] } });
  return !gone.ok && gone.reason === "missing-recipe" && gone.state === state && !blank.ok && blank.reason === "missing-effect" && blank.state === state;
}

function hazardAndRaw() {
  const state = withStacks(initialState(), [
    { id: pid(67), qty: 1 },
    { id: pid(17), qty: 2 },
    { id: pid(2), qty: 1 },
  ]);
  const fake: Dish = {
    ...DISHES[0],
    id: "cook.dish.903",
    needs: [{ provisionId: pid(67), qty: 1, allowSubstitution: false }],
    effects: DISHES[0].effects,
  };
  const cooked = cook(state, fake.id, { port: { owner: "test", dishes: [fake] } });
  const raw = fieldUse(state, pid(17), "nibble");
  const studied = fieldUse(state, pid(67), "study");
  return (
    !cooked.ok &&
    cooked.reason === "not-food" &&
    cooked.state === state &&
    !raw.ok &&
    raw.reason === "unsafe-raw" &&
    qtyOf(raw.state, pid(17)) === qtyOf(state, pid(17)) &&
    studied.ok &&
    qtyOf(studied.state, pid(67)) === 1
  );
}

function ghostRefused() {
  let state = initialState();
  state.life = 1;
  state = withStacks(state, [
    { id: pid(108), qty: 1 },
    { id: pid(1), qty: 1 },
    { id: pid(2), qty: 1 },
  ]);
  const before = qtyOf(state, pid(108));
  const result = cook(state, "cook.dish.038");
  return !result.ok && result.reason === "missing-ingredient" && qtyOf(result.state, pid(108)) === before;
}

function hashNeedsCure() {
  const state = withStacks(initialState(), [
    { id: pid(84), qty: 1 },
    { id: pid(5), qty: 1 },
    { id: pid(8), qty: 1 },
  ]);
  const early = cook(state, "cook.dish.047");
  const cured = fieldUse(state, pid(11), "cure");
  const late = cook(cured.state, "cook.dish.047");
  return !early.ok && early.state === state && cured.ok && late.ok && late.state.flags.palate;
}

function baitOnce() {
  let state = setWater(setSeason(initialState(), "spring"), "new-haven");
  state = withStacks(state, [{ id: pid(94), qty: 2 }]);
  const selected = selectBait(state, pid(94));
  const cast = castLine(selected.state);
  const worms = qtyOf(cast.state, pid(94));
  const trout = qtyOf(cast.state, pid(68));
  const wrong = setWater(selected.state, "new-haven");
  const cheese = selectBait(withStacks(wrong, [{ id: pid(104), qty: 1 }]), pid(104));
  const refused = castLine(cheese.state);
  return (
    cast.ok &&
    worms === 1 &&
    trout === 1 &&
    !refused.ok &&
    qtyOf(refused.state, pid(104)) === 1
  );
}

function digConserves() {
  const state = initialState();
  const before = totals(state);
  const fallen = die(state, "The Green");
  const dug = digGrave(fallen, 0);
  if (!dug.ok) return false;
  const after = totals(dug.state);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) if ((before[key] ?? 0) !== (after[key] ?? 0)) return false;
  return dug.state.graves.length === 0 && dug.state.bins.pouch.length + dug.state.bins.creel.length > 0;
}

export function validationPassed(checks = runValidation()) {
  return checks.every((c) => c.pass);
}

export function validationReport(checks = runValidation()) {
  return checks.map((c) => `${c.pass ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`).join("\n");
}

function hasKey(value: unknown, key: string): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((row) => hasKey(row, key));
  const record = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, key)) return true;
  return Object.values(record).some((row) => hasKey(row, key));
}
