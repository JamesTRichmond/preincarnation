import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATALOG,
  EFFECT_LIST,
  PRESETS,
  SURVEY,
  compatibilityMatrix,
  countCopies,
  createSession,
  equip,
  equippedIds,
  factDelta,
  lootId,
  migrate,
  modify,
  onDeath,
  restoreMod,
  restoreStow,
  revive,
  runBeat,
  serialize,
  setForm,
  setKey,
  setTool,
  setTools,
  signature,
  unequip,
} from "../src/index.ts";
import type { Action, Session } from "../src/index.ts";

function wear(indexes: number[], patch?: (s: Session) => Session): Session {
  let s = createSession();
  if (patch) s = patch(s);
  for (const n of indexes) {
    const result = equip(s, lootId(n));
    assert.equal(result.ok, true, `equip ${n} failed: ${result.ok ? "" : result.reason}`);
    if (result.ok) s = result.session;
  }
  return s;
}

function surveyOf(indexes: number[], action: Action = SURVEY, patch?: (s: Session) => Session) {
  return runBeat(wear(indexes, patch), action);
}

describe("catalog", () => {
  it("holds 120 sequential ids, 24 of each category, with distinct purposes", () => {
    assert.equal(CATALOG.length, 120);
    assert.deepEqual(
      CATALOG.map((d) => d.id),
      Array.from({ length: 120 }, (_, i) => lootId(i + 1)),
    );
    for (const category of ["mainHand", "wearable", "trinket", "toolAttachment", "utility"] as const) {
      assert.equal(CATALOG.filter((d) => d.category === category).length, 24, category);
    }
    assert.equal(new Set(CATALOG.map((d) => d.purpose)).size, 120);
    assert.equal(new Set(CATALOG.map((d) => d.name)).size, 120);
    assert.equal(new Set(EFFECT_LIST).size, 120);
    for (const item of CATALOG) {
      assert.equal("durability" in item, false);
      assert.equal("broken" in item, false);
      assert.doesNotMatch(item.purpose, /damage \d+/i);
    }
    const spot = CATALOG.filter((d) => d.spotlight);
    assert.ok(spot.length >= 16);
    for (const category of ["mainHand", "wearable", "trinket", "toolAttachment", "utility"] as const) {
      assert.ok(spot.some((d) => d.category === category), category);
    }
    assert.equal(PRESETS.length, 16);
  });
});

describe("equip loop", () => {
  it("equips, replaces, refuses duplicates, and unequips back to the pack", () => {
    let s = createSession();
    const first = equip(s, lootId(25));
    assert.equal(first.ok, true);
    s = first.session;
    assert.equal(s.slots.torso, lootId(25));
    assert.equal(countCopies(s, lootId(25)), 1);
    const again = equip(s, lootId(25));
    assert.equal(again.ok, false);
    assert.equal(again.reason, "already-equipped");
    const swap = equip(s, lootId(33));
    assert.equal(swap.ok, true);
    s = swap.session;
    assert.equal(s.slots.torso, lootId(33));
    assert.ok(s.inventory.includes(lootId(25)));
    assert.equal(countCopies(s, lootId(25)), 1);
    const off = unequip(s, lootId(33));
    assert.equal(off.ok, true);
    s = off.session;
    assert.equal(s.slots.torso, undefined);
    assert.ok(s.inventory.includes(lootId(33)));
    const quiet = runBeat(s, { ...SURVEY, kind: "explore" });
    assert.equal(quiet.facts.alertRadius, undefined);
  });

  it("blocks a two-handed weapon while the off-hand is reserved", () => {
    const reserved = wear([119]);
    const blocked = equip(reserved, lootId(5));
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, "off-hand-reserved");
    const held = wear([7]);
    const reserve = equip(held, lootId(119));
    assert.equal(reserve.ok, false);
    assert.equal(reserve.reason, "off-hand-occupied-by-two-hand");
    assert.equal(countCopies(held, lootId(7)), 1);
  });

  it("a sling carries a two-handed hammer without letting it strike", () => {
    const s = wear([111, 7]);
    assert.equal(s.slots.mainHand, lootId(7));
    const beat = runBeat(s, SURVEY);
    assert.equal(beat.facts.slung, true);
    assert.equal(beat.facts.slideUnits, 0);
    assert.equal(beat.facts.crateResponse, "tumble");
  });

  it("swaps net attachments on the same tool instead of stacking them", () => {
    let s = wear([73]);
    assert.equal(s.attachments["tool.creek.net"], lootId(73));
    const next = equip(s, lootId(74));
    assert.equal(next.ok, true);
    s = next.session;
    assert.equal(s.attachments["tool.creek.net"], lootId(74));
    assert.ok(s.inventory.includes(lootId(73)));
    assert.equal(countCopies(s, lootId(73)), 1);
  });

  it("moves the lantern collar to the waist when the collar hook is worn", () => {
    let s = wear([30]);
    assert.equal(s.slots.cloak, lootId(30));
    const hook = equip(s, lootId(71));
    assert.equal(hook.ok, true);
    s = hook.session;
    assert.equal(s.slots.waist, lootId(30));
    assert.equal(s.slots.cloak, undefined);
    const back = unequip(s, lootId(71));
    assert.equal(back.ok, true);
    s = back.session;
    assert.equal(s.slots.cloak, lootId(30));
    assert.equal(s.slots.waist, undefined);
  });
});

describe("effects", () => {
  it("opens a short fault only inside the saber window", () => {
    const perfect = surveyOf([1], { kind: "counter", counterMs: 40, facing: "N" });
    assert.equal(perfect.facts.counterConverted, true);
    assert.equal(perfect.facts.faultLength, 2.4);
    assert.equal(perfect.facts.faultDir, "N");
    const late = surveyOf([1], { kind: "counter", counterMs: 100, facing: "N" });
    assert.equal(late.facts.counterConverted, false);
    assert.equal(late.facts.faultLength, 0);
  });

  it("ash ink and the counter thread share the wider window instead of adding", () => {
    let s = wear([1, 62]);
    const threaded = runBeat(s, { kind: "counter", counterMs: 100, facing: "W", useCharge: true });
    assert.equal(threaded.facts.counterConverted, true);
    assert.equal(threaded.facts.counterWindowMs, 100);
    assert.equal(threaded.session.charges[lootId(62)], 0);
    const inked = modify(s, lootId(1), "ash-ink");
    assert.equal(inked.ok, true);
    s = inked.session;
    const both = runBeat(s, { kind: "counter", counterMs: 105, facing: "W", useCharge: true });
    assert.equal(both.facts.counterWindowMs, 110);
    assert.notEqual(both.facts.counterWindowMs, 210);
    assert.equal(both.facts.counterConverted, true);
    const bare = runBeat(restoreMod(s, lootId(1)), { kind: "counter", counterMs: 105, facing: "W", useCharge: false });
    assert.equal(bare.facts.counterConverted, false);
  });

  it("tape shortens a fault and a compass chooses its direction", () => {
    const taped = surveyOf([1, 102], { kind: "counter", counterMs: 20, facing: "S" });
    assert.equal(taped.facts.faultLength, 0.4);
    assert.equal(taped.facts.faultTaped, true);
    let aimed = wear([18]);
    aimed = runBeat(aimed, { kind: "explore" }).session;
    assert.equal(aimed.compassDir, "E");
    const swapped = equip(unequip(aimed, lootId(18)).session, lootId(1));
    assert.equal(swapped.ok, true);
    const cut = runBeat(swapped.session, { kind: "counter", counterMs: 20, facing: "N" });
    assert.equal(cut.facts.faultDir, "E");
  });

  it("stores one blocked projectile and will not overwrite it", () => {
    const s = wear([25]);
    const first = runBeat(s, { kind: "block", projectileTag: "bolt" });
    assert.equal(first.facts.stored, "bolt");
    assert.equal(first.session.storedProjectile?.tag, "bolt");
    const second = runBeat(first.session, { kind: "block", projectileTag: "barbed" });
    assert.equal(second.facts.storeRefused, "barbed");
    assert.equal(second.session.storedProjectile?.tag, "bolt");
    let coated = wear([25, 36, 97]);
    coated = runBeat(coated, { kind: "block", projectileTag: "bolt" }).session;
    const released = runBeat(coated, { kind: "release" });
    assert.equal(released.facts.released, true);
    assert.equal(released.facts.releaseVector, "flow");
    assert.equal(released.facts.releaseMode, "thumb");
    assert.equal(released.session.storedProjectile, null);
  });

  it("rewinds a missed release once", () => {
    let s = wear([25, 72]);
    s = runBeat(s, { kind: "block", projectileTag: "bolt" }).session;
    const missed = runBeat(s, { kind: "release", missed: true, useCharge: true });
    assert.equal(missed.facts.rewound, true);
    assert.equal(missed.session.storedProjectile?.tag, "bolt");
    assert.equal(missed.session.charges[lootId(72)], 0);
  });

  it("does not double the grain slide when hammer and belt are both worn", () => {
    const both = surveyOf([7, 26], { kind: "shove" });
    assert.equal(both.facts.slideUnits, 2);
    assert.equal(both.facts.grainSource, "hammer+belt");
    assert.notEqual(both.facts.slideUnits, 4);
    const belt = surveyOf([26], { kind: "shove" });
    assert.equal(belt.facts.crateResponse, "grain");
    assert.equal(belt.facts.slideUnits, 2);
    const knot = surveyOf([26, 58], { kind: "shove", useCharge: true });
    assert.equal(knot.facts.crateResponse, "stop");
    assert.equal(knot.facts.slideUnits, 0);
  });

  it("changes which projectiles the creek net can catch", () => {
    const bare = surveyOf([], { kind: "net" });
    assert.equal(bare.facts.caughtTags, "bolt,debris,mote");
    const mouth = surveyOf([73], { kind: "net" });
    assert.equal(mouth.facts.caughtTags, "barbed,debris,mote");
    assert.equal(mouth.facts.caughtTags.includes("glass"), false);
    assert.equal(mouth.facts.caughtTags.includes("bolt"), false);
    let card = wear([73, 114]);
    const tuned = modify(card, lootId(114), "bolt");
    assert.equal(tuned.ok, true);
    card = tuned.session;
    const restored = runBeat(card, { kind: "net" });
    assert.ok(String(restored.facts.caughtTags).split(",").includes("barbed"));
    assert.ok(String(restored.facts.caughtTags).split(",").includes("bolt"));
    const mesh = surveyOf([74], { kind: "net" });
    assert.equal(mesh.facts.caughtTags, "debris,glass,mote,spark");
    const noNet = surveyOf([73], { kind: "net" }, (s) => setTool(s, "tool.creek.net", false));
    assert.equal(noNet.facts.caughtTags, "");
    assert.equal(noNet.facts.netMouth, "inert");
    const fork = surveyOf([14], { kind: "net" });
    assert.equal(fork.facts.forkCatches, "flowing-debris");
    assert.equal(fork.facts.forkRefuses, "bolt");
  });

  it("marks only a real safe tile and freezes that mark on death", () => {
    const combat = surveyOf([49], { kind: "mark", inCombat: true, hitstun: false });
    assert.equal(combat.facts.markLegal, false);
    assert.equal(combat.facts.markReason, "need-safe-flag");
    assert.equal(combat.facts.markTeleports, false);
    const flagged = surveyOf([49, 118], { kind: "mark", inCombat: true, hitstun: false });
    assert.equal(flagged.facts.markLegal, true);
    assert.deepEqual(flagged.session.safeMark, { x: 2, y: 2, frozen: false });
    const stunned = surveyOf([49, 118], { kind: "mark", inCombat: true, hitstun: true });
    assert.equal(stunned.facts.markReason, "hitstun");
    const calm = surveyOf([49], { kind: "mark", inCombat: false, hitstun: false });
    assert.equal(calm.facts.markLegal, true);
    const dead = onDeath(flagged.session);
    assert.equal(dead.safeMark?.frozen, true);
    assert.equal(dead.alive, false);
    const back = revive(dead);
    assert.equal(back.alive, true);
    assert.equal(back.safeMark?.frozen, true);
    assert.equal(back.slots.utility, lootId(118));
  });

  it("refills spent charges at rest and does not destroy the spike", () => {
    const s = wear([13, 110]);
    const spent = runBeat(s, { kind: "counter", useCharge: true, atRest: false });
    assert.equal(spent.facts.homingCut, true);
    assert.equal(spent.session.charges[lootId(13)], 0);
    assert.equal(equippedIds(spent.session).includes(lootId(13)), true);
    const early = runBeat(spent.session, { kind: "explore", atRest: false });
    assert.equal(early.facts.chargesRestored, false);
    assert.equal(early.session.charges[lootId(13)], 0);
    const rested = runBeat(early.session, { kind: "explore", atRest: true });
    assert.equal(rested.facts.chargesRestored, true);
    assert.equal(rested.session.charges[lootId(13)], 1);
  });

  it("sugar glaze is a reversible modification, not wear", () => {
    let s = wear([25]);
    const glazed = modify(s, lootId(25), "sugar-glaze");
    assert.equal(glazed.ok, true);
    s = glazed.session;
    const beat = runBeat(s, { kind: "block", projectileTag: "bolt" });
    assert.equal(beat.facts.glazeStick, true);
    const washed = runBeat(restoreMod(s, lootId(25)), { kind: "block", projectileTag: "bolt" });
    assert.equal(washed.facts.glazeStick, false);
    assert.equal(washed.session.slots.torso, lootId(25));
  });
});

describe("gates", () => {
  it("never opens a keyed door, lights a room, or skips a mandatory tool", () => {
    let s = wear([5, 30, 49, 56, 73, 75, 99, 109, 115]);
    s = setTools(s, false);
    s = setKey(s, false);
    s = setForm(s, { id: "form.lantern-borne", tags: ["light-body"] });
    const dark = runBeat(s, { ...SURVEY, removeLantern: false });
    assert.equal(dark.facts.doorOpen, false);
    assert.equal(dark.facts.darknessRevealed, false);
    assert.equal(dark.facts.revealMode, "none");
    assert.equal(dark.facts.seamOpen, false);
    assert.equal(dark.facts.seamReason, "needs-wedge-tool");
    assert.equal(dark.facts.deepCrossing, false);
    assert.equal(dark.facts.sluiceSet, false);
    assert.equal(dark.facts.hollowOpen, false);
    assert.equal(dark.facts.thinPassed, false);
    assert.equal(dark.facts.ashPileMoved, false);
    assert.equal(dark.facts.sampleJarred, false);
    assert.equal(dark.facts.brandWritten, false);
    assert.equal(dark.facts.caughtTags, "");
    assert.equal(dark.facts.keybell, "missing");
    const keyed = runBeat(setKey(wear([56, 109]), true), { kind: "door" });
    assert.equal(keyed.facts.doorOpen, false);
    assert.equal(keyed.facts.doorReason, "equipment-cannot-turn-key");
  });

  it("the wedge cheek blocks the square seam and still allows a slanted one", () => {
    const square = surveyOf([75], { kind: "wedge", seam: "square" });
    assert.equal(square.facts.seamOpen, false);
    assert.equal(square.facts.seamReason, "cheek-blocks-square");
    const slanted = surveyOf([75], { kind: "wedge", seam: "slanted" });
    assert.equal(slanted.facts.seamOpen, true);
    const feather = surveyOf([76], { kind: "wedge", seam: "square" });
    assert.equal(feather.facts.seamOpen, true);
    assert.equal(feather.facts.seamReason, "opened-quietly");
    const pick = surveyOf([12], { kind: "wedge", seam: "square" }, (s) => setTool(s, "tool.quarry.wedge", false));
    assert.equal(pick.facts.seamOpen, false);
    assert.equal(pick.facts.seamPickOpensMandatory, false);
  });

  it("a planted lantern keeps light only while the lantern body exists", () => {
    const planted = surveyOf([115], { kind: "stake" });
    assert.equal(planted.facts.stake, "planted");
    assert.equal(planted.facts.darknessRevealed, true);
    assert.equal(planted.session.lanternLocation, "staked");
    const gone = runBeat(planted.session, { kind: "dark", removeLantern: true });
    assert.equal(gone.facts.darknessRevealed, false);
    assert.equal(gone.session.tools["tool.lantern.body"], false);
    const noBody = surveyOf([115, 5], { kind: "dark" }, (s) => setTool(s, "tool.lantern.body", false));
    assert.equal(noBody.facts.stake, "failed");
    assert.equal(noBody.facts.revealMode, "none");
    assert.equal(noBody.facts.billNeedsLantern, true);
  });
});

describe("form and death", () => {
  it("suppresses an illegal cloak without deleting it, and the buckle stows it", () => {
    const worn = setForm(wear([30]), { id: "form.burrow", tags: ["no-cloak"] });
    assert.equal(worn.slots.cloak, lootId(30));
    assert.ok(worn.suppressed.includes(lootId(30)));
    assert.equal(countCopies(worn, lootId(30)), 1);
    const dark = runBeat(worn, { kind: "dark" });
    assert.equal(dark.facts.collarHandsFree, undefined);
    const buckled = setForm(wear([112, 30]), { id: "form.burrow", tags: ["no-cloak"] });
    assert.equal(buckled.slots.cloak, undefined);
    assert.ok(buckled.inventory.includes(lootId(30)));
    assert.ok(buckled.stowMemory.includes(lootId(30)));
    const walker = setForm(buckled, { id: "form.walker", tags: [] });
    const back = restoreStow(walker);
    assert.equal(back.slots.cloak, lootId(30));
    assert.equal(countCopies(back, lootId(30)), 1);
  });

  it("lets a hollow needle work while incorporeal and suppresses the saber", () => {
    const shade = { id: "form.shade", tags: ["incorporeal"] };
    const needle = setForm(wear([6]), shade);
    assert.equal(needle.suppressed.includes(lootId(6)), false);
    const heard = runBeat(needle, { kind: "listen" });
    assert.equal(heard.facts.wallOccupancy, "one-tile");
    const saber = setForm(wear([1]), shade);
    assert.ok(saber.suppressed.includes(lootId(1)));
    const silent = runBeat(saber, { kind: "counter", counterMs: 10, facing: "E" });
    assert.equal(silent.facts.saberFaultLength, undefined);
  });

  it("sets held gear down on death unless the packet is worn, and never deletes it", () => {
    const before = wear([1, 28, 26]);
    const dead = onDeath(before);
    assert.equal(dead.slots.mainHand, undefined);
    assert.equal(dead.slots.hands, undefined);
    assert.equal(dead.slots.waist, lootId(26));
    assert.ok(dead.inventory.includes(lootId(1)));
    assert.ok(dead.inventory.includes(lootId(28)));
    assert.equal(countCopies(dead, lootId(1)), 1);
    assert.equal(equippedIds(dead).length + dead.inventory.length, 120);
    const packed = onDeath(wear([120, 1, 28]));
    assert.equal(packed.slots.mainHand, lootId(1));
    assert.equal(packed.slots.hands, lootId(28));
    assert.equal(countCopies(packed, lootId(1)), 1);
    const inked = modify(before, lootId(1), "ash-ink");
    assert.equal(inked.ok, true);
    const still = onDeath(inked.session);
    assert.equal(still.mods[lootId(1)], "ash-ink");
  });
});

describe("save migration", () => {
  it("round-trips a v2 kit and migrates v0 and v1 without duplicating ids", () => {
    let s = wear([1, 25]);
    const inked = modify(s, lootId(1), "ash-ink");
    assert.equal(inked.ok, true);
    s = inked.session;
    s = runBeat(s, { kind: "mark", inCombat: false }).session;
    const loaded = migrate(JSON.parse(serialize(s)));
    assert.equal(loaded.v, 2);
    assert.equal(loaded.slots.mainHand, lootId(1));
    assert.equal(loaded.slots.torso, lootId(25));
    assert.equal(loaded.mods[lootId(1)], "ash-ink");
    assert.equal(countCopies(loaded, lootId(1)), 1);
    assert.equal(loaded.inventory.length + equippedIds(loaded).length, 120);

    const v0 = migrate({ ids: [lootId(1), lootId(25), lootId(1), "loot.equipment.999"] });
    assert.equal(v0.slots.mainHand, lootId(1));
    assert.equal(v0.slots.torso, lootId(25));
    assert.equal(countCopies(v0, lootId(1)), 1);
    assert.ok(v0.lostAndFound.includes("loot.equipment.999"));

    const v1 = migrate({
      v: 1,
      slots: { mainHand: lootId(7), utility: lootId(119) },
      inventory: [lootId(13), lootId(7)],
    });
    assert.equal(v1.slots.mainHand, undefined);
    assert.equal(v1.slots.utility, lootId(119));
    assert.ok(v1.inventory.includes(lootId(7)));
    assert.equal(countCopies(v1, lootId(7)), 1);
    assert.equal(v1.charges[lootId(13)], 1);
    const delta = factDelta(runBeat(v1, SURVEY).facts, runBeat(createSession(), SURVEY).facts);
    assert.equal(delta.twoHandBlocked, true);
  });
});

describe("uniqueness", () => {
  it("every item changes a survey, and no two items change it the same way", () => {
    const base = signature(runBeat(createSession(), SURVEY).facts);
    const seen = new Map<string, string>();
    for (const item of CATALOG) {
      const beat = runBeat(wear([item.index]), SURVEY);
      const sig = signature(beat.facts);
      assert.notEqual(sig, base, item.name);
      const prior = seen.get(sig);
      assert.equal(prior, undefined, `${item.name} collides with ${prior ?? ""}`);
      seen.set(sig, item.name);
      assert.equal(beat.facts.doorOpen, false);
    }
  });

  it("builds a compatibility matrix that refuses gate bypass", () => {
    const rows = compatibilityMatrix();
    assert.equal(rows.length, 120);
    for (const row of rows) {
      assert.equal(row.canOpenKeyedDoor, false);
      assert.equal(row.canLightWithoutLantern, false);
    }
    const cheek = rows.find((row) => row.id === lootId(75));
    assert.equal(cheek?.needsTool, "tool.quarry.wedge");
    assert.ok((cheek?.conflicts ?? 0) >= 1);
    const saber = rows.find((row) => row.id === lootId(1));
    assert.equal(saber?.forms["no-hands"], "suppressed");
    assert.equal(saber?.forms["light-body"], "active");
  });
});
