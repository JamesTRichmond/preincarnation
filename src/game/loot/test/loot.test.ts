import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listActions, listBench } from "../src/actions.ts";
import { step, surviveDeath } from "../src/dispatch.ts";
import { assertNoIdOverlap, classifyItemId } from "../src/ids.ts";
import { exportSave, importSave, memoryPort, writeSave } from "../src/save.ts";
import { carryLimit, carryWeight, derivedPreview, findByDefinition } from "../src/state.ts";
import type { ContentPack, ItemDefinition, LootState } from "../src/types.ts";
import { validateContent } from "../src/validate.ts";
import { DEMO_DEFINITION_COUNT, demoPack } from "../demo/pack.ts";
import { createDemoState, demoContent } from "../demo/seed.ts";

function fresh(): LootState {
  return createDemoState(demoContent);
}

function one(state: LootState, definitionId: string, kind?: string) {
  const found = findByDefinition(state, definitionId).filter((inst) => {
    if (!kind) return state.owners[inst.id]?.kind !== "trader";
    return state.owners[inst.id]?.kind === kind;
  });
  assert.ok(found[0], `missing ${definitionId} ${kind ?? ""}`);
  return found[0];
}

function qty(state: LootState, definitionId: string, kind: string) {
  return findByDefinition(state, definitionId)
    .filter((inst) => state.owners[inst.id]?.kind === kind)
    .reduce((sum, inst) => sum + inst.quantity, 0);
}

describe("catalog contract", () => {
  it("loads thirty demo definitions and refuses a colliding production id", () => {
    assert.equal(DEMO_DEFINITION_COUNT, 30);
    assert.equal(demoContent.list.length, 30);
    assert.equal(validateContent(demoPack).length, 0);
    assert.equal(demoContent.budget.total, 30);
    assert.equal(demoContent.budget.totalBudget, 768);
    assert.deepEqual(demoContent.budget.over, []);
    for (const def of demoContent.list) {
      assert.equal(classifyItemId(def.id), "demo");
      assert.ok(def.uses.length >= 1);
      if (def.category === "ordinary") assert.ok(def.uses.length >= 2);
    }
    assert.deepEqual(assertNoIdOverlap(["demo.ord.cut-nail"], ["ord.cut-nail"]), []);
    assert.equal(classifyItemId("demo.ord.cut-nail"), "demo");
    assert.equal(classifyItemId("ord.cut-nail"), "production");
    assert.notEqual("demo.ord.cut-nail", "ord.cut-nail");
  });

  it("rejects a demo id inside a production pack and an unknown handler", () => {
    const twine: ItemDefinition = {
      id: "ord.sample-twine",
      name: "Sample twine",
      category: "ordinary",
      summary: "Two-ply twine kept only to prove the production namespace.",
      weight: 0.1,
      value: 1,
      stackLimit: 5,
      tags: ["fiber"],
      protection: "none",
      condition: "none",
      consumeEffect: { calm: 1 },
      catalogNote: {
        title: "Twine",
        body: "Two-ply, from a Middlebury loft, noted so the production shape has two real uses.",
      },
      uses: [
        { handler: "consume", label: "Bind a cut", detail: "Uses one length to bind a cut. Calm ticks up by one." },
        { handler: "catalog-note", label: "Note the twist", detail: "Writes the loft note into the journal once." },
      ],
    };
    const pack: ContentPack = {
      ...demoPack,
      id: "pack.sample",
      mode: "production",
      label: "Sample",
      definitions: [twine],
      recipes: [],
      restorations: [],
      modifications: [],
      characters: [],
      slots: [],
      trader: { ...demoPack.trader, id: "trader.sample", stock: [], buys: ["ordinary"] },
    };
    assert.equal(validateContent(pack).length, 0);
    const bad: ContentPack = { ...pack, definitions: [{ ...twine, id: "demo.ord.sample-twine" }] };
    const errors = validateContent(bad);
    assert.ok(errors.some((error) => error.includes("demo.ord.sample-twine")));
    const fake = {
      ...twine,
      uses: [
        { handler: "consume", label: "Bind a cut", detail: "Uses one length to bind a cut. Calm ticks up by one." },
        { handler: "wish", label: "Wish", detail: "This handler is not implemented anywhere." },
      ],
    } as unknown as ItemDefinition;
    const wished = validateContent({ ...pack, definitions: [fake] });
    assert.ok(wished.some((error) => error.includes("unknown handler") || error.includes("not implemented")));
  });
});

describe("instances", () => {
  it("merges compatible stacks and refuses a different condition", () => {
    let state = fresh();
    const before = qty(state, "demo.ord.cut-nail", "carry");
    const added = step(state, demoContent, {
      type: "acquire",
      definitionId: "demo.ord.cut-nail",
      quantity: 3,
      owner: "carry",
      sourceKind: "acquire",
      sourceNote: "Picked up.",
      fromIds: [],
    });
    assert.equal(added.ok, true);
    if (!added.ok) return;
    state = added.state;
    assert.equal(qty(state, "demo.ord.cut-nail", "carry"), before + 3);
    assert.equal(findByDefinition(state, "demo.ord.cut-nail").filter((i) => state.owners[i.id]?.kind === "carry").length, 1);

    const worms = step(state, demoContent, {
      type: "acquire",
      definitionId: "demo.ing.nightcrawlers",
      quantity: 1,
      condition: 10,
      owner: "carry",
      sourceKind: "acquire",
      sourceNote: "A tired worm.",
      fromIds: [],
    });
    assert.equal(worms.ok, true);
    if (!worms.ok) return;
    const stacks = findByDefinition(worms.state, "demo.ing.nightcrawlers").filter(
      (inst) => worms.state.owners[inst.id]?.kind === "carry",
    );
    assert.equal(stacks.length, 2);
  });

  it("splits one off a stack", () => {
    const state = fresh();
    const nails = one(state, "demo.ord.cut-nail", "carry");
    const result = step(state, demoContent, { type: "split", instanceId: nails.id, quantity: 1 });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const parts = findByDefinition(result.state, "demo.ord.cut-nail").filter(
      (inst) => result.state.owners[inst.id]?.kind === "carry",
    );
    assert.equal(parts.length, 2);
    assert.equal(parts.reduce((sum, inst) => sum + inst.quantity, 0), nails.quantity);
  });

  it("refuses a load past the carry limit and keeps the previous ledger", () => {
    let state = fresh();
    const limit = carryLimit(state, demoContent);
    let failed = false;
    for (let i = 0; i < 40; i += 1) {
      const result = step(state, demoContent, {
        type: "acquire",
        definitionId: "demo.trp.school-sundial",
        quantity: 1,
        owner: "carry",
        sourceKind: "acquire",
        sourceNote: "Another dial.",
        fromIds: [],
      });
      if (!result.ok) {
        assert.equal(result.error.code, "overweight");
        assert.equal(result.state, state);
        failed = true;
        break;
      }
      state = result.state;
      assert.ok(carryWeight(state, demoContent) <= limit + 0.05);
    }
    assert.equal(failed, true);
  });
});

describe("actions", () => {
  it("wears the knife, derives an edge, and emits a mastery handoff", () => {
    let state = fresh();
    const knife = one(state, "demo.eq.perch-knife");
    assert.equal(state.owners[knife.id]?.kind, "equipped");
    assert.ok(derivedPreview(state, demoContent).edge > 0);
    const off = step(state, demoContent, { type: "unequip", slot: "main-hand" });
    assert.equal(off.ok, true);
    if (!off.ok) return;
    state = off.state;
    assert.equal(derivedPreview(state, demoContent).edge, 0);
    const knifeId = one(state, "demo.eq.perch-knife", "carry").id;
    const on = step(state, demoContent, { type: "equip", instanceId: knifeId });
    assert.equal(on.ok, true);
    if (!on.ok) return;
    assert.ok(on.state.handoffs.some((handoff) => handoff.system === "mastery"));
  });

  it("eats a cake, halves a stale one, and writes a cooking handoff", () => {
    const state = fresh();
    const before = state.actor.satiety;
    const cake = one(state, "demo.dish.johnnycake", "carry");
    const eaten = step(state, demoContent, { type: "consume", instanceId: cake.id });
    assert.equal(eaten.ok, true);
    if (!eaten.ok) return;
    assert.equal(eaten.state.actor.satiety, before + 28);
    assert.ok(eaten.state.handoffs.some((handoff) => handoff.system === "cooking"));

    const stale = fresh();
    const staleCake = one(stale, "demo.dish.johnnycake", "carry");
    staleCake.condition = 0;
    const half = step(stale, demoContent, { type: "consume", instanceId: staleCake.id });
    assert.equal(half.ok, true);
    if (!half.ok) return;
    assert.equal(half.state.actor.satiety, before + 14);
  });

  it("reads the letter once, then Mara's answer changes after the reading", () => {
    let state = fresh();
    const letter = one(state, "demo.doc.perch-letter");
    const closed = step(state, demoContent, {
      type: "present",
      instanceId: letter.id,
      characterId: "demo.npc.mara",
    });
    assert.equal(closed.ok, true);
    if (!closed.ok) return;
    assert.equal(closed.state.flags["demo.flag.letter-heard"], undefined);
    assert.match(closed.message, /Read the letter/);

    const read = step(closed.state, demoContent, { type: "read", instanceId: letter.id });
    assert.equal(read.ok, true);
    if (!read.ok) return;
    state = read.state;
    assert.equal(state.journal.filter((entry) => entry.id === "read:demo.doc.perch-letter").length, 1);
    const again = step(state, demoContent, { type: "read", instanceId: letter.id });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.state.journal.filter((entry) => entry.id === "read:demo.doc.perch-letter").length, 1);

    const open = step(again.state, demoContent, {
      type: "present",
      instanceId: letter.id,
      characterId: "demo.npc.mara",
    });
    assert.equal(open.ok, true);
    if (!open.ok) return;
    assert.equal(open.state.flags["demo.flag.letter-heard"], true);
    assert.ok(open.state.evidence.some((entry) => entry.evidenceId === "demo.evidence.perch-letter"));
    assert.equal(open.state.instances[letter.id]?.quantity, 1);
  });

  it("opens the sketch onto three pins", () => {
    const state = fresh();
    const map = one(state, "demo.doc.otter-creek-map");
    const read = step(state, demoContent, { type: "read", instanceId: map.id });
    assert.equal(read.ok, true);
    if (!read.ok) return;
    assert.equal(read.state.markers.length, 3);
    assert.ok(read.state.markers.some((marker) => marker.name === "Middlebury falls"));
  });

  it("places a trophy, refuses the wrong hook, and takes it down", () => {
    let state = fresh();
    const antler = one(state, "demo.trp.antler-plaque", "carry");
    const wrong = step(state, demoContent, {
      type: "place",
      instanceId: antler.id,
      slotId: "demo.slot.table",
    });
    assert.equal(wrong.ok, false);
    if (wrong.ok) return;
    assert.equal(wrong.error.code, "unfit");
    const hung = step(state, demoContent, {
      type: "place",
      instanceId: antler.id,
      slotId: "demo.slot.wall-hook",
    });
    assert.equal(hung.ok, true);
    if (!hung.ok) return;
    state = hung.state;
    assert.equal(state.owners[antler.id]?.kind, "display");
    const down = step(state, demoContent, { type: "retrieve", slotId: "demo.slot.wall-hook" });
    assert.equal(down.ok, true);
    if (!down.ok) return;
    assert.equal(down.state.owners[antler.id]?.kind, "carry");
  });

  it("restores the cap with wool and refuses the job when the wool is stashed", () => {
    let state = fresh();
    const cap = one(state, "demo.eq.wool-cap");
    const before = cap.condition ?? 0;
    const woolBefore = qty(state, "demo.ord.raw-wool", "carry");
    const done = step(state, demoContent, {
      type: "restore",
      restorationId: "demo.restore.cap-darn",
      targetInstanceId: cap.id,
    });
    assert.equal(done.ok, true);
    if (!done.ok) return;
    assert.equal(done.state.instances[cap.id]?.condition, Math.min(100, before + 40));
    assert.equal(qty(done.state, "demo.ord.raw-wool", "carry"), woolBefore - 2);

    state = fresh();
    const wool = one(state, "demo.ord.raw-wool", "carry");
    const moved = step(state, demoContent, { type: "transfer", instanceId: wool.id, to: "stash" });
    assert.equal(moved.ok, true);
    if (!moved.ok) return;
    const blocked = step(moved.state, demoContent, {
      type: "restore",
      restorationId: "demo.restore.cap-darn",
      targetInstanceId: one(moved.state, "demo.eq.wool-cap").id,
    });
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.equal(blocked.error.code, "materials");
  });

  it("braces the knife once and will not brace it twice", () => {
    let state = fresh();
    const knife = one(state, "demo.eq.perch-knife");
    const nails = qty(state, "demo.ord.cut-nail", "carry");
    const braced = step(state, demoContent, {
      type: "modify",
      modificationId: "demo.mod.haft-brace",
      targetInstanceId: knife.id,
    });
    assert.equal(braced.ok, true);
    if (!braced.ok) return;
    state = braced.state;
    assert.ok(state.instances[knife.id]?.mods.includes("demo.mod.haft-brace"));
    assert.equal(qty(state, "demo.ord.cut-nail", "carry"), nails - 2);
    assert.ok(state.handoffs.some((handoff) => handoff.key === "haft-braced"));
    const again = step(state, demoContent, {
      type: "modify",
      modificationId: "demo.mod.haft-brace",
      targetInstanceId: knife.id,
    });
    assert.equal(again.ok, false);
    if (again.ok) return;
    assert.equal(again.error.code, "already-modified");
  });

  it("salvages a lure into materials and refuses to salvage the compass", () => {
    const state = fresh();
    const lure = one(state, "demo.ing.creek-lure", "carry");
    const nails = qty(state, "demo.ord.cut-nail", "carry");
    const wool = qty(state, "demo.ord.raw-wool", "carry");
    const salvaged = step(state, demoContent, { type: "salvage", instanceId: lure.id });
    assert.equal(salvaged.ok, true);
    if (!salvaged.ok) return;
    assert.equal(qty(salvaged.state, "demo.ing.creek-lure", "carry"), lure.quantity - 1);
    assert.equal(qty(salvaged.state, "demo.ord.cut-nail", "carry"), nails + 1);
    assert.equal(qty(salvaged.state, "demo.ord.raw-wool", "carry"), wool + 1);
    const compass = one(salvaged.state, "demo.rel.ellis-compass");
    const refused = step(salvaged.state, demoContent, { type: "dismantle", instanceId: compass.id });
    assert.equal(refused.ok, false);
    if (refused.ok) return;
    assert.equal(refused.error.code, "protected");
  });

  it("crafts a torch on the bench with a craft source", () => {
    const state = fresh();
    const offer = listBench(state, demoContent).find((row) => row.id === "demo.recipe.wax-torch");
    assert.ok(offer?.enabled);
    assert.ok(offer?.action);
    const made = step(state, demoContent, offer!.action);
    assert.equal(made.ok, true);
    if (!made.ok) return;
    const crafted = findByDefinition(made.state, "demo.ord.wax-torch").find((inst) => inst.source.kind === "craft");
    assert.ok(crafted);
    assert.equal(made.state.owners[crafted!.id]?.kind, "bench");
    assert.deepEqual(crafted!.source.fromIds.sort(), ["demo.ord.beeswax-cake", "demo.ord.cedar-kindling"]);
  });

  it("rigs one lure and leaves the other untouched", () => {
    const state = fresh();
    const lure = one(state, "demo.ing.creek-lure", "carry");
    const rigged = step(state, demoContent, { type: "rig", instanceId: lure.id });
    assert.equal(rigged.ok, true);
    if (!rigged.ok) return;
    const lures = findByDefinition(rigged.state, "demo.ing.creek-lure").filter(
      (inst) => rigged.state.owners[inst.id]?.kind === "carry",
    );
    assert.equal(lures.filter((inst) => inst.flags.fieldReady).length, 1);
    assert.ok(rigged.state.handoffs.some((handoff) => handoff.system === "fishing" && handoff.key === "lure"));
  });

  it("sells a nail, refuses the compass, and buys salt", () => {
    let state = fresh();
    const purse = state.purse;
    const nail = one(state, "demo.ord.cut-nail", "carry");
    const sold = step(state, demoContent, {
      type: "trade",
      give: [{ instanceId: nail.id, quantity: 1 }],
      take: [],
      purse: 0,
    });
    assert.equal(sold.ok, true);
    if (!sold.ok) return;
    state = sold.state;
    assert.equal(state.purse, purse + 1);
    assert.equal(qty(state, "demo.ord.cut-nail", "trader") > 0, true);

    const compass = one(state, "demo.rel.ellis-compass");
    const blocked = step(state, demoContent, {
      type: "trade",
      give: [{ instanceId: compass.id, quantity: 1 }],
      take: [],
      purse: 0,
    });
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.equal(blocked.error.code, "protected");
    assert.equal(blocked.state.purse, state.purse);

    const salt = one(state, "demo.ing.road-salt", "trader");
    const bought = step(state, demoContent, {
      type: "trade",
      give: [],
      take: [{ instanceId: salt.id, quantity: 1 }],
      purse: 2,
    });
    assert.equal(bought.ok, true);
    if (!bought.ok) return;
    assert.equal(bought.state.purse, state.purse - 2);
    assert.ok(qty(bought.state, "demo.ing.road-salt", "carry") > qty(state, "demo.ing.road-salt", "carry"));
  });

  it("holds the key until the crypt is open, then allows a deliberate destroy", () => {
    let state = fresh();
    const key = one(state, "demo.rel.baptist-key");
    const early = step(state, demoContent, { type: "discard", instanceId: key.id });
    assert.equal(early.ok, false);
    if (early.ok) return;
    assert.equal(early.error.code, "protected");
    const turned = step(state, demoContent, { type: "unlock", instanceId: key.id });
    assert.equal(turned.ok, true);
    if (!turned.ok) return;
    state = turned.state;
    assert.equal(state.flags["demo.flag.crypt-door"], true);
    assert.ok(state.instances[key.id]);
    const still = step(state, demoContent, { type: "discard", instanceId: key.id });
    assert.equal(still.ok, false);
    const released = step(state, demoContent, { type: "releaseQuest", instanceId: key.id });
    assert.equal(released.ok, true);
    if (!released.ok) return;
    const destroyed = step(released.state, demoContent, { type: "discard", instanceId: key.id });
    assert.equal(destroyed.ok, true);
    if (!destroyed.ok) return;
    assert.equal(destroyed.state.instances[key.id], undefined);

    const compass = one(destroyed.state, "demo.rel.ellis-compass");
    const essential = step(destroyed.state, demoContent, { type: "releaseQuest", instanceId: compass.id });
    assert.equal(essential.ok, false);
    if (essential.ok) return;
    assert.equal(essential.error.code, "protected");
  });

  it("does not erase the collection when Ellis dies", () => {
    const state = fresh();
    const ids = Object.keys(state.instances).sort();
    const quantities = ids.map((id) => `${id}:${state.instances[id]?.quantity}:${state.owners[id]?.kind}`);
    const dead = step(state, demoContent, { type: "noteDeath", cause: "through the ice" });
    assert.equal(dead.ok, true);
    if (!dead.ok) return;
    const after = Object.keys(dead.state.instances).sort();
    assert.deepEqual(after, ids);
    const afterQty = after.map(
      (id) => `${id}:${dead.state.instances[id]?.quantity}:${dead.state.owners[id]?.kind}`,
    );
    assert.deepEqual(afterQty, quantities);
    assert.equal(dead.state.deaths.length, 1);
    assert.equal(dead.state.deaths[0]?.pieceCount, ids.filter((id) => state.owners[id]?.kind !== "trader").length);
    assert.match(dead.message, /before/);
  });

  it("surviveDeath keeps the collection without a content pack", () => {
    const state = fresh();
    const before = Object.keys(state.instances).length;
    const dead = surviveDeath(state, "a chapter");
    assert.equal(Object.keys(dead.instances).length, before);
    assert.equal(dead.deaths[0]?.cause, "a chapter");
    assert.equal(state.deaths.length, 0);
  });

  it("ages perishables on purpose and does not throw them out", () => {
    const state = fresh();
    const cake = one(state, "demo.dish.johnnycake", "carry");
    const knife = one(state, "demo.eq.perch-knife");
    const beforeCake = cake.condition ?? 0;
    const beforeKnife = knife.condition ?? 0;
    const count = Object.keys(state.instances).length;
    const aged = step(state, demoContent, { type: "passEvening" });
    assert.equal(aged.ok, true);
    if (!aged.ok) return;
    assert.equal(aged.state.instances[cake.id]?.condition, beforeCake - 12);
    assert.equal(aged.state.instances[knife.id]?.condition, beforeKnife);
    assert.equal(Object.keys(aged.state.instances).length, count);
  });

  it("consults the sundial only after it is placed", () => {
    let state = fresh();
    const dial = one(state, "demo.trp.school-sundial", "carry");
    const early = step(state, demoContent, { type: "consult", instanceId: dial.id });
    assert.equal(early.ok, false);
    if (early.ok) return;
    assert.equal(early.error.code, "not-placed");
    const placed = step(state, demoContent, {
      type: "place",
      instanceId: dial.id,
      slotId: "demo.slot.step",
    });
    assert.equal(placed.ok, true);
    if (!placed.ok) return;
    state = placed.state;
    const read = step(state, demoContent, { type: "consult", instanceId: dial.id });
    assert.equal(read.ok, true);
    if (!read.ok) return;
    assert.match(read.message, /Bench hour/);
  });

  it("exposes working buttons rather than a crafting hint", () => {
    const state = fresh();
    const nails = one(state, "demo.ord.cut-nail", "carry");
    const actions = listActions(state, demoContent, nails.id);
    const brace = actions.find((action) => action.id.includes("haft-brace"));
    assert.ok(brace);
    assert.equal(brace?.enabled, true);
    assert.equal(brace?.action?.type, "modify");
    const torch = one(state, "demo.ord.wax-torch", "carry");
    const burn = listActions(state, demoContent, torch.id).find((action) => action.action?.type === "consume");
    assert.equal(burn?.enabled, true);
    assert.doesNotMatch(burn?.detail ?? "", /^useful for crafting$/i);
  });
});

describe("save", () => {
  it("round-trips the ledger and rejects a broken file", () => {
    const state = fresh();
    const eaten = step(state, demoContent, {
      type: "consume",
      instanceId: one(state, "demo.ord.cedar-kindling", "carry").id,
    });
    assert.equal(eaten.ok, true);
    if (!eaten.ok) return;
    const port = memoryPort();
    const serialized = writeSave(port, eaten.state, demoContent.packId);
    writeSave(port, eaten.state, demoContent.packId);
    const loaded = importSave(port.load() ?? "", demoContent);
    assert.deepEqual(loaded.instances, eaten.state.instances);
    assert.deepEqual(loaded.owners, eaten.state.owners);
    assert.equal(loaded.actor.light, eaten.state.actor.light);
    assert.ok(port.loadBackup?.());
    assert.equal(serialized.includes("\"version\":1"), true);
    assert.throws(() => importSave("{}", demoContent));
    assert.throws(() => importSave("{not json", demoContent));
  });

  it("refuses a ledger that cites an unknown definition", () => {
    const state = fresh();
    const raw = JSON.parse(exportSave(state, demoContent.packId)) as {
      state: LootState;
    };
    const id = Object.keys(raw.state.instances)[0];
    assert.ok(id);
    raw.state.instances[id]!.definitionId = "ord.not-real";
    assert.throws(() => importSave(JSON.stringify(raw), demoContent));
  });
});
