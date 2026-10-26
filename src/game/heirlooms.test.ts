import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HEIRLOOM_VISITS,
  heirloomBlocksVein,
  heirloomDialogue,
  stepHeirloom,
  type HeirloomPhase,
} from "./heirlooms.ts";

function walk(id: string, actions: string[]) {
  let phase: Record<string, HeirloomPhase> = {};
  let held: string[] = [];
  let deed = "";
  for (const action of actions) {
    const step = stepHeirloom(phase, held, id + ":" + action);
    phase = step.phase;
    held = step.held;
    deed = step.deed || deed;
  }
  return { phase, held, deed };
}

describe("heirloom visits", () => {
  it("offers five optional places and never blocks the Vein", () => {
    assert.equal(HEIRLOOM_VISITS.length, 5);
    assert.equal(heirloomBlocksVein(), false);
    assert.equal(new Set(HEIRLOOM_VISITS.map((visit) => visit.id)).size, 5);
  });

  it("looks, asks, and keeps one ordinary thing", () => {
    const done = walk("pell", ["look", "ask", "take"]);
    assert.equal(done.phase.pell, "closed");
    assert.deepEqual(done.held, ["pell"]);
    assert.match(done.deed, /Pell dock/);
    const again = stepHeirloom(done.phase, done.held, "pell:take");
    assert.deepEqual(again.held, ["pell"]);
  });

  it("lets a missed visit come back smaller", () => {
    const left = walk("ames", ["leave"]);
    assert.equal(left.phase.ames, "left");
    assert.deepEqual(left.held, []);
    const back = stepHeirloom(left.phase, left.held, "ames:later");
    assert.equal(back.phase.ames, "closed");
    assert.deepEqual(back.held, ["ames"]);
    assert.match(back.node?.text ?? "", /stick/i);
  });

  it("will not hand over the thing before it has been spoken for", () => {
    const early = stepHeirloom({}, [], "noyes:take");
    assert.deepEqual(early.held, []);
    assert.equal(early.phase.noyes, undefined);
  });

  it("opens on the person, not a ledger", () => {
    const node = heirloomDialogue({}, [], "whitcomb");
    assert.match(node?.text ?? "", /Whiting/);
    assert.match(node?.text ?? "", /proposed/);
    assert.equal(node?.choices?.[0]?.label, "Look at what they kept");
  });
});
