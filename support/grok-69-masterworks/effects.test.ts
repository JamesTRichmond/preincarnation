import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { BINDINGS } from "./bindings.ts";
import { duplicateHits, lootId, MASTERWORKS } from "./items.ts";
import { legacySlashDamage } from "./legacy.ts";
import { matrixFindings, runMatrix } from "./matrix.ts";
import { legacyStillThere, runAllProofs } from "./proofs.ts";
import * as simApi from "./sim.ts";
import { beginAttack, createSim, equip, interrupt, strikeNow } from "./sim.ts";

test("catalog has 80 distinct masterworks and no legacy name collision", () => {
  assert.equal(MASTERWORKS.length, 80);
  const ids = MASTERWORKS.map((i) => i.id);
  assert.deepEqual(ids, Array.from({ length: 80 }, (_, i) => lootId(i + 1)));
  assert.equal(new Set(MASTERWORKS.map((i) => i.name)).size, 80);
  const slots = { weapon: 0, wearable: 0, trinket: 0, utility: 0 };
  for (const item of MASTERWORKS) slots[item.slot] += 1;
  assert.deepEqual(slots, { weapon: 20, wearable: 20, trinket: 20, utility: 20 });
  assert.deepEqual(duplicateHits(), []);
  assert.equal(MASTERWORKS.filter((i) => i.demo).length, 16);
  for (const item of MASTERWORKS) {
    assert.ok(item.behavior.length > 20, item.name);
    assert.ok(item.tradeoff.length > 8, item.name);
    assert.ok(item.discovery.length > 8, item.name);
  }
});

test("mastery bindings are explicit and never available", () => {
  const mastery = BINDINGS.filter((b) => b.id.startsWith("mastery."));
  assert.ok(mastery.length >= 12);
  assert.ok(mastery.every((b) => b.status === "unavailable"));
  assert.equal(BINDINGS.find((b) => b.id === "rules.slashDamage")?.status, "available");
  assert.equal(BINDINGS.find((b) => b.id === "relic.lantern")?.status, "available");
  assert.equal(BINDINGS.find((b) => b.id === "prop.pot")?.status, "available");
});

test("there is no repair operation", () => {
  assert.equal("repair" in simApi, false);
  assert.equal("repairPiece" in simApi, false);
});

test("specific effect proofs for all eighty, plus the legacy kit", () => {
  const rows = runAllProofs();
  const bad = rows.filter((r) => !r.ok);
  assert.deepEqual(
    bad.map((r) => `${r.n} ${r.error}`),
    [],
  );
  assert.equal(rows.length, 81);
  legacyStillThere();
});

test("swapping interrupts a windup and does not finish it", () => {
  const sim = createSim();
  equip(sim, "weapon", lootId(14));
  beginAttack(sim);
  assert.equal(sim.player.attack?.phase, "windup");
  simApi.swapWeapon(sim);
  assert.equal(sim.player.attack, null);
  const hp = simApi.foeById(sim).hp;
  simApi.advance(sim, 1);
  assert.equal(simApi.foeById(sim).hp, hp);
});

test("form change, resource reset, and modification keep identity", () => {
  const sim = createSim();
  const blade = equip(sim, "weapon", lootId(1))!;
  const ident = blade.identity;
  simApi.cycleForm(sim, "weapon");
  assert.equal(blade.form, "narrow");
  assert.equal(blade.identity, ident);
  simApi.modifyPiece(sim, "weapon", "wider-margin");
  const charm = equip(sim, "trinket", lootId(41))!;
  simApi.placeFoe(sim, "foe", 7, 4, 20);
  strikeNow(sim);
  assert.ok(sim.stored && sim.stored.identity === charm.identity);
  const stored = sim.stored.amount;
  simApi.writeResource(sim, blade.identity, "oil", 0);
  simApi.resetResources(sim);
  assert.equal(sim.stored?.amount, stored);
  assert.equal(blade.identity, ident);
  assert.equal(blade.mods.length, 1);
  simApi.restorePiece(sim, "weapon");
  assert.equal(blade.identity, ident);
  assert.equal(blade.mods.length, 0);
  assert.equal(blade.form, "open");
  assert.equal(blade.restorations, 1);
});

test("damage multiplication matches the legacy slash, then the seal", () => {
  const base = legacySlashDamage({
    weaponDmg: 1,
    incarnationDamage: 1,
    edge: 2,
    tropoverse: true,
    flawId: "the_blade",
  });
  assert.ok(Math.abs(base - 1.8768) < 1e-6);
  const sim = createSim();
  sim.edge = 2;
  sim.tropoverse = true;
  sim.flawId = "the_blade";
  equip(sim, "utility", lootId(79));
  simApi.placeFoe(sim, "foe", 6, 4, 30);
  strikeNow(sim);
  const first = sim.log.filter((e) => e.t === "damage").reduce((s, e) => s + (e.t === "damage" ? e.amount : 0), 0);
  assert.ok(Math.abs(first - base * 1.5) < 1e-4);
  sim.log = [];
  strikeNow(sim);
  const second = sim.log.filter((e) => e.t === "damage").reduce((s, e) => s + (e.t === "damage" ? e.amount : 0), 0);
  assert.ok(Math.abs(second - base * 0.75) < 1e-4);
  beginAttack(sim);
  interrupt(sim);
});

test("compatibility matrix has no universal best set", () => {
  const rows = runMatrix();
  const found = matrixFindings(rows);
  assert.ok(found.winners.length >= 4, found.winners.join(", "));
  assert.equal(found.ironWins, true);
  assert.equal(found.bootsWin, true);
  assert.equal(found.rifleWins, true);
  assert.equal(found.kitWinsAll, false);
  assert.equal(found.foeStillThere, true);
  const dir = new URL("./reports/", import.meta.url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(new URL("matrix.json", dir), JSON.stringify({ rows, found }, null, 2));
  const proofs = runAllProofs();
  fs.writeFileSync(
    new URL("test-output.txt", dir),
    [
      `proofs ${proofs.filter((p) => p.ok).length}/${proofs.length}`,
      ...proofs.map((p) => `${p.ok ? "ok" : "FAIL"} ${String(p.n).padStart(3, "0")} ${p.name}${p.error ? " " + p.error : ""}`),
      "",
      ...rows.map((r) => `${r.winner} — ${r.situation}`),
      "",
    ].join("\n"),
  );
});
