import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { handlers } from "../src/handlers.ts";
import {
  RELICS,
  acquire,
  advance,
  applyPersistence,
  capturePersistence,
  createBench,
  parseRelicId,
  prepareProbe,
  relicById,
  relicId,
  resolve,
  resolveBlow,
  runProbe,
  sealedSignature,
  speak,
  validateCatalog,
} from "../src/index.ts";

const catalog = RELICS;

describe("identity", () => {
  it("reserves exactly loot.relic.001–096 with unique names, sources, stamps, and scenes", () => {
    const errors = validateCatalog(catalog);
    assert.deepEqual(errors, []);
    assert.equal(catalog.length, 96);
    assert.equal(parseRelicId("loot.relic.001"), "loot.relic.001");
    assert.equal(relicId(96), "loot.relic.096");
    assert.throws(() => relicId(0));
    assert.throws(() => relicId(97));
    assert.throws(() => parseRelicId("loot.relic.097"));
    assert.throws(() => parseRelicId("loot.sword.001"));
  });

  it("does not generate relics from prefix or suffix tables", () => {
    const files = ["catalog-a.ts", "catalog-b.ts", "catalog-c.ts", "catalog-d.ts", "define.ts", "catalog.ts"];
    const blob = files
      .map((file) => readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"))
      .join("\n");
    assert.equal(blob.includes("randomAffix"), false);
    assert.equal(blob.includes("prefixes"), false);
    assert.equal(blob.includes("suffixes"), false);
    assert.equal(blob.includes("generateRelic"), false);
    const names = new Set(catalog.map((relic) => relic.name));
    assert.equal(names.size, 96);
  });
});

describe("provenance", () => {
  it("gives every relic an unrealized life, a chain of at least two hands, and a discovery", () => {
    for (const relic of catalog) {
      assert.ok(relic.provenance.veinLife.length > 10, relic.id);
      assert.ok(relic.provenance.chain.length >= 2, relic.id);
      assert.ok(relic.provenance.stamp.length > 8, relic.id);
      assert.ok(relic.discovery.sceneId.startsWith("scene.discover."), relic.id);
      assert.ok(relic.discovery.staging.length > 10, relic.id);
    }
  });
});

describe("executable coverage", () => {
  it("runs an authored probe for every relic without touching protected references", () => {
    const failures: string[] = [];
    for (const relic of catalog) {
      const prepared = prepareProbe(relic.id);
      const beforeSeal = sealedSignature(prepared.world);
      const before = structuredClone(prepared.world);
      const result = resolve(prepared.world, prepared.intent, catalog);
      if (result.code !== prepared.probe.code || result.ok !== prepared.probe.ok) {
        failures.push(`${relic.id} ${relic.name}: expected ${prepared.probe.ok}:${prepared.probe.code} got ${result.ok}:${result.code} (${result.detail})`);
        continue;
      }
      if (sealedSignature(result.world) !== beforeSeal) failures.push(`${relic.id} moved a protected reference`);
      if (result.ok) {
        if (JSON.stringify(result.world) === JSON.stringify(before)) failures.push(`${relic.id} reported success without a world change`);
      } else if (JSON.stringify(result.world) !== JSON.stringify(before)) {
        failures.push(`${relic.id} failed but mutated the world`);
      }
    }
    assert.deepEqual(failures, []);
  });
});

describe("duplicate and unique source", () => {
  it("refuses a second copy and a second take of the same source", () => {
    const relic = relicById(relicId(1));
    const first = acquire(createBench(), relic);
    assert.equal(first.ok, true);
    const second = acquire(first.world, relic);
    assert.equal(second.ok, false);
    assert.equal(second.code, "duplicate-refused");
    assert.equal(second.world.inventory.length, 1);
    const fresh = createBench();
    fresh.sources[relic.uniqueness.sourceId].consumed = true;
    fresh.sources[relic.uniqueness.sourceId].available = false;
    const spent = acquire(fresh, relic);
    assert.equal(spent.code, "source-spent");
  });

  it("spends the ash pile on the question and will not ask twice", () => {
    const first = runProbe(relicId(10));
    assert.equal(first.code, "asked");
    const again = resolve(first.world, { relicId: relicId(10), kind: "ask", targetId: "grave.unspoken" }, catalog);
    assert.equal(again.ok, false);
    assert.equal(again.code, "ash-spent");
    const source = again.world.sources["source.ash-unspoken"];
    assert.equal(source.consumed, true);
    const reacquire = acquire(again.world, relicById(relicId(10)));
    assert.equal(reacquire.ok, false);
  });
});

describe("restoration", () => {
  it("refuses Maeve's door after three witnessings until a true object is offered", () => {
    let world = createBench();
    world = acquire(world, relicById(relicId(1))).world;
    for (const door of ["door.pell", "door.hart", "door.silt"]) {
      const opened = resolve(world, { relicId: relicId(1), kind: "use", targetId: door }, catalog);
      assert.equal(opened.ok, true, opened.detail);
      world = opened.world;
    }
    const refused = resolve(world, { relicId: relicId(1), kind: "use", targetId: "door.silt" }, catalog);
    assert.equal(refused.code, "lineage-refuses");
    const early = resolve(refused.world, { relicId: relicId(1), kind: "restore" }, catalog);
    assert.equal(early.code, "restore-incomplete");
    const ready = structuredClone(refused.world);
    ready.flags["true-object.silt"] = true;
    const restored = resolve(ready, { relicId: relicId(1), kind: "restore" }, catalog);
    assert.equal(restored.code, "restored");
    const again = resolve(restored.world, { relicId: relicId(1), kind: "use", targetId: "door.ferry-loft" }, catalog);
    assert.equal(again.code, "opened");
  });

  it("mends the coat only after the button and a lineage acknowledgement", () => {
    let world = createBench();
    world = acquire(world, relicById(relicId(4))).world;
    world = resolve(world, { relicId: relicId(4), kind: "wear" }, catalog).world;
    const saved = resolveBlow(world, { amount: 8, source: "the yard knife", scripted: false, protected: false, bounded: true }, catalog);
    assert.equal(saved.code, "coat-intercept");
    assert.equal(saved.world.actor.alive, true);
    assert.equal(saved.world.actor.hp, 1);
    const coat = saved.world.placed.find((place) => place.instance.relicId === relicId(4));
    assert.ok(coat);
    assert.equal(coat.instance.state, "fractured");
    assert.equal(coat.where, "hearth.silt");
    const withButton = acquire(saved.world, relicById(relicId(29)));
    assert.equal(withButton.ok, true);
    const mended = resolve(withButton.world, { relicId: relicId(29), kind: "return" }, catalog);
    assert.equal(mended.code, "button-returned");
    const tooSoon = resolve(mended.world, { relicId: relicId(4), kind: "wear" }, catalog);
    assert.equal(tooSoon.code, "needs-restoration");
    const word = resolve(mended.world, { relicId: relicId(4), kind: "restore", extra: { person: "ione" } }, catalog);
    assert.equal(word.code, "restored");
    const worn = resolve(word.world, { relicId: relicId(4), kind: "wear" }, catalog);
    assert.equal(worn.code, "worn");
  });

  it("returns an unopened June to the meadow and spends it if the jar is opened", () => {
    let world = runProbe(relicId(3)).world;
    const back = resolve(world, { relicId: relicId(3), kind: "restore", extra: { atOrigin: true } }, catalog);
    assert.equal(back.code, "returned-to-site");
    const june = back.world.opportunities.find((entry) => entry.id === "env.last-june");
    assert.equal(june?.available, true);
    world = resolve(back.world, { relicId: relicId(3), kind: "seal", targetId: "env.last-june" }, catalog).world;
    const released = resolve(world, { relicId: relicId(3), kind: "release" }, catalog);
    assert.equal(released.code, "released");
    assert.equal(released.world.opportunities.find((entry) => entry.id === "env.last-june")?.localTicks, 3);
    const later = advance(released.world, 3);
    const after = later.opportunities.find((entry) => entry.id === "env.last-june");
    assert.equal(after?.lost, true);
  });
});

describe("mutually exclusive effects", () => {
  it("will not let the map rewrite space while the Unruler's beat is still held", () => {
    let world = runProbe(relicId(2)).world;
    world = acquire(world, relicById(relicId(11))).world;
    const blocked = resolve(world, { relicId: relicId(11), kind: "mirror", targetId: "path.orchard" }, catalog);
    assert.equal(blocked.code, "exclusive-conflict");
    const later = advance(world, 1);
    const allowed = resolve(later, { relicId: relicId(11), kind: "mirror", targetId: "path.orchard" }, catalog);
    assert.equal(allowed.code, "mirrored");
  });

  it("will not shift and ink a survey in the same beat", () => {
    let world = runProbe(relicId(6)).world;
    world = acquire(world, relicById(relicId(66))).world;
    const blocked = resolve(world, { relicId: relicId(66), kind: "blackout", targetId: "mark.shed" }, catalog);
    assert.equal(blocked.code, "exclusive-conflict");
  });
});

describe("death", () => {
  it("lets the coat answer only a bounded near-death, not a scripted or protected one", () => {
    let world = createBench();
    world = acquire(world, relicById(relicId(4))).world;
    world = acquire(world, relicById(relicId(2))).world;
    world = acquire(world, relicById(relicId(96))).world;
    world = acquire(world, relicById(relicId(1))).world;
    world = resolve(world, { relicId: relicId(4), kind: "wear" }, catalog).world;

    const scripted = resolveBlow(
      world,
      { amount: 20, source: "the inquest's written death", scripted: true, protected: false, bounded: true },
      catalog,
    );
    assert.equal(scripted.code, "died");
    assert.equal(scripted.world.death?.prevented, false);
    assert.equal(scripted.world.actor.alive, false);
    assert.equal(scripted.world.inventory.some((item) => item.relicId === relicId(4)), false);
    assert.ok(scripted.world.placed.some((place) => place.instance.relicId === relicId(4) && place.where === "hearth.silt"));
    assert.ok(scripted.world.placed.some((place) => place.instance.relicId === relicId(2) && place.instance.state === "fractured"));
    assert.ok(scripted.world.veinBank.some((item) => item.relicId === relicId(96)));
    assert.equal(scripted.world.inventory.some((item) => item.relicId === relicId(1)), true);

    const protectedDeath = resolveBlow(
      world,
      { amount: 20, source: "finale blow", scripted: false, protected: true, bounded: true },
      catalog,
    );
    assert.equal(protectedDeath.code, "died");
    assert.equal(protectedDeath.world.death?.prevented, false);

    const unbounded = resolveBlow(
      world,
      { amount: 20, source: "a long fall", scripted: false, protected: false, bounded: false },
      catalog,
    );
    assert.equal(unbounded.code, "died");

    const bounded = resolveBlow(
      world,
      { amount: 20, source: "the yard knife", scripted: false, protected: false, bounded: true },
      catalog,
    );
    assert.equal(bounded.code, "coat-intercept");
    assert.equal(bounded.world.actor.alive, true);
    assert.equal(bounded.world.inventory.some((item) => item.relicId === relicId(2)), true);
  });

  it("does not let an improperly worn coat intercept, and lets the handkerchief do it once", () => {
    let world = runProbe(relicId(47)).world;
    const cheated = resolveBlow(
      world,
      { amount: 30, source: "the yard knife", scripted: false, protected: false, bounded: true },
      catalog,
    );
    assert.equal(cheated.code, "died");

    world = createBench();
    world = acquire(world, relicById(relicId(76))).world;
    world = resolve(world, { relicId: relicId(76), kind: "ready" }, catalog).world;
    const saved = resolveBlow(
      world,
      { amount: 30, source: "the yard knife", scripted: false, protected: false, bounded: true },
      catalog,
    );
    assert.equal(saved.code, "cloth-intercept");
    assert.equal(saved.world.flags["vein.debt"], true);
    const dust = acquire(saved.world, relicById(relicId(61)));
    const blocked = resolve(dust.world, { relicId: relicId(61), kind: "sprinkle", targetId: "loot.relic.076" }, catalog);
    assert.equal(blocked.code, "vein-debt");
  });
});

describe("protected quest references", () => {
  it("refuses campaign boundaries, protected under-layers, protected graves, and protected memories", () => {
    const key = runProbe(relicId(1)).world;
    const mill = resolve(key, { relicId: relicId(1), kind: "use", targetId: "door.mill" }, catalog);
    assert.equal(mill.code, "not-remembered");
    assert.equal(mill.world.doors.find((door) => door.id === "door.mill")?.locked, true);
    const gate = resolve(key, { relicId: relicId(1), kind: "use", targetId: "door.quarry" }, catalog);
    assert.equal(gate.code, "campaign-gate");
    assert.equal(gate.world.doors.find((door) => door.id === "door.quarry")?.locked, true);

    const ring = runProbe(relicId(6)).world;
    const before = sealedSignature(ring);
    const refused = resolve(ring, { relicId: relicId(6), kind: "shift", targetId: "gate.quarry" }, catalog);
    assert.equal(refused.code, "class-refused");
    assert.equal(sealedSignature(refused.world), before);
    assert.equal(refused.world.boundaries.find((bound) => bound.id === "gate.quarry")?.notch, 0);

    const bell = runProbe(relicId(5)).world;
    const secret = resolve(bell, { relicId: relicId(5), kind: "ring", targetId: "sound.secret" }, catalog);
    assert.equal(secret.code, "protected-underlayer");
    assert.equal(secret.world.sounds.find((sound) => sound.id === "sound.secret")?.revealed, false);
    assert.equal(secret.world.quests.find((quest) => quest.id === "quest.bell-secret")?.status, "active");

    const ash = runProbe(relicId(10)).world;
    assert.equal(ash.actor.cannotSayOwnName, true);
    assert.equal(ash.quests.find((quest) => quest.id === "quest.inquest")?.status, "active");
    const sealedGrave = resolve(createBenchAcquired(10), { relicId: relicId(10), kind: "ask", targetId: "grave.sealed" }, catalog);
    assert.equal(sealedGrave.code, "protected-grave");
    assert.equal(sealedGrave.world.graves.find((grave) => grave.id === "grave.sealed")?.asked, false);

    const cupWorld = createBenchAcquired(12);
    const oath = resolve(
      cupWorld,
      { relicId: relicId(12), kind: "refill", extra: { journalId: "journal.oath" } },
      catalog,
    );
    assert.equal(oath.code, "not-at-spring");
    const atSpring = structuredClone(cupWorld);
    atSpring.flags["at.spring"] = true;
    atSpring.flags["cup.filled"] = false;
    const refusedMemory = resolve(atSpring, { relicId: relicId(12), kind: "refill", extra: { journalId: "journal.oath" } }, catalog);
    assert.equal(refusedMemory.code, "protected-memory");
    assert.equal(refusedMemory.world.journal.find((entry) => entry.id === "journal.oath")?.forgotten, false);

    const unruler = runProbe(relicId(2)).world;
    const questSpan = resolve(unruler, { relicId: relicId(2), kind: "use", targetId: "span.inquest" }, catalog);
    assert.equal(questSpan.code, "not-approved");
    assert.equal(questSpan.world.spatial.find((span) => span.id === "span.inquest")?.swapped, false);
  });

  it("rolls back a handler that tries to fail a protected quest", () => {
    const original = handlers["remembered-door"];
    handlers["remembered-door"] = (ctx) => {
      const quest = ctx.world.quests.find((entry) => entry.id === "quest.inquest");
      if (quest) quest.status = "failed";
      const gate = ctx.world.boundaries.find((entry) => entry.id === "gate.quarry");
      if (gate) gate.notch += 1;
      return { ok: true, code: "tamper", detail: "The handler tried to close the inquest and shove the quarry gate." };
    };
    try {
      const world = acquire(createBench(), relicById(relicId(1))).world;
      const result = resolve(world, { relicId: relicId(1), kind: "use", targetId: "door.silt" }, catalog);
      assert.equal(result.ok, false);
      assert.equal(result.code, "protected-reference");
      assert.equal(result.world.quests.find((quest) => quest.id === "quest.inquest")?.status, "active");
      assert.equal(result.world.boundaries.find((bound) => bound.id === "gate.quarry")?.notch, 0);
      assert.equal(result.world.log.some((line) => line.includes("quarry gate")), false);
    } finally {
      handlers["remembered-door"] = original;
    }
  });

  it("keeps the return ticket and the marble heart from choosing around an open protected quest", () => {
    const ticket = runProbe(relicId(95));
    assert.equal(ticket.code, "finale-open");
    assert.equal(ticket.world.flags["left.county"], undefined);
    const heart = runProbe(relicId(96));
    assert.equal(heart.code, "waits");
    const ready = structuredClone(heart.world);
    for (const quest of ready.quests) if (quest.protected) quest.status = "complete";
    ready.flags["coat.acknowledged"] = true;
    const set = resolve(ready, { relicId: relicId(96), kind: "set-hearth" }, catalog);
    assert.equal(set.code, "set-hearth");
    assert.equal(set.world.flags["persist.restored"], true);
    assert.equal(set.world.quests.find((quest) => quest.id === "quest.finale")?.status, "complete");
  });
});

describe("persistence", () => {
  it("refuses a save that would duplicate a relic and restores a bank", () => {
    const world = runProbe(relicId(1)).world;
    const save = capturePersistence(world);
    const blank = createBench();
    const restored = applyPersistence(blank, save);
    const again = acquire(restored, relicById(relicId(1)));
    assert.equal(again.code, "duplicate-refused");
    const doubled = structuredClone(save);
    doubled.placed.push({ where: "hearth.silt", instance: structuredClone(save.instances[0]) });
    assert.throws(() => applyPersistence(createBench(), doubled));
  });
});

describe("speech and year", () => {
  it("stops present speech while the wrong-year window is open", () => {
    const opened = runProbe(relicId(9));
    assert.equal(opened.code, "year-open");
    const said = speak(opened.world, "maeve");
    assert.equal(said.code, "out-of-year");
    const shut = resolve(opened.world, { relicId: relicId(9), kind: "close", targetId: "window.silt" }, catalog);
    assert.equal(speak(shut.world, "maeve").code, "spoke");
  });
});

function createBenchAcquired(n: number) {
  return acquire(createBench(), relicById(relicId(n))).world;
}
