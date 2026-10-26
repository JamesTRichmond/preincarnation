import assert from "node:assert/strict";
import test from "node:test";
import { runValidation, validationReport } from "./validate.ts";

test("provision ledger", () => {
  const checks = runValidation();
  assert.equal(checks.every((c) => c.pass), true, validationReport(checks));
});
