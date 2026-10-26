import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SAVE_VERSION } from "./types.ts";
import {
  MASTERY_OBJECTS,
  beginAction,
  closedWorld,
  objectById,
  resolveAction,
  runAudit,
  stripAndFinish,
  worldFor,
} from "./mastery/index.ts";

describe("mastery objects", () => {
  it("holds all eighty against tools that already exist", () => {
    const report = runAudit();
    assert.equal(report.passed, true, report.failures.slice(0, 8).join("\n"));
    assert.equal(MASTERY_OBJECTS.length, 80);
    assert.ok(MASTERY_OBJECTS.every((item) => item.disciplineAbilityId === null));
  });

  it("does not dig a grave when the shovel is not in hand", () => {
    const bit = objectById("loot.expansion.mastery.003");
    assert.ok(bit);
    const world = closedWorld("action.dig");
    const bare = resolveAction("action.dig", [], world);
    const worn = resolveAction("action.dig", [bit], world);
    assert.equal(bare.ok && worn.ok, true);
    if (!bare.ok || !worn.ok) return;
    assert.equal(bare.profile.blocked, true);
    assert.equal(worn.profile.blocked, true);
    assert.equal(worn.profile.radius, bare.profile.radius);
  });

  it("keeps the press and drops the fitting if it is pulled off mid-dig", () => {
    const bit = objectById("loot.expansion.mastery.003");
    assert.ok(bit);
    const world = worldFor(bit);
    const bare = resolveAction("action.dig", [], world);
    const begun = beginAction("action.dig", [bit], world);
    assert.equal(begun.phase, "winding");
    if (begun.phase !== "winding") return;
    const finished = stripAndFinish(begun.pending, bit.id);
    assert.equal(finished.result.ok, true);
    if (!finished.result.ok || !bare.ok) return;
    assert.equal(finished.result.profile.radius, bare.profile.radius);
    assert.equal(finished.result.profile.windup, bare.profile.windup);
  });

  it("is not written into the county save", () => {
    assert.equal(SAVE_VERSION, 8);
  });
});
