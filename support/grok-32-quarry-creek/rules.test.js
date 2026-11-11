import assert from "node:assert/strict";
import test from "node:test";
import { runSelfCheck } from "./rules.js";

test("quarry and creek proofs", () => {
  const results = runSelfCheck();
  const failed = results.filter((result) => !result.pass);
  assert.deepEqual(
    failed,
    [],
    failed.map((result) => `${result.id}: ${result.detail}`).join("\n"),
  );
  assert.equal(results.length, 13);
});
