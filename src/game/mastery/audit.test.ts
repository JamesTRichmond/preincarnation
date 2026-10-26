import assert from "node:assert/strict";
import test from "node:test";
import { runAudit } from "./audit.ts";

test("eighty mastery objects resolve against existing actions", () => {
  const report = runAudit();
  assert.equal(report.passed, true, report.failures.slice(0, 40).join("\n"));
});
