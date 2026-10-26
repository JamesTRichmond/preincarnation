import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BINDINGS } from "../../support/grok-69-masterworks/bindings.ts";
import { duplicateHits, MASTERWORKS } from "../../support/grok-69-masterworks/items.ts";
import { matrixFindings, runMatrix } from "../../support/grok-69-masterworks/matrix.ts";
import { runAllProofs } from "../../support/grok-69-masterworks/proofs.ts";

describe("masterwork pack", () => {
  it("stays eighty named pieces and does not call a mastery API", () => {
    assert.equal(MASTERWORKS.length, 80);
    assert.deepEqual(duplicateHits(), []);
    const mastery = BINDINGS.filter((b) => b.id.startsWith("mastery."));
    assert.ok(mastery.length >= 12);
    assert.ok(mastery.every((b) => b.status === "unavailable"));
  });

  it("passes a specific effect for every piece, and the old kit is still there", () => {
    const rows = runAllProofs();
    const bad = rows.filter((r) => !r.ok);
    assert.deepEqual(
      bad.map((r) => `${r.n} ${r.error}`),
      [],
    );
    assert.equal(rows.length, 81);
  });

  it("does not crown one kit", () => {
    const found = matrixFindings(runMatrix());
    assert.equal(found.kitWinsAll, false);
    assert.equal(found.ironWins, true);
    assert.equal(found.bootsWin, true);
    assert.equal(found.rifleWins, true);
  });
});
