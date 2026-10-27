import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOG } from "../src/catalog.ts";
import { MOTIFS } from "../src/motifs.ts";
import { runAllBehaviorRecords, runIntegrity } from "../src/records.ts";
import { catalogId } from "../src/types.ts";

test("catalog is eighty distinct household objects", () => {
  assert.equal(CATALOG.length, 80);
  const ids = CATALOG.map((item) => item.id);
  assert.deepEqual(
    ids,
    Array.from({ length: 80 }, (_, index) => catalogId(index + 1)),
  );
  assert.equal(new Set(ids).size, 80);
  assert.equal(new Set(CATALOG.map((item) => item.name)).size, 80);
  assert.equal(new Set(CATALOG.map((item) => item.summary)).size, 80);
  for (const item of CATALOG) {
    assert.notEqual(item.history.settlement, item.history.homestead);
    assert.notEqual(item.history.homestead, item.history.memory);
  }
  const kinds = new Set(CATALOG.map((item) => item.interaction));
  assert.ok(kinds.has("illumination"));
  assert.ok(kinds.has("sound"));
  assert.ok(kinds.has("organization"));
  assert.ok(kinds.has("serve"));
  assert.ok(kinds.has("history"));
  assert.ok(kinds.has("craft"));
  assert.ok(kinds.has("visitor"));
  const trays = CATALOG.filter((item) => item.category === "tray").map((item) =>
    item.foods?.join(),
  );
  assert.equal(new Set(trays).size, trays.length);
  const motifs = CATALOG.map((item) => item.motif).filter((motif): motif is string =>
    Boolean(motif),
  );
  for (const motif of motifs) assert.ok(MOTIFS[motif], motif);
  assert.equal(new Set(motifs).size, motifs.length);
});

test("every object runs its behavior record", () => {
  const traces = runAllBehaviorRecords();
  const failed = traces.filter((trace) => trace.problems.length);
  assert.deepEqual(
    failed.map((trace) => `${trace.id} ${trace.name}: ${trace.problems.join(", ")}`),
    [],
  );
});

test("room integrity: exits, controls, supports, eras, duplicates, save", () => {
  assert.deepEqual(runIntegrity(), []);
});
