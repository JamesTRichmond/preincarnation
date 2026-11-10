import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { auditLoose, buildReport, measureFocused, verifyItem } from "./audit.ts";
import { TARGET_DEFINITIONS, catalog } from "./catalog.ts";
import { scanPacks } from "./scanPacks.ts";

test("candidate catalog is 768 definitions", () => {
  assert.equal(catalog.items.length, TARGET_DEFINITIONS);
  const seen = new Set(catalog.items.map((item) => item.id));
  assert.equal(seen.size, TARGET_DEFINITIONS);
});

test("external packs are absent and the broken fixture is detected", () => {
  const scan = scanPacks();
  assert.equal(scan.importedItems, 0);
  assert.equal(scan.missingPacks.length, 8);
  const fixture = JSON.parse(
    readFileSync(new URL("./fixtures/broken-pack.json", import.meta.url), "utf8"),
  ) as { items: unknown[] };
  const failures = fixture.items.flatMap((item) => auditLoose(item));
  for (const id of [
    "fix.one-use",
    "fix.no-effect",
    "fix.unread",
    "fix.not-a-card",
    "fix.unplaced",
  ]) {
    assert.ok(
      failures.some((failure) => failure.itemId === id),
      `fixture ${id} was not rejected`,
    );
  }
  const checks = new Set(failures.map((failure) => failure.check));
  for (const check of ["two-uses", "effect", "evidence", "handler", "deck", "place", "source"]) {
    assert.ok(checks.has(check), `detector missed ${check}`);
  }
});

test("sample of each category verifies", () => {
  for (const id of [
    "obj.nail.0",
    "obj.tin.0",
    "obj.key.14",
    "eq.hands.0",
    "eq.hands.1",
    "rel.0",
    "rel.12",
    "rel.24",
    "pro.0",
    "pro.1",
    "card.stone.1.0",
    "food.raw.0",
    "food.cooked.0",
    "dec.1",
    "dec.0",
    "evi.0",
    "evi.48",
  ]) {
    const result = verifyItem(catalog.byId.get(id)!);
    assert.equal(
      result.failures.length,
      0,
      `${id} ${result.failures.map((f) => `${f.check}: ${f.detail}`).join(" | ")}`,
    );
  }
});

test("cross-system cases, economy, and coverage counts", () => {
  const scan = scanPacks();
  const report = buildReport(scan);
  assert.ok(report.cases.total >= 60, `only ${report.cases.total} cases`);
  assert.equal(report.cases.failed, 0, JSON.stringify(report.failedCases, null, 2));
  assert.equal(report.counts.authored, 768);
  assert.equal(report.counts.implemented, 768);
  assert.equal(report.counts.verified, 768);
  assert.equal(report.counts.demonstrated, 768);
  assert.equal(report.economy.ok, true, report.economy.detail);
  assert.equal(report.friction.integratedOk, true, report.friction.integratedDetail);
  assert.equal(report.friction.runs[0]?.noEffectActions, 0);
  assert.equal(report.friction.runs[1]?.noEffectActions, 0);
  const gate = report.friction.runs[1]?.pickupToUse[0];
  assert.ok(gate);
  assert.ok(gate.between !== null && gate.between >= 1, "inspect gate did not add an action");
  assert.ok(gate.inspects >= 1);
  assert.equal(report.friction.discovery.noEffectActions, 0);
  assert.ok(report.friction.discovery.actionsFromReadToCache >= 2);
  assert.equal(report.importedItems, 0);
  assert.equal(report.missingPacks.length, 8);
});

test("focused runs stay free of no-effect clicks", () => {
  const focus = measureFocused();
  assert.equal(focus.integratedOk, true, focus.integratedDetail);
  assert.equal(focus.discovery.cluesReadBeforeFind, 1);
});
