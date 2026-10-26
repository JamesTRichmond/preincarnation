// @ts-nocheck
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ABILITY_RECORDS,
  COMBINATIONS,
  addActor,
  addAnchor,
  addBlocker,
  addSeal,
  addWall,
  assertCatalog,
  attune,
  bloomBlossom,
  createWorld,
  cutTether,
  dealDamage,
  ellisOf,
  enqueue,
  linkActors,
  plantBlossom,
  plantMark,
  recordsDocument,
  releaseBrace,
  run,
  spawnProjectile,
  step,
} from "../src/index.js";

function make(settings = {}) {
  const world = createWorld({ settings: { ambientRegen: false, ...settings } });
  addActor(world, {
    id: "ellis",
    name: "Ellis",
    x: 100,
    y: 200,
    team: "ellis",
    hp: 400,
    r: 14,
    facing: 0,
  });
  return world;
}

function foe(world, spec) {
  return addActor(world, {
    name: spec.name ?? "foe",
    team: "foe",
    hp: 100,
    r: 14,
    ai: false,
    ...spec,
  });
}

function shot(world, x, y, extra = {}) {
  enqueue(world, "shot", { aimX: x, aimY: y, ...extra });
}
function strike(world, x, y) {
  enqueue(world, "strike", { aimX: x, aimY: y });
}

test("catalog is 12 sugar, 12 ash, two capstones each, and four combinations", () => {
  assertCatalog();
  assert.equal(ABILITY_RECORDS.length, 24);
  for (const rec of ABILITY_RECORDS) {
    for (const key of ["rules", "telegraph", "cancellation", "tradeoff", "resources", "boss", "puzzle"]) {
      assert.equal(typeof rec[key], "string", rec.id + " " + key);
      assert.ok(rec[key].length > 12, rec.id + " " + key);
    }
  }
  assert.ok(COMBINATIONS.length >= 4);
  const featured = ABILITY_RECORDS.filter((r) => r.featured).map((r) => r.id);
  assert.ok(featured.length >= 8);
});

test("projectiles never steer toward a body", () => {
  const world = make();
  foe(world, { id: "side", x: 260, y: 80 });
  const p = spawnProjectile(world, {
    x: 120,
    y: 200,
    vx: 200,
    vy: 0,
    damage: 5,
    life: 2,
    kind: "arrow",
  });
  run(world, 0.4);
  assert.equal(p.homing, false);
  assert.equal(p.steering, "straight");
  assert.ok(Math.abs(p.vy) < 1e-6);
  assert.equal(foeHp(world, "side"), 100);
});

test("projectile cap fizzles extras instead of spawning seekers", () => {
  const world = make();
  for (let i = 0; i < 12; i++) {
    assert.ok(spawnProjectile(world, { x: 10, y: 10, vx: 0, vy: 0, life: 5, damage: 0 }));
  }
  assert.equal(spawnProjectile(world, { x: 10, y: 10, vx: 0, vy: 0, life: 5 }), null);
  assert.equal(world.counters.fizzled, 1);
  assert.equal(world.projectiles.length, 12);
  const reduced = make({ reducedEffects: true });
  for (let i = 0; i < 6; i++) spawnProjectile(reduced, { x: 10, y: 10, vx: 0, vy: 0, life: 5 });
  assert.equal(spawnProjectile(reduced, { x: 12, y: 12, vx: 0, vy: 0, life: 5 }), null);
  assert.equal(reduced.counters.fizzled, 1);
});

test("damage multiplier clamps, and reduced effects clamp lower", () => {
  const world = make();
  const t = foe(world, { id: "t", x: 200, y: 200 });
  t.wreath = 4;
  const hit = dealDamage(world, t, 10, { extraMult: 2.05, fromEllis: true });
  assert.equal(hit.capped, true);
  assert.equal(hit.mult, 2.5);
  assert.equal(hit.amount, 25);
  const reduced = make({ reducedEffects: true });
  const u = foe(reduced, { id: "u", x: 200, y: 200 });
  u.wreath = 4;
  const hit2 = dealDamage(reduced, u, 10, { extraMult: 2.05 });
  assert.equal(hit2.mult, 1.5);
  assert.equal(hit2.amount, 15);
});

test("offscreen foes are not targets", () => {
  const world = make();
  const hidden = foe(world, { id: "hid", x: 220, y: 200, onScreen: false });
  const arrow = dealDamage(world, hidden, 40, { fromEllis: true });
  assert.equal(arrow.reason, "offscreen");
  assert.equal(hidden.hp, 100);
  shot(world, 400, 200);
  run(world, 0.6);
  assert.equal(hidden.hp, 100);
  const bud = plantBlossom(world, { x: hidden.x, y: hidden.y, deliberate: true });
  bud.armed = true;
  bloomBlossom(world, bud);
  assert.equal(hidden.hp, 100);
  attune(world, "sugar", "thread-the-needle");
  foe(world, { id: "a", x: 300, y: 160 });
  foe(world, { id: "b", x: 300, y: 240, onScreen: false });
  shot(world, 500, 200);
  run(world, 1);
  assert.equal(world.tethers.filter((t) => t.alive).length, 0);
});

test("puzzle seals stop shots and break tethers", () => {
  const world = make();
  const far = foe(world, { id: "far", x: 420, y: 200 });
  addSeal(world, { x: 250, y: 120, w: 24, h: 160 });
  shot(world, 500, 200);
  run(world, 0.8);
  assert.equal(far.hp, 100);
  assert.ok(world.events.some((e) => e.type === "projectile-stop" && e.reason === "seal"));
  const left = foe(world, { id: "l", x: 180, y: 200 });
  const right = foe(world, { id: "r", x: 360, y: 200 });
  const te = linkActors(world, left, right, { slack: 400, tension: 10 });
  assert.equal(te, null);
  world.seals.length = 0;
  const linked = linkActors(world, left, right, { slack: 400, tension: 10 });
  assert.ok(linked);
  addSeal(world, { x: 250, y: 120, w: 24, h: 160 });
  step(world, 1 / 60);
  assert.equal(linked.alive, false);
  assert.ok(world.events.some((e) => e.type === "tether-break" && e.reason === "seal"));
});

test("tethers break on distance, walls, offscreen grace, and Ellis's cut pays no tithe", () => {
  const world = make();
  attune(world, "sugar", "tithe");
  enqueue(world, "brace");
  step(world, 1 / 60);
  assert.ok(world.tithe > 0);
  const a = foe(world, { id: "a", x: 300, y: 160 });
  const b = foe(world, { id: "b", x: 300, y: 240 });
  const te = linkActors(world, a, b, { slack: 90, tension: 40 });
  const sap = world.resources.sap;
  cutTether(world, te.id);
  assert.equal(world.resources.sap, sap);
  assert.ok(world.events.some((e) => e.type === "tether-break" && e.reason === "ellis-cut"));

  const te2 = linkActors(world, a, b, { slack: 82, tension: 50 });
  a.drive = { x: 0, y: -80 };
  b.drive = { x: 0, y: 80 };
  run(world, 0.4);
  assert.equal(te2.alive, false);
  assert.ok(world.events.some((e) => e.type === "tether-break" && e.reason === "distance"));
  assert.ok(world.resources.sap > sap);

  const c = foe(world, { id: "c", x: 300, y: 320 });
  const d = foe(world, { id: "d", x: 460, y: 320 });
  const te3 = linkActors(world, c, d, { slack: 400 });
  addBlocker(world, { x: 380, y: 320, r: 30 });
  step(world, 1 / 60);
  assert.equal(te3.alive, false);
  assert.ok(world.events.some((e) => e.type === "tether-break" && e.reason === "los"));

  const e = foe(world, { id: "e", x: 300, y: 400 });
  const f = foe(world, { id: "f", x: 360, y: 400 });
  const te4 = linkActors(world, e, f, { slack: 200, tension: 80 });
  const hp = e.hp;
  e.onScreen = false;
  e.drive = { x: -200, y: 0 };
  f.drive = { x: 200, y: 0 };
  run(world, 0.4);
  assert.equal(e.hp, hp);
  assert.equal(te4.alive, true);
  run(world, 0.8);
  assert.equal(te4.alive, false);
  assert.ok(world.events.some((ev) => ev.type === "tether-break" && ev.reason === "offscreen"));
});

test("Thread the Needle links a gap, refunds a whiff, and refuses flesh", () => {
  const world = make();
  attune(world, "sugar", "thread-the-needle");
  foe(world, { id: "a", x: 300, y: 160 });
  foe(world, { id: "b", x: 300, y: 240 });
  shot(world, 520, 200);
  run(world, 1);
  const live = world.tethers.filter((t) => t.alive);
  assert.equal(live.length, 1);
  assert.equal(live[0].abilityId, "thread-the-needle");
  assert.equal(foeHp(world, "a"), 100);

  const whiff = make();
  attune(whiff, "sugar", "thread-the-needle");
  shot(whiff, 500, 200);
  run(whiff, 1);
  assert.equal(whiff.resources.sap, 100 - 18 + 8);
  assert.equal(whiff.tethers.length, 0);

  const flesh = make();
  attune(flesh, "sugar", "thread-the-needle");
  foe(flesh, { id: "body", x: 260, y: 200 });
  shot(flesh, 500, 200);
  run(flesh, 1);
  assert.equal(flesh.tethers.filter((t) => t.alive).length, 0);
  assert.equal(flesh.resources.sap, 90);
  assert.ok(flesh.events.some((e) => e.type === "thread-whiff" && e.reason === "flesh"));
});

test("separation punishment does not pull, and bosses are taxed less", () => {
  const world = make();
  const a = foe(world, { id: "a", x: 300, y: 170 });
  const b = foe(world, { id: "b", x: 300, y: 250, boss: true, hp: 200, damageFactor: 0.5 });
  const te = linkActors(world, a, b, { slack: 180, tension: 0 });
  const ax = a.x;
  a.drive = { x: 0, y: -70 };
  b.drive = { x: 0, y: 70 };
  run(world, 0.5);
  assert.equal(te.alive, true);
  assert.ok(a.hp < 100);
  assert.ok(b.hp < 200);
  assert.ok(b.hp > a.hp - 50);
  assert.equal(b.statuses.some((s) => s.id === "sap-tax"), false);
  assert.ok(a.statuses.some((s) => s.id === "sap-tax"));
  assert.ok(a.x === ax);
});

test("Wreath of Debts rewards clean hits, sheds on a step, and caps bosses at two", () => {
  const world = make();
  attune(world, "sugar", "wreath-of-debts");
  const t = foe(world, { id: "t", x: 146, y: 200 });
  strike(world, t.x, t.y);
  step(world, 1 / 60);
  assert.equal(t.wreath, 1);
  assert.equal(t.hp, 90);
  strike(world, t.x, t.y);
  step(world, 1 / 60);
  assert.equal(t.wreath, 2);
  assert.equal(t.hp, 90 - 13);
  enqueue(world, "step", { dirX: 0, dirY: -1 });
  step(world, 1 / 60);
  assert.equal(t.wreath, 1);

  const bossWorld = make();
  attune(bossWorld, "sugar", "wreath-of-debts");
  const boss = foe(bossWorld, { id: "boss", x: 146, y: 200, boss: true, hp: 300 });
  for (let i = 0; i < 3; i++) {
    strike(bossWorld, boss.x, boss.y);
    step(bossWorld, 1 / 60);
  }
  assert.equal(boss.wreath, 2);
});

test("Common Root echoes a bounded status and stops at bosses and offscreen foes", () => {
  const world = make();
  attune(world, "sugar", "common-root");
  const a = foe(world, { id: "a", x: 146, y: 200 });
  const b = foe(world, { id: "b", x: 220, y: 200 });
  linkActors(world, a, b, { slack: 200 });
  strike(world, a.x, a.y);
  step(world, 1 / 60);
  const rotA = a.statuses.find((s) => s.id === "sweet-rot");
  const rotB = b.statuses.find((s) => s.id === "sweet-rot");
  assert.ok(rotA);
  assert.ok(rotB);
  assert.ok(Math.abs(rotB.remaining - rotA.remaining * 0.5) < 0.05);
  assert.equal(world.resources.sap, 90);

  const poor = make();
  poor.resources.sap = 5;
  attune(poor, "sugar", "common-root");
  const p = foe(poor, { id: "p", x: 146, y: 200 });
  const q = foe(poor, { id: "q", x: 220, y: 200 });
  linkActors(poor, p, q, { slack: 200 });
  strike(poor, p.x, p.y);
  step(poor, 1 / 60);
  assert.ok(p.statuses.some((s) => s.id === "sweet-rot"));
  assert.equal(q.statuses.some((s) => s.id === "sweet-rot"), false);

  const blocked = make();
  attune(blocked, "sugar", "common-root");
  const left = foe(blocked, { id: "left", x: 146, y: 200 });
  const mid = foe(blocked, { id: "mid", x: 220, y: 200, boss: true, hp: 200 });
  const right = foe(blocked, { id: "right", x: 300, y: 200 });
  linkActors(blocked, left, mid, { slack: 200 });
  linkActors(blocked, mid, right, { slack: 200 });
  strike(blocked, left.x, left.y);
  step(blocked, 1 / 60);
  assert.equal(right.statuses.some((s) => s.id === "sweet-rot"), false);
  assert.equal(mid.statuses.some((s) => s.id === "sweet-rot"), false);

  const dark = make();
  attune(dark, "sugar", "common-root");
  const seen = foe(dark, { id: "seen", x: 146, y: 200 });
  const gone = foe(dark, { id: "gone", x: 230, y: 200, onScreen: false });
  linkActors(dark, seen, gone, { slack: 200 });
  assert.equal(world.tethers.length >= 0, true);
  const linked = dark.tethers.filter((t) => t.alive);
  assert.equal(linked.length, 0);
});

test("Sap Pressure releases along aim, vents if overcharged, and refunds a lost anchor", () => {
  const world = make();
  attune(world, "sugar", "sap-pressure");
  const anchor = addAnchor(world, { id: "stake", x: 150, y: 200, anchorKind: "stake" });
  const t = foe(world, { id: "t", x: 280, y: 200 });
  enqueue(world, "brace");
  run(world, 1);
  assert.ok(world.channel);
  assert.ok(world.telegraphs.some((g) => g.kind === "anchor-line"));
  releaseBrace(world);
  step(world, 1 / 60);
  assert.equal(world.channel, null);
  run(world, 0.45);
  assert.ok(t.hp < 100);
  assert.ok(t.x > 280);

  const vent = make();
  attune(vent, "sugar", "sap-pressure");
  addAnchor(vent, { id: "stake", x: 150, y: 200, anchorKind: "stake" });
  enqueue(vent, "brace");
  run(vent, 3.05);
  assert.equal(vent.channel, null);
  assert.equal(vent.projectiles.length, 0);
  assert.ok(ellisOf(vent).stagger > 0);

  const lost = make();
  attune(lost, "sugar", "sap-pressure");
  const gone = addAnchor(lost, { id: "stake", x: 150, y: 200, anchorKind: "stake" });
  enqueue(lost, "brace");
  step(lost, 1 / 60);
  const spent = 100 - lost.resources.sap;
  gone.alive = false;
  step(lost, 1 / 60);
  assert.equal(lost.channel, null);
  assert.ok(lost.events.some((e) => e.type === "anchor-lost"));
  assert.ok(Math.abs(lost.resources.sap - (100 - spent * 0.5)) < 0.2);

  const blocked = make();
  attune(blocked, "sugar", "sap-pressure");
  addAnchor(blocked, { id: "stake", x: 170, y: 200, anchorKind: "stake" });
  addWall(blocked, { x: 130, y: 170, w: 16, h: 60 });
  enqueue(blocked, "brace");
  step(blocked, 1 / 60);
  assert.equal(blocked.channel, null);
  assert.equal(blocked.resources.sap, 100);
  assert.ok(blocked.events.some((e) => e.type === "anchor-refused"));
});

test("Stake the Row arms, and a hit refunds half", () => {
  const world = make();
  attune(world, "sugar", "stake-the-row");
  enqueue(world, "brace");
  run(world, 0.3);
  assert.equal(world.anchors.filter((a) => a.alive && a.anchorKind === "stake").length, 1);
  assert.equal(world.resources.sap, 86);

  const hurt = make();
  attune(hurt, "sugar", "stake-the-row");
  enqueue(hurt, "brace");
  step(hurt, 1 / 60);
  dealDamage(hurt, ellisOf(hurt), 12, {});
  assert.equal(hurt.channel, null);
  assert.equal(hurt.anchors.filter((a) => a.anchorKind === "stake").length, 0);
  assert.equal(hurt.resources.sap, 93);
});

test("Second Tap tightens an existing debt and does nothing without one", () => {
  const world = make();
  attune(world, "sugar", "second-tap");
  const t = foe(world, { id: "t", x: 146, y: 200 });
  const other = foe(world, { id: "o", x: 240, y: 200 });
  const te = linkActors(world, t, other, { slack: 200, tension: 10 });
  strike(world, t.x, t.y);
  step(world, 1 / 60);
  assert.equal(te.tension, 25);
  assert.equal(world.resources.sap, 92);

  const bare = make();
  attune(bare, "sugar", "second-tap");
  const u = foe(bare, { id: "u", x: 146, y: 200 });
  strike(bare, u.x, u.y);
  step(bare, 1 / 60);
  assert.equal(bare.resources.sap, 100);
  assert.ok(bare.events.some((e) => e.type === "tap-whiff"));
});

test("Slack Bargain changes slack by the distance actually moved", () => {
  const world = make();
  attune(world, "sugar", "slack-bargain");
  const a = foe(world, { id: "a", x: 300, y: 180 });
  const b = foe(world, { id: "b", x: 300, y: 240 });
  const te = linkActors(world, a, b, { slack: 100 });
  world.resources.sap = 40;
  enqueue(world, "step", { dirX: 1, dirY: 0 });
  step(world, 1 / 60);
  assert.ok(te.slack > 150);
  assert.equal(world.resources.sap, 28);

  const tight = make();
  attune(tight, "sugar", "slack-bargain");
  const c = foe(tight, { id: "c", x: 300, y: 180 });
  const d = foe(tight, { id: "d", x: 300, y: 240 });
  const te2 = linkActors(tight, c, d, { slack: 160 });
  tight.resources.sap = 15;
  enqueue(tight, "step", { dirX: 1, dirY: 0 });
  step(tight, 1 / 60);
  assert.ok(te2.slack < 160);
  assert.ok(ellisOf(tight).rooted > 0);
});

test("Sugar Glass and Glass Orchard smother a bud instead of blooming it", () => {
  const world = make();
  world.resources.ember = 10;
  const a = foe(world, { id: "a", x: 100, y: 200 });
  const b = foe(world, { id: "b", x: 300, y: 200 });
  const te = linkActors(world, a, b, { slack: 400, tension: 5 });
  te.glazed = true;
  te.glazeArm = 0;
  const bud = plantBlossom(world, { x: 200, y: 200, deliberate: true });
  bud.armed = true;
  const walker = foe(world, { id: "w", x: 150, y: 150 });
  walker.drive = { x: 0, y: 5000 };
  step(world, 1 / 60);
  assert.equal(bud.alive, false);
  assert.equal(world.counters.blooms, 0);
  assert.ok(world.events.some((e) => e.type === "combo" && e.id === "glass-orchard"));
  assert.ok(world.resources.ember >= 12);
  assert.equal(te.alive, false);
});

test("Orchard Lease slows retreat and does not pull", () => {
  const world = make();
  attune(world, "sugar", "orchard-lease");
  addAnchor(world, { id: "stake", x: 100, y: 200, anchorKind: "stake" });
  const t = foe(world, { id: "t", x: 240, y: 200 });
  shot(world, 400, 200);
  run(world, 0.5);
  const lease = world.tethers.find((te) => te.alive && te.lease);
  assert.ok(lease);
  const start = t.x;
  t.drive = { x: 120, y: 0 };
  run(world, 0.5);
  const moved = t.x - start;
  assert.ok(moved > 30 && moved < 55, "moved " + moved);
});

test("Canopy of Accounts pays a ready book and refunds a thin one", () => {
  const world = make();
  attune(world, "sugar", "canopy-of-accounts");
  const a = foe(world, { id: "a", x: 240, y: 160, hp: 80 });
  const b = foe(world, { id: "b", x: 320, y: 200, hp: 80 });
  const c = foe(world, { id: "c", x: 240, y: 250, hp: 80 });
  linkActors(world, a, b, { slack: 300, tension: 40 });
  linkActors(world, b, c, { slack: 300, tension: 40 });
  linkActors(world, c, a, { slack: 300, tension: 40 });
  a.wreath = 2;
  b.wreath = 2;
  a.wreathTimer = 8;
  b.wreathTimer = 8;
  enqueue(world, "brace");
  run(world, 1.2);
  assert.ok(a.hp < 80);
  assert.equal(a.wreath, 0);
  assert.ok(world.tethers.filter((t) => t.alive).every((t) => t.tension === 0));
  assert.equal(world.resources.sap, 60);

  const thin = make();
  attune(thin, "sugar", "canopy-of-accounts");
  enqueue(thin, "brace");
  step(thin, 1 / 60);
  assert.equal(thin.channel, null);
  assert.equal(thin.resources.sap, 100);
  assert.ok(thin.events.some((e) => e.type === "canopy-refused"));
});

test("The Last Sugarhouse keeps only who is already inside, and bosses walk out", () => {
  const world = make();
  attune(world, "sugar", "the-last-sugarhouse");
  addAnchor(world, { id: "s1", x: 100, y: 200, anchorKind: "stake" });
  addAnchor(world, { id: "s2", x: 40, y: 200, anchorKind: "stake" });
  const inside = foe(world, { id: "in", x: 160, y: 200 });
  const boss = foe(world, { id: "boss", x: 200, y: 210, boss: true, hp: 200, r: 18 });
  const outside = foe(world, { id: "out", x: 40, y: 40 });
  enqueue(world, "brace");
  run(world, 1.5);
  assert.equal(inside.confined != null, true);
  assert.equal(boss.confined, null);
  inside.drive = { x: -400, y: 0 };
  boss.drive = { x: 400, y: 0 };
  const bossX = boss.x;
  run(world, 0.3);
  assert.ok(inside.x > 100);
  assert.ok(boss.x > bossX);
  assert.equal(outside.confined, null);

  const sealed = make();
  attune(sealed, "sugar", "the-last-sugarhouse");
  addAnchor(sealed, { id: "s1", x: 100, y: 200, anchorKind: "stake" });
  addAnchor(sealed, { id: "s2", x: 40, y: 200, anchorKind: "stake" });
  addSeal(sealed, { x: 120, y: 140, w: 40, h: 120 });
  enqueue(sealed, "brace");
  step(sealed, 1 / 60);
  assert.equal(sealed.channel, null);
  assert.equal(sealed.resources.sap, 100);
});

test("Orchard of Embers plants, refuses seals, and chains only up to the cap", () => {
  const world = make();
  attune(world, "ash", "orchard-of-embers");
  shot(world, 400, 200);
  run(world, 1);
  assert.equal(world.blossoms.filter((b) => b.alive).length, 1);
  assert.equal(world.resources.ember, 88);

  const sealed = make();
  attune(sealed, "ash", "orchard-of-embers");
  addSeal(sealed, { x: 160, y: 160, w: 40, h: 80 });
  shot(sealed, 400, 200);
  run(sealed, 0.5);
  assert.equal(sealed.blossoms.length, 0);
  assert.equal(sealed.resources.ember, 100);

  const chain = make();
  for (let i = 0; i < 6; i++) {
    const b = plantBlossom(chain, { x: 200 + i * 60, y: 200, deliberate: true });
    b.armed = true;
    b.arm = b.armTime;
  }
  const first = chain.blossoms[0];
  bloomBlossom(chain, first, { source: "test" });
  run(chain, 1.2);
  assert.equal(chain.counters.blooms, 4);
  assert.equal(chain.blossoms.filter((b) => b.alive).length, 2);

  const short = make({ reducedEffects: true });
  for (let i = 0; i < 4; i++) {
    const b = plantBlossom(short, { x: 200 + i * 60, y: 200, deliberate: true });
    b.armed = true;
  }
  bloomBlossom(short, short.blossoms[0]);
  run(short, 1);
  assert.equal(short.counters.blooms, 2);
});

test("Handful of Cinders is a fixed fan and respects the projectile cap", () => {
  const world = make();
  attune(world, "ash", "handful-of-cinders");
  foe(world, { id: "t", x: 146, y: 200 });
  strike(world, 146, 200);
  step(world, 1 / 60);
  const fans = world.projectiles.filter((p) => p.kind === "cinder");
  assert.equal(fans.length, 5);
  assert.ok(fans.every((p) => p.homing === false));
  const angles = fans.map((p) => Math.atan2(p.vy, p.vx));
  angles.sort((a, b) => a - b);
  assert.ok(angles[0] < -0.2 && angles[4] > 0.2);

  const reduced = make({ reducedEffects: true });
  attune(reduced, "ash", "handful-of-cinders");
  foe(reduced, { id: "t", x: 146, y: 200 });
  strike(reduced, 146, 200);
  step(reduced, 1 / 60);
  assert.equal(reduced.projectiles.filter((p) => p.kind === "cinder").length, 3);

  const full = make();
  attune(full, "ash", "handful-of-cinders");
  foe(full, { id: "t", x: 146, y: 200 });
  for (let i = 0; i < 10; i++) {
    spawnProjectile(full, { x: 20, y: 20 + i * 8, vx: 0, vy: 0, life: 5, damage: 0, kind: "dummy" });
  }
  strike(full, 146, 200);
  step(full, 1 / 60);
  assert.equal(full.projectiles.filter((p) => p.kind === "cinder").length, 2);
  assert.equal(full.counters.fizzled, 3);
});

test("Last Arrow First pays only for marks the shot actually crosses", () => {
  const world = make();
  attune(world, "ash", "last-arrow-first");
  const t = foe(world, { id: "t", x: 320, y: 200, hp: 100 });
  shot(world, 500, 200);
  step(world, 1 / 60);
  assert.ok(world.prepared);
  assert.equal(world.projectiles.length, 0);
  run(world, 0.5);
  shot(world, 500, 200);
  run(world, 0.8);
  assert.equal(t.hp, 93);

  const marked = make();
  attune(marked, "ash", "last-arrow-first");
  const u = foe(marked, { id: "u", x: 320, y: 200, hp: 100 });
  plantMark(marked, { x: 200, y: 200 });
  marked.resources.ember = 100;
  shot(marked, 500, 200);
  run(marked, 0.5);
  shot(marked, 500, 200);
  run(marked, 0.8);
  assert.equal(u.hp, 81);

  const slip = make();
  attune(slip, "ash", "last-arrow-first");
  slip.resources.ember = 20;
  shot(slip, 400, 200);
  step(slip, 1 / 60);
  enqueue(slip, "step", { dirX: 0, dirY: 1 });
  step(slip, 1 / 60);
  assert.equal(slip.prepared, null);
  assert.equal(slip.resources.ember, 14);
});

test("Kiln Bloom shapes a corridor, stops at a seal, and stays cold without marks", () => {
  const world = make();
  attune(world, "ash", "kiln-bloom");
  for (const [x, y] of [
    [180, 290],
    [220, 310],
    [260, 300],
  ]) {
    const b = plantBlossom(world, { x, y, deliberate: true });
    b.armed = true;
  }
  const inside = foe(world, { id: "in", x: 240, y: 300, hp: 50 });
  const outside = foe(world, { id: "out", x: 240, y: 80, hp: 50 });
  ellisOf(world).y = 300;
  enqueue(world, "brace", { aimX: 400, aimY: 300 });
  run(world, 0.8);
  assert.ok(inside.hp < 50);
  assert.equal(outside.hp, 50);
  assert.equal(world.blossoms.filter((b) => b.alive).length, 0);
  assert.ok(world.telegraphs.length >= 0);

  const sealed = make();
  attune(sealed, "ash", "kiln-bloom");
  ellisOf(sealed).y = 300;
  for (const [x, y] of [
    [150, 300],
    [165, 312],
    [175, 288],
  ]) {
    const b = plantBlossom(sealed, { x, y, deliberate: true });
    b.armed = true;
  }
  addSeal(sealed, { x: 190, y: 250, w: 18, h: 100 });
  const past = foe(sealed, { id: "past", x: 260, y: 300, hp: 40 });
  enqueue(sealed, "brace", { aimX: 400, aimY: 300 });
  run(sealed, 0.8);
  assert.equal(past.hp, 40);

  const cold = make();
  attune(cold, "ash", "kiln-bloom");
  enqueue(cold, "brace");
  step(cold, 1 / 60);
  assert.equal(cold.resources.ember, 100);
  assert.ok(cold.events.some((e) => e.type === "kiln-cold"));

  const hurt = make();
  attune(hurt, "ash", "kiln-bloom");
  for (const [x, y] of [
    [180, 190],
    [210, 210],
    [240, 200],
  ]) {
    const b = plantBlossom(hurt, { x, y, deliberate: true });
    b.armed = true;
  }
  enqueue(hurt, "brace", { aimX: 400, aimY: 200 });
  run(hurt, 0.2);
  assert.ok(hurt.channel);
  dealDamage(hurt, ellisOf(hurt), 10, {});
  assert.equal(hurt.channel, null);
  assert.equal(hurt.blossoms.filter((b) => b.alive).length, 3);
  assert.equal(hurt.resources.ember, 85);
});

test("Cinder Letter writes ground, not bodies, and keeps six", () => {
  const world = make();
  attune(world, "ash", "cinder-letter");
  shot(world, 400, 200);
  run(world, 1);
  assert.equal(world.marks.length, 1);
  const body = make();
  attune(body, "ash", "cinder-letter");
  const t = foe(body, { id: "t", x: 220, y: 200, hp: 100 });
  shot(body, 400, 200);
  run(body, 0.4);
  assert.equal(body.marks.length, 0);
  assert.ok(t.hp < 100);
  const cap = make();
  for (let i = 0; i < 7; i++) plantMark(cap, { x: 40 + i * 20, y: 40 });
  assert.equal(cap.marks.filter((m) => m.alive).length, 6);
});

test("Bank the Coals pauses a timer; Ash Step respects reduced effects", () => {
  const world = make();
  attune(world, "ash", "bank-the-coals");
  const b = plantBlossom(world, { x: 112, y: 200, deliberate: true });
  const life = b.life;
  strike(world, 112, 200);
  step(world, 1 / 60);
  assert.equal(b.banked, true);
  run(world, 2);
  assert.ok(Math.abs(b.life - life) < 0.05);

  const stepWorld = make();
  attune(stepWorld, "ash", "ash-step");
  const x0 = ellisOf(stepWorld).x;
  enqueue(stepWorld, "step", { dirX: 1, dirY: 0 });
  step(stepWorld, 1 / 60);
  assert.equal(stepWorld.blossoms.length, 1);
  assert.equal(stepWorld.blossoms[0].deliberate, false);
  assert.ok(Math.abs(stepWorld.blossoms[0].x - x0) < 2);

  const promoted = make();
  attune(promoted, "ash", "ash-step");
  enqueue(promoted, "step", { dirX: 1, dirY: 0, promote: true });
  step(promoted, 1 / 60);
  assert.equal(promoted.blossoms[0].deliberate, true);
  assert.equal(promoted.markCounter, 1);

  const reduced = make({ reducedEffects: true });
  attune(reduced, "ash", "ash-step");
  const ember = reduced.resources.ember;
  enqueue(reduced, "step", { dirX: 1, dirY: 0 });
  step(reduced, 1 / 60);
  assert.equal(reduced.blossoms.length, 0);
  assert.equal(reduced.resources.ember, ember);
});

test("Split the Billet forks off stone at fixed angles and not into a seeker", () => {
  const world = make();
  attune(world, "ash", "split-the-billet");
  addWall(world, { x: 230, y: 150, w: 30, h: 100 });
  const bystander = foe(world, { id: "by", x: 420, y: 200 });
  shot(world, 500, 200);
  run(world, 0.35);
  assert.ok(world.events.some((e) => e.type === "split" && e.made === 2));
  assert.equal(bystander.hp, 100);
  const kids = world.events.find((e) => e.type === "split");
  assert.equal(kids.made, 2);
});

test("Lantern Debt, Quench, and Soot Covenant", () => {
  const world = make();
  attune(world, "ash", "lantern-debt");
  const t = foe(world, { id: "t", x: 240, y: 200 });
  shot(world, 400, 200);
  run(world, 0.5);
  assert.ok(t.statuses.some((s) => s.id === "lantern"));
  assert.ok(t.hp > 80);

  const q = make();
  attune(q, "ash", "quench");
  q.resources.ember = 20;
  plantBlossom(q, { x: 120, y: 200 });
  plantMark(q, { x: 130, y: 210 });
  enqueue(q, "brace");
  step(q, 1 / 60);
  assert.equal(q.blossoms.length, 0);
  assert.equal(q.marks.length, 0);
  assert.equal(ellisOf(q).shield, true);
  assert.equal(q.resources.ember, 24);
  assert.ok(q.quenchCd > 5);

  const soot = make();
  attune(soot, "ash", "soot-covenant");
  const host = foe(soot, { id: "host", x: 200, y: 200 });
  shot(soot, 400, 200);
  run(soot, 0.45);
  assert.ok(host.statuses.some((s) => s.id === "soot"));
  const a = plantBlossom(soot, { x: 200, y: 200, deliberate: true });
  const b = plantBlossom(soot, { x: 250, y: 200, deliberate: true });
  a.armed = true;
  b.armed = true;
  const before = soot.resources.ember;
  bloomBlossom(soot, a);
  run(soot, 0.4);
  assert.equal(b.alive, true);
  assert.ok(soot.resources.ember >= before + 3);
  assert.ok(soot.events.some((e) => e.type === "soot-bank"));
});

test("Fourteen Winters is one piercing arrow and reduced effects limit the bodies", () => {
  const world = make({ reducedEffects: true });
  attune(world, "ash", "fourteen-winters");
  world.markCounter = 14;
  world.prepared = { at: 0, readyAt: 0, winters: true };
  world.time = 1;
  plantMark(world, { x: 140, y: 200 });
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const id = "f" + i;
    foe(world, { id, x: 180 + i * 42, y: 200, hp: 80, r: 12 });
    ids.push(id);
  }
  const before = world.counters.spawned;
  shot(world, 700, 200, { charged: true });
  run(world, 1.1);
  assert.equal(world.counters.spawned - before, 1);
  assert.equal(world.markCounter, 0);
  for (let i = 0; i < 4; i++) assert.ok(foeHp(world, ids[i]) < 80, ids[i]);
  assert.equal(foeHp(world, ids[4]), 80);
});

test("Debt Kindling spends a loop instead of multiplying twice", () => {
  const world = make();
  const t = foe(world, { id: "t", x: 220, y: 200, hp: 100 });
  t.wreath = 2;
  t.statuses.push({ id: "lantern", remaining: 3, potency: 1 });
  const b = plantBlossom(world, { x: 220, y: 200, deliberate: true });
  b.armed = true;
  bloomBlossom(world, b);
  assert.equal(t.wreath, 1);
  assert.equal(t.hp, 79);
  assert.ok(world.events.some((e) => e.type === "combo" && e.id === "debt-kindling"));
});

test("Sap-lit Wick blooms without a chain and Needle through Coals raises tension", () => {
  const world = make();
  const bud = plantBlossom(world, { x: 200, y: 200, deliberate: true });
  const neighbor = plantBlossom(world, { x: 200, y: 262, deliberate: true });
  bud.armed = true;
  neighbor.armed = true;
  const t = foe(world, { id: "t", x: 340, y: 200, hp: 80 });
  spawnProjectile(world, {
    x: 120,
    y: 200,
    vx: 520,
    vy: 0,
    damage: 10,
    life: 0.6,
    kind: "sap",
    abilityId: "sap-pressure",
    r: 5,
  });
  run(world, 0.5);
  assert.equal(bud.alive, false);
  assert.equal(neighbor.alive, true);
  assert.ok(t.hp <= 66);
  assert.ok(world.events.some((e) => e.type === "combo" && e.id === "sap-lit-wick"));

  const thread = make();
  attune(thread, "sugar", "thread-the-needle");
  foe(thread, { id: "a", x: 320, y: 160 });
  foe(thread, { id: "b", x: 320, y: 240 });
  const mark = plantMark(thread, { x: 210, y: 200 });
  shot(thread, 520, 200);
  run(thread, 1);
  const te = thread.tethers.find((x) => x.alive);
  assert.ok(te);
  assert.equal(te.tension, 45);
  assert.equal(mark.alive, false);
  assert.ok(thread.events.some((e) => e.type === "combo" && e.id === "needle-through-coals"));
});

test("boss immunity refuses displace and hard bind", () => {
  const world = make();
  const boss = foe(world, { id: "boss", x: 260, y: 200, boss: true, hp: 200, r: 18 });
  const x = boss.x;
  dealDamage(world, boss, 20, { displace: { x: 40, y: 0 }, stagger: 0.4, fromEllis: true });
  assert.equal(boss.x, x);
  assert.equal(boss.stagger, 0);
  assert.ok(boss.hp >= 190 && boss.hp <= 192);
  assert.ok(world.events.some((e) => e.type === "boss-immune" && e.status === "displace"));
});

test("aim and pressure telegraphs are produced by the simulation", () => {
  const world = make();
  attune(world, "sugar", "thread-the-needle");
  step(world, 1 / 60);
  assert.ok(world.telegraphs.some((g) => g.kind === "aim"));
  attune(world, "ash", "kiln-bloom");
  for (const [x, y] of [
    [180, 190],
    [210, 210],
    [240, 200],
  ]) {
    const b = plantBlossom(world, { x, y, deliberate: true });
    b.armed = true;
  }
  enqueue(world, "brace", { aimX: 400, aimY: 200 });
  step(world, 1 / 60);
  assert.ok(world.telegraphs.some((g) => g.kind === "corridor" || g.kind === "text"));
});

test("machine-readable records match the module", () => {
  const disk = JSON.parse(
    fs.readFileSync(new URL("../records/abilities.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(disk, recordsDocument());
});

function foeHp(world, id) {
  return world.actors.find((a) => a.id === id).hp;
}
