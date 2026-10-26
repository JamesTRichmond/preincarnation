import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RELIC_BY_ID } from "./items.ts";
import { INCARNATIONS } from "./content.ts";
import {
  FORM_TO_INCARNATION,
  INTEGRATION,
  TOOL_TO_RELIC,
  runAllContracts,
} from "./transformations/index.ts";

describe("creek transformation contracts", () => {
  it("passes the room, including collision, death, and duplication", () => {
    const report = runAllContracts();
    const bad = report.results.filter((row) => !row.ok);
    assert.equal(
      bad.map((row) => `${row.group}:${row.id} — ${row.detail}`).join("\n"),
      "",
      `${report.passed} passed, ${report.failed} failed`,
    );
    assert.equal(report.failed, 0);
    assert.ok(report.passed > 0);
  });

  it("names live relics and incarnations without claiming the overworld calls the bench", () => {
    for (const relicId of Object.values(TOOL_TO_RELIC)) {
      assert.ok(RELIC_BY_ID[relicId], relicId);
    }
    for (const incarnationId of Object.values(FORM_TO_INCARNATION)) {
      assert.ok(INCARNATIONS[incarnationId], incarnationId);
    }
    assert.equal(FORM_TO_INCARNATION.god, "embryo");
    assert.equal(TOOL_TO_RELIC.sugar, "hookshot");
    assert.equal(TOOL_TO_RELIC.glass, "mirror");
    assert.equal(TOOL_TO_RELIC.keg, "bombs");
    assert.equal(INTEGRATION.runtimeFound, true);
    assert.equal(INTEGRATION.wiredIntoOverworld, false);
  });
});
