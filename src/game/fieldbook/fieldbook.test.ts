import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bindSession, createMemoryPort } from "./adapter.ts";
import { CATALOG } from "./catalog.ts";
import { createDemoContext } from "./demo.ts";
import {
  analyze,
  componentView,
  deltasTouchProtected,
  dispatch,
  hydrate,
  inspectVisible,
  ownedQty,
  serialize,
} from "./logic.ts";
import type { Requirement, TrackingContext } from "./types.ts";
import { fieldbookCard } from "./present.ts";

function demo(): TrackingContext {
  return createDemoContext();
}

function view(ctx: TrackingContext, id: string) {
  return componentView(analyze(CATALOG, ctx), id);
}

function project(ctx: TrackingContext, id: string) {
  const found = analyze(CATALOG, ctx).projects.find((p) => p.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("component ledger", () => {
  it("keeps a desired reserve while marking a covered goal fulfilled", () => {
    const ctx = demo();
    const copper = view(ctx, "copper-fitting");
    assert.equal(copper.owned, 3);
    assert.equal(copper.desiredReserve, 1);
    assert.equal(copper.reserved, 0);
    assert.equal(copper.safelyAvailable, 2);
    assert.equal(copper.contained.reduce((s, c) => s + c.quantity, 0), 3);
    assert.equal(project(ctx, "restore-fishing-net").status, "fulfilled");
    assert.equal(ownedQty(ctx.inventory, "copper-fitting"), 3);
    const net = project(ctx, "restore-fishing-net");
    assert.equal(net.lines.find((l) => l.componentId === "copper-fitting")?.coveredByPool, 2);
  });

  it("does not double-count the same stock across tagged projects", () => {
    const ctx = demo();
    ctx.ledger.desiredReserve["copper-fitting"] = 0;
    ctx.inventory.loose = ctx.inventory.loose.map((s) =>
      s.componentId === "copper-fitting" ? { ...s, quantity: 4 } : s,
    );
    const fishing = project(ctx, "restore-fishing-net").lines.find((l) => l.componentId === "copper-fitting")!;
    const hook = project(ctx, "restore-hookshot").lines.find((l) => l.componentId === "copper-fitting")!;
    assert.equal(fishing.coveredByPool, 2);
    assert.equal(fishing.short, 0);
    assert.equal(hook.coveredByPool, 2);
    assert.equal(hook.short, 1);
    assert.equal(fishing.coveredByPool + hook.coveredByPool, 4);
    assert.notEqual(project(ctx, "restore-hookshot").status, "fulfilled");
  });

  it("uses a substitute once and does not spend it twice", () => {
    const ctx = demo();
    for (const track of ctx.ledger.projects) {
      track.tagged = track.projectId === "restore-bow" || track.projectId === "restore-bug-net";
      track.priority = track.projectId === "restore-bow" ? 0 : 1;
    }
    ctx.inventory.loose = ctx.inventory.loose.map((s) => {
      if (s.componentId === "twine") return { ...s, quantity: 0 };
      if (s.componentId === "flax-twine") return { ...s, quantity: 2 };
      return s;
    });
    ctx.ledger.desiredReserve.twine = 0;
    const bow = project(ctx, "restore-bow").lines.find((l) => l.viaSubstitute || l.componentId === "flax-twine")!;
    const bug = project(ctx, "restore-bug-net").lines.find((l) => l.componentId === "twine" || l.componentId === "flax-twine")!;
    assert.equal(bow.componentId, "flax-twine");
    assert.equal(bow.viaSubstitute, true);
    assert.equal(bow.coveredByPool, 2);
    assert.equal(bug.coveredByPool, 0);
    assert.ok(bug.short > 0);
  });

  it("partial crafting spends safe stock and leaves the keeper's reserve", () => {
    const ctx = demo();
    const result = dispatch(CATALOG, ctx, {
      type: "craft-partial",
      projectId: "restore-hookshot",
      componentId: "copper-fitting",
      quantity: 3,
    });
    assert.equal(result.refusal, undefined);
    assert.equal(ownedQty(result.ctx.inventory, "copper-fitting"), 1);
    assert.equal(result.ctx.ledger.desiredReserve["copper-fitting"], 1);
    const line = result.ctx.ledger.projects
      .find((p) => p.projectId === "restore-hookshot")!
      .progress["0"];
    assert.equal(line.consumed, 2);
    assert.equal(result.deltas.some((d) => d.op === "remove-object"), false);
    assert.equal(project(result.ctx, "restore-fishing-net").status, "open");
  });

  it("cancelling a project refunds consumed materials and releases reservations", () => {
    let ctx = demo();
    ctx = dispatch(CATALOG, ctx, {
      type: "set-reservation",
      projectId: "restore-hookshot",
      componentId: "iron-rivet",
      quantity: 1,
    }).ctx;
    ctx = dispatch(CATALOG, ctx, {
      type: "craft-partial",
      projectId: "restore-fishing-net",
      componentId: "fish-hook",
      quantity: 1,
    }).ctx;
    assert.equal(ownedQty(ctx.inventory, "fish-hook"), 0);
    const cancelled = dispatch(CATALOG, ctx, { type: "cancel-project", projectId: "restore-fishing-net" });
    assert.equal(ownedQty(cancelled.ctx.inventory, "fish-hook"), 1);
    assert.equal(project(cancelled.ctx, "restore-fishing-net").status, "cancelled");
    assert.equal(project(cancelled.ctx, "restore-fishing-net").tagged, false);
    assert.equal(deltasTouchProtected(CATALOG, cancelled.deltas, ctx.inventory), false);
    const still = cancelled.ctx.ledger.projects.find((p) => p.projectId === "restore-hookshot")!;
    assert.equal(still.progress["1"]?.reserved, 1);
  });

  it("records a donation as stock and a known source", () => {
    const result = dispatch(CATALOG, demo(), {
      type: "donate",
      componentId: "copper-fitting",
      quantity: 2,
      from: "Cal Perch",
    });
    assert.equal(ownedQty(result.ctx.inventory, "copper-fitting"), 5);
    const copper = view(result.ctx, "copper-fitting");
    assert.ok(copper.knownSources.some((s) => s.label === "Gift from Cal Perch"));
    assert.equal(copper.knownSources.some((s) => s.label.includes("UNDISCOVERED")), false);
  });

  it("drops mundane stock on death, keeps heirlooms, and remembers the reserve", () => {
    const before = demo();
    assert.equal(project(before, "cook-creemee").status, "fulfilled");
    const result = dispatch(CATALOG, before, { type: "death", place: "the Middlebury Green" });
    assert.equal(ownedQty(result.ctx.inventory, "copper-fitting"), 0);
    assert.equal(ownedQty(result.ctx.inventory, "cream"), 0);
    assert.equal(ownedQty(result.ctx.inventory, "marble-chip"), 1);
    assert.equal(result.ctx.ledger.desiredReserve["copper-fitting"], 1);
    assert.ok(result.ctx.inventory.objects.some((o) => o.instanceId === "inst-maeve-glass"));
    assert.ok(result.ctx.inventory.objects.some((o) => o.instanceId === "inst-rifle"));
    assert.equal(project(result.ctx, "cook-creemee").status, "open");
    const copper = view(result.ctx, "copper-fitting");
    assert.ok(copper.knownSources.some((s) => s.label === "Your body on the Middlebury Green"));
    assert.equal(JSON.stringify(analyze(CATALOG, result.ctx)).includes("UNDISCOVERED_COLLEGE_STACKS_CACHE"), false);
    assert.equal(deltasTouchProtected(CATALOG, result.deltas, before.inventory), false);
  });

  it("round-trips a save without changing the ledger view", () => {
    let ctx = demo();
    ctx = dispatch(CATALOG, ctx, {
      type: "craft-partial",
      projectId: "restore-fishing-net",
      componentId: "fish-hook",
      quantity: 1,
    }).ctx;
    const raw = serialize(ctx);
    const loaded = hydrate(raw);
    assert.deepEqual(analyze(CATALOG, loaded), analyze(CATALOG, ctx));
    assert.equal(project(loaded, "restore-fishing-net").lines.find((l) => l.componentId === "fish-hook")?.consumed, 1);
  });

  it("a changed recipe refunds obsolete progress and never breaks a protected object", () => {
    let ctx = demo();
    ctx = dispatch(CATALOG, ctx, {
      type: "craft-partial",
      projectId: "restore-fishing-net",
      componentId: "twine",
      quantity: 2,
    }).ctx;
    const twineAfterCraft = ownedQty(ctx.inventory, "twine");
    const nextReqs: Requirement[] = [
      { componentId: "copper-fitting", quantity: 4 },
      { componentId: "fish-hook", quantity: 1 },
    ];
    const changed = dispatch(CATALOG, ctx, {
      type: "change-recipe",
      projectId: "restore-fishing-net",
      requirements: nextReqs,
    });
    assert.equal(changed.refusal, undefined);
    assert.equal(ownedQty(changed.ctx.inventory, "twine"), twineAfterCraft + 2);
    assert.equal(changed.deltas.some((d) => d.op === "remove-object"), false);
    assert.equal(deltasTouchProtected(CATALOG, changed.deltas, ctx.inventory), false);
    assert.ok(changed.ctx.inventory.objects.some((o) => o.instanceId === "inst-maeve-glass"));
    assert.equal(project(changed.ctx, "restore-fishing-net").status, "open");
    const copperLine = project(changed.ctx, "restore-fishing-net").lines.find((l) => l.componentId === "copper-fitting")!;
    assert.equal(copperLine.required, 4);
    assert.ok(copperLine.short > 0);
  });

  it("tagging a component never authorizes destroying a protected object", () => {
    let ctx = demo();
    const tagged = dispatch(CATALOG, ctx, { type: "tag-material", componentId: "glass-shard", tagged: true });
    assert.deepEqual(tagged.deltas, []);
    ctx = tagged.ctx;
    const also = dispatch(CATALOG, ctx, { type: "tag-project", projectId: "restore-mirror", tagged: true });
    assert.deepEqual(also.deltas, []);
    ctx = also.ctx;
    const before = structuredClone(ctx.inventory);
    const refused = dispatch(CATALOG, ctx, { type: "salvage", instanceId: "inst-maeve-glass" });
    assert.ok(refused.refusal?.includes("protected heirloom"));
    assert.deepEqual(refused.deltas, []);
    assert.deepEqual(refused.ctx.inventory, before);
    assert.equal(deltasTouchProtected(CATALOG, refused.deltas, before), false);
    const rifle = dispatch(CATALOG, ctx, { type: "tag-material", componentId: "iron-rivet", tagged: true });
    const rifleBreak = dispatch(CATALOG, rifle.ctx, { type: "salvage", instanceId: "inst-rifle" });
    assert.ok(rifleBreak.refusal?.includes("protected heirloom"));
    assert.equal(ownedQty(rifleBreak.ctx.inventory, "iron-rivet"), ownedQty(ctx.inventory, "iron-rivet"));
    assert.ok(rifleBreak.ctx.inventory.objects.some((o) => o.instanceId === "inst-rifle"));
  });

  it("explains visible loot and does not reveal an undiscovered cache", () => {
    const ctx = demo();
    const look = inspectVisible(CATALOG, ctx, "inst-june-net");
    assert.equal(look.shown, true);
    assert.deepEqual(look.sentences, [
      "Contains two copper fittings and one waxed twine coil.",
      "Useful for your fishing-net repair and refit the sugar-line.",
    ]);
    const glass = inspectVisible(CATALOG, ctx, "inst-maeve-glass");
    assert.equal(glass.protected, true);
    assert.ok(glass.sentences.some((s) => s.includes("Protected heirloom")));
    assert.ok(glass.sentences.some((s) => s.startsWith("Contains two homestead glass shards")));
    assert.ok(glass.sentences.some((s) => s.includes("reseat the homestead glass")));
    const hidden = inspectVisible(CATALOG, ctx, "cache-college-stacks");
    assert.equal(hidden.shown, false);
    assert.deepEqual(hidden.sentences, []);
    const dumped = JSON.stringify(analyze(CATALOG, ctx)) + JSON.stringify(look) + JSON.stringify(glass);
    assert.equal(dumped.includes("UNDISCOVERED_COLLEGE_STACKS_CACHE"), false);
  });

  it("the host port applies salvage deltas and refuses heirlooms without writing", () => {
    const seed = demo();
    const port = createMemoryPort(seed.inventory);
    const session = bindSession(port, seed);
    const broken = session.dispatch({ type: "salvage", instanceId: "inst-june-net" });
    assert.equal(broken.refusal, undefined);
    assert.equal(ownedQty(port.snapshot(), "copper-fitting"), 5);
    assert.equal(port.snapshot().objects.some((o) => o.instanceId === "inst-june-net"), false);
    const heirloom = session.dispatch({ type: "salvage", instanceId: "inst-mirror" });
    assert.ok(heirloom.refusal?.includes("protected heirloom"));
    assert.equal(port.snapshot().objects.some((o) => o.instanceId === "inst-mirror"), true);
    assert.equal(ownedQty(port.snapshot(), "glass-shard"), 0);
  });

  it("lists twenty projects and catalog relic names", () => {
    assert.equal(CATALOG.projects.length, 20);
    const analysis = analyze(CATALOG, demo());
    assert.equal(analysis.projects.length, 20);
    const mirror = analysis.projects.find((p) => p.id === "restore-mirror");
    assert.equal(mirror?.relicName, "Homestead glass");
    assert.equal(mirror?.provenance, "catalog");
    assert.equal(analysis.integration, "fixture-pending");
    assert.match(analysis.integrationNote, /Runtime integration pending/);
    assert.ok(CATALOG.relics.some((r) => r.id === "net" && r.name === "Bug net"));
  });

  it("says the copper split in one sentence and does not invent a bag for an empty book", () => {
    const card = fieldbookCard(demo());
    assert.match(card.sentence, /keeper's reserve/);
    assert.match(card.sentence, /not counted twice/);
    assert.equal(card.netId, "inst-june-net");
    assert.equal(card.glassId, "inst-maeve-glass");
    const empty = fieldbookCard({
      ledger: { version: 1, integration: "fixture-pending", projects: [], materialTags: {}, desiredReserve: {} },
      inventory: { loose: [], objects: [] },
      runtimeSources: [],
    });
    assert.match(empty.sentence, /empty/);
    assert.equal(empty.netId, null);
  });
});
