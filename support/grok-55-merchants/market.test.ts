import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runSimulations } from "./simulate.ts";
import { authoringProblems, commit, createInitialState, quote } from "./engine.ts";
import { STALLS } from "./stalls.ts";

describe("county book", () => {
  it("authors a closed economy", () => {
    const problems = authoringProblems();
    assert.deepEqual(problems, []);
  });

  it("passes the ledger simulations", () => {
    const checks = runSimulations();
    const failed = checks.filter((row) => !row.pass);
    assert.deepEqual(
      failed.map((row) => `${row.id}: ${row.detail}`),
      [],
    );
    assert.equal(checks.length >= 12, true);
  });

  it("gives every stall a successor, a place, and a posted specialty", () => {
    assert.equal(STALLS.length, 12);
    for (const stall of STALLS) {
      assert.ok(stall.place.length > 0);
      assert.ok(stall.faces.length >= 2);
      assert.ok(stall.services.length >= 1);
      assert.ok(stall.barters.length >= 1);
      assert.ok(stall.stock.length >= 1);
      assert.ok(stall.replenish.length > 20);
      assert.ok(stall.faces.every((face) => face.greet && face.seeing && face.refuse));
    }
  });

  it("does not move marks when a quote is refused", () => {
    const state = createInitialState();
    const seen = quote(state, { kind: "sell", stallId: "quill", instanceId: "p-deed", qty: 1 });
    assert.equal(seen.ok, false);
    const result = commit(state, { kind: "sell", stallId: "quill", instanceId: "p-deed", qty: 1 });
    assert.equal(result.ok, false);
    assert.equal(result.state, state);
  });
});
