import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

type Timing = { damage?: boolean; holdMs?: number };
type Actor = {
  id: string;
  tier: string;
  attackFacing: string;
  tellChannels: string[];
  timing: Record<string, Timing>;
};
type Book = {
  canon: {
    claimedComplete: boolean;
    ordinaryDrawn: number;
    bossesDrawn: number;
    unnamedUnstartedOrdinary: number;
    unnamedUnstartedBosses: number;
  };
  actors: Actor[];
};

const book = JSON.parse(
  readFileSync(new URL("../../support/grok-14-enemy-presentation/www/manifest.json", import.meta.url), "utf8"),
) as Book;

describe("enemy plates", () => {
  it("does not claim the unnamed roster", () => {
    assert.equal(book.canon.claimedComplete, false);
    assert.equal(book.canon.ordinaryDrawn, 12);
    assert.equal(book.canon.bossesDrawn, 4);
    assert.equal(book.actors.length, 16);
    assert.equal(book.canon.unnamedUnstartedOrdinary, 28);
    assert.equal(book.canon.unnamedUnstartedBosses, 12);
  });

  it("marks damage only on the strike", () => {
    for (const actor of book.actors) {
      assert.equal(actor.timing.attack?.damage, true, actor.id);
      for (const state of ["idle", "move", "anticipate", "recover", "hurt", "defeat"]) {
        assert.notEqual(actor.timing[state]?.damage, true, `${actor.id} ${state}`);
      }
    }
  });

  it("keeps the Sentinel tell readable without color", () => {
    const sentinel = book.actors.find((actor) => actor.id === "the-sentinel");
    assert.ok(sentinel);
    assert.equal(sentinel.attackFacing, "east");
    assert.equal(sentinel.timing.anticipate?.holdMs, 980);
    assert.ok(sentinel.tellChannels.includes("shape"));
    assert.ok(sentinel.tellChannels.includes("ground-mark"));
  });
});
