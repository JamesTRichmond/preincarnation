import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { allSpokenLines, convo } from "../src/dialogue.ts";
import { step } from "../src/engine.ts";
import { estimateMinutes } from "../src/estimates.ts";
import { dependencyGraph, graphMermaid } from "../src/graph.ts";
import { runAfterEarlyDeath, runAttentive, runDirect } from "../src/intended.ts";
import { allUnderstood, lesson } from "../src/lessons.ts";
import { routeToEntity } from "../src/route.ts";
import { hydrate, serialize } from "../src/save.ts";
import { Player } from "../src/sim.ts";
import { initialState } from "../src/state.ts";
import { LESSON_IDS } from "../src/types.ts";
import { listVerbs } from "../src/verbs.ts";
import { AT, BRIARS, RIVER, VEIN, assertWorld } from "../src/world.ts";

function play(): Player {
  return new Player(initialState());
}

test("world holds together", () => {
  assert.deepEqual(assertWorld(), []);
  const fresh = initialState();
  assert.equal(routeToEntity(fresh, "seam") !== null, true);
  assert.equal(routeToEntity(fresh, "impression"), null);
  assert.equal(routeToEntity(fresh, "ione") !== null, true);
});

test("1 attentive hour understands every lesson", () => {
  const p = runAttentive();
  assert.equal(allUnderstood(p.state), true);
  assert.equal(p.state.era, "altered");
  assert.equal(p.state.clothes, "impression");
  assert.equal(p.state.seam.veinOpen, true);
  assert.equal(p.state.flags.heardClaim, true);
  assert.equal(p.state.flags.heardAlteredYear, true);
  assert.ok(p.speeches.length >= 8);
  assert.ok(p.state.hints.includes("wrong-tool"));
  const est = estimateMinutes(p.cmds);
  assert.equal(est.estimate, true);
  assert.ok(est.modelMinutes > 8 && est.modelMinutes < 40);
});

test("2 already-knows: no idle hint and no wrong-tool hint", () => {
  const p = runDirect();
  assert.equal(allUnderstood(p.state), true);
  assert.deepEqual(p.state.hints, []);
  assert.equal(p.captions.includes("The road continues."), false);
  assert.equal(p.speeches.length, 0);
});

test("3 early death still leaves every teacher", () => {
  const p = runAfterEarlyDeath();
  assert.equal(allUnderstood(p.state), true);
  assert.ok(p.state.deaths >= 1);
  assert.equal(p.state.era, "altered");
  assert.equal(p.state.clothes, "impression");
});

test("4 ditch warns, then releases forward", () => {
  const p = play();
  p.to("road", AT.ditch.x, AT.ditch.y, true);
  assert.equal(p.state.map, "shore");
  assert.equal(p.state.dead, true);
  assert.ok(p.captions.some((c) => c.includes("over your head")));
  assert.equal(lesson(p.state, "death"), "practiced");
  p.verb("remain");
  assert.equal(p.state.era, "arrival");
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.era, "altered");
  assert.equal(p.state.clothes, "impression");
  assert.equal(lesson(p.state, "death"), "understood");
  assert.equal(p.state.visited.includes("vein"), false);
});

test("5 skip every conversation", () => {
  const p = play();
  p.verb("look-parcel");
  p.walk("table");
  p.verb("look-table");
  p.verb("leave-parcel");
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("strike-thread-vein");
  p.to("vein", VEIN.pinch.x, VEIN.pinch.y, true);
  p.walk("pale-water");
  p.verb("release");
  p.verb("look-coat");
  p.walk("milepost");
  p.verb("read-milepost");
  assert.equal(p.speeches.length, 0);
  assert.deepEqual(p.state.talkProgress, {});
  assert.equal(p.state.flags.heardClaim, false);
  assert.equal(p.state.flags.heardAlteredYear, false);
  assert.equal(p.state.flags.delivered, true);
  assert.equal(p.state.flags.readProphecy, true);
  assert.equal(lesson(p.state, "hammer"), "understood");
  assert.equal(lesson(p.state, "recognition"), "understood");
  assert.equal(lesson(p.state, "death"), "understood");
});

test("6 refuse the vein; the yard block is enough to shift", () => {
  const p = play();
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("block");
  p.verb("strike-thread-yard");
  assert.equal(p.state.seam.yardOpen, true);
  assert.equal(p.state.seam.veinOpen, false);
  assert.equal(p.state.visited.includes("vein"), false);
  p.to("river", RIVER.deep.x, RIVER.deep.y, true);
  assert.equal(p.state.map, "shore");
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.era, "altered");
  assert.equal(p.state.hammerSite, "yard");
  assert.equal(p.state.seam.veinOpen, false);
  assert.equal(lesson(p.state, "hammer"), "understood");
});

test("7 vein before the parcel", () => {
  const p = play();
  p.walk("vein-hammer");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("strike-thread-vein");
  p.walk("impression");
  p.verb("look-impression");
  assert.equal(p.state.inventory.includes("parcel"), true);
  assert.equal(p.state.flags.delivered, false);
  assert.equal(p.state.era, "arrival");
  assert.equal(p.state.flags.sawImpression, true);
  p.walk("ione");
  p.say("talk-ione");
  assert.equal(p.state.flags.heardClaim, true);
  assert.equal(p.state.flags.delivered, false);
});

test("8 long break resumes mid-speech and does not restart it", () => {
  const p = play();
  p.walk("ione");
  p.verb("talk-ione");
  p.act({ type: "advance" });
  assert.equal(p.state.talk?.index, 1);
  p.act({ type: "hide" });
  p.walk("peg");
  assert.equal(p.state.talk, null);
  p.act({ type: "resume-break" });
  assert.equal(p.state.talk?.id, "ione-arrival");
  assert.equal(p.state.talk?.index, 1);
  assert.ok(p.state.continuity);
  p.act({ type: "ack-continuity" });
  assert.equal(p.state.continuity, null);
  p.act({ type: "advance" });
  assert.equal(p.speeches.at(-1)?.text, convo("ione-arrival").lines[2].text);
  assert.notEqual(p.speeches.at(-1)?.text, convo("ione-arrival").lines[0].text);
});

test("9 salve at full health is kept", () => {
  const p = play();
  p.walk("cupboard");
  p.verb("take-salve-house");
  p.verb("use-salve");
  assert.equal(p.state.inventory.filter((i) => i === "salve").length, 1);
  assert.equal(p.state.flags.salveUsed, false);
  assert.equal(p.state.vitality, 5);
  assert.equal(lesson(p.state, "heal"), "unmet");
});

test("10 rest writes a session notch and is not the save lesson", () => {
  const p = play();
  p.walk("bank");
  p.verb("rest-bank");
  assert.equal(p.state.sessionNotch?.reason, "rest");
  assert.equal(p.state.flags.explicitSave, false);
  assert.equal(lesson(p.state, "save"), "unmet");
  assert.equal(lesson(p.state, "rest"), "understood");
  const savedX = p.state.sessionNotch?.x;
  p.walk("milepost");
  p.act({ type: "resume-break" });
  assert.equal(p.state.x, savedX);
  assert.ok(p.state.continuity);
});

test("11 leveling the blade does not lock Ione or kill anyone", () => {
  const p = play();
  p.walk("ione");
  p.verb("draw-blade");
  p.verb("level-blade");
  assert.equal(p.state.flags.threatened, true);
  assert.equal(p.state.dead, false);
  p.verb("talk-ione");
  assert.match(p.speeches.at(-1)?.text ?? "", /knife/);
  p.verb("lower");
  p.say("talk-ione");
  assert.equal(p.state.flags.heardClaim, true);
  p.verb("leave-parcel");
  assert.equal(p.state.flags.delivered, true);
  assert.equal(p.state.map, "house");
});

test("12 seam before the hammer is not a lock", () => {
  const p = play();
  p.walk("seam");
  assert.equal(listVerbs(p.state).some((v) => v.id === "strike-thread-vein"), false);
  p.verb("feel-vein");
  assert.equal(p.state.seam.veinOpen, false);
  p.walk("vein-hammer");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("strike-thread-vein");
  assert.equal(p.state.seam.veinOpen, true);
  assert.equal(lesson(p.state, "hammer"), "understood");
});

test("13 walking past the impression does not count as seeing it", () => {
  const p = play();
  p.walk("vein-hammer");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("strike-thread-vein");
  p.to("vein", VEIN.pinch.x, VEIN.pinch.y, true);
  assert.equal(p.state.flags.sawImpression, false);
  assert.equal(p.state.flags.stoodImpression, false);
  assert.equal(p.state.map, "shore");
  p.walk("pale-water");
  p.verb("release");
  p.walk("milepost");
  p.verb("read-milepost");
  assert.equal(lesson(p.state, "recognition"), "understood");
});

test("14 seeing the impression does not force the year-shift", () => {
  const p = play();
  p.walk("vein-hammer");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("strike-thread-vein");
  p.walk("impression");
  p.verb("look-impression");
  p.verb("stand-impression");
  p.walk("ruts");
  assert.equal(p.state.era, "arrival");
  assert.equal(p.state.clothes, "travel");
  assert.equal(p.state.flags.sawImpression, true);
  assert.equal(lesson(p.state, "death"), "unmet");
  p.walk("impression");
  assert.equal(p.state.map, "vein");
});

test("15 remaining on the shore does not nag or advance the year", () => {
  const p = play();
  p.to("road", AT.ditch.x, AT.ditch.y, true);
  p.verb("remain");
  p.verb("remain");
  assert.equal(p.state.dead, true);
  assert.equal(p.state.era, "arrival");
  assert.equal(p.captions.filter((c) => c.includes("does not argue")).length, 1);
  assert.equal(p.state.hints.includes("idle-road"), false);
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.era, "altered");
});

test("16 a scar and an open face survive release, and resume will not rewind them", () => {
  const p = play();
  p.walk("wayside");
  p.verb("notch-stone");
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("draw-blade");
  p.verb("cut-face-vein");
  assert.equal(p.state.seam.veinScar, true);
  assert.equal(p.state.seam.veinOpen, false);
  p.verb("equip-hammer");
  p.verb("strike-thread-vein");
  p.to("vein", VEIN.pinch.x, VEIN.pinch.y, true);
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.era, "altered");
  assert.equal(p.state.seam.veinScar, true);
  assert.equal(p.state.seam.veinOpen, true);
  assert.ok(p.state.agedNotch);
  p.act({ type: "resume-break" });
  assert.equal(p.state.era, "altered");
  assert.equal(p.state.seam.veinScar, true);
  p.walk("seam");
  p.verb("look-seam");
  assert.equal(p.state.flags.observedScar, true);
  assert.equal(p.state.flags.observedOpenVein, true);
  assert.equal(lesson(p.state, "permanence"), "understood");
});

test("17 opening the parcel alone does not lock the house", () => {
  const p = play();
  p.verb("draw-blade");
  p.verb("cut-twine");
  p.verb("open-wax");
  p.verb("read-pattern");
  p.verb("lower");
  p.walk("ione");
  p.say("talk-ione");
  assert.equal(p.state.flags.heardClaim, true);
  p.say("talk-ione");
  assert.ok(p.speeches.some((s) => s.text.includes("You opened yours")));
  p.verb("leave-parcel");
  assert.equal(p.state.flags.delivered, true);
  assert.equal(p.state.inventory.includes("parcel"), false);
});

test("18 speech continues where it stopped", () => {
  const p = play();
  p.walk("ione");
  p.verb("talk-ione");
  p.act({ type: "advance" });
  p.act({ type: "leave-talk" });
  assert.equal(p.state.talk, null);
  assert.equal(p.state.talkProgress["ione-arrival"], 2);
  p.walk("peg");
  p.walk("ione");
  p.verb("talk-ione");
  assert.equal(p.speeches.at(-1)?.text, convo("ione-arrival").lines[2].text);
});

test("19 a long break with no notch does not throw or recap", () => {
  const fresh = initialState();
  const r = step(fresh, { type: "resume-break" });
  assert.ok(r.events.includes("resume:empty"));
  assert.equal(r.state.continuity, null);
  assert.equal(r.state.x, fresh.x);
  assert.equal(r.state.map, fresh.map);
});

test("20 refusing a remedy can still end in release", () => {
  const p = play();
  p.walk("slab");
  p.verb("step-under");
  assert.equal(p.state.vitality, 2);
  assert.equal(p.state.bleed, true);
  assert.equal(lesson(p.state, "heal"), "unmet");
  p.verb("step-under");
  assert.equal(p.state.map, "shore");
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.scarWrist, true);
  assert.equal(p.state.vitality, 5);
  assert.equal(p.state.bleed, false);
  assert.equal(lesson(p.state, "death"), "understood");
  assert.equal(lesson(p.state, "heal"), "unmet");
});

test("21 yard rule, then the real vein, after the shift", () => {
  const p = play();
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("block");
  p.verb("strike-thread-yard");
  p.to("river", RIVER.deep.x, RIVER.deep.y, true);
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.seam.veinOpen, false);
  p.walk("seam");
  p.verb("strike-thread-vein");
  assert.equal(p.state.seam.veinOpen, true);
  assert.equal(p.state.seam.yardOpen, true);
  assert.equal(p.state.hammerSite, "yard");
  const row = p.state.seam.veinOpen;
  assert.equal(row, true);
});

test("22 corrupt saves fall back instead of crashing", () => {
  const bad = hydrate("{");
  assert.equal(bad.map, "road");
  assert.equal(bad.vitality, 5);
  const odd = hydrate('{"version":99,"map":"shore"}');
  assert.equal(odd.map, "road");
  const partial = hydrate('{"version":1,"map":"vein"}');
  assert.equal(partial.map, "road");
  const p = play();
  p.walk("wayside");
  p.verb("notch-stone");
  const again = hydrate(serialize(p.state));
  assert.equal(again.flags.explicitSave, true);
  assert.equal(again.explicitNotch?.reason, "stone");
  assert.equal(again.map, p.state.map);
});

test("23 the lane can be refused", () => {
  const p = play();
  p.to("lane", AT.edge.x, AT.edge.y);
  p.act({ type: "move", dir: "e" }, { allowBump: true });
  assert.equal(p.state.flags.leftEdge, true);
  assert.equal(p.state.map, "lane");
  p.act({ type: "move", dir: "e" }, { allowBump: true });
  const line = "Past this, the county continues. This hour does not.";
  assert.equal(p.captions.filter((c) => c === line).length, 1);
  const x = p.state.x;
  p.act({ type: "move", dir: "w" });
  assert.equal(p.state.x, x - 1);
});

test("24 idle hint happens once and only if you have not moved", () => {
  const p = play();
  p.act({ type: "wait", seconds: 8 });
  p.act({ type: "wait", seconds: 9 });
  assert.deepEqual(p.state.hints, ["idle-road"]);
  assert.equal(p.captions.filter((c) => c === "The road continues.").length, 1);
  const q = play();
  q.act({ type: "move", dir: "e" });
  q.act({ type: "wait", seconds: 30 });
  assert.deepEqual(q.state.hints, []);
});

test("25 hammer rule: face, edge, and thread are different", () => {
  const p = play();
  p.walk("seam");
  p.verb("feel-vein");
  assert.equal(p.state.seam.veinOpen, false);
  p.verb("draw-blade");
  p.verb("cut-face-vein");
  assert.equal(p.state.seam.veinScar, true);
  assert.equal(p.state.seam.veinOpen, false);
  p.walk("vein-hammer");
  p.verb("take-hammer");
  p.walk("seam");
  p.verb("strike-face-vein");
  assert.equal(p.state.seam.veinOpen, false);
  assert.equal(p.state.seam.veinDent, true);
  assert.equal(p.state.dust, true);
  p.verb("strike-thread-vein");
  assert.equal(p.state.seam.veinOpen, true);
  assert.equal(routeToEntity(p.state, "impression") !== null, true);
});

test("26 briars can bleed a body out without a remedy", () => {
  const p = play();
  for (const b of BRIARS) {
    if (p.state.dead) break;
    p.to("road", b.x, b.y);
  }
  assert.equal(p.state.dead, true);
  assert.ok(p.state.deaths >= 1);
  p.walk("pale-water");
  p.verb("release");
  assert.equal(p.state.scarWrist, true);
});

test("dependency graph has no hard gates", () => {
  const g = dependencyGraph();
  assert.deepEqual([...g.lessons], [...LESSON_IDS]);
  assert.ok(g.edges.length >= 12);
  assert.equal(g.edges.some((e) => (e.kind as string) !== "soft"), false);
  const mer = graphMermaid();
  for (const id of LESSON_IDS) assert.ok(mer.includes(id), id);
  assert.match(g.hammerRule, /thread/);
  assert.match(g.hammerRule, /face/);
});

test("spoken lines are present and contain no lesson jargon", () => {
  const lines = allSpokenLines();
  assert.ok(lines.length >= 20);
  const ban = /\b(WASD|tutorial|quest|objective|compass|hit points|game over)\b/i;
  for (const line of lines) {
    assert.ok(line.text.length > 0);
    assert.equal(ban.test(line.text), false, line.text);
  }
});

test("player-facing source avoids lecture words", () => {
  const ban = /\b(WASD|tutorial|quest|objective|compass|hit points|game over)\b/i;
  const files = ["../src/dialogue.ts", "../src/verbs.ts", "../src/effects.ts", "../src/intended.ts", "../src/state.ts"];
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(ban.test(text), false, file);
  }
});
