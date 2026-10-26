import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CATALOG,
  freshShed,
  GAME_PORTS,
  lootId,
  RECIPES,
  bandOf,
  craftRecipe,
  dismantleItem,
  getItem,
  serviceItem,
  setHour,
  setWeather,
  tradeWithNeighbor,
  useOnBench,
  validateBundle,
  validateLoot,
} from "../src/index.ts";
import type { Instance, WorkshopState } from "../src/types.ts";

function benchItem(state: WorkshopState, n: number): Instance {
  const id = lootId(n);
  const found = state.instances.find((inst) => inst.itemId === id && inst.location === "bench");
  assert.ok(found, `missing bench ${id}`);
  return found;
}

test("catalog is the reserved 240, each with two real uses", () => {
  const report = validateLoot();
  assert.equal(report.ok, true, report.errors.slice(0, 8).join("\n"));
  assert.equal(report.counts.items, 240);
  assert.equal(report.purposeCollisions.length, 0);
  assert.ok(report.missingExternal.length >= GAME_PORTS.length);
  assert.ok(report.missingExternal.every((port) => port.status === "missing"));
  assert.ok(report.blockedSalvage.length > 0);
  for (let n = 1; n <= 240; n += 1) {
    const item = getItem(lootId(n));
    assert.ok(item, lootId(n));
    assert.ok(item.uses.length >= 2);
    assert.equal(item.value.currency, null);
    assert.ok(item.era.first && item.era.return);
    assert.ok(item.protection.plain);
    assert.ok(item.ownership.holder);
    assert.ok(item.salvage.length >= 1);
  }
  assert.equal(CATALOG[0]?.id, "loot.common.001");
  assert.equal(CATALOG[239]?.id, "loot.common.240");
  assert.equal(new Set(CATALOG.map((item) => item.name)).size, 240);
});

test("a factory job is rejected and the real recipes stay single-bench", () => {
  for (const recipe of RECIPES) {
    assert.equal(recipe.workers, 1);
    assert.equal(recipe.batch, 1);
    assert.equal(recipe.station, "single-bench");
  }
  const bad = {
    id: "recipe.factory-cans",
    title: "Can the county",
    station: "line",
    workers: 6,
    batch: 40,
    queue: true,
    handler: "handler.preserve",
    inputs: [],
    tools: [],
    effect: {},
  };
  const report = validateBundle(CATALOG, [...RECIPES, bad]);
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((error) => /factory/i.test(error)));
});

test("wind eats the mug and not the bell", () => {
  const calm = freshShed();
  const mug = benchItem(calm, 37);
  const bell = benchItem(calm, 1);
  const calmMug = useOnBench(calm, mug.instanceId, mugUse(37, "handler.noise-lure"));
  assert.equal(calmMug.ok, true, calmMug.messages.join(" "));
  const wind = setWeather(calm, "wind");
  const windMug = useOnBench(wind, mug.instanceId, mugUse(37, "handler.noise-lure"));
  assert.equal(windMug.ok, false);
  assert.match(windMug.messages.join(" "), /wind/i);
  const windBell = useOnBench(wind, bell.instanceId, mugUse(1, "handler.noise-lure"));
  assert.equal(windBell.ok, true, windBell.messages.join(" "));
  assert.ok(windBell.missingPorts.includes("port.audio.emit"));
  assert.ok(windBell.missingPorts.includes("port.world"));
});

test("thread whips the torn net", () => {
  const state = freshShed();
  const spool = benchItem(state, 2);
  const net = benchItem(state, 152);
  const before = spool.qty;
  const mended = useOnBench(state, spool.instanceId, mugUse(2, "handler.cord-mend"), net.instanceId);
  assert.equal(mended.ok, true, mended.messages.join(" "));
  const nextNet = mended.state.instances.find((inst) => inst.instanceId === net.instanceId);
  const nextSpool = mended.state.instances.find((inst) => inst.instanceId === spool.instanceId);
  assert.ok(nextNet?.tags.includes("mended:net-whip"));
  assert.ok((nextNet?.condition ?? 0) > net.condition);
  assert.ok((nextSpool?.qty ?? before) < before);
  const crafted = craftRecipe(freshShed(), "recipe.mend-gill-net");
  assert.equal(crafted.ok, true, crafted.messages.join(" "));
});

test("letters and the watch will not be traded or cut up", () => {
  const state = freshShed();
  const letters = benchItem(state, 233);
  const neighbor = state.instances.find((inst) => inst.location === "neighbor");
  assert.ok(neighbor);
  const traded = tradeWithNeighbor(state, letters.instanceId, neighbor.instanceId);
  assert.equal(traded.ok, false);
  const cut = dismantleItem(state, letters.instanceId);
  assert.equal(cut.ok, false);
  assert.match(cut.messages.join(" "), /stays whole/i);
  const watch = benchItem(state, 3);
  assert.equal(dismantleItem(state, watch.instanceId).ok, false);
  assert.equal(tradeWithNeighbor(state, watch.instanceId, neighbor.instanceId).ok, false);
});

test("the borrowed mug will not leave, and a free object will trade in kind", () => {
  const state = freshShed();
  const mug = benchItem(state, 37);
  const scoop = state.instances.find((inst) => inst.itemId === lootId(83) && inst.location === "neighbor");
  assert.ok(scoop);
  const refused = tradeWithNeighbor(state, mug.instanceId, scoop.instanceId);
  assert.equal(refused.ok, false);
  const wax = benchItem(state, 19);
  const done = tradeWithNeighbor(state, wax.instanceId, scoop.instanceId);
  assert.equal(done.ok, true, done.messages.join(" "));
  assert.equal(done.state.instances.find((inst) => inst.instanceId === wax.instanceId)?.location, "neighbor");
  assert.equal(done.state.instances.find((inst) => inst.instanceId === scoop.instanceId)?.location, "bench");
});

test("counted stacks merge only inside one condition band", () => {
  const state = freshShed();
  const chalk = benchItem(state, 102);
  const twin: Instance = {
    ...chalk,
    instanceId: "inst-twin",
    qty: 3,
    tags: [...chalk.tags],
  };
  const otherBand: Instance = {
    ...chalk,
    instanceId: "inst-other",
    qty: 2,
    condition: 10,
    tags: [...chalk.tags],
  };
  state.instances.push(twin, otherBand);
  const merged = craftRecipe(
    { ...state, instances: state.instances.map((inst) => ({ ...inst, tags: [...inst.tags] })) },
    "recipe.warm-brick",
  );
  assert.equal(merged.ok, true, merged.messages.join(" "));
  const piles = merged.state.instances.filter((inst) => inst.itemId === lootId(102) && inst.location === "bench");
  const sound = piles.find((inst) => bandOf(inst.condition) === bandOf(chalk.condition));
  const ruined = piles.find((inst) => bandOf(inst.condition) === "ruined");
  assert.equal(sound?.qty, chalk.qty + 3);
  assert.equal(ruined?.qty, 2);
});

test("a pair is a pair for hands and for eyes", () => {
  const state = freshShed();
  state.instances.push(
    spawn(state, 166, "bench"),
    spawn(state, 161, "bench"),
  );
  const gloves = state.instances.find((inst) => inst.itemId === lootId(166))!;
  const goggles = state.instances.find((inst) => inst.itemId === lootId(161))!;
  const hands = useOnBench(state, gloves.instanceId, mugUse(166, "handler.protect"));
  assert.equal(hands.ok, true, hands.messages.join(" "));
  const one = { ...state, instances: state.instances.map((inst) => inst.instanceId === gloves.instanceId ? { ...inst, qty: 1, tags: [...inst.tags] } : { ...inst, tags: [...inst.tags] }) };
  const bare = useOnBench(one, gloves.instanceId, mugUse(166, "handler.protect"));
  assert.equal(bare.ok, false);
  const eyes = useOnBench(state, goggles.instanceId, mugUse(161, "handler.protect"));
  assert.equal(eyes.ok, true, eyes.messages.join(" "));
  const half = {
    ...state,
    instances: state.instances.map((inst) =>
      inst.instanceId === goggles.instanceId ? { ...inst, qty: 1, tags: [...inst.tags] } : { ...inst, tags: [...inst.tags] },
    ),
  };
  assert.equal(useOnBench(half, goggles.instanceId, mugUse(161, "handler.protect")).ok, false);
});

test("stale kerosene sputters on an odd hour and still burns on an even one", () => {
  const even = useOnBench(freshShed(), benchItem(freshShed(), 219).instanceId, mugUse(219, "handler.fuel"));
  assert.equal(even.ok, true, even.messages.join(" "));
  assert.match(even.messages.join(" "), /stale/i);
  assert.equal(even.state.flags.includes("sputter"), false);
  const oddState = setHour(freshShed(), 11);
  const can = benchItem(oddState, 219);
  const odd = useOnBench(oddState, can.instanceId, mugUse(219, "handler.fuel"));
  assert.equal(odd.ok, true, odd.messages.join(" "));
  assert.match(odd.messages.join(" "), /crawl|catches/i);
  assert.ok(odd.state.flags.includes("sputter"));
});

test("the lamp takes one fitting, and the watch keeps a short time after oil", () => {
  const hooded = craftRecipe(freshShed(), "recipe.fit-bell-hood");
  assert.equal(hooded.ok, true, hooded.messages.join(" "));
  const lamp = hooded.state.instances.find((inst) => inst.itemId === lootId(218));
  assert.ok(lamp?.tags.includes("fitting:hood"));
  assert.equal(hooded.state.instances.find((inst) => inst.itemId === lootId(1))?.location, "consumed");
  const again = craftRecipe(hooded.state, "recipe.fit-wick");
  assert.equal(again.ok, false);
  const oiled = craftRecipe(freshShed(), "recipe.restore-watch");
  assert.equal(oiled.ok, true, oiled.messages.join(" "));
  const watch = oiled.state.instances.find((inst) => inst.itemId === lootId(3));
  assert.ok(watch);
  assert.ok(watch.tags.includes("keeps-time-short"));
  assert.ok(watch.condition >= 55);
  const timed = useOnBench(oiled.state, watch.instanceId, mugUse(3, "handler.time-interval"));
  assert.equal(timed.ok, true, timed.messages.join(" "));
  const raw = freshShed();
  const broken = benchItem(raw, 3);
  assert.equal(useOnBench(raw, broken.instanceId, mugUse(3, "handler.time-interval")).ok, false);
});

test("service scours the mug, and the last of a reserve stays", () => {
  const state = freshShed();
  const mug = benchItem(state, 37);
  const drink = useOnBench(state, mug.instanceId, mugUse(37, "handler.contain"));
  assert.equal(drink.ok, false);
  const scoured = serviceItem(state, mug.instanceId);
  assert.equal(scoured.ok, true, scoured.messages.join(" "));
  const clean = scoured.state.instances.find((inst) => inst.instanceId === mug.instanceId);
  assert.ok(clean?.tags.includes("scoured"));
  const after = useOnBench(scoured.state, mug.instanceId, mugUse(37, "handler.contain"));
  assert.equal(after.ok, true, after.messages.join(" "));
  const spool = benchItem(state, 2);
  const low = {
    ...state,
    instances: state.instances.map((inst) =>
      inst.instanceId === spool.instanceId ? { ...inst, qty: 1, tags: [...inst.tags] } : { ...inst, tags: [...inst.tags] },
    ),
  };
  const spent = useOnBench(low, spool.instanceId, mugUse(2, "handler.tether"));
  assert.equal(spent.ok, false);
  assert.match(spent.messages.join(" "), /reserve/i);
});

function mugUse(n: number, handler: string): string {
  const item = getItem(lootId(n));
  const use = item?.uses.find((entry) => entry.handler === handler);
  assert.ok(use, `${n} ${handler}`);
  return use.id;
}

function spawn(state: WorkshopState, n: number, location: Instance["location"]): Instance {
  const item = getItem(lootId(n));
  assert.ok(item);
  const inst: Instance = {
    instanceId: `inst-extra-${n}`,
    itemId: item.id,
    condition: item.condition.default,
    qty: item.stackQty,
    contents: null,
    tags: [...item.tags],
    location,
  };
  return inst;
}
