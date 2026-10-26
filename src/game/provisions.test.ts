import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NODES } from "../../support/grok-50-provisions/catalog.ts";
import { die, gather, initialState } from "../../support/grok-50-provisions/engine.ts";
import { runValidation } from "../../support/grok-50-provisions/validate.ts";
import { SAVE_KEY } from "./types.ts";

describe("provisions", () => {
  it("holds the ledger and does not use the chapter save", () => {
    const failed = runValidation()
      .filter((check) => !check.pass)
      .map((check) => check.name);
    assert.deepEqual(failed, []);
    assert.notEqual("preincarnation.provisions.v1", SAVE_KEY);
  });

  it("a fall is fourteen years and leaves the cellar", () => {
    const start = initialState();
    const cellar = start.bins.cellar.length;
    const fallen = die(start, "Middlebury Green");
    assert.equal(fallen.year, start.year + 14);
    assert.equal(fallen.life, start.life + 1);
    assert.equal(fallen.bins.pouch.length, 0);
    assert.equal(fallen.bins.creel.length, 0);
    assert.equal(fallen.bins.cellar.length, cellar);
    assert.equal(fallen.bins.tin.length, start.bins.tin.length);
    assert.equal(fallen.effects.length, 0);
    assert.equal(fallen.graves[0]?.place, "Middlebury Green");
  });

  it("spring fiddleheads can be picked", () => {
    const node = NODES.find((n) => n.place === "New Haven riverbank" && n.provisionId === "loot.provision.017");
    assert.ok(node);
    const picked = gather(initialState(), node.id);
    assert.equal(picked.ok, true);
    assert.match(picked.note, /Ostrich fiddlehead/);
  });
});
