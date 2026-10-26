import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CARDS_BY_ID } from "./knowledge/cards.ts";
import { FEATURED } from "./knowledge/collection.ts";
import { createMatch, legalReason, playCard } from "./knowledge/fourteen-winters.ts";
import { PIECES } from "./knowledge/music.ts";
import { PUZZLES } from "./knowledge/puzzles.ts";
import { schedule } from "./knowledge/scheduler.ts";
import { validatePath } from "./knowledge/sugar-line.ts";

describe("knowledge satchel", () => {
  it("schedules the first tune and accepts the authored sugar line", () => {
    const scheduled = schedule(PIECES[0]);
    assert.equal(scheduled.ok, true);
    if (!scheduled.ok) return;
    assert.ok(scheduled.notes.length > 0);
    const board = PUZZLES[0];
    assert.deepEqual(validatePath(board.rows, board.solution, true), []);
    assert.ok(validatePath(board.rows, board.trap, true).length > 0);
  });

  it("plays Sap Ladder at dawn and leaves the phase", () => {
    const match = createMatch({ cardIds: FEATURED.cards, winters: 3, seed: 1, shuffle: false });
    const card = CARDS_BY_ID.get(FEATURED.cards[0]);
    assert.ok(card);
    assert.equal(legalReason(match, card), null);
    const played = playCard(match, card);
    assert.equal(played.ok, true);
    if (!played.ok) return;
    assert.equal(played.state.phase, "day");
    assert.equal(played.state.shelter, 2);
  });
});
