import assert from "node:assert/strict";
import test from "node:test";
import { renderCeoStatus } from "../../scripts/write-ceo-status.mjs";

test("status names the tip, the save version, and the vision", () => {
  const body = renderCeoStatus({ sha: "abc1234", saveVersion: 9, when: "2026-10-27T04:20:00.000Z" });
  assert.match(body, /`abc1234`/);
  assert.match(body, /SAVE_VERSION \| 9/);
  assert.match(body, /Marble Vein/);
  assert.match(body, /fourteen winters/);
  assert.match(body, /No accounts/);
  assert.match(body, /ops\/DENSITY.md/);
});
