import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createInitialBench,
  everyRequests,
  isRunnable,
  perform,
  performMany,
  preview,
  recipes,
  rest,
  runnableRecipes,
  salvageRequests,
  totalMass,
  undo,
} from "./index.ts";
import type { BenchState, Recipe } from "./types.ts";

function rich(): BenchState {
  const state = createInitialBench();
  state.focus = 5000;
  state.focusMax = 5000;
  for (const item of state.items) {
    const recipe = recipes.find((op) => op.inputs.some((input) => input.catalogId === item.catalogId));
    void recipe;
    if (item.qty > 1) item.qty = Math.max(item.qty, 40);
  }
  return state;
}

describe("bench execution", () => {
  it("can run at least thirty operations from the fourteenth-year kit", () => {
    const ready = runnableRecipes(createInitialBench());
    assert.ok(ready.length >= 30, `only ${ready.length} runnable`);
  });

  it("preview does not mutate, and a refused count cannot go negative", () => {
    const state = createInitialBench();
    const rope = state.items.find((item) => item.catalogId === "fix.sup.rope");
    assert.ok(rope);
    const before = rope.qty;
    const seen = preview(state, { recipeId: "op.dismantle.rope", primaryInstanceId: rope.instanceId, count: 999 });
    assert.equal(seen.ok, false);
    assert.equal(rope.qty, before);
    assert.equal(state.items.find((item) => item.catalogId === "fix.sup.rope")?.qty, before);
    const done = perform(state, { recipeId: "op.dismantle.rope", primaryInstanceId: rope.instanceId, count: 999 });
    assert.equal(done.ok, false);
    assert.equal(done.state, state);
  });

  it("batches salvage piles in one undo and skips favorites", () => {
    const state = createInitialBench();
    const bottles = state.items.find((item) => item.catalogId === "fix.salvage.bottle");
    assert.ok(bottles);
    bottles.favorite = true;
    const reqs = salvageRequests(state);
    assert.ok(reqs.length >= 3);
    assert.ok(!reqs.some((req) => req.primaryInstanceId === bottles.instanceId));
    const massBefore = totalMass(state);
    const done = performMany(state, reqs);
    assert.equal(done.ok, true);
    assert.ok(totalMass(done.state) <= massBefore);
    assert.ok(done.state.items.some((item) => item.catalogId === "fix.salvage.bottle" && item.qty === bottles.qty));
    assert.ok(!done.state.items.some((item) => item.catalogId === "fix.quest.ferry-token" && item.qty !== 1));
    const token = done.state.items.find((item) => item.catalogId === "fix.quest.ferry-token");
    assert.ok(token);
    const back = undo(done.state);
    assert.equal(back.items.find((item) => item.catalogId === "fix.salvage.tin-can")?.qty, 36);
    assert.equal(back.focus, state.focus);
  });

  it("flattens every tin in one action", () => {
    const state = createInitialBench();
    const tins = state.items.find((item) => item.catalogId === "fix.salvage.tin-can");
    assert.ok(tins);
    const tinBefore = state.items.find((item) => item.catalogId === "fix.mat.tin")?.qty ?? 0;
    const done = perform(state, { recipeId: "op.dismantle.tin-can", primaryInstanceId: tins.instanceId, count: tins.qty });
    assert.equal(done.ok, true, done.preview.failures.join("; "));
    assert.equal(done.state.items.find((item) => item.catalogId === "fix.salvage.tin-can"), undefined);
    const tinAfter = done.state.items.find((item) => item.catalogId === "fix.mat.tin")?.qty ?? 0;
    assert.equal(tinAfter - tinBefore, tins.qty);
    assert.equal(done.state.undo.length, 1);
  });

  it("keeps an heirloom's identity and earlier history", () => {
    const state = createInitialBench();
    const lamp = state.items.find((item) => item.catalogId === "fix.heir.oil-lamp");
    assert.ok(lamp);
    const key = lamp.provenance.identityKey;
    const prior = lamp.history.map((event) => event.text);
    const done = perform(state, { recipeId: "op.restore.heir.oil-lamp", primaryInstanceId: lamp.instanceId });
    assert.equal(done.ok, true, done.preview.failures.join("; "));
    const after = done.state.items.filter((item) => item.catalogId === "fix.heir.oil-lamp");
    assert.equal(after.length, 1);
    assert.equal(after[0].instanceId, lamp.instanceId);
    assert.equal(after[0].provenance.identityKey, key);
    assert.deepEqual(after[0].history.slice(0, prior.length).map((event) => event.text), prior);
    assert.ok(after[0].history.length === prior.length + 1);
    assert.match(after[0].history.at(-1)?.text ?? "", /dent/i);
    const reverted = undo(done.state);
    assert.equal(reverted.items.find((item) => item.instanceId === lamp.instanceId)?.history.length, prior.length);
  });

  it("refuses a second, strictly stacking direction on the same axis", () => {
    const state = createInitialBench();
    const locket = state.items.find((item) => item.catalogId === "fix.heir.locket");
    assert.ok(locket);
    const opened = perform(state, {
      recipeId: "op.modify.heir-locket",
      primaryInstanceId: locket.instanceId,
      choiceId: "open-seal",
    });
    assert.equal(opened.ok, true, opened.preview.failures.join("; "));
    const mod = opened.state.items.find((item) => item.instanceId === locket.instanceId);
    assert.ok(mod);
    assert.equal(mod.mods.length, 1);
    assert.equal(mod.mods[0].stats.insight, 2);
    assert.equal(mod.mods[0].stats.durability, -2);
    assert.equal(mod.provenance.identityKey, locket.provenance.identityKey);
    const again = perform(opened.state, {
      recipeId: "op.modify.heir-locket",
      primaryInstanceId: locket.instanceId,
      choiceId: "keep-seal",
    });
    assert.equal(again.ok, false);
    assert.match(again.preview.failures.join(" "), /already decided/i);
    assert.equal(again.state.items.find((item) => item.instanceId === locket.instanceId)?.mods.length, 1);
  });

  it("refuses a substitute that fights the chosen direction", () => {
    const state = createInitialBench();
    const lantern = state.items.find((item) => item.catalogId === "fix.gear.lantern");
    assert.ok(lantern);
    const burned = perform(state, {
      recipeId: "op.modify.lantern-burn",
      primaryInstanceId: lantern.instanceId,
      choiceId: "bright-flare",
      substitutes: { "fix.mat.oil": "fix.mat.pitch" },
    });
    assert.equal(burned.ok, false);
    assert.match(burned.preview.failures.join(" "), /fights/i);
    assert.equal(burned.state, state);
  });

  it("does not destroy quest pieces, even in a sweep", () => {
    const state = createInitialBench();
    const token = state.items.find((item) => item.catalogId === "fix.quest.ferry-token");
    assert.ok(token);
    const hostile: Recipe = {
      id: "op.test.eat-token",
      kind: "dismantle",
      name: "Eat the token",
      summary: "no",
      inputs: [{ catalogId: token.catalogId, qty: 1, consume: "all", role: "primary" }],
      outputs: [{ catalogId: "fix.mat.twine", qty: 1, identity: "new", condition: 10 }],
      substitutions: [],
      cost: { minutes: 1, focus: 0, toolWear: 0 },
      feedback: { success: "gone", fail: "kept" },
      failure: { onLowCondition: "refuse", recovery: "Leave it." },
      batchable: false,
      tags: [],
    };
    const done = perform(state, { recipeId: hostile.id, primaryInstanceId: token.instanceId }, { recipe: hostile });
    assert.equal(done.ok, false);
    assert.match(done.preview.failures.join(" "), /quest/i);
    assert.equal(done.state.items.find((item) => item.instanceId === token.instanceId)?.qty, 1);
  });

  it("refuses a recipe that would create matter", () => {
    const state = createInitialBench();
    const twine = state.items.find((item) => item.catalogId === "fix.mat.twine");
    assert.ok(twine);
    const hostile: Recipe = {
      id: "op.test.dup",
      kind: "combine",
      name: "Duplicate twine",
      summary: "no",
      inputs: [{ catalogId: "fix.mat.twine", qty: 1, consume: "all", role: "material" }],
      outputs: [{ catalogId: "fix.mat.twine", qty: 3, identity: "new", condition: 90 }],
      substitutions: [],
      cost: { minutes: 1, focus: 0, toolWear: 0 },
      feedback: { success: "more", fail: "no" },
      failure: { onLowCondition: "refuse", recovery: "Stop." },
      batchable: true,
      tags: [],
    };
    const done = perform(state, { recipeId: hostile.id, count: 1 }, { recipe: hostile });
    assert.equal(done.ok, false);
    assert.equal(state.items.find((item) => item.catalogId === "fix.mat.twine")?.qty, twine.qty);
  });

  it("never gains mass across the runnable book", () => {
    const state = rich();
    for (const recipe of recipes) {
      if (!isRunnable(state, recipe)) continue;
      const choiceId = recipe.choices?.[0]?.id;
      const primary = recipe.inputs.find((input) => input.role === "primary");
      const primaryInstanceId =
        primary?.catalogId === "*"
          ? state.items[0].instanceId
          : state.items.find((item) => item.catalogId === primary?.catalogId)?.instanceId;
      const before = totalMass(state);
      const done = perform(state, { recipeId: recipe.id, count: 1, choiceId, primaryInstanceId });
      assert.equal(done.ok, true, `${recipe.id} ${done.preview.failures.join("; ")}`);
      assert.ok(totalMass(done.state) <= before, recipe.id);
      for (const item of done.state.items) assert.ok(item.qty >= 1);
      assert.ok(done.state.focus >= 0);
    }
  });

  it("restores focus without touching objects", () => {
    const state = createInitialBench();
    const lamp = state.items.find((item) => item.catalogId === "fix.heir.oil-lamp");
    assert.ok(lamp);
    const spent = perform(state, { recipeId: "op.restore.heir.oil-lamp", primaryInstanceId: lamp.instanceId });
    assert.ok(spent.state.focus < spent.state.focusMax);
    const ids = spent.state.items.map((item) => item.instanceId).join();
    const rested = rest(spent.state);
    assert.equal(rested.focus, rested.focusMax);
    assert.equal(rested.items.map((item) => item.instanceId).join(), ids);
  });

  it("can mend every ordinary net without listing them one by one", () => {
    const state = createInitialBench();
    const extra = structuredClone(state.items.find((item) => item.catalogId === "fix.gear.net"));
    assert.ok(extra);
    extra.instanceId = "inst-extra-net";
    extra.provenance = { ...extra.provenance, identityKey: "id.gear.net.extra" };
    extra.condition = 30;
    state.items.push(extra);
    const reqs = everyRequests(state, { recipeId: "op.restore.net" });
    assert.equal(reqs.length, 2);
    const done = performMany(state, reqs);
    assert.equal(done.ok, true, done.preview.failures.join("; "));
    const nets = done.state.items.filter((item) => item.catalogId === "fix.gear.net");
    assert.equal(nets.length, 2);
    assert.ok(nets.every((net) => net.condition > 30));
  });
});
